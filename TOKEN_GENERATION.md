# Token Generation Guide

This guide explains how to generate the necessary tokens and credentials for each supported platform in the Multi-Platform AI Integration System.

## 1. OpenAI (AI Provider)

1.  Go to [OpenAI Platform](https://platform.openai.com/).
2.  Sign up or log in.
3.  Navigate to **API Keys** in the dashboard.
4.  Click **Create new secret key**.
5.  Copy the key (starts with `sk-`).
6.  Set it as `OPENAI_API_KEY` in your `.env` file.

## 2. Anthropic (Alternative AI Provider)

1.  Go to [Anthropic Console](https://console.anthropic.com/).
2.  Sign up or log in.
3.  Navigate to **API Keys**.
4.  Click **Create Key**.
5.  Copy the key (starts with `sk-ant-`).
6.  Set it as `ANTHROPIC_API_KEY` in your `.env` file.

## 3. Telegram

1.  Open Telegram and search for **@BotFather**.
2.  Start a chat and send `/newbot`.
3.  Follow the prompts to choose a name and username for your bot.
4.  BotFather will provide an **API Token**.
5.  Set it as `TELEGRAM_BOT_TOKEN` in your `.env` file.
6.  Set `TELEGRAM_ENABLED=true`.

## 4. Slack

1.  Go to [Slack API: Your Apps](https://api.slack.com/apps).
2.  Click **Create New App** -> **From scratch**.
3.  Enter an App Name and select your Workspace.
4.  **Bot Token**:
    *   Go to **OAuth & Permissions**.
    *   Scroll to **Scopes** -> **Bot Token Scopes**.
    *   Add scopes: `chat:write`, `app_mentions:read`, `channels:history`, `im:history`.
    *   Scroll up and click **Install to Workspace**.
    *   Copy the **Bot User OAuth Token** (starts with `xoxb-`).
    *   Set as `SLACK_BOT_TOKEN`.
5.  **Signing Secret**:
    *   Go to **Basic Information**.
    *   Scroll to **App Credentials**.
    *   Copy **Signing Secret**.
    *   Set as `SLACK_SIGNING_SECRET`.
6.  **App Token** (for Socket Mode):
    *   Go to **Basic Information**.
    *   Scroll to **App-Level Tokens**.
    *   Click **Generate Token and Scopes**.
    *   Name it (e.g., "Socket Mode"), add `connections:write` scope.
    *   Copy the token (starts with `xapp-`).
    *   Set as `SLACK_APP_TOKEN`.
7.  **Enable Socket Mode**:
    *   Go to **Socket Mode** in the sidebar and toggle **Enable Socket Mode**.
8.  **Event Subscriptions**:
    *   Go to **Event Subscriptions**, toggle On.
    *   Subscribe to bot events: `message.im`, `app_mention`.
9.  Set `SLACK_ENABLED=true`.

## 5. Microsoft Teams

*Note: Requires an Azure account and Microsoft 365 Tenant.*

1.  **Azure Bot Resource**:
    *   Go to [Azure Portal](https://portal.azure.com/).
    *   Create a resource -> Search for **Azure Bot**.
    *   Create it (select "Multi Tenant" or "Single Tenant" as needed).
    *   Once created, go to **Configuration**.
    *   Copy the **Microsoft App ID**. Set as `TEAMS_APP_ID`.
2.  **App Password**:
    *   Click **Manage Password** (next to App ID) or go to Certificates & Secrets in the associated App Registration.
    *   Create a new client secret.
    *   Copy the **Value** (not the ID). Set as `TEAMS_APP_PASSWORD`.
3.  **Messaging Endpoint**:
    *   In Azure Bot Configuration, set the **Messaging endpoint** to your public URL + `/api/teams/messages` (e.g., `https://your-domain.com/api/teams/messages`).
    *   *Note: For local development, use ngrok to expose port 3000.*
4.  **Teams App Package**:
    *   Use **Developer Portal** in Teams to create an app package manifest pointing to your Bot ID.
5.  Set `TEAMS_ENABLED=true`.

## 6. WhatsApp

1.  Set `WHATSAPP_ENABLED=true` in `.env`.
2.  Run the application.
3.  Watch the logs (or Docker output). A QR code will be generated in the terminal.
4.  Open WhatsApp on your phone -> Settings -> Linked Devices -> Link a Device.
5.  Scan the QR code.
6.  The session will be saved locally (in `.wwebjs_auth` folder).

## 7. MCP Server (Optional)

1.  If you have an MCP server running (e.g., a local Brave Search MCP), get its URL (e.g., `http://localhost:8080/sse`).
2.  Set `MCP_SERVER_ENABLED=true` and `MCP_SERVER_URL` in `.env`.
