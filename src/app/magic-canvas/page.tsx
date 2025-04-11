"use client";

import { useState, useRef, useEffect } from "react";
import { Eraser, Pencil, Trash2, Palette, AlertCircle, MessageSquare, Gift, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ReactMarkdown from "react-markdown";

// Drawing color options
const colorOptions = [
  { value: "#000000", label: "Black", className: "bg-black" },
  { value: "#ff0000", label: "Red", className: "bg-red-500" },
  { value: "#00ff00", label: "Green", className: "bg-green-500" },
  { value: "#0000ff", label: "Blue", className: "bg-blue-500" },
  { value: "#ffff00", label: "Yellow", className: "bg-yellow-500" },
  { value: "#ff00ff", label: "Pink", className: "bg-pink-500" },
  { value: "#800080", label: "Purple", className: "bg-purple-500" },
  { value: "#ffa500", label: "Orange", className: "bg-orange-500" },
  { value: "#964B00", label: "Brown", className: "bg-amber-700" },
];

// Mystery box prompt options
const mysteryPrompts = [
  "Draw a creature with three eyes!",
  "Draw an animal that can fly underwater!",
  "Draw a house that can walk!",
  "Draw a dancing carrot wearing a hat!",
  "Draw a robot that makes cookies!",
  "Draw a flower that can sing!",
  "Draw a fish with rainbow wings!",
  "Draw a cloud that rains candy!",
  "Draw a friendly monster eating ice cream!",
  "Draw a tree that grows toys!",
  "Draw a magical vehicle that can go anywhere!",
  "Draw a superhero with a silly power!",
  "Draw a dinosaur playing a musical instrument!",
  "Draw shoes that let you bounce to the moon!",
  "Draw a pet from another planet!",
];

export default function MagicCanvas() {
  // Canvas and drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentMode, setCurrentMode] = useState<"draw" | "erase">("draw");
  const [canvasHasDrawing, setCanvasHasDrawing] = useState(false);

  // Feature state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  // AI response states
  const [imageCaption, setImageCaption] = useState<string>("");
  const [isConfirmingCaption, setIsConfirmingCaption] = useState(false);
  const [userDescription, setUserDescription] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<"none" | "story" | "coach" | "mystery">("none");
  
  // Mystery box state
  const [currentPrompt, setCurrentPrompt] = useState<string>("");

  // Initialize canvas with responsive height
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      // Get viewport height
      const viewportHeight = window.innerHeight;
      
      // Calculate the ideal height
      // Reserve space for: header (~60px) + color palette (~70px) + padding (~20px)
      const colorPaletteSpace = 150;
      const idealHeight = Math.max(500, viewportHeight - colorPaletteSpace);
      
      // Set canvas dimensions
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Set display size (css pixels)
      canvas.width = rect.width * dpr;
      canvas.height = idealHeight * dpr;
      
      // Set actual size in memory (scaled for higher resolution displays)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${idealHeight}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Scale all drawing operations by the dpr
        ctx.scale(dpr, dpr);
        
        // Explicitly fill the canvas with white
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, rect.width, idealHeight);
        
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
      }
    };
    
    // Initial setup
    updateCanvasSize();
    
    // Add listener for window resize and orientation change
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', () => {
      // Small delay to ensure proper dimensions after orientation change
      setTimeout(updateCanvasSize, 100);
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, []);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Prevent default behavior for touch events to avoid scrolling while drawing
    if ('touches' in e) {
      e.preventDefault();
    }
    
    // Get coordinates adjusted for canvas position
    let x, y;
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Set drawing properties based on mode
    if (currentMode === "draw") {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 5;
    } else {
      // Erase mode
      ctx.strokeStyle = "white";
      ctx.lineWidth = 20;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    // Prevent default behavior for touch events to avoid scrolling while drawing
    if ('touches' in e) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setCanvasHasDrawing(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Fill with white instead of just clearing (which makes it transparent)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setCanvasHasDrawing(false);
    
    // Reset states
    setActiveFeature("none");
    setImageCaption("");
    setIsConfirmingCaption(false);
    setUserDescription("");
    setAiResponse("");
    setCurrentPrompt("");
  };

  // Convert canvas to base64 image
  const getCanvasImage = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  };

  // Process image with AI
  const processCanvasImage = async () => {
    if (!canvasHasDrawing) {
      setError("Please draw something first!");
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const imageBase64 = getCanvasImage();
      
      // Send to API for image captioning
      const response = await fetch("/api/magic-canvas/caption-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageBase64 }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to process image");
      }
      
      const data = await response.json();
      setProcessedImage(imageBase64);
      return data.caption;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process your drawing");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Feature 1: Tell Me a Story
  const generateStory = async () => {
    try {
      const caption = await processCanvasImage();
      if (!caption) return;
      
      setImageCaption(caption);
      setIsConfirmingCaption(true);
    } catch (err) {
      setError("Failed to generate a story. Please try again.");
    }
  };

  // Generate a final story after caption confirmation
  const generateFinalStory = async (useCaption: boolean) => {
    setIsLoading(true);
    setIsConfirmingCaption(false);
    
    try {
      const finalDescription = useCaption ? imageCaption : userDescription;
      
      const response = await fetch("/api/magic-canvas/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: finalDescription }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate story");
      }
      
      const data = await response.json();
      setAiResponse(data.story);
      
      // Clear caption and user description after generating story to hide the input form
      // regardless of whether we used the caption or user description
      setUserDescription("");
      setImageCaption(""); // This ensures the input form doesn't show again
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate a story");
    } finally {
      setIsLoading(false);
    }
  };

  // Feature 2: Drawing Coach Mode
  const getDrawingSuggestions = async () => {
    try {
      const caption = await processCanvasImage();
      if (!caption) return;
      
      setImageCaption(caption);
      setIsConfirmingCaption(true);
    } catch (err) {
      setError("Failed to get drawing suggestions. Please try again.");
    }
  };

  // Generate final drawing suggestions after caption confirmation
  const generateFinalSuggestions = async (useCaption: boolean) => {
    setIsLoading(true);
    setIsConfirmingCaption(false);
    
    try {
      const finalDescription = useCaption ? imageCaption : userDescription;
      
      const response = await fetch("/api/magic-canvas/drawing-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: finalDescription }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get drawing suggestions");
      }
      
      const data = await response.json();
      setAiResponse(data.suggestions);
      
      // Clear caption and user description after generating suggestions
      setUserDescription("");
      setImageCaption(""); // This ensures the input form doesn't show again
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get drawing suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  // Feature 3: Mystery Box
  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * mysteryPrompts.length);
    setCurrentPrompt(mysteryPrompts[randomIndex]);
    setAiResponse("");
    setActiveFeature("mystery");
  };

  // Download canvas drawing as PNG image
  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasHasDrawing) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    
    // Set the download name - use current date/time to create unique filename
    const date = new Date();
    const filename = `magic-canvas-drawing-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.png`;
    
    // Convert canvas to data URL and set as link href
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    
    // Append to document, click to trigger download, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle feature button clicks
  const handleFeatureClick = (feature: "story" | "coach" | "mystery") => {
    setActiveFeature(feature);
    setAiResponse("");
    setImageCaption("");
    setIsConfirmingCaption(false);
    setUserDescription("");
    setError(null);
    
    if (feature === "story") {
      generateStory();
    } else if (feature === "coach") {
      getDrawingSuggestions();
    } else if (feature === "mystery") {
      getRandomPrompt();
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F2F4]">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-rose-500">Magic Canvas</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Draw freely and let AI respond to your creativity in fun, educational ways!
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-2 relative">
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${currentMode === 'draw' ? 'bg-rose-100 border-rose-300' : ''}`}
              onClick={() => setCurrentMode("draw")}
              title="Draw"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${currentMode === 'erase' ? 'bg-rose-100 border-rose-300' : ''}`}
              onClick={() => setCurrentMode("erase")}
              title="Erase"
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={clearCanvas}
              title="Clear Canvas"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
              onClick={downloadDrawing}
              disabled={!canvasHasDrawing}
              title="Download Drawing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </Button>
          </div>
          <CardContent className="p-6 space-y-6">
            {/* Drawing Canvas */}
            <div className="bg-white border-2 border-pink-200 rounded-lg shadow-md overflow-hidden relative">
              <canvas 
                ref={canvasRef}
                className="w-full touch-none" 
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={(e) => {
                  e.preventDefault(); // Prevent scrolling when drawing
                  startDrawing(e);
                }}
                onTouchMove={(e) => {
                  e.preventDefault(); // Prevent scrolling when drawing
                  draw(e);
                }}
                onTouchEnd={endDrawing}
                style={{ touchAction: 'none' }} // Disable browser handling of touch gestures
              />
              
              {currentPrompt && activeFeature === "mystery" && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-b-2 border-blue-300 p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {currentPrompt}
                    <span className="inline-block ml-2 transform rotate-12">✨</span>
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette */}
            <div className="flex flex-wrap gap-2 justify-center py-3 px-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-inner border border-pink-200">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-125 hover:rotate-12 active:scale-90 ${
                    currentColor === color.value 
                      ? 'border-gray-800 ring-4 ring-rose-200 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${color.className} shadow-md`}
                  onClick={() => {
                    setCurrentColor(color.value);
                    setCurrentMode("draw");
                  }}
                  title={color.label}
                />
              ))}
            </div>

            {/* Feature Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                disabled={isLoading || !canvasHasDrawing}
                className={`relative overflow-hidden flex items-center gap-2 bg-[#f43f5e] hover:bg-[#eb1e4d] text-white font-semibold py-6 transform hover:scale-105 transition-all duration-300 shadow-lg ${
                  activeFeature === 'story' ? 'ring-2 ring-pink-300 ring-offset-2' : ''
                }`}
                onClick={() => handleFeatureClick("story")}
              >
                <MessageSquare className="h-5 w-5" />
                Tell Me a Story About My Drawing
                {activeFeature !== 'story' && (
                  <span className="absolute inset-0 bg-white/10 animate-pulse-slow opacity-0 hover:opacity-100"></span>
                )}
              </Button>
              
              <Button 
                disabled={isLoading || !canvasHasDrawing}
                className={`relative overflow-hidden flex items-center gap-2 bg-[#f43f5e] hover:bg-[#eb1e4d] text-white font-semibold py-6 transform hover:scale-105 transition-all duration-300 shadow-lg ${
                  activeFeature === 'coach' ? 'ring-2 ring-pink-300 ring-offset-2' : ''
                }`}
                onClick={() => handleFeatureClick("coach")}
              >
                <Lightbulb className="h-5 w-5" />
                Drawing Coach (Suggestions)
                {activeFeature !== 'coach' && (
                  <span className="absolute inset-0 bg-white/10 animate-pulse-slow opacity-0 hover:opacity-100"></span>
                )}
              </Button>
              
              <Button 
                disabled={isLoading}
                className={`relative overflow-hidden flex items-center gap-2 bg-[#f43f5e] hover:bg-[#eb1e4d] text-white font-semibold py-6 transform hover:scale-105 transition-all duration-300 shadow-lg ${
                  activeFeature === 'mystery' ? 'ring-2 ring-pink-300 ring-offset-2' : ''
                }`}
                onClick={() => handleFeatureClick("mystery")}
              >
                <Gift className="h-5 w-5" />
                Mystery Box Prompts
                {activeFeature !== 'mystery' && (
                  <span className="absolute inset-0 bg-white/10 animate-pulse-slow opacity-0 hover:opacity-100"></span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show the caption confirmation or description inputs only when needed */}
        {(isConfirmingCaption || (!isConfirmingCaption && ((activeFeature === "story" || activeFeature === "coach") && imageCaption))) && (
          <div className="relative mt-6">
            {/* Caption Confirmation UI */}
            {isConfirmingCaption && (
              <Card className="shadow-lg border-2 border-[#f43f5e] bg-white opacity-100 transition-opacity duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-[#f43f5e] mb-3">
                      I think you drew:
                    </h2>
                    <div className="p-3 rounded-lg bg-white/70 backdrop-blur-sm border border-[#f43f5e] shadow-inner">
                      <p className="text-lg font-medium text-[#f43f5e] italic">{imageCaption}</p>
                    </div>
                    <p className="mt-4 text-gray-600 flex items-center justify-center gap-2">
                      <span>Is that right?</span>
                      <span className="inline-block text-lg">🤔</span>
                    </p>
                  </div>

                  {/* Yes and No Buttons */}
                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      onClick={() => {
                        if (activeFeature === "story") {
                          generateFinalStory(true);
                        } else if (activeFeature === "coach") {
                          generateFinalSuggestions(true);
                        }
                      }}
                      className="bg-[#f43f5e] hover:bg-[#eb1e4d] text-white font-medium py-3 px-6 rounded-full transform hover:scale-105 transition-all duration-200 shadow-md"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Yes, that's right!
                    </Button>

                    <Button
                      onClick={() => setIsConfirmingCaption(false)}
                      variant="outline"
                      className="border-2 border-[#f43f5e] text-[#f43f5e] hover:bg-[#f43f5e] hover:text-white font-medium py-3 px-6 rounded-full transform hover:scale-105 transition-all duration-200 shadow-md"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      No, I'll tell you
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Description Input - Story */}
            {!isConfirmingCaption && activeFeature === "story" && imageCaption && (
              <Card className="shadow-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-pink-100 opacity-100 transition-opacity duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="user-description" className="flex items-center text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      Tell us what you drew! <span className="ml-2">✏️</span>
                    </Label>
                    <Textarea 
                      id="user-description"
                      value={userDescription}
                      onChange={(e) => setUserDescription(e.target.value)}
                      placeholder="Describe your amazing drawing here..."
                      className="bg-white/80 backdrop-blur-sm border-2 border-pink-200 rounded-xl shadow-inner focus:border-pink-400 focus:ring-pink-300"
                      rows={3}
                    />
                    <Button 
                      onClick={() => generateFinalStory(false)}
                      className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white font-medium py-4 px-6 rounded-full transform hover:scale-105 transition-all duration-200 shadow-md"
                      disabled={!userDescription}
                    >
                      <span className="mr-2">✨</span> 
                      Create My Story!
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Description Input - Drawing Coach */}
            {!isConfirmingCaption && activeFeature === "coach" && imageCaption && (
              <Card className="shadow-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 opacity-100 transition-opacity duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="user-description" className="flex items-center text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                      Tell us what you drew! <span className="ml-2">🎨</span>
                    </Label>
                    <Textarea 
                      id="user-description"
                      value={userDescription}
                      onChange={(e) => setUserDescription(e.target.value)}
                      placeholder="Describe your awesome drawing here..."
                      className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-xl shadow-inner focus:border-purple-400 focus:ring-purple-300"
                      rows={3}
                    />
                    <Button 
                      onClick={() => generateFinalSuggestions(false)}
                      className="bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-full transform hover:scale-105 transition-all duration-200 shadow-md"
                      disabled={!userDescription}
                    >
                      <span className="mr-2">💡</span>
                      Get Drawing Tips!
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI Response Display */}
        {aiResponse && (
          <Card className="mt-6 shadow-lg border-2 border-[#f43f5e] bg-white rounded-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#f43f5e]"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#f43f5e]">
                  {activeFeature === "story" ? "Your Story" :
                  activeFeature === "coach" ? "Drawing Coach Says" :
                  "Mystery Box Reaction"}
                </h2>
                <span>
                  {activeFeature === "story" ? "📚" : 
                  activeFeature === "coach" ? "🎨" : "🎁"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="prose max-w-none text-gray-700 relative z-10">
              <div className="p-2 rounded-lg">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}