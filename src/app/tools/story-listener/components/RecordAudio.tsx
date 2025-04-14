"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecordAudioProps {
  onAudioCapture: (file: File) => void;
  isLoading: boolean;
}

export function RecordAudio({ onAudioCapture, isLoading }: RecordAudioProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopRecording();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onplaying = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);

        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start the timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access your microphone. Please ensure you've granted permission.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setSubmitted(false);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  };

  const handleSubmit = () => {
    if (audioBlob) {
      // Convert blob to File for consistency with upload flow
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
        lastModified: Date.now(),
      });
      setSubmitted(true);
      onAudioCapture(audioFile);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isRecording && (
        <div className="flex flex-col items-center bg-white p-6 rounded-lg border border-pink-200 shadow-sm">
          <div className={`text-3xl font-bold mb-5 ${isPaused ? "text-gray-500" : "text-rose-500"}`}>
            {formatTime(recordingTime)}
          </div>
          <div className="flex items-center gap-4 mb-4">
            {isPaused ? (
              <Button
                type="button"
                onClick={resumeRecording}
                className="bg-[#f43f5e] hover:bg-[#e11d48] text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button
                type="button"
                onClick={pauseRecording}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            <Button
              type="button"
              onClick={stopRecording}
              variant="outline"
              className="border-rose-200 hover:bg-rose-50 text-rose-600"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>

          <div className={`flex items-center ${isPaused ? "" : "animate-pulse"}`}>
            <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-gray-400" : "bg-rose-500"} mr-2`}></div>
            <span className="text-sm text-gray-600">
              {isPaused ? "Recording paused" : "Recording in progress"}
            </span>
          </div>
        </div>
      )}

      {!isRecording && !audioUrl && !isLoading && (
        <div className="flex flex-col items-center py-6 bg-white border border-pink-200 rounded-lg shadow-sm">
          <p className="text-lg font-medium text-gray-700 mb-4">Press the button to start recording</p>
          <Button
            onClick={startRecording}
            className="bg-[#f43f5e] hover:bg-[#e11d48] text-white"
          >
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        </div>
      )}

      {audioUrl && !isLoading && !submitted && (
        <Card className="border border-pink-200">
          <CardContent className="p-5">
            <p className="text-lg font-medium text-gray-700 mb-4">Review your recording</p>

            <div className="mb-4">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-md p-3 shadow-inner">
                <audio 
                  ref={audioRef}
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
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Record Again
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-[#f43f5e] hover:bg-[#e11d48] text-white"
              >
                Get Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-6 bg-white border border-pink-200 rounded-lg">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin mb-3" />
          <p className="text-lg font-medium text-gray-700">Processing your recording...</p>
        </div>
      )}
    </div>
  );
}