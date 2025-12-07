const fs = require('fs');
const path = require('path');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const copyFile = (src, dest) => {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${dest}`);
};

// Copy to _site/ directory (Jekyll output)
const siteDir = '_site';

// Alpine.js
copyFile(
  'node_modules/alpinejs/dist/cdn.min.js',
  `${siteDir}/assets/js/alpine.min.js`
);

// Lunr
copyFile(
  'node_modules/lunr/lunr.min.js',
  `${siteDir}/assets/js/lunr.min.js`
);

// Lite YouTube Embed
copyFile(
  'node_modules/lite-youtube-embed/src/lite-yt-embed.js',
  `${siteDir}/assets/js/lite-yt-embed.js`
);

copyFile(
  'node_modules/lite-youtube-embed/src/lite-yt-embed.css',
  `${siteDir}/assets/css/lite-yt-embed.css`
);

// Bootstrap Icons CSS
copyFile(
  'node_modules/bootstrap-icons/font/bootstrap-icons.min.css',
  `${siteDir}/assets/css/bootstrap-icons.min.css`
);

// Bootstrap Icons fonts
const fontFiles = fs.readdirSync('node_modules/bootstrap-icons/font/fonts');
fontFiles.forEach(file => {
  copyFile(
    `node_modules/bootstrap-icons/font/fonts/${file}`,
    `${siteDir}/assets/fonts/bootstrap-icons/${file}`
  );
});

// Fix Bootstrap Icons CSS font paths
const cssPath = `${siteDir}/assets/css/bootstrap-icons.min.css`;
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(/fonts\//g, '../fonts/bootstrap-icons/');
fs.writeFileSync(cssPath, css);
console.log('✓ Fixed Bootstrap Icons font paths');

console.log('\n✓ All vendor assets copied to _site/');