import { NextResponse } from 'next/server';

const DEEPSEEK_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, persona } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('API Key missing:', process.env);
      throw new Error('OpenRouter API key not configured');
    }

    const systemMessage = `You are a financial advisor AI assistant specialized in helping ${persona} investors. 
    Your responses should be tailored to the ${persona} investment style and preferences. 
    Provide clear, concise, and actionable financial advice while maintaining a professional yet approachable tone.
    Focus on giving practical investment advice that aligns with the ${persona}'s risk tolerance and investment goals.`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fintech-multiverse.vercel.app/',
        'X-Title': 'Financial Multiverse'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);
      throw new Error(`OpenRouter API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 