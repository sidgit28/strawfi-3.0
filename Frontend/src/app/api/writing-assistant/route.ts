import { NextResponse } from 'next/server';

const DEEPSEEK_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Prompts for the writing assistant
const prompts = {
  outline: "Create a detailed research outline for the following topic: {title}",
  improve: "Improve the following text for clarity, conciseness, and academic tone. Return only the improved text: {content}",
  citations: "Suggest 3-5 relevant tags or keywords for the following research topic or content. Return them as a comma-separated list: {type}",
  summary: "Summarize the key points of the following research section in 2-3 sentences: {content}",
  grammar: "Fix all grammar and spelling mistakes in the following text. Return only the corrected text: {content}"
};

type PromptKey = keyof typeof prompts;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promptType, content, title, type } = body as { promptType: PromptKey; content?: string; title?: string; type?: string };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    if (!prompts[promptType]) {
      return NextResponse.json({ error: 'Invalid prompt type' }, { status: 400 });
    }

    // Construct the user message from the prompt template
    let userMessage = prompts[promptType];
    if (content) userMessage = userMessage.replace('{content}', content);
    if (title) userMessage = userMessage.replace('{title}', title);
    if (type) userMessage = userMessage.replace('{type}', type);
    
    const systemMessage = `You are an expert research writing assistant. Your goal is to help users draft, refine, and structure their research notes and analysis. Provide clear, concise, and high-quality responses based on the user's specific request.`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fintech-multiverse.vercel.app/', // Replace with your app's URL
        'X-Title': 'Research Memory Assistant' // Replace with your app's title
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1', // Using the specified model
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.6,
        max_tokens: 1024,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in writing assistant API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
} 