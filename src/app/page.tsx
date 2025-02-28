"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import { Trash2, AlertCircle,Eye,EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateStory, fetchStoryHistory, deleteStory } from "./generateStory";
import { countries, boardsByCountry, subjects } from "@/constants/education-data";
import React from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyPlans, setStoryPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    country: "",
    board: "",
    subject: "",
    grade: "",
    message: "",
    storyline: "",
  });
  const [storyHistory, setStoryHistory] = useState<any[]>([]);
  const [expandedStory, setExpandedStory] = useState<number | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const history = await fetchStoryHistory();
      setStoryHistory(history);
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

    const { country, board, subject, grade, message, storyline } = formData;

    if (!country || !board || !subject || !grade || !message) {
      setError("Fields (Country, Educational Board, Subject, Grade, Story Topic) are required!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const story = await generateStory({
        message,
        storyline,
        country,
        board,
        subject,
        grade
      });
      setStoryPlans((prev) => [...prev, story]);
    } catch (error) {
      console.error("❌ Error:", error);
      setError("Failed to generate story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (story: string, index: number) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const marginLeft = 10;
    const marginTop = 20;
    const maxWidth = 180;
    const lineHeight = 7;
    let yPosition = marginTop;

    const formatText = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, (_, match) => `${match}`.toUpperCase())
        .replace(/\*(.*?)\*/g, (_, match) => `/${match}/`);
    };

    const storyLines: string[] = doc.splitTextToSize(formatText(story), maxWidth);

    storyLines.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, marginLeft, yPosition);
      yPosition += lineHeight;
    });

    doc.save(`story_${index + 1}.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#F8F2F4]">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Story Generator</h1>
          <p className="text-muted-foreground text-lg">
            Generates creative and engaging stories based on your topic and storyline.
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
                    <Label className="text-base font-semibold">Educational Board</Label>
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Story Topic</Label>
                    <Input name="message" value={formData.message} onChange={handleChange} className="h-11 bg-white" required />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Storyline (Optional)</Label>
                    <Textarea
                      name="storyline"
                      value={formData.storyline}
                      onChange={handleChange}
                      placeholder="Enter storyline, additional details..."
                      className="bg-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Button 
  type="submit" 
  disabled={isLoading} 
  className="w-fit h-10 text-base font-semibold bg-[#f43f5e] hover:bg-[#e11d48] active:scale-95 transition-all rounded-full shadow-md hover:shadow-lg"
>
  {isLoading ? "Generating Story..." : "Generate Story"}
</Button>


            </CardContent>
          </Card>
        </form>

        {storyPlans.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-rose-500">Generated Stories</h2>
            <div className="space-y-6">
            {storyPlans.map((plan, index) => (
  <Card key={index} className="shadow-lg border border-pink-300 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl hover:scale-[1.02] transition-transform duration-300">
    <CardHeader className="pb-2">
  {/* Removed title to avoid "Story X" heading */}
</CardHeader>

<CardContent className="prose max-w-none text-gray-700">
  <ReactMarkdown>{plan}</ReactMarkdown>
  
  <div className="mt-4 flex justify-start">
    <button 
      onClick={() => handleDownloadPDF(plan, index)} 
      className="bg-white border border-pink-400 text-pink-500 hover:bg-pink-200 px-3 py-1 rounded-full transition"
    >
      Download PDF
    </button>
  </div>
</CardContent>

  </Card>
))}

            </div>
          </div>
        )}

        {storyHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-rose-500 mb-4">Story History</h2>
            <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-pink-300 shadow-lg rounded-lg overflow-hidden">

            <thead>
  <tr className="bg-[#f43f5e] text-white">
    <th className="border border-gray-300 px-4 py-2">Topic</th>
    <th className="border border-gray-300 px-4 py-2">Grade</th>
    <th className="border border-gray-300 px-4 py-2">Board</th>
    <th className="border border-gray-300 px-4 py-2">Subject</th>
    <th className="border border-gray-300 px-4 py-2">Actions</th>
  </tr>
</thead>

                <tbody>
                  {storyHistory.map((story) => (
                    <React.Fragment key={story.id}>
                      <tr className="hover:bg-pink-100 transition-all duration-300">
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{story.topic}</td>
                        <td className="border border-gray-300 px-4 py-2">{story.grade}</td>
                        <td className="border border-gray-300 px-4 py-2">{story.board}</td>
                        <td className="border border-gray-300 px-4 py-2">{story.subject}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center space-x-2">
                        <Button
  onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
  className="bg-white hover:bg-white text-[#e11d48] px-3 rounded-full shadow-md"
>
  {expandedStory === story.id ? <EyeOff size={20} /> : <Eye size={20} />}
</Button>



<button
  onClick={async () => {
    if (await deleteStory(story.id)) {
      setStoryHistory((prev) => prev.filter((s) => s.id !== story.id));
    }
  }}
  className="text-[#f43f5e] hover:text-[#e11d48] transition-all"
  aria-label="Delete Story"
>
  <Trash2 size={20} />
</button>


                        </td>
                      </tr>

                      {expandedStory === story.id && (
  <tr className="transition-all duration-500 ease-in-out bg-pink-50 border-t border-pink-300">
    <td colSpan={5} className="border border-pink-300 px-4 py-4 bg-white rounded-lg shadow-md hover:shadow-lg">
      <div className="p-4 bg-white border-2 border-pink-300 rounded-xl shadow-md hover:shadow-lg transition-all">
        <h3 className="text-lg font-bold text-pink-600">{story.topic}</h3>
        <p className="text-sm text-gray-500">Board: {story.board} | Subject: {story.subject}</p>
        <div className="prose max-w-none mt-3 text-gray-700">
          <ReactMarkdown>{story.content}</ReactMarkdown>
        </div>
        <div className="mt-4 flex justify-end">
        <Button 
  onClick={() => handleDownloadPDF(story.content, story.id)} 
  className="bg-[#f43f5e] text-white border border-[#e11d48] hover:bg-[#e11d48] hover:border-[#d10b3f] px-3 py-1 rounded-full transition"
>
  Download PDF
</Button>

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