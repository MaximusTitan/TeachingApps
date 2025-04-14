'use client';

import { useState, useRef, useEffect } from 'react';
import { LANGUAGE_OPTIONS, VOICE_OPTIONS, type Language, type Voice, type STTLanguage, type TTSLanguage } from './sarvamApi';
import React from 'react';

// Message types for chat interface
type MessageType = 'user' | 'bot';

interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
  audioSrc?: string | null;
}

export default function AIVoiceTutor() {
  // State for UI control
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  // Chat history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // State for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // State for audio playback
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Settings for Speech-to-Text
  const [sttLanguage, setSTTLanguage] = useState<STTLanguage>('en-IN');
  const [sttModel, setSTTModel] = useState<'saarika:v1' | 'saarika:v2' | 'saarika:flash'>('saarika:v2');
  
  // Settings for Text-to-Speech
  const [ttsLanguage, setTTSLanguage] = useState<TTSLanguage>('en-IN');
  const [voice, setVoice] = useState<Voice>('meera');
  const [pitch, setPitch] = useState<number>(0); // Default 0.0
  const [pace, setPace] = useState<number>(1); // Default 1.0
  const [loudness, setLoudness] = useState<number>(1); // Default 1.0
  
  // UI control
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTestMode, setShowTestMode] = useState(false);
  const [testModeText, setTestModeText] = useState('');
  const [testModeAudioSrc, setTestModeAudioSrc] = useState<string | null>(null);
  const [isTestModeProcessing, setIsTestModeProcessing] = useState(false);

  // For real-time transcription
  const [isTranscribing, setIsTranscribing] = useState(false);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reference to chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Toggle recording with real-time transcription
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };
  
  // Start audio recording with real-time transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        // Clear the transcription interval when recording stops
        if (transcriptionIntervalRef.current) {
          clearInterval(transcriptionIntervalRef.current);
          transcriptionIntervalRef.current = null;
        }
        
        // Final processing after recording completes
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processAudio(audioBlob, true);
        
        setIsTranscribing(false);
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsTranscribing(true);
      
      // Start real-time transcription at intervals
      transcriptionIntervalRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          const currentAudio = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          processAudio(currentAudio, false);
        }
      }, 2000); // Transcribe every 2 seconds during recording
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access your microphone. Please check your browser permissions.');
    }
  };
  
  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Process recorded audio
  const processAudio = async (blob: Blob, isFinalProcessing: boolean) => {
    try {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('language_code', sttLanguage);
      formData.append('model', sttModel);
      
      const response = await fetch('/api/ai-voice-tutor/speech-to-text', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.transcript) {
        setTextInput(data.transcript);
        
        if (isFinalProcessing) {
          // Submit the transcribed text to be processed
          await handleSubmit(data.transcript);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      if (isFinalProcessing) {
        setIsProcessing(false);
      }
    }
  };

  // Add a new message to the chat
  const addMessage = (type: MessageType, text: string, audioSrc: string | null = null) => {
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        text,
        audioSrc
      }
    ]);
  };
  
  // Handle form submission (both typed and spoken)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    await handleSubmit(textInput);
  };
  
  // Process the user input and get AI response
  const handleSubmit = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Add user message to chat
      addMessage('user', text);
      
      // Clear the input field
      setTextInput('');
      
      // Send the message to Groq
      const response = await fetch('/api/ai-voice-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          language: ttsLanguage
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error from chat API: ${response.status}`);
      }
      
      const data = await response.json();
      const reply = data.reply;
      
      // Format the reply for display - preserve paragraph breaks but normalize spacing
      const formattedReply = reply
        .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double line break
        .trim();
      
      // Use exactly the same text for speech as what we display
      const audioSrc = await generateSpeech(formattedReply);
      
      // Add bot message to chat
      addMessage('bot', formattedReply, audioSrc);

      // Auto-play the audio
      if (audioSrc) {
        setTimeout(() => {
          playAudio(audioSrc);
        }, 500);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('bot', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate speech from text
  const generateSpeech = async (text: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/ai-voice-tutor/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: ttsLanguage,
          speaker: voice,
          pitch: pitch,
          pace: pace,
          loudness: loudness,
          enable_preprocessing: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.audios && data.audios.length > 0) {
        // Convert base64 to audio src
        const audioBase64 = data.audios[0];
        const audioSrc = `data:audio/wav;base64,${audioBase64}`;
        return audioSrc;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating speech:', error);
      return null;
    }
  };

  // Play audio for a message
  const playAudio = (audioSrc: string) => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Create and play the new audio
    const audio = new Audio(audioSrc);
    setCurrentAudio(audio);
    audio.play();
  };

  // Handle test mode text-to-speech
  const handleTestModeTTS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testModeText.trim() || isTestModeProcessing) return;
    
    setIsTestModeProcessing(true);
    
    try {
      const audioSrc = await generateSpeech(testModeText);
      setTestModeAudioSrc(audioSrc);
      
      // Auto-play the audio
      if (audioSrc) {
        setTimeout(() => {
          playAudio(audioSrc);
        }, 300);
      }
    } catch (error) {
      console.error('Error generating test speech:', error);
    } finally {
      setIsTestModeProcessing(false);
    }
  };

  // Toggle settings panels
  const toggleAdvancedSettings = () => {
    setShowAdvancedSettings(!showAdvancedSettings);
  };
  
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const toggleTestMode = () => {
    setShowTestMode(!showTestMode);
  };
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Clean up audio and recording resources on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);
  
  return (
    <div className="flex flex-col h-screen bg-[#F8F2F4]">
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <h1 className="text-2xl font-bold text-[#f43f5e] flex items-center">
          <span className="mr-2">🎙️</span>AI Voice Tutor
        </h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTestMode}
            className={`px-3 py-1 rounded-md transition ${
              showTestMode ? 'bg-[#f43f5e] text-white' : 'bg-white text-[#f43f5e] border border-[#f43f5e]'
            }`}
          >
            {showTestMode ? "Exit Test Mode" : "Test Mode"}
          </button>
          <button 
            onClick={toggleSettings}
            className="bg-white text-[#f43f5e] p-2 rounded-full hover:bg-pink-50 transition"
          >
            ⚙️ {showSettings ? "Hide Settings" : "Settings"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area - Either Chat or Test Mode */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {showTestMode ? (
            // Test Mode UI
            <div className="flex flex-col flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto w-full">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Language Testing Mode</h2>
                  <p className="text-gray-600 mb-6">
                    Enter any text below to test how it sounds with the current voice settings.
                  </p>
                  
                  <form onSubmit={handleTestModeTTS} className="mb-6">
                    <div className="mb-4">
                      <label htmlFor="test-text" className="block text-sm font-medium text-gray-700 mb-2">
                        Text to Pronounce
                      </label>
                      <textarea
                        id="test-text"
                        value={testModeText}
                        onChange={(e) => setTestModeText(e.target.value)}
                        placeholder="Type any text to hear it spoken..."
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f43f5e] focus:border-transparent"
                        rows={6}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isTestModeProcessing || !testModeText.trim()}
                        className={`px-6 py-3 rounded-md flex items-center ${
                          isTestModeProcessing || !testModeText.trim() 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#f43f5e] text-white hover:bg-[#e22c4b] shadow-md hover:shadow-lg'
                        } transition-all`}
                      >
                        {isTestModeProcessing ? 'Processing...' : (
                          <>
                            <span className="mr-2">Generate Speech</span>
                            <VolumeUpIcon className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  {testModeAudioSrc && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-md font-medium text-gray-700 mb-2">Audio Preview</h3>
                      <audio 
                        controls 
                        src={testModeAudioSrc}
                        className="w-full"
                      />
                      <div className="mt-2 flex justify-between">
                        <button
                          onClick={() => playAudio(testModeAudioSrc)}
                          className="text-[#f43f5e] hover:text-[#e22c4b] text-sm flex items-center"
                        >
                          <VolumeUpIcon className="w-4 h-4 mr-1" /> Play Again
                        </button>
                        <div className="text-xs text-gray-500">
                          {ttsLanguage} · {
                            VOICE_OPTIONS.find(v => v.value === voice)?.label || voice
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        Adjust voice settings with the settings panel
                      </div>
                      <button 
                        onClick={toggleSettings}
                        className="text-[#f43f5e] hover:text-[#e22c4b] flex items-center"
                      >
                        <SettingsIcon className="w-4 h-4 mr-1" />
                        Open Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Regular Chat UI
            <>
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto px-4 py-6"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <div className="bg-white p-8 rounded-xl shadow-md max-w-md">
                      <div className="text-5xl mb-4">👋</div>
                      <h2 className="text-2xl font-bold text-[#f43f5e] mb-2">Welcome to AI Voice Tutor!</h2>
                      <p className="text-gray-600 mb-4">Start by asking any question below or click the microphone to speak.</p>
                      <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
                        <p className="mb-1"><strong>Examples:</strong></p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Explain photosynthesis in simple terms.</li>
                          <li>What are the main causes of climate change?</li>
                          <li>Help me understand multiplication tables.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                            message.type === 'user'
                              ? 'bg-[#f43f5e] text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none'
                          }`}
                        >
                          <div className="text-base whitespace-pre-wrap">
                            {message.text.split('\n').map((paragraph, idx) => (
                              <React.Fragment key={idx}>
                                {paragraph}
                                {idx < message.text.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </div>
                          
                          {/* Audio Player for Bot Messages */}
                          {message.type === 'bot' && message.audioSrc && (
                            <div className="mt-2 flex items-center justify-end">
                              <button
                                onClick={() => playAudio(message.audioSrc!)}
                                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                                  message.type === 'bot' ? 'text-[#f43f5e]' : 'text-white'
                                }`}
                                title="Play Audio"
                                aria-label="Play Audio Response"
                              >
                                <span className="text-lg">🔊</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm max-w-[85%]">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <div className="p-4 bg-white shadow-inner">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleFormSubmit} className="relative">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Ask anything... or click the microphone to speak"
                      className={`w-full p-4 pr-24 border-2 ${isRecording || isTranscribing ? 'border-[#f43f5e]' : 'border-gray-200'} 
                       rounded-xl focus:outline-none focus:border-[#f43f5e] transition-colors 
                       ${isTranscribing ? 'bg-pink-50' : 'bg-white'}`}
                      disabled={isProcessing || isTranscribing}
                      rows={3}
                      style={{ resize: 'none' }}
                    />
                    <div className="absolute right-2 bottom-3 flex items-center">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        disabled={isProcessing}
                        className={`p-3 rounded-full shadow-lg transition-all ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse scale-110'
                            : 'bg-[#f43f5e] text-white hover:scale-105'
                        }`}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                      >
                        {isRecording ? (
                          <MicOffIcon className="w-6 h-6" />
                        ) : (
                          <MicIcon className="w-6 h-6" />
                        )}
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing || isRecording || !textInput.trim()}
                        className={`ml-2 p-3 rounded-full ${
                          isProcessing || isRecording || !textInput.trim()
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#f43f5e] text-white shadow-lg hover:scale-105'
                        } transition-all`}
                        title="Send Message"
                        aria-label="Send Message"
                      >
                        <SendIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </form>
                  
                  {(isRecording || isTranscribing) && (
                    <div className="text-sm text-[#f43f5e] mt-2 flex items-center justify-center">
                      <span className={`inline-block w-2 h-2 rounded-full bg-[#f43f5e] mr-2 ${isRecording ? 'animate-pulse' : ''}`}></span>
                      {isRecording ? 'Recording... Click the microphone to stop' : 'Transcribing...'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Settings Sidebar */}
        {showSettings && (
          <div className="w-80 bg-white p-5 shadow-md overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Voice Settings</h2>
              
              {/* Language Selection */}
              <div className="mb-4">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  🎧 Language
                </label>
                <select
                  id="language"
                  value={ttsLanguage}
                  onChange={(e) => {
                    const value = e.target.value as TTSLanguage;
                    setTTSLanguage(value);
                    setSTTLanguage(value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-[#f43f5e] focus:border-[#f43f5e]"
                  disabled={isProcessing || isRecording}
                >
                  {LANGUAGE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Voice Selection */}
              <div className="mb-4">
                <label htmlFor="voice" className="block text-sm font-medium text-gray-700 mb-1">
                  🗣️ Voice
                </label>
                <select
                  id="voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as Voice)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-[#f43f5e] focus:border-[#f43f5e]"
                  disabled={isProcessing || isRecording}
                >
                  {VOICE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <hr className="my-4 border-gray-200" />
              
              {/* Advanced Settings Toggle */}
              <button 
                onClick={toggleAdvancedSettings}
                className="flex items-center text-[#f43f5e] hover:text-pink-700 transition"
              >
                {showAdvancedSettings ? 
                  <ChevronUpIcon className="w-5 h-5 mr-1" /> : 
                  <ChevronDownIcon className="w-5 h-5 mr-1" />
                }
                {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
              </button>
            </div>
            
            {/* Advanced Settings */}
            {showAdvancedSettings && (
              <div className="space-y-4">
                {/* Pitch Slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="pitch" className="block text-sm font-medium text-gray-700">
                      Pitch
                    </label>
                    <span className="text-sm text-gray-500">{pitch}</span>
                  </div>
                  <input
                    id="pitch"
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-[#f43f5e]"
                    disabled={isProcessing}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Deep</span>
                    <span>Normal</span>
                    <span>High</span>
                  </div>
                </div>
                
                {/* Pace Slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="pace" className="block text-sm font-medium text-gray-700">
                      Speed
                    </label>
                    <span className="text-sm text-gray-500">{pace}x</span>
                  </div>
                  <input
                    id="pace"
                    type="range"
                    min="0.3"
                    max="3"
                    step="0.1"
                    value={pace}
                    onChange={(e) => setPace(parseFloat(e.target.value))}
                    className="w-full accent-[#f43f5e]"
                    disabled={isProcessing}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
                
                {/* Loudness Slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor="loudness" className="block text-sm font-medium text-gray-700">
                      Volume
                    </label>
                    <span className="text-sm text-gray-500">{loudness}x</span>
                  </div>
                  <input
                    id="loudness"
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={loudness}
                    onChange={(e) => setLoudness(parseFloat(e.target.value))}
                    className="w-full accent-[#f43f5e]"
                    disabled={isProcessing}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Quiet</span>
                    <span>Normal</span>
                    <span>Loud</span>
                  </div>
                </div>
                
                {/* STT Model Selection */}
                <div>
                  <label htmlFor="stt-model" className="block text-sm font-medium text-gray-700 mb-1">
                    Speech Recognition Model
                  </label>
                  <select
                    id="stt-model"
                    value={sttModel}
                    onChange={(e) => setSTTModel(e.target.value as 'saarika:v1' | 'saarika:v2' | 'saarika:flash')}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-[#f43f5e] focus:border-[#f43f5e]"
                    disabled={isProcessing || isRecording}
                  >
                    <option value="saarika:v2">Saarika v2 (Default)</option>
                    <option value="saarika:v1">Saarika v1</option>
                    <option value="saarika:flash">Saarika Flash (Fastest)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Icon components
function MicIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicOffIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="2 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
}

function SendIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function VolumeUpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

function SettingsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}