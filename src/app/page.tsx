// src/app/page.tsx
'use client';

import { useState } from 'react';
import { countries, boardsByCountry, subjects, gradeLevels, engagementLevels } from '@/app/constant';
import { generateDiscussionPrompt, DiscussionPromptRequest } from './api';
import './globals.css';

export default function DiscussionPromptGenerator() {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedBoard, setSelectedBoard] = useState(boardsByCountry[countries[0].value][0]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(gradeLevels[0]);
  const [topic, setTopic] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedEngagementLevel, setSelectedEngagementLevel] = useState(engagementLevels[0]);
  
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryValue = e.target.value;
    const country = countries.find(c => c.value === countryValue) || countries[0];
    setSelectedCountry(country);
    setSelectedBoard(boardsByCountry[country.value][0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic for discussion');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const promptData: DiscussionPromptRequest = {
        country: selectedCountry,
        board: selectedBoard,
        subject: selectedSubject,
        gradeLevel: selectedGradeLevel,
        topic: topic,
        timeLimit: timeLimit,
        engagementLevel: selectedEngagementLevel
      };
      
      const result = await generateDiscussionPrompt(promptData);
      setGeneratedPrompt(result);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setError('Failed to generate discussion prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Discussion Prompt Generator</h1>
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Country Selection */}
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                value={selectedCountry.value}
                onChange={handleCountryChange}
              >
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>{country.label}</option>
                ))}
              </select>
            </div>
            
            {/* Educational Board Selection */}
            <div className="form-group">
              <label htmlFor="board">Educational Board</label>
              <select
                id="board"
                value={selectedBoard.value}
                onChange={(e) => {
                  const boardValue = e.target.value;
                  const board = boardsByCountry[selectedCountry.value].find(b => b.value === boardValue) || boardsByCountry[selectedCountry.value][0];
                  setSelectedBoard(board);
                }}
              >
                {boardsByCountry[selectedCountry.value].map((board) => (
                  <option key={board.value} value={board.value}>{board.label}</option>
                ))}
              </select>
            </div>
            
            {/* Subject Selection */}
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                value={selectedSubject.value}
                onChange={(e) => {
                  const subjectValue = e.target.value;
                  const subject = subjects.find(s => s.value === subjectValue) || subjects[0];
                  setSelectedSubject(subject);
                }}
              >
                {subjects.map((subject) => (
                  <option key={subject.value} value={subject.value}>{subject.label}</option>
                ))}
              </select>
            </div>
            
            {/* Grade Level Selection */}
            <div className="form-group">
              <label htmlFor="gradeLevel">Grade Level</label>
              <select
                id="gradeLevel"
                value={selectedGradeLevel.value}
                onChange={(e) => {
                  const gradeLevelValue = e.target.value;
                  const gradeLevel = gradeLevels.find(g => g.value === gradeLevelValue) || gradeLevels[0];
                  setSelectedGradeLevel(gradeLevel);
                }}
              >
                {gradeLevels.map((grade) => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>
            
            {/* Topic Input */}
            <div className="form-group">
              <label htmlFor="topic">Topic for Discussion</label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter discussion topic"
                required
              />
            </div>
            
            {/* Time Limit Input */}
            <div className="form-group">
              <label htmlFor="timeLimit">
                Time Limit (minutes): {timeLimit}
              </label>
              <div className="range-container">
                <input
                  type="range"
                  id="timeLimit"
                  min="5"
                  max="180"
                  step="5"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>5 min</span>
                  <span>180 min</span>
                </div>
              </div>
            </div>
            
            {/* Engagement Level Selection */}
            <div className="form-group">
              <label htmlFor="engagementLevel">Engagement Level</label>
              <select
                id="engagementLevel"
                value={selectedEngagementLevel.value}
                onChange={(e) => {
                  const levelValue = e.target.value;
                  const level = engagementLevels.find(l => l.value === levelValue) || engagementLevels[0];
                  setSelectedEngagementLevel(level);
                }}
              >
                {engagementLevels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {error && <p className="error">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Prompt'}
          </button>
        </form>
      </div>
      
      {generatedPrompt && (
        <div className="result-container">
          <h2>Generated Discussion Prompt</h2>
          <div className="whitespace-pre-wrap">{generatedPrompt}</div>
        </div>
      )}
    </div>
  );
}