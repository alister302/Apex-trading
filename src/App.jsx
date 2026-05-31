import { useState, useRef } from "react";
import Academy from "./Academy";
import Quiz from "./Quiz";
import Fast from "./Fast";
import LongTerm from "./LongTerm";
import Elite from "./Elite";
import RiskCalc from "./RiskCalc";
import LiveSignals from "./LiveSignals";
import Splash from "./Splash";
import Auth from "./Auth";
import { supabase } from "./supabase";

const GEMINI_API_KEY = "AIzaSyDLXA3uOQuQmJQanhcSQmCnPqaAJL2l4xU";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are APEX FX — an elite candlestick chart analyst for OlympTrade binary options trading across ALL pairs (Forex, Crypto, OTC, Commodities, Stocks) and ALL timeframes including 5-second scalping.

Analyze the chart screenshot with extreme precision. ALWAYS attempt full analysis regardless of image quality. NEVER say the image is unclear — work with whatever is visible.

ANALYZE:
- Candle colors (green/red = bull/bear), body sizes, wick lengths
- Overall trend direction left to right
- Candlestick patterns: Doji, Hammer, Inverted Hammer, Shooting Star, Hanging Man, Bullish/Bearish Engulfing, Harami, Morning Star, Evening Star, Three White Soldiers, Three Black Crows, Marubozu, Spinning Top, Pinbar, Tweezer Tops/Bottoms, Dark Cloud Cover, Piercing Line
- Support and resistance levels
- Momentum and market structure
- Any indicators visible (MA, RSI, Bollinger etc.)

CRITICAL RULES:
- ALWAYS give a prediction. Never refuse or say unclear.
- If pair not visible write UNKNOWN
- If timeframe not visible, estimate from candle density
- entry_signal BUY = all 3 candles must be UP
- entry_signal SELL = all 3 candles must be DOWN
- ALL 3 candles must match market_bias

Respond ONLY with this exact JSON (no markdown, no extra text):
{
  "pair": "detected pair or UNKNOWN",
  "timeframe": "detected or estimated timeframe",
  "market_bias": "BULLISH or BEARISH or NEUTRAL",
  "trend": "one line trend description",
  "patterns": ["pattern1", "pattern2"],
  "support": "level or description",
  "resistance": "level or description",
  "entry_signal": "BUY or SELL or WAIT",
  "trade_duration": "e.g. 1 candle / 3 candles / 30 seconds / 1 minute",
  "candles": [
    { "number": 1, "direction": "UP or DOWN", "strength": "STRONG or MEDIUM or WEAK", "confidence": 85, "reason": "short reason" },
    { "number": 2, "direction": "UP or DOWN", "strength": "STRONG or MEDIUM or WEAK", "confidence": 80, "reason": "short reason" },
    { "number": 3, "direction": "UP or DOWN", "strength": "STRONG or MEDIUM or WEAK", "confidence": 75, "reason": "short reason" }
  ],
  "summary": "2-3 sentence professional trading summary"
}`;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("analyzer");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/png");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const t = {
    bg: dark ? "#050a0f" : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.8)" : "#ffffff",
    bgHeader: dark ? "#030810" : "#ffffff",
    border: dark ? "#0d2a42" : "#d0dce8",
    borderDash: dark ? "#1e4060" : "#a0b8cc",
    text: dark ? "#c8d8e8" : "#1a2a3a",
    textMuted: dark ? "#8899aa" : "#445566",
    textDim: dark ? "#445566" : "#778899",
    textLabel: dark ? "#667788" : "#556677",
    inputBg: dark ? "rgba(0,40,80,0.2)" : "#e8f0f8",
    histBg: dark ? "rgba(0,15,30,0.8)" : "#f8fbff",
  };

  useState(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
      setAuthChecked(true);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
  });
  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageMime(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
      setAnalysis(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nAnalyze this chart. Return ONLY valid JSON." }, { inline_data: { mime_type: imageMime, data: imageBase64 } }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if (data.error) { setError("API Error: " + data.error.message); setLoading(false); return; }
      const parts = data.candidates?.[0]?.content?.parts || [];
      const raw = parts.map(p => p.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
      setHistory(prev => [{ image, analysis: parsed, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    } catch (err) { setError("Analysis failed: " + err.message); }
    setLoading(false);
  };

  const biasColor = (b) => b === "BULLISH" ? "#00bb55" : b === "BEARISH" ? "#ee2244" : "#dd9900";
  const dirColor = (d) => d === "UP" ? "#00bb55" : "#ee2244";
  const signalColor = (s) => s === "BUY" ? "#00bb55" : s === "SELL" ? "#ee2244" : "#dd9900";

  const tabs = [
    { id: "analyzer", label: "⚡ ANALYZER" },
    { id: "academy", label: "🎓 ACADEMY" },
    { id: "quiz", label: "🧩 QUIZ" },
    { id: "fast", label: "⚡ FAST" },
    { id: "longterm", label: "📈 LONG TERM" },
    { id: "elite", label: "★ ELITE" },
    { id: "risk", label: "🧮 RISK" },
    { id: "live", label: "📡 LIVE" },
  ];

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      {!showSplash && !user && authChecked && <Auth onLogin={setUser} />}

      {!showSplash && user && <div style={{ height: "100vh", background: t.bg, color: t.text, fontFamily: "'IBM Plex Mono', monospace", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 3px; height: 3px; }
          ::-webkit-scrollbar-thumb { background: #1e4060; border-radius: 2px; }
          .scan-btn { background: linear-gradient(135deg, #0066ff, #0044bb); border: none; color: #fff; padding: 14px 40px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; width: 100%; border-radius: 6px; }
          .scan-btn:hover:not(:disabled) { background: linear-gradient(135deg, #0088ff, #0055cc); }
          .scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pulse { animation: pulse 2s infinite; }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
          .tab-bar::-webkit-scrollbar { display: none; }
          .tab-bar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* HEADER */}
        <div style={{ flexShrink: 0, background: t.bgHeader, borderBottom: `1px solid ${t.border}`, padding: "0 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #0066ff, #00aaff)", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: "#fff" }}>▲</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 900, color: dark ? "#fff" : "#0044bb", letterSpacing: 3 }}>
                  APEX <span style={{ color: "#ffd700" }}>FX</span>
                </div>
                <div style={{ fontSize: 8, letterSpacing: 2, color: t.textDim }}>CANDLE INTELLIGENCE</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#00aa44" }}>● LIVE</span>
              <button onClick={() => setDark(!dark)} style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="tab-bar" style={{ flexShrink: 0, background: t.bgHeader, borderBottom: `1px solid ${t.border}`, overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ display: "flex", minWidth: "max-content", padding: "0 8px" }}>
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                style={{ padding: "13px 18px", background: "transparent", border: "none", borderBottom: tab === tb.id ? "3px solid #0066ff" : "3px solid transparent", color: tab === tb.id ? "#0066ff" : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}>
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {tab === "academy" && <Academy dark={dark} />}
          {tab === "quiz" && <Quiz dark={dark} />}
          {tab === "fast" && <Fast dark={dark} />}
          {tab === "longterm" && <LongTerm dark={dark} />}
          {tab === "elite" && <Elite dark={dark} />}
          {tab === "risk" && <RiskCalc dark={dark} />}
          {tab === "live" && <LiveSignals dark={dark} />}

          {tab === "analyzer" && (
            <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", padding: "20px 16px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{ border: `2px dashed ${dragging ? "#0088ff" : t.borderDash}`, background: dragging ? (dark ? "rgba(0,100,255,0.06)" : "#e8f4ff") : t.inputBg, borderRadius: 8, padding: 24, textAlign: "center", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "all 0.2s" }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => processFile(e.target.files[0])} />
                  {image ? (
                    <div style={{ width: "100%", position: "relative" }}>
                      <img src={image} alt="chart" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6, border: `1px solid ${t.border}` }} />
                      <div style={{ position: "absolute", top: 8, right: 8, background: "#0066ff", color: "#fff", fontSize: 10, padding: "3px 10px", borderRadius: 4, fontWeight: 700 }}>READY</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 40 }}>📊</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#4499cc" : "#0055aa" }}>DROP CHART SCREENSHOT HERE</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>or click to upload · PNG / JPG / WEBP</div>
                      <div style={{ fontSize: 11, color: t.textDim }}>Any pair · Any timeframe · OTC supported</div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="scan-btn" onClick={analyze} disabled={!imageBase64 || loading} style={{ flex: 1 }}>
                    {loading ? "⟳  SCANNING..." : "⚡  RUN APEX FX ANALYSIS"}
                  </button>
                  {image && (
                    <button onClick={() => { setImage(null); setImageBase64(null); setAnalysis(null); setError(null); }}
                      style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "14px 18px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: "pointer", borderRadius: 6, fontWeight: 600 }}>
                      CLEAR
                    </button>
                  )}
                </div>

                {error && <div style={{ background: dark ? "#2a000a" : "#fff0f3", border: "1px solid #cc0022", padding: "12px 16px", fontSize: 12, color: "#cc0022", borderRadius: 6, fontWeight: 600 }}>⚠ {error}</div>}

                {loading && (
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, padding: 24, textAlign: "center", borderRadius: 8 }}>
                    <div className="pulse" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#0088ff" }}>APEX FX SCANNING...</div>
                    <div style={{ marginTop: 10, fontSize: 11, color: t.textMuted }}>Reading patterns · Analyzing structure · Computing predictions</div>
                  </div>
                )}

                {analysis && !loading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                      {[{ label: "PAIR", value: analysis.pair, color: dark ? "#ffffff" : "#001133" }, { label: "TIMEFRAME", value: analysis.timeframe, color: t.textMuted }, { label: "BIAS", value: analysis.market_bias, color: biasColor(analysis.market_bias) }, { label: "SIGNAL", value: analysis.entry_signal, color: signalColor(analysis.entry_signal) }].map(({ label, value, color }) => (
                        <div key={label}>
                          <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, marginBottom: 5, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, marginBottom: 6, fontWeight: 600 }}>TRADE DURATION</div>
                        <div style={{ fontSize: 13, color: "#dd9900", fontWeight: 700 }}>⏱ {analysis.trade_duration}</div>
                      </div>
                      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, marginBottom: 6, fontWeight: 600 }}>TREND</div>
                        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>{analysis.trend}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, marginBottom: 8, fontWeight: 600 }}>SUPPORT / RESISTANCE</div>
                        <div style={{ fontSize: 11, color: "#00bb55", marginBottom: 6, fontWeight: 600 }}>▲ {analysis.support}</div>
                        <div style={{ fontSize: 11, color: "#ee2244", fontWeight: 600 }}>▼ {analysis.resistance}</div>
                      </div>
                      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, marginBottom: 8, fontWeight: 600 }}>PATTERNS</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {(analysis.patterns || []).map((p, i) => (
                            <span key={i} style={{ background: dark ? "#001a33" : "#e0eeff", border: `1px solid ${dark ? "#0d3a5a" : "#99bbdd"}`, color: dark ? "#4499cc" : "#0055aa", fontSize: 9, padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, letterSpacing: 2, color: t.textLabel, marginBottom: 10, fontWeight: 700 }}>NEXT 3 CANDLE PREDICTIONS</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {(analysis.candles || []).map((c) => (
                          <div key={c.number} style={{ background: t.bgCard, border: `2px solid ${dirColor(c.direction)}33`, borderRadius: 8, padding: 14, borderTop: `3px solid ${dirColor(c.direction)}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 10, color: t.textLabel, fontWeight: 700 }}>#{c.number}</span>
                              <span style={{ background: dirColor(c.direction) + "22", color: dirColor(c.direction), fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{c.direction === "UP" ? "▲ UP" : "▼ DOWN"}</span>
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: dirColor(c.direction), fontFamily: "'Orbitron', sans-serif", marginBottom: 2 }}>{c.confidence}%</div>
                            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 8, fontWeight: 600 }}>{c.strength}</div>
                            <div style={{ height: 5, background: dark ? "#0a1520" : "#e0eaf4", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                              <div style={{ width: `${c.confidence}%`, height: "100%", background: dirColor(c.direction), borderRadius: 3 }} />
                            </div>
                            <div style={{ fontSize: 10, color: t.textMuted, lineHeight: 1.5 }}>{c.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderLeft: `4px solid ${biasColor(analysis.market_bias)}`, borderRadius: 8, padding: "14px 18px" }}>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, marginBottom: 8, fontWeight: 700 }}>APEX FX SUMMARY</div>
                      <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.8 }}>{analysis.summary}</div>
                    </div>
                  </div>
                 )}
              </div>

              {/* History */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: t.textLabel, fontWeight: 700 }}>SCAN HISTORY ({history.length})</div>
                {history.length === 0 && (
                  <div style={{ border: `1px dashed ${t.borderDash}`, borderRadius: 8, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: t.textDim }}>No scans yet</div>
                  </div>
                )}
                {history.map((h, i) => (
                  <div key={i} onClick={() => setAnalysis(h.analysis)}
                    style={{ background: t.histBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: t.textLabel, fontWeight: 600 }}>#{history.length - i} · {h.time}</span>
                      <span style={{ background: signalColor(h.analysis.entry_signal) + "22", color: signalColor(h.analysis.entry_signal), fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{h.analysis.entry_signal}</span>
                    </div>
                    <img src={h.image} alt="" style={{ width: "100%", height: 55, objectFit: "cover", borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: t.text, fontWeight: 600 }}>{h.analysis.pair}</span>
                      <span style={{ fontSize: 11, color: biasColor(h.analysis.market_bias), fontWeight: 700 }}>{h.analysis.market_bias}</span>
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {(h.analysis.candles || []).map((c) => (
                        <div key={c.number} style={{ flex: 1, height: 4, borderRadius: 2, background: dirColor(c.direction) }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${t.border}`, padding: "8px 20px", display: "flex", justifyContent: "space-between", background: t.bgHeader }}>
          <div style={{ fontSize: 10, color: t.textDim }}>APEX FX · POWERED BY PRINCE X TOOLS</div>
          <div style={{ fontSize: 10, color: t.textDim }}>TRADING INVOLVES RISK</div>
        </div>
      </div>
    </>
  );
}
