"use client";

import { ThumbsUp, Lightbulb, HelpCircle, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface FeedbackCardProps {
  feedback: {
    praise: string[];
    suggestions: string[];
    questions: string[];
    overall: string;
  };
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <div className="space-y-4">
      <Card className="shadow-md border border-pink-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-1 divide-y md:divide-y divide-pink-100">
          <FeedbackSection
            icon={<ThumbsUp className="h-5 w-5 text-green-500" />}
            title="Strengths"
            items={feedback.praise}
            bgColor="bg-green-50"
          />
          
          <FeedbackSection
            icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
            title="Suggestions"
            items={feedback.suggestions}
            bgColor="bg-amber-50"
          />
          
          <FeedbackSection
            icon={<HelpCircle className="h-5 w-5 text-blue-500" />}
            title="Questions to Consider"
            items={feedback.questions}
            bgColor="bg-blue-50"
          />
        </div>
      </Card>
      
      <Card className="shadow-md border border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-pink-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-pink-700 mb-2">Overall Feedback</h3>
              <div className="prose max-w-none text-gray-700">
                <ReactMarkdown>{feedback.overall}</ReactMarkdown>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeedbackSectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  bgColor: string;
}

function FeedbackSection({ icon, title, items, bgColor }: FeedbackSectionProps) {
  if (!items || items.length === 0) return null;
  
  return (
    <div className={`p-5 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <ul className="space-y-2 ml-6">
        {items.map((item, index) => (
          <li key={index} className="text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}