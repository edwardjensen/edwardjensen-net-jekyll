# Google Maps Proxy Worker

A Cloudflare Worker that proxies requests to Google Maps Static API, keeping the API key server-side.

## Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set your Google Maps API key as a secret:
   ```bash
   cd cloudflare-workers/maps-proxy
   wrangler secret put GOOGLE_MAPS_API_KEY
   ```

4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

## Configuration

Edit `wrangler.toml` to configure:
- `name`: Worker name (default: `maps-proxy`)
- `routes`: Domain routing (uncomment and configure for production)

## Usage

Once deployed, the worker accepts requests at:

```
GET /staticmap?center={lat},{lng}&zoom=15&size=640x360&scale=2&maptype=roadmap&markers=color:red|{lat},{lng}
```

### Allowed Parameters

- `center` (required): Latitude,longitude center point
- `zoom`: Map zoom level (0-21)
- `size`: Image dimensions (e.g., 640x360)
- `scale`: Image scale (1 or 2 for retina)
- `maptype`: Map type (roadmap, satellite, terrain, hybrid)
- `markers`: Marker definitions
- `format`: Image format (png, png8, png32, gif, jpg, jpg-baseline)

## Testing Locally

```bash
wrangler dev
```

Then visit: `http://localhost:8787/staticmap?center=44.9778,-93.2650&zoom=15&size=640x360`

## Production URL

After configuring routes, the worker will be available at your custom domain (e.g., `https://maps.edwardjensen.net/staticmap`).
