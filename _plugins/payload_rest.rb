# frozen_string_literal: true

require 'net/http'
require 'openssl'
require 'uri'
require 'json'
require 'time'

module PayloadREST
  # Generator that fetches content from Payload CMS v2 REST API
  # Falls back to v1 GraphQL API if v2 fetch fails
  class ContentGenerator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      @site = site
      @config = site.config['payload_rest'] || {}
      
      # Check if v2 API is enabled
      api_version = site.config['api_version'] || 'v1'
      unless api_version == 'v2'
        Jekyll.logger.info 'PayloadREST:', 'v2 API disabled, skipping'
        return
      end

      # Default to true - builds fail on CMS errors unless explicitly disabled
      @fail_on_error = @config['fail_on_error'] != false
      @fallback_to_v1 = site.config['fallback_to_v1'] != false

      # Determine REST API base URL
      @base_url = resolve_api_base_url

      unless @base_url
        message = 'No REST API base URL configured'
        handle_error(message)
        return
      end

      Jekyll.logger.info 'PayloadREST:', "Using v2 REST API: #{@base_url}"

      # Fetch each collection
      fetch_all_collections
    end

    private

    def resolve_api_base_url
      # Check environment variable first
      base_url = ENV['REST_API_BASE_URL']
      return base_url if base_url && !base_url.empty?

      # Fall back to config URL
      @config['url']
    end

    def rest_api_key
      # Check environment variable first
      api_key = ENV['REST_API_KEY']
      return api_key if api_key && !api_key.empty?

      # Fall back to config key
      @config['key']
    end

    def fetch_all_collections
      # Map Jekyll collections to v2 REST endpoints
      collection_mappings = {
        'posts' => 'posts',
        'working_notes' => 'working-notes',
        'photography' => 'photography',
        'historic_posts' => 'historic-posts',
        'pages' => 'pages'
      }

      collection_mappings.each do |jekyll_collection, api_endpoint|
        collection = @site.collections[jekyll_collection]
        unless collection
          Jekyll.logger.warn 'PayloadREST:', "Collection '#{jekyll_collection}' not found, skipping"
          next
        end

        begin
          fetch_collection_v2(collection, api_endpoint)
        rescue StandardError => e
          Jekyll.logger.error 'PayloadREST:', "v2 API failed for #{jekyll_collection}: #{e.message}"
          
          if @fallback_to_v1
            Jekyll.logger.warn 'PayloadREST:', "Falling back to v1 GraphQL for #{jekyll_collection}"
            fallback_to_v1(collection)
          elsif @fail_on_error
            raise
          end
        end
      end
    end

    def fetch_collection_v2(collection, api_endpoint)
      cms_config = collection.metadata['cms'] || {}
      layout = cms_config['layout'] || 'page'
      
      Jekyll.logger.info 'PayloadREST:', "Fetching #{api_endpoint} for #{collection.label}"

      # Fetch all pages (handle pagination)
      all_docs = []
      page = 1
      loop do
        result = fetch_page(api_endpoint, page)
        docs = result['docs'] || []
        
        all_docs.concat(docs)
        
        break unless result['hasNextPage']
        page += 1
      end

      if all_docs.empty?
        Jekyll.logger.info 'PayloadREST:', "No published #{api_endpoint} found"
        return
      end

      Jekyll.logger.info 'PayloadREST:', "Found #{all_docs.length} published #{api_endpoint}"

      # Create Jekyll documents
      all_docs.each do |doc_data|
        doc = create_document(collection, doc_data, layout, cms_config)
        collection.docs << doc if doc
      end

      # Sort by date (most recent first)
      if collection.docs.any? { |doc| doc.data['date'] }
        collection.docs.sort_by! { |doc| -(doc.data['date']&.to_i || 0) }
      end

      Jekyll.logger.info 'PayloadREST:', "Added #{all_docs.length} #{api_endpoint} to #{collection.label}"
    end

    def fetch_page(api_endpoint, page = 1, limit = 100)
      url = "#{@base_url}/#{api_endpoint}?page=#{page}&limit=#{limit}"
      uri = URI.parse(url)

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.cert_store = OpenSSL::X509::Store.new
      http.cert_store.set_default_paths
      http.open_timeout = 10
      http.read_timeout = 30

      request = Net::HTTP::Get.new(uri.request_uri)
      request['Accept'] = 'application/json'

      # Add Authorization header if API key is configured
      api_key = rest_api_key
      request['Authorization'] = "Bearer #{api_key}" if api_key && !api_key.empty?

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        raise "REST API request failed with status #{response.code}: #{response.body}"
      end

      JSON.parse(response.body)
    end

    def create_document(collection, doc_data, layout, cms_config)
      slug = doc_data['slug'] || doc_data['id']

      # Generate Jekyll permalink from v2 data
      permalink = generate_permalink(doc_data, collection.label)

      # Create virtual document
      doc = Jekyll::Document.new(
        "_cms_#{collection.label}/#{slug}.md",
        site: @site,
        collection: collection
      )

      # Set layout
      doc.data['layout'] = layout

      # Set common front matter
      doc.data['title'] = sanitize_for_html_attribute(doc_data['title'])
      doc.data['date'] = parse_date(doc_data['date']) if doc_data['date']
      doc.data['slug'] = slug
      doc.data['permalink'] = permalink
      doc.data['cms_id'] = doc_data['id']

      # Searchable (for pages)
      doc.data['searchable'] = doc_data['searchable'] unless doc_data['searchable'].nil?

      # Categories and tags
      doc.data['categories'] = doc_data['categories'] if doc_data['categories']
      doc.data['tags'] = doc_data['tags'] if doc_data['tags']

      # Image handling (v2 returns image as object)
      if doc_data['image']
        doc.data['image'] = doc_data['image']['url']
        doc.data['image_alt'] = sanitize_for_html_attribute(
          doc_data['image']['alt'] || doc_data['title']
        )
      end

      # Optional fields
      doc.data['excerpt'] = sanitize_for_html_attribute(doc_data['excerpt']) if doc_data['excerpt']
      doc.data['show_image'] = doc_data['showImage'] unless doc_data['showImage'].nil?
      doc.data['render_with_liquid'] = doc_data['renderWithLiquid'] unless doc_data['renderWithLiquid'].nil?
      doc.data['landing_featured'] = doc_data['landingFeatured'] unless doc_data['landingFeatured'].nil?

      # Post credits (v2 returns HTML string)
      if doc_data['postCredits'] && !doc_data['postCredits'].empty?
        doc.data['post_credits'] = parse_post_credits_html(doc_data['postCredits'])
      end

      # Redirect handling - extract path strings from array of objects
      if doc_data['redirectFrom'] && !doc_data['redirectFrom'].empty?
        doc.data['redirect_from'] = doc_data['redirectFrom'].map do |redirect|
          redirect.is_a?(Hash) ? redirect['path'] : redirect
        end.compact
      end

      # Sitemap
      doc.data['sitemap'] = doc_data['sitemap'] unless doc_data['sitemap'].nil?
      doc.data['updatedAt'] = doc_data['updatedAt'] if doc_data['updatedAt']

      # Photography-specific nested fields
      if collection.label == 'photography'
        map_photography_fields(doc, doc_data)
      end

      # Content - v2 provides pre-rendered HTML in contentHtml
      doc.content = process_content_html(doc_data['contentHtml'] || '', doc_data['blocks'] || [])

      # For photography, store plain-text caption
      if collection.label == 'photography' && doc.content && !doc.content.empty?
        doc.data['caption'] = strip_html_and_decode_entities(doc.content)
      end

      # Mark as from CMS
      doc.data['from_cms'] = true

      doc
    rescue StandardError => e
      Jekyll.logger.error 'PayloadREST:', "Failed to create document for '#{doc_data['title']}': #{e.message}"
      Jekyll.logger.debug 'PayloadREST:', e.backtrace.join("\n") if e.backtrace
      nil
    end

    def generate_permalink(doc_data, collection_name)
      slug = doc_data['slug']
      date = parse_date(doc_data['date']) if doc_data['date']

      case collection_name
      when 'posts'
        year = date.strftime('%Y')
        month = date.strftime('%m')
        "/posts/#{year}/#{year}-#{month}/#{slug}"
      when 'working_notes'
        year = date.strftime('%Y')
        month = date.strftime('%m')
        day = date.strftime('%d')
        "/notes/#{year}-#{month}-#{day}/#{slug}"
      when 'photography'
        year = date.strftime('%Y')
        month = date.strftime('%m')
        "/photos/#{year}/#{year}-#{month}/#{slug}"
      when 'historic_posts'
        "/archive/posts/#{slug}"
      when 'pages'
        # Pages can have custom permalinks
        doc_data['permalink'] || "/#{slug}"
      else
        "/#{slug}"
      end
    end

    def map_photography_fields(doc, doc_data)
      # Map nested EXIF fields
      if doc_data['exif']
        doc.data['exif_camera'] = doc_data['exif']['camera']
        doc.data['exif_lens'] = doc_data['exif']['lens']
        doc.data['exif_focal_length'] = doc_data['exif']['focalLength']
        doc.data['exif_aperture'] = doc_data['exif']['aperture']
        doc.data['exif_shutter_speed'] = doc_data['exif']['shutterSpeed']
        doc.data['exif_iso'] = doc_data['exif']['iso']
      end

      # Map nested location fields
      if doc_data['location']
        doc.data['location_lat'] = doc_data['location']['lat']
        doc.data['location_lng'] = doc_data['location']['lng']
        doc.data['location_point_of_interest'] = doc_data['location']['pointOfInterest']
        doc.data['location_neighborhood'] = doc_data['location']['neighborhood']
        doc.data['location_formatted'] = doc_data['location']['formatted']
        doc.data['location_city'] = doc_data['location']['city']
        doc.data['location_state'] = doc_data['location']['state']
        doc.data['location_country'] = doc_data['location']['country']
      end
    end

    def process_content_html(content_html, blocks)
      return content_html if blocks.empty?

      # Process embedded blocks and replace in content
      processed_html = content_html.dup

      blocks.each do |block|
        next unless block['blockType'] == 'embeddedWorkingNote'

        # Generate HTML for embedded working note
        embed_html = render_embedded_working_note(block['doc'])
        
        # Replace placeholder if exists (format: <!-- embed:id -->)
        # Otherwise append at end
        embed_id = block['doc']['id']
        if processed_html.include?("<!-- embed:#{embed_id} -->")
          processed_html.gsub!("<!-- embed:#{embed_id} -->", embed_html)
        else
          processed_html += "\n\n#{embed_html}"
        end
      end

      processed_html
    end

    def render_embedded_working_note(note_data)
      # Generate permalink for the working note
      date = parse_date(note_data['date'])
      year = date.strftime('%Y')
      month = date.strftime('%m')
      day = date.strftime('%d')
      slug = note_data['slug']
      permalink = "/notes/#{year}-#{month}-#{day}/#{slug}"

      # Render using Jekyll include template
      # Use markdown="0" to preserve HTML structure in kramdown
      <<~HTML
        <aside class="embedded-working-note" markdown="0">
          <header class="embedded-working-note__header">
            <h4 class="embedded-working-note__title">#{escape_html(note_data['title'])}</h4>
          </header>
          <div class="embedded-working-note__content">
            #{note_data['contentHtml']}
          </div>
          <footer class="embedded-working-note__footer">
            <a href="#{escape_html(permalink)}" class="embedded-working-note__link">
              View full note &rarr;
            </a>
          </footer>
        </aside>
      HTML
    end

    def parse_post_credits_html(credits_html)
      return [] if credits_html.nil? || credits_html.empty?

      # Split by paragraph tags and extract content
      credits_html.scan(/<p>(.*?)<\/p>/m).flatten.map(&:strip).reject(&:empty?)
    end

    def parse_date(date_string)
      return Time.now if date_string.nil?

      Time.parse(date_string)
    rescue ArgumentError
      Time.now
    end

    def sanitize_for_html_attribute(text)
      return '' if text.nil?

      text.to_s
          .gsub('&', '&amp;')
          .gsub('"', '&quot;')
          .gsub("'", '&#39;')
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

    def fallback_to_v1(collection)
      # Call the v1 GraphQL generator for this collection
      # This requires that payload_cms.rb is still loaded
      return unless defined?(PayloadCMS::ContentGenerator)

      v1_generator = PayloadCMS::ContentGenerator.new
      v1_generator.generate(@site)
    end

    def handle_error(message)
      if @fail_on_error
        raise "PayloadREST: #{message}"
      end
      Jekyll.logger.warn 'PayloadREST:', "#{message}, skipping CMS fetch"
    end
  end
end
