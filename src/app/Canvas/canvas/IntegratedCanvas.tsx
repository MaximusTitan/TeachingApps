'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Pencil, Square, Circle, Type, Eraser, MousePointer,
  Palette, ChevronLeft, MessageCircle, Image as ImageIcon, Waves,
  Save, Share, Move, Hand, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Canvas as CanvasType } from '../types/canvas';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  MiniMap,
  BackgroundVariant
} from 'react-flow-renderer';
import CustomNodeComponent from './nodes/CustomNode';
import AINode from './nodes/AINode';
import AIImageNode from './nodes/AIImageNode';
import type { Canvas as FabricCanvas } from 'fabric';
import * as fabric from 'fabric';
import TailwindNode from './nodes/TailwindNode';

// Fix TypeScript error by adding a type declaration
declare global {
  interface HTMLCanvasElement {
    fabric?: FabricCanvas;
  }
}

// Add proper type declarations for Fabric.js
declare module 'fabric' {
  interface Canvas {
    isDragging?: boolean;
    lastPosX?: number;
    lastPosY?: number;
    historyUndo?: string[];
    historyRedo?: string[];
    _isContextLost?: boolean;
    lowerCanvasEl: HTMLCanvasElement;
  }
  interface BaseBrush {
    globalCompositeOperation?: string;
  }
  interface Object {
    id?: string;
    left?: number;
    top?: number;
    enterEditing?: () => void;
    selectAll?: () => void;
    type?: string;
  }
}

const nodeTypes = {
  custom: CustomNodeComponent,
  ai: AINode,
  aiImage: AIImageNode,
  tailwind: TailwindNode,
};

// Add props interface
interface IntegratedCanvasProps {
  initialCanvas?: CanvasType;
  isViewOnly?: boolean;
  onSave?: (canvasData: Partial<CanvasType>) => Promise<boolean>;
  onGoBack?: () => Promise<void>;
}

const IntegratedCanvas = forwardRef<
  { getCurrentCanvasData: () => Partial<CanvasType> },
  IntegratedCanvasProps
>(({ initialCanvas, isViewOnly = false, onSave, onGoBack }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeTool, setActiveTool] = useState<string>('select');
  const [activeSize, setActiveSize] = useState<string>('M');
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const { theme } = useTheme();

  // Canvas name state
  const [canvasName, setCanvasName] = useState(initialCanvas?.name || 'Untitled');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialCanvas?.updatedAt ? new Date(initialCanvas.updatedAt) : null
  );

  // Flow state - initialize with data from initialCanvas if provided
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialCanvas?.nodes as Node[] || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialCanvas?.edges as Edge[] || []
  );

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [lastClientX, setLastClientX] = useState(0);
  const [lastClientY, setLastClientY] = useState(0);
  const [selectedShape, setSelectedShape] = useState<string>('rectangle');

  // ReactFlow instance
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add new state for line style
  const [lineStyle, setLineStyle] = useState<string>('solid');
  const [shapeFillColor, setShapeFillColor] = useState<string>('transparent');

  // Add state for text formatting options
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [textAlign, setTextAlign] = useState<string>('left');
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);

  // DEFINE toggleFullscreen FIRST
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenEnabled) {
      console.warn("Fullscreen API is not supported by this browser.");
      return;
    }
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []); // Keep dependency array empty

  // THEN define useEffects that might use it (or depend on state it sets)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      console.log("Fullscreen change detected, isFullscreen:", !!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Initialize resize observer
  useEffect(() => {
    if (!canvas || !canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const handleResize = () => {
      // Get new dimensions of the container
      const width = container.clientWidth;
      const height = container.clientHeight;

      console.log("Resizing canvas to:", width, "x", height);

      try {
        // Resize the canvas maintaining content
        canvas.setDimensions({ width, height });
        canvas.renderAll();
      } catch (error) {
        console.error("Error resizing canvas:", error);
      }
    };

    // Create a resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Also handle window resize events
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [canvas]);

  // First load fabric.js
  useEffect(() => {
    async function loadFabric() {
      try {
        const fabricModule = await import('fabric');
        console.log("Fabric.js loaded successfully");
      } catch (error) {
        console.error("Error loading fabric.js:", error);
      }
    }

    loadFabric();
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("INITIALIZING FABRIC CANVAS (Effect Run)");
    try {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        renderOnAddRemove: true,
        preserveObjectStacking: true,
        selection: !isViewOnly,
        isDrawingMode: false,
        backgroundColor: 'transparent',
        stopContextMenu: true,
      });

      console.log("Fabric Canvas Initialized Instance:", fabricCanvas);

      // Set initial brush settings
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color = '#000000';
      fabricCanvas.freeDrawingBrush.width = 2;

      // Load objects from initialCanvas if provided
      if (initialCanvas?.objects && initialCanvas.objects.length > 0) {
        try {
          fabricCanvas.loadFromJSON({ objects: initialCanvas.objects }, () => {
            fabricCanvas.renderAll();
            console.log("Objects loaded from initialCanvas");
          });
        } catch (loadError) {
          console.error("Error loading objects from initialCanvas:", loadError);
        }
      }

      // Set canvas to view-only mode if isViewOnly is true
      if (isViewOnly) {
        fabricCanvas.selection = false;
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.forEachObject((obj: any) => {
          obj.selectable = false;
          obj.evented = false;
        });
      }

      // Path Created: Log event, let Fabric handle adding/rendering internally
      fabricCanvas.on('path:created', (e: any) => {
        console.log('Event: path:created - Path data:', e.path);
        if (e.path) {
          // *** REMOVED manual fabricCanvas.add(e.path) ***
          // Log object count *after* Fabric should have added it internally
          console.log(`---> Object count after path:created (Fabric internal add): ${fabricCanvas.getObjects().length}`);
        } else {
          console.warn('path:created event fired without a path object.');
        }
      });

      // Mouse Up: Final render after drawing stroke
      fabricCanvas.on('mouse:up', (opt) => {
        console.log('Event: mouse:up');
        if (fabricCanvas.isDrawingMode) {
          console.log(`---> Before renderAll in mouse:up: ${fabricCanvas.getObjects().length} objects`);
          // Render to ensure final state is shown
          fabricCanvas.renderAll();
          console.log(`---> After renderAll in mouse:up: ${fabricCanvas.getObjects().length} objects`);
          console.log('Forcing renderAll on mouse:up in drawing mode COMPLETE');
        }
      });

      setCanvas(fabricCanvas);
      console.log("Canvas state set after initialization");

      // Trigger initial resize handling
      const container = canvasRef.current.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        fabricCanvas.setDimensions({ width, height });
        fabricCanvas.renderAll(); // Initial render after setting dimensions
        console.log("Initial dimensions set and rendered:", width, "x", height);
      }

      return () => {
        console.log("CLEANUP: Disposing Fabric Canvas (Effect Cleanup)"); // Log cleanup
        fabricCanvas.off('path:created');
        fabricCanvas.off('mouse:up');
        fabricCanvas.dispose();
        setCanvas(null);
      };
    } catch (error) {
      console.error('Error initializing canvas:', error);
    }
  }, [initialCanvas, isViewOnly]);

  // Update Brush Color when activeColor changes
  useEffect(() => {
    if (canvas && canvas.freeDrawingBrush && activeTool !== 'eraser') {
      console.log("EFFECT: Updating brush color:", activeColor);
      canvas.freeDrawingBrush.color = activeColor;
    }
  }, [canvas, activeColor, activeTool]);

  // Update Brush Size when activeSize changes
  useEffect(() => {
    if (canvas && canvas.freeDrawingBrush) {
      const newSize = getSizeValue(activeSize);
      console.log("EFFECT: Updating brush size:", newSize);
      canvas.freeDrawingBrush.width = newSize;
      if (activeTool === 'eraser') {
        canvas.freeDrawingBrush.width = newSize * 2;
      }
    }
  }, [canvas, activeSize, activeTool]);

  // Reset zoom/pan on ReactFlow when needed
  const resetView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({
        padding: 0.2,
        includeHiddenNodes: false,
      });
    }
  }, [reactFlowInstance]);

  // Call when ReactFlow instance is available
  const onInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!canvas) return;

    const handleResize = () => {
      if (!canvas || !canvas.getContext) {
        console.warn("Canvas not ready for resize");
        return;
      }

      try {
        const width = window.innerWidth - (showRightSidebar ? 400 : 200);
        const height = window.innerHeight - 48;

        canvas.setDimensions({ width, height });

        if (!canvas._isContextLost) {
          canvas.renderAll();
        }
      } catch (error) {
        console.error("Error handling resize:", error);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvas, showRightSidebar]);

  // Helper to convert size string to numerical value
  const getSizeValue = (size: string) => {
    switch (size) {
      case 'S': return 1;
      case 'M': return 2;
      case 'L': return 4;
      case 'XL': return 8;
      default: return 2;
    }
  };

  // Define actions *before* they are used in sidebarItems/bottomTools
  const addTextNodeAction = () => onAddNode('custom');
  const addAiNodeAction = () => onAddNode('ai');
  const addAiImageNodeAction = () => onAddNode('aiImage');
  const addTailwindNodeAction = () => onAddNode('tailwind');
  const handleSave = async () => {
    if (!canvas || !onSave) return;

    try {
      setIsSaving(true);

      // Use the getCurrentCanvasData method to get the current state
      const canvasData = getCurrentCanvasData();

      const success = await onSave(canvasData);

      if (success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving canvas:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleShareAction = () => console.log("Share clicked - implement sharing logic");
  const handleTailwindAction = () => console.log("Tailwind clicked - implement Tailwind logic");
  const handleImageAction = () => handleImageToolClick();

  // Define bottomTools *after* actions are defined
  const bottomTools = [
    { name: 'select', icon: MousePointer },
    { name: 'hand', icon: Hand },
    { name: 'pencil', icon: Pencil },
    { name: 'shape', icon: Square },
    { name: 'text', icon: Type },
    { name: 'eraser', icon: Eraser },
    { name: 'image', icon: ImageIcon, action: handleImageAction },
    {
      name: 'fullscreen',
      icon: isFullscreen ? Minimize2 : Maximize2,
      action: toggleFullscreen
    }
  ];

  const colors = [
    '#000000', '#808080', '#E066FF', '#8A2BE2',
    '#0000FF', '#1E90FF', '#FFA500', '#FF4500',
    '#008080', '#00FF00', '#FF69B4', '#FF0000'
  ];

  const sidebarItems = [
    { name: 'Go Back', icon: ChevronLeft, action: onGoBack },
    { name: 'Text', icon: Type, action: addTextNodeAction },
    { name: 'AI Response', icon: MessageCircle, action: addAiNodeAction },
    { name: 'AI Image', icon: ImageIcon, action: addAiImageNodeAction },
    { name: 'Tailwind', icon: Waves, action: addTailwindNodeAction },
    { name: 'Save', icon: Save, action: handleSave },
    { name: 'Share', icon: Share, action: handleShareAction }
  ];

  const handleSidebarItemClick = (itemName: string) => {
    setShowRightSidebar(false); // Hide right sidebar on left sidebar interaction

    // Find the item and execute its action if it exists
    const item = sidebarItems.find(i => i.name === itemName);
    if (item && item.action) {
      item.action();
    } else {
      console.warn(`Action not found for sidebar item: ${itemName}`);
    }
  };

  // Handle shape creation
  const handleAddRect = () => {
    if (!canvas) return;

    try {
      // Check if canvas is valid
      if (!canvas.getContext || !canvas.lowerCanvasEl) {
        console.warn('Canvas context not ready for adding rectangle');
        return;
      }

      const rect = new fabric.Rect({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        fill: activeColor,
        width: 100,
        height: 100,
        transparentCorners: false,
        cornerColor: '#0000ff',
        borderColor: '#0000ff',
      });

      canvas.add(rect);
      canvas.setActiveObject(rect);

      if (!canvas._isContextLost) {
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error adding rectangle:", error);
    }
  };

  const handleAddCircle = () => {
    if (!canvas) return;

    try {
      // Check if canvas is valid
      if (!canvas.getContext || !canvas.lowerCanvasEl) {
        console.warn('Canvas context not ready for adding circle');
        return;
      }

      const circle = new fabric.Circle({
        left: canvas.width! / 2 - 50,
        top: canvas.height! / 2 - 50,
        fill: activeColor,
        radius: 50,
        transparentCorners: false,
        cornerColor: '#0000ff',
        borderColor: '#0000ff',
      });

      canvas.add(circle);
      canvas.setActiveObject(circle);

      if (!canvas._isContextLost) {
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error adding circle:", error);
    }
  };

  // Modify handleAddText to create smaller text
  const handleAddText = () => {
    if (!canvas) return;

    try {
      // Check if canvas is valid
      if (!canvas.getContext) {
        console.warn('Canvas context not ready for adding text');
        return;
      }

      // Switch to select mode first to ensure proper text interaction
      setActiveTool('select');

      // Create the text object with all necessary properties
      const text = new fabric.IText('Type here', {
        left: (canvas.width ?? window.innerWidth) / 2 - 50,
        top: (canvas.height ?? window.innerHeight) / 2 - 50,
        fill: activeColor,
        fontSize: getSizeValue(activeSize) * 5, // Reduced multiplier from 10 to 5
        fontFamily: 'Arial',
        transparentCorners: false,
        cornerColor: '#0000ff',
        borderColor: '#0000ff',
        editable: true,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });

      (canvas as fabric.Canvas & { add: (obj: any) => fabric.Canvas }).add(text);
      canvas.setActiveObject(text);

      // Activate text editing with a slight delay to ensure it's ready
      setTimeout(() => {
        if (text.enterEditing) {
          text.enterEditing();
          if (text.selectAll) {
            text.selectAll();
          }
          canvas.renderAll();
        }
      }, 100);

      // Setup canvas for text editing
      canvas.isDrawingMode = false;
      canvas.selection = true;

      // Hide sidebar after adding
      setShowRightSidebar(false);
    } catch (error) {
      console.error("Error adding text:", error);
    }
  };

  // Add function to apply text formatting to selected text
  const applyTextFormatting = (property: string, value: any) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
      activeObject.set({ [property]: value });
      canvas.renderAll();
      console.log(`Applied ${property}:`, value);
    } else {
      alert("Select a text object first");
    }
  };

  const onConnect = (params: Connection | Edge) => {
    setEdges((eds) => addEdge(params, eds));
  };

  const onAddNode = (type: string) => {
    let nodeType = 'custom';

    if (type === 'ai') {
      nodeType = 'ai';
    } else if (type === 'aiImage') {
      nodeType = 'aiImage';
    } else if (type === 'tailwind') {
      nodeType = 'tailwind';
    }

    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: nodeType,
      position: { x: 250, y: 250 },
      data: {
        label: type === 'aiImage'
          ? 'AI Image'
          : type === 'ai'
            ? 'AI Response'
            : type === 'tailwind'
              ? 'Tailwind UI'
              : 'Text Node',
        content: '',
        updateNodeData: (data: any) => {
          setNodes(nds =>
            nds.map(n =>
              n.id === newNode.id
                ? { ...n, data: { ...n.data, ...data } }
                : n
            )
          );
        }
      },
    };

    setNodes((nds) => [...nds, newNode as any]);
  };

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    getCurrentCanvasData: () => {
      if (!canvas) return { name: canvasName };

      try {
        // Extract objects from canvas and map them to CanvasObject format
        const rawObjects = canvas.toJSON().objects;
        const objects = rawObjects.map((obj: any) => ({
          id: obj.id || crypto.randomUUID(),
          type: obj.type || 'shape',
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.width,
          height: obj.height,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          // Include any other properties from the raw object
          ...obj
        }));

        // Create canvas data
        return {
          name: canvasName,
          objects,
          nodes: nodes as any,
          edges: edges as any,
        };
      } catch (error) {
        console.error('Error getting current canvas data:', error);
        return { name: canvasName };
      }
    }
  }));

  // Helper function to get current canvas data (used by both handleSave and the ref)
  const getCurrentCanvasData = (): Partial<CanvasType> => {
    if (!canvas) return { name: canvasName };

    try {
      // Extract objects from canvas and map them to CanvasObject format
      const rawObjects = canvas.toJSON().objects;
      const objects = rawObjects.map((obj: any) => ({
        id: obj.id || crypto.randomUUID(),
        type: obj.type || 'shape',
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width,
        height: obj.height,
        fill: obj.fill,
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth,
        text: obj.text,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        // Include any other properties from the raw object
        ...obj
      }));

      // Create canvas data
      return {
        name: canvasName,
        objects,
        nodes: nodes as any,
        edges: edges as any,
      };
    } catch (error) {
      console.error('Error getting canvas data:', error);
      return { name: canvasName };
    }
  };

  const handleLoad = (canvasData: CanvasType) => {
    if (!canvas) return;
    canvas.loadFromJSON({ objects: canvasData.objects }, canvas.renderAll.bind(canvas));
    if (canvasData.nodes) setNodes(canvasData.nodes as unknown as Node[]);
    if (canvasData.edges) setEdges(canvasData.edges as unknown as Edge[]);
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setActiveColor(color);

    if (!canvas) return;

    try {
      console.log("Changing brush color to:", color);

      if (canvas.freeDrawingBrush) {
        // *** Add check: Only set color directly if not using eraser ***
        if (activeTool !== 'eraser') {
          canvas.freeDrawingBrush.color = color;

          // Maintain line style while changing color
          if (activeTool === 'pencil') {
            updatePencilBrush(canvas.freeDrawingBrush as fabric.PencilBrush);
          }
        }
      }

      // If in PENCIL drawing mode, re-create the pencil brush with the new color
      // This ensures the correct composite operation ('source-over') is set
      if (activeTool === 'pencil' && canvas.isDrawingMode) {
        const pencilBrush = new fabric.PencilBrush(canvas);
        updatePencilBrush(pencilBrush);
        (pencilBrush as any).globalCompositeOperation = 'source-over'; // Explicitly set for pencil
        canvas.freeDrawingBrush = pencilBrush;
        canvas.renderAll();
      }

      // Update selected object if it exists
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'path') {
          activeObject.set({ stroke: color });
        } else {
          // For other shapes, update stroke color
          activeObject.set({ stroke: color });
        }
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error changing color:", error);
    }
  };

  // Function to apply line style to an existing path
  const applyLineStyleToPath = (path: fabric.Path, style: string) => {
    if (!path) return;

    if (style === 'dotted') {
      path.set({ strokeDashArray: [1, 3] });
    } else if (style === 'dashed') {
      path.set({ strokeDashArray: [5, 5] });
    } else {
      path.set({ strokeDashArray: [] });
    }
  };

  // Handle size change
  const handleSizeChange = (size: string) => {
    setActiveSize(size);

    if (!canvas) return;

    try {
      const sizeValue = getSizeValue(size);
      console.log("Changing brush size to:", sizeValue);

      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = sizeValue;

        if (activeTool === 'eraser') {
          canvas.freeDrawingBrush.width = sizeValue * 2;
        }

        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error changing brush size:", error);
    }
  };

  // Handle shape selection
  const handleShapeSelect = (shape: string) => {
    setSelectedShape(shape);
    setActiveTool('shape'); // Important: Switch to shape tool when selecting a shape

    if (!canvas) {
      console.error("Canvas not initialized for shape selection");
      return;
    }

    try {
      console.log(`Shape selected: ${shape}`);

      // Turn off drawing mode and prepare for shape creation
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';

      // Note: We don't immediately add shapes here - we wait for mouse click
      // when in shape tool mode (see handleToolClick case for 'shape')
    } catch (error) {
      console.error(`Error selecting shape ${shape}:`, error);
    }
  };

  // Determine if a drawing-related tool is active
  const isDrawingToolActive = [
    'pencil', 'eraser', 'hand', 'shape', 'text', 'select'
  ].includes(activeTool);

  // Add keyboard event handler for node deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas && canvas.getActiveObject()) {
          // Delete selected fabric object
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            canvas.remove(activeObject);
            canvas.renderAll();
          }
        } else if (reactFlowInstance) {
          // Delete selected nodes from ReactFlow
          const selectedNodes = nodes.filter(node => node.selected);
          const selectedEdges = edges.filter(edge => edge.selected);

          if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            setNodes(nds => nds.filter(node => !node.selected));
            setEdges(eds => eds.filter(edge => !edge.selected));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, reactFlowInstance, nodes, edges]);

  // Function to handle image tool click
  const handleImageToolClick = () => {
    fileInputRef.current?.click();
  };

  // Function to handle file selection and add image to canvas
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data === 'string') {
        fabric.Image.fromURL(data, (img) => {
          // Center the image initially
          img.scaleToWidth(200); // Scale image to a default width
          img.set({
            left: (canvas.width ?? window.innerWidth) / 2 - (img.getScaledWidth() / 2),
            top: (canvas.height ?? window.innerHeight) / 2 - (img.getScaledHeight() / 2),
            // Add other properties if needed
          });
          canvas.add(img);
          canvas.setActiveObject(img); // Make the new image active
          canvas.renderAll();
          setActiveTool('select'); // Switch back to select tool after adding image
        });
      }
    };

    reader.readAsDataURL(file);

    // Reset file input value to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Modify handleToolClick to correctly handle eraser
  const handleToolClick = (toolName: string) => {
    console.log(`Tool clicked: ${toolName}, Current tool: ${activeTool}`);

    const shouldShowRightSidebar = [
      'pencil', 'eraser', 'shape', 'text'
    ].includes(toolName);
    setShowRightSidebar(shouldShowRightSidebar);

    if (toolName === 'fullscreen') {
      toggleFullscreen();
      return;
    }

    if (toolName === 'image') {
      handleImageToolClick();
      return;
    }

    // Handle other tools
    setActiveTool(toolName);
    if (canvas) {
      console.log(`Updating canvas settings for tool: ${toolName}`);
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';

      switch (toolName) {
        case 'pencil':
          canvas.isDrawingMode = true;
          canvas.selection = false;
          // Ensure brush is configured for pencil
          const pencilBrush = new fabric.PencilBrush(canvas);
          updatePencilBrush(pencilBrush);
          // Ensure composite operation is standard for pencil
          (pencilBrush as any).globalCompositeOperation = 'source-over';
          canvas.freeDrawingBrush = pencilBrush;
          console.log("Pencil mode activated");
          break;
        case 'eraser':
          canvas.isDrawingMode = true;
          canvas.selection = false;
          // Create a PencilBrush with proper eraser settings
          const eraserBrush = new fabric.PencilBrush(canvas);
          eraserBrush.width = getSizeValue(activeSize) * 2; // Make eraser slightly larger

          // Set to transparent white color for visual feedback during erasing
          eraserBrush.color = 'rgb(255, 255, 255)';

          // This is the critical setting for erasing
          (eraserBrush as any).globalCompositeOperation = 'destination-out';

          canvas.freeDrawingBrush = eraserBrush;
          console.log("Eraser mode activated with globalCompositeOperation:", (eraserBrush as any).globalCompositeOperation);
          break;
        case 'shape':
          canvas.isDrawingMode = false;
          canvas.selection = true;
          canvas.defaultCursor = 'crosshair';
          canvas.hoverCursor = 'crosshair';

          // Show right sidebar with shape options
          setShowRightSidebar(true);

          // Track shape drawing state
          let isDrawingShape = false;
          let startX = 0;
          let startY = 0;
          let currentShape: fabric.Object | null = null;

          // Setup mouse handlers for drawing shapes
          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');

          // Start drawing shape on mouse down
          canvas.on('mouse:down', function (opt) {
            if (opt.e instanceof MouseEvent) {
              isDrawingShape = true;
              const pointer = canvas.getPointer(opt.e);
              startX = pointer.x;
              startY = pointer.y;

              // Create initial shape with border only (no fill)
              if (selectedShape === 'rectangle') {
                currentShape = new fabric.Rect({
                  left: startX,
                  top: startY,
                  width: 0,
                  height: 0,
                  fill: shapeFillColor,
                  stroke: activeColor,
                  strokeWidth: getSizeValue(activeSize),
                  transparentCorners: false,
                  cornerColor: '#0000ff',
                  borderColor: '#0000ff',
                  cornerSize: 10,
                  selectable: true,
                  hasControls: true,
                  hasBorders: true
                });
              } else if (selectedShape === 'circle') {
                currentShape = new fabric.Circle({
                  left: startX,
                  top: startY,
                  radius: 0,
                  fill: shapeFillColor,
                  stroke: activeColor,
                  strokeWidth: getSizeValue(activeSize),
                  transparentCorners: false,
                  cornerColor: '#0000ff',
                  borderColor: '#0000ff',
                  cornerSize: 10,
                  selectable: true,
                  hasControls: true,
                  hasBorders: true
                });
              } else if (selectedShape === 'triangle') {
                currentShape = new fabric.Triangle({
                  left: startX,
                  top: startY,
                  width: 0,
                  height: 0,
                  fill: shapeFillColor,
                  stroke: activeColor,
                  strokeWidth: getSizeValue(activeSize),
                  transparentCorners: false,
                  cornerColor: '#0000ff',
                  borderColor: '#0000ff',
                  cornerSize: 10,
                  selectable: true,
                  hasControls: true,
                  hasBorders: true
                });
              } else if (selectedShape === 'line') {
                currentShape = new fabric.Line([startX, startY, startX, startY], {
                  stroke: activeColor,
                  strokeWidth: getSizeValue(activeSize),
                  selectable: true,
                  hasControls: true,
                  hasBorders: true
                });
              }

              if (currentShape) {
                canvas.add(currentShape);
                canvas.renderAll();
              }
            }
          });

          // Resize shape as mouse moves
          canvas.on('mouse:move', function (opt) {
            if (!isDrawingShape || !currentShape || !opt.e || !(opt.e instanceof MouseEvent)) return;

            const pointer = canvas.getPointer(opt.e);

            if (selectedShape === 'rectangle' && currentShape instanceof fabric.Rect) {
              const width = Math.abs(pointer.x - startX);
              const height = Math.abs(pointer.y - startY);

              // Update position to handle drawing in any direction
              currentShape.set({
                left: Math.min(startX, pointer.x),
                top: Math.min(startY, pointer.y),
                width: width,
                height: height
              });
            } else if (selectedShape === 'circle' && currentShape instanceof fabric.Circle) {
              // For circle, use distance from start point as radius
              const radius = Math.sqrt(
                Math.pow(pointer.x - startX, 2) +
                Math.pow(pointer.y - startY, 2)
              ) / 2;

              // Update position and radius
              currentShape.set({
                left: Math.min(startX, pointer.x),
                top: Math.min(startY, pointer.y),
                radius: radius
              });
            } else if (selectedShape === 'triangle' && currentShape instanceof fabric.Triangle) {
              const width = Math.abs(pointer.x - startX);
              const height = Math.abs(pointer.y - startY);

              // Update position to handle drawing in any direction
              currentShape.set({
                left: Math.min(startX, pointer.x),
                top: Math.min(startY, pointer.y),
                width: width,
                height: height
              });
            } else if (selectedShape === 'line' && currentShape instanceof fabric.Line) {
              // Update end point of line
              currentShape.set({
                x2: pointer.x,
                y2: pointer.y
              });

              // Apply line style if needed
              if (lineStyle === 'dotted') {
                currentShape.set({ strokeDashArray: [1, 3] });
              } else if (lineStyle === 'dashed') {
                currentShape.set({ strokeDashArray: [5, 5] });
              } else {
                currentShape.set({ strokeDashArray: [] });
              }
            }

            canvas.renderAll();
          });

          // Finish drawing on mouse up
          canvas.on('mouse:up', function () {
            isDrawingShape = false;

            if (currentShape) {
              // Finalize the shape and make sure it's selectable
              currentShape.set({
                selectable: true,
                hasControls: true,
                hasBorders: true
              });
              canvas.setActiveObject(currentShape);
              currentShape = null;

              // Switch to select tool after creating a shape
              setTimeout(() => {
                setActiveTool('select');

                // Update canvas settings for select mode
                canvas.isDrawingMode = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                canvas.hoverCursor = 'move';

                // Re-attach selection handlers
                canvas.off('mouse:down');
                canvas.on('mouse:down', function (options) {
                  if (options.target) {
                    canvas.setActiveObject(options.target);
                  }
                });
              }, 100);
            }

            canvas.renderAll();
          });
          break;
        case 'text':
          canvas.isDrawingMode = false;
          canvas.selection = true;
          canvas.defaultCursor = 'text';
          handleAddText();
          break;
        case 'select':
          canvas.isDrawingMode = false;
          canvas.selection = true;
          canvas.defaultCursor = 'default';
          canvas.hoverCursor = 'move';

          // Ensure all objects are selectable
          canvas.forEachObject(function (obj) {
            obj.selectable = true;
            obj.hasControls = true;
            obj.hasBorders = true;
            if (obj.evented !== undefined) {
              obj.evented = true;
            }
          });

          // Enhanced selection setup:
          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');
          canvas.off('mouse:dblclick');

          // Single click to select objects
          canvas.on('mouse:down', function (options) {
            console.log("Mouse down on select mode", options.target);
            if (options.target) {
              canvas.setActiveObject(options.target);
              canvas.renderAll();
            }
          });

          // Double click to edit text
          canvas.on('mouse:dblclick', function (options) {
            if (options.target && (options.target.type === 'i-text' || options.target.type === 'text')) {
              console.log("Double-clicked on text, entering edit mode");
              const textObject = options.target as fabric.IText;
              if (textObject.enterEditing) {
                textObject.enterEditing();
                if (textObject.selectAll) {
                  textObject.selectAll();
                }
                canvas.renderAll();
              }
            }
          });
          break;
        case 'hand':
          canvas.isDrawingMode = false;
          canvas.selection = true;
          canvas.defaultCursor = 'grab';
          canvas.hoverCursor = 'grab';

          // Enhanced hand tool for both panning and moving objects
          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');

          canvas.on('mouse:down', function (opt) {
            if (opt.e instanceof MouseEvent) {
              const evt = opt.e;

              // If clicked on an object, set it as active for moving
              if (opt.target) {
                canvas.setActiveObject(opt.target);
                return; // Let Fabric.js handle object movement
              }

              // Otherwise, start panning the canvas
              canvas.isDragging = true;
              canvas.lastPosX = evt.clientX;
              canvas.lastPosY = evt.clientY;
              canvas.defaultCursor = 'grabbing';
              canvas.hoverCursor = 'grabbing';
              canvas.renderAll();
            }
          });

          canvas.on('mouse:move', function (opt) {
            if (canvas.isDragging && opt.e instanceof MouseEvent) {
              const evt = opt.e;
              if (canvas.lastPosX !== undefined && canvas.lastPosY !== undefined) {
                const deltaX = evt.clientX - canvas.lastPosX;
                const deltaY = evt.clientY - canvas.lastPosY;
                canvas.relativePan({ x: deltaX, y: deltaY });
                canvas.lastPosX = evt.clientX;
                canvas.lastPosY = evt.clientY;
              }
            }
          });

          canvas.on('mouse:up', function () {
            canvas.isDragging = false;
            canvas.defaultCursor = 'grab';
            canvas.hoverCursor = 'grab';
            canvas.renderAll();
          });
          break;
        default:
          console.log(`Unhandled tool in switch: ${toolName}`);
          break;
      }

      // Removed redundant cursor/selection adjustments here, handled in switch cases

      canvas.requestRenderAll();
    } else {
      console.warn("handleToolClick called but canvas is not ready.");
    }
  };

  // Modify pencil brush based on line style
  const updatePencilBrush = (brush: fabric.PencilBrush) => {
    brush.color = activeColor;
    brush.width = getSizeValue(activeSize);

    // Apply line style if supported
    if (lineStyle === 'dotted') {
      (brush as any).strokeDashArray = [1, 3];
    } else if (lineStyle === 'dashed') {
      (brush as any).strokeDashArray = [5, 5];
    } else {
      (brush as any).strokeDashArray = [];
    }

    return brush;
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Add hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* Debug indicator */}
      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-white text-pink-800 dark:text-pink-200 py-1 px-2 text-xs z-[100] flex justify-between items-center">
        <button
          className="text-xs bg-white dark:bg-white px-2 py-0.5 rounded hover:bg-pink-300 dark:hover:bg-pink-700"
          onClick={() => {
            console.log("CURRENT CANVAS OBJECT:", canvas);
            if (canvas) {
              console.log("Fabric Canvas Properties:", {
                isDrawingMode: canvas.isDrawingMode,
                selection: canvas.selection,
                width: canvas.width,
                height: canvas.height
              });

              // Add selection debugging
              console.log("Active Object:", canvas.getActiveObject());

              // Log all objects and their properties
              console.log("All Canvas Objects:");
              canvas.forEachObject(obj => {
                console.log(obj.type, {
                  selectable: obj.selectable,
                  hasControls: obj.hasControls,
                  hasBorders: obj.hasBorders,
                  evented: obj.evented
                });
              });
            }
          }}
        >
        </button>
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 z-50">
        {/* REMOVED the Page 1 button container */}
        {/* 
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">Page 1</Button>
        </div>
        */}
      </div>

      {/* Left Sidebar */}
      <div className="absolute left-0 top-12 bottom-0 w-[200px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col p-4 space-y-6">
        {sidebarItems.map((item) => (
          <div
            key={item.name}
            className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-black dark:hover:text-white"
            onClick={() => handleSidebarItemClick(item.name)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Right Sidebar */}
      {showRightSidebar && (
        <div className="absolute right-0 top-12 bottom-0 w-[200px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-40 flex flex-col p-4">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
            {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Options
          </h3>

          {/* Color Palette - Show for all tools except eraser */}
          {activeTool !== 'eraser' && (
            <>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Color</h4>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      activeColor === color && "ring-2 ring-blue-500"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Size Controls - Show for all tools */}
          <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {activeTool === 'eraser' ? 'Eraser Size' : 'Thickness'}
          </h4>
          <div className="mb-6">
            <input
              type="range"
              min="1"
              max="20"
              className="w-full"
              value={getSizeValue(activeSize)}
              onChange={(e) => {
                // Convert slider value back to size
                const val = parseInt(e.target.value);
                if (val <= 1) handleSizeChange('S');
                else if (val <= 3) handleSizeChange('M');
                else if (val <= 10) handleSizeChange('L');
                else handleSizeChange('XL');
              }}
            />
            <div className="flex justify-between mt-2">
              {['S', 'M', 'L', 'XL'].map((size) => (
                <Button
                  key={size}
                  variant={activeSize === size ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Pencil Tool Options */}
          {activeTool === 'pencil' && (
            <>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Line Style</h4>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <Button
                  variant={lineStyle === 'solid' ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={() => {
                    setLineStyle('solid');
                    if (canvas && canvas.freeDrawingBrush) {
                      (canvas.freeDrawingBrush as any).strokeDashArray = [];
                      canvas.renderAll();
                    }
                  }}
                >
                  <div className="w-6 h-0.5 bg-current"></div>
                </Button>
                <Button
                  variant={lineStyle === 'dotted' ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={() => {
                    setLineStyle('dotted');
                    if (canvas && canvas.freeDrawingBrush) {
                      (canvas.freeDrawingBrush as any).strokeDashArray = [1, 3];
                      canvas.renderAll();
                    }
                  }}
                >
                  <div className="w-6 flex items-center">
                    <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                    <div className="w-1"></div>
                    <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                    <div className="w-1"></div>
                    <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                  </div>
                </Button>
                <Button
                  variant={lineStyle === 'dashed' ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={() => {
                    setLineStyle('dashed');
                    if (canvas && canvas.freeDrawingBrush) {
                      (canvas.freeDrawingBrush as any).strokeDashArray = [5, 5];
                      canvas.renderAll();
                    }
                  }}
                >
                  <div className="w-6 flex items-center">
                    <div className="w-1.5 h-0.5 bg-current"></div>
                    <div className="w-1"></div>
                    <div className="w-1.5 h-0.5 bg-current"></div>
                    <div className="w-1"></div>
                    <div className="w-1.5 h-0.5 bg-current"></div>
                  </div>
                </Button>
              </div>

              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tools</h4>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (canvas) {
                      const activeObject = canvas.getActiveObject();
                      if (activeObject && activeObject.type === 'path') {
                        // Apply the currently selected line style to the active path
                        if (lineStyle === 'dotted') {
                          activeObject.set({ strokeDashArray: [1, 3] });
                        } else if (lineStyle === 'dashed') {
                          activeObject.set({ strokeDashArray: [5, 5] });
                        } else {
                          activeObject.set({ strokeDashArray: [] });
                        }
                        canvas.renderAll();
                        console.log(`Applied ${lineStyle} style to selected path`);
                      } else {
                        alert("Select a line to edit first");
                      }
                    }
                  }}
                >
                  Apply Style to Line
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (canvas) {
                      const activeObject = canvas.getActiveObject();
                      if (activeObject && activeObject.type === 'path') {
                        // Change the line color to active color
                        activeObject.set({ stroke: activeColor });
                        canvas.renderAll();
                      } else {
                        alert("Select a line to edit first");
                      }
                    }
                  }}
                >
                  Change Line Color
                </Button>
              </div>
            </>
          )}

          {/* Shape Tool Options */}
          {activeTool === 'shape' && (
            <>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Shapes</h4>
              <div className="grid grid-cols-4 gap-2 mb-6">
                <button
                  className={cn(
                    "w-8 h-8 border border-gray-300 rounded flex items-center justify-center",
                    selectedShape === 'rectangle' && "bg-blue-100 border-blue-500"
                  )}
                  onClick={() => handleShapeSelect('rectangle')}
                >
                  □
                </button>
                <button
                  className={cn(
                    "w-8 h-8 border border-gray-300 rounded flex items-center justify-center",
                    selectedShape === 'circle' && "bg-blue-100 border-blue-500"
                  )}
                  onClick={() => handleShapeSelect('circle')}
                >
                  ○
                </button>
                <button
                  className={cn(
                    "w-8 h-8 border border-gray-300 rounded flex items-center justify-center",
                    selectedShape === 'triangle' && "bg-blue-100 border-blue-500"
                  )}
                  onClick={() => handleShapeSelect('triangle')}
                >
                  △
                </button>
                <button
                  className={cn(
                    "w-8 h-8 border border-gray-300 rounded flex items-center justify-center",
                    selectedShape === 'line' && "bg-blue-100 border-blue-500"
                  )}
                  onClick={() => handleShapeSelect('line')}
                >
                  ─
                </button>
              </div>

              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Fill Color</h4>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {['transparent', ...colors].map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full",
                      shapeFillColor === color && "ring-2 ring-blue-500",
                      color === 'transparent' && "bg-white"
                    )}
                    style={{
                      backgroundColor: color === 'transparent' ? 'transparent' : color,
                      backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 3px 3px',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: '#ccc'
                    }}
                    onClick={() => setShapeFillColor(color)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Eraser Tool Options */}
          {activeTool === 'eraser' && (
            <>
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Eraser Preview</h4>
              <div className="flex justify-center items-center mb-6 h-16 border border-gray-300 rounded bg-gray-50 dark:bg-gray-700">
                <div
                  className="rounded-full border border-gray-400"
                  style={{
                    width: `${getSizeValue(activeSize) * 2}px`,
                    height: `${getSizeValue(activeSize) * 2}px`
                  }}
                ></div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Use the eraser to remove parts of your drawing by clicking and dragging over the areas you want to erase.
              </p>
            </>
          )}

          {/* Text Tool Options */}
          {activeTool === 'text' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="mb-4"
                onClick={() => handleAddText()}
              >
                Add Text Box
              </Button>

              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Font Family</h4>
              <div className="mb-4">
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    applyTextFormatting('fontFamily', e.target.value);
                  }}
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>

              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Text Style</h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <Button
                  variant={isBold ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center font-bold"
                  onClick={() => {
                    const newValue = !isBold;
                    setIsBold(newValue);
                    applyTextFormatting('fontWeight', newValue ? 'bold' : 'normal');
                  }}
                >
                  B
                </Button>
                <Button
                  variant={isItalic ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center italic"
                  onClick={() => {
                    const newValue = !isItalic;
                    setIsItalic(newValue);
                    applyTextFormatting('fontStyle', newValue ? 'italic' : 'normal');
                  }}
                >
                  I
                </Button>
                <Button
                  variant={textAlign === 'left' ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={() => {
                    setTextAlign('left');
                    applyTextFormatting('textAlign', 'left');
                  }}
                >
                  ←
                </Button>
                <Button
                  variant={textAlign === 'center' ? "default" : "outline"}
                  size="sm"
                  className="flex items-center justify-center"
                  onClick={() => {
                    setTextAlign('center');
                    applyTextFormatting('textAlign', 'center');
                  }}
                >
                  ↔
                </Button>
              </div>

              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Text Size</h4>
              <div className="mb-4">
                <input
                  type="range"
                  min="10"
                  max="72"
                  className="w-full"
                  value={getSizeValue(activeSize) * 5}
                  onChange={(e) => {
                    // Adjust text size of selected object
                    const newSize = parseInt(e.target.value);
                    if (canvas) {
                      const activeObject = canvas.getActiveObject();
                      if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
                        activeObject.set({ fontSize: newSize });
                        canvas.renderAll();
                      }
                    }
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Click to add a text box.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Double-click existing text to edit it.
              </p>
            </>
          )}
        </div>
      )}

      {/* Bottom Toolbar */}
      {!isViewOnly && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 flex items-center space-x-1 z-50">
          {bottomTools.map((tool) => (
            <Button
              key={tool.name}
              variant="ghost"
              size="icon"
              onClick={() => {
                // Call handleToolClick for all tools
                handleToolClick(tool.name);
              }}
              className={cn(
                "w-10 h-10 rounded-full",
                // Highlight based on activeTool, but not for fullscreen as it's a toggle
                activeTool === tool.name && tool.name !== 'fullscreen' && "bg-blue-100 dark:bg-blue-900"
              )}
              aria-label={tool.name}
              title={tool.name.charAt(0).toUpperCase() + tool.name.slice(1)}
            >
              {/* Render the dynamic icon */}
              <tool.icon className="w-5 h-5" />
            </Button>
          ))}

          {/* Reset drawing canvas button */}
          <div className="h-8 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (canvas) {
                // Clear all drawn content while preserving nodes
                canvas.clear();
                canvas.backgroundColor = 'transparent';
                if (!canvas._isContextLost) {
                  canvas.renderAll();
                }
              }
            }}
            className="ml-1"
          >
            Clear Canvas
          </Button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="absolute inset-0 pt-12 pl-[200px]" style={{ right: showRightSidebar ? '200px' : '0' }}>
        {/* Stacked Canvas Container */}
        <div className="relative w-full h-full overflow-hidden">
          {/* Fabric.js canvas - Bottom layer */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: 10,
              pointerEvents: 'auto' // Always allow interaction with fabric canvas
            }}
          >
            <canvas
              id="fabric-canvas"
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'auto',
                touchAction: 'none'
              }}
            />
          </div>

          {/* ReactFlow - Top layer */}
          <div
            className="absolute inset-0"
            style={{
              zIndex: activeTool === 'select' ? 5 : 20, // Lower z-index when in select mode
              pointerEvents: activeTool === 'select' ? 'none' : activeTool === 'hand' ? 'auto' : 'none'
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className={cn(theme === 'dark' ? 'dark-theme' : '', 'react-flow-container')}
              defaultZoom={1}
              nodesDraggable={!['pencil', 'eraser', 'shape', 'text'].includes(activeTool)}
              nodesConnectable={!['pencil', 'eraser', 'shape', 'text'].includes(activeTool)}
              elementsSelectable={!['pencil', 'eraser', 'shape', 'text'].includes(activeTool)}
              onInit={onInit}
              panOnScroll={activeTool === 'hand'}
              zoomOnScroll={!['pencil', 'eraser', 'shape', 'text'].includes(activeTool)}
              deleteKeyCode={['Delete', 'Backspace']}
              onNodesDelete={(nodes) => {
                setNodes(nds => nds.filter(node => !nodes.some(n => n.id === node.id)));
              }}
              onEdgesDelete={(edges) => {
                setEdges(eds => eds.filter(edge => !edges.some(e => e.id === edge.id)));
              }}
            >
              <Background
                color={theme === 'dark' ? '#333' : '#aaa'}
                gap={16}
                size={1}
                variant={BackgroundVariant.Dots}
              />
              <Controls
                className="bottom-4 right-4"
                showInteractive={true}
              />
              <MiniMap
                nodeColor={theme === 'dark' ? '#222' : '#fff'}
                nodeBorderRadius={2}
              />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* CSS to make both canvases work together - SIMPLIFIED */}
      <style jsx global>{`
        /* Ensure ReactFlow background is transparent */
        .react-flow__renderer {
          background-color: transparent !important;
        }
        .react-flow__background {
           z-index: 0 !important; /* Ensure background is behind everything */
           opacity: 0.15 !important;
           pointer-events: none !important; /* Background shouldn't capture events */
         }

        /* Ensure controls are usable */
        .react-flow__controls {
          z-index: 40 !important; /* Keep controls on top */
          pointer-events: auto !important;
        }

        /* Let inline styles on the divs handle pointer events primarily */
        .canvas-container, .upper-canvas, .lower-canvas {
           /* Avoid global pointer-events override here */
           /* Position is handled by inline styles/Tailwind */
        }
      `}</style>
    </div>
  );
});

// Add display name for debugging
IntegratedCanvas.displayName = "IntegratedCanvas";

export default IntegratedCanvas;