import { useState, useRef } from "react";

const GEMINI_API_KEY = "AIzaSyDLXA3uOQuQmJQanhcSQmCnPqaAJL2l4xU";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const LONGTERM_PROMPT = `You are a professional Forex and Binary Options analyst with 20 years experience. Analyze this chart screenshot with MAXIMUM DEPTH for long-term trading.

ANALYZE EVERYTHING:
1. TREND STRUCTURE — Primary, secondary, and short-term trends. Higher highs/lows or lower highs/lows. Trend strength.
2. CANDLESTICK PATTERNS — Every visible pattern, what it means long-term.
3. SUPPORT & RESISTANCE — All key levels, how strong each one is, how many times tested.
4. MOMENTUM — Is trend accelerating or exhausting? RSI/Stochastic if visible.
5. MOVING AVERAGES — Price position relative to MAs, MA crossovers if visible.
6. ENTRY POINT — Exact best entry price or zone.
7. TAKE PROFIT — 3 levels (TP1, TP2, TP3) based on 3:1 risk/reward minimum.
8. STOP LOSS — Exact stop loss level with reasoning.
9. RISK/REWARD — Calculate exact ratio.
10. TRADE DURATION — How long to hold (hours, days, weeks).
11. CONFIDENCE — Overall confidence in this setup.
12. MARKET CONTEXT — What is the overall market doing? Any warnings?

RULES:
- Be extremely precise and professional
- NEVER refuse to analyze — work with whatever is visible
- TP and SL must be based on actual chart levels not random numbers
- Risk/Reward must be minimum 3:1
- Give exact price levels where visible
- If price not visible, give percentage distances

Respond ONLY with this exact JSON (no markdown, no extra text):
{
  "pair": "detected pair",
  "timeframe": "detected timeframe",
  "direction": "LONG or SHORT",
  "trend": "detailed trend description",
  "trend_strength": "STRONG or MODERATE or WEAK",
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "key_levels": [
    {"type": "RESISTANCE", "level": "price or description", "strength": "STRONG or MODERATE"},
    {"type": "SUPPORT", "level": "price or description", "strength": "STRONG or MODERATE"}
  ],
  "entry": "exact entry price or zone",
  "stop_loss": "exact SL level",
  "tp1": "first target",
  "tp2": "second target",
  "tp3": "third target",
  "risk_reward": "3.2:1",
  "sl_reason": "why this stop loss level",
  "tp_reason": "why these take profit levels",
  "duration": "e.g. 2-5 days or 1-2 weeks",
  "confidence": 85,
  "warnings": ["warning1", "warning2"],
  "bias": "BULLISH or BEARISH or NEUTRAL",
  "summary": "3-4 sentence professional analysis summary",
  "action": "ENTER NOW or WAIT FOR PULLBACK or WAIT FOR BREAKOUT or AVOID"
}`;

export default function LongTerm({ dark }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/png");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [elapsed, setElapsed] = useState(null);
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
    textLabel: dark ? "#667788" : "#556677",
    inputBg: dark ? "rgba(0,40,80,0.2)" : "#e8f0f8",
    bgCard2: dark ? "rgba(0,15,35,0.8)" : "#f8fbff",
  };

  const dirColor = (d) => d === "LONG" ? "#00cc55" : "#ff2244";
  const biasColor = (b) => b === "BULLISH" ? "#00cc55" : b === "BEARISH" ? "#ff2244" : "#ffaa00";
  const actionColor = (a) => a === "ENTER NOW" ? "#00cc55" : a === "AVOID" ? "#ff2244" : "#ffaa00";

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
              { text: LONGTERM_PROMPT },
              { inline_data: { mime_type: imageMime, data: imageBase64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 1024 }
          }
        })
      });

      const data = await res.json();
      clearInterval(timerRef.current);
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));

      if (data.error) {
        setError(data.error.message.includes("quota") || data.error.message.includes("demand")
          ? "⏳ Rate limited — wait 30-60 seconds and try again"
          : "API Error: " + data.error.message);
        setLoading(false);
        return;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const raw = parts.map(p => p.text || "").join("");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const clean = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      clearInterval(timerRef.current);
      setError("Failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, background: t.bg, overflowY: "auto" }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes popIn { from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1} }
        .pop { animation: popIn 0.4s ease forwards; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes shimmer { 0%{opacity:0.4}50%{opacity:1}100%{opacity:0.4} }
        .shimmer { animation: shimmer 1.5s infinite; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#aa66ff" }} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color: dark ? "#aa66ff" : "#6600cc", letterSpacing: 3 }}>LONG TERM ANALYSIS</span>
          <span style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>· Forex & Binary · TP/SL 3:1</span>
        </div>

        {/* Upload */}
        <div
          style={{ border: `2px dashed ${dragging ? "#aa66ff" : t.borderDash}`, background: dragging ? "rgba(170,100,255,0.04)" : t.inputBg, borderRadius: 10, padding: 20, textAlign: "center", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", transition: "all 0.2s", marginBottom: 14 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current.click()}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => processFile(e.target.files[0])} />
          {image ? (
            <div style={{ width: "100%", position: "relative" }}>
              <img src={image} alt="chart" style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 6, border: `1px solid ${t.border}` }} />
              <div style={{ position: "absolute", top: 8, right: 8, background: "#aa66ff", color: "#fff", fontSize: 9, padding: "3px 10px", borderRadius: 4, fontWeight: 900 }}>READY</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 32 }}>📈</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#aa66ff" : "#6600cc", fontFamily: "'IBM Plex Mono', monospace" }}>DROP CHART FOR DEEP ANALYSIS</div>
              <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>Forex · Binary · Any timeframe · Full TP/SL calculation</div>
            </>
          )}
        </div>

        {/* Button */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button onClick={analyze} disabled={!imageBase64 || loading}
            style={{ flex: 1, background: !imageBase64 || loading ? (dark ? "#0a1520" : "#e0eaf4") : "linear-gradient(135deg,#7700cc,#aa44ff)", border: "none", color: !imageBase64 || loading ? t.textDim : "#fff", padding: "15px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 900, letterSpacing: 2, cursor: !imageBase64 || loading ? "not-allowed" : "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><span className="spin">⟳</span> DEEP SCANNING... {elapsed}s</> : "📈 DEEP ANALYSIS"}
          </button>
          {image && (
            <button onClick={() => { setImage(null); setImageBase64(null); setResult(null); setError(null); }}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "15px 18px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: "pointer", borderRadius: 8 }}>
              CLEAR
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: dark ? "#2a000a" : "#fff0f3", border: "1px solid #cc0022", padding: "12px 16px", fontSize: 12, color: "#cc0022", borderRadius: 6, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        {loading && (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: 24, textAlign: "center", marginBottom: 14 }}>
            <div className="shimmer" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#aa66ff", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>PERFORMING DEEP MARKET ANALYSIS...</div>
            <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 2 }}>
              Analyzing trend structure...<br/>
              Calculating support & resistance...<br/>
              Computing TP/SL levels...<br/>
              Generating trade plan...
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="pop" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Action Banner */}
            <div style={{ background: actionColor(result.action) + "22", border: `2px solid ${actionColor(result.action)}44`, borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>ACTION</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: actionColor(result.action), letterSpacing: 2 }}>{result.action}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 900, color: dirColor(result.direction) }}>{result.direction === "LONG" ? "▲" : "▼"} {result.direction}</div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{result.pair} · {result.timeframe}</div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "BIAS", value: result.bias, color: biasColor(result.bias) },
                { label: "CONFIDENCE", value: result.confidence + "%", color: "#aa66ff" },
                { label: "RISK/REWARD", value: result.risk_reward, color: "#ffaa00" },
                { label: "DURATION", value: result.duration, color: dark ? "#c8d8e8" : "#1a2a3a" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 8, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 5, fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* TP/SL Box — The main section */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 9, letterSpacing: 3, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>TRADE PLAN · 3:1 RISK/REWARD</div>

              <div style={{ padding: "16px" }}>
                {/* Entry */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: dark ? "#001833" : "#e8f4ff", borderRadius: 8, marginBottom: 8, border: `1px solid #0066ff44` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4499ff", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>⚡ ENTRY</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#4499ff", fontFamily: "'Orbitron', sans-serif" }}>{result.entry}</span>
                </div>

                {/* TPs */}
                {[
                  { label: "🎯 TP1 — FIRST TARGET", value: result.tp1, color: "#00cc55", bg: dark ? "#001a0d" : "#e8fff3", border: "#00cc5544" },
                  { label: "🎯 TP2 — SECOND TARGET", value: result.tp2, color: "#00ee77", bg: dark ? "#002211" : "#d8ffe8", border: "#00ee7744" },
                  { label: "🎯 TP3 — FINAL TARGET", value: result.tp3, color: "#00ffaa", bg: dark ? "#002a15" : "#c8ffd8", border: "#00ffaa44" },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: bg, borderRadius: 8, marginBottom: 8, border: `1px solid ${border}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color, fontFamily: "'Orbitron', sans-serif" }}>{value}</span>
                  </div>
                ))}

                {/* Stop Loss */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: dark ? "#1a0005" : "#fff0f3", borderRadius: 8, border: `1px solid #ff224444` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#ff2244", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>🛑 STOP LOSS</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#ff2244", fontFamily: "'Orbitron', sans-serif" }}>{result.stop_loss}</span>
                </div>
              </div>

              {/* SL/TP Reasons */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: "#ff2244", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>SL REASON</div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{result.sl_reason}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: "#00cc55", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>TP REASON</div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{result.tp_reason}</div>
                </div>
              </div>
            </div>

            {/* Trend + Patterns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 8 }}>TREND ANALYSIS</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: biasColor(result.bias), fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>{result.trend_strength} TREND</div>
                <div style={{ fontSize: 11, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{result.trend}</div>
              </div>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 8 }}>PATTERNS DETECTED</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(result.patterns || []).map((p, i) => (
                    <div key={i} style={{ fontSize: 10, color: dark ? "#4499cc" : "#0055aa", fontFamily: "'IBM Plex Mono', monospace", padding: "4px 8px", background: dark ? "#001a33" : "#e0eeff", borderRadius: 4, fontWeight: 600 }}>• {p}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Levels */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>KEY LEVELS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(result.key_levels || []).map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: l.type === "RESISTANCE" ? (dark ? "#1a0005" : "#fff0f3") : (dark ? "#001a0d" : "#e8fff3"), borderRadius: 6, border: `1px solid ${l.type === "RESISTANCE" ? "#ff224422" : "#00cc5522"}` }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: l.type === "RESISTANCE" ? "#ff2244" : "#00cc55", fontFamily: "'IBM Plex Mono', monospace" }}>{l.type === "RESISTANCE" ? "▼" : "▲"} {l.type}</span>
                      <span style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{l.strength}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: l.type === "RESISTANCE" ? "#ff2244" : "#00cc55", fontFamily: "'IBM Plex Mono', monospace" }}>{l.level}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div style={{ background: dark ? "#1a1000" : "#fffbe8", border: `1px solid #ffaa0044`, borderLeft: "4px solid #ffaa00", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#ffaa00", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 8 }}>⚠ WARNINGS</div>
                {result.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: dark ? "#cc9900" : "#886600", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, marginBottom: 4 }}>• {w}</div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderLeft: `4px solid #aa66ff`, borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#aa66ff", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 8 }}>PROFESSIONAL SUMMARY</div>
              <div style={{ fontSize: 12, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}>{result.summary}</div>
              <div style={{ marginTop: 10, fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>⏱ Analyzed in {elapsed}s</div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
