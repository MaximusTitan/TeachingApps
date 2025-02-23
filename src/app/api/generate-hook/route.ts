import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY environment variable');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, objective, ageGroup, hookType } = await req.json();

    if (!topic || !objective || !ageGroup || !hookType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = HOOK_TEMPLATES[hookType as keyof typeof HOOK_TEMPLATES]
      .replace('{topic}', topic)
      .replace('{objective}', objective)
      .replace('{ageGroup}', ageGroup);

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an experienced teacher who creates engaging lesson hooks."
          },
          {
            role: "user",
            content: template
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 2048,
      });

      return NextResponse.json({ 
        hook: completion.choices[0]?.message?.content || 'No response generated'
      });

    } catch (groqError) {
      console.error('GROQ API Error:', groqError);
      return NextResponse.json(
        { error: 'Failed to generate hook from GROQ' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request Error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

const HOOK_TEMPLATES = {
  'Story-based Hook': `Create an engaging story hook for teaching {topic} to {ageGroup} students that achieves {objective}. 
                      The story should be brief, relatable, and spark curiosity.`,
  
  'Thought-provoking Question': `Generate a thought-provoking question about {topic} that will make {ageGroup} students think deeply 
                                and connect with the objective: {objective}. The question should challenge assumptions and encourage discussion.`,
  
  'Real-world Connection': `Create a real-world connection for {topic} that {ageGroup} students can relate to, 
                           showing how it applies to their daily lives while addressing {objective}.`,
  
  'Fun Fact or Riddle': `Generate an interesting fun fact or riddle about {topic} that will capture {ageGroup} students' attention 
                         and lead into learning about {objective}.`,
  
  'Visual or Video Suggestion': `Suggest a specific visual aid or short video concept about {topic} that would grab {ageGroup} students' attention. 
                                Include a description of what it shows and how it connects to {objective}.`,
  
  'Role Play or Scenario-based Hook': `Design a brief role-play scenario about {topic} that {ageGroup} students can act out or discuss,
                                      making it engaging while working toward {objective}.`
}
