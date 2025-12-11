# Content Schema for edwardjensen.net

This document outlines the content types used by the Jekyll site, including both CMS-managed content from Payload and file-based content still stored in the repository.

## Overview of Content Types

The site uses multiple content sources:

| Type | Source | URL Pattern | Use Case |
|------|--------|-------------|----------|
| **Posts** | Payload CMS | `/posts/:year/:year-:month/:slug` | Full essays, articles, and longer-form writing |
| **Working Notes** | Payload CMS | `/notes/:year-:month-:day/:slug` | Short-form updates, micro-thoughts, less polished ideas |
| **Historic Posts** | Payload CMS | `/archive/posts/:slug` | Preserved legacy WordPress archive (read-only) |
| **Photography** | File-based | `/photos/:year/:year-:month/:slug` | Photo essays and image galleries with captions |
| **Portfolio** | File-based | `/portfolio/:slug` | Showcase of projects, presentations, and publications |
| **Pages** | File-based | Custom (varies) | Static content like About, Biography, Writing archive |

---

## CMS-Managed Content (Payload CMS)

These content types are managed in Payload CMS and fetched via GraphQL at build time by the `_plugins/payload_cms.rb` plugin.

### 1. Posts

**CMS Collection**: `Posts`  
**Jekyll Collection**: `posts`  
**Default Layout**: `single-post`  
**Permalink**: `/posts/:year/:year-:month/:slug`  
**Purpose**: Full-length essays, articles, and thought pieces. These are the primary content type and appear in the main blog feed, homepage featured section, and RSS feeds.

#### CMS Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | text | Yes | Post title, used as admin display |
| `slug` | text | Yes | URL slug, auto-generated from title, unique |
| `date` | date | Yes | Publication date with time picker |
| `publishStatus` | select | Yes | Publishing state: `draft`, `scheduled`, or `published` |
| `categories` | array | No | Array of category strings |
| `tags` | array | No | Array of tag strings |
| `image` | upload | No | Header image (references Media collection in R2) |
| `imageAlt` | text | No | Alt text for header image |
| `excerpt` | textarea | No | Post excerpt/summary |
| `content` | richText | No | Post body content (Lexical editor) |
| `markdown` | textarea | Hidden | Virtual field for markdown conversion |
| `postCredits` | richText | No | Attribution/credits (rendered as separate lines) |
| `landingFeatured` | checkbox | No | Feature on landing page (default: false) |
| `renderWithLiquid` | checkbox | No | Enable Liquid templating (default: true) |
| `showImage` | checkbox | No | Display header image (default: true) |
| `redirectFrom` | array | No | Array of legacy URLs that redirect to this post |
| `permalink` | text | Computed | Read-only virtual field showing full URL path |

#### Publishing States

| State | Behavior |
|-------|----------|
| **Draft** | Internal only, not visible to Jekyll, remains draft until manually changed |
| **Scheduled** | Auto-publishes when `date <= now` via Payload Jobs Queue |
| **Published** | Live on site via Jekyll, triggers webhook on publish/unpublish |

#### Jekyll Template Fields

When content is fetched via GraphQL, these fields are available in Jekyll templates:

```liquid
{{ post.title }}
{{ post.date }}
{{ post.slug }}
{{ post.excerpt }}
{{ post.content }}           <!-- Rendered markdown content -->
{{ post.categories }}         <!-- Array of category strings -->
{{ post.tags }}               <!-- Array of tag strings -->
{{ post.image.url }}          <!-- R2 image URL -->
{{ post.image.alt }}          <!-- Image alt text -->
{{ post.imageAlt }}           <!-- Alternative alt text field -->
{{ post.showImage }}          <!-- Boolean: display header image -->
{{ post.landingFeatured }}    <!-- Boolean: show on landing page -->
{{ post.renderWithLiquid }}   <!-- Boolean: process Liquid in content -->
{{ post.postCredits }}        <!-- Attribution text -->
{{ post.redirectFrom }}       <!-- Array of redirect URLs -->
```

---

### 2. Working Notes

**CMS Collection**: `WorkingNotes`  
**Jekyll Collection**: `working_notes`  
**Default Layout**: `single-working-note`  
**Permalink**: `/notes/:year-:month-:day/:slug`  
**Purpose**: Short-form updates, micro-thoughts, and work-in-progress ideas that don't warrant a full blog post.

#### CMS Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | text | Yes | Note title |
| `slug` | text | Yes | URL slug, unique |
| `date` | date | Yes | Publication date |
| `publishStatus` | select | Yes | Publishing state: `draft`, `scheduled`, or `published` |
| `tags` | array | No | Array of tag strings |
| `content` | richText | No | Note body content (Lexical editor) |
| `markdown` | textarea | Hidden | Virtual field for markdown conversion |
| `permalink` | text | Computed | `/notes/:year-:month-:day/:slug` |

#### Comparison to Posts

| Feature | Posts | Working Notes |
|---------|-------|---------------|
| Length | Full articles (500-2000+ words) | Brief updates (100-300 words) |
| Structure | Formal with sections | Casual, free-form |
| Images | Featured image supported | No images (typically) |
| Categories | Yes | No (tags only) |
| Metadata | Extensive | Minimal |
| Tone | Professional/formal | Conversational/casual |
| Feeds | Main RSS/JSON feeds | Separate feeds only |

---

### 3. Historic Posts

**CMS Collection**: `HistoricPosts`  
**Jekyll Collection**: `historic_posts`  
**Default Layout**: `retired-post`  
**Permalink**: `/archive/posts/:slug`  
**Purpose**: Archived posts preserved for historical reference (legacy WordPress content).

**Note**: Unlike Posts and Working Notes, Historic Posts does **not** have a `publishStatus` field. These use only Payload's built-in `_status` (draft/published) without scheduled publishing.

#### CMS Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | text | Yes | Post title |
| `slug` | text | Yes | URL slug, unique |
| `date` | date | Yes | Original publication date |
| `categories` | array | No | Array of category strings |
| `tags` | array | No | Array of tag strings |
| `image` | upload | No | Header image |
| `imageAlt` | text | No | Alt text for header image |
| `excerpt` | textarea | No | Post excerpt/summary |
| `content` | richText | No | Post body content |
| `postCredits` | richText | No | Attribution/credits |
| `permalink` | text | Computed | `/archive/posts/:slug` |

---

### Media Collection

**CMS Collection**: `Media`  
**Purpose**: All uploaded files (images, documents) stored in Cloudflare R2.

#### CMS Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `alt` | text | Yes | Alt text for accessibility |

Media files are uploaded via the Payload admin UI and automatically stored in Cloudflare R2 with public URLs.

---

## File-Based Content (Jekyll Repository)

These content types are still managed as files in the Jekyll repository.

### 4. Photography (`_photography/`)

**Directory**: `_photography/`  
**Permalink**: `/photos/:year/:year-:month/:slug`  
**Layout**: `single-post`  
**Purpose**: Photo essays, image galleries, and visual storytelling with written context.

#### YAML Front Matter

```yaml
---
title: "Photo Title"
date: "2024-11-23"
tags:
  - downtown-saint-paul
image: /assets/photography/20241120-IMG_7685.jpg
image_alt: "Descriptive alt text for the photograph"
redirect_from:
  - /photography/old-slug/
---

Caption or description of the photograph.
```

#### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Title of the photograph |
| `date` | Yes | Date taken or published |
| `tags` | No | Topic tags for categorization |
| `image` | Yes | Path to photograph file |
| `image_alt` | No | Alt text (recommended for accessibility) |
| `redirect_from` | No | Legacy URLs to redirect |

---

### 5. Portfolio (`_portfolio/`)

**Directory**: `_portfolio/`  
**Permalink**: `/portfolio/:slug`  
**Layout**: `portfolio`  
**Purpose**: Showcase of portfolio items, projects, presentations, and publications.

#### YAML Front Matter

```yaml
---
title: A Brief History of Midtown Phoenix
date: 2019-04-29
image: /assets/images/pages/20190429-midtownphx.png
redirect_from:
  - /portfolio/a-brief-history-of-midtown-phoenix/
---

Description of the project or work.
```

#### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Project/item title |
| `date` | Yes | Project or publication date |
| `image` | Yes | Featured image |
| `redirect_from` | No | Legacy URLs to redirect |

---

### 6. Pages (`_pages/`)

**Directory**: `_pages/`  
**Permalink**: Custom per page  
**Purpose**: Static content like About, Biography, Portfolio overview, Writing archive, Search, Privacy Policy.

#### YAML Front Matter Examples

**Standard Page**:
```yaml
---
title: "Biography"
date: "2013-03-25"
layout: page
permalink: /about/
redirect_from:
  - /biography/
searchable: false
---
```

**Landing Page**:
```yaml
---
title: "Let's Connect"
layout: landing-page
image: "/assets/images/bluebackground.png"
searchable: false
permalink: /hi
collection: landing_sections
---
```

**Archive Page**:
```yaml
---
title: Writing
subtitle: Essays, thoughts, and observations
layout: writing-base
permalink: /writing/
searchable: false
---
```

#### Common Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Page title |
| `layout` | Yes | Layout template to use |
| `permalink` | Usually | URL path for the page |
| `date` | No | Last updated date |
| `subtitle` | No | Secondary description below title |
| `searchable` | No | When `false`, excludes from search |
| `image` | No | Featured image for social sharing |
| `redirect_from` | No | Legacy URLs to redirect |
| `collection` | No | Collection for dynamic page sections |

---

## Jekyll Collection Configuration

Collections are configured in `_config.yml`:

```yaml
collections:
  posts:
    output: true
    permalink: /:collection/:year/:year-:month/:title
    cms:
      collection: Posts
      layout: single-post
      fields:
        - id
        - title
        - slug
        - date
        - categories { category }
        - tags { tag }
        - image { url alt }
        - imageAlt
        - excerpt
        - showImage
        - renderWithLiquid
        - landingFeatured
        - markdown
        - postCredits
        - redirectFrom { url }
  
  working_notes:
    output: true
    permalink: /notes/:year-:month-:day/:title
    cms:
      collection: WorkingNotes
      layout: single-working-note
      fields:
        - id
        - title
        - slug
        - date
        - tags { tag }
        - markdown
  
  historic_posts:
    output: true
    permalink: /archive/posts/:title
    cms:
      collection: HistoricPosts
      layout: retired-post
      fields:
        - id
        - title
        - slug
        - date
        - categories { category }
        - tags { tag }
        - image { url alt }
        - imageAlt
        - excerpt
        - markdown
        - postCredits
  
  photography:
    output: true
    permalink: /photos/:year/:year-:month/:title
  
  portfolio:
    output: true
    permalink: /portfolio/:title
```

---

## GraphQL Content Fetching

The `_plugins/payload_cms.rb` plugin fetches content from Payload CMS at build time:

1. Plugin reads `cms` configuration from each collection's metadata
2. Builds GraphQL query for the specified collection and fields
3. Filters by `_status: published` to only fetch live content
4. Converts CMS data to Jekyll document objects
5. Jekyll renders documents using the specified layout

### GraphQL Query Example (Posts)

```graphql
query GetPublished($limit: Int) {
  Posts(where: { _status: { equals: published } }, limit: $limit, sort: "-date") {
    docs {
      id
      title
      slug
      date
      categories { category }
      tags { tag }
      image { url alt }
      imageAlt
      excerpt
      showImage
      renderWithLiquid
      landingFeatured
      markdown
      postCredits
      redirectFrom { url }
    }
    totalDocs
  }
}
```

### Content Conversion

- Rich text content is converted from Lexical JSON to markdown via the `markdown` virtual field
- Images reference Cloudflare R2 URLs
- Dates are parsed and used for sorting
- Categories and tags are arrays of strings

---

## Content Creation Workflow

### For CMS Content (Posts, Working Notes, Historic Posts)

1. Log into Payload CMS admin panel (`edwardjensencms.com` or `staging.edwardjensencms.com`)
2. Navigate to the appropriate collection
3. Click "Create New"
4. Fill in fields (title, content, categories, tags, etc.)
5. Upload images via the Media upload field (stored in Cloudflare R2)
6. Set publication status:
   - **Draft**: Save for later, not visible on site
   - **Scheduled**: Set future date for auto-publish
   - **Published**: Immediately live on site
7. On publish, CMS fires webhook → GitHub Actions → Jekyll build → Deploy

### For File-Based Content (Photography, Portfolio, Pages)

1. Create new file in appropriate directory (`_photography/`, `_portfolio/`, `_pages/`)
2. Add YAML front matter with required fields
3. Add content body in Markdown
4. Commit and push to repository
5. Push to `main` triggers staging deployment
6. Tag for production promotion

---

## Feed Distribution

| Feed | URL | Content |
|------|-----|---------|
| Main RSS | `/feed.xml` | All posts |
| Main JSON | `/feed.json` | All posts |
| Essays RSS | `/_feeds/feed-essays.xml` | Blog posts only |
| Notes RSS | `/_feeds/feed-notes.xml` | Working notes only |
| Notes JSON | `/_feeds/feed-notes.json` | Working notes only |

---

## Migration Notes

### Content Successfully Migrated to CMS

- ✅ All blog posts (from `_posts/`)
- ✅ All working notes (from `_working_notes/`)
- ✅ All historic posts (from legacy WordPress export)

### Content Remaining File-Based

- Photography (`_photography/`) - Future CMS migration planned
- Portfolio (`_portfolio/`) - Future CMS migration planned
- Static pages (`_pages/`) - May remain file-based

### Legacy Directories

The `_posts/`, `_working_notes/`, and `_historic_posts/` directories may still exist in the repository but are no longer used. All new content should be created in Payload CMS.
