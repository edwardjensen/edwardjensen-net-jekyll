/**
 * GraphQL Cache Worker
 *
 * Provides a caching layer for Payload CMS GraphQL responses using Cloudflare KV.
 * Jekyll builds read from this cache instead of hitting the CMS directly.
 * Cache is refreshed by GitHub Actions which can access the Tailscale-protected CMS.
 *
 * Environment bindings:
 *   GRAPHQL_CACHE - KV namespace for cached data
 *   CACHE_API_KEY - Secret API key for write operations (set via wrangler secret put)
 *
 * Endpoints:
 *   GET /cache/:collection     - Read cached collection data (origin-validated)
 *   POST /refresh/:collection  - Write collection data to cache (requires API key)
 *   GET /status                - Cache status and metadata
 *   GET /health                - Health check
 */

// Allowed origin patterns for read operations
const ALLOWED_ORIGINS = [
  /^https:\/\/([\w-]+\.)?edwardjensen\.net$/,
  /^https:\/\/([\w-]+\.)?edwardjensencms\.com$/,
  /^https:\/\/([\w-]+\.)?edwardjensen-jekyll\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

// Valid collection names (must match Jekyll collection names)
const VALID_COLLECTIONS = ['posts', 'photography', 'working_notes', 'historic_posts', 'pages'];

/**
 * Check if origin is allowed for read operations
 * Allows requests without Origin/Referer headers (e.g., from GitHub Actions)
 */
function isOriginAllowed(request) {
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');

  // Check Origin header first
  if (origin) {
    return ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return ALLOWED_ORIGINS.some(pattern => pattern.test(refererUrl.origin));
    } catch {
      return false;
    }
  }

  // Allow requests without Origin/Referer (e.g., from GitHub Actions, curl)
  return true;
}

/**
 * Validate API key for write operations
 */
function isApiKeyValid(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7);
  return token === env.CACHE_API_KEY;
}

/**
 * Generate KV key for a collection's data
 */
function getCollectionKey(collection) {
  return `collection:${collection}`;
}

/**
 * Generate KV key for a collection's metadata
 */
function getMetadataKey(collection) {
  return `metadata:${collection}`;
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Handle CORS preflight requests
 */
function handleCors(request) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '*';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    // Health check endpoint
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    }

    // Status endpoint - show cache metadata for all collections
    if (path === '/status' && request.method === 'GET') {
      const status = {};
      for (const collection of VALID_COLLECTIONS) {
        const metadata = await env.GRAPHQL_CACHE.get(getMetadataKey(collection), 'json');
        status[collection] = metadata || { cached: false };
      }
      return jsonResponse({
        collections: status,
        validCollections: VALID_COLLECTIONS,
        timestamp: new Date().toISOString(),
      });
    }

    // Read cached collection: GET /cache/:collection
    const readMatch = path.match(/^\/cache\/(\w+)$/);
    if (readMatch && request.method === 'GET') {
      const collection = readMatch[1];

      // Validate collection name
      if (!VALID_COLLECTIONS.includes(collection)) {
        return jsonResponse(
          { error: `Invalid collection: ${collection}`, validCollections: VALID_COLLECTIONS },
          400
        );
      }

      // Validate origin
      if (!isOriginAllowed(request)) {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }

      // Fetch from KV
      const data = await env.GRAPHQL_CACHE.get(getCollectionKey(collection), 'json');

      if (!data) {
        return jsonResponse(
          { error: `No cached data for collection: ${collection}` },
          404
        );
      }

      return jsonResponse(data, 200, origin);
    }

    // Refresh single collection: POST /refresh/:collection
    const refreshMatch = path.match(/^\/refresh\/(\w+)$/);
    if (refreshMatch && request.method === 'POST') {
      const collection = refreshMatch[1];

      // Validate collection name
      if (!VALID_COLLECTIONS.includes(collection)) {
        return jsonResponse(
          { error: `Invalid collection: ${collection}`, validCollections: VALID_COLLECTIONS },
          400
        );
      }

      // Validate API key
      if (!isApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid API key required' }, 401);
      }

      try {
        const body = await request.json();

        // Validate body structure
        if (!body.data) {
          return jsonResponse({ error: 'Request body must contain "data" field' }, 400);
        }

        // Store the collection data
        await env.GRAPHQL_CACHE.put(
          getCollectionKey(collection),
          JSON.stringify(body.data)
        );

        // Store metadata
        const metadata = {
          cached: true,
          updatedAt: new Date().toISOString(),
          docCount: body.data?.docs?.length || 0,
          totalDocs: body.data?.totalDocs || 0,
        };
        await env.GRAPHQL_CACHE.put(
          getMetadataKey(collection),
          JSON.stringify(metadata)
        );

        return jsonResponse({
          success: true,
          collection,
          metadata,
        });
      } catch (error) {
        console.error('Error storing cache:', error);
        return jsonResponse(
          { error: 'Failed to store cache data', details: error.message },
          500
        );
      }
    }

    // Method not allowed for known paths
    if (readMatch || refreshMatch) {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Not found
    return jsonResponse(
      {
        error: 'Not found',
        availableEndpoints: [
          'GET /health',
          'GET /status',
          'GET /cache/:collection',
          'POST /refresh/:collection',
        ],
      },
      404
    );
  },
};
