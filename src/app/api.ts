// src/app/api.ts

export async function generateDiscussionPrompt(promptData: DiscussionPromptRequest): Promise<string> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  
      if (!API_URL || !API_KEY) {
        throw new Error('API URL or API Key not configured');
      }
  
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
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
        console.error('API error details:', errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating discussion prompt:', error);
      throw error;
    }
  }
  
  export interface DiscussionPromptRequest {
    country: { value: string; label: string };
    board: { value: string; label: string };
    subject: { value: string; label: string };
    gradeLevel: { value: string; label: string };
    topic: string;
    timeLimit: number;
    engagementLevel: { value: string; label: string };
  }