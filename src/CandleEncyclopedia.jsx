import { useState } from "react";

const CANDLES = [
  // ── SINGLE CANDLE PATTERNS ──────────────────────────────────────
  {
    category: "SINGLE CANDLE",
    name: "Hammer",
    emoji: "🔨",
    signal: "BUY",
    reliability: 85,
    description: "Small body at top, long lower wick (2x body). Appears after downtrend.",
    whatHappens: "Sellers pushed price down but buyers rejected the lows strongly. Bulls are taking control.",
    tradingAction: "Open BUY after hammer closes. Stop below hammer low.",
    duration: { min: 2, max: 5, best: 3, note: "Wait for next candle to confirm green" },
    shape: "hammer",
    color: "#00dd55",
  },
  {
    category: "SINGLE CANDLE",
    name: "Shooting Star",
    emoji: "⭐",
    signal: "SELL",
    reliability: 83,
    description: "Small body at bottom, long upper wick (2x body). Appears after uptrend.",
    whatHappens: "Buyers pushed price up but sellers rejected the highs strongly. Bears taking control.",
    tradingAction: "Open SELL after shooting star closes. Stop above star high.",
    duration: { min: 2, max: 5, best: 3, note: "Wait for next candle to confirm red" },
    shape: "shootingstar",
    color: "#ff2244",
  },
  {
    category: "SINGLE CANDLE",
    name: "Doji",
    emoji: "➕",
    signal: "WAIT",
    reliability: 60,
    description: "Open and close are almost equal. Wicks on both sides.",
    whatHappens: "Market is in indecision. Neither bulls nor bears in control.",
    tradingAction: "Wait for next candle direction before entering. Do NOT trade doji alone.",
    duration: { min: 0, max: 0, best: 0, note: "Wait — no trade on doji alone" },
    shape: "doji",
    color: "#ffaa00",
  },
  {
    category: "SINGLE CANDLE",
    name: "Dragonfly Doji",
    emoji: "🐉",
    signal: "BUY",
    reliability: 80,
    description: "Open and close at top, very long lower wick. No upper wick.",
    whatHappens: "Sellers tried hard but buyers completely rejected lows. Very bullish.",
    tradingAction: "Open BUY after dragonfly closes. Strong reversal signal from downtrend.",
    duration: { min: 2, max: 4, best: 3, note: "Strong signal — enter immediately" },
    shape: "dragonfly",
    color: "#00dd55",
  },
  {
    category: "SINGLE CANDLE",
    name: "Gravestone Doji",
    emoji: "🪦",
    signal: "SELL",
    reliability: 80,
    description: "Open and close at bottom, very long upper wick. No lower wick.",
    whatHappens: "Buyers tried hard but sellers completely rejected highs. Very bearish.",
    tradingAction: "Open SELL after gravestone closes. Strong reversal signal from uptrend.",
    duration: { min: 2, max: 4, best: 3, note: "Strong signal — enter immediately" },
    shape: "gravestone",
    color: "#ff2244",
  },
  {
    category: "SINGLE CANDLE",
    name: "Bull Marubozu",
    emoji: "💪",
    signal: "BUY",
    reliability: 78,
    description: "Full green body, no wicks. Open=Low, Close=High.",
    whatHappens: "Bulls were in full control the entire candle. Strong momentum.",
    tradingAction: "Buy continuation. Price likely continues up next 2-3 candles.",
    duration: { min: 1, max: 3, best: 2, note: "Quick trade — momentum continuation" },
    shape: "bullmarubozu",
    color: "#00dd55",
  },
  {
    category: "SINGLE CANDLE",
    name: "Bear Marubozu",
    emoji: "🐻",
    signal: "SELL",
    reliability: 78,
    description: "Full red body, no wicks. Open=High, Close=Low.",
    whatHappens: "Bears were in full control the entire candle. Strong downward momentum.",
    tradingAction: "Sell continuation. Price likely continues down next 2-3 candles.",
    duration: { min: 1, max: 3, best: 2, note: "Quick trade — momentum continuation" },
    shape: "bearmarubozu",
    color: "#ff2244",
  },
  {
    category: "SINGLE CANDLE",
    name: "Spinning Top",
    emoji: "🌀",
    signal: "WAIT",
    reliability: 50,
    description: "Small body, equal wicks on both sides.",
    whatHappens: "Market is completely undecided. Both bulls and bears fighting equally.",
    tradingAction: "Do not trade. Wait for a clear directional candle to follow.",
    duration: { min: 0, max: 0, best: 0, note: "No trade — wait for direction" },
    shape: "spinningtop",
    color: "#ffaa00",
  },
  {
    category: "SINGLE CANDLE",
    name: "Inverted Hammer",
    emoji: "🔻",
    signal: "BUY",
    reliability: 65,
    description: "Small body at bottom, long upper wick. Appears after downtrend.",
    whatHappens: "Buyers tried to push up but failed — however shows buying interest returning.",
    tradingAction: "Wait for confirmation candle. Buy only if next candle is green.",
    duration: { min: 2, max: 4, best: 3, note: "Must wait for green confirmation candle" },
    shape: "invertedhammer",
    color: "#00aaff",
  },
  {
    category: "SINGLE CANDLE",
    name: "Hanging Man",
    emoji: "🪢",
    signal: "SELL",
    reliability: 70,
    description: "Small body at top, long lower wick. Appears after uptrend.",
    whatHappens: "Looks like hammer but in uptrend — sellers starting to appear. Warning sign.",
    tradingAction: "Wait for red confirmation candle then sell.",
    duration: { min: 2, max: 4, best: 3, note: "Must confirm with red candle" },
    shape: "hammer",
    color: "#ff6644",
  },

  // ── TWO CANDLE PATTERNS ──────────────────────────────────────────
  {
    category: "TWO CANDLE",
    name: "Bullish Engulfing",
    emoji: "🟢",
    signal: "BUY",
    reliability: 88,
    description: "Large green candle completely covers previous red candle body.",
    whatHappens: "Bulls completely overpowered bears. Strong reversal from downtrend.",
    tradingAction: "Buy immediately when engulfing candle closes. Very reliable signal.",
    duration: { min: 2, max: 5, best: 3, note: "Enter immediately — very strong signal" },
    shape: "bullengulf",
    color: "#00dd55",
  },
  {
    category: "TWO CANDLE",
    name: "Bearish Engulfing",
    emoji: "🔴",
    signal: "SELL",
    reliability: 88,
    description: "Large red candle completely covers previous green candle body.",
    whatHappens: "Bears completely overpowered bulls. Strong reversal from uptrend.",
    tradingAction: "Sell immediately when engulfing candle closes. Very reliable signal.",
    duration: { min: 2, max: 5, best: 3, note: "Enter immediately — very strong signal" },
    shape: "bearengulf",
    color: "#ff2244",
  },
  {
    category: "TWO CANDLE",
    name: "Tweezer Bottom",
    emoji: "🔧",
    signal: "BUY",
    reliability: 75,
    description: "Two candles with same low. First red, second green.",
    whatHappens: "Price tested same level twice and bounced. Strong support level found.",
    tradingAction: "Buy after second candle closes green. Stop below the equal lows.",
    duration: { min: 2, max: 4, best: 3, note: "Good setup — support confirmed" },
    shape: "tweezerbottom",
    color: "#00dd55",
  },
  {
    category: "TWO CANDLE",
    name: "Tweezer Top",
    emoji: "🔧",
    signal: "SELL",
    reliability: 75,
    description: "Two candles with same high. First green, second red.",
    whatHappens: "Price tested same level twice and rejected. Strong resistance level found.",
    tradingAction: "Sell after second candle closes red. Stop above the equal highs.",
    duration: { min: 2, max: 4, best: 3, note: "Good setup — resistance confirmed" },
    shape: "tweezertop",
    color: "#ff2244",
  },
  {
    category: "TWO CANDLE",
    name: "Piercing Line",
    emoji: "🗡️",
    signal: "BUY",
    reliability: 77,
    description: "Red candle followed by green that opens below low and closes above 50% of red body.",
    whatHappens: "Bears pushed down but bulls recovered strongly above midpoint. Bullish reversal.",
    tradingAction: "Buy after green candle closes. Appears after downtrend.",
    duration: { min: 2, max: 4, best: 3, note: "Good reversal — buy the close" },
    shape: "piercing",
    color: "#00dd55",
  },
  {
    category: "TWO CANDLE",
    name: "Dark Cloud Cover",
    emoji: "🌑",
    signal: "SELL",
    reliability: 77,
    description: "Green candle followed by red that opens above high and closes below 50% of green body.",
    whatHappens: "Bulls pushed up but bears recovered strongly below midpoint. Bearish reversal.",
    tradingAction: "Sell after red candle closes. Appears after uptrend.",
    duration: { min: 2, max: 4, best: 3, note: "Good reversal — sell the close" },
    shape: "darkcloud",
    color: "#ff2244",
  },
  {
    category: "TWO CANDLE",
    name: "Bullish Harami",
    emoji: "🤰",
    signal: "BUY",
    reliability: 65,
    description: "Small green candle inside previous large red candle.",
    whatHappens: "Selling momentum slowing. Bulls starting to appear inside bearish candle.",
    tradingAction: "Wait for confirmation. Buy only if next candle breaks above harami high.",
    duration: { min: 2, max: 4, best: 3, note: "Needs confirmation — not strong alone" },
    shape: "bullharami",
    color: "#00aaff",
  },
  {
    category: "TWO CANDLE",
    name: "Bearish Harami",
    emoji: "🤰",
    signal: "SELL",
    reliability: 65,
    description: "Small red candle inside previous large green candle.",
    whatHappens: "Buying momentum slowing. Bears starting to appear inside bullish candle.",
    tradingAction: "Wait for confirmation. Sell only if next candle breaks below harami low.",
    duration: { min: 2, max: 4, best: 3, note: "Needs confirmation — not strong alone" },
    shape: "bearharami",
    color: "#ff6644",
  },

  // ── THREE CANDLE PATTERNS ────────────────────────────────────────
  {
    category: "THREE CANDLE",
    name: "Morning Star",
    emoji: "🌅",
    signal: "BUY",
    reliability: 92,
    description: "Red candle → small doji/spinning top → large green candle.",
    whatHappens: "Bears losing power (doji), then bulls take full control. Strong reversal from downtrend.",
    tradingAction: "Buy when third green candle closes. One of the most reliable patterns.",
    duration: { min: 3, max: 6, best: 4, note: "Very strong — hold longer" },
    shape: "morningstar",
    color: "#00dd55",
  },
  {
    category: "THREE CANDLE",
    name: "Evening Star",
    emoji: "🌆",
    signal: "SELL",
    reliability: 92,
    description: "Green candle → small doji/spinning top → large red candle.",
    whatHappens: "Bulls losing power (doji), then bears take full control. Strong reversal from uptrend.",
    tradingAction: "Sell when third red candle closes. One of the most reliable patterns.",
    duration: { min: 3, max: 6, best: 4, note: "Very strong — hold longer" },
    shape: "eveningstar",
    color: "#ff2244",
  },
  {
    category: "THREE CANDLE",
    name: "Three White Soldiers",
    emoji: "⚔️",
    signal: "BUY",
    reliability: 85,
    description: "Three consecutive large green candles each closing higher.",
    whatHappens: "Strong bullish momentum. Bulls in complete control for 3 candles straight.",
    tradingAction: "Buy continuation or wait for small pullback. Trend is strongly up.",
    duration: { min: 2, max: 4, best: 3, note: "Strong trend — ride momentum" },
    shape: "threewhite",
    color: "#00dd55",
  },
  {
    category: "THREE CANDLE",
    name: "Three Black Crows",
    emoji: "🐦‍⬛",
    signal: "SELL",
    reliability: 85,
    description: "Three consecutive large red candles each closing lower.",
    whatHappens: "Strong bearish momentum. Bears in complete control for 3 candles straight.",
    tradingAction: "Sell continuation or wait for small pullback. Trend is strongly down.",
    duration: { min: 2, max: 4, best: 3, note: "Strong trend — ride momentum" },
    shape: "threecrows",
    color: "#ff2244",
  },
  {
    category: "THREE CANDLE",
    name: "Inside Bar",
    emoji: "📦",
    signal: "WAIT",
    reliability: 70,
    description: "Middle candle completely inside previous candle high and low.",
    whatHappens: "Market consolidating. Energy building for a big breakout move.",
    tradingAction: "Wait for breakout. Buy if breaks above inside bar high. Sell if breaks below low.",
    duration: { min: 2, max: 5, best: 3, note: "Trade the breakout direction" },
    shape: "insidebar",
    color: "#8844ff",
  },
];

// ── SVG Candle Shapes ──────────────────────────────────────────────
function CandleSVG({ shape, size=60 }) {
  const w=size, h=size*1.4;
  const cx=w/2;
  const green="#00dd55", red="#ff2244", gray="#8899aa", purple="#8844ff";

  const shapes = {
    hammer: (
      <svg width={w} height={h}>
        <line x1={cx} y1={2} x2={cx} y2={h*0.35} stroke={green} strokeWidth="2"/>
        <rect x={cx-8} y={h*0.35} width={16} height={h*0.15} fill={green} rx="1"/>
        <line x1={cx} y1={h*0.5} x2={cx} y2={h-4} stroke={green} strokeWidth="2"/>
      </svg>
    ),
    shootingstar: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h*0.5} stroke={red} strokeWidth="2"/>
        <rect x={cx-8} y={h*0.5} width={16} height={h*0.15} fill={red} rx="1"/>
        <line x1={cx} y1={h*0.65} x2={cx} y2={h*0.72} stroke={red} strokeWidth="2"/>
      </svg>
    ),
    doji: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h-4} stroke={gray} strokeWidth="2"/>
        <line x1={cx-12} y1={h/2} x2={cx+12} y2={h/2} stroke={gray} strokeWidth="2"/>
      </svg>
    ),
    dragonfly: (
      <svg width={w} height={h}>
        <line x1={cx} y1={h*0.1} x2={cx} y2={h*0.12} stroke={green} strokeWidth="2"/>
        <line x1={cx-10} y1={h*0.1} x2={cx+10} y2={h*0.1} stroke={green} strokeWidth="2"/>
        <line x1={cx} y1={h*0.12} x2={cx} y2={h-4} stroke={green} strokeWidth="2"/>
      </svg>
    ),
    gravestone: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h*0.88} stroke={red} strokeWidth="2"/>
        <line x1={cx-10} y1={h*0.88} x2={cx+10} y2={h*0.88} stroke={red} strokeWidth="2"/>
        <line x1={cx} y1={h*0.88} x2={cx} y2={h*0.9} stroke={red} strokeWidth="2"/>
      </svg>
    ),
    bullmarubozu: (
      <svg width={w} height={h}>
        <rect x={cx-10} y={h*0.1} width={20} height={h*0.8} fill={green} rx="1"/>
      </svg>
    ),
    bearmarubozu: (
      <svg width={w} height={h}>
        <rect x={cx-10} y={h*0.1} width={20} height={h*0.8} fill={red} rx="1"/>
      </svg>
    ),
    spinningtop: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h*0.35} stroke={gray} strokeWidth="2"/>
        <rect x={cx-6} y={h*0.35} width={12} height={h*0.3} fill={gray} rx="1"/>
        <line x1={cx} y1={h*0.65} x2={cx} y2={h-4} stroke={gray} strokeWidth="2"/>
      </svg>
    ),
    invertedhammer: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h*0.5} stroke={green} strokeWidth="2"/>
        <rect x={cx-8} y={h*0.5} width={16} height={h*0.15} fill={green} rx="1"/>
        <line x1={cx} y1={h*0.65} x2={cx} y2={h*0.72} stroke={green} strokeWidth="2"/>
      </svg>
    ),
    bullengulf: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h*0.15} stroke={red} strokeWidth="1.5"/>
        <rect x={cx-6} y={h*0.15} width={12} height={h*0.25} fill={red} rx="1"/>
        <line x1={cx} y1={h*0.4} x2={cx} y2={h*0.45} stroke={red} strokeWidth="1.5"/>
        <line x1={cx} y1={h*0.05} x2={cx} y2={h*0.1} stroke={green} strokeWidth="1.5"/>
        <rect x={cx-10} y={h*0.1} width={20} height={h*0.8} fill={green} rx="1"/>
        <line x1={cx} y1={h*0.9} x2={cx} y2={h*0.95} stroke={green} strokeWidth="1.5"/>
      </svg>
    ),
    bearengulf: (
      <svg width={w} height={h}>
        <line x1={cx} y1={4} x2={cx} y2={h*0.15} stroke={green} strokeWidth="1.5"/>
        <rect x={cx-6} y={h*0.15} width={12} height={h*0.25} fill={green} rx="1"/>
        <line x1={cx} y1={h*0.4} x2={cx} y2={h*0.45} stroke={green} strokeWidth="1.5"/>
        <line x1={cx} y1={h*0.05} x2={cx} y2={h*0.1} stroke={red} strokeWidth="1.5"/>
        <rect x={cx-10} y={h*0.1} width={20} height={h*0.8} fill={red} rx="1"/>
        <line x1={cx} y1={h*0.9} x2={cx} y2={h*0.95} stroke={red} strokeWidth="1.5"/>
      </svg>
    ),
    tweezerbottom: (
      <svg width={w} height={h}>
        <line x1={cx-10} y1={4} x2={cx-10} y2={h*0.3} stroke={red} strokeWidth="1.5"/>
        <rect x={cx-16} y={h*0.3} width={12} height={h*0.3} fill={red} rx="1"/>
        <line x1={cx-10} y1={h*0.6} x2={cx-10} y2={h-4} stroke={red} strokeWidth="1.5"/>
        <line x1={cx+10} y1={4} x2={cx+10} y2={h*0.3} stroke={green} strokeWidth="1.5"/>
        <rect x={cx+4} y={h*0.3} width={12} height={h*0.3} fill={green} rx="1"/>
        <line x1={cx+10} y1={h*0.6} x2={cx+10} y2={h-4} stroke={green} strokeWidth="1.5"/>
      </svg>
    ),
    tweezertop: (
      <svg width={w} height={h}>
        <line x1={cx-10} y1={4} x2={cx-10} y2={h*0.4} stroke={green} strokeWidth="1.5"/>
        <rect x={cx-16} y={h*0.4} width={12} height={h*0.3} fill={green} rx="1"/>
        <line x1={cx-10} y1={h*0.7} x2={cx-10} y2={h-4} stroke={green} strokeWidth="1.5"/>
        <line x1={cx+10} y1={4} x2={cx+10} y2={h*0.4} stroke={red} strokeWidth="1.5"/>
        <rect x={cx+4} y={h*0.4} width={12} height={h*0.3} fill={red} rx="1"/>
        <line x1={cx+10} y1={h*0.7} x2={cx+10} y2={h-4} stroke={red} strokeWidth="1.5"/>
      </svg>
    ),
    morningstar: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.05} width={14} height={h*0.35} fill={red} rx="1"/>
        <rect x={cx-5} y={h*0.45} width={10} height={h*0.15} fill={gray} rx="1"/>
        <rect x={w-16} y={h*0.2} width={14} height={h*0.6} fill={green} rx="1"/>
      </svg>
    ),
    eveningstar: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.2} width={14} height={h*0.6} fill={green} rx="1"/>
        <rect x={cx-5} y={h*0.45} width={10} height={h*0.15} fill={gray} rx="1"/>
        <rect x={w-16} y={h*0.05} width={14} height={h*0.35} fill={red} rx="1"/>
      </svg>
    ),
    threewhite: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.55} width={14} height={h*0.35} fill={green} rx="1"/>
        <rect x={cx-7} y={h*0.3} width={14} height={h*0.4} fill={green} rx="1"/>
        <rect x={w-16} y={h*0.1} width={14} height={h*0.45} fill={green} rx="1"/>
      </svg>
    ),
    threecrows: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.1} width={14} height={h*0.35} fill={red} rx="1"/>
        <rect x={cx-7} y={h*0.3} width={14} height={h*0.4} fill={red} rx="1"/>
        <rect x={w-16} y={h*0.55} width={14} height={h*0.35} fill={red} rx="1"/>
      </svg>
    ),
    insidebar: (
      <svg width={w} height={h}>
        <line x1={cx-10} y1={4} x2={cx-10} y2={h*0.1} stroke={green} strokeWidth="1.5"/>
        <rect x={cx-16} y={h*0.1} width={12} height={h*0.8} fill={green} rx="1"/>
        <line x1={cx-10} y1={h*0.9} x2={cx-10} y2={h-4} stroke={green} strokeWidth="1.5"/>
        <line x1={cx+8} y1={h*0.25} x2={cx+8} y2={h*0.3} stroke={purple} strokeWidth="1.5"/>
        <rect x={cx+2} y={h*0.3} width={12} height={h*0.4} fill={purple} rx="1"/>
        <line x1={cx+8} y1={h*0.7} x2={cx+8} y2={h*0.75} stroke={purple} strokeWidth="1.5"/>
      </svg>
    ),
    piercing: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.1} width={14} height={h*0.7} fill={red} rx="1"/>
        <rect x={w-16} y={h*0.35} width={14} height={h*0.55} fill={green} rx="1"/>
      </svg>
    ),
    darkcloud: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.35} width={14} height={h*0.55} fill={green} rx="1"/>
        <rect x={w-16} y={h*0.1} width={14} height={h*0.7} fill={red} rx="1"/>
      </svg>
    ),
    bullharami: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.1} width={14} height={h*0.8} fill={red} rx="1"/>
        <rect x={w-14} y={h*0.35} width={10} height={h*0.3} fill={green} rx="1"/>
      </svg>
    ),
    bearharami: (
      <svg width={w} height={h}>
        <rect x={2} y={h*0.1} width={14} height={h*0.8} fill={green} rx="1"/>
        <rect x={w-14} y={h*0.35} width={10} height={h*0.3} fill={red} rx="1"/>
      </svg>
    ),
  };

  return shapes[shape] || (
    <svg width={w} height={h}>
      <rect x={cx-8} y={h*0.2} width={16} height={h*0.6} fill={gray} rx="2"/>
    </svg>
  );
}

export default function CandleEncyclopedia({ dark }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.95)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    inp: dark?"rgba(0,40,80,0.3)":"#e8f0f8",
  };

  const sc = s=>s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":s==="WAIT"?"#ffaa00":"#8844ff";

  const categories = ["ALL","SINGLE CANDLE","TWO CANDLE","THREE CANDLE"];
  const filtered = CANDLES.filter(c=>{
    const catMatch = filter==="ALL" || c.category===filter;
    const searchMatch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.signal.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        .cchip{cursor:pointer;transition:all 0.15s;user-select:none}
        .cchip:hover{transform:scale(1.02);opacity:0.9}
        .cbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #ffd70044", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700", letterSpacing:2, marginBottom:4 }}>
            🕯️ CANDLE ENCYCLOPEDIA
          </div>
          <div style={{ fontSize:9, color:t.dim }}>
            {CANDLES.length} patterns · Learn what each candle means · Know when to trade
          </div>
        </div>

        {/* Search */}
        <input
          placeholder="🔍 Search candle name..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", background:t.inp, border:`1px solid ${t.border}`, borderRadius:8,
            color:t.text, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, outline:"none", marginBottom:10, boxSizing:"border-box" }}
        />

        {/* Category filter */}
        <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
          {categories.map(cat=>(
            <button key={cat} className="cbtn" onClick={()=>setFilter(cat)}
              style={{ padding:"6px 12px", background:filter===cat?"#ffd700":"transparent",
                border:`1px solid ${filter===cat?"#ffd700":t.border}`,
                color:filter===cat?"#000":t.muted, borderRadius:6, fontSize:9, fontWeight:700, cursor:"pointer" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
          {[["BUY SIGNALS",CANDLES.filter(c=>c.signal==="BUY").length,"#00dd55"],
            ["SELL SIGNALS",CANDLES.filter(c=>c.signal==="SELL").length,"#ff2244"],
            ["WAIT/NEUTRAL",CANDLES.filter(c=>c.signal==="WAIT").length,"#ffaa00"]].map(([l,v,c])=>(
            <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
              <div style={{ fontSize:7, color:t.dim, letterSpacing:1 }}>{l}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Candle grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {filtered.map((candle,i)=>(
            <div key={i} className="cchip" onClick={()=>setSelected(selected?.name===candle.name?null:candle)}
              style={{ background:selected?.name===candle.name?(dark?"#0a1a2a":"#e8f4ff"):t.bgCard,
                border:`2px solid ${selected?.name===candle.name?sc(candle.signal):t.border}`,
                borderTop:`4px solid ${sc(candle.signal)}`,
                borderRadius:10, padding:"12px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:t.text }}>{candle.emoji} {candle.name}</div>
                  <div style={{ fontSize:8, color:t.dim, marginTop:2 }}>{candle.category}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ background:sc(candle.signal)+"22", border:`1px solid ${sc(candle.signal)}44`,
                    color:sc(candle.signal), fontSize:8, padding:"2px 7px", borderRadius:4, fontWeight:700 }}>
                    {candle.signal}
                  </div>
                  <div style={{ fontSize:8, color:t.dim, marginTop:3 }}>{candle.reliability}% reliable</div>
                </div>
              </div>

              <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
                <CandleSVG shape={candle.shape} size={50}/>
              </div>

              <div style={{ height:3, background:dark?"#0a1520":"#e0eaf4", borderRadius:2, overflow:"hidden", marginBottom:6 }}>
                <div style={{ width:`${candle.reliability}%`, height:"100%", background:sc(candle.signal) }}/>
              </div>

              <div style={{ fontSize:9, color:t.muted, lineHeight:1.5 }}>{candle.description}</div>

              {/* Expanded detail */}
              {selected?.name===candle.name && (
                <div style={{ marginTop:12, borderTop:`1px solid ${dark?"#0d2a42":"#d0dce8"}`, paddingTop:12 }}>

                  {/* What happens */}
                  <div style={{ background:dark?"#0a0520":"#f0e8ff", border:"1px solid #8844ff33", borderRadius:6, padding:"8px 10px", marginBottom:8 }}>
                    <div style={{ fontSize:8, color:"#8844ff", fontWeight:700, marginBottom:3 }}>📖 WHAT HAPPENS</div>
                    <div style={{ fontSize:9, color:t.muted, lineHeight:1.6 }}>{candle.whatHappens}</div>
                  </div>

                  {/* Trading action */}
                  <div style={{ background:sc(candle.signal)+"11", border:`1px solid ${sc(candle.signal)}33`, borderRadius:6, padding:"8px 10px", marginBottom:8 }}>
                    <div style={{ fontSize:8, color:sc(candle.signal), fontWeight:700, marginBottom:3 }}>💼 TRADING ACTION</div>
                    <div style={{ fontSize:9, color:t.muted, lineHeight:1.6 }}>{candle.tradingAction}</div>
                  </div>

                  {/* Duration */}
                  {candle.duration.best>0 ? (
                    <div style={{ background:dark?"#0a1520":"#e8f4ff", border:"1px solid #4499ff33", borderRadius:6, padding:"8px 10px" }}>
                      <div style={{ fontSize:8, color:"#4499ff", fontWeight:700, marginBottom:5 }}>⏱️ EXPIRY / DURATION</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5, marginBottom:5 }}>
                        {[["MIN",candle.duration.min+" candles"],["BEST",candle.duration.best+" candles"],["MAX",candle.duration.max+" candles"]].map(([l,v])=>(
                          <div key={l} style={{ background:dark?"#050a0f":"rgba(0,0,0,0.05)", borderRadius:4, padding:"5px", textAlign:"center" }}>
                            <div style={{ fontSize:7, color:t.dim }}>{l}</div>
                            <div style={{ fontSize:9, color:"#4499ff", fontWeight:700 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>💡 {candle.duration.note}</div>
                    </div>
                  ) : (
                    <div style={{ background:"#1a1000", border:"1px solid #ffaa0033", borderRadius:6, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, color:"#ffaa00" }}>⚠️ {candle.duration.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px", marginTop:16 }}>
          <div style={{ fontSize:10, color:"#ffd700", fontWeight:700, marginBottom:8 }}>💡 PRO TIPS</div>
          <div style={{ fontSize:9, color:t.muted, lineHeight:1.9 }}>
            • Always trade WITH the trend — patterns are stronger in trend direction{"\n"}
            • Reversal patterns work best at support/resistance levels{"\n"}
            • Never trade a single candle without confirmation{"\n"}
            • Higher timeframes (15M, 1H) = more reliable patterns{"\n"}
            • Combine candle patterns with RSI for best results
          </div>
        </div>

      </div>
    </div>
  );
}
