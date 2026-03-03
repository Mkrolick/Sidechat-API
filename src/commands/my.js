import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { getClient } from '../lib/client.js';
import { formatPostList, formatComment } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';

const my = new Command('my').description('View your own content');

my
  .command('posts')
  .description('List your posts')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (opts) => {
      const client = getClient();
      const spinner = ora('Loading your posts...').start();
      const posts = await client.getUserContent('posts');
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(posts, null, 2));
      } else if (!posts?.length) {
        console.log(chalk.dim('No posts yet.'));
      } else {
        console.log(formatPostList(posts));
      }
    })
  );

my
  .command('comments')
  .description('List your comments')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (opts) => {
      const client = getClient();
      const spinner = ora('Loading your comments...').start();
      const comments = await client.getUserContent('comments');
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify(comments, null, 2));
      } else if (!comments?.length) {
        console.log(chalk.dim('No comments yet.'));
      } else {
        for (const c of comments) {
          console.log(formatComment(c));
        }
      }
    })
  );

export default my;
