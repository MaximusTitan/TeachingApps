"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, User, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateTutorResponse, fetchResponseHistory, deleteResponse } from "./generateTutor";
import { countries, boardsByCountry, subjects } from "@/constants/education-data";
import React from "react";

// Type for tutor responses from the database
type TutorResponse = {
  id: number;
  character: string;
  topic: string;
  country: string;
  board: string;
  subject: string;
  grade: string;
  question: string;
  content: string;
  created_at: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [responseHistory, setResponseHistory] = useState<TutorResponse[]>([]);
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    country: "",
    board: "",
    subject: "",
    grade: "",
    topic: "",
    character: "",
    question: "",
  });
  
  // Load response history on component mount
  useEffect(() => {
    async function loadHistory() {
      const history = await fetchResponseHistory();
      setResponseHistory(history);
    }
    loadHistory();
  }, []);
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { country, board, subject, grade, topic, character, question } = formData;

    if (!country || !board || !subject || !grade || !topic || !character || !question) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tutorResponse = await generateTutorResponse({
        country,
        board,
        subject,
        grade,
        topic,
        character,
        question
      });
      setResponse(tutorResponse);
      
      // Refresh history after successful response
      const history = await fetchResponseHistory();
      setResponseHistory(history);
    } catch (error) {
      console.error("❌ Error:", error);
      setError("Failed to generate response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteResponse = async (id: number) => {
    if (await deleteResponse(id)) {
      setResponseHistory((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F2F4]">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">AI Role Playing Tutor</h1>
          <p className="text-muted-foreground text-lg">
            Learn from your favorite characters! Ask questions and get curriculum-aligned answers in character.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-2">
            <CardContent className="p-6 space-y-8">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Curriculum Board</Label>
                    <Select value={formData.board} onValueChange={(value) => handleSelectChange("board", value)}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select board..." />
                      </SelectTrigger>
                      <SelectContent>
                        {boardsByCountry[formData.country]?.map((board) => (
                          <SelectItem key={board.value} value={board.value}>
                            {board.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Subject</Label>
                    <Select value={formData.subject} onValueChange={(value) => handleSelectChange("subject", value)}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.value} value={subject.value}>
                            {subject.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Grade</Label>
                    <Select value={formData.grade} onValueChange={(value) => handleSelectChange("grade", value)}>
                      <SelectTrigger className="w-full h-11 bg-white">
                        <SelectValue placeholder="Select grade..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Grade {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Topic</Label>
                    <Input 
                      name="topic" 
                      value={formData.topic} 
                      onChange={handleChange} 
                      className="h-11 bg-white" 
                      placeholder="E.g., Photosynthesis, Quadratic Equations, etc."
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Character</Label>
                    <Input 
                      name="character" 
                      value={formData.character} 
                      onChange={handleChange} 
                      className="h-11 bg-white" 
                      placeholder="E.g., Albert Einstein, Gandalf, Marie Curie, etc."
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Your Question</Label>
                  <Textarea
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    placeholder="What would you like to know about this topic?"
                    className="bg-white"
                    rows={3}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-fit h-10 text-base font-semibold bg-[#f43f5e] hover:bg-[#e11d48] active:scale-95 transition-all rounded-full shadow-md hover:shadow-lg"
              >
                {isLoading ? "Generating Response..." : "Ask Character"}
              </Button>
            </CardContent>
          </Card>
        </form>

        {response && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-rose-500 mb-4">Character Response</h2>
            <Card className="shadow-lg border border-pink-300 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl hover:scale-[1.01] transition-transform duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <User className="h-6 w-6 text-pink-600" />
                  <span className="font-bold text-pink-600">{formData.character}</span>
                </div>
              </CardHeader>
              <CardContent className="prose max-w-none text-gray-700">
                <ReactMarkdown>{response}</ReactMarkdown>
              </CardContent>
            </Card>
          </div>
        )}

        {responseHistory.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-rose-500 mb-4">Response History</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-pink-300 shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#f43f5e] text-white">
                    <th className="border border-gray-300 px-4 py-2">Character</th>
                    <th className="border border-gray-300 px-4 py-2">Topic</th>
                    <th className="border border-gray-300 px-4 py-2">Grade</th>
                    <th className="border border-gray-300 px-4 py-2">Subject</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {responseHistory.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-pink-100 transition-all duration-300">
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{item.character}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.topic}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.grade || "N/A"}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.subject}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center space-x-2">
                          <Button
                            onClick={() => setExpandedResponse(expandedResponse === item.id ? null : item.id)}
                            className="bg-[#F8F2F4] hover:bg-pink-100 text-[#e11d48] px-3 rounded-full shadow-md"
                          >
                            {expandedResponse === item.id ? <EyeOff size={20} /> : <Eye size={20} />}
                          </Button>
                          <button
                            onClick={() => handleDeleteResponse(item.id)}
                            className="text-[#f43f5e] hover:text-[#e11d48] transition-all"
                            aria-label="Delete Response"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>

                      {expandedResponse === item.id && (
                        <tr className="transition-all duration-500 ease-in-out bg-pink-50 border-t border-pink-300">
                          <td colSpan={5} className="border border-pink-300 px-4 py-4 bg-white rounded-lg shadow-md hover:shadow-lg">
                            <div className="p-4 bg-white border-2 border-pink-300 rounded-xl shadow-md hover:shadow-lg transition-all">
                              <h3 className="text-lg font-bold text-pink-600">{item.character}</h3>
                              <p className="text-sm text-gray-500 mb-2">Question: {item.question}</p>
                              <p className="text-sm text-gray-500 mb-4">
                                Topic: {item.topic} | Grade: {item.grade || "N/A"} | Subject: {item.subject} | Board: {item.board}
                              </p>
                              <div className="prose max-w-none text-gray-700">
                                <ReactMarkdown>{item.content}</ReactMarkdown>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}