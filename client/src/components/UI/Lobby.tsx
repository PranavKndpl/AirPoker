import React, { useState } from "react";

interface LobbyProps {
  onCreate: () => void;
  onJoin: (roomId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onCreate, onJoin }) => {
  const [showJoin, setShowJoin] = useState(false);
  const [inputCode, setInputCode] = useState("");

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length > 0) {
      onJoin(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div style={overlayStyle}>
      
      {/* --- MAIN LOBBY MENU --- */}
      {!showJoin && (
        <div style={panelStyle}>
          <h1 style={titleStyle}>AIR POKER</h1>
          <div style={{ marginBottom: 40, color: "#888", letterSpacing: 2, fontSize: "0.9rem" }}>
            HIGH STAKES SURVIVAL
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <button onClick={onCreate} style={primaryBtnStyle}>
              CREATE ROOM
            </button>
            <button onClick={() => setShowJoin(true)} style={secondaryBtnStyle}>
              JOIN ROOM
            </button>
          </div>
        </div>
      )}

      {/* --- JOIN MODAL --- */}
      {showJoin && (
        <div style={modalStyle}>
          <h2 style={{ color: "#00f0ff", marginBottom: 20, letterSpacing: 2 }}>
            ENTER ROOM CODE
          </h2>
          
          <form onSubmit={handleJoinSubmit} style={{ width: "100%" }}>
            <input
              autoFocus
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={6}
              style={inputStyle}
            />
            
            <div style={{ display: "flex", gap: 15, marginTop: 20 }}>
              <button 
                type="button" 
                onClick={() => setShowJoin(false)} 
                style={cancelBtnStyle}
              >
                CANCEL
              </button>
              <button 
                type="submit" 
                disabled={inputCode.length < 2}
                style={joinConfirmStyle}
              >
                CONNECT
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

/* --- STYLES --- */
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100, backdropFilter: "blur(10px)"
};

const panelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  animation: "fadeIn 0.5s ease"
};

const modalStyle: React.CSSProperties = {
  background: "rgba(12, 20, 28, 0.95)",
  border: "1px solid rgba(0, 240, 255, 0.3)",
  padding: 40, borderRadius: 12,
  display: "flex", flexDirection: "column", alignItems: "center",
  boxShadow: "0 0 50px rgba(0,0,0,0.8)",
  width: 300, animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
};

const titleStyle: React.CSSProperties = {
  fontSize: "4rem", color: "#ffd700", margin: 0,
  letterSpacing: 10, textShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
  fontFamily: "sans-serif", fontWeight: 900
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "20px 40px", fontSize: "1.2rem", fontWeight: "bold",
  background: "#ffd700", color: "#000", border: "none", borderRadius: 4,
  cursor: "pointer", letterSpacing: 2,
  boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)",
  transition: "transform 0.1s"
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "20px 40px", fontSize: "1.2rem", fontWeight: "bold",
  background: "transparent", color: "#00f0ff", border: "2px solid #00f0ff", 
  borderRadius: 4, cursor: "pointer", letterSpacing: 2,
  textShadow: "0 0 10px #00f0ff", boxShadow: "0 0 10px rgba(0, 240, 255, 0.2)"
};

const inputStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.5)", border: "1px solid #444",
  color: "#fff", fontSize: "2rem", textAlign: "center",
  width: "100%", padding: "15px", borderRadius: 6,
  fontFamily: "monospace", letterSpacing: 5, outline: "none"
};

const joinConfirmStyle: React.CSSProperties = {
  flex: 1, padding: 15, background: "#00f0ff", color: "#000",
  border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer"
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: 15, background: "transparent", color: "#888",
  border: "1px solid #444", borderRadius: 4, fontWeight: "bold", cursor: "pointer"
};