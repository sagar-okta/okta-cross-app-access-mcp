// Script to update .env files for GitHub Codespaces
// Usage: node replace-env.js

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// List of .env files to update (add more if needed)
const envFiles = [
  '../../packages/agent0/.env',
  '../../packages/todo0/.env',
  '../../packages/authorization-server/.env.agent',
  '../../packages/authorization-server/.env.todo',
];

// Helper to get Codespace info from env
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

function updateEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  let content = readFileSync(envPath, 'utf8');
  let updated = localhostToCodespaceUrl(content);
  // Replace <your-codespace-id> placeholders as well
  updated = updated.replace(/<your-codespace-id>/g, getCodespaceId());

  if (updated !== content) {
    // Backup original
    // copyFileSync(envPath, envPath + '.bak');
    writeFileSync(envPath, updated, 'utf8');
    console.log(`Updated: ${envPath}`);
  } else {
    console.log(`No changes: ${envPath}`);
  }
}

// Main
for (const envPath of envFiles) {
  const absPath = resolve(__dirname, envPath);
  updateEnvFile(absPath);
}

console.log('Environment files update complete.');
