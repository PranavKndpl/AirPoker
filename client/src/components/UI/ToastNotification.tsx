import { useState, useEffect } from 'react';
import { socket } from '../../network/socketBridge';

interface Toast {
  id: number;
  message: string;
  type: 'ANTE' | 'DECAY';
}

export const ToastNotification = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleNotification = (data: { message: string, type: string }) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: data.message, type: data.type as any }]);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    socket.on("notification", handleNotification);
    return () => { socket.off("notification", handleNotification); };
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 100, right: 20, 
      zIndex: 20000, 
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none' 
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'ANTE' ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 68, 68, 0.9)',
          color: '#000', padding: '15px 25px', borderRadius: 8,
          fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {t.type === 'ANTE' ? '💰 ' : '⚠️ '}
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};