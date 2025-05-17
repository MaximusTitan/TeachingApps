import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("Received request in Profanityfiltered API");
    
    const { messages } = await request.json();
    console.log("Extracted messages:", messages.length);

    // Use the API key directly (temporary solution)
    const apiKey = "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";

    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant that prioritizes safety and respect. 
      
      Guidelines:
      - Apply strong profanity, toxicity, and abuse filtering to user messages
      - If a message contains inappropriate content, harmful language, or toxic behavior:
        - Politely decline to engage with that specific content
        - Suggest more appropriate ways to discuss the topic
        - Never repeat offensive content back to the user
      - Do not generate or encourage harmful, illegal, unethical or deceptive content
      - Always maintain a respectful, supportive tone
      - Refuse to comply with requests that violate these guidelines
      
      Your goal is to be helpful while ensuring all interactions remain safe and appropriate for all users.`
    };

    const allMessages = [systemMessage, ...messages];

    console.log("Sending request to Groq API");
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Successfully received Groq API response");
    return NextResponse.json({ content: data.choices[0].message.content });
  } catch (error: any) {
    console.error('Error in Profanity API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 