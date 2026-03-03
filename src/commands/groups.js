import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getClient } from '../lib/client.js';
import { setConfig, getConfig } from '../lib/config.js';
import { formatGroup, formatGroupTable } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';

const groups = new Command('groups').description('Manage groups');

groups
  .command('list')
  .description('List your joined groups')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (opts) => {
      const client = getClient();
      const spinner = ora('Loading groups...').start();
      const user = await client.getCurrentUser();
      spinner.stop();

      const memberships = user.memberships || [];
      if (opts.json) {
        console.log(JSON.stringify(memberships, null, 2));
      } else if (!memberships.length) {
        console.log(chalk.dim('Not a member of any groups.'));
      } else {
        // Fetch metadata for each group
        const groupDetails = [];
        for (const m of memberships) {
          try {
            const g = await client.getGroupMetadata(m.groupId);
            groupDetails.push(g || { id: m.groupId, name: m.groupId, membership_type: 'member' });
          } catch {
            groupDetails.push({ name: m.groupId, id: m.groupId, membership_type: 'member' });
          }
        }
        console.log(formatGroupTable(groupDetails));

        const config = getConfig();
        if (config.defaultGroupId) {
          console.log(chalk.dim(`\nDefault group: ${config.defaultGroupId}`));
        }
      }
    })
  );

groups
  .command('explore')
  .description('Explore available groups')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (opts) => {
      const client = getClient();
      const spinner = ora('Exploring groups...').start();
      const available = await client.getAvailableGroups();
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(available, null, 2));
      } else if (!available?.length) {
        console.log(chalk.dim('No groups found.'));
      } else {
        console.log(formatGroupTable(available));
      }
    })
  );

groups
  .command('search')
  .description('Search for groups')
  .argument('<query>', 'Search query')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (query, opts) => {
      const client = getClient();
      const spinner = ora('Searching...').start();
      const results = await client.searchAvailableGroups(query);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else if (!results?.length) {
        console.log(chalk.dim('No groups found.'));
      } else {
        console.log(formatGroupTable(results));
      }
    })
  );

groups
  .command('info')
  .description('Show group details')
  .argument('<id>', 'Group ID')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (id, opts) => {
      const client = getClient();
      const spinner = ora('Loading group...').start();
      const group = await client.getGroupMetadata(id);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(group, null, 2));
      } else {
        console.log(formatGroup(group));
      }
    })
  );

groups
  .command('join')
  .description('Join a group')
  .argument('<id>', 'Group ID')
  .action(
    wrapAction(async (id) => {
      const client = getClient();
      const spinner = ora('Joining group...').start();
      await client.setGroupMembership(id, true);
      spinner.succeed(`Joined group ${id}`);
    })
  );

groups
  .command('leave')
  .description('Leave a group')
  .argument('<id>', 'Group ID')
  .action(
    wrapAction(async (id) => {
      const ok = await confirm({ message: `Leave group ${id}?`, default: false });
      if (!ok) return;

      const client = getClient();
      const spinner = ora('Leaving group...').start();
      await client.setGroupMembership(id, false);
      spinner.succeed(`Left group ${id}`);
    })
  );

groups
  .command('set-default')
  .description('Set default group')
  .argument('<id>', 'Group ID')
  .action(
    wrapAction(async (id) => {
      setConfig({ defaultGroupId: id });
      console.log(chalk.green(`Default group set to ${id}`));
    })
  );

// Default: list groups
groups.action(
  wrapAction(async (opts) => {
    const client = getClient();
    const spinner = ora('Loading groups...').start();
    const user = await client.getCurrentUser();
    spinner.stop();

    const memberships = user.memberships || [];
    if (!memberships.length) {
      console.log(chalk.dim('Not a member of any groups. Try `sidechat groups explore`.'));
    } else {
      const groupDetails = [];
      for (const m of memberships) {
        try {
          const g = await client.getGroupMetadata(m.groupId);
          groupDetails.push(g);
        } catch {
          groupDetails.push({ name: m.groupId, id: m.groupId, membership_type: 'member' });
        }
      }
      console.log(formatGroupTable(groupDetails));
    }
  })
);

export default groups;
