# Micro Photo JSON Processor
# Script to manipulate microphotos.json and extract thumbnail images, URLs, and alt text

param(
    [Parameter(Mandatory=$false)]
    [string]$InputUri = "https://micro.edwardjensen.net/photos/index.json",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "./_data/microphotos.json",
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowResults,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateCSV,
    
    [Parameter(Mandatory=$false)]
    [string]$CSVFile = "./_data/microphotos_data.csv"
)

# Function to extract alt text from content_html
function Get-AltText {
    param([string]$ContentHtml)
    
    # Use regex to find alt text in img tags
    $altPattern = 'alt="([^"]*)"'
    $altMatches = [regex]::Matches($ContentHtml, $altPattern)
    
    if ($altMatches.Count -gt 0) {
        # Return the first alt text found, cleaned up
        $altText = $altMatches[0].Groups[1].Value
        # Clean up escaped quotes and other HTML entities
        $altText = $altText -replace '\\"', '"'
        $altText = $altText -replace '&quot;', '"'
        $altText = $altText -replace '&amp;', '&'
        $altText = $altText -replace '&lt;', '<'
        $altText = $altText -replace '&gt;', '>'
        # Remove markdown code block markers if present
        $altText = $altText -replace '```', ''
        $altText = $altText -replace '&10;', ' '
        $altText = $altText.Trim()
        return $altText
    }
    
    return ""
}

# Function to process the JSON and extract required data
function Get-ProcessedMicroPhotos {
    param([string]$Uri)
    
    try {
        Write-Host "Fetching JSON from: $Uri" -ForegroundColor Green
        
        # Fetch JSON from URI
        $response = Invoke-RestMethod -Uri $Uri -Method Get -ContentType "application/json"
        
        $processedItems = @()
        $itemCount = 0
        
        Write-Host "Processing $($response.items.Count) items..." -ForegroundColor Yellow
        
        foreach ($item in $response.items) {
            $itemCount++
            Write-Progress -Activity "Processing items" -Status "Item $itemCount of $($response.items.Count)" -PercentComplete (($itemCount / $response.items.Count) * 100)
            
            # Extract alt text from content_html
            $altText = Get-AltText -ContentHtml $item.content_html
            
            # Create content preview with safe string handling (full content, not truncated)
            $cleanContent = $item.content_html -replace '<[^>]+>', ''
            $cleanContent = $cleanContent.Trim()
            $contentPreview = if ($cleanContent.Length -gt 0) { 
                $cleanContent 
            } else {
                "No text content"
            }
            
            # Create processed item object
            $processedItem = [PSCustomObject]@{
                id = $item.id
                url = $item.url
                date_published = $item.date_published
                thumbnail_url = $item._microblog.thumbnail_url
                image_url = $item.image
                alt_text = $altText
                content_preview = $contentPreview
            }
            
            $processedItems += $processedItem
        }
        
        Write-Progress -Activity "Processing items" -Completed
        
        return $processedItems
    }
    catch {
        Write-Error "Error fetching or processing JSON from URI: $_"
        return $null
    }
}

# Function to save processed data as JSON
function Save-ProcessedJSON {
    param(
        [array]$ProcessedData,
        [string]$OutputPath
    )
    
    try {
        $outputObject = [PSCustomObject]@{
            processed_date = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
            total_items = $ProcessedData.Count
            items = $ProcessedData
        }
        
        $jsonOutput = $outputObject | ConvertTo-Json -Depth 10
        $jsonOutput | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Host "Processed JSON saved to: $OutputPath" -ForegroundColor Green
    }
    catch {
        Write-Error "Error saving JSON file: $_"
    }
}

# Function to save processed data as CSV
function Save-ProcessedCSV {
    param(
        [array]$ProcessedData,
        [string]$CSVPath
    )
    
    try {
        $ProcessedData | Export-Csv -Path $CSVPath -NoTypeInformation -Encoding UTF8
        Write-Host "Processed CSV saved to: $CSVPath" -ForegroundColor Green
    }
    catch {
        Write-Error "Error saving CSV file: $_"
    }
}

# Main execution
Write-Host "Micro Photo JSON Processor" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Validate URI format
try {
    $uri = [System.Uri]$InputUri
    if (-not ($uri.Scheme -eq "http" -or $uri.Scheme -eq "https")) {
        Write-Error "Invalid URI scheme. Only HTTP and HTTPS are supported."
        exit 1
    }
}
catch {
    Write-Error "Invalid URI format: $InputUri"
    exit 1
}

# Process the data
$processedData = Get-ProcessedMicroPhotos -Uri $InputUri

if ($processedData -and $processedData.Count -gt 0) {
    Write-Host "`nProcessing completed successfully!" -ForegroundColor Green
    Write-Host "Total items processed: $($processedData.Count)" -ForegroundColor Yellow
    
    # Save processed JSON
    Save-ProcessedJSON -ProcessedData $processedData -OutputPath $OutputFile
    
    # Save CSV if requested
    if ($GenerateCSV) {
        Save-ProcessedCSV -ProcessedData $processedData -CSVPath $CSVFile
    }
    
    # Show results if requested
    if ($ShowResults) {
        Write-Host "`nSample of processed data:" -ForegroundColor Cyan
        $processedData | Select-Object -First 3 | Format-Table -AutoSize
        
        Write-Host "`nSummary Statistics:" -ForegroundColor Cyan
        Write-Host "Items with alt text: $(($processedData | Where-Object { $_.alt_text -ne '' }).Count)"
        Write-Host "Items with thumbnail URLs: $(($processedData | Where-Object { $_.thumbnail_url -ne $null }).Count)"
        Write-Host "Items with image URLs: $(($processedData | Where-Object { $_.image_url -ne $null }).Count)"
    }
    
    Write-Host "`nDone!" -ForegroundColor Green
} else {
    Write-Error "Failed to process data or no items found."
    exit 1
}