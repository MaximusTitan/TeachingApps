"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { createWorker } from "tesseract.js";
import { User, Bot, Upload, Send, Image as ImageIcon, PanelLeftOpen, Trash2, ArrowLeft, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import GeometryParser from './GeometryParser';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
type Message = {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
    chat_id?: string;
};

type ChatSession = {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
};

export default function MathBuddy() {
    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [extractedText, setExtractedText] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch chat sessions on first render
    useEffect(() => {
        fetchChatSessions();
    }, []);

    // Fetch messages when chat ID changes
    useEffect(() => {
        if (currentChatId) {
            fetchMessages(currentChatId);
        } else {
            setMessages([]);
        }
    }, [currentChatId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch all chat sessions
    const fetchChatSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('math_buddy_chats')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setChatSessions(data);

                // If no active chat and we have sessions, set the first one as active
                if (!currentChatId && data.length > 0) {
                    setCurrentChatId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
            toast({
                title: "Error",
                description: "Failed to load chat sessions",
                variant: "destructive",
            });
        }
    };

    // Fetch messages for a specific chat
    const fetchMessages = async (chatId: string) => {
        try {
            const { data, error } = await supabase
                .from('math_buddy_messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast({
                title: "Error",
                description: "Failed to load chat messages",
                variant: "destructive",
            });
        }
    };

    // Create a new chat session
    const createNewChat = async () => {
        try {
            const title = `Math Chat ${new Date().toLocaleString()}`;
            
            const { data, error } = await supabase
                .from('math_buddy_chats')
                .insert([
                    { 
                        title,
                        updated_at: new Date().toISOString() 
                    }
                ])
                .select();
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                const newChat = data[0];
                
                // Update the chats list and set the new chat as active
                setChatSessions([newChat, ...chatSessions]);
                
                // Set the new chat as current and reset messages to clear context
                setCurrentChatId(newChat.id);
                setMessages([]); // Clear message context for new chat
                
                // Clear input fields to start fresh
                setInput('');
                clearSelectedImage();
                
                toast({
                    title: "New Chat Created",
                    description: "Started a new math chat session",
                });
            }
        } catch (error) {
            console.error('Error creating chat session:', error);
            toast({
                title: "Error",
                description: "Failed to create new chat session",
                variant: "destructive",
            });
        }
    };

    // Delete a chat session
    const deleteChat = async (chatId: string) => {
        try {
            // Delete all messages in the chat
            await supabase
                .from('math_buddy_messages')
                .delete()
                .eq('chat_id', chatId);

            // Delete the chat session
            const { error } = await supabase
                .from('math_buddy_chats')
                .delete()
                .eq('id', chatId);

            if (error) throw error;

            // Update state
            setChatSessions(chatSessions.filter(chat => chat.id !== chatId));

            // If the deleted chat was active, set a new active chat
            if (currentChatId === chatId) {
                const remainingChats = chatSessions.filter(chat => chat.id !== chatId);

                if (remainingChats.length > 0) {
                    setCurrentChatId(remainingChats[0].id);
                } else {
                    setCurrentChatId(null);
                    setMessages([]);
                }
            }

            toast({
                title: "Chat Deleted",
                description: "Chat session and messages were removed",
            });
        } catch (error) {
            console.error('Error deleting chat:', error);
            toast({
                title: "Error",
                description: "Failed to delete chat session",
                variant: "destructive",
            });
        }
    };

    // Save a message to the database
    const saveMessage = async (message: Message) => {
        if (!currentChatId) {
            // Create a new chat if none exists
            await createNewChat();
        }

        try {
            const { data, error } = await supabase
                .from('math_buddy_messages')
                .insert([
                    {
                        ...message,
                        chat_id: currentChatId
                    }
                ]);

            if (error) throw error;

            // Update the chat's updated_at timestamp
            await supabase
                .from('math_buddy_chats')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentChatId);

            // Refresh the chat sessions list to update the order
            fetchChatSessions();

        } catch (error) {
            console.error('Error saving message:', error);
            toast({
                title: "Error",
                description: "Failed to save message",
                variant: "destructive",
            });
        }
    };

    // Handle file upload for image
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            
            // Create image preview
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Clear selected image
    const clearSelectedImage = () => {
        setImageFile(null);
        setImagePreview(null);
        
        // Clear the file input value so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Process image with Tesseract.js
    const processImage = async (file: File) => {
        setIsProcessingImage(true);
        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();
            return text;
        } catch (err) {
            console.error('Error processing image:', err);
            throw new Error('Failed to process image. Please try a clearer image.');
        } finally {
            setIsProcessingImage(false);
        }
    };

    // Generate AI response using API with contextual memory
    const generateResponse = async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Get current message history for context
            const currentMessages = [...messages];
            
            // Add the new user message to the UI immediately for better UX
            const userMessage: Message = { 
                role: 'user', 
                content: prompt 
            };
            
            // Update UI with the new message
            setMessages([...currentMessages, userMessage]);
            
            // Save the user message to database
            await saveMessage(userMessage);
            
            // Call the API route with the full conversation history
            const response = await fetch("/api/math-buddy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    prompt,  // Keep this for backward compatibility
                    messages: [...currentMessages, userMessage] // Send full history including new message
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to generate response: ${response.status} ${errorData}`);
            }

            const data = await response.json();
            const aiResponse = data.reply;

            // Create assistant message
            const assistantMessage: Message = { 
                role: 'assistant', 
                content: aiResponse
            };

            // Add assistant message to UI
            setMessages([...currentMessages, userMessage, assistantMessage]);
            
            // Save assistant message to database
            await saveMessage(assistantMessage);
            
            // Clear input fields
            setInput('');
            clearSelectedImage();
            
        } catch (error) {
            console.error('Error generating response:', error);
            setError('Failed to generate a response. Please try again.');
            toast({
                title: "Error",
                description: "Failed to get math answer",
                variant: "destructive",
            });
            
            // If error occurs, remove the user message
            setMessages([...messages]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let content = input.trim();
        
        // If we have an image, process it and add the text to the input
        if (imageFile) {
            try {
                setIsProcessingImage(true);
                
                // Add a user message showing the image is being processed
                const imageProcessingMsg: Message = {
                    role: 'user',
                    content: content || 'Processing math problem from image...'
                };
                
                // Get current messages for context
                const currentMessages = [...messages];
                
                // Update UI immediately
                setMessages([...currentMessages, imageProcessingMsg]);
                
                // Save to database
                await saveMessage(imageProcessingMsg);
                
                // Process the image
                const extractedText = await processImage(imageFile);
                
                // Create the full prompt combining user input and extracted text
                const fullPrompt = content 
                    ? `${content}\n\nImage text: ${extractedText}`
                    : `Please solve this math problem: ${extractedText}`;
                
                // Remove the processing message from UI before generating response
                setMessages(currentMessages);
                
                // Generate response with the combined prompt and context
                await generateResponse(fullPrompt);
                
            } catch (error) {
                setError('Failed to process image. Please try a clearer image.');
                toast({
                    title: "Error",
                    description: "Failed to process image",
                    variant: "destructive",
                });
                setIsProcessingImage(false);
            }
        } else if (content) {
            // Just text input, no image
            await generateResponse(content);
        } else {
            toast({
                title: "Error",
                description: "Please enter a message or upload an image",
                variant: "destructive",
            });
        }
    };

    // Focus textarea when clicking on the input area
    const focusTextarea = () => {
        textareaRef.current?.focus();
    };

    // Format datetime
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white">
            {/* Chat History Sidebar */}
            <div 
                className={cn(
                    "bg-white w-80 border-r border-pink-200 transition-all h-full shadow-md",
                    showSidebar ? "flex flex-col" : "hidden"
                )}
            >
                <div className="p-4 border-b border-pink-200 flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
                    <h2 className="text-xl font-bold text-rose-500">Chat History</h2>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={createNewChat}
                        className="border-pink-300 hover:bg-pink-50 text-rose-500 hover:text-rose-500 font-medium rounded-xl"
                    >
                        New Chat
                    </Button>
                </div>
                
                <ScrollArea className="flex-1">
                    {chatSessions.length === 0 ? (
                        <div className="p-4 text-center text-rose-500">
                            No chat history yet. Start a new chat!
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {chatSessions.map((chat) => (
                                <div 
                                    key={chat.id}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all",
                                        currentChatId === chat.id 
                                            ? "bg-pink-100 border border-pink-200" 
                                            : "hover:bg-pink-50"
                                    )}
                                    onClick={() => setCurrentChatId(chat.id)}
                                >
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate text-gray-700">{chat.title}</div>
                                        <div className="text-xs text-rose-500">{formatDate(chat.updated_at)}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteChat(chat.id);
                                        }}
                                        className="text-pink-400 hover:text-rose-500 hover:bg-pink-50 rounded-full"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-col w-full h-full">
                {/* Header - Fixed at top */}
                <header className="flex items-center justify-between p-4 bg-white border-b border-pink-200 shrink-0 shadow-sm">
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="text-rose-500 hover:bg-pink-50 rounded-full"
                        >
                            {showSidebar ? <ArrowLeft /> : <PanelLeftOpen />}
                        </Button>
                        <h1 className="text-2xl font-bold text-rose-500 ml-2">Math Buddy</h1>
                    </div>
                    <div className="text-sm text-rose-500 font-medium bg-pink-50 px-3 py-1 rounded-full">
                        Grades 1-4 Math Helper
                    </div>
                </header>

                {/* Messages Area - Scrollable */}
                <div className="flex-grow overflow-y-auto p-4 bg-white">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <Bot className="h-12 w-12 text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-rose-500 mb-2">Welcome to Math Buddy!</h2>
                            <p className="text-gray-600 max-w-md mb-6">
                                I'm here to help with your math problems. You can type your question or upload an image of a math problem.
                            </p>
                            <p className="text-sm text-rose-500 bg-pink-50 px-4 py-2 rounded-full inline-block">
                                Try asking something like "What is 12 + 8?" or "How do I subtract 7 from 15?"
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn(
                                    "flex",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}>
                                    <div className={cn(
                                        "max-w-[80%] rounded-xl p-4 shadow-md",
                                        message.role === "user" 
                                            ? "bg-gradient-to-r from-rose-500 to-pink-400 text-white rounded-tr-none" 
                                            : "bg-white border border-pink-200 rounded-tl-none"
                                    )}>
                                        <div className="flex items-center mb-2">
                                            {message.role === "assistant" ? (
                                                <Bot className="h-5 w-5 mr-2 text-rose-500" />
                                            ) : (
                                                <User className="h-5 w-5 mr-2 text-white" />
                                            )}
                                            <div className={cn(
                                                "font-medium",
                                                message.role === "user" ? "text-white" : "text-rose-500"
                                            )}>
                                                {message.role === "assistant" ? "Math Buddy" : "You"}
                                            </div>
                                        </div>
                                        <div className="whitespace-pre-line">
                                            {message.role === "assistant" ? (
                                                <GeometryParser text={message.content} />
                                            ) : (
                                                message.content
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area - Fixed at bottom */}
                <div className="p-4 bg-white border-t border-pink-200 shrink-0 shadow-lg">
                    <form onSubmit={handleSubmit}>
                        {/* Image Preview Area - only shown when an image is selected */}
                        {imagePreview && (
                            <div className="mb-2 p-2 border border-pink-200 rounded-xl bg-pink-50 flex items-start">
                                <div className="relative h-24 w-24 mr-2 rounded-xl overflow-hidden border border-pink-300">
                                    <img 
                                        src={imagePreview} 
                                        alt="Math problem" 
                                        className="h-full w-full object-cover" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-rose-500 mb-1">Math Problem Image</div>
                                    <div className="text-xs text-pink-500">Will be processed when you send your message</div>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={clearSelectedImage}
                                    className="h-8 w-8 text-pink-500 hover:bg-pink-100 hover:text-rose-500 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        
                        {/* Input with File Upload Button */}
                        <div className="flex flex-col bg-white rounded-xl border border-pink-300 focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500">
                            <div 
                                className="min-h-[80px] px-3 py-2 w-full cursor-text"
                                onClick={focusTextarea}
                            >
                                <Textarea
                                    ref={textareaRef}
                                    placeholder="Type your math question here... or upload an image of a math problem"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-transparent p-0 font-medium"
                                    rows={3}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border-t border-pink-100">
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-8 w-8 rounded-full text-pink-500 hover:text-rose-500 hover:bg-pink-50"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isLoading || (!input.trim() && !imageFile)}
                                    size="sm"
                                    className="bg-gradient-to-r from-rose-500 to-pink-400 hover:from-rose-600 hover:to-pink-500 text-white font-medium px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    {isLoading || isProcessingImage ? "Processing..." : "Send"}
                                    <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
