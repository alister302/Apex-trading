import { useState } from "react";

const chapters = [
  {
    id: "candles",
    icon: "🕯️",
    title: "Candlestick Patterns",
    subtitle: "The language of price action",
    lessons: [
      {
        title: "What is a Candle?",
        content: `Every candle tells a story of a battle between buyers and sellers in a specific time period.

A candle has 4 parts:
• OPEN — where price started
• CLOSE — where price ended  
• HIGH — highest point reached
• LOW — lowest point reached

The BODY is between open and close.
The WICKS (shadows) are the high and low lines.

GREEN/WHITE candle = price went UP (close > open)
RED/BLACK candle = price went DOWN (close < open)`,
        tip: "On OlympTrade, always check if the candle is fully closed before trading. Never trade on an open candle!",
        candle: "basic"
      },
      {
        title: "Doji — The Indecision Candle",
        content: `A Doji forms when open and close are almost the same price. The body is tiny or nonexistent.

What it means:
• Buyers and sellers are EQUAL in power
• Market is confused — nobody is winning
• A big move is coming soon

Types of Doji:
• Standard Doji — cross shape, equal wicks
• Long-legged Doji — very long wicks both sides
• Dragonfly Doji — long lower wick, no upper wick (bullish)
• Gravestone Doji — long upper wick, no lower wick (bearish)

WHEN YOU SEE IT: Wait for the next candle to confirm direction before entering.`,
        tip: "A Doji after a long trend is a POWERFUL reversal warning. Screenshot it and run PRINCEX IQ immediately!",
        candle: "doji"
      },
      {
        title: "Hammer & Shooting Star",
        content: `HAMMER (Bullish)
• Small body at the TOP
• Long lower wick (2x+ the body)
• Little or no upper wick
• Appears at the BOTTOM of a downtrend
• Means: sellers pushed price down but buyers fought back strongly
• Signal: Price likely going UP

SHOOTING STAR (Bearish)
• Small body at the BOTTOM
• Long upper wick (2x+ the body)  
• Little or no lower wick
• Appears at the TOP of an uptrend
• Means: buyers pushed price up but sellers rejected it hard
• Signal: Price likely going DOWN

INVERTED HAMMER — like shooting star but at bottom (bullish)
HANGING MAN — like hammer but at top (bearish)`,
        tip: "The longer the wick, the stronger the rejection. A hammer with a wick 3x the body is a very strong signal!",
        candle: "hammer"
      },
      {
        title: "Engulfing Patterns",
        content: `BULLISH ENGULFING
• A small RED candle followed by a BIG GREEN candle
• The green candle body completely covers the red candle body
• Appears at the bottom of a downtrend
• Means: bulls took complete control from bears
• Very strong BUY signal

BEARISH ENGULFING  
• A small GREEN candle followed by a BIG RED candle
• The red candle body completely covers the green candle body
• Appears at the top of an uptrend
• Means: bears took complete control from bulls
• Very strong SELL signal

Strength increases when:
✓ Volume is higher on the engulfing candle
✓ It appears at a key support/resistance level
✓ It comes after a long trend`,
        tip: "Engulfing patterns on 1min+ timeframes are very reliable on OlympTrade. Use 3-5 candle trade duration.",
        candle: "engulfing"
      },
      {
        title: "Morning Star & Evening Star",
        content: `These are 3-candle reversal patterns — very powerful!

MORNING STAR (Bullish Reversal)
Candle 1: Big RED candle (bears in control)
Candle 2: Small candle or Doji (indecision)
Candle 3: Big GREEN candle (bulls take over)
→ Appears at bottom of downtrend
→ Strong BUY signal

EVENING STAR (Bearish Reversal)
Candle 1: Big GREEN candle (bulls in control)  
Candle 2: Small candle or Doji (indecision)
Candle 3: Big RED candle (bears take over)
→ Appears at top of uptrend
→ Strong SELL signal

The middle candle (star) shows the moment of change. The bigger the 3rd candle, the stronger the reversal.`,
        tip: "Morning/Evening Stars are rare but very accurate. When you spot one, screenshot immediately and run APEX!",
        candle: "morningstar"
      },
      {
        title: "Three Soldiers & Three Crows",
        content: `THREE WHITE SOLDIERS (Very Bullish)
• 3 consecutive GREEN candles
• Each opens within previous candle body
• Each closes higher than previous
• Small or no upper wicks
• Means: strong sustained buying pressure
• Signal: Uptrend confirmed — BUY

THREE BLACK CROWS (Very Bearish)
• 3 consecutive RED candles
• Each opens within previous candle body
• Each closes lower than previous
• Small or no lower wicks
• Means: strong sustained selling pressure
• Signal: Downtrend confirmed — SELL

These patterns show MOMENTUM. The market has made up its mind. Go with it!`,
        tip: "After Three Soldiers/Crows form, the trend usually continues for 5-10 more candles. Perfect for OlympTrade!",
        candle: "soldiers"
      },
      {
        title: "Pinbar — The Rejection Candle",
        content: `A Pinbar (Pin Bar) is the most reliable single-candle signal in trading.

FEATURES:
• Very long wick on ONE side (at least 2/3 of total candle size)
• Very small body
• Short or no wick on the other side
• The long wick = PRICE REJECTION

BULLISH PINBAR
• Long LOWER wick
• Price was rejected downward, buyers pushed back up
• Signal: Strong BUY

BEARISH PINBAR  
• Long UPPER wick
• Price was rejected upward, sellers pushed back down
• Signal: Strong SELL

The longer the wick relative to the body, the stronger the signal. A perfect pinbar wick is 3-4x the body size.`,
        tip: "Pinbars at Support/Resistance levels are the most powerful setup in binary options trading. Never ignore them!",
        candle: "pinbar"
      },
      {
        title: "Marubozu — The Power Candle",
        content: `Marubozu means 'close-cropped' in Japanese. It's a candle with NO wicks.

BULLISH MARUBOZU
• All green, no wicks at all
• Open = Low, Close = High
• Buyers were in COMPLETE control the entire candle
• Price never looked back
• Very strong BUY signal

BEARISH MARUBOZU  
• All red, no wicks at all
• Open = High, Close = Low
• Sellers were in COMPLETE control the entire candle
• Price never recovered
• Very strong SELL signal

A Marubozu shows CONVICTION. The market has zero indecision. It is one of the strongest momentum signals.`,
        tip: "When you see a Marubozu, the next 2-3 candles usually continue in the same direction. Great for quick trades!",
        candle: "marubozu"
      }
    ]
  },
  {
    id: "sr",
    icon: "📊",
    title: "Support & Resistance",
    subtitle: "The floor and ceiling of price",
    lessons: [
      {
        title: "What is Support?",
        content: `Support is a PRICE LEVEL where buyers are strong enough to stop price from falling further.

Think of it as the FLOOR.

Why does it work?
• Many traders place buy orders at the same price
• When price drops there, buyers rush in
• Price bounces back up

How to identify Support:
• Look for price bouncing UP from the same level 2+ times
• The more times it bounces, the STRONGER the support
• Previous highs can become support (role reversal)
• Round numbers often act as support (71000, 72000)

On OlympTrade: When price approaches support and shows a bullish candle (hammer, engulfing, pinbar) — that's a high-probability BUY setup.`,
        tip: "The more times price has bounced off a level, the more traders are watching it. More traders = stronger bounce!",
        candle: null
      },
      {
        title: "What is Resistance?",
        content: `Resistance is a PRICE LEVEL where sellers are strong enough to stop price from rising further.

Think of it as the CEILING.

Why does it work?
• Many traders place sell orders at the same price
• When price rises there, sellers rush in
• Price gets pushed back down

How to identify Resistance:
• Look for price getting rejected DOWN from the same level 2+ times
• Previous lows can become resistance (role reversal)
• Round numbers often act as resistance
• Bollinger Band upper line = dynamic resistance

KEY RULE — Role Reversal:
When price BREAKS THROUGH a support level, that support becomes new resistance.
When price BREAKS THROUGH resistance, that resistance becomes new support.`,
        tip: "When you see price approaching a resistance level with a bearish candle pattern — that's your SELL signal!",
        candle: null
      },
      {
        title: "How to Trade S&R",
        content: `THE BOUNCE STRATEGY (Most common)
1. Identify a strong support or resistance level
2. Wait for price to approach that level
3. Watch for a reversal candle pattern (pinbar, hammer, engulfing)
4. Enter in the direction of the bounce
5. Set trade duration for 2-5 candles

THE BREAKOUT STRATEGY  
1. Identify a strong resistance level
2. Watch for price attempting to break through
3. Wait for a strong Marubozu or engulfing candle closing ABOVE resistance
4. Enter BUY — price will continue upward
5. The old resistance is now support

COMBINING WITH PATTERNS:
• Hammer at support = Very strong BUY
• Shooting star at resistance = Very strong SELL
• Engulfing at S&R = Highest probability trade

Always wait for the candle to CLOSE before entering. Never trade on an open candle!`,
        tip: "The best trades happen when a strong candle pattern forms exactly at a support or resistance level. Patience is key!",
        candle: null
      }
    ]
  },
  {
    id: "trend",
    icon: "📈",
    title: "Trend Analysis",
    subtitle: "The trend is your friend",
    lessons: [
      {
        title: "What is a Trend?",
        content: `A trend is the overall direction price is moving. There are 3 types:

UPTREND (Bullish)
• Price makes Higher Highs (HH) and Higher Lows (HL)
• Each peak is higher than the last
• Each dip is higher than the last
• Buy on dips (pullbacks)

DOWNTREND (Bearish)
• Price makes Lower Highs (LH) and Lower Lows (LL)
• Each peak is lower than the last
• Each dip is lower than the last
• Sell on rallies (pullbacks up)

SIDEWAYS (Ranging)
• Price moves between two horizontal levels
• No clear direction
• Buy at support, sell at resistance
• Avoid trend-following strategies

THE GOLDEN RULE: Never trade AGAINST the trend. If the trend is up, only look for BUY signals. If down, only SELL signals.`,
        tip: "On OlympTrade, always check the 5-minute chart to identify the main trend, then use 1-minute for entry timing.",
        candle: null
      },
      {
        title: "Trend Strength & Momentum",
        content: `Not all trends are equal. You need to measure STRENGTH.

STRONG TREND SIGNS:
• Candles are large and decisive
• Very little overlap between candles
• Wicks are small compared to bodies
• Price moves quickly in one direction
• Each new candle breaks the previous high/low

WEAK TREND SIGNS:
• Small candle bodies
• Large wicks showing indecision
• Lots of overlap between candles
• Price moves slowly
• Many Doji candles appearing

TREND EXHAUSTION (Reversal Warning):
• After a long trend, candles get smaller
• Wicks start getting longer
• A Doji or reversal candle appears
• Price fails to make new high/low

When you see exhaustion — get ready for a reversal! This is when PRINCEX IQ shines.`,
        tip: "The best time to enter a trend is after a small pullback (retracement). Don't chase price — wait for it to come to you!",
        candle: null
      },
      {
        title: "Moving Averages",
        content: `Moving Averages (MA) smooth out price to show the trend clearly.

TYPES:
• SMA (Simple) — average of last N candles
• EMA (Exponential) — gives more weight to recent candles (more responsive)

HOW TO USE:
• Price ABOVE MA = Uptrend, look for BUY signals
• Price BELOW MA = Downtrend, look for SELL signals
• MA acts as dynamic support/resistance

GOLDEN CROSS (Very Bullish)
• Fast MA crosses ABOVE slow MA
• Strong BUY signal
• Start of new uptrend

DEATH CROSS (Very Bearish)
• Fast MA crosses BELOW slow MA
• Strong SELL signal
• Start of new downtrend

ON OLYMPTRADE:
The orange/yellow line you see on charts is usually a Moving Average. Price bouncing off it is a high-probability signal.`,
        tip: "When a bullish candle pattern forms exactly on the Moving Average line, that's one of the highest probability BUY setups!",
        candle: null
      }
    ]
  },
  {
    id: "psychology",
    icon: "🧠",
    title: "Trading Psychology",
    subtitle: "Master your mind, master the market",
    lessons: [
      {
        title: "The #1 Enemy: Emotions",
        content: `90% of traders lose money. Not because of bad strategy — because of EMOTIONS.

THE TWO KILLERS:

FEAR
• Fear of losing makes you exit too early
• Fear of missing out (FOMO) makes you enter bad trades
• Fear causes hesitation when you should act
• Fear makes you reduce trade size when you're winning

GREED
• Greed makes you overtrade
• Greed makes you increase size after losses (revenge trading)
• Greed makes you ignore signals and just click randomly
• Greed makes you trade when you should be resting

THE SOLUTION:
• Follow your rules ALWAYS — no exceptions
• If you feel emotional, STOP TRADING immediately
• Take a break, walk away, come back with a clear mind
• Your strategy works — trust it`,
        tip: "The most profitable traders are BORING. They follow the same rules every day without excitement or fear.",
        candle: null
      },
      {
        title: "Revenge Trading — The Account Killer",
        content: `Revenge trading is when you lose a trade and immediately try to win it back.

HOW IT HAPPENS:
1. You lose a trade
2. You feel angry/frustrated
3. You immediately enter another trade (often bigger)
4. You're not following your rules, just reacting
5. You lose again
6. You enter an even bigger trade...
7. Account blown

WHY IT ALWAYS FAILS:
• You're trading with emotions, not logic
• The market doesn't care about your losses
• Bigger trades = bigger losses when you're not thinking clearly
• You're chasing the market, not reading it

THE RULE:
After 2 consecutive losses — STOP. Close the app. Come back tomorrow.
No exceptions. Ever.`,
        tip: "Set a daily loss limit. If you hit it, stop for the day. Protecting your capital is more important than any single trade.",
        candle: null
      },
      {
        title: "Discipline & Routine",
        content: `Profitable trading is boring. It's the same routine every day.

THE WINNING ROUTINE:
1. Check the overall market trend (5min chart)
2. Identify key support and resistance levels
3. Wait for your setup to appear (don't force it)
4. Enter only when ALL conditions are met
5. Accept the result and move on

RULES TO LIVE BY:
✓ Never trade more than 2-3% of account per trade
✓ Set a maximum of 5-10 trades per day
✓ Stop after 2 consecutive losses
✓ Never trade news events
✓ Always check the trend before entering
✓ Wait for candle to CLOSE before entering
✓ Never trade when tired, hungry, or emotional

MINDSET SHIFT:
Stop thinking about money. Think about PROCESS.
If you follow the right process consistently, profits come naturally.`,
        tip: "Keep a trading journal. Write down every trade, why you entered, and what happened. Review it weekly. This alone will make you profitable.",
        candle: null
      }
    ]
  },
  {
    id: "risk",
    icon: "🛡️",
    title: "Risk Management",
    subtitle: "Protect your capital first",
    lessons: [
      {
        title: "The 2% Rule",
        content: `The most important rule in trading: Never risk more than 2% of your account on a single trade.

WHY THIS MATTERS:
• With $100 account, risk max $2 per trade
• Even if you lose 10 trades in a row, you still have $80
• You can recover from small losses
• You CANNOT recover from blowing your account

THE MATH:
$100 account, 2% risk = $2 per trade
10 losses = -$20 (still have $80)
10 wins at 80% payout = +$16 profit

$100 account, 20% risk = $20 per trade
5 losses = account gone

POSITION SIZING:
Never increase your trade size when losing (revenge trading).
You can slightly increase when winning consistently.

On OlympTrade binary options, the minimum trade is usually $1. Start there. Master the strategy first, scale up later.`,
        tip: "Most traders fail because they trade too big. Trade small, be consistent, let profits grow naturally over time.",
        candle: null
      },
      {
        title: "Win Rate vs Risk/Reward",
        content: `You don't need to win every trade to be profitable. You need the RIGHT win rate for your strategy.

BINARY OPTIONS MATH:
If OlympTrade pays 80% on wins:
• Win $10 trade = +$8 profit
• Lose $10 trade = -$10 loss

To break even, you need:
10 / (10 + 8) = 55.5% win rate

To be profitable, you need 60%+ win rate.

IMPROVING WIN RATE:
✓ Only trade with 2+ confirming signals
✓ Trade with the trend, not against it
✓ Use strong S&R levels
✓ Wait for candle patterns to confirm
✓ Use PRINCEX IQ to validate your analysis

REALISTIC EXPECTATIONS:
• 55-60% win rate = small consistent profit
• 60-70% win rate = good profit
• 70%+ win rate = excellent (very hard to maintain)

Don't chase 90% win rate. Consistent 65% is life-changing.`,
        tip: "Quality over quantity. 3 high-quality trades per day beats 20 random trades every time.",
        candle: null
      },
      {
        title: "Money Management Plan",
        content: `Before you trade any real money, you need a PLAN.

YOUR TRADING PLAN:
□ Account size: $_____
□ Max per trade: ___% (recommended: 2%)
□ Daily loss limit: ___% (recommended: 10%)
□ Daily profit target: ___% (recommended: 5-10%)
□ Max trades per day: ___ (recommended: 5-10)
□ Trading hours: _____ to _____
□ Pairs to trade: _____________

WHEN TO STOP:
• Hit daily loss limit → Stop for the day
• 2 consecutive losses → Take 30 min break
• Feeling emotional → Stop immediately
• Made daily profit target → Consider stopping (protect profits)

GROWING YOUR ACCOUNT:
Month 1-3: Focus on strategy, not money
Month 4-6: Consistent results, slowly increase size
Month 6+: Scale up confidently

Remember: Slow and steady wins. Patience is the most profitable skill.`,
        tip: "Write your trading plan on paper and stick it next to your phone. Read it before every trading session.",
        candle: null
      }
    ]
  },
  {
    id: "olymptrade",
    icon: "🏆",
    title: "OlympTrade Mastery",
    subtitle: "Platform-specific winning strategies",
    lessons: [
      {
        title: "Understanding OTC Markets",
        content: `OTC (Over The Counter) markets on OlympTrade are synthetic markets that trade 24/7, including weekends.

WHAT IS OTC?
• Not real market prices — synthetic price generated by the platform
• Available when real markets are closed (nights, weekends)
• Follows similar patterns to real markets
• Can be traded with the same technical analysis

KEY DIFFERENCES FROM REAL MARKETS:
• More predictable patterns (algorithmic price generation)
• Available 24/7
• Lower volatility usually
• Same candlestick patterns apply

BEST OTC PAIRS ON OLYMPTRADE:
• Bitcoin OTC — most popular, good patterns
• EUR/USD OTC — familiar pair, reliable signals
• Gold OTC — trending behavior

PRO TIP:
OTC pairs often respect support/resistance levels and moving averages very cleanly because the price generation is algorithmic. Patterns tend to be textbook perfect.`,
        tip: "OTC markets are great for learning because patterns are cleaner. Practice your analysis on OTC before trading live markets.",
        candle: null
      },
      {
        title: "Best Timeframes for Binary Options",
        content: `Choosing the right timeframe is critical for binary options success.

TIMEFRAME GUIDE:

5 SECONDS — Avoid unless experienced
• Pure noise, almost gambling
• Patterns unreliable
• Only for very experienced scalpers

30-45 SECONDS — For scalpers
• Fast, exciting, risky
• Need quick pattern recognition
• Use only on strong momentum setups

1 MINUTE — Most popular
• Good balance of speed and reliability
• Patterns are clear and readable
• Best for most traders

5 MINUTES — More reliable
• Stronger, more reliable signals
• Fewer trades but higher quality
• Recommended for beginners

15+ MINUTES — Most reliable
• Highest quality signals
• Fewer false signals
• Best win rate but fewer opportunities

GOLDEN RULE:
Use a HIGHER timeframe to identify trend.
Use a LOWER timeframe to find entry.
Example: 5min for trend, 1min for entry candle.`,
        tip: "Start with 1-minute candles. Master reading them before moving to shorter timeframes. Speed means nothing without accuracy.",
        candle: null
      },
      {
        title: "The Perfect OlympTrade Setup",
        content: `This is the highest probability setup for OlympTrade binary options:

THE 5-STEP SETUP:

STEP 1 — Identify the trend (5min chart)
Is price making HH+HL (uptrend) or LH+LL (downtrend)?

STEP 2 — Find key level (5min chart)
Identify nearest support (for buy) or resistance (for sell)

STEP 3 — Wait for price to reach the level (1min chart)
Don't chase price. Be patient. Let it come to you.

STEP 4 — Wait for confirmation candle (1min chart)
Look for: Hammer, Engulfing, Pinbar, Doji+follow candle
The candle must CLOSE before you enter.

STEP 5 — Enter in trend direction
• Uptrend + bullish candle at support = BUY
• Downtrend + bearish candle at resistance = SELL
• Trade duration: 3-5 candles

BONUS: Run PRINCEX IQ on the screenshot before entering to validate your analysis. Two-brain confirmation!`,
        tip: "If you can't find a clear setup in 30 minutes, don't trade. The market will always be there tomorrow. Your capital might not be.",
        candle: null
      },
      {
        title: "When NOT to Trade",
        content: `Knowing when NOT to trade is just as important as knowing when to trade.

AVOID TRADING:
✗ During major news events (NFP, interest rate decisions, CPI)
✗ When the market is choppy and sideways with no clear trend
✗ When you've already hit your daily loss limit
✗ When you're tired, sick, or emotionally upset
✗ After a big win (overconfidence is dangerous)
✗ When spreads are unusually wide
✗ First and last 30 minutes of major sessions (high volatility, unpredictable)
✗ When you're unsure — if in doubt, stay out!

BEST TIMES TO TRADE:
✓ London session open (8:00-10:00 GMT)
✓ New York session open (13:00-15:00 GMT)
✓ London/New York overlap (13:00-17:00 GMT)
✓ When there's a clear trend on 5min+ chart
✓ When you've had enough sleep and you're focused

Quality of trades matters infinitely more than quantity.`,
        tip: "The market rewards patience. Your biggest enemy is boredom. If you trade to fight boredom, you will lose money.",
        candle: null
      }
    ]
  }
];

function CandleSVG({ type, dark }) {
  const bg = "transparent";
  const green = "#00cc55";
  const red = "#ee2244";
  const muted = dark ? "#445566" : "#99aabb";
  const textColor = dark ? "#c8d8e8" : "#1a2a3a";

  const candles = {
    basic: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="50" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">BULLISH (Green)</text>
        <line x1="65" y1="20" x2="65" y2="40" stroke={green} strokeWidth="2"/>
        <rect x="52" y="40" width="26" height="70" fill={green} rx="2"/>
        <line x1="65" y1="110" x2="65" y2="130" stroke={green} strokeWidth="2"/>
        <text x="94" y="35" fill={muted} fontSize="9" fontFamily="monospace">← HIGH (wick)</text>
        <text x="94" y="58" fill={muted} fontSize="9" fontFamily="monospace">← CLOSE</text>
        <text x="94" y="95" fill={muted} fontSize="9" fontFamily="monospace">← OPEN</text>
        <text x="94" y="125" fill={muted} fontSize="9" fontFamily="monospace">← LOW (wick)</text>
        <text x="160" y="14" fill={red} fontSize="10" fontFamily="monospace" fontWeight="700">BEARISH (Red)</text>
        <line x1="210" y1="20" x2="210" y2="40" stroke={red} strokeWidth="2"/>
        <rect x="197" y="40" width="26" height="70" fill={red} rx="2"/>
        <line x1="210" y1="110" x2="210" y2="130" stroke={red} strokeWidth="2"/>
        <text x="130" y="58" fill={muted} fontSize="9" fontFamily="monospace">OPEN →</text>
        <text x="130" y="95" fill={muted} fontSize="9" fontFamily="monospace">CLOSE →</text>
      </svg>
    ),
    doji: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="70" y="14" fill={textColor} fontSize="11" fontFamily="monospace" fontWeight="700">DOJI TYPES</text>
        <line x1="40" y1="25" x2="40" y2="130" stroke={muted} strokeWidth="2"/>
        <rect x="33" y="75" width="14" height="3" fill={muted} rx="1"/>
        <text x="28" y="150" fill={muted} fontSize="9" fontFamily="monospace">Standard</text>
        <line x1="90" y1="25" x2="90" y2="130" stroke={muted} strokeWidth="2"/>
        <rect x="83" y="75" width="14" height="3" fill={muted} rx="1"/>
        <text x="75" y="150" fill={muted} fontSize="9" fontFamily="monospace">Long-leg</text>
        <line x1="150" y1="60" x2="150" y2="130" stroke={green} strokeWidth="2"/>
        <rect x="143" y="125" width="14" height="3" fill={green} rx="1"/>
        <text x="132" y="150" fill={green} fontSize="9" fontFamily="monospace">Dragonfly</text>
        <line x1="210" y1="25" x2="210" y2="80" stroke={red} strokeWidth="2"/>
        <rect x="203" y="75" width="14" height="3" fill={red} rx="1"/>
        <text x="192" y="150" fill={red} fontSize="9" fontFamily="monospace">Gravestone</text>
      </svg>
    ),
    hammer: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="20" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">HAMMER (Bullish)</text>
        <line x1="55" y1="35" x2="55" y2="50" stroke={green} strokeWidth="2"/>
        <rect x="43" y="50" width="24" height="30" fill={green} rx="2"/>
        <line x1="55" y1="80" x2="55" y2="140" stroke={green} strokeWidth="2"/>
        <text x="80" y="70" fill={muted} fontSize="9" fontFamily="monospace">Small body</text>
        <text x="80" y="115" fill={muted} fontSize="9" fontFamily="monospace">Long lower wick</text>
        <text x="80" y="128" fill={muted} fontSize="9" fontFamily="monospace">(rejection of lows)</text>
        <text x="130" y="14" fill={red} fontSize="10" fontFamily="monospace" fontWeight="700">SHOOTING STAR</text>
        <line x1="200" y1="30" x2="200" y2="90" stroke={red} strokeWidth="2"/>
        <rect x="188" y="90" width="24" height="30" fill={red} rx="2"/>
        <line x1="200" y1="120" x2="200" y2="135" stroke={red} strokeWidth="2"/>
        <text x="130" y="70" fill={muted} fontSize="9" fontFamily="monospace">Long upper wick</text>
        <text x="130" y="83" fill={muted} fontSize="9" fontFamily="monospace">(rejection of highs)</text>
      </svg>
    ),
    engulfing: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="10" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">BULLISH ENGULFING</text>
        <rect x="30" y="60" width="22" height="45" fill={red} rx="2"/>
        <rect x="62" y="40" width="22" height="85" fill={green} rx="2"/>
        <text x="10" y="150" fill={muted} fontSize="9" fontFamily="monospace">Small red → Big green covers it</text>
        <text x="140" y="14" fill={red} fontSize="10" fontFamily="monospace" fontWeight="700">BEARISH ENGULFING</text>
        <rect x="155" y="60" width="22" height="45" fill={green} rx="2"/>
        <rect x="187" y="40" width="22" height="85" fill={red} rx="2"/>
        <text x="140" y="150" fill={muted} fontSize="9" fontFamily="monospace">Small green → Big red covers it</text>
      </svg>
    ),
    morningstar: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="60" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">MORNING STAR</text>
        <rect x="20" y="40" width="24" height="80" fill={red} rx="2"/>
        <line x1="32" y1="30" x2="32" y2="40" stroke={red} strokeWidth="2"/>
        <rect x="60" y="115" width="24" height="15" fill={muted} rx="2"/>
        <rect x="116" y="55" width="24" height="65" fill={green} rx="2"/>
        <line x1="128" y1="45" x2="128" y2="55" stroke={green} strokeWidth="2"/>
        <text x="20" y="150" fill={muted} fontSize="9" fontFamily="monospace">Big red · Star · Big green</text>
        <text x="60" y="108" fill={muted} fontSize="8" fontFamily="monospace">★ star</text>
      </svg>
    ),
    soldiers: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="10" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">THREE WHITE SOLDIERS</text>
        <rect x="10" y="80" width="22" height="60" fill={green} rx="2"/>
        <rect x="42" y="60" width="22" height="60" fill={green} rx="2"/>
        <rect x="74" y="35" width="22" height="65" fill={green} rx="2"/>
        <text x="130" y="14" fill={red} fontSize="10" fontFamily="monospace" fontWeight="700">THREE BLACK CROWS</text>
        <rect x="130" y="30" width="22" height="60" fill={red} rx="2"/>
        <rect x="162" y="50" width="22" height="60" fill={red} rx="2"/>
        <rect x="194" y="70" width="22" height="65" fill={red} rx="2"/>
        <text x="10" y="155" fill={green} fontSize="9" fontFamily="monospace">Each higher →</text>
        <text x="130" y="155" fill={red} fontSize="9" fontFamily="monospace">Each lower →</text>
      </svg>
    ),
    pinbar: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="20" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">BULLISH PINBAR</text>
        <line x1="55" y1="30" x2="55" y2="55" stroke={green} strokeWidth="2"/>
        <rect x="43" y="55" width="24" height="18" fill={green} rx="2"/>
        <line x1="55" y1="73" x2="55" y2="140" stroke={green} strokeWidth="2"/>
        <text x="82" y="110" fill={muted} fontSize="9" fontFamily="monospace">Long lower</text>
        <text x="82" y="122" fill={muted} fontSize="9" fontFamily="monospace">wick = buyers</text>
        <text x="82" y="134" fill={muted} fontSize="9" fontFamily="monospace">rejected lows</text>
        <text x="140" y="14" fill={red} fontSize="10" fontFamily="monospace" fontWeight="700">BEARISH PINBAR</text>
        <line x1="200" y1="20" x2="200" y2="95" stroke={red} strokeWidth="2"/>
        <rect x="188" y="95" width="24" height="18" fill={red} rx="2"/>
        <line x1="200" y1="113" x2="200" y2="135" stroke={red} strokeWidth="2"/>
        <text x="140" y="55" fill={muted} fontSize="9" fontFamily="monospace">Long upper</text>
        <text x="140" y="67" fill={muted} fontSize="9" fontFamily="monospace">wick = sellers</text>
        <text x="140" y="79" fill={muted} fontSize="9" fontFamily="monospace">rejected highs</text>
      </svg>
    ),
    marubozu: (
      <svg width="260" height="160" viewBox="0 0 260 160">
        <text x="15" y="14" fill={green} fontSize="10" fontFamily="monospace" fontWeight="700">BULLISH MARUBOZU</text>
        <rect x="30" y="30" width="70" height="110" fill={green} rx="2"/>
        <text x="20" y="158" fill={green} fontSize="9" fontFamily="monospace">No wicks — full control</text>
        <text x="150" y="14" fill={red} fontSize="10" fontFamily="monospace" fontWeight="700">BEARISH MARUBOZU</text>
        <rect x="160" y="30" width="70" height="110" fill={red} rx="2"/>
        <text x="150" y="158" fill={red} fontSize="9" fontFamily="monospace">No wicks — full control</text>
      </svg>
    ),
  };

  return (
    <div style={{ background: dark ? "#0a1520" : "#f0f6ff", borderRadius: 8, padding: "16px", margin: "14px 0", overflowX: "auto" }}>
      {candles[type] || null}
    </div>
  );
}

export default function IQ({ dark }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);

  const t = {
    bg: dark ? "#050a0f" : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.9)" : "#ffffff",
    border: dark ? "#0d2a42" : "#d0dce8",
    text: dark ? "#c8d8e8" : "#1a2a3a",
    textMuted: dark ? "#8899aa" : "#445566",
    textDim: dark ? "#445566" : "#778899",
    textLabel: dark ? "#667788" : "#556677",
    sidebarBg: dark ? "#030810" : "#e8f0f8",
    activeBg: dark ? "#001833" : "#ddeeff",
    tipBg: dark ? "#001a0d" : "#e8fff3",
    tipBorder: dark ? "#003322" : "#99ddbb",
    tipText: dark ? "#00cc66" : "#006633",
  };

  const chapter = chapters[activeChapter];
  const lesson = chapter.lessons[activeLesson];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", background: t.bg, overflow: "hidden" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: t.sidebarBg, borderRight: `1px solid ${t.border}`, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 8px", fontSize: 9, letterSpacing: 2, color: t.textLabel, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>CHAPTERS</div>
        {chapters.map((ch, ci) => (
          <div key={ch.id}>
            <div
              onClick={() => { setActiveChapter(ci); setActiveLesson(0); }}
              style={{ padding: "12px 14px", cursor: "pointer", background: activeChapter === ci ? t.activeBg : "transparent", borderLeft: activeChapter === ci ? "3px solid #0066ff" : "3px solid transparent", transition: "all 0.2s" }}
            >
              <div style={{ fontSize: 13, marginBottom: 3 }}>{ch.icon} <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: activeChapter === ci ? (dark ? "#4499ff" : "#0044cc") : t.text }}>{ch.title}</span></div>
              <div style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", paddingLeft: 20 }}>{ch.lessons.length} lessons</div>
            </div>
            {activeChapter === ci && ch.lessons.map((l, li) => (
              <div key={li} onClick={() => setActiveLesson(li)}
                style={{ padding: "8px 14px 8px 30px", cursor: "pointer", background: activeLesson === li ? (dark ? "#002244" : "#cce4ff") : "transparent", borderLeft: activeLesson === li ? "3px solid #0088ff" : "3px solid transparent" }}>
                <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: activeLesson === li ? (dark ? "#66aaff" : "#0055cc") : t.textMuted, fontWeight: activeLesson === li ? 700 : 400 }}>{l.title}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 680 }}>

          {/* Chapter header */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2 }}>{chapter.icon} {chapter.title.toUpperCase()}</span>
          </div>

          {/* Lesson title */}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: dark ? "#ffffff" : "#001133", fontFamily: "'Orbitron', sans-serif", marginBottom: 6, lineHeight: 1.3 }}>{lesson.title}</h1>
          <div style={{ height: 3, width: 50, background: "#0066ff", borderRadius: 2, marginBottom: 20 }} />

          {/* Candle drawing */}
          {lesson.candle && <CandleSVG type={lesson.candle} dark={dark} />}

          {/* Content */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            {lesson.content.split("\n").map((line, i) => (
              <div key={i} style={{
                fontSize: line.startsWith("•") || line.startsWith("✓") || line.startsWith("✗") || line.startsWith("□") ? 13 : line === "" ? 6 : 13,
                color: line.startsWith("•") || line.startsWith("✓") ? (dark ? "#aaccee" : "#223344") : line.startsWith("✗") ? "#ee4444" : line === "" ? "transparent" : t.text,
                fontFamily: "'IBM Plex Mono', monospace",
                lineHeight: line === "" ? "0.4" : "1.8",
                marginBottom: line === "" ? 8 : 2,
                paddingLeft: (line.startsWith("•") || line.startsWith("✓") || line.startsWith("✗") || line.startsWith("□")) ? 8 : 0,
                fontWeight: (line.endsWith(":") || line.startsWith("STEP") || line.match(/^[A-Z\s&\/]+$/) && line.length > 3 && !line.startsWith("•")) ? 700 : 400,
                color: line.match(/^[A-Z\s&\/\(\)]+$/) && line.length > 3 && !line.startsWith("•") && !line.startsWith("✓") && !line.startsWith("✗") ? (dark ? "#4499ff" : "#0044cc") : undefined,
              }}>{line || " "}</div>
            ))}
          </div>

          {/* Pro Tip */}
          <div style={{ background: t.tipBg, border: `1px solid ${t.tipBorder}`, borderLeft: `4px solid #00cc66`, borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#00cc66", marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>💡 PRO TIP</div>
            <div style={{ fontSize: 12, color: t.tipText, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.7 }}>{lesson.tip}</div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button
              onClick={() => {
                if (activeLesson > 0) setActiveLesson(activeLesson - 1);
                else if (activeChapter > 0) { setActiveChapter(activeChapter - 1); setActiveLesson(chapters[activeChapter - 1].lessons.length - 1); }
              }}
              disabled={activeChapter === 0 && activeLesson === 0}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.text, padding: "10px 20px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: "pointer", borderRadius: 6, fontWeight: 600, opacity: (activeChapter === 0 && activeLesson === 0) ? 0.3 : 1 }}>
              ← PREVIOUS
            </button>
            <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", alignSelf: "center" }}>
              {activeLesson + 1} / {chapter.lessons.length}
            </div>
            <button
              onClick={() => {
                if (activeLesson < chapter.lessons.length - 1) setActiveLesson(activeLesson + 1);
                else if (activeChapter < chapters.length - 1) { setActiveChapter(activeChapter + 1); setActiveLesson(0); }
              }}
              disabled={activeChapter === chapters.length - 1 && activeLesson === chapter.lessons.length - 1}
              style={{ background: "linear-gradient(135deg,#0066ff,#0044bb)", border: "none", color: "#fff", padding: "10px 20px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: "pointer", borderRadius: 6, fontWeight: 700, opacity: (activeChapter === chapters.length - 1 && activeLesson === chapter.lessons.length - 1) ? 0.3 : 1 }}>
              NEXT →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
