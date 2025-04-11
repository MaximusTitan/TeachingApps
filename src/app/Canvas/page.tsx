'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import CanvasCard from './studio/CanvasCard';
import type { Canvas } from './types/canvas';

export default function CanvasStudio() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCanvases() {
      try {
        setLoading(true);
        // For demo, we're using a hardcoded user ID, in a real app this would come from auth
        const userId = 'user-1';
        
        const { data, error } = await supabase
          .from('canvases')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our Canvas type
          const formattedData: Canvas[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            objects: item.objects || [],
            nodes: item.nodes || [],
            edges: item.edges || [],
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            userId: item.user_id
          }));
          
          setCanvases(formattedData);
        }
      } catch (error) {
        console.error('Error fetching canvases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCanvases();
  }, []);

  const createNewCanvas = async () => {
    try {
      const newCanvas: Partial<Canvas> = {
        id: crypto.randomUUID(),
        name: 'Untitled',
        objects: [],
        nodes: [],
        edges: [],
        userId: 'user-1' // In a real app, this would be the authenticated user ID
      };

      const { error } = await supabase
        .from('canvases')
        .insert({
          id: newCanvas.id,
          name: newCanvas.name,
          objects: newCanvas.objects,
          nodes: newCanvas.nodes,
          edges: newCanvas.edges,
          user_id: newCanvas.userId
        });

      if (error) {
        throw error;
      }

      // Redirect to the new canvas
      window.location.href = `/Canvas/${newCanvas.id}`;
    } catch (error) {
      console.error('Error creating canvas:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Canvas Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create, edit, and manage your canvases</p>
        </div>
        <Button onClick={createNewCanvas} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Create New Canvas
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-[300px] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
          ))}
        </div>
      ) : canvases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canvases.map((canvas) => (
            <CanvasCard key={canvas.id} canvas={canvas} onUpdate={() => {
              // Refresh the canvases list
              window.location.reload();
            }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any canvases yet</p>
          <Button onClick={createNewCanvas} variant="outline" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Create your first canvas
          </Button>
        </div>
      )}
    </div>
  );
} 