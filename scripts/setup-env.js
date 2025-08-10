#!/usr/bin/env node
// setup-env.js: Cross-platform replacement for setup-env.sh
import { copyFileSync, existsSync } from 'fs';

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

// Copy default env files if they do not exist
files.forEach(([src, dest]) => {
  if (existsSync(src)) {
    copyIfNotExists(src, dest);
  }
});

console.log(' Default .env files copied ✅ ');
console.log('──────────────────────────────────────────────────────────────');
console.log('📝  Next steps: Please edit the following files to fill in required values:');
console.log('    • packages/authorization-server/.env.todo');
console.log('    • packages/authorization-server/.env.agent');
console.log('    • packages/agent0/.env (for AWS credentials and Bedrock config)');
console.log('    (Required fields: CUSTOMER1_AUTH_ISSUER, CUSTOMER1_CLIENT_ID, CUSTOMER1_CLIENT_SECRET)');
console.log('──────────────────────────────────────────────────────────────');
console.log('OAuth Redirect URIs you should register in your Oktapreview:')
console.log(`    • Agent0 Redirect URI: http://localhost:5000/openid/callback/customer1`);
console.log(`    • Todo0 Redirect URI: http://localhost:5001/openid/callback/customer1`);
console.log('──────────────────────────────────────────────────────────────');
