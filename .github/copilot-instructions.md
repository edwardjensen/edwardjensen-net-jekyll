# Copilot Instructions for edwardjensen2025

## Tech Stack
- **Framework**: Jekyll 4.4.1 (Ruby static site generator)
- **Styling**: Tailwind CSS 4.0.x with custom amber/slate color scheme + reusable CSS classes
- **Interactivity**: AlpineJS v3 (lightweight component state/transitions)
- **Deployment**: Cloudflare Pages via GitHub Actions

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
- `_layouts/base.html` - Now includes sticky header-nav component at top
- `_layouts/main.html` - New full-width layout (max-width 4xl, centered)
- `_layouts/with-sidebar.html` - Refactored to use full-width (sidebar removed)
- `_includes/components/header-nav.html` - NEW: Sticky header with responsive nav

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

## Post YAML for Homepage
Posts can be marked featured with:
```yaml
featured: true  # Shows in homepage featured section
```

## Key Patterns
- Use `.lowercase` class for all header text
- Use `gap-2` for tight social icon spacing
- Alpine.js `x-data` on parent container (not individual elements)
- Use reusable CSS classes (`.btn-primary`, `.link-accent`, `.text-body`, etc.) instead of inline utilities for common patterns
- All colors use amber accent (not blue) - if you see blue hovers, replace with amber

## Documentation
- **Primary reference**: `site-docs/LAYOUTS_AND_STYLES.md` - Layout system + CSS class reference
- **Quick lookup**: See "Quick Reference (Cheat Sheet)" section at top of LAYOUTS_AND_STYLES.md
- **Context file**: `.claude/site-work/project-context.md` - Comprehensive project overview