/**
 * Google Maps Static API Proxy Worker
 *
 * Proxies requests to Google Maps Static API, adding the API key server-side.
 * This keeps the API key hidden from client-side code.
 *
 * Environment variables required:
 *   GOOGLE_MAPS_API_KEY - Your Google Maps API key
 *
 * Usage:
 *   GET /staticmap?center=lat,lng&zoom=15&size=640x360&scale=2&maptype=roadmap&markers=color:red|lat,lng
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Only allow /staticmap path
    if (url.pathname !== '/staticmap') {
      return new Response('Not Found', { status: 404 });
    }

    // Build Google Maps Static API URL
    const params = url.searchParams;
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/staticmap');

    // Allowlist specific params to prevent abuse
    const allowedParams = ['center', 'zoom', 'size', 'scale', 'maptype', 'markers', 'format'];
    for (const param of allowedParams) {
      if (params.has(param)) {
        googleUrl.searchParams.set(param, params.get(param));
      }
    }

    // Validate required params
    if (!params.has('center')) {
      return new Response('Missing required parameter: center', { status: 400 });
    }

    // Add API key from environment
    if (!env.GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY environment variable not set');
      return new Response('Server configuration error', { status: 500 });
    }
    googleUrl.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);

    try {
      // Fetch from Google Maps API
      const response = await fetch(googleUrl.toString());

      if (!response.ok) {
        console.error(`Google Maps API error: ${response.status}`);
        return new Response('Failed to fetch map', { status: response.status });
      }

      // Return the image with appropriate headers
      return new Response(response.body, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Fetch error:', error);
      return new Response('Failed to fetch map', { status: 502 });
    }
  },
};
