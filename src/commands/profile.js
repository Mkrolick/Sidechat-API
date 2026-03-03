import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { getClient } from '../lib/client.js';
import { getConfig } from '../lib/config.js';
import { formatProfile, formatCurrentUser } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';

const profile = new Command('profile').description('View and manage profiles');

profile
  .command('view')
  .description('View a user profile')
  .argument('[username]', 'Username to view (omit for your own)')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (username, opts) => {
      const client = getClient();
      const spinner = ora('Loading profile...').start();

      if (username) {
        const p = await client.getUserProfile(username);
        spinner.stop();
        if (opts.json) {
          console.log(JSON.stringify(p, null, 2));
        } else {
          console.log(formatProfile(p));
        }
      } else {
        const user = await client.getCurrentUser();
        spinner.stop();
        if (opts.json) {
          console.log(JSON.stringify(user, null, 2));
        } else {
          console.log(formatCurrentUser(user));
        }
      }
    })
  );

profile
  .command('set-username')
  .description('Set your username')
  .argument('<name>', 'New username')
  .action(
    wrapAction(async (name) => {
      const client = getClient();
      const config = getConfig();
      const spinner = ora('Setting username...').start();
      await client.setUsername(config.userId, name);
      spinner.succeed(`Username set to @${name}`);
    })
  );

profile
  .command('check-username')
  .description('Check if a username is available')
  .argument('<name>', 'Username to check')
  .action(
    wrapAction(async (name) => {
      const client = getClient();
      const spinner = ora('Checking...').start();
      const available = await client.checkUsername(name);
      spinner.stop();
      if (available) {
        console.log(chalk.green(`@${name} is available!`));
      } else {
        console.log(chalk.red(`@${name} is taken or invalid.`));
      }
    })
  );

profile
  .command('set-bio')
  .description('Set your bio')
  .argument('<text>', 'Bio text')
  .action(
    wrapAction(async (text) => {
      const client = getClient();
      const config = getConfig();
      const spinner = ora('Setting bio...').start();
      await client.setUserBio(config.userId, text);
      spinner.succeed('Bio updated!');
    })
  );

profile
  .command('set-icon')
  .description('Set your conversation icon')
  .argument('<emoji>', 'Emoji for icon')
  .option('--primary <color>', 'Primary color (hex)', '#6366f1')
  .option('--secondary <color>', 'Secondary color (hex)', '#a5b4fc')
  .action(
    wrapAction(async (emoji, opts) => {
      const client = getClient();
      const config = getConfig();
      const spinner = ora('Setting icon...').start();
      await client.setUserIcon(config.userId, emoji, opts.primary, opts.secondary);
      spinner.succeed(`Icon set to ${emoji}`);
    })
  );

// Default: view own profile
profile.action(
  wrapAction(async (opts) => {
    const client = getClient();
    const spinner = ora('Loading profile...').start();
    const user = await client.getCurrentUser();
    spinner.stop();
    console.log(formatCurrentUser(user));
  })
);

export default profile;
