import { NextResponse } from 'next/server';

// Set this to your Sarvam API key in an environment variable
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

export async function POST(request: Request) {
  if (!SARVAM_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.inputs || !Array.isArray(body.inputs) || body.inputs.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid inputs' }, { status: 400 });
    }
    
    if (!body.target_language_code) {
      return NextResponse.json({ error: 'Missing target_language_code' }, { status: 400 });
    }

    // Forward the request to Sarvam API with all parameters
    const payload = {
      inputs: body.inputs.slice(0, 3).map((text: string) => text.substring(0, 500)), // Enforce API limits
      target_language_code: body.target_language_code,
      speaker: body.speaker || 'meera',
      pitch: body.pitch ?? 0.0, // Default is 0.0 according to docs
      pace: body.pace ?? 1.0, // Default is 1.0
      loudness: body.loudness ?? 1.0, // Default is 1.0
      speech_sample_rate: body.speech_sample_rate ?? 22050, // Default is 22050
      enable_preprocessing: body.enable_preprocessing ?? false, // Default is false
      model: body.model ?? 'bulbul:v1' // Default is bulbul:v1
    };

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam API error:', errorText);
      return NextResponse.json(
        { error: `Error from Sarvam API: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}