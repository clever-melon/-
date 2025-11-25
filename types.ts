export interface Photo {
  id: string;
  imageData: string; // Base64
  caption: string;
  date: string;
  x: number;
  y: number;
  rotation: number;
  isDeveloping: boolean;
  zIndex: number;
  secretMessage?: string;
  isPublic?: boolean;
}

export interface DragPosition {
  x: number;
  y: number;
}