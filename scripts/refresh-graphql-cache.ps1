# Refresh all GraphQL cache collections from CMS
# Prerequisites: Tailscale connected
#
# Usage:
#   ./scripts/refresh-graphql-cache.ps1 -CacheApiKey "key"                      # Refresh all collections
#   ./scripts/refresh-graphql-cache.ps1 -CacheApiKey "key" -Collection photography  # Refresh single collection

param(
    [Parameter(Mandatory = $true)]
    [string]$CacheApiKey,

    [Parameter(Mandatory = $false)]
    [ValidateSet("posts", "photography", "working_notes", "historic_posts", "pages")]
    [string]$Collection = "",

    [Parameter(Mandatory = $false)]
    [string]$CmsGraphqlUrl = "https://www-ts.edwardjensencms.com/api/graphql",

    [Parameter(Mandatory = $false)]
    [string]$CacheApiUrl = "https://graphql.edwardjensen.net"
)

$collections = @{
    posts = @{
        queryName = "Posts"
        fields = "id title slug date categories { category } tags { tag } image { url alt filename } imageAlt excerpt showImage renderWithLiquid postCredits landingFeatured redirectFrom { path } content markdown permalink sitemap updatedAt createdAt"
        sort = "-date"
    }
    photography = @{
        queryName = "Photographies"
        fields = "id title slug date image { url alt filename } imageAlt tags { tag } content exifCamera exifLens exifFocalLength exifAperture exifShutterSpeed exifIso locationLat locationLng locationName locationFormatted locationCity locationCountry permalink sitemap updatedAt createdAt"
        sort = "-date"
    }
    working_notes = @{
        queryName = "WorkingNotes"
        fields = "id title slug date tags { tag } content markdown permalink sitemap updatedAt createdAt"
        sort = "-date"
    }
    historic_posts = @{
        queryName = "HistoricPosts"
        fields = "id title slug date tags { tag } content markdown permalink sitemap updatedAt createdAt"
        sort = "-date"
    }
    pages = @{
        queryName = "Pages"
        fields = "id title slug permalink searchable sitemap image { url alt filename } imageAlt content markdown redirectFrom { path } updatedAt createdAt"
        sort = "title"
    }
}

function Refresh-Collection {
    param(
        [string]$Name,
        [hashtable]$Config
    )

    Write-Host ""
    Write-Host "=========================================="
    Write-Host "Refreshing: $Name"
    Write-Host "=========================================="

    $query = "query { $($Config.queryName)(where: { _status: { equals: published } }, limit: 0, sort: `"$($Config.sort)`") { docs { $($Config.fields) } totalDocs } }"

    # Fetch from CMS
    $body = @{ query = $query } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri $CmsGraphqlUrl -Method Post -ContentType "application/json" -Body $body
    }
    catch {
        Write-Error "Failed to fetch from CMS: $_"
        exit 1
    }

    # Extract data
    $data = $response.data.$($Config.queryName)
    $docCount = $data.docs.Count

    Write-Host "Fetched $docCount documents"

    # Write to cache
    $cacheBody = @{ data = $data } | ConvertTo-Json -Depth 100 -Compress

    $headers = @{
        "Authorization" = "Bearer $CacheApiKey"
        "Content-Type" = "application/json"
    }

    try {
        $cacheResponse = Invoke-RestMethod -Uri "$CacheApiUrl/refresh/$Name" -Method Post -Headers $headers -Body $cacheBody
        Write-Host ($cacheResponse | ConvertTo-Json -Compress)
    }
    catch {
        Write-Error "Failed to write to cache: $_"
        exit 1
    }
}

# Determine which collections to refresh
if ($Collection) {
    if (-not $collections.ContainsKey($Collection)) {
        Write-Error "Unknown collection '$Collection'. Valid: $($collections.Keys -join ', ')"
        exit 1
    }
    $targetCollections = @($Collection)
}
else {
    $targetCollections = @("posts", "photography", "working_notes", "historic_posts", "pages")
}

# Refresh each collection
foreach ($name in $targetCollections) {
    Refresh-Collection -Name $name -Config $collections[$name]
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Cache refresh complete!"
Write-Host "=========================================="
