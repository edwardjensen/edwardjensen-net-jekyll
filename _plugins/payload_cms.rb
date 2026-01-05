# frozen_string_literal: true

require 'net/http'
require 'openssl'
require 'uri'
require 'json'

module PayloadCMS
  # Generator that fetches content from Payload CMS via GraphQL
  class ContentGenerator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      @site = site
      @config = site.config['payload_graphql'] || {}
      @cache_config = site.config['graphql_cache'] || {}

      # Cache URL from environment variable takes precedence over config
      @cache_url = ENV['GRAPHQL_CACHE_URL'] || @cache_config['url']
      @use_cache = @cache_config['enabled'] != false && @cache_url && !@cache_url.empty?

      # Direct CMS URL (fallback when cache is disabled or unavailable)
      @endpoint = @config['url']
      # Default to true - builds fail on CMS errors unless explicitly disabled
      @fail_on_error = @config['fail_on_error'] != false

      unless @cache_url || @endpoint
        message = 'No graphql_cache.url or payload_graphql.url configured'
        if @fail_on_error
          raise "PayloadCMS: #{message}"
        end
        Jekyll.logger.warn 'PayloadCMS:', "#{message}, skipping CMS fetch"
        return
      end

      if @use_cache
        Jekyll.logger.info 'PayloadCMS:', "Using GraphQL cache at #{@cache_url}"
      else
        Jekyll.logger.info 'PayloadCMS:', "Using direct CMS at #{@endpoint}"
      end

      # Iterate through Jekyll collections and find ones with cms config
      site.collections.each do |name, collection|
        cms_config = collection.metadata['cms']
        next unless cms_config

        fetch_collection(name, collection, cms_config)
      end
    end

    private

    def fetch_collection(name, collection, cms_config)
      cms_collection = cms_config['collection'] || name.capitalize
      # Allow explicit GraphQL query name for collections with irregular pluralization
      # (e.g., Photography -> Photographies in Payload's GraphQL API)
      graphql_query = cms_config['graphql_query'] || cms_collection
      layout = cms_config['layout'] || 'page'
      # Default to 0 (unlimited) if no limit specified - Payload returns all docs when limit=0
      limit = cms_config['limit'] || 0

      Jekyll.logger.info 'PayloadCMS:', "Fetching #{graphql_query} for #{name} collection"

      begin
        # Try cache first if enabled, fall back to direct CMS if cache fails
        data = nil
        if @use_cache
          data = fetch_from_cache(name)
          if data.nil? && @endpoint
            Jekyll.logger.warn 'PayloadCMS:', "Cache miss for #{name}, falling back to CMS"
            data = fetch_from_cms(graphql_query, cms_config, limit)
          end
        else
          data = fetch_from_cms(graphql_query, cms_config, limit)
        end

        docs = data&.dig('docs') || []

        if docs.empty?
          message = "No published #{graphql_query} found"
          if @fail_on_error
            raise "PayloadCMS: #{message} - this may indicate a connectivity issue"
          end
          Jekyll.logger.info 'PayloadCMS:', message
          return
        end

        Jekyll.logger.info 'PayloadCMS:', "Found #{docs.length} published #{graphql_query}"

        docs.each do |doc_data|
          doc = create_document(collection, doc_data, layout, cms_config)
          collection.docs << doc if doc
        end

        # Re-sort by date only if documents have dates
        if collection.docs.any? { |doc| doc.data['date'] }
          collection.docs.sort_by! { |doc| -(doc.data['date']&.to_i || 0) }
        end

        Jekyll.logger.info 'PayloadCMS:', "Added #{docs.length} #{graphql_query} to #{name}"
      rescue StandardError => e
        Jekyll.logger.error 'PayloadCMS:', "Failed to fetch #{graphql_query}: #{e.message}"
        Jekyll.logger.debug 'PayloadCMS:', e.backtrace.join("\n") if e.backtrace
        raise if @fail_on_error
      end
    end

    # Fetch collection data from the GraphQL cache
    def fetch_from_cache(collection_name)
      uri = URI.parse("#{@cache_url}/cache/#{collection_name}")

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = 10
      http.read_timeout = 30

      request = Net::HTTP::Get.new(uri.path)
      request['Accept'] = 'application/json'

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        Jekyll.logger.warn 'PayloadCMS:', "Cache returned #{response.code} for #{collection_name}"
        return nil
      end

      JSON.parse(response.body)
    rescue StandardError => e
      Jekyll.logger.warn 'PayloadCMS:', "Cache fetch failed for #{collection_name}: #{e.message}"
      nil
    end

    # Fetch collection data directly from CMS via GraphQL
    def fetch_from_cms(graphql_query, cms_config, limit)
      query = build_query(graphql_query, cms_config)
      result = execute_query(query, limit)
      result.dig('data', graphql_query)
    end

    def build_query(cms_collection, cms_config)
      # Build a dynamic query based on the fields specified in config
      # or use a sensible default for common fields
      fields = cms_config['fields'] || default_fields
      
      # Allow custom sort field (default to -date for backward compatibility)
      # Use 'title' for collections without dates like pages
      sort_field = cms_config['sort'] || '-date'

      <<~GRAPHQL
        query GetPublished($limit: Int) {
          #{cms_collection}(where: { _status: { equals: published } }, limit: $limit, sort: "#{sort_field}") {
            docs {
              #{fields.join("\n              ")}
            }
            totalDocs
          }
        }
      GRAPHQL
    end

    def default_fields
      [
        'id',
        'title',
        'slug',
        'date',
        'categories { category }',
        'tags { tag }',
        'image { url alt filename }',
        'imageAlt',
        'excerpt',
        'showImage',
        'renderWithLiquid',
        'postCredits',
        'landingFeatured',
        'redirectFrom { path }',
        'content',
        'permalink',
        'sitemap',
        'updatedAt',
        'createdAt',
      ]
    end

    def execute_query(query, limit = nil)
      uri = URI.parse(@endpoint)

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      # Use default OpenSSL certificate store without CRL checking
      # This resolves issues with Let's Encrypt certs where CRL endpoints may be unreachable
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.cert_store = OpenSSL::X509::Store.new
      http.cert_store.set_default_paths
      http.open_timeout = 10
      http.read_timeout = 30

      request = Net::HTTP::Post.new(uri.path)
      request['Content-Type'] = 'application/json'
      request['Accept'] = 'application/json'

      variables = {}
      # Always pass limit when specified (including 0 for unlimited)
      variables['limit'] = limit unless limit.nil?

      request.body = {
        query: query,
        variables: variables
      }.to_json

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        raise "GraphQL request failed with status #{response.code}: #{response.body}"
      end

      result = JSON.parse(response.body)

      if result['errors']
        error_messages = result['errors'].map { |e| e['message'] }.join(', ')
        raise "GraphQL errors: #{error_messages}"
      end

      result
    end

    def create_document(collection, doc_data, layout, cms_config)
      slug = doc_data['slug'] || doc_data['id']
      
      # Build permalink from doc data or use the one from Payload
      permalink = doc_data['permalink'] || build_permalink(doc_data, cms_config)

      # Create a virtual document
      doc = Jekyll::Document.new(
        "_cms_#{collection.label}/#{slug}.md",
        site: @site,
        collection: collection
      )

      # Set layout
      doc.data['layout'] = layout

      # Set common front matter data (sanitized for HTML attribute safety)
      doc.data['title'] = sanitize_for_html_attribute(doc_data['title'])
      doc.data['date'] = parse_date(doc_data['date']) if doc_data['date']
      doc.data['slug'] = slug
      doc.data['permalink'] = permalink
      doc.data['cms_id'] = doc_data['id']
      
      # Searchable - for pages collection
      doc.data['searchable'] = doc_data['searchable'] unless doc_data['searchable'].nil?

      # Categories - extract from array of objects
      if doc_data['categories']
        doc.data['categories'] = doc_data['categories'].map { |c| c['category'] }.compact
      end

      # Tags - extract from array of objects
      if doc_data['tags']
        doc.data['tags'] = doc_data['tags'].map { |t| t['tag'] }.compact
      end

      # Image handling (alt text sanitized for HTML attribute safety)
      if doc_data['image']
        doc.data['image'] = doc_data['image']['url']
        doc.data['image_alt'] = sanitize_for_html_attribute(doc_data['imageAlt'] || doc_data['image']['alt'])
      end

      # Optional fields with snake_case conversion (excerpt sanitized for HTML attribute safety)
      doc.data['excerpt'] = sanitize_for_html_attribute(doc_data['excerpt']) if doc_data['excerpt']
      doc.data['show_image'] = doc_data['showImage'] unless doc_data['showImage'].nil?
      doc.data['render_with_liquid'] = doc_data['renderWithLiquid'] unless doc_data['renderWithLiquid'].nil?
      doc.data['post_credits'] = convert_post_credits(doc_data['postCredits']) if doc_data['postCredits']
      doc.data['landing_featured'] = doc_data['landingFeatured'] unless doc_data['landingFeatured'].nil?

      # Redirect handling
      if doc_data['redirectFrom'] && !doc_data['redirectFrom'].empty?
        doc.data['redirect_from'] = doc_data['redirectFrom'].map { |r| r['path'] }.compact
      end

      # Apply any custom field mappings from config (sanitize strings for HTML attribute safety)
      if cms_config['field_mappings']
        cms_config['field_mappings'].each do |cms_field, jekyll_field|
          next unless doc_data.key?(cms_field)

          value = doc_data[cms_field]
          doc.data[jekyll_field] = value.is_a?(String) ? sanitize_for_html_attribute(value) : value
        end
      end

      # Content - use markdown field if available (e.g., WorkingNotes),
      # otherwise convert Lexical JSON to HTML
      if doc_data['markdown'] && !doc_data['markdown'].empty?
        doc.content = doc_data['markdown']
      else
        doc.content = convert_content(doc_data['content'])
      end

      # For photography, store plain-text caption for SEO and modal display
      # This decodes HTML entities that would otherwise appear as &quot; etc.
      if cms_config['collection'] == 'Photography' && doc.content && !doc.content.empty?
        doc.data['caption'] = strip_html_and_decode_entities(doc.content)
      end

      # Mark as from CMS
      doc.data['from_cms'] = true

      doc
    rescue StandardError => e
      Jekyll.logger.error 'PayloadCMS:', "Failed to create document for '#{doc_data['title']}': #{e.message}"
      nil
    end

    def build_permalink(doc_data, cms_config)
      return nil unless doc_data['date'] && doc_data['slug']

      date = parse_date(doc_data['date'])
      year = date.strftime('%Y')
      month = date.strftime('%m')
      day = date.strftime('%d')
      slug = doc_data['slug']

      # Use permalink pattern from config or default
      pattern = cms_config['permalink_pattern'] || '/posts/:year/:year-:month/:slug'
      
      pattern
        .gsub(':year', year)
        .gsub(':month', month)
        .gsub(':day', day)
        .gsub(':slug', slug)
        .gsub(':title', slug)
    end

    def parse_date(date_string)
      return Time.now if date_string.nil?

      Time.parse(date_string)
    rescue ArgumentError
      Time.now
    end

    # Convert Lexical rich text to array of HTML strings (one per paragraph)
    # Used for post_credits field where each paragraph becomes a credit line
    def convert_post_credits(credits_data)
      return [] if credits_data.nil?
      
      # If it's already an array of strings (legacy format), return as-is
      return credits_data if credits_data.is_a?(Array) && credits_data.all? { |c| c.is_a?(String) }
      
      # If it's a Lexical JSON object, extract paragraphs as HTML strings
      return [] unless credits_data.is_a?(Hash) && credits_data['root']
      
      root = credits_data['root']
      return [] unless root['children'].is_a?(Array)
      
      # Extract each top-level paragraph as a separate credit line
      root['children'].filter_map do |node|
        next unless node['type'] == 'paragraph' && node['children']
        
        # Convert paragraph children to HTML (preserves links, formatting, etc.)
        convert_children(node['children'])
      end.reject(&:empty?)
    end

    def convert_content(content)
      return '' if content.nil?

      # If content is a string (HTML or plain text), return as-is
      return content if content.is_a?(String)

      # If content is a hash (Lexical JSON), convert to HTML
      return convert_lexical_to_html(content) if content.is_a?(Hash)

      ''
    end

    def convert_lexical_to_html(lexical_data)
      return '' unless lexical_data.is_a?(Hash) && lexical_data['root']

      root = lexical_data['root']
      return '' unless root['children']

      root['children'].map { |node| convert_node_to_html(node) }.join("\n")
    end

    def convert_node_to_html(node)
      return '' unless node.is_a?(Hash)

      case node['type']
      when 'paragraph'
        content = convert_children(node['children'])
        "<p>#{content}</p>"
      when 'heading'
        tag = node['tag'] || 'h2'
        content = convert_children(node['children'])
        "<#{tag}>#{content}</#{tag}>"
      when 'list'
        tag = node['listType'] == 'number' ? 'ol' : 'ul'
        items = (node['children'] || []).map { |item| convert_node_to_html(item) }.join
        "<#{tag}>#{items}</#{tag}>"
      when 'listitem'
        content = convert_children(node['children'])
        "<li>#{content}</li>"
      when 'quote'
        content = convert_children(node['children'])
        "<blockquote>#{content}</blockquote>"
      when 'code'
        language = node['language'] || ''
        content = node['children']&.first&.dig('text') || ''
        "<pre><code class=\"language-#{language}\">#{escape_html(content)}</code></pre>"
      when 'link'
        # Payload CMS Lexical stores link properties in a 'fields' object
        fields = node['fields'] || {}
        # Handle both internal links (linkType: "internal") and custom/external links
        url = if fields['linkType'] == 'internal'
                # Internal links store the URL in doc.value.permalink
                fields.dig('doc', 'value', 'permalink') || '#'
              else
                # Custom/external links store URL directly in fields.url
                fields['url'] || node['url'] || '#'
              end
        content = convert_children(node['children'])
        new_tab = fields['newTab'] || node['newTab']
        target = new_tab ? ' target="_blank" rel="noopener"' : ''
        "<a href=\"#{escape_html(url)}\"#{target}>#{content}</a>"
      when 'upload'
        # Handle media uploads (images)
        if node['value']
          url = node['value']['url'] || ''
          alt = node['value']['alt'] || ''
          "<img src=\"#{escape_html(url)}\" alt=\"#{escape_html(alt)}\" />"
        else
          ''
        end
      when 'text'
        format_text(node)
      else
        # Unknown node type, try to render children
        convert_children(node['children'])
      end
    end

    def convert_children(children)
      return '' unless children.is_a?(Array)

      children.map { |child| convert_node_to_html(child) }.join
    end

    def format_text(node)
      text = escape_html(node['text'] || '')

      # Apply formatting
      format = node['format'] || 0

      # Lexical uses bitmask for formatting:
      # 1 = bold, 2 = italic, 4 = strikethrough, 8 = underline, 16 = code
      text = "<strong>#{text}</strong>" if (format & 1) != 0
      text = "<em>#{text}</em>" if (format & 2) != 0
      text = "<s>#{text}</s>" if (format & 4) != 0
      text = "<u>#{text}</u>" if (format & 8) != 0
      text = "<code>#{text}</code>" if (format & 16) != 0

      text
    end

    def escape_html(text)
      return '' if text.nil?

      text.to_s
          .gsub('&', '&amp;')
          .gsub('<', '&lt;')
          .gsub('>', '&gt;')
          .gsub('"', '&quot;')
          .gsub("'", '&#39;')
    end

    # Sanitize a string for safe use in HTML attributes
    # This is lighter than escape_html - only escapes quotes and ampersands
    # Used for fields that will be rendered in HTML attribute values
    def sanitize_for_html_attribute(text)
      return '' if text.nil?

      text.to_s
          .gsub('&', '&amp;')
          .gsub('"', '&quot;')
          .gsub("'", '&#39;')
    end

    # Strip HTML tags and decode HTML entities back to plain text
    # Used for generating plain-text captions for SEO and display
    def strip_html_and_decode_entities(html)
      return '' if html.nil? || html.empty?

      # Strip HTML tags
      text = html.gsub(/<[^>]+>/, ' ')

      # Decode common HTML entities
      text = text
             .gsub('&amp;', '&')
             .gsub('&lt;', '<')
             .gsub('&gt;', '>')
             .gsub('&quot;', '"')
             .gsub('&#39;', "'")
             .gsub('&nbsp;', ' ')

      # Collapse whitespace and trim
      text.gsub(/\s+/, ' ').strip
    end
  end
end
