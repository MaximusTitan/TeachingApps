import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables.");
    // Don't throw in production, just log the error
    if (process.env.NODE_ENV === "development") {
        throw new Error("❌ Missing Supabase environment variables.");
    }
}

// Create the Supabase client with better error handling
export const supabase = createClient(
    supabaseUrl || "", 
    supabaseAnonKey || "",
    {
        auth: {
            persistSession: typeof window !== "undefined", // Only persist in browser
        }
    }
);

// Test function with more detailed diagnostics
export async function testSupabase() {
    try {
        console.log("🔍 Testing Supabase connection...");
        console.log(`🔗 URL: ${supabaseUrl?.substring(0, 10)}...`);
        
        const { data, error } = await supabase
            .from("science_buddy_conversations")
            .select("id")
            .limit(1);
            
        if (error) throw error;
        console.log("✅ Supabase Connection Successful:", data);
        return { success: true, data };
    } catch (err) {
        console.error("❌ Supabase Test Failed:", err);
        return { success: false, error: err };
    }
}
