# Photography Collection Schema

This document captures the front matter schema and field conventions for the `_photography` collection. These decisions are designed for future compatibility with Payload CMS.

## Front Matter Schema

```yaml
---
# Required fields
title: "Photo title"
date: 2025-12-18T07:36:17-06:00
image: /assets/photography/filename.jpg
image_alt: "Detailed alt text description"

# Optional tags
tags:
  - tag-slug

# Optional EXIF metadata (flat fields for CMS compatibility)
exif_camera: "iPhone 15 Pro"
exif_lens: "Main Camera 24mm"
exif_focal_length: "24mm"
exif_aperture: "f/1.8"
exif_shutter_speed: "1/125s"
exif_iso: "100"

# Optional geolocation (coordinates for Google Maps embed)
location_lat: 44.9778
location_lng: -93.2650
location_name: "Downtown Minneapolis"
---

Optional body content for photo description/story.
```

## Field Definitions

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display title for the photo |
| `date` | ISO 8601 datetime | Publication date/time |
| `image` | string | Path to image file (relative to site root) |
| `image_alt` | string | Accessibility alt text description |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `tags` | array of strings | Tag slugs for categorization |

### EXIF Metadata Fields

All EXIF fields are optional. The layout conditionally renders the EXIF section only if at least one field is present.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `exif_camera` | string | "iPhone 15 Pro" | Camera body/device |
| `exif_lens` | string | "Main Camera 24mm" | Lens used |
| `exif_focal_length` | string | "24mm" | Focal length |
| `exif_aperture` | string | "f/1.8" | Aperture (f-stop) |
| `exif_shutter_speed` | string | "1/125s" | Shutter speed |
| `exif_iso` | string | "100" | ISO sensitivity |

**Design Decision:** Flat field names (prefixed with `exif_`) were chosen over nested objects for better compatibility with Payload CMS field mapping.

### Location Fields

Both `location_lat` and `location_lng` must be present for the map to display.

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `location_lat` | number | 44.9778 | Latitude coordinate |
| `location_lng` | number | -93.2650 | Longitude coordinate |
| `location_name` | string | "Downtown Minneapolis" | Optional display name |

## Jekyll Configuration

### Collection Definition (_config.yml)

```yaml
collections:
  photography:
    output: true
    permalink: /photos/:year/:year-:month/:title
```

### Default Layout

```yaml
defaults:
  - scope:
      path: ""
      type: "photography"
    values:
      layout: "single-photo"
```

## Gallery Modal with URL Routing

The photography gallery uses a modal overlay system with URL routing, implemented in `assets/js/photo-gallery.js`.

### User Experience

1. **Gallery View** (`/photos/`): Grid of photo thumbnails with pagination
2. **Click Photo**: Opens modal overlay, URL changes to `/photos/2025/2025-12/photo-title`
3. **Modal Content**: Image (left), details panel (right on desktop, below on mobile)
4. **Navigation**: Prev/Next buttons, keyboard arrows, back button closes modal
5. **Direct URL**: Shared links open modal over gallery (fetches gallery in background)

### Two Operating Modes

The `photo-gallery.js` component supports two modes:

**Full Mode** (photography index page):

- JSON data store with all photos embedded in page
- URL routing via History API (pushState/popState)
- Full modal with EXIF, location map, tags
- Triggered by presence of `#photo-gallery-data` script element

**Simple Mode** (homepage):

- Collects photos from data attributes on buttons
- Lightbox-only (no URL changes)
- Basic modal with image, title, date
- Used when JSON data store is not present

### JSON Data Structure

The `_layouts/photography.html` embeds all photos as JSON:

```json
{
  "galleryUrl": "/photos/",
  "galleryTitle": "Photography",
  "googleMapsApiKey": "...",
  "photos": [{
    "url": "/photos/2025/2025-12/photo-title",
    "title": "Photo Title",
    "date": "2025-12-18T07:36:17-06:00",
    "dateFormatted": "18 December 2025",
    "image": "/assets/photography/filename.jpg",
    "imageAlt": "Alt text description",
    "content": "Optional description",
    "tags": ["tag1", "tag2"],
    "exif": {
      "camera": "...", "lens": "...", "focalLength": "...",
      "aperture": "...", "shutterSpeed": "...", "iso": "..."
    },
    "location": { "lat": 44.97, "lng": -93.26, "name": "..." }
  }]
}
```

### CMS Migration

When migrating to Payload CMS:

1. Update `_layouts/photography.html` to generate JSON from CMS GraphQL data
2. Map CMS fields to the JSON structure above
3. The JavaScript requires no changes - it reads from `#photo-gallery-data`

## Layout Behavior

### Single Photo Layout (`single-photo.html`)

The `single-photo.html` layout serves as:

- **SEO fallback**: Renders static HTML for search engines
- **No-JS fallback**: Works if JavaScript is disabled
- **Direct URL handler**: Includes script to fetch gallery and open modal

When JavaScript is enabled, the page:

1. Fetches `/photos/` in the background
2. Replaces page content with gallery
3. Opens the photo in modal overlay

### Conditional Rendering

1. **Photo** - Always displayed (required field)
2. **Title/Date/Tags** - Always displayed (title/date required, tags optional)
3. **Body Content** - Rendered if markdown body exists
4. **EXIF Metadata** - Rendered if ANY `exif_*` field is present
5. **Location Map** - Rendered if BOTH `location_lat` AND `location_lng` are present
6. **Navigation** - Rendered if previous/next photos exist in collection

## Payload CMS Implementation Notes

When implementing this collection in Payload CMS:

1. **Field Names**: Use the exact field names defined above (flat structure with `exif_` prefix)
2. **EXIF Fields**: Can be populated manually or via EXIF extraction during upload
3. **Location Fields**: Consider adding a map picker UI for lat/lng input
4. **Image Upload**: Store images in a dedicated media folder, generate the `image` path
5. **Alt Text**: Make this a required field in the CMS for accessibility compliance

### Suggested Payload Collection Structure

```typescript
// collections/Photography.ts (conceptual)
{
  slug: 'photography',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'date', type: 'date', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'image_alt', type: 'textarea', required: true },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true },
    // EXIF group
    { name: 'exif_camera', type: 'text' },
    { name: 'exif_lens', type: 'text' },
    { name: 'exif_focal_length', type: 'text' },
    { name: 'exif_aperture', type: 'text' },
    { name: 'exif_shutter_speed', type: 'text' },
    { name: 'exif_iso', type: 'text' },
    // Location group
    { name: 'location_lat', type: 'number' },
    { name: 'location_lng', type: 'number' },
    { name: 'location_name', type: 'text' },
    // Body content
    { name: 'content', type: 'richText' },
  ]
}
```

## Related Files

- `_layouts/photography.html` - Gallery index layout with JSON data store
- `_layouts/single-photo.html` - Single photo page layout (SEO/no-JS fallback)
- `assets/js/photo-gallery.js` - Alpine.js gallery modal component with URL routing
- `_includes/sections/photos-grid.html` - Photography gallery grid with click handlers
- `_includes/components/photo-metadata.html` - EXIF metadata display component
- `_includes/components/photo-navigation.html` - Previous/next navigation
- `_includes/components/photo-location-map.html` - Google Maps embed component
- `_homepage_sections/recent-photos.html` - Homepage photography section (simple mode)
