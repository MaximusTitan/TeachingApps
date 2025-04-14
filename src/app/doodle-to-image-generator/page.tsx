'use client';

import { useState, useRef, useEffect } from 'react';
import { Eraser, Pencil, Trash2, Download, Wand2, PaintBucket, Palette, Settings, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Drawing color options
const colorOptions = [
  { value: '#000000', label: 'Black', className: 'bg-black' },
  { value: '#ff0000', label: 'Red', className: 'bg-red-500' },
  { value: '#00ff00', label: 'Green', className: 'bg-green-500' },
  { value: '#0000ff', label: 'Blue', className: 'bg-blue-500' },
  { value: '#ffff00', label: 'Yellow', className: 'bg-yellow-500' },
  { value: '#ff00ff', label: 'Pink', className: 'bg-pink-500' },
  { value: '#800080', label: 'Purple', className: 'bg-purple-500' },
  { value: '#ffa500', label: 'Orange', className: 'bg-orange-500' },
  { value: '#964B00', label: 'Brown', className: 'bg-amber-700' },
];

// Brush style options
const brushOptions = [
  { id: 'fine', label: 'Fine', size: 2, icon: '●', description: 'Fine detail' },
  { id: 'medium', label: 'Medium', size: 5, icon: '●', description: 'Normal lines' },
  { id: 'bold', label: 'Bold', size: 10, icon: '●', description: 'Thick lines' },
  { id: 'marker', label: 'Marker', size: 16, icon: '●', description: 'Fill areas' },
];

// Brush style effects
type BrushEffect = 'normal' | 'sketchy' | 'spray' | 'calligraphy';
const brushEffects: Record<BrushEffect, { label: string, icon: string, description: string }> = {
  normal: { label: 'Normal', icon: '━', description: 'Clean lines' },
  sketchy: { label: 'Sketchy', icon: '〰️', description: 'Rough edges' },
  spray: { label: 'Spray', icon: '•••', description: 'Spray paint' },
  calligraphy: { label: 'Calligraphy', icon: '〜', description: 'Variable width' }
};

export default function DoodleToImageGenerator() {
  // Canvas and drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentMode, setCurrentMode] = useState<'draw' | 'erase'>('draw');
  const [canvasHasDrawing, setCanvasHasDrawing] = useState(false);
  const [currentBrushSize, setCurrentBrushSize] = useState(5);
  const [currentBrushEffect, setCurrentBrushEffect] = useState<BrushEffect>('normal');
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  
  // History for undo/redo functionality
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoing, setIsUndoRedoing] = useState(false);

  // Image generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  // Always use maximum transformation (0.9)
  const transformationStrength = 0.9;
  const [usedPrompt, setUsedPrompt] = useState<string | null>(null);
  const [doodleCaption, setDoodleCaption] = useState<string | null>(null);

  // Initialize canvas with responsive height
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      // Get viewport height
      const viewportHeight = window.innerHeight;
      
      // Calculate the ideal height
      // Reserve space for: header (~60px) + color palette (~70px) + padding (~20px)
      const reservedSpace = 150;
      const idealHeight = Math.max(500, viewportHeight - reservedSpace);
      
      // Set canvas dimensions
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Set display size (css pixels)
      canvas.width = rect.width * dpr;
      canvas.height = idealHeight * dpr;
      
      // Set actual size in memory (scaled for higher resolution displays)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${idealHeight}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Scale all drawing operations by the dpr
        ctx.scale(dpr, dpr);
        
        // Fill the canvas with white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, idealHeight);
        
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        
        // Initialize history with blank canvas
        if (history.length === 0) {
          const blankCanvas = canvas.toDataURL('image/png');
          setHistory([blankCanvas]);
          setHistoryIndex(0);
        }
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
    
    const ctx = canvas.getContext('2d');
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

    // Set drawing properties based on mode
    if (currentMode === 'draw') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentBrushSize;
      
      // Special handling for spray brush
      if (currentBrushEffect === 'spray') {
        // Don't start a path for spray, as we'll be making individual dots
        setLastPos({ x, y });
        drawSpray(ctx, x, y);
        return;
      }
      
      // For other brushes, start the path
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      // Erase mode - use larger brush size
      ctx.strokeStyle = 'white';
      ctx.lineWidth = Math.max(20, currentBrushSize * 1.5);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    
    setLastPos({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    // Prevent default behavior for touch events to avoid scrolling while drawing
    if ('touches' in e) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
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

    // Different behavior based on brush effect
    if (currentMode === 'draw') {
      switch (currentBrushEffect) {
        case 'normal':
          drawNormal(ctx, x, y);
          break;
        case 'sketchy':
          drawSketchy(ctx, x, y);
          break;
        case 'spray':
          drawSpray(ctx, x, y);
          break;
        case 'calligraphy':
          drawCalligraphy(ctx, x, y);
          break;
      }
    } else {
      // Erase mode - simple straight line
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    setCanvasHasDrawing(true);
    setLastPos({ x, y });
  };

  // Normal brush - clean, smooth line
  const drawNormal = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    if (lastPos) {
      ctx.moveTo(lastPos.x, lastPos.y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  // Sketchy brush - slightly jittery lines for a sketch-like feel
  const drawSketchy = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    if (!lastPos) return;
    
    // Draw main line
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Draw a few additional short lines with slight offsets for the sketchy effect
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      
      // Random offsets
      const offset1 = (Math.random() - 0.5) * currentBrushSize * 0.5;
      const offset2 = (Math.random() - 0.5) * currentBrushSize * 0.5;
      
      ctx.moveTo(lastPos.x + offset1, lastPos.y + offset2);
      ctx.lineTo(x + offset2, y + offset1);
      
      // Use a slightly lighter opacity for these additional strokes
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  };
  
  // Spray brush - creates a spray paint effect
  const drawSpray = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Number of dots based on brush size
    const density = Math.floor(currentBrushSize * 2);
    const radius = currentBrushSize * 2;
    
    // Draw spray dots
    for (let i = 0; i < density; i++) {
      // Random position within the spray radius
      const offsetX = (Math.random() - 0.5) * radius * 2;
      const offsetY = (Math.random() - 0.5) * radius * 2;
      
      // Calculate distance from center (for circular spray)
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      
      // Only draw dots within the circular radius
      if (distance <= radius) {
        // Random dot size
        const dotSize = Math.random() * currentBrushSize * 0.5;
        
        // Draw individual dot
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
        ctx.fill();
      }
    }
  };
  
  // Calligraphy brush - line width varies based on direction
  const drawCalligraphy = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    if (!lastPos) return;
    
    // Calculate direction of stroke
    const dx = x - lastPos.x;
    const dy = y - lastPos.y;
    const angle = Math.atan2(dy, dx);
    
    // Save context state
    ctx.save();
    
    // Create a new path for this segment
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    
    // Set line width based on calligraphy angle
    // Thicker when moving horizontally, thinner when vertical
    const baseWidth = currentBrushSize;
    const widthVariation = Math.abs(Math.sin(angle)) * baseWidth + baseWidth * 0.5;
    ctx.lineWidth = widthVariation;
    
    // Draw the line to the current position
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Restore context state
    ctx.restore();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
    
    // Reset any context settings that might have been changed
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1.0;
      }
    }

    // Save the current state to history if the user was actually drawing
    if (!isUndoRedoing && canvasHasDrawing) {
      const image = getCanvasImage();
      // Remove any future history entries (if user went back and then drew something new)
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(image);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsUndoRedoing(false);
  };
  
  // Undo the last drawing action
  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoing(true);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Load the previous image from history
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = history[newIndex];
    }
  };
  
  // Redo a previously undone action
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoing(true);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Load the next image from history
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = history[newIndex];
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save current state to history before clearing
    if (canvasHasDrawing) {
      const currentImage = getCanvasImage();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentImage);
      // Add cleared state to history
      setHistory([...newHistory, '']);
      setHistoryIndex(newHistory.length);
    }
    
    // Fill with white instead of just clearing (which makes it transparent)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setCanvasHasDrawing(false);
    setEnhancedImage(null);
  };

  // Convert canvas to base64 image
  const getCanvasImage = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  // Enhance doodle using our API
  const enhanceDoodle = async () => {
    if (!canvasHasDrawing) {
      setError("Please draw something first!");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setUsedPrompt(null);
    setDoodleCaption(null);
    
    // Start progress animation
    let progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        // Slowly increment to 95%, the last 5% will be set when the response returns
        if (prev >= 95) return 95;
        return prev + (95 - prev) * 0.1;
      });
    }, 300);
    
    try {
      const imageBase64 = getCanvasImage();
      
      // Call our API endpoint instead of directly using Fal.ai
      const response = await fetch('/api/doodle-to-image-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64,
          transformationStrength 
        }),
      });
      
      // Parse the response data first to get any error messages
      const data = await response.json();
      
      if (!response.ok) {
        // Use the server's error message if available
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      // Expect imageUrl instead of imageBase64
      if (data.success && data.imageUrl) {
        setGenerationProgress(100); // Set to 100% when complete
        setEnhancedImage(data.imageUrl); // Store the URL
        
        // Store the prompt and caption used for the generation
        if (data.usedPrompt) {
          setUsedPrompt(data.usedPrompt);
        }
        if (data.caption) {
          setDoodleCaption(data.caption);
        }
      } else {
        throw new Error(data.error || 'No image URL was returned');
      }
    } catch (err) {
      console.error('Error enhancing drawing:', err);
      setError(err instanceof Error ? err.message : 'Failed to enhance your doodle');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      // Reset progress bar after a delay to see the 100% state
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  // Download the enhanced image (needs to fetch from URL now)
  const downloadImage = async () => {
    if (!enhancedImage) return;

    try {
      // Fetch the image data from the URL
      const response = await fetch(enhancedImage);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Set the download name
      const date = new Date();
      const filename = `doodle-enhanced-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.png`; // Assuming PNG, adjust if needed
      
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error downloading enhanced image:", err);
      setError(err instanceof Error ? err.message : "Failed to download image");
    }
  };

  // Update cursor position and visibility
  const updateCursor = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    setCursorPos({ x, y });
    setShowCursor(true);
  };

  const hideCursor = () => {
    setShowCursor(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F2F4]">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-[#f43f5e]">Doodle to Image Generator</h1>
          <p className="text-gray-600 text-lg mb-6">
            Draw anything you can imagine and watch it transform into a colorful artwork!
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Oops!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drawing Area */}
          <Card className="shadow-lg border-2 border-pink-200">
            <CardContent className="p-4 sm:p-6">
              {/* Drawing Tools - Moved to top of Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div className="text-lg font-semibold text-[#f43f5e] flex items-center">
                  <span className="mr-2">🖌️</span>
                  Drawing Canvas
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${currentMode === 'draw' ? 'bg-rose-100 border-rose-300' : ''}`}
                    onClick={() => setCurrentMode("draw")}
                    title="Draw"
                  >
                    <Pencil className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Draw</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${currentMode === 'erase' ? 'bg-rose-100 border-rose-300' : ''}`}
                    onClick={() => setCurrentMode("erase")}
                    title="Erase"
                  >
                    <Eraser className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Erase</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={clearCanvas}
                    title="Clear Canvas"
                  >
                    <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Clear</span>
                  </Button>
                </div>
              </div>
              
              {/* Undo/Redo Controls */}
              <div className="flex justify-end mb-2 space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                  className="rounded-full hover:bg-rose-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M9 14 4 9l5-5"/>
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
                  </svg>
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                  className="rounded-full hover:bg-rose-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m15 14 5-5-5-5"/>
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
                  </svg>
                  Redo
                </Button>
              </div>

              {/* Drawing Canvas */}
              <div className="relative bg-white border-2 border-pink-200 rounded-lg shadow-md overflow-hidden">
                <canvas 
                  ref={canvasRef}
                  className="w-full touch-none" 
                  onMouseDown={startDrawing}
                  onMouseMove={(e) => {
                    draw(e);
                    updateCursor(e);
                  }}
                  onMouseUp={endDrawing}
                  onMouseLeave={() => {
                    endDrawing();
                    hideCursor();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startDrawing(e);
                    updateCursor(e);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    draw(e);
                    updateCursor(e);
                  }}
                  onTouchEnd={() => {
                    endDrawing();
                    hideCursor();
                  }}
                  style={{ touchAction: 'none' }}
                />
                {showCursor && (
                  <div
                    ref={cursorRef}
                    className="absolute pointer-events-none rounded-full border-2 border-gray-500"
                    style={{
                      width: `${currentBrushSize * 2}px`,
                      height: `${currentBrushSize * 2}px`,
                      left: `${cursorPos.x - currentBrushSize}px`,
                      top: `${cursorPos.y - currentBrushSize}px`,
                      backgroundColor: currentMode === 'erase' ? 'rgba(255,255,255,0.5)' : `${currentColor}33`
                    }}
                  />
                )}
              </div>

              {/* Drawing Tools - Tabs UI */}
              <div className="mt-4">
                <Tabs defaultValue="colors" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-2">
                    <TabsTrigger value="colors" className="flex items-center gap-1">
                      <Palette className="h-4 w-4" />
                      <span>Colors</span>
                    </TabsTrigger>
                    <TabsTrigger value="brushes" className="flex items-center gap-1">
                      <Brush className="h-4 w-4" />
                      <span>Brush Size</span>
                    </TabsTrigger>
                    <TabsTrigger value="effects" className="flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      <span>Effects</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Colors Tab */}
                  <TabsContent value="colors" className="p-0 border-0">
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
                  </TabsContent>
                  
                  {/* Brush Size Tab */}
                  <TabsContent value="brushes" className="p-0 border-0">
                    <div className="py-4 px-5 bg-white/90 backdrop-blur-sm rounded-xl shadow-inner border border-pink-200">
                      <div className="grid grid-cols-4 gap-3">
                        {brushOptions.map((brush) => (
                          <button
                            key={brush.id}
                            onClick={() => {
                              setCurrentBrushSize(brush.size);
                              setCurrentMode("draw");
                            }}
                            className={`py-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                              currentBrushSize === brush.size
                                ? 'bg-rose-100 border border-rose-300 shadow-inner'
                                : 'bg-white border border-gray-200 hover:bg-rose-50'
                            }`}
                            title={brush.description}
                          >
                            <span 
                              style={{ 
                                fontSize: `${brush.size * 1.5}px`, 
                                lineHeight: '1' 
                              }}
                            >
                              {brush.icon}
                            </span>
                            <span className="text-xs font-medium mt-2">{brush.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Effects Tab */}
                  <TabsContent value="effects" className="p-0 border-0">
                    <div className="py-4 px-5 bg-white/90 backdrop-blur-sm rounded-xl shadow-inner border border-pink-200">
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(brushEffects).map(([key, effect]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setCurrentBrushEffect(key as BrushEffect);
                              setCurrentMode("draw");
                            }}
                            className={`py-3 rounded-lg flex flex-col items-center justify-center transition-all ${
                              currentBrushEffect === key
                                ? 'bg-rose-100 border border-rose-300 shadow-inner'
                                : 'bg-white border border-gray-200 hover:bg-rose-50'
                            }`}
                            title={effect.description}
                          >
                            <span className="text-lg mb-1">{effect.icon}</span>
                            <span className="text-xs font-medium">{effect.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Magic Button */}
              <div className="mt-6">
                {/* Progress Bar */}
                {generationProgress > 0 && (
                  <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-300 to-rose-500 transition-all duration-200 ease-in-out"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <Button 
                  onClick={enhanceDoodle}
                  disabled={isGenerating || !canvasHasDrawing}
                  className="w-full bg-[#f43f5e] hover:bg-[#eb1e4d] text-white font-bold py-4 rounded-xl transform hover:scale-[1.02] transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Enhancing your masterpiece...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Enhance My Doodle
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Image Display */}
          <Card className="shadow-lg border-2 border-pink-200">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="text-lg font-semibold text-[#f43f5e] mb-4 flex items-center">
                <span className="mr-2">✨</span>
                Enhanced Artwork
              </div>
              
              <div className="flex-1 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                {enhancedImage ? (
                  <div className="relative w-full h-full flex flex-col">
                    <div className="relative flex-1 overflow-hidden">
                      <img 
                        src={enhancedImage}
                        alt="Enhanced artwork" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 flex justify-center">
                      <Button 
                        onClick={downloadImage}
                        className="bg-[#f43f5e] hover:bg-[#eb1e4d] text-white font-semibold py-2 px-4 rounded-full transform hover:scale-105 transition-all duration-300 shadow-md flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Artwork
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    {isGenerating ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-4">
                          <div className="animate-pulse flex space-x-1">
                            <div className="h-3 w-3 bg-pink-400 rounded-full"></div>
                            <div className="h-3 w-3 bg-pink-500 rounded-full"></div>
                            <div className="h-3 w-3 bg-pink-600 rounded-full"></div>
                          </div>
                        </div>
                        <p>The artists are working their magic!</p>
                        <p className="text-sm mt-2">This might take a few seconds...</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-5xl mb-4">🖼️</div>
                        <p>Your enhanced artwork will appear here</p>
                        <p className="text-sm mt-2">Draw something and click "Enhance My Doodle"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}