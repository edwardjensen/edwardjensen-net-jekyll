# frozen_string_literal: true

module Jekyll
  module Pagination
    class Generator < Jekyll::Generator
      safe true
      priority :low # Run after CMS plugin loads content

      def generate(site)
        @site = site
        @pagination_config = site.data['pagination'] || {}
        @defaults = @pagination_config['defaults'] || {}
        @collection_configs = @pagination_config['collections'] || {}

        paginatable = find_paginatable_pages
        return if paginatable.empty?

        Jekyll.logger.info 'Pagination:', "Found #{paginatable.length} page(s) to paginate"

        paginatable.each do |page|
          paginate_page(page)
        end
      end

      private

      def find_paginatable_pages
        # Find pages with pagination.enabled: true in front matter
        pages = @site.pages.select { |p| pagination_enabled?(p) }

        # Find collection documents with pagination enabled
        # (either via front matter OR via collection-level config in _data/pagination.yml)
        docs = []
        @site.collections.each do |name, collection|
          collection.docs.each do |doc|
            docs << doc if pagination_enabled_for_doc?(doc, name)
          end
        end

        pages + docs
      end

      def pagination_enabled?(page)
        config = page.data['pagination']
        config.is_a?(Hash) && config['enabled'] == true
      end

      def pagination_enabled_for_doc?(doc, collection_name)
        # First check front matter
        doc_config = doc.data['pagination']
        return true if doc_config.is_a?(Hash) && doc_config['enabled'] == true

        # Then check collection-level config from _data/pagination.yml
        collection_config = @collection_configs[collection_name]
        collection_config.is_a?(Hash) && collection_config['enabled'] == true
      end

      def paginate_page(page)
        config = build_config(page)
        items = fetch_items(config)
        items = filter_items(items, config, page)
        items = sort_items(items, config, page)

        total_items = items.length
        per_page = config[:per_page]
        total_pages = (total_items.to_f / per_page).ceil
        total_pages = 1 if total_pages.zero?

        base_path = page.url

        Jekyll.logger.info 'Pagination:', "#{base_path} - #{total_items} items, #{total_pages} page(s)"

        # Page 1: inject paginator into original page
        page.data['paginator'] = build_paginator(
          items: items.first(per_page),
          page_num: 1,
          total_pages: total_pages,
          total_items: total_items,
          per_page: per_page,
          base_path: base_path
        )

        # Pages 2+: generate virtual pages
        (2..total_pages).each do |page_num|
          start_idx = (page_num - 1) * per_page
          page_items = items.slice(start_idx, per_page) || []

          virtual_page = PaginationPage.new(
            site: @site,
            base_page: page,
            page_num: page_num,
            items: page_items,
            total_pages: total_pages,
            total_items: total_items,
            per_page: per_page,
            base_path: base_path
          )

          @site.pages << virtual_page
        end
      end

      def build_config(page)
        page_config = page.data['pagination'] || {}

        # Get collection-level config if this is a collection document
        collection_config = {}
        if page.respond_to?(:collection) && page.collection
          collection_name = page.collection.label
          collection_config = @collection_configs[collection_name] || {}
        end

        # Merge configs: page front matter > collection config > global defaults
        {
          collection: page_config['collection'] || collection_config['collection'] || 'posts',
          per_page: page_config['per_page'] || collection_config['per_page'] || @defaults['per_page'] || 20,
          sort_field: page_config['sort_field'] || collection_config['sort_field'] || @defaults['sort_field'] || 'date',
          sort_reverse: fetch_boolean(page_config, 'sort_reverse',
                                      fetch_boolean(collection_config, 'sort_reverse',
                                                    fetch_boolean(@defaults, 'sort_reverse', true))),
          filter: page_config['filter'] || collection_config['filter']
        }
      end

      def fetch_boolean(hash, key, default)
        return default unless hash.is_a?(Hash)
        return hash[key] if hash.key?(key)

        default
      end

      def fetch_items(config)
        collection = @site.collections[config[:collection]]
        return [] unless collection

        collection.docs.reject do |doc|
          # Exclude drafts
          doc.data['_status'] == 'draft' ||
            # Exclude future-dated items
            (doc.data['date'] && doc.data['date'] > @site.time)
        end
      end

      def filter_items(items, config, page)
        filter = config[:filter]
        return items unless filter.is_a?(Hash)

        field = filter['field']
        return items unless field

        # Get match value: either dynamic from page front matter or static
        match_value = if filter['match']
                        page.data[filter['match']]
                      else
                        filter['value']
                      end

        return items unless match_value

        items.select do |item|
          item_value = item.data[field]
          matches_value?(item_value, match_value)
        end
      end

      def matches_value?(item_value, match_value)
        case item_value
        when Array
          item_value.any? { |v| normalize_value(v) == normalize_value(match_value) }
        else
          normalize_value(item_value) == normalize_value(match_value)
        end
      end

      def normalize_value(value)
        # Handle tag objects that might be hashes with 'tag' key
        actual = value.is_a?(Hash) ? (value['tag'] || value[:tag]) : value
        actual.to_s.downcase.strip
      end

      def sort_items(items, config, page)
        sort_field = config[:sort_field]

        # Check for page-level sort_ascending override (for featured tags)
        sort_reverse = if page.data.key?('sort_ascending')
                         !page.data['sort_ascending']
                       else
                         config[:sort_reverse]
                       end

        sorted = items.sort_by do |item|
          value = item.data[sort_field]
          # Handle nil values by putting them at the end
          value || Time.at(0)
        end

        sort_reverse ? sorted.reverse : sorted
      end

      def build_paginator(items:, page_num:, total_pages:, total_items:, per_page:, base_path:)
        {
          'items' => items,
          'page' => page_num,
          'total_pages' => total_pages,
          'total_items' => total_items,
          'per_page' => per_page,
          'page_numbers' => (1..total_pages).to_a,
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

        # Ensure base_path ends without trailing slash, then add /page/N/
        base_path.sub(%r{/$}, '') + "/page/#{page_num}/"
      end
    end

    class PaginationPage < Jekyll::Page
      def initialize(site:, base_page:, page_num:, items:, total_pages:, total_items:, per_page:, base_path:)
        @site = site
        @base = site.source

        # Determine output directory
        # Remove leading and trailing slashes for Jekyll's @dir (which is relative to site root)
        base_url = base_path.sub(%r{^/}, '').sub(%r{/$}, '')
        @dir = "#{base_url}/page/#{page_num}"
        @name = 'index.html'

        # Initialize data hash before calling process
        @data = {}

        process(@name)

        # Copy front matter from base page
        @data = base_page.data.dup

        # Remove permalink from copied data - virtual pages determine their URL via @dir
        @data.delete('permalink')

        # Inject paginator object
        @data['paginator'] = build_paginator(
          items: items,
          page_num: page_num,
          total_pages: total_pages,
          total_items: total_items,
          per_page: per_page,
          base_path: base_path
        )

        # Copy content from base page
        @content = base_page.content
      end

      private

      def build_paginator(items:, page_num:, total_pages:, total_items:, per_page:, base_path:)
        {
          'items' => items,
          'page' => page_num,
          'total_pages' => total_pages,
          'total_items' => total_items,
          'per_page' => per_page,
          'page_numbers' => (1..total_pages).to_a,
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

        base_path.sub(%r{/$}, '') + "/page/#{page_num}/"
      end

      def read_yaml(*)
        # Override to prevent reading from disk
      end
    end
  end
end
