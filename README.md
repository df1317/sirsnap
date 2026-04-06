# SirSnap - Team 1317's Slack-Based TeamSnap

A Slack bot built with [slack-edge](https://github.com/yusukebe/slack-edge) running on Cloudflare Workers for Team 1317 Digital Fusion.

## Features

- **Slash Commands**:
  - `/hello` - Get a friendly greeting with quick check-in/out buttons
  - `/attendance [in|out|status|help]` - Full attendance tracking system
- **Button Interactions**: Quick check-in/out buttons for easy attendance tracking
- **App Mentions**: Bot responds when mentioned in channels
- **Direct Messages**: Bot responds to DMs
- **Health Check**: Simple endpoint at `/health`

## Setup

## Setup

### 1. Create a Slack App

You can either:

**Option A: Use the App Manifest (Recommended)**

1. Go to [Slack API](https://api.slack.com/apps) and click "Create New App"
2. Choose "From an app manifest"
3. Select your workspace
4. Copy the contents of `manifest.yaml` and paste it
5. The manifest is already configured to use `https://sirsnap.bore.dunkirk.sh/slack`
6. Create the app

**Option B: Manual Setup**

1. Go to [Slack API](https://api.slack.com/apps) and create a new app
2. Under "OAuth & Permissions", add these bot token scopes:
   - `app_mentions:read`
   - `channels:history`
   - `chat:write`
   - `commands`
   - `im:history`
   - `im:read`
   - `im:write`
   - `users:read`

### 2. Configure Environment Variables

Create a `.dev.vars` file for local development:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual values
```

For production deployment, set secrets using Wrangler:

```bash
# Set your Slack signing secret (required)
bun wrangler secret put SLACK_SIGNING_SECRET

# Set your bot token (optional but recommended)
bun wrangler secret put SLACK_BOT_TOKEN
```

### 3. Set up Slack App Configuration

#### Slash Commands

Add slash commands in your Slack app:

- Command: `/hello`
- Request URL: `https://sirsnap.bore.dunkirk.sh/slack`
- Description: "Get a friendly greeting"

- Command: `/attendance`
- Request URL: `https://sirsnap.bore.dunkirk.sh/slack`
- Description: "Track your attendance - check in, check out, view status"
- Usage hint: `[in|out|status|help]`

#### Event Subscriptions

Enable event subscriptions:

- Request URL: `https://sirsnap.bore.dunkirk.sh/slack`
- Subscribe to bot events:
  - `app_mention`
  - `message.im`

#### Interactive Components

Enable interactive components:

- Request URL: `https://sirsnap.bore.dunkirk.sh/slack`

## Development

Install dependencies:

```bash
bun install
```

Start local development server:

```bash
bun dev
```

## Deployment

Deploy to Cloudflare Workers:

```bash
bun deploy
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main worker code with Slack bot logic
│   └── features/         # Modular feature implementations
│       ├── index.ts      # Feature exports
│       ├── hello.ts      # Hello command feature
│       └── attendance.ts # Attendance tracking feature
├── wrangler.jsonc        # Cloudflare Workers configuration
├── manifest.yaml         # Slack app configuration manifest
├── .dev.vars.example     # Example environment variables
└── package.json          # Dependencies and scripts
```

## Usage

1. Install the bot in your Slack workspace
2. Try the `/hello` command in any channel for a quick greeting
3. Use `/attendance` commands for attendance tracking:
   - `/attendance in` - Check in to the workspace
   - `/attendance out` - Check out of the workspace
   - `/attendance status` - View your current attendance status
   - `/attendance help` - Get help with attendance commands
4. Click the interactive buttons for quick check-in/out
5. Mention the bot with `@sirsnap` in a channel
6. Send a DM to the bot

## Built With

- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless compute platform
- [slack-edge](https://github.com/yusukebe/slack-edge) - Slack bot framework for edge computing
- [Bun](https://bun.sh/) - JavaScript runtime and package manager

<p align="center">
    <img src="https://raw.githubusercontent.com/taciturnaxolotl/carriage/main/.github/images/line-break.svg" />
</p>

<p align="center">
    <i><code>&copy; 2026-present <a href="https://team1317.org">Team 1317 Digital Fusion</a></code></i>
</p>

<p align="center">
    <a href="https://github.com/df1317/sirsnap/blob/main/LICENSE.md"><img src="https://img.shields.io/static/v1.svg?style=for-the-badge&label=License&message=O'Saasy&logoColor=d9e0ee&colorA=363a4f&colorB=b7bdf8"/></a>
</p>
