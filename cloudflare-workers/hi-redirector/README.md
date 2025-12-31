# hi.edwardjensen.net Redirect Worker

A Cloudflare Worker that provides short URL redirects with UTM tracking for analytics.

## URL Patterns

| Path | Destination | Description |
|------|-------------|-------------|
| `/` | `edwardjensen.net/hi` | Root redirect |
| `/linkedin` | `edwardjensen.net/hi?utm_...` | Social platform redirect |
| `/bluesky` | `edwardjensen.net/hi?utm_...` | Social platform redirect |
| `/github` | `edwardjensen.net/hi?utm_...` | Social platform redirect |
| `/keychain` | `edwardjensen.net/hi?utm_...` | Event redirect |
| `/events.json` | JSON response | API endpoint for events data |
| `/*` | `edwardjensen.net/hi` | Catch-all redirect |

## Configuration

Redirect data is stored in `_data/hi-redirects.json`:

```json
{
  "baseUrl": "https://www.edwardjensen.net/hi",
  "social": [
    { "platform": "linkedin" }
  ],
  "events": [
    { "event": "Event Name", "type": "in-person", "tag": "shorttag" }
  ]
}
```

### Adding a Social Platform

Add an entry to the `social` array:

```json
{ "platform": "mastodon" }
```

This creates `/mastodon` → `edwardjensen.net/hi?utm_source=mastodon&utm_medium=social&utm_campaign=social`

### Adding an Event

Add an entry to the `events` array:

```json
{ "event": "Conference 2025", "type": "conference", "tag": "conf25" }
```

This creates `/conf25` → `edwardjensen.net/hi?utm_source=conference%202025&utm_medium=conference&utm_campaign=conf25`

## Local Development

```bash
# Install wrangler (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run locally
wrangler dev

# Test routes
curl -I http://localhost:8787/
curl -I http://localhost:8787/linkedin
curl http://localhost:8787/events.json
```

## Deployment

### Automatic

The worker deploys automatically when files in `cloudflare-workers/hi-redirector/` or `_data/hi-redirects.json` are modified on the `main` branch.

### Manual

```bash
cd cloudflare-workers/hi-redirector
wrangler deploy
```

## Production URL

`https://hi.edwardjensen.net`
