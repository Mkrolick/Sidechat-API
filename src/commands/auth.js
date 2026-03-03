import { Command } from 'commander';
import { input, password } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { SidechatAPIClient } from 'sidechat.js';
import { setToken, deleteToken } from '../lib/keychain.js';
import { setConfig, getConfig } from '../lib/config.js';
import { getClient } from '../lib/client.js';
import { wrapAction } from '../lib/errors.js';

const auth = new Command('auth').description('Authentication commands');

auth
  .command('login')
  .description('Log in via SMS verification')
  .action(
    wrapAction(async () => {
      const phone = await input({ message: 'Phone number (10 digits, no +1):' });
      const client = new SidechatAPIClient();

      const spinner = ora('Sending verification code...').start();
      const loginRes = await client.loginViaSMS(phone);
      spinner.succeed('Verification code sent!');

      const code = await input({ message: 'Enter verification code:' });

      spinner.start('Verifying code...');
      const verifyRes = await client.verifySMSCode(phone, code);
      spinner.succeed('Code verified!');

      // If new user, need to set age
      if (verifyRes.registration_id && !verifyRes.logged_in_user?.token) {
        const age = await input({ message: 'Enter your age:' });
        spinner.start('Completing registration...');
        const ageRes = await client.setAge(parseInt(age), verifyRes.registration_id);
        spinner.succeed('Registration complete!');
        setToken(ageRes.token || client.userToken);
      } else {
        setToken(verifyRes.logged_in_user.token);
      }

      // Fetch and store user info
      spinner.start('Fetching user info...');
      const user = await client.getCurrentUser();
      setConfig({ userId: user.id });

      // Set default group from first membership
      if (user.memberships?.length) {
        const groupId = user.memberships[0].groupId;
        setConfig({ defaultGroupId: groupId });
        spinner.succeed(`Logged in! Default group set.`);
      } else {
        spinner.succeed('Logged in!');
      }
    })
  );

auth
  .command('logout')
  .description('Log out and clear stored credentials')
  .action(
    wrapAction(async () => {
      deleteToken();
      setConfig({ userId: null, defaultGroupId: null });
      console.log(chalk.green('Logged out.'));
    })
  );

auth
  .command('register-email')
  .description('Register a school email address')
  .argument('<email>', 'School email address')
  .action(
    wrapAction(async (email) => {
      const client = getClient();
      const spinner = ora('Registering email...').start();
      await client.registerEmail(email);
      spinner.succeed('Verification email sent! Check your inbox, then run `sidechat auth verify-email`.');
    })
  );

auth
  .command('verify-email')
  .description('Check if your email has been verified')
  .action(
    wrapAction(async () => {
      const client = getClient();
      const spinner = ora('Checking verification...').start();
      const res = await client.checkEmailVerification();
      spinner.stop();
      if (res?.verified || res?.is_verified) {
        console.log(chalk.green('Email is verified!'));
      } else {
        console.log(chalk.yellow('Email not yet verified. Check your inbox.'));
      }
    })
  );

export default auth;
