import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Pencil, RefreshCw, RotateCw, Pin as PinIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Photo } from '../types';
import { generateCaption } from '../services/geminiService';

interface PolaroidProps {
  photo: Photo;
  isEjecting?: boolean;
  onDragEnd?: (id: string, point: { x: number, y: number }) => void;
  onDelete?: (id: string) => void;
  onUpdateCaption?: (id: string, newCaption: string) => void;
  onUpdateSecret?: (id: string, secret: string) => void;
  onAddToGallery?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isPinned?: boolean; // For gallery view
}

export const Polaroid: React.FC<PolaroidProps> = ({
  photo,
  isEjecting = false,
  onDragEnd,
  onDelete,
  onUpdateCaption,
  onUpdateSecret,
  onAddToGallery,
  className = '',
  style = {},
  isPinned = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempCaption, setTempCaption] = useState(photo.caption);
  const [isHovering, setIsHovering] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [tempSecret, setTempSecret] = useState(photo.secretMessage || "");
  
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  // Developing effect
  const [developState, setDevelopState] = useState(photo.isDeveloping ? 0 : 100);

  useEffect(() => {
    if (photo.isDeveloping && developState < 100) {
      const interval = setInterval(() => {
        setDevelopState(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2; 
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [photo.isDeveloping, developState]);

  // Scratch-off Logic for Gallery View
  useEffect(() => {
    if (isPinned && isFlipped && canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Ensure canvas buffer resolution matches its display size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Initialize canvas with silver coating
        ctx.fillStyle = '#C0C0C0'; // Silver/Grey
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add "Scratch Me" text texture
        ctx.font = '20px "Patrick Hand"';
        ctx.fillStyle = '#A0A0A0';
        ctx.textAlign = 'center';
        ctx.fillText("刮开查看密语", canvas.width / 2, canvas.height / 2);
        
        // Add noise/texture
        for (let i = 0; i < 500; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }
      }
    }
  }, [isPinned, isFlipped]);

  const handleScratchMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Check if primary button is pressed for mouse events
      if ((e as React.MouseEvent).buttons !== 1) return;
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 50; // Increased brush size
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPos.current) {
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else {
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    lastPos.current = { x, y };
  };

  const handleScratchEnd = () => {
    lastPos.current = null;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    
    // Temporarily flip back to front for screenshot if needed, or handle current face
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `bao-polaroid-${photo.date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRegenerating || !onUpdateCaption) return;
    
    setIsRegenerating(true);
    const newCaption = await generateCaption(photo.imageData, 'zh-CN');
    onUpdateCaption(photo.id, newCaption);
    setTempCaption(newCaption);
    setIsRegenerating(false);
  };

  const handleSaveEdit = () => {
    if (onUpdateCaption) onUpdateCaption(photo.id, tempCaption);
    setIsEditing(false);
  };

  const handleSaveSecret = () => {
    if (onUpdateSecret) onUpdateSecret(photo.id, tempSecret);
  };

  const handleDragEndInternal = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
      if (onDragEnd && !isPinned && cardRef.current) {
          // Calculate the EXACT top-left coordinates relative to the viewport/page
          // This prevents the "jumping" issue where it snaps to the cursor
          const rect = cardRef.current.getBoundingClientRect();
          onDragEnd(photo.id, { x: rect.left, y: rect.top });
      }
  };

  // Styles for developing effect
  const filterStyle = {
    filter: `grayscale(${100 - developState}%) blur(${(100 - developState) / 10}px) brightness(${0.5 + (developState / 200)}) contrast(${0.8 + (developState / 500)})`,
    opacity: 0.2 + (developState / 100) * 0.8
  };

  // Pin for gallery view
  const Pin = () => (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-50 filter drop-shadow-md pointer-events-none">
       <div className="w-4 h-4 rounded-full bg-red-500 border border-red-700 relative">
          <div className="absolute top-1 left-1 w-1 h-1 bg-white/50 rounded-full"></div>
       </div>
       <div className="w-0.5 h-3 bg-gray-400 mx-auto -mt-1"></div>
    </div>
  );

  return (
    <div
      className={`${className} ${isPinned ? '' : 'absolute'}`}
      style={{
        zIndex: photo.zIndex,
        perspective: '1000px', // Enable 3D perspective
        ...style
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div
        ref={cardRef}
        drag={!isEditing && !isPinned && !isFlipped}
        dragMomentum={false}
        onDragEnd={handleDragEndInternal}
        initial={isEjecting ? { y: 0 } : false}
        animate={{ 
          y: isEjecting ? "-40%" : 0,
          x: 0, // IMPORTANT: Reset x to 0 so Framer Motion doesn't keep the drag transform, allowing 'left' style to position it
          rotateY: isFlipped ? 180 : 0, // FLIP ANIMATION
        }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative w-36 md:w-64 aspect-[3/4.2] ${!isPinned ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      >
        {isPinned && <Pin />}

        {/* --- FRONT SIDE --- */}
        <div className="absolute inset-0 bg-white shadow-xl p-2 md:p-4 md:pb-8 flex flex-col items-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
            
            {/* Actions Toolbar (Only visible on wall) */}
            {!isEjecting && isHovering && !isEditing && !isPinned && !isFlipped && (
              <div className="absolute -top-12 left-0 w-full flex justify-center gap-2 z-50 pt-2 pb-5 cursor-default group-hover:block">
                <button 
                  onClick={handleDownload}
                  className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-600 transition-colors shadow-md pointer-events-auto"
                  title="下载照片"
                >
                  <Download size={16} />
                </button>
                {onDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-500 transition-colors shadow-md pointer-events-auto"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Photo Area */}
            <div className="w-full aspect-[3/4] bg-black overflow-hidden mb-2 md:mb-4 relative border border-gray-200">
              <img 
                src={photo.imageData} 
                alt="Memory" 
                className="w-full h-full object-cover"
                style={photo.isDeveloping && developState < 100 ? filterStyle : {}}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            </div>

            {/* Text Area */}
            <div className="w-full px-1 md:px-2 text-center relative group flex-grow flex flex-col justify-end">
              <div className="text-gray-400 text-[10px] md:text-xs font-sans mb-1 tracking-widest opacity-70">
                {photo.date}
              </div>

              {isEditing ? (
                <textarea
                  autoFocus
                  value={tempCaption}
                  onChange={(e) => setTempCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') { setTempCaption(photo.caption); setIsEditing(false); }
                  }}
                  onBlur={handleSaveEdit}
                  className="w-full handwritten text-sm md:text-xl text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none text-center resize-none overflow-hidden"
                  rows={2}
                />
              ) : (
                <div className="relative">
                  <p 
                    className="handwritten text-sm md:text-xl text-gray-800 leading-5 md:leading-6 min-h-[1rem] md:min-h-[1.5rem]"
                    onDoubleClick={() => !isEjecting && !isPinned && setIsEditing(true)}
                  >
                    {photo.caption || "..."}
                  </p>
                  
                  {!isEjecting && !isPinned && (
                    <div className="hidden md:flex absolute -right-4 top-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="text-gray-400 hover:text-gray-600"
                        title="编辑"
                      >
                        <Pencil size={12} />
                      </button>
                      <button 
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className={`text-gray-400 hover:text-gray-600 ${isRegenerating ? 'animate-spin' : ''}`}
                        title="重新生成"
                      >
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add to Gallery Button (Top Right - Obvious Button) */}
            {!isEjecting && !isPinned && !photo.isPublic && onAddToGallery && (
                <button
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onAddToGallery(photo.id); 
                }}
                className="absolute top-2 right-2 bg-[#ef4444] text-white text-[10px] md:text-xs px-2 py-1 rounded-md shadow-md hover:bg-red-600 z-20 font-bold cute-chinese border border-red-700 transform hover:scale-105 transition-transform"
                title="添加到公共画廊"
                >
                展示给大家
                </button>
            )}

            {/* Controls Row (Flip) */}
            {!isEjecting && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                    {/* Flip Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
                    >
                        <RotateCw size={14} />
                    </button>
                </div>
            )}
        </div>

        {/* --- BACK SIDE (Secret Message) --- */}
        <div 
          className="absolute inset-0 bg-[#f8f5e6] shadow-xl p-4 flex flex-col items-center justify-center backface-hidden" 
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
            backgroundSize: '10px 10px'
          }}
        >
             <h3 className="cute-chinese text-gray-500 mb-2 text-lg">
                {isPinned ? "刮开查看密语" : "写一句话吧~"}
             </h3>
             
             <div className="relative w-full h-32 bg-white border-2 border-dashed border-gray-300 rounded p-2">
                {isPinned ? (
                    // Gallery View: Text covered by Canvas
                    <>
                        <div className="w-full h-full flex items-center justify-center text-center p-1 overflow-hidden select-none">
                            <p className="handwritten text-lg text-gray-700">{photo.secretMessage || "（没有留下密语）"}</p>
                        </div>
                        <canvas 
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                            // Width/Height now set dynamically in useEffect to match offsetWidth/Height
                            onMouseMove={handleScratchMove}
                            onTouchMove={handleScratchMove}
                            onMouseUp={handleScratchEnd}
                            onMouseLeave={handleScratchEnd}
                            onTouchEnd={handleScratchEnd}
                        />
                    </>
                ) : (
                    // Local View: Editable Textarea
                    <textarea 
                        className="w-full h-full bg-transparent resize-none outline-none handwritten text-lg text-gray-700"
                        placeholder="在这里写下你的秘密..."
                        value={tempSecret}
                        onChange={(e) => setTempSecret(e.target.value)}
                        onBlur={handleSaveSecret}
                    />
                )}
             </div>

             <div className="mt-4 text-gray-400 text-xs font-sans">
                 {photo.date}
             </div>

             <button
                onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
            >
                <RotateCw size={14} />
            </button>
        </div>

      </motion.div>
    </div>
  );
};