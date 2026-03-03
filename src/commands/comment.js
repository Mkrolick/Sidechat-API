import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getClient, getGroupId } from '../lib/client.js';
import { formatComment } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';

const comment = new Command('comment').description('Comment on posts');

comment
  .command('create')
  .description('Add a comment to a post')
  .argument('<postId>', 'Post ID to comment on')
  .argument('<text>', 'Comment text')
  .option('-g, --group <id>', 'Group ID')
  .option('--anonymous', 'Comment anonymously')
  .option('--reply <commentId>', 'Reply to a specific comment')
  .action(
    wrapAction(async (postId, text, opts) => {
      const client = getClient();
      const groupId = getGroupId(opts);

      const spinner = ora('Posting comment...').start();
      const c = await client.createComment(
        postId,
        text,
        groupId,
        opts.reply || undefined,
        undefined,
        [],
        false,
        opts.anonymous || false
      );
      spinner.succeed('Comment posted!');
      console.log(formatComment(c));
    })
  );

comment
  .command('delete')
  .description('Delete a comment')
  .argument('<id>', 'Comment ID')
  .action(
    wrapAction(async (id) => {
      const ok = await confirm({ message: `Delete comment ${id}?`, default: false });
      if (!ok) return;

      const client = getClient();
      const spinner = ora('Deleting comment...').start();
      await client.deletePostOrComment(id);
      spinner.succeed('Comment deleted.');
    })
  );

export default comment;
