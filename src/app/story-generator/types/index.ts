export interface LessonPlanFormData {
  subject: string;
  grade: string;
  chapterTopic: string;
  country: string;
  board: string;
  classDuration: string;
  numberOfDays: string;
  learningObjectives?: string;
}

export interface LessonPlanResponse {
  id: string;
  subject: string;
  chapter_topic: string;
  grade: string;
  country: string;
  board: string;
  class_duration: number;
  number_of_days: number;
  learning_objectives?: string;
  plan_data: any; // You can define a more specific type for plan_data if needed
  created_at: string;
}
