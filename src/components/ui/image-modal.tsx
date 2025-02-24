import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { VisuallyHidden } from '@/components/ui/visually-hidden'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  prompt: string
  onDownload: (url: string) => void
  date?: string
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  onDownload,
  date,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogTitle asChild>
          <VisuallyHidden>Image Preview: {prompt}</VisuallyHidden>
        </DialogTitle>
        
        <div className="relative flex flex-col h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-50 bg-black/20 hover:bg-black/40"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-white" />
            <VisuallyHidden>Close image preview</VisuallyHidden>
          </Button>
          
          {/* Image container */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/50">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={prompt || "Generated image"}
                className="max-w-full max-h-[80vh] object-contain"
                style={{ margin: 'auto' }}
              />
            ) : null}
            
            {/* Navigation buttons */}
            {hasPrevious && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40"
                onClick={onPrevious}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
                <VisuallyHidden>Previous image</VisuallyHidden>
              </Button>
            )}
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40"
                onClick={onNext}
              >
                <ChevronRight className="h-8 w-8 text-white" />
                <VisuallyHidden>Next image</VisuallyHidden>
              </Button>
            )}
          </div>

          {/* Image info footer */}
          <div className="bg-background p-4 border-t">
            <div className="flex items-center justify-between max-w-full">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{prompt}</p>
                {date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => onDownload(imageUrl)}
                className="ml-4 flex-shrink-0"
                disabled={!imageUrl}
              >
                <Download className="h-4 w-4" />
                <VisuallyHidden>Download image</VisuallyHidden>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
