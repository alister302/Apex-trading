import { useState, useEffect, useRef } from "react";

const SYMBOLS = ["$","€","£","¥","₿","Ξ","◈","$","€","$","£","$","¥","$","₿"];

function useCanvas(cb, deps) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return cb(canvas, ctx);
  }, deps);
  return ref;
}

export default function Splash({ onDone }) {
  const [phase, setPhase] = useState("rain");   // rain → scan → done
  const [scanPct, setScanPct] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING...");
  const [fadeOut, setFadeOut] = useState(false);

  const canvasRef = useCanvas((canvas, ctx) => {
    const W = canvas.width, H = canvas.height;
    const drops = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H - H,
      speed: 2 + Math.random() * 4,
      sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      size: 10 + Math.random() * 14,
      opacity: 0.3 + Math.random() * 0.7,
      color: Math.random() > 0.6 ? "#00ff88" : Math.random() > 0.5 ? "#ffd700" : "#00aaff",
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      drops.forEach(d => {
        ctx.globalAlpha = d.opacity;
        ctx.fillStyle = d.color;
        ctx.font = `bold ${d.size}px monospace`;
        ctx.fillText(d.sym, d.x, d.y);
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = d.color;
        ctx.fillText(d.sym, d.x, d.y - 20);
        ctx.globalAlpha = 1;
        d.y += d.speed;
        if (d.y > H + 30) {
          d.y = -30;
          d.x = Math.random() * W;
          d.sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  // Phase timeline
  useEffect(() => {
    const statuses = [
      [0,    "INITIALIZING PRINCEX IQ..."],
      [600,  "LOADING MARKET DATA..."],
      [1200, "CONNECTING TO SIGNALS..."],
      [1800, "SCANNING INDICATORS..."],
      [2400, "EMA · MACD · RSI · ADX · VWAP"],
      [3000, "SUPERTREND · PATTERN DETECT..."],
      [3600, "CALIBRATING SNIPER ENGINE..."],
      [4200, "ALL SYSTEMS READY ✓"],
    ];

    const timers = statuses.map(([delay, text]) =>
      setTimeout(() => setStatusText(text), delay)
    );

    // Scan progress
    let pct = 0;
    const scanInterval = setInterval(() => {
      pct += 1.2;
      setScanPct(Math.min(pct, 100));
      if (pct >= 100) clearInterval(scanInterval);
    }, 50);

    // Switch to scan phase
    const t1 = setTimeout(() => setPhase("scan"), 1500);

    // Fade out and done
    const t2 = setTimeout(() => setFadeOut(true), 4800);
    const t3 = setTimeout(() => onDone(), 5300);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(scanInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#020810",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.5s ease",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes logoPulse {
          0%,100%{filter:drop-shadow(0 0 8px #0066ff88) drop-shadow(0 0 20px #0066ff44)}
          50%{filter:drop-shadow(0 0 20px #00aaff) drop-shadow(0 0 40px #0066ffaa)}
        }
        @keyframes hexSpin {
          from{transform:rotate(0deg)} to{transform:rotate(360deg)}
        }
        @keyframes fadeInUp {
          from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
        }
        @keyframes blink {
          0%,100%{opacity:1} 50%{opacity:0}
        }
        @keyframes scanLine {
          0%{top:0%} 100%{top:100%}
        }
        @keyframes radarPing {
          0%{transform:scale(0.5);opacity:1}
          100%{transform:scale(2.5);opacity:0}
        }
        .logo-pulse { animation: logoPulse 2s infinite; }
        .hex-spin { animation: hexSpin 8s linear infinite; }
        .fade-up { animation: fadeInUp 0.6s ease forwards; }
        .cursor-blink { animation: blink 1s infinite; }
        .radar-ping { animation: radarPing 2s ease-out infinite; }
      `}</style>

      {/* Dollar rain canvas */}
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, opacity:0.35 }} />

      {/* Dark overlay gradient */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, #020810cc 30%, #020810ee 100%)" }} />

      {/* Content */}
      <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>

        {/* Radar rings */}
        <div style={{ position:"relative", width:160, height:160, marginBottom:24 }}>
          {[0,1,2].map(i => (
            <div key={i} className="radar-ping" style={{
              position:"absolute",
              inset: i*10,
              borderRadius:"50%",
              border:"1px solid #0066ff",
              animationDelay:`${i*0.5}s`,
              opacity:0.6 - i*0.15,
            }} />
          ))}

          {/* Hex ring */}
          <div className="hex-spin" style={{ position:"absolute", inset:20, opacity:0.3 }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <polygon points="50,2 93,26 93,74 50,98 7,74 7,26"
                fill="none" stroke="#0066ff" strokeWidth="1.5" strokeDasharray="4 3"/>
            </svg>
          </div>

          {/* Center logo */}
          <div className="logo-pulse" style={{
            position:"absolute", inset:28,
            background:"linear-gradient(135deg,#0066ff,#00aaff)",
            clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{ fontSize:28, color:"#fff", fontWeight:900 }}>▲</span>
          </div>
        </div>

        {/* Name */}
        <div className="fade-up" style={{ textAlign:"center", marginBottom:8 }}>
          <div style={{
            fontFamily:"'Orbitron',sans-serif",
            fontSize:36, fontWeight:900,
            color:"#fff",
            letterSpacing:6,
            textShadow:"0 0 20px #0066ff88, 0 0 40px #0066ff44",
          }}>
            PRINCEX <span style={{ color:"#ffd700" }}>ACADEMY</span>
          </div>
          <div style={{
            fontFamily:"'IBM Plex Mono',monospace",
            fontSize:10, letterSpacing:4,
            color:"#334455", marginTop:4,
          }}>
            TRADING SIGNALS PLATFORM
          </div>
        </div>

        {/* Scan progress */}
        {phase === "scan" && (
          <div className="fade-up" style={{ width:"80%", maxWidth:320, marginTop:24 }}>

            {/* Scan bar */}
            <div style={{ position:"relative", height:3, background:"#0a1520", borderRadius:2, marginBottom:14, overflow:"hidden" }}>
              <div style={{
                position:"absolute", top:0, left:0,
                height:"100%", borderRadius:2,
                width:`${scanPct}%`,
                background:"linear-gradient(90deg,#0044bb,#0088ff,#00ffaa)",
                transition:"width 0.1s linear",
                boxShadow:"0 0 8px #0088ff",
              }} />
              {/* Shimmer */}
              <div style={{
                position:"absolute", top:0, left:`${scanPct-10}%`,
                width:40, height:"100%",
                background:"linear-gradient(90deg,transparent,#ffffff44,transparent)",
              }} />
            </div>

            {/* Percentage */}
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#334455", letterSpacing:2 }}>LOADING</span>
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:12, fontWeight:700, color:"#0088ff" }}>{Math.round(scanPct)}%</span>
            </div>

            {/* Status text */}
            <div style={{
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:11, color:"#00ff88",
              letterSpacing:1, textAlign:"center",
              minHeight:18,
              textShadow:"0 0 8px #00ff8866",
            }}>
              {statusText}<span className="cursor-blink">_</span>
            </div>

            {/* Indicator grid scanning */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginTop:20 }}>
              {["EMA","MACD","RSI","ADX","VWAP","ST","ATR","SMA","PAT","MOM"].map((ind, i) => (
                <div key={ind} style={{
                  padding:"5px 4px",
                  background: scanPct > (i+1)*10 ? "#001a0d" : "#0a1520",
                  border:`1px solid ${scanPct>(i+1)*10?"#00ff8844":"#0d2a42"}`,
                  borderRadius:4, textAlign:"center",
                  transition:"all 0.3s",
                }}>
                  <div style={{
                    fontFamily:"'IBM Plex Mono',monospace",
                    fontSize:8, fontWeight:700,
                    color: scanPct>(i+1)*10 ? "#00ff88" : "#1e4060",
                    letterSpacing:0.5,
                  }}>{ind}</div>
                  <div style={{ fontSize:10, marginTop:1 }}>
                    {scanPct>(i+1)*10 ? "✓" : "·"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tagline */}
        <div style={{
          fontFamily:"'IBM Plex Mono',monospace",
          fontSize:9, color:"#1e3a52",
          letterSpacing:3, marginTop:32,
          textAlign:"center",
        }}>
          POWERED BY PRINCE X TOOLS
        </div>
      </div>
    </div>
  );
}
