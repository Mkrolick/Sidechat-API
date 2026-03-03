import { SidechatAPIClient } from 'sidechat.js';
import { getToken } from './keychain.js';
import { getConfig } from './config.js';
import chalk from 'chalk';

export function getClient() {
  const token = getToken();
  if (!token) {
    console.error(chalk.red('Not logged in. Run `sidechat login` first.'));
    process.exit(1);
  }
  return new SidechatAPIClient(token);
}

export function getGroupId(opts) {
  if (opts?.group) return opts.group;
  const config = getConfig();
  if (config.defaultGroupId) return config.defaultGroupId;
  console.error(chalk.red('No group specified. Use --group <id> or set a default with `sidechat groups set-default <id>`.'));
  process.exit(1);
}
