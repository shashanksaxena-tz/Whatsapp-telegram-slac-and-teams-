# MCP Extension & Advanced Integration Guide

## Overview

This guide provides advanced patterns and extension strategies for integrating Model Context Protocol (MCP) servers with the Multi-Platform AI Integration System. It goes beyond the basics to show how to build sophisticated, production-grade integrations.

---

## Table of Contents

1. [Advanced MCP Patterns](#advanced-mcp-patterns)
2. [Custom MCP Servers](#custom-mcp-servers)
3. [Multi-Server Architecture](#multi-server-architecture)
4. [Authentication & Security](#authentication--security)
5. [Performance Optimization](#performance-optimization)
6. [Real-World Integration Examples](#real-world-integration-examples)
7. [Monitoring & Observability](#monitoring--observability)
8. [Error Handling & Resilience](#error-handling--resilience)

---

## Advanced MCP Patterns

### 1. Streaming Responses

For long-running operations, implement streaming:

```typescript
// MCP Server with Streaming Support
class StreamingMCPServer {
  async handleRequest(req: MCPRequest): Promise<void> {
    const { method, params, context } = req;
    
    if (method === 'generate_report') {
      // Send immediate acknowledgment
      this.sendResponse(req.id, {
        status: 'processing',
        jobId: 'job-123',
        streamUrl: '/stream/job-123'
      });
      
      // Process in background
      this.processReportAsync(params, context, 'job-123');
    }
  }
  
  private async processReportAsync(
    params: any, 
    context: any, 
    jobId: string
  ): Promise<void> {
    const chunks = await this.generateReportChunks(params);
    
    for (const chunk of chunks) {
      // Stream each chunk
      await this.streamToClient(jobId, {
        type: 'chunk',
        data: chunk,
        progress: chunk.progress
      });
    }
    
    // Send completion
    await this.streamToClient(jobId, {
      type: 'complete',
      data: { success: true }
    });
  }
}
```

### 2. Batch Operations

Handle multiple operations efficiently:

```typescript
// MCP Client with Batch Support
class BatchMCPClient extends MCPClientImpl {
  private batchQueue: MCPRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  async requestBatch(request: MCPRequest): Promise<void> {
    this.batchQueue.push(request);
    
    if (this.batchQueue.length >= 10) {
      await this.flushBatch();
    } else if (!this.batchTimer) {
      // Auto-flush after 100ms
      this.batchTimer = setTimeout(() => this.flushBatch(), 100);
    }
  }
  
  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;
    
    // Send batched request
    await this.client.post('/rpc/batch', {
      jsonrpc: '2.0',
      requests: batch.map((req, idx) => ({
        id: `batch-${idx}`,
        method: req.method,
        params: req.params
      }))
    });
  }
}
```

### 3. Caching Layer

Implement intelligent caching:

```typescript
interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Max cache size
  strategy: 'LRU' | 'LFU' | 'FIFO';
}

class CachedMCPClient extends MCPClientImpl {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  
  constructor(config: CacheConfig) {
    super();
    this.config = config;
  }
  
  async request(req: MCPRequest): Promise<MCPResponse> {
    const cacheKey = this.generateCacheKey(req);
    
    // Check cache for read operations
    if (this.isReadOperation(req.method)) {
      const cached = this.cache.get(cacheKey);
      
      if (cached && !this.isExpired(cached)) {
        logger.debug('Cache hit:', cacheKey);
        return cached.data;
      }
    }
    
    // Execute request
    const response = await super.request(req);
    
    // Cache successful read operations
    if (response.success && this.isReadOperation(req.method)) {
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
        ttl: this.config.ttl
      });
      
      this.evictIfNeeded();
    }
    
    return response;
  }
  
  private generateCacheKey(req: MCPRequest): string {
    return `${req.method}:${JSON.stringify(req.params)}`;
  }
  
  private isReadOperation(method: string): boolean {
    return ['read', 'query', 'search', 'get'].includes(method);
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }
  
  private evictIfNeeded(): void {
    if (this.cache.size > this.config.maxSize) {
      // Implement eviction strategy (LRU example)
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      
      this.cache.delete(oldest[0]);
    }
  }
}
```

---

## Custom MCP Servers

### Database Integration Server

```typescript
import { Pool } from 'pg';
import express from 'express';

class DatabaseMCPServer {
  private db: Pool;
  private app: express.Application;
  
  constructor(dbConfig: any) {
    this.db = new Pool(dbConfig);
    this.app = express();
    this.setupRoutes();
  }
  
  private setupRoutes(): void {
    this.app.use(express.json());
    
    this.app.post('/rpc', async (req, res) => {
      const { id, method, params } = req.body;
      
      try {
        let result;
        
        switch (method) {
          case 'query':
            result = await this.handleQuery(params);
            break;
          case 'create':
            result = await this.handleCreate(params);
            break;
          case 'update':
            result = await this.handleUpdate(params);
            break;
          case 'delete':
            result = await this.handleDelete(params);
            break;
          default:
            throw new Error(`Unknown method: ${method}`);
        }
        
        res.json({
          jsonrpc: '2.0',
          id,
          result
        });
      } catch (error: any) {
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
  }
  
  private async handleQuery(params: any): Promise<any> {
    const { table, filters, limit = 100 } = params;
    
    // Build query dynamically
    const conditions = Object.entries(filters || {})
      .map(([key, value], idx) => `${key} = $${idx + 1}`)
      .join(' AND ');
    
    const query = `
      SELECT * FROM ${table}
      ${conditions ? `WHERE ${conditions}` : ''}
      LIMIT $${Object.keys(filters || {}).length + 1}
    `;
    
    const values = [...Object.values(filters || {}), limit];
    const result = await this.db.query(query, values);
    
    return {
      success: true,
      count: result.rowCount,
      data: result.rows
    };
  }
  
  private async handleCreate(params: any): Promise<any> {
    const { table, data } = params;
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    
    return {
      success: true,
      data: result.rows[0]
    };
  }
  
  private async handleUpdate(params: any): Promise<any> {
    const { table, data, where } = params;
    
    const setClause = Object.entries(data)
      .map(([key, value], idx) => `${key} = $${idx + 1}`)
      .join(', ');
    
    const whereClause = Object.entries(where)
      .map(([key, value], idx) => `${key} = $${Object.keys(data).length + idx + 1}`)
      .join(' AND ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;
    
    const values = [...Object.values(data), ...Object.values(where)];
    const result = await this.db.query(query, values);
    
    return {
      success: true,
      data: result.rows[0]
    };
  }
  
  private async handleDelete(params: any): Promise<any> {
    const { table, where } = params;
    
    const whereClause = Object.entries(where)
      .map(([key, value], idx) => `${key} = $${idx + 1}`)
      .join(' AND ');
    
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    const values = Object.values(where);
    
    await this.db.query(query, values);
    
    return { success: true };
  }
  
  start(port: number): void {
    this.app.listen(port, () => {
      console.log(`Database MCP Server running on port ${port}`);
    });
  }
}

// Usage
const server = new DatabaseMCPServer({
  host: 'localhost',
  database: 'myapp',
  user: 'admin',
  password: 'secret'
});

server.start(8080);
```

### REST API Wrapper Server

```typescript
import axios from 'axios';

class RESTAPIWrapperMCPServer {
  private baseURL: string;
  private apiKey: string;
  
  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }
  
  async handleRequest(method: string, params: any): Promise<any> {
    const endpoint = this.resolveEndpoint(method, params);
    const httpMethod = this.resolveHTTPMethod(method);
    
    try {
      const response = await axios({
        method: httpMethod,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: httpMethod !== 'GET' ? params : undefined,
        params: httpMethod === 'GET' ? params : undefined
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private resolveEndpoint(method: string, params: any): string {
    const { type, id } = params;
    
    switch (method) {
      case 'read':
        return `/${type}/${id}`;
      case 'query':
        return `/${type}`;
      case 'create':
        return `/${type}`;
      case 'update':
        return `/${type}/${id}`;
      case 'delete':
        return `/${type}/${id}`;
      default:
        return `/${type}`;
    }
  }
  
  private resolveHTTPMethod(method: string): string {
    const mapping: Record<string, string> = {
      'read': 'GET',
      'query': 'GET',
      'search': 'GET',
      'create': 'POST',
      'update': 'PUT',
      'delete': 'DELETE'
    };
    
    return mapping[method] || 'POST';
  }
}
```

---

## Multi-Server Architecture

### Server Registry Pattern

```typescript
interface ServerConfig {
  url: string;
  priority: number;
  capabilities: string[];
  healthCheckInterval: number;
}

class MCPServerRegistry {
  private servers: Map<string, ServerConfig> = new Map();
  private clients: Map<string, MCPClientImpl> = new Map();
  
  registerServer(name: string, config: ServerConfig): void {
    this.servers.set(name, config);
    
    const client = new MCPClientImpl(config.healthCheckInterval);
    client.connect(config.url);
    this.clients.set(name, client);
    
    // Start health checks
    this.startHealthCheck(name, config);
  }
  
  async routeRequest(method: string, params: any): Promise<MCPResponse> {
    // Find capable servers
    const capableServers = Array.from(this.servers.entries())
      .filter(([name, config]) => config.capabilities.includes(method))
      .sort((a, b) => b[1].priority - a[1].priority);
    
    if (capableServers.length === 0) {
      throw new Error(`No server capable of handling method: ${method}`);
    }
    
    // Try servers in priority order
    for (const [name, config] of capableServers) {
      try {
        const client = this.clients.get(name);
        if (!client) continue;
        
        const response = await client.request({ method, params });
        
        if (response.success) {
          return response;
        }
      } catch (error) {
        logger.warn(`Server ${name} failed, trying next...`);
      }
    }
    
    throw new Error('All capable servers failed');
  }
  
  private startHealthCheck(name: string, config: ServerConfig): void {
    setInterval(async () => {
      try {
        const client = this.clients.get(name);
        await client?.request({ method: 'health', params: {} });
      } catch (error) {
        logger.error(`Health check failed for ${name}`);
      }
    }, config.healthCheckInterval);
  }
}

// Usage
const registry = new MCPServerRegistry();

registry.registerServer('database', {
  url: 'http://localhost:8080',
  priority: 10,
  capabilities: ['query', 'create', 'update', 'delete'],
  healthCheckInterval: 30000
});

registry.registerServer('analytics', {
  url: 'http://localhost:8081',
  priority: 5,
  capabilities: ['analyze', 'report', 'visualize'],
  healthCheckInterval: 60000
});

// Route requests intelligently
await registry.routeRequest('query', { type: 'users' }); // Goes to database
await registry.routeRequest('analyze', { metric: 'sales' }); // Goes to analytics
```

---

## Authentication & Security

### JWT-Based Authentication

```typescript
import jwt from 'jsonwebtoken';

class SecureMCPServer {
  private jwtSecret: string;
  
  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }
  
  private verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  }
  
  async handleRequest(req: any, res: any): Promise<void> {
    // Extract token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: -32001,
          message: 'Authentication required'
        }
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = this.verifyToken(token);
      
      // Check permissions
      if (!this.hasPermission(payload, req.body.method)) {
        return res.status(403).json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32002,
            message: 'Permission denied'
          }
        });
      }
      
      // Process request with user context
      const result = await this.processRequest(req.body, payload);
      
      res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result
      });
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: -32603,
          message: error.message
        }
      });
    }
  }
  
  private hasPermission(user: any, method: string): boolean {
    const permissions = user.permissions || [];
    
    // Check if user has required permission
    const requiredPermission = this.getRequiredPermission(method);
    return permissions.includes(requiredPermission) || permissions.includes('admin');
  }
  
  private getRequiredPermission(method: string): string {
    const mapping: Record<string, string> = {
      'create': 'write',
      'update': 'write',
      'delete': 'delete',
      'read': 'read',
      'query': 'read'
    };
    
    return mapping[method] || 'read';
  }
}
```

### Rate Limiting

```typescript
interface RateLimit {
  maxRequests: number;
  windowMs: number;
}

class RateLimitedMCPServer {
  private requestCounts: Map<string, number[]> = new Map();
  private rateLimit: RateLimit;
  
  constructor(rateLimit: RateLimit) {
    this.rateLimit = rateLimit;
  }
  
  async handleRequest(req: any, res: any): Promise<void> {
    const clientId = this.getClientId(req);
    
    if (!this.checkRateLimit(clientId)) {
      return res.status(429).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: {
          code: -32003,
          message: 'Rate limit exceeded'
        }
      });
    }
    
    this.recordRequest(clientId);
    
    // Process request...
  }
  
  private getClientId(req: any): string {
    // Use JWT subject, IP address, or API key
    return req.ip || req.headers['x-client-id'] || 'anonymous';
  }
  
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.rateLimit.windowMs;
    
    const requests = this.requestCounts.get(clientId) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return recentRequests.length < this.rateLimit.maxRequests;
  }
  
  private recordRequest(clientId: string): void {
    const now = Date.now();
    const requests = this.requestCounts.get(clientId) || [];
    
    requests.push(now);
    this.requestCounts.set(clientId, requests);
    
    // Cleanup old entries
    this.cleanup();
  }
  
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.rateLimit.windowMs;
    
    for (const [clientId, requests] of this.requestCounts.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (recentRequests.length === 0) {
        this.requestCounts.delete(clientId);
      } else {
        this.requestCounts.set(clientId, recentRequests);
      }
    }
  }
}
```

---

## Performance Optimization

### Connection Pooling

```typescript
class PooledMCPClient {
  private pool: MCPClientImpl[] = [];
  private available: MCPClientImpl[] = [];
  private poolSize: number;
  
  constructor(url: string, poolSize: number = 5) {
    this.poolSize = poolSize;
    
    for (let i = 0; i < poolSize; i++) {
      const client = new MCPClientImpl();
      client.connect(url);
      this.pool.push(client);
      this.available.push(client);
    }
  }
  
  async request(req: MCPRequest): Promise<MCPResponse> {
    const client = await this.acquire();
    
    try {
      return await client.request(req);
    } finally {
      this.release(client);
    }
  }
  
  private async acquire(): Promise<MCPClientImpl> {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    
    // Wait for a client to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(checkInterval);
          resolve(this.available.pop()!);
        }
      }, 100);
    });
  }
  
  private release(client: MCPClientImpl): void {
    this.available.push(client);
  }
}
```

### Request Compression

```typescript
import zlib from 'zlib';

class CompressedMCPClient extends MCPClientImpl {
  async request(req: MCPRequest): Promise<MCPResponse> {
    // Compress large payloads
    const payload = JSON.stringify(req);
    
    if (payload.length > 1024) {
      const compressed = await this.compress(payload);
      
      const response = await this.client.post('/rpc', compressed, {
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    }
    
    return super.request(req);
  }
  
  private compress(data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data), (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}
```

---

## Real-World Integration Examples

### Shopify Integration

```typescript
class ShopifyMCPServer {
  private shopifyAPI: any;
  
  async handleRequest(method: string, params: any): Promise<any> {
    switch (method) {
      case 'query':
        return await this.queryProducts(params);
      case 'create':
        return await this.createOrder(params);
      case 'update':
        return await this.updateInventory(params);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
  
  private async queryProducts(params: any): Promise<any> {
    const { query, limit = 50 } = params;
    
    const products = await this.shopifyAPI.product.list({
      title: query,
      limit
    });
    
    return {
      success: true,
      data: products.map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.variants[0].price,
        inventory: p.variants[0].inventory_quantity
      }))
    };
  }
  
  private async createOrder(params: any): Promise<any> {
    const { customer_id, line_items } = params;
    
    const order = await this.shopifyAPI.order.create({
      customer: { id: customer_id },
      line_items
    });
    
    return {
      success: true,
      data: {
        order_id: order.id,
        order_number: order.order_number,
        total: order.total_price
      }
    };
  }
  
  private async updateInventory(params: any): Promise<any> {
    const { product_id, quantity } = params;
    
    await this.shopifyAPI.inventoryLevel.adjust({
      inventory_item_id: product_id,
      available_adjustment: quantity
    });
    
    return { success: true };
  }
}
```

### Salesforce Integration

```typescript
class SalesforceMCPServer {
  private sfConnection: any;
  
  async handleRequest(method: string, params: any): Promise<any> {
    switch (method) {
      case 'query':
        return await this.queryRecords(params);
      case 'create':
        return await this.createRecord(params);
      case 'update':
        return await this.updateRecord(params);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
  
  private async queryRecords(params: any): Promise<any> {
    const { object, filters } = params;
    
    const soql = this.buildSOQL(object, filters);
    const result = await this.sfConnection.query(soql);
    
    return {
      success: true,
      count: result.totalSize,
      data: result.records
    };
  }
  
  private buildSOQL(object: string, filters: any): string {
    const conditions = Object.entries(filters || {})
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ');
    
    return `SELECT * FROM ${object} ${conditions ? `WHERE ${conditions}` : ''}`;
  }
  
  private async createRecord(params: any): Promise<any> {
    const { object, data } = params;
    
    const result = await this.sfConnection.sobject(object).create(data);
    
    return {
      success: result.success,
      data: { id: result.id }
    };
  }
  
  private async updateRecord(params: any): Promise<any> {
    const { object, id, data } = params;
    
    const result = await this.sfConnection.sobject(object).update({
      Id: id,
      ...data
    });
    
    return { success: result.success };
  }
}
```

---

## Monitoring & Observability

### Metrics Collection

```typescript
interface Metrics {
  requests: number;
  successes: number;
  failures: number;
  avgLatency: number;
  errorRate: number;
}

class MonitoredMCPClient extends MCPClientImpl {
  private metrics: Metrics = {
    requests: 0,
    successes: 0,
    failures: 0,
    avgLatency: 0,
    errorRate: 0
  };
  
  async request(req: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    this.metrics.requests++;
    
    try {
      const response = await super.request(req);
      
      if (response.success) {
        this.metrics.successes++;
      } else {
        this.metrics.failures++;
      }
      
      this.updateLatency(Date.now() - startTime);
      this.updateErrorRate();
      
      return response;
    } catch (error) {
      this.metrics.failures++;
      this.updateErrorRate();
      throw error;
    }
  }
  
  private updateLatency(latency: number): void {
    this.metrics.avgLatency = 
      (this.metrics.avgLatency * (this.metrics.requests - 1) + latency) / 
      this.metrics.requests;
  }
  
  private updateErrorRate(): void {
    this.metrics.errorRate = 
      this.metrics.failures / this.metrics.requests;
  }
  
  getMetrics(): Metrics {
    return { ...this.metrics };
  }
}
```

---

## Error Handling & Resilience

### Circuit Breaker Pattern

```typescript
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

class CircuitBreakerMCPClient extends MCPClientImpl {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private failureThreshold: number = 5;
  private resetTimeout: number = 60000; // 60 seconds
  
  async request(req: MCPRequest): Promise<MCPResponse> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const response = await super.request(req);
      
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
      
      return response;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }
  
  private handleFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.error('Circuit breaker opened due to excessive failures');
    }
  }
}
```

---

## Conclusion

This guide provides advanced patterns and real-world examples for extending and integrating MCP servers. Use these patterns to build robust, scalable, and production-ready integrations.

For more information, see:
- [Agentic Flows Documentation](AGENTIC_FLOWS.md)
- [MCP Integration Guide](MCP_INTEGRATION.md)
- [Next Steps & Roadmap](NEXT_STEPS_AND_ROADMAP.md)
