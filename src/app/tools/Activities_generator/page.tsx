"use client";

/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Add interface for Activity type
interface Activity {
  id: string;
  subject: string;
  grade: string;
  lesson: string;
  days: string;
  content: string;
  created_at: string;
  objectives?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LessonPlanActivitiesGenerator() {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [lesson, setLesson] = useState("");
  const [days, setDays] = useState("");
  const [objectives, setObjectives] = useState("");
  const [country, setCountry] = useState("");
  const [board, setBoard] = useState("");
  const [lessonPlan, setLessonPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previousActivities, setPreviousActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  useEffect(() => {
    async function fetchPreviousActivities() {
      const { data, error } = await supabase
        .from("lesson_plans_activities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching previous activities:", error);
      } else {
        setPreviousActivities(data || []);
      }
    }
    fetchPreviousActivities();
  }, []);

  const handleGenerateLesson = async () => {
    setLoading(true);
    setError("");
    setLessonPlan("");

    if (!subject || !grade || !lesson || !days) {
      setError("Please fill in all required fields: Subject, Grade, Lesson Topic, and Number of Days");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/groq-generate_activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          grade,
          lesson,
          days,
          objectives,
          country,
          board,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate lesson plan");
      }

      setLessonPlan(data.generatedLesson);
    } catch (err) {
      console.error("Generation Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      const { error } = await supabase
        .from("lesson_plans_activities")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting activity:", error);
      } else {
        setPreviousActivities(previousActivities.filter(activity => activity.id !== id));
      }
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-pink-500">Lesson Activities Generator</h1>
      <p className="text-gray-500 mb-6 text-center">
        Creates structured and optimized lesson activities for educators based on the subject, topic, grade, and duration provided.
      </p>

      
      {/* Generator Form */}
      <div className="w-full bg-white p-6 shadow-md rounded-lg mb-8">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-bold">Country</label>
            <select 
              className="w-full p-2 border rounded mb-2"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select country...</option>
              <option value="usa">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="canada">Canada</option>
              <option value="australia">Australia</option>
              <option value="india">India</option>
              <option value="germany">Germany</option>
              <option value="france">France</option>
              <option value="japan">Japan</option>
              <option value="china">China</option>
              <option value="brazil">Brazil</option>
              <option value="south_africa">South Africa</option>
              <option value="mexico">Mexico</option>
              <option value="italy">Italy</option>
              <option value="russia">Russia</option>
              <option value="uae">United Arab Emirates</option>
            </select>
          </div>

          <div>
            <label className="font-bold">Educational Board</label>
            <select 
              className="w-full p-2 border rounded mb-2"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
            >
              <option value="">Select board...</option>
              <option value="cbse">CBSE</option>
              <option value="icse">ICSE</option>
              <option value="state_board">State Board</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-bold">Subject</label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select subject...</option>
              <option value="math">Mathematics</option>
              <option value="science">Science</option>
              <option value="english">English</option>
              <option value="history">History</option>
              <option value="geography">Geography</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
              <option value="languages">Languages</option>
              <option value="environmental_science">Environmental Science</option>
            </select>
          </div>

          <div>
            <label className="font-bold">Grade</label>
            <select
              className="w-full p-2 border rounded"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">Select grade...</option>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  Grade {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="font-bold">Lesson</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter lesson topic..."
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-bold">Class Duration (Minutes)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="Enter duration..."
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold">Number of Days</label>
            <select
              className="w-full p-2 border rounded"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            >
              <option value="">Select days...</option>
              {[1, 2, 3, 4, 5, 6, 7, 10, 15, 30].map((d) => (
                <option key={d} value={d}>
                  {d} Days
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateLesson}
          className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 transition"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Lesson Activities"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {lessonPlan && (
          <div className="mt-6 w-full p-4 border rounded bg-gray-100">
            <h2 className="text-xl font-bold">Generated Lesson Plan Activities</h2>
            <p className="whitespace-pre-line">{lessonPlan}</p>
          </div>
        )}
      </div>

      {/* Previous Activities Section */}
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4 text-pink-600">Previous Activities</h2>
        <div className="space-y-4">
          {previousActivities.map((activity) => (
            <div key={activity.id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-pink-600">{activity.lesson}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-600 hover:text-pink-600 rounded-full hover:bg-gray-100"
                    title="View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleCopy(activity.content)}
                    className="p-2 text-gray-600 hover:text-pink-600 rounded-full hover:bg-gray-100"
                    title="Copy"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                • Subject: {activity.subject} • Grade: {activity.grade}
              </div>
              
              <div className="text-xs text-gray-500">
                Created: {formatDate(activity.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal and Toast components remain unchanged */}
      {isModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedActivity.lesson}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-line">
                {selectedActivity.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-pink-600 text-white px-4 py-2 rounded shadow-lg">
          {copySuccess}
        </div>
      )}
    </div>
  );
}


