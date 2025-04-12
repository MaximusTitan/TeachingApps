import { NextResponse } from 'next/server';

// Set this to your Sarvam API key in an environment variable
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

export async function POST(request: Request) {
  if (!SARVAM_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Handle multipart/form-data for audio files
    const formData = await request.formData();
    const audioFile = formData.get('file') as File | null;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Create a new FormData to send to Sarvam API
    const sarvamFormData = new FormData();
    sarvamFormData.append('file', audioFile);
    
    // Extract and forward all possible parameters from the request
    const languageCode = formData.get('language_code');
    const model = formData.get('model');
    const withTimestamps = formData.get('with_timestamps');
    const withDiarization = formData.get('with_diarization');
    const numSpeakers = formData.get('num_speakers');

    // Add parameters only if they exist in the request
    if (languageCode) sarvamFormData.append('language_code', languageCode as string);
    if (model) sarvamFormData.append('model', model as string);
    if (withTimestamps) sarvamFormData.append('with_timestamps', withTimestamps as string);
    if (withDiarization) sarvamFormData.append('with_diarization', withDiarization as string);
    if (numSpeakers) sarvamFormData.append('num_speakers', numSpeakers as string);
    
    // Forward the request to Sarvam API
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY
      },
      body: sarvamFormData
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
    console.error('Speech-to-text error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Increase the limit for audio files
export const config = {
  api: {
    bodyParser: false,
  },
};