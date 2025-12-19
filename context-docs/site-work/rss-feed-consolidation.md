# Project: RSS Feed Plugin Consolidation

**Status: COMPLETED** (December 2025)

## Overview

Replaced hand-crafted Liquid templates in `_feeds/` with a unified Jekyll plugin (`_plugins/rss_feed_generator.rb`) that generates RSS feeds based on configuration in `_config.yml`. This consolidates the approach previously used by `featured_tag_feeds.rb` and applies it globally.

### What Was Implemented

- Created `_plugins/rss_feed_generator.rb` using the Ruby `builder` gem for XML generation
- Added `rss_feeds:` configuration section to `_config.yml`
- Removed Liquid templates: `site-feed.xml`, `feed-essays.xml`, `feed-notes.xml`
- Removed old plugin: `featured_tag_feeds.rb`
- Removed old layout: `featured-tag-feed.xml`
- Kept JSON feeds as Liquid templates (out of scope)

---

## Original Planning Document (for reference)

## Current State

### Feed Generation Methods

| Feed | Method | Source File |
|------|--------|-------------|
| Main RSS (`/feed.xml`) | Liquid template | `_feeds/feed.xml` (assumed) |
| Essays RSS | Liquid template | `_feeds/feed-essays.xml` |
| Notes RSS | Liquid template | `_feeds/feed-notes.xml` |
| Notes JSON | Liquid template | `_feeds/feed-notes.json` |
| Site JSON | Liquid template | `_feeds/site-feed.json` |
| Featured Tag RSS | Plugin | `_plugins/featured_tag_feeds.rb` |

### Current Plugin Approach (`featured_tag_feeds.rb`)

The existing plugin iterates over the `featured-tags` collection and generates an RSS feed for each tag by:

1. Hooking into Jekyll's `site.after_init` or page generation
2. Creating virtual Page objects with RSS XML content
3. Writing to `/feeds/{tag-slug}.xml`

## Target State

### Unified Configuration in `_config.yml`

```yaml
rss_feeds:
  defaults:
    author: "Edward Jensen"
    language: "en-GB"
    copyright: "© Edward Jensen. All rights reserved."
    webmaster: "webmaster@edwardjensen.net"
    ttl: 1440  # 24 hours in minutes
    
  feeds:
    # Main site feed (all posts)
    - id: main
      title: "Edward Jensen"
      description: "Exploring the Nonprofit IT Landscape: Insights and Reflections"
      path: /feed.xml
      collection: posts
      limit: 20
      
    # Essays only
    - id: essays
      title: "Edward Jensen - Essays"
      description: "Long-form writing on nonprofit technology and civic engagement"
      path: /feeds/feed-essays.xml
      collection: posts
      limit: 20
      
    # Working notes
    - id: notes
      title: "Edward Jensen - Working Notes"
      description: "Short-form thoughts and reflections"
      path: /feeds/feed-notes.xml
      collection: working_notes
      limit: 30
      
    # Historic posts (if desired)
    - id: archive
      title: "Edward Jensen - Archive"
      description: "Historic posts from the archive"
      path: /feeds/feed-archive.xml
      collection: historic_posts
      limit: 50
      enabled: false  # Set to true to enable
      
  # Dynamic feeds generated per item in a collection
  dynamic_feeds:
    - id: featured-tags
      source_collection: featured_tags
      title_template: "Edward Jensen - {title}"
      description_field: markdown  # Use the markdown field for feed description
      path_template: /feeds/{tag}.xml
      target_collection: posts
      filter_field: tags
      match_field: tag
      limit: 20
```

### Configuration Schema

#### Static Feeds (`rss_feeds.feeds[]`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the feed |
| `title` | string | Yes | Feed title |
| `description` | string | Yes | Feed description |
| `path` | string | Yes | Output path (e.g., `/feed.xml`) |
| `collection` | string | Yes | Jekyll collection to source items from |
| `limit` | integer | No | Maximum items (default: 20) |
| `enabled` | boolean | No | Whether to generate (default: true) |
| `filter` | object | No | Filter criteria (future enhancement) |

#### Dynamic Feeds (`rss_feeds.dynamic_feeds[]`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `source_collection` | string | Yes | Collection to iterate for feed generation |
| `title_template` | string | Yes | Title with `{field}` placeholders |
| `description_field` | string | No | Field from source item for description |
| `path_template` | string | Yes | Path with `{field}` placeholders |
| `target_collection` | string | Yes | Collection to filter for feed items |
| `filter_field` | string | Yes | Field in target items to match against |
| `match_field` | string | Yes | Field in source item to match with |
| `limit` | integer | No | Maximum items per feed (default: 20) |

---

## Plugin Architecture

### New Plugin: `_plugins/rss_feed_generator.rb`

```ruby
# _plugins/rss_feed_generator.rb
require 'builder'

module Jekyll
  class RssFeedGenerator < Generator
    safe true
    priority :low

    def generate(site)
      config = site.config['rss_feeds']
      return unless config

      defaults = config['defaults'] || {}
      
      # Generate static feeds
      (config['feeds'] || []).each do |feed_config|
        next if feed_config['enabled'] == false
        generate_static_feed(site, feed_config, defaults)
      end

      # Generate dynamic feeds
      (config['dynamic_feeds'] || []).each do |dynamic_config|
        generate_dynamic_feeds(site, dynamic_config, defaults)
      end
    end

    private

    def generate_static_feed(site, config, defaults)
      collection = site.collections[config['collection']]
      return unless collection

      items = collection.docs
        .select { |doc| doc.data['_status'] != 'draft' }
        .sort_by { |doc| doc.data['date'] || Time.now }
        .reverse
        .first(config['limit'] || 20)

      feed_content = build_rss_xml(
        site: site,
        title: config['title'],
        description: config['description'],
        link: site.config['url'] + config['path'],
        items: items,
        defaults: defaults
      )

      site.pages << RssFeedPage.new(site, config['path'], feed_content)
    end

    def generate_dynamic_feeds(site, config, defaults)
      source_collection = site.collections[config['source_collection']]
      target_collection = site.collections[config['target_collection']]
      return unless source_collection && target_collection

      source_collection.docs.each do |source_doc|
        next if source_doc.data['_status'] == 'draft'

        match_value = source_doc.data[config['match_field']]
        next unless match_value

        # Filter target items by matching field
        items = target_collection.docs
          .select { |doc| doc.data['_status'] != 'draft' }
          .select { |doc| 
            field_value = doc.data[config['filter_field']]
            case field_value
            when Array
              field_value.any? { |v| matches?(v, match_value) }
            else
              matches?(field_value, match_value)
            end
          }
          .sort_by { |doc| doc.data['date'] || Time.now }
          .reverse
          .first(config['limit'] || 20)

        # Build path from template
        path = config['path_template'].gsub(/\{(\w+)\}/) do
          source_doc.data[$1] || $1
        end

        # Build title from template
        title = config['title_template'].gsub(/\{(\w+)\}/) do
          source_doc.data[$1] || $1
        end

        # Get description from specified field
        description = source_doc.data[config['description_field']] || 
                      source_doc.content || 
                      title

        feed_content = build_rss_xml(
          site: site,
          title: title,
          description: strip_html(description),
          link: site.config['url'] + path,
          items: items,
          defaults: defaults
        )

        site.pages << RssFeedPage.new(site, path, feed_content)
      end
    end

    def matches?(field_value, match_value)
      # Handle nested tag objects (e.g., { 'tag' => 'value' })
      actual_value = field_value.is_a?(Hash) ? field_value['tag'] : field_value
      actual_value.to_s.downcase == match_value.to_s.downcase
    end

    def build_rss_xml(site:, title:, description:, link:, items:, defaults:)
      xml = Builder::XmlMarkup.new(indent: 2)
      xml.instruct! :xml, version: '1.0', encoding: 'UTF-8'
      
      xml.rss(version: '2.0', 
              'xmlns:atom' => 'http://www.w3.org/2005/Atom',
              'xmlns:content' => 'http://purl.org/rss/1.0/modules/content/') do
        xml.channel do
          xml.title title
          xml.description description
          xml.link site.config['url']
          xml.tag!('atom:link', 
                   href: link, 
                   rel: 'self', 
                   type: 'application/rss+xml')
          xml.language defaults['language'] || 'en'
          xml.copyright defaults['copyright'] if defaults['copyright']
          xml.webMaster defaults['webmaster'] if defaults['webmaster']
          xml.ttl defaults['ttl'] || 1440
          xml.lastBuildDate Time.now.rfc2822
          
          items.each do |item|
            xml.item do
              xml.title item.data['title']
              xml.link site.config['url'] + item.url
              xml.guid site.config['url'] + item.url, isPermaLink: 'true'
              xml.pubDate (item.data['date'] || Time.now).rfc2822
              
              if item.data['excerpt']
                xml.description item.data['excerpt']
              end
              
              xml.tag!('content:encoded') do
                xml.cdata!(item.content || '')
              end
              
              # Add categories/tags
              (item.data['tags'] || []).each do |tag|
                tag_value = tag.is_a?(Hash) ? tag['tag'] : tag
                xml.category tag_value
              end
            end
          end
        end
      end

      xml.target!
    end

    def strip_html(content)
      content.to_s.gsub(/<[^>]*>/, '').strip
    end
  end

  class RssFeedPage < Page
    def initialize(site, path, content)
      @site = site
      @base = site.source
      @dir = File.dirname(path)
      @name = File.basename(path)
      
      self.process(@name)
      self.content = content
      self.data = {
        'layout' => nil,
        'sitemap' => false
      }
    end
  end
end
```

---

## Migration Steps

### Phase 1: Plugin Development

1. Create `_plugins/rss_feed_generator.rb` with core functionality
2. Add configuration schema to `_config.yml`
3. Test locally with a single static feed
4. Verify XML output matches current Liquid templates

### Phase 2: Static Feed Migration

1. Configure all static feeds in `_config.yml`
2. Compare generated output against existing Liquid templates
3. Ensure feed URLs remain unchanged
4. Validate feeds with an RSS validator

### Phase 3: Dynamic Feed Migration

1. Add dynamic feed configuration for featured tags
2. Remove `_plugins/featured_tag_feeds.rb`
3. Verify per-tag feeds generate correctly
4. Test with CMS-sourced featured tags (after that migration)

### Phase 4: Cleanup

1. Remove Liquid templates from `_feeds/` directory (except JSON feeds)
2. Update documentation
3. Test complete feed suite on staging
4. Deploy to production

---

## Files to Remove After Migration

| File | Replacement |
|------|-------------|
| `_feeds/feed.xml` | Plugin-generated `/feed.xml` |
| `_feeds/feed-essays.xml` | Plugin-generated `/feeds/feed-essays.xml` |
| `_feeds/feed-notes.xml` | Plugin-generated `/feeds/feed-notes.xml` |
| `_plugins/featured_tag_feeds.rb` | Consolidated into `rss_feed_generator.rb` |

## Files to Keep

| File | Reason |
|------|--------|
| `_feeds/site-feed.json` | JSON Feed format, out of scope |
| `_feeds/feed-notes.json` | JSON Feed format, out of scope |

---

## Testing Checklist

### Feed Validation

- [ ] All feeds pass W3C Feed Validation Service
- [ ] Feed URLs are unchanged from current implementation
- [ ] Feed titles and descriptions are correct
- [ ] Item counts respect configured limits
- [ ] Dates are properly formatted (RFC 2822)
- [ ] Content is properly escaped/CDATA wrapped
- [ ] Categories/tags are included

### Feed Reader Testing

- [ ] Feeds parse correctly in Feedly
- [ ] Feeds parse correctly in NetNewsWire
- [ ] Feeds parse correctly in browser RSS viewer

### Integration Testing

- [ ] Main feed includes all published posts
- [ ] Essays feed includes only posts (not working notes)
- [ ] Notes feed includes only working notes
- [ ] Featured tag feeds filter correctly by tag
- [ ] Unpublished/draft content is excluded
- [ ] Feed regenerates on content publish

---

## Configuration Reference

### Minimal Configuration

```yaml
rss_feeds:
  feeds:
    - id: main
      title: "Edward Jensen"
      description: "Personal blog"
      path: /feed.xml
      collection: posts
```

### Full Configuration with All Options

```yaml
rss_feeds:
  defaults:
    author: "Edward Jensen"
    language: "en-GB"
    copyright: "© Edward Jensen. All rights reserved."
    webmaster: "webmaster@edwardjensen.net"
    ttl: 1440
    
  feeds:
    - id: main
      title: "Edward Jensen"
      description: "Exploring the Nonprofit IT Landscape"
      path: /feed.xml
      collection: posts
      limit: 20
      enabled: true
      
    - id: essays
      title: "Edward Jensen - Essays"
      description: "Long-form writing"
      path: /feeds/feed-essays.xml
      collection: posts
      limit: 20
      
    - id: notes
      title: "Edward Jensen - Working Notes"
      description: "Short-form thoughts"
      path: /feeds/feed-notes.xml
      collection: working_notes
      limit: 30
      
  dynamic_feeds:
    - id: featured-tags
      source_collection: featured_tags
      title_template: "Edward Jensen - {title}"
      description_field: markdown
      path_template: /feeds/{tag}.xml
      target_collection: posts
      filter_field: tags
      match_field: tag
      limit: 20
```

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Plugin Development | 2-3 hours |
| Static Feed Migration | 1-2 hours |
| Dynamic Feed Migration | 1 hour |
| Testing & Validation | 1-2 hours |
| Cleanup & Documentation | 30 minutes |
| **Total** | **6-9 hours** |

---

## Dependencies

- **Featured Tags CMS Migration**: Should be completed first so dynamic feeds work with CMS-sourced tags
- **Ruby Builder gem**: May need to add to Gemfile if not present (for XML generation)

---

## Future Enhancements

1. **Filter support**: Add ability to filter static feeds by field values (e.g., posts with specific category)
2. **Custom item fields**: Allow configuration of which fields appear in feed items
3. **Atom format**: Add option to generate Atom feeds alongside RSS
4. **JSON Feed generation**: Extend plugin to also handle JSON Feed format
