import React, { useMemo } from 'react';

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

// RANK ORDER CONSTANTS
const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',];
const SUIT_ORDER = ['♠', '♥', '♣', '♦'];

export const SelectionGrid: React.FC<GridProps> = ({ deck, selectedIds, onToggle, onConfirm, onClose, currentSum, targetValue }) => {
  
  // SORTING LOGIC: Organize by Suit (Rows) and Rank (Cols)
  const sortedDeck = useMemo(() => {
    return [...deck].sort((a, b) => {
      const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
      if (suitDiff !== 0) return suitDiff;
      return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
    });
  }, [deck]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease-out',
      padding: 20 // Ensure edge spacing
    }}>
      
      {/* THE PANEL */}
      <div style={{
        position: 'relative',
        width: '95%', 
        maxWidth: '1400px',
        maxHeight: '95vh', // 🛑 HARD LIMIT: Never exceed 95% of screen height
        display: 'flex', flexDirection: 'column',
        background: 'rgba(12, 20, 28, 0.95)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: 12,
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden', // Contain the scrollbar inside
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        {/* --- HEADER --- */}
        <div style={{
          padding: '15px 25px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0,240,255,0.1), transparent)',
          flexShrink: 0 // Prevent header from shrinking
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#00f0ff', fontSize: '1.2rem', letterSpacing: 2 }}>
              HAND SELECTION
            </h2>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>ABORT</button>
        </div>

        {/* --- GRID CONTAINER (Scrollable) --- */}
        <div style={{
          flex: 1,
          overflowY: 'auto', // Enable scroll if vertical space is tight
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center' // Center the grid vertically if there's extra space
        }}>
          
          {/* THE GRID ITSELF */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(13, 1fr)', 
            gap: '8px',
            width: '100%',
            // 🛑 CARD HEIGHT FIX: 
            // This ensures cards scale down if the screen is short, 
            // preventing them from pushing the footer off-screen.
            maxWidth: '1200px' 
          }}>
            {sortedDeck.map(card => {
              const isSelected = selectedIds.includes(card.id);
              const isBurned = card.usedBy !== null;
              const isRed = ['♥', '♦'].includes(card.suit);

              return (
                <button
                  key={card.id}
                  disabled={isBurned}
                  onClick={() => onToggle(card.id)}
                  style={{
                    aspectRatio: '0.7', // Slightly squatter card ratio fits better (was 2/3 = 0.66)
                    background: isBurned ? '#111' : isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                    border: isSelected ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    color: isBurned ? '#444' : (isRed ? '#ff5555' : '#eee'),
                    opacity: isBurned ? 0.3 : 1,
                    cursor: isBurned ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.1s',
                    transform: isSelected ? 'scale(1.05)' : 'none',
                    boxShadow: isSelected ? '0 0 10px rgba(0,240,255,0.4)' : 'none'
                  }}
                >
                  <div style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)', fontWeight: 'bold' }}>{card.rank}</div>
                  <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>{card.suit}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- FOOTER (Always Visible) --- */}
        <div style={{
          padding: '15px 30px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0 // Prevent footer from being crushed
        }}>
           <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#888' }}>
              SUM: <span style={{ 
                 color: currentSum === targetValue ? '#00ff88' : currentSum > targetValue ? '#ff4444' : '#fff', 
                 fontWeight: 'bold', fontSize: '1.4rem' 
              }}>{currentSum}</span> 
              <span style={{ margin: '0 10px', color: '#444' }}>/</span> 
              TARGET: {targetValue}
           </div>

           <button 
             onClick={onConfirm}
             disabled={currentSum !== targetValue || selectedIds.length !== 5}
             style={{
               background: (currentSum === targetValue && selectedIds.length === 5) ? '#00f0ff' : '#222',
               color: (currentSum === targetValue && selectedIds.length === 5) ? '#000' : '#555',
               border: 'none', padding: '12px 30px', fontSize: '1rem', fontWeight: 'bold', borderRadius: 4,
               cursor: (currentSum === targetValue && selectedIds.length === 5) ? 'pointer' : 'not-allowed',
               boxShadow: (currentSum === targetValue && selectedIds.length === 5) ? '0 0 15px rgba(0,240,255,0.6)' : 'none'
             }}
           >
             CONFIRM
           </button>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #ff4444', color: '#ff4444',
  padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
};