
import React, { useRef, useEffect } from 'react';
import { MemeState } from '../types';

interface MemeCanvasProps {
  state: MemeState;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const MemeCanvas: React.FC<MemeCanvasProps> = ({ state, onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = state.imageUrl;
    img.onload = () => {
      // Set canvas size based on image but responsive-ish
      const maxWidth = 800;
      const ratio = img.height / img.width;
      canvas.width = Math.min(img.width, maxWidth);
      canvas.height = canvas.width * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Text Settings
      ctx.fillStyle = state.textColor;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = canvas.width * 0.005;
      ctx.textAlign = 'center';
      const fontSize = (state.fontSize / 100) * canvas.width;
      ctx.font = `bold ${fontSize}px Impact, sans-serif`;
      ctx.textBaseline = 'top';

      // Top Text
      const topWords = state.topText.toUpperCase().split('\n');
      topWords.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 20 + i * fontSize);
        ctx.strokeText(line, canvas.width / 2, 20 + i * fontSize);
      });

      // Bottom Text
      ctx.textBaseline = 'bottom';
      const bottomWords = state.bottomText.toUpperCase().split('\n');
      bottomWords.reverse().forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, canvas.height - 20 - i * fontSize);
        ctx.strokeText(line, canvas.width / 2, canvas.height - 20 - i * fontSize);
      });

      onCanvasReady(canvas);
    };
  }, [state, onCanvasReady]);

  return (
    <div className="relative w-full flex justify-center bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      {state.imageUrl ? (
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto object-contain"
        />
      ) : (
        <div className="aspect-video w-full flex flex-col items-center justify-center text-slate-500 space-y-4">
          <i className="fa-solid fa-image text-6xl"></i>
          <p className="text-xl font-medium">Select a template or upload an image</p>
        </div>
      )}
    </div>
  );
};

export default MemeCanvas;
