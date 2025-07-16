#!/usr/bin/env node

/**
 * Bundle Size Checker
 * Ensures frontend bundles stay within performance budgets
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const gzipSize = require('gzip-size');

// Performance budgets (in bytes)
const BUDGETS = {
  js: {
    main: 200 * 1024,      // 200KB for main bundle
    vendor: 150 * 1024,    // 150KB for vendor bundle
    total: 350 * 1024,     // 350KB total JS
  },
  css: {
    main: 50 * 1024,       // 50KB for main CSS
    total: 75 * 1024,      // 75KB total CSS
  },
  images: {
    total: 500 * 1024,     // 500KB for above-fold images
  },
  fonts: {
    total: 100 * 1024,     // 100KB for web fonts
  },
};

// Next.js build output directory
const BUILD_DIR = path.join(__dirname, '../apps/web/.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

/**
 * Get size of a file (both raw and gzipped)
 */
async function getFileSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const rawSize = content.length;
    const gzippedSize = await gzipSize(content);
    return { rawSize, gzippedSize };
  } catch (error) {
    return { rawSize: 0, gzippedSize: 0 };
  }
}

/**
 * Find all files matching a pattern
 */
function findFiles(dir, pattern) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (pattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Analyze JavaScript bundles
 */
async function analyzeJavaScript() {
  const jsFiles = findFiles(STATIC_DIR, /\.js$/);
  const results = {
    main: { rawSize: 0, gzippedSize: 0 },
    vendor: { rawSize: 0, gzippedSize: 0 },
    total: { rawSize: 0, gzippedSize: 0 },
  };
  
  for (const file of jsFiles) {
    const { rawSize, gzippedSize } = await getFileSize(file);
    const fileName = path.basename(file);
    
    if (fileName.includes('main') || fileName.includes('app')) {
      results.main.rawSize += rawSize;
      results.main.gzippedSize += gzippedSize;
    } else if (fileName.includes('framework') || fileName.includes('vendor')) {
      results.vendor.rawSize += rawSize;
      results.vendor.gzippedSize += gzippedSize;
    }
    
    results.total.rawSize += rawSize;
    results.total.gzippedSize += gzippedSize;
  }
  
  return results;
}

/**
 * Analyze CSS bundles
 */
async function analyzeCSS() {
  const cssFiles = findFiles(STATIC_DIR, /\.css$/);
  const results = {
    main: { rawSize: 0, gzippedSize: 0 },
    total: { rawSize: 0, gzippedSize: 0 },
  };
  
  for (const file of cssFiles) {
    const { rawSize, gzippedSize } = await getFileSize(file);
    results.total.rawSize += rawSize;
    results.total.gzippedSize += gzippedSize;
    
    if (path.basename(file).includes('main')) {
      results.main.rawSize += rawSize;
      results.main.gzippedSize += gzippedSize;
    }
  }
  
  return results;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if size exceeds budget
 */
function checkBudget(actual, budget) {
  return actual > budget;
}

/**
 * Create status indicator
 */
function getStatus(actual, budget) {
  if (checkBudget(actual, budget)) {
    return chalk.red('✗ OVER BUDGET');
  }
  const percentage = ((actual / budget) * 100).toFixed(0);
  if (percentage > 90) {
    return chalk.yellow(`⚠ ${percentage}% of budget`);
  }
  return chalk.green(`✓ ${percentage}% of budget`);
}

/**
 * Main analysis function
 */
async function analyzeBundles() {
  console.log(chalk.blue.bold('\n📊 Bundle Size Analysis\n'));
  
  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(chalk.red('Build directory not found. Please run "npm run build" first.'));
    process.exit(1);
  }
  
  // Analyze bundles
  const jsResults = await analyzeJavaScript();
  const cssResults = await analyzeCSS();
  
  // Create results table
  const table = new Table({
    head: [
      chalk.bold('Bundle'),
      chalk.bold('Raw Size'),
      chalk.bold('Gzipped'),
      chalk.bold('Budget'),
      chalk.bold('Status'),
    ],
    style: {
      head: ['cyan'],
    },
  });
  
  // JavaScript results
  table.push(
    [chalk.bold('JavaScript'), '', '', '', ''],
    [
      '  Main Bundle',
      formatBytes(jsResults.main.rawSize),
      formatBytes(jsResults.main.gzippedSize),
      formatBytes(BUDGETS.js.main),
      getStatus(jsResults.main.gzippedSize, BUDGETS.js.main),
    ],
    [
      '  Vendor Bundle',
      formatBytes(jsResults.vendor.rawSize),
      formatBytes(jsResults.vendor.gzippedSize),
      formatBytes(BUDGETS.js.vendor),
      getStatus(jsResults.vendor.gzippedSize, BUDGETS.js.vendor),
    ],
    [
      chalk.bold('  Total JS'),
      formatBytes(jsResults.total.rawSize),
      formatBytes(jsResults.total.gzippedSize),
      formatBytes(BUDGETS.js.total),
      getStatus(jsResults.total.gzippedSize, BUDGETS.js.total),
    ],
    ['', '', '', '', ''],
    
    // CSS results
    [chalk.bold('CSS'), '', '', '', ''],
    [
      '  Main Styles',
      formatBytes(cssResults.main.rawSize),
      formatBytes(cssResults.main.gzippedSize),
      formatBytes(BUDGETS.css.main),
      getStatus(cssResults.main.gzippedSize, BUDGETS.css.main),
    ],
    [
      chalk.bold('  Total CSS'),
      formatBytes(cssResults.total.rawSize),
      formatBytes(cssResults.total.gzippedSize),
      formatBytes(BUDGETS.css.total),
      getStatus(cssResults.total.gzippedSize, BUDGETS.css.total),
    ],
  );
  
  console.log(table.toString());
  
  // Check for budget violations
  const violations = [];
  
  if (checkBudget(jsResults.main.gzippedSize, BUDGETS.js.main)) {
    violations.push(`JavaScript main bundle: ${formatBytes(jsResults.main.gzippedSize)} (budget: ${formatBytes(BUDGETS.js.main)})`);
  }
  
  if (checkBudget(jsResults.total.gzippedSize, BUDGETS.js.total)) {
    violations.push(`Total JavaScript: ${formatBytes(jsResults.total.gzippedSize)} (budget: ${formatBytes(BUDGETS.js.total)})`);
  }
  
  if (checkBudget(cssResults.total.gzippedSize, BUDGETS.css.total)) {
    violations.push(`Total CSS: ${formatBytes(cssResults.total.gzippedSize)} (budget: ${formatBytes(BUDGETS.css.total)})`);
  }
  
  // Report results
  if (violations.length > 0) {
    console.log(chalk.red.bold('\n❌ Budget Violations Found:\n'));
    violations.forEach(v => console.log(chalk.red(`  • ${v}`)));
    
    console.log(chalk.yellow.bold('\n💡 Suggestions:\n'));
    console.log(chalk.yellow('  • Use dynamic imports for code splitting'));
    console.log(chalk.yellow('  • Remove unused dependencies'));
    console.log(chalk.yellow('  • Optimize images and use WebP format'));
    console.log(chalk.yellow('  • Use CSS modules to eliminate dead CSS'));
    console.log(chalk.yellow('  • Consider using a CDN for large libraries'));
    
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✅ All bundles within budget!\n'));
  }
  
  // Write results to JSON for CI
  const report = {
    timestamp: new Date().toISOString(),
    javascript: {
      main: jsResults.main.gzippedSize,
      vendor: jsResults.vendor.gzippedSize,
      total: jsResults.total.gzippedSize,
    },
    css: {
      main: cssResults.main.gzippedSize,
      total: cssResults.total.gzippedSize,
    },
    budgets: BUDGETS,
    violations: violations,
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../bundle-size-report.json'),
    JSON.stringify(report, null, 2)
  );
}

// Run analysis
analyzeBundles().catch(error => {
  console.error(chalk.red('Error analyzing bundles:'), error);
  process.exit(1);
});