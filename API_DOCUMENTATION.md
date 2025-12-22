# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

Most endpoints require authentication using a Bearer token:

```
Authorization: Bearer YOUR_SECRET_KEY
```

Set the secret key in `.env`:
```
API_SECRET_KEY=your_secret_key_here
API_AUTH_ENABLED=true
```

## Endpoints

### Health Check

Check if the service is running.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Platform Status

Get the status of all enabled platforms.

**Request:**
```http
GET /api/platforms
Authorization: Bearer YOUR_SECRET_KEY
```

**Response:**
```json
{
  "whatsapp": { "enabled": true },
  "telegram": { "enabled": true },
  "slack": { "enabled": false },
  "teams": { "enabled": false }
}
```

### Send Message

Send a message to a specific platform and chat.

**Request:**
```http
POST /api/message
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: application/json

{
  "platform": "telegram",
  "chatId": "123456789",
  "text": "Hello from API!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "platform": "telegram",
    "chatId": "123456789",
    "text": "Hello from API!"
  }
}
```

### MCP Request

Make a direct request to the MCP server.

**Request:**
```http
POST /api/mcp
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: application/json

{
  "method": "query",
  "params": {
    "type": "users",
    "filter": "active"
  },
  "context": {
    "userId": "user123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      { "id": "1", "name": "User 1", "status": "active" },
      { "id": "2", "name": "User 2", "status": "active" }
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to communicate with MCP server"
}
```

## Natural Language Processing

The system automatically processes natural language messages and extracts intents.

### Supported Actions

- `create` - Create new resources
- `read` - Read/retrieve resources
- `update` - Update existing resources
- `delete` - Delete resources
- `query` - Query/search resources
- `search` - Search functionality

### Example Intents

| User Message | Extracted Action | Entities |
|--------------|------------------|----------|
| "Create a new user named John" | `create` | `{type: "user", name: "John"}` |
| "Get all orders from last week" | `query` | `{type: "orders", timeframe: "last week"}` |
| "Update product price to $50" | `update` | `{type: "product", price: 50}` |
| "Delete user 123" | `delete` | `{type: "user", id: "123"}` |
| "Search for customers in New York" | `search` | `{type: "customers", location: "New York"}` |

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing authentication token |
| 500 | Internal Server Error |
| 503 | Service Unavailable - MCP server not enabled or unavailable |

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting in production environments.

## Webhooks

### Teams Webhook

Microsoft Teams requires a webhook endpoint:

```
POST /api/teams/messages
```

This endpoint is automatically configured when Teams adapter is enabled.

## Examples

### cURL Examples

#### Create a resource via natural language:
```bash
# Send a message through Telegram
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -d '{
    "platform": "telegram",
    "chatId": "123456789",
    "text": "Create a new product named Widget with price $29.99"
  }'
```

#### Direct MCP call:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -d '{
    "method": "create",
    "params": {
      "type": "product",
      "name": "Widget",
      "price": 29.99
    }
  }'
```

### JavaScript Example

```javascript
const axios = require('axios');

async function sendMessage(platform, chatId, text) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/message',
      {
        platform,
        chatId,
        text
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_SECRET_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendMessage('telegram', '123456789', 'Hello from Node.js!');
```

### Python Example

```python
import requests

def send_message(platform, chat_id, text):
    url = 'http://localhost:3000/api/message'
    headers = {
        'Authorization': 'Bearer YOUR_SECRET_KEY',
        'Content-Type': 'application/json'
    }
    data = {
        'platform': platform,
        'chatId': chat_id,
        'text': text
    }
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()

result = send_message('telegram', '123456789', 'Hello from Python!')
print(result)
```
