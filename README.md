# Edward Jensen - Portfolio & Blog

A modern, accessible personal portfolio and blog built with Jekyll, Tailwind CSS, and AlpineJS. This site showcases writing on nonprofit technology, photography, and urban civic engagement.

**Live Site**: [edwardjensen.net](https://www.edwardjensen.net)

---

## 📖 About

Edward Jensen is a technology leader at the intersection of IT and nonprofit organizations. This repository powers his personal website, featuring:

- **Writing**: Essays and reflections on nonprofit technology, systems thinking, and civic engagement
- **Photography**: Urban and documentary photography portfolio
- **Portfolio**: Notable projects and civic leadership work

**Content Architecture**: This repository contains **code and templates only**. All blog posts, working notes, and historic posts are managed in [Payload CMS](https://github.com/edwardjensen/edwardjensencms-payload) and fetched via GraphQL at build time.

---

## 🛠 Tech Stack

| Component | Technology | Version |
|-----------|-----------|--------|
| **Static Site Generator** | Jekyll | 4.4.1 |
| **Styling** | Tailwind CSS | 4.0.x |
| **Interactivity** | AlpineJS | v3 |
| **Color Scheme** | Amber/Slate (warm palette) | Custom |
| **Content Source** | Payload CMS | Headless |
| **Staging** | Self-hosted server | stagingsite.edwardjensencms.com |
| **Production** | Cloudflare Pages | edwardjensen.net |
| **Runtime** | Ruby 3.4.5 + Node 25.1.0 | — |

---

## 🚀 Quick Start

### Prerequisites

- Ruby 3.x
- Node.js 18+
- Bundler (`gem install bundler`)

### Installation

```bash
# Clone and navigate to the directory
git clone https://github.com/edwardjensen/edwardjensen-net-jekyll.git
cd edwardjensen-net-jekyll

# Install Ruby dependencies
bundle install

# Install Node dependencies
npm install
```

### Local Development

```bash
# Start Jekyll with live reload (runs on http://localhost:4000)
bundle exec jekyll serve --livereload

# In a separate terminal, start PostCSS for Tailwind CSS compilation
npm run build:css --watch

# Optional: Run accessibility checks against local site
npm run a11y:dev
```

### Building for Production

```bash
# Build production site with minified CSS/JS
JEKYLL_ENV=production bundle exec jekyll build

# The output will be in the _site/ directory
```

---

## 📁 Project Structure

```
.
├── _config.yml              # Jekyll configuration
├── _config.staging.yml      # Staging environment config
├── _data/                   # Data files (YAML/JSON)
│   ├── navbar.yml          # Navigation structure
│   ├── social.yml          # Social media links
│   └── microphotos.json    # Processed photo metadata
├── _includes/              # Reusable Jekyll includes
│   ├── components/         # UI components (header, nav, etc.)
│   ├── core/              # Core layout components
│   └── sections/          # Page sections
├── _layouts/              # Jekyll layouts
│   ├── base.html          # Root layout with sticky header
│   ├── content-wrapper.html # Content spacing/max-width
│   ├── page.html          # Standard page layout
│   ├── single-post.html   # Blog post layout
│   ├── landing-page.html  # Landing page layout
│   └── gallery-page.html  # Photo gallery layout
├── _pages/                # Static pages (about, contact, etc.)
├── _plugins/              # Jekyll plugins (including CMS content fetcher)
├── _photography/          # Photography portfolio entries
├── _portfolio/            # Project portfolio entries
├── assets/                # Static assets (images, fonts, etc.)
├── _homepage_sections/    # Homepage component partials
├── scripts/               # Build and utility scripts
├── site-docs/             # Developer documentation
├── package.json           # Node.js dependencies
├── tailwind.config.js     # Tailwind CSS configuration
└── postcss.config.js      # PostCSS configuration
```

### Key Directories

- **`_layouts/`**: Jekyll layout templates (use `layout: layout-name` in front matter)
- **`_includes/components/`**: Reusable UI components
- **`_plugins/`**: Jekyll plugins including `payload_cms.rb` for CMS content fetching
- **`_photography/`**: Photography portfolio entries (file-based)
- **`_pages/`**: Static pages (about, contact, etc.)
- **`site-docs/`**: Comprehensive developer documentation
- **`context-docs/`**: Claude AI context files for development assistance

---

## ✍️ Creating Content

### Writing a Blog Post

Create a new file in `_posts/` with the format: `YYYY-MM-DD-slug.md`

```yaml
---
title: "Post Title"
date: "2025-10-21"
layout: single-post
excerpt: "Optional excerpt for feed"
featured: true  # Optional: shows on homepage featured section
---

Your markdown content here...
```

**Output URL**: `/writing/2025/2025-10/slug`

### Adding a Page

Create a file in `_pages/` with front matter:

```yaml
---
title: "Page Title"
layout: page
permalink: /custom-path/
---

Page content...
```

### Adding Photography

Create an entry in `_photography/`:

```yaml
---
title: "Photo Title"
date: "2025-10-21"
layout: single-post
image: "/assets/images/photo.jpg"
---
```

### Adding Portfolio Work

Create an entry in `_portfolio/`:

```yaml
---
title: "Project Title"
date: "2025-10-21"
layout: page
permalink: /portfolio/project-slug/
---
```

---

## 🎨 Design System

### Color Palette

The site uses a warm amber/slate color scheme (not blue):

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Backgrounds** | `bg-white` | `dark:bg-slate-950` |
| **Text** | `text-slate-900` | `dark:text-slate-50` |
| **Accent** | `text-amber-600` | `dark:text-amber-400` |

### Typography

- **Serif Headers**: `museo-slab`
- **Body Text**: `basic-sans`
- All header navigation text uses `.lowercase` class

### Layout

The site uses a **full-width stacked layout** (refactored in Oct 2025):

- **Sticky header** at top with transparent backdrop blur (z-40)
- **Desktop nav**: Horizontal navigation with site title, center menu, right social icons
- **Mobile nav**: Hamburger menu with slide-down animation
- **Content**: Max-width 4xl, centered with proper spacing

---

## 🔧 Available Scripts

```bash
# Photography processing
npm run photos

# Accessibility testing
npm run a11y                    # Full scan
npm run a11y:dev              # Test local dev server
npm run a11y:prod             # Test production site
npm run a11y:staging          # Test staging site
npm run a11y:report           # Generate JSON report
npm run a11y:lenient          # Don't fail on issues

# Build CSS
npm run build:css              # One-time build
npm run build:css -- --watch   # Watch mode
```

---

## 📚 Documentation

Comprehensive documentation is available in the `site-docs/` directory:

- **[LAYOUT_SYSTEM.md](./site-docs/LAYOUT_SYSTEM.md)** — Start here to understand how layouts work
- **[LAYOUT_ARCHITECTURE.md](./site-docs/LAYOUT_ARCHITECTURE.md)** — Deep dive into design decisions
- **[LAYOUT_QUICK_START.md](./site-docs/LAYOUT_QUICK_START.md)** — Quick reference guide

---

## 🚀 Deployment

The site uses an **environment promotion model** for deployments.

### Environment Promotion Workflow

This project uses a promotion-based deployment strategy:

1. **Feature Development**: Create `feature/*` branch from `main`, develop locally
2. **Code Review**: Open PR to merge feature branch into `main`
3. **Staging Deployment**: Merge to `main` triggers automatic deployment to staging
4. **Production Promotion**: After validation, create version tag `git tag v1.2.3 && git push --tags`

### Deployment Environments

| Environment | Trigger | Destination | URL |
|-------------|---------|-------------|-----|
| **Staging** | Push to `main` | Self-hosted server (rsync/SSH) | [stagingsite.edwardjensencms.com](https://stagingsite.edwardjensencms.com) |
| **Production** | Push `v*` tag | Cloudflare Pages | [edwardjensen.net](https://www.edwardjensen.net) |

### Content Source

This repository contains **code and templates only**. All dynamic content is managed in Payload CMS:

| Content Type | Source | Status |
|--------------|--------|--------|
| Blog Posts | Payload CMS | ✅ Migrated |
| Working Notes | Payload CMS | ✅ Migrated |
| Historic Posts | Payload CMS | ✅ Migrated |
| Photography | File-based (`_photography/`) | Repository |
| Portfolio | File-based (`_portfolio/`) | Repository |
| Pages | File-based (`_pages/`) | Repository |

**Content Workflow**: CMS publish → webhook → GitHub Actions → Jekyll build → Deploy

**CMS URLs**:
- Production: `edwardjensencms.com`
- Staging: `staging.edwardjensencms.com`

### Build Settings in Cloudflare Pages

- **Build command**: `bundle exec jekyll build && npm run build:css`
- **Output directory**: `_site/`
- **Ruby version**: 3.4.5 (via `.ruby-version`)

---

## ♿ Accessibility

This site is built with accessibility in mind. Automated testing runs on each build:

```bash
# Run accessibility checks locally
npm run a11y:dev              # Against local dev server
npm run a11y:prod             # Against production
npm run a11y:report           # Generate detailed report
```

---

## 🔄 Common Workflows

### Updating Navigation

Edit `_data/navbar.yml`:

```yaml
nav_items:
  - label: "Writing"
    url: "/writing/"
  - label: "Photography"
    url: "/photography/"
```

### Updating Social Links

Edit `_data/social.yml`:

```yaml
socials:
  - name: "GitHub"
    url: "https://github.com/edwardjensen"
    icon: "github"
```

### Adding Images

Place images in `assets/images/` and reference:

```markdown
![Alt text](/assets/images/photo.jpg)
```

For responsive images, consider WebP formats stored alongside.

---

## 🐛 Troubleshooting

### Jekyll Not Building

```bash
# Clear Jekyll cache and rebuild
rm -rf _site .jekyll-cache
bundle exec jekyll build
```

### Tailwind CSS Not Compiling

```bash
# Rebuild Tailwind CSS
npm run build:css

# Or watch for changes
npm run build:css -- --watch
```

### Live Reload Not Working

- Ensure `--livereload` flag is set in Jekyll command
- Check that no other process is using port 4000

---

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `_config.yml` | Main Jekyll configuration |
| `_config.staging.yml` | Staging-specific overrides |
| `tailwind.config.js` | Tailwind CSS customization |
| `postcss.config.js` | PostCSS/Autoprefixer setup |
| `.github/workflows/` | CI/CD automation |

---

## 📄 License

This repository contains both code and content. Please see individual files or contact for licensing details.

---

## 👤 About Edward Jensen

Edward Jensen is the Director of Information Technology at [MEDA](https://www.meda.net/) in Minneapolis, where he leads technology strategy and operations for a nonprofit focused on economic development and community empowerment.

**Get in touch**:

- 🌐 [edwardjensen.net](https://www.edwardjensen.net)
- 📧 Check the site for contact information
- 🐙 [GitHub](https://github.com/edwardjensen)

---

**Last updated**: December 2025  
**Site redesign**: October 2025 (full-width layout, sticky header, warm color palette)  
**CMS Integration**: December 2025 (Payload CMS with GraphQL content delivery)  
**Deployment model**: Environment promotion (staging → production)
