'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { Move } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CustomNodeData {
  label: string;
  content?: string;
  updateNodeData?: (data: Partial<CustomNodeData>) => void;
}

function CustomNode({ data }: { data: CustomNodeData }) {
  const { label, content, updateNodeData } = data;
  const [editableContent, setEditableContent] = useState(content || 'Click to edit');

  useEffect(() => {
    setEditableContent(content || 'Click to edit');
  }, [content]);

  const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(event.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    if (updateNodeData && editableContent !== content) {
      console.log("Updating node content via updateNodeData:", editableContent);
      updateNodeData({ content: editableContent });
    }
  }, [updateNodeData, editableContent, content]);

  return (
    <Card className="min-w-[300px] border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden bg-white dark:bg-gray-800">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-move handle">
        <Move className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <CardContent className="p-2 nodrag">
        <Textarea
          value={editableContent}
          onChange={handleContentChange}
          onBlur={handleBlur}
          className="text-gray-800 dark:text-gray-100 text-base w-full border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-2 resize-none min-h-[60px] nodrag"
          placeholder="Enter text..."
        />
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </Card>
  );
}

export default memo(CustomNode);