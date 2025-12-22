# Example Usage

This directory contains examples to help you get started with the Multi-Platform AI Integration system.

## Files

- `simple-mcp-server.js` - A basic MCP server implementation for testing
- `test-client.js` - A test client to verify the integration is working

## Quick Start

### 1. Start the MCP Server (Optional)

If you want to test with an actual MCP server:

```bash
cd examples
node simple-mcp-server.js
```

This will start a simple MCP server on port 8080 with in-memory storage.

### 2. Configure the Integration

Update your `.env` file:

```env
# Enable MCP
MCP_SERVER_ENABLED=true
MCP_SERVER_URL=http://localhost:8080

# Configure at least one platform
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token

# Set API key for testing
API_SECRET_KEY=test_secret_key
```

### 3. Start the Integration System

```bash
npm run build
npm start
```

### 4. Test with the Client

In another terminal:

```bash
cd examples
npm install axios  # If not already installed
API_SECRET_KEY=test_secret_key node test-client.js
```

## Testing Natural Language

### Via Telegram

Once your Telegram bot is running, send it messages like:

```
Create a new user named Alice
Get all active users
Update user 123 status to inactive
Delete user 456
```

### Via API

```bash
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_secret_key" \
  -d '{
    "platform": "telegram",
    "chatId": "your_chat_id",
    "text": "Create a new product named Widget"
  }'
```

## Example Interactions

### Creating Resources

**User Input:**
```
Create a new product named "Laptop" with price $999
```

**System Response:**
```
I've successfully created a new product with the following details:
- Name: Laptop
- Price: $999
- ID: 1234567890
```

### Querying Data

**User Input:**
```
Show me all orders from this week
```

**System Response:**
```
I found 5 orders from this week:
1. Order #001 - $150 - Pending
2. Order #002 - $250 - Completed
3. Order #003 - $99 - Pending
...
```

### Updating Resources

**User Input:**
```
Update product price to $899
```

**System Response:**
```
I've updated the product price to $899 successfully.
```

## Customizing the MCP Server

Edit `simple-mcp-server.js` to add your own business logic:

```javascript
function handleCreate(params, context) {
  // Add your database logic here
  // Example: await db.collection('users').insert(params);
  
  return {
    success: true,
    message: 'Created successfully',
    data: newItem
  };
}
```

## Troubleshooting

### MCP Server Connection Issues

1. Verify the MCP server is running:
```bash
curl http://localhost:8080/health
```

2. Check the URL in `.env` matches the MCP server port

3. Look at the logs for connection errors

### API Authentication Issues

Make sure the `API_SECRET_KEY` in `.env` matches what you're using in requests:

```bash
# In .env
API_SECRET_KEY=test_secret_key

# In request
Authorization: Bearer test_secret_key
```

### Platform Connection Issues

- **Telegram**: Verify bot token is correct
- **WhatsApp**: Make sure you've scanned the QR code
- **Slack**: Check bot token and signing secret
- **Teams**: Verify app credentials and webhook URL

## Next Steps

1. Implement your own MCP server with real database connections
2. Add custom actions and intents to the AI provider
3. Implement authentication and authorization
4. Add rate limiting and monitoring
5. Deploy to production
