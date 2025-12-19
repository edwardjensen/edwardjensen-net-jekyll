# frozen_string_literal: true

require 'builder'
require 'cgi'

module Jekyll
  class RssFeedGenerator < Generator
    safe true
    priority :low

    def generate(site)
      @site = site
      config = site.config['rss_feeds']
      return unless config

      @defaults = config['defaults'] || {}

      # Generate static feeds
      (config['feeds'] || []).each do |feed_config|
        next if feed_config['enabled'] == false
        generate_static_feed(feed_config)
      end

      # Generate dynamic feeds (e.g., featured tags)
      (config['dynamic_feeds'] || []).each do |dynamic_config|
        generate_dynamic_feeds(dynamic_config)
      end
    end

    private

    def generate_static_feed(config)
      collection = @site.collections[config['collection']]
      return unless collection

      items = collection.docs.dup

      # Apply filter if specified
      if config['filter']
        filter_field = config['filter']['field']
        filter_value = config['filter']['value']
        items = items.select do |doc|
          field_data = doc.data[filter_field]
          if field_data.is_a?(Array)
            field_data.include?(filter_value)
          else
            field_data == filter_value
          end
        end
      end

      # Filter out drafts
      items = items.reject { |doc| doc.data['_status'] == 'draft' }

      # Filter out future-dated items if configured
      if config['exclude_future']
        items = items.select { |doc| doc.data['date'] && doc.data['date'] <= @site.time }
      end

      # Sort by date (newest first) and limit
      items = items
        .select { |doc| doc.data['date'] }
        .sort_by { |doc| doc.data['date'] }
        .reverse
        .first(config['limit'] || 20)

      feed_content = build_feed_xml(
        title: config['title'],
        description: config['description'],
        link: @site.config['url'] + (config['link_path'] || '/'),
        self_link: @site.config['url'] + config['path'],
        items: items,
        use_content: config['use_content'],
        include_footer: config['include_footer']
      )

      @site.pages << RssFeedPage.new(@site, config['path'], feed_content)
    end

    def generate_dynamic_feeds(config)
      source_collection = @site.collections[config['source_collection']]
      target_collection = @site.collections[config['target_collection']]
      return unless source_collection && target_collection

      source_collection.docs.each do |source_doc|
        match_value = source_doc.data[config['match_field']]
        next unless match_value

        # Filter target items by matching field
        items = target_collection.docs.select do |doc|
          next false if doc.data['_status'] == 'draft'

          field_value = doc.data[config['filter_field']]
          matches_value?(field_value, match_value)
        end

        # Sort by date
        sort_ascending = source_doc.data[config['sort_field']] == true
        items = items
          .select { |doc| doc.data['date'] }
          .sort_by { |doc| doc.data['date'] }
        items = items.reverse unless sort_ascending
        items = items.first(config['limit'] || 20)

        # Build path from template
        path = interpolate_template(config['path_template'], source_doc.data)

        # Build title from template
        title = interpolate_template(config['title_template'], source_doc.data)

        # Build link from template
        link = interpolate_template(config['link_template'] || '/', source_doc.data)

        # Get description from specified field
        description = if config['description_field']
          strip_html(source_doc.data[config['description_field']] || source_doc.content || title)
        else
          title
        end

        feed_content = build_feed_xml(
          title: title,
          description: description,
          link: @site.config['url'] + link,
          self_link: @site.config['url'] + path,
          items: items,
          use_content: config['use_content'],
          include_footer: config['include_footer']
        )

        @site.pages << RssFeedPage.new(@site, path, feed_content)
      end
    end

    def matches_value?(field_value, match_value)
      case field_value
      when Array
        field_value.any? { |v| normalize_value(v) == normalize_value(match_value) }
      else
        normalize_value(field_value) == normalize_value(match_value)
      end
    end

    def normalize_value(value)
      # Handle tag objects that might be hashes with 'tag' key
      actual = value.is_a?(Hash) ? (value['tag'] || value[:tag]) : value
      actual.to_s.downcase.strip
    end

    def interpolate_template(template, data)
      template.gsub(/\{(\w+)\}/) do
        data[$1] || data[$1.to_sym] || $1
      end
    end

    def build_feed_xml(title:, description:, link:, self_link:, items:, use_content: false, include_footer: true)
      xml = Builder::XmlMarkup.new(indent: 2)

      # Build the RSS content (without XML declaration - we'll add it manually)
      rss_content = xml.rss(
        'version' => '2.0',
        'xmlns:atom' => 'http://www.w3.org/2005/Atom'
      ) do
        xml.channel do
          xml.title xml_escape(title)
          xml.description xml_escape(description)
          xml.link link
          xml.tag!('atom:link', 'href' => self_link, 'rel' => 'self', 'type' => 'application/rss+xml')
          xml.pubDate @site.time.rfc2822
          xml.lastBuildDate @site.time.rfc2822
          xml.generator "Jekyll v#{Jekyll::VERSION}"

          items.each do |item|
            build_item_xml(xml, item, use_content: use_content, include_footer: include_footer)
          end
        end
      end

      # Prepend XML declaration and XSL stylesheet reference
      xsl_path = @defaults['xsl_stylesheet'] || '/assets/css/feed-style.xsl'
      <<~XML
        <?xml version="1.0" encoding="UTF-8"?>
        <?xml-stylesheet type="text/xsl" href="#{xsl_path}"?>
        #{rss_content}
      XML
    end

    def build_item_xml(xml, item, use_content: false, include_footer: true)
      xml.item do
        xml.title xml_escape(item.data['title'])

        # Build description content with pre-escaped HTML entities
        # RSS readers will decode &lt; to < and render HTML
        desc_parts = []

        # Add featured image if present (as escaped HTML)
        if item.data['show_image'] != false && item.data['image']
          img_url = absolute_url(item.data['image'])
          desc_parts << "&lt;img src=\"#{xml_escape(img_url)}\" alt=\"#{xml_escape(item.data['title'])}\"&gt;"
        end

        # Add content or excerpt
        if use_content
          # Convert Markdown content to HTML, then escape for RSS
          content_text = item.content || ''
          content_html = Kramdown::Document.new(content_text).to_html.strip
          # Escape the HTML so RSS readers render it as rich text
          desc_parts << xml_escape(content_html)
        else
          desc_parts << xml_escape(item.data['excerpt']&.to_s || '')
        end

        # Add footer text if configured (as escaped HTML)
        # Matches original: &lt;p&gt;{{ site.feed_footer_text | markdownify }}&lt;/p&gt;
        if include_footer && @site.config['feed_footer_text']
          footer_html = Kramdown::Document.new(@site.config['feed_footer_text']).to_html.strip
          desc_parts << "&lt;p&gt;#{xml_escape(footer_html)}&lt;/p&gt;"
        end

        # Use tag! with block to insert pre-escaped content without double-escaping
        xml.tag!('description') { xml << desc_parts.join("\n") }

        xml.pubDate item.data['date'].rfc2822
        xml.link absolute_url(item.url)
        xml.guid absolute_url(item.url), 'isPermaLink' => 'true'

        # Add categories
        (item.data['categories'] || []).each do |category|
          xml.category xml_escape(category.to_s)
        end

        # Add tags as categories (RSS standard)
        (item.data['tags'] || []).each do |tag|
          tag_value = tag.is_a?(Hash) ? (tag['tag'] || tag[:tag]) : tag
          xml.category xml_escape(tag_value.to_s)
        end
      end
    end

    def xml_escape(text)
      CGI.escapeHTML(text.to_s)
    end

    def strip_html(content)
      content.to_s.gsub(/<[^>]*>/, '').strip
    end

    def absolute_url(path)
      return path if path.to_s.start_with?('http://', 'https://')
      @site.config['url'].to_s + @site.config['baseurl'].to_s + path.to_s
    end
  end

  class RssFeedPage < Page
    def initialize(site, path, content)
      @site = site
      @base = site.source
      @dir = File.dirname(path)
      @name = File.basename(path)

      # Initialize data hash before calling process
      @data = {}

      process(@name)
      @content = content
      @data['layout'] = nil
      @data['sitemap'] = false
    end

    def read_yaml(*)
      # Override to prevent reading from disk
    end
  end
end
