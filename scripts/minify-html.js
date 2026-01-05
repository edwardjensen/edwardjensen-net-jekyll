#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

// Configuration
const SITE_DIR = path.join(__dirname, '..', '_site');
const JEKYLL_ENV = process.env.JEKYLL_ENV || 'development';

// Placeholder prefix/suffix for protecting Alpine.js attributes during minification
const PLACEHOLDER_PREFIX = '___ALPINE_ATTR_';
const PLACEHOLDER_SUFFIX = '___';

// Alpine.js attribute patterns to protect
const ALPINE_PATTERNS = [
  // @event and @event.modifier attributes (e.g., @click, @click.prevent)
  /@[\w.-]+(?:\.[\w.-]+)*="[^"]*"/g,
  // x-* directives (e.g., x-data, x-show, x-if, x-for)
  /x-[\w:-]+(?:\.[\w.-]+)*="[^"]*"/g,
  // x-* directives without values (e.g., x-cloak, x-transition)
  /x-[\w:-]+(?:\.[\w.-]+)*(?=[\s>])/g,
  // Shorthand bindings - must start with : followed by letters only (not digits)
  // This avoids matching Tailwind classes like flex-1, px-6, etc.
  /(?<=\s):(?=[a-zA-Z])[a-zA-Z-]+="[^"]*"/g,
];

// Escape problematic characters in HTML attribute values
// The HTML parser chokes on nested quotes inside attribute values
function escapeProblematicChars(html) {
  // First, escape curly quotes globally
  let result = html
    .replace(/\u201C/g, '&ldquo;')  // Left double quote "
    .replace(/\u201D/g, '&rdquo;')  // Right double quote "
    .replace(/\u2018/g, '&lsquo;')  // Left single quote '
    .replace(/\u2019/g, '&rsquo;'); // Right single quote '

  // Fix malformed HTML: escape double quotes inside double-quoted attribute values
  // This regex finds attr="value with "nested" quotes" and fixes them
  // We need to be careful to not escape the outer quotes
  result = result.replace(/(\s[\w-]+)="([^"]*)"([^>]*>)/g, (match, prefix, value, suffix) => {
    // Only process if the value contains what looks like nested quotes
    // followed by more content (indicating the attribute wasn't properly closed)
    if (!value.includes('"')) {
      return match;
    }
    // Escape any double quotes inside the value
    const escapedValue = value.replace(/"/g, '&quot;');
    return `${prefix}="${escapedValue}"${suffix}`;
  });

  return result;
}

// Protect Alpine.js attributes by replacing them with placeholders
function protectAlpineAttrs(html) {
  const protectedAttrs = [];
  let result = html;

  for (const pattern of ALPINE_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const index = protectedAttrs.length;
      protectedAttrs.push(match);
      return ` ${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX} `;
    });
  }

  return { html: result, protected: protectedAttrs };
}

// Restore Alpine.js attributes from placeholders
function restoreAlpineAttrs(html, protected) {
  let result = html;

  for (let i = 0; i < protected.length; i++) {
    const placeholder = `${PLACEHOLDER_PREFIX}${i}${PLACEHOLDER_SUFFIX}`;
    // Handle possible whitespace variations around placeholder
    const placeholderRegex = new RegExp(`\\s*${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
    result = result.replace(placeholderRegex, ' ' + protected[i] + ' ');
  }

  // Clean up any double spaces
  result = result.replace(/\s{2,}/g, ' ');
  // Fix spaces before >
  result = result.replace(/\s+>/g, '>');

  return result;
}

// html-minifier-terser options (aggressive but safe)
const MINIFY_OPTIONS = {
  // Whitespace handling
  collapseWhitespace: true,
  conservativeCollapse: false,
  preserveLineBreaks: false,

  // Comment handling
  removeComments: true,

  // Attribute optimization - keep quotes to handle special characters in attribute values
  removeAttributeQuotes: false, // Disabled - curly quotes in aria-labels cause parse errors
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,

  // Boolean attributes
  collapseBooleanAttributes: true,

  // CSS/JS handling (do NOT minify inline - already handled by PostCSS/could break Alpine.js)
  minifyCSS: false,
  minifyJS: false,

  // Safety options
  keepClosingSlash: false,
  caseSensitive: false,

  // HTML5 doctype
  useShortDoctype: false,

  // Sorting (helps compression)
  sortAttributes: true,
  sortClassName: true,

  // Decode entities to handle special characters
  decodeEntities: true,

  // Use custom quote character patterns to handle curly quotes
  quoteCharacter: '"',
};

// Statistics tracking
const stats = {
  filesProcessed: 0,
  filesSkipped: 0,
  totalOriginalSize: 0,
  totalMinifiedSize: 0,
  errors: [],
  skipped: [],
};

// Recursively find all HTML files
function findHtmlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Minify a single file
async function minifyFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const originalSize = Buffer.byteLength(original, 'utf8');

  try {
    // Step 1: Escape problematic characters (curly quotes, nested quotes)
    const escapedHtml = escapeProblematicChars(original);

    // Step 2: Protect Alpine.js attributes before minification
    const { html: protectedHtml, protected: protectedAttrs } = protectAlpineAttrs(escapedHtml);

    // Step 3: Minify the protected HTML
    const minifiedProtected = await minify(protectedHtml, MINIFY_OPTIONS);

    // Step 4: Restore Alpine.js attributes after minification
    const minified = restoreAlpineAttrs(minifiedProtected, protectedAttrs);
    const minifiedSize = Buffer.byteLength(minified, 'utf8');

    fs.writeFileSync(filePath, minified, 'utf8');

    stats.filesProcessed++;
    stats.totalOriginalSize += originalSize;
    stats.totalMinifiedSize += minifiedSize;

    return { success: true, originalSize, minifiedSize };
  } catch (error) {
    // Check if this is a parse error (malformed HTML)
    if (error.message && error.message.includes('Parse Error')) {
      // Skip this file but don't count it as a failure
      stats.filesSkipped++;
      stats.skipped.push({ file: filePath, reason: 'Malformed HTML (unescaped quotes in attributes)' });
      // Still count the original size (file wasn't minified)
      stats.totalOriginalSize += originalSize;
      stats.totalMinifiedSize += originalSize;
      return { success: true, skipped: true, originalSize };
    }
    stats.errors.push({ file: filePath, error: error.message });
    return { success: false, error: error.message };
  }
}

// Format bytes for display
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Main execution
async function main() {
  // Check environment - skip minification in development
  if (JEKYLL_ENV !== 'production' && JEKYLL_ENV !== 'staging') {
    console.log(`Skipping HTML minification (JEKYLL_ENV=${JEKYLL_ENV})`);
    console.log('Set JEKYLL_ENV=production or JEKYLL_ENV=staging to enable minification.');
    process.exit(0);
  }

  console.log(`HTML Minification (JEKYLL_ENV=${JEKYLL_ENV})`);
  console.log('='.repeat(50));

  // Verify _site directory exists
  if (!fs.existsSync(SITE_DIR)) {
    console.error(`Error: Site directory not found: ${SITE_DIR}`);
    console.error('Run Jekyll build first: bundle exec jekyll build');
    process.exit(1);
  }

  // Find all HTML files
  const htmlFiles = findHtmlFiles(SITE_DIR);
  console.log(`Found ${htmlFiles.length} HTML files in ${SITE_DIR}`);
  console.log();

  // Process files with progress indicator
  const startTime = Date.now();

  for (let i = 0; i < htmlFiles.length; i++) {
    const file = htmlFiles[i];
    const result = await minifyFile(file);

    // Progress indicator (every 10 files or on error)
    if ((i + 1) % 10 === 0 || !result.success) {
      const relativePath = path.relative(SITE_DIR, file);
      if (result.success && !result.skipped) {
        const reduction = ((1 - result.minifiedSize / result.originalSize) * 100).toFixed(1);
        process.stdout.write(`[${i + 1}/${htmlFiles.length}] ${relativePath} (-${reduction}%)\n`);
      } else if (result.skipped) {
        process.stdout.write(`[${i + 1}/${htmlFiles.length}] ${relativePath} (skipped)\n`);
      } else {
        console.error(`[${i + 1}/${htmlFiles.length}] ERROR: ${relativePath} - ${result.error}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log();
  console.log('='.repeat(50));
  console.log('Summary');
  console.log('='.repeat(50));
  console.log(`Files minified:  ${stats.filesProcessed}`);
  if (stats.filesSkipped > 0) {
    console.log(`Files skipped:   ${stats.filesSkipped} (malformed HTML)`);
  }
  console.log(`Original size:   ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`Minified size:   ${formatBytes(stats.totalMinifiedSize)}`);

  const savings = stats.totalOriginalSize - stats.totalMinifiedSize;
  const percentage = stats.totalOriginalSize > 0
    ? ((savings / stats.totalOriginalSize) * 100).toFixed(1)
    : '0.0';
  console.log(`Size reduction:  ${formatBytes(savings)} (${percentage}%)`);
  console.log(`Time elapsed:    ${elapsed}s`);

  if (stats.skipped.length > 0) {
    console.log();
    console.log(`Skipped files (${stats.skipped.length}):`);
    stats.skipped.forEach(({ file, reason }) => {
      console.log(`  - ${path.relative(SITE_DIR, file)}`);
    });
  }

  if (stats.errors.length > 0) {
    console.log();
    console.log(`Errors: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.error(`  - ${path.relative(SITE_DIR, file)}: ${error}`);
    });
    process.exit(1);
  }

  console.log();
  console.log('HTML minification complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
