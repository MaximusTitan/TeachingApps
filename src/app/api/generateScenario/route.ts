import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

// GET handler for fetching scenarios
export async function GET() {
    try {
        const { data, error } = await supabase
            .from("scenarios")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) {
            console.error("❌ Supabase Fetch Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formattedScenarios = data.map(scenario => ({
            id: scenario.id,
            prompt: scenario.prompt,
            response: scenario.response
                // Normalize spacing
                .replace(/\n{3,}/g, "\n\n")
                .trim()
                // Ensure consistent formatting
                .replace(/\*\*\*\*(.*?)\*\*\*\*/g, "**$1**")
                .replace(/(Scenario:|Beginning:|Challenge:|Application of .*?:|Final Outcome:)/g, 
                    "\n\n**$1**\n\n")
        }));

        return NextResponse.json({ 
            success: true,
            scenarios: formattedScenarios 
        });
    } catch (err: Error | unknown) {
        console.error("❌ Internal Server Error:", err);
        return NextResponse.json({ 
            success: false,
            error: err instanceof Error ? err.message : "An unknown error occurred"
        }, { status: 500 });
    }
}

// POST handler for generating new scenarios
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt?.trim()) {
            return NextResponse.json({ 
                success: false,
                error: "Prompt is required" 
            }, { status: 400 });
        }

        // First try to find an existing scenario
        const { data: existingData, error: searchError } = await supabase
            .from("scenarios")
            .select("*")
            .eq("prompt", prompt.trim())
            .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') {
            console.error("Search Error:", searchError);
            return NextResponse.json({ 
                success: false,
                error: searchError.message 
            }, { status: 500 });
        }

        if (existingData) {
            return NextResponse.json({ 
                success: true,
                scenario: existingData
            });
        }

        // Generate AI response
        const aiPrompt = `Generate a detailed real-world scenario where the concept of '${prompt}' is applied in daily life. Include a beginning showcasing how it is used, the challenges faced, and the final outcome or lesson learned. Ensure the scenario is practical and realistic.`;

        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [{ role: "user", content: aiPrompt }],
                max_tokens: 700,
            })
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            return NextResponse.json({ 
                success: false, 
                error: `Groq API Error: ${errorText}` 
            }, { status: aiResponse.status });
        }

        const aiData = await aiResponse.json();
        const generatedText = aiData.choices[0]?.message?.content || "No response generated.";

        const formattedResponse = generatedText
            // First normalize spacing and line breaks
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            // Ensure consistent formatting for section headers
            .replace(/(Scenario:|Beginning:|Challenge:|Application of .*?:|Final Outcome:)/g, 
                "\n\n**$1**\n\n")
            // Make sure there are no duplicate asterisks in bold text
            .replace(/\*\*\*\*(.*?)\*\*\*\*/g, "**$1**")
            // Ensure proper spacing after list items
            .replace(/• (.*?)(?!\n)/g, "• $1\n")
            // Ensure proper paragraph breaks
            .replace(/\n{3,}/g, "\n\n");

        // Save to database
        const { data: newData, error: insertError } = await supabase
            .from("scenarios")
            .insert({
                prompt: prompt.trim(),
                response: formattedResponse
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert Error:", insertError);
            return NextResponse.json({ 
                success: false, 
                error: "Failed to create scenario" 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            scenario: newData
        });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to generate scenario" 
        }, { status: 500 });
    }
}