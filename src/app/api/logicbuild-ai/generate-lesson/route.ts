import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { bossName, levelId, difficultyLevel } = await request.json();

    // Validate required parameters
    if (!bossName || !levelId || !difficultyLevel) {
      return NextResponse.json(
        { error: 'Missing required parameters: bossName, levelId, or difficultyLevel' },
        { status: 400 }
      );
    }

    // Get Groq API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("Groq API key is missing in environment variables");
    }

    // Construct prompt based on parameters
    const prompt = `
      You are an educational content creator for elementary school students (grades 1-4).
      Create a short, engaging lesson about ${bossName} concepts suitable for a ${difficultyLevel} level.
      
      This is for level ${levelId} of the ${bossName} section in a game called LogicBuild.
      
      The content should:
      - Be appropriate for grades 1-4
      - Be fun and engaging with simple language
      - Include 3 practical examples that children can understand
      - Be tailored to the ${difficultyLevel} difficulty level
      
      Format your response as a JSON object with the following structure:
      {
        "title": "A catchy title for the lesson",
        "content": "The main content of the lesson (2-3 paragraphs, simple language)",
        "examples": ["Example 1", "Example 2", "Example 3"]
      }
      
      Only return valid JSON. Do not include any other text.
    `;

    // Prepare the request to Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an AI specialized in creating educational content for children in grades 1-4.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      throw new Error(`Groq API error: ${JSON.stringify(errorData)}`);
    }

    const groqData = await groqResponse.json();
    const response = JSON.parse(groqData.choices[0].message.content);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating lesson content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate lesson content" },
      { status: 500 }
    );
  }
} 