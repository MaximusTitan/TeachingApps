// Sarvam.ai API integration for Text-to-Speech and Speech-to-Text

const SARVAM_API_URL = 'https://api.sarvam.ai';

// Types
export type Voice = 'meera' | 'pavithra' | 'maitreyi' | 'arvind' | 'amol' | 'amartya' | 'diya' | 'neel' | 'misha' | 'vian' | 'arjun' | 'maya' | 'anushka' | 'abhilash' | 'manisha' | 'vidya' | 'arya' | 'karun' | 'hitesh';

export type Language = 'en-IN' | 'hi-IN' | 'ta-IN' | 'ml-IN' | 'te-IN' | 'kn-IN' | 'mr-IN' | 'bn-IN' | 'gu-IN' | 'od-IN' | 'pa-IN' | 'unknown';

// STT Language type (includes all languages supported by Speech-to-Text)
export type STTLanguage = Language;

// TTS Language type (only languages supported by Text-to-Speech)
export type TTSLanguage = Exclude<Language, 'unknown'>;

export interface TTSOptions {
  text: string;
  language: TTSLanguage;
  voice: Voice;
  pitch?: number; // Default 0.0, range -1 to 1
  pace?: number;  // Default 1.0, range 0.3 to 3
  loudness?: number; // Default 1.0, range 0.1 to 3
  speech_sample_rate?: 8000 | 16000 | 22050; // Default 22050
  enable_preprocessing?: boolean; // Default false
  model?: 'bulbul:v1' | 'bulbul:v2'; // Default bulbul:v1
}

export interface STTOptions {
  language_code?: STTLanguage; // Default unknown (for saarika:v2)
  model?: 'saarika:v1' | 'saarika:v2' | 'saarika:flash'; // Default saarika:v2
  with_timestamps?: boolean; // Default false
  with_diarization?: boolean; // Default false
  num_speakers?: number | null; // For diarization
}

// Speech-to-Text API
export async function speechToText(
  audioBlob: Blob, 
  options: STTOptions = {}
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob);
    
    // Add optional parameters
    if (options.language_code) formData.append('language_code', options.language_code);
    if (options.model) formData.append('model', options.model);
    if (options.with_timestamps !== undefined) formData.append('with_timestamps', options.with_timestamps.toString());
    if (options.with_diarization !== undefined) formData.append('with_diarization', options.with_diarization.toString());
    if (options.num_speakers !== undefined && options.num_speakers !== null) formData.append('num_speakers', options.num_speakers.toString());

    // Use the API route which handles the API key securely
    const response = await fetch('/api/ai-voice-tutor/speech-to-text', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Speech-to-Text API error: ${response.status}`);
    }

    const data = await response.json();
    return data.transcript || '';
  } catch (error) {
    console.error('Speech-to-Text error:', error);
    throw error;
  }
}

// Text-to-Speech API
export async function textToSpeech(
  options: TTSOptions
): Promise<string> {
  try {
    // Break text into chunks of 500 chars max (Sarvam API limit)
    const textChunks = splitText(options.text, 500);
    
    const payload = {
      inputs: textChunks,
      target_language_code: options.language,
      speaker: options.voice,
      pitch: options.pitch ?? 0.0,
      pace: options.pace ?? 1.0,
      loudness: options.loudness ?? 1.0,
      speech_sample_rate: options.speech_sample_rate ?? 22050,
      enable_preprocessing: options.enable_preprocessing ?? false,
      model: options.model ?? 'bulbul:v1'
    };

    // Use the API route which handles the API key securely
    const response = await fetch('/api/ai-voice-tutor/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Text-to-Speech API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the base64 audio string
    if (data.audios && data.audios.length > 0) {
      return data.audios[0];
    } else {
      throw new Error('No audio returned from API');
    }
  } catch (error) {
    console.error('Text-to-Speech error:', error);
    throw error;
  }
}

// Helper function to split text into chunks
function splitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  
  // Simple chunking by maxLength
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, Math.min(i + maxLength, text.length)));
  }
  
  // Limit to 3 chunks as per Sarvam API constraint
  return chunks.slice(0, 3);
}

// Voice options for dropdown - All voices supported by Sarvam
export const VOICE_OPTIONS = [
  { value: 'meera', label: 'Meera (Female)' },
  { value: 'pavithra', label: 'Pavithra (Female)' },
  { value: 'maitreyi', label: 'Maitreyi (Female)' },
  { value: 'arvind', label: 'Arvind (Male)' },
  { value: 'amol', label: 'Amol (Male)' },
  { value: 'amartya', label: 'Amartya (Male)' },
  { value: 'diya', label: 'Diya (Female)' },
  { value: 'neel', label: 'Neel (Male)' },
  { value: 'misha', label: 'Misha (Female)' },
  { value: 'vian', label: 'Vian (Male)' },
  { value: 'arjun', label: 'Arjun (Male)' },
  { value: 'maya', label: 'Maya (Female)' },
  { value: 'anushka', label: 'Anushka (Female)' },
  { value: 'abhilash', label: 'Abhilash (Male)' },
  { value: 'manisha', label: 'Manisha (Female)' },
  { value: 'vidya', label: 'Vidya (Female)' },
  { value: 'arya', label: 'Arya (Female)' },
  { value: 'karun', label: 'Karun (Male)' },
  { value: 'hitesh', label: 'Hitesh (Male)' }
];

// Language options for dropdown - All languages supported by Sarvam
export const LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'od-IN', label: 'Odia' },
  { value: 'pa-IN', label: 'Punjabi' }
];