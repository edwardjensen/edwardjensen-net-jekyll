# Refresh GraphQL Cache
#
# Updates the Cloudflare KV cache with fresh data from the CMS.
# Requires Tailscale VPN connection for CMS access.
#
# Usage:
#   ./scripts/refresh-graphql-cache.ps1                           # Refresh all collections
#   ./scripts/refresh-graphql-cache.ps1 -Collection posts         # Refresh only posts
#   ./scripts/refresh-graphql-cache.ps1 -Collection photography   # Refresh only photography
#
# Environment variables (for CI):
#   CMS_GRAPHQL_URL  - CMS GraphQL endpoint (default: Tailscale URL)
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
    [string]$CacheApiUrl = $env:CACHE_API_URL,

    [Parameter(Mandatory = $false)]
    [string]$CacheApiKey = $env:CACHE_API_KEY
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

Write-Host "GraphQL Cache Refresh"
Write-Host "CMS URL: $CmsGraphqlUrl"
Write-Host "Cache URL: $CacheApiUrl"
Write-Host "Discovered collections: $($collections.Keys -join ', ')"

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
    $success = Refresh-Collection -Name $Collection -Config $collections[$Collection]
    if (-not $success) { exit 1 }
}
else {
    # Refresh all collections
    foreach ($name in $collections.Keys) {
        $success = Refresh-Collection -Name $name -Config $collections[$name]
        if (-not $success) { exit 1 }
    }
}

# Always update collection mapping
$success = Update-CollectionMapping
if (-not $success) { exit 1 }

Write-Host ""
Write-Host "=========================================="
Write-Host "Cache refresh complete"
Write-Host "=========================================="
