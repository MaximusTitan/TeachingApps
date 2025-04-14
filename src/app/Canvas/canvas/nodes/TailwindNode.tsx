'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Code, Send, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock UI templates to simulate generation
const UI_TEMPLATES = {
  'dashboard': `<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dashboard Overview</h1>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
      <h3 class="font-medium text-blue-800 dark:text-blue-200">Total Users</h3>
      <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">1,245</p>
    </div>
    <div class="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
      <h3 class="font-medium text-green-800 dark:text-green-200">Revenue</h3>
      <p class="text-2xl font-bold text-green-900 dark:text-green-100">$12,345</p>
    </div>
    <div class="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
      <h3 class="font-medium text-purple-800 dark:text-purple-200">Active Projects</h3>
      <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">24</p>
    </div>
  </div>
</div>`,
  'login': `<div class="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md mx-auto">
  <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Sign In</h2>
  <form class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
      <input type="email" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-800 dark:text-white" />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
      <input type="password" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-800 dark:text-white" />
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <input type="checkbox" class="h-4 w-4 border-gray-300 rounded" />
        <label class="ml-2 block text-sm text-gray-700 dark:text-gray-200">Remember me</label>
      </div>
      <a href="#" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</a>
    </div>
    <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Sign In</button>
  </form>
  <div class="mt-6 text-center">
    <p class="text-sm text-gray-600 dark:text-gray-400">Don't have an account? <a href="#" class="font-medium text-blue-600 dark:text-blue-400 hover:underline">Sign up</a></p>
  </div>
</div>`,
  'landing': `<div class="bg-white dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="py-12 md:py-20">
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          <span class="block">Beautiful UI made</span>
          <span class="block text-blue-600 dark:text-blue-400">for modern apps</span>
        </h1>
        <p class="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Build stunning user interfaces with our responsive components powered by Tailwind CSS.
        </p>
        <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div class="rounded-md shadow">
            <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
              Get started
            </a>
          </div>
          <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
              Live demo
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`
};

// Helper function to search for relevant UI template or generate a random one
function generateUITemplate(prompt: string) {
  prompt = prompt.toLowerCase();
  
  if (prompt.includes('dashboard') || prompt.includes('analytics') || prompt.includes('admin')) {
    return UI_TEMPLATES.dashboard;
  } else if (prompt.includes('login') || prompt.includes('sign in') || prompt.includes('authentication')) {
    return UI_TEMPLATES.login;
  } else if (prompt.includes('landing') || prompt.includes('home') || prompt.includes('main page')) {
    return UI_TEMPLATES.landing;
  }
  
  // If no match, return a random template
  const templates = Object.values(UI_TEMPLATES);
  return templates[Math.floor(Math.random() * templates.length)];
}

function TailwindNode({ data }: { data: { 
  label: string; 
  content?: string; 
  uiCode?: string;
  updateNodeData?: (data: { content: string; uiCode: string }) => void;
} }) {
  const [input, setInput] = useState(data.content || '');
  const [uiCode, setUiCode] = useState(data.uiCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [uiType, setUiType] = useState('component');

  // Save state to node data
  useEffect(() => {
    if (data && typeof data.updateNodeData === 'function') {
      data.updateNodeData({
        content: input,
        uiCode: uiCode
      });
    }
  }, [data, input, uiCode]);

  const handleGenerateUI = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API to generate Tailwind code
      // This is a mock implementation that returns a predefined template after 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generatedUI = generateUITemplate(input);
      setUiCode(generatedUI);
    } catch (error) {
      console.error('Error generating UI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(uiCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Card className="min-w-[350px] border border-gray-200 shadow-md overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <Code className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Tailwind UI</span>
        </div>
        <Select value={uiType} onValueChange={setUiType}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="UI Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="component">Component</SelectItem>
            <SelectItem value="page">Full Page</SelectItem>
            <SelectItem value="layout">Layout</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <CardContent className="p-3">
        {!uiCode ? (
          <div className="flex flex-col gap-3">
            <div className="h-40 bg-gray-100 flex items-center justify-center rounded border border-gray-200">
              <p className="text-gray-400 text-sm text-center px-4">
                Enter a description of the UI you want to generate
              </p>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the UI you want..."
                className="resize-none h-[60px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateUI();
                  }
                }}
              />
              <Button
                size="icon"
                className="h-[60px] w-10 bg-blue-500 hover:bg-blue-600"
                onClick={handleGenerateUI}
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
            <div className="h-[200px] bg-gray-100 flex flex-col rounded border border-gray-200 overflow-hidden">
              <div className="flex justify-between items-center p-2 bg-gray-200">
                <span className="text-xs font-medium text-gray-700">Preview</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleCopyCode}
                  >
                    {hasCopied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => window.open('https://play.tailwindcss.com/', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-2">
                <pre className="text-xs whitespace-pre-wrap text-gray-800">{uiCode}</pre>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Refine your UI description..."
                  className="resize-none h-[60px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateUI();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  className="h-[29px] w-10 bg-blue-500 hover:bg-blue-600"
                  onClick={handleGenerateUI}
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
                  onClick={handleGenerateUI}
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

export default memo(TailwindNode); 