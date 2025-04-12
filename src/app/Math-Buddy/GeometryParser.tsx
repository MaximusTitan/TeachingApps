"use client";

import React from 'react';
import ShapeRenderer from './ShapeRenderer';

// Supported geometric shapes
const SHAPES = [
  'circle',
  'square',
  'rectangle',
  'triangle',
  'pentagon',
  'hexagon',
  'octagon',
  'oval',
  'rhombus',
  'trapezoid',
  'star',
  'heart'
];

type GeometryParserProps = {
  text: string;
};

const GeometryParser: React.FC<GeometryParserProps> = ({ text }) => {
  // Function to clean text of unwanted elements
  const cleanText = (input: string): string => {
    // Remove any ASCII art characters that might appear in shape descriptions
    let cleaned = input.replace(/[\\\/\|\_\`\*\#\~\>\<\[\]\{\}]/g, '');
    
    // Remove any code blocks or technical formatting
    cleaned = cleaned.replace(/```[^`]*```/g, '');
    
    // Remove HTML tags that might have been included
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    return cleaned;
  };

  // Parse the message to identify shapes and render them
  const renderTextWithShapes = () => {
    // Clean the text first
    const cleanedText = cleanText(text);
    
    // Check for specific patterns that indicate a shape description
    // Example: "A circle is a shape with..." or "This is a square with..."
    const shapeRegexPattern = new RegExp(`\\b(${SHAPES.join('|')})\\b`, 'gi');
    
    // Split by paragraphs to better identify standalone shape descriptions
    const paragraphs = cleanedText.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Check if this paragraph is describing a shape
      const match = paragraph.match(shapeRegexPattern);
      
      if (match && match.length > 0) {
        // Get the first shape mentioned (in case multiple are found)
        const shapeName = match[0].toLowerCase();
        
        // Improved detection of shape definitions
        const isDefinition = 
          paragraph.toLowerCase().includes(`${shapeName} is`) || 
          paragraph.toLowerCase().includes(`a ${shapeName} is`) ||
          paragraph.toLowerCase().includes(`the ${shapeName} is`) ||
          paragraph.toLowerCase().includes(`this is a ${shapeName}`) ||
          // Add more patterns for better detection
          paragraph.toLowerCase().includes(`called a ${shapeName}`) ||
          paragraph.toLowerCase().includes(`known as a ${shapeName}`) ||
          paragraph.toLowerCase().includes(`shape ${shapeName}`) ||
          paragraph.toLowerCase().includes(`${shapeName} shape`);
        
        if (isDefinition) {
          // Render the paragraph text followed by the shape visual
          return (
            <div key={index} className="shape-definition mb-4">
              <p className="text-gray-700 mb-2">{paragraph}</p>
              <ShapeRenderer shape={shapeName} size="medium" />
            </div>
          );
        }
      }
      
      // If no shape definition found, just render the text paragraph
      return (
        <p key={index} className="mb-4 text-gray-700">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="geometry-parser">
      {renderTextWithShapes()}
    </div>
  );
};

export default GeometryParser; 