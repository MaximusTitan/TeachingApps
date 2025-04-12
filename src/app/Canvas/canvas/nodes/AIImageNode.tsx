'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, Send, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// For demo purposes - in a real app you would use an actual AI image service
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
  'https://images.unsplash.com/photo-1572289596972-6a0678d8248d',
  'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e',
  'https://images.unsplash.com/photo-1548266652-99cf27701ced',
];

function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * PLACEHOLDER_IMAGES.length);
  return PLACEHOLDER_IMAGES[randomIndex];
}

function AIImageNode({ data }: { data: { label: string; content?: string; imageUrl?: string; updateNodeData?: (data: { content: string; imageUrl: string }) => void } }) {
  const [input, setInput] = useState(data.content || '');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [imageStyle, setImageStyle] = useState('Square HD');
  const [history, setHistory] = useState<string[]>([]);

  // Save state to node data
  useEffect(() => {
    if (data && typeof data.updateNodeData === 'function') {
      data.updateNodeData({
        content: input,
        imageUrl: imageUrl
      });
    }
  }, [data, input, imageUrl]);

  const handleImageGenerate = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      // Add the prompt to history
      setHistory(prev => [...prev, input]);
      
      // In a real implementation, you would call an API like Stability AI, Midjourney, etc.
      // This is a mock implementation that returns a random image after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get a random placeholder image
      const generatedImage = getRandomImage();
      setImageUrl(generatedImage);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    handleImageGenerate();
  };

  return (
    <Card className="min-w-[300px] border border-gray-200 shadow-md overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <Image className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">AI Image</span>
        </div>
        <Select value={imageStyle} onValueChange={setImageStyle}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Square HD">Square HD</SelectItem>
            <SelectItem value="Portrait">Portrait</SelectItem>
            <SelectItem value="Landscape">Landscape</SelectItem>
            <SelectItem value="Widescreen">Widescreen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CardContent className="p-4 bg-white space-y-3">
        {!imageUrl ? (
          <div className="flex flex-col gap-3">
            <div className="h-40 bg-gray-100 flex items-center justify-center rounded border border-gray-200">
              <p className="text-gray-400 text-sm text-center px-4">
                Enter a prompt and click the generate button to create an image
              </p>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your image..."
                className="resize-none h-[60px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleImageGenerate();
                  }
                }}
              />
              <Button
                size="icon"
                className="h-[60px] w-10 bg-blue-500 hover:bg-blue-600"
                onClick={handleImageGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="h-40 bg-gray-100 flex items-center justify-center rounded border border-gray-200 overflow-hidden">
              <img 
                src={imageUrl} 
                alt="AI generated" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Refine your prompt..."
                  className="resize-none h-[60px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleImageGenerate();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  className="h-[29px] w-10 bg-blue-500 hover:bg-blue-600"
                  onClick={handleImageGenerate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-[29px] w-10"
                  onClick={handleRegenerate}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </Card>
  );
}

export default memo(AIImageNode); 