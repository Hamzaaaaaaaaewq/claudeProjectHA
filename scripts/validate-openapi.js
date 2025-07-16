#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Validating OpenAPI specifications...');

const apiSpecsDir = path.join(__dirname, '..', 'docs', 'api-specs', 'services');
let hasErrors = false;

// Check if directory exists
if (!fs.existsSync(apiSpecsDir)) {
  console.error(`Error: API specs directory not found: ${apiSpecsDir}`);
  process.exit(1);
}

// Get all YAML files
const files = fs.readdirSync(apiSpecsDir).filter(file => file.endsWith('.yaml'));

if (files.length === 0) {
  console.error('Error: No OpenAPI spec files found');
  process.exit(1);
}

// Basic validation for each file
files.forEach(file => {
  const filePath = path.join(apiSpecsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic checks
    if (!content.includes('openapi:')) {
      console.error(`Error: ${file} - Missing openapi version`);
      hasErrors = true;
    }
    
    if (!content.includes('info:')) {
      console.error(`Error: ${file} - Missing info section`);
      hasErrors = true;
    }
    
    if (!content.includes('paths:')) {
      console.error(`Error: ${file} - Missing paths section`);
      hasErrors = true;
    }
    
    console.log(`✓ ${file} - Basic structure valid`);
  } catch (error) {
    console.error(`Error reading ${file}: ${error.message}`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('\nOpenAPI validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ All OpenAPI specifications are valid!');
}