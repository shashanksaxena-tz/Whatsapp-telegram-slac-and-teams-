
import { TeamsAdapter } from './teams-adapter';
import { BotFrameworkAdapter, TurnContext, ActivityTypes } from 'botbuilder';
import express, { Request, Response } from 'express';

// Mock dependencies
jest.mock('botbuilder');
jest.mock('express');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TeamsAdapter', () => {
  let adapter: TeamsAdapter;
  let mockBotAdapter: any;
  let mockApp: any;

  beforeEach(() => {
    mockBotAdapter = {
      onTurnError: null,
      processActivity: jest.fn(),
      continueConversation: jest.fn(),
    };
    (BotFrameworkAdapter as any).mockImplementation(() => mockBotAdapter);

    mockApp = {
      post: jest.fn(),
    };

    adapter = new TeamsAdapter('test-app-id', 'test-app-password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should store conversation reference and send message', async () => {
    // 1. Initialize
    await adapter.initialize();

    // 2. Setup endpoint
    adapter.setupEndpoint(mockApp);
    expect(mockApp.post).toHaveBeenCalledWith('/api/teams/messages', expect.any(Function));

    // Get the route handler
    const routeHandler = mockApp.post.mock.calls[0][1];

    // 3. Simulate incoming message
    const mockReq = {} as Request;
    const mockRes = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;

    const chatId = 'test-chat-id';
    const conversationRef = { conversation: { id: chatId }, serviceUrl: 'http://test' };

    // Mock TurnContext.getConversationReference
    (TurnContext.getConversationReference as jest.Mock).mockReturnValue(conversationRef);

    // Mock processActivity implementation to immediately call the logic
    mockBotAdapter.processActivity.mockImplementation(async (req: any, res: any, logic: any) => {
        const mockContext = {
            activity: {
                type: ActivityTypes.Message,
                conversation: { id: chatId },
                text: 'Hello',
                from: { id: 'user1', name: 'User 1' },
                channelId: 'teams'
            }
        };
        await logic(mockContext);
    });

    // Execute route handler
    await routeHandler(mockReq, mockRes);

    // Verify processActivity was called
    expect(mockBotAdapter.processActivity).toHaveBeenCalled();

    // 4. Send message
    await adapter.sendMessage(chatId, 'Response message');

    // 5. Verify continueConversation was called with correct reference
    expect(mockBotAdapter.continueConversation).toHaveBeenCalledWith(
        conversationRef,
        expect.any(Function)
    );

    // Verify the inner logic of continueConversation
    const continueLogic = mockBotAdapter.continueConversation.mock.calls[0][1];
    const mockContext = { sendActivity: jest.fn() };
    await continueLogic(mockContext);
    expect(mockContext.sendActivity).toHaveBeenCalledWith('Response message');
  });

  test('should throw error if conversation reference not found', async () => {
      await adapter.initialize();
      await expect(adapter.sendMessage('unknown-chat-id', 'test')).rejects.toThrow('No conversation reference found');
  });
});
