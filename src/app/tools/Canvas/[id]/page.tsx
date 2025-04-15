'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import IntegratedCanvas from '../canvas/IntegratedCanvas';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Canvas } from '../types/canvas';
import Link from 'next/link';

export default function CanvasPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isViewOnly = searchParams?.get('view') === 'true';
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    async function fetchCanvas() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('canvases')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our Canvas type
          const formattedData: Canvas = {
            id: data.id,
            name: data.name,
            objects: data.objects || [],
            nodes: data.nodes || [],
            edges: data.edges || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            userId: data.user_id
          };
          
          setCanvas(formattedData);
        }
      } catch (error) {
        console.error('Error fetching canvas:', error);
        setError('Failed to load canvas. It might not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCanvas();
    }
  }, [id]);

  // Save function to be passed to IntegratedCanvas
  const saveCanvas = async (canvasData: Partial<Canvas>) => {
    try {
      if (!id) return false;
      
      setIsSaving(true);
      
      const { error } = await supabase
        .from('canvases')
        .update({
          name: canvasData.name,
          objects: canvasData.objects,
          nodes: canvasData.nodes,
          edges: canvasData.edges,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving canvas:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back button click - save canvas before navigating
  const handleBackClick = async () => {
    if (isViewOnly) {
      window.location.href = '/tools/Canvas';
      return;
    }

    try {
      setIsSaving(true);
      console.log("Sidebar Back button clicked, attempting to save...");
      
      if (canvasRef.current && canvasRef.current.getCurrentCanvasData) {
        console.log("canvasRef exists and getCurrentCanvasData method is available");
        
        const canvasData = canvasRef.current.getCurrentCanvasData();
        console.log("Canvas data retrieved:", canvasData);
        
        const saveSuccess = await saveCanvas(canvasData);
        console.log("Save result:", saveSuccess);
      } else {
        console.warn("canvasRef or getCurrentCanvasData not available:", canvasRef.current);
      }
    } catch (error) {
      console.error('Error saving before navigation:', error);
    } finally {
      setIsSaving(false);
      console.log("Navigating to /studio");
      window.location.href = '/tools/Canvas';
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading canvas...</p>
        </div>
      </div>
    );
  }

  if (error || !canvas) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Canvas Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The canvas you are looking for could not be found.'}</p>
          <Button onClick={() => window.location.href = '/studio'}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Canvas Studio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <IntegratedCanvas 
        ref={canvasRef}
        initialCanvas={canvas}
        isViewOnly={isViewOnly}
        onSave={saveCanvas}
        onGoBack={handleBackClick}
      />
    </main>
  );
} 