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
- `_layouts/content-wrapper.html` - Content wrapper with max-w-4xl centered container
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

## Post YAML for Homepage
Posts pulled from CMS can be marked featured with:
```yaml
featured: true  # Shows in homepage featured section
```

## Deployment Workflows

This project uses **four distinct deployment workflows** to handle different scenarios:

### 1. Production Site (`edwardjensen.net`)
**Workflow**: `deploy-prod-site.yml`  
**Trigger**: Push `v*` tag  
**Purpose**: Environment promotion from `main` branch on new tag  
**Destination**: Cloudflare Pages  
**CMS Data**: Production CMS  
**Site Code**: Tagged production code (vX.Y.Z)

### 2. Staging Site for Site Code Revisions
**Workflow**: `deploy-staging-site-code.yml`  
**Trigger**: Push to `main` branch  
**Purpose**: Test site code changes before production  
**Destination**: `stagingsite.edwardjensencms.com` (self-hosted server via rsync/SSH)  
**CMS Data**: Production CMS  
**Site Code**: Current `main` branch (may be ahead of latest tag)

### 3. Staging Site for CMS Changes
**Workflow**: `deploy-staging-cms.yml`  
**Trigger**: `repository_dispatch` event type `staging_cms_publish` / manual  
**Purpose**: Test CMS content changes with production site code  
**Destination**: `stagingsite.edwardjensencms.com` (self-hosted server via rsync/SSH)  
**CMS Data**: Staging CMS  
**Site Code**: Latest production tag (vX.Y.Z)

### 4. Republish Production Site
**Workflow**: `republish-prod-site.yml`  
**Trigger**: `repository_dispatch` event type `prod_cms_publish` / manual  
**Purpose**: Rebuild production site with latest CMS content (no code changes)  
**Destination**: Cloudflare Pages  
**CMS Data**: Production CMS  
**Site Code**: Latest production tag (vX.Y.Z)

### Workflow Summary Table

| Workflow | Trigger | Site Code | CMS Data | Destination |
|----------|---------|-----------|----------|-------------|
| `pr-checks.yml` | Pull request to `main` | PR branch | Production | N/A (build validation only) |
| `deploy-staging-site-code.yml` | Push to `main` | `main` branch | Production | stagingsite.edwardjensencms.com |
| `deploy-staging-cms.yml` | `staging_cms_publish` webhook | Latest `v*` tag | Staging | stagingsite.edwardjensencms.com |
| `deploy-prod-site.yml` | Push `v*` tag | Tagged version | Production | edwardjensen.net |
| `republish-prod-site.yml` | `prod_cms_publish` webhook | Latest `v*` tag | Production | edwardjensen.net |

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
- `_layouts/featured-tag-feed.xml` - RSS feed layout for featured tags
- `_plugins/featured_tag_feeds.rb` - Jekyll plugin that auto-generates RSS feeds
- `_includes/sections/featured-tags-list.html` - Index listing component
- `_site_pages/tags.md` - Index page at `/tags/`

**Front matter**: `title`, `tag` (slug), `image`, `image_alt`, `sort_ascending` (optional)

**Auto-generated RSS feeds**: Each featured tag automatically gets an RSS feed at `/feeds/{tag-slug}.xml` via the Jekyll plugin. The feed description uses the markdown body from the featured tag file.

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

**IMPORTANT: When making changes to this codebase, you (GitHub Copilot or Claude Code) must update the relevant documentation files as part of your changes.** Documentation should not drift from the actual code.

**Documentation files to update:**

- **`.github/copilot-instructions.md`** (this file) - Architecture overview, key patterns, deployment workflow
- **`CLAUDE.md`** - Build commands, site architecture, layouts, includes, deployment
- **`context-docs/site-work/project-context.md`** - Comprehensive project context and content workflows
- **`context-docs/site-work/content-schema.md`** - Content types and CMS schema documentation

**When to update documentation** (includes but is not limited to):
- New layouts or significant layout changes
- New includes or component patterns
- Changes to the deployment workflow or GitHub Actions
- New collections or content types
- Changes to the CSS class system
- New npm scripts or build commands
- Changes to the GraphQL/CMS integration
- Removing or renaming files referenced in documentation

**Related repository**: The Payload CMS application lives in a separate repository (`edwardjensen/edwardjensencms-payload`). Changes to CMS collections, fields, or content schema should be documented in that repository's `.github/copilot-instructions.md`.