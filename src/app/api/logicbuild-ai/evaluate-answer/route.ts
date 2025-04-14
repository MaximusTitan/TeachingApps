import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { question, studentAnswer } = await request.json();

        // Validate required parameters
        if (!question || studentAnswer === undefined) {
            return NextResponse.json(
                { error: 'Missing required parameters: question or studentAnswer' },
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
      You are an educational assistant evaluating a student's answer to a question.
      
      Question: ${question.text}
      Question Type: ${question.type}
      Correct Answer: ${question.correctAnswer}
      Student's Answer: ${studentAnswer}
      Difficulty Level: ${question.difficultyLevel}
      
      Please evaluate if the student's answer is correct.
      For multiple-choice questions, check if they selected the correct option index.
      For fill-in-blank or logic puzzles, compare their text answer with the correct answer, being flexible with spelling and minor errors.
      
      Format your response as a JSON object with the following structure:
      {
        "isCorrect": true/false,
        "feedback": "Encouraging, child-friendly feedback explaining why the answer is correct or incorrect",
        "correctAnswer": "Only include this if the student's answer was incorrect"
      }
      
      The feedback should:
      - Be encouraging and positive, even for incorrect answers
      - Use simple language appropriate for grades 1-4
      - Include a brief explanation of the concept if the answer is incorrect
      - Provide a helpful hint for incorrect answers
      - Be tailored to the question type
      
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
                        content: 'You are an AI specialized in evaluating educational responses for children in grades 1-4.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
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
        console.error('Error evaluating answer:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to evaluate answer" },
            { status: 500 }
        );
    }
} 