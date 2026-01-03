import React, { useState } from 'react';

interface Props {
  currentBios: number;
  onPlaceBet: (amount: number) => void;
}

export const BettingPanel: React.FC<Props> = ({ currentBios, onPlaceBet }) => {
  const [bet, setBet] = useState(0);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'auto',
      background: 'rgba(0,0,0,0.6)'
    }}>
      <div style={{
        background: '#111', border: '1px solid #ffd700', borderRadius: 12,
        padding: 40, width: 400, textAlign: 'center',
        boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)'
      }}>
        <h2 style={{ color: '#ffd700', fontSize: '2rem', marginBottom: 30, textTransform: 'uppercase' }}>
          Wager Air
        </h2>

        <div style={{ fontSize: '4rem', color: 'white', fontWeight: 'bold', fontFamily: 'monospace' }}>
          {bet}
        </div>
        <div style={{ color: '#666', marginBottom: 30 }}>BIOS</div>

        {/* Range Slider */}
        <input 
          type="range" 
          min="0" 
          max={currentBios} 
          value={bet} 
          onChange={(e) => setBet(parseInt(e.target.value))}
          style={{ width: '100%', marginBottom: 30, accentColor: '#ffd700' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
           <button onClick={() => setBet(0)} style={{ background: '#333', border: 'none', color: '#888', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>Check (0)</button>
           <button onClick={() => setBet(Math.floor(currentBios/2))} style={{ background: '#333', border: 'none', color: '#888', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>Half</button>
           <button onClick={() => setBet(currentBios)} style={{ background: '#500', border: 'none', color: '#faa', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>ALL IN</button>
        </div>

        <button 
          onClick={() => onPlaceBet(bet)}
          style={{
            width: '100%', padding: 15,
            background: '#ffd700', border: 'none', borderRadius: 6,
            fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          CONFIRM WAGER
        </button>
      </div>
    </div>
  );
};