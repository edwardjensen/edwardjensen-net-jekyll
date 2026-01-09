# Edward Jensen - Portfolio & Blog

A modern, accessible personal portfolio and blog built with Jekyll, Tailwind CSS, and AlpineJS. This site showcases writing on nonprofit technology, photography, and urban civic engagement.

**Live Site**: [edwardjensen.net](https://www.edwardjensen.net)

---

## About This Repository

This is the source code for [edwardjensen.net](https://www.edwardjensen.net), a personal website featuring:

- **Writing**: Essays and reflections on nonprofit technology, systems thinking, and civic engagement
- **Photography**: Urban and documentary photography portfolio
- **Portfolio**: Notable projects and civic leadership work
- **Live Camera**: Occasionally live stream of downtown Saint Paul, Minnesota

**Content Architecture**: This repository contains **code and templates only**. All blog posts, working notes, historic posts, and photography are managed in a separate [Payload CMS](https://payloadcms.com/) instance and fetched via GraphQL at build time.

### Why This Repo is Public

This repository is public to share the technical implementation of a Jekyll site with:

- Headless CMS integration (Payload CMS via GraphQL)
- Custom Jekyll plugins for pagination, RSS feeds, and sitemap generation
- Tailwind CSS 4.x integration with Jekyll
- CI/CD workflows with GitHub Actions and Cloudflare Pages

Feel free to explore the code and adapt patterns for your own projects.

---

## Tech Stack

| Component                  | Technology                 | Version  |
| -------------------------- | -------------------------- | -------- |
| **Static Site Generator**  | Jekyll                     | 4.4.1    |
| **Styling**                | Tailwind CSS               | 4.0.x    |
| **Interactivity**          | AlpineJS                   | v3       |
| **Color Scheme**           | Amber/Slate (warm palette) | Custom   |
| **Content Source**         | Payload CMS                | Headless |
| **Production Hosting**     | Cloudflare Pages           | —        |
| **Runtime**                | Ruby 3.4.5 + Node 25.1.0   | —        |

---

## Quick Start

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

## Project Structure

```text
.
├── _config.yml              # Jekyll configuration
├── _data/                   # Data files (YAML/JSON)
│   ├── navbar.yml           # Navigation structure
│   ├── social.yml           # Social media links
│   └── rss-feeds.yml        # RSS feed configuration
├── _includes/               # Reusable Jekyll includes
│   ├── components/          # UI components (header, nav, etc.)
│   ├── core/                # Core layout components
│   └── sections/            # Page sections
├── _layouts/                # Jekyll layouts
│   ├── base.html            # Root layout with sticky header
│   ├── content-wrapper.html # Content spacing/max-width
│   ├── page.html            # Standard page layout
│   ├── single-post.html     # Blog post layout
│   ├── landing-page.html    # Landing page layout
│   └── gallery-page.html    # Photo gallery layout
├── _site_pages/             # Static pages (about, contact, etc.)
├── _plugins/                # Jekyll plugins
├── _portfolio/              # Project portfolio entries
├── assets/                  # Static assets (images, fonts, etc.)
├── _sections_homepage/      # Homepage component partials
├── scripts/                 # Build and utility scripts
├── site-docs/               # Developer documentation
├── package.json             # Node.js dependencies
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

### Key Directories

- **`_layouts/`**: Jekyll layout templates (use `layout: layout-name` in front matter)
- **`_includes/components/`**: Reusable UI components
- **`_plugins/`**: Custom Jekyll plugins:
  - `payload_cms.rb` — CMS content fetching via GraphQL
  - `rss_feed_generator.rb` — RSS feed generation from config
  - `sitemap_generator.rb` — Sitemap and robots.txt generation
  - `pagination_generator.rb` — Collection-agnostic pagination with filtering
- **`_site_pages/`**: Static pages (about, contact, etc.)
- **`site-docs/`**: Developer documentation

---

## Content Architecture

This site uses a **headless CMS architecture**:

| Content Type   | Source                     | Notes                             |
| -------------- | -------------------------- | --------------------------------- |
| Blog Posts     | Payload CMS                | Fetched via GraphQL at build time |
| Working Notes  | Payload CMS                | Fetched via GraphQL at build time |
| Historic Posts | Payload CMS                | Legacy WordPress archive          |
| Photography    | Payload CMS                | Fetched via GraphQL at build time |
| Portfolio      | File-based (`_portfolio/`) | Still in repository               |

### How It Works

1. Content is created/edited in Payload CMS
2. On publish, CMS fires a webhook to GitHub Actions
3. GitHub Actions triggers a Jekyll build
4. The `_plugins/payload_cms.rb` plugin queries the CMS via GraphQL
5. Jekyll renders static HTML and deploys to Cloudflare Pages

### File-Based Content

Portfolio items remain file-based in the `_portfolio/` directory.

---

## Design System

### Color Palette (2026 Brand Colors)

The site uses a custom brand color palette:

| Color           | Hex Code   | Purpose                                    |
| --------------- | ---------- | ------------------------------------------ |
| **brand-ink**   | `#001524`  | Dark navy - dark mode bg, light mode text  |
| **brand-orange**| `#F58F29`  | Primary accent - links, buttons, highlights|
| **brand-grey**  | `#767B91`  | Secondary text, muted elements, borders    |
| **brand-chestnut**| `#772E25`| Hover states, focus outlines               |
| **brand-smoke** | `#F3F3F3`  | Light mode backgrounds, dark mode text     |

### Typography

- **Headers**: `Fraunces` (Google Fonts, optical sizing, 700/600 weights)
- **Body Text**: `Source Sans 3` (Google Fonts)
- All header navigation text uses `.lowercase` class

### Layout

The site uses a **full-width stacked layout** (refactored in Oct 2025):

- **Sticky header** at top with transparent backdrop blur (z-40)
- **Desktop nav**: Horizontal navigation with site title, center menu, right social icons
- **Mobile nav**: Hamburger menu with slide-down animation
- **Content**: Max-width 7xl, centered with proper spacing

---

## Available Scripts

```bash
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

## Documentation

Developer documentation is available in the `site-docs/` directory:

- **[LAYOUTS_AND_STYLES.md](./site-docs/LAYOUTS_AND_STYLES.md)** — Layout system and CSS class reference
- **[ACCESSIBILITY.md](./site-docs/ACCESSIBILITY.md)** — Accessibility guidelines
- **[SEARCH_IMPLEMENTATION.md](./site-docs/SEARCH_IMPLEMENTATION.md)** — Search feature documentation

Additional context files:

- **[CLAUDE.md](./CLAUDE.md)** — Comprehensive codebase documentation for AI assistants
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** — GitHub Copilot context

---

## Deployment

The site uses an **environment promotion model**:

1. **Feature Development**: Create `feature/*` branch from `main`, develop locally
2. **Code Review**: Open PR to merge feature branch into `main`
3. **Staging Deployment**: Merge to `main` triggers automatic deployment to staging
4. **Production Promotion**: Create version tag `git tag v1.2.3 && git push --tags`

### GitHub Actions Workflows

All Cloudflare deployments use **Wrangler v4**.

| Workflow                   | Trigger              | Purpose                              |
| -------------------------- | -------------------- | ------------------------------------ |
| `pr-checks.yml`            | Pull request         | Build validation                     |
| `deploy-staging.yml`       | Push to `main`       | Deploy to staging environment        |
| `deploy-prod-site.yml`     | Push `v*` tag        | Deploy to production                 |
| `republish-prod.yml`       | CMS webhook          | Rebuild production with CMS changes  |
| `deploy-hi-redirector.yml` | Push (worker files)  | Deploy hi.edwardjensen.net worker    |

### Build Configuration

```bash
# Production build
JEKYLL_ENV=production bundle exec jekyll build
```

The site deploys to Cloudflare Pages. Build output is in `_site/`.

---

## Accessibility

This site is built with accessibility in mind. Automated testing runs on each build:

```bash
# Run accessibility checks locally
npm run a11y:dev              # Against local dev server
npm run a11y:prod             # Against production
npm run a11y:report           # Generate detailed report
```

---

## Common Workflows

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

## Troubleshooting

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

## Cloudflare Workers

This repository includes Cloudflare Workers in `cloudflare-workers/`:

| Worker | URL | Purpose |
| ------ | --- | ------- |
| `maps-proxy` | `ejnetmaps.edwardjensenprojects.com` | Google Maps Static API proxy |
| `hi-redirector` | `hi.edwardjensen.net` | Short URL redirects with UTM tracking |

The `hi.edwardjensen.net` subdomain is handled entirely by a Cloudflare Worker in this repository - there is no separate Jekyll site for it.

---

## Configuration Files

| File                   | Purpose                     |
| ---------------------- | --------------------------- |
| `_config.yml`          | Main Jekyll configuration   |
| `tailwind.config.js`   | Tailwind CSS customization  |
| `postcss.config.js`    | PostCSS/Autoprefixer setup  |
| `.github/workflows/`   | CI/CD automation            |

---

## License

The **code** in this repository (layouts, plugins, configuration, stylesheets) is available under the [MIT License](https://opensource.org/licenses/MIT).

**Content** (blog posts, photography, portfolio items) is copyrighted and not licensed for reuse without permission.

## Contributing

This is a personal website, so I'm not accepting pull requests for content changes. However, if you notice a bug in the code or have suggestions for the Jekyll plugins, feel free to open an issue.

## Contact

- Website: [edwardjensen.net](https://www.edwardjensen.net)
- GitHub: [@edwardjensen](https://github.com/edwardjensen)

---

**Last updated**: January 2026
