/**
 * GraphQL Endpoint Worker
 *
 * Provides a GraphQL endpoint that mirrors the Payload CMS GraphQL API.
 * The endpoint path (/api/graphql) matches Payload CMS exactly, allowing
 * Jekyll builds to use the same code path regardless of whether they're
 * hitting this worker or the CMS directly.
 *
 * The collection mapping is stored in KV and updated by the cache refresh workflow,
 * making it easy to add new content types without code changes.
 *
 * Environment bindings:
 *   GRAPHQL_CACHE - KV namespace for cached data
 *   CACHE_API_KEY - Secret API key for write operations (set via wrangler secret put)
 *
 * Endpoints:
 *   POST /api/graphql            - GraphQL queries (primary endpoint for Jekyll builds)
 *   POST /refresh/:collection    - Write collection data (requires API key)
 *   POST /config/:key            - Write configuration (requires API key)
 *   GET /config/:key             - Read configuration
 *   GET /status                  - Status and metadata
 *   GET /health                  - Health check
 */

// Allowed origin patterns for read operations
const ALLOWED_ORIGINS = [
  /^https:\/\/([\w-]+\.)?edwardjensen\.net$/,
  /^https:\/\/([\w-]+\.)?edwardjensencms\.com$/,
  /^https:\/\/([\w-]+\.)?edwardjensen-jekyll\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

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
 * Generate KV key for configuration
 */
function getConfigKey(key) {
  return `config:${key}`;
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

/**
 * Extract the collection name from a GraphQL query.
 *
 * Handles queries in the format:
 * - query { Posts(...) { ... } }
 * - query GetPublished($limit: Int) { Posts(...) { ... } }
 * - query { WorkingNotes(where: {...}) { docs { ... } } }
 *
 * @param {string} query - The GraphQL query string
 * @returns {string|null} The collection name or null if parsing fails
 */
function extractCollectionFromQuery(query) {
  // Remove comments and normalize whitespace
  const normalized = query
    .replace(/#[^\n]*/g, '')  // Remove comments
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();

  // Match pattern: query [optional_name] [optional_variables] { CollectionName
  const match = normalized.match(/query\s*(?:\w+)?\s*(?:\([^)]*\))?\s*\{\s*(\w+)/);

  return match ? match[1] : null;
}

/**
 * Get collection mapping from KV storage
 * Returns a map of GraphQL query names to Jekyll collection names
 * e.g., { "Posts": "posts", "Photographies": "photography", ... }
 */
async function getCollectionMap(env) {
  const map = await env.GRAPHQL_CACHE.get(getConfigKey('collections'), 'json');
  return map || {};
}

/**
 * Get list of valid Jekyll collection names from the mapping
 */
async function getValidCollections(env) {
  const map = await getCollectionMap(env);
  return Object.values(map);
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
      const collectionMap = await getCollectionMap(env);
      const validCollections = Object.values(collectionMap);

      const status = {};
      for (const collection of validCollections) {
        const metadata = await env.GRAPHQL_CACHE.get(getMetadataKey(collection), 'json');
        status[collection] = metadata || { cached: false };
      }
      return jsonResponse({
        collections: status,
        collectionMap,
        timestamp: new Date().toISOString(),
      });
    }

    // GraphQL endpoint: POST /api/graphql (matches Payload CMS path)
    if (path === '/api/graphql' && request.method === 'POST') {
      // Validate origin
      if (!isOriginAllowed(request)) {
        return jsonResponse({ error: 'Forbidden' }, 403, origin);
      }

      try {
        const body = await request.json();
        const query = body.query;

        if (!query) {
          return jsonResponse({
            errors: [{ message: 'Missing query in request body' }]
          }, 400, origin);
        }

        // Extract collection name from query
        const graphqlCollection = extractCollectionFromQuery(query);

        if (!graphqlCollection) {
          return jsonResponse({
            errors: [{
              message: 'Could not parse collection from query',
              hint: 'Query must follow pattern: query { CollectionName(...) { docs { ... } } }'
            }]
          }, 400, origin);
        }

        // Get collection mapping from KV
        const collectionMap = await getCollectionMap(env);

        if (Object.keys(collectionMap).length === 0) {
          return jsonResponse({
            errors: [{
              message: 'Collection mapping not configured',
              hint: 'Run cache refresh workflow to populate collection mapping'
            }]
          }, 500, origin);
        }

        // Map GraphQL collection name to Jekyll collection name
        const jekyllCollection = collectionMap[graphqlCollection];

        if (!jekyllCollection) {
          return jsonResponse({
            errors: [{
              message: `Unknown collection: ${graphqlCollection}`,
              validCollections: Object.keys(collectionMap)
            }]
          }, 400, origin);
        }

        // Fetch from KV
        const data = await env.GRAPHQL_CACHE.get(getCollectionKey(jekyllCollection), 'json');

        if (!data) {
          return jsonResponse({
            errors: [{
              message: `No cached data for collection: ${graphqlCollection}`,
              hint: 'Cache may need to be refreshed'
            }]
          }, 404, origin);
        }

        // Return in CMS-compatible format
        return jsonResponse({
          data: {
            [graphqlCollection]: data
          }
        }, 200, origin);

      } catch (error) {
        console.error('GraphQL request error:', error);
        return jsonResponse({
          errors: [{
            message: 'Failed to process GraphQL request',
            details: error.message
          }]
        }, 500, origin);
      }
    }

    // Read configuration: GET /config/:key
    const configReadMatch = path.match(/^\/config\/(\w+)$/);
    if (configReadMatch && request.method === 'GET') {
      const key = configReadMatch[1];

      const data = await env.GRAPHQL_CACHE.get(getConfigKey(key), 'json');

      if (!data) {
        return jsonResponse({ error: `No configuration found for key: ${key}` }, 404, origin);
      }

      return jsonResponse({ key, data }, 200, origin);
    }

    // Write configuration: POST /config/:key
    if (configReadMatch && request.method === 'POST') {
      const key = configReadMatch[1];

      // Validate API key
      if (!isApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid API key required' }, 401, origin);
      }

      try {
        const body = await request.json();

        if (!body.data) {
          return jsonResponse({ error: 'Request body must contain "data" field' }, 400, origin);
        }

        await env.GRAPHQL_CACHE.put(getConfigKey(key), JSON.stringify(body.data));

        return jsonResponse({
          success: true,
          key,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error storing config:', error);
        return jsonResponse(
          { error: 'Failed to store configuration', details: error.message },
          500,
          origin
        );
      }
    }

    // Refresh single collection: POST /refresh/:collection
    const refreshMatch = path.match(/^\/refresh\/(\w+)$/);
    if (refreshMatch && request.method === 'POST') {
      const collection = refreshMatch[1];

      // Validate API key
      if (!isApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid API key required' }, 401, origin);
      }

      try {
        const body = await request.json();

        // Validate body structure
        if (!body.data) {
          return jsonResponse({ error: 'Request body must contain "data" field' }, 400, origin);
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
          500,
          origin
        );
      }
    }

    // Method not allowed for known paths
    if (refreshMatch || configReadMatch) {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    // Not found
    return jsonResponse(
      {
        error: 'Not found',
        availableEndpoints: [
          'GET /health',
          'GET /status',
          'POST /api/graphql',
          'GET /config/:key',
          'POST /config/:key',
          'POST /refresh/:collection',
        ],
      },
      404,
      origin
    );
  },
};
