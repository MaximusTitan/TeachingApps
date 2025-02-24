"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ChevronLeft,
  AlertTriangle,
  Clock,
  BookOpen,
  ClipboardList,
  BarChart,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const supabase = createClient();

interface ScheduleItem {
  type: "introduction" | "mainContent" | "activity" | "conclusion";
  title: string;
  content: string;
  timeAllocation: number;
}

interface Assignment {
  description: string;
  tasks: string[];
}

interface Day {
  day: number;
  topicHeading: string;
  learningOutcomes: string[];
  schedule: ScheduleItem[];
  teachingAids: string[];
  assignment: Assignment;
}

interface Assessment {
  topic: string;
  type: string;
  description: string;
  evaluationCriteria: string[];
}

interface AssessmentPlan {
  formativeAssessments: Assessment[];
  summativeAssessments: Assessment[];
  progressTrackingSuggestions: string[];
}

interface RemedialStrategy {
  targetGroup: string;
  strategy: string;
  description: string;
}

interface LessonPlan {
  id: string;
  subject: string;
  chapter_topic: string;
  grade: string;
  board: string;
  class_duration: number;
  number_of_days: number;
  learning_objectives: string;
  plan_data: {
    days: Day[];
    assessmentPlan: AssessmentPlan;
    remedialStrategies: RemedialStrategy[];
  };
}

export default function OutputContent() {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    const fetchLessonPlan = async () => {
      if (!id) {
        setError("No lesson plan ID provided");
        return;
      }

      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching lesson plan:", error);
        setError("Failed to fetch lesson plan. Please try again.");
      } else if (data) {
        setLessonPlan(data as LessonPlan);
      } else {
        setError("Lesson plan not found");
      }
    };

    fetchLessonPlan();
  }, [id]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p>{error}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Create New Lesson Plan
        </Button>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Loading...</h1>
      </div>
    );
  }

  const handleDayClick = (day: Day) => {
    setSelectedDay(day);
  };

  const handleBackClick = () => {
    setSelectedDay(null);
  };

  const renderSchedule = (schedule: ScheduleItem[]) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule
                .filter((item) =>
                  ["introduction", "mainContent"].includes(item.type)
                )
                .map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.content}</TableCell>
                    <TableCell>{item.timeAllocation} min</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {schedule
        .filter((item) => item.type === "activity")
        .map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Activity: {item.title}</span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {item.timeAllocation} min
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{item.content}</p>
            </CardContent>
          </Card>
        ))}

      {schedule
        .filter((item) => item.type === "conclusion")
        .map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Conclusion</span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {item.timeAllocation} min
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{item.content}</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );

  const renderAssessments = (assessments: Assessment[], title: string) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {assessments.map((assessment, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h4 className="font-semibold">{assessment.type}</h4>
            <p className="text-sm text-gray-600 mb-2">
              Topic: {assessment.topic}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {assessment.description}
            </p>
            <h5 className="font-medium mt-2 mb-1">Evaluation Criteria:</h5>
            <ul className="list-disc list-inside text-sm">
              {assessment.evaluationCriteria.map((criteria, criteriaIndex) => (
                <li key={criteriaIndex}>{criteria}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderRemedialStrategies = (strategies: RemedialStrategy[]) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Remedial Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        {strategies.map((strategy, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h4 className="font-semibold">{strategy.targetGroup}</h4>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {strategy.strategy}
            </p>
            <p className="text-sm text-gray-600">{strategy.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const isPlaceholder = (day: Day) =>
    day.topicHeading.startsWith("Placeholder for Day");

  const calculateTotalTime = (day: Day) => {
    return day.schedule.reduce((sum, item) => sum + item.timeAllocation, 0);
  };

  if (selectedDay) {
    const totalTime = calculateTotalTime(selectedDay);
    const classDuration = lessonPlan.class_duration;

    return (
      <div className="container mx-auto p-4">
        <Button onClick={handleBackClick} className="mb-4">
          Back to Lesson Plan
        </Button>
        <h2 className="text-2xl font-bold mb-4">
          Day {selectedDay.day}: {selectedDay.topicHeading}
        </h2>
        <div
          className={`mb-4 p-2 rounded ${totalTime > classDuration ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
        >
          Total Time: {totalTime} minutes / {classDuration} minutes allocated
        </div>
        {isPlaceholder(selectedDay) ? (
          <Card>
            <CardContent className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mb-2" />
                <p className="text-yellow-700">
                  This day's content is a placeholder. The AI was unable to
                  generate complete content for this day.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-2">
                    By the end of this session, students will be able to:
                  </p>
                  <ul className="space-y-2">
                    {selectedDay.learningOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span className="text-green-800">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Schedule</CardTitle>
              </CardHeader>
              <CardContent>{renderSchedule(selectedDay.schedule)}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teaching Aids</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5">
                  {selectedDay.teachingAids.map((aid, index) => (
                    <li key={index}>{aid}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {selectedDay.assignment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDay.assignment.description && (
                    <p className="mb-2 font-semibold">
                      {selectedDay.assignment.description}
                    </p>
                  )}
                  {selectedDay.assignment.tasks &&
                    selectedDay.assignment.tasks.length > 0 && (
                      <ul className="list-disc pl-5">
                        {selectedDay.assignment.tasks.map((task, index) => (
                          <li key={index}>{task}</li>
                        ))}
                      </ul>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6 ml-4 w-full max-w-6xl">
        <Link
          href="/tools/lesson-planner"
          className="hover:opacity-75 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-semibold">Lesson Plan Output</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Subject</TableCell>
                <TableCell>{lessonPlan.subject}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Chapter/Topic</TableCell>
                <TableCell>{lessonPlan.chapter_topic}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Grade</TableCell>
                <TableCell>{lessonPlan.grade}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Board</TableCell>
                <TableCell>{lessonPlan.board}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Class Duration</TableCell>
                <TableCell>{lessonPlan.class_duration} minutes</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Number of Days</TableCell>
                <TableCell>{lessonPlan.number_of_days}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Learning Objectives
                </TableCell>
                <TableCell>{lessonPlan.learning_objectives || "N/A"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daily Lesson Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {lessonPlan.plan_data.days && lessonPlan.plan_data.days.length > 0 ? (
            lessonPlan.plan_data.days.map((day) => (
              <Button
                key={day.day}
                onClick={() => handleDayClick(day)}
                className={`w-full justify-start mb-2 ${isPlaceholder(day) ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}`}
              >
                Day {day.day}: {day.topicHeading}
                {isPlaceholder(day) && (
                  <AlertTriangle className="ml-2 h-4 w-4" />
                )}
              </Button>
            ))
          ) : (
            <p>No daily lesson plans available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" />
            Assessment Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lessonPlan.plan_data.assessmentPlan ? (
            <>
              {renderAssessments(
                lessonPlan.plan_data.assessmentPlan.formativeAssessments,
                "Formative Assessments"
              )}
              {renderAssessments(
                lessonPlan.plan_data.assessmentPlan.summativeAssessments,
                "Summative Assessments"
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Tracking Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5">
                    {lessonPlan.plan_data.assessmentPlan.progressTrackingSuggestions.map(
                      (suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <p>No assessment plan available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="w-5 h-5 mr-2" />
            Remedial Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lessonPlan.plan_data.remedialStrategies &&
          lessonPlan.plan_data.remedialStrategies.length > 0 ? (
            renderRemedialStrategies(lessonPlan.plan_data.remedialStrategies)
          ) : (
            <p>No remedial strategies available.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex space-x-4 mt-4">
        <Button onClick={() => router.push("/")}>Back to Page</Button>
        <Button onClick={() => router.push("/")} variant="outline">
          Create New Lesson Plan
        </Button>
      </div>
    </div>
  );
}
