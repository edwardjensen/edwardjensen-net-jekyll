# frozen_string_literal: true

module Jekyll
  class SitemapGenerator < Generator
    safe true
    priority :lowest # Run after all other generators

    def generate(site)
      @site = site
      @config = site.data['sitemap'] || {}

      entries = collect_entries
      content = build_sitemap_xml(entries)

      output_path = @config['output_path'] || '/sitemap.xml'
      site.pages << SitemapPage.new(site, output_path, content)

      Jekyll.logger.info 'Sitemap:', "Generated #{entries.length} entries"
    end

    private

    def collect_entries
      entries = []

      # Collect from site.pages
      @site.pages.each do |page|
        next unless include_page?(page)
        entries << build_entry(page)
      end

      # Collect from all output collections
      @site.collections.each do |name, collection|
        next unless collection.metadata['output']

        collection.docs.each do |doc|
          next unless include_doc?(doc)
          entries << build_entry(doc)
        end
      end

      entries.compact
    end

    def include_page?(page)
      # Must have a URL
      return false if page.url.nil? || page.url.empty?

      # Exclude non-HTML pages (CSS, JS, JSON, XML, XSL, etc.)
      return false unless html_page?(page)

      # Check exclusion flags
      # Explicit sitemap: true overrides searchable: false
      return false if page.data['sitemap'] == false
      return false if page.data['searchable'] == false && page.data['sitemap'] != true

      # Exclude pagination pages (page 2+)
      return false if page.url.include?('/page/')

      # Check exclude patterns
      return false if matches_exclude_pattern?(page.url)

      true
    end

    def html_page?(page)
      # Include pages that output as HTML
      # Exclude assets, feeds, and other non-content files
      url = page.url.to_s
      name = page.name.to_s

      # Exclude by file extension
      excluded_extensions = %w[.css .js .json .xml .xsl .txt .ico .png .jpg .jpeg .gif .svg .woff .woff2 .ttf .eot]
      return false if excluded_extensions.any? { |ext| name.end_with?(ext) || url.end_with?(ext) }

      # Exclude special files
      excluded_files = %w[404.html _redirects robots.txt]
      return false if excluded_files.include?(name)

      true
    end

    def include_doc?(doc)
      # Must have a URL
      return false if doc.url.nil? || doc.url.empty?

      # Exclude non-HTML documents (JSON feeds, etc.)
      url = doc.url.to_s
      excluded_extensions = %w[.json .xml .txt]
      return false if excluded_extensions.any? { |ext| url.end_with?(ext) }

      # Exclude drafts
      return false if doc.data['_status'] == 'draft'

      # Check exclusion flags
      # Explicit sitemap: true overrides searchable: false
      return false if doc.data['sitemap'] == false
      return false if doc.data['searchable'] == false && doc.data['sitemap'] != true

      # Check exclude patterns
      return false if matches_exclude_pattern?(doc.url)

      true
    end

    def matches_exclude_pattern?(url)
      patterns = @config['exclude_patterns'] || []
      patterns.any? do |pattern|
        File.fnmatch(pattern, url, File::FNM_PATHNAME)
      end
    end

    def build_entry(item)
      url = absolute_url(item.url)
      lastmod = determine_lastmod(item)

      { url: url, lastmod: lastmod }
    end

    def determine_lastmod(item)
      # Priority: updatedAt (CMS) > date > site.time
      date = item.data['updatedAt'] || item.data['date'] || @site.time

      # Parse string dates if needed
      date = Time.parse(date) if date.is_a?(String)

      format_date(date)
    end

    def format_date(date)
      # ISO 8601 format with timezone
      date.strftime('%Y-%m-%dT%H:%M:%S%:z')
    end

    def absolute_url(path)
      return path if path.to_s.start_with?('http://', 'https://')
      @site.config['url'].to_s + @site.config['baseurl'].to_s + path.to_s
    end

    def build_sitemap_xml(entries)
      xml_lines = []
      xml_lines << '<?xml version="1.0" encoding="UTF-8"?>'
      xml_lines << '<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' \
                   'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 ' \
                   'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" ' \
                   'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

      entries.each do |entry|
        xml_lines << '<url>'
        xml_lines << "<loc>#{escape_xml(entry[:url])}</loc>"
        xml_lines << "<lastmod>#{entry[:lastmod]}</lastmod>" if entry[:lastmod]
        xml_lines << '</url>'
      end

      xml_lines << '</urlset>'
      xml_lines.join("\n") + "\n"
    end

    def escape_xml(text)
      text.to_s
          .gsub('&', '&amp;')
          .gsub('<', '&lt;')
          .gsub('>', '&gt;')
          .gsub('"', '&quot;')
          .gsub("'", '&apos;')
    end
  end

  class SitemapPage < Page
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
