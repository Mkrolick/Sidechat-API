import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { getClient } from '../lib/client.js';
import { wrapAction } from '../lib/errors.js';

const vote = new Command('vote').description('Vote on posts, comments, and polls');

vote
  .command('post')
  .description('Vote on a post')
  .argument('<id>', 'Post ID')
  .argument('<direction>', 'up, down, or none')
  .action(
    wrapAction(async (id, direction) => {
      const actionMap = { up: 'upvote', down: 'downvote', none: 'none' };
      const action = actionMap[direction];
      if (!action) {
        console.error(chalk.red('Direction must be: up, down, or none'));
        process.exit(1);
      }
      const client = getClient();
      const spinner = ora('Voting...').start();
      await client.setVote(id, action);
      spinner.succeed(`Voted ${direction} on ${id.slice(0, 8)}`);
    })
  );

vote
  .command('comment')
  .description('Vote on a comment')
  .argument('<id>', 'Comment ID')
  .argument('<direction>', 'up, down, or none')
  .action(
    wrapAction(async (id, direction) => {
      const actionMap = { up: 'upvote', down: 'downvote', none: 'none' };
      const action = actionMap[direction];
      if (!action) {
        console.error(chalk.red('Direction must be: up, down, or none'));
        process.exit(1);
      }
      const client = getClient();
      const spinner = ora('Voting...').start();
      await client.setVote(id, action);
      spinner.succeed(`Voted ${direction} on ${id.slice(0, 8)}`);
    })
  );

vote
  .command('poll')
  .description('Vote on a poll')
  .argument('<pollId>', 'Poll ID')
  .argument('<choice>', 'Choice index (0-based)')
  .action(
    wrapAction(async (pollId, choice) => {
      const client = getClient();
      const spinner = ora('Voting on poll...').start();
      await client.voteOnPoll(pollId, parseInt(choice));
      spinner.succeed(`Voted on poll ${pollId.slice(0, 8)}, choice ${choice}`);
    })
  );

export default vote;
