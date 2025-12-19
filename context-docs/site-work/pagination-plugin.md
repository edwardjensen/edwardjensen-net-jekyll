# Project: Bespoke Pagination Plugin

## Overview

Replace `jekyll-paginate-v2` with a custom pagination plugin that can paginate any collection with arbitrary filtering. The primary driver is enabling pagination on featured tag pages, where posts must be filtered by a tag value specified in the page's front matter—something `jekyll-paginate-v2` cannot accomplish.

## Current State

### jekyll-paginate-v2 Limitations

The existing plugin has several constraints that prevent its use for featured tags:

1. **Static filter configuration**: Filters must be defined in `_config.yml`, not derived from page front matter
2. **Limited collection support**: Primarily designed for posts, with awkward workarounds for other collections
3. **No dynamic filtering**: Cannot filter collection A based on a value from page B
4. **Autopages feature**: Generates category/tag index pages, but these are separate from curated featured tag pages

### Current Pagination Configuration

```yaml
# _config.yml (current)
pagination:
  enabled: true
  per_page: 20
  limit: 0
  sort_field: 'date'
  sort_reverse: true
```

### The Featured Tag Problem

A featured tag page needs to:
1. Read its `tag` field from front matter (e.g., `tag: the-build`)
2. Filter the `posts` collection to only those with matching tag
3. Paginate the filtered results
4. Generate `/tags/the-build/`, `/tags/the-build/page/2/`, etc.

`jekyll-paginate-v2` cannot do step 1-2 dynamically per page.

---

## Requirements

### Functional Requirements

| Requirement | Description |
|-------------|-------------|
| **Collection-agnostic** | Paginate any Jekyll collection (posts, working_notes, photography, etc.) |
| **Dynamic filtering** | Filter based on front matter values from the paginating page |
| **Field matching** | Support matching against array fields (tags) and scalar fields |
| **Configurable per-page** | Items per page configurable globally and per-page |
| **Sort control** | Sort by any field, ascending or descending |
| **URL structure** | Generate clean URLs (`/page/2/`, `/page/3/`, etc.) |
| **Template variables** | Expose pagination metadata to Liquid templates |

### Non-Functional Requirements

| Requirement | Description |
|-------------|-------------|
| **Performance** | Handle hundreds of posts without significant build time impact |
| **Compatibility** | Work with CMS-sourced and file-based collections |
| **Simplicity** | Configuration should be intuitive and minimal |
| **Backwards compatible** | Existing paginated pages should continue working |

---

## Design

### Configuration Approach

Pagination is configured in page front matter, with global defaults in `_config.yml`.

#### Global Defaults (`_config.yml`)

```yaml
pagination:
  per_page: 20
  sort_field: date
  sort_reverse: true  # Newest first
  page_path: /page/:num/  # URL pattern for page 2+
```

#### Page-Level Configuration (Front Matter)

```yaml
---
title: "The Build"
layout: featured-tag
tag: the-build

pagination:
  enabled: true
  collection: posts
  per_page: 10
  sort_field: date
  sort_reverse: false  # Oldest first for this series
  filter:
    field: tags        # Field in posts to check
    match: tag         # Front matter field in THIS page to match against
    # Effectively: posts where post.tags contains page.tag
---
```

#### Alternative Filter Syntax (Static Value)

```yaml
pagination:
  enabled: true
  collection: posts
  filter:
    field: categories
    value: "technology"  # Static value instead of referencing front matter
```

### URL Generation

| Page | URL |
|------|-----|
| Page 1 | `/tags/the-build/` (original page URL) |
| Page 2 | `/tags/the-build/page/2/` |
| Page 3 | `/tags/the-build/page/3/` |

The plugin generates virtual pages for page 2 onwards, each with the same layout and front matter as page 1.

### Template Variables

The plugin exposes a `paginator` object to Liquid templates:

```liquid
{% if paginator %}
  {% for post in paginator.items %}
    <!-- Render post -->
  {% endfor %}
  
  {% if paginator.total_pages > 1 %}
    <nav class="pagination">
      {% if paginator.previous_page %}
        <a href="{{ paginator.previous_page_path }}">← Previous</a>
      {% endif %}
      
      <span>Page {{ paginator.page }} of {{ paginator.total_pages }}</span>
      
      {% if paginator.next_page %}
        <a href="{{ paginator.next_page_path }}">Next →</a>
      {% endif %}
    </nav>
  {% endif %}
{% endif %}
```

#### Paginator Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `items` | Array | Items for current page |
| `page` | Integer | Current page number (1-indexed) |
| `total_pages` | Integer | Total number of pages |
| `total_items` | Integer | Total items across all pages |
| `per_page` | Integer | Items per page |
| `previous_page` | Integer/nil | Previous page number (nil if first) |
| `previous_page_path` | String/nil | URL to previous page |
| `next_page` | Integer/nil | Next page number (nil if last) |
| `next_page_path` | String/nil | URL to next page |
| `first_page_path` | String | URL to first page |
| `last_page_path` | String | URL to last page |

---

## Plugin Architecture

### Core Classes

```ruby
# _plugins/pagination_generator.rb

module Jekyll
  module Pagination
    class Generator < Jekyll::Generator
      safe true
      priority :low  # Run after CMS content is loaded

      def generate(site)
        @site = site
        @config = site.config['pagination'] || {}
        
        # Find all pages/documents with pagination enabled
        paginatable = find_paginatable_pages
        
        paginatable.each do |page|
          paginate_page(page)
        end
      end

      private

      def find_paginatable_pages
        pages = @site.pages.select { |p| pagination_enabled?(p) }
        docs = @site.collections.values.flat_map(&:docs).select { |d| pagination_enabled?(d) }
        pages + docs
      end

      def pagination_enabled?(page)
        config = page.data['pagination']
        config.is_a?(Hash) && config['enabled'] == true
      end

      def paginate_page(page)
        config = build_config(page)
        items = fetch_items(config, page)
        items = filter_items(items, config, page)
        items = sort_items(items, config)
        
        total_pages = (items.length.to_f / config[:per_page]).ceil
        total_pages = 1 if total_pages == 0
        
        # Page 1: inject paginator into original page
        page.data['paginator'] = build_paginator(
          items: items.first(config[:per_page]),
          page_num: 1,
          total_pages: total_pages,
          total_items: items.length,
          per_page: config[:per_page],
          base_path: page.url
        )
        
        # Pages 2+: generate virtual pages
        (2..total_pages).each do |page_num|
          start_idx = (page_num - 1) * config[:per_page]
          page_items = items.slice(start_idx, config[:per_page])
          
          virtual_page = PaginationPage.new(
            site: @site,
            base_page: page,
            page_num: page_num,
            items: page_items,
            total_pages: total_pages,
            total_items: items.length,
            per_page: config[:per_page]
          )
          
          @site.pages << virtual_page
        end
      end

      def build_config(page)
        page_config = page.data['pagination'] || {}
        {
          collection: page_config['collection'] || 'posts',
          per_page: page_config['per_page'] || @config['per_page'] || 20,
          sort_field: page_config['sort_field'] || @config['sort_field'] || 'date',
          sort_reverse: page_config.fetch('sort_reverse', @config.fetch('sort_reverse', true)),
          filter: page_config['filter']
        }
      end

      def fetch_items(config, page)
        collection = @site.collections[config[:collection]]
        return [] unless collection
        
        collection.docs.select { |doc| doc.data['_status'] != 'draft' }
      end

      def filter_items(items, config, page)
        filter = config[:filter]
        return items unless filter
        
        field = filter['field']
        match_value = if filter['match']
          page.data[filter['match']]
        else
          filter['value']
        end
        
        return items unless match_value
        
        items.select do |item|
          item_value = item.data[field]
          matches?(item_value, match_value)
        end
      end

      def matches?(item_value, match_value)
        case item_value
        when Array
          item_value.any? { |v| normalize(v) == normalize(match_value) }
        else
          normalize(item_value) == normalize(match_value)
        end
      end

      def normalize(value)
        # Handle tag objects like { 'tag' => 'value' }
        value = value['tag'] if value.is_a?(Hash) && value.key?('tag')
        value.to_s.downcase.strip
      end

      def sort_items(items, config)
        sorted = items.sort_by { |item| item.data[config[:sort_field]] || Time.at(0) }
        config[:sort_reverse] ? sorted.reverse : sorted
      end

      def build_paginator(items:, page_num:, total_pages:, total_items:, per_page:, base_path:)
        {
          'items' => items,
          'page' => page_num,
          'total_pages' => total_pages,
          'total_items' => total_items,
          'per_page' => per_page,
          'previous_page' => page_num > 1 ? page_num - 1 : nil,
          'previous_page_path' => page_num > 1 ? page_path(base_path, page_num - 1) : nil,
          'next_page' => page_num < total_pages ? page_num + 1 : nil,
          'next_page_path' => page_num < total_pages ? page_path(base_path, page_num + 1) : nil,
          'first_page_path' => base_path,
          'last_page_path' => page_path(base_path, total_pages)
        }
      end

      def page_path(base_path, page_num)
        return base_path if page_num == 1
        base_path.sub(/\/$/, '') + "/page/#{page_num}/"
      end
    end

    class PaginationPage < Jekyll::Page
      def initialize(site:, base_page:, page_num:, items:, total_pages:, total_items:, per_page:)
        @site = site
        @base = site.source
        
        # Determine output path
        base_url = base_page.url.sub(/\/$/, '')
        @dir = "#{base_url}/page/#{page_num}"
        @name = 'index.html'
        
        self.process(@name)
        
        # Copy front matter from base page
        self.data = base_page.data.dup
        self.data['paginator'] = {
          'items' => items,
          'page' => page_num,
          'total_pages' => total_pages,
          'total_items' => total_items,
          'per_page' => per_page,
          'previous_page' => page_num > 1 ? page_num - 1 : nil,
          'previous_page_path' => page_num > 1 ? page_path(base_page.url, page_num - 1) : nil,
          'next_page' => page_num < total_pages ? page_num + 1 : nil,
          'next_page_path' => page_num < total_pages ? page_path(base_page.url, page_num + 1) : nil,
          'first_page_path' => base_page.url,
          'last_page_path' => page_path(base_page.url, total_pages)
        }
        
        # Use same layout as base page
        self.content = base_page.content
      end

      private

      def page_path(base_path, page_num)
        return base_path if page_num == 1
        base_path.sub(/\/$/, '') + "/page/#{page_num}/"
      end
    end
  end
end
```

---

## Migration Plan

### Phase 1: Plugin Development

1. Create `_plugins/pagination_generator.rb`
2. Test with a simple case (paginate all posts on `/writing/`)
3. Test with filtered case (featured tag page)
4. Verify CMS-sourced content works correctly

### Phase 2: Template Updates

1. Create `_includes/components/pagination.html` component
2. Update `_layouts/featured-tag.html` to use new paginator
3. Update `_layouts/writing-base.html` if currently paginated
4. Update any other paginated layouts

### Phase 3: Configuration Migration

1. Update featured tag pages with pagination front matter
2. Update writing index with pagination front matter
3. Test all paginated pages on staging

### Phase 4: Cleanup

1. Remove `jekyll-paginate-v2` from Gemfile
2. Remove old pagination configuration from `_config.yml`
3. Update documentation
4. Deploy to production

---

## Configuration Examples

### Featured Tag Page

```yaml
---
title: "The Build"
layout: featured-tag
tag: the-build
image: https://assets.edwardjensen.net/media/202512-thebuild.jpeg
image_alt: "The Build series header"

pagination:
  enabled: true
  collection: posts
  per_page: 10
  sort_field: date
  sort_reverse: false  # Oldest first (chronological series)
  filter:
    field: tags
    match: tag  # Match posts where tags contains this page's `tag` value
---
```

### Writing Index

```yaml
---
title: "Writing"
layout: writing-base
permalink: /writing/

pagination:
  enabled: true
  collection: posts
  per_page: 20
  sort_field: date
  sort_reverse: true  # Newest first
---
```

### Working Notes Index

```yaml
---
title: "Working Notes"
layout: working-notes
permalink: /notes/

pagination:
  enabled: true
  collection: working_notes
  per_page: 30
  sort_field: date
  sort_reverse: true
---
```

### Photography Index (Future)

```yaml
---
title: "Photography"
layout: photography-index
permalink: /photos/

pagination:
  enabled: true
  collection: photography
  per_page: 24  # 4x6 grid
  sort_field: date
  sort_reverse: true
---
```

### Category Filter Example

```yaml
---
title: "Technology Posts"
layout: writing-base
permalink: /writing/technology/

pagination:
  enabled: true
  collection: posts
  per_page: 20
  filter:
    field: categories
    value: "technology"  # Static filter value
---
```

---

## Pagination Component

### `_includes/components/pagination.html`

```html
{% if paginator and paginator.total_pages > 1 %}
<nav aria-label="Pagination" class="flex items-center justify-between py-8 border-t border-slate-200 dark:border-slate-700">
  <div class="flex-1">
    {% if paginator.previous_page %}
      <a href="{{ paginator.previous_page_path }}" 
         class="link-accent inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Previous
      </a>
    {% endif %}
  </div>
  
  <div class="flex items-center gap-2">
    {% for page_num in (1..paginator.total_pages) %}
      {% if page_num == paginator.page %}
        <span class="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
          {{ page_num }}
        </span>
      {% elsif page_num == 1 %}
        <a href="{{ paginator.first_page_path }}" class="px-3 py-1 text-muted hover:text-body rounded">
          {{ page_num }}
        </a>
      {% elsif page_num == paginator.total_pages %}
        <a href="{{ paginator.last_page_path }}" class="px-3 py-1 text-muted hover:text-body rounded">
          {{ page_num }}
        </a>
      {% elsif page_num >= paginator.page | minus: 2 and page_num <= paginator.page | plus: 2 %}
        {% assign page_path = paginator.first_page_path | append: "page/" | append: page_num | append: "/" %}
        <a href="{{ page_path }}" class="px-3 py-1 text-muted hover:text-body rounded">
          {{ page_num }}
        </a>
      {% elsif page_num == paginator.page | minus: 3 or page_num == paginator.page | plus: 3 %}
        <span class="text-muted">…</span>
      {% endif %}
    {% endfor %}
  </div>
  
  <div class="flex-1 text-right">
    {% if paginator.next_page %}
      <a href="{{ paginator.next_page_path }}" 
         class="link-accent inline-flex items-center gap-2">
        Next
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>
    {% endif %}
  </div>
</nav>
{% endif %}
```

---

## Testing Checklist

### Functionality

- [ ] Pagination generates correct number of pages
- [ ] Page 1 URL is original page URL (no `/page/1/`)
- [ ] Page 2+ URLs follow `/page/N/` pattern
- [ ] Items are correctly filtered by tag
- [ ] Items are correctly sorted
- [ ] Paginator object contains all expected properties
- [ ] Previous/next links work correctly
- [ ] First and last page links work correctly

### Edge Cases

- [ ] Zero matching items (should show empty state, no pagination)
- [ ] Fewer items than per_page (single page, no pagination nav)
- [ ] Exactly per_page items (single page)
- [ ] per_page + 1 items (two pages)
- [ ] Large collection (50+ pages)
- [ ] Multiple paginated pages in same build

### Integration

- [ ] Works with CMS-sourced content
- [ ] Works with file-based content
- [ ] Works with featured tags (post-CMS-migration)
- [ ] Works with writing index
- [ ] Works with working notes index
- [ ] SEO: canonical URLs correct
- [ ] SEO: prev/next link relations (optional enhancement)

### Performance

- [ ] Build time acceptable with pagination enabled
- [ ] No memory issues with large collections

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `_plugins/pagination_generator.rb` | Core pagination plugin |
| `_includes/components/pagination.html` | Pagination UI component |

### Modified Files

| File | Changes |
|------|---------|
| `Gemfile` | Remove `jekyll-paginate-v2` |
| `_config.yml` | Update pagination config, remove old settings |
| `_layouts/featured-tag.html` | Add paginator loop and component |
| `_layouts/writing-base.html` | Update to use new paginator |
| `_layouts/working-notes.html` | Update to use new paginator |
| Featured tag front matter | Add pagination configuration |
| Writing index front matter | Add pagination configuration |

---

## Rollback Plan

If issues arise:

1. Re-add `jekyll-paginate-v2` to Gemfile
2. Restore old pagination configuration in `_config.yml`
3. Remove new plugin file
4. Revert layout changes
5. Deploy hotfix

---

## Future Enhancements

1. **SEO link relations**: Add `<link rel="prev">` and `<link rel="next">` to head
2. **Infinite scroll**: AlpineJS-based "load more" as alternative to traditional pagination
3. **Configurable URL pattern**: Allow customisation of `/page/:num/` pattern
4. **Multiple filters**: Support AND/OR combinations of filters
5. **Offset/start page**: For edge cases where page 1 should skip items

---

## Dependencies

- **Featured Tags CMS Migration**: Should be complete so filtering works with CMS-sourced tags
- **RSS Plugin**: No dependency, but pagination affects item counts visible on index pages

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Plugin Development | 3-4 hours |
| Template Updates | 1-2 hours |
| Configuration Migration | 1 hour |
| Testing | 1-2 hours |
| Documentation | 30 minutes |
| **Total** | **7-10 hours** |
