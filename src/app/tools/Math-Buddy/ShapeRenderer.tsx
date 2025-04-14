"use client";

import React, { useState } from 'react';

type ShapeProps = {
  shape: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
};

const ShapeRenderer: React.FC<ShapeProps> = ({ 
  shape, 
  size = 'medium', 
  color
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Set dimensions based on size
  const dimensions = {
    small: { width: 100, height: 100 },
    medium: { width: 150, height: 150 },
    large: { width: 200, height: 200 },
  };

  // Define kid-friendly colors
  const colors = {
    circle: '#f43f5e', // rose-500
    square: '#5B8BF6', // soft blue
    rectangle: '#FFAD33', // soft orange
    triangle: '#33CC99', // soft teal
    pentagon: '#9966FF', // soft purple
    hexagon: '#f43f5e', // rose-500
    octagon: '#3399FF', // light blue
    oval: '#FFCC66', // soft yellow
    rhombus: '#FF9966', // soft coral
    trapezoid: '#66CC99', // mint
    star: '#FFCC33', // gold
    heart: '#f43f5e', // rose-500
    default: '#f43f5e', // rose-500
  };

  // Get dimensions based on size
  const { width, height } = dimensions[size];
  
  // Get color based on shape or use provided color
  const shapeColor = color || colors[shape.toLowerCase() as keyof typeof colors] || colors.default;

  // Define the styles for different shapes
  const getShapeStyles = () => {
    const baseStyles = {
      width: `${width}px`,
      height: `${height}px`,
      margin: '20px auto',
      backgroundColor: shapeColor,
      transition: 'all 0.3s ease',
      boxShadow: isHovered 
        ? '0 8px 16px rgba(0,0,0,0.15)' 
        : '0 4px 8px rgba(0,0,0,0.1)',
      position: 'relative' as 'relative',
      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    };

    switch (shape.toLowerCase()) {
      case 'circle':
        return {
          ...baseStyles,
          borderRadius: '50%',
        };
      
      case 'square':
        return {
          ...baseStyles,
          borderRadius: '10px',
        };
      
      case 'rectangle':
        return {
          ...baseStyles,
          width: `${width * 1.5}px`,
          height: `${height * 0.75}px`,
          borderRadius: '10px',
        };
      
      case 'triangle':
        return {
          width: '0',
          height: '0',
          borderLeft: `${width / 2}px solid transparent`,
          borderRight: `${width / 2}px solid transparent`,
          borderBottom: `${height}px solid ${shapeColor}`,
          margin: '20px auto',
          boxShadow: isHovered 
            ? '0 8px 16px rgba(0,0,0,0.15)' 
            : '0 4px 8px rgba(0,0,0,0.1)',
          position: 'relative' as 'relative',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        };
      
      case 'pentagon':
        return {
          ...baseStyles,
          clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        };
      
      case 'hexagon':
        return {
          ...baseStyles,
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        };
      
      case 'octagon':
        return {
          ...baseStyles,
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        };
      
      case 'oval':
        return {
          ...baseStyles,
          borderRadius: '50%',
          width: `${width * 1.5}px`,
          height: `${height * 0.75}px`,
        };
      
      case 'rhombus':
        return {
          ...baseStyles,
          transform: isHovered ? 'rotate(45deg) scale(1.1)' : 'rotate(45deg)',
        };
      
      case 'trapezoid':
        return {
          ...baseStyles,
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
        };
      
      case 'star':
        return {
          ...baseStyles,
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        };
      
      case 'heart':
        return {
          ...baseStyles,
          clipPath: 'path("M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402M5.482 20.453c4.076 4.713 7.5 9.535 7.5 12.352 0 2.766-2.241 4.195-4.855 4.195-3.354 0-6.145-2.729-6.145-6.103 0-2.822 1.855-6.786 3.5-10.444zM16.516 20.485C14.83 24.231 13 28.228 13 31.085c0 3.373 2.79 6.103 6.145 6.103 2.613 0 4.855-1.429 4.855-4.195 0-2.817-3.424-7.639-7.5-12.352z")',
          height: `${height * 0.9}px`,
          width: `${width * 0.9}px`,
          backgroundColor: 'transparent',
          background: `radial-gradient(circle at 30% 30%, ${shapeColor} 0%, #f43f5e 100%)`,
        };
      
      default:
        return baseStyles;
    }
  };

  // Generate shape with hover effect
  return (
    <div 
      className="shape-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '15px',
        margin: '15px 0',
      }}
    >
      <div 
        className={`shape ${shape.toLowerCase()}`}
        style={getShapeStyles()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
};

export default ShapeRenderer; 