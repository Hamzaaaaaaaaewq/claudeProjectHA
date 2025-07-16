#!/usr/bin/env node

/**
 * Arabic Typography Checker
 * Validates Arabic text quality and typography in the codebase
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const glob = require('glob');

// Arabic typography rules
const RULES = {
  // Common copy-paste issues
  isolatedLetters: {
    pattern: /[\u0621-\u064A]\s[\u0621-\u064A]/g,
    message: 'Isolated Arabic letters detected (possible copy-paste issue)',
    severity: 'error',
  },
  
  // Latin punctuation in Arabic text
  latinPunctuation: {
    pattern: /[\u0621-\u064A]+[.!?,;:]/g,
    message: 'Latin punctuation used with Arabic text',
    severity: 'warning',
    suggestion: 'Use Arabic punctuation: ، ؛ ؟',
  },
  
  // Missing Arabic quotes
  latinQuotes: {
    pattern: /[\u0621-\u064A]+["'`]|["'`][\u0621-\u064A]+/g,
    message: 'Latin quotes used with Arabic text',
    severity: 'warning',
    suggestion: 'Use Arabic quotes: « »',
  },
  
  // Numbers in Arabic text
  latinNumbers: {
    pattern: /[\u0621-\u064A]+[0-9]+|[0-9]+[\u0621-\u064A]+/g,
    message: 'Latin numbers mixed with Arabic text',
    severity: 'info',
    suggestion: 'Consider using Arabic-Indic numerals: ٠١٢٣٤٥٦٧٨٩',
  },
  
  // Incorrect RTL marks
  rtlMarks: {
    pattern: /[\u200E\u200F\u202A-\u202E]/g,
    message: 'Explicit RTL/LTR marks found',
    severity: 'warning',
    suggestion: 'Use CSS direction instead of Unicode marks',
  },
  
  // Mixed scripts without proper separation
  mixedScripts: {
    pattern: /[\u0621-\u064A][a-zA-Z]|[a-zA-Z][\u0621-\u064A]/g,
    message: 'Arabic and Latin scripts directly adjacent',
    severity: 'warning',
    suggestion: 'Add space or use proper bidi isolation',
  },
  
  // Common Arabic typography mistakes
  incorrectHamza: {
    pattern: /ائ|أئ|ؤئ/g,
    message: 'Incorrect hamza combination',
    severity: 'error',
  },
  
  // Tashkeel (diacritics) consistency
  incompleteTashkeel: {
    pattern: /[\u0621-\u064A][\u064B-\u0652][\u0621-\u064A](?![\u064B-\u0652])/g,
    message: 'Inconsistent use of tashkeel (diacritics)',
    severity: 'info',
    suggestion: 'Either use full tashkeel or none',
  },
};

// File patterns to check
const FILE_PATTERNS = [
  'src/**/*.{ts,tsx,js,jsx}',
  'locales/**/*.json',
  'content/**/*.{md,mdx}',
  'public/locales/**/*.json',
];

// Patterns to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
];

/**
 * Extract Arabic text from different file types
 */
function extractArabicText(filePath, content) {
  const arabicTexts = [];
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+[^"'\n]*/g;
  
  if (filePath.endsWith('.json')) {
    // For JSON files, parse and extract string values
    try {
      const json = JSON.parse(content);
      
      function extractStrings(obj, path = '') {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            const matches = value.match(arabicPattern);
            if (matches) {
              arabicTexts.push({
                text: value,
                path: currentPath,
                line: getLineNumber(content, value),
              });
            }
          } else if (typeof value === 'object' && value !== null) {
            extractStrings(value, currentPath);
          }
        }
      }
      
      extractStrings(json);
    } catch (error) {
      console.error(chalk.red(`Failed to parse JSON in ${filePath}`));
    }
  } else {
    // For source files, extract from strings and comments
    const stringPattern = /(['"`])([^'"`]*[\u0600-\u06FF][^'"`]*)(['"`])/g;
    const commentPattern = /(?:\/\/|\/\*|\*)([^*\n]*[\u0600-\u06FF][^*\n]*)/g;
    
    let match;
    while ((match = stringPattern.exec(content)) !== null) {
      arabicTexts.push({
        text: match[2],
        path: 'string',
        line: getLineNumber(content, match[0], match.index),
      });
    }
    
    while ((match = commentPattern.exec(content)) !== null) {
      arabicTexts.push({
        text: match[1],
        path: 'comment',
        line: getLineNumber(content, match[0], match.index),
      });
    }
  }
  
  return arabicTexts;
}

/**
 * Get line number for a match
 */
function getLineNumber(content, searchStr, index = 0) {
  const lines = content.substring(0, index + searchStr.length).split('\n');
  return lines.length;
}

/**
 * Check Arabic text against rules
 */
function checkArabicText(text, filePath, line, textPath) {
  const issues = [];
  
  for (const [ruleName, rule] of Object.entries(RULES)) {
    const matches = text.match(rule.pattern);
    
    if (matches && matches.length > 0) {
      issues.push({
        rule: ruleName,
        severity: rule.severity,
        message: rule.message,
        suggestion: rule.suggestion,
        file: filePath,
        line: line,
        path: textPath,
        text: text,
        matches: matches,
      });
    }
  }
  
  return issues;
}

/**
 * Check all files
 */
async function checkFiles() {
  console.log(chalk.blue.bold('\n🔍 Arabic Typography Check\n'));
  
  const allIssues = [];
  
  for (const pattern of FILE_PATTERNS) {
    const files = glob.sync(pattern, {
      ignore: IGNORE_PATTERNS,
      nodir: true,
    });
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const arabicTexts = extractArabicText(file, content);
        
        for (const { text, path: textPath, line } of arabicTexts) {
          const issues = checkArabicText(text, file, line, textPath);
          allIssues.push(...issues);
        }
      } catch (error) {
        console.error(chalk.red(`Error reading ${file}:`, error.message));
      }
    }
  }
  
  // Group issues by severity
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');
  const info = allIssues.filter(i => i.severity === 'info');
  
  // Display results
  if (errors.length > 0) {
    console.log(chalk.red.bold(`\n❌ Errors (${errors.length}):\n`));
    displayIssues(errors);
  }
  
  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`\n⚠️  Warnings (${warnings.length}):\n`));
    displayIssues(warnings);
  }
  
  if (info.length > 0) {
    console.log(chalk.blue.bold(`\nℹ️  Info (${info.length}):\n`));
    displayIssues(info);
  }
  
  // Summary
  console.log(chalk.bold('\n📊 Summary:'));
  console.log(`  Total issues: ${allIssues.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Info: ${info.length}`);
  
  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: allIssues.length,
      errors: errors.length,
      warnings: warnings.length,
      info: info.length,
    },
    issues: allIssues,
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../arabic-typography-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Exit with error if errors found
  if (errors.length > 0) {
    console.log(chalk.red.bold('\n✗ Arabic typography check failed\n'));
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(chalk.yellow.bold('\n⚠ Arabic typography check passed with warnings\n'));
  } else {
    console.log(chalk.green.bold('\n✓ Arabic typography check passed\n'));
  }
}

/**
 * Display issues in a formatted way
 */
function displayIssues(issues) {
  // Group by file
  const byFile = {};
  
  for (const issue of issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }
  
  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(chalk.underline(file));
    
    for (const issue of fileIssues) {
      const location = chalk.gray(`${issue.line}:${issue.path}`);
      const severity = issue.severity === 'error' ? chalk.red('error') :
                      issue.severity === 'warning' ? chalk.yellow('warning') :
                      chalk.blue('info');
      
      console.log(`  ${location} ${severity} ${issue.message}`);
      
      if (issue.text.length < 100) {
        console.log(chalk.gray(`    Text: "${issue.text}"`));
      } else {
        console.log(chalk.gray(`    Text: "${issue.text.substring(0, 100)}..."`));
      }
      
      if (issue.suggestion) {
        console.log(chalk.green(`    💡 ${issue.suggestion}`));
      }
      
      console.log();
    }
  }
}

// Run the check
checkFiles().catch(error => {
  console.error(chalk.red('Error:', error));
  process.exit(1);
});