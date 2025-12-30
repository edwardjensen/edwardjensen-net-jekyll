# Cloudflare Stream Proxy Worker

Proxies requests to Cloudflare Stream, hiding the customer and video IDs from client-side code.

## Setup

1. Install Wrangler CLI if not already installed:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Set the required secrets:
   ```bash
   cd cloudflare-workers/stream-proxy
   wrangler secret put CLOUDFLARE_STREAM_CUSTOMER_ID
   wrangler secret put CLOUDFLARE_STREAM_VIDEO_ID
   ```

4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

## Configuration

The worker is configured via `wrangler.toml`. Update the `routes` pattern if you need a different domain.

## Usage

The proxy accepts GET requests to `/iframe` and redirects to the actual Cloudflare Stream URL.

**Request:**
```
GET https://stpcamera.edwardjensenprojects.com/iframe?autoplay=true&muted=true
```

**Allowed parameters:**
- `autoplay` - Start playing automatically
- `muted` - Start muted (required for autoplay in most browsers)
- `preload` - Preload behavior (`none`, `metadata`, `auto`)
- `loop` - Loop the video
- `controls` - Show player controls
- `poster` - Poster image URL
- `startTime` - Start playback at specific time
- `defaultTextTrack` - Default text track language

## Local Testing

```bash
cd cloudflare-workers/stream-proxy
wrangler dev
```

This starts a local development server. Note that origin validation may need to be adjusted for local testing.

## Production

After deployment, the worker will be available at:
- `https://stpcamera.edwardjensenprojects.com/iframe`
