import { useState, useEffect } from "react";

const SERVER = "https://princex-api.onrender.com";
const CLIENT_ID = "34731_EFdh6Dqb0UOI6OdxQCwX4tt2PPzESSBdfWw8kwAokpw0xxSEA6";
const REDIRECT_URI = "https://princex-iq.vercel.app";
const AUTH_URL = `https://connect.spotware.com/apps/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=trading`;

const SYMBOLS = ["EURUSD","GBPUSD","USDJPY","XAUUSD","USDCAD","AUDUSD","GBPJPY","EURJPY","USDCHF"];
const TV_MAP = {
  "EURUSD":"FX:EURUSD","GBPUSD":"FX:GBPUSD","USDJPY":"FX:USDJPY",
  "XAUUSD":"TVC:GOLD","USDCAD":"FX:USDCAD","AUDUSD":"FX:AUDUSD",
  "GBPJPY":"FX:GBPJPY","EURJPY":"FX:EURJPY","USDCHF":"FX:USDCHF",
};

export default function CtraderTab({ dark }) {
  const [token,       setToken]       = useState(localStorage.getItem("ct_token")||null);
  const [accounts,    setAccounts]    = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [balance,     setBalance]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [symbol,      setSymbol]      = useState("EURUSD");
  const [lotSize,     setLotSize]     = useState(0.01);
  const [tradeResult, setTradeResult] = useState(null);
  const [chartTF,     setChartTF]     = useState("15");
  const [step,        setStep]        = useState("login"); // login | dashboard

  const t = {
    bg:dark?"#050a0f":"#f0f4f8", bgCard:dark?"rgba(0,20,40,0.9)":"#fff",
    border:dark?"#0d2a42":"#d0dce8", muted:dark?"#8899aa":"#445566", dim:dark?"#445566":"#778899",
  };

  // Handle OAuth callback
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, "", "/");
      exchangeCode(code);
    } else if (token) {
      setStep("dashboard");
      fetchAccounts(token);
    }
  }, []);

  const exchangeCode = async (code) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SERVER}/ctrader/token`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ code, redirect_uri:REDIRECT_URI }),
      });
      const data = await res.json();
      if (data.error||data.errorCode) {
        setError(data.error||data.errorCode||"Auth failed — try again");
        setLoading(false); return;
      }
      const t = data.access_token||data.accessToken;
      if (!t) { setError("No access token returned"); setLoading(false); return; }
      localStorage.setItem("ct_token", t);
      setToken(t);
      setStep("dashboard");
      fetchAccounts(t);
    } catch(e) { setError("Connection failed: "+e.message); }
    setLoading(false);
  };

  const fetchAccounts = async (tok) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SERVER}/ctrader/accounts`, {
        headers:{ "x-ctrader-token": tok||token }
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      const accs = data.accounts||[];
      setAccounts(accs);
      if (accs.length>0) { setSelected(accs[0]); fetchBalance(accs[0], tok||token); }
    } catch(e) { setError("Failed to load accounts: "+e.message); }
    setLoading(false);
  };

  const fetchBalance = async (acc, tok) => {
    if (!acc) return;
    try {
      const res = await fetch(`${SERVER}/ctrader/balance/${acc.accountId||acc.id}`, {
        headers:{ "x-ctrader-token": tok||token }
      });
      const data = await res.json();
      if (!data.error) setBalance(data);
    } catch(e) {}
  };

  const placeTrade = async (direction) => {
    if (!selected) { setError("Select an account first"); return; }
    setLoading(true); setTradeResult(null);
    try {
      const res = await fetch(`${SERVER}/ctrader/trade`, {
        method:"POST", headers:{"Content-Type":"application/json","x-ctrader-token":token},
        body: JSON.stringify({
          accountId: selected.accountId||selected.id,
          symbol, direction,
          volume: Math.round(lotSize*100000),
        }),
      });
      const data = await res.json();
      if (data.error) setTradeResult({ success:false, error:data.error });
      else { setTradeResult({ success:true, orderId:data.orderId||data.id }); fetchBalance(selected, token); }
    } catch(e) { setTradeResult({ success:false, error:e.message }); }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("ct_token");
    setToken(null); setAccounts([]); setSelected(null); setBalance(null);
    setStep("login"); setError(""); setTradeResult(null);
  };

  const bal = parseFloat(balance?.balance||balance?.totalBalance||0);
  const eq  = parseFloat(balance?.equity||balance?.totalBalance||0);
  const mg  = parseFloat(balance?.margin||balance?.usedMargin||0);

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`.cbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}.cbtn:hover:not(:disabled){opacity:0.85}.cbtn:disabled{opacity:0.4;cursor:not-allowed}`}</style>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #ff440044", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ff4400", letterSpacing:2, marginBottom:2 }}>
                🔴 PEPPERSTONE · CTRADER
              </div>
              <div style={{ fontSize:9, color:t.dim }}>
                {step==="dashboard" ? `Connected · ${accounts.length} account(s)` : "Connect your cTrader account"}
              </div>
            </div>
            {token && (
              <button className="cbtn" onClick={logout}
                style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>
                LOGOUT
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:18 }}>×</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:20, color:"#4499ff", fontSize:11, fontFamily:"monospace" }}>
            ⟳ Loading...
          </div>
        )}

        {/* LOGIN SCREEN */}
        {step==="login" && !loading && (
          <div>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"24px 20px", textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔗</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:dark?"#fff":"#001133", marginBottom:8 }}>
                CONNECT PEPPERSTONE
              </div>
              <div style={{ fontSize:10, color:t.muted, lineHeight:1.9, marginBottom:20 }}>
                ✅ View live balance & positions<br/>
                ✅ Place BUY/SELL from signals<br/>
                ✅ Manage trades directly<br/>
                ✅ Secure OAuth — your password never stored
              </div>
              <button className="cbtn" onClick={()=>window.location.href=AUTH_URL}
                style={{ padding:"16px 32px", background:"linear-gradient(135deg,#ff4400,#cc2200)", color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2, width:"100%" }}>
                🔗 CONNECT WITH CTRADER
              </button>
              <div style={{ fontSize:9, color:t.dim, marginTop:10 }}>
                You'll be redirected to Pepperstone/cTrader to authorize
              </div>
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:"#ff4400", fontWeight:700, marginBottom:10 }}>DON'T HAVE PEPPERSTONE?</div>
              <a href="https://pepperstone.com/en/open-live-account/" target="_blank" rel="noopener noreferrer"
                style={{ display:"block", padding:"12px 14px", background:dark?"#0a1520":"#f0f8ff",
                  border:"1px solid #ff440033", borderRadius:8, textDecoration:"none",
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>🔴 Open Pepperstone Account</span>
                <span style={{ fontSize:9, color:"#ff4400" }}>Register →</span>
              </a>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {step==="dashboard" && !loading && (
          <div>
            {/* Account selector */}
            {accounts.length>0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.dim, fontWeight:700, letterSpacing:1, marginBottom:8 }}>SELECT ACCOUNT</div>
                {accounts.map(acc=>(
                  <div key={acc.accountId||acc.id}
                    onClick={()=>{ setSelected(acc); fetchBalance(acc, token); }}
                    style={{ padding:"10px 12px", background:selected?.accountId===acc.accountId?"#ff440022":"transparent",
                      border:`2px solid ${selected?.accountId===acc.accountId?"#ff4400":t.border}`,
                      borderRadius:8, cursor:"pointer", marginBottom:6,
                      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>
                        {acc.accountNumber||acc.login||acc.accountId}
                      </div>
                      <div style={{ fontSize:9, color:t.dim }}>{acc.brokerName||"Pepperstone"}</div>
                    </div>
                    <div style={{ fontSize:9, color:acc.isLive?"#ff4400":"#4499ff", fontWeight:700 }}>
                      {acc.isLive?"🔴 LIVE":"🔵 DEMO"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Balance */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                ["BALANCE",  balance?`$${bal.toFixed(2)}`:"---", "#00dd55"],
                ["EQUITY",   balance?`$${eq.toFixed(2)}`:"---",  "#4499ff"],
                ["MARGIN",   balance?`$${mg.toFixed(2)}`:"---",  "#ffaa00"],
              ].map(([l,v,c])=>(
                <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:7, color:t.dim, letterSpacing:1, marginBottom:4 }}>{l}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* TradingView Chart */}
            <div style={{ borderRadius:10, overflow:"hidden", marginBottom:12, border:`1px solid ${t.border}` }}>
              <div style={{ padding:"5px 10px", background:dark?"#0a1520":"#e8f4ff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>📊 {symbol}</span>
                <div style={{ display:"flex", gap:4 }}>
                  {[["1","1M"],["5","5M"],["15","15M"],["60","1H"],["240","4H"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setChartTF(v)} className="cbtn"
                      style={{ padding:"2px 7px", background:chartTF===v?"#0066ff":"transparent",
                        border:`1px solid ${chartTF===v?"#0066ff":t.border}`,
                        color:chartTF===v?"#fff":t.muted, borderRadius:3, fontSize:8 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <iframe
                key={symbol+chartTF}
                src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_MAP[symbol]||"FX:EURUSD")}&interval=${chartTF}&theme=${dark?"dark":"light"}&style=1&locale=en&hide_top_toolbar=0&hide_legend=0&hide_side_toolbar=0&save_image=false&studies=RSI@tv-basicstudies,MACD@tv-basicstudies`}
                style={{ width:"100%", height:380, border:"none", display:"block" }}
                title={symbol} loading="lazy"
              />
            </div>

            {/* Trading panel */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#ff4400", fontWeight:700, letterSpacing:1, marginBottom:12 }}>⚡ PLACE TRADE</div>

              {/* Symbol */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:t.dim, marginBottom:5 }}>SYMBOL</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {SYMBOLS.map(s=>(
                    <button key={s} className="cbtn" onClick={()=>setSymbol(s)}
                      style={{ padding:"5px 10px", background:symbol===s?"#ff4400":"transparent",
                        border:`1px solid ${symbol===s?"#ff4400":t.border}`,
                        color:symbol===s?"#fff":t.muted, borderRadius:5, fontSize:9 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lot size */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.dim, marginBottom:5 }}>LOT SIZE</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {[0.01,0.05,0.1,0.25,0.5,1.0].map(l=>(
                    <button key={l} className="cbtn" onClick={()=>setLotSize(l)}
                      style={{ padding:"8px 12px", background:lotSize===l?"#ff4400":"transparent",
                        border:`1px solid ${lotSize===l?"#ff4400":t.border}`,
                        color:lotSize===l?"#fff":t.muted, borderRadius:5, fontSize:10 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy/Sell */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                <button className="cbtn" onClick={()=>placeTrade("BUY")} disabled={loading}
                  style={{ padding:"16px", background:"linear-gradient(135deg,#00aa44,#007733)", color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2 }}>
                  ▲ BUY
                </button>
                <button className="cbtn" onClick={()=>placeTrade("SELL")} disabled={loading}
                  style={{ padding:"16px", background:"linear-gradient(135deg,#cc2244,#991133)", color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2 }}>
                  ▼ SELL
                </button>
              </div>

              {tradeResult && (
                <div style={{ background:tradeResult.success?"#001a0d":"#1a0005",
                  border:`1px solid ${tradeResult.success?"#00dd5533":"#ff224433"}`,
                  borderRadius:8, padding:"10px 14px", fontSize:10,
                  color:tradeResult.success?"#00dd55":"#ff5577", fontFamily:"monospace" }}>
                  {tradeResult.success
                    ? `✅ Trade placed! Order #${tradeResult.orderId}`
                    : `❌ ${tradeResult.error}`}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button className="cbtn" onClick={()=>fetchBalance(selected, token)}
              style={{ width:"100%", padding:"10px", background:"transparent",
                border:`1px solid ${t.border}`, color:t.muted, borderRadius:8, fontSize:10 }}>
              ⟳ REFRESH BALANCE
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
