# Refresh GraphQL and REST API Cache
#
# Updates the Cloudflare KV cache with fresh data from the CMS.
# Supports both v1 GraphQL API and v2 REST API caching (parallel operation during migration).
# Requires Tailscale VPN connection for CMS access.
#
# Usage:
#   ./scripts/refresh-graphql-cache.ps1                           # Refresh all collections (v1 + v2)
#   ./scripts/refresh-graphql-cache.ps1 -Collection posts         # Refresh only posts (v1 + v2)
#   ./scripts/refresh-graphql-cache.ps1 -Collection photography   # Refresh only photography (v1 + v2)
#   ./scripts/refresh-graphql-cache.ps1 -V1Only                   # Refresh v1 GraphQL only
#   ./scripts/refresh-graphql-cache.ps1 -V2Only                   # Refresh v2 REST only
#
# Environment variables (for CI):
#   CMS_GRAPHQL_URL  - CMS GraphQL endpoint (default: Tailscale URL)
#   CMS_REST_URL     - CMS REST API base URL (default: derived from CMS_GRAPHQL_URL)
#   CACHE_API_URL    - Cache worker base URL
#   CACHE_API_KEY    - Cache worker API key
#
# For local use, set CACHE_API_KEY in .env file or pass via -CacheApiKey parameter

param(
    [Parameter(Mandatory = $false)]
    [string]$Collection = "",

    [Parameter(Mandatory = $false)]
    [string]$CmsGraphqlUrl = $env:CMS_GRAPHQL_URL,

    [Parameter(Mandatory = $false)]
    [string]$CmsRestUrl = $env:CMS_REST_URL,

    [Parameter(Mandatory = $false)]
    [string]$CacheApiUrl = $env:CACHE_API_URL,

    [Parameter(Mandatory = $false)]
    [string]$CacheApiKey = $env:CACHE_API_KEY,

    [Parameter(Mandatory = $false)]
    [switch]$V1Only,

    [Parameter(Mandatory = $false)]
    [switch]$V2Only
)

$ErrorActionPreference = "Stop"

# Determine script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Load .env file if it exists (for local dev)
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            # Only set if not already set via parameter or environment
            if (-not (Get-Variable -Name $key -ErrorAction SilentlyContinue)) {
                Set-Variable -Name $key -Value $value -Scope Script
            }
            # Also set in environment for consistency
            if (-not [Environment]::GetEnvironmentVariable($key)) {
                [Environment]::SetEnvironmentVariable($key, $value)
            }
        }
    }
}

# Apply defaults
if (-not $CmsGraphqlUrl) { $CmsGraphqlUrl = "https://www-ts.edwardjensencms.com/api/graphql" }
if (-not $CmsRestUrl) { 
    # Derive REST URL from GraphQL URL by replacing /api/graphql with /api/v2
    $CmsRestUrl = $CmsGraphqlUrl -replace '/api/graphql$', '/api/v2'
}
if (-not $CacheApiUrl) { $CacheApiUrl = "https://graphql.edwardjensen.net" }
if (-not $CacheApiKey) {
    # Try from .env loaded variable
    if ($env:CACHE_API_KEY) {
        $CacheApiKey = $env:CACHE_API_KEY
    } else {
        throw "CacheApiKey required. Set via -CacheApiKey parameter, CACHE_API_KEY env var, or .env file"
    }
}

# Install powershell-yaml module if not present
if (-not (Get-Module -ListAvailable -Name powershell-yaml)) {
    Write-Host "Installing powershell-yaml module..."
    Install-Module -Name powershell-yaml -Force -Scope CurrentUser -AllowClobber
}
Import-Module powershell-yaml

# Auto-discover collections from _data/graphql/*.yml files
$configDir = Join-Path $ProjectRoot "_data/graphql"
$collections = @{}

Get-ChildItem -Path $configDir -Filter "*.yml" | ForEach-Object {
    $name = $_.BaseName
    $content = Get-Content $_.FullName -Raw | ConvertFrom-Yaml
    $collections[$name] = @{
        queryName = $content.query_name
        sort = $content.sort
        fields = ($content.fields -join " ")
    }
}

Write-Host "GraphQL + REST API Cache Refresh"
Write-Host "CMS GraphQL URL: $CmsGraphqlUrl"
Write-Host "CMS REST URL: $CmsRestUrl"
Write-Host "Cache URL: $CacheApiUrl"
Write-Host "Discovered collections: $($collections.Keys -join ', ')"

if ($V1Only) {
    Write-Host "Mode: v1 GraphQL only"
} elseif ($V2Only) {
    Write-Host "Mode: v2 REST only"
} else {
    Write-Host "Mode: Both v1 GraphQL and v2 REST (parallel operation)"
}

function Refresh-Collection {
    param(
        [string]$Name,
        [hashtable]$Config
    )

    Write-Host ""
    Write-Host "=========================================="
    Write-Host "Processing collection: $Name"
    Write-Host "=========================================="

    $queryName = $Config.queryName
    $sort = $Config.sort
    $fields = $Config.fields

    if (-not $queryName) {
        Write-Error "No query_name defined for collection $Name"
        return $false
    }

    Write-Host "Fetching $queryName from CMS..."

    # Pagination settings
    $pageSize = 100
    $page = 1
    $totalDocs = 0
    $hasMore = $true
    $allDocs = @()

    # Fetch all pages
    while ($hasMore) {
        # Build GraphQL query with pagination
        $query = "query { ${queryName}(where: { _status: { equals: published } }, limit: ${pageSize}, page: ${page}, sort: `"${sort}`") { docs { ${fields} } totalDocs hasNextPage } }"

        $body = @{ query = $query } | ConvertTo-Json -Compress

        try {
            $response = Invoke-RestMethod -Uri $CmsGraphqlUrl -Method Post -ContentType "application/json" -Body $body
        }
        catch {
            Write-Error "Failed to fetch $Name from CMS (page $page). Is Tailscale connected? Error: $_"
            return $false
        }

        # Check for GraphQL errors
        if ($response.errors) {
            Write-Error "GraphQL errors for $Name : $($response.errors | ConvertTo-Json -Compress)"
            return $false
        }

        # Extract page data
        $pageData = $response.data.$queryName
        $pageDocs = $pageData.docs
        $pageCount = $pageDocs.Count
        $totalDocs = $pageData.totalDocs
        $hasMore = $pageData.hasNextPage -eq $true

        # Accumulate documents
        $allDocs += $pageDocs

        Write-Host "  Page ${page}: fetched $pageCount documents (hasNextPage: $hasMore)"
        $page++
    }

    $docCount = $allDocs.Count
    Write-Host "Fetched $docCount documents total (totalDocs: $totalDocs) for $Name"

    # Build the data structure matching what the cache expects
    $data = @{
        docs = $allDocs
        totalDocs = $totalDocs
    }

    # Write to cache
    Write-Host "Writing to cache..."

    $cacheBody = @{ data = $data } | ConvertTo-Json -Depth 100 -Compress

    $headers = @{
        "Authorization" = "Bearer $CacheApiKey"
        "Content-Type" = "application/json"
    }

    try {
        $cacheResponse = Invoke-RestMethod -Uri "${CacheApiUrl}/refresh/${Name}" -Method Post -Headers $headers -Body $cacheBody
        Write-Host "Successfully cached $Name"
        Write-Host ($cacheResponse | ConvertTo-Json -Compress)
        return $true
    }
    catch {
        Write-Error "Failed to write $Name to cache: $_"
        return $false
    }
}

function Refresh-CollectionV2 {
    param(
        [string]$Name
    )

    Write-Host ""
    Write-Host "=========================================="
    Write-Host "Processing v2 REST collection: $Name"
    Write-Host "=========================================="

    Write-Host "Fetching $Name from CMS REST API..."

    # Map collection name to REST endpoint path
    $restPath = $Name
    # Handle underscores → hyphens for REST paths (e.g., working_notes → working-notes)
    $restPath = $restPath -replace '_', '-'

    # Pagination settings
    $pageSize = 100
    $page = 1
    $totalDocs = 0
    $hasMore = $true
    $allDocs = @()

    # Fetch all pages
    while ($hasMore) {
        $restUrl = "${CmsRestUrl}/${restPath}?page=${page}&limit=${pageSize}"

        try {
            $response = Invoke-RestMethod -Uri $restUrl -Method Get
        }
        catch {
            Write-Error "Failed to fetch $Name from CMS REST API (page $page). Is Tailscale connected? Error: $_"
            return $false
        }

        # Extract page data (REST API returns paginated format)
        $pageDocs = $response.docs
        $pageCount = $pageDocs.Count
        $totalDocs = $response.totalDocs
        $hasMore = $response.hasNextPage -eq $true

        # Accumulate documents
        $allDocs += $pageDocs

        Write-Host "  Page ${page}: fetched $pageCount documents (hasNextPage: $hasMore)"
        $page++
    }

    $docCount = $allDocs.Count
    Write-Host "Fetched $docCount documents total (totalDocs: $totalDocs) for $Name"

    # Build the data structure matching REST API response format
    $data = @{
        docs = $allDocs
        totalDocs = $totalDocs
        totalPages = [Math]::Ceiling($totalDocs / $pageSize)
        page = 1
        limit = $totalDocs  # For full cache, store all docs
        hasNextPage = $false
        hasPrevPage = $false
    }

    # Write to v2 cache
    Write-Host "Writing to v2 cache..."

    $cacheBody = @{ data = $data } | ConvertTo-Json -Depth 100 -Compress

    $headers = @{
        "Authorization" = "Bearer $CacheApiKey"
        "Content-Type" = "application/json"
    }

    try {
        $cacheResponse = Invoke-RestMethod -Uri "${CacheApiUrl}/v2/refresh/${restPath}" -Method Post -Headers $headers -Body $cacheBody
        Write-Host "Successfully cached v2 $Name"
        Write-Host ($cacheResponse | ConvertTo-Json -Compress)
        return $true
    }
    catch {
        Write-Error "Failed to write v2 $Name to cache: $_"
        return $false
    }
}

function Update-CollectionMapping {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "Updating collection mapping"
    Write-Host "=========================================="

    # Build mapping of GraphQL query names to Jekyll collection names
    $mapping = @{}
    foreach ($name in $collections.Keys) {
        $queryName = $collections[$name].queryName
        if ($queryName) {
            $mapping[$queryName] = $name
        }
    }

    Write-Host "Collection mapping: $($mapping | ConvertTo-Json -Compress)"

    # Write mapping to cache
    $body = @{ data = $mapping } | ConvertTo-Json -Depth 10 -Compress

    $headers = @{
        "Authorization" = "Bearer $CacheApiKey"
        "Content-Type" = "application/json"
    }

    try {
        $response = Invoke-RestMethod -Uri "${CacheApiUrl}/config/collections" -Method Post -Headers $headers -Body $body
        Write-Host "Successfully updated collection mapping"
        Write-Host ($response | ConvertTo-Json -Compress)
        return $true
    }
    catch {
        Write-Error "Failed to update collection mapping: $_"
        return $false
    }
}

# Main execution
if ($Collection) {
    # Refresh specific collection
    if (-not $collections.ContainsKey($Collection)) {
        $validCollections = $collections.Keys -join ", "
        Write-Error "Unknown collection '$Collection'. Valid collections: $validCollections"
        exit 1
    }

    # v1 GraphQL
    if (-not $V2Only) {
        $success = Refresh-Collection -Name $Collection -Config $collections[$Collection]
        if (-not $success) { exit 1 }
    }

    # v2 REST
    if (-not $V1Only) {
        $success = Refresh-CollectionV2 -Name $Collection
        if (-not $success) { 
            Write-Warning "v2 refresh failed for $Collection, but continuing..."
        }
    }
}
else {
    # Refresh all collections

    # v1 GraphQL
    if (-not $V2Only) {
        foreach ($name in $collections.Keys) {
            $success = Refresh-Collection -Name $name -Config $collections[$name]
            if (-not $success) { exit 1 }
        }

        # Update v1 collection mapping
        $success = Update-CollectionMapping
        if (-not $success) { exit 1 }
    }

    # v2 REST
    if (-not $V1Only) {
        foreach ($name in $collections.Keys) {
            $success = Refresh-CollectionV2 -Name $name
            if (-not $success) { 
                Write-Warning "v2 refresh failed for $name, but continuing..."
            }
        }
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Cache refresh complete"
Write-Host "=========================================="
