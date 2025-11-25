import React, { useState, useRef, useEffect } from 'react';
import { RetroCamera } from './components/RetroCamera';
import { Polaroid } from './components/Polaroid';
import { Photo } from './types';
import { Power, Images, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'bao-retro-photos';

// Mock data for public gallery
const MOCK_PUBLIC_PHOTOS: Photo[] = [
  { id: 'p1', imageData: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&auto=format&fit=crop&q=60', caption: '(｡♥‿♥｡)', date: '2025.11.23', x: 0, y: 0, rotation: -3, isDeveloping: false, zIndex: 1, secretMessage: "它真的很爱睡觉...", isPublic: true },
  { id: 'p2', imageData: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=500&auto=format&fit=crop&q=60', caption: '(≧◡≦)', date: '2025.11.22', x: 0, y: 0, rotation: 2, isDeveloping: false, zIndex: 1, secretMessage: "偷吃了一口鱼干", isPublic: true },
  { id: 'p3', imageData: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60', caption: '(⊙_⊙)', date: '2025.11.21', x: 0, y: 0, rotation: -5, isDeveloping: false, zIndex: 1, secretMessage: "别惹我！", isPublic: true },
  { id: 'p4', imageData: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&auto=format&fit=crop&q=60', caption: '(*^▽^*)', date: '2025.11.20', x: 0, y: 0, rotation: 4, isDeveloping: false, zIndex: 1, secretMessage: "新玩具get", isPublic: true },
];

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const wallRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [view, setView] = useState<'camera' | 'gallery'>('camera');

  // Load photos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedPhotos = JSON.parse(saved);
        setPhotos(parsedPhotos);
      } catch (e) {
        console.error("Failed to load photos", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save photos to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    }
  }, [photos, isLoaded]);

  const handlePhotoEjected = (newPhoto: Photo) => {
    setPhotos(prev => [...prev, newPhoto]);
  };

  const handlePhotoDragEnd = (id: string, point: { x: number, y: number }) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === id) {
        const maxZ = Math.max(...prev.map(photo => photo.zIndex), 50);
        return { ...p, x: point.x, y: point.y, zIndex: maxZ + 1 };
      }
      return p;
    }));
  };

  const handleDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateCaption = (id: string, newCaption: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption: newCaption } : p));
  };

  const handleUpdateSecret = (id: string, secret: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, secretMessage: secret } : p));
  };

  const handleCaptionReceived = (id: string, caption: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption } : p));
  };

  const handleAddToGallery = (id: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, isPublic: true } : p));
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${view === 'gallery' ? 'corkboard-bg' : 'bg-[#f2f2f2]'}`}>
      
      {/* HEADER BAR */}
      <div className="absolute top-0 left-0 w-full p-4 flex flex-col md:flex-row items-center justify-between z-50 pointer-events-none">
        
        {/* Left: Title and Power Button */}
        <div className="flex items-center gap-4 pointer-events-auto mb-2 md:mb-0">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-700 cute-chinese drop-shadow-md">
            咔擦一下
          </h1>
          {/* Power Button */}
          {view === 'camera' && (
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className="p-2 md:p-3 rounded-full shadow-md transition-colors bg-[#F3E6D2] hover:bg-[#e6d9c5] text-gray-800"
              title={isCameraOn ? "关闭相机" : "打开相机"}
            >
              <Power size={20} className={isCameraOn ? "text-green-600" : "text-red-500"} />
            </button>
          )}
        </div>

        {/* Right: Gallery Switcher */}
        <button
          onClick={() => setView(view === 'camera' ? 'gallery' : 'camera')}
          className="pointer-events-auto flex items-center gap-2 bg-[#DDBDAD] hover:bg-[#cbb0a0] text-gray-800 px-6 py-2 rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          {view === 'camera' ? <Images size={20} /> : <RotateCcw size={20} />}
          <span className="cute-chinese text-xl">{view === 'camera' ? '一起咔擦' : '返回相机'}</span>
        </button>
      </div>

      {/* --- CAMERA VIEW --- */}
      {view === 'camera' && (
        <>
          {/* Instructions - Updated */}
          <div className="absolute top-24 md:top-auto md:bottom-8 md:right-8 max-w-[200px] md:max-w-xs text-right z-10 opacity-70 hover:opacity-100 transition-opacity pointer-events-none select-none right-4">
            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 cute-chinese">使用说明：</h3>
            <p className="text-xs md:text-sm font-sans mb-1">1. 点击粉色按钮拍照。</p>
            <p className="text-xs md:text-sm font-sans mb-1">2. 将照片从相机拖到墙上。</p>
            <p className="text-xs md:text-sm font-sans mb-1">3. 等待照片显影！</p>
          </div>

          {/* Photo Wall (Drop Area) */}
          <div ref={wallRef} className="w-full h-full absolute inset-0 overflow-hidden">
            {photos.map((photo) => (
              <Polaroid
                key={photo.id}
                photo={photo}
                onDragEnd={handlePhotoDragEnd}
                onDelete={handleDelete}
                onUpdateCaption={handleUpdateCaption}
                onUpdateSecret={handleUpdateSecret}
                onAddToGallery={handleAddToGallery}
                className="absolute"
                // Fix: Pass left/top coordinates to ensure it renders where dropped
                style={{ left: photo.x, top: photo.y, zIndex: photo.zIndex }} 
              />
            ))}
          </div>

          {/* Camera Rig */}
          <RetroCamera 
            onPhotoEjected={handlePhotoEjected} 
            onCaptionReceived={handleCaptionReceived}
            isCameraOn={isCameraOn}
          />
        </>
      )}

      {/* --- GALLERY VIEW --- */}
      {view === 'gallery' && (
        <div className="w-full h-full overflow-y-auto pt-32 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
               <p className="text-white/80 cute-chinese text-2xl drop-shadow-md">大家的精彩瞬间</p>
            </div>
            
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 place-items-center">
               
               {/* Display User's PUBLIC Photos */}
               {photos.filter(p => p.isPublic).map(photo => (
                 <div key={photo.id} className="relative w-36 md:w-64 aspect-[3/4.2]">
                    {/* Note: We do NOT pass className="absolute" here. We want relative positioning in grid. */}
                    <Polaroid 
                      photo={{...photo, isDeveloping: false}} 
                      isPinned={true}
                      style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}
                    />
                 </div>
               ))}
               
               {/* Mock Public Photos */}
               {MOCK_PUBLIC_PHOTOS.map(photo => (
                 <div key={photo.id} className="relative w-36 md:w-64 aspect-[3/4.2]">
                    <Polaroid 
                      photo={photo} 
                      isPinned={true}
                      style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}
                    />
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}