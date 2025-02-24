export interface LessonPlan {
    id: string;
    title: string;
    objectives: string[];
    activities: string[];
    assessment: string[];
    materials: string[];
    timeframe: string;
    metadata: {
      createdAt: string;
      createdBy: string;
      subject: string;
      grade: string;
      country: string;
      board: string;
    };
  }
  
  export interface FormData {
    country: string;
    board: string;
    subject: string;
    grade: string;
    message: string;
    context: string;
  }