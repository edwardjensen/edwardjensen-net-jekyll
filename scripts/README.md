# Build and Utility Scripts

This directory contains utility scripts for the Jekyll site build process.

## Files

- **`a11y-check.js`** - Node.js accessibility checking script
- **`copy-vendor-assets.js`** - Copies vendor assets from node_modules to assets directory

## Accessibility Checking Script: a11y-check.js

This script runs pa11y accessibility audits on the Jekyll site. It checks specified pages for WCAG compliance and can be integrated into your build pipeline.

### NPM Scripts

The following npm scripts are available for convenience:

```bash
# Basic accessibility check
npm run a11y

# Check development site
npm run a11y:dev

# Check staging site
npm run a11y:staging

# Check production site
npm run a11y:prod

# Generate JSON report
npm run a11y:report
```

### Integration with Build Process

To integrate with your Jekyll build process:

1. **Development**: Run `npm run a11y:dev` after starting Jekyll with `bundle exec jekyll serve`
2. **CI/CD**: Use `npm run a11y:prod` in your deployment pipeline
3. **Pre-commit**: Add `npm run a11y:dev` to your git pre-commit hooks

## Notes

- Accessibility checks require the site to be running and accessible
- pa11y will be automatically installed if not present
- URLs to check are configured in `_data/a11y-check-urls.yml`
