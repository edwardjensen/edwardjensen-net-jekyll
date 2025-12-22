---
title: Photography
layout: photography
permalink: /photos/
redirect_from:
  - /photography
searchable: true
pagination:
  enabled: true
  collection: photography
  per_page: 20
---

<!--
  Photography Gallery Index Page

  This page uses the photography.html layout which includes:
  - JSON data store with ALL photos and complete metadata (for modal rendering)
  - Alpine.js photoGallery() component for modal with URL routing
  - Paginated grid of photo thumbnails

  Gallery Modal Behavior:
  - Clicking a photo opens it in a modal overlay
  - URL changes to the photo's permalink (e.g., /photos/2025/2025-12/photo-title)
  - Browser back button closes modal and returns to gallery
  - Modal displays: image, title, date, tags, description, EXIF metadata, location map
  - Keyboard navigation: Escape (close), Left/Right arrows (prev/next)

  Direct URL Access:
  - Navigating directly to a photo URL (e.g., shared link) loads the single-photo.html layout
  - JavaScript fetches this gallery page and opens the photo in a modal over the gallery
  - If JavaScript fails, the static single-photo page serves as a fallback (SEO-friendly)

  CMS Migration Notes:
  - When migrating to Payload CMS, update _layouts/photography.html to generate JSON from CMS data
  - The JavaScript (assets/js/photo-gallery.js) expects this JSON structure per photo:
    {
      "url": "/photos/2025/2025-12/photo-title",
      "title": "Photo Title",
      "date": "2025-12-18T07:36:17-06:00",
      "dateFormatted": "18 December 2025",
      "image": "/assets/photography/filename.jpg",
      "imageAlt": "Alt text description",
      "content": "Optional description text",
      "tags": ["tag1", "tag2"],
      "exif": {
        "camera": "iPhone 15 Pro",
        "lens": "Main Camera 24mm",
        "focalLength": "24mm",
        "aperture": "f/1.8",
        "shutterSpeed": "1/125s",
        "iso": "100"
      },
      "location": {
        "lat": 44.9778,
        "lng": -93.2650,
        "name": "Downtown Minneapolis"
      }
    }
  - All fields except url, title, date, image, imageAlt are optional
  - The photo-gallery.js will work unchanged as long as the JSON structure is maintained
-->
