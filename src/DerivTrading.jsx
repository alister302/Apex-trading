import { useState, useEffect, useRef } from "react";

const SERVER = "https://princex-api.onrender.com";
const DERIV_CLIENT_ID = "33UkT2qA409Ez6jqg3tW0";
const REDIRECT_URI = "https://princex-iq.vercel.app";

async function buildOAuthURL() {
  const array = crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier = Array.from(array)
    .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
    .join('');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const state = crypto.getRandomValues(new Uint8Array(16))
    .reduce((s,b) => s + b.toString(16).padStart(2,'0'), '');
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);
  return `https://auth.deriv.com/oauth2/auth?response_type=code&client_id=${DERIV_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=trade+account_manage&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

const SYMBOLS = [
  { symbol:"R_10",    name:"Volatility 10",   short:"V10"  },
  { symbol:"R_25",    name:"Volatility 25",   short:"V25"  },
  { symbol:"R_50",    name:"Volatility 50",   short:"V50"  },
  { symbol:"R_75",    name:"Volatility 75",   short:"V75"  },
  { symbol:"R_100",   name:"Volatility 100",  short:"V100" },
  { symbol:"1HZ10V",  name:"Vol 10 (1s)",     short:"V10s" },
  { symbol:"1HZ25V",  name:"Vol 25 (1s)",     short:"V25s" },
  { symbol:"1HZ50V",  name:"Vol 50 (1s)",     short:"V50s" },
  { symbol:"1HZ75V",  name:"Vol 75 (1s)",     short:"V75s" },
  { symbol:"1HZ100V", name:"Vol 100 (1s)",    short:"V100s"},
];

const DURATIONS = [
  { label:"1 Tick",   duration:1,  unit:"t" },
  { label:"5 Ticks",  duration:5,  unit:"t" },
  { label:"10 Ticks", duration:10, unit:"t" },
  { label:"1 Min",    duration:1,  unit:"m" },
  { label:"5 Min",    duration:5,  unit:"m" },
  { label:"15 Min",   duration:15, unit:"m" },
  { label:"30 Min",   duration:30, unit:"m" },
  { label:"1 Hour",   duration:1,  unit:"h" },
  { label:"4 Hours",  duration:4,  unit:"h" },
  { label:"24 Hours", duration:24, unit:"h" },
];

const STAKES = [0.5, 1, 2, 5, 10, 25, 50, 100];

export default function DerivTrading({ dark }) {
  const [token,        setToken]        = useState(localStorage.getItem("deriv_access_token")||null);
  const [accounts,     setAccounts]     = useState(JSON.parse(localStorage.getItem("deriv_accounts")||"[]"));
  const [activeAcc,    setActiveAcc]    = useState(null);
  const [balance,      setBalance]      = useState(null);
  const [symbol,       setSymbol]       = useState(SYMBOLS[2]);
  const [duration,     setDuration]     = useState(DURATIONS[1]);
  const [stake,        setStake]        = useState(1);
  const [price,        setPrice]        = useState(null);
  const [wsStatus,     setWsStatus]     = useState("disconnected");
  const [loading,      setLoading]      = useState(false);
  const [tradeResult,  setTradeResult]  = useState(null);
  const [openContracts,setOpenContracts]= useState([]);
  const [error,        setError]        = useState("");
  const [proposal,     setProposal]     = useState(null);
  const wsRef = useRef(null);
  const priceTimer = useRef(null);

  const t = {
    bg:dark?"#050a0f":"#f0f4f8", bgCard:dark?"rgba(0,20,40,0.9)":"#fff",
    border:dark?"#0d2a42":"#d0dce8", muted:dark?"#8899aa":"#445566", dim:dark?"#445566":"#778899",
  };

  // Handle OAuth callback
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const token1 = params.get("token1");
    const accs = [];
    let i = 1;
    while(params.get(`token${i}`)) {
      accs.push({
        token: params.get(`token${i}`),
        loginid: params.get(`acct${i}`),
        currency: params.get(`cur${i}`),
      });
      i++;
    }
    if (token1 && accs.length > 0) {
      window.history.replaceState({}, "", "/");
      localStorage.setItem("deriv_access_token", data.access_token);
      localStorage.setItem("deriv_accounts", JSON.stringify(accs));
      setToken(token1);
      setAccounts(accs);
      setActiveAcc(accs[0]);
    } else if (token && accounts.length > 0) {
      setActiveAcc(accounts[0]);
    }
  }, []);

  // Connect WebSocket when account selected
  useEffect(()=>{
    if (activeAcc) connectWS(activeAcc.token);
    return ()=>{ if(wsRef.current) wsRef.current.close(); };
  }, [activeAcc, symbol]);

  // Get proposal when inputs change
  useEffect(()=>{
    if (wsStatus==="connected" && price) getProposal();
  }, [symbol, duration, stake, wsStatus]);

  const connectWS = (tok) => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus("connecting"); setError(""); setBalance(null);

    const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    wsRef.current = ws;

    ws.onopen = () => {
      // Authorize with token
      ws.send(JSON.stringify({ authorize: tok||token }));
    };

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);

      if (d.msg_type === "authorize") {
        setWsStatus("connected");
        setBalance({ balance:d.authorize.balance, currency:d.authorize.currency, loginid:d.authorize.loginid });
        // Subscribe to ticks
        ws.send(JSON.stringify({ ticks: symbol.symbol, subscribe:1 }));
        // Get open contracts
        ws.send(JSON.stringify({ portfolio:1 }));
      }

      if (d.msg_type === "tick") {
        clearTimeout(priceTimer.current);
        priceTimer.current = setTimeout(()=>setPrice(d.tick?.quote), 200);
      }

      if (d.msg_type === "proposal") {
        if (!d.error) setProposal(d.proposal);
      }

      if (d.msg_type === "buy") {
        if (d.error) {
          setTradeResult({ success:false, error:d.error.message });
        } else {
          setTradeResult({ success:true, contractId:d.buy.contract_id, price:d.buy.buy_price, payout:d.buy.payout });
          // Refresh balance
          ws.send(JSON.stringify({ balance:1, subscribe:1 }));
        }
        setLoading(false);
      }

      if (d.msg_type === "balance") {
        setBalance(prev => ({...prev, balance:d.balance.balance, currency:d.balance.currency}));
      }

      if (d.msg_type === "portfolio") {
        setOpenContracts(d.portfolio?.contracts||[]);
      }

      if (d.error && d.msg_type !== "proposal") {
        setError(d.error.message||"Error occurred");
      }
    };

    ws.onerror = () => { setWsStatus("error"); setError("Connection failed"); };
    ws.onclose = () => setWsStatus("disconnected");
  };

  const getProposal = () => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({
      proposal: 1,
      amount: stake,
      basis: "stake",
      contract_type: "CALL",
      currency: activeAcc?.currency||"USD",
      duration: duration.duration,
      duration_unit: duration.unit,
      symbol: symbol.symbol,
    }));
  };

  const placeTrade = (direction) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) { setError("Not connected"); return; }
    if (!activeAcc) { setError("Select an account"); return; }
    setLoading(true); setTradeResult(null);

    wsRef.current.send(JSON.stringify({
      buy: 1,
      price: stake,
      parameters: {
        amount: stake,
        basis: "stake",
        contract_type: direction==="RISE"?"CALL":"PUT",
        currency: activeAcc?.currency||"USD",
        duration: duration.duration,
        duration_unit: duration.unit,
        symbol: symbol.symbol,
      }
    }));
  };

  const sellContract = (contractId) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ sell: contractId, price: 0 }));
  };

  const logout = () => {
    localStorage.removeItem("deriv_access_token");
    localStorage.removeItem("deriv_accounts");
    setToken(null); setAccounts([]); setActiveAcc(null);
    setBalance(null); setWsStatus("disconnected");
    if (wsRef.current) wsRef.current.close();
  };

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        .dbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .dbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .dbtn:disabled{opacity:0.4;cursor:not-allowed}
        .dchip{cursor:pointer;transition:all 0.12s;user-select:none}
        .dchip:hover{transform:scale(1.04)}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .blink{animation:blink 1s infinite}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #ff444f44", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ff444f", letterSpacing:2, marginBottom:2 }}>
                📈 DERIV TRADING
              </div>
              <div style={{ fontSize:9, color:t.dim }}>Rise/Fall · Volatility Indices · Real & Demo</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {token && (
                <>
                  <div className={wsStatus==="connected"?"blink":""} style={{ width:8,height:8,borderRadius:"50%",
                    background:wsStatus==="connected"?"#00dd55":wsStatus==="connecting"?"#ffaa00":"#ff4466" }}/>
                  <span style={{ fontSize:8, color:wsStatus==="connected"?"#00dd55":"#ff4466", fontWeight:700 }}>
                    {wsStatus.toUpperCase()}
                  </span>
                  <button className="dbtn" onClick={logout}
                    style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"5px 10px", borderRadius:5, fontSize:9 }}>
                    LOGOUT
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:18 }}>×</button>
          </div>
        )}

        {/* NOT LOGGED IN */}
        {!token && (
          <div>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"28px 20px", textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:52, marginBottom:12 }}>📈</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133", marginBottom:8 }}>
                TRADE RISE & FALL
              </div>
              <div style={{ fontSize:10, color:t.muted, lineHeight:1.9, marginBottom:24 }}>
                ✅ Trade directly on Deriv<br/>
                ✅ Real & Demo accounts<br/>
                ✅ Volatility indices 24/7<br/>
                ✅ From $0.50 per trade<br/>
                ✅ Instant payouts
              </div>
              <button className="dbtn" onClick={async()=>{ const url = await buildOAuthURL(); window.location.href=url; }}
                style={{ padding:"16px 32px", background:"linear-gradient(135deg,#ff444f,#cc2233)", color:"#fff",
                  borderRadius:10, fontSize:14, letterSpacing:2, width:"100%", marginBottom:10 }}>
                🔗 CONNECT DERIV ACCOUNT
              </button>
              <a href="https://deriv.com/signup/" target="_blank" rel="noopener noreferrer"
                style={{ display:"block", padding:"12px", background:"transparent",
                  border:`1px solid ${t.border}`, color:t.muted, borderRadius:8,
                  fontSize:11, textDecoration:"none", textAlign:"center" }}>
                Don't have Deriv? Sign up free →
              </a>
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:"#ff444f", fontWeight:700, marginBottom:10 }}>HOW IT WORKS</div>
              {[
                ["1","Connect your Deriv account (real or demo)"],
                ["2","Select volatility pair and duration"],
                ["3","Set your stake amount"],
                ["4","Tap RISE or FALL to place trade"],
                ["5","Win payout if prediction is correct"],
              ].map(([n,s])=>(
                <div key={n} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"center" }}>
                  <div style={{ width:22,height:22,borderRadius:"50%",background:"#ff444f22",border:"1px solid #ff444f44",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <span style={{ fontSize:9, color:"#ff444f", fontWeight:900 }}>{n}</span>
                  </div>
                  <span style={{ fontSize:10, color:t.muted }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGGED IN */}
        {token && (
          <div>
            {/* Account selector */}
            {accounts.length > 0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.dim, fontWeight:700, letterSpacing:1, marginBottom:8 }}>SELECT ACCOUNT</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {accounts.map(acc=>(
                    <div key={acc.loginid} className="dchip"
                      onClick={()=>setActiveAcc(acc)}
                      style={{ padding:"8px 14px",
                        background:activeAcc?.loginid===acc.loginid?"#ff444f22":"transparent",
                        border:`2px solid ${activeAcc?.loginid===acc.loginid?"#ff444f":t.border}`,
                        borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center" }}>
                      <div style={{ fontSize:10, color:dark?"#fff":"#001133", fontWeight:700 }}>{acc.loginid}</div>
                      <div style={{ fontSize:8, color:acc.loginid.startsWith("VRTC")?"#4499ff":"#ff4466" }}>
                        {acc.loginid.startsWith("VRTC")?"🔵 DEMO":"🔴 REAL"} · {acc.currency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Balance */}
            {balance && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10,
                padding:"12px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:9, color:t.dim }}>BALANCE · {balance.loginid}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:"#00dd55" }}>
                    {parseFloat(balance.balance).toFixed(2)} {balance.currency}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:9, color:t.dim }}>LIVE PRICE</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#ffd700" }}>
                    {price?.toFixed(2)||"---"}
                  </div>
                </div>
              </div>
            )}

            {/* Symbol selector */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
              <div style={{ fontSize:9, color:t.dim, fontWeight:700, letterSpacing:1, marginBottom:8 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {SYMBOLS.map(s=>(
                  <div key={s.symbol} className="dchip"
                    onClick={()=>{ setSymbol(s); setProposal(null); setPrice(null); }}
                    style={{ padding:"6px 12px",
                      background:symbol.symbol===s.symbol?"#ff444f":"transparent",
                      border:`2px solid ${symbol.symbol===s.symbol?"#ff444f":t.border}`,
                      color:symbol.symbol===s.symbol?"#fff":t.muted,
                      borderRadius:6, fontSize:9, fontWeight:700 }}>
                    {s.short}
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
              <div style={{ fontSize:9, color:t.dim, fontWeight:700, letterSpacing:1, marginBottom:8 }}>DURATION</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {DURATIONS.map(d=>(
                  <button key={d.label} className="dbtn"
                    onClick={()=>setDuration(d)}
                    style={{ padding:"6px 12px",
                      background:duration.label===d.label?"#8844ff":"transparent",
                      border:`1px solid ${duration.label===d.label?"#8844ff":t.border}`,
                      color:duration.label===d.label?"#fff":t.muted,
                      borderRadius:6, fontSize:9 }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stake */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontSize:9, color:t.dim, fontWeight:700, letterSpacing:1, marginBottom:8 }}>
                STAKE · Payout: {proposal ? `${parseFloat(proposal.payout).toFixed(2)} ${activeAcc?.currency||"USD"}` : "---"}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                {STAKES.map(s=>(
                  <button key={s} className="dbtn"
                    onClick={()=>setStake(s)}
                    style={{ padding:"8px 14px",
                      background:stake===s?"#ffd700":"transparent",
                      border:`1px solid ${stake===s?"#ffd700":t.border}`,
                      color:stake===s?"#000":t.muted,
                      borderRadius:6, fontSize:10 }}>
                    ${s}
                  </button>
                ))}
              </div>
              <input
                type="number" value={stake} min="0.5" step="0.5"
                onChange={e=>setStake(parseFloat(e.target.value)||0.5)}
                style={{ width:"100%", padding:"10px", background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                  border:`1px solid ${t.border}`, borderRadius:8, color:dark?"#c8d8e8":"#001133",
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:"none", boxSizing:"border-box" }}
              />
            </div>

            {/* Trade summary */}
            <div style={{ background:dark?"#0a1520":"#e8f4ff", border:"1px solid #4499ff33", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[
                  ["PAIR",     symbol.short,                    "#fff"],
                  ["DURATION", duration.label,                  "#8844ff"],
                  ["STAKE",    `$${stake}`,                     "#ffd700"],
                  ["PAYOUT",   proposal?`$${parseFloat(proposal.payout).toFixed(2)}`:"---", "#00dd55"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:7, color:t.dim, marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:11, color:c, fontWeight:700, fontFamily:"monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RISE / FALL buttons */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <button className="dbtn" onClick={()=>placeTrade("RISE")}
                disabled={loading||wsStatus!=="connected"}
                style={{ padding:"22px 0", background:"linear-gradient(135deg,#00aa44,#007733)",
                  color:"#fff", borderRadius:12, fontSize:18, letterSpacing:2,
                  boxShadow:wsStatus==="connected"?"0 4px 20px #00dd5544":"none" }}>
                ▲ RISE
              </button>
              <button className="dbtn" onClick={()=>placeTrade("FALL")}
                disabled={loading||wsStatus!=="connected"}
                style={{ padding:"22px 0", background:"linear-gradient(135deg,#cc2244,#991133)",
                  color:"#fff", borderRadius:12, fontSize:18, letterSpacing:2,
                  boxShadow:wsStatus==="connected"?"0 4px 20px #ff224444":"none" }}>
                ▼ FALL
              </button>
            </div>

            {/* Trade result */}
            {tradeResult && (
              <div style={{ background:tradeResult.success?"#001a0d":"#1a0005",
                border:`2px solid ${tradeResult.success?"#00dd55":"#ff2244"}`,
                borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                {tradeResult.success ? (
                  <div>
                    <div style={{ fontSize:12, color:"#00dd55", fontWeight:700, marginBottom:6 }}>✅ TRADE PLACED!</div>
                    <div style={{ fontSize:10, color:"#8899aa", fontFamily:"monospace", lineHeight:1.8 }}>
                      Contract: #{tradeResult.contractId}<br/>
                      Stake: ${tradeResult.price}<br/>
                      Potential payout: ${parseFloat(tradeResult.payout||0).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:12, color:"#ff2244", fontWeight:700, marginBottom:4 }}>❌ TRADE FAILED</div>
                    <div style={{ fontSize:10, color:"#ff5577", fontFamily:"monospace" }}>{tradeResult.error}</div>
                  </div>
                )}
                <button className="dbtn" onClick={()=>setTradeResult(null)}
                  style={{ marginTop:10, padding:"6px 14px", background:"transparent",
                    border:`1px solid ${t.border}`, color:t.muted, borderRadius:5, fontSize:9 }}>
                  DISMISS
                </button>
              </div>
            )}

            {/* Open contracts */}
            {openContracts.length > 0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:"#ffd700", fontWeight:700, letterSpacing:1, marginBottom:10 }}>
                  📋 OPEN CONTRACTS ({openContracts.length})
                </div>
                {openContracts.map(c=>(
                  <div key={c.contract_id} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"8px 0",
                    borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                    <div>
                      <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>
                        {c.contract_type==="CALL"?"▲ RISE":"▼ FALL"} · {c.underlying}
                      </div>
                      <div style={{ fontSize:9, color:t.dim }}>
                        Stake: ${c.buy_price} · Payout: ${c.payout}
                      </div>
                    </div>
                    <button className="dbtn" onClick={()=>sellContract(c.contract_id)}
                      style={{ background:"#ff224422", border:"1px solid #ff224433",
                        color:"#ff4466", padding:"5px 10px", borderRadius:5, fontSize:9 }}>
                      CLOSE
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Reconnect if needed */}
            {wsStatus==="disconnected" && (
              <button className="dbtn" onClick={()=>activeAcc&&connectWS(activeAcc.token)}
                style={{ width:"100%", padding:"12px", background:"transparent",
                  border:`1px solid ${t.border}`, color:t.muted, borderRadius:8,
                  fontSize:11, marginTop:10 }}>
                ⟳ RECONNECT
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
