module Jekyll
  module JsonEscapeFilter
    def json_escape(input)
      return "" if input.nil?
      
      # Convert to string
      str = input.to_s
      
      # Remove HTML tags
      str = str.gsub(/<[^>]*>/, '')
      
      # Convert smart quotes to straight quotes
      str = str
        .gsub("\u201C", '"')   # left double quote
        .gsub("\u201D", '"')   # right double quote
        .gsub("\u2018", "'")   # left single quote
        .gsub("\u2019", "'")   # right single quote
      
      # Normalize whitespace - replace newlines, carriage returns, tabs with spaces
      str = str.gsub(/[\n\r\t]+/, ' ')
      
      # Remove multiple spaces
      str = str.gsub(/\s+/, ' ')
      
      # Escape JSON special characters
      str = str
        .gsub('\\', '\\\\')  # backslash first
        .gsub('"', '\\"')    # quotes
        .gsub("\b", '\\b')   # backspace
        .gsub("\f", '\\f')   # form feed
        .gsub("\n", '\\n')   # newline
        .gsub("\r", '\\r')   # carriage return
        .gsub("\t", '\\t')   # tab
      
      str.strip
    end
  end
end

Liquid::Template.register_filter(Jekyll::JsonEscapeFilter)
