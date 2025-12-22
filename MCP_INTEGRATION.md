# MCP Server Integration Guide

## What is MCP?

MCP (Model Context Protocol) is a protocol that enables AI agents to interact with external systems and tools in a standardized way. This integration allows messaging platforms to communicate with MCP servers through natural language.

## Architecture

```
User Message → Platform → AI NLP → Intent → MCP Request → MCP Server → Response → AI Generation → Platform → User
```

## MCP Server Requirements

Your MCP server should implement a JSON-RPC 2.0 interface at the `/rpc` endpoint.

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": "1234567890",
  "method": "action_name",
  "params": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### Response Format

**Success:**
```json
{
  "jsonrpc": "2.0",
  "id": "1234567890",
  "result": {
    "data": "your response data"
  }
}
```

**Error:**
```json
{
  "jsonrpc": "2.0",
  "id": "1234567890",
  "error": {
    "code": -32600,
    "message": "Error description"
  }
}
```

## Configuration

Enable MCP in your `.env` file:

```env
MCP_SERVER_ENABLED=true
MCP_SERVER_URL=http://localhost:8080
MCP_SERVER_TIMEOUT=30000
```

## Example MCP Server Implementation

### Node.js Example

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/rpc', (req, res) => {
  const { id, method, params } = req.body;
  
  try {
    let result;
    
    switch (method) {
      case 'create':
        result = handleCreate(params);
        break;
      case 'query':
        result = handleQuery(params);
        break;
      case 'update':
        result = handleUpdate(params);
        break;
      case 'delete':
        result = handleDelete(params);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    
    res.json({
      jsonrpc: '2.0',
      id,
      result
    });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

function handleCreate(params) {
  // Your create logic
  return { success: true, id: Date.now().toString(), data: params };
}

function handleQuery(params) {
  // Your query logic
  return { success: true, results: [] };
}

function handleUpdate(params) {
  // Your update logic
  return { success: true, data: params };
}

function handleDelete(params) {
  // Your delete logic
  return { success: true };
}

app.listen(8080, () => {
  console.log('MCP Server listening on port 8080');
});
```

### Python Example

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/rpc', methods=['POST'])
def rpc():
    data = request.json
    rpc_id = data.get('id')
    method = data.get('method')
    params = data.get('params', {})
    
    try:
        if method == 'create':
            result = handle_create(params)
        elif method == 'query':
            result = handle_query(params)
        elif method == 'update':
            result = handle_update(params)
        elif method == 'delete':
            result = handle_delete(params)
        else:
            raise ValueError(f"Unknown method: {method}")
        
        return jsonify({
            'jsonrpc': '2.0',
            'id': rpc_id,
            'result': result
        })
    except Exception as e:
        return jsonify({
            'jsonrpc': '2.0',
            'id': rpc_id,
            'error': {
                'code': -32603,
                'message': str(e)
            }
        })

def handle_create(params):
    # Your create logic
    return {'success': True, 'id': str(time.time()), 'data': params}

def handle_query(params):
    # Your query logic
    return {'success': True, 'results': []}

def handle_update(params):
    # Your update logic
    return {'success': True, 'data': params}

def handle_delete(params):
    # Your delete logic
    return {'success': True}

if __name__ == '__main__':
    app.run(port=8080)
```

## Testing MCP Integration

### 1. Start your MCP server
```bash
node mcp-server.js
# or
python mcp-server.py
```

### 2. Configure the integration
Update `.env`:
```env
MCP_SERVER_ENABLED=true
MCP_SERVER_URL=http://localhost:8080
```

### 3. Test via API
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -d '{
    "method": "query",
    "params": {
      "type": "users"
    }
  }'
```

### 4. Test via messaging platform
Send a message through WhatsApp, Telegram, Slack, or Teams:
```
"Get all active users"
```

The system will:
1. Parse your natural language request
2. Extract the intent (query, users, active)
3. Call your MCP server with the appropriate method and params
4. Return a natural language response

## Context Information

When the integration calls your MCP server, it includes context information:

```json
{
  "method": "query",
  "params": {
    "type": "users",
    "status": "active"
  },
  "context": {
    "platform": "telegram",
    "userId": "123456",
    "userName": "John Doe",
    "chatId": "987654"
  }
}
```

This context can be used for:
- User authentication
- Audit logging
- Personalization
- Access control

## Best Practices

1. **Implement proper error handling** - Return descriptive error messages
2. **Use appropriate timeouts** - Long operations should return immediately with a job ID
3. **Validate input parameters** - Check all required fields before processing
4. **Log requests** - Keep audit logs of all MCP requests
5. **Implement rate limiting** - Protect your server from abuse
6. **Use authentication** - Verify the source of requests (implement token-based auth)
7. **Version your API** - Include version in method names if needed
8. **Return consistent structures** - Use standard response formats

## Troubleshooting

### Connection Issues
- Verify MCP server is running: `curl http://localhost:8080/rpc`
- Check firewall settings
- Verify URL in `.env` is correct

### Timeout Issues
- Increase `MCP_SERVER_TIMEOUT` in `.env`
- Optimize your MCP server response time
- Consider async operations for long-running tasks

### Authentication Issues
- Implement token validation in your MCP server
- Pass tokens via headers or in the context

## Advanced Features

### Async Operations

For long-running operations:

```javascript
app.post('/rpc', async (req, res) => {
  const { id, method, params } = req.body;
  
  if (method === 'long_operation') {
    const jobId = createJob(params);
    
    res.json({
      jsonrpc: '2.0',
      id,
      result: {
        jobId,
        status: 'pending',
        checkUrl: `/jobs/${jobId}`
      }
    });
  }
});
```

### Streaming Responses

For streaming data, consider WebSocket connections or Server-Sent Events (SSE).

### Multi-tenant Support

Include tenant/organization ID in context:

```json
{
  "context": {
    "tenantId": "org_123",
    "userId": "user_456"
  }
}
```
