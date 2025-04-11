export interface CanvasObject {
  id: string;
  type: 'text' | 'shape' | 'line' | 'node';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface Canvas {
  id: string;
  name: string;
  objects: CanvasObject[];
  nodes?: Node[];
  edges?: Edge[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Node {
  id: string;
  type?: 'text' | 'input' | 'output' | 'decision' | 'process' | 'image' | 'code' | 'math' | 'link' | 'ai' | 'custom' | string;
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
    imageUrl?: string;
    code?: string;
    math?: string;
    url?: string;
    aiContext?: string;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'smooth' | 'step' | string;
  animated?: boolean;
}