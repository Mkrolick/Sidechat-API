import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { getClient } from '../lib/client.js';
import { formatDM, formatDMThread } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';
import { getConfig } from '../lib/config.js';
import { randomUUID } from 'node:crypto';

const dms = new Command('dms').description('Direct messages');

dms
  .command('list')
  .description('List DM threads')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (opts) => {
      const client = getClient();
      const spinner = ora('Loading DMs...').start();
      const threads = await client.getDMs();
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(threads, null, 2));
      } else if (!threads?.length) {
        console.log(chalk.dim('No DM threads.'));
      } else {
        for (const t of threads) {
          console.log(formatDMThread(t));
        }
      }
    })
  );

dms
  .command('read')
  .description('Read a DM thread')
  .argument('<threadId>', 'Thread ID')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (threadId, opts) => {
      const client = getClient();
      const spinner = ora('Loading thread...').start();
      const thread = await client.getDMThread(threadId);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(thread, null, 2));
      } else if (!thread.messages?.length) {
        console.log(chalk.dim('No messages in this thread.'));
      } else {
        for (const msg of thread.messages) {
          console.log(formatDM(msg));
        }
      }
    })
  );

dms
  .command('start')
  .description('Start a new DM from a post/comment')
  .argument('<postId>', 'Post or comment ID to DM about')
  .argument('<text>', 'Initial message')
  .option('--anonymous', 'Send anonymously')
  .action(
    wrapAction(async (postId, text, opts) => {
      const client = getClient();
      const clientId = randomUUID();
      const spinner = ora('Starting DM...').start();
      await client.startDM(text, clientId, postId, opts.anonymous || false);
      spinner.succeed('DM sent!');
    })
  );

dms
  .command('send')
  .description('Send a message in an existing DM thread')
  .argument('<threadId>', 'Thread ID')
  .argument('<text>', 'Message text')
  .option('--anonymous', 'Send anonymously')
  .action(
    wrapAction(async (threadId, text, opts) => {
      const client = getClient();
      const clientId = randomUUID();
      const spinner = ora('Sending message...').start();
      await client.sendDM(threadId, text, clientId, [], opts.anonymous || false);
      spinner.succeed('Message sent!');
    })
  );

// Default action: list DMs when `sidechat dms` is run with no subcommand
dms.action(
  wrapAction(async (opts) => {
    const client = getClient();
    const spinner = ora('Loading DMs...').start();
    const threads = await client.getDMs();
    spinner.stop();

    if (!threads?.length) {
      console.log(chalk.dim('No DM threads.'));
    } else {
      for (const t of threads) {
        console.log(formatDMThread(t));
      }
    }
  })
);

export default dms;
