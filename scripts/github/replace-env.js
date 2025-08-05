// Script to update .env files for GitHub Codespaces
// Usage: node replace-env.js

import { existsSync, readFileSync, copyFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

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

function getCodespaceUrl(port) {
  const id = getCodespaceId();
  return `https://${id}-${port}.app.github.dev`;
}

// Map of env variable names to port numbers for Codespaces
const portMap = {
  'AUTH_SERVER': {
    'agent0': 5000,
    'todo0': 5001,
  },
  'TODO_SERVER': {
    'agent0': 3001,
  },
  'AGENT_SERVER': {
    'agent0': 3000,
  },
};

// Detect which app by env file path
function detectApp(envPath) {
  if (envPath.includes('agent0')) return 'agent0';
  if (envPath.includes('todo0')) return 'todo0';
  if (envPath.includes('authorization-server/.env.agent')) return 'authorization-server-agent';
  if (envPath.includes('authorization-server/.env.todo')) return 'authorization-server-todo';
  return null;
}

function updateEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  const app = detectApp(envPath);
  let content = readFileSync(envPath, 'utf8');
  let updated = content;

  // Replace AUTH_SERVER
  if (portMap.AUTH_SERVER[app]) {
    const url = `http://localhost:${portMap.AUTH_SERVER[app]}`;
    updated = updated.replace(/AUTH_SERVER\s*=.*$/m, `AUTH_SERVER="${url}"`);
  }

  // Replace TODO_SERVER
  if (portMap.TODO_SERVER[app]) {
    const url = `http://localhost:${portMap.TODO_SERVER[app]}`;
    updated = updated.replace(/TODO_SERVER\s*=.*$/m, `TODO_SERVER="${url}"`);
  }

  // Replace AGENT_SERVER
  if (portMap.AGENT_SERVER[app]) {
    const url = `http://localhost:${portMap.AGENT_SERVER[app]}`;
    updated = updated.replace(/AGENT_SERVER\s*=.*$/m, `AGENT_SERVER="${url}"`);
  }

  // Replace <your-codespace-id> placeholders
  updated = updated.replace(/<your-codespace-id>/g, getCodespaceId());

  if (updated !== content) {
    // Backup original
    copyFileSync(envPath, envPath + '.bak');
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
