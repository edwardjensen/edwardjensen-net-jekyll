#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'dev';
const outputFormat = args.includes('--json') ? 'json' : 'cli';
const reportFile = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;

// Configuration
const config = {
  dev: {
    name: 'Local Development',
    baseUrl: 'http://localhost:4000',
    requiresBuild: false,
    requiresServer: false,
  },
  'local-staging': {
    name: 'Local Staging Build',
    baseUrl: 'http://localhost:8000',
    requiresBuild: true,
    requiresServer: true,
  },
  ci: {
    name: 'CI Pre-built Site',
    baseUrl: 'http://localhost:8000',
    requiresBuild: false,
    requiresServer: true,
  },
  staging: {
    name: 'Staging Server',
    baseUrl: 'https://staging.edwardjensen2025-jekyll.pages.dev',
    requiresBuild: false,
    requiresServer: false,
  },
  prod: {
    name: 'Production',
    baseUrl: 'https://www.edwardjensen.net',
    requiresBuild: false,
    requiresServer: false,
  },
};

if (!config[environment]) {
  console.error(`❌ Unknown environment: ${environment}`);
  console.error(`   Available: ${Object.keys(config).join(', ')}`);
  process.exit(1);
}

const envConfig = config[environment];

// Load URLs from YAML config
function loadUrls() {
  try {
    const yamlPath = path.join(__dirname, '..', '_data', 'a11y-check-urls.yml');
    const content = fs.readFileSync(yamlPath, 'utf8');
    const data = YAML.load(content);
    return data.urls || [];
  } catch (err) {
    console.error('❌ Error loading URLs from _data/a11y-check-urls.yml:', err.message);
    process.exit(1);
  }
}

// Execute shell command
function exec(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

// Build site for staging
async function buildSite() {
  console.log('🔨 Building site for staging...');
  try {
    await exec('bundle', ['exec', 'jekyll', 'build'], {
      env: { ...process.env, JEKYLL_ENV: 'staging' },
    });
    console.log('✅ Site built successfully\n');
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

// Start local HTTP server
function startServer() {
  return new Promise((resolve, reject) => {
    const siteDir = path.join(__dirname, '..', '_site');
    
    if (!fs.existsSync(siteDir)) {
      reject(new Error(`Site directory not found: ${siteDir}`));
      return;
    }

    const server = http.createServer((req, res) => {
      let filePath = path.join(siteDir, req.url === '/' ? 'index.html' : req.url);

      // Try index.html for directories
      try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
      } catch (err) {
        // Serve 404.html for errors
        const notFoundPath = path.join(siteDir, '404.html');
        fs.readFile(notFoundPath, (notFoundErr, data) => {
          if (notFoundErr) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(data);
          }
        });
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // Serve 404.html instead of plain text
          const notFoundPath = path.join(siteDir, '404.html');
          fs.readFile(notFoundPath, (notFoundErr, notFoundData) => {
            if (notFoundErr) {
              res.writeHead(404);
              res.end('Not Found');
            } else {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end(notFoundData);
            }
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error('Port 8000 is already in use. Is another server running?'));
      } else {
        reject(err);
      }
    });

    server.listen(8000, 'localhost', () => {
      console.log('🚀 Local server running on http://localhost:8000\n');
      resolve(server);
    });
  });
}

// Wait for server to be ready
function waitForServer(baseUrl, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      console.log(`⏳ Waiting for server (attempt ${attempts}/${maxAttempts})...`);
      
      const req = http.get(baseUrl, { timeout: 2000 }, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is ready\n');
          clearInterval(interval);
          resolve();
        }
      });

      req.on('error', (err) => {
        if (attempts >= maxAttempts) {
          console.error(`❌ Server failed to respond after ${maxAttempts} attempts`);
          clearInterval(interval);
          reject(new Error('Server timeout'));
        }
      });

      req.on('timeout', () => {
        req.destroy();
      });
    }, 500);
  });
}

// Run pa11y checks
async function runChecks(urls) {
  console.log(`🔍 Running accessibility checks on ${envConfig.name}...\n`);

  const fullUrls = urls.map((url) => `${envConfig.baseUrl}${url}`);
  const pa11yArgs = ['pa11y-ci', '--config', '.pa11yci.json'];

  if (outputFormat === 'json' || reportFile) {
    pa11yArgs.push('--reporter', 'json');
  }

  pa11yArgs.push(...fullUrls);
  
  console.log(`📝 Running: npx ${pa11yArgs.join(' ')}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', pa11yArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (outputFormat === 'cli') {
        process.stdout.write(data);
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All accessibility checks passed!\n');
        resolve({ success: true, stdout });
      } else {
        if (reportFile && stdout) {
          saveReport(stdout, reportFile);
        }
        reject({
          code,
          message: 'Accessibility violations found',
          stdout,
        });
      }
    });
  });
}

// Save report to file
function saveReport(data, filename) {
  try {
    fs.writeFileSync(filename, data, 'utf8');
    console.log(`📄 Report saved to ${filename}`);
  } catch (err) {
    console.error(`❌ Error saving report: ${err.message}`);
  }
}

// Main execution
async function main() {
  try {
    console.log(`📋 Accessibility Check: ${envConfig.name}\n`);

    // Build if needed
    if (envConfig.requiresBuild) {
      await buildSite();
    }

    // Start server if needed
    let server;
    if (envConfig.requiresServer) {
      server = await startServer();
      await waitForServer(envConfig.baseUrl);
    }

    // Load URLs
    const urls = loadUrls();
    if (urls.length === 0) {
      console.error('❌ No URLs found in _data/a11y-check-urls.yml');
      process.exit(1);
    }

    console.log(`📍 Checking ${urls.length} URL(s):\n`);
    urls.forEach((url) => console.log(`   ${url}`));
    console.log();

    // Run checks
    try {
      await runChecks(urls);
      if (server) server.close();
      process.exit(0);
    } catch (err) {
      if (server) server.close();
      console.error(`\n❌ ${err.message}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

main();