import { execSync } from 'node:child_process';

const SERVICE = 'sidechat-cli';

export function getToken() {
  try {
    return execSync(
      `security find-generic-password -s "${SERVICE}" -a "auth-token" -w`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch {
    return null;
  }
}

export function setToken(token) {
  // Delete existing first (ignore errors if not found)
  try {
    execSync(`security delete-generic-password -s "${SERVICE}" -a "auth-token"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {}
  execSync(
    `security add-generic-password -s "${SERVICE}" -a "auth-token" -w "${token}"`,
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );
}

export function deleteToken() {
  try {
    execSync(`security delete-generic-password -s "${SERVICE}" -a "auth-token"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {}
}
