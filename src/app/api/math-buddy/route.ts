import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

// Define the message type for type safety
type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export async function POST(req: Request) {
    try {
        const { prompt, messages = [] } = await req.json();
        
        // Ensure we have either a direct prompt or messages array
        if (!prompt && (!messages || messages.length === 0)) {
            return NextResponse.json(
                { error: "Missing required field: either prompt or messages array" },
                { status: 400 }
            );
        }

        // Get Groq API key from environment variables
        const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
        
        if (!apiKey) {
            throw new Error("Groq API key is missing in environment variables");
        }
        
        // Set environment variable for Groq
        process.env.GROQ_API_KEY = apiKey;
        
        // Initialize Groq with the LLaMA3 70b model
        const model = groq("llama3-70b-8192");
        
        // System instructions with added guidance for geometry shapes
        const systemInstructions = `You are Math Buddy, a friendly and helpful AI tutor designed to help elementary school students (Grades 1-4) with math.
Your goal is to explain math concepts in simple, easy-to-understand language that a child can follow.

Here's how you should respond:
1. First, identify what type of math problem this is (addition, subtraction, multiplication, division, etc.)
2. Solve the problem step by step, using very simple language
3. Use visual representations of math problems with proper columnar formatting
4. Be encouraging and supportive, like a kind teacher would be
5. At the end, ask a simple follow-up question to check understanding

IMPORTANT FORMATTING RULES:
- DO NOT use any markdown formatting symbols like **, *, _, or backticks (\`)
- When showing calculations, align the numbers properly in columns
- For addition and subtraction, format problems like this:

    123
  +  45
  -----
    168

- For multi-digit problems, show the carrying or borrowing steps clearly
- Use plain text formatting only - nothing that would confuse a young student
- Keep all math expressions properly aligned vertically
- Use spaces for alignment, not tabs or special characters
- For division, show the work in a clear, step-by-step layout
- Speak in a warm, encouraging tone as if talking to a child

CRITICAL INSTRUCTION FOR GEOMETRY SHAPES:
- When explaining geometric shapes (circle, square, triangle, etc.), provide ONLY a single, simple sentence definition
- For example: "A square is a shape with four equal sides and four right angles."
- DO NOT attempt to draw or represent shapes using ASCII characters, slashes, backslashes, underscores, or any symbols
- DO NOT include any code snippets, HTML, CSS, or technical content in your response
- DO NOT use asterisks, hashtags, underscores or any markdown formatting
- The system will automatically render a proper visual representation of the shape
- Always use the exact shape name (e.g., "circle", "triangle", "rectangle", "hexagon", etc.) in your definition
- After providing the shape definition, continue with any additional explanation in a new paragraph`;
        
        // Process messages for context
        let formattedPrompt = "";
        
        if (messages && messages.length > 0) {
            // Initial system instruction with formatting rules
            formattedPrompt = systemInstructions + "\n\nHere is the conversation history so far:";

            // Add the conversation history
            for (const message of messages) {
                const role = message.role === 'user' ? 'Student' : 'Math Buddy';
                formattedPrompt += `\n${role}: ${message.content}`;
            }
            
            formattedPrompt += "\n\nNow, please provide a detailed, step-by-step explanation that a child in elementary school can understand. Remember to reference any previous context that's relevant and follow the formatting rules exactly.";
        } else {
            // If no messages array, use the direct prompt approach
            formattedPrompt = systemInstructions + `\n\nThe student's question is: ${prompt}\n\nNow, please provide a detailed, step-by-step explanation that a child in elementary school can understand.`;
        }

        // Generate text using the Groq provider with the constructed prompt
        const { text } = await generateText({
            model: model as any,
            prompt: formattedPrompt,
            temperature: 0.7,
            maxTokens: 800,
        });

        const reply = text.trim() || "";

        return NextResponse.json({ reply });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 