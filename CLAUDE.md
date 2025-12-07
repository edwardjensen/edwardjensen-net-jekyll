# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based personal website/portfolio for Edward Jensen, built with Ruby and Jekyll 4.4.1. The site uses Tailwind CSS 4.x for styling and is deployed to Cloudflare Pages. The architecture follows a traditional Jekyll pattern with collections for posts, photography, and portfolio items.

## Build Commands

### Local Development
```bash
# Install dependencies
bundle install
npm install

# Serve site locally (development mode)
bundle exec jekyll serve

# Build site (production mode)
JEKYLL_ENV=production bundle exec jekyll build
```

### Accessibility Testing
```bash
# Run accessibility checks (requires site to be running)
npm run a11y              # Check localhost:4000
npm run a11y:dev          # Check development site
npm run a11y:prod         # Check production site
npm run a11y:report       # Generate JSON report
npm run a11y:lenient      # Run without failing on issues
```

## Site Architecture

### Collections Structure

The site uses Jekyll collections defined in [_config.yml](_config.yml):

- **`_posts/`** - Blog posts (permalink: `/posts/YYYY/YYYY-MM/title`)
- **`_photography/`** - Photography posts (permalink: `/photos/YYYY/YYYY-MM/title`)
- **`_portfolio/`** - Portfolio items (permalink: `/portfolio/title`)
- **`_working_notes/`** - Working notes (permalink: `/notes/YYYY-MM-DD/title`)
- **`_feeds/`** - Feed configurations
- **`_homepage_sections/`** - Homepage section partials (not output)
- **`_landing_sections/`** - Landing page section partials (not output)

### Layouts Hierarchy

The site uses a two-tier layout inheritance pattern (refactored Oct 2025 to full-width stacked layout):

**Base Layouts:**
- **[base.html](_layouts/base.html)** - Root layout with HTML boilerplate, sticky header nav, skip-to-main link, and footer
- **[content-wrapper.html](_layouts/content-wrapper.html)** - Extends base, adds full-width main with max-w-4xl centered container

**Content Layouts** (all extend content-wrapper):
- **[default.html](_layouts/default.html)** - Simple content wrapper
- **[page.html](_layouts/page.html)** - Standard page with header styling
- **[single-post.html](_layouts/single-post.html)** - Blog post with article header, metadata, featured image, navigation
- **[single-working-note.html](_layouts/single-working-note.html)** - Working notes layout
- **[writing-base.html](_layouts/writing-base.html)** - Writing archive pages with customizable header
- **[photography.html](_layouts/photography.html)** - Photography gallery page
- **[portfolio.html](_layouts/portfolio.html)** - Portfolio grid page
- **[landing-page.html](_layouts/landing-page.html)** - Landing pages with custom sections
- **[gallery-page.html](_layouts/gallery-page.html)** - Photo gallery layout
- **[working-notes.html](_layouts/working-notes.html)** - Working notes archive
- **[search-page.html](_layouts/search-page.html)** - Search results page

**Layout Features:**
- Layouts can inject additional `<head>` content via `content_for_head` front matter variable
- Sticky header navigation component included in base layout
- Full-width stacked layout with centered max-w-4xl content container
- Warm amber/slate color scheme throughout

### Includes Structure

Includes are organized into three logical subdirectories in [_includes/](_includes/):

**`core/`** - Infrastructure used by base layouts:

- **[header-includes.html](_includes/core/header-includes.html)** - HTML `<head>` content (meta tags, CSS, fonts)
- **[sidebar.html](_includes/core/sidebar.html)** - Site navigation sidebar (legacy, replaced by header-nav in main layout)
- **[footer.html](_includes/core/footer.html)** - Site footer

**`components/`** - Reusable UI elements:

- **[header-nav.html](_includes/components/header-nav.html)** - Sticky header navigation with responsive mobile menu
- **[post-credits.html](_includes/components/post-credits.html)** - Post author attribution box
- **[post-navigation.html](_includes/components/post-navigation.html)** - Previous/next post navigation links
- **[privacy-modal.html](_includes/components/privacy-modal.html)** - Privacy policy modal
- **[working-note.html](_includes/components/working-note.html)** - Working note component
- **[prose-content.html](_includes/components/prose-content.html)** - Formatted prose content wrapper

**`sections/`** - Content sections and list views:

- **[post-list.html](_includes/sections/post-list.html)** - Flexible post listing (supports filtering by year, historical notes)
- **[photos-grid.html](_includes/sections/photos-grid.html)** - Photography gallery grid
- **[portfolio-grid.html](_includes/sections/portfolio-grid.html)** - Portfolio items grid

### Styling Architecture

This project uses Tailwind CSS 4.x with the following configuration:

- **[tailwind.config.js](tailwind.config.js)** - Defines content sources, custom fonts (basic-sans, museo-slab), and includes @tailwindcss/typography plugin
- **[postcss.config.js](postcss.config.js)** - PostCSS processes Tailwind and applies cssnano minification
- **[assets/css/main.css](assets/css/main.css)** - Custom reusable CSS classes in @layer components (buttons, links, text colors, etc.)
- Tailwind is integrated via jekyll-postcss-v2 plugin
- Dark mode is enabled with system-based media query detection

### Data Files

The [_data/](_data/) directory contains:

- **[navbar.yml](_data/navbar.yml)** - Navigation menu structure
- **[social.yml](_data/social.yml)** - Social media links
- **[redirects.yml](_data/redirects.yml)** - URL redirects
- **[a11y-check-urls.yml](_data/a11y-check-urls.yml)** - URLs to check for accessibility
- **[microphotos.json](_data/microphotos.json)** - Processed micro.blog photos (generated by script)
- **buildinfo.yml** - Build information (generated during CI/CD)

## Build Scripts

Located in [scripts/](scripts/):

### Micro Photo Processing

- **[microphotojsonprocessor.ps1](scripts/microphotojsonprocessor.ps1)** - Fetches and processes micro.blog photos from `https://micro.edwardjensen.net/photos/index.json`, extracting thumbnails, links, and alt text

```bash
# Fetch and process microphotos (run from root)
npm run photos
# Or directly:
pwsh -File ./scripts/microphotojsonprocessor.ps1 -InputUri "https://micro.edwardjensen.net/photos/index.json"
```

### Accessibility Checking

- **[a11y-check.js](scripts/a11y-check.js)** - Node.js script that runs pa11y accessibility audits on the site using URL definitions from `_data/a11y-check-urls.yml`

```bash
# Run accessibility checks
npm run a11y              # Check localhost:4000
npm run a11y:dev          # Check development site
npm run a11y:staging      # Check staging site
npm run a11y:prod         # Check production site
npm run a11y:report       # Generate JSON report
```

### Asset Management

- **[copy-vendor-assets.js](scripts/copy-vendor-assets.js)** - Copies vendor assets (Alpine.js, Bootstrap Icons) from node_modules to assets directory

## Deployment

The site deploys to Cloudflare Pages via GitHub Actions:

### Production Site ([.github/workflows/deploy-prod-site.yml](.github/workflows/deploy-prod-site.yml))

- Triggers on push to `main` branch, daily schedule (13:55 UTC), or manual dispatch
- Generates build info (commit SHA, run ID, build type)
- Processes microphotos from micro.blog
- Builds with `JEKYLL_ENV=production`
- Deploys to Cloudflare Pages using Wrangler

### Staging Site ([.github/workflows/deploy-staging-site.yml](.github/workflows/deploy-staging-site.yml))

- Triggers on push to `staging` branch or manual dispatch
- Similar workflow using `_config.staging.yml` for staging-specific configuration
- Deploys to separate Cloudflare Pages staging environment

### Content Sync ([.github/workflows/sync-prod-content-to-staging.yml](.github/workflows/sync-prod-content-to-staging.yml))

- Syncs content from `main` to `staging` branch when content folders change

### Accessibility Checks ([.github/workflows/pa11y-checks-on-staging-pr.yml](.github/workflows/pa11y-checks-on-staging-pr.yml))

- Runs accessibility checks on staging pull requests

## Environment Variables

Set in GitHub repository variables:
- `RUBY_VERSION` - Ruby version for CI
- `NODE_VERSION` - Node.js version for CI

Set in GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CF_PAGES_PROJECT`

## Image Alt Text Guidelines

From [.github/copilot-instructions.md](.github/copilot-instructions.md):

When writing alt text for images, present it in a fenced code block on a single line for easy copying into Markdown. Include a short description of the image nature first, then all text visible in screenshots exactly as shown. Escape quotation marks and punctuation properly.

## Site Configuration

Key settings in [_config.yml](_config.yml):

- URL: `https://www.edwardjensen.net`
- Uses jekyll-postcss-v2 for Tailwind integration
- Plugins: jekyll-postcss-v2, jekyll-sitemap, jekyll-paginate-v2, jekyll-seo-tag, jekyll-redirect-from
- Excludes: package files, node_modules, postcss/tailwind configs, .vscode, .github, _config.staging.yml, scripts, .claude, site-docs, CLAUDE.md, README.md
- Kramdown with GFM input for markdown processing
- Permalinks follow pattern: `/:collection/:year/:year-:month/:title`
- Pagination enabled: 20 posts per page, sorted by date (reverse)

## Design System Notes

From [.github/copilot-instructions.md](.github/copilot-instructions.md):

### Reusable CSS Classes

The site uses custom Tailwind classes defined in `assets/css/main.css` (@layer components). Always use these for consistency:

- **Text**: `.text-body`, `.text-muted`, `.text-heading`
- **Links**: `.link-accent` (amber links with hover)
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- **Icons**: `.icon-interactive`
- **Components**: `.dropdown-menu`, `.info-box`, `.badge-accent`, `.input-default`, `.section-bg`

### Layout & Color

- **Layout**: Full-width stacked with sticky header (refactored Oct 2025, no sidebar)
- **Header**: Sticky top navigation with backdrop blur, horizontal on desktop, hamburger on mobile
- **Colors**: Warm amber/slate palette (not blue) - amber-600/400 for accents, slate-900/50 for text
- **Typography**: `basic-sans` for body, `museo-slab` for headers, lowercase class for header text
- **Content Container**: max-w-4xl, centered with proper spacing
