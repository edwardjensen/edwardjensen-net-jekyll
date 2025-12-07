param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "output.json"
)

try {
    # Read the input JSON file
    $inputJson = Get-Content -Path $InputPath -Raw | ConvertFrom-Json
    
    # Initialize array for results
    $results = @()
    
    # Process each item in the JSON array
    foreach ($item in $inputJson) {
        $url = $item.url
        
        if (-not $url) {
            Write-Warning "Skipping item without 'url' field"
            continue
        }
        
        $uri = [System.Uri]$url
        
        # Extract only the path (without domain)
        $path = $uri.AbsolutePath
        
        # Split the path by '/' and remove empty entries
        $segments = $path -split '/' | Where-Object { $_ -ne '' }
        
        # The slug is the second-to-last segment (before the trailing ID/number)
        if ($segments.Count -ge 2) {
            $slug = $segments[-2]
        } elseif ($segments.Count -eq 1) {
            $slug = $segments[0]
        } else {
            $slug = $null
        }
        
        # Create output object
        $results += @{
            url = $path
            slug = $slug
        }
    }
    
    # Convert to JSON and write to file (preserve array format even with single item)
    $results | ConvertTo-Json -AsArray | Out-File -FilePath $OutputPath -Encoding UTF8
    
    Write-Host "Processed $($results.Count) URL(s). JSON output written to: $OutputPath"
}
catch {
    Write-Error "Error processing file: $_"
}