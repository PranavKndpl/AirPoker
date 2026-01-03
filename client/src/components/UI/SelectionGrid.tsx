import React from 'react';

type PlayingCard = { id: string; suit: string; rank: string; value: number; usedBy: string | null };

interface GridProps {
  deck: PlayingCard[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  currentSum: number;
  targetValue: number;
}

export const SelectionGrid: React.FC<GridProps> = ({ deck, selectedIds, onToggle, onConfirm, onClose, currentSum, targetValue }) => {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      
      {/* THE PANEL CONTAINER */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(5, 5, 5, 0.96)', // Darker, cleaner background
        border: '1px solid #444',
        borderRadius: 16,
        boxShadow: '0 0 80px rgba(0,0,0,1)', // Massive shadow for depth
        width: '90%',
        maxWidth: '1200px',
        aspectRatio: '16/9', // Force a cinematic wide ratio
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        padding: 20
      }}>

        {/* --- CLOSE BUTTON (Fixed Z-Index) --- */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -15, right: -15, // Floating slightly outside/corner
            width: 40, height: 40,
            background: '#ff3333',
            color: 'white',
            border: '2px solid white',
            borderRadius: '50%',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 100, // Highest Priority
            boxShadow: '0 0 10px #ff0000',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Cancel Selection"
        >
          ✕
        </button>

        {/* --- THE 52 CARD GRID (Perfect Fit) --- */}
        <div style={{
          flex: 1,
          display: 'grid',
          // 13 Columns (Ranks), 4 Rows (Suits)
          gridTemplateColumns: 'repeat(13, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)', 
          gap: '0.5vw', // Responsive gap
          paddingBottom: 20
        }}>
          {deck.map(card => {
            const isSelected = selectedIds.includes(card.id);
            const isBurned = card.usedBy !== null;
            
            // Determine Color
            let textColor = '#000';
            if (isBurned) textColor = '#444';
            else if (['♥', '♦'].includes(card.suit) && !isSelected) textColor = '#d00';
            
            return (
              <button
                key={card.id}
                disabled={isBurned}
                onClick={() => onToggle(card.id)}
                style={{
                  width: '100%', 
                  height: '100%', // Fill the grid cell exactly
                  background: isBurned ? '#1a1a1a' : isSelected ? '#ffd700' : '#f0f0f0',
                  color: textColor,
                  border: isSelected ? '3px solid white' : 'none',
                  borderRadius: 4,
                  fontWeight: 'bold', 
                  fontSize: 'clamp(0.8rem, 1.5vw, 1.5rem)', // Responsive Text
                  opacity: isBurned ? 0.2 : 1,
                  cursor: isBurned ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isSelected ? '0 0 15px #ffd700' : 'none',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={e => !isBurned && (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={e => !isBurned && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Stack Rank and Suit vertically for better fit? Or side by side? Side by side is standard */}
                <span>{card.rank}</span>
                <span style={{fontSize: '0.8em', marginLeft: 2}}>{card.suit}</span>
              </button>
            );
          })}
        </div>

        {/* --- BOTTOM HUD --- */}
        <div style={{ 
          background: '#111', 
          borderRadius: 8,
          padding: '10px 20px', 
          border: '1px solid #333',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          height: 60, flexShrink: 0 
        }}>
          {/* MATH DISPLAY */}
          <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: '#888', display: 'flex', alignItems: 'center', gap: 20 }}>
             <div>TARGET: <span style={{ color: '#fff', fontSize: '1.5rem' }}>{targetValue}</span></div>
             <div style={{ width: 2, height: 20, background: '#444' }} />
             <div>SUM: <span style={{ color: currentSum === targetValue ? '#0f0' : '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{currentSum}</span></div>
          </div>

          {/* CONFIRM BUTTON */}
          <button 
            onClick={onConfirm}
            disabled={currentSum !== targetValue || selectedIds.length !== 5}
            style={{
              height: '100%',
              padding: '0 40px',
              backgroundColor: (currentSum === targetValue && selectedIds.length === 5) ? '#ffd700' : '#222',
              color: (currentSum === targetValue && selectedIds.length === 5) ? 'black' : '#555',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              borderRadius: 4,
              cursor: (currentSum === targetValue && selectedIds.length === 5) ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Confirm Hand
          </button>
        </div>

      </div>
    </div>
  );
};