#!/usr/bin/env node

/**
 * Dependency Documentation Compliance Checker
 * Ensures all dependencies are properly documented
 */

const fs = require('fs');
const path = require('path');

const DEPENDENCY_DOCS_PATH = path.join(__dirname, '../docs/dependencies/registry.json');
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');

// Load dependency registry
let dependencyRegistry = {};
if (fs.existsSync(DEPENDENCY_DOCS_PATH)) {
  dependencyRegistry = JSON.parse(fs.readFileSync(DEPENDENCY_DOCS_PATH, 'utf8'));
}

// Load package.json
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));

// Combine all dependencies
const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.peerDependencies
};

// Check each dependency
const undocumentedDeps = [];
const incompleteDocs = [];

Object.keys(allDependencies).forEach(depName => {
  const depDoc = dependencyRegistry[depName];
  
  if (!depDoc) {
    undocumentedDeps.push(depName);
  } else {
    // Check required fields
    const requiredFields = [
      'version',
      'purpose',
      'alternatives',
      'license',
      'lastSecurityAudit',
      'maintainer',
      'approvedBy',
      'approvalDate'
    ];
    
    const missingFields = requiredFields.filter(field => !depDoc[field]);
    
    if (missingFields.length > 0) {
      incompleteDocs.push({
        name: depName,
        missingFields
      });
    }
    
    // Check if security audit is recent (within 90 days)
    if (depDoc.lastSecurityAudit) {
      const auditDate = new Date(depDoc.lastSecurityAudit);
      const daysSinceAudit = Math.floor((Date.now() - auditDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceAudit > 90) {
        console.warn(`WARNING: ${depName} security audit is ${daysSinceAudit} days old`);
      }
    }
  }
});

// Report results
let hasErrors = false;

if (undocumentedDeps.length > 0) {
  console.error('\n❌ UNDOCUMENTED DEPENDENCIES:');
  undocumentedDeps.forEach(dep => {
    console.error(`  - ${dep}`);
  });
  hasErrors = true;
}

if (incompleteDocs.length > 0) {
  console.error('\n❌ INCOMPLETE DOCUMENTATION:');
  incompleteDocs.forEach(({ name, missingFields }) => {
    console.error(`  - ${name}: missing ${missingFields.join(', ')}`);
  });
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n📝 To fix, update docs/dependencies/registry.json with:');
  console.error(`
{
  "dependency-name": {
    "version": "1.0.0",
    "purpose": "Why this dependency is needed",
    "alternatives": ["alternative1", "alternative2"],
    "license": "MIT",
    "lastSecurityAudit": "${new Date().toISOString().split('T')[0]}",
    "maintainer": "team-name",
    "approvedBy": "architect-name",
    "approvalDate": "${new Date().toISOString().split('T')[0]}",
    "notes": "Any additional notes"
  }
}
`);
  process.exit(1);
} else {
  console.log('✅ All dependencies properly documented');
}