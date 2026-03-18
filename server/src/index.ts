import express, { type Request, type Response } from "express";
import cors from "cors";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import payRouter from "./routes/pay.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize LLM Client
const config = new Config();

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Payment routes
app.use('/api/v1/pay', payRouter);

// AI Chat Stream Endpoint (SSE)
app.post('/api/v1/chat/stream', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是 Claw AI，一个专业的游戏和动漫创作助手。
你帮助用户设计角色、场景、剧情和游戏机制。
你要富有创意、详细具体、充满启发性。使用未来感、科技感的语气。
在讨论技术细节时，要精确且有帮助。
始终鼓励创意，提供可操作的建议。
请使用中文回复用户。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ];

    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        const content = chunk.content.toString();
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({ error: '处理消息失败' })}\n\n`);
    res.end();
  }
});

// Non-streaming chat endpoint (fallback)
app.post('/api/v1/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是 Claw AI，一个专业的游戏和动漫创作助手。
你帮助用户设计角色、场景、剧情和游戏机制。
你要富有创意、详细具体、充满启发性。使用未来感、科技感的语气。
请使用中文回复用户。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    res.json({ content: response.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: '处理消息失败' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
