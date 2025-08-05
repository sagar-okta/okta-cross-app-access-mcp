#!/usr/bin/env node
// Combined setup-env.js and replace-env.js: Cross-platform .env setup and Codespaces update
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

function copyIfNotExists(src, dest) {
  if (!existsSync(dest)) {
    copyFileSync(src, dest);
    return true;
  }
  return false;
}

const files = [
  ['packages/todo0/.env.default', 'packages/todo0/.env'],
  ['packages/authorization-server/.env.agent.default', 'packages/authorization-server/.env.agent'],
  ['packages/authorization-server/.env.todo.default', 'packages/authorization-server/.env.todo'],
  ['packages/agent0/.env.default', 'packages/agent0/.env'],
];

// 1. Copy default env files if they do not exist
console.log(' 🔎 Checking and copying default .env files if needed...');
files.forEach(([src, dest]) => {
  if (existsSync(src)) {
    copyIfNotExists(src, dest);
  }
});

console.log('\n[setup:env] Default .env files copied (if not already present).');

// 2. Update .env files for Codespaces (only if in Codespaces)
if (process.env.CODESPACE_NAME) {
  console.log('\n 🔄 Updating .env files for Codespaces URLs and placeholders...');
  const envFiles = [
    'packages/agent0/.env',
    'packages/todo0/.env',
    'packages/authorization-server/.env.agent',
    'packages/authorization-server/.env.todo',
  ];

  function getCodespaceId() {
    // CODESPACE_NAME is set in Codespaces
    return process.env.CODESPACE_NAME || '<your-codespace-id>';
  }

  function localhostToCodespaceUrl(str) {
    // Replace all http://localhost:<port> with Codespaces URL
    return str.replace(/http:\/\/localhost:(\d+)/g, (match, port) => {
      const id = getCodespaceId();
      return `https://${id}-${port}.app.github.dev`;
    });
  }

  function defineCodespaceRedirects() {
    if (!process.env.CODESPACE_NAME) return;
    console.log('\n🔑 OAuth Redirect URIs you should register with your Identity Provider:');
    [5001, 5000].forEach((port) => {
      const redirectUri = `https://${getCodespaceId()}-${port}.app.github.dev/api/openid/callback/customer1`;
      if (port === 5001) {
        console.log(`  • Todo0 Redirect URI: ${redirectUri}`);
      } else if (port === 5000) {
        console.log(`  • Agent0 Redirect URI: ${redirectUri}`);
      }
    });
    console.log('──────────────────────────────────────────────────────────────');
  }

  function updateEnvFile(envPath) {
    if (!existsSync(envPath)) return;
    let content = readFileSync(envPath, 'utf8');
    let updated = localhostToCodespaceUrl(content);
    // Replace <your-codespace-id> placeholders as well
    updated = updated.replace(/<your-codespace-id>/g, getCodespaceId());

    if (updated !== content) {
      writeFileSync(envPath, updated, 'utf8');
      console.log(`Updated: ${envPath}`);
    } else {
      console.log(`No changes: ${envPath}`);
    }
  }

  envFiles.forEach((relPath) => {
    const absPath = resolve(__dirname, '../../', relPath);
    updateEnvFile(absPath);
  });

  console.log('──────────────────────────────────────────────────────────────');
  console.log('✅ Codespace Environment files update complete.');
  console.log('──────────────────────────────────────────────────────────────');

  // Step 3: Print OAuth Redirect URIs for client apps (ports 5001 and 5000) only if in Codespaces
  defineCodespaceRedirects();
} else {
  console.log('──────────────────────────────────────────────────────────────');
  console.log('✅ Local environment setup complete.');
  console.log('──────────────────────────────────────────────────────────────');
}

console.log('📝 Next steps: Please edit the following files to fill in required values:');
console.log('  • packages/authorization-server/.env.todo');
console.log('  • packages/authorization-server/.env.agent');
console.log('  • packages/agent0/.env (for AWS credentials and Bedrock config)');
console.log('  (Required fields: CUSTOMER1_AUTH_ISSUER, CUSTOMER1_CLIENT_ID, CUSTOMER1_CLIENT_SECRET)');
console.log('──────────────────────────────────────────────────────────────');
