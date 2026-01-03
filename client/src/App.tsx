import React from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { GameScene } from './components/Scene/GameScene';
import { SelectionGrid } from './components/UI/SelectionGrid';
import { BettingPanel } from './components/UI/BettingPanel';
import { socket } from './socket';

export default function App() {
  const { state, actions } = useGameLogic();
  
  const { 
    phase, localStep, roomId, 
    pot, bios, opponentBios, 
    globalDeck = [], 
    selectedCardIds, targetVal, currentSum, 
    roundResult, gameOver, opponentStatus, timer 
  } = state;

  // HELPER: Renders a card for the Result Screen
  const renderCard = (id: string, isOpponent: boolean) => {
      if (!globalDeck || globalDeck.length === 0) return null;
      
      const card = globalDeck.find((c: any) => c.id === id);
      if (!card) return <div key={id} style={{color:'red', border:'1px dashed red', padding: 5}}>?</div>;

      const isBurned = roundResult?.intersectingCards?.includes(id);
      
      return (
        <div key={id} style={{ 
            background: isBurned ? '#500' : (isOpponent ? '#ddd' : '#fff'), 
            color: isBurned ? '#faa' : (['♥','♦'].includes(card.suit) ? '#d00' : '#000'), 
            width: 50, height: 70, 
            borderRadius: 4, 
            border: isBurned ? '2px solid red' : '1px solid #000',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 'bold'
        }}>
            <span>{card.rank}</span>
            <span style={{fontSize:'1.5rem', lineHeight: '1rem'}}>{card.suit}</span>
        </div>
      );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      
      <GameScene state={state} onTargetClick={(id: string) => localStep === 'PICK_TARGET' && actions.lockTarget(id)} />

      {/* HUD */}
      <div style={{ position: 'absolute', top: 30, left: 30, pointerEvents: 'none', zIndex: 10 }}>
           <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ffd700', margin: 0 }}>AIR POKER</h1>
           <div style={{ color: '#888' }}>{roomId ? `ROOM: ${roomId}` : ''}</div>
           {phase === 'ACTIVE' && <div style={{ fontSize: '2rem', color: timer < 10 ? 'red' : 'white', marginTop: 10 }}>⏳ {timer}s</div>}
      </div>
      
      {phase !== 'LOBBY' && (
        <div style={{ position: 'absolute', top: 30, right: 30, textAlign: 'right', pointerEvents: 'none', zIndex: 10 }}>
           <div style={{ color: '#ffd700', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px #ffd700' }}>POT: {pot}</div>
           <div style={{ color: 'white', fontSize: '1.2rem', marginTop: 5 }}>YOU: {bios} BIOS</div>
           <div style={{ color: '#888', fontSize: '1rem' }}>OPP: {opponentBios} BIOS</div>
        </div>
      )}

      {/* LOBBY / WAITING */}
      {phase === 'LOBBY' && !roomId && (
          <div style={overlayStyle}>
             <button onClick={actions.createRoom} style={btnStyle}>CREATE ROOM</button>
             <button onClick={() => { const id = prompt("ID"); if(id) actions.joinRoom(id); }} style={{...btnStyle, background:'transparent', border:'2px solid #ffd700', color:'#ffd700', marginLeft:20}}>JOIN ROOM</button>
          </div>
      )}
      {phase === 'LOBBY' && roomId && <div style={{...overlayStyle, pointerEvents: 'none'}}><h2 className="animate-pulse" style={{ fontSize: '2rem', color: '#ffd700' }}>WAITING...</h2></div>}

      {/* ACTIVE GAME */}
      {phase === 'ACTIVE' && (
        <>
            {localStep === 'PICK_TARGET' && <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center', pointerEvents: 'none', color: '#fff', fontSize: '1.5rem', textShadow: '0 2px 4px #000' }}>SELECT A TARGET SUM</div>}
            
            {localStep === 'BETTING' && (
               <>
                  {opponentStatus.targetLocked && <div style={{position:'absolute', top: '20%', width:'100%', textAlign:'center', color:'#ffd700', fontSize:'1.5rem', textShadow:'0 0 10px #000'}}>OPPONENT TARGET LOCKED</div>}
                  <BettingPanel currentBios={bios} onPlaceBet={actions.placeBet} onToggleView={actions.toggleView} />
               </>
            )}
            
            {localStep === 'PICK_HAND' && (
               <SelectionGrid deck={globalDeck} selectedIds={selectedCardIds} onToggle={actions.toggleCard} onConfirm={actions.submitHand} onClose={actions.toggleView} currentSum={currentSum} targetValue={targetVal} />
            )}
            
            {localStep === 'VIEW_TABLE' && <div style={{ position: 'absolute', bottom: 30, width: '100%', textAlign: 'center', pointerEvents: 'auto', zIndex: 50 }}><button onClick={actions.toggleView} style={btnStyle}>RETURN TO GAME</button></div>}
            
            {localStep === 'WAITING_FOR_OPPONENT' && <div style={{...overlayStyle, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none'}}><div style={{textAlign: 'center'}}><h2>HAND LOCKED</h2><p style={{color: '#aaa'}}>Waiting for opponent...</p></div></div>}
        </>
      )}

      {/* RESOLUTION SCREEN */}
      {phase === 'RESOLUTION' && roundResult && (
          <div style={{...overlayStyle, flexDirection:'column', background: 'rgba(0,0,0,0.95)', padding: 20}}>
             
             {/* RESULT TITLE */}
             <h1 style={{ 
                 color: roundResult.type === 'OVERLAP' ? '#ff3333' : (roundResult.winner === socket.id ? '#0f0' : (roundResult.winner === null ? '#fff' : '#f00')), 
                 fontSize: '4rem', margin: '0 0 30px 0', textShadow: '0 0 20px rgba(0,0,0,0.5)' 
             }}>
               {roundResult.type === 'OVERLAP' ? 'AGONY' : (roundResult.winner === socket.id ? 'VICTORY' : (roundResult.winner === null ? 'DRAW' : 'DEFEAT'))}
             </h1>

             {/* HANDS CONTAINER */}
             <div style={{ display: 'flex', gap: 60, marginBottom: 30, alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
                
                {/* YOUR HAND */}
                <div style={{textAlign: 'center'}}>
                   <h3 style={{color: '#aaa', marginBottom: 15, fontSize: '1.2rem'}}>YOU</h3>
                   <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
                      {roundResult.p1Hand ? roundResult.p1Hand.map((id: string) => renderCard(id, false)) : <div style={{color:'#666'}}>No Cards</div>}
                   </div>
                </div>

                <div style={{fontSize: '3rem', color: '#444', fontWeight: 'bold', alignSelf: 'center'}}>VS</div>

                {/* OPPONENT HAND */}
                <div style={{textAlign: 'center'}}>
                   <h3 style={{color: '#aaa', marginBottom: 15, fontSize: '1.2rem'}}>OPPONENT ({roundResult.opponentTargets ? roundResult.opponentTargets[socket.id === roundResult.winner ? 'p2' : 'p1'] : '?'})</h3>
                   <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
                      {roundResult.p2Hand ? roundResult.p2Hand.map((id: string) => renderCard(id, true)) : <div style={{color:'#666'}}>No Cards</div>}
                   </div>
                </div>
             </div>

             {/* DESCRIPTION (Hand Name) */}
             <div style={{ color: '#ffd700', fontSize: '2rem', fontFamily: 'monospace', margin: '20px 0', textTransform: 'uppercase', letterSpacing: 2 }}>
                {roundResult.desc}
             </div>

             {/* MUTUAL DESTRUCTION */}
             {roundResult.intersectingCards?.length > 0 && (
                <div style={{ padding: 15, border: '1px solid #ff3333', background: 'rgba(255,0,0,0.3)', color: '#ffaaaa', marginBottom: 20 }}>
                  🔥 <strong>MUTUAL DESTRUCTION</strong>: {roundResult.intersectingCards.length} Card(s) burned.
                </div>
             )}

             <button onClick={actions.nextRound} style={{ marginTop: 20, ...btnStyle }}>NEXT ROUND</button>
          </div>
      )}

      {/* GAME OVER */}
      {(phase === 'GAME_OVER' || gameOver) && (
          <div style={{...overlayStyle, background: '#000', flexDirection:'column', zIndex: 50}}>
             <h1 style={{ fontSize: '5rem', color: gameOver?.winner === socket.id ? '#ffd700' : '#444' }}>{gameOver?.winner === socket.id ? 'SURVIVOR' : 'ELIMINATED'}</h1>
             <button onClick={actions.leaveRoom} style={{ marginTop: 50, padding: '15px 40px', background: 'white', color: 'black', border: 'none', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' }}>LEAVE TABLE</button>
          </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20 };
const btnStyle: React.CSSProperties = { padding: '15px 30px', background: '#ffd700', border: 'none', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: 4 };