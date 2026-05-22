import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt } from '@/lib/gemini';
import type { ChatMessage, LocationContext } from '@/lib/gemini';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as {
      messages: ChatMessage[];
      locationContext?: LocationContext;
    };

    const { messages, locationContext } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(locationContext),
    });

    // Filter: only include user messages in history, exclude the assistant welcome message
    // Gemini chat history must alternate user/model and start with user
    // Exclude last message (that's what we're sending now)
    const priorMessages = messages.slice(0, -1);
    
    // Build valid history: only include pairs where user came before assistant
    // Drop leading assistant messages (e.g. welcome message)
    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const m of priorMessages) {
      // Skip assistant-only leading messages
      if (history.length === 0 && m.role === 'assistant') continue;
      history.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      });
    }

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });

    // Use streaming
    const streamResult = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('[chat/route] Stream error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[chat/route] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
