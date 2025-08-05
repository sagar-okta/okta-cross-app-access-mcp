// scripts/start-codespace.js
// Runs concurrently, then exposes ports after all are open if in Codespaces, with retry logic

import { spawn } from 'child_process';
import net from 'net';

const isCodespaces = !!(process.env.CODESPACES || process.env.CODESPACE_NAME);
const portsToCheck = [3000, 3001, 5000, 5001];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    if (opts.detached) {
      resolve(child);
    }
  });
}

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForPorts(ports, maxWait = 60000, pollInterval = 1000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const results = await Promise.all(ports.map((p) => checkPort(p)));
    if (results.every(Boolean)) return true;
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, pollInterval));
  }
  return false;
}

async function runExposePortsWithRetry(maxRetries = 3, delay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[INFO] Attempt ${attempt} to make ports public (running: yarn expose-ports)`);
    const expose = spawn('yarn', ['expose-ports'], { stdio: 'inherit', shell: true });
    const code = await new Promise((resolve) => expose.on('exit', resolve));
    if (code === 0) {
       console.log('[2/2] Ports made public successfully. ✅✅✅✅');
      return true;
    } else {
      console.log(`[WARN] expose:ports failed (exit code ${code}).`);
      if (attempt < maxRetries) {
        console.log(`[INFO] Retrying in ${delay / 1000} seconds...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.log('[ERROR] Failed to make ports public after multiple attempts.');
  return false;
}

async function main() {
  const concurrentlyArgs = [
    '--names', '"agent0,auth-agent,todo0,auth-todo"',
    '--prefix-colors', '"cyan,magenta,green,red"',
    '--output-path', 'logs/dev-agent0.log',
    '"yarn dev:agent0"',
    '"yarn auth:agent"',
    '"yarn dev:todo"',
    '"yarn auth:todo"'
  ];

  let child = null;
  let exposeProc = null;
  let shuttingDown = false;

  function killProcessGroup(proc) {
    if (proc && proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGINT');
      } catch {}
      setTimeout(() => {
        try {
          process.kill(-proc.pid, 'SIGKILL');
        } catch {}
      }, 4000); // 4s grace
    }
  }

  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n[INFO] Shutting down all processes...');
    killProcessGroup(child);
    killProcessGroup(exposeProc);
    setTimeout(() => process.exit(0), 5000); // force exit after 5s
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  if (isCodespaces) {
    // Step 1/2: Start servers
    console.log('\n[1/2] 🚀 Starting all servers (agent0, auth-agent, todo0, auth-todo)...');
    child = spawn('concurrently', concurrentlyArgs, { stdio: 'inherit', shell: true, detached: true });
    // Wait for all ports to be open
    (async () => {
      console.log('\n[INFO] Waiting for all servers to be ready on ports: ' + portsToCheck.join(', '));
      const ready = await waitForPorts(portsToCheck);
      if (ready) {
        console.log('\n[INFO] All servers are ready. Waiting a few seconds before making ports public...');
        await new Promise((r) => setTimeout(r, 5000));
        exposeProc = spawn('yarn', ['expose:ports'], { stdio: 'inherit', shell: true, detached: true });
        await new Promise((resolve) => exposeProc.on('exit', resolve));
      } else {
        console.log('\n[WARN] Not all ports became ready in time. Skipping expose-ports.');
      }
    })();
    child.on('exit', (code) => process.exit(code));
  } else {
    // Step 1/1: Local
    console.log('\n[1/1] 🚀 Starting all servers (agent0, auth-agent, todo0, auth-todo)...');
    await run('concurrently', concurrentlyArgs);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
