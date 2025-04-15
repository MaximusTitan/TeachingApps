"use client";

import { useState, useRef } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadFormProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function UploadForm({ onFileUpload, isLoading }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isAudioFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        alert("Please upload an audio file (MP3, WAV, or M4A)");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isAudioFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        alert("Please upload an audio file (MP3, WAV, or M4A)");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onFileUpload(file);
    }
  };

  const isAudioFile = (file: File): boolean => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp3", "audio/x-wav"];
    return validTypes.includes(file.type);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] ${
          dragActive ? "border-pink-500 bg-pink-50" : "border-gray-300 hover:border-pink-400"
        } transition-colors cursor-pointer`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a"
          className="hidden"
          onChange={handleChange}
        />
        
        {!file ? (
          <>
            <FileAudio className="h-12 w-12 text-pink-600 mb-2" />
            <p className="text-lg font-medium mb-1">Drag & drop your audio file here</p>
            <p className="text-sm text-gray-500 mb-3">MP3, WAV, or M4A (max 15MB)</p>
            <Button
              type="button"
              className="bg-[#f43f5e] hover:bg-[#e11d48] text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Audio File
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center">
                <FileAudio className="h-6 w-6 text-pink-600 mr-2" />
                <span className="font-medium text-gray-800">{file.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-pink-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!file || isLoading}
        className="w-full bg-[#f43f5e] hover:bg-[#e11d48] text-white font-medium py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Processing..." : "Get Feedback on My Story"}
      </Button>
    </form>
  );
}