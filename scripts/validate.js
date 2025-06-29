#!/usr/bin/env node

/**
 * Chrome Extension Validation Script
 * Validates the extension structure and files
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating LinkedIn Candidate Scraper Extension...\n');

let hasErrors = false;

// Check required files
const requiredFiles = [
  'manifest.json',
  'src/popup.html',
  'src/js/content.js',
  'src/js/popup.js',
  'src/js/background.js',
  'src/js/xlsx.full.min.js',
  'README.md',
  'LICENSE',
  'CHANGELOG.md'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Validate manifest.json
console.log('\n📋 Validating manifest.json...');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  
  // Check required fields
  const requiredFields = ['manifest_version', 'name', 'version', 'permissions', 'content_scripts'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ ${field}: ${JSON.stringify(manifest[field])}`);
    } else {
      console.log(`❌ ${field} - MISSING`);
      hasErrors = true;
    }
  });
  
  // Check permissions
  const requiredPermissions = ['activeTab', 'storage', 'downloads'];
  requiredPermissions.forEach(permission => {
    if (manifest.permissions && manifest.permissions.includes(permission)) {
      console.log(`✅ Permission: ${permission}`);
    } else {
      console.log(`❌ Permission: ${permission} - MISSING`);
      hasErrors = true;
    }
  });
  
} catch (error) {
  console.log(`❌ manifest.json is not valid JSON: ${error.message}`);
  hasErrors = true;
}

// Check file sizes
console.log('\n📊 Checking file sizes...');
const maxSize = 1024 * 1024; // 1MB
const largeFiles = [];

function checkDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && stats.size > maxSize) {
      largeFiles.push({ file: filePath, size: stats.size });
    } else if (stats.isDirectory()) {
      checkDirectory(filePath);
    }
  });
}

checkDirectory('.');
if (largeFiles.length > 0) {
  console.log('⚠️ Large files detected:');
  largeFiles.forEach(({ file, size }) => {
    console.log(`   ${file}: ${(size / 1024 / 1024).toFixed(2)}MB`);
  });
} else {
  console.log('✅ All files are reasonably sized');
}

// Check HTML structure
console.log('\n🌐 Validating HTML structure...');
try {
  const popupHtml = fs.readFileSync('src/popup.html', 'utf8');
  
  if (popupHtml.includes('popup.js')) {
    console.log('✅ popup.html references popup.js');
  } else {
    console.log('❌ popup.html missing popup.js reference');
    hasErrors = true;
  }
  
  if (popupHtml.includes('<script')) {
    console.log('✅ popup.html contains script tags');
  } else {
    console.log('❌ popup.html missing script tags');
    hasErrors = true;
  }
  
} catch (error) {
  console.log(`❌ Error reading popup.html: ${error.message}`);
  hasErrors = true;
}

// Check JavaScript syntax
console.log('\n🔧 Validating JavaScript syntax...');
const jsFiles = ['src/js/content.js', 'src/js/popup.js', 'src/js/background.js'];

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Basic syntax check - try to parse as module
    new Function(content);
    console.log(`✅ ${file} - Valid syntax`);
  } catch (error) {
    console.log(`❌ ${file} - Syntax error: ${error.message}`);
    hasErrors = true;
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Validation failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('✅ All validations passed! Extension is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Initialize git: git init');
  console.log('2. Add remote: git remote add origin https://github.com/your-username/linkedin-candidate-scraper.git');
  console.log('3. Add files: git add .');
  console.log('4. Commit: git commit -m "Initial commit"');
  console.log('5. Push: git push -u origin main');
  console.log('6. Enable GitHub Actions in your repository settings');
} 