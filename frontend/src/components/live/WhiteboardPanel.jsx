import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Trash2, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { uploadSessionMaterial } from '../../services/api';
import toast from 'react-hot-toast';

export default function WhiteboardPanel({ socket, roomId, sessionId, isHost, readOnly = false }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [color] = useState('rgba(212, 175, 55, 0.85)');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      // Transparent background so we can see the PDF underneath
      ctx.clearRect(0, 0, rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [pdfUrl]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const applyStroke = (stroke) => {
      const canvas = canvasRef.current;
      if (!canvas || !stroke?.points?.length) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      ctx.strokeStyle = stroke.color || color;
      ctx.lineWidth = stroke.lineWidth || 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      stroke.points.forEach((pt, i) => {
        const x = pt.x * rect.width;
        const y = pt.y * rect.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    const onStroke = ({ stroke }) => applyStroke(stroke);
    const onClear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onMaterial = ({ url }) => setPdfUrl(url);

    socket.on('whiteboard:stroke', onStroke);
    socket.on('whiteboard:clear', onClear);
    socket.on('session:material', onMaterial);
    
    return () => {
      socket.off('whiteboard:stroke', onStroke);
      socket.off('whiteboard:clear', onClear);
      socket.off('session:material', onMaterial);
    };
  }, [socket, roomId, color]);

  const emitStroke = (points) => {
    if (!socket || readOnly) return;
    socket.emit('whiteboard:stroke', {
      roomId,
      stroke: { points, color, lineWidth: 2 },
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF files are supported');
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('material', file);
      const res = await uploadSessionMaterial(sessionId, formData);
      setPdfUrl(res.url);
      toast.success('Material uploaded successfully');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onPointerDown = (e) => {
    if (!isHost) return;
    drawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    last.current = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const onPointerMove = (e) => {
    if (!drawing.current || !isHost) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const from = last.current;
    last.current = { x, y };
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x * rect.width, from.y * rect.height);
    ctx.lineTo(x * rect.width, y * rect.height);
    ctx.stroke();
    emitStroke([
      { x: from.x, y: from.y },
      { x, y },
    ]);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  return (
    <div className="flex flex-col h-full min-h-0 glass border-rv-border overflow-hidden shadow-2xl relative transition-colors duration-300">
      <div className="px-5 py-4 border-b border-rv-border flex justify-between items-center bg-rv-bg-elevated/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="label-caps-accent">Teaching Mode</span>
          {pdfUrl && (
            <div className="flex items-center gap-1.5 bg-gold/[0.08] border border-gold/20 rounded-lg px-2.5 py-1 ml-4 transition-all">
               <span className="text-[11px] font-medium text-rv-text-muted truncate max-w-[120px]">Document Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isHost && (
            <>
              <label className="cursor-pointer text-xs font-bold text-gold/80 hover:text-gold transition-all duration-200 flex items-center gap-2 border border-gold/25 rounded-xl px-3.5 py-1.5 bg-gold/[0.05] hover:bg-gold/[0.08]">
                <FileUp className="w-4 h-4" />
                {uploading ? '...' : 'Upload PDF'}
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
              </label>
              <button
                type="button"
                className="text-xs font-bold text-red-500/80 hover:text-red-500 flex items-center gap-2 px-3 py-1.5 transition-colors"
                onClick={() => socket?.emit('whiteboard:clear', { roomId })}
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 relative bg-rv-bg-page overflow-hidden transition-colors">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            className="w-full h-full border-none"
            title="teaching-material"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-rv-text-faint gap-4 animate-pulse-slow">
             <div className="w-20 h-20 rounded-full border-2 border-dashed border-rv-border flex items-center justify-center bg-rv-bg-card/30">
                <FileUp className="w-8 h-8 opacity-40" />
             </div>
             <p className="text-sm font-medium tracking-wide">Ready for lesson materials</p>
          </div>
        )}
        
        {/* Transparent Canvas Overlay for Annotations */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-10"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>

      {!isHost && (
        <div className="px-5 py-2.5 bg-rv-bg-elevated/90 backdrop-blur-md border-t border-rv-border flex items-center justify-between shadow-inner">
          <p className="label-caps opacity-80">Live Annotations Enabled</p>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-glow-sm" />
             <span className="label-caps-accent tracking-tighter opacity-70">Synced</span>
          </div>
        </div>
      )}
    </div>
  );
}
