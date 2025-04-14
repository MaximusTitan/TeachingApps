"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  generateDiscussionPrompt,
  fetchDiscussionHistory,
  deleteDiscussionPrompt,
} from "./api";

// Constants (unchanged)
const countries = [
  { value: "india", label: "India" },
  { value: "nigeria", label: "Nigeria" },
  { value: "usa", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "other", label: "Other" },
];

const boardsByCountry: Record<string, Array<{ value: string; label: string }>> = {
  india: [
    { value: "cbse", label: "CBSE" },
    { value: "cisce", label: "CISCE" },
    { value: "state-board", label: "State Board" },
    { value: "ib", label: "IB" },
    { value: "caie", label: "CAIE" },
    { value: "nios", label: "NIOS" },
  ],
  nigeria: [
    { value: "waec", label: "WAEC" },
    { value: "neco", label: "NECO" },
    { value: "ubec", label: "UBEC" },
    { value: "state-board", label: "State Education Board" },
    { value: "cambridge", label: "Cambridge International" },
    { value: "ib", label: "IB" },
  ],
  usa: [
    { value: "state-board", label: "State Board" },
    { value: "common-core", label: "Common Core" },
    { value: "ap", label: "AP" },
    { value: "ib", label: "IB" },
  ],
  uk: [
    { value: "national-curriculum", label: "National Curriculum" },
    { value: "gcse", label: "GCSE" },
    { value: "a-levels", label: "A-Levels" },
    { value: "scottish", label: "Scottish Qualifications" },
    { value: "ib", label: "IB" },
  ],
  canada: [
    { value: "provincial", label: "Provincial Curriculum" },
    { value: "ib", label: "IB" },
  ],
  australia: [
    { value: "australian", label: "Australian Curriculum" },
    { value: "state", label: "State Curriculum" },
    { value: "ib", label: "IB" },
  ],
  other: [
    { value: "national", label: "National Curriculum" },
    { value: "international", label: "International Curriculum" },
    { value: "other", label: "Other" },
  ],
};

const subjects = [
  { value: "mathematics", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "computer-science", label: "Computer Science" },
  { value: "economics", label: "Economics" },
];

const engagementLevels = [
  { value: "quick", label: "Quick Discussion" },
  { value: "in-depth", label: "In-Depth Debate" },
  { value: "panel", label: "Structured Panel Talk" },
];

const gradeLevels = Array.from({ length: 12 }, (_, i) => ({
  value: `grade-${i + 1}`,
  label: `Grade ${i + 1}`,
}));

// Define interface for discussion history item
interface DiscussionItem {
  id: string;
  topic: string;
  subject: string;
  grade_level: string;
  time_limit: number;
  created_at: string;
  generated_prompts: string;
}

export default function DiscussionPromptGenerator() {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedBoard, setSelectedBoard] = useState(
    boardsByCountry[countries[0].value][0],
  );
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(gradeLevels[0]);
  const [selectedEngagementLevel, setSelectedEngagementLevel] = useState(
    engagementLevels[0],
  );
  const [topic, setTopic] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [viewedPrompt, setViewedPrompt] = useState("");
  const [discussionHistory, setDiscussionHistory] = useState<DiscussionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await fetchDiscussionHistory();
        setDiscussionHistory(history);
      } catch (err) {
        console.error("Error fetching discussion history:", err);
      }
    }
    loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic for discussion");
      return;
    }

    setIsLoading(true);
    setError("");
    setGeneratedPrompt("");
    setViewedPrompt("");

    try {
      const promptData = {
        country: selectedCountry,
        board: selectedBoard,
        subject: selectedSubject,
        gradeLevel: selectedGradeLevel,
        topic,
        timeLimit,
        engagementLevel: selectedEngagementLevel,
      };

      const result = await generateDiscussionPrompt(promptData);
      setGeneratedPrompt(result);

      // Refresh history
      const history = await fetchDiscussionHistory();
      setDiscussionHistory(history);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to generate discussion prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDiscussionPrompt(id);
      setDiscussionHistory(discussionHistory.filter((item) => item.id !== id));

      // If the currently viewed prompt was deleted, clear it
      if (
        viewedPrompt &&
        discussionHistory.find((item) => item.id === id)?.generated_prompts ===
        viewedPrompt
      ) {
        setViewedPrompt("");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleView = (prompt: string) => {
    setViewedPrompt(prompt);
    setGeneratedPrompt(""); // Clear the generated prompt when viewing history
  };

  const formatPromptForDisplay = (promptText: string) => {
    if (typeof promptText !== "string") return "";

    return promptText
      .replace(/(\d+\.\s*[^\n]+)/g, "\n$1\n") // Add newlines around numbered items
      .replace(/([A-Za-z]+:)/g, "\n\n**$1**") // Bold section headers
      .replace(
        /(Key Points to Consider|Follow-up Questions|Main Question|Suggested Structure):/g,
        "\n\n### $1:\n",
      ) // Format sections as headers
      .replace(/\n{3,}/g, "\n\n"); // Remove excessive newlines
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "#f43f5e" }}>
        Discussion Prompts Generator
      </h1>
      <p className="text-gray-600 mb-6">
        Spark insightful discussions and critical thinking with AI-generated
        prompts tailored for students.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 mb-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              value={selectedCountry.value}
              onChange={(e) =>
                setSelectedCountry(
                  countries.find((c) => c.value === e.target.value)!,
                )
              }
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Educational Board
            </label>
            <select
              value={selectedBoard.value}
              onChange={(e) =>
                setSelectedBoard(
                  boardsByCountry[selectedCountry.value].find(
                    (b) => b.value === e.target.value,
                  )!,
                )
              }
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {boardsByCountry[selectedCountry.value].map((board) => (
                <option key={board.value} value={board.value}>
                  {board.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject.value}
              onChange={(e) =>
                setSelectedSubject(
                  subjects.find((s) => s.value === e.target.value)!,
                )
              }
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <select
              value={selectedGradeLevel.value}
              onChange={(e) =>
                setSelectedGradeLevel(
                  gradeLevels.find((g) => g.value === e.target.value)!,
                )
              }
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {gradeLevels.map((grade) => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engagement Level
            </label>
            <select
              value={selectedEngagementLevel.value}
              onChange={(e) =>
                setSelectedEngagementLevel(
                  engagementLevels.find((eL) => eL.value === e.target.value)!,
                )
              }
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {engagementLevels.map((engagement) => (
                <option key={engagement.value} value={engagement.value}>
                  {engagement.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter discussion topic"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: "#f43f5e", color: "white" }}
          className="mt-4 p-2 rounded-lg w-full font-medium hover:bg-red-600 transition-colors"
        >
          {isLoading ? "Generating..." : "Generate Prompts"}
        </button>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>

      {/* Display current prompt */}
      {(generatedPrompt || viewedPrompt) && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {generatedPrompt ? "Generated Prompt" : "Viewing Saved Prompt"}
          </h2>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{generatedPrompt || viewedPrompt}</ReactMarkdown>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Discussion History</h2>
      <div className="bg-white shadow-md rounded-lg p-6">
        {discussionHistory.length > 0 ? (
          <ul className="divide-y">
            {discussionHistory.map(
              (item: {
                id: string;
                topic: string;
                subject: string;
                grade_level: string;
                time_limit: number;
                created_at: string;
                generated_prompts: string;
              }) => (
                <li
                  key={item.id}
                  className="py-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.topic}</p>
                    <div className="text-sm text-gray-500">
                      <span>
                        {item.subject} | {item.grade_level} | {item.time_limit}{" "}
                        min
                      </span>
                      <p className="mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(item.generated_prompts)}
                      style={{
                        backgroundColor: "#f43f5e",
                        color: "white",
                        border: "2px solid #f43f5e",
                      }}
                      className="px-3 py-1 rounded-lg hover:bg-red-600 hover:border-red-600 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        backgroundColor: "#f43f5e",
                        color: "white",
                        border: "2px solid #f43f5e",
                      }}
                      className="px-3 py-1 rounded-lg hover:bg-red-600 hover:border-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p>No discussion prompts found.</p>
        )}
      </div>
    </div>
  );
}
