import { useState, useRef } from "react";

const GEMINI_API_KEY = "AIzaSyC5D5qpIUQ8wXrMNddJoGvUiC4nRR5TRbY";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const FAST_PROMPT = `You are an elite binary options signal engine. Analyze this OlympTrade chart screenshot instantly.

Look at the last few candles, trend direction, and momentum.

YOU MUST respond with ONLY a raw JSON object. No text before or after. No explanation. Just the JSON:
{
  "signal": "BUY or SELL or WAIT",
  "duration": "e.g. 30s or 1min or 2min or 3min",
  "confidence": 85,
  "reason": "one short sentence max"
}`;

export default function Fast({ dark }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/png");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const fileRef = useRef();
  const timerRef = useRef();
  const startRef = useRef();

  const t = {
    bg: dark ? "#050a0f" : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.9)" : "#ffffff",
    border: dark ? "#0d2a42" : "#d0dce8",
    borderDash: dark ? "#1e4060" : "#a0b8cc",
    text: dark ? "#c8d8e8" : "#1a2a3a",
    textMuted: dark ? "#8899aa" : "#445566",
    textDim: dark ? "#445566" : "#778899",
    inputBg: dark ? "rgba(0,40,80,0.2)" : "#e8f0f8",
  };

  const signalColor = (s) => s === "BUY" ? "#00dd66" : s === "SELL" ? "#ff2244" : "#ffaa00";
  const signalBg = (s) => s === "BUY" ? (dark ? "#001a0d" : "#e8fff3") : s === "SELL" ? (dark ? "#1a0005" : "#fff0f3") : (dark ? "#1a1000" : "#fffbe8");

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageMime(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
      setResult(null);
      setError(null);
      setElapsed(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setResult(null);
    setError(null);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));
    }, 100);

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: FAST_PROMPT },
              { inline_data: { mime_type: imageMime, data: imageBase64 } }
            ]
          }],
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
            thinkingConfig: { thinkingBudget: 0 },
            temperature: 0.1,
            maxOutputTokens: 200,
            responseMimeType: "application/json"
          }
        })
      });

      const data = await res.json();
      clearInterval(timerRef.current);
      const finalTime = ((Date.now() - startRef.current) / 1000).toFixed(1);
      setElapsed(finalTime);

      if (data.error) {
        if (data.error.message.includes("quota") || data.error.message.includes("demand")) {
          setError("⏳ Rate limited — wait 30-60 seconds and try again");
          setLoading(false);
          return;
        }
        setError("API Error: " + data.error.message);
        setLoading(false);
        return;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const raw = parts.map(p => p.text || "").join("");
      const jsonMatch = raw.match(/\{[\s\S]*\}/) ; const clean = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setHistory(prev => [{
        image,
        signal: parsed.signal,
        duration: parsed.duration,
        confidence: parsed.confidence,
        time: new Date().toLocaleTimeString(),
        elapsed: finalTime
      }, ...prev].slice(0, 30));

    } catch (err) {
      clearInterval(timerRef.current);
      setError("Failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, background: t.bg, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
        .pop { animation: popIn 0.3s ease forwards; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        .ping { animation: ping 1.2s infinite; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", padding: "20px 16px", display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, flex: 1 }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 10, height: 10 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00dd66" }} />
              <div className="ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00dd6644" }} />
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color: dark ? "#00dd66" : "#009944", letterSpacing: 3 }}>FAST MODE</span>
            <span style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>· instant signal · 3-5 seconds</span>
          </div>

          {/* Drop Zone */}
          <div
            style={{ border: `2px dashed ${dragging ? "#00dd66" : t.borderDash}`, background: dragging ? "rgba(0,200,100,0.04)" : t.inputBg, borderRadius: 10, padding: 20, textAlign: "center", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", transition: "all 0.2s" }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => processFile(e.target.files[0])} />
            {image ? (
              <div style={{ width: "100%", position: "relative" }}>
                <img src={image} alt="chart" style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 6, border: `1px solid ${t.border}` }} />
                <div style={{ position: "absolute", top: 8, right: 8, background: "#00dd66", color: "#000", fontSize: 9, padding: "3px 10px", borderRadius: 4, fontWeight: 900 }}>READY</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 32 }}>⚡</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#00aa55" : "#006633", fontFamily: "'IBM Plex Mono', monospace" }}>DROP CHART FOR INSTANT SIGNAL</div>
                <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>Any pair · Any timeframe · OTC supported</div>
              </>
            )}
          </div>

          {/* Scan Button */}
          <button onClick={analyze} disabled={!imageBase64 || loading}
            style={{ background: !imageBase64 || loading ? (dark ? "#0a1520" : "#e0eaf4") : "linear-gradient(135deg,#00aa44,#006633)", border: "none", color: !imageBase64 || loading ? t.textDim : "#fff", padding: "16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 900, letterSpacing: 3, cursor: !imageBase64 || loading ? "not-allowed" : "pointer", borderRadius: 8, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading
              ? <><span className="spin">⟳</span> SCANNING... {elapsed}s</>
              : "⚡ INSTANT SCAN"
            }
          </button>

          {/* Error */}
          {error && (
            <div style={{ background: dark ? "#2a000a" : "#fff0f3", border: "1px solid #cc0022", padding: "12px 16px", fontSize: 12, color: "#cc0022", borderRadius: 6, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
              ⚠ {error}
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="pop" style={{ background: signalBg(result.signal), border: `2px solid ${signalColor(result.signal)}44`, borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>

              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 56, fontWeight: 900, color: signalColor(result.signal), marginBottom: 6, letterSpacing: 4, lineHeight: 1 }}>
                {result.signal === "BUY" ? "▲" : result.signal === "SELL" ? "▼" : "◆"} {result.signal}
              </div>

              <div style={{ fontSize: 24, fontWeight: 700, color: "#ffaa00", fontFamily: "'Orbitron', sans-serif", marginBottom: 20, letterSpacing: 2 }}>
                ⏱ {result.duration}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>CONFIDENCE</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: signalColor(result.signal), fontFamily: "'Orbitron', sans-serif" }}>{result.confidence}%</span>
                </div>
                <div style={{ height: 8, background: dark ? "#0a1520" : "#e0eaf4", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${result.confidence}%`, height: "100%", background: signalColor(result.signal), borderRadius: 4 }} />
                </div>
              </div>

              <div style={{ fontSize: 12, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, padding: "10px 14px", background: dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.04)", borderRadius: 6, marginBottom: 12 }}>
                {result.reason}
              </div>

              <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>
                ⚡ Analyzed in {elapsed}s
              </div>
            </div>
          )}

          {image && !loading && (
            <button onClick={() => { setImage(null); setImageBase64(null); setResult(null); setError(null); setElapsed(null); }}
              style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, padding: "10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: "pointer", borderRadius: 6 }}>
              CLEAR
            </button>
          )}
        </div>

        {/* Right - History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>SIGNAL LOG ({history.length})</div>
          {history.length === 0 && (
            <div style={{ border: `1px dashed ${t.borderDash}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>No signals yet</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
            {history.map((h, i) => (
              <div key={i} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderLeft: `3px solid ${signalColor(h.signal)}`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900, color: signalColor(h.signal) }}>{h.signal}</span>
                  <span style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{h.time}</span>
                </div>
                <img src={h.image} alt="" style={{ width: "100%", height: 45, objectFit: "cover", borderRadius: 4, marginBottom: 6 }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "#ffaa00", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>⏱ {h.duration}</span>
                  <span style={{ fontSize: 10, color: signalColor(h.signal), fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>{h.confidence}%</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>⚡ {h.elapsed}s</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
