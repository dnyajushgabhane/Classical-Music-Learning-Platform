import React, { useEffect, useRef, useState } from 'react';

export default function WhiteboardPanel({ socket, roomId, isHost, readOnly = false }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [color] = useState('rgba(212, 175, 55, 0.85)');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.fillStyle = 'rgba(15, 12, 10, 0.65)';
      ctx.fillRect(0, 0, rect.width, rect.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

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
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.fillStyle = 'rgba(15, 12, 10, 0.65)';
      ctx.fillRect(0, 0, rect.width, rect.height);
    };

    socket.on('whiteboard:stroke', onStroke);
    socket.on('whiteboard:clear', onClear);
    return () => {
      socket.off('whiteboard:stroke', onStroke);
      socket.off('whiteboard:clear', onClear);
    };
  }, [socket, roomId, color]);

  const emitStroke = (points) => {
    if (!socket || readOnly) return;
    socket.emit('whiteboard:stroke', {
      roomId,
      stroke: { points, color, lineWidth: 2 },
    });
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
    <div className="flex flex-col h-full min-h-0 glass-panel rounded-2xl border-gold/20 overflow-hidden">
      <div className="px-4 py-2 border-b border-gold/15 flex justify-between items-center">
        <span className="text-sm font-display font-semibold text-ivory">Whiteboard</span>
        {isHost && (
          <button
            type="button"
            className="text-xs text-gold border border-gold/25 rounded-lg px-2 py-1"
            onClick={() => socket?.emit('whiteboard:clear', { roomId })}
          >
            Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="flex-1 w-full touch-none cursor-crosshair min-h-[200px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      {!isHost && (
        <p className="text-[10px] text-ivory/45 px-3 py-2 border-t border-gold/10">View-only</p>
      )}
    </div>
  );
}
