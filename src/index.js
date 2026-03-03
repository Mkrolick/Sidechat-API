#!/usr/bin/env node

import { Command } from 'commander';
import auth from './commands/auth.js';
import feed from './commands/feed.js';
import post from './commands/post.js';
import comment from './commands/comment.js';
import vote from './commands/vote.js';
import dms from './commands/dms.js';
import groups from './commands/groups.js';
import profile from './commands/profile.js';
import my from './commands/my.js';

const program = new Command();

program
  .name('sidechat')
  .description('CLI for Sidechat')
  .version('1.0.0');

program.addCommand(auth);
program.addCommand(feed);
program.addCommand(post);
program.addCommand(comment);
program.addCommand(vote);
program.addCommand(dms);
program.addCommand(groups);
program.addCommand(profile);
program.addCommand(my);

program.parse();
