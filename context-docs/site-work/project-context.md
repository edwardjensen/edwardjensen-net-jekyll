# edwardjensen.net Site Work Project Context

Technical advice context for edwardjensen.net, a modern personal portfolio and blog at the intersection of nonprofit technology, urban civic engagement, and documentary photography.

---

## 🎯 Core Purpose & Content Strategy

**Mission**: A platform for Edward Jensen to share writing and reflection on nonprofit technology, systems thinking, civic engagement, and urban photography.

**Primary Content Focus**:
- **Essays** (blog posts): Polished, long-form writing on nonprofit IT strategy, technology, systems thinking
- **Working Notes**: Microblog-style reflections, quick thoughts, and updates (not full essays)
- **Historic Posts**: Legacy WordPress archive (read-only, preserved for reference)
- **Photography**: Documentary and urban photography portfolio
- **Project Portfolio**: Civic engagement and leadership work showcase
- **Live Camera Stream**: Occasionally live stream of downtown Saint Paul, Minnesota

**Target Cadence**: 1-2 new posts per week (ongoing goal)

**Distribution**: Site as primary hub, with links to Bluesky and LinkedIn

**Content Management**: Payload CMS (headless CMS) as single source of truth for Posts, Working Notes, and Historic Posts; Jekyll pulls content via GraphQL at build time

---

## 🛠 Technical Stack (Current as of Dec 2025)

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **SSG** | Jekyll | 4.4.1 | Ruby-based static site generator |
| **Styling** | Tailwind CSS | 4.0.x | PostCSS workflow, custom amber/slate palette |
| **Interactivity** | AlpineJS | v3 | Lightweight DOM state, no build step required |
| **Color Scheme** | Amber/Slate | Warm | Amber accents (`text-amber-600` light, `dark:text-amber-400` dark), slate backgrounds/text |
| **Staging** | Self-hosted | — | Deployed via rsync/SSH to staging server |
| **Production** | Cloudflare Pages | — | Deployed via Wrangler on version tags |
| **Runtime** | Ruby 3.4.5 + Node 25.1.0 | — | Bundler for gems, npm for CSS tooling |
| **CMS** | Payload CMS | 3.67.0 | Headless CMS (single source of truth for content) |
| **CMS Database** | PostgreSQL | — | Payload content storage |
| **Media Storage** | Cloudflare R2 | — | S3-compatible object storage for images/assets |

---

## 🏗 Content Infrastructure Architecture

### Payload CMS + Jekyll Integration (Production)

The site uses a **headless CMS architecture** where content is managed in Payload CMS and consumed by Jekyll at build time:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Payload CMS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │ Cloudflare  │  │ Content Collections     │  │
│  │ Database    │  │ R2 Assets   │  │ (Posts, Notes, Media)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                            │                                    │
│                            │ Webhook on publish                 │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ repository_dispatch triggers Jekyll build               │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Jekyll (edwardjensen-net-jekyll)                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ payload_cms.rb plugin queries GraphQL at build time     │    │
│  │ Renders static HTML → Deploys to Cloudflare Pages       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Live URLs

| Environment | CMS URL | Website URL |
|-------------|---------|-------------|
| **Production** | `edwardjensencms.com` | `edwardjensen.net` |
| **Staging** | `staging.edwardjensencms.com` | `stagingsite.edwardjensencms.com` |

### Repository Relationship

| Repository | Purpose | Status |
|------------|---------|--------|
| `edwardjensen/edwardjensencms-payload` | Payload CMS application | **Production** |
| `edwardjensen/edwardjensen-net-jekyll` | Jekyll site (stateless, no content) | **Production** |

### Key Integration Components

1. **Payload CMS** (`edwardjensencms-payload` repository):
   - Next.js 15 + Payload 3.x application
   - PostgreSQL database for content storage
   - Cloudflare R2 for media/asset storage
   - Accessible via Tailscale VPN (network-level security)
   - GraphQL API endpoint for content delivery
   - Webhook system triggers Jekyll builds on publish

2. **Jekyll Site** (`edwardjensen-net-jekyll` repository):
   - Code and templates only (no content files)
   - `_plugins/payload_cms.rb` fetches content from Payload at build time
   - Builds static HTML from CMS data
   - Deploys to Cloudflare Pages (production) or self-hosted server (staging)

3. **GitHub Actions**:
   - Listens for `repository_dispatch` events from CMS webhooks
   - Triggers Jekyll build on content publish/unpublish
   - Also triggers on Git push (for code/template changes)

### Content Flow

1. Author creates/edits content in Payload CMS web UI
2. On publish, CMS fires webhook to GitHub Actions
3. GitHub Actions runs Jekyll build
4. Jekyll's `payload_cms.rb` plugin queries Payload GraphQL API
5. Jekyll renders static HTML from CMS data
6. Site deploys to Cloudflare Pages (~45-60 seconds total)

### Benefits of This Architecture

- ✅ Decoupled content from code repository
- ✅ Mobile-friendly content creation (CMS web UI)
- ✅ Draft/publish workflow with scheduled publishing
- ✅ Media storage in Cloudflare R2 (scalable, CDN-backed)
- ✅ Fast static site delivery (Jekyll output)
- ✅ Network-secured admin access (Tailscale VPN)

---

## 📐 Architecture Overview (Oct 2025 Redesign)

### Layout Pattern: Full-Width Sticky Header

**Previous**: 3-column sidebar layout (left nav, content, right sidebar)  
**Current**: Full-width stacked layout with sticky top header + full-width sections

**Key Components**:
- `_layouts/base.html` — Root layout; includes sticky header-nav at top, skip-to-content link, photo modal root, footer
- `_layouts/content-wrapper.html` — Content spacing/max-width container (max-w-4xl)
- `_layouts/landing-page.html` — Landing pages with hero section + sorted sections
- `_layouts/single-post.html` — Individual blog post layout
- `_layouts/page.html` — Standard page layout
- `_layouts/gallery-page.html` — Photo gallery layout
- `_includes/components/header-nav.html` — Sticky header navigation (responsive)
- `_includes/components/seo.html` — Custom SEO meta tags (Open Graph, Twitter Cards)

**Header Behavior**:
- Fixed/sticky position (z-40) with 80% opacity + backdrop blur
- **Desktop**: Horizontal layout with site title left, nav links center, social icons right
- **Mobile**: Hamburger button only (nav links in AlpineJS dropdown, slides down/up)
- All header text is lowercase (`lowercase` class applied)
- Desktop nav includes dropdowns for parent items (e.g., "About" submenu)

### Color Palette: Warm Scheme

**Light Mode**:
- Background: `bg-white`
- Text: `text-slate-900`
- Accent: `text-amber-600` (hover states)
- Borders/dividers: `border-slate-200`

**Dark Mode**:
- Background: `dark:bg-slate-950`
- Text: `dark:text-slate-50`
- Accent: `dark:text-amber-400` (hover states)
- Borders/dividers: `dark:border-slate-700`

**Components**: Glass-morphism cards with `bg-white/70 dark:bg-slate-800/70` + `backdrop-blur-sm`

### Typography

- **Font Families**: `museo-slab` (headers), `basic-sans` (body)
- **Heading Case**: Normal title case throughout, except header nav (use `lowercase` class)
- **Line Heights & Spacing**: Defined in `tailwind.config.js`

---

## 📁 Project Structure

**Important**: This repository contains **code and templates only**. All content (posts, working notes, historic posts) lives in Payload CMS and is fetched via GraphQL at build time.

```
edwardjensen-net-jekyll/
├── _config.yml                  # Main Jekyll config
├── _config.staging-cms.yml      # Staging CMS overlay config
├── _config.staging-code.yml     # Staging code overlay config
├── tailwind.config.js           # Tailwind CSS config (content scanning, safelist)
├── postcss.config.js            # PostCSS + Tailwind pipeline
├── package.json & Gemfile       # Node/Ruby dependencies
│
├── _data/                       # Static data files (YAML/JSON)
│   ├── navbar.yml              # Navigation structure + dropdown items
│   ├── social.yml              # Social media links for footer
│   └── a11y-check-urls.yml     # Accessibility testing URL list
│
├── _includes/                  # Reusable Jekyll includes
│   ├── components/             # UI components
│   │   ├── header-nav.html             # Sticky header with responsive nav
│   │   ├── page-header.html            # Page title sections
│   │   ├── photo-modal.html            # Gallery modal (AlpineJS)
│   │   ├── post-navigation.html        # Post prev/next links
│   │   ├── post-credits.html           # Author/meta info
│   │   ├── privacy-modal.html          # Privacy policy modal
│   │   ├── prose-content.html          # Typography/markdown styling
│   │   ├── search-interface.html       # Search UI
│   │   ├── search-results.html         # Search results display
│   │   ├── seo.html                    # Custom SEO meta tags (Open Graph, Twitter)
│   │   └── working-note.html           # Working note card component (for list views)
│   ├── core/                   # Core layout components
│   │   ├── header-includes.html        # <head> includes (CSS, meta, SEO)
│   │   └── footer.html                 # Site footer
│   └── sections/               # Page sections (reusable content blocks)
│
├── _layouts/                   # Jekyll layouts (use via front matter)
│   ├── base.html               # Root layout (sticky header, footer)
│   ├── content-wrapper.html    # Content centering (max-w-4xl)
│   ├── landing-page.html       # Landing pages with hero + sections
│   ├── page.html               # Standard page layout
│   ├── single-post.html        # Individual blog post
│   ├── gallery-page.html       # Photo gallery
│   ├── portfolio.html          # Portfolio page layout
│   ├── photography.html        # Photography collection layout
│   ├── search-page.html        # Search results page
│   ├── single-working-note.html # Single working note layout
│   ├── working-notes.html      # Working notes index layout
│   └── writing-base.html       # Base for writing collection pages
│
├── _pages/                     # Static pages (about, contact, etc.)
│   ├── about.md
│   ├── biography.md
│   ├── portfolio.md
│   ├── photos.md
│   ├── writing.md
│   ├── working-notes.html
│   ├── search.html
│   ├── uses.md
│   ├── privacy-policy.md
│   └── [others]
│
├── _photography/               # Photography portfolio entries (still file-based)
│   └── [photography collection items with images]
│
├── _portfolio/                 # Project portfolio entries (still file-based)
│   └── [civic/design projects]
│
├── _homepage_sections/         # Homepage component partials
│   ├── recent-posts.html       # Featured posts section
│   └── recent-photos.html      # Recent photos section
│
├── _camerastream_sections/     # Camera stream page sections
│   └── livestream.html         # Cloudflare Stream embed
│
├── _landing_sections/          # Landing page sections
│   └── [landing page components]
│
├── _plugins/                   # Jekyll plugins
│   ├── payload_cms.rb          # 🔑 Fetches content from Payload CMS at build time
│   ├── rss_feed_generator.rb   # 🔑 Generates all RSS feeds from _data/rss-feeds.yml
│   ├── sitemap_generator.rb    # 🔑 Generates sitemap.xml and robots.txt
│   ├── pagination_generator.rb # 🔑 Collection-agnostic pagination
│   ├── copy_vendor_assets.rb   # Copies vendor JS files
│   ├── json_escape_filter.rb   # JSON escaping for feeds
│   └── youtube_embed.rb        # YouTube embed handling
│
├── _featured-tags/             # Featured tag landing pages (file-based)
│   └── [tag].md               # Tag with hero image, summary, filtered posts
│
├── _feeds/                     # JSON feeds only (RSS feeds generated by plugin)
│   ├── feed-notes.json         # Working notes JSON Feed
│   └── site-feed.json          # Main site JSON Feed
│
├── assets/                     # Static assets
│   ├── css/                    # Tailwind output, custom CSS
│   └── fonts/                  # Web fonts
│
├── scripts/                    # Build & utility scripts
│   └── a11y-check.js           # Accessibility testing CLI
│
├── .github/
│   ├── workflows/
│   │   ├── deploy-prod-site.yml           # Production deploy (version tags)
│   │   ├── deploy-staging-site-code.yml   # Staging deploy for code changes (push to main)
│   │   ├── deploy-staging-cms.yml         # Staging deploy for CMS changes (webhook)
│   │   ├── pr-checks.yml                  # PR build validation
│   │   └── republish-prod-site.yml        # CMS webhook production rebuild
│   └── copilot-instructions.md            # Copilot context (architecture guide)
│
├── context-docs/               # Claude AI context files
│   ├── site-work/
│   │   ├── project-context.md        # This file (comprehensive project overview)
│   │   └── content-schema.md         # Content types & CMS schema documentation
│   └── content-editing/              # Content strategy and editing context
│
├── site-docs/                  # Developer documentation
│   ├── README.md              # Documentation index
│   ├── LAYOUTS_AND_STYLES.md  # Layout system + CSS class reference (START HERE)
│   ├── ACCESSIBILITY.md       # Accessibility guidelines
│   ├── SEARCH_IMPLEMENTATION.md # Search feature docs
│   └── [other docs]
│
├── _site/                      # Build output (excluded from git)
│
├── README.md                   # Project overview
├── CLAUDE.md                   # Claude AI context
├── Gemfile & Gemfile.lock     # Ruby dependencies
├── package.json               # Node dependencies
└── 404.md                      # 404 page
```

**Content Source**: Posts, working notes, and historic posts are fetched from Payload CMS via the `payload_cms.rb` plugin during Jekyll build. Media assets are served from Cloudflare R2.

**Legacy Content Directories**: The `_posts/`, `_working_notes/`, and `_historic_posts/` directories are no longer used. Content is created exclusively in Payload CMS.

---

## 🎨 Design System & Key Patterns

### Reusable CSS Class System (Oct 2025)

The site uses a set of **reusable Tailwind CSS classes** defined in `assets/css/main.css` within the `@layer components` directive.

**Key Benefits**:
- Single source of truth for colors, buttons, and UI elements
- Easy site-wide design changes (edit one file, changes apply everywhere)
- Consistent styling across all components
- Better readability with semantic class names
- Reduced CSS file size through class reuse

**Complete Reference**: See `site-docs/LAYOUTS_AND_STYLES.md` for full documentation

#### Text & Typography Classes

| Class | Usage | Compiles To |
|-------|-------|-------------|
| `.text-body` | Standard body text | `text-slate-900 dark:text-slate-50` |
| `.text-muted` | Secondary/muted text | `text-slate-600 dark:text-slate-400` |
| `.text-heading` | Heading text | `text-slate-900 dark:text-slate-50 dark:opacity-95` |

#### Link & Interaction Classes

| Class | Usage |
|-------|-------|
| `.link-accent` | Accent-colored links with amber hover |
| `.icon-interactive` | Interactive icons (social icons, navigation) |

#### Button Classes

| Class | Style | Usage |
|-------|-------|-------|
| `.btn-primary` | Filled amber | Primary CTAs |
| `.btn-secondary` | Outline amber | Secondary actions |
| `.btn-ghost` | Minimal | Tertiary/cancel buttons |

#### UI Component Classes

| Class | Usage |
|-------|-------|
| `.dropdown-menu` | Dropdown menus with glass-morphism |
| `.info-box` | Info messages and notifications |
| `.badge-accent` | Tags and category badges |
| `.input-default` | Form inputs with amber focus ring |
| `.section-bg` | Section backgrounds with subtle color |

**Usage Example**:
```html
<a href="/about" class="link-accent">Learn more</a>
<button class="btn-primary">Get Started</button>
<p class="text-muted">Posted on October 26, 2025</p>
<span class="badge-accent">Technology</span>
```

**When to Use**:
- ✅ Use reusable classes for: buttons, links, text colors, common UI patterns, dark mode support
- ❌ Use inline utilities for: layout spacing, grid/flex positioning, one-off adjustments, specific sizes

**Modifying Site-Wide Styles**:
1. Edit `assets/css/main.css` in the `@layer components` section
2. Run `bundle exec jekyll build` to recompile CSS
3. Test in both light and dark modes

### Tailwind CSS Integration

**Build Process**:
1. `tailwind.config.js` scans content: `_drafts/**`, `_includes/**`, `_layouts/**`, `_posts/`, `_pages/`, `_photography/`, `*.md`, `*.html`, `_data/**`
2. PostCSS pipeline (`postcss.config.js`) compiles with minification in production
3. Safely-listed classes for dynamic color schemes (slate, amber, blue, green, purple variants)

**Color Usage**:
- Primary text: `text-slate-900` / `dark:text-slate-50`
- Secondary text: `text-slate-600` / `dark:text-slate-400`
- Accents: `text-amber-600` / `dark:text-amber-400`
- Backgrounds: `bg-white` / `dark:bg-slate-950`
- Inputs/dividers: `bg-slate-50` / `dark:bg-slate-900`, `border-slate-200` / `dark:border-slate-700`

### AlpineJS Integration

- **Hamburger Menu**: `x-data` on header-nav, `@click` on hamburger button
- **Photo Modal**: Controlled via AlpineJS component
- No build step required; works directly in HTML

---

## 📝 Content Collections

The site supports multiple content types, each with distinct purpose, layout, and distribution strategy.

### CMS-Managed Content (via Payload)

These content types are managed in Payload CMS and fetched via GraphQL at build time:

#### 1. Posts (Essays & Long-Form Writing)

**CMS Collection**: `Posts`  
**Jekyll Collection**: `posts`  
**URL Pattern**: `/posts/:year/:year-:month/:slug`  
**Layout**: `single-post`  
**Purpose**: Polished, long-form essays on nonprofit technology, civic engagement, and urban topics  
**Typical Length**: 1,000–5,000+ words  
**RSS/Feed**: Included in main site feed (`/feed.xml`) + essays feed (`/feeds/essays.xml`)

**CMS Fields** (see `content-schema.md` for full reference):
- Title, slug, date, excerpt
- Categories (array), tags (array)
- Header image, image alt text, show image toggle
- Rich text content (Lexical editor → converted to markdown for Jekyll)
- Landing featured toggle, post credits, redirect from (legacy URLs)
- Publish status (draft/scheduled/published)

#### 2. Working Notes (Microblog Entries)

**CMS Collection**: `WorkingNotes`  
**Jekyll Collection**: `working_notes`  
**URL Pattern**: `/notes/:year-:month-:day/:slug`  
**Layout**: `single-working-note`  
**Purpose**: Microblog-style entries, quick thoughts, reflections, and updates  
**Typical Length**: 100–500 words  
**Dedicated Feeds**: `/feeds/notes.xml` (RSS) and `/feeds/notes.json` (JSON Feed)

**CMS Fields**:
- Title, slug, date
- Tags (array)
- Rich text content
- Publish status (draft/scheduled/published)

#### 3. Historic Posts (Legacy Archive)

**CMS Collection**: `HistoricPosts`  
**Jekyll Collection**: `historic_posts`  
**URL Pattern**: `/archive/posts/:slug`  
**Layout**: `single-post`  
**Purpose**: Preserved legacy WordPress archive (read-only)

**Note**: Unlike Posts and Working Notes, Historic Posts does **not** have scheduled publishing. They use only Payload's built-in `_status` (draft/published).

### File-Based Content (Still in Repository)

These content types are still managed as files in the Jekyll repository:

#### 4. Featured Tags

**Directory**: `_featured-tags/`
**URL Pattern**: `/tags/:slug`
**Layout**: `featured-tag`
**Purpose**: Curated landing pages for specific tags with hero images, summary content, and filtered post listings

**Front Matter Fields**:

- `title` — Display name for the tag
- `tag` — Tag slug (matches post tags for filtering)
- `image` — Hero image URL
- `image_alt` — Hero image alt text
- `sort_ascending` — Sort order (default: false = newest first)

**RSS Feeds**: Each featured tag automatically gets an RSS feed at `/feeds/{tag-slug}.xml` via the unified RSS feed generator plugin (`_plugins/rss_feed_generator.rb`). The feed description uses the markdown body content from the featured tag file.

**Index Page**: `/tags/` lists all featured tags with thumbnails, descriptions, and post counts.

#### 5. Photography

**Directory**: `_photography/`  
**URL Pattern**: `/photos/:year/:year-:month/:slug`  
**Layout**: `single-post`  
**Purpose**: Documentary and urban photography portfolio

#### 5. Portfolio

**Directory**: `_portfolio/`  
**URL Pattern**: `/portfolio/:slug`  
**Layout**: `portfolio`  
**Purpose**: Civic engagement projects, design work, and leadership initiatives

#### 6. Static Pages

**Directory**: `_pages/`
**Purpose**: About, Portfolio overview, Writing archive, Search, Privacy Policy, etc.

#### 7. Camera Stream

**Page**: `_site_pages/saintpaullive.md`
**Sections Directory**: `_camerastream_sections/`
**URL**: `/saintpaulcamera/`
**Layout**: `landing-page`
**Purpose**: Occasionally live camera stream of downtown Saint Paul, Minnesota

**Implementation:**

- Uses `landing-page` layout with `collection: camerastream_sections`
- Cloudflare Stream iframe embed with autoplay (`autoplay=true&muted=true`)
- Responsive 16:9 aspect ratio using Tailwind's `aspect-video`
- Excluded from site search (`searchable: false`) but included in sitemap

---

## 🔄 Build & Deployment Workflows

### Environment Promotion Model

This project uses an **environment promotion workflow** for deployments:

| Environment | Trigger | Destination | URL |
|-------------|---------|-------------|-----|
| **Staging (Code)** | Push to `main` branch | Self-hosted server (rsync/SSH) | stagingsite.edwardjensencms.com |
| **Staging (CMS)** | `staging_cms_publish` webhook | Self-hosted server (rsync/SSH) | stagingsite.edwardjensencms.com |
| **Production** | Push `v*` tag | Cloudflare Pages | edwardjensen.net |
| **Production (Republish)** | `prod_cms_publish` webhook | Cloudflare Pages | edwardjensen.net |

### GitHub Actions Workflows

The site uses a **unified staging workflow** (`deploy-staging.yml`) that handles multiple staging scenarios via configuration in `_data/staging-config.yml`.

| Workflow | Trigger | Site Code | CMS Data | Destination |
|----------|---------|-----------|----------|-------------|
| `pr-checks.yml` | Pull request to `main` | PR branch | Production | N/A (build only) |
| `deploy-staging.yml` | Push to `main` | `main` branch | Staging | staging.edwardjensen.net |
| `deploy-staging.yml` | `staging_cms_publish` webhook | Latest `v*` tag | Staging | stagingsite.edwardjensencms.com |
| `deploy-prod-site.yml` | Push `v*` tag | Tagged version | Production | edwardjensen.net |
| `republish-prod-site.yml` | `prod_cms_publish` webhook | Latest `v*` tag | Production | edwardjensen.net |
| `publish-prod-photo.yml` | `prod_cms_photo_publish` webhook | Latest `v*` tag | Production | edwardjensen.net |
| `cleanup-cloudflare.yml` | Weekly schedule | — | — | Cleans old deployments |

### Development Workflow

1. **Feature Development**: Create `feature/*` branch from `main`, develop locally
2. **Code Review**: Open PR to merge `feature/*` into `main` (must pass PR checks)
3. **Staging Deployment**: Merge to `main` triggers automatic deployment to staging
4. **Production Promotion**: After validation, create version tag `git tag v1.2.3 && git push --tags`
5. **CMS Changes**: Publish in CMS triggers automatic production rebuild with latest tag

### Local Development

```bash
# Terminal 1: Jekyll with live reload
bundle exec jekyll serve --livereload

# Terminal 2: PostCSS/Tailwind watcher (if needed)
npm run build:css --watch
```

**Note**: Local development requires Tailscale VPN connection for CMS GraphQL access.

### Production Build

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

### Build Triggers Summary

| Event | Triggers Build | Notes |
|-------|----------------|-------|
| Push to `main` | Yes (staging) | Tests code changes with staging CMS content |
| Push `v*` tag | Yes (production) | Promotes code to production |
| `staging_cms_publish` webhook | Yes (staging) | Tests CMS content with production code |
| `staging_cms_photo_publish` webhook | Yes (staging) | Tests photo content with main branch code |
| `prod_cms_publish` webhook | Yes (production) | Rebuilds production with latest CMS content |
| `prod_cms_photo_publish` webhook | Yes (production) | Rebuilds production with new photography |
| Manual dispatch | Yes | Available on all workflows |

---

## 📦 Content Publishing Workflow

### CMS-First Workflow (Primary)

All content is created and managed in Payload CMS:

1. Log into Payload CMS admin panel (accessible via Tailscale VPN)
2. Create/edit content in web interface (posts, working notes, etc.)
3. Upload images directly to Cloudflare R2 via CMS
4. Set publication status:
   - **Draft**: Internal only, not visible on site
   - **Scheduled**: Will auto-publish at specified date/time
   - **Published**: Live on site immediately
5. On publish, CMS fires webhook to GitHub Actions
6. GitHub Actions triggers Jekyll build, pulls content via GraphQL
7. Site rebuilds and deploys within 45-60 seconds

### Scheduled Publishing

Payload CMS handles scheduled publishing automatically based on the post's `date` field:

1. Author sets the `date` field to a future date/time
2. Author clicks "Publish" (the `beforeChange` hook detects the future date)
3. Payload keeps the document as a draft and queues a `schedulePublish` job
4. Job executes when scheduled time arrives
5. Post is published, webhook fires, site rebuilds
6. Content appears on production site automatically

**Important**: Scheduled posts do NOT trigger webhooks when saved—only when the job runs at the scheduled time.

### Content Migration Status

| Collection | Migration Status | Notes |
|------------|-----------------|-------|
| Posts | ✅ Complete | All posts in CMS |
| Working Notes | ✅ Complete | All notes in CMS |
| Historic Posts | ✅ Complete | Legacy archive in CMS |
| Pages | ✅ Complete | Static pages in CMS |
| Photography | ❌ File-based | Still in `_photography/` directory |
| Portfolio | ❌ File-based | Still in `_portfolio/` directory |

---

## 🔍 Accessibility Testing

### Pa11y Checking Engine

The site features a **Node.js-based accessibility testing system** that runs WCAG2AA compliance checks.

**Key Files**:
- `scripts/a11y-check.js` — Node.js CLI tool for running accessibility checks
- `_data/a11y-check-urls.yml` — Centralized list of URLs to check

**Usage**:

```bash
# Check development server (must be running on :4000)
node scripts/a11y-check.js dev

# Check staging environment
node scripts/a11y-check.js staging

# Check production
node scripts/a11y-check.js prod

# Generate JSON report
node scripts/a11y-check.js staging --report test-reports/staging-a11y.json
```

**npm Scripts**:

```bash
npm run a11y              # Check localhost:4000
npm run a11y:dev          # Check development site
npm run a11y:staging      # Check staging site
npm run a11y:prod         # Check production site
npm run a11y:report       # Generate JSON report
```

---

## 🚀 Performance & Optimization

- **Build Time**: ~45-60 seconds full build on GitHub Actions
- **Incremental Builds**: Supported via Jekyll `--incremental` flag
- **Image Optimization**: WebP variants, responsive sizing
- **CSS**: Tailwind with production minification
- **Deployment**: Cloudflare Pages (fast CDN, DDoS protection)
- **CMS Integration**: GraphQL queries only fetch published content

---

## ✅ Current Strengths

1. **Fast & Functional**: Entire build workflow 45-60s, production deployment instant
2. **Responsive Design**: Works well on mobile; dark mode respects system preferences
3. **Accessibility**: Alt text on all images, semantic HTML, skip-to-content link
4. **Modern Styling**: Oct 2025 redesign with warm color palette, glass-morphism cards
5. **Reusable CSS System**: Custom Tailwind classes provide single source of truth for styling
6. **CMS Integration**: Payload CMS provides mobile-friendly content creation
7. **Developer Experience**: Clear file organization, Tailwind for rapid iteration
8. **Scheduled Publishing**: Posts can be scheduled for future publication

---

## ⚠️ Known Limitations

1. **Jekyll + Tailwind Integration**: Both designed independently; tension between Ruby (Jekyll) and Node (Tailwind) ecosystems
2. **Limited Interactivity**: SSG limitations; dynamic content requires workarounds
3. **Content Publishing Frequency**: Goal is 1-2 posts/week; working to establish regular cadence
4. **Social Media Integration**: No automatic cross-posting to Bluesky/LinkedIn; manual sharing required
5. **Content Organization**: Categories/tags displayed but no aggregation/filter pages yet
6. **Photography/Portfolio Still File-Based**: Not yet migrated to CMS

---

## 🎯 Development Goals & Future Work

### Completed ✅

- ✅ Complete Payload CMS migration (Posts, Working Notes, Historic Posts)
- ✅ Implement webhook-driven builds
- ✅ Migrate all legacy content to CMS
- ✅ Solve mobile content creation workflow
- ✅ Implement scheduled publishing via CMS Jobs Queue

### Short Term (Next 1-3 months)

- Increase publishing frequency to 1-2 posts/week (now easier with CMS)
- Implement category/tag archive pages (aggregate posts by topic)
- Add Photography and Portfolio collections to CMS
- Enhance CMS admin dashboard with custom analytics

### Medium Term (Q1-Q2 2026)

- Review & curate old content; remove outdated/irrelevant posts
- Enhance search functionality and discoverability
- Consider adding comment system or webmentions
- Explore social media cross-posting automation via CMS hooks

### Long Term

- Consider migration to JavaScript-based SSG (Next.js, Astro) if Jekyll becomes limiting
- Expand photography portfolio with better galleries and metadata
- Build out Pages collection in CMS for static content management
- Explore additional content types (bookmarks, links, quotes)

---

## 🔗 Key References

### Live Site & Repositories

- **Live Site**: [edwardjensen.net](https://www.edwardjensen.net)
- **Staging Site**: [stagingsite.edwardjensencms.com](https://stagingsite.edwardjensencms.com)
- **Jekyll Site Repo**: [edwardjensen/edwardjensen-net-jekyll](https://github.com/edwardjensen/edwardjensen-net-jekyll) (Public)
- **Payload CMS Repo**: [edwardjensen/edwardjensencms-payload](https://github.com/edwardjensen/edwardjensencms-payload) (Public)

### Developer Documentation

**Primary Documentation** (in `site-docs/`):

- **`LAYOUTS_AND_STYLES.md`** — **START HERE** for layout system and CSS class reference
- **`ACCESSIBILITY.md`** — Accessibility guidelines and WCAG compliance
- **`SEARCH_IMPLEMENTATION.md`** — Search feature documentation
- **`README.md`** — Documentation index

**Context Files**:

- **`.github/copilot-instructions.md`** — GitHub Copilot context (architecture, patterns, color scheme)
- **`context-docs/site-work/project-context.md`** — This file (comprehensive project overview)
- **`context-docs/site-work/content-schema.md`** — Content types & CMS schema documentation
- **`context-docs/site-work/sitemap-generator.md`** — Sitemap generator plugin documentation
- **`context-docs/site-work/pagination-plugin.md`** — Pagination plugin documentation
- **`context-docs/site-work/rss-feed-consolidation.md`** — RSS feed generator documentation
- **`CLAUDE.md`** — Claude AI context for development

### Payload CMS Documentation

- **Payload CMS Docs**: https://payloadcms.com/docs
- **GraphQL API**: https://payloadcms.com/docs/graphql/overview
- **Jobs Queue (Scheduled Publishing)**: https://payloadcms.com/docs/jobs-queue/overview
