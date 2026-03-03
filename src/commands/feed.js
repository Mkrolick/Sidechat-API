import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getClient, getGroupId } from '../lib/client.js';
import { formatPostList, formatPost, formatComment } from '../lib/format.js';
import { wrapAction } from '../lib/errors.js';

const feed = new Command('feed')
  .description('Browse the feed')
  .argument('[sort]', 'Sort order: hot, recent, top', 'hot')
  .option('-g, --group <id>', 'Group ID')
  .option('--json', 'Output raw JSON')
  .action(
    wrapAction(async (sort, opts) => {
      const client = getClient();
      const groupId = getGroupId(opts);

      let cursor = undefined;
      let keepGoing = true;

      while (keepGoing) {
        const spinner = ora('Loading posts...').start();
        const res = await client.getGroupPosts(groupId, sort, cursor);
        spinner.stop();

        if (opts.json) {
          console.log(JSON.stringify(res.posts, null, 2));
        } else {
          console.log(formatPostList(res.posts));
        }

        if (res.cursor) {
          cursor = res.cursor;
          keepGoing = await confirm({ message: 'Load more?', default: true });
        } else {
          keepGoing = false;
        }
      }
    })
  );

export default feed;
