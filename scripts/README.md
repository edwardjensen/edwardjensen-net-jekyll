# Micro Photo JSON Processor Scripts

This directory contains PowerShell scripts for processing and manipulating the `microphotos.json` file from a micro.blog feed.

## Files

- **`microphotojsonprocessor.ps1`** - Main processing script
- **`MicroPhotoUtils.ps1`** - Utility functions for common operations

## Main Script: microphotojsonprocessor.ps1

This script processes microphotos.json from a remote URI and extracts:

- Thumbnail image locations (`$items._microblog.thumbnail_url`)
- Links to posts on the micro.blog service (`$items.url`)
- Alt text from `$items.content_html`

### Usage

```powershell
# Basic usage - fetch from default micro.blog URI (run from project root)
./scripts/microphotojsonprocessor.ps1

# Specify custom URI
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json"

# Show processing results in console
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json" -ShowResults

# Generate CSV file in addition to JSON
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json" -GenerateCSV

# Custom output files
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json" -OutputFile "_data/my_photos.json" -CSVFile "_data/my_photos.csv"
```

### Parameters

- `-InputUri` - URI to fetch JSON from (default: `https://micro.edwardjensen.net/photos/index.json`)
- `-OutputFile` - Path for processed JSON output (default: `./_data/processed_microphotos.json`)
- `-ShowResults` - Display sample results and statistics in console
- `-GenerateCSV` - Also create a CSV file with the processed data
- `-CSVFile` - Custom path for CSV output (default: `./_data/microphotos_data.csv`)

### Output Format

The processed JSON contains:

```json
{
  "processed_date": "2025-06-15T10:30:00-05:00",
  "total_items": 25,
  "items": [
    {
      "id": "post-id",
      "url": "https://micro.edwardjensen.net/...",
      "date_published": "2025-04-11T17:47:42-05:00",
      "thumbnail_url": "https://micro.blog/photos/400/...",
      "image_url": "https://cdn.uploads.micro.blog/...",
      "alt_text": "Extracted alt text from the image",
      "content_preview": "First 100 characters of content..."
    }
  ]
}
```

## Utility Script: MicroPhotoUtils.ps1

Contains helper functions for common operations:

```powershell
# Load the utilities
. ./MicroPhotoUtils.ps1

# Get the 5 most recent micro photos
Get-RecentMicroPhotos -Count 5

# Get photos from a date range
Get-MicroPhotosByDate -StartDate "2025-03-01" -EndDate "2025-03-31"

# Get all alt texts and check which ones are missing
Get-MicroPhotoAltTexts | Where-Object { -not $_.HasAltText }

# Export data in Jekyll YAML format
Export-MicroPhotosForJekyll
```

### Available Functions

- **`Get-RecentMicroPhotos`** - Get the most recent N photos
- **`Get-MicroPhotosByDate`** - Filter photos by date range
- **`Get-MicroPhotoAltTexts`** - Extract and analyze alt text usage
- **`Export-MicroPhotosForJekyll`** - Convert to Jekyll-friendly YAML format

## Requirements

- PowerShell 5.1 or later
- Read access to the microphotos.json file
- Write access to the output directory

## Examples

### Find photos missing alt text

```powershell
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json" -ShowResults
# Look for "Items with alt text" in the output statistics
```

### Generate a CSV for spreadsheet analysis

```powershell
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json" -GenerateCSV -ShowResults
# Creates CSV file for analysis in Excel or similar
```

### Use in GitHub Actions

```powershell
./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json" -GenerateCSV
# Perfect for automated workflows - no local file dependencies
```

## Accessibility Checking Script: Check-Accessibility.ps1

This script runs pa11y accessibility audits on the Jekyll site as part of the development build process. It checks specified pages for WCAG compliance and can be integrated into your build pipeline.

### Accessibility Script Usage

```powershell
# Basic usage (checks default pages on localhost:4000)
./scripts/Check-Accessibility.ps1

# Check specific pages
./scripts/Check-Accessibility.ps1 -Pages @("/", "/writing", "/portfolio")

# Check production site and save JSON report
./scripts/Check-Accessibility.ps1 -SiteUrl "https://edwardjensen.com" -OutputFormat "json" -ReportFile "accessibility-report.json"

# Run checks without failing build on issues
./scripts/Check-Accessibility.ps1 -FailOnIssues $false

# Use different WCAG standard
./scripts/Check-Accessibility.ps1 -Standard "WCAG2AAA"
```

### NPM Scripts

The following npm scripts are available for convenience:

```bash
# Basic accessibility check
npm run a11y

# Check development site
npm run a11y:dev

# Check production site
npm run a11y:prod

# Generate JSON report
npm run a11y:report

# Run checks without failing on issues
npm run a11y:lenient
```

### Accessibility Script Parameters

- **`-SiteUrl`** - Base URL of the site to check (default: <http://localhost:4000>)
- **`-Pages`** - Array of specific pages to check (default: common pages)
- **`-OutputFormat`** - Output format: cli, csv, html, json (default: cli)
- **`-ReportFile`** - Optional file path to save the report
- **`-FailOnIssues`** - Exit with error if issues found (default: true)
- **`-Standard`** - WCAG standard: WCAG2A, WCAG2AA, WCAG2AAA (default: WCAG2AA)

### Integration with Build Process

To integrate with your Jekyll build process:

1. **Development**: Run `npm run a11y:dev` after starting Jekyll with `bundle exec jekyll serve`
2. **CI/CD**: Use `npm run a11y:prod` in your deployment pipeline
3. **Pre-commit**: Add `npm run a11y:dev` to your git pre-commit hooks

## Notes

- The script fetches JSON directly from the web, eliminating the need for local file management
- Perfect for GitHub Actions workflows - no intermediate file download steps required
- The script handles common HTML entities and escaped characters in alt text
- Alt text extraction uses regex to find the first `alt="..."` attribute in the content_html
- URI validation ensures only HTTP/HTTPS schemes are accepted
- All output files use UTF-8 encoding for proper character support
- Network timeouts and connection errors are handled gracefully
- Accessibility checks require the site to be running and accessible
- pa11y will be automatically installed if not present
