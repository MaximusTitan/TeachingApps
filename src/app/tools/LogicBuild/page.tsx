"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { saveGameState, loadGameState, deleteGameState } from './supabaseClient';

// AI Types and Interfaces
interface Question {
    id: string;
    text: string;
    type: "multiple-choice" | "fill-in-blank" | "logic-puzzle";
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    difficultyLevel: DifficultyLevel;
}

interface AIResponse {
    success: boolean;
    data?: any;
    error?: string;
}

interface LessonContent {
    title: string;
    content: string;
    examples: string[];
}

interface QuizContent {
    questions: Question[];
}

// Types
type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type Boss = {
    id: number;
    name: string;
    description: string;
    icon: string;
    completed: boolean;
    levels: Level[];
};

type Level = {
    id: number;
    name: string;
    description: string;
    completed: boolean;
    stars: number;
    stages: Stage[];
};

type Stage = {
    id: number;
    type: "lesson" | "miniQuiz" | "finalQuiz";
    title: string;
    completed: boolean;
    xpReward: number;
};

type GameState = {
    difficultyLevel: DifficultyLevel;
    totalXP: number;
    bosses: Boss[];
    currentBossId: number | null;
    currentLevelId: number | null;
    currentStageId: number | null;
    avatarState: "neutral" | "happy" | "excited";
    badges: string[];
};

// AI Service for Question Generation and Answer Evaluation
const AIService = {
    // Generate lesson content based on boss, level, and difficulty
    async generateLessonContent(
        bossName: string,
        levelId: number,
        difficultyLevel: DifficultyLevel
    ): Promise<AIResponse> {
        try {
            const response = await fetch('/api/logicbuild-ai/generate-lesson', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bossName,
                    levelId,
                    difficultyLevel
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error("Error generating lesson content:", error);
            return {
                success: false,
                error: "Failed to generate lesson content. Please try again."
            };
        }
    },

    // Generate quiz questions based on boss, level, and difficulty
    async generateQuizQuestions(
        bossName: string,
        levelId: number,
        stageType: "miniQuiz" | "finalQuiz",
        difficultyLevel: DifficultyLevel
    ): Promise<AIResponse> {
        try {
            console.log(`Requesting quiz questions for ${bossName} - ${stageType} at ${difficultyLevel} difficulty...`);
            
            const response = await fetch('/api/logicbuild-ai/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bossName,
                    levelId,
                    stageType,
                    difficultyLevel
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Quiz API response:", data);
            
            // Fixed: Check if questions property exists and is an array
            if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                return {
                    success: true,
                    data: {
                        questions: data.questions
                    }
                };
            } else {
                console.warn("Invalid or empty quiz questions response:", data);
                return {
                    success: true,
                    data: {
                        questions: getSampleQuestions(bossName, levelId, stageType, difficultyLevel)
                    }
                };
            }
        } catch (error) {
            console.error("Error generating quiz questions:", error);
            
            // Fallback to sample questions on error
            return {
                success: true,
                data: {
                    questions: getSampleQuestions(bossName, levelId, stageType, difficultyLevel)
                }
            };
        }
    },

    // Evaluate student answer against correct answer
    async evaluateAnswer(
        question: Question,
        studentAnswer: string | number
    ): Promise<AIResponse> {
        try {
            const response = await fetch('/api/logicbuild-ai/evaluate-answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    studentAnswer
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error("Error evaluating answer:", error);
            
            // Fallback evaluation when API fails
            const isCorrect = studentAnswer === question.correctAnswer;
            return {
                success: true,
                data: {
                    isCorrect,
                    feedback: isCorrect 
                        ? "Great job! That's correct." 
                        : `Not quite right. Try again. The correct answer is ${question.correctAnswer}.`
                }
            };
        }
    }
};

// Generate sample questions for fallback
function getSampleQuestions(
    bossName: string, 
    levelId: number, 
    stageType: "miniQuiz" | "finalQuiz", 
    difficultyLevel: DifficultyLevel
): Question[] {
    // Define the topics for each boss and level
    const topicMap: {[boss: string]: {[level: number]: string}} = {
      "Logic": {
        1: "Order Logic (e.g., arranging by clues)",
        2: "Comparisons (taller, heavier, faster)",
        3: "Patterns & Sequences (find the next one)",
        4: "Deductive Reasoning (who is lying, truth-tellers, etc.)"
      },
      "Logic II": {
        1: "Puzzle Grids (e.g., match items with clues)",
        2: "Elimination Logic (process of elimination)",
        3: "Multi-step Logic Chains",
        4: "Analogies & Word Logic"
      },
      "Everyday Math": {
        1: "Money & Shopping Logic (prices, change, value)",
        2: "Calendar & Time Reasoning",
        3: "Distance, Weight & Measurement Problems",
        4: "Word Problems with Real-life Scenarios"
      },
      "Mathematical Thinking": {
        1: "Sorting & Classifying by Properties",
        2: "Simple Algebraic Thinking (find the missing value)",
        3: "Number Puzzles & Magic Squares",
        4: "Strategy Games & Critical Thinking"
      }
    };

    // Get the specific topic for this boss and level
    const topic = topicMap[bossName]?.[levelId] || `${bossName} Level ${levelId}`;
    
    const questionCount = stageType === "miniQuiz" ? 3 : 5;
    const questions: Question[] = [];
    
    // Create larger question pools organized by topic and boss
    const topicQuestionPools: Record<string, Record<string, Array<{
        text: string;
        type: "multiple-choice" | "fill-in-blank" | "logic-puzzle";
        options?: string[];
        correctAnswer: string | number;
        explanation: string;
    }>>> = {
        "Logic": {
            "Order Logic (e.g., arranging by clues)": [
                {
                    text: "If John is taller than Mike, and Mike is taller than Tom, who is the tallest?",
                    type: "multiple-choice",
                    options: ["John", "Mike", "Tom", "We can't tell"],
                    correctAnswer: 0,
                    explanation: "If John is taller than Mike, and Mike is taller than Tom, then John must be the tallest."
                },
                {
                    text: "If the red box is to the left of the blue box, and the green box is to the right of the blue box, what is in the middle?",
                    type: "multiple-choice",
                    options: ["Red box", "Blue box", "Green box", "Yellow box"],
                    correctAnswer: 1,
                    explanation: "If red is to the left of blue, and green is to the right of blue, then the blue box must be in the middle."
                },
                {
                    text: "Mary sits between John and Sarah. If John is to the left of Mary, where is Sarah?",
                    type: "multiple-choice",
                    options: ["To the left of John", "To the right of Mary", "Between John and Mary", "We can't tell"],
                    correctAnswer: 1,
                    explanation: "If Mary is between John and Sarah, and John is to the left of Mary, then Sarah must be to the right of Mary."
                },
                {
                    text: "If the orange is bigger than the apple, and the apple is bigger than the grape, which fruit is the smallest?",
                    type: "multiple-choice",
                    options: ["Orange", "Apple", "Grape", "They're all the same size"],
                    correctAnswer: 2,
                    explanation: "The grape is smaller than the apple, which is smaller than the orange, so the grape is the smallest."
                },
                {
                    text: "Lisa's house is between the school and the park. If the school is east of Lisa's house, which direction is the park from Lisa's house?",
                    type: "fill-in-blank",
                    correctAnswer: "west",
                    explanation: "If Lisa's house is between the school and the park, and the school is east of Lisa's house, then the park must be west of Lisa's house."
                }
            ],
            "Comparisons (taller, heavier, faster)": [
                {
                    text: "If an elephant weighs more than a horse, and a horse weighs more than a dog, which animal weighs the least?",
                    type: "multiple-choice",
                    options: ["Elephant", "Horse", "Dog", "They all weigh the same"],
                    correctAnswer: 2,
                    explanation: "The dog weighs less than the horse, which weighs less than the elephant, so the dog weighs the least."
                },
                {
                    text: "If a car is faster than a bicycle, and a bicycle is faster than walking, which is the slowest way to travel?",
                    type: "multiple-choice",
                    options: ["Car", "Bicycle", "Walking", "They're all the same speed"],
                    correctAnswer: 2,
                    explanation: "Walking is slower than a bicycle, which is slower than a car, so walking is the slowest."
                },
                {
                    text: "Tom is taller than Sam. Sam is taller than Max. Who is the shortest?",
                    type: "multiple-choice",
                    options: ["Tom", "Sam", "Max", "They're all the same height"],
                    correctAnswer: 2,
                    explanation: "Max is shorter than Sam, who is shorter than Tom, so Max is the shortest."
                },
                {
                    text: "A blue whale is larger than a shark. A shark is larger than a dolphin. Which animal is the largest?",
                    type: "multiple-choice",
                    options: ["Blue whale", "Shark", "Dolphin", "They're all the same size"],
                    correctAnswer: 0,
                    explanation: "The blue whale is larger than the shark, which is larger than the dolphin, so the blue whale is the largest."
                },
                {
                    text: "If a watermelon is heavier than an orange, and an orange is heavier than a grape, which fruit is the heaviest?",
                    type: "fill-in-blank",
                    correctAnswer: "watermelon",
                    explanation: "The watermelon is heavier than the orange, which is heavier than the grape, so the watermelon is the heaviest."
                }
            ],
            "Patterns & Sequences (find the next one)": [
                {
                    text: "What comes next in this pattern? 2, 4, 6, 8, ?",
                    type: "multiple-choice",
                    options: ["9", "10", "12", "14"],
                    correctAnswer: 1,
                    explanation: "The pattern is counting by 2s, so after 8 comes 10."
                },
                {
                    text: "What is the next shape in this pattern? Square, Circle, Triangle, Square, Circle, ?",
                    type: "multiple-choice",
                    options: ["Square", "Circle", "Triangle", "Rectangle"],
                    correctAnswer: 2,
                    explanation: "The pattern repeats: Square, Circle, Triangle. After Circle comes Triangle."
                },
                {
                    text: "Find the next letter: A, C, E, G, ?",
                    type: "multiple-choice",
                    options: ["H", "I", "J", "K"],
                    correctAnswer: 1,
                    explanation: "This pattern skips one letter each time (A, C, E, G), so after G comes I."
                },
                {
                    text: "What is the next number? 1, 3, 6, 10, ?",
                    type: "multiple-choice",
                    options: ["13", "15", "18", "20"],
                    correctAnswer: 1,
                    explanation: "The pattern adds increasing numbers: +2, +3, +4, so the next is 10+5=15."
                },
                {
                    text: "Complete the pattern: 1, 4, 9, 16, ?",
                    type: "fill-in-blank",
                    correctAnswer: "25",
                    explanation: "These are square numbers: 1², 2², 3², 4², so the next is 5² = 25."
                }
            ],
            "Deductive Reasoning (who is lying, truth-tellers, etc.)": [
                {
                    text: "Tom says he has a pet. Sam says Tom does not have a pet. If one of them is lying, who has a pet?",
                    type: "multiple-choice",
                    options: ["Tom", "Sam", "Both Tom and Sam", "Neither Tom nor Sam"],
                    correctAnswer: 0,
                    explanation: "If one person is lying, then Tom must be telling the truth and Sam is lying. So Tom has a pet."
                },
                {
                    text: "Three children - Amy, Ben, and Carl - each have either a cat or a dog. Two have cats and one has a dog. Amy says, 'I have a cat.' Ben says, 'Carl has a dog.' If both statements are true, who has a dog?",
                    type: "multiple-choice",
                    options: ["Amy", "Ben", "Carl", "We can't tell"],
                    correctAnswer: 2,
                    explanation: "If Amy has a cat and Carl has a dog, then Ben must have a cat to make two cats and one dog."
                },
                {
                    text: "John says, 'If it's sunny, I'll go to the park.' It is sunny, but John doesn't go to the park. Is John telling the truth?",
                    type: "multiple-choice",
                    options: ["Yes", "No", "We need more information", "Both yes and no"],
                    correctAnswer: 1,
                    explanation: "John promised to go to the park if it's sunny. Since it's sunny but he didn't go, he broke his promise, so he was not telling the truth."
                },
                {
                    text: "If Sarah always tells the truth and Mike always lies, and Sarah says 'Mike says the sky is green,' what color does Mike really think the sky is?",
                    type: "multiple-choice",
                    options: ["Blue", "Green", "Red", "Yellow"],
                    correctAnswer: 0,
                    explanation: "Since Sarah tells the truth, Mike must have said the sky is green. Since Mike always lies, he must think the sky is blue."
                },
                {
                    text: "Three friends ate cookies. One of them ate all the cookies. Alex says, 'I didn't eat the cookies.' Blake says, 'Charlie ate the cookies.' Charlie says, 'Blake is lying.' If only one person is telling the truth, who ate the cookies?",
                    type: "logic-puzzle",
                    correctAnswer: "Alex",
                    explanation: "If only one is telling the truth: If Alex is truthful, he didn't eat them. If Blake is truthful, Charlie ate them. If Charlie is truthful, Blake is lying. If Charlie is truthful and Blake is lying, then Charlie didn't eat the cookies. That leaves Alex. So Alex ate the cookies."
                }
            ]
        },
        "Logic II": {
            "Puzzle Grids (e.g., match items with clues)": [
                {
                    text: "Three friends (Amy, Ben, and Chloe) each have a different pet (cat, dog, fish). Amy doesn't have the fish. Ben has a pet with four legs. Who has the fish?",
                    type: "multiple-choice",
                    options: ["Amy", "Ben", "Chloe", "We can't tell"],
                    correctAnswer: 2,
                    explanation: "Ben has a pet with four legs, so he has either a cat or dog. Amy doesn't have the fish. So Chloe must have the fish."
                },
                {
                    text: "Four children sit in a row. Tom sits to the right of Sarah. Mike sits to the left of Lucy. Sarah sits to the left of Mike. Who sits on the far right?",
                    type: "multiple-choice",
                    options: ["Tom", "Sarah", "Mike", "Lucy"],
                    correctAnswer: 3,
                    explanation: "From the clues, the order from left to right is: Sarah, Mike, Lucy, Tom."
                },
                {
                    text: "Three students (Anna, Bob, and Carlos) each study a different subject (Math, Science, and Art). Anna doesn't study Math. Bob doesn't study Science. Carlos doesn't study Art. What subject does Anna study?",
                    type: "multiple-choice",
                    options: ["Math", "Science", "Art", "We can't tell"],
                    correctAnswer: 2,
                    explanation: "If Anna doesn't study Math, Bob doesn't study Science, and Carlos doesn't study Art, then Carlos must study Math, Bob must study Art, and Anna must study Science."
                },
                {
                    text: "Four fruits (apple, banana, orange, grape) are placed in a row. The banana is next to the grape. The orange is on the far left. The apple is not next to the orange. What is the order from left to right?",
                    type: "fill-in-blank",
                    correctAnswer: "orange grape banana apple",
                    explanation: "Orange is on the far left. Apple is not next to orange, so there must be another fruit between them. Banana is next to grape, so the order must be: orange, grape, banana, apple."
                }
            ],
            "Elimination Logic (process of elimination)": [
                {
                    text: "A thief stole a red, blue, or green toy. Sam saw the thief and says it wasn't red. Pat also saw the thief and says it wasn't blue. If they are both telling the truth, what color was the toy?",
                    type: "multiple-choice",
                    options: ["Red", "Blue", "Green", "We can't tell"],
                    correctAnswer: 2,
                    explanation: "If the toy wasn't red and wasn't blue, it must be green."
                },
                {
                    text: "There are 3 boxes - one has a prize. Box A says 'The prize is not in Box C.' Box B says 'The prize is in this box.' Box C says 'The prize is not in Box A.' If exactly one statement is true, where is the prize?",
                    type: "multiple-choice",
                    options: ["Box A", "Box B", "Box C", "None of the boxes"],
                    correctAnswer: 0,
                    explanation: "If only one statement is true: If Box A is true, the prize is not in C. If Box B is true, the prize is in B. If Box C is true, the prize is not in A. If the prize is in A, then A's statement is true, B's is false, and C's is false. That works."
                },
                {
                    text: "Alice, Bob, and Charlie each have either a cat or a dog. At least one has a dog. If Alice and Bob have the same pet, what pet does Charlie have?",
                    type: "multiple-choice",
                    options: ["Cat", "Dog", "Either cat or dog", "We can't tell"],
                    correctAnswer: 1,
                    explanation: "If at least one person has a dog, and Alice and Bob have the same pet, either they both have dogs or they both have cats. If they both have cats, Charlie must have the dog. If they both have dogs, Charlie could have either. But the question asks what Charlie has, so Charlie must have a dog."
                },
                {
                    text: "Five children ran a race. Alex wasn't first or last. Beth was faster than Carlos. Carlos was faster than Dean. Ellen was faster than Alex. Who came in second place?",
                    type: "logic-puzzle",
                    correctAnswer: "Alex",
                    explanation: "From the clues: Ellen is faster than Alex, so Ellen is 1st. Beth is faster than Carlos, and Carlos is faster than Dean, so the order is Beth, Carlos, Dean from fastest to slowest. Alex isn't first or last, so Alex must be 2nd."
                }
            ]
        },
        "Everyday Math": {
            "Money & Shopping Logic (prices, change, value)": [
                {
                    text: "If you have $5 and spend $3, how much money do you have left?",
                    type: "multiple-choice",
                    options: ["$1", "$2", "$3", "$5"],
                    correctAnswer: 1,
                    explanation: "$5 - $3 = $2"
                },
                {
                    text: "If an apple costs 30¢ and a banana costs 25¢, how much do 2 apples and 1 banana cost?",
                    type: "multiple-choice",
                    options: ["55¢", "75¢", "85¢", "90¢"],
                    correctAnswer: 2,
                    explanation: "2 apples = 2 × 30¢ = 60¢. 1 banana = 25¢. Total: 60¢ + 25¢ = 85¢"
                },
                {
                    text: "If you buy a toy for $4.50 and pay with a $5 bill, how much change should you get?",
                    type: "multiple-choice",
                    options: ["25¢", "50¢", "75¢", "$1.50"],
                    correctAnswer: 1,
                    explanation: "$5.00 - $4.50 = $0.50 or 50¢"
                },
                {
                    text: "How many quarters make $1?",
                    type: "fill-in-blank",
                    correctAnswer: "4",
                    explanation: "Each quarter is worth 25¢. $1 = 100¢, so 100 ÷ 25 = 4 quarters make $1."
                }
            ],
            "Calendar & Time Reasoning": [
                {
                    text: "If today is Tuesday, what day will it be in 3 days?",
                    type: "multiple-choice",
                    options: ["Thursday", "Friday", "Saturday", "Sunday"],
                    correctAnswer: 1,
                    explanation: "Tuesday + 3 days = Friday"
                },
                {
                    text: "How many minutes are in 2 hours?",
                    type: "multiple-choice",
                    options: ["60", "120", "180", "240"],
                    correctAnswer: 1,
                    explanation: "1 hour = 60 minutes, so 2 hours = 2 × 60 = 120 minutes"
                },
                {
                    text: "If a movie starts at 3:15 PM and lasts 1 hour and 45 minutes, when does it end?",
                    type: "multiple-choice",
                    options: ["4:30 PM", "5:00 PM", "5:15 PM", "6:00 PM"],
                    correctAnswer: 2,
                    explanation: "3:15 PM + 1 hour = 4:15 PM. 4:15 PM + 45 minutes = 5:00 PM + 15 minutes = 5:15 PM"
                },
                {
                    text: "If January has 31 days, how many days are in January and February combined in a leap year?",
                    type: "fill-in-blank",
                    correctAnswer: "60",
                    explanation: "January has 31 days. February in a leap year has 29 days. 31 + 29 = 60 days"
                }
            ]
        },
        "Mathematical Thinking": {
            "Sorting & Classifying by Properties": [
                {
                    text: "Which of these objects doesn't belong in the group? Apple, Banana, Carrot, Orange",
                    type: "multiple-choice",
                    options: ["Apple", "Banana", "Carrot", "Orange"],
                    correctAnswer: 2,
                    explanation: "Carrot doesn't belong because it's a vegetable, while all the others are fruits."
                },
                {
                    text: "Which shape doesn't belong? Circle, Square, Star, Rectangle",
                    type: "multiple-choice",
                    options: ["Circle", "Square", "Star", "Rectangle"],
                    correctAnswer: 0,
                    explanation: "Circle doesn't belong because it has no corners or straight edges, while all the others do."
                },
                {
                    text: "Which number doesn't belong? 2, 4, 7, 8",
                    type: "multiple-choice",
                    options: ["2", "4", "7", "8"],
                    correctAnswer: 2,
                    explanation: "7 doesn't belong because it's odd, while all the others are even."
                },
                {
                    text: "If objects are sorted into 'Things that fly' and 'Things that don't fly', which group would a kite belong to?",
                    type: "multiple-choice",
                    options: ["Things that fly", "Things that don't fly", "Both groups", "Neither group"],
                    correctAnswer: 0,
                    explanation: "A kite flies in the air, so it belongs to 'Things that fly'."
                },
                {
                    text: "Name one property that all of these have in common: car, bus, train, airplane.",
                    type: "fill-in-blank",
                    correctAnswer: "transportation",
                    explanation: "All of these are modes of transportation or vehicles."
                }
            ],
            "Simple Algebraic Thinking (find the missing value)": [
                {
                    text: "If 3 + □ = 10, what number goes in the box?",
                    type: "multiple-choice",
                    options: ["3", "7", "10", "13"],
                    correctAnswer: 1,
                    explanation: "We need a number that adds to 3 to make 10. 3 + 7 = 10, so 7 goes in the box."
                },
                {
                    text: "If 5 × □ = 20, what number goes in the box?",
                    type: "multiple-choice",
                    options: ["2", "4", "5", "15"],
                    correctAnswer: 1,
                    explanation: "We need a number that, when multiplied by 5, equals 20. 5 × 4 = 20, so 4 goes in the box."
                },
                {
                    text: "If □ - 3 = 8, what number goes in the box?",
                    type: "multiple-choice",
                    options: ["5", "11", "16", "24"],
                    correctAnswer: 1,
                    explanation: "We need a number that, when 3 is subtracted from it, equals 8. So □ = 8 + 3 = 11."
                },
                {
                    text: "If □ + □ = 8, and both boxes have the same number, what is that number?",
                    type: "fill-in-blank",
                    correctAnswer: "4",
                    explanation: "If both boxes have the same number, then 2 × □ = 8, so □ = 8 ÷ 2 = 4."
                }
            ]
        }
    };
    
    // Select the appropriate question pool based on the boss and topic
    const bossPool = topicQuestionPools[bossName];
    let questionPool: Array<{
        text: string;
        type: "multiple-choice" | "fill-in-blank" | "logic-puzzle";
        options?: string[];
        correctAnswer: string | number;
        explanation: string;
    }> = [];
    
    if (bossPool && bossPool[topic]) {
        // If we have specific questions for this topic, use them
        questionPool = bossPool[topic];
    } else {
        // Otherwise, gather all questions for this boss
        if (bossPool) {
            Object.values(bossPool).forEach(questions => {
                questionPool = [...questionPool, ...questions] as typeof questionPool;
            });
        }
        
        // If we still don't have questions, use the most appropriate fallback
        if (questionPool.length === 0) {
            if (bossName === "Logic" || bossName === "Logic II") {
                questionPool = [
                    ...topicQuestionPools["Logic"]["Order Logic (e.g., arranging by clues)"],
                    ...topicQuestionPools["Logic"]["Patterns & Sequences (find the next one)"]
                ] as typeof questionPool;
            } else {
                questionPool = [
                    ...topicQuestionPools["Everyday Math"]["Money & Shopping Logic (prices, change, value)"],
                    ...topicQuestionPools["Mathematical Thinking"]["Simple Algebraic Thinking (find the missing value)"]
                ] as typeof questionPool;
            }
        }
    }
    
    // Shuffle the question pool
    const shuffledPool = [...questionPool].sort(() => 0.5 - Math.random());
    
    // Get questions appropriate for the stage type
    for (let i = 0; i < questionCount; i++) {
        // If we've run out of questions in our pool, break
        if (shuffledPool.length === 0) break;
        
        // For final quiz, include different question types
        const isFinalQuiz = stageType === "finalQuiz";
        
        // Select question type based on quiz type and question index
        let targetType: "multiple-choice" | "fill-in-blank" | "logic-puzzle";
        if (isFinalQuiz && i >= 3) {
            targetType = i === 3 ? "fill-in-blank" : "logic-puzzle";
        } else {
            targetType = "multiple-choice";
        }
        
        // Find questions of the appropriate type
        const typeQuestions = shuffledPool.filter(q => q.type === targetType);
        
        if (typeQuestions.length > 0) {
            // Select the first question of the appropriate type
            const selectedQuestion = typeQuestions[0];
            
            // Remove it from the pool
            const index = shuffledPool.findIndex(q => q.text === selectedQuestion.text);
            if (index !== -1) {
                shuffledPool.splice(index, 1);
            }
            
            questions.push({
                id: `fallback-q-${levelId}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                text: selectedQuestion.text,
                type: selectedQuestion.type,
                options: selectedQuestion.options,
                correctAnswer: selectedQuestion.correctAnswer,
                explanation: selectedQuestion.explanation,
                difficultyLevel
            });
        } else {
            // If we can't find a question of the required type, just use any available question
            if (shuffledPool.length > 0) {
                const selectedQuestion = shuffledPool[0];
                shuffledPool.splice(0, 1);
                
                questions.push({
                    id: `fallback-q-${levelId}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                    text: selectedQuestion.text,
                    type: selectedQuestion.type,
                    options: selectedQuestion.options,
                    correctAnswer: selectedQuestion.correctAnswer,
                    explanation: selectedQuestion.explanation,
                    difficultyLevel
                });
            }
        }
    }
    
    return questions;
}

// Initial game data
const initialGameState: GameState = {
    difficultyLevel: "beginner",
    totalXP: 0,
    currentBossId: null,
    currentLevelId: null,
    currentStageId: null,
    avatarState: "neutral",
    badges: [],
    bosses: [
        {
            id: 1,
            name: "Logic",
            description: "Basic logic puzzles and pattern recognition",
            icon: "🧩",
            completed: false,
            levels: Array(4).fill(null).map((_, i) => ({
                id: i + 1,
                name: `Level ${i + 1}`,
                description: `Logic fundamentals ${i + 1}`,
                completed: false,
                stars: 0,
                stages: [
                    {
                        id: 1,
                        type: "lesson",
                        title: `Logic Lesson ${i + 1}`,
                        completed: false,
                        xpReward: 10
                    },
                    {
                        id: 2,
                        type: "miniQuiz",
                        title: "Mini Quiz 1",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 3,
                        type: "miniQuiz",
                        title: "Mini Quiz 2",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 4,
                        type: "finalQuiz",
                        title: "Final Challenge",
                        completed: false,
                        xpReward: 50
                    }
                ]
            }))
        },
        {
            id: 2,
            name: "Logic II",
            description: "Advanced logic concepts and critical thinking",
            icon: "🧠",
            completed: false,
            levels: Array(4).fill(null).map((_, i) => ({
                id: i + 1,
                name: `Level ${i + 1}`,
                description: `Advanced logic ${i + 1}`,
                completed: false,
                stars: 0,
                stages: [
                    {
                        id: 1,
                        type: "lesson",
                        title: `Logic II Lesson ${i + 1}`,
                        completed: false,
                        xpReward: 10
                    },
                    {
                        id: 2,
                        type: "miniQuiz",
                        title: "Mini Quiz 1",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 3,
                        type: "miniQuiz",
                        title: "Mini Quiz 2",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 4,
                        type: "finalQuiz",
                        title: "Final Challenge",
                        completed: false,
                        xpReward: 50
                    }
                ]
            }))
        },
        {
            id: 3,
            name: "Everyday Math",
            description: "Practical math applications for daily life",
            icon: "🔢",
            completed: false,
            levels: Array(4).fill(null).map((_, i) => ({
                id: i + 1,
                name: `Level ${i + 1}`,
                description: `Everyday math ${i + 1}`,
                completed: false,
                stars: 0,
                stages: [
                    {
                        id: 1,
                        type: "lesson",
                        title: `Math Lesson ${i + 1}`,
                        completed: false,
                        xpReward: 10
                    },
                    {
                        id: 2,
                        type: "miniQuiz",
                        title: "Mini Quiz 1",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 3,
                        type: "miniQuiz",
                        title: "Mini Quiz 2",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 4,
                        type: "finalQuiz",
                        title: "Final Challenge",
                        completed: false,
                        xpReward: 50
                    }
                ]
            }))
        },
        {
            id: 4,
            name: "Mathematical Thinking",
            description: "Complex problem solving and analytical skills",
            icon: "📊",
            completed: false,
            levels: Array(4).fill(null).map((_, i) => ({
                id: i + 1,
                name: `Level ${i + 1}`,
                description: `Mathematical thinking ${i + 1}`,
                completed: false,
                stars: 0,
                stages: [
                    {
                        id: 1,
                        type: "lesson",
                        title: `Math Thinking Lesson ${i + 1}`,
                        completed: false,
                        xpReward: 10
                    },
                    {
                        id: 2,
                        type: "miniQuiz",
                        title: "Mini Quiz 1",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 3,
                        type: "miniQuiz",
                        title: "Mini Quiz 2",
                        completed: false,
                        xpReward: 20
                    },
                    {
                        id: 4,
                        type: "finalQuiz",
                        title: "Final Challenge",
                        completed: false,
                        xpReward: 50
                    }
                ]
            }))
        }
    ]
};

export default function LogicBuild() {
    const [gameState, setGameState] = useState<GameState>(initialGameState);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningBossId, setWarningBossId] = useState<number | null>(null);
    const [view, setView] = useState<"bosses" | "levels" | "stage">("bosses");
    const [levelCompleteAnimation, setLevelCompleteAnimation] = useState(false);
    const [earnedStarsCount, setEarnedStarsCount] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirmation, setShowResetConfirmation] = useState(false);

    // AI-related state
    const [loading, setLoading] = useState(false);
    const [currentLessonContent, setCurrentLessonContent] = useState<LessonContent | null>(null);
    const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
    const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
    const [quizScore, setQuizScore] = useState(0);

    // Load saved progress from localStorage on initial load
    useEffect(() => {
        async function loadSavedState() {
            setIsResetting(true);
            try {
                const savedState = await loadGameState();
                if (savedState) {
                    setGameState(savedState);
                }
            } catch (error) {
                console.error("Error loading game state:", error);
            } finally {
                setIsResetting(false);
            }
        }
        
        loadSavedState();
    }, []);

    // Save progress whenever gameState changes
    useEffect(() => {
        // Skip initial save
        const timer = setTimeout(() => {
            saveGameState(gameState);
        }, 500); // Debounce saves to prevent excessive API calls
        
        return () => clearTimeout(timer);
    }, [gameState]);
    
    // Function to completely reset the game
    const resetGame = async () => {
        setIsResetting(true);
        try {
            await deleteGameState();
            setGameState(initialGameState);
            setView("bosses");
            setShowResetConfirmation(false);
        } catch (error) {
            console.error("Error resetting game:", error);
        } finally {
            setIsResetting(false);
        }
    };

    // Calculate total possible XP for progress bar
    const maxXP = gameState.bosses.reduce(
        (bossTotal, boss) =>
            bossTotal +
            boss.levels.reduce(
                (levelTotal, level) =>
                    levelTotal +
                    level.stages.reduce((stageTotal, stage) => stageTotal + stage.xpReward, 0),
                0
            ),
        0
    );

    // Get progress percentage for XP bar
    const progressPercentage = Math.min(100, Math.round((gameState.totalXP / maxXP) * 100));

    // Handle selecting a boss
    const handleSelectBoss = (bossId: number) => {
        const boss = gameState.bosses.find(b => b.id === bossId);
        const previousBoss = gameState.bosses.find(b => b.id === bossId - 1);

        // Show warning if selecting a boss when previous one is not completed
        // Skip for first boss or if previous boss is completed
        if (bossId > 1 && previousBoss && !previousBoss.completed) {
            setWarningBossId(bossId);
            setShowWarningModal(true);
        } else {
            navigateToBoss(bossId);
        }
    };

    // Navigate to boss levels after warning modal
    const navigateToBoss = (bossId: number) => {
        setGameState(prev => ({
            ...prev,
            currentBossId: bossId
        }));
        setView("levels");
    };

    // Handle clicking on a level to show its stages
    const handleSelectLevel = (bossId: number, levelId: number) => {
        const boss = gameState.bosses.find(b => b.id === bossId);
        if (!boss) return;

        const level = boss.levels.find(l => l.id === levelId);
        if (!level) return;

        // Set the current boss and level
        setGameState(prev => ({
            ...prev,
            currentBossId: bossId,
            currentLevelId: levelId,
            currentStageId: null
        }));

        // Find the first incomplete stage, if any
        const firstIncompleteStage = level.stages.find(stage => !stage.completed);
        
        if (firstIncompleteStage) {
            // If there's an incomplete stage, navigate directly to it
            setGameState(prev => ({
                ...prev,
                currentStageId: firstIncompleteStage.id
            }));
            setView("stage");
            loadStageContent(boss, level, firstIncompleteStage);
        } else {
            // If all stages are complete or there are no stages, just show the level view
            setView("levels");
        }
    };

    // Complete a stage and update progress
    const completeCurrentStage = (earnedStars = 3) => {
        if (gameState.currentBossId && gameState.currentLevelId && gameState.currentStageId) {
            const updatedGameState = { ...gameState };
            const currentBoss = updatedGameState.bosses.find(b => b.id === gameState.currentBossId);

            if (currentBoss) {
                const currentLevel = currentBoss.levels.find(l => l.id === gameState.currentLevelId);

                if (currentLevel) {
                    const currentStage = currentLevel.stages.find(s => s.id === gameState.currentStageId);

                    if (currentStage) {
                        // Mark stage as completed
                        currentStage.completed = true;
                        // Add XP
                        updatedGameState.totalXP += currentStage.xpReward;
                        // Update avatar state
                        updatedGameState.avatarState = "happy";

                        // If this was the final stage of the level
                        if (currentStage.type === "finalQuiz") {
                            // Mark level as completed
                            currentLevel.completed = true;
                            // Set stars earned
                            currentLevel.stars = earnedStars;
                            // Set stars for the animation
                            setEarnedStarsCount(earnedStars);
                            // Check if all levels in boss are completed
                            if (currentBoss.levels.every(l => l.completed)) {
                                currentBoss.completed = true;
                                // Add badge
                                updatedGameState.badges.push(`${currentBoss.name} Master`);
                                updatedGameState.avatarState = "excited";
                            }

                            // Trigger celebration animation
                            triggerCelebration();
                            setLevelCompleteAnimation(true);
                            setTimeout(() => setLevelCompleteAnimation(false), 3000);
                        }

                        // Move to next stage or back to levels view if completed final quiz
                        if (currentStage.type === "finalQuiz") {
                            setView("levels");
                            updatedGameState.currentStageId = null;
                        } else {
                            // Move to next stage
                            updatedGameState.currentStageId = gameState.currentStageId + 1;
                        }

                        setGameState(updatedGameState);
                    }
                }
            }
        }
    };

    // Trigger confetti celebration
    const triggerCelebration = () => {
        // Create our own simple confetti effect
        const colors = ['#ff577f', '#ff8c9f', '#ffd0d9', '#ffebef', '#ffffff'];
        
        // Create 100 confetti elements
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'absolute w-2 h-2 rounded-full z-50 pointer-events-none';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '0';
            confetti.style.transform = `scale(${Math.random() * 1.5 + 0.5})`;
            
            document.body.appendChild(confetti);
            
            // Animate the confetti
            const animation = confetti.animate(
                [
                    { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                    { 
                        transform: `translate(${Math.random() * 200 - 100}px, ${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, 
                        opacity: 0 
                    }
                ], 
                {
                    duration: Math.random() * 2000 + 1000,
                    easing: 'cubic-bezier(0, .5, .8, 1)'
                }
            );
            
            // Remove after animation completes
            animation.onfinish = () => {
                document.body.removeChild(confetti);
            };
        }
    };

    // Navigate back to previous view
    const handleBackButton = () => {
        if (view === "stage") {
            setView("levels");
            setGameState(prev => ({
                ...prev,
                currentStageId: null
            }));
        } else if (view === "levels") {
            setView("bosses");
            setGameState(prev => ({
                ...prev,
                currentBossId: null,
                currentLevelId: null
            }));
        }
    };

    // Reset the entire game with increased difficulty
    const resetGameWithIncreasedDifficulty = () => {
        let newDifficulty: DifficultyLevel = "beginner";

        if (gameState.difficultyLevel === "beginner") {
            newDifficulty = "intermediate";
        } else if (gameState.difficultyLevel === "intermediate") {
            newDifficulty = "advanced";
        }

        setGameState({
            ...initialGameState,
            difficultyLevel: newDifficulty,
            badges: [...gameState.badges, `${gameState.difficultyLevel} Completed`]
        });
        setView("bosses");
    };

    // Render the header with XP progress
    const renderHeader = () => (
        <header className="w-full bg-rose-100 p-4 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-rose-600">LogicBuild</h1>
                <div className="flex items-center space-x-2">
                    <Button 
                        variant="outline" 
                        className="mr-2 text-rose-700 border-rose-300 hover:bg-rose-200"
                        onClick={() => setShowResetConfirmation(true)}
                    >
                        Reset Game
                    </Button>
                    <span className="text-rose-700 font-semibold">XP: {gameState.totalXP}</span>
                    <motion.div
                        className="text-2xl"
                        animate={{
                            scale: gameState.avatarState === "excited" ? [1, 1.2, 1] : 1,
                            rotate: gameState.avatarState === "excited" ? [0, 10, -10, 0] : 0
                        }}
                        transition={{ duration: 0.5, repeat: gameState.avatarState === "excited" ? 3 : 0 }}
                    >
                        {gameState.avatarState === "neutral" ? "😊" :
                            gameState.avatarState === "happy" ? "😄" : "🤩"}
                    </motion.div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Progress value={progressPercentage} className="h-4 bg-rose-200" />
                <span className="text-rose-600 font-semibold">{progressPercentage}%</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
                {gameState.badges.map((badge, index) => (
                    <span key={index} className="px-2 py-1 bg-rose-200 text-rose-700 text-xs rounded-full">
                        {badge}
                    </span>
                ))}
            </div>
            <div className="mt-2 text-sm text-rose-600">
                Difficulty: {gameState.difficultyLevel.charAt(0).toUpperCase() + gameState.difficultyLevel.slice(1)}
            </div>
        </header>
    );

    // Render bosses view
    const renderBossesView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gameState.bosses.map((boss) => (
                <motion.div
                    key={boss.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Card
                        className={`cursor-pointer border-2 ${boss.completed ? 'border-green-500' : 'border-rose-300'} hover:border-rose-500`}
                        onClick={() => handleSelectBoss(boss.id)}
                    >
                        <CardHeader className="bg-rose-50">
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-4xl">{boss.icon}</span>
                                <span>{boss.name}</span>
                                {boss.completed && <span className="text-green-500 text-2xl">✓</span>}
                            </CardTitle>
                            <CardDescription>{boss.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex justify-between">
                                <span>{boss.levels.filter(l => l.completed).length} / {boss.levels.length} Levels Complete</span>
                                <span>
                                    {boss.levels.reduce((total, level) => total + level.stars, 0)} / {boss.levels.length * 3} Stars
                                </span>
                            </div>
                            <Progress
                                value={(boss.levels.filter(l => l.completed).length / boss.levels.length) * 100}
                                className="h-2 mt-2 bg-rose-100"
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );

    // Render levels view for selected boss
    const renderLevelsView = () => {
        const currentBoss = gameState.bosses.find(b => b.id === gameState.currentBossId);

        if (!currentBoss) return null;

        return (
            <div>
                <div className="mb-4 flex items-center">
                    <Button
                        variant="outline"
                        onClick={handleBackButton}
                        className="mr-2"
                    >
                        ← Back
                    </Button>
                    <h2 className="text-2xl font-bold text-rose-600 flex items-center gap-2">
                        <span className="text-3xl">{currentBoss.icon}</span> {currentBoss.name} Levels
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentBoss.levels.map((level) => (
                        <motion.div
                            key={level.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card
                                className={`cursor-pointer border-2 ${level.completed ? 'border-green-500' : 'border-rose-300'} hover:border-rose-500`}
                                onClick={() => handleSelectLevel(currentBoss.id, level.id)}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{level.name}</span>
                                        <span>
                                            {Array(level.stars).fill(null).map((_, i) => (
                                                <span key={i} className="text-yellow-400 text-xl">★</span>
                                            ))}
                                            {Array(3 - level.stars).fill(null).map((_, i) => (
                                                <span key={i} className="text-gray-300 text-xl">★</span>
                                            ))}
                                        </span>
                                    </CardTitle>
                                    <CardDescription>{level.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {level.stages.map((stage) => (
                                            <div
                                                key={stage.id}
                                                className={`flex items-center p-2 rounded-md ${stage.completed ? 'bg-green-100' : 'bg-rose-50'}`}
                                            >
                                                <span className="mr-2">
                                                    {stage.type === "lesson" ? "📚" :
                                                        stage.type === "miniQuiz" ? "📝" : "🏆"}
                                                </span>
                                                <span>{stage.title}</span>
                                                {stage.completed && (
                                                    <span className="ml-auto text-green-500">✓</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-rose-50 text-sm text-rose-600">
                                    {level.completed
                                        ? "Completed!"
                                        : level.stages.some(s => s.completed)
                                            ? "In progress"
                                            : "Not started"}
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    // Load stage content (lesson or quiz)
    const loadStageContent = async (
        providedBoss?: Boss, 
        providedLevel?: Level, 
        providedStage?: Stage
    ) => {
        setLoading(true);
        setCurrentLessonContent(null);
        setCurrentQuizQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswerFeedback(null);
        setQuizScore(0);

        try {
            // Use provided parameters or get from state
            const currentBoss = providedBoss || gameState.bosses.find(b => b.id === gameState.currentBossId);
            if (!currentBoss) {
                console.log("Boss not found:", gameState.currentBossId);
                setLoading(false);
                return;
            }

            const currentLevel = providedLevel || currentBoss.levels.find(l => l.id === gameState.currentLevelId);
            if (!currentLevel) {
                console.log("Level not found:", gameState.currentLevelId);
                setLoading(false);
                return;
            }

            const currentStage = providedStage || currentLevel.stages.find(s => s.id === gameState.currentStageId);
            if (!currentStage) {
                console.log("Stage not found:", gameState.currentStageId);
                setLoading(false);
                return;
            }

            if (currentStage.type === "lesson") {
                // Load lesson content
                const response = await AIService.generateLessonContent(
                    currentBoss.name,
                    currentLevel.id,
                    gameState.difficultyLevel
                );

                if (response.success && response.data) {
                    console.log("Lesson content loaded:", response.data);
                    setCurrentLessonContent(response.data);
                } else {
                    console.error("Failed to load lesson content:", response);
                }
            } else {
                // Load quiz questions
                console.log(`Loading ${currentStage.type} questions for ${currentBoss.name} level ${currentLevel.id}`);
                const response = await AIService.generateQuizQuestions(
                    currentBoss.name,
                    currentLevel.id,
                    currentStage.type as "miniQuiz" | "finalQuiz",
                    gameState.difficultyLevel
                );

                console.log("Quiz response received:", response);
                
                if (response.success && response.data && response.data.questions) {
                    const questions = response.data.questions;
                    console.log(`Received ${questions.length} questions:`, questions);
                    
                    if (questions.length > 0) {
                        // Ensure we have valid questions with all required fields
                        const validQuestions = questions.filter((q: Question) => 
                            q && q.text && q.type && 
                            (q.type !== "multiple-choice" || (q.options && Array.isArray(q.options)))
                        );
                        
                        console.log(`Setting ${validQuestions.length} valid questions`);
                        setCurrentQuizQuestions(validQuestions);
                        setCurrentQuestionIndex(0);
                        setQuizScore(0);
                    } else {
                        console.error("No valid questions in response");
                        // You might want to set some fallback questions here
                    }
                } else {
                    console.error("Failed to load quiz questions:", response);
                }
            }
        } catch (error) {
            console.error("Error loading stage content:", error);
        } finally {
            setLoading(false);
        }
    };

    // Submit answer for evaluation
    const submitAnswer = async () => {
        if (selectedAnswer === null) return;

        setLoading(true);

        try {
            const currentQuestion = currentQuizQuestions[currentQuestionIndex];

            const response = await AIService.evaluateAnswer(
                currentQuestion,
                selectedAnswer
            );

            if (response.success && response.data) {
                setAnswerFeedback(response.data);

                // If correct, update score
                if (response.data.isCorrect) {
                    setQuizScore(prev => prev + 1);
                }

                // Clear feedback after 2.5 seconds and move to next question or complete
                setTimeout(() => {
                    setAnswerFeedback(null);

                    // If this was the last question, complete the stage
                    if (currentQuestionIndex === currentQuizQuestions.length - 1) {
                        // Calculate stars based on score
                        const scorePercentage = (quizScore + (response.data.isCorrect ? 1 : 0)) / currentQuizQuestions.length;
                        const stars = scorePercentage >= 0.9 ? 3 : scorePercentage >= 0.7 ? 2 : 1;

                        completeCurrentStage(stars);
                    } else {
                        // Move to next question
                        setCurrentQuestionIndex(prev => prev + 1);
                        setSelectedAnswer(null);
                    }
                }, 2500);
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
        } finally {
            setLoading(false);
        }
    };

    // Render stage content (lesson or quiz)
    const renderStageView = () => {
        if (!gameState.currentBossId || !gameState.currentLevelId || !gameState.currentStageId) {
            console.log("Missing required game state IDs");
            return null;
        }

        const currentBoss = gameState.bosses.find(b => b.id === gameState.currentBossId);
        if (!currentBoss) {
            console.log("Boss not found:", gameState.currentBossId);
            return null;
        }

        const currentLevel = currentBoss.levels.find(l => l.id === gameState.currentLevelId);
        if (!currentLevel) {
            console.log("Level not found:", gameState.currentLevelId);
            return null;
        }

        const currentStage = currentLevel.stages.find(s => s.id === gameState.currentStageId);
        if (!currentStage) {
            console.log("Stage not found:", gameState.currentStageId);
            return null;
        }

        console.log("Current stage type:", currentStage.type);
        console.log("Quiz questions count:", currentQuizQuestions.length);
        
        // Get the current question from the questions array
        const currentQuestion = currentQuizQuestions.length > currentQuestionIndex 
            ? currentQuizQuestions[currentQuestionIndex] 
            : null;
        
        console.log("Current question:", currentQuestion);

        // Add a fallback if no questions are available but we're in a quiz
        if ((currentStage.type === "miniQuiz" || currentStage.type === "finalQuiz") && 
            (!currentQuizQuestions || currentQuizQuestions.length === 0) && 
            !loading) {
            console.log("Setting fallback questions");
            // Set fallback questions if none are available
            const fallbackQuestions = getSampleQuestions(
                currentBoss.name, 
                currentLevel.id, 
                currentStage.type as "miniQuiz" | "finalQuiz", 
                gameState.difficultyLevel
            );
            
            if (fallbackQuestions.length > 0) {
                setCurrentQuizQuestions(fallbackQuestions);
                setCurrentQuestionIndex(0);
            }
        }

        return (
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            onClick={handleBackButton}
                            className="mr-2"
                        >
                            ← Back
                        </Button>
                        <h2 className="text-xl font-bold text-rose-600">
                            {currentBoss.name} - {currentLevel.name} - {currentStage.title}
                            {currentLevel.completed && (
                                <span className="ml-2 text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-sm">
                                    Level Completed
                                </span>
                            )}
                        </h2>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleReloadStageContent}
                        className="text-rose-500 border-rose-200 hover:bg-rose-50"
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M8 16H3v5"></path>
                        </svg>
                        Refresh Quiz
                    </Button>
                </div>

                <Card className="border-rose-300">
                    <CardHeader className="bg-rose-50">
                        <CardTitle>
                            {currentStage.type === "lesson" ? "📚 " :
                                currentStage.type === "miniQuiz" ? "📝 " : "🏆 "}
                            {currentStage.title}
                            {currentStage.completed && (
                                <span className="ml-2 text-green-600 text-sm bg-green-100 px-2 py-0.5 rounded-full">
                                    ✓ Completed
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {currentStage.type === "lesson" ? "Learn new concepts" :
                                currentStage.type === "miniQuiz" ? "Practice what you've learned" :
                                    "Show what you've mastered"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className={`p-6 ${currentStage.completed ? 'bg-green-50' : ''}`}>
                        {currentStage.completed && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md text-green-700 flex items-center">
                                <span className="text-xl mr-2">✓</span>
                                <div>
                                    <p className="font-medium">You've already completed this {currentStage.type}!</p>
                                    <p className="text-sm">You can review the content or try it again if you'd like.</p>
                                </div>
                            </div>
                        )}
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mb-4"></div>
                                <p className="text-rose-600">Loading content...</p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                {/* LESSON CONTENT */}
                                {currentStage.type === "lesson" && currentLessonContent && (
                                    <div className="prose">
                                        <h3>{currentLessonContent.title}</h3>
                                        <p>{currentLessonContent.content}</p>
                                        <div className="bg-rose-50 p-4 rounded-md my-4 border border-rose-200">
                                            <p className="font-semibold">Examples:</p>
                                            <ul>
                                                {currentLessonContent.examples.map((example, i) => (
                                                    <li key={i}>{example}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* QUIZ CONTENT */}
                                {(currentStage.type === "miniQuiz" || currentStage.type === "finalQuiz") && (
                                    <>
                                        {currentQuizQuestions.length > 0 && currentQuestion ? (
                                            <div>
                                                <div className="flex justify-between mb-4">
                                                    <h3 className="text-xl font-semibold text-rose-700">
                                                        {currentStage.type === "miniQuiz" ? "Quick Practice" : "Challenge Time!"}
                                                    </h3>
                                                    <span className="text-rose-600 font-medium bg-rose-50 px-3 py-1 rounded-full text-sm">
                                                        Question {currentQuestionIndex + 1} of {currentQuizQuestions.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="bg-rose-50 p-4 rounded-md border border-rose-200">
                                                        <p className="font-semibold mb-2 text-rose-800">
                                                            {currentQuestion.text}
                                                        </p>

                                                        {/* Multiple Choice Question */}
                                                        {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
                                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                                {currentQuestion.options.map((option, index) => (
                                                                    <Button
                                                                        key={index}
                                                                        variant="outline"
                                                                        className={`bg-white hover:bg-rose-100 ${selectedAnswer === index ? 'border-rose-500 border-2 bg-rose-50' : ''}`}
                                                                        onClick={() => setSelectedAnswer(index)}
                                                                        disabled={!!answerFeedback}
                                                                    >
                                                                        {option}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* FILL IN THE BLANK */}
                                                        {currentQuestion.type === "fill-in-blank" && (
                                                            <div className="mt-4">
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 border border-rose-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                                    placeholder="Type your answer"
                                                                    value={selectedAnswer as string || ''}
                                                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                                                    disabled={!!answerFeedback}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* LOGIC PUZZLE */}
                                                        {currentQuestion.type === "logic-puzzle" && (
                                                            <div className="mt-4">
                                                                <textarea
                                                                    className="w-full p-2 border border-rose-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                                    placeholder="Type your answer"
                                                                    rows={3}
                                                                    value={selectedAnswer as string || ''}
                                                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                                                    disabled={!!answerFeedback}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* ANSWER FEEDBACK */}
                                                        {answerFeedback && (
                                                            <div className={`mt-4 p-3 rounded-md ${answerFeedback.isCorrect ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                                                {answerFeedback.feedback}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-rose-500 text-4xl mb-4">😕</div>
                                                <h3 className="text-xl font-semibold text-rose-600 mb-2">Quiz questions are loading...</h3>
                                                <p className="text-gray-600 mb-4">Use the direct examples below or try refreshing.</p>
                                                
                                                {/* Direct hardcoded quiz example for immediate display */}
                                                <div className="bg-rose-50 p-4 rounded-md border border-rose-200 mb-4 text-left">
                                                    <p className="font-semibold mb-2 text-rose-800">
                                                        Which shape comes next in this pattern? 🔴 🟦 🔴 🟦 ?
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                                        <Button variant="outline" className="bg-white hover:bg-rose-100" onClick={() => {
                                                            // Create sample questions and set them directly
                                                            const sampleQuestionsPool = [
                                                                {
                                                                    id: "q-1-1",
                                                                    text: "Which shape comes next in this pattern? 🔴 🟦 🔴 🟦 ?",
                                                                    type: "multiple-choice" as const,
                                                                    options: ["🔴", "🟦", "🟨", "🟩"],
                                                                    correctAnswer: 0,
                                                                    explanation: "The pattern is red circle, blue square, red circle, blue square - so the next shape should be a red circle again.",
                                                                    difficultyLevel: "beginner" as const
                                                                },
                                                                {
                                                                    id: "q-1-2",
                                                                    text: "If all dogs have four legs, and Spot is a dog, how many legs does Spot have?",
                                                                    type: "multiple-choice" as const,
                                                                    options: ["2", "3", "4", "5"],
                                                                    correctAnswer: 2,
                                                                    explanation: "Since all dogs have four legs and Spot is a dog, Spot must have four legs too.",
                                                                    difficultyLevel: "beginner" as const
                                                                },
                                                                {
                                                                    id: "q-1-3",
                                                                    text: "Which number comes next? 2, 4, 6, 8, ?",
                                                                    type: "multiple-choice" as const,
                                                                    options: ["9", "10", "12", "14"],
                                                                    correctAnswer: 1,
                                                                    explanation: "This pattern is counting by 2s. After 8, the next number is 10.",
                                                                    difficultyLevel: "beginner" as const
                                                                },
                                                                {
                                                                    id: "q-1-4",
                                                                    text: "Which group has more items? 5 apples or 7 oranges?",
                                                                    type: "multiple-choice" as const,
                                                                    options: ["5 apples", "7 oranges", "They're equal", "Can't compare"],
                                                                    correctAnswer: 1,
                                                                    explanation: "7 is greater than 5, so 7 oranges is more.",
                                                                    difficultyLevel: "beginner" as const
                                                                },
                                                                {
                                                                    id: "q-1-5",
                                                                    text: "If today is Wednesday, what day will it be in 3 days?",
                                                                    type: "multiple-choice" as const,
                                                                    options: ["Friday", "Saturday", "Sunday", "Monday"],
                                                                    correctAnswer: 2,
                                                                    explanation: "Starting from Wednesday, in 3 days it will be Saturday.",
                                                                    difficultyLevel: "beginner" as const
                                                                },
                                                                {
                                                                    id: "q-1-6",
                                                                    text: "If A is B's brother, and C is A's mother, what is C to B?",
                                                                    type: "multiple-choice" as const,
                                                                    options: ["Sister", "Mother", "Aunt", "Grandmother"],
                                                                    correctAnswer: 1,
                                                                    explanation: "If A is B's brother, they share the same mother. So C is also B's mother.",
                                                                    difficultyLevel: "beginner" as const
                                                                }
                                                            ];
                                                            
                                                            // Select 3 random questions from the pool
                                                            const shuffled = [...sampleQuestionsPool].sort(() => 0.5 - Math.random());
                                                            const selectedQuestions = shuffled.slice(0, 3);
                                                            
                                                            console.log("Setting random sample questions directly:", selectedQuestions);
                                                            setCurrentQuizQuestions(selectedQuestions);
                                                            setCurrentQuestionIndex(0);
                                                            setSelectedAnswer(null);
                                                        }}>
                                                            🔴
                                                        </Button>
                                                        <Button variant="outline" className="bg-white hover:bg-rose-100">🟦</Button>
                                                        <Button variant="outline" className="bg-white hover:bg-rose-100">🟨</Button>
                                                        <Button variant="outline" className="bg-white hover:bg-rose-100">🟩</Button>
                                                    </div>
                                                </div>
                                                
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ERROR STATE - No content for current stage type */}
                                {!currentLessonContent && !(currentStage.type === "miniQuiz" || currentStage.type === "finalQuiz") && (
                                    <div className="text-center py-8">
                                        <div className="text-rose-500 text-4xl mb-4">🤔</div>
                                        <h3 className="text-xl font-semibold text-rose-600 mb-2">Content not available</h3>
                                        <p className="text-gray-600 mb-4">There was an issue loading the content for this stage.</p>
                                        <Button 
                                            onClick={() => handleReloadStageContent()} 
                                            className="bg-rose-500 hover:bg-rose-600 text-white"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            {currentStage.completed ? (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleBackButton}
                                        variant="outline"
                                        className="border-green-500 text-green-700"
                                    >
                                        Back to Levels
                                    </Button>
                                    
                                    
                                </div>
                            ) : currentStage.type === "lesson" ? (
                                <Button
                                    onClick={() => completeCurrentStage()}
                                    className="bg-rose-500 hover:bg-rose-600 text-white"
                                    disabled={loading || !currentLessonContent}
                                >
                                    Complete Lesson
                                </Button>
                            ) : (
                                <Button
                                    onClick={submitAnswer}
                                    className="bg-rose-500 hover:bg-rose-600 text-white"
                                    disabled={selectedAnswer === null || loading || !!answerFeedback || currentQuizQuestions.length === 0}
                                >
                                    Submit Answer
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Render level completion celebration
    const renderLevelCompleteAnimation = () => {
        if (!levelCompleteAnimation) return null;

        return (
            <motion.div
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white p-8 rounded-xl text-center"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                >
                    <motion.div
                        className="text-6xl mb-4"
                        animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: 2 }}
                    >
                        🎉
                    </motion.div>
                    <h2 className="text-2xl font-bold text-rose-600 mb-2">Level Complete!</h2>
                    <p className="text-rose-500 mb-4">You earned {earnedStarsCount} stars!</p>
                    <Button
                        onClick={() => setLevelCompleteAnimation(false)}
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                    >
                        Continue
                    </Button>
                </motion.div>
            </motion.div>
        );
    };

    // Render modal for game completion
    const renderGameCompleteModal = () => {
        const allBossesComplete = gameState.bosses.every(boss => boss.completed);

        if (!allBossesComplete) return null;

        return (
            <Dialog open={allBossesComplete}>
                <DialogContent className="bg-rose-50 border-4 border-rose-300">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center text-rose-600">
                            Amazing Achievement!
                        </DialogTitle>
                        <div className="text-6xl text-center my-4">🏆</div>
                    </DialogHeader>

                    <DialogDescription className="text-center text-rose-600">
                        <p className="mb-2 text-lg">You've completed all the challenges in LogicBuild!</p>
                        <p>Your final score: <span className="font-bold">{gameState.totalXP} XP</span></p>
                        <p>Badges collected: <span className="font-bold">{gameState.badges.length}</span></p>
                    </DialogDescription>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                            className="bg-rose-500 hover:bg-rose-600 text-white"
                            onClick={resetGameWithIncreasedDifficulty}
                        >
                            Play Again (Increase Difficulty)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setGameState(initialGameState);
                                setView("bosses");
                            }}
                        >
                            Restart from Beginning
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // Render warning modal
    const renderWarningModal = () => (
        <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
            <DialogContent className="bg-amber-50 border-amber-200">
                <DialogHeader>
                    <DialogTitle className="text-amber-700">
                        <span className="mr-2">⚠️</span> Jumping Ahead?
                    </DialogTitle>
                </DialogHeader>

                <DialogDescription className="text-amber-700">
                    This level might be trickier if you haven't finished the earlier one!
                </DialogDescription>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        onClick={() => {
                            setShowWarningModal(false);
                            if (warningBossId) {
                                navigateToBoss(warningBossId);
                            }
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        Continue Anyway
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowWarningModal(false);
                        }}
                        className="border-amber-500 text-amber-700"
                    >
                        Go Back
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    // Render reset confirmation modal
    const renderResetConfirmation = () => (
        <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
            <DialogContent className="bg-rose-50 border-rose-200">
                <DialogHeader>
                    <DialogTitle className="text-rose-700">
                        <span className="mr-2">🔄</span> Reset Game Progress?
                    </DialogTitle>
                </DialogHeader>

                <DialogDescription className="text-rose-700">
                    This will erase all your progress and badges. This action cannot be undone!
                </DialogDescription>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        onClick={resetGame}
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                        disabled={isResetting}
                    >
                        {isResetting ? (
                            <>
                                <span className="mr-2 animate-spin">⟳</span>
                                Resetting...
                            </>
                        ) : (
                            "Reset Everything"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowResetConfirmation(false)}
                        className="border-rose-500 text-rose-700"
                        disabled={isResetting}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    // Load content for current stage
    useEffect(() => {
        if (view === "stage" && gameState.currentBossId && gameState.currentLevelId && gameState.currentStageId) {
            loadStageContent();
        }
    }, [view, gameState.currentBossId, gameState.currentLevelId, gameState.currentStageId]);
    
    // Button handler for the refresh/reload stage content
    const handleReloadStageContent = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        loadStageContent();
    };

    return (
        <div className="container mx-auto py-6 px-4">
            {renderHeader()}

            <main className="my-6">
                {isResetting ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mb-4"></div>
                        <p className="text-rose-600">Loading your progress...</p>
                    </div>
                ) : (
                    <>
                        {view === "bosses" && renderBossesView()}
                        {view === "levels" && renderLevelsView()}
                        {view === "stage" && renderStageView()}
                    </>
                )}
            </main>

            {renderWarningModal()}
            {renderLevelCompleteAnimation()}
            {renderGameCompleteModal()}
            {renderResetConfirmation()}
        </div>
    );
}