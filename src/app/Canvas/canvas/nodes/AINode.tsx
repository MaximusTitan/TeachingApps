'use client';

import { memo, useState } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, RefreshCw, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function AINode({ data }: { data: { label: string; content?: string } }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    // Add user message to history
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInput('');
    setIsLoading(true);
    
    try {
      // Dynamically import Groq SDK to avoid SSR issues
      const { Groq } = await import('groq-sdk');
      
      const groq = new Groq({
        apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
      });
      
      // Create conversation history for context
      const conversationHistory = [...messages, userMessage];
      
      const completion = await groq.chat.completions.create({
        messages: conversationHistory,
        model: 'llama3-70b-8192',
      });

      const assistantResponse = completion.choices[0]?.message?.content || '';
      
      // Add assistant response to history
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantResponse 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error processing request. Please try again.' 
      }]);
    }
    
    setIsLoading(false);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <Card className="w-[350px] border border-gray-200 shadow-md overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{data.label}</span>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleClearChat}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="h-[400px] flex flex-col">
        <CardContent className="p-4 bg-white flex-1 overflow-y-auto">
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-100 ml-6' 
                      : 'bg-gray-50 border border-gray-200 mr-6'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div className="text-sm prose-sm max-w-none">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              Ask me anything...
            </div>
          )}
        </CardContent>
        
        <div className="p-4 pt-0 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="resize-none h-[60px] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              size="icon"
              className="h-[60px] w-10 bg-blue-500 hover:bg-blue-600"
              onClick={handleSubmit}
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
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </Card>
  );
}

export default memo(AINode);