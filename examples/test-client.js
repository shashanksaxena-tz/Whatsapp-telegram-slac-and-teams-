#!/usr/bin/env node

/**
 * Test Client for the Multi-Platform AI Integration
 * Usage: node test-client.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_SECRET_KEY || 'your_secret_key_here';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function testHealth() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check:', response.data);
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
  }
}

async function testPlatforms() {
  console.log('\n=== Testing Platform Status ===');
  try {
    const response = await client.get('/api/platforms');
    console.log('✓ Platforms:', response.data);
  } catch (error) {
    console.error('✗ Platforms check failed:', error.message);
  }
}

async function testMCPRequest() {
  console.log('\n=== Testing MCP Request ===');
  try {
    const response = await client.post('/api/mcp', {
      method: 'query',
      params: {
        type: 'users',
        filter: 'active'
      }
    });
    console.log('✓ MCP Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('✗ MCP request failed:', error.response?.data || error.message);
  }
}

async function testCreateRequest() {
  console.log('\n=== Testing Create Request ===');
  try {
    const response = await client.post('/api/mcp', {
      method: 'create',
      params: {
        type: 'user',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active'
      }
    });
    console.log('✓ Create Response:', JSON.stringify(response.data, null, 2));
    return response.data.data?.id;
  } catch (error) {
    console.error('✗ Create request failed:', error.response?.data || error.message);
  }
}

async function testUpdateRequest(id) {
  if (!id) {
    console.log('\n=== Skipping Update Request (no ID) ===');
    return;
  }
  
  console.log('\n=== Testing Update Request ===');
  try {
    const response = await client.post('/api/mcp', {
      method: 'update',
      params: {
        type: 'user',
        id: id,
        name: 'John Doe Updated',
        status: 'inactive'
      }
    });
    console.log('✓ Update Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('✗ Update request failed:', error.response?.data || error.message);
  }
}

async function testDeleteRequest(id) {
  if (!id) {
    console.log('\n=== Skipping Delete Request (no ID) ===');
    return;
  }
  
  console.log('\n=== Testing Delete Request ===');
  try {
    const response = await client.post('/api/mcp', {
      method: 'delete',
      params: {
        type: 'user',
        id: id
      }
    });
    console.log('✓ Delete Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('✗ Delete request failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('Starting API Tests...');
  console.log('Base URL:', BASE_URL);
  
  await testHealth();
  await testPlatforms();
  
  const createdId = await testCreateRequest();
  await testMCPRequest();
  await testUpdateRequest(createdId);
  await testDeleteRequest(createdId);
  
  console.log('\n=== All Tests Complete ===\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
