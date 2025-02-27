'use client';

import { useState, useEffect } from 'react';
import { generateDiscussionPrompt, fetchDiscussionHistory, deleteDiscussionPrompt } from './api';
import { countries, boardsByCountry, subjects, gradeLevels, engagementLevels } from '@/app/constant';

export default function DiscussionPromptGenerator() {
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [selectedBoard, setSelectedBoard] = useState(boardsByCountry[countries[0].value][0]);
    const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
    const [selectedGradeLevel, setSelectedGradeLevel] = useState(gradeLevels[0]);
    const [selectedEngagementLevel, setSelectedEngagementLevel] = useState(engagementLevels[0]);
    const [topic, setTopic] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);

    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [discussionHistory, setDiscussionHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadHistory() {
            try {
                const history = await fetchDiscussionHistory();
                setDiscussionHistory(history);
            } catch (err) {
                console.error('Error fetching discussion history:', err);
            }
        }
        loadHistory();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!topic.trim()) {
            setError('Please enter a topic for discussion');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedPrompt('');

        try {
            const promptData = {
                country: selectedCountry,
                board: selectedBoard,
                subject: selectedSubject,
                gradeLevel: selectedGradeLevel,
                topic,
                timeLimit,
                engagementLevel: selectedEngagementLevel
            };

            const result = await generateDiscussionPrompt(promptData);
            setGeneratedPrompt(result);

            // Refresh history
            const history = await fetchDiscussionHistory();
            setDiscussionHistory(history);
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Failed to generate discussion prompt.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDiscussionPrompt(id);
            setDiscussionHistory(discussionHistory.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Discussion Prompt Generator</h1>
            
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium">Country</label>
                        <select 
                            value={selectedCountry.value} 
                            onChange={(e) => setSelectedCountry(countries.find(c => c.value === e.target.value)!)}
                            className="border p-2 rounded w-full"
                        >
                            {countries.map((country) => (
                                <option key={country.value} value={country.value}>{country.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium">Educational Board</label>
                        <select 
                            value={selectedBoard.value} 
                            onChange={(e) => setSelectedBoard(boardsByCountry[selectedCountry.value].find(b => b.value === e.target.value)!)}
                            className="border p-2 rounded w-full"
                        >
                            {boardsByCountry[selectedCountry.value].map((board) => (
                                <option key={board.value} value={board.value}>{board.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium">Subject</label>
                        <select 
                            value={selectedSubject.value} 
                            onChange={(e) => setSelectedSubject(subjects.find(s => s.value === e.target.value)!)}
                            className="border p-2 rounded w-full"
                        >
                            {subjects.map((subject) => (
                                <option key={subject.value} value={subject.value}>{subject.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium">Grade Level</label>
                        <select 
                            value={selectedGradeLevel.value} 
                            onChange={(e) => setSelectedGradeLevel(gradeLevels.find(g => g.value === e.target.value)!)}
                            className="border p-2 rounded w-full"
                        >
                            {gradeLevels.map((grade) => (
                                <option key={grade.value} value={grade.value}>{grade.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium">Engagement Level</label>
                        <select 
                            value={selectedEngagementLevel.value} 
                            onChange={(e) => setSelectedEngagementLevel(engagementLevels.find(eL => eL.value === e.target.value)!)}
                            className="border p-2 rounded w-full"
                        >
                            {engagementLevels.map((engagement) => (
                                <option key={engagement.value} value={engagement.value}>{engagement.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium">Time Limit (minutes)</label>
                        <input 
                            type="number" 
                            value={timeLimit} 
                            onChange={(e) => setTimeLimit(Number(e.target.value))} 
                            className="border p-2 rounded w-full"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block font-medium">Topic</label>
                        <input 
                            type="text" 
                            value={topic} 
                            onChange={(e) => setTopic(e.target.value)} 
                            className="border p-2 rounded w-full" 
                            placeholder="Enter discussion topic" 
                            required 
                        />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="mt-4 bg-blue-600 text-white p-2 rounded w-full">
                    {isLoading ? 'Generating...' : 'Generate Prompt'}
                </button>

                {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>

            {generatedPrompt && (
                <div className="bg-gray-100 p-4 rounded shadow mb-6">
                    <h2 className="text-xl font-bold mb-2">Generated Prompt</h2>
                    <p>{generatedPrompt}</p>
                </div>
            )}

            <h2 className="text-xl font-bold mb-4">Discussion History</h2>
            <ul className="bg-white shadow-md rounded p-6">
                {discussionHistory.length > 0 ? (
                    discussionHistory.map((item) => (
                        <li key={item.id} className="flex justify-between items-center p-2 border-b">
                            <div>
                                <p className="font-medium">{item.topic}</p>
                                <small className="text-gray-500">{new Date(item.created_at).toLocaleString()}</small>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-red-600">Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No discussion prompts found.</p>
                )}
            </ul>
        </div>
    );
}
