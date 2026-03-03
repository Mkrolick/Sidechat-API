import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getClient, getGroupId } from '../lib/client.js';
import { formatPost, formatComment } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';

const post = new Command('post').description('View, create, or delete posts');

post
  .command('view')
  .description('View a post and its comments')
  .argument('<id>', 'Post ID')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (id, opts) => {
      const client = getClient();
      const spinner = ora('Loading post...').start();
      const p = await client.getPost(id);
      const comments = await client.getPostComments(id);
      spinner.stop();

      if (opts.json) {
        console.log(JSON.stringify({ post: p, comments }, null, 2));
      } else {
        console.log(formatPost(p));
        if (comments?.length) {
          console.log(chalk.bold(`Comments (${comments.length}):\n`));
          for (const c of comments) {
            console.log(formatComment(c));
          }
        } else {
          console.log(chalk.dim('No comments yet.'));
        }
      }
    })
  );

post
  .command('create')
  .description('Create a new post')
  .argument('<text>', 'Post text')
  .option('-g, --group <id>', 'Group ID')
  .option('--anonymous', 'Post anonymously')
  .option('--no-dms', 'Disable DMs')
  .option('--no-comments', 'Disable comments')
  .option('--poll <options...>', 'Create a poll with these options')
  .action(
    wrapAction(async (text, opts) => {
      const client = getClient();
      const groupId = getGroupId(opts);

      const ok = await confirm({ message: `Post to group ${groupId}?\n"${text}"`, default: true });
      if (!ok) return;

      const spinner = ora('Creating post...').start();
      const p = await client.createPost(
        text,
        groupId,
        [],                          // assetList
        opts.dms === false,           // disableDMs (--no-dms)
        opts.comments === false,      // disableComments (--no-comments)
        opts.anonymous || false,
        undefined,                    // repostId
        opts.poll || undefined        // pollOptions
      );
      spinner.succeed('Post created!');
      console.log(formatPost(p));
    })
  );

post
  .command('delete')
  .description('Delete a post')
  .argument('<id>', 'Post ID')
  .action(
    wrapAction(async (id) => {
      const ok = await confirm({ message: `Delete post ${id}?`, default: false });
      if (!ok) return;

      const client = getClient();
      const spinner = ora('Deleting post...').start();
      await client.deletePostOrComment(id);
      spinner.succeed('Post deleted.');
    })
  );

export default post;
