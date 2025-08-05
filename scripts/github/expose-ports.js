import { execSync } from 'child_process';

const ports = [3000, 3001, 5000, 5001];

function getCodespaceName() {
  // Prefer environment variable if running inside Codespaces
  if (process.env.CODESPACE_NAME) {
    console.log(`🧠 Using Codespace (from env): ${process.env.CODESPACE_NAME}`);
    return process.env.CODESPACE_NAME;
  }
  try {
    const result = execSync(
      'gh codespace list --json name,state -q \".[] | select(.state == \\\"Available\\\") | .name\"',
      { encoding: 'utf8' }
    ).trim();
    if (!result) {
      throw new Error('No active codespace found.');
    }
    console.log(`🧠 Using Codespace (from gh): ${result}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to get Codespace name:', error.message);
    process.exit(1);
  }
}

function getPublicHostname(codespaceName) {
  return `${codespaceName}.github.dev`;
}

const codespaceName = getCodespaceName();
const publicHost = getPublicHostname(codespaceName);

// 🔓 Step 1: Make all ports public
console.log(`\n🚀 Exposing ports: ${ports.join(', ')}`);
ports.forEach((port) => {
  try {
    execSync(`gh codespace ports visibility ${port}:public --codespace ${codespaceName}`,
      { stdio: 'ignore' });
    console.log(`✅ Port ${port} is now public`);
  } catch (error) {
    console.error(`❌ Failed to make port ${port} public:`, error.message);
  }
});

console.log('\n\n[2/2] Ports made public successfully. ✅✅✅✅');

// Step 2: Print URLs with .app.github.dev pattern
console.log('\nPublic URLs for your forwarded ports:\n');
ports.forEach((port) => {
  const url = `https://${codespaceName}-${port}.app.github.dev`;
  console.log(`Port ${port}: ${url}`);
});

// Step 3: Print OAuth Redirect URIs for client apps (ports 5001 and 5000)
console.log('\nOAuth Redirect URIs you should register with your Identity Provider:\n');
[5001, 5000].forEach((port) => {
  const redirectUri = `https://${codespaceName}-${port}.app.github.dev/api/openid/callback/customer1`;
  console.log(`Port ${port} redirect URI: ${redirectUri}`);
});
