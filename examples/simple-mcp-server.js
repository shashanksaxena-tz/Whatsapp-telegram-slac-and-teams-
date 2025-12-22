/**
 * Simple MCP Server Example
 * This demonstrates how to create a basic MCP server that works with the integration
 */

const express = require('express');
const app = express();

app.use(express.json());

// In-memory data store for demo
const dataStore = {
  users: [],
  products: [],
  orders: [],
};

// MCP JSON-RPC endpoint
app.post('/rpc', (req, res) => {
  const { id, method, params, context } = req.body;
  
  console.log(`[MCP] Received request: ${method}`, params);
  
  try {
    let result;
    
    switch (method) {
      case 'create':
        result = handleCreate(params, context);
        break;
      case 'read':
      case 'query':
      case 'search':
        result = handleQuery(params, context);
        break;
      case 'update':
        result = handleUpdate(params, context);
        break;
      case 'delete':
        result = handleDelete(params, context);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    
    console.log(`[MCP] Sending result:`, result);
    
    res.json({
      jsonrpc: '2.0',
      id,
      result
    });
  } catch (error) {
    console.error(`[MCP] Error:`, error.message);
    
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

function handleCreate(params, context) {
  const type = params.type || 'item';
  const collection = dataStore[type + 's'] || [];
  
  const newItem = {
    id: Date.now().toString(),
    ...params,
    createdBy: context?.userId,
    createdAt: new Date().toISOString(),
  };
  
  collection.push(newItem);
  dataStore[type + 's'] = collection;
  
  return {
    success: true,
    message: `Created ${type} successfully`,
    data: newItem
  };
}

function handleQuery(params, context) {
  const type = params.type || 'item';
  const collection = dataStore[type + 's'] || [];
  
  let results = [...collection];
  
  // Simple filtering
  if (params.filter) {
    results = results.filter(item => 
      item.status === params.filter || 
      item.name?.includes(params.filter)
    );
  }
  
  if (params.id) {
    results = results.filter(item => item.id === params.id);
  }
  
  return {
    success: true,
    count: results.length,
    results: results.slice(0, 10) // Limit to 10 results
  };
}

function handleUpdate(params, context) {
  const type = params.type || 'item';
  const collection = dataStore[type + 's'] || [];
  
  const index = collection.findIndex(item => item.id === params.id);
  
  if (index === -1) {
    throw new Error(`${type} with id ${params.id} not found`);
  }
  
  const updatedItem = {
    ...collection[index],
    ...params,
    updatedBy: context?.userId,
    updatedAt: new Date().toISOString(),
  };
  
  collection[index] = updatedItem;
  
  return {
    success: true,
    message: `Updated ${type} successfully`,
    data: updatedItem
  };
}

function handleDelete(params, context) {
  const type = params.type || 'item';
  const collection = dataStore[type + 's'] || [];
  
  const index = collection.findIndex(item => item.id === params.id);
  
  if (index === -1) {
    throw new Error(`${type} with id ${params.id} not found`);
  }
  
  collection.splice(index, 1);
  
  return {
    success: true,
    message: `Deleted ${type} successfully`
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    dataStore: {
      users: dataStore.users.length,
      products: dataStore.products.length,
      orders: dataStore.orders.length,
    }
  });
});

const PORT = process.env.MCP_PORT || 8080;

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`RPC endpoint: http://localhost:${PORT}/rpc`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
