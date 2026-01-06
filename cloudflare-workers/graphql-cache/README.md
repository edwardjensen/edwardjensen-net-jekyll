# GraphQL Cache Worker

Cloudflare Worker that provides a caching layer for Payload CMS GraphQL responses using Cloudflare KV storage.

## Purpose

Jekyll builds read CMS content from this cache instead of hitting the CMS directly. This enables:
- Faster builds (KV reads are faster than GraphQL queries)
- Decoupled builds (site can build even if CMS is temporarily unavailable)
- Future Astro migration (cache can serve multiple consumers)

## Architecture

```
[Payload CMS] <-- (Tailscale VPN) -- [GitHub Actions: cache refresh]
                                              |
                                              v
                                      [This Worker]
                                              |
                                              v
                                      [Cloudflare KV]
                                              |
                                              v
                                      [Jekyll Build]
```

Cache refresh happens in GitHub Actions (which can connect to the Tailscale-protected CMS), not in the worker itself.

## Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | None | Health check |
| `/status` | GET | None | Cache metadata for all collections |
| `/cache/:collection` | GET | Origin | Read cached collection data |
| `/refresh/:collection` | POST | API Key | Write collection data to cache |

### GET /cache/:collection

Read cached data for a collection.

**Valid collections:** `posts`, `photography`, `working_notes`, `historic_posts`, `pages`

**Response:**
```json
{
  "docs": [...],
  "totalDocs": 42
}
```

### POST /refresh/:collection

Write data to cache. Requires `Authorization: Bearer {CACHE_API_KEY}` header.

**Request body:**
```json
{
  "data": {
    "docs": [...],
    "totalDocs": 42
  }
}
```

**Response:**
```json
{
  "success": true,
  "collection": "posts",
  "metadata": {
    "cached": true,
    "updatedAt": "2025-01-05T12:00:00Z",
    "docCount": 42,
    "totalDocs": 42
  }
}
```

### GET /status

Returns cache status for all collections.

**Response:**
```json
{
  "collections": {
    "posts": {
      "cached": true,
      "updatedAt": "2025-01-05T12:00:00Z",
      "docCount": 42,
      "totalDocs": 42
    },
    "photography": {
      "cached": false
    }
  },
  "validCollections": ["posts", "photography", "working_notes", "historic_posts", "pages"],
  "timestamp": "2025-01-05T14:30:00Z"
}
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

# Test write (requires API key)
curl -X POST http://localhost:8787/refresh/posts \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"data": {"docs": [], "totalDocs": 0}}'

# Test read
curl http://localhost:8787/cache/posts
```

## Security

- **Read operations**: Validated against origin allowlist (edwardjensen.net, localhost, etc.)
- **Write operations**: Require valid API key via `Authorization: Bearer` header
- **No CMS credentials**: Worker never contacts CMS directly; GitHub Actions handles that

## KV Storage Schema

| Key Pattern | Content |
|-------------|---------|
| `collection:{name}` | Full collection data `{ docs: [...], totalDocs: N }` |
| `metadata:{name}` | Cache metadata `{ cached, updatedAt, docCount, totalDocs }` |

## Deployment

Automated via GitHub Actions when files in `cloudflare-workers/graphql-cache/` change on main branch.

Manual deployment:
```bash
cd cloudflare-workers/graphql-cache
wrangler deploy
```

## Production URL

`https://graphql-cache.edwardjensenprojects.com`
