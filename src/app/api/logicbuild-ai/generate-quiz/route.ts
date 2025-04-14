import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { bossName, levelId, stageType, difficultyLevel } = await request.json();

    // Validate required parameters
    if (!bossName || !levelId || !stageType || !difficultyLevel) {
      return NextResponse.json(
        { error: 'Missing required parameters: bossName, levelId, stageType, or difficultyLevel' },
        { status: 400 }
      );
    }

    // Get Groq API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("Groq API key is missing in environment variables");
    }

    // Define the topics for each boss and level
    interface TopicMap {
      [boss: string]: {
        [level: number]: string;
      };
    }
    
    const topicMap: TopicMap = {
      "Logic": {
        1: "Order Logic (e.g., arranging by clues)",
        2: "Comparisons (taller, heavier, faster)",
        3: "Patterns & Sequences (find the next one)",
        4: "Deductive Reasoning (who is lying, truth-tellers, etc.)"
      },
      "Logic II": {
        1: "Puzzle Grids (e.g., match items with clues)",
        2: "Elimination Logic (process of elimination)",
        3: "Multi-step Logic Chains",
        4: "Analogies & Word Logic"
      },
      "Everyday Math": {
        1: "Money & Shopping Logic (prices, change, value)",
        2: "Calendar & Time Reasoning",
        3: "Distance, Weight & Measurement Problems",
        4: "Word Problems with Real-life Scenarios"
      },
      "Mathematical Thinking": {
        1: "Sorting & Classifying by Properties",
        2: "Simple Algebraic Thinking (find the missing value)",
        3: "Number Puzzles & Magic Squares",
        4: "Strategy Games & Critical Thinking"
      }
    };

    // Get the specific topic for this boss and level
    const topic = topicMap[bossName]?.[levelId] || `${bossName} Level ${levelId}`;

    // Number of questions based on quiz type
    const questionCount = stageType === "miniQuiz" ? 3 : 5;

    // Construct prompt based on parameters with emphasis on unique questions
    const prompt = `
      You are creating educational quiz questions for elementary school students (grades 1-4) for a game called LogicBuild.
      
      Generate ${questionCount} COMPLETELY DIFFERENT quiz questions specifically about "${topic}" for ${bossName} Level ${levelId} at ${difficultyLevel} difficulty.
      
      This is a ${stageType} for the ${bossName} section of the game, Level ${levelId}.
      
      EXTREMELY IMPORTANT: 
      1. Every question MUST be about the specific topic: "${topic}"
      2. Each question MUST be entirely different from the others, but ALL related to this topic.
      3. Questions should cover DIFFERENT aspects of "${topic}".
      4. Vary the difficulty, phrasing, and scenarios across questions.
      5. Use creative and age-appropriate examples in your questions.
      6. For multiple-choice questions, ensure options are distinct and include plausible distractors.
      
      For a miniQuiz, create 3 unique multiple-choice questions about different aspects of "${topic}".
      For a finalQuiz, create 3 distinct multiple-choice questions, 1 fill-in-blank question, and 1 logic puzzle question, all about "${topic}".
      
      The questions should:
      - Be appropriate for grades 1-4
      - Use simple, clear language
      - Be fun and engaging
      - Have increasing difficulty as the questions progress
      - Be tailored to the ${difficultyLevel} difficulty level
      - ONLY cover the specific topic "${topic}" - each question should focus on a different aspect of this topic
      
      RESPONSE FORMAT:
      You MUST respond with ONLY a valid JSON array containing question objects. Do not include any text outside the array.
      The format must be:
      
      [
        {
          "id": "q-${levelId}-1",
          "text": "The question text about ${topic}",
          "type": "multiple-choice", 
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "explanation": "Explanation of why this is the correct answer",
          "difficultyLevel": "${difficultyLevel}"
        },
        {
          "id": "q-${levelId}-2",
          "text": "Second question text about ${topic}",
          "type": "multiple-choice",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 1,
          "explanation": "Explanation of why this is the correct answer",
          "difficultyLevel": "${difficultyLevel}"
        }
        // More question objects here...
      ]
      
      Ensure that your response:
      1. Begins with a [ character
      2. Ends with a ] character
      3. Contains properly formatted JSON objects with quotes around all keys and string values
      4. Has commas between objects but not after the last object
      5. Contains NO text outside the JSON array
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
            content: 'You are an AI specialized in creating varied, engaging, and creative educational quizzes for children in grades 1-4. You always create diverse questions that cover different concepts, formats, and approaches. NEVER repeat similar questions or patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.85, // Higher for more variety and creativity
        max_tokens: 2000,
        response_format: { type: 'text' } // Changed from 'json_object' to 'text'
      })
    });

    let questionsArray: any[] = [];
    
    // Handle the response or error
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      
      // Try to extract questions from failed_generation if available
      if (errorData.error?.code === 'json_validate_failed' && errorData.error?.failed_generation) {
        const failedGeneration = errorData.error.failed_generation;
        console.log("Attempting to recover questions from failed_generation");
        
        try {
          // Try to wrap the response in array brackets if needed
          const fixedJson = failedGeneration.trim().startsWith('[') 
            ? failedGeneration 
            : `[${failedGeneration}]`;
          
          // Parse the fixed JSON
          const parsedQuestions = JSON.parse(fixedJson);
          
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log(`Successfully recovered ${parsedQuestions.length} questions`);
            questionsArray = parsedQuestions;
          }
        } catch (recoveryError) {
          console.error("Failed to recover questions from failed_generation:", recoveryError);
          throw new Error(`Groq API error: ${JSON.stringify(errorData)}`);
        }
      } else {
        throw new Error(`Groq API error: ${JSON.stringify(errorData)}`);
      }
    } else {
      // Process successful response
      const groqData = await groqResponse.json();
      const content = groqData.choices[0].message.content;
      
      try {
        // Try various parsing approaches
        if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
          questionsArray = JSON.parse(content);
        } else if (content.includes('"questions":')) {
          const contentObj = JSON.parse(content);
          questionsArray = contentObj.questions || [];
        } else {
          // Assuming it's JSON objects without array wrapper
          const fixedContent = content.trim().startsWith('{') 
            ? `[${content.replace(/}\s*{/g, '},{')}]` 
            : content;
          questionsArray = JSON.parse(fixedContent);
        }
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        
        // Try to extract JSON objects
        try {
          const objectMatches = content.match(/\{[^{}]*((\{[^{}]*)+([^{}]*\}))*[^{}]*\}/g);
          
          if (objectMatches && objectMatches.length > 0) {
            questionsArray = objectMatches.map((objString: string) => {
              try {
                return JSON.parse(objString);
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
            
            console.log(`Extracted ${questionsArray.length} questions from response`);
          }
        } catch (extractError) {
          console.error("Failed to extract questions:", extractError);
        }
      }
    }
    
    // Validate and filter questions
    if (!Array.isArray(questionsArray)) {
      console.error("Questions are not in an array format:", typeof questionsArray);
      questionsArray = [];
    }
    
    // Filter invalid questions
    const validQuestions = questionsArray.filter(q => 
      q && q.text && q.type && 
      (q.type !== 'multiple-choice' || (q.options && Array.isArray(q.options)))
    );
    
    // Remove duplicate questions
    const uniqueQuestions = [];
    const seenQuestionTexts = new Set();
    
    for (const question of validQuestions) {
      if (!seenQuestionTexts.has(question.text)) {
        seenQuestionTexts.add(question.text);
        uniqueQuestions.push(question);
      }
    }
    
    // Log warnings if we don't have enough questions
    if (uniqueQuestions.length < questionCount) {
      console.warn(`Only got ${uniqueQuestions.length} unique questions, expected ${questionCount}`);
    }
    
    // Return the questions
    return NextResponse.json({ questions: uniqueQuestions });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
} 