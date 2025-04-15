"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, Upload, Volume2, Loader2, Mic, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadForm } from "@/app/tools/story-listener/components/UploadForm";
import { RecordAudio } from "@/app/tools/story-listener/components/RecordAudio";
import { FeedbackCard } from "@/app/tools/story-listener/components/FeedbackCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedbackResponse {
  transcript: string;
  feedback: {
    praise: string[];
    suggestions: string[];
    questions: string[];
    overall: string;
  };
}

type InputMode = "upload" | "record";

export default function StoryListener() {
  const [inputMode, setInputMode] = useState<InputMode>("record");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const processAudio = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setFeedback(null);
    
    // Create object URL for audio playback
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Step 1: Send the audio file for transcription
      const transcriptionResponse = await fetch("/api/story-listener/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.text();
        throw new Error(`Transcription failed: ${errorData}`);
      }

      const { transcript } = await transcriptionResponse.json();

      if (!transcript) {
        throw new Error("Failed to transcribe audio. Please try again.");
      }

      // Step 2: Get feedback on the transcript
      const feedbackResponse = await fetch("/api/story-listener/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      if (!feedbackResponse.ok) {
        const errorData = await feedbackResponse.text();
        throw new Error(`Failed to get feedback: ${errorData}`);
      }

      const feedbackData = await feedbackResponse.json();
      setFeedback({ transcript, feedback: feedbackData });
    } catch (err) {
      console.error("Error processing audio:", err);
      setError(err instanceof Error ? err.message : "An error occurred processing your story");
    } finally {
      setIsLoading(false);
    }
  };

  const resetTool = () => {
    setInputMode("record");
    setIsLoading(false);
    setError(null);
    setFeedback(null);
    setAudioUrl(null);
  };

  return (
    <main className="min-h-screen bg-[#F8F2F4]">
      <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Story Listener</h1>
          <p className="text-muted-foreground text-lg">
            Share your story and receive encouraging AI feedback!
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-1 gap-8">
          <Card className="shadow-lg border-2 border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 flex justify-center items-center">
              <div className="bg-white rounded-full p-1 flex items-center shadow-md">
                <button
                  onClick={() => setInputMode("record")}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-full transition-all duration-200",
                    inputMode === "record" 
                      ? "bg-rose-500 text-white shadow-inner" 
                      : "bg-transparent text-gray-600 hover:bg-rose-100"
                  )}
                >
                  <Mic className="h-4 w-4" />
                  <span>Record Story</span>
                </button>
                <button
                  onClick={() => setInputMode("upload")}
                  className={cn(
                    "flex items-center gap-2 py-2 px-4 rounded-full transition-all duration-200",
                    inputMode === "upload" 
                      ? "bg-rose-500 text-white shadow-inner" 
                      : "bg-transparent text-gray-600 hover:bg-rose-100"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Story</span>
                </button>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              {inputMode === "upload" ? (
                <UploadForm onFileUpload={processAudio} isLoading={isLoading} />
              ) : (
                <RecordAudio onAudioCapture={processAudio} isLoading={isLoading} />
              )}
            </CardContent>
          </Card>

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="h-12 w-12 text-pink-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-700">
                Processing your story... This may take a minute.
              </p>
            </div>
          )}

          {feedback && !isLoading && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button
                  onClick={resetTool}
                  variant="outline"
                  className="border-rose-300 hover:bg-rose-50 text-rose-600"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Another Story
                </Button>
              </div>
              
              {audioUrl && (
                <Card className="shadow-md border border-pink-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-pink-600" />
                      <h3 className="text-lg font-semibold">Your Story Recording</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-md p-3 shadow-inner">
                      <audio 
                        controls 
                        className="w-full h-10"
                        src={audioUrl}
                        style={{ 
                          borderRadius: '9999px',
                          outline: 'none'
                        }}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-rose-500">Story Transcript</h2>
                <Card className="shadow-md border border-pink-200 p-4">
                  <p className="whitespace-pre-line text-gray-700">{feedback.transcript}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-rose-500">Feedback on Your Story</h2>
                <FeedbackCard feedback={feedback.feedback} />
              </div>
              
              {/* Tell Another Story button at the end */}
              <div className="flex justify-center mt-10 pb-8">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-[#f43f5e] hover:bg-[#e11d48] text-white px-8 py-6 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Tell Another Story
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}