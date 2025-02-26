'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Copy, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the structure of a hook item
interface HookItem {
  id: number;
  topic: string;
  objective: string;
  grade: string;
  hook_type: string;
  country: string;
  board: string;
  subject: string;
  generated_hook: string;
  created_at: string;
}

const hookTypes = [
  'Story-based Hook',
  'Thought-provoking Question',
  'Real-world Connection',
  'Fun Fact or Riddle',
  'Role Play or Scenario-based Hook',
];

const countries = [
  { value: 'usa', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'australia', label: 'Australia' },
  { value: 'india', label: 'India' },
  { value: 'germany', label: 'Germany' },
  { value: 'france', label: 'France' },
  { value: 'japan', label: 'Japan' },
  { value: 'china', label: 'China' },
  { value: 'brazil', label: 'Brazil' },
  { value: 'south_africa', label: 'South Africa' },
  { value: 'mexico', label: 'Mexico' },
  { value: 'italy', label: 'Italy' },
  { value: 'russia', label: 'Russia' },
  { value: 'uae', label: 'United Arab Emirates' },
];

const boards = [
  { value: 'cbse', label: 'CBSE' },
  { value: 'icse', label: 'ICSE' },
  { value: 'state_board', label: 'State Board' },
  { value: 'ib', label: 'IB' },
  { value: 'cambridge', label: 'Cambridge' },
  { value: 'ssc', label: 'SSC' },
  { value: 'hsc', label: 'HSC' },
  { value: 'american', label: 'American Curriculum' },
  { value: 'british', label: 'British Curriculum' },
  { value: 'other', label: 'Other' },
];

const subjects = [
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'economics', label: 'Economics' },
  { value: 'business_studies', label: 'Business Studies' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'languages', label: 'Languages' },
  { value: 'environmental_science', label: 'Environmental Science' },
];

export default function LessonHookTool() {
  const [topic, setTopic] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [hookType, setHookType] = useState<string>(hookTypes[0]);
  const [hook, setHook] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [country, setCountry] = useState<string>('');
  const [board, setBoard] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HookItem[]>([]);
  const [viewingHook, setViewingHook] = useState<HookItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;

  const allFieldsFilled = topic !== '' && objective !== '' && grade !== '' && country !== '' && board !== '' && subject !== '';

  // Pagination setup
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentItems = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Fetch history from Supabase
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_hooks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
      setCurrentPage(1); // Reset to first page when fetching new data
    } catch (err) {
      setError('Failed to fetch history');
    }
  };

  // Generate hook
  const generateHook = async () => {
    setIsLoading(true);
    setError(null);
    setIsGenerated(true);
    setMessage(null);

    if (!allFieldsFilled) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/generate-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          objective, 
          grade, 
          hook_type: hookType,
          country, 
          board, 
          subject 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate hook');
      }

      const data = await res.json();
      if (data.hook) {
        setHook(data.hook);
        fetchHistory(); // Refresh history after generation
      } else {
        throw new Error('No hook generated');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate hook');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy hook to clipboard
  const copyToClipboard = async () => {
    if (hook) {
      try {
        await navigator.clipboard.writeText(hook);
        setMessage("Copied to clipboard!");
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setError('Failed to copy to clipboard');
      }
    }
  };

  // Regenerate hook
  const handleRegenerate = () => {
    setIsGenerated(false);
    setHook('');
  };

  // Navigation for pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // View hook details
  const viewHookDetails = (hook: HookItem) => {
    setViewingHook(hook);
  };

  // Close hook details modal
  const closeHookDetails = () => {
    setViewingHook(null);
  };

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Scroll to output when hook is generated
  useEffect(() => {
    if (hook) {
      setMessage('Hook generated successfully!');
      setTimeout(() => setMessage(null), 3000);
      outputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hook]);

  // Delete hook from history - Fixed function
  const deleteHook = async (id: number) => {
    try {
      const { error } = await supabase
        .from('lesson_hooks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state to immediately reflect deletion
      setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
      if (viewingHook && viewingHook.id === id) {
        setViewingHook(null);
      }
      setMessage('Hook deleted successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete hook');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-pink-500 mb-4">Lesson Hook Generator</h1>
      <p className="text-gray-500 mb-6 text-center">
        Create engaging lesson hooks to capture your students' attention effectively.
      </p>

      <div className="w-full bg-white p-6 shadow-md rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Country */}
          <div>
            <label className="font-bold">Country</label>
            <select
              className={`w-full p-2 border rounded mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
                isGenerated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isGenerated}
            >
              <option value="">Select country...</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          {/* Educational Board */}
          <div>
            <label className="font-bold">Educational Board</label>
            <select
              className={`w-full p-2 border rounded mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
                isGenerated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              disabled={isGenerated}
            >
              <option value="">Select board...</option>
              {boards.map((board) => (
                <option key={board.value} value={board.value}>
                  {board.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          {/* Subject */}
          <label className="font-bold">Subject</label>
          <select
            className={`w-full p-2 border rounded mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
              isGenerated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isGenerated}
          >
            <option value="">Select subject...</option>
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          {/* Grade Level Dropdown */}
          <label className="block font-bold mb-2">Grade Level</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className={`w-full border p-2 rounded mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
              isGenerated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isGenerated}
          >
            <option value="">Select Grade</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Grade {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson Topic */}
        <label className="block font-bold mb-2">Lesson Topic</label>
        <Input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={`w-full border p-2 rounded mb-4 !text-[15px] ${
            isGenerated ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          required
          disabled={isGenerated}
        />

        {/* Learning Objective */}
        <label className="block font-bold mb-2">Learning Objective</label>
        <Input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className={`w-full border p-2 rounded mb-4 !text-[15px] ${
            isGenerated ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          required
          disabled={isGenerated}
        />

        {/* Hook Type Dropdown */}
        <label className="block font-bold mb-2">Hook Type</label>
        <select
          value={hookType}
          onChange={(e) => setHookType(e.target.value)}
          className={`w-full p-2 border rounded mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
            isGenerated ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isGenerated}
        >
          {hookTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* Generate Hook Button */}
        <Button
          onClick={generateHook}
          disabled={!allFieldsFilled || isLoading || isGenerated}
          className={`w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
            !allFieldsFilled || isLoading || isGenerated ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Hook'}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-500 rounded">
            {error}
          </div>
        )}
      </div>
      
      {message && (
        <div className="fixed bottom-4 right-4 p-4 bg-pink-100 text-pink-600 rounded-lg z-50">
          {message}
        </div>
      )}
      
      {/* Hook Output */}
      <div ref={outputRef} className="mt-6 w-full">
        {hook && (
          <Card className="p-8 bg-pink-50 shadow-lg rounded-2xl border border-pink-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-pink-600">
                Lesson Plan: {topic}
              </h2>
              {/* Copy Button */}
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-800">
              <strong>Country:</strong> {countries.find((c) => c.value === country)?.label}
            </p>
            <p className="text-gray-800">
              <strong>Educational Board:</strong> {boards.find((b) => b.value === board)?.label}
            </p>
            <p className="text-gray-800">
              <strong>Subject:</strong> {subjects.find((s) => s.value === subject)?.label}
            </p>
            <p className="text-gray-800">
              <strong>Grade Level:</strong> {grade}
            </p>
            <p className="text-gray-800">
              <strong>Learning Objective:</strong> {objective}
            </p>
            <p className="text-gray-800">
              <strong>Hook Type:</strong> {hookType}
            </p>
            <p className="text-gray-800">
              <strong>Generated Hook:</strong> {hook}
            </p>
            {/* Regenerate Button */}
            <div className="mt-4 w-full">
              <Button className="w-full bg-pink-600 hover:bg-pink-700 transition" onClick={handleRegenerate}>
                Regenerate
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* History Section - Now wrapped in a Card */}
      <div className="w-full mt-8">
        <Card className="p-6 bg-white shadow-md rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-pink-600">History</h2>
            {history.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPrevPage} 
                  disabled={currentPage === 1}
                  className="p-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="p-1"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {currentItems.length > 0 ? (
            <div className="w-full space-y-2">
              {currentItems.map((item) => (
                <Card key={item.id} className="p-3 bg-gray-50 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <p className="font-medium text-pink-600 truncate">{item.topic}</p>
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <span>Grade {item.grade}</span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => viewHookDetails(item)}
                        className="p-1"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => deleteHook(item.id)}
                        className="p-1 bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mt-4">No history yet.</p>
          )}
        </Card>
      </div>

      {/* Hook Details Modal */}
      {viewingHook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-pink-600">{viewingHook.topic}</h3>
                <Button variant="ghost" size="sm" onClick={closeHookDetails}>
                  Close
                </Button>
              </div>
              
              <div className="space-y-2">
                <p><strong>Grade Level:</strong> {viewingHook.grade}</p>
                <p><strong>Subject:</strong> {subjects.find(s => s.value === viewingHook.subject)?.label}</p>
                <p><strong>Country:</strong> {countries.find(c => c.value === viewingHook.country)?.label}</p>
                <p><strong>Board:</strong> {boards.find(b => b.value === viewingHook.board)?.label}</p>
                <p><strong>Hook Type:</strong> {viewingHook.hook_type}</p>
                <p><strong>Learning Objective:</strong> {viewingHook.objective}</p>
                <p><strong>Created:</strong> {formatDate(viewingHook.created_at)}</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p className="font-medium mb-2">Generated Hook:</p>
                  <p>{viewingHook.generated_hook}</p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingHook.generated_hook);
                    setMessage("Copied to clipboard!");
                    setTimeout(() => setMessage(null), 3000);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy Hook
                </Button>
                <Button 
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                  onClick={() => {
                    deleteHook(viewingHook.id);
                    closeHookDetails();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}