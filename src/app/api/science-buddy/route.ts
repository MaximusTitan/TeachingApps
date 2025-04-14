import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";



// Check environment variables
function checkEnvironmentVariables() {
  console.log("CHECKING ENVIRONMENT VARIABLES...");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is missing or empty!");
    return false;
  } else {
    // Mask the URL for security but show enough to verify
    const maskedUrl = supabaseUrl.substring(0, 15) + "..." + supabaseUrl.substring(supabaseUrl.length - 10);
    console.log("NEXT_PUBLIC_SUPABASE_URL is set:", maskedUrl);
  }
  
  if (!supabaseKey) {
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty!");
    return false;
  } else {
    // Only show first and last few characters of the key
    const maskedKey = supabaseKey.substring(0, 5) + "..." + supabaseKey.substring(supabaseKey.length - 5);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY is set:", maskedKey);
  }
  
  return true;
}

// Try a direct connection to Supabase
async function tryDirectConnection() {
  console.log("ATTEMPTING DIRECT SUPABASE CONNECTION...");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Cannot attempt direct connection - missing environment variables");
    return false;
  }
  
  try {
    // Create a new client directly for testing
    const testClient = createClient(supabaseUrl, supabaseKey);
    
    // Try a simple query on the chats table
    const { data, error } = await testClient
      .from('science_buddy_chats')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("Direct connection test failed:", error.message);
      return false;
    }
    
    console.log("Direct connection test succeeded!");
    return true;
  } catch (e) {
    console.error("Exception during direct connection test:", e);
    return false;
  }
}

// Simple test function to check Supabase connectivity
async function testSupabaseConnection() {
  try {
    console.log("TESTING SUPABASE CONNECTION...");
    
    // First, check environment variables
    const envVarsOk = checkEnvironmentVariables();
    if (!envVarsOk) {
      console.error("Environment variables check failed");
      
      // Try direct connection to see if the issue is with imported client
      const directConnectionOk = await tryDirectConnection();
      if (directConnectionOk) {
        console.log("Direct connection works but imported client doesn't - likely an issue with lib/supabase.ts");
      }
      
      return {success: false, error: "Environment variables incorrect or missing"};
    }
    
    // Step 1: Check if the client is initialized
    if (!supabase) {
      console.error("Supabase client is NULL or undefined!");
      return {success: false, error: "Supabase client not initialized"};
    }
    
    console.log("Supabase client is initialized");
    
    // Step 2: Try a simple query to check if the chats table exists
    const { data: chatsData, error: chatsError } = await supabase
      .from('science_buddy_chats')
      .select('id')
      .limit(1);
      
    if (chatsError) {
      console.error("Supabase test SELECT on chats table failed:", chatsError.message);
      console.error("Error details:", JSON.stringify(chatsError, null, 2));
      return {success: false, error: chatsError};
    }
    
    console.log("Supabase SELECT on chats table passed");
    
    // Step 3: Try a simple query to check if the messages table exists
    const { data: messagesData, error: messagesError } = await supabase
      .from('science_buddy_messages')
      .select('id')
      .limit(1);
      
    if (messagesError) {
      console.error("Supabase test SELECT on messages table failed:", messagesError.message);
      console.error("Error details:", JSON.stringify(messagesError, null, 2));
      return {success: false, error: messagesError};
    }
    
    console.log("Supabase SELECT on messages table passed");
    
    // Step 4: Try creating a test chat and message
    const testTitle = "TEST_CHAT_" + Date.now();
    
    // Create a test chat
    const { data: chatData, error: chatError } = await supabase
      .from('science_buddy_chats')
      .insert({ title: testTitle })
      .select();
      
    if (chatError) {
      console.error("Supabase test INSERT to chats failed:", chatError.message);
      console.error("Error details:", JSON.stringify(chatError, null, 2));
      return {success: false, error: chatError};
    }
    
    const chatId = chatData[0].id;
    console.log("Supabase INSERT to chats passed! Chat ID:", chatId);
    
    // Create a test message
    const { data: messageData, error: messageError } = await supabase
      .from('science_buddy_messages')
      .insert({ 
        chat_id: chatId,
        role: 'user',
        content: "TEST_MESSAGE" 
      })
      .select();
      
    if (messageError) {
      console.error("Supabase test INSERT to messages failed:", messageError.message);
      console.error("Error details:", JSON.stringify(messageError, null, 2));
      return {success: false, error: messageError};
    }
    
    console.log("Supabase INSERT to messages passed! Message ID:", messageData[0].id);
    return {success: true};
  } catch (e) {
    console.error("Unexpected error during Supabase test:", e);
    return {success: false, error: e};
  }
}

export async function POST(req: Request) {
  // Run Supabase test on each request to diagnose the issue
  const testResult = await testSupabaseConnection();
  console.log("Supabase Test Result:", testResult.success ? "SUCCESS" : "FAILED");
  
  try {
    const { message, chat_id, previousMessages = [] } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    console.log("Received request with chat_id:", chat_id);

    // Get response from the AI model
    const reply = await getAIResponse(message, previousMessages);

    // Enhanced Supabase save with better error handling
    try {
      console.log("Attempting to save conversation to Supabase...");
      
      // Verify environment variables first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase environment variables!");
        throw new Error("Missing Supabase environment variables");
      }
      
      // Get or create a chat session
      let chatId = chat_id;
      let isNewSession = false;
      
      if (!chatId) {
        console.log("Starting a new chat session");
        isNewSession = true;
        
        // Generate a title based on the user's first message
        const chatTitle = message.length > 50 ? 
          `${message.substring(0, 47)}...` : message;
          
        // Create a new chat session
        const { data: chatData, error: chatError } = await supabase
          .from("science_buddy_chats")
          .insert({ title: chatTitle })
          .select();
          
        if (chatError) {
          console.error("Failed to create chat session:", chatError.message);
          throw new Error(`Failed to create chat session: ${chatError.message}`);
        }
        
        chatId = chatData[0].id;
        console.log(`Created new chat session with ID: ${chatId}`);
      } else {
        console.log(`Adding to existing chat session with ID: ${chatId}`);
        
        // Update the session timestamp to show activity
        const { error: updateError } = await supabase
          .from("science_buddy_chats")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", chatId);
          
        if (updateError) {
          console.error("Failed to update chat session timestamp:", updateError.message);
        }
      }
      
      // Save user message to the database
      const userMessage = {
        chat_id: chatId,
        role: "user",
        content: message,
        created_at: new Date().toISOString()
      };
      
      const { error: userMsgError } = await supabase
        .from("science_buddy_messages")
        .insert(userMessage);
        
      if (userMsgError) {
        console.error("Failed to save user message:", userMsgError.message);
      } else {
        console.log("User message saved successfully");
      }
      
      // Save assistant message to the database
      const assistantMessage = {
        chat_id: chatId,
        role: "assistant",
        content: reply,
        created_at: new Date().toISOString()
      };
      
      const { error: assistantMsgError } = await supabase
        .from("science_buddy_messages")
        .insert(assistantMessage);
        
      if (assistantMsgError) {
        console.error("Failed to save assistant message:", assistantMsgError.message);
      } else {
        console.log("Assistant message saved successfully");
      }
      
      // Return the response with chat ID
      return NextResponse.json({ 
        reply,
        chat_id: chatId,
        isNewSession
      });
      
    } catch (error: any) {
      console.error("Exception during save:", error?.message || error);
      return NextResponse.json({ reply });
    }
  } catch (error) {
    console.error("API Error:", error);
    
    // Provide a fallback response when AI generation fails
    const fallbackReply = "I'm sorry, I'm having trouble thinking right now. Can you ask me again in a different way?";
    return NextResponse.json({ reply: fallbackReply });
  }
}

// Extract AI response generation to a separate function
async function getAIResponse(message: string, previousMessages: any[] = []) {
  // Define topics for all elementary grades (1-4)
  const gradeTopics = [
    "Living and non-living things",
    "Weather and seasons",
    "Plants and animals", 
    "Five senses",
    "Ecosystems",
    "Simple machines", 
    "Solar system",
    "Energy types",
    "States of matter", 
    "Habitats",
    "Water cycle"
  ].join(", ");

  // Construct the prompt with conversation history
  const conversationHistory = previousMessages.map((msg: { role: string; content: string }) => 
    `${msg.role === "user" ? "Student" : "Science Buddy"}: ${msg.content}`
  ).join("\n");

  const fullPrompt = `
You are "Science Buddy," an educational AI chatbot designed for elementary school students (grades 1-4, ages 6-10). Your purpose is to teach science concepts in a fun, engaging, and age-appropriate way.

## Student Information
- Elementary school student (grades 1-4, ages 6-10)
- Age-appropriate topics: ${gradeTopics}

## Grade-Level Adaptation
- For GRADE 1 students (ages 6-7): Use very simple words with 1-2 syllables. Focus on concrete, observable science like animals, weather, and the five senses. Use many comparisons to their daily experiences.
- For GRADE 2 students (ages 7-8): Introduce basic science concepts like living vs non-living, simple classifications. Use slightly more complex vocabulary but explain any new terms. Connect science to their home and community.
- For GRADE 3 students (ages 8-9): Include more details about scientific processes. Introduce simple cause and effect. Encourage observation and "what happens if" type thinking.
- For GRADE 4 students (ages 9-10): Begin including more specific scientific terminology (always explained). Discuss how systems work together. Introduce more complex scientific concepts but always with hands-on examples.

## Your Personality
- VERY enthusiastic and excited about science - use exclamation points!!
- Friendly and playful - like a fun teacher who LOVES science
- DO NOT use any emojis in your responses
- End EVERY response with a direct, engaging question to keep the conversation going

## Educational Value
- Always relate science to things children already understand from their own experience
- For every topic, include at least ONE hands-on activity or experiment they can do at home with simple materials
- Connect science to other subjects they might study (math, history, language arts)
- Focus on how science explains everyday things they encounter
- Encourage observation skills and asking questions about the world around them

## Response Format (ALWAYS FOLLOW THIS FORMAT)
- Start with a SHORT, exciting greeting or reaction to the question ("WOW!" "That's incredible!" "Great question!")
- For explanations:
  * Present information in clear, simple sentences using colorful, descriptive language (3rd grade reading level MAX)
  * Begin each main point with phrases like "Amazing fact:" or "Cool discovery:" to create visual structure
  * Organize information into short, visually distinctive paragraphs (2-3 sentences max)
  * Include at least one "Did you know?" fun fact with fascinating information
  * Use ALL CAPS sparingly for emphasis on WOW moments
  * Include examples that relate to a child's everyday experiences
- Make your explanations VISUAL - use vivid descriptions of colors, shapes, movements, sounds
- Include at least THREE INTERACTIVE elements like:
  * "Imagine you are a..." (create a first-person scenario)
  * "Let's pretend we're..." (create an adventure scenario)
  * "Try this at home:" (a simple safe experiment)
  * "Can you spot..." (an observation challenge)
  * "What do you think would happen if..." (a thinking question)
  * "Count how many..." (a math connection)
  * "Draw a picture of..." (an art activity)
  * "Measure how..." (a simple measurement activity)
- Directly answer any questions asked, then expand with fascinating details
- End with a personal question that encourages the student to share their own experiences or thoughts
- Remember: DO NOT include any emojis anywhere in your response

## Writing Style
- Use simple language with occasional "WOW" factor words (but always explain them)
- Explain concepts in ways a 6-10 year old would understand
- Use phrases like "Guess what?", "Did you know?", "Isn't that AMAZING?!"
- Keep paragraphs very short (2-3 sentences maximum)
- Make science feel like an adventure or exciting discovery
- Address the student directly with "you" to make it personal
- Use colorful, vivid language to describe scientific phenomena
- Include elements of wonder, mystery and discovery
- Use sound effects in text like "BOOM!", "SPLASH!", "WHOOSH!" for emphasis

## Previous Conversation:
${conversationHistory}

## Current Question:
Student: ${message}

Science Buddy:`;

  // Get Groq API key from environment variables
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key is missing in environment variables");
  }

  // Set environment variable for Groq
  process.env.GROQ_API_KEY = apiKey;

  try {
    // Create a Groq model instance
    const model = groq("llama3-70b-8192");
    
    // Generate text using the Groq provider with the constructed prompt
    const { text } = await generateText({
      model: model as any,
      prompt: fullPrompt,
      temperature: 0.85,
      maxTokens: 800,
    });

    const reply = text.trim() || "";
    return reply;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I encountered an issue while thinking. Could you please try asking again?";
  }
}