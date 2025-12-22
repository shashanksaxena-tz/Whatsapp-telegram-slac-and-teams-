# Multi-Platform AI Integration System

AI-powered integration system for WhatsApp, Telegram, Slack, and Microsoft Teams that enables bidirectional communication between messaging platforms and MCP (Model Context Protocol) servers through natural language processing.

## 🌟 Features

- **Multi-Platform Support**: Seamlessly integrates with WhatsApp, Telegram, Slack, and Microsoft Teams
- **Natural Language Processing**: Uses AI (OpenAI GPT or Anthropic Claude) to understand user intent from natural language
- **MCP Server Integration**: Connects to Model Context Protocol servers for advanced AI agent interactions
- **Bidirectional Communication**: Two-way message flow between platforms and backend systems
- **REST API**: Provides HTTP endpoints for programmatic access
- **Intent Recognition**: Automatically extracts actions and entities from user messages
- **Flexible Architecture**: Modular design allows easy addition of new platforms or AI providers

## 🏗️ Architecture

```
User Message (Any Platform)
        ↓
  Platform Adapter
        ↓
  Message Router
        ↓
  AI Provider (NLP)
        ↓
  Intent Extraction
        ↓
  MCP Server / API
        ↓
  Response Generation
        ↓
  Platform Adapter
        ↓
  User Response
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- API keys for:
  - OpenAI or Anthropic Claude
  - Telegram Bot Token (if using Telegram)
  - Slack Bot Token (if using Slack)
  - Microsoft Teams App credentials (if using Teams)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Whatsapp-telegram-slac-and-teams-
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure your `.env` file with required credentials:
```env
# AI Provider (required)
OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key

# Enable platforms
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# ... other platform configs
```

5. Build the project:
```bash
npm run build
```

6. Start the application:
```bash
npm start
```

## 📋 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | API server port | No (default: 3000) |
| `AI_PROVIDER` | AI provider: "openai" or "anthropic" | No (default: openai) |
| `OPENAI_API_KEY` | OpenAI API key | Yes (if using OpenAI) |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes (if using Anthropic) |
| `WHATSAPP_ENABLED` | Enable WhatsApp integration | No |
| `TELEGRAM_ENABLED` | Enable Telegram integration | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Yes (if Telegram enabled) |
| `SLACK_ENABLED` | Enable Slack integration | No |
| `SLACK_BOT_TOKEN` | Slack bot token | Yes (if Slack enabled) |
| `SLACK_SIGNING_SECRET` | Slack signing secret | Yes (if Slack enabled) |
| `TEAMS_ENABLED` | Enable Teams integration | No |
| `TEAMS_APP_ID` | Teams app ID | Yes (if Teams enabled) |
| `TEAMS_APP_PASSWORD` | Teams app password | Yes (if Teams enabled) |
| `MCP_SERVER_ENABLED` | Enable MCP server connection | No |
| `MCP_SERVER_URL` | MCP server URL | Yes (if MCP enabled) |

### Platform Setup

#### WhatsApp
1. Set `WHATSAPP_ENABLED=true`
2. Run the application and scan the QR code with WhatsApp

#### Telegram
1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get the bot token
3. Set `TELEGRAM_ENABLED=true` and `TELEGRAM_BOT_TOKEN=<your_token>`

#### Slack
1. Create a Slack app at [api.slack.com](https://api.slack.com/apps)
2. Enable Socket Mode (recommended) or configure webhooks
3. Add bot token scopes: `chat:write`, `im:history`, `im:read`, `im:write`
4. Install the app to your workspace
5. Set environment variables with bot token and signing secret

#### Microsoft Teams
1. Register a bot in [Azure Bot Service](https://portal.azure.com)
2. Get App ID and App Password
3. Configure messaging endpoint to `https://your-domain/api/teams/messages`
4. Set `TEAMS_ENABLED=true` with credentials

## 💬 Usage Examples

### Natural Language Interactions

Users can interact with the system using natural language:

```
User: "Create a new user named John Doe"
Bot: "I've successfully created a new user with the name John Doe. The user ID is 1234567890."

User: "Get all orders from last week"
Bot: "I found 15 orders from last week. Here are the results: ..."

User: "Update the product price to $50"
Bot: "I've updated the product price to $50 successfully."
```

### API Usage

#### Send a message programmatically:
```bash
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secret_key" \
  -d '{
    "platform": "telegram",
    "chatId": "123456789",
    "text": "Hello from API!"
  }'
```

#### Make an MCP request:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secret_key" \
  -d '{
    "method": "query",
    "params": {
      "type": "users",
      "filter": "active"
    }
  }'
```

## 🔧 Development

### Build
```bash
npm run build
```

### Development mode (with auto-reload):
```bash
npm run dev
```

### Linting:
```bash
npm run lint
```

### Format code:
```bash
npm run format
```

## 🏛️ Project Structure

```
src/
├── ai/                    # AI provider implementations
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   └── index.ts
├── api/                   # REST API server
│   ├── server.ts
│   └── index.ts
├── core/                  # Core business logic
│   ├── mcp-client.ts     # MCP protocol client
│   ├── message-router.ts # Message routing logic
│   └── index.ts
├── platforms/            # Platform adapters
│   ├── whatsapp-adapter.ts
│   ├── telegram-adapter.ts
│   ├── slack-adapter.ts
│   ├── teams-adapter.ts
│   └── index.ts
├── types/                # TypeScript type definitions
│   └── index.ts
├── utils/                # Utilities
│   ├── config.ts
│   └── logger.ts
└── index.ts             # Application entry point
```

## 🔐 Security

- API authentication using Bearer tokens (configurable)
- Environment-based configuration for sensitive data
- No hardcoded credentials
- Secure webhook handling for platforms

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License

## 🆘 Support

For issues, questions, or contributions, please open an issue in the GitHub repository.