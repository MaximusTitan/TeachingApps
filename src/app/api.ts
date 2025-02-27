import { createClient } from '@supabase/supabase-js';

export async function generateDiscussionPrompt(promptData: DiscussionPromptRequest): Promise<string> {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

        if (!API_URL || !API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error('API or Supabase configuration is missing');
        }

        console.log("🔹 Sending request to API with data:", promptData);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: "You are an educational discussion prompt generator. Create engaging, age-appropriate discussion prompts based on the provided parameters."
                    },
                    {
                        role: "user",
                        content: `Generate a discussion prompt for a ${promptData.engagementLevel.label} with the following parameters:
                        - Country/Region: ${promptData.country.label}
                        - Educational Board: ${promptData.board.label}
                        - Subject: ${promptData.subject.label}
                        - Grade Level: ${promptData.gradeLevel.label}
                        - Topic: ${promptData.topic}
                        - Time Limit: ${promptData.timeLimit} minutes
                        
                        The prompt should include:
                        1. A thought-provoking main question
                        2. 3-5 follow-up questions
                        3. Key points to consider
                        4. A suggested structure for the discussion based on the time limit`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('❌ API error details:', errorData);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const generatedPrompt = data.choices?.[0]?.message?.content || "No response from API";
        console.log("✅ Generated Prompt:", generatedPrompt);

        // Save to Supabase
        await savePromptToHistory(promptData, generatedPrompt);

        return generatedPrompt;
    } catch (error) {
        console.error('❌ Error generating discussion prompt:', error);
        throw error;
    }
}

export async function savePromptToHistory(promptData, generatedPrompts) {
    try {
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error('Supabase configuration is missing');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("📌 Saving to Supabase:", { promptData, generatedPrompts });

        const { data, error } = await supabase.from('discussion_prompts').insert([
            {
                topic: promptData.topic,
                country: promptData.country.label,
                board: promptData.board.label,
                subject: promptData.subject.label,
                grade_level: promptData.gradeLevel.label,
                engagement_level: promptData.engagementLevel.label,
                time_limit: promptData.timeLimit,
                generated_prompts: generatedPrompts,  // Ensures this is not NULL
                created_at: new Date().toISOString()
            }
        ]);

        if (error) {
            console.error('❌ Supabase Insert Error:', error);
            throw new Error('Failed to save prompt to history');
        }

        console.log("✅ Successfully saved to Supabase:", data);
    } catch (error) {
        console.error('❌ Error saving to history:', error);
    }
}

export async function fetchDiscussionHistory() {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('discussion_prompts').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching discussion history:', error);
        throw new Error('Failed to fetch discussion history');
    }

    return data;
}

export async function deleteDiscussionPrompt(id: string) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from('discussion_prompts').delete().match({ id });

    if (error) {
        console.error('❌ Error deleting discussion prompt:', error);
        throw new Error('Failed to delete discussion prompt');
    }
}
