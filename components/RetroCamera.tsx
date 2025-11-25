import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Polaroid } from './Polaroid';
import { Photo } from '../types';
import { generateCaption } from '../services/geminiService';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// Shutter sound URL (standard mechanical shutter)
const SHUTTER_SOUND = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3";

interface RetroCameraProps {
  onPhotoEjected: (photo: Photo) => void;
  onCaptionReceived?: (id: string, caption: string) => void;
  isCameraOn: boolean;
}

export const RetroCamera: React.FC<RetroCameraProps> = ({ onPhotoEjected, onCaptionReceived, isCameraOn }) => {
  const webcamRef = useRef<Webcam>(null);
  const [ejectingPhoto, setEjectingPhoto] = useState<Photo | null>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio(SHUTTER_SOUND));
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    audioRef.current.load();
  }, []);

  const capture = async () => {
    if (!isCameraOn) return;
    
    if (webcamRef.current && !ejectingPhoto) {
      // Play sound
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio play blocked", e));

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');

      const newId = crypto.randomUUID();

      // Create temporary object for ejection animation
      const newPhoto: Photo = {
        id: newId,
        imageData: imageSrc,
        caption: "显影中...",
        date: formattedDate,
        x: 0,
        y: 0,
        rotation: 0,
        isDeveloping: true,
        zIndex: 10 // Starts behind camera body
      };

      setEjectingPhoto(newPhoto);

      // Trigger AI Generation in background
      generateCaption(imageSrc, 'zh-CN').then(caption => {
        if (onCaptionReceived) {
            onCaptionReceived(newId, caption);
        }
        setEjectingPhoto(prev => {
            if (prev && prev.id === newId) {
                return { ...prev, caption };
            }
            return prev;
        });
      });
    }
  };

  const handleDragEnd = (_: string, point: { x: number, y: number }) => {
    if (ejectingPhoto) {
       // point is now the exact top-left coordinate of the photo on screen
       const finalizedPhoto: Photo = {
          ...ejectingPhoto,
          x: point.x,
          y: point.y,
          zIndex: 50, 
          rotation: Math.random() * 10 - 5,
          secretMessage: "" 
        };

        onPhotoEjected(finalizedPhoto);
        setEjectingPhoto(null);
    }
  };

  const toggleFacingMode = () => {
    setIsFlipping(true);
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setTimeout(() => setIsFlipping(false), 500);
  };

  return (
    // Main Camera Container
    <div 
      id="camera-container"
      className="fixed select-none z-20 transition-all duration-300
                 bottom-4 left-1/2 -translate-x-1/2 w-[280px] h-[280px]
                 md:left-16 md:bottom-16 md:translate-x-0 md:w-[450px] md:h-[450px]"
    >
      {/* 4. Ejecting Photo Slot (Behind Camera) */}
      <div 
        className="absolute"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '35%', 
          height: '100%',
          zIndex: 10, // Behind camera body
          pointerEvents: ejectingPhoto ? 'auto' : 'none'
        }}
      >
        {ejectingPhoto && (
          <Polaroid 
            photo={ejectingPhoto} 
            isEjecting={true}
            onDragEnd={(id, point) => handleDragEnd(id, point)}
            className="origin-bottom"
            style={{ width: '100%' }}
          />
        )}
      </div>

      {/* 2. Camera Body Image */}
      <img 
        src="https://s.baoyu.io/images/retro-camera.webp" 
        alt="复古相机"
        className="absolute bottom-0 left-0 w-full h-full object-contain drop-shadow-2xl"
        style={{ zIndex: 20 }}
        draggable={false}
      />

      {/* Flip Camera Button - Improved Mechanical Dial Style (Resized and Repositioned) */}
      <div 
        className="absolute z-30 group" 
        style={{ top: '32%', left: '24%' }}
      >
        <div 
            onClick={toggleFacingMode}
            className="relative w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer shadow-xl transition-transform active:scale-95"
            title="翻转镜头"
        >
            {/* Metallic Dial Base */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 border-[2px] border-gray-500"></div>
            {/* Inner Ring */}
            <div className="absolute inset-[3px] rounded-full bg-[#2a2a2a] border border-gray-600 shadow-inner flex items-center justify-center">
                <motion.div
                    animate={{ rotate: isFlipping ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <RefreshCw className="text-gray-300 w-4 h-4 md:w-5 md:h-5" />
                </motion.div>
            </div>
            {/* Shine Reflection */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* 3. Viewfinder (Webcam) */}
      <div 
        className="absolute overflow-hidden bg-black"
        style={{
          bottom: '32%',
          left: '62%',
          width: '27%',
          height: '27%',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          zIndex: 30,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' // Inner shadow for depth
        }}
      >
        {isCameraOn ? (
          <Webcam
            // Key is critical! Changing it forces React to destroy and recreate the component.
            // This fixes black screens when switching cameras.
            key={facingMode} 
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1} // Request max quality
            minScreenshotWidth={1024} // Ensure decent resolution
            videoConstraints={{
              facingMode: facingMode,
              aspectRatio: 1,
              width: { ideal: 1920 }, // Request higher resolution stream
              height: { ideal: 1920 }
            }}
            // Use standard library mirroring prop for preview
            mirrored={facingMode === 'user'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 text-xs">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-800 rounded-full mx-auto mb-1 border border-gray-700"></div>
              <span>OFF</span>
            </div>
          </div>
        )}
        {/* Lens Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none rounded-full" />
      </div>

      {/* 5. Shutter Button (Click Area with Pink Hint) */}
      <div 
        onClick={capture}
        className={`absolute rounded-full transition-all duration-200 ${isCameraOn ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'}`}
        style={{
          bottom: '40%',
          left: '18%',
          width: '11%',
          height: '11%',
          zIndex: 30,
          backgroundColor: isCameraOn ? 'rgba(236, 72, 153, 0.15)' : 'transparent', // Subtle pink tint
          boxShadow: isCameraOn ? '0 0 10px rgba(236, 72, 153, 0.3)' : 'none'
        }}
        title={isCameraOn ? "拍照 (点击粉色按钮)" : "相机已关闭"}
      />
    </div>
  );
};