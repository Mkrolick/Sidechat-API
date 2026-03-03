import chalk from 'chalk';
import Table from 'cli-table3';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function voteStr(total, status) {
  const str = `${total >= 0 ? '+' : ''}${total}`;
  if (status === 'upvote') return chalk.green.bold(str + ' ▲');
  if (status === 'downvote') return chalk.red.bold(str + ' ▼');
  return chalk.gray(str);
}

function identityStr(post) {
  if (post.identity?.name) return chalk.cyan(`@${post.identity.name}`);
  if (post.identity?.display_name) return chalk.cyan(post.identity.display_name);
  if (post.alias) return chalk.dim(post.alias);
  return chalk.dim('anonymous');
}

export function formatPost(post, opts = {}) {
  const lines = [];
  const header = [
    chalk.bold.blue(post.id),
    voteStr(post.vote_total, post.vote_status),
    chalk.dim(timeAgo(post.created_at)),
    identityStr(post),
  ];
  if (post.group?.name) header.push(chalk.magenta(`[${post.group.name}]`));
  lines.push(header.join('  '));
  lines.push(post.text);

  if (post.poll) {
    lines.push('');
    lines.push(chalk.bold('Poll:'));
    post.poll.choices.forEach((c, i) => {
      const marker = c.selected ? chalk.green('● ') : '○ ';
      const count = post.poll.participated ? chalk.dim(` (${c.count})`) : '';
      lines.push(`  ${marker}${i}: ${c.text}${count}`);
    });
  }

  if (opts.showCommentCount && post.comment_count !== undefined) {
    lines.push(chalk.dim(`💬 ${post.comment_count} comments`));
  }
  lines.push('');
  return lines.join('\n');
}

export function formatPostList(posts) {
  return posts.map(p => formatPost(p, { showCommentCount: true })).join('\n');
}

export function formatComment(comment, depth = 0) {
  const indent = '  '.repeat(depth);
  const header = [
    voteStr(comment.vote_total, comment.vote_status),
    identityStr(comment),
    chalk.dim(timeAgo(comment.created_at)),
    chalk.dim(`[${comment.id.slice(0, 8)}]`),
  ];
  const lines = [];
  lines.push(indent + header.join('  '));
  lines.push(indent + comment.text);

  if (comment.comments?.length) {
    for (const reply of comment.comments) {
      lines.push(formatComment(reply, depth + 1));
    }
  }
  lines.push('');
  return lines.join('\n');
}

export function formatDM(msg) {
  const who = msg.authored_by_user ? chalk.green('You') : identityStr(msg);
  return `${who}  ${chalk.dim(timeAgo(msg.created_at))}\n${msg.text}\n`;
}

export function formatDMThread(thread) {
  const lastMsg = thread.messages?.[thread.messages.length - 1];
  const preview = lastMsg?.text ? lastMsg.text.slice(0, 60) : '';
  const name = thread.name ? chalk.cyan(thread.name) + '  ' : '';
  return `${chalk.bold(thread.id)}  ${name}${chalk.dim(timeAgo(thread.updated_at))}  ${preview}`;
}

export function formatGroup(group) {
  const lines = [];
  lines.push(chalk.bold.blue(group.name) + '  ' + chalk.dim(`(${group.id})`));
  if (group.description) lines.push(group.description);
  const meta = [];
  if (group.member_count) meta.push(`${group.member_count} members`);
  meta.push(group.membership_type === 'member' ? chalk.green('joined') : chalk.dim('not joined'));
  meta.push(group.group_join_type);
  lines.push(chalk.dim(meta.join(' · ')));
  lines.push('');
  return lines.join('\n');
}

export function formatGroupTable(groups) {
  const table = new Table({
    head: ['Name', 'ID', 'Members', 'Status', 'Type'],
    style: { head: ['cyan'] },
  });
  for (const g of groups) {
    if (!g) continue;
    table.push([
      g.name || g.id || '—',
      (g.id || '').slice(0, 8),
      g.member_count ?? '—',
      g.membership_type === 'member' ? 'joined' : '—',
      g.group_join_type || '—',
    ]);
  }
  return table.toString();
}

export function formatProfile(profile) {
  const lines = [];
  lines.push(chalk.bold.blue(`@${profile.name || profile.id}`));
  if (profile.conversation_icon?.emoji) {
    lines.push(`Icon: ${profile.conversation_icon.emoji}`);
  }
  if (profile.description) lines.push(profile.description);
  lines.push('');
  return lines.join('\n');
}

export function formatCurrentUser(user) {
  const lines = [];
  lines.push(chalk.bold.blue('Your Account'));
  lines.push(`ID: ${user.id}`);
  if (user.emailDomain) lines.push(`Email domain: ${user.emailDomain}`);
  if (user.isGlobalModerator) lines.push(chalk.yellow('Global Moderator'));
  if (user.isGlobalAdmin) lines.push(chalk.red('Global Admin'));
  if (user.memberships?.length) {
    lines.push(`Groups: ${user.memberships.length}`);
  }
  lines.push('');
  return lines.join('\n');
}
