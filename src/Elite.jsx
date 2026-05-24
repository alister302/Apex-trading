import { useState, useRef } from "react";

const GEMINI_API_KEY = "AIzaSyDLXA3uOQuQmJQanhcSQmCnPqaAJL2l4xU";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const ALL_TIMEFRAMES = ["1M","2M","3M","5M","10M","15M","30M","45M","1H","2H","3H","4H","6H","8H","12H","1D","3D","1W"];
const DURATIONS = ["30 min","1 hour","2 hours","3 hours","4 hours","6 hours","8 hours","12 hours","1 day","Custom"];
const TF_COLORS = ["#ff6644","#ffaa00","#44aaff","#aa66ff","#00cc88","#ff44aa"];

function buildPrompt(tfs, duration) {
  const tfList = tfs.map((tf, i) => `Image ${i+1}: ${tf} chart`).join(", ");
  return `You are the world's most elite Forex and Binary Options analyst. You have been given ${tfs.length} screenshots of the SAME pair at different timeframes: ${tfs.join(", ")}.

Perform MULTI-TIMEFRAME CONFLUENCE ANALYSIS to find ONE perfect high-probability trade. No guessing. Only trade when timeframes agree.

For each timeframe image analyze:
- Trend direction (bullish/bearish/neutral)
- Key patterns visible
- Momentum
- Support/resistance
- Verdict: CONFIRM, NEUTRAL, or AGAINST the trade

CONFLUENCE RULES:
- ${tfs.length}/${tfs.length} agree = ENTER NOW (90%+)
- ${Math.ceil(tfs.length * 0.75)}/${tfs.length} agree = WAIT FOR CONFIRMATION
- Less than that = AVOID
- Risk/reward minimum 3:1
- Duration: ${duration}

Images provided: ${tfList}

Respond ONLY with this exact JSON (no markdown):
{
  "pair": "detected pair",
  "direction": "LONG or SHORT",
  "action": "ENTER NOW or WAIT FOR CONFIRMATION or AVOID",
  "confluence_score": "${tfs.length}/${tfs.length}",
  "confidence": 88,
  "duration": "${duration}",
  "timeframes": [
    ${tfs.map((tf, i) => `{"tf":"${tf}","bias":"BULLISH or BEARISH or NEUTRAL","trend":"short description","key_pattern":"pattern","verdict":"CONFIRM or NEUTRAL or AGAINST"}`).join(',\n    ')}
  ],
  "entry": "exact entry price or zone",
  "stop_loss": "exact SL",
  "tp1": "first target",
  "tp2": "second target",
  "tp3": "third target",
  "risk_reward": "3.5:1",
  "sl_reason": "why this SL",
  "tp_reason": "why these TPs",
  "invalidation": "what would invalidate this trade",
  "warnings": ["warning1"],
  "summary": "3-4 sentence elite analysis summary"
}`;
}

export default function Elite({ dark }) {
  const [selectedTFs, setSelectedTFs] = useState(["4H","1H","15M","5M"]);
  const [images, setImages] = useState({});
  const [bases, setBases] = useState({});
  const [mimes, setMimes] = useState({});
  const [duration, setDuration] = useState("3 hours");
  const [customDuration, setCustomDuration] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [wins, setWins] = useState([]);
  const [showTFPicker, setShowTFPicker] = useState(false);
  const fileRefs = useRef({});
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
  };

  const toggleTF = (tf) => {
    setSelectedTFs(prev => {
      if (prev.includes(tf)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter(t => t !== tf);
        setImages(img => { const n={...img}; delete n[tf]; return n; });
        setBases(b => { const n={...b}; delete n[tf]; return n; });
        return next;
      }
      if (prev.length >= 6) return prev;
      return [...prev, tf];
    });
    setResult(null);
  };

  const processFile = (tf, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setMimes(m => ({ ...m, [tf]: file.type }));
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(img => ({ ...img, [tf]: e.target.result }));
      setBases(b => ({ ...b, [tf]: e.target.result.split(",")[1] }));
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const uploadCount = selectedTFs.filter(tf => bases[tf]).length;
  const allUploaded = uploadCount === selectedTFs.length;

  const actionColor = (a) => a === "ENTER NOW" ? "#00dd55" : a === "WAIT FOR CONFIRMATION" ? "#ffaa00" : "#ff2244";
  const verdictColor = (v) => v === "CONFIRM" ? "#00dd55" : v === "AGAINST" ? "#ff2244" : "#ffaa00";
  const dirColor = (d) => d === "LONG" ? "#00dd55" : "#ff2244";

  const analyze = async () => {
    if (!allUploaded) return;
    setLoading(true);
    setResult(null);
    setError(null);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));
    }, 100);

    const finalDuration = duration === "Custom" ? customDuration : duration;

    try {
      const parts = [{ text: buildPrompt(selectedTFs, finalDuration) }];
      selectedTFs.forEach((tf, i) => {
        parts.push({ text: `IMAGE ${i+1} — ${tf} CHART:` });
        parts.push({ inline_data: { mime_type: mimes[tf] || "image/png", data: bases[tf] } });
      });
      parts.push({ text: "Perform the full multi-timeframe confluence analysis and return ONLY the JSON." });

      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 2048 }
          }
        })
      });

      const data = await res.json();
      clearInterval(timerRef.current);
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));

      if (data.error) {
        setError(data.error.message.includes("quota") || data.error.message.includes("demand")
          ? "⏳ Rate limited — wait 60 seconds and try again"
          : "API Error: " + data.error.message);
        setLoading(false);
        return;
      }

      const rawParts = data.candidates?.[0]?.content?.parts || [];
      const raw = rawParts.map(p => p.text || "").join("");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const clean = jsonMatch ? jsonMatch[0] : raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

      if (parsed.action === "ENTER NOW") {
        setWins(prev => [{
          pair: parsed.pair,
          direction: parsed.direction,
          confidence: parsed.confidence,
          confluence: parsed.confluence_score,
          time: new Date().toLocaleTimeString(),
          tfs: selectedTFs.join("+")
        }, ...prev].slice(0, 5));
      }
    } catch (err) {
      clearInterval(timerRef.current);
      setError("Failed: " + err.message);
    }
    setLoading(false);
  };

  const clearAll = () => {
    setImages({});
    setBases({});
    setResult(null);
    setError(null);
    setElapsed(null);
  };

  return (
    <div style={{ flex: 1, background: t.bg, overflowY: "auto" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes popIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 10px #ffd70033}50%{box-shadow:0 0 30px #ffd70066}}
        .pop{animation:popIn 0.4s ease forwards}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        .glow-btn{animation:glow 2s infinite}
        .tf-chip{transition:all 0.15s;cursor:pointer}
        .tf-chip:hover{transform:scale(1.05)}
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffd700" }} />
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color: dark ? "#ffd700" : "#cc9900", letterSpacing: 3 }}>ELITE SYSTEM</span>
            <span style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>· Multi-TF Confluence</span>
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: i < wins.length ? "#ffd700" : (dark ? "#0a1520" : "#e0eaf4"), border: `2px solid ${i < wins.length ? "#ffd700" : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#000" }}>
                {i < wins.length ? "★" : ""}
              </div>
            ))}
            <span style={{ fontSize: 10, color: "#ffd700", fontFamily: "'IBM Plex Mono', monospace", marginLeft: 4 }}>{wins.length}/5</span>
          </div>
        </div>

        {/* TF Picker */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>SELECT TIMEFRAMES ({selectedTFs.length} selected · max 6)</div>
            <button onClick={() => setShowTFPicker(!showTFPicker)}
              style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, padding: "4px 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, cursor: "pointer", borderRadius: 4 }}>
              {showTFPicker ? "DONE" : "CHANGE"}
            </button>
          </div>

          {/* Selected TFs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: showTFPicker ? 12 : 0 }}>
            {selectedTFs.map((tf, i) => (
              <div key={tf} className="tf-chip"
                style={{ padding: "6px 14px", background: TF_COLORS[i % TF_COLORS.length] + "22", border: `2px solid ${TF_COLORS[i % TF_COLORS.length]}`, borderRadius: 6, fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 900, color: TF_COLORS[i % TF_COLORS.length], display: "flex", alignItems: "center", gap: 6 }}>
                {tf}
                {showTFPicker && (
                  <span onClick={() => toggleTF(tf)} style={{ fontSize: 12, cursor: "pointer", opacity: 0.7 }}>×</span>
                )}
              </div>
            ))}
          </div>

          {/* Full TF Grid picker */}
          {showTFPicker && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_TIMEFRAMES.map(tf => {
                const isSelected = selectedTFs.includes(tf);
                const idx = selectedTFs.indexOf(tf);
                return (
                  <button key={tf} onClick={() => toggleTF(tf)} className="tf-chip"
                    style={{ padding: "6px 12px", background: isSelected ? TF_COLORS[idx % TF_COLORS.length] + "22" : "transparent", border: `1px solid ${isSelected ? TF_COLORS[idx % TF_COLORS.length] : t.border}`, color: isSelected ? TF_COLORS[idx % TF_COLORS.length] : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>
                    {tf}
                  </button>
                );
              })}
              <div style={{ width: "100%", fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
                Tap to add/remove · Min 1 · Max 6 timeframes
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>TRADE DURATION</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                style={{ padding: "7px 14px", background: duration === d ? "#ffd700" : "transparent", border: `1px solid ${duration === d ? "#ffd700" : t.border}`, color: duration === d ? "#000" : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, cursor: "pointer", borderRadius: 6, transition: "all 0.2s" }}>
                {d}
              </button>
            ))}
          </div>
          {duration === "Custom" && (
            <input value={customDuration} onChange={e => setCustomDuration(e.target.value)}
              placeholder="e.g. 2.5 hours or 90 minutes"
              style={{ marginTop: 10, padding: "8px 12px", background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, borderRadius: 6, outline: "none", width: "100%" }} />
          )}
        </div>

        {/* Upload Grid — dynamic based on selected TFs */}
        <div style={{ display: "grid", gridTemplateColumns: selectedTFs.length <= 2 ? "1fr 1fr" : selectedTFs.length <= 4 ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {selectedTFs.map((tf, i) => {
            const color = TF_COLORS[i % TF_COLORS.length];
            if (!fileRefs.current[tf]) fileRefs.current[tf] = { current: null };
            return (
              <div key={tf}
                style={{ border: `2px dashed ${images[tf] ? color : t.borderDash}`, background: images[tf] ? "transparent" : t.inputBg, borderRadius: 10, padding: 10, textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => fileRefs.current[tf]?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); processFile(tf, e.dataTransfer.files[0]); }}
              >
                <input ref={el => fileRefs.current[tf] = el} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => processFile(tf, e.target.files[0])} />
                {images[tf] ? (
                  <>
                    <img src={images[tf]} alt={tf} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 900, color }}>{tf}</span>
                      <span style={{ fontSize: 9, color: "#00dd55", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>✓ LOADED</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 22, marginBottom: 4, opacity: 0.3 }}>📊</div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color, marginBottom: 2 }}>{tf}</div>
                    <div style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>tap to upload</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>CHARTS LOADED</span>
            <span style={{ fontSize: 10, color: allUploaded ? "#00dd55" : "#ffaa00", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{uploadCount}/{selectedTFs.length}</span>
          </div>
          <div style={{ height: 4, background: dark ? "#0a1520" : "#e0eaf4", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${(uploadCount / selectedTFs.length) * 100}%`, height: "100%", background: allUploaded ? "#00dd55" : "#ffaa00", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Analyze Button */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button onClick={analyze} disabled={!allUploaded || loading}
            className={allUploaded && !loading ? "glow-btn" : ""}
            style={{ flex: 1, background: !allUploaded || loading ? (dark ? "#0a1520" : "#e0eaf4") : "linear-gradient(135deg,#cc9900,#ffd700)", border: "none", color: !allUploaded || loading ? t.textDim : "#000", padding: "16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 900, letterSpacing: 2, cursor: !allUploaded || loading ? "not-allowed" : "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s" }}>
            {loading
              ? <><span className="spin">⟳</span> ANALYZING {selectedTFs.length} TIMEFRAMES... {elapsed}s</>
              : !allUploaded
              ? `UPLOAD ${selectedTFs.length - uploadCount} MORE CHART${selectedTFs.length - uploadCount > 1 ? "S" : ""}`
              : `★ RUN ELITE CONFLUENCE ANALYSIS (${selectedTFs.length}TF)`}
          </button>
          {uploadCount > 0 && (
            <button onClick={clearAll}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, padding: "16px 16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: "pointer", borderRadius: 8 }}>
              CLEAR
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: dark ? "#2a000a" : "#fff0f3", border: "1px solid #cc0022", padding: "12px 16px", fontSize: 12, color: "#cc0022", borderRadius: 6, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 14 }}>⚠ {error}</div>
        )}

        {loading && (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: 24, textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#ffd700", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12 }}>ELITE MULTI-TIMEFRAME ANALYSIS IN PROGRESS</div>
            {selectedTFs.map(tf => (
              <div key={tf} style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 2 }}>Analyzing {tf} chart...</div>
            ))}
            <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 2 }}>Computing confluence score...</div>
            <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 2 }}>Calculating TP/SL levels...</div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="pop" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Signal Banner */}
            <div style={{ background: actionColor(result.action) + "15", border: `2px solid ${actionColor(result.action)}55`, borderRadius: 12, padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>ELITE SIGNAL</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: actionColor(result.action), letterSpacing: 2, marginBottom: 6 }}>{result.action}</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 26, fontWeight: 900, color: dirColor(result.direction) }}>{result.direction === "LONG" ? "▲" : "▼"} {result.direction}</div>
                <div style={{ fontSize: 11, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>{result.pair} · {result.duration}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>CONFLUENCE</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 900, color: "#ffd700" }}>{result.confluence_score}</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: result.confidence >= 85 ? "#00dd55" : result.confidence >= 70 ? "#ffaa00" : "#ff2244" }}>{result.confidence}%</div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{result.risk_reward} R/R</div>
              </div>
            </div>

            {/* TF Breakdown */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 9, letterSpacing: 3, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>TIMEFRAME CONFLUENCE BREAKDOWN</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min((result.timeframes||[]).length, 3)}, 1fr)` }}>
                {(result.timeframes || []).map((tf, i) => (
                  <div key={i} style={{ padding: "12px", borderRight: `1px solid ${t.border}`, borderBottom: i >= (result.timeframes.length - (result.timeframes.length % 3 || 3)) ? "none" : `1px solid ${t.border}` }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900, color: TF_COLORS[i % TF_COLORS.length], marginBottom: 4 }}>{tf.tf}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: verdictColor(tf.verdict), fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>{tf.verdict}</div>
                    <div style={{ fontSize: 9, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>{tf.bias}</div>
                    <div style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.4 }}>{tf.key_pattern}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade Plan */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 9, letterSpacing: 3, color: "#ffd700", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>★ ELITE TRADE PLAN · {result.risk_reward} RISK/REWARD</div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "⚡ ENTRY", value: result.entry, color: "#4499ff", bg: dark ? "#001833" : "#e8f4ff", border: "#0066ff44" },
                  { label: "🎯 TP1", value: result.tp1, color: "#00cc55", bg: dark ? "#001a0d" : "#e8fff3", border: "#00cc5544" },
                  { label: "🎯 TP2", value: result.tp2, color: "#00ee77", bg: dark ? "#002211" : "#d8ffe8", border: "#00ee7744" },
                  { label: "🎯 TP3", value: result.tp3, color: "#00ffaa", bg: dark ? "#002a15" : "#c8ffd8", border: "#00ffaa44" },
                  { label: "🛑 STOP LOSS", value: result.stop_loss, color: "#ff2244", bg: dark ? "#1a0005" : "#fff0f3", border: "#ff224444" },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: bg, borderRadius: 8, border: `1px solid ${border}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'Orbitron', sans-serif" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#ff2244", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>SL REASON</div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{result.sl_reason}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#00cc55", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 4 }}>TP REASON</div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{result.tp_reason}</div>
                </div>
              </div>
            </div>

            {/* Invalidation */}
            <div style={{ background: dark ? "#1a1000" : "#fffbe8", border: `1px solid #ffaa0044`, borderLeft: "4px solid #ffaa00", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#ffaa00", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 6 }}>⚠ TRADE INVALIDATION</div>
              <div style={{ fontSize: 11, color: dark ? "#cc9900" : "#886600", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6 }}>{result.invalidation}</div>
            </div>

            {/* Summary */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderLeft: "4px solid #ffd700", borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#ffd700", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 8 }}>★ ELITE SUMMARY</div>
              <div style={{ fontSize: 12, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.8 }}>{result.summary}</div>
              <div style={{ marginTop: 10, fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>⏱ Analyzed in {elapsed}s · {selectedTFs.length} timeframes</div>
            </div>

          </div>
        )}

        {/* Win Log */}
        {wins.length > 0 && (
          <div style={{ background: t.bgCard, border: `1px solid #ffd70033`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#ffd700", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>★ TODAY'S WIN LOG ({wins.length}/5)</div>
            {wins.map((w, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: dark ? "#001a0d" : "#e8fff3", borderRadius: 6, marginBottom: 6, border: "1px solid #00dd5522" }}>
                <span style={{ fontSize: 10, color: "#ffd700", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>★ {i+1}</span>
                <span style={{ fontSize: 10, color: dirColor(w.direction), fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{w.pair} {w.direction}</span>
                <span style={{ fontSize: 9, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{w.tfs}</span>
                <span style={{ fontSize: 10, color: "#00dd55", fontFamily: "'IBM Plex Mono', monospace" }}>{w.confidence}%</span>
                <span style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{w.time}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
