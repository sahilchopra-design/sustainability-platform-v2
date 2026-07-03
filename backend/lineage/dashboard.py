"""
lineage.dashboard — generate a self-contained interactive lineage dashboard.

Reads backend/lineage_output/{summary.json, traces/*.json} and emits
lineage_dashboard/index.html with the data embedded (no server / CORS needed).

  python lineage/dashboard.py
"""

import os
import json
import time

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
PROJECT = os.path.dirname(BACKEND)
OUT_DIR = os.path.join(BACKEND, "lineage_output")
TRACES = os.path.join(OUT_DIR, "traces")
DASH_DIR = os.path.join(PROJECT, "lineage_dashboard")


def _load():
    summary = {}
    sp = os.path.join(OUT_DIR, "summary.json")
    if os.path.exists(sp):
        summary = json.load(open(sp, encoding="utf-8"))
    domains = {}
    if os.path.isdir(TRACES):
        for fn in sorted(os.listdir(TRACES)):
            if fn.endswith(".json"):
                try:
                    domains[fn[:-5]] = json.load(
                        open(os.path.join(TRACES, fn), encoding="utf-8"))
                except Exception:  # noqa: BLE001
                    pass
    learnings = {}
    lp = os.path.join(OUT_DIR, "learnings.json")
    if os.path.exists(lp):
        try:
            learnings = json.load(open(lp, encoding="utf-8"))
        except Exception:  # noqa: BLE001
            learnings = {}
    return {"summary": summary, "domains": domains, "learnings": learnings,
            "generated": time.strftime("%Y-%m-%d %H:%M:%S")}


HTML = r"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>A² Intelligence — Data Lineage</title>
<style>
  :root{
    --navy:#1b3a5c; --navyd:#12273d; --gold:#c5a96a; --goldd:#8a6f2e;
    --bg:#f4f6f9; --surface:#ffffff; --surfaceh:#eef1f6; --border:#e3e8ef;
    --borderl:#cfd6e0; --ink:#1a2433; --sec:#566373; --mut:#8a94a3;
    --accent:#2563a8; --green:#15a34a; --red:#dc2626; --amber:#d97706;
    --teal:#4d8a93;
    --mono:'JetBrains Mono','SF Mono','Consolas',monospace;
    --sans:'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
    font-size:13px;-webkit-font-smoothing:antialiased}
  a{color:var(--accent)}
  header{background:var(--navy);color:#fff;padding:0 18px;height:50px;display:flex;
    align-items:center;gap:14px;position:sticky;top:0;z-index:5}
  header .logo{width:30px;height:30px;border-radius:8px;background:var(--gold);
    color:var(--navyd);font-weight:800;font-family:var(--mono);display:flex;
    align-items:center;justify-content:center;font-size:12px}
  header h1{font-size:15px;font-weight:700;margin:0;letter-spacing:-0.01em}
  header .sub{font-size:10px;font-family:var(--mono);color:rgba(255,255,255,.45);
    letter-spacing:.06em;text-transform:uppercase}
  header .gen{margin-left:auto;font-size:10px;font-family:var(--mono);
    color:rgba(255,255,255,.5)}
  .totals{display:flex;gap:1px;background:var(--border);border-bottom:1px solid var(--border)}
  .totals .t{flex:1;background:var(--surface);padding:10px 16px}
  .totals .t .v{font-size:22px;font-weight:700;font-family:var(--mono);
    font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
  .totals .t .l{font-size:9px;font-family:var(--mono);color:var(--mut);
    text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-top:2px}
  .wrap{display:flex;height:calc(100vh - 50px - 64px)}
  .side{width:340px;flex-shrink:0;border-right:1px solid var(--border);
    background:var(--surface);overflow-y:auto}
  .side .search{padding:10px}
  .side input{width:100%;padding:7px 10px;border:1px solid var(--border);
    border-radius:7px;font-family:var(--sans);font-size:12px;outline:none;color:var(--ink)}
  .side input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,168,.08)}
  .dom{border-bottom:1px solid var(--border)}
  .dom>.h{padding:9px 12px;display:flex;align-items:center;gap:8px;cursor:pointer;
    user-select:none}
  .dom>.h:hover{background:var(--surfaceh)}
  .dom>.h .nm{font-weight:700;font-size:12px;flex:1;text-transform:capitalize}
  .dom>.h .ct{font-family:var(--mono);font-size:10px;color:var(--sec);
    background:var(--surfaceh);border:1px solid var(--border);border-radius:999px;
    padding:1px 7px}
  .txn{padding:7px 12px 7px 16px;display:flex;align-items:center;gap:8px;cursor:pointer;
    border-top:1px solid var(--border);font-size:11px}
  .txn:hover{background:var(--surfaceh)}
  .txn.sel{background:rgba(37,99,168,.08)}
  .txn .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .txn .m{font-family:var(--mono);font-size:8px;font-weight:700;color:var(--mut);
    width:34px;flex-shrink:0}
  .txn .p{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--sec)}
  .txn.sel .p{color:var(--ink);font-weight:600}
  .main{flex:1;overflow-y:auto;padding:18px 22px}
  .empty{color:var(--mut);text-align:center;margin-top:80px;font-size:13px}
  .crumb{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .crumb .badge{font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 7px;
    border-radius:5px;color:#fff}
  .crumb h2{font-size:16px;margin:0;font-family:var(--mono);font-weight:600;letter-spacing:-0.01em}
  .chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 16px}
  .chip{font-family:var(--mono);font-size:9px;font-weight:600;padding:2px 8px;
    border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--sec)}
  .chip.prov{border-color:transparent;color:#fff}
  .lanes{display:grid;grid-template-columns:300px 1fr 260px;gap:14px;align-items:start}
  .lane{background:var(--surface);border:1px solid var(--border);border-radius:10px;
    overflow:hidden}
  .lane>.lh{padding:9px 13px;border-bottom:1px solid var(--border);
    display:flex;align-items:center;gap:8px;background:var(--surfaceh)}
  .lane>.lh .ico{width:18px;height:18px;border-radius:5px;display:flex;align-items:center;
    justify-content:center;font-size:10px;color:#fff;font-weight:700}
  .lane>.lh .ti{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
    color:var(--ink)}
  .lane>.bd{padding:10px 13px}
  .src{border:1px solid var(--border);border-radius:7px;padding:8px 10px;margin-bottom:8px;
    background:var(--surface)}
  .src .tbl{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--teal)}
  .src .tbl.ref{color:var(--gold)}
  .src .meta{font-family:var(--mono);font-size:9px;color:var(--mut);margin-top:3px}
  .src .sql{font-family:var(--mono);font-size:9px;color:var(--sec);margin-top:5px;
    white-space:pre-wrap;word-break:break-word;line-height:1.5;max-height:0;overflow:hidden;
    transition:max-height .2s}
  .src.open .sql{max-height:400px}
  .src .err{color:var(--red)}
  .tree{font-family:var(--mono);font-size:11px}
  .node{margin-left:0}
  .node .row{display:flex;align-items:center;gap:7px;padding:3px 4px;border-radius:5px;cursor:pointer}
  .node .row:hover{background:var(--surfaceh)}
  .node .tw{width:11px;color:var(--mut);flex-shrink:0;text-align:center;font-size:9px}
  .node .nm{color:var(--ink);font-weight:600}
  .node .nm.err{color:var(--red)}
  .node .dur{color:var(--mut);font-size:9px}
  .node .sqlb{color:var(--teal);font-size:9px;font-weight:700}
  .node .file{color:var(--mut);font-size:9px;margin-left:auto;flex-shrink:0}
  .node .kids{margin-left:13px;border-left:1px solid var(--border);padding-left:5px;display:none}
  .node.open>.kids{display:block}
  .det{background:var(--surfaceh);border-radius:6px;padding:7px 9px;margin:2px 0 4px 18px;
    font-size:9.5px;line-height:1.6;display:none}
  .node.showdet>.det{display:block}
  .det .k{color:var(--accent);font-weight:700}
  .det .v{color:var(--sec);word-break:break-word}
  .out .kv{font-size:11px;margin-bottom:4px}
  .out .kv .k{color:var(--mut);font-family:var(--mono);font-size:9px;text-transform:uppercase;
    letter-spacing:.06em}
  .out .kv .v{font-family:var(--mono);color:var(--ink);font-weight:600}
  .out .errbox{background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.25);
    border-radius:7px;padding:8px 10px;color:var(--red);font-family:var(--mono);font-size:10px;
    white-space:pre-wrap;word-break:break-word;line-height:1.5}
  .tabs{display:flex;gap:2px;background:var(--surface);border-bottom:1px solid var(--border);padding:0 14px}
  .tab{appearance:none;border:none;background:none;font-family:var(--sans);font-size:12px;
    font-weight:600;color:var(--sec);padding:10px 14px;cursor:pointer;border-bottom:2px solid transparent}
  .tab:hover{color:var(--ink)}
  .tab.active{color:var(--navy);border-bottom-color:var(--gold)}
  .lrn{max-width:1100px;margin:0 auto;padding:20px 22px}
  .lrn h3{font-size:13px;margin:22px 0 10px;color:var(--ink);letter-spacing:-0.01em;
    display:flex;align-items:center;gap:8px}
  .lrn h3 .ic{width:20px;height:20px;border-radius:6px;background:var(--navy);color:#fff;
    display:inline-flex;align-items:center;justify-content:center;font-size:11px}
  .lcard{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:12px}
  .tagrow{display:flex;flex-wrap:wrap;gap:6px}
  .tag{font-family:var(--mono);font-size:10px;padding:3px 9px;border-radius:999px;
    border:1px solid var(--border);background:var(--bg);color:var(--sec)}
  .tag.warn{color:var(--amber);border-color:rgba(217,119,6,.3)}
  .ftable{width:100%;border-collapse:collapse;font-size:11px}
  .ftable td,.ftable th{text-align:left;padding:5px 8px;border-bottom:1px solid var(--border)}
  .ftable th{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);font-family:var(--mono)}
  .ftable td.n{font-family:var(--mono);font-weight:700;color:var(--ink);text-align:right;width:60px}
  .enh{border:1px solid var(--border);border-radius:9px;padding:11px 13px;margin-bottom:8px;background:var(--surface)}
  .enh .pri{font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;color:#fff;margin-right:8px}
  .enh .ti{font-weight:700;font-size:12px}
  .enh .area{font-family:var(--mono);font-size:9px;color:var(--mut);margin-left:6px}
  .enh .de{color:var(--sec);font-size:11px;margin-top:5px;line-height:1.55}
  .foot{font-size:9px;color:var(--mut);font-family:var(--mono);text-align:center;padding:8px}
  .legend{display:flex;gap:10px;flex-wrap:wrap;font-size:9px;color:var(--mut);
    font-family:var(--mono);padding:6px 0}
  .legend span{display:inline-flex;align-items:center;gap:4px}
  .legend .d{width:8px;height:8px;border-radius:50%}
</style></head>
<body>
<header>
  <div class="logo">A²</div>
  <div><h1>Data Lineage</h1><div class="sub">A² Intelligence · E2E Transaction Ledger</div></div>
  <div class="gen" id="gen"></div>
</header>
<div class="totals" id="totals"></div>
<div class="tabs" id="tabs">
  <button class="tab active" data-v="lineage">Lineage Explorer</button>
  <button class="tab" data-v="learnings">Learnings &amp; Enhancements</button>
</div>
<div class="wrap" id="view-lineage">
  <div class="side">
    <div class="search"><input id="q" placeholder="Filter endpoints…"/></div>
    <div id="domains"></div>
  </div>
  <div class="main" id="main"><div class="empty">Select a transaction to view its source → transform → output lineage.</div></div>
</div>
<div id="view-learnings" style="display:none"><div class="lrn" id="learnings"></div></div>
<div class="foot" id="foot"></div>
<script>
const DATA = __DATA__;
const PROV_COLORS = {'real-db':'#15a34a','reference-data':'#c5a96a','mock-sample':'#d97706',
  'db-empty':'#8a94a3','computed':'#2563a8'};
const statusColor = s => s==='passed' ? '#15a34a' : s==='failed' ? '#dc2626' : '#8a94a3';
const esc = s => (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

document.getElementById('gen').textContent = 'generated ' + DATA.generated;

// totals
const T = (DATA.summary.totals)||{};
const totals = [
  ['Domains', T.domains||Object.keys(DATA.domains).length],
  ['Transactions', T.transactions||0],
  ['Passed', T.passed||0, '#15a34a'],
  ['Failed', T.failed||0, T.failed?'#dc2626':null],
  ['Functions traced', T.functions_traced||0],
  ['SQL statements', T.sql_statements||0],
];
document.getElementById('totals').innerHTML = totals.map(([l,v,c])=>
  `<div class="t"><div class="v" ${c?`style="color:${c}"`:''}>${Number(v).toLocaleString()}</div><div class="l">${l}</div></div>`).join('');

// sidebar
let SEL=null;
const domEl = document.getElementById('domains');
function renderSide(filter=''){
  const f = filter.toLowerCase();
  domEl.innerHTML='';
  Object.keys(DATA.domains).sort().forEach(dn=>{
    const payload = DATA.domains[dn];
    let txns = payload.transactions||[];
    if(f) txns = txns.filter(t=>t.label.toLowerCase().includes(f) ||
       (t.source_tables||[]).join(' ').toLowerCase().includes(f));
    if(!txns.length) return;
    const pass = txns.filter(t=>t.status==='passed').length;
    const d = document.createElement('div'); d.className='dom';
    const open = f? true : (SEL && SEL.dom===dn);
    d.innerHTML = `<div class="h"><span class="nm">${esc(dn.replace(/-/g,' '))}</span>
      <span class="ct" style="color:${pass===txns.length?'#15a34a':'#566373'}">${pass}/${txns.length}</span>
      <span class="ct">${(payload.transactions||[]).reduce((a,t)=>a+(t.node_count||0),0)} fns</span></div>
      <div class="list" style="display:${open?'block':'none'}"></div>`;
    const list = d.querySelector('.list');
    txns.forEach(t=>{
      const idx = (payload.transactions||[]).indexOf(t);
      const el=document.createElement('div');
      el.className='txn'+(SEL&&SEL.dom===dn&&SEL.idx===idx?' sel':'');
      const m = t.label.split(' ')[0], p = t.label.split(' ').slice(1).join(' ');
      el.innerHTML=`<span class="dot" style="background:${statusColor(t.status)}"></span>
        <span class="m">${m}</span><span class="p" title="${esc(p)}">${esc(p.replace(/^\/api\/v1\//,''))}</span>`;
      el.onclick=()=>{SEL={dom:dn,idx};renderSide(filter);renderMain();};
      list.appendChild(el);
    });
    d.querySelector('.h').onclick=()=>{list.style.display=list.style.display==='none'?'block':'none';};
    domEl.appendChild(d);
  });
}
document.getElementById('q').oninput=e=>renderSide(e.target.value);

// main detail
function renderMain(){
  const main=document.getElementById('main');
  if(!SEL){main.innerHTML='<div class="empty">Select a transaction.</div>';return;}
  const t = DATA.domains[SEL.dom].transactions[SEL.idx];
  const sc = statusColor(t.status);
  let h = `<div class="crumb"><span class="badge" style="background:${sc}">${t.status.toUpperCase()}</span>
    <h2>${esc(t.label)}</h2></div>`;
  h += `<div class="chips">`;
  (t.provenance||[]).forEach(p=>h+=`<span class="chip prov" style="background:${PROV_COLORS[p]||'#566373'}">${p}</span>`);
  h+=`<span class="chip">${t.node_count} functions</span>`;
  h+=`<span class="chip">${(t.sources||[]).length} SQL</span>`;
  h+=`<span class="chip">${t.dur_ms!=null?t.dur_ms.toFixed(1)+' ms':''}</span>`;
  if((t.truncated||[]).length) h+=`<span class="chip" style="color:#d97706">truncated: ${t.truncated.join(',')}</span>`;
  h+=`</div>`;

  // lanes
  h+=`<div class="lanes">`;
  // SOURCE
  h+=`<div class="lane"><div class="lh"><span class="ico" style="background:var(--teal)">⛁</span>
      <span class="ti">Source · Data</span></div><div class="bd">`;
  const inputs=t.inputs||{};
  if(Object.keys(inputs).length){
    h+=`<div style="font-size:9px;font-family:var(--mono);color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Inputs</div>`;
    for(const k in inputs) h+=`<div style="font-family:var(--mono);font-size:10px;margin-bottom:2px"><span style="color:var(--accent)">${esc(k)}</span> <span style="color:var(--sec)">${esc(inputs[k])}</span></div>`;
  }
  if((t.sources||[]).length){
    h+=`<div style="font-size:9px;font-family:var(--mono);color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin:10px 0 6px">DB reads (${t.sources.length})</div>`;
    t.sources.forEach((s,i)=>{
      const tbls=(s.tables||[]).map(tb=>`<span class="tbl ${s.is_reference?'ref':''}">${esc(tb)}</span>`).join(', ')||'<span class="tbl">—</span>';
      h+=`<div class="src" onclick="this.classList.toggle('open')">
        <div>${tbls}</div>
        <div class="meta">${s.rowcount!=null&&s.rowcount>=0?s.rowcount+' rows · ':''}${s.dur_ms} ms${s.error?' · <span class="err">ERROR</span>':''}</div>
        <div class="sql">${esc(s.sql)}${s.error?'\n\n⚠ '+esc(s.error):''}</div></div>`;
    });
  }
  if(!Object.keys(inputs).length && !(t.sources||[]).length) h+=`<div style="color:var(--mut);font-size:11px">No external source — pure computation.</div>`;
  h+=`</div></div>`;

  // TRANSFORM (call tree)
  h+=`<div class="lane"><div class="lh"><span class="ico" style="background:var(--navy)">ƒ</span>
      <span class="ti">Transform · Function Lineage</span></div><div class="bd"><div class="tree" id="tree"></div></div></div>`;

  // OUTPUT
  h+=`<div class="lane"><div class="lh"><span class="ico" style="background:${sc}">→</span>
      <span class="ti">Output</span></div><div class="bd out">`;
  const o=t.output_summary||{};
  h+=`<div class="kv"><div class="k">type</div><div class="v">${esc(o.type||'—')}</div></div>`;
  if(o.keys) h+=`<div class="kv"><div class="k">keys (${o.n_keys})</div><div class="v">${esc(o.keys.join(', '))}</div></div>`;
  if(o.len!=null) h+=`<div class="kv"><div class="k">length</div><div class="v">${o.len}</div></div>`;
  if(o.item0_keys) h+=`<div class="kv"><div class="k">item keys</div><div class="v">${esc(o.item0_keys.join(', '))}</div></div>`;
  if(o.repr) h+=`<div class="kv"><div class="k">value</div><div class="v">${esc(o.repr)}</div></div>`;
  h+=`<div class="kv"><div class="k">http</div><div class="v">${t.http_status||'—'}</div></div>`;
  if(t.error) h+=`<div class="errbox">${esc(t.error)}</div>`;
  h+=`</div></div></div>`;

  main.innerHTML=h;
  // build tree
  const treeEl=document.getElementById('tree');
  if(!(t.tree||[]).length){treeEl.innerHTML='<div style="color:var(--mut)">No application functions recorded.</div>';}
  else t.tree.forEach(n=>treeEl.appendChild(nodeEl(n,t.sources||[])));
}

function nodeEl(n, sources){
  const wrap=document.createElement('div'); wrap.className='node open';
  const hasKids=(n.children||[]).length>0;
  const sqlBadge = (n.sql||[]).length? `<span class="sqlb">⛁${n.sql.length}</span>`:'';
  const row=document.createElement('div'); row.className='row';
  row.innerHTML=`<span class="tw">${hasKids?'▾':'·'}</span>
    <span class="nm${n.error?' err':''}">${esc(n.qual||n.name)}</span>
    ${sqlBadge}
    <span class="dur">${n.dur_ms!=null?n.dur_ms.toFixed(2)+'ms':''}</span>
    <span class="file">${esc(n.file)}:${n.line}</span>`;
  const det=document.createElement('div'); det.className='det';
  let dh='';
  const args=n.args||{};
  if(Object.keys(args).length){dh+='<div><span class="k">args</span></div>';
    for(const k in args) dh+=`<div><span class="k">${esc(k)}</span> = <span class="v">${esc(args[k])}</span></div>`;}
  if(n.ret!=null) dh+=`<div><span class="k">return</span> = <span class="v">${esc(n.ret)}</span></div>`;
  (n.sql||[]).forEach(si=>{const s=sources[si]; if(s) dh+=`<div><span class="k">SQL</span> <span class="v">${esc((s.tables||[]).join(','))} · ${s.rowcount} rows</span></div>`;});
  if(n.error) dh+=`<div><span class="k" style="color:var(--red)">error</span> <span class="v">${esc(n.error)}</span></div>`;
  det.innerHTML=dh||'<span class="v" style="color:var(--mut)">no args/return captured</span>';
  const kids=document.createElement('div'); kids.className='kids';
  (n.children||[]).forEach(c=>kids.appendChild(nodeEl(c,sources)));
  row.onclick=(e)=>{e.stopPropagation();
    wrap.classList.toggle('showdet');
    if(hasKids) wrap.classList.toggle('open');};
  wrap.appendChild(row); wrap.appendChild(det); wrap.appendChild(kids);
  return wrap;
}

// ── Learnings & Enhancements view ──
const PRI={'P0':'#dc2626','P1':'#d97706','P2':'#2563a8','P3':'#8a94a3'};
function renderLearnings(){
  const L=DATA.learnings||{}; const el=document.getElementById('learnings');
  if(!L.coverage){el.innerHTML='<div class="empty">No learnings yet — run lineage/analyze.py.</div>';return;}
  const c=L.coverage; let h='';
  h+=`<div class="lcard"><div class="tagrow">
    <span class="tag">${c.transactions} transactions</span>
    <span class="tag" style="color:var(--green)">${c.passed} passed</span>
    <span class="tag" style="color:var(--red)">${c.failed} failed</span>
    <span class="tag">${c.skipped_mutations} mutations skipped</span>
    <span class="tag">${(c.functions_traced||0).toLocaleString()} functions</span>
    <span class="tag">${(c.sql_statements||0).toLocaleString()} SQL</span>
    <span class="tag">${c.tables_touched} tables</span></div>
    <div class="tagrow" style="margin-top:8px">${Object.entries(c.provenance||{}).map(([k,v])=>`<span class="tag" style="color:${PROV_COLORS[k]||'#566373'}">${k} · ${v}</span>`).join('')}</div></div>`;

  // corrections vs observations
  const cs=L.corrections_summary||{};
  h+=`<h3><span class="ic" style="background:var(--red)">✚</span>Corrections — likely real bugs (${cs.corrections||0})</h3>`;
  (L.corrections||[]).slice(0,30).forEach(c=>{
    h+=`<div class="enh"><span class="pri" style="background:var(--red)">×${c.count}</span>
      <span class="ti">${esc(c.class)}</span><span class="area">${esc((c.domains||[]).slice(0,5).join(', '))}</span>
      <div class="de"><span style="font-family:var(--mono);color:var(--ink)">${esc(c.signature)}</span><br>
      <span style="color:var(--mut)">${esc((c.endpoints||[]).slice(0,4).join('  ·  '))}</span><br>
      <span style="color:var(--accent)">→ ${esc(c.suggested)}</span></div></div>`;
  });
  if(!(L.corrections||[]).length) h+=`<div class="lcard" style="color:var(--green)">No real-data corrections detected — all failures classified as expected/observations.</div>`;
  h+=`<h3><span class="ic" style="background:var(--mut)">◔</span>Observations — expected / known gaps (${cs.observations||0})</h3><div class="lcard"><table class="ftable"><tr><th>Class</th><th>Why expected</th><th>Count</th></tr>`;
  (L.observations||[]).slice(0,12).forEach(o=>h+=`<tr><td>${esc(o.class)}</td><td style="color:var(--sec)">${esc(o.suggested)}</td><td class="n">${o.count}</td></tr>`);
  h+=`</table></div>`;

  // failure taxonomy
  const ft=L.failure_taxonomy||{};
  h+=`<h3><span class="ic">!</span>Failure taxonomy</h3><div class="lcard"><table class="ftable">
    <tr><th>Failure class</th><th>Count</th></tr>`;
  Object.entries(ft.by_class||{}).forEach(([k,v])=>h+=`<tr><td>${esc(k)}</td><td class="n">${v}</td></tr>`);
  h+=`</table></div>`;

  // data gaps
  const dg=L.data_gaps||{};
  h+=`<h3><span class="ic">⛁</span>Data gaps — empty / unseeded tables (${(dg.empty_or_no_rows_tables||[]).length})</h3>
    <div class="lcard"><div class="tagrow">${(dg.empty_or_no_rows_tables||[]).map(t=>`<span class="tag warn">${esc(t)}</span>`).join('')||'<span class="tag">none</span>'}</div>
    <div style="font-size:10px;color:var(--mut);margin-top:8px">${esc(dg.note||'')}</div></div>`;

  // core tables
  h+=`<h3><span class="ic">★</span>Core source tables (most-read)</h3><div class="lcard"><div class="tagrow">`;
  Object.entries(L.core_source_tables||{}).forEach(([t,n])=>h+=`<span class="tag">${esc(t)} · ${n}</span>`);
  h+=`</div></div>`;

  // hotspots
  const hs=L.hotspots||{};
  h+=`<h3><span class="ic">ƒ</span>Hotspots</h3><div class="lcard">
    <div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Deepest call trees</div><table class="ftable"><tr><th>Endpoint</th><th>Functions</th></tr>`;
  (hs.deepest_calltrees||[]).slice(0,8).forEach(r=>h+=`<tr><td>${esc(r.endpoint)}</td><td class="n">${r.functions}</td></tr>`);
  h+=`</table><div style="font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 6px">Slowest</div><table class="ftable"><tr><th>Endpoint</th><th>ms</th></tr>`;
  (hs.slowest_ms||[]).slice(0,8).forEach(r=>h+=`<tr><td>${esc(r.endpoint)}</td><td class="n">${r.dur_ms!=null?r.dur_ms.toFixed(0):''}</td></tr>`);
  h+=`</table></div>`;

  // enhancement backlog
  h+=`<h3><span class="ic">↗</span>Enhancement backlog</h3>`;
  (L.enhancement_backlog||[]).forEach(e=>{
    h+=`<div class="enh"><span class="pri" style="background:${PRI[e.priority]||'#8a94a3'}">${e.priority}</span>
      <span class="ti">${esc(e.title)}</span><span class="area">${esc(e.area)}</span>
      <div class="de">${esc(e.detail)}</div></div>`;
  });
  el.innerHTML=h;
}
// tabs
document.querySelectorAll('#tabs .tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#tabs .tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const v=b.dataset.v;
  document.getElementById('view-lineage').style.display = v==='lineage'?'flex':'none';
  document.getElementById('view-learnings').style.display = v==='learnings'?'block':'none';
});
renderLearnings();

document.getElementById('foot').innerHTML =
  'Legend: '+Object.entries(PROV_COLORS).map(([k,v])=>`<span style="color:${v}">●</span> ${k}`).join(' &nbsp; ')+
  ' &nbsp;·&nbsp; click a function row to expand args/return · click a DB read to see SQL';
renderSide();
if(Object.keys(DATA.domains).length){const d0=Object.keys(DATA.domains).sort()[0];SEL={dom:d0,idx:0};renderSide();renderMain();}
</script>
</body></html>"""


def build():
    data = _load()
    os.makedirs(DASH_DIR, exist_ok=True)
    html = HTML.replace("__DATA__", json.dumps(data, default=str))
    out = os.path.join(DASH_DIR, "index.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(html)
    n_txn = sum(len(d.get("transactions", [])) for d in data["domains"].values())
    print(f"[dashboard] wrote {out}")
    print(f"[dashboard] {len(data['domains'])} domains · {n_txn} transactions embedded")
    return out


if __name__ == "__main__":
    build()
