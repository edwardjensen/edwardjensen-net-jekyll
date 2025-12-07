# frozen_string_literal: true

# Hook to process posts and detect if they have YouTube videos
Jekyll::Hooks.register :posts, :pre_render do |post|
  # Check if content contains YouTube URLs
  if post.content.match?(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\S+/)
    post.data['has_youtube_video'] = true
  end
end
