import { useState, useEffect } from "react";

const questions = [
  {
    id: 1,
    question: "What does a GREEN (bullish) candle tell you?",
    chart: "bullish",
    options: ["Price went DOWN during this period", "Price went UP during this period", "Price didn't move at all", "Volume was very high"],
    answer: 1,
    explanation: "A green candle means the closing price was HIGHER than the opening price. Buyers won this battle. The bigger the green body, the stronger the buying pressure."
  },
  {
    id: 2,
    question: "You see a candle with a very long lower wick and a small body at the top. What pattern is this?",
    chart: "hammer",
    options: ["Shooting Star", "Doji", "Hammer", "Marubozu"],
    answer: 2,
    explanation: "This is a HAMMER. The long lower wick shows sellers pushed price down hard, but buyers fought back and pushed it back up. It's a bullish reversal signal, especially at the bottom of a downtrend."
  },
  {
    id: 3,
    question: "A Doji candle has almost no body. What does this mean?",
    chart: "doji",
    options: ["Strong bullish momentum", "Strong bearish momentum", "Buyers and sellers are equal — indecision", "Price is at support"],
    answer: 2,
    explanation: "A Doji means the open and close prices are almost identical. Buyers and sellers fought to a draw. This shows INDECISION and often signals an upcoming reversal, especially after a long trend."
  },
  {
    id: 4,
    question: "What is a Bearish Engulfing pattern?",
    chart: "engulfing_bear",
    options: [
      "A small green candle followed by a big red candle that covers it completely",
      "A small red candle followed by a big green candle",
      "Two red candles of equal size",
      "A red candle with very long wicks"
    ],
    answer: 0,
    explanation: "Bearish Engulfing = small green candle + big red candle that completely 'engulfs' the green body. It signals bears have taken total control from bulls. Strong SELL signal at the top of an uptrend."
  },
  {
    id: 5,
    question: "You see THREE consecutive green candles, each closing higher than the last. What is this called?",
    chart: "soldiers",
    options: ["Morning Star", "Three White Soldiers", "Bullish Harami", "Triple Top"],
    answer: 1,
    explanation: "THREE WHITE SOLDIERS — three strong green candles showing sustained, powerful buying. Each opens inside the previous candle body and closes higher. This confirms a strong uptrend. High probability BUY signal."
  },
  {
    id: 6,
    question: "A Shooting Star appears at the TOP of an uptrend. What should you do?",
    chart: "shooting_star",
    options: ["BUY immediately — price will keep going up", "WAIT — no signal yet", "SELL — it signals a bearish reversal", "It doesn't matter, ignore it"],
    answer: 2,
    explanation: "A Shooting Star at the top of an uptrend is a strong SELL signal. The long upper wick shows buyers tried to push price higher but sellers rejected it hard. Price is likely to reverse downward."
  },
  {
    id: 7,
    question: "What is the CORRECT definition of Support?",
    chart: null,
    options: [
      "A level where sellers are strong enough to stop price rising",
      "A level where buyers are strong enough to stop price falling",
      "The highest price in a trend",
      "A moving average line"
    ],
    answer: 1,
    explanation: "Support is a price level (the FLOOR) where buying pressure is strong enough to prevent price from falling further. The more times price bounces off a level, the stronger that support is."
  },
  {
    id: 8,
    question: "A Marubozu candle has NO wicks at all. What does this tell you?",
    chart: "marubozu",
    options: [
      "The market was closed during this period",
      "Price barely moved",
      "One side had COMPLETE control — very strong momentum",
      "It's always a reversal signal"
    ],
    answer: 2,
    explanation: "A Marubozu (no wicks) means one side had total control for the entire candle. A green Marubozu: buyers dominated from open to close, never looked back. Very strong continuation signal."
  },
  {
    id: 9,
    question: "When should you enter a trade on OlympTrade?",
    chart: null,
    options: [
      "As soon as you see a pattern forming on an open candle",
      "After the candle has CLOSED and confirmed the pattern",
      "Right when the market opens",
      "After 3 consecutive losses to recover"
    ],
    answer: 1,
    explanation: "ALWAYS wait for the candle to CLOSE before entering. An open candle can still change direction completely. The pattern is only confirmed when the candle closes. Patience = profits."
  },
  {
    id: 10,
    question: "You lost 2 trades in a row. What should you do?",
    chart: null,
    options: [
      "Double your trade size to recover losses faster",
      "Enter more trades to average out",
      "Stop trading, take a break, come back with a clear mind",
      "Switch to a shorter timeframe"
    ],
    answer: 2,
    explanation: "After 2 consecutive losses, STOP. Revenge trading is the #1 account killer. Your mind is emotional and not thinking clearly. Take a break. The market will always be there. Your capital might not be if you keep trading emotionally."
  },
  {
    id: 11,
    question: "What is the MAXIMUM you should risk per trade (the 2% rule)?",
    chart: null,
    options: ["50% of your account", "20% of your account", "10% of your account", "2% of your account"],
    answer: 3,
    explanation: "The 2% rule: Never risk more than 2% of your account on a single trade. With $100, that's just $2. This means even 10 losses in a row only costs you 20%, and you can recover. Big losses from big trades destroy accounts permanently."
  },
  {
    id: 12,
    question: "A Morning Star pattern consists of which 3 candles?",
    chart: "morningstar",
    options: [
      "Big green → Small candle → Big red",
      "Big red → Small candle/Doji → Big green",
      "Three small green candles",
      "Big red → Big green → Small candle"
    ],
    answer: 1,
    explanation: "Morning Star = Big RED (bears control) → Small candle or Doji (indecision/transition) → Big GREEN (bulls take over). This bullish reversal appears at the bottom of downtrends. The bigger the 3rd candle, the stronger the signal."
  },
  {
    id: 13,
    question: "OTC markets on OlympTrade are available:",
    chart: null,
    options: ["Only on weekdays 9am-5pm", "Only during London session", "24/7 including weekends", "Only when real markets are open"],
    answer: 2,
    explanation: "OTC (Over The Counter) pairs are synthetic markets available 24/7, including nights and weekends. They use algorithmic price generation that often follows very clean, textbook candlestick patterns — great for analysis with APEX!"
  },
  {
    id: 14,
    question: "What does a long UPPER wick on a candle tell you?",
    chart: "upper_wick",
    options: [
      "Buyers pushed price up but sellers rejected it — bearish signal",
      "Sellers pushed price down but buyers recovered it — bullish signal",
      "The market was very volatile with no direction",
      "It always means price will continue up"
    ],
    answer: 0,
    explanation: "A long upper wick means price went up (buyers tried) but was REJECTED by sellers who pushed it back down. This is a bearish signal — sellers are strong at that level. It's the basis of Shooting Star and Bearish Pinbar patterns."
  },
  {
    id: 15,
    question: "Which timeframe gives the MOST reliable signals for beginners?",
    chart: null,
    options: ["5 seconds — fastest signals", "30 seconds — quick trades", "1 minute — balanced speed and reliability", "5 minutes — slower but stronger signals"],
    answer: 3,
    explanation: "5-minute candles give the most reliable signals for beginners. More time = more data = cleaner patterns = fewer false signals. Start with 5min to build confidence, then move to 1min as you improve. Never start with 5-second candles!"
  }
];

function CandleChart({ type, dark }) {
  const green = "#00cc55";
  const red = "#ee2244";
  const muted = dark ? "#334455" : "#99aabb";

  const charts = {
    bullish: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <line x1="60" y1="10" x2="60" y2="25" stroke={green} strokeWidth="2"/>
        <rect x="42" y="25" width="36" height="55" fill={green} rx="3"/>
        <line x1="60" y1="80" x2="60" y2="92" stroke={green} strokeWidth="2"/>
        <text x="60" y="8" fill={green} fontSize="8" textAnchor="middle" fontFamily="monospace">HIGH</text>
        <text x="60" y="99" fill={green} fontSize="8" textAnchor="middle" fontFamily="monospace">LOW</text>
      </svg>
    ),
    hammer: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <line x1="60" y1="10" x2="60" y2="20" stroke={green} strokeWidth="2"/>
        <rect x="42" y="20" width="36" height="22" fill={green} rx="3"/>
        <line x1="60" y1="42" x2="60" y2="92" stroke={green} strokeWidth="2"/>
      </svg>
    ),
    doji: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <line x1="60" y1="10" x2="60" y2="48" stroke={muted} strokeWidth="2"/>
        <rect x="35" y="48" width="50" height="4" fill={muted} rx="1"/>
        <line x1="60" y1="52" x2="60" y2="92" stroke={muted} strokeWidth="2"/>
      </svg>
    ),
    engulfing_bear: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <rect x="28" y="38" width="28" height="30" fill={green} rx="2"/>
        <rect x="64" y="20" width="28" height="65" fill={red} rx="2"/>
      </svg>
    ),
    soldiers: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <rect x="8" y="60" width="26" height="35" fill={green} rx="2"/>
        <rect x="44" y="40" width="26" height="40" fill={green} rx="2"/>
        <rect x="80" y="18" width="26" height="45" fill={green} rx="2"/>
      </svg>
    ),
    shooting_star: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <line x1="60" y1="8" x2="60" y2="55" stroke={red} strokeWidth="2"/>
        <rect x="42" y="55" width="36" height="20" fill={red} rx="3"/>
        <line x1="60" y1="75" x2="60" y2="88" stroke={red} strokeWidth="2"/>
      </svg>
    ),
    marubozu: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <rect x="30" y="10" width="60" height="80" fill={green} rx="3"/>
        <text x="60" y="56" fill="rgba(0,0,0,0.5)" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="700">NO WICKS</text>
      </svg>
    ),
    morningstar: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <rect x="5" y="15" width="28" height="55" fill={red} rx="2"/>
        <rect x="44" y="68" width="22" height="14" fill={muted} rx="2"/>
        <rect x="82" y="28" width="28" height="50" fill={green} rx="2"/>
      </svg>
    ),
    upper_wick: (
      <svg width="120" height="100" viewBox="0 0 120 100">
        <line x1="60" y1="8" x2="60" y2="45" stroke={red} strokeWidth="2"/>
        <rect x="42" y="45" width="36" height="25" fill={red} rx="3"/>
        <line x1="60" y1="70" x2="60" y2="82" stroke={red} strokeWidth="2"/>
        <text x="60" y="6" fill={red} fontSize="7" textAnchor="middle" fontFamily="monospace">REJECTION</text>
      </svg>
    ),
  };

  if (!type || !charts[type]) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 0" }}>
      {charts[type]}
    </div>
  );
}

export default function Quiz({ dark }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  const t = {
    bg: dark ? "#050a0f" : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.9)" : "#ffffff",
    bgOption: dark ? "rgba(0,30,60,0.6)" : "#f0f6ff",
    border: dark ? "#0d2a42" : "#d0dce8",
    text: dark ? "#c8d8e8" : "#1a2a3a",
    textMuted: dark ? "#8899aa" : "#445566",
    textDim: dark ? "#445566" : "#778899",
    correctBg: dark ? "#002211" : "#e8fff3",
    wrongBg: dark ? "#220008" : "#fff0f3",
  };

  useEffect(() => {
    if (!timerActive) return;
    if (timer === 0) { handleConfirm(); return; }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, timerActive]);

  const startQuiz = () => {
    setStarted(true);
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setResults([]);
    setFinished(false);
    setTimer(20);
    setTimerActive(true);
  };

  const handleSelect = (i) => {
    if (confirmed) return;
    setSelected(i);
  };

  const handleConfirm = () => {
    if (confirmed) return;
    setTimerActive(false);
    setConfirmed(true);
    const q = questions[current];
    const isCorrect = selected === q.answer;
    if (isCorrect) setScore(s => s + 1);
    setResults(prev => [...prev, { correct: isCorrect, selected }]);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
      setTimer(20);
      setTimerActive(true);
    }
  };

  const q = questions[current];
  const pct = Math.round((score / questions.length) * 100);
  const grade = pct >= 90 ? { label: "MASTER TRADER", color: "#00cc55", emoji: "🏆" }
    : pct >= 70 ? { label: "ADVANCED", color: "#0088ff", emoji: "⭐" }
    : pct >= 50 ? { label: "INTERMEDIATE", color: "#ffaa00", emoji: "📈" }
    : { label: "KEEP STUDYING", color: "#ee4444", emoji: "📚" };

  if (!started) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎓</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, color: dark ? "#fff" : "#001133", marginBottom: 8, letterSpacing: 2 }}>PATTERN QUIZ</div>
        <div style={{ fontSize: 12, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>Test your candle knowledge</div>
        <div style={{ fontSize: 11, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 32 }}>{questions.length} questions · 20 seconds each · No pressure</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
          {[["📊", "Candle Patterns"], ["🧠", "Psychology"], ["🛡️", "Risk Rules"]].map(([icon, label]) => (
            <div key={label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: t.textMuted }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>{label}
            </div>
          ))}
        </div>
        <button onClick={startQuiz} style={{ background: "linear-gradient(135deg,#0066ff,#0044bb)", border: "none", color: "#fff", padding: "16px 48px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: 2, cursor: "pointer", borderRadius: 8, width: "100%" }}>
          ⚡ START QUIZ
        </button>
      </div>
    </div>
  );

  if (finished) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, padding: 24 }}>
      <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{grade.emoji}</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: grade.color, marginBottom: 6, letterSpacing: 2 }}>{grade.label}</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: grade.color, fontFamily: "'Orbitron', sans-serif", marginBottom: 4 }}>{pct}%</div>
        <div style={{ fontSize: 12, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 28 }}>{score} correct out of {questions.length} questions</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, maxHeight: 300, overflowY: "auto" }}>
          {results.map((r, i) => (
            <div key={i} style={{ background: r.correct ? (dark ? "#001a0d" : "#e8fff3") : (dark ? "#1a0005" : "#fff0f3"), border: `1px solid ${r.correct ? "#00aa4433" : "#ee224433"}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
              <span style={{ fontSize: 16 }}>{r.correct ? "✅" : "❌"}</span>
              <div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 2 }}>Q{i + 1}</div>
                <div style={{ fontSize: 11, color: t.text, fontFamily: "'IBM Plex Mono', monospace" }}>{questions[i].question.slice(0, 60)}...</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={startQuiz} style={{ flex: 1, background: "linear-gradient(135deg,#0066ff,#0044bb)", border: "none", color: "#fff", padding: "14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: "pointer", borderRadius: 8 }}>
            🔄 RETRY QUIZ
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: t.bg, padding: "20px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 620, width: "100%" }}>

        {/* Progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>QUESTION {current + 1} OF {questions.length}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>SCORE: {score}</div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${timer <= 5 ? "#ee2244" : "#0066ff"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: timer <= 5 ? "#ee2244" : (dark ? "#4499ff" : "#0044cc"), transition: "color 0.3s" }}>
              {timer}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: dark ? "#0a1520" : "#e0eaf4", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ width: `${((current) / questions.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#0066ff,#00aaff)", borderRadius: 2, transition: "width 0.3s" }} />
        </div>

        {/* Question card */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: dark ? "#ffffff" : "#001133", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, marginBottom: 4 }}>{q.question}</div>
          {q.chart && <CandleChart type={q.chart} dark={dark} />}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {q.options.map((opt, i) => {
            let bg = t.bgOption;
            let border = t.border;
            let color = t.text;
            if (confirmed) {
              if (i === q.answer) { bg = dark ? "#002211" : "#e8fff3"; border = "#00cc55"; color = "#00cc55"; }
              else if (i === selected && i !== q.answer) { bg = dark ? "#220008" : "#fff0f3"; border = "#ee2244"; color = "#ee2244"; }
            } else if (selected === i) {
              bg = dark ? "#001833" : "#ddeeff"; border = "#0066ff"; color = dark ? "#4499ff" : "#0044cc";
            }
            return (
              <button key={i} onClick={() => handleSelect(i)}
                style={{ background: bg, border: `2px solid ${border}`, borderRadius: 8, padding: "13px 16px", textAlign: "left", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color, cursor: confirmed ? "default" : "pointer", transition: "all 0.2s", fontWeight: selected === i || (confirmed && i === q.answer) ? 700 : 400, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {confirmed && i === q.answer ? "✓" : confirmed && i === selected && i !== q.answer ? "✗" : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {confirmed && (
          <div style={{ background: selected === q.answer ? (dark ? "#001a0d" : "#e8fff3") : (dark ? "#1a0005" : "#fff0f3"), border: `1px solid ${selected === q.answer ? "#00aa4444" : "#ee224444"}`, borderLeft: `4px solid ${selected === q.answer ? "#00cc55" : "#ee2244"}`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: selected === q.answer ? "#00cc55" : "#ee2244", letterSpacing: 2, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
              {selected === q.answer ? "✅ CORRECT!" : "❌ INCORRECT"}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>{q.explanation}</div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {!confirmed ? (
            <button onClick={handleConfirm} disabled={selected === null}
              style={{ flex: 1, background: selected === null ? (dark ? "#0a1520" : "#e0eaf4") : "linear-gradient(135deg,#0066ff,#0044bb)", border: "none", color: selected === null ? t.textDim : "#fff", padding: "14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: selected === null ? "not-allowed" : "pointer", borderRadius: 8, transition: "all 0.2s" }}>
              CONFIRM ANSWER
            </button>
          ) : (
            <button onClick={handleNext}
              style={{ flex: 1, background: "linear-gradient(135deg,#0066ff,#0044bb)", border: "none", color: "#fff", padding: "14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: "pointer", borderRadius: 8 }}>
              {current + 1 >= questions.length ? "🏆 SEE RESULTS" : "NEXT QUESTION →"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
