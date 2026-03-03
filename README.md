# Sidechat-API

A command-line interface and API client for interacting with [Sidechat](https://sidechat.lol/) (and Yik Yak) from your terminal. Built with Node.js, designed to run on a Mac Mini.

## Overview

Sidechat is an anonymous social media platform for college communities, owned by Flower Ave LLC (which also owns Yik Yak). Officially, Sidechat is iOS-only with a limited [web viewer](https://web.sidechat.lol/). This project provides full programmatic access to the Sidechat API via the command line, removing the need for the iOS app.

This tool leverages [`sidechat.js`](https://micahlindley.com/sidechat.js/), a reverse-engineered API wrapper originally built for the [OffSides](https://github.com/micahlt/offsides) Android client.

## Architecture

```
┌──────────────────────────────────────────────┐
│                  CLI Layer                    │
│  (Commander.js + Inquirer.js + Chalk)         │
├──────────────────────────────────────────────┤
│              API Client Layer                 │
│           (sidechat.js wrapper)               │
├──────────────────────────────────────────────┤
│            Auth / Token Storage               │
│         (macOS Keychain via keytar)           │
├──────────────────────────────────────────────┤
│            Sidechat REST API                  │
│        (api.sidechat.lol / undocumented)      │
└──────────────────────────────────────────────┘
```

## Features

### Authentication
- **SMS Login** — authenticate with your phone number and a 6-digit verification code
- **Token Login** — pass a bearer token directly for headless/automated use
- **Secure Storage** — auth tokens stored in macOS Keychain (not plaintext config files)
- **Email Registration** — register and verify a `.edu` email to join campus communities

### Posts & Comments
- Browse feed by category: **Hot**, **New**, **Top**
- Create text posts (with optional polls, images, link attachments)
- Comment and reply to threads
- Upvote / downvote posts and comments
- Delete your own posts or comments
- View your post and comment history

### Groups & Communities
- List your joined groups
- Explore and search available groups
- Join or leave groups
- View group metadata (member count, rules, etc.)

### Direct Messages
- List DM threads
- Read individual DM conversations
- Start new DMs (from a post or standalone)
- Send messages in existing threads

### Polls
- Create polls with multiple options
- Vote on existing polls
- View poll results

### Assets
- Upload images for posts/comments (stored on S3)
- Browse the asset library (stickers, GIFs)

### User Profile
- View and set username
- Set profile icon (emoji + colors)
- Set bio
- View other users' public profiles

## Tech Stack

| Component | Library | Purpose |
|-----------|---------|---------|
| CLI framework | [Commander.js](https://github.com/tj/commander.js) | Command parsing, subcommands, flags |
| Interactive prompts | [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) | SMS code input, confirmations, menus |
| Terminal styling | [Chalk](https://github.com/chalk/chalk) | Colored output, formatting |
| Sidechat API | [sidechat.js](https://micahlindley.com/sidechat.js/) | Reverse-engineered API wrapper |
| Credential storage | [keytar](https://github.com/atom/node-keytar) | macOS Keychain integration |
| Runtime | Node.js 18+ | Required for native `fetch` API |

## Prerequisites

- **macOS** (tested on Mac Mini)
- **Node.js 18+** — `sidechat.js` uses the native Fetch API introduced in Node 18
- **A Sidechat account** — phone number required for authentication
- **A `.edu` email** — required to join campus-specific communities (optional for interest-based communities)

## Installation

```bash
# Clone the repo
git clone https://github.com/mkrolick/Sidechat-API.git
cd Sidechat-API

# Install dependencies
npm install

# Link the CLI globally
npm link
```

## Usage

### Authentication

```bash
# First-time login via SMS
sidechat login
# Prompts for phone number (10 digits, no formatting)
# Sends SMS code, then prompts for the 6-digit code

# Login with an existing bearer token
sidechat login --token <your-bearer-token>

# Register a .edu email (required for campus groups)
sidechat register-email <email@university.edu>

# Check email verification status
sidechat verify-email
```

### Browsing Posts

```bash
# View hot posts in your default group
sidechat feed

# View posts by category
sidechat feed --category hot
sidechat feed --category new
sidechat feed --category top

# View posts in a specific group
sidechat feed --group <group-id>

# Paginate through posts
sidechat feed --category hot --cursor <cursor-token>

# View a single post with comments
sidechat post <post-id>

# View comments on a post
sidechat comments <post-id>
```

### Creating Content

```bash
# Create a text post
sidechat post create "Your anonymous message here"

# Create a post with options
sidechat post create "Message" --group <group-id> --no-dms --no-comments

# Create a post as non-anonymous (uses your username)
sidechat post create "Message" --named

# Create a poll
sidechat poll create "Which dining hall?" --options "North,South,East,West"

# Comment on a post
sidechat comment <post-id> "Your reply here"

# Reply to a specific comment
sidechat comment <post-id> "Reply text" --reply-to <comment-id>
```

### Voting

```bash
# Upvote a post or comment
sidechat vote <post-id> up

# Downvote
sidechat vote <post-id> down

# Remove your vote
sidechat vote <post-id> none

# Vote on a poll
sidechat poll vote <poll-id> <choice-index>
```

### Direct Messages

```bash
# List DM threads
sidechat dms

# Read a specific thread
sidechat dms read <thread-id>

# Start a DM from a post
sidechat dms start <post-id> "Hey, great post!"

# Send a message in an existing thread
sidechat dms send <thread-id> "Your message"
```

### Groups

```bash
# List your groups
sidechat groups

# Explore available groups
sidechat groups explore

# Search for groups
sidechat groups search "computer science"

# Join a group
sidechat groups join <group-id>

# Leave a group
sidechat groups leave <group-id>

# View group info
sidechat groups info <group-id>
```

### Profile

```bash
# View your profile
sidechat profile

# Set your username
sidechat profile set-username <username>

# Check if a username is available
sidechat profile check-username <username>

# Set your bio
sidechat profile set-bio "CS major, coffee enthusiast"

# View another user's profile
sidechat profile view <username>
```

### Your Content

```bash
# View your posts
sidechat my posts

# View your comments
sidechat my comments
```

## Running as a Background Service on Mac Mini

To run the API server persistently on your Mac Mini (e.g., for scheduled posting, monitoring, or webhooks):

### Option A: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the service
pm2 start src/index.js --name sidechat-api

# Auto-start on boot
pm2 startup
pm2 save

# Monitor
pm2 logs sidechat-api
pm2 status
```

### Option B: macOS launchd

Create a plist file at `~/Library/LaunchAgents/com.sidechat-api.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sidechat-api</string>
    <key>WorkingDirectory</key>
    <string>/Users/mkrolick/Documents/GitHub/Sidechat-API</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>src/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/sidechat-api.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/sidechat-api-error.log</string>
</dict>
</plist>
```

```bash
# Load and start the service
launchctl load ~/Library/LaunchAgents/com.sidechat-api.plist

# Stop
launchctl unload ~/Library/LaunchAgents/com.sidechat-api.plist
```

## Project Structure

```
Sidechat-API/
├── src/
│   ├── index.js              # CLI entry point (Commander.js setup)
│   ├── commands/
│   │   ├── auth.js            # login, register-email, verify-email
│   │   ├── feed.js            # feed browsing, post viewing
│   │   ├── post.js            # create, delete posts
│   │   ├── comment.js         # create, delete comments
│   │   ├── vote.js            # upvote, downvote, poll voting
│   │   ├── dms.js             # direct message operations
│   │   ├── groups.js          # group management
│   │   └── profile.js         # user profile operations
│   ├── lib/
│   │   ├── client.js          # SidechatAPIClient wrapper
│   │   ├── auth-store.js      # Keychain token storage (keytar)
│   │   └── formatter.js       # Terminal output formatting (Chalk)
│   └── config.js              # Default group, preferences
├── package.json
├── .gitignore
└── README.md
```

## API Reference (sidechat.js)

The underlying `sidechat.js` library exposes the following methods through `SidechatAPIClient`:

### Authentication
| Method | Parameters | Description |
|--------|-----------|-------------|
| `loginViaSMS(phone)` | 10-digit number | Sends SMS verification code |
| `verifySMSCode(phone, code)` | phone + 6-digit code | Completes login |
| `setAge(age, registrationID)` | age + reg ID | Required for new accounts |
| `registerEmail(email)` | email string | Starts email verification |
| `checkEmailVerification()` | none | Checks if email is verified |
| `setToken(token)` | auth token object | Manually set auth token |

### Posts
| Method | Parameters | Description |
|--------|-----------|-------------|
| `getGroupPosts(groupID, category, cursor)` | group + "hot"/"new"/"top" + cursor | Fetch paginated posts |
| `getPost(postID, includeDeleted)` | post ID + boolean | Fetch a single post |
| `getPostComments(postID)` | post ID | Get all comments on a post |
| `createPost(text, groupID, ...)` | text + group + options | Create a new post |
| `createComment(parentPostID, text, ...)` | parent ID + text + options | Add a comment |
| `deletePostOrComment(id)` | post/comment ID | Delete your content |
| `getUserContent(type)` | "posts" or "comments" | Your own content |
| `setVote(postID, action)` | ID + vote string | Upvote/downvote/unvote |

### Groups
| Method | Parameters | Description |
|--------|-----------|-------------|
| `getGroupMetadata(groupID)` | group ID | Group info and rules |
| `getAvailableGroups(onePage)` | boolean | Browse all groups |
| `searchAvailableGroups(query)` | search string | Search groups by keyword |
| `setGroupMembership(groupID, isMember)` | ID + boolean | Join or leave |
| `getCurrentUser()` | none | User info + group list |

### Direct Messages
| Method | Parameters | Description |
|--------|-----------|-------------|
| `getDMs()` | none | List all DM threads |
| `getDMThread(id)` | thread ID | Read a specific thread |
| `startDM(text, clientID, postID, ...)` | message + IDs | Start new DM |
| `sendDM(chatID, text, ...)` | thread ID + message | Send in existing thread |

### Profile
| Method | Parameters | Description |
|--------|-----------|-------------|
| `setUsername(userID, username)` | user ID + name | Change username |
| `checkUsername(username)` | username | Check availability |
| `setUserIcon(userID, emoji, ...)` | user ID + emoji + colors | Set profile icon |
| `setUserBio(userID, bio)` | user ID + bio text | Set biography |
| `getUserProfile(username)` | username | View public profile |

### Assets
| Method | Parameters | Description |
|--------|-----------|-------------|
| `uploadAsset(uri, mimeType, name)` | file URI + type + name | Upload to S3 |
| `getAssetLibrary()` | none | Browse stickers/GIFs |

## Important Notes

### Legal Disclaimer
This project uses a reverse-engineered, unofficial API. It is **not** affiliated with, endorsed by, or connected to Sidechat or Flower Ave LLC. Use at your own risk. The API could change or break at any time without notice.

### Authentication Requirements
- **Phone number** is required for initial authentication (SMS-based verification)
- **`.edu` email** is required to join campus-specific communities
- Interest-based communities can be joined without a `.edu` email

### Rate Limiting
The Sidechat API does not publish rate limits. Be respectful with request frequency to avoid getting your account or IP blocked. When building automations, add reasonable delays between requests.

### Privacy
- All posts on Sidechat are anonymous by design
- This CLI stores your bearer token in the macOS Keychain, not in plaintext files
- Your phone number is used only for authentication and is not exposed in posts

## Sources & References

- [Sidechat.js Documentation](https://micahlindley.com/sidechat.js/) — Reverse-engineered API wrapper
- [OffSides](https://github.com/micahlt/offsides) — Third-party Android client built on sidechat.js
- [SidechatProxy](https://github.com/OrenKohavi/SidechatProxy) — Original reverse-engineering project (archived)
- [Sidechat Official Site](https://sidechat.lol/)
- [Sidechat Web](https://web.sidechat.lol/)
- [Sidechat Wikipedia](https://en.wikipedia.org/wiki/Sidechat)
- [Commander.js](https://github.com/tj/commander.js) — CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) — Interactive prompts
- [Chalk](https://github.com/chalk/chalk) — Terminal styling
- [keytar](https://github.com/atom/node-keytar) — macOS Keychain access for Node.js
