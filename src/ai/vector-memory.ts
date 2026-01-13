import { ChromaClient, Collection } from 'chromadb';
import { logger } from '../utils/logger';

export interface MemoryDocument {
  id: string;
  text: string;
  metadata: {
    userId: string;
    platform: string;
    timestamp: number;
    conversationId?: string;
    intent?: string;
    [key: string]: any;
  };
}

export interface QueryResult {
  id: string;
  text: string;
  metadata: any;
  distance: number;
  similarity: number;
}

/**
 * Vector database service for long-term memory and RAG
 * Uses ChromaDB for local vector storage
 */
export class VectorMemoryService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string;
  private isInitialized: boolean = false;

  constructor(
    collectionName: string = 'conversation_memory',
    chromaUrl?: string
  ) {
    this.collectionName = collectionName;
    this.client = new ChromaClient({
      path: chromaUrl || 'http://localhost:8000'
    });
  }

  /**
   * Initialize the vector database collection
   */
  async initialize(): Promise<void> {
    try {
      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          'hnsw:space': 'cosine', // Use cosine similarity
          description: 'Conversation memory for AI agent'
        }
      });

      this.isInitialized = true;
      logger.info(`Vector memory service initialized with collection: ${this.collectionName}`);
    } catch (error) {
      logger.error('Failed to initialize vector memory service:', error);
      throw error;
    }
  }

  /**
   * Store a conversation message in vector database
   */
  async storeMessage(document: MemoryDocument): Promise<void> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      await this.collection.add({
        ids: [document.id],
        documents: [document.text],
        metadatas: [document.metadata]
      });

      logger.debug(`Stored message in vector DB: ${document.id}`);
    } catch (error) {
      logger.error('Failed to store message in vector DB:', error);
      throw error;
    }
  }

  /**
   * Store multiple messages in batch
   */
  async storeBatch(documents: MemoryDocument[]): Promise<void> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      await this.collection.add({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.text),
        metadatas: documents.map(d => d.metadata)
      });

      logger.info(`Stored ${documents.length} messages in vector DB`);
    } catch (error) {
      logger.error('Failed to store batch in vector DB:', error);
      throw error;
    }
  }

  /**
   * Query similar conversations from memory
   */
  async queryMemory(
    queryText: string,
    options: {
      nResults?: number;
      userId?: string;
      platform?: string;
      conversationId?: string;
      minSimilarity?: number;
    } = {}
  ): Promise<QueryResult[]> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    const {
      nResults = 5,
      userId,
      platform,
      conversationId,
      minSimilarity = 0.7
    } = options;

    try {
      // Build where filter
      const where: any = {};
      if (userId) where.userId = userId;
      if (platform) where.platform = platform;
      if (conversationId) where.conversationId = conversationId;

      const results = await this.collection.query({
        queryTexts: [queryText],
        nResults,
        where: Object.keys(where).length > 0 ? where : undefined
      });

      // Process and filter results
      const queryResults: QueryResult[] = [];
      
      if (results.ids && results.ids[0] && results.documents && results.documents[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const distance = results.distances?.[0]?.[i] ?? 1;
          const similarity = 1 - distance; // Convert distance to similarity

          // Filter by minimum similarity
          if (similarity >= minSimilarity) {
            queryResults.push({
              id: results.ids[0][i],
              text: results.documents[0][i] as string,
              metadata: results.metadatas?.[0]?.[i] || {},
              distance,
              similarity
            });
          }
        }
      }

      logger.debug(`Memory query returned ${queryResults.length} results`);
      return queryResults;
    } catch (error) {
      logger.error('Failed to query memory:', error);
      throw error;
    }
  }

  /**
   * Get conversation context from memory
   */
  async getConversationContext(
    currentMessage: string,
    userId: string,
    platform: string,
    maxResults: number = 3
  ): Promise<{
    relevantMemories: QueryResult[];
    contextText: string;
  }> {
    const memories = await this.queryMemory(currentMessage, {
      nResults: maxResults,
      userId,
      platform,
      minSimilarity: 0.6
    });

    // Build context text from relevant memories
    const contextText = memories
      .map(m => `[${new Date(m.metadata.timestamp).toLocaleString()}] ${m.text}`)
      .join('\n\n');

    return {
      relevantMemories: memories,
      contextText
    };
  }

  /**
   * Retrieve user's conversation history
   */
  async getUserHistory(
    userId: string,
    platform?: string,
    limit: number = 50
  ): Promise<QueryResult[]> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      const where: any = { userId };
      if (platform) where.platform = platform;

      const results = await this.collection.get({
        where,
        limit
      });

      const history: QueryResult[] = [];
      
      if (results.ids && results.documents) {
        for (let i = 0; i < results.ids.length; i++) {
          history.push({
            id: results.ids[i],
            text: results.documents[i] as string,
            metadata: results.metadatas?.[i] || {},
            distance: 0,
            similarity: 1
          });
        }
      }

      // Sort by timestamp
      history.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);

      return history;
    } catch (error) {
      logger.error('Failed to retrieve user history:', error);
      throw error;
    }
  }

  /**
   * Delete old memories (cleanup)
   * Note: For large datasets, consider using a more efficient approach
   * such as partitioning by date or using database-level retention policies
   */
  async deleteOldMemories(olderThanDays: number = 90): Promise<number> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      const cutoffTimestamp = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

      // Note: This approach fetches all documents which is inefficient for large datasets
      // Consider implementing batch processing or using a more efficient filter strategy
      // For production, implement pagination or use external cleanup job
      const allDocs = await this.collection.get({});
      
      const idsToDelete: string[] = [];
      if (allDocs.ids && allDocs.metadatas) {
        for (let i = 0; i < allDocs.ids.length; i++) {
          const metadata = allDocs.metadatas[i] as any;
          if (metadata.timestamp < cutoffTimestamp) {
            idsToDelete.push(allDocs.ids[i]);
          }
        }
      }

      if (idsToDelete.length > 0) {
        // Process in batches to avoid overwhelming the database
        const batchSize = 100;
        let deleted = 0;
        
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize);
          await this.collection.delete({ ids: batch });
          deleted += batch.length;
        }
        
        logger.info(`Deleted ${deleted} old memories`);
        return deleted;
      }

      return 0;
    } catch (error) {
      logger.error('Failed to delete old memories:', error);
      throw error;
    }
  }

  /**
   * Delete user's memories
   */
  async deleteUserMemories(userId: string): Promise<void> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      await this.collection.delete({
        where: { userId }
      });
      logger.info(`Deleted memories for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to delete user memories:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    collectionName: string;
  }> {
    if (!this.isInitialized || !this.collection) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      const count = await this.collection.count();
      
      return {
        totalDocuments: count,
        collectionName: this.collectionName
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Reset the collection (delete all data)
   */
  async reset(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector memory service not initialized');
    }

    try {
      await this.client.deleteCollection({ name: this.collectionName });
      await this.initialize();
      logger.info('Vector memory collection reset');
    } catch (error) {
      logger.error('Failed to reset collection:', error);
      throw error;
    }
  }
}
