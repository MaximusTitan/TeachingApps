'use client'
import { useState, useRef } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const hookTypes = [
  'Story-based Hook',
  'Thought-provoking Question',
  'Real-world Connection',
  'Fun Fact or Riddle',
  'Visual or Video Suggestion',
  'Role Play or Scenario-based Hook'
]

export default function LessonHookTool() {
  const [topic, setTopic] = useState('')
  const [objective, setObjective] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [hookType, setHookType] = useState(hookTypes[0])
  const [hook, setHook] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null)

  const generateHook = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!topic || !objective || !ageGroup) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/generate-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, objective, ageGroup, hookType })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate hook');
      }

      const data = await res.json();
      if (data.hook) {
        setHook(data.hook);
        outputRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error('No hook generated');
      }
    } catch (error) {
      console.error('Failed to generate hook:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate hook');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex bg-gray-100 min-h-screen p-8">
      <div className="flex w-1/2">
        <Card className="max-w-4xl w-full p-8 bg-white shadow-lg rounded-2xl">
          <h1 className="text-3xl font-bold mb-8 text-blue-600">Lesson Hook Generator</h1>
          <div className="grid grid-cols-2 gap-6">
            <Input
              className="bg-gray-50 text-gray-800 border border-gray-300 rounded-lg p-3"
              placeholder="Grade Level"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            />
            <Input
              className="bg-gray-50 text-gray-800 border border-gray-300 rounded-lg p-3"
              placeholder="Content Area"
            />
            <Input
              className="bg-gray-50 text-gray-800 border border-gray-300 rounded-lg p-3"
              placeholder="Lesson Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Input
              className="bg-gray-50 text-gray-800 border border-gray-300 rounded-lg p-3"
              placeholder="Learning Objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
            <select
              value={hookType}
              onChange={(e) => setHookType(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800"
            >
              {hookTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <Button 
            onClick={generateHook} 
            disabled={isLoading}
            className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500"
          >
            {isLoading ? 'Generating...' : 'Generate Hook'}
          </Button>

          {error && (
            <div className="mt-6 p-4 bg-red-100 text-red-600 rounded-lg">
              {error}
            </div>
          )}
        </Card>
      </div>

      <div className="w-1/2 pl-8">
        {hook && (
          <Card ref={outputRef} className="p-8 bg-blue-50 shadow-lg rounded-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-blue-600">Lesson Plan: {topic}</h2>
            <p className="text-gray-800"><strong>Grade Level:</strong> {ageGroup}</p>
            <p className="text-gray-800"><strong>Learning Objective:</strong> {objective}</p>
            <p className="text-gray-800"><strong>Hook Type:</strong> {hookType}</p>
            <p className="text-gray-800"><strong>Generated Hook:</strong> {hook}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
