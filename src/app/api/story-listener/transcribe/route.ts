import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Check if we have a valid API key
    if (!process.env.DEEPGRAM_API_KEY) {
      console.error("Missing Deepgram API key");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get the audio file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp3", "audio/x-wav"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload MP3, WAV, or M4A audio files." },
        { status: 400 }
      );
    }

    // Check file size (15MB max)
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 15MB." },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Log for debugging
      console.log("File type:", file.type);
      console.log("File size:", file.size, "bytes");
      
      // Use direct API call to Deepgram instead of the SDK
      const apiKey = process.env.DEEPGRAM_API_KEY;
      const url = "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true";
      
      const headers = {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": file.type
      };
      
      const fetchResponse = await fetch(url, {
        method: "POST",
        headers,
        body: buffer
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`Deepgram API error: ${fetchResponse.statusText}`);
      }
      
      const response = await fetchResponse.json();

      // Extract the transcript from the response
      let transcript;
      
      // Try to extract transcript from different possible response formats
      if (response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        transcript = response.results.channels[0].alternatives[0].transcript;
      } else if (response.results?.alternatives?.[0]?.transcript) {
        transcript = response.results.alternatives[0].transcript;
      }
      
      if (!transcript) {
        console.error("No transcript in response:", response);
        return NextResponse.json(
          { error: "Failed to extract transcript from response" },
          { status: 500 }
        );
      }

      // Return the transcript
      return NextResponse.json({ transcript }, { status: 200 });
    } catch (deepgramErr) {
      const err = deepgramErr as Error;
      console.error("Deepgram API Error:", err);
      return NextResponse.json(
        { error: `Deepgram API Error: ${err.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (err) {
    const error = err as Error;
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: `Failed to process audio file: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}