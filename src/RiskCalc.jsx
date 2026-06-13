import { useState } from "react";

export default function RiskCalc({ dark }) {
  const [account, setAccount] = useState("");
  const [risk, setRisk] = useState("2");
  const [customRisk, setCustomRisk] = useState("");
  const [rr, setRR] = useState("3");
  const [customRR, setCustomRR] = useState("");
  const [currency, setCurrency] = useState("$");
  const [trades, setTrades] = useState("5");

  const t = {
    bg: dark ? "#050a0f" : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.9)" : "#ffffff",
    border: dark ? "#0d2a42" : "#d0dce8",
    text: dark ? "#c8d8e8" : "#1a2a3a",
    textMuted: dark ? "#8899aa" : "#445566",
    textDim: dark ? "#445566" : "#778899",
    textLabel: dark ? "#667788" : "#556677",
    inputBg: dark ? "rgba(0,40,80,0.3)" : "#e8f0f8",
  };

  const riskPct = parseFloat(customRisk || risk) || 0;
  const rrRatio = parseFloat(customRR || rr) || 0;
  const acc = parseFloat(account) || 0;
  const tradesNum = parseInt(trades) || 5;

  const riskAmount = (acc * riskPct) / 100;
  const profitAmount = riskAmount * rrRatio;
  const maxDailyLoss = riskAmount * tradesNum;
  const maxDailyLossPct = (maxDailyLoss / acc) * 100;
  const accountAfterLoss = acc - maxDailyLoss;
  const accountAfterWin = acc + profitAmount * tradesNum;
  const breakEvenWinRate = (1 / (1 + rrRatio)) * 100;

  // Scenarios
  const scenarios = [
    { wins: tradesNum, losses: 0 },
    { wins: Math.ceil(tradesNum * 0.7), losses: Math.floor(tradesNum * 0.3) },
    { wins: Math.ceil(tradesNum * 0.6), losses: Math.floor(tradesNum * 0.4) },
    { wins: Math.ceil(tradesNum / 2), losses: Math.floor(tradesNum / 2) },
    { wins: 0, losses: tradesNum },
  ].map(s => ({
    ...s,
    pnl: (s.wins * profitAmount) - (s.losses * riskAmount),
    final: acc + (s.wins * profitAmount) - (s.losses * riskAmount),
    winRate: Math.round((s.wins / tradesNum) * 100)
  }));

  const inputStyle = {
    width: "100%", padding: "11px 14px", background: t.inputBg,
    border: `1px solid ${t.border}`, color: t.text,
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 14,
    fontWeight: 700, borderRadius: 8, outline: "none",
  };

  const RISK_PRESETS = ["0.5","1","2","3","5"];
  const RR_PRESETS = ["1","2","3","4","5"];
  const CURRENCIES = ["$","€","£","₦","¥","د.إ"];
  const TRADES_PRESETS = ["3","5","10","15","20"];

  return (
    <div style={{ flex: 1, background: t.bg, overflowY: "auto" }}>
      <style>{`
        @keyframes popIn{from{transform:scale(0.97);opacity:0}to{transform:scale(1);opacity:1}}
        .pop{animation:popIn 0.3s ease forwards}
        input:focus{border-color:#0066ff !important; box-shadow:0 0 0 2px #0066ff22;}
        .preset-btn{transition:all 0.15s;cursor:pointer;}
        .preset-btn:hover{opacity:0.8;transform:scale(1.05);}
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00aaff" }} />
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color: dark ? "#00aaff" : "#0055cc", letterSpacing: 3 }}>RISK CALCULATOR</span>
          <span style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>· Protect your capital</span>
        </div>

        {/* Input Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>

          {/* Currency + Account */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>ACCOUNT SIZE</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {CURRENCIES.map(c => (
                <button key={c} className="preset-btn" onClick={() => setCurrency(c)}
                  style={{ padding: "6px 12px", background: currency === c ? "#0066ff" : "transparent", border: `1px solid ${currency === c ? "#0066ff" : t.border}`, color: currency === c ? "#fff" : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, borderRadius: 6 }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 900, color: "#0066ff", fontFamily: "'Orbitron', sans-serif" }}>{currency}</span>
              <input type="number" value={account} onChange={e => setAccount(e.target.value)}
                placeholder="Enter account balance"
                style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
          </div>

          {/* Risk % */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>RISK PER TRADE (%)</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {RISK_PRESETS.map(r => (
                <button key={r} className="preset-btn" onClick={() => { setRisk(r); setCustomRisk(""); }}
                  style={{ padding: "7px 16px", background: risk === r && !customRisk ? "#ee2244" : "transparent", border: `1px solid ${risk === r && !customRisk ? "#ee2244" : t.border}`, color: risk === r && !customRisk ? "#fff" : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  {r}%
                </button>
              ))}
              <input type="number" value={customRisk} onChange={e => { setCustomRisk(e.target.value); setRisk(""); }}
                placeholder="Custom %"
                style={{ ...inputStyle, width: 100, padding: "7px 10px", fontSize: 11 }} />
            </div>
            <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>
              💡 Professional traders risk 1-2% per trade. Never exceed 5%.
            </div>
          </div>

          {/* Risk/Reward */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>RISK/REWARD RATIO</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {RR_PRESETS.map(r => (
                <button key={r} className="preset-btn" onClick={() => { setRR(r); setCustomRR(""); }}
                  style={{ padding: "7px 16px", background: rr === r && !customRR ? "#00cc55" : "transparent", border: `1px solid ${rr === r && !customRR ? "#00cc55" : t.border}`, color: rr === r && !customRR ? "#fff" : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  {r}:1
                </button>
              ))}
              <input type="number" value={customRR} onChange={e => { setCustomRR(e.target.value); setRR(""); }}
                placeholder="Custom"
                style={{ ...inputStyle, width: 100, padding: "7px 10px", fontSize: 11 }} />
            </div>
            <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>
              💡 PRINCEX IQ recommends minimum 3:1. Lower ratios need higher win rate.
            </div>
          </div>

          {/* Max Trades Per Day */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>MAX TRADES PER DAY</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TRADES_PRESETS.map(tr => (
                <button key={tr} className="preset-btn" onClick={() => setTrades(tr)}
                  style={{ padding: "7px 16px", background: trades === tr ? "#aa66ff" : "transparent", border: `1px solid ${trades === tr ? "#aa66ff" : t.border}`, color: trades === tr ? "#fff" : t.textMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  {tr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {acc > 0 && riskPct > 0 && (
          <div className="pop" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Main Numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: dark ? "#1a0005" : "#fff0f3", border: "2px solid #ee224444", borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#ee2244", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 6 }}>MAX LOSS PER TRADE</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 900, color: "#ee2244" }}>{currency}{riskAmount.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>{riskPct}% of account</div>
              </div>
              <div style={{ background: dark ? "#001a0d" : "#e8fff3", border: "2px solid #00cc5544", borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#00cc55", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 6 }}>PROFIT PER TRADE</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 900, color: "#00cc55" }}>{currency}{profitAmount.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>{rrRatio}:1 risk/reward</div>
              </div>
            </div>

            {/* Daily Limits */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 12 }}>DAILY LIMITS ({tradesNum} trades max)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "🛑 MAX DAILY LOSS", value: `${currency}${maxDailyLoss.toFixed(2)}`, sub: `${maxDailyLossPct.toFixed(1)}% of account`, color: "#ee2244", bg: dark ? "#1a0005" : "#fff0f3" },
                  { label: "🎯 MAX DAILY PROFIT", value: `${currency}${(profitAmount * tradesNum).toFixed(2)}`, sub: `${((profitAmount * tradesNum / acc) * 100).toFixed(1)}% of account`, color: "#00cc55", bg: dark ? "#001a0d" : "#e8fff3" },
                  { label: "⚠ STOP TRADING AFTER LOSS", value: `${currency}${(maxDailyLoss / 2).toFixed(2)}`, sub: "Stop at 50% of daily max loss", color: "#ffaa00", bg: dark ? "#1a1000" : "#fffbe8" },
                ].map(({ label, value, sub, color, bg }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: bg, borderRadius: 8, border: `1px solid ${color}22` }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
                      <div style={{ fontSize: 9, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>{sub}</div>
                    </div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900, color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Break Even Win Rate */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>BREAK EVEN WIN RATE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>You need to win at least:</span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: "#ffaa00" }}>{breakEvenWinRate.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: dark ? "#0a1520" : "#e0eaf4", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${breakEvenWinRate}%`, height: "100%", background: "linear-gradient(90deg,#ffaa00,#ffdd00)", borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: t.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>
                With {rrRatio}:1 R/R — anything above {breakEvenWinRate.toFixed(1)}% win rate is profitable
              </div>
            </div>

            {/* Scenario Table */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 9, letterSpacing: 3, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>DAILY SCENARIOS ({tradesNum} trades)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {["WIN RATE","WINS","LOSSES","P&L","FINAL BALANCE"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", fontSize: 9, letterSpacing: 1, color: t.textLabel, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, textAlign: "center" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${t.border}22`, background: s.pnl > 0 ? (dark ? "#001a0d11" : "#e8fff322") : s.pnl < 0 ? (dark ? "#1a000511" : "#fff0f322") : "transparent" }}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900, color: s.winRate >= breakEvenWinRate ? "#00cc55" : "#ee2244" }}>{s.winRate}%</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#00cc55", fontWeight: 700 }}>{s.wins}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#ee2244", fontWeight: 700 }}>{s.losses}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900, color: s.pnl >= 0 ? "#00cc55" : "#ee2244" }}>
                          {s.pnl >= 0 ? "+" : ""}{currency}{s.pnl.toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900, color: s.final >= acc ? "#00cc55" : "#ee2244" }}>
                          {currency}{s.final.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rules */}
            <div style={{ background: dark ? "#001833" : "#e8f4ff", border: "1px solid #0066ff33", borderLeft: "4px solid #0066ff", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#0066ff", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, marginBottom: 10 }}>⚡ YOUR TRADING RULES</div>
              {[
                `Max loss per trade: ${currency}${riskAmount.toFixed(2)} (${riskPct}%)`,
                `Max profit target: ${currency}${profitAmount.toFixed(2)} (${(profitAmount/acc*100).toFixed(1)}%)`,
                `Stop trading for the day after: ${currency}${(maxDailyLoss/2).toFixed(2)} loss`,
                `Max trades today: ${tradesNum}`,
                `Min win rate needed to profit: ${breakEvenWinRate.toFixed(1)}%`,
                `Never revenge trade after a loss`,
                `Always wait for PRINCEX IQ signal before entering`,
              ].map((rule, i) => (
                <div key={i} style={{ fontSize: 11, color: dark ? "#4499cc" : "#0055aa", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 2 }}>✓ {rule}</div>
              ))}
            </div>

          </div>
        )}

        {!acc && (
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧮</div>
            <div style={{ fontSize: 13, color: t.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>Enter your account size above to see your risk calculations</div>
          </div>
        )}

      </div>
    </div>
  );
}
