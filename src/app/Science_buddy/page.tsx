"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Send, Mic, MicOff, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Message, sendMessage, scienceTopics, fetchChatMessages, fetchChatSessions } from "./scienceBuddyUtils";

export default function ScienceBuddy() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [isVoiceOutputActive, setIsVoiceOutputActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [storedMessages, setStoredMessages] = useState<Message[]>([]);
  // Add a state to track active chat session ID
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech recognition setup
  const recognitionRef = useRef<any>(null);

  // Add these functions for localStorage management
  const saveMessagesToLocalStorage = (messages: Message[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('scienceBuddyMessages', JSON.stringify(messages));
      setStoredMessages(messages); // Keep storedMessages in sync
    }
  };

  // Enhance the date formatting utilities
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Improve the loadMessagesFromLocalStorage function
  const loadMessagesFromLocalStorage = (): Message[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scienceBuddyMessages');
      if (saved) {
        try {
          // Parse the JSON and fix dates which come as strings from localStorage
          const parsedMessages = JSON.parse(saved);
          return parsedMessages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt)
          }));
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      }
    }
    
    // Create a default welcome message if nothing is found
    const welcomeMessage: Message = {
      id: uuidv4(),
      content: "Hi there! I'm your Science Buddy! I'm here to help you learn about science topics for elementary school students. What would you like to explore today?",
      role: "assistant",
      createdAt: new Date(),
    };
    return [welcomeMessage];
  };

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('scienceBuddyMessages');
    }
  };

  // Update the welcome message to be more prominent and provide topic suggestions
  const WELCOME_MESSAGE = `Hi there! I'm your Science Buddy!

I'm here to help you learn about exciting science topics for elementary school students.

You can ask me about:
• Animals and plants
• Weather and seasons
• Space and planets
• Rocks and minerals
• Water cycle
• Human body
• And much more!

What would you like to explore today?`;

  // Add a state to track if this is a fresh session
  const [isNewSession, setIsNewSession] = useState(true);

  // Improve the welcome message handling to ensure it appears on refresh
  useEffect(() => {
    // Load stored messages for the history sidebar only
    const savedMessages = loadMessagesFromLocalStorage();
    setStoredMessages(savedMessages);
    
    // Always reset main chat to just the welcome message on refresh
    const welcomeMessage: Message = {
      id: uuidv4(),
      content: WELCOME_MESSAGE,
      role: "assistant",
      createdAt: new Date(),
    };
    
    // Set messages to just the welcome message
    setMessages([welcomeMessage]);
    
    // Update timestamp for session tracking
    localStorage.setItem('lastSessionTime', Date.now().toString());
    
    setShowWelcome(false);
  }, []); // Empty dependency array ensures this runs only once on initial render

  // Scroll to bottom of messages when page loads
  useEffect(() => {
    // Scroll to the bottom after a short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []); // Run once on initial render

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsVoiceInputActive(false);
        };
        
        recognition.onerror = () => {
          setIsVoiceInputActive(false);
        };
        
        recognition.onend = () => {
          setIsVoiceInputActive(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsVoiceInputActive(true);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsVoiceInputActive(false);
    }
  };

  const toggleVoiceOutput = () => {
    setIsVoiceOutputActive(!isVoiceOutputActive);
    
    // If turning voice on, speak the most recent assistant message
    if (!isVoiceOutputActive) {
      // Find the most recent assistant message
      const assistantMessages = messages.filter(msg => msg.role === "assistant");
      if (assistantMessages.length > 0) {
        const mostRecentMessage = assistantMessages[assistantMessages.length - 1];
        speakText(mostRecentMessage.content);
      }
    } else {
      // If turning voice off, cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const speakText = (text: string) => {
    if (isVoiceOutputActive && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for children
      utterance.pitch = 1.1; // Slightly higher pitch for friendliness
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load chat sessions and messages
  useEffect(() => {
    // Load the stored chat sessions from Supabase
    fetchChatSessions().then(sessions => {
      if (sessions.length > 0) {
        console.log(`Found ${sessions.length} chat sessions`);
        
        // Load message history sidebar
        const savedMessages = loadMessagesFromLocalStorage();
        setStoredMessages(savedMessages);
        
        // Initialize with welcome message only
        const welcomeMessage: Message = {
          id: uuidv4(),
          content: WELCOME_MESSAGE,
          role: "assistant",
          createdAt: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }).catch(err => {
      console.error("Error loading chat sessions:", err);
    });
  }, []);

  // Attempt to load chat messages when a chat is selected
  useEffect(() => {
    if (selectedChatId) {
      // Set this as the active chat
      setActiveChatId(selectedChatId);
      
      // Load the messages for this chat session
      fetchChatMessages(selectedChatId).then(chatMessages => {
        if (chatMessages.length > 0) {
          // Keep welcome message at top
          const welcomeMessage = messages[0];
          setMessages([welcomeMessage, ...chatMessages]);
          
          // Scroll to bottom after messages load
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        }
      }).catch(err => {
        console.error("Error loading chat messages:", err);
        setError("Failed to load chat history");
      });
    }
  }, [selectedChatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      setError("Please enter a message");
      return;
    }
    
    const userMessage: Message = {
      id: uuidv4(),
      content: inputMessage,
      role: "user",
      createdAt: new Date(),
      // Add active chat_id if one exists
      chat_id: activeChatId || undefined
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Add to stored messages
    const updatedStoredMessages = [...storedMessages, userMessage];
    setStoredMessages(updatedStoredMessages);
    saveMessagesToLocalStorage(updatedStoredMessages);
    
    setInputMessage("");
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sendMessage(userMessage.content, messages);
      
      const assistantMessage: Message = {
        id: uuidv4(),
        content: typeof result === 'object' ? result.reply : result,
        role: "assistant",
        createdAt: new Date(),
      };
      
      // If we received a chat_id, use it for this conversation
      if (typeof result === 'object' && result.chat_id) {
        const chatId = result.chat_id;
        assistantMessage.chat_id = chatId;
        
        // If this is a new session or we don't have an active chat, set it
        if (!activeChatId || (result as any).isNewSession) {
          setActiveChatId(chatId);
          
          // Update previous messages in this session with the chat_id
          updatedMessages.forEach(msg => {
            if (!msg.chat_id) {
              msg.chat_id = chatId;
            }
          });
        }
      }
      
      const updatedWithReply = [...updatedMessages, assistantMessage];
      setMessages(updatedWithReply);
      
      // Update stored messages
      const updatedStoredWithReply = [...updatedStoredMessages, assistantMessage];
      setStoredMessages(updatedStoredWithReply);
      saveMessagesToLocalStorage(updatedStoredWithReply);
      
      if (isVoiceOutputActive) {
        speakText(assistantMessage.content);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderTopicSuggestions = () => {
    return (
      <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 mt-2 shadow-sm">
        <h3 className="text-sm font-semibold text-rose-500 mb-2">explore this topics:</h3>
        <div className="flex flex-wrap gap-2">
          {['Space', 'Animals', 'Weather', 'Planets', 'Plants', 'Oceans', 'Dinosaurs', 'Electricity'].map(topic => (
            <span 
              key={topic}
              className="bg-white px-2 py-1 rounded-full text-xs text-rose-500 border border-gray-300 cursor-pointer hover:bg-rose-50 shadow-sm"
              onClick={() => {
                setInputMessage(`Tell me about ${topic}`);
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const handleMessageClick = (content: string) => {
    speakText(content);
  };

  const clearChat = () => {
    // Save the welcome message
    const welcomeMessage: Message = {
      id: uuidv4(),
      content: "Hi there! I'm your Science Buddy! I'm here to help you learn about science topics for elementary school students. What would you like to explore today?",
      role: "assistant",
      createdAt: new Date(),
    };
    
    // Only reset main chat area
    setMessages([welcomeMessage]);
    setSelectedChatId(null);
  };

  // Start a new chat
  const startNewChat = () => {
    // Reset the active chat ID
    setActiveChatId(null);
    setSelectedChatId(null);
    
    // Reset to just welcome message
    const welcomeMessage: Message = {
      id: uuidv4(),
      content: WELCOME_MESSAGE,
      role: "assistant",
      createdAt: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  // Update the renderChatHistory function to use storedMessages organized by chat sessions
  const renderChatHistory = () => {
    // Group messages by chat_id
    const chatSessions = new Map();
    
    // Filter out welcome message and organize by chat sessions
    storedMessages.forEach(msg => {
      if (msg.role === "user" && msg.chat_id) {
        if (!chatSessions.has(msg.chat_id)) {
          // Create a new session entry with the first user message as title
          chatSessions.set(msg.chat_id, {
            id: msg.chat_id,
            title: msg.content,
            userMessageId: msg.id,
            date: msg.createdAt
          });
        }
      }
    });
    
    // Convert to array and sort by most recent
    const sortedSessions = Array.from(chatSessions.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Delete a chat session from stored messages
    const deleteSession = (chatId: string) => {
      // Filter out all messages with the given chat_id
      const filteredMessages = storedMessages.filter(msg => msg.chat_id !== chatId);
      setStoredMessages(filteredMessages);
      saveMessagesToLocalStorage(filteredMessages);
      
      // If current session was deleted, reset to welcome message
      if (messages.some(msg => msg.chat_id === chatId)) {
        const welcomeMessage = messages[0];
        setMessages([welcomeMessage]);
        setActiveChatId(null);
      }
    };
    
    return (
      <div className="h-full overflow-y-auto pb-2">
        {sortedSessions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No conversation history yet</p>
        ) : (
          <div className="space-y-3 p-2">
            {sortedSessions.map((session) => (
              <div 
                key={session.id}
                className={`p-3 pb-8 rounded-lg shadow-sm 
                  ${activeChatId === session.id 
                    ? "border border-pink-200 bg-rose-50" 
                    : "border border-rose-100 hover:bg-rose-50 hover:border-rose-200"} 
                  relative group cursor-pointer transition-all`}
                onClick={() => {
                  // Load the full conversation for this chat session from Supabase
                  fetchChatMessages(session.id).then(chatMessages => {
                    if (chatMessages.length > 0) {
                      // Keep the welcome message and add the session messages
                      const welcomeMessage = messages[0];
                      setMessages([welcomeMessage, ...chatMessages]);
                      setSelectedChatId(session.id);
                      
                      // Scroll to the bottom after a short delay
                      setTimeout(() => {
                        if (messagesEndRef.current) {
                          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                    }
                  }).catch(err => {
                    console.error("Error loading chat session:", err);
                    setError("Failed to load chat history.");
                  });
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-rose-500">
                    {formatDate(session.date)}
                  </span>
                  <span className="text-xs text-rose-400">
                    {formatTime(session.date)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium truncate mb-3">
                  {session.title.substring(0, 60)}
                  {session.title.length > 60 ? "..." : ""}
                </p>
                
                {/* Delete button */}
                <button
                  className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen w-full bg-white overflow-hidden">
      <div className="h-screen w-full flex flex-col">
        {/* Header */}
        <div className="bg-white-500 py-4 px-6 shadow-md">
          <h1 className="text-3xl font-bold text-rose-500">Science Buddy</h1>
          <p className="text-rose-400">
            Your friendly AI companion for exploring science topics (Grades 1-4)
          </p>
        </div>

        {/* Main Content Area - Full Height */}
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 h-[calc(100vh-88px)]">
          {/* Left Side - Chat History */}
          <div className="md:w-1/4 h-full bg-white rounded-xl shadow-md border border-rose-200 flex flex-col overflow-hidden">
            <div className="bg-rose-100 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-rose-500 ">Chat History</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-xs text-rose-500 bg-white/20 hover:bg-rose-500/30"
                  onClick={startNewChat}
                >
                  <span className="mr-1">+</span> New Chat
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {renderChatHistory()}
            </div>
            <div className="p-2 border-t border-rose-100">
              {renderTopicSuggestions()}
            </div>
          </div>

          {/* Right Side - Chat Area - Takes more space */}
          <div className="md:w-3/4 h-full bg-white rounded-xl shadow-md border border-rose-200 flex flex-col overflow-hidden">
            <div className="bg-rose-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-rose-500">Chat with Science Buddy</h2>
            </div>
            
            {/* Welcome banner shown only when messages are empty */}
            {messages.length === 1 && (
              <div className="bg-gray-100 px-4 py-3 border-b border-pink-100">
                <div className="flex items-center">
                  <div>
                    <h3 className="font-medium text-rose-500">Welcome to Science Buddy!</h3>
                    <p className="text-sm text-gray-600">Ask me any science question - I'm here to help you explore and learn!</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['Space', 'Animals', 'Weather', 'Plants', 'Oceans'].map(topic => (
                      <span 
                        key={topic}
                        className="bg-white px-2 py-1 rounded-full text-xs text-rose-500 border border-gray-300 cursor-pointer hover:bg-rose-50 shadow-sm"
                        onClick={() => {
                          setInputMessage(`Tell me about ${topic}`);
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
              {messages.map((message, index) => (
                <div
                  id={`message-${message.id}`}
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    onClick={() => handleMessageClick(message.content)}
                    className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                      message.role === "user"
                        ? "bg-rose-400 text-black-500"
                        : index === 0 && message.content.includes("Science Buddy")
                          ? "bg-rose-50 border border-rose-200 shadow-sm" // Enhanced welcome message
                          : "bg-rose-50 border border-rose-100"
                    } ${message.role === "assistant" ? "leading-relaxed" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2">
                        <div className={`h-8 w-8 mr-2 rounded-full flex items-center justify-center ${
                          index === 0 && message.content.includes("Science Buddy")
                            ? "bg-rose-400" // Enhanced welcome message avatar
                            : "bg-rose-400"
                        }`}>
                          <span className="text-xs font-bold text-white">SB</span>
                        </div>
                        <span className={`text-sm font-semibold ${
                          index === 0 && message.content.includes("Science Buddy")
                            ? "text-rose-500" // Enhanced welcome message text
                            : "text-rose-500"
                        }`}>Science Buddy</span>
                      </div>
                    )}
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={`${i > 0 ? 'mt-3' : ''} ${message.role === "user" ? "text-black-400" : "text-gray-800"}`}>
                        {message.role === "assistant" ? (
                          <span dangerouslySetInnerHTML={{
                            __html: line
                              .replace(/Did you know\?/g, '<span class="font-semibold text-black-500">Did you know?</span>')
                              .replace(/Guess what\?/g, '<span class="font-semibold text-black-500">Guess what?</span>')
                              .replace(/Amazing fact:/g, '<span class="font-semibold text-black-500 block mt-2">Amazing fact:</span>')
                              .replace(/Cool discovery:/g, '<span class="font-semibold text-black-500 block mt-2">Cool discovery:</span>')
                              .replace(/Try this at home:/g, '<span class="font-semibold text-black-500 block mt-2 mb-1 border-l-4 border-rose-200 pl-2">Try this at home:</span>')
                              .replace(/Imagine you are/g, '<span class="font-semibold text-black-500">Imagine you are</span>')
                              .replace(/Imagine/g, '<span class="font-semibold text-black-500">Imagine</span>')
                              .replace(/Let's pretend/g, '<span class="font-semibold text-black-500">Let\'s pretend</span>')
                              .replace(/Can you spot/g, '<span class="font-semibold text-black-500">Can you spot</span>')
                              .replace(/What do you think would happen if/g, '<span class="font-semibold text-black-500">What do you think would happen if</span>')
                              .replace(/(BOOM!|SPLASH!|WHOOSH!|WOW!)/g, '<span class="font-bold text-black-500">$1</span>')
                              .replace(/\b([A-Z]{2,})\b/g, '<span class="font-bold text-black-500">$1</span>') // Style words in ALL CAPS
                          }} />
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                    <div className="mt-1 text-right">
                      <span className={`text-xs ${message.role === "user" ? "text-rose-100" : "text-gray-400"}`}>
                        {message.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mx-4 mb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>{error}</AlertDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6"
                    onClick={() => setError(null)}
                  >
                    &times;
                  </Button>
                </div>
              </Alert>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-rose-100">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about science topics..."
                    className="pr-10 bg-white border-rose-200 focus:border-rose-500 focus:ring-rose-100 rounded-full shadow-sm"
                    disabled={isLoading || isVoiceInputActive}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-600"
                    onClick={isVoiceInputActive ? stopVoiceInput : startVoiceInput}
                    disabled={isLoading}
                  >
                    {isVoiceInputActive ? (
                      <MicOff size={18} className="text-rose-400" />
                    ) : (
                      <Mic size={18} />
                    )}
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-5 transition-all shadow-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1 items-center">
                        <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <span className="ml-1 text-sm">thinking...</span>
                      </div>
                    </div>
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9f9f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(107 114 128); /* gray-500 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128); /* gray-500 */
        }
      `}</style>
    </main>
  );
}
