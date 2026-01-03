import React from 'react';

// Reusing your types
type PlayingCard = { id: string; suit: string; rank: string; value: number; usedBy: string | null };

interface GridProps {
  deck: PlayingCard[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
  currentSum: number;
  targetValue: number;
}

export const SelectionGrid: React.FC<GridProps> = ({ deck, selectedIds, onToggle, onConfirm, currentSum, targetValue }) => {
  return (
    <div style={{
      position: 'absolute', inset: '5%', zIndex: 50,
      display: 'flex', flexDirection: 'column',
      pointerEvents: 'none' // Click-through wrapper
    }}>
      {/* The Card Grid */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(10,10,10,0.95)',
        border: '1px solid #ffd700',
        borderRadius: 12,
        padding: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(13, 1fr)',
        gap: 8,
        boxShadow: '0 0 50px rgba(0,0,0,0.8)'
      }}>
        {deck.map(card => {
          const isSelected = selectedIds.includes(card.id);
          const isBurned = card.usedBy !== null;
          return (
            <button
              key={card.id}
              disabled={isBurned}
              onClick={() => onToggle(card.id)}
              style={{
                aspectRatio: '2/3',
                background: isBurned ? '#1a1a1a' : isSelected ? '#ffd700' : '#eee',
                color: isBurned ? '#444' : isSelected ? '#000' : (['♥', '♦'].includes(card.suit) ? '#d00' : '#000'),
                border: 'none', borderRadius: 4,
                fontWeight: 'bold', fontSize: '0.9rem',
                opacity: isBurned ? 0.3 : 1,
                cursor: isBurned ? 'not-allowed' : 'pointer',
                transition: 'all 0.1s'
              }}
            >
              {card.rank}{card.suit}
            </button>
          );
        })}
      </div>

      {/* Control Panel */}
      <div style={{ 
        marginTop: 20, 
        background: '#000', 
        padding: 20, 
        border: '1px solid #333',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'auto'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem', fontFamily: 'monospace' }}>
          TARGET: <span style={{ color: '#ff3333' }}>{targetValue}</span>
          <span style={{ margin: '0 20px', color: '#555' }}>|</span>
          SUM: <span style={{ color: currentSum === targetValue ? '#0f0' : '#fff' }}>{currentSum}</span>
        </div>

        <button 
          onClick={onConfirm}
          disabled={currentSum !== targetValue || selectedIds.length !== 5}
          style={{
            padding: '15px 40px',
            backgroundColor: (currentSum === targetValue && selectedIds.length === 5) ? '#ffd700' : '#333',
            color: 'black',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          CONFIRM HAND
        </button>
      </div>
    </div>
  );
};