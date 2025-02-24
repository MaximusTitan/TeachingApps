import jsPDF from 'jspdf';

interface Question {
  question: string;
  options?: string[];
  correctAnswer: any;
  answer?: string;
}

export function formatAssessmentForDownload(
  assessment: Question[],
  assessmentType: string,
  topic: string,
  includeAnswers: boolean = true
): string {
  let content = `Assessment Topic: ${topic}\n\n`;

  assessment.forEach((q, index) => {
    // Remove the number from the question if it starts with a number
    const questionText = q.question.replace(/^\d+[\.\)\s]+/, '').trim();
    content += `Question ${index + 1}: ${questionText}\n`;

    if (assessmentType === "mcq" && q.options) {
      q.options.forEach((option, i) => {
        // Remove the letter prefix if it exists in the option
        const optionText = option.replace(/^[A-D][\.\)\s]+/, '').trim();
        content += `${String.fromCharCode(65 + i)}) ${optionText}\n`;
      });
      if (includeAnswers) {
        content += `Correct Answer: ${String.fromCharCode(
          65 + (q.correctAnswer as number)
        )}\n`;
      }
    } else if (assessmentType === "truefalse") {
      if (includeAnswers) {
        content += `Correct Answer: ${q.correctAnswer ? "True" : "False"}\n`;
      }
    } else if (assessmentType === "fillintheblank") {
      if (includeAnswers) {
        content += `Correct Answer: ${q.answer}\n`;
      }
    }

    content += "\n";
  });

  return content;
}

function exportToPDF(content: string, topic: string): void {
  const pdf = new jsPDF();
  const leftMargin = 15;
  const rightMargin = 200; // used for drawing lines, etc.
  
  // Add title styling
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  const title = content.split('\n')[0];
  pdf.text(title, leftMargin, 20);
  
  // Add content with better formatting
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  const contentLines = content.split('\n').slice(2); // Skip title and first empty line
  
  let y = 40;
  contentLines.forEach((line: string) => {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    
    // Add indent for options and answers
    const indent = line.startsWith('A)') || 
                  line.startsWith('B)') || 
                  line.startsWith('C)') || 
                  line.startsWith('D)') || 
                  line.startsWith('Correct Answer:');
                  
    pdf.text(line, indent ? leftMargin + 10 : leftMargin, y);
    y += 7;
  });

  pdf.save(`assessment-${topic.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function downloadAssessment(
  assessment: any[],
  assessmentType: string,
  topic: string,
  fileType: string,
  showResults: boolean,
  userAnswers?: any[]
) {
  const doc = new jsPDF();
  const leftMargin = 20;
  const rightMargin = 190;
  const maxWidth = rightMargin - leftMargin;
  let yOffset = 20;
  
  // Title with margins
  doc.setFontSize(18);
  doc.text(`Assessment on "${topic}"`, leftMargin, yOffset);
  yOffset += 10;
  
  doc.setFontSize(12);
  
  assessment.forEach((q, index) => {
    // Add separator between questions
    if (index > 0) {
      yOffset += 5;
      doc.line(leftMargin, yOffset, rightMargin, yOffset);
      yOffset += 5;
    }
    
    // Print question text with wrapping
    const questionText = `Q${index + 1}: ${q.question}`;
    const questionLines = doc.splitTextToSize(questionText, maxWidth);
    questionLines.forEach((line: string): void => {
      doc.text(line, leftMargin, yOffset);
      yOffset += 7;
    });
    
    // For MCQ & fill-in, list options if present using an indent
    if (q.options && Array.isArray(q.options)) {
      q.options.forEach((opt: string, idx: number) => {
        const optionText = `${String.fromCharCode(65 + idx)}. ${opt}`;
        const optionLines = doc.splitTextToSize(optionText, maxWidth - 10);
        optionLines.forEach((line: string): void => {
          doc.text(line, leftMargin + 5, yOffset);
          yOffset += 7;
        });
      });
    }
    
    // If displaying answers, show answer details maintaining margins and wrapping long texts
    if (showResults) {
      if (assessmentType === "shortanswer") {
        const userAnswer = userAnswers ? userAnswers[index] || "No answer" : "No answer";
        const userAnswerLines = doc.splitTextToSize(`Your answer: ${userAnswer}`, maxWidth);
        userAnswerLines.forEach((line: string): void => {
          doc.text(line, leftMargin, yOffset);
          yOffset += 7;
        });
        const answerLines = doc.splitTextToSize(`Correct answer: ${q.answer}`, maxWidth);
        answerLines.forEach((line: string): void => {
          doc.text(line, leftMargin, yOffset);
          yOffset += 7;
        });
      } else {
        if (q.correctAnswer !== undefined) {
          let correctText = "";
          if (assessmentType === "mcq") {
            correctText = q.options[q.correctAnswer];
          } else {
            correctText = q.correctAnswer.toString();
          }
          const correctLines = doc.splitTextToSize(`Correct answer: ${correctText}`, maxWidth);
            correctLines.forEach((line: string): void => {
            doc.text(line, leftMargin, yOffset);
            yOffset += 7;
            });
        } else if (q.answer) {
          const answerLines = doc.splitTextToSize(`Answer: ${q.answer}`, maxWidth);
            answerLines.forEach((line: string): void => {
            doc.text(line, leftMargin, yOffset);
            yOffset += 7;
            });
        }
      }
    }
    
    // Add new page if near page end
    if (yOffset > 270) {
      doc.addPage();
      yOffset = 20;
    }
  });
  
  // Save PDF with maintained margins and wrapping text
  doc.save(`${topic}-${showResults ? "with-answers" : "questions"}.pdf`);
}
