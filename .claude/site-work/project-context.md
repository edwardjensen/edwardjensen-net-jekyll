# edwardjensen.net Site Work Project Context

Technical advice context for edwardjensen.net, a modern personal portfolio and blog at the intersection of nonprofit technology, urban civic engagement, and documentary photography.

---

## 🎯 Core Purpose & Content Strategy

**Mission**: A platform for Edward Jensen to share writing and reflection on nonprofit technology, systems thinking, civic engagement, and urban photography.

**Primary Content Focus**:
- **Essays** (blog posts): Polished, long-form writing on nonprofit IT strategy, technology, systems thinking
- **Working Notes** (NEW): Microblog-style reflections, quick thoughts, and updates (not full essays)
- **Photography**: Documentary and urban photography portfolio
- **Project Portfolio**: Civic engagement and leadership work showcase

**Target Cadence**: 1-2 new posts per week (ongoing goal)

**Distribution**: Site as primary hub, with links to Bluesky and LinkedIn

**Content Management**: Payload CMS (headless CMS) as single source of truth; Jekyll pulls content via GraphQL at build time

---

## 🛠 Technical Stack (Current as of Nov 2025)

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **SSG** | Jekyll | 4.4.1 | Ruby-based static site generator |
| **Styling** | Tailwind CSS | 4.0.x | PostCSS workflow, custom amber/slate palette |
| **Interactivity** | AlpineJS | v3 | Lightweight DOM state, no build step required |
| **Color Scheme** | Amber/Slate | Warm | Amber accents (`text-amber-600` light, `dark:text-amber-400` dark), slate backgrounds/text |
| **Hosting** | Cloudflare Pages | — | Deployed via GitHub Actions |
| **Runtime** | Ruby 3.4.5 + Node 24.8 | — | Bundler for gems, npm for CSS tooling |
| **CMS** | Payload CMS | 3.65.0 | Headless CMS (single source of truth for content) |
| **CMS Database** | PostgreSQL | — | Payload content storage |
| **Media Storage** | Cloudflare R2 | — | S3-compatible object storage for images/assets |

---

## 🏗 Content Infrastructure Architecture

### Payload CMS + Jekyll Integration

The site uses a **headless CMS architecture** where content is managed in Payload CMS and consumed by Jekyll at build time:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Payload CMS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │ Cloudflare  │  │ Content Collections     │  │
│  │ Database    │  │ R2 Assets   │  │ (posts, notes, etc.)    │  │
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
│  │ GraphQL plugin queries Payload at build time            │    │
│  │ Renders static HTML → Deploys to Cloudflare Pages       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Components**:

1. **Payload CMS** (`edwardjensencms-payload` repository):
   - Next.js 15 + Payload 3.x application
   - PostgreSQL database for content storage
   - Cloudflare R2 for media/asset storage
   - Accessible via Tailscale VPN (network-level security)
   - GraphQL API endpoint for content delivery
   - Webhook system triggers Jekyll builds on publish

2. **Jekyll Site** (`edwardjensen-net-jekyll` repository):
   - Code and templates only (no content)
   - GraphQL plugin fetches content from Payload at build time
   - Builds static HTML from CMS data
   - Deploys to Cloudflare Pages

3. **GitHub Actions**:
   - Listens for `repository_dispatch` events from CMS
   - Triggers Jekyll build on content publish/unpublish
   - Also triggers on Git push (for code/template changes)
   - Scheduled daily builds for time-based publishing

**Content Flow**:
1. Author creates/edits content in Payload CMS web UI
2. On publish, CMS fires webhook to GitHub Actions
3. GitHub Actions runs Jekyll build
4. Jekyll's GraphQL plugin queries Payload API
5. Jekyll renders static HTML from CMS data
6. Site deploys to Cloudflare Pages (~45-60 seconds total)

**Benefits of This Architecture**:
- ✅ Decoupled content from code repository
- ✅ Mobile-friendly content creation (CMS web UI)
- ✅ Draft/publish workflow with scheduling
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
- `_layouts/home-page.html` — Homepage with hero section + sorted homepage sections
- `_layouts/single-post.html` — Individual blog post layout
- `_layouts/page.html` — Standard page layout
- `_layouts/gallery-page.html` — Photo gallery layout
- `_includes/components/header-nav.html` — Sticky header navigation (responsive)
- `_includes/components/hamburger-menu.html` — Mobile hamburger toggle

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

**Important**: This repository contains **code and templates only**. All content (posts, working notes, media) lives in Payload CMS and is fetched via GraphQL at build time.

```
edwardjensen-net-jekyll/
├── _config.yml                  # Main Jekyll config
├── _config.staging.yml          # Staging overlay config
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
│   │   ├── hamburger-menu.html         # Mobile menu toggle
│   │   ├── page-header.html            # Page title sections
│   │   ├── photo-modal.html            # Gallery modal (AlpineJS)
│   │   ├── post-navigation.html        # Post prev/next links
│   │   ├── post-credits.html           # Author/meta info
│   │   ├── prose-content.html          # Typography/markdown styling
│   │   ├── search-interface.html       # Search UI
│   │   ├── search-results.html         # Search results display
│   │   └── working-note.html           # Working note card component (for list views)
│   ├── core/                   # Core layout components
│   │   ├── header-includes.html        # <head> includes (CSS, meta, SEO)
│   │   └── footer.html                 # Site footer
│   └── sections/               # Page sections (reusable content blocks)
│
├── _layouts/                   # Jekyll layouts (use via front matter)
│   ├── base.html               # Root layout (sticky header, footer)
│   ├── content-wrapper.html    # Content centering (max-w-4xl)
│   ├── landing-page.html       # Homepage with hero + sections
│   ├── page.html               # Standard page layout
│   ├── single-post.html        # Individual blog post
│   ├── gallery-page.html       # Photo gallery
│   ├── portfolio.html          # Portfolio page layout
│   ├── photography.html        # Photography collection layout
│   ├── search-page.html        # Search results page
│   ├── single-working-note.html # Single working note layout
│   ├── working-notes.html      # Working notes index layout (uses working-note.html component)
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
├── _posts/                     # 🚫 LEGACY: Content now in CMS (placeholder folder only)
├── _working_notes/             # 🚫 LEGACY: Content now in CMS (placeholder folder only)
├── _historic_posts/            # 🚫 LEGACY: Content now in CMS (placeholder folder only)
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
├── _landing_sections/          # Landing page sections
│   └── [landing page components]
│
├── _plugins/                   # Jekyll plugins
│   └── graphql_fetch.rb        # 🔑 Fetches content from Payload CMS at build time
│
├── _feeds/                     # RSS/JSON feeds (generated from CMS data)
│   ├── feed-essays.xml
│   ├── feed-notes.json / .xml
│   ├── site-feed.json / .xml
│   └── [others]
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
│   │   ├── deploy-main-site.yml           # Production deploy workflow
│   │   ├── deploy-on-cms-trigger.yml      # CMS webhook listener
│   │   └── pa11y-checks-on-staging-pr.yml # Automated accessibility testing
│   └── copilot-instructions.md            # Copilot context (architecture guide)
│
├── .claude/
│   ├── site-work/
│   │   ├── project-context.md        # This file (comprehensive project overview)
│   │   └── content-schema.md         # Content types & YAML front matter documentation
│   └── [other Claude context files]
│
├── site-docs/                  # Developer documentation
│   ├── README.md              # Documentation index
│   ├── LAYOUTS_AND_STYLES.md  # Layout system + CSS class reference (START HERE)
│   ├── ACCESSIBILITY.md       # Accessibility guidelines
│   ├── SEARCH_IMPLEMENTATION.md # Search feature docs
│   └── [other docs]
│
├── test-reports/               # Test output
├── _site/                      # Build output (excluded from git)
│
├── README.md                   # Project overview
├── Gemfile & Gemfile.lock     # Ruby dependencies
├── package.json & package-lock.json # Node dependencies
└── 404.md                      # 404 page

```

**Content Source**: Posts, working notes, and historic posts are fetched from Payload CMS via the GraphQL plugin during Jekyll build. Media assets are served from Cloudflare R2.

---

## 🎨 Design System & Key Patterns

### Reusable CSS Class System (Oct 2025)

The site uses a set of **reusable Tailwind CSS classes** defined in `assets/css/main.css` within the `@layer components` directive. This approach eliminates duplication and provides a single source of truth for styling.

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

### Component Patterns

**Header Navigation**:
```html
<!-- Desktop nav: flex, gap-8, dropdown on hover (absolute positioned) -->
<!-- Mobile nav: AlpineJS-controlled dropdown, slides in/out -->
```

**Homepage Sections**:
- Sorted by `order` field in front matter
- Glass-morphism cards: `bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm`
- Icon badges with gradient backgrounds

**Photo Modal**:
- Mounted to `#photo-modal-root` in base layout
- Full-screen overlay, AlpineJS state management

**Post Navigation**:
- Previous/next post links with meta info

### AlpineJS Integration

- **Hamburger Menu**: `x-data` on header-nav, `@click` on hamburger button
- **Photo Modal**: Controlled via AlpineJS component
- No build step required; works directly in HTML

---

## � Post Types & Content Collections

The site supports multiple content types, each with distinct purpose, layout, and distribution strategy:

### 1. **Blog Posts** (Essays & Long-Form Writing)

**Collection**: `_posts/` (Jekyll `posts` collection)  
**URL Pattern**: `/writing/YYYY/YYYY-MM/slug`  
**Layout**: `single-post`  
**Purpose**: Polished, long-form essays on nonprofit technology, civic engagement, and urban topics  
**Typical Length**: 1,000–5,000+ words  
**RSS/Feed**: Included in main site feed + `feed-essays.xml`  
**Front Matter**:

```yaml
---
title: "Post Title"
date: "2025-10-21"
layout: single-post
categories: [tech, nonprofit]              # Optional: content topics/themes
tags: [strategy, systems]                  # Optional: keywords for indexing
excerpt: "Short excerpt for feeds"         # Optional: displayed in post listings & feeds
featured: true                             # Optional: shows on homepage featured section
image: "/assets/images/posts/example.jpg"  # Optional: featured image for post
image_alt: "Alt text description"          # Optional: accessibility for featured image
show_image: true                           # Optional: controls if featured image displays
has_youtube_video: true                    # Optional: enables YouTube embed handling
redirect_from:                             # Optional: legacy URL redirects (array)
  - /old-url/path/
render_with_liquid: true                   # Optional: process Liquid tags in content
post_credits:                              # Optional: attribution/credits (array or string)
  - "Photo by [Name](link)"
description: "Meta description"            # Optional: SEO meta description
searchable: false                          # Optional: exclude from search index
---
```

**Front Matter Impact on Rendering**:

Front matter in blog posts does far more than just classify content—it controls styling, layout, and which elements appear on the page:

- **`image` + `show_image`**: Controls whether a featured image displays in the post header area
- **`has_youtube_video`**: Enables the Jekyll YouTube embed plugin, allowing `https://youtube.com/watch?v=ID` URLs to be automatically embedded
- **`post_credits`**: Renders an attribution/credits section in the post footer with proper link formatting
- **`render_with_liquid`**: Enables Liquid template processing within Markdown content (allows dynamic content)
- **`searchable: false`**: Prevents the post from appearing in search results (e.g., for meta/internal posts)
- **`featured: true`**: Triggers the post to appear in the homepage "Featured Posts" section (sorted by date)
- **`redirect_from`**: Creates 301 redirects from legacy WordPress URLs (if migrating content)
- **`categories` & `tags`**: Used for content organization; displayed on post page and can be used for filtering/archive pages

**Homepage Integration**: Posts marked `featured: true` appear in the homepage "Featured Posts" section

---

### 2. **Working Notes** (NEW Oct 2025) ⭐

**Collection**: `_working_notes/` (Jekyll `working_notes` collection)  
**URL Pattern**: `/notes/`, `/notes/page/:num/` (paginated listing), individual: `/notes/YYYY/MM/DD/slug`  
**List Page**: `/notes/`  
**Layout**: `single-working-note` (individual), `working-notes` (listing)  
**Purpose**: Microblog-style entries, quick thoughts, reflections, and updates that don't merit full essays  
**Typical Length**: 100–500 words (tweet-like to medium posts)  
**Distinction**: Not included in main site RSS (`/feed.xml`) by default; has dedicated feeds: `feed-notes.json` and `feed-notes.xml`  
**Navigation**: Linked in main nav as "Working Notes" with icon `bi-journal-text`  
**Front Matter**:

```yaml
---
title: "Working Note Title"
date: 2025-10-23
tags:
  - theme
  - topic
---
```

**Front Matter Impact**: Working notes front matter is simpler than blog posts; the `tags` field is displayed as hashtags in the note header. Unlike blog posts, working notes do not typically use `image`, `featured`, or `redirect_from` fields.

**Visual Design**: 
- Individual note header: Amber gradient background (`from-amber-600 to-amber-500`)
- Tags displayed as hashtags (`#tag`)
- "Back to Working Notes" footer link for navigation
- Glass-morphism card styling consistent with site theme

**Use Cases**:
- Quick reactions to articles or events
- Work-in-progress thoughts before full essays
- Personal reflections and notes on learning
- Project updates and progress tracking
- Links and curated resources

---

### 3. **Photography** (Portfolio Collection)

**Collection**: `_photography/`  
**URL Pattern**: `/photography/` (listing), individual entries linked from gallery  
**Gallery Page**: `/photos/`  
**Purpose**: Documentary and urban photography portfolio  
**Integration**: Can be featured on homepage in "Recent Photos" section  
**Associated Files**: Images stored in `assets/photography/`  
**Front Matter**: Includes image references and metadata

---

### 4. **Project Portfolio** (Portfolio Items)

**Collection**: `_portfolio/`  
**URL Pattern**: `/portfolio/`, individual items linked from portfolio page  
**Portfolio Page**: `/portfolio/`  
**Purpose**: Showcase civic engagement projects, design work, and leadership initiatives  
**Examples**: "A Brief History of Midtown Phoenix", "Central City Mayoral Debate 2019"

---

### 5. **Static Pages** (Evergreen Content)

**Location**: `_pages/`  
**Examples**:
- `/about` — Biography and introduction
- `/portfolio` — Portfolio overview page
- `/photos` — Photography gallery page
- `/writing` — Blog archive
- `/uses` — Tools and tech stack used
- `/search` — Search interface
- `/privacy-policy` — Legal pages

**No publication date**: Evergreen content that updates infrequently

---

## Content Distribution & Feed Strategy

**Main Feeds**:
- `/feed.xml` — Main site RSS (blog posts + future: all content types)
- `/feed.json` — JSON feed (compatible with JSON Feed spec)

**Specialized Feeds**:
- `feed-essays.xml` — Essays/blog posts only
- `feed-notes.xml` — Working notes only (RSS)
- `feed-notes.json` — Working notes only (JSON Feed)

**Social Distribution**:
- Manual cross-posting to Bluesky, LinkedIn (future: consider automation)
- Mastodon profile linked via `rel="me"` for verification

---

## �📝 Content Management & Workflows

### Creating Blog Posts

**CMS Workflow** (Current):
1. Log into Payload CMS admin panel
2. Navigate to Posts collection
3. Click "Create New"
4. Fill in post fields (title, slug, content, categories, tags, etc.)
5. Upload header image via Media upload field (stored in R2)
6. Set publication date (can be future date for scheduling)
7. Save as draft or publish immediately
8. On publish, CMS fires webhook → GitHub Actions → Site rebuild

**Output URL**: `/writing/YYYY/YYYY-MM/slug`

**Content Fields** (in CMS):
- Title, slug, date, excerpt
- Categories (array), tags (array)
- Header image (upload), image alt text, show image toggle
- Rich text content (Lexical editor)
- Landing featured toggle, post credits, redirect from (legacy URLs)
- Draft/published status

**Legacy Method** (deprecated):
Creating `.md` files in `_posts/` directory is no longer the primary workflow. The repository still supports this for backward compatibility, but all new content should be created in the CMS.

### Creating Pages

**Location**: `_pages/page-name.md`

**Front Matter**:
```yaml
---
title: "Page Title"
layout: page
---
```

### Creating Photography Portfolio Items

**Location**: `_photography/YYYY-MM-DD-slug.md`

**Includes**: Associated images in `assets/photography/`

### Creating Working Notes

**CMS Workflow** (Current):
1. Log into Payload CMS admin panel
2. Navigate to Working Notes collection
3. Click "Create New"
4. Fill in note fields (title, content, tags)
5. Set publication date
6. Save as draft or publish immediately
7. On publish, CMS fires webhook → GitHub Actions → Site rebuild

**Legacy Method** (deprecated):
Creating `.md` files in `_working_notes/` directory is no longer recommended. Use the CMS for all new working notes.

---

## 🔄 Build & Deployment Workflows

### Local Development

```bash
# Terminal 1: Jekyll with live reload
bundle exec jekyll serve --livereload

# Terminal 2: PostCSS/Tailwind watcher (if needed)
npm run build:css --watch
```

### Production Build

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

### GitHub Actions Workflows

**`deploy-main-site.yml`**:
- Triggered by pushes to `main` or manual dispatch
- Builds production site (`JEKYLL_ENV=production`)
- Deploys to Cloudflare Pages production
- Intelligent change detection skips builds if only `.claude` / `.github` folders modified

**`staging-build.yml`**:
- Builds `staging` branch content
- Uses `_config.staging.yml` overlay
- Deploys to Cloudflare Pages preview environment
- Enables testing of new features without affecting production

### Content/Feature Branches

1. Feature branches (`feature/*`) for design/functionality work
2. Test locally with `bundle exec jekyll serve`
3. Merge to `staging` when ready for pre-production review
4. If staging looks good, merge `staging` → `main` for production

---

## � GitHub Repository & Content Workflow

**Repository**: [`edwardjensen/edwardjensen-net-jekyll`](https://github.com/edwardjensen/edwardjensen-net-jekyll) (Public)

### Repository Structure (Code-Only)

The repository is now **code and templates only**. Content lives in Payload CMS and is pulled via GraphQL at build time.

**What's in the Repository**:
- `_layouts/`, `_includes/`, `_data/` — Jekyll templates and configuration
- `.github/workflows/` — GitHub Actions automation (build + deploy)
- `tailwind.config.js`, `postcss.config.js` — CSS build pipeline
- `_plugins/` — Jekyll plugins (including GraphQL content fetcher)
- `assets/` — Static assets (fonts, some images)
- `site-docs/`, `.claude/` — Documentation

**What's NOT in the Repository** (Lives in CMS):
- Blog posts (`_posts/`) — Now in Payload CMS `posts` collection
- Working notes (`_working_notes/`) — Now in Payload CMS `working-notes` collection
- Historic posts (`_historic_posts/`) — Now in Payload CMS `historic-posts` collection
- Media assets — Stored in Cloudflare R2 via Payload

**Legacy Content Directories**: The `_posts/`, `_working_notes/`, and `_historic_posts/` directories still exist in the repository with placeholder files for backward compatibility, but new content is created exclusively in Payload CMS.

### Content Publishing Workflow

**CMS-First Workflow** (Primary for all content):
1. Log into Payload CMS admin panel (accessible via Tailscale VPN)
2. Create/edit content in web interface (posts, working notes, etc.)
3. Upload images directly to Cloudflare R2 via CMS
4. Set publication status (draft or published)
5. On publish, CMS fires webhook to GitHub Actions `repository_dispatch`
6. GitHub Actions triggers Jekyll build, pulls content via GraphQL
7. Site rebuilds and deploys to production within 45-60 seconds

**Code/Template Workflow** (for design/functionality changes):
1. Make changes to layouts, includes, styles in local Git repository
2. Commit and push to `main` branch (or feature branch for testing)
3. GitHub Actions detects changes and triggers build
4. Site deploys with updated templates/styles

**Branching Strategy**:
- `main` — Production branch; code changes trigger auto-build & deploy
- Feature branches — For testing template/design changes locally

**Build Triggers**:
- CMS webhook on content publish/unpublish
- Git push to `main` branch (for code/template changes)
- Manual dispatch from GitHub Actions UI
- Scheduled daily build (for time-based content like scheduled posts)

### Mobile Content Creation: Solved via Payload CMS ✅

**The Previous Problem** (Markdown-in-Git):
Since all content had to live in the GitHub repository, mobile content creation was cumbersome:

- No native Git client on iOS/Android for easy file management
- Cannot easily edit multiple files (post + images) on mobile
- No integrated workflow from mobile note-taking apps → GitHub
- Uploading images + Markdown simultaneously is friction-heavy
- Mobile editing happens in plaintext; no real-time preview

**The Solution: Payload CMS (Now Deployed)**
Payload CMS has successfully replaced Markdown-in-Git as the primary content management system:

**Current Benefits**:
- ✅ **Unified Content Interface**: Web-based admin dashboard for creating/editing all content types
- ✅ **Mobile-Friendly**: Responsive UI accessible from tablets and mobile devices
- ✅ **Image Management**: Built-in upload to Cloudflare R2 with asset library
- ✅ **Versioning & Drafts**: Full draft/publish workflow with version history
- ✅ **Scheduled Publishing**: Set future publication dates; CMS auto-publishes and triggers rebuild
- ✅ **API-First**: GraphQL API for flexible content delivery
- ✅ **Secure Access**: Network-level security via Tailscale VPN

**Current Content Collections in CMS**:
- **Posts** — Full-length blog essays (migrated from `_posts/`)
- **Working Notes** — Short-form microblog entries (migrated from `_working_notes/`)
- **Historic Posts** — Legacy WordPress archive (migrated from `_historic_posts/`)
- **Media** — All images and assets (stored in Cloudflare R2)

**Content Schema Documentation**:
See `.claude/site-work/content-schema.md` for complete field reference and CMS implementation details.

**Migration Status**: ✅ Complete
- All existing posts migrated to CMS
- All working notes migrated to CMS
- Legacy archive posts migrated to CMS
- Jekyll GraphQL plugin fetches content at build time
- Webhook integration triggers rebuilds on publish

### GitHub Actions Automation

**Build Triggers**:
- **CMS Webhook**: `repository_dispatch` event fired by Payload CMS on content publish/unpublish
- **Git Push**: Commits to `main` branch (for code/template changes)
- **Scheduled Daily Build**: Ensures future-dated posts publish on schedule
- **Manual Dispatch**: From GitHub Actions dashboard

**Build Process**:
1. Trigger received (webhook, push, schedule, or manual)
2. Install Ruby gems, Node dependencies
3. **Fetch content from CMS**: Jekyll GraphQL plugin queries Payload API
4. Run Jekyll build: `JEKYLL_ENV=production bundle exec jekyll build`
5. Deploy artifact to Cloudflare Pages production environment

**Workflow Files**:
- `deploy-main-site.yml` — Production deployments (webhook + Git push triggers)
- `staging-build.yml` — Preview environment (not currently used with CMS)

**CMS Integration**:
- Payload CMS sends `repository_dispatch` with `event_type: cms_publish`
- Workflow listens for this event and triggers build
- No content in Git repository; all pulled from CMS GraphQL API at build time

---

## 🔍 Accessibility Testing & pa11y Infrastructure (Oct 2025 Refactor)

### Pa11y Checking Engine Refactoring

The site now features a **modernized, Node.js-based accessibility testing system** that runs automated WCAG2AA compliance checks on key site pages. This replaces previous ad-hoc checking approaches.

**Architecture**:

- **Main Script**: `scripts/a11y-check.js` — Node.js CLI tool for running accessibility checks
- **Configuration**: `.pa11yci.json` — Pa11y CI configuration (strict WCAG2AA standard, threshold: 0 violations)
- **URL Configuration**: `_data/a11y-check-urls.yml` — Centralized list of URLs to check
- **GitHub Actions Workflow**: `.github/workflows/pa11y-checks-on-staging-pr.yml` — Automated PR checks

**Key Features**:

1. **Multi-Environment Support**:
   - `dev` — Local development server (localhost:4000)
   - `local-staging` — Local staging build with embedded HTTP server (localhost:8000)
   - `staging` — Staging environment (staging edwardjensen2025 jekyll pages dev)
   - `prod` — Production site (edwardjensen.net)

2. **Intelligent Server Management**:
   - Automatically builds site if needed (local-staging environment)
   - Starts embedded Node.js HTTP server for testing (no external server required)
   - Waits for server readiness with exponential backoff polling
   - Cleans up server on completion

3. **URL Management**:
   - URLs stored in `_data/a11y-check-urls.yml` (single source of truth)
   - Easy to add/remove pages for checking
   - Supports any URL path (homepage, posts, pages, galleries, etc.)

4. **Reporter Configuration**:
   - Dual runners: `axe` and `pa11y` (comprehensive detection)
   - Standard: WCAG2AA compliance
   - Multiple output formats: CLI for humans, JSON for structured parsing
   - Optional JSON report export via `--report` flag

**Usage**:

```bash
# Check development server (must be running on :4000)
node scripts/a11y-check.js dev

# Check local staging build (builds site + starts server automatically)
node scripts/a11y-check.js local-staging

# Check staging environment
node scripts/a11y-check.js staging

# Check production
node scripts/a11y-check.js prod

# Generate JSON report
node scripts/a11y-check.js staging --report test-reports/staging-a11y.json
```

### GitHub Actions Integration

**Workflow**: `.github/workflows/pa11y-checks-on-staging-pr.yml`

**Triggers**: Automatically on pull requests to `staging` branch (feature branches only)

**Process**:

1. Check if PR is from a feature branch (`feature/*`)
2. If yes, proceed with accessibility checks (otherwise skip)
3. Install Ruby gems (Jekyll) and Node dependencies (pa11y-ci)
4. Build site with `JEKYLL_ENV=staging`
5. Start local HTTP server on port 8000
6. Load URLs from `_data/a11y-check-urls.yml`
7. Run pa11y checks with `--config .pa11yci.json`
8. Parse results and post PR comment with summary:
   - ✅ **Pass**: "Accessibility Check Passed — zero violations"
   - ❌ **Fail**: "Accessibility Check Failed — lists total issues with per-page breakdown"
   - ⚠️ **Error**: "Could not parse results — check workflow logs"

**PR Comment Format**:

- Shows total issue count
- Lists issues by page with element selectors
- Indicates issue type (error vs. warning)
- Notes that check is strict (blocks merge if violations found)

**Exit Behavior**:

- Success: Workflow passes; allows merge
- Failure: Workflow fails; blocks merge until issues resolved

### Pa11y Configuration

**`.pa11yci.json` Settings**:

```json
{
  "standard": "WCAG2AA",
  "timeout": 10000,
  "wait": 1000,
  "chromeLaunchConfig": {
    "args": [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  },
  "runners": ["axe", "pa11y"],
  "threshold": 0,
  "reporters": ["json", "cli"]
}
```

**Threshold: Zero Violations**:

- Strict enforcement: ANY accessibility violation blocks merge
- This ensures new features maintain accessibility baseline
- Existing violations must be gradually remediated

---

## 🚀 Performance & Optimization

- **Build Time**: ~45-60 seconds full build on GitHub Actions
- **Incremental Builds**: Supported via Jekyll `--incremental` flag
- **Image Optimization**: WebP variants, responsive sizing
- **CSS**: Tailwind with production minification
- **Deployment**: Cloudflare Pages (fast CDN, DDoS protection)
- **Accessibility Testing**: Automated pa11y checks on feature branch PRs (zero-violation threshold)

---

## ✅ Current Strengths

1. **Fast & Functional**: Entire build workflow 45-60s, production deployment instant
2. **Responsive Design**: Works well on mobile; dark mode respects system preferences
3. **Accessibility**: Alt text on all images, semantic HTML, skip-to-content link
4. **Modern Styling**: Oct 2025 redesign with warm color palette, glass-morphism cards
5. **Reusable CSS System**: 11 custom Tailwind classes provide single source of truth for styling; enables easy site-wide design changes
6. **Developer Experience**: Clear file organization, Tailwind for rapid iteration, comprehensive documentation in `site-docs/`

---

## ⚠️ Known Challenges & Limitations

1. ~~**No Built-in CMS**~~ ✅ **SOLVED**: Payload CMS now handles all content creation and management
2. **Jekyll + Tailwind Integration**: Both designed independently; tension between Ruby (Jekyll) and Node (Tailwind) ecosystems
3. **Limited Interactivity**: SSG limitations; dynamic content requires workarounds
4. **Content Publishing Frequency**: Goal is 1-2 posts/week; working to establish regular cadence
5. **Social Media Integration**: No automatic cross-posting to Bluesky/LinkedIn; manual sharing required
6. **Content Organization**: Categories/tags displayed but no aggregation/filter pages yet
7. **Google Indexing**: Occasional warnings; unclear if site or Cloudflare issue
8. ~~**Mobile Content Creation**~~ ✅ **SOLVED**: CMS web interface works on mobile devices

---

## 🎯 Development Goals & Future Work

### Completed ✅

- ✅ Complete Payload CMS migration (Posts, Working Notes, Historic Posts)
- ✅ Implement webhook-driven builds
- ✅ Migrate all legacy content to CMS
- ✅ Solve mobile content creation workflow

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
- **Jekyll Site Repo**: [edwardjensen/edwardjensen-net-jekyll](https://github.com/edwardjensen/edwardjensen-net-jekyll) (Public)
- **Payload CMS Repo**: [edwardjensen/edwardjensencms-payload](https://github.com/edwardjensen/edwardjensencms-payload) (Public)
- **Old Site Archive**: [old.edwardjensen.net](https://old.edwardjensen.net/)

### Social Profiles

- **Micro.blog Profile**: [micro.blog/edwardjensen](https://micro.blog/edwardjensen)
- **Mastodon**: [@edwardjensen@mastodon.social](https://mastodon.social/@edwardjensen)

### Developer Documentation

**Primary Documentation** (in `site-docs/`):

- **`LAYOUTS_AND_STYLES.md`** — **START HERE** for layout system and CSS class reference
  - Quick reference cheat sheet at top
  - Complete CSS class documentation (all 11 reusable classes)
  - Layout architecture and hierarchy
  - Quick start templates
  - Best practices and troubleshooting
- **`ACCESSIBILITY.md`** — Accessibility guidelines and WCAG compliance
- **`SEARCH_IMPLEMENTATION.md`** — Search feature documentation
- **`README.md`** — Documentation index

**Additional Context Files**:

- **`.github/copilot-instructions.md`** — GitHub Copilot context (architecture, patterns, color scheme)
- **`.claude/site-work/project-context.md`** — This file (comprehensive project overview)
