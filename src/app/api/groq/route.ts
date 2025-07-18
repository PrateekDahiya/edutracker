import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}
const client = new Groq({ apiKey: groqApiKey });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array.' }, { status: 400 });
    }
    const chatCompletion = await client.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
    });
    const content = chatCompletion.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
} 