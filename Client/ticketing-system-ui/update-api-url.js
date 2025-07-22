#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to update API base URL
function updateApiUrl(newUrl) {
  const apiConfigPath = path.join(__dirname, 'src', 'config', 'api.js');
  
  try {
    let content = fs.readFileSync(apiConfigPath, 'utf8');
    
    // Replace the API_BASE_URL
    content = content.replace(
      /export const API_BASE_URL = ['"`][^'"`]*['"`];/,
      `export const API_BASE_URL = '${newUrl}';`
    );
    
    fs.writeFileSync(apiConfigPath, content);
    console.log(`✅ API base URL updated to: ${newUrl}`);
    console.log(`📁 Updated file: ${apiConfigPath}`);
  } catch (error) {
    console.error('❌ Error updating API base URL:', error.message);
  }
}

// Get the new URL from command line arguments
const newUrl = process.argv[2];

if (!newUrl) {
  console.log('Usage: node update-api-url.js <new-api-url>');
  console.log('Example: node update-api-url.js http://192.168.1.100:5000');
  console.log('Example: node update-api-url.js https://your-domain.com');
  process.exit(1);
}

updateApiUrl(newUrl); 