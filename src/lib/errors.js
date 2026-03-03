import chalk from 'chalk';

export function handleError(err) {
  if (err?.response?.data?.message) {
    console.error(chalk.red('API Error:'), err.response.data.message);
  } else if (err?.message) {
    console.error(chalk.red('Error:'), err.message);
  } else {
    console.error(chalk.red('Error:'), err);
  }
  process.exit(1);
}

export function wrapAction(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      handleError(err);
    }
  };
}
