# GraphQL + REST API Cache Worker

Cloudflare Worker that provides a caching layer for Payload CMS APIs using Cloudflare KV storage. Supports both v1 GraphQL and v2 REST APIs for parallel operation during migration.

## Purpose

Jekyll builds read CMS content from this cache instead of hitting the CMS directly. This enables:
- Faster builds (KV reads are faster than API queries)
- Decoupled builds (site can build even if CMS is temporarily unavailable)
- Future Astro migration (cache can serve multiple consumers)
- Parallel v1/v2 API operation during migration period

## Architecture

```
[Payload CMS] <-- (Tailscale VPN) -- [GitHub Actions: cache refresh]
                                              |
                                              v
                                      [This Worker]
                                       (v1 + v2)
                                              |
                                              v
                                      [Cloudflare KV]
                                              |
                                              v
                                      [Jekyll Build]
```

Cache refresh happens in GitHub Actions (which can connect to the Tailscale-protected CMS), not in the worker itself.

## Endpoints

### v1 GraphQL Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/graphql` | POST | API Key | GraphQL queries (matches Payload CMS path) |
| `/refresh/:collection` | POST | API Key | Write v1 collection data to cache |

### v2 REST API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v2/:collection` | GET | Origin | List all documents (paginated) |
| `/v2/:collection/:id` | GET | Origin | Get single document by ID |
| `/v2/refresh/:collection` | POST | API Key | Write v2 collection data to cache |

### Common Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | None | Health check |
| `/status` | GET | None | Cache metadata for v1 and v2 collections |
| `/config/:key` | GET | None | Read configuration |
| `/config/:key` | POST | API Key | Write configuration |

## v1 GraphQL API

### POST /api/graphql

Accepts GraphQL queries and returns cached data in CMS-compatible format.

**Request:**
```json
{
  "query": "query { Posts(where: { _status: { equals: published } }) { docs { id title slug } } }"
}
```

**Response:**
```json
{
  "data": {
    "Posts": {
      "docs": [...],
      "totalDocs": 42
    }
  }
}
```

### POST /refresh/:collection (v1)

Write v1 GraphQL data to cache. Requires `Authorization: Bearer {CACHE_API_KEY}` header.

**Valid collections:** `posts`, `photography`, `working_notes`, `historic_posts`, `pages`

**Request body:**
```json
{
  "data": {
    "docs": [...],
    "totalDocs": 42
  }
}
```

## v2 REST API

### GET /v2/:collection

List all documents with pagination metadata.

**Valid collections:** `posts`, `photography`, `working-notes`, `historic-posts`, `pages`

**Response:**
```json
{
  "docs": [...],
  "totalDocs": 42,
  "totalPages": 5,
  "page": 1,
  "limit": 100,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

### GET /v2/:collection/:id

Get a single document by ID.

**Response:** Serialized document (see Payload v2 API docs for structure)

### POST /v2/refresh/:collection (v2)

Write v2 REST data to cache. Requires `Authorization: Bearer {CACHE_API_KEY}` header.

**Request body:**
```json
{
  "data": {
    "docs": [...],
    "totalDocs": 42,
    "totalPages": 5,
    "page": 1,
    "limit": 100,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

## Status Endpoint

### GET /status

Returns cache status for both v1 and v2 collections.

**Response:**
```json
{
  "v1": {
    "collections": {
      "posts": {
        "cached": true,
        "updatedAt": "2025-01-05T12:00:00Z",
        "docCount": 42,
        "totalDocs": 42
      }
    },
    "collectionMap": {
      "Posts": "posts",
      "WorkingNotes": "working_notes"
    }
  },
  "v2": {
    "collections": {
      "posts": {
        "cached": true,
        "updatedAt": "2025-01-05T12:00:00Z",
        "docCount": 42,
        "totalDocs": 42,
        "version": "v2"
      }
    }
  },
  "timestamp": "2025-01-05T14:30:00Z"
}
```

## KV Key Structure

The worker uses prefixed keys to separate v1 GraphQL and v2 REST data in the same KV namespace:

### v1 GraphQL Keys

| Key Pattern | Example | Purpose |
|-------------|---------|---------|
| `collection:{name}` | `collection:posts` | Full collection data (docs + metadata) |
| `metadata:{name}` | `metadata:posts` | Cache metadata (updated timestamp, doc count) |
| `config:collections` | `config:collections` | GraphQL query name → Jekyll collection name mapping |

### v2 REST Keys

| Key Pattern | Example | Purpose |
|-------------|---------|---------|
| `v2:{collection}` | `v2:posts` | Full collection data (paginated response) |
| `v2:{collection}:{id}` | `v2:posts:123` | Individual document by ID |
| `metadata:v2:{collection}` | `metadata:v2:posts` | Cache metadata for v2 collection |

### Example KV Contents

After cache refresh, the KV namespace contains:

```
config:collections         → {"Posts": "posts", "WorkingNotes": "working_notes"}
collection:posts           → {docs: [...], totalDocs: 42}
metadata:posts             → {cached: true, updatedAt: "...", docCount: 42}
v2:posts                   → {docs: [...], totalDocs: 42, totalPages: 5, ...}
v2:posts:1                 → {id: 1, title: "...", slug: "...", ...}
v2:posts:2                 → {id: 2, title: "...", slug: "...", ...}
metadata:v2:posts          → {cached: true, updatedAt: "...", docCount: 42, version: "v2"}
```

## Setup

### 1. Create KV Namespace

```bash
cd cloudflare-workers/graphql-cache
wrangler kv:namespace create GRAPHQL_CACHE
```

Copy the returned namespace ID and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "GRAPHQL_CACHE"
id = "your-namespace-id-here"
```

### 2. Set Secrets

```bash
wrangler secret put CACHE_API_KEY
# Enter a secure API key when prompted
```

Save this same key as `GRAPHQL_CACHE_API_KEY` in GitHub repository secrets.

### 3. Deploy Worker

```bash
wrangler deploy
```

### 4. Configure Custom Domain (Optional)

If using a custom domain, configure it in the Cloudflare dashboard under Workers & Pages > graphql-cache > Settings > Triggers > Custom Domains.

## Local Development

```bash
# Start local dev server
wrangler dev

# Test health endpoint
curl http://localhost:8787/health

# Test status endpoint
curl http://localhost:8787/status

# Test v1 write (requires API key)
curl -X POST http://localhost:8787/refresh/posts \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"data": {"docs": [], "totalDocs": 0}}'

# Test v1 GraphQL read
curl -X POST http://localhost:8787/api/graphql \
  -H "Authorization: Bearer your-graphql-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { Posts { docs { id title } } }"}'

# Test v2 write (requires API key)
curl -X POST http://localhost:8787/v2/refresh/posts \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"data": {"docs": [{"id": 1, "title": "Test"}], "totalDocs": 1, "totalPages": 1}}'

# Test v2 list read
curl http://localhost:8787/v2/posts

# Test v2 single document read
curl http://localhost:8787/v2/posts/1
```

## Security

- **Read operations**: Validated against origin allowlist (edwardjensen.net, localhost, etc.)
- **Write operations**: Require valid API key via `Authorization: Bearer` header
- **No CMS credentials**: Worker never contacts CMS directly; GitHub Actions handles that
- **v1 and v2**: Both APIs share the same security model and allowlist

## Cache Refresh

The cache is refreshed by GitHub Actions (`.github/workflows/republish-prod.yml`) using the `scripts/refresh-graphql-cache.ps1` script.

**Refresh modes:**
- **Default**: Refreshes both v1 GraphQL and v2 REST caches (parallel operation)
- **v1 only**: `./scripts/refresh-graphql-cache.ps1 -V1Only`
- **v2 only**: `./scripts/refresh-graphql-cache.ps1 -V2Only`
- **Single collection**: `./scripts/refresh-graphql-cache.ps1 -Collection posts` (refreshes both APIs)

**Trigger:**
- Automatically on CMS publish webhooks (`prod_cms_publish`, `prod_cms_photo_publish`)
- Manually via workflow dispatch in GitHub Actions

## KV Storage Schema

**Deprecated section** - See "KV Key Structure" above for current key patterns.

## Deployment

Automated via GitHub Actions when files in `cloudflare-workers/graphql-cache/` change on main branch.

Manual deployment:
```bash
cd cloudflare-workers/graphql-cache
wrangler deploy
```

## Production URL

`https://graphql-cache.edwardjensenprojects.com`
