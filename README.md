# Sidechat-API

A command-line client for interacting with [Sidechat](https://sidechat.lol/) from your terminal. Built with Node.js and Commander.js, designed to run on macOS.

## Overview

Sidechat is an anonymous social media platform for college communities, owned by Flower Ave LLC. Officially, Sidechat is iOS-only with a limited [web viewer](https://web.sidechat.lol/). This project provides programmatic access to the Sidechat API from the command line, removing the need for the iOS app.

This tool leverages [`sidechat.js`](https://micahlindley.com/sidechat.js/), a reverse-engineered API wrapper originally built for the [OffSides](https://github.com/micahlt/offsides) client.

This is a one-shot CLI: every invocation runs a single command and exits. There is no long-running server or daemon.

## Architecture

```
┌──────────────────────────────────────────────┐
│                  CLI Layer                    │
│   (Commander.js + @inquirer/prompts + Chalk)  │
├──────────────────────────────────────────────┤
│              API Client Layer                 │
│           (sidechat.js wrapper)               │
├──────────────────────────────────────────────┤
│            Auth / Token Storage               │
│  (macOS Keychain via the `security` CLI)      │
├──────────────────────────────────────────────┤
│            Sidechat REST API                  │
│        (api.sidechat.lol / undocumented)      │
└──────────────────────────────────────────────┘
```

Your bearer token is stored in the macOS login keychain using the built-in `security` command-line tool (service name `sidechat-cli`, account `auth-token`) — no third-party keychain library is used. Non-secret preferences (your user ID and default group ID) are written to `~/.config/sidechat/config.json`.

## Features

### Authentication (`sidechat auth`)
- **SMS Login** — authenticate interactively with your phone number and a 6-digit verification code
- **Age / registration** — for brand-new accounts, prompts for age to complete signup
- **Secure Storage** — the auth token is stored in the macOS Keychain, not in plaintext files
- **School-email registration** — register and verify a school email to unlock campus communities

### Posts & Comments
- Browse the feed by sort order: **hot**, **recent**, **top**
- Create text posts, optionally anonymous, optionally with a poll, and optionally with DMs/comments disabled
- View a single post with its comment tree
- Comment on posts and reply to specific comments
- Delete your own posts and comments

### Voting
- Upvote / downvote / clear your vote on posts and comments
- Vote on polls by choice index

### Groups & Communities (`sidechat groups`)
- List your joined groups
- Explore and search available groups
- Join or leave groups
- View group metadata (member count, join type, etc.)
- Set a default group so you can omit `--group` on other commands

### Direct Messages (`sidechat dms`)
- List DM threads
- Read an individual DM conversation
- Start a new DM from a post/comment
- Send messages in existing threads

### Profile (`sidechat profile`)
- View your own account, or another user's public profile
- Set your username, bio, and conversation icon (emoji + colors)
- Check whether a username is available

### Your Content (`sidechat my`)
- List your own posts
- List your own comments

Most read commands also accept `--json` to print the raw API response instead of the formatted output.

## Tech Stack

| Component | Library | Purpose |
|-----------|---------|---------|
| CLI framework | [Commander.js](https://github.com/tj/commander.js) | Command parsing, subcommands, flags |
| Interactive prompts | [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) | Phone/code input, confirmations |
| Terminal styling | [Chalk](https://github.com/chalk/chalk) | Colored output |
| Tables | [cli-table3](https://github.com/cli-table/cli-table3) | Group listings |
| Spinners | [ora](https://github.com/sindresorhus/ora) | Loading indicators |
| Sidechat API | [sidechat.js](https://micahlindley.com/sidechat.js/) | Reverse-engineered API wrapper |
| Credential storage | macOS `security` CLI | Keychain access (no external dependency) |
| Runtime | Node.js 18+ | Required for the native `fetch` API |

## Prerequisites

- **macOS** — credential storage shells out to the macOS `security` command; the CLI will not work on Linux or Windows as written.
- **Node.js 18 or newer** — `sidechat.js` uses the native Fetch API introduced in Node 18. (Developed and tested on Node 22.)
- **A phone number** — required for the interactive SMS login.
- **A school email** — required to join campus-specific communities (optional for interest-based communities).

## Installation

```bash
# Clone the repo
git clone https://github.com/Mkrolick/Sidechat-API.git
cd Sidechat-API

# Install dependencies
npm install

# (Optional) link the CLI globally so `sidechat` is on your PATH
npm link
```

If you skip `npm link`, run the CLI with `node src/index.js <command>` (or `npm start -- <command>`) from the repo directory. All examples below use the `sidechat` command; substitute `node src/index.js` if you did not link it.

## Quick Start

```bash
# 1. Log in (interactive: prompts for phone number, then the SMS code)
sidechat auth login

# 2. Browse the hot feed of your default group
sidechat feed

# 3. Post something
sidechat post create "Hello from the terminal"
```

Expected behavior: `sidechat auth login` prompts for your 10-digit phone number, sends an SMS code, prompts for that code, stores the resulting token in your Keychain, and sets your first group as the default. After that, `sidechat feed` prints a formatted list of posts.

## Usage

### Authentication

```bash
# Interactive SMS login (prompts for phone number, then 6-digit code)
sidechat auth login

# Log out and clear the stored token
sidechat auth logout

# Register a school email (required for campus groups)
sidechat auth register-email you@university.edu

# Check whether your email has been verified
sidechat auth verify-email
```

> Note: login is interactive only. There is no `--token` flag; the token is obtained through the SMS flow and then persisted to the Keychain automatically.

### Browsing the Feed

```bash
# Hot posts in your default group (sort defaults to "hot")
sidechat feed

# Choose a sort order: hot, recent, or top
sidechat feed recent
sidechat feed top

# Browse a specific group
sidechat feed hot --group <group-id>

# Raw JSON output
sidechat feed --json
```

The feed paginates interactively: after each page it asks "Load more?" and fetches the next page if you confirm.

### Posts

```bash
# View a post and its comments
sidechat post view <post-id>

# Create a text post in your default group
sidechat post create "Your anonymous message here"

# Create a post with options
sidechat post create "Message" --group <group-id> --no-dms --no-comments

# Post anonymously
sidechat post create "Message" --anonymous

# Create a poll (each word/quoted phrase after --poll is a choice)
sidechat post create "Which dining hall?" --poll North South East West

# Delete one of your posts (asks for confirmation)
sidechat post delete <post-id>
```

### Comments

```bash
# Comment on a post
sidechat comment create <post-id> "Your reply here"

# Reply to a specific comment
sidechat comment create <post-id> "Reply text" --reply <comment-id>

# Comment anonymously
sidechat comment create <post-id> "Reply text" --anonymous

# Delete a comment (asks for confirmation)
sidechat comment delete <comment-id>
```

### Voting

```bash
# Vote on a post (direction: up, down, or none)
sidechat vote post <post-id> up
sidechat vote post <post-id> down
sidechat vote post <post-id> none

# Vote on a comment
sidechat vote comment <comment-id> up

# Vote on a poll (choice is a 0-based index)
sidechat vote poll <poll-id> 0
```

### Direct Messages

```bash
# List DM threads (also the default when you run `sidechat dms`)
sidechat dms list

# Read a specific thread
sidechat dms read <thread-id>

# Start a DM from a post or comment
sidechat dms start <post-id> "Hey, great post!"

# Send a message in an existing thread
sidechat dms send <thread-id> "Your message"
```

### Groups

```bash
# List your joined groups (also the default when you run `sidechat groups`)
sidechat groups list

# Explore available groups
sidechat groups explore

# Search for groups
sidechat groups search "computer science"

# View group details
sidechat groups info <group-id>

# Join or leave a group
sidechat groups join <group-id>
sidechat groups leave <group-id>

# Set your default group (used when --group is omitted)
sidechat groups set-default <group-id>
```

### Profile

```bash
# View your own account (also the default when you run `sidechat profile`)
sidechat profile view

# View another user's public profile
sidechat profile view <username>

# Set your username
sidechat profile set-username <username>

# Check if a username is available
sidechat profile check-username <username>

# Set your bio
sidechat profile set-bio "CS major, coffee enthusiast"

# Set your conversation icon (emoji + optional hex colors)
sidechat profile set-icon 🎓 --primary "#6366f1" --secondary "#a5b4fc"
```

### Your Content

```bash
# View your posts
sidechat my posts

# View your comments
sidechat my comments
```

## Project Structure

```
Sidechat-API/
├── src/
│   ├── index.js              # CLI entry point (Commander.js setup)
│   ├── commands/
│   │   ├── auth.js            # login, logout, register-email, verify-email
│   │   ├── feed.js            # feed browsing
│   │   ├── post.js            # view, create, delete posts
│   │   ├── comment.js         # create, delete comments
│   │   ├── vote.js            # vote on posts, comments, polls
│   │   ├── dms.js             # direct message operations
│   │   ├── groups.js          # group management
│   │   ├── profile.js         # user profile operations
│   │   └── my.js              # your posts and comments
│   └── lib/
│       ├── client.js          # SidechatAPIClient wrapper + group-id resolution
│       ├── config.js          # ~/.config/sidechat/config.json (userId, defaultGroupId)
│       ├── keychain.js        # token storage via the macOS `security` CLI
│       ├── format.js          # terminal output formatting (Chalk + cli-table3)
│       └── errors.js          # error handling / action wrapper
├── package.json
├── .gitignore
└── README.md
```

## Known Issues & Limitations

- **macOS only.** Credential storage uses the macOS `security` CLI (`src/lib/keychain.js`). On other platforms the token cannot be stored or read.
- **Login is interactive only.** There is no headless/token login flag; you must complete the SMS prompt flow at least once. The token then lives in your Keychain for subsequent commands.
- **No asset/image upload command.** The underlying `sidechat.js` library can upload images, but this CLI does not currently expose a command for it. Posts are text (plus optional polls).
- **Undocumented, unofficial API.** Response field names can drift; some formatting may show `—` or blanks if the API shape changes.

## Important Notes

### Legal Disclaimer
This project uses a reverse-engineered, unofficial API. It is **not** affiliated with, endorsed by, or connected to Sidechat or Flower Ave LLC. Use at your own risk. The API could change or break at any time without notice.

### Rate Limiting
The Sidechat API does not publish rate limits. Be respectful with request frequency to avoid getting your account or IP blocked. When building automations, add reasonable delays between requests.

### Privacy
- Posts on Sidechat are anonymous by design.
- This CLI stores your bearer token in the macOS Keychain, not in plaintext files.
- Your phone number is used only for authentication and is not exposed in posts.

## Sources & References

- [Sidechat.js Documentation](https://micahlindley.com/sidechat.js/) — reverse-engineered API wrapper
- [OffSides](https://github.com/micahlt/offsides) — third-party client built on sidechat.js
- [SidechatProxy](https://github.com/OrenKohavi/SidechatProxy) — original reverse-engineering project (archived)
- [Sidechat Official Site](https://sidechat.lol/)
- [Sidechat Web](https://web.sidechat.lol/)
- [Commander.js](https://github.com/tj/commander.js) — CLI framework
- [Inquirer.js / @inquirer/prompts](https://github.com/SBoudrias/Inquirer.js) — interactive prompts
- [Chalk](https://github.com/chalk/chalk) — terminal styling
