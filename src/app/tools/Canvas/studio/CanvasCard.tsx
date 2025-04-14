'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, Share2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import type { Canvas } from '../types/canvas';

interface CanvasCardProps {
  canvas: Canvas;
  onUpdate: () => void;
}

export default function CanvasCard({ canvas, onUpdate }: CanvasCardProps) {
  const router = useRouter();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [newName, setNewName] = useState(canvas.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = formatRelativeTime(canvas.updatedAt);
  const createdDate = formatDate(canvas.createdAt);

  function formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return `Last edited ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Last edited recently';
    }
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently';
    }
  }

  const handleRename = async () => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('canvases')
        .update({ name: newName })
        .eq('id', canvas.id);
      
      if (error) throw error;
      
      setIsRenameDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error renaming canvas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('canvases')
        .delete()
        .eq('id', canvas.id);
      
      if (error) throw error;
      
      setIsDeleteDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting canvas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCanvas = () => {
    router.push(`/tools/Canvas/${canvas.id}`);
  };

  const generateShareLink = () => {
    return `${window.location.origin}/tools/Canvas/${canvas.id}?view=true`;
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div 
            className="w-full h-48 bg-gray-50 dark:bg-gray-800 flex items-center justify-center cursor-pointer"
            onClick={handleOpenCanvas}
          >
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              Click to open
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 flex flex-col items-stretch gap-2 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-medium truncate">{canvas.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div>{formattedDate}</div>
            <div className="flex items-center gap-2">
              <span className="sr-only">Created date</span>
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                <path d="M7.5 0.875C7.5 0.875 7.5 0.875 7.5 0.875C3.83152 0.875 0.875 3.83152 0.875 7.5C0.875 11.1685 3.83152 14.125 7.5 14.125C11.1685 14.125 14.125 11.1685 14.125 7.5C14.125 3.83152 11.1685 0.875 7.5 0.875ZM1.825 7.5C1.825 4.35309 4.35309 1.825 7.5 1.825C10.6469 1.825 13.175 4.35309 13.175 7.5C13.175 10.6469 10.6469 13.175 7.5 13.175C4.35309 13.175 1.825 10.6469 1.825 7.5ZM7.5 3.5C7.22386 3.5 7 3.72386 7 4V7.5C7 7.63807 7.05268 7.76307 7.14645 7.85685L9.14645 9.85685C9.34171 10.0521 9.65829 10.0521 9.85355 9.85685C10.0488 9.66159 10.0488 9.34501 9.85355 9.14975L8 7.29619V4C8 3.72386 7.77614 3.5 7.5 3.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              <span>Created {createdDate}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Canvas</DialogTitle>
            <DialogDescription>
              Enter a new name for your canvas.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Canvas name"
            className="my-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isSubmitting || !newName.trim()}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your canvas
              and remove all of its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Canvas</DialogTitle>
            <DialogDescription>
              Anyone with the link can view this canvas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Input
              value={generateShareLink()}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(generateShareLink());
              }}
              size="sm"
            >
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 