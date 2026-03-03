# Sidechat CLI — Implementation Plan

## Overview
Build a CLI tool (`sidechat`) wrapping the `sidechat.js` npm package (v2.6.5) for terminal access to Sidechat on macOS with Node 22.

## Tech Stack
- **Module format**: ESM (`"type": "module"`)
- **CLI framework**: Commander.js
- **Prompts**: `@inquirer/prompts`
- **Styling**: Chalk
- **Tables**: cli-table3
- **Token storage**: macOS `security` CLI (Keychain)
- **Config**: `~/.config/sidechat/config.json`
- **No TypeScript** — plain JS with JSDoc

## File Structure
```
src/
  index.js              # #!/usr/bin/env node + Commander setup
  commands/
    auth.js             # login, logout, register-email, verify-email
    feed.js             # feed browsing, single post view
    post.js             # post create, post delete
    comment.js          # comment, comment delete
    vote.js             # vote up/down/none, poll vote
    dms.js              # dms list, read, start, send
    groups.js           # groups list, explore, search, join, leave, info
    profile.js          # profile view/set-username/set-bio/check-username
    my.js               # my posts, my comments
  lib/
    client.js           # SidechatAPIClient factory (loads token, exports getClient())
    keychain.js         # macOS Keychain via `security` CLI
    config.js           # Read/write ~/.config/sidechat/config.json
    format.js           # Chalk output helpers: formatPost, formatComment, formatDM, etc.
    errors.js           # handleError() + wrapAction() helper
package.json
.gitignore
```

## Tasks (execute in order)

### Task 1: Create package.json and install deps
- Create `package.json` with `"type": "module"`, `"bin": { "sidechat": "./src/index.js" }`
- Dependencies: `sidechat.js@^2.6.5`, `commander`, `chalk`, `cli-table3`, `@inquirer/prompts`, `ora`
- Run `npm install`

### Task 2: Create .gitignore
```
node_modules/
.DS_Store
```

### Task 3: Create src/lib/keychain.js
- `getToken(service)` — reads from macOS Keychain via `security find-generic-password`
- `setToken(service, account, token)` — writes via `security add-generic-password`
- `deleteToken(service, account)` — deletes via `security delete-generic-password`
- Service name: `"sidechat-cli"`, account: `"auth-token"`
- Also store/retrieve userID the same way

### Task 4: Create src/lib/config.js
- `getConfig()` — reads `~/.config/sidechat/config.json`, returns `{}` if missing
- `setConfig(updates)` — merges updates into existing config, writes back
- Config stores: `defaultGroupId`, `userId`, etc.
- Auto-create directory if missing

### Task 5: Create src/lib/errors.js
- `handleError(err)` — prints user-friendly error with chalk red, exits
- `wrapAction(fn)` — returns async function that wraps fn in try/catch calling handleError
- Should handle common sidechat.js API errors gracefully

### Task 6: Create src/lib/client.js
- `getClient()` — loads token from keychain, creates `SidechatAPIClient` instance
- If no token found, print "Not logged in. Run `sidechat login` first." and exit
- Returns configured client ready for API calls

### Task 7: Create src/lib/format.js — Part 1 (Posts)
- `formatPost(post, opts)` — renders a single post with vote count, timestamp, text, group tag
- `formatPostList(posts)` — renders a list of posts in compact form
- `formatComment(comment, depth)` — renders a comment with indentation for nesting
- Use chalk for colors: votes green/red, timestamps dim, group names blue
- Include relative time formatting (e.g., "2h ago")

### Task 8: Create src/index.js — Commander skeleton
- Shebang `#!/usr/bin/env node`
- Import commander, set program name/version/description
- Import and register all command modules (auth, feed, post, comment, vote, dms, groups, profile, my)
- Parse args
- Start with just auth registered, add others as they're built

### Task 9: Create src/commands/auth.js — login and logout
- `sidechat login` — interactive flow:
  1. Prompt for phone number
  2. Call API to send verification code
  3. Prompt for code
  4. Call API to verify, get token + user info
  5. Store token in keychain, userId in config
- `sidechat logout` — delete token from keychain, clear config
- Use `@inquirer/prompts` for input
- Use `ora` for spinners during API calls

### Task 10: npm link and verify structure
- Run `chmod +x src/index.js`
- Run `npm link`
- Verify `sidechat --help` works
- Verify `sidechat login --help` works
- Read sidechat.js source/types to understand the API shape for auth methods

### Task 11: Study sidechat.js API
- Read the sidechat.js package source in node_modules to understand:
  - Constructor / initialization pattern
  - Auth methods (login, verify)
  - Feed methods
  - Post/comment methods
  - DM methods
  - Group methods
  - Profile methods
  - Vote methods
- Document any quirks found for use in later tasks

### Task 12: Create src/commands/feed.js
- `sidechat feed [sort]` — browse feed (hot/new/top), defaults to hot
  - Options: `--group <id>` to override default group, `--json` for raw output
  - Paginate with "Load more?" prompt
- `sidechat post <id>` — view single post + all comments
  - Option: `--json`
- Use formatPost, formatPostList, formatComment from format.js

### Task 13: Create src/commands/groups.js — read operations
- `sidechat groups` or `sidechat groups list` — list joined groups in a table
- `sidechat groups explore` — explore/discover groups
- `sidechat groups search <query>` — search for groups
- `sidechat groups info <id>` — show group details
- `--json` flag on all
- Use cli-table3 for tabular output

### Task 14: Create src/commands/profile.js — read operations
- `sidechat profile` — view own profile
- `sidechat profile <userId>` — view another user's profile (if supported)
- `--json` flag
- Display: username, bio, post count, etc.

### Task 15: Create src/commands/dms.js — read operations
- `sidechat dms` or `sidechat dms list` — list DM threads in a table
- `sidechat dms read <threadId>` — read messages in a thread
- `--json` flag
- Format DM messages with timestamps and sender info

### Task 16: Create src/commands/my.js
- `sidechat my posts` — list user's own posts
- `sidechat my comments` — list user's own comments
- `--json` flag
- Reuse formatPostList and formatComment

### Task 17: Extend format.js — Part 2 (DMs, Groups, Profile)
- `formatDM(message)` — render a DM message
- `formatDMThread(thread)` — render thread preview for list
- `formatGroup(group)` — render group info
- `formatGroupTable(groups)` — render groups as cli-table3 table
- `formatProfile(profile)` — render user profile

### Task 18: Create src/commands/post.js — write operations
- `sidechat post create <text>` — create a new post
  - Options: `--group <id>`, `--anonymous`
  - Confirm before posting
- `sidechat post delete <id>` — delete own post
  - Confirm before deleting

### Task 19: Create src/commands/comment.js
- `sidechat comment <postId> <text>` — add comment to a post
  - Option: `--anonymous`
- `sidechat comment delete <commentId>` — delete own comment
  - Confirm before deleting

### Task 20: Create src/commands/vote.js
- `sidechat vote <postId> <direction>` — vote up/down/none on a post
- `sidechat vote comment <commentId> <direction>` — vote on a comment
- `sidechat vote poll <postId> <optionIndex>` — vote on a poll

### Task 21: Extend src/commands/dms.js — write operations
- `sidechat dms start <userId>` — start a new DM thread
- `sidechat dms send <threadId> <message>` — send a message in a thread

### Task 22: Extend src/commands/groups.js — write operations
- `sidechat groups join <id>` — join a group
- `sidechat groups leave <id>` — leave a group
- Confirm before leaving

### Task 23: Extend src/commands/profile.js — write operations
- `sidechat profile set-username <name>` — set display name
- `sidechat profile check-username <name>` — check availability
- `sidechat profile set-bio <text>` — set bio

### Task 24: Extend src/commands/auth.js — email operations
- `sidechat register-email <email>` — register/link email
- `sidechat verify-email <code>` — verify email with code

### Task 25: Final polish and verification
- Ensure all commands are registered in index.js
- Add `--json` flag to any read commands missing it
- Test `sidechat --help` shows all commands
- Verify command structure is consistent
- Review error handling across all commands
- Make sure all imports are correct ESM style
