module Jekyll
  class FeaturedTagFeedGenerator < Generator
    safe true
    priority :low

    def generate(site)
      # Get the feed layout
      feed_layout = site.layouts['featured-tag-feed']
      return unless feed_layout

      # Iterate over all featured tags and create a feed page for each
      site.collections['featured-tags']&.docs&.each do |tag_doc|
        tag_slug = tag_doc.data['tag']
        next unless tag_slug

        # Create a new page for the feed
        feed_page = FeaturedTagFeedPage.new(site, tag_doc)
        site.pages << feed_page
      end
    end
  end

  class FeaturedTagFeedPage < Page
    def initialize(site, tag_doc)
      @site = site
      @base = site.source
      @dir = 'feeds'
      @name = "#{tag_doc.data['tag']}.xml"

      self.process(@name)
      self.read_yaml(File.join(@base, '_layouts'), 'featured-tag-feed.xml')

      # Copy data from the featured tag document
      self.data['tag'] = tag_doc.data['tag']
      self.data['title'] = tag_doc.data['title']
      self.data['sort_ascending'] = tag_doc.data['sort_ascending']
      self.data['description'] = tag_doc.content
      self.data['layout'] = 'featured-tag-feed'
    end
  end
end
