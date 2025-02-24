import { createClient } from './client';

export type Question = {
  id: string;
  text: string;
  class: string;
  score: number;
  created_at: string;
  rubrics?: string;
  rubrics_human?: string;
  rubrics_self?: string;
}

export type Answer = {
  id: string;
  question_id: string;
  text: string;
  created_at: string;
  ai_obtained_score: string | null;
  ai_feedback: string | null;
  human_obtained_score: string | null;
  human_feedback: string | null;
  self_score: string | null;
  self_feedback: string | null;
}

export type AIFeedback = {
  ai_obtained_score: string | null;
  ai_feedback: string | null;
  human_obtained_score: string | null;
  human_feedback: string | null;
  self_score: string | null;
  self_feedback: string | null;
}

export async function fetchQuestions(): Promise<Question[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_questions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  return data;
}

export async function addQuestion(text: string, class_: string, score: number): Promise<Question | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_questions')
    .insert({ text, class: class_, score })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding question:', error);
    return null;
  }
  return data;
}

export async function deleteQuestion(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('evaluator_questions')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting question:', error);
  }
}

export async function fetchAnswers(): Promise<Answer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .select('*');
  
  if (error) {
    console.error('Error fetching answers:', error);
    return [];
  }
  return data.map(answer => ({
    ...answer,
    ai_obtained_score: answer.ai_obtained_score || null,
    ai_feedback: answer.ai_feedback || null,
    human_obtained_score: answer.human_obtained_score || null,
    human_feedback: answer.human_feedback || null,
    self_score: answer.self_score || null,
    self_feedback: answer.self_feedback || null
  }));
}

export async function submitAnswer(questionId: string, text: string): Promise<Answer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .insert({ question_id: questionId, text })
    .select()
    .single();
  
  if (error) {
    console.error('Error submitting answer:', error);
    return null;
  }
  return {
    ...data,
    ai_obtained_score: data.ai_obtained_score || null,
    ai_feedback: data.ai_feedback || null,
    human_obtained_score: data.human_obtained_score || null,
    human_feedback: data.human_feedback || null,
    self_score: data.self_score || null,
    self_feedback: data.self_feedback || null
  };
}

export async function deleteAnswer(questionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('evaluator_answers')
    .delete()
    .eq('question_id', questionId);
  
  if (error) {
    console.error('Error deleting answer:', error);
  }
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating question:', error);
    return null;
  }
  return data;
}

export async function updateAnswer(id: string, text: string): Promise<Answer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .update({ 
      text, 
      ai_obtained_score: null, 
      ai_feedback: null,
      human_obtained_score: null,
      human_feedback: null,
      self_score: null,
      self_feedback: null
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating answer:', error);
    return null;
  }
  return data;
}

export async function updateRubrics(questionId: string, rubrics: string | null, isHuman: boolean): Promise<void> {
  const supabase = createClient();
  const column = isHuman ? 'rubrics_human' : 'rubrics';
  const { error } = await supabase
    .from('evaluator_questions')
    .update({ [column]: rubrics || null })
    .eq('id', questionId);

  if (error) {
    console.error('Error updating rubrics:', error);
    throw error;
  }
}

export async function fetchQuestionWithRubrics(id: string): Promise<Question | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_questions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching question with rubrics:', error);
    return null;
  }
  return data;
}

export async function updateAIFeedback(answerId: string, feedback: AIFeedback, isHuman: boolean): Promise<void> {
  const supabase = createClient();
  const updateData = isHuman
    ? { human_obtained_score: feedback.human_obtained_score, human_feedback: feedback.human_feedback }
    : { ai_obtained_score: feedback.ai_obtained_score, ai_feedback: feedback.ai_feedback };
  
  const { error } = await supabase
    .from('evaluator_answers')
    .update(updateData)
    .eq('id', answerId);

  if (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
}

export async function fetchAIFeedback(answerId: string): Promise<AIFeedback | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .select('ai_obtained_score, ai_feedback, human_obtained_score, human_feedback, self_score, self_feedback')
    .eq('id', answerId)
    .single();

  if (error) {
    console.error('Error fetching feedback:', error);
    return null;
  }

  return {
    ai_obtained_score: data.ai_obtained_score || null,
    ai_feedback: data.ai_feedback || null,
    human_obtained_score: data.human_obtained_score || null,
    human_feedback: data.human_feedback || null,
    self_score: data.self_score || null,
    self_feedback: data.self_feedback || null
  };
}

export async function fetchLatestAnswer(questionId: string): Promise<Answer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluator_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching latest answer:', error);
    return null;
  }
  return {
    ...data,
    ai_obtained_score: data.ai_obtained_score || null,
    ai_feedback: data.ai_feedback || null,
    human_obtained_score: data.human_obtained_score || null,
    human_feedback: data.human_feedback || null,
    self_score: data.self_score || null,
    self_feedback: data.self_feedback || null
  };
}

export async function updateSelfRubrics(questionId: string, rubrics_self: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('evaluator_questions')
    .update({ rubrics_self })
    .eq('id', questionId);

  if (error) {
    console.error('Error updating self rubrics:', error);
    throw error;
  }
}

export async function updateSelfFeedback(answerId: string, self_score: string, self_feedback: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('evaluator_answers')
    .update({ self_score, self_feedback })
    .eq('id', answerId);

  if (error) {
    console.error('Error updating self feedback:', error);
    throw error;
  }
}

