#!/usr/bin/env node
// Combined setup-env.js and replace-env.js: Cross-platform .env setup and Codespaces update
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const repoRoot = process.cwd();

function setupEnvFiles() {
  const files = [
    ['packages/todo0/.env.default', 'packages/todo0/.env'],
    ['packages/authorization-server/.env.agent.default', 'packages/authorization-server/.env.agent'],
    ['packages/authorization-server/.env.todo.default', 'packages/authorization-server/.env.todo'],
    ['packages/agent0/.env.default', 'packages/agent0/.env'],
  ];
  console.log('🔎  Step 1/2: Checking and copying default .env files if needed...');
  let copied = false;
  files.forEach(([src, dest]) => {
    const srcPath = resolve(repoRoot, src);
    const destPath = resolve(repoRoot, dest);
    if (existsSync(srcPath)) {
      if (!existsSync(destPath)) {
        copyFileSync(srcPath, destPath);
        console.log(`  ✔️  Copied: ${dest}`);
        copied = true;
      }
    }
  });
  if (!copied) {
    console.log('  ✔️  All .env files already exist.');
  }
  console.log(' Default .env files copied ✅ ');
  console.log('──────────────────────────────────────────────────────────────');
}

function updateForCodespaces() {
  console.log('🔄  Step 2/2: Updating .env files for Codespaces URLs and placeholders...');
  const envFiles = [
    'packages/agent0/.env',
    'packages/todo0/.env',
    'packages/authorization-server/.env.agent',
    'packages/authorization-server/.env.todo',
  ];
  function getCodespaceId() {
    return process.env.CODESPACE_NAME;
  }
  function localhostToCodespaceUrl(str) {
    return str.replace(/http:\/\/localhost:(\d+)/g, (match, port) => {
      const id = getCodespaceId();
      return `https://${id}-${port}.app.github.dev`;
    });
  }
  function updateEnvFile(envPath) {
    if (!existsSync(envPath)) {
      console.warn(`  ⚠️  File does not exist: ${envPath}`);
      return;
    }
    let content = readFileSync(envPath, 'utf8');
    let updated = localhostToCodespaceUrl(content);
    updated = updated.replace(/<your-codespace-id>/g, getCodespaceId());
    if (updated !== content) {
      writeFileSync(envPath, updated, 'utf8');
      console.log(`  ✔️  Updated: ${envPath}`);
    } else {
      console.log(`  ℹ️  No changes: ${envPath}`);
    }
  }
  envFiles.forEach((envPath) => {
    const absPath = resolve(repoRoot, envPath);
    updateEnvFile(absPath);
  });
  console.log('──────────────────────────────────────────────────────────────');
  console.log('✅  Codespace Environment files update complete.');
  console.log('──────────────────────────────────────────────────────────────');
  // Print Codespaces redirect URIs
  const id = process.env.CODESPACE_NAME;
  if (id) {
    console.log('🔑  OAuth Redirect URIs you should register with your Identity Provider:');
    [5001, 5000].forEach((port) => {
      const redirectUri = `https://${id}-${port}.app.github.dev/api/openid/callback/customer1`;
      if (port === 5001) {
        console.log(`    • Todo0 Redirect URI: ${redirectUri}`);
      } else if (port === 5000) {
        console.log(`    • Agent0 Redirect URI: ${redirectUri}`);
      }
    });
    console.log('──────────────────────────────────────────────────────────────');
  }
}

function printLocalSetup() {
  console.log('──────────────────────────────────────────────────────────────');
  console.log('✅  Local environment setup complete.');
  console.log('──────────────────────────────────────────────────────────────');
}

function printNextSteps() {
  console.log('📝  Next steps: Please edit the following files to fill in required values:');
  console.log('    • packages/authorization-server/.env.todo');
  console.log('    • packages/authorization-server/.env.agent');
  console.log('    • packages/agent0/.env (for AWS credentials and Bedrock config)');
  console.log('    (Required fields: CUSTOMER1_AUTH_ISSUER, CUSTOMER1_CLIENT_ID, CUSTOMER1_CLIENT_SECRET)');
  console.log('──────────────────────────────────────────────────────────────');
}

// Main flow
setupEnvFiles();
if (process.env.CODESPACE_NAME) {
  updateForCodespaces();
} else {
  printLocalSetup();
}
printNextSteps();
