'use client';

import { Button } from '@/components/ui/button';
import { Canvas as CanvasType } from '../types/canvas';
import { Save, Upload, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CanvasControlsProps {
  onSave: () => void;
  onLoad: (canvasData: CanvasType) => void;
  onAddNode: (type: string) => void;
}

export default function CanvasControls({
  onSave,
  onLoad,
  onAddNode,
}: CanvasControlsProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50">
      <Button
        size="sm"
        onClick={onSave}
        className="flex items-center gap-1"
      >
        <Save className="h-4 w-4" />
        Save
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          // This is a placeholder; in a real app, you might show a file picker
          // or fetch from a database
          alert('To implement: Load canvas dialog');
        }}
        className="flex items-center gap-1"
      >
        <Upload className="h-4 w-4" />
        Load
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Node
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAddNode('custom')}>
            Custom Node
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('ai')}>
            AI Node
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}