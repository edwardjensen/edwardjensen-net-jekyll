# Sitemap Generator Plugin

Custom Jekyll plugin for generating XML sitemaps, replacing the abandoned `jekyll-sitemap` gem (last updated 2019).

---

## Overview

The sitemap generator creates a sitemaps.org-compliant XML sitemap and a `robots.txt` file that references it. The plugin follows modern SEO guidance by generating only `<loc>` and `<lastmod>` elements (no `<priority>` or `<changefreq>`).

---

## Key Files

| File | Purpose |
|------|---------|
| `_plugins/sitemap_generator.rb` | Main generator plugin |
| `_data/sitemap.yml` | Configuration file |
| `robots.txt` | Static file with Liquid templating for sitemap URL |

---

## Configuration

Configuration is stored in `_data/sitemap.yml`:

```yaml
# Sitemap generator configuration
output_path: /sitemap.xml

# Patterns to exclude (glob matching)
exclude_patterns:
  - "/feeds/*.json"   # Exclude JSON feed files from sitemap
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `output_path` | `/sitemap.xml` | Output path for the sitemap file |
| `exclude_patterns` | `[]` | Glob patterns for URLs to exclude |

---

## What Gets Included

The plugin automatically collects entries from:

1. **Site pages** (`site.pages`) - Static HTML pages
2. **Collection documents** - From collections with `output: true`:
   - CMS collections: `posts`, `working_notes`, `historic_posts`, `pages`
   - File collections: `photography`, `portfolio`, `featured-tags`

---

## What Gets Excluded

The plugin automatically excludes:

### Front Matter Exclusions
- Entries with `sitemap: false`
- Entries with `searchable: false` (unless `sitemap: true` is also set)

### Content Type Exclusions
- Draft/unpublished CMS content (`_status == 'draft'`)
- Pagination pages (URLs containing `/page/`)

### File Type Exclusions
- Non-HTML files: `.css`, `.js`, `.json`, `.xml`, `.xsl`, `.txt`, `.ico`
- Image files: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`
- Font files: `.woff`, `.woff2`, `.ttf`, `.eot`

### Special File Exclusions
- `404.html`
- `_redirects`
- `robots.txt`

### Pattern-Based Exclusions
- URLs matching patterns in `exclude_patterns` config (glob matching)

---

## Override Behavior

An explicit `sitemap: true` in front matter **overrides** the `searchable: false` exclusion.

### Use Case

This allows pages to appear in the sitemap for search engine indexing while remaining excluded from the site's internal search functionality.

### Example

```yaml
---
title: "Hidden Page"
searchable: false  # Won't appear in site search
sitemap: true      # WILL appear in sitemap
---
```

### Logic Flow

```
if sitemap: false → EXCLUDE
if searchable: false AND sitemap != true → EXCLUDE
otherwise → INCLUDE
```

---

## Date Handling (`<lastmod>`)

The plugin determines the last modification date with the following priority:

1. `updatedAt` - CMS updated timestamp (most accurate for CMS content)
2. `date` - Publication date from front matter
3. `site.time` - Build time (fallback for undated pages)

Dates are formatted in ISO 8601 with timezone: `2025-12-19T09:00:00-06:00`

---

## Output Format

The generated sitemap follows the sitemaps.org XML schema:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.edwardjensen.net/posts/2025/2025-12/the-build-ii</loc>
    <lastmod>2025-12-19T09:00:00-06:00</lastmod>
  </url>
  <!-- ... more entries ... -->
</urlset>
```

---

## robots.txt

The `robots.txt` file in the project root uses Liquid templating to generate the full sitemap URL:

```
---
---
Sitemap: {{ "sitemap.xml" | absolute_url }}
```

This outputs:

```
Sitemap: https://www.edwardjensen.net/sitemap.xml
```

---

## Plugin Architecture

The plugin consists of two classes:

### `SitemapGenerator < Generator`

Main generator class that:
- Runs with `priority :lowest` (after all other generators)
- Collects entries from pages and collections
- Filters based on exclusion rules
- Builds XML content
- Adds a virtual `SitemapPage` to the site

### `SitemapPage < Page`

Virtual page class that:
- Holds the generated XML content
- Sets `layout: nil` (no layout processing)
- Sets `sitemap: false` (prevents self-reference)
- Overrides `read_yaml` to prevent disk reads

---

## Comparison with jekyll-sitemap

| Feature | jekyll-sitemap | Custom Plugin |
|---------|---------------|---------------|
| `<loc>` | Yes | Yes |
| `<lastmod>` | Yes | Yes |
| `<changefreq>` | Yes | No (not recommended) |
| `<priority>` | Yes | No (not recommended) |
| `searchable: false` support | No | Yes |
| `sitemap: true` override | No | Yes |
| CMS `updatedAt` support | No | Yes |
| Glob exclude patterns | No | Yes |
| Active maintenance | No (abandoned 2019) | Yes |

---

## Testing

After making changes:

```bash
# Build the site
bundle exec jekyll build

# Check the generated sitemap
cat _site/sitemap.xml

# Check robots.txt
cat _site/robots.txt

# Verify entry count in build log
# Look for: "Sitemap: Generated XX entries"
```

---

## CMS Integration

To enable the `sitemap: true` override behavior for CMS-managed content, the `sitemap` field must be added to Payload CMS collections and configured in Jekyll.

### Payload CMS Schema Changes

Add a `sitemap` checkbox field to each CMS collection that needs sitemap control:

**Collections to update**: `Posts`, `WorkingNotes`, `HistoricPosts`, `Pages`

```typescript
// In each collection's fields array (e.g., Posts.ts, WorkingNotes.ts, etc.)
{
  name: 'sitemap',
  type: 'checkbox',
  label: 'Include in Sitemap',
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'Include this page in the XML sitemap. Overrides "searchable: false" exclusion.',
  },
}
```

**Field placement**: Add to the sidebar group alongside other metadata fields like `searchable`.

**Default value**: `true` - pages are included in sitemap by default unless explicitly excluded.

### Jekyll `_config.yml` Changes

Add `sitemap` to the `fields` list for each CMS collection in `_config.yml`:

```yaml
collections:
  posts:
    output: true
    permalink: /:collection/:year/:year-:month/:title
    cms:
      collection: "Posts"
      layout: "single-post"
      fields:
        - id
        - title
        - slug
        - date
        # ... other fields ...
        - searchable
        - sitemap        # ADD THIS FIELD
        - updatedAt
        - createdAt

  working_notes:
    cms:
      collection: "WorkingNotes"
      fields:
        # ... other fields ...
        - sitemap        # ADD THIS FIELD

  historic_posts:
    cms:
      collection: "HistoricPosts"
      fields:
        # ... other fields ...
        - sitemap        # ADD THIS FIELD

  pages:
    cms:
      collection: "Pages"
      fields:
        # ... other fields ...
        - searchable
        - sitemap        # ADD THIS FIELD
```

### GraphQL Query

The `payload_cms.rb` plugin will automatically include the `sitemap` field in GraphQL queries when listed in the `fields` configuration. No additional plugin changes required.

### Use Cases

| Scenario | `searchable` | `sitemap` | In Site Search | In Sitemap |
|----------|--------------|-----------|----------------|------------|
| Normal page | `true` (default) | `true` (default) | Yes | Yes |
| Hidden from search only | `false` | `true` | No | Yes |
| Hidden from both | `false` | `false` | No | No |
| Search only (unusual) | `true` | `false` | Yes | No |

### Migration Notes

For existing content:
- New `sitemap` field defaults to `true`, so existing content will continue to appear in sitemap
- Pages with `searchable: false` that should appear in sitemap need `sitemap: true` set explicitly
- No data migration required; new field uses sensible default

---

## Related Documentation

- [RSS Feed Generator](./rss-feed-consolidation.md) - Similar plugin pattern for RSS feeds
- [Pagination Plugin](./pagination-plugin.md) - Similar plugin pattern for pagination
- [Content Schema](./content-schema.md) - CMS field reference documentation
- [CLAUDE.md](../../CLAUDE.md) - Main project documentation
