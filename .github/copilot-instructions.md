# Copilot Instructions for edwardjensen-net-jekyll

## Tech Stack
- **Framework**: Jekyll 4.4.1 (Ruby static site generator)
- **Styling**: Tailwind CSS 4.0.x with custom amber/slate color scheme + reusable CSS classes
- **Interactivity**: AlpineJS v3 (lightweight component state/transitions)
- **Runtime**: Ruby 3.4.5 + Node 25.1.0
- **Content Source**: Payload CMS (headless, content via GraphQL at build time)
- **Deployment**: Environment promotion model (staging → production)

## Reusable CSS Classes (Oct 2025)

The site uses **custom Tailwind classes** defined in `assets/css/main.css` (@layer components). Always use these instead of inline utilities for consistency.

**Full documentation**: See `site-docs/LAYOUTS_AND_STYLES.md`

### Quick Reference

**Text & Typography**:
- `.text-body` - Standard body text (`text-slate-900 dark:text-slate-50`)
- `.text-muted` - Secondary/muted text (`text-slate-600 dark:text-slate-400`)
- `.text-heading` - Heading text with dark mode opacity

**Links & Interactions**:
- `.link-accent` - Amber links with hover (use for all standard links)
- `.icon-interactive` - Interactive icons (social icons, nav icons)

**Buttons**:
- `.btn-primary` - Primary CTA (filled amber)
- `.btn-secondary` - Secondary action (outline amber)
- `.btn-ghost` - Tertiary/cancel (minimal style)

**UI Components**:
- `.dropdown-menu` - Dropdown menus with glass-morphism
- `.info-box` - Info messages
- `.badge-accent` - Tags/categories
- `.input-default` - Form inputs
- `.section-bg` - Section backgrounds

**When to use**:
- ✅ Use reusable classes for: buttons, links, text colors, UI components
- ❌ Use inline utilities for: layout spacing, grid/flex, one-off adjustments

**To change site-wide styles**: Edit `assets/css/main.css` in `@layer components` section

## Architecture Overview (Oct 2025 Redesign)

### Layout Structure (REFACTORED)
**Old pattern**: Sidebar layout (3-col grid with left sidebar nav)  
**New pattern**: Full-width stacked layout with sticky top header

**Key files**:
- `_layouts/base.html` - Root layout with HTML boilerplate, sticky header nav, footer
- `_layouts/content-wrapper.html` - Content wrapper with max-w-7xl centered container
- `_includes/components/header-nav.html` - Sticky header with responsive nav
- `_includes/components/seo.html` - Custom SEO meta tags (Open Graph, Twitter Cards)

**Header behavior**:
- Sticky position (z-40) with 80% opacity + backdrop blur
- Desktop: horizontal nav with site title left, nav center, social icons right (gap-2, lowercase)
- Mobile: hamburger menu only (nav links inside dropdown, slides down/up with animation)
- All text in header is lowercase (use `lowercase` class)

### Color Palette (Warm, not blue)
- **Light**: White backgrounds (`bg-white`), slate text (`text-slate-900`)
- **Dark**: Slate-950 backgrounds (`dark:bg-slate-950`), slate-50 text (`dark:text-slate-50`)
- **Accent**: Amber (`text-amber-600`, hover `dark:text-amber-400`) - replaces blue throughout
- Apply warm color scheme to all new components (avoid blue/purple)
- **Important**: Use reusable classes (`.text-body`, `.text-muted`, `.link-accent`) instead of inline color utilities

### Typography
- Font family: `basic-sans` (sans), `museo-slab` (headers)
- Use normal title case (not UPPERCASE) - apply `lowercase` class to header elements only
- Improved line-heights and spacing defined in tailwind.config.js
- **Text colors**: Use `.text-body` for main text, `.text-muted` for secondary text, `.text-heading` for headings

## Image Alt Text
Alt text is presented in a fenced code block, single line, for easy markdown copying. Include short description first, then all visible text exactly as shown. Escape quotes/punctuation.

Example:
```
Screenshot of website header with site title on left, navigation menu center, social icons right
```

## Common Tasks

**Build & serve locally**: `bundle exec jekyll serve`  
**Build production**: `JEKYLL_ENV=production bundle exec jekyll build`  
**Color references**: Amber (`amber-600`/`dark:amber-400`), Slate backgrounds, white text on dark

**Note on rebuilding**: Edits to files in `site-docs/`, `.github/`, or `.claude/` folders do NOT require rebuilding the Jekyll site, as these folders are not processed by Jekyll. Only changes to layouts, includes, posts, pages, assets, or config files require a rebuild.

## Content Source

This repository is **code and templates only**. All content (posts, working notes, historic posts) lives in **Payload CMS** and is fetched via GraphQL at build time.

**Content workflow**: CMS publish → webhook → GitHub Actions → Jekyll build → Deploy

**CMS Plugin** (`_plugins/payload_cms.rb`):
- Fetches content from Payload CMS via GraphQL at build time
- Converts Lexical rich text JSON to HTML for rendering
- **Link handling**: Payload uses `fields.linkType` to distinguish link types:
  - External/custom links: URL in `fields.url`
  - Internal links: URL in `fields.doc.value.permalink`

## Embedded Content System

Embedded content (like working notes within blog posts) is rendered as complete HTML by Payload CMS handlers. The HTML is output in the `markdown` field and preserved by kramdown using the `markdown="0"` attribute. The `_includes/embeds/` directory contains reference templates only.

**Current Embeds:**
- `working-note.html` - Working note embedded in blog posts (reference only - HTML comes from Payload)

**Important:** Collections that include embedded content must explicitly list the `markdown` field in their GraphQL `fields:` config in `_config.yml`. Without this, embedded content won't be fetched from the CMS.

**Adding New Embed Types:**
1. Create handler in Payload CMS (`src/lib/blocks/handlers/`)
2. Handler outputs complete HTML with `markdown="0"` attribute
3. Add BEM-style CSS in `assets/css/main.css`
4. Ensure the collection's `fields:` config includes `markdown`

**CSS Naming Convention:** Use BEM with `.embedded-{type}` as block name (e.g., `.embedded-working-note`, `.embedded-working-note__title`).

## Post YAML for Homepage
Posts pulled from CMS can be marked featured with:
```yaml
featured: true  # Shows in homepage featured section
```

## Deployment Workflows

This project uses **six deployment workflows** with a unified staging architecture:

### Workflow Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `pr-checks.yml` | Pull request to `main` | Build validation (no deployment) |
| `deploy-staging.yml` | Push to `main`, repository_dispatch, manual | Unified staging deployment |
| `deploy-prod-site.yml` | Push `v*` tag | Production release |
| `republish-prod-site.yml` | `prod_cms_publish` webhook, manual | Rebuild production with CMS changes |
| `publish-prod-photo.yml` | `prod_cms_photo_publish` webhook, manual | Rebuild production for new photography |
| `cleanup-cloudflare.yml` | Weekly schedule, manual | Clean old Cloudflare deployments |

### Unified Staging Workflow

The `deploy-staging.yml` workflow uses configuration from `_data/staging-config.yml` to handle multiple staging scenarios:

**Configuration Dimensions:**
- **site_code**: `main` (current branch) or `latest-tag` (production vX.Y.Z tag)
- **cms_source**: `production` or `staging` CMS
- **deploy_target**: `local-server` or `cloudflare`

**Trigger Mappings:**

| Trigger | site_code | cms_source | deploy_target |
|---------|-----------|------------|---------------|
| Push to `main` | main | staging | cloudflare |
| `staging_cms_publish` | latest-tag | staging | local-server |
| `staging_cms_photo_publish` | main | staging | local-server |
| Manual (default) | main | production | local-server |

### Workflow Summary Table

| Workflow | Trigger | Site Code | CMS Data | Destination |
|----------|---------|-----------|----------|-------------|
| `pr-checks.yml` | Pull request to `main` | PR branch | Production | N/A (build only) |
| `deploy-staging.yml` | Push to `main` | `main` branch | Staging | staging.edwardjensen.net |
| `deploy-staging.yml` | `staging_cms_publish` | Latest `v*` tag | Staging | stagingsite.edwardjensencms.com |
| `deploy-prod-site.yml` | Push `v*` tag | Tagged version | Production | edwardjensen.net |
| `republish-prod-site.yml` | `prod_cms_publish` | Latest `v*` tag | Production | edwardjensen.net |
| `publish-prod-photo.yml` | `prod_cms_photo_publish` | Latest `v*` tag | Production | edwardjensen.net |

### Development Workflow

1. **Feature Development**: Create `feature/*` branch from `main`, develop locally
2. **Code Review**: Open PR to merge `feature/*` into `main` (must pass PR checks)
3. **Staging Deployment**: Merge to `main` triggers automatic deployment to staging
4. **Production Promotion**: After validation, create version tag `git tag v1.2.3 && git push --tags`
5. **CMS Changes**: Publish in CMS triggers automatic production rebuild with latest tag

## Featured Tags Collection

The `_featured-tags/` collection provides curated landing pages for specific tags with hero images, summary content, and filtered post listings.

**Key files**:
- `_layouts/featured-tag.html` - Featured tag landing page layout
- `_includes/sections/featured-tags-list.html` - Index listing component
- `_site_pages/tags.md` - Index page at `/tags/`

**Front matter**: `title`, `tag` (slug), `image`, `image_alt`, `sort_ascending` (optional)

**RSS feeds**: Generated by the unified RSS feed plugin (see below).

## RSS Feed Generator Plugin

All RSS feeds are generated by `_plugins/rss_feed_generator.rb` using configuration in `_data/rss-feeds.yml`.

**Key files**:
- `_plugins/rss_feed_generator.rb` - Unified feed generator using Ruby `builder` gem
- `_data/rss-feeds.yml` - Feed configuration

**Static feeds** (configured in `feeds[]`):
- `/feed.xml` - Main site feed (all posts, 10 items)
- `/feeds/essays.xml` - Posts filtered by "essays" category
- `/feeds/notes.xml` - Working notes with full HTML content

**Dynamic feeds** (configured in `dynamic_feeds[]`):
- `/feeds/{tag-slug}.xml` - One feed per featured tag, filtered by tag

**JSON feeds** (Liquid templates in `_feeds/`):
- `/feed.json` - Main JSON Feed
- `/feeds/notes.json` - Working Notes JSON Feed

## Pagination Plugin

Collection-agnostic pagination with dynamic filtering, replacing `jekyll-paginate-v2`.

**Key files**:
- `_plugins/pagination_generator.rb` - Pagination generator plugin
- `_data/pagination.yml` - Global defaults and collection-level config
- `_includes/components/pagination.html` - Reusable pagination UI component

**Configuration hierarchy** (highest to lowest priority):
1. Page front matter (`pagination:` block)
2. Collection-level config in `_data/pagination.yml`
3. Global defaults in `_data/pagination.yml`

**Template usage**: Access via `page.paginator.items`, `page.paginator.total_pages`, etc.

**CMS consideration**: For CMS-sourced collections, use collection-level config in `_data/pagination.yml` rather than front matter (since CMS may not support arbitrary front matter fields).

## Sitemap Generator Plugin

Custom sitemap generator replacing the abandoned `jekyll-sitemap` gem.

**Key files**:
- `_plugins/sitemap_generator.rb` - Sitemap generator plugin
- `_data/sitemap.yml` - Configuration (output path, exclude patterns)
- `robots.txt` - Static file with sitemap URL reference

**Generates**:
- `/sitemap.xml` - sitemaps.org-compliant XML with `<loc>` and `<lastmod>` elements
- `/robots.txt` - References the sitemap URL

**Exclusions** (automatically excluded from sitemap):
- Entries with `sitemap: false` in front matter
- Entries with `searchable: false` in front matter (unless `sitemap: true` is also set)
- Pagination pages (URLs containing `/page/`)
- Draft/unpublished CMS content (`_status == 'draft'`)
- Non-HTML files (CSS, JS, JSON, XML, images, fonts)
- Special files (404.html, _redirects, robots.txt)

**Override behavior**: An explicit `sitemap: true` overrides the `searchable: false` exclusion, allowing pages to appear in the sitemap while remaining excluded from site search.

## Photography Gallery Modal

The photography gallery (`/photos/`) uses a modal overlay system with URL routing.

**Key files:**

- `_layouts/photography.html` - Gallery layout with embedded JSON data store
- `assets/js/photo-gallery.js` - Alpine.js component with History API integration
- `_layouts/single-photo.html` - SEO/no-JS fallback with gallery transformation script

**Behavior:**

- Click photo → modal opens, URL changes to photo permalink
- Back button → closes modal, returns to source URL (context-aware)
- Direct URL access → fetches gallery, opens modal over it
- Modal: image left, details right (desktop); stacked (mobile)

**Key features:**

- **Source URL tracking**: Tracks where user came from for context-aware back navigation ("Home", "Gallery", or "Back")
- **XSS prevention**: `escapeHtml()` sanitizes dynamic content in modal titles
- **Google Maps config**: Centralized in `_data/google-maps.yml` (zoom, size, proxy URL)

**Two modes:**

- **Full mode** (photography index): JSON data store, URL routing, full details
- **Simple mode** (homepage): Data attributes, lightbox-only, no URL changes

**CMS migration:** Update `_layouts/photography.html` to generate JSON from GraphQL. The JS reads from `#photo-gallery-data` and requires no changes.

## Camera Stream Page

The site includes an occasionally live camera stream at `/saintpaulcamera/` featuring a Cloudflare Stream embed.

**Key files:**

- `_site_pages/saintpaullive.md` - Page definition
- `_camerastream_sections/livestream.html` - Cloudflare Stream iframe embed

**Features:**

- Uses `landing-page` layout with `camerastream_sections` collection
- Cloudflare Stream iframe with `autoplay=true&muted=true`
- Responsive 16:9 aspect ratio (`aspect-video`)
- Excluded from search (`searchable: false`), included in sitemap

## Key Patterns

- Use `.lowercase` class for all header text
- Use `gap-2` for tight social icon spacing
- Alpine.js `x-data` on parent container (not individual elements)
- Use reusable CSS classes (`.btn-primary`, `.link-accent`, `.text-body`, etc.) instead of inline utilities for common patterns
- All colors use amber accent (not blue) - if you see blue hovers, replace with amber

## Documentation
- **Primary reference**: `site-docs/LAYOUTS_AND_STYLES.md` - Layout system + CSS class reference
- **Quick lookup**: See "Quick Reference (Cheat Sheet)" section at top of LAYOUTS_AND_STYLES.md
- **Context files**: `context-docs/site-work/` - Project context and content schema documentation

## Documentation Requirements

**CRITICAL: When making changes to this codebase, you (GitHub Copilot or Claude Code) MUST update the relevant documentation files as part of your changes.** Documentation drift causes significant problems for AI-assisted development.

### Primary Documentation Files (MUST be kept in sync)

These two files are the primary references for AI assistants and MUST BOTH be updated when making code changes:

| File | Purpose | AI Consumer |
|------|---------|-------------|
| **`.github/copilot-instructions.md`** | Quick reference, key patterns, deployment | GitHub Copilot |
| **`CLAUDE.md`** | Comprehensive guide, detailed architecture | Claude Code |

**Both files document the same codebase from different perspectives.** Changes to one typically require changes to the other. When in doubt, update both.

### Secondary Documentation Files

- **`context-docs/site-work/project-context.md`** - Deep technical context and content workflows
- **`context-docs/site-work/content-schema.md`** - CMS field documentation and content types

### When to Update Documentation

Update documentation for ANY of the following:

- New layouts or significant layout changes
- New includes or component patterns
- Changes to the deployment workflow or GitHub Actions
- New collections or content types
- Changes to the CSS class system
- New npm scripts or build commands
- Changes to the GraphQL/CMS integration
- Removing or renaming files referenced in documentation
- New data files in `_data/`
- New plugins in `_plugins/`

### Cross-Repository Documentation

The Payload CMS application lives in a separate repository (`edwardjensen/edwardjensencms-payload`). Changes to CMS collections, fields, or content schema should be documented in that repository's `.github/copilot-instructions.md`.