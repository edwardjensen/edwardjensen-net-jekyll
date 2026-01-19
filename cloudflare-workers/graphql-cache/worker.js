/**
 * GraphQL + REST API Endpoint Worker
 *
 * Provides both GraphQL and REST API endpoints that mirror Payload CMS APIs.
 * Supports parallel operation of v1 GraphQL and v2 REST APIs during migration.
 *
 * The collection mapping is stored in KV and updated by the cache refresh workflow,
 * making it easy to add new content types without code changes.
 *
 * Environment bindings:
 *   GRAPHQL_CACHE   - KV namespace for cached data
 *   CACHE_API_KEY   - Secret API key for write operations (set via wrangler secret put)
 *   GRAPHQL_API_KEY - Secret API key for read operations on /api/graphql (set via wrangler secret put)
 *
 * v1 GraphQL Endpoints:
 *   POST /api/graphql            - GraphQL queries (requires GRAPHQL_API_KEY)
 *   POST /refresh/:collection    - Write collection data (requires CACHE_API_KEY)
 *
 * v2 REST API Endpoints:
 *   GET /v2/:collection          - List all documents (paginated)
 *   GET /v2/:collection/:id      - Get single document by ID
 *   POST /v2/refresh/:collection - Write collection data (requires CACHE_API_KEY)
 *
 * Configuration Endpoints:
 *   POST /config/:key            - Write configuration (requires CACHE_API_KEY)
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
 * Validate API key for write operations (CACHE_API_KEY)
 */
function isWriteApiKeyValid(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7);
  return token === env.CACHE_API_KEY;
}

/**
 * Validate API key for GraphQL read operations (GRAPHQL_API_KEY)
 */
function isGraphqlApiKeyValid(request, env) {
  // If GRAPHQL_API_KEY is not configured, allow requests (for backwards compatibility during migration)
  if (!env.GRAPHQL_API_KEY) {
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7);
  return token === env.GRAPHQL_API_KEY;
}

/**
 * Generate KV key for a collection's data (v1 GraphQL)
 */
function getCollectionKey(collection) {
  return `collection:${collection}`;
}

/**
 * Generate KV key for a v2 REST collection's data
 */
function getV2CollectionKey(collection) {
  return `v2:${collection}`;
}

/**
 * Generate KV key for a single document in v2 REST cache
 */
function getV2DocumentKey(collection, id) {
  return `v2:${collection}:${id}`;
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

    // Status endpoint - show cache metadata for all collections (v1 and v2)
    if (path === '/status' && request.method === 'GET') {
      const collectionMap = await getCollectionMap(env);
      const validCollections = Object.values(collectionMap);

      const statusV1 = {};
      const statusV2 = {};

      // v1 collections
      for (const collection of validCollections) {
        const metadata = await env.GRAPHQL_CACHE.get(getMetadataKey(collection), 'json');
        statusV1[collection] = metadata || { cached: false };
      }

      // v2 collections (check for known REST collections)
      const v2Collections = ['posts', 'working-notes', 'photography', 'historic-posts', 'pages'];
      for (const collection of v2Collections) {
        const metadata = await env.GRAPHQL_CACHE.get(getMetadataKey(`v2:${collection}`), 'json');
        if (metadata) {
          statusV2[collection] = metadata;
        }
      }

      return jsonResponse({
        v1: {
          collections: statusV1,
          collectionMap,
        },
        v2: {
          collections: statusV2,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // GraphQL endpoint: POST /api/graphql (matches Payload CMS path)
    if (path === '/api/graphql' && request.method === 'POST') {
      // Validate API key (required when GRAPHQL_API_KEY is configured)
      if (!isGraphqlApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid GRAPHQL_API_KEY required' }, 401, origin);
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
      if (!isWriteApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid CACHE_API_KEY required' }, 401, origin);
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
      if (!isWriteApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid CACHE_API_KEY required' }, 401, origin);
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

    // v2 REST API: GET /v2/:collection (list all documents with pagination)
    const v2ListMatch = path.match(/^\/v2\/([a-z-]+)$/);
    if (v2ListMatch && request.method === 'GET') {
      const collection = v2ListMatch[1];

      // Validate origin
      if (!isOriginAllowed(request)) {
        return jsonResponse({ error: 'Unauthorized - origin not allowed' }, 401, origin);
      }

      try {
        // Parse pagination query parameters
        const url = new URL(request.url);
        const requestedPage = parseInt(url.searchParams.get('page') || '1', 10);
        const requestedLimit = parseInt(url.searchParams.get('limit') || '10', 10);
        
        // Validate and cap values
        const page = Math.max(1, requestedPage);
        const limit = Math.min(100, Math.max(1, requestedLimit));

        // Fetch cached data
        const data = await env.GRAPHQL_CACHE.get(getV2CollectionKey(collection), 'json');

        if (!data) {
          return jsonResponse({
            error: `No cached data for v2 collection: ${collection}`,
            hint: 'Cache may need to be refreshed'
          }, 404, origin);
        }

        // Calculate pagination
        const totalDocs = data.totalDocs || data.docs?.length || 0;
        const totalPages = Math.ceil(totalDocs / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        // Slice docs array for requested page
        const paginatedDocs = (data.docs || []).slice(startIndex, endIndex);

        // Return paginated response
        return jsonResponse({
          docs: paginatedDocs,
          totalDocs: totalDocs,
          totalPages: totalPages,
          page: page,
          limit: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }, 200, origin);

      } catch (error) {
        console.error('v2 list request error:', error);
        return jsonResponse({
          error: 'Failed to process v2 list request',
          details: error.message
        }, 500, origin);
      }
    }

    // v2 REST API: GET /v2/:collection/:id (get single document)
    const v2SingleMatch = path.match(/^\/v2\/([a-z-]+)\/(\d+)$/);
    if (v2SingleMatch && request.method === 'GET') {
      const collection = v2SingleMatch[1];
      const id = v2SingleMatch[2];

      // Validate origin
      if (!isOriginAllowed(request)) {
        return jsonResponse({ error: 'Unauthorized - origin not allowed' }, 401, origin);
      }

      try {
        // Fetch cached document
        const data = await env.GRAPHQL_CACHE.get(getV2DocumentKey(collection, id), 'json');

        if (!data) {
          return jsonResponse({
            error: `Document not found: ${collection}/${id}`,
            hint: 'Document may not exist or cache needs refresh'
          }, 404, origin);
        }

        return jsonResponse(data, 200, origin);

      } catch (error) {
        console.error('v2 single document request error:', error);
        return jsonResponse({
          error: 'Failed to process v2 single document request',
          details: error.message
        }, 500, origin);
      }
    }

    // v2 REST API: POST /v2/refresh/:collection (write collection data)
    const v2RefreshMatch = path.match(/^\/v2\/refresh\/([a-z-]+)$/);
    if (v2RefreshMatch && request.method === 'POST') {
      const collection = v2RefreshMatch[1];

      // Validate API key
      if (!isWriteApiKeyValid(request, env)) {
        return jsonResponse({ error: 'Unauthorized - valid CACHE_API_KEY required' }, 401, origin);
      }

      try {
        const body = await request.json();

        // Validate body structure (should contain paginated response)
        if (!body.data || !body.data.docs) {
          return jsonResponse({ 
            error: 'Request body must contain "data.docs" field (paginated response)' 
          }, 400, origin);
        }

        const data = body.data;
        const docs = data.docs;

        // Store the full paginated response for list endpoint
        await env.GRAPHQL_CACHE.put(
          getV2CollectionKey(collection),
          JSON.stringify(data)
        );

        // Store individual documents for single-document endpoint
        const writePromises = docs.map(doc => {
          if (!doc.id) {
            console.warn(`Document in ${collection} missing id field, skipping individual cache`);
            return Promise.resolve();
          }
          return env.GRAPHQL_CACHE.put(
            getV2DocumentKey(collection, doc.id),
            JSON.stringify(doc)
          );
        });
        await Promise.all(writePromises);

        // Store metadata
        const metadata = {
          cached: true,
          updatedAt: new Date().toISOString(),
          docCount: docs.length,
          totalDocs: data.totalDocs || docs.length,
          version: 'v2',
        };
        await env.GRAPHQL_CACHE.put(
          getMetadataKey(`v2:${collection}`),
          JSON.stringify(metadata)
        );

        return jsonResponse({
          success: true,
          collection,
          metadata,
        });
      } catch (error) {
        console.error('Error storing v2 cache:', error);
        return jsonResponse(
          { error: 'Failed to store v2 cache data', details: error.message },
          500,
          origin
        );
      }
    }

    // Not found
    return jsonResponse(
      {
        error: 'Not found',
        availableEndpoints: [
          'GET /health',
          'GET /status',
          'POST /api/graphql (v1 GraphQL)',
          'GET /config/:key',
          'POST /config/:key',
          'POST /refresh/:collection (v1)',
          'GET /v2/:collection (v2 REST list)',
          'GET /v2/:collection/:id (v2 REST single)',
          'POST /v2/refresh/:collection (v2)',
        ],
      },
      404,
      origin
    );
  },
};
