import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Workflow Dashboard','Task Assignment','Deadline Manager','Evidence Collection','Approval Chain','Audit Pack Generator'];

const WORKFLOWS = [
  { id:1, name:'CSRD Annual Filing 2025', framework:'CSRD/ESRS', totalTasks:48, completed:32, inProgress:10, overdue:2, assignees:8, deadline:'2025-09-30', status:'In Progress' },
  { id:2, name:'TCFD Report 2024', framework:'TCFD', totalTasks:24, completed:22, inProgress:2, overdue:0, assignees:5, deadline:'2025-06-30', status:'Near Complete' },
  { id:3, name:'ISSB S2 Disclosure', framework:'ISSB', totalTasks:35, completed:18, inProgress:12, overdue:3, assignees:6, deadline:'2025-12-31', status:'In Progress' },
  { id:4, name:'SFDR Periodic Report', framework:'SFDR', totalTasks:20, completed:20, inProgress:0, overdue:0, assignees:4, deadline:'2025-03-31', status:'Complete' },
  { id:5, name:'UK TPT Submission', framework:'TPT', totalTasks:18, completed:8, inProgress:6, overdue:1, assignees:4, deadline:'2026-04-01', status:'In Progress' },
];

const TASKS = [
  { task:'Collect Scope 1 data', workflow:'CSRD', assignee:'J. Chen', status:'Complete', priority:'High', dueDate:'2025-04-15' },
  { task:'Validate Scope 2 methodology', workflow:'CSRD', assignee:'M. Kumar', status:'In Progress', priority:'High', dueDate:'2025-04-30' },
  { task:'Draft transition plan narrative', workflow:'CSRD', assignee:'S. Williams', status:'In Progress', priority:'Medium', dueDate:'2025-05-15' },
  { task:'Board review of climate risk', workflow:'TCFD', assignee:'Board Secretary', status:'Overdue', priority:'High', dueDate:'2025-03-31' },
  { task:'Scope 3 category screening', workflow:'ISSB', assignee:'A. Patel', status:'Not Started', priority:'Medium', dueDate:'2025-06-30' },
  { task:'Financial impact assessment', workflow:'CSRD', assignee:'L. Zhang', status:'In Progress', priority:'High', dueDate:'2025-05-30' },
  { task:'SFDR principal adverse indicators', workflow:'SFDR', assignee:'R. Becker', status:'Complete', priority:'High', dueDate:'2025-03-15' },
  { task:'Scenario analysis documentation', workflow:'ISSB', assignee:'K. Okafor', status:'Not Started', priority:'Medium', dueDate:'2025-07-31' },
];

const DEADLINES_TIMELINE = [
  { month:'Apr 25', active:12, overdue:2 },{ month:'May 25', active:18, overdue:3 },{ month:'Jun 25', active:22, overdue:4 },
  { month:'Jul 25', active:15, overdue:2 },{ month:'Aug 25', active:10, overdue:1 },{ month:'Sep 25', active:25, overdue:5 },
  { month:'Oct 25', active:8, overdue:1 },{ month:'Nov 25', active:12, overdue:2 },{ month:'Dec 25', active:20, overdue:3 },
];

const EVIDENCE = [
  { item:'GHG Inventory Report', type:'Data Report', status:'Collected', quality:'High', source:'Internal' },
  { item:'Energy Bills (12 months)', type:'Primary Data', status:'Collected', quality:'High', source:'Utility' },
  { item:'Scope 3 Supplier Surveys', type:'Survey', status:'Partial', quality:'Medium', source:'Supply Chain' },
  { item:'Board Minutes (Climate)', type:'Governance', status:'Collected', quality:'High', source:'Board Secretary' },
  { item:'Science-Based Target Letter', type:'Verification', status:'Pending', quality:'N/A', source:'SBTi' },
  { item:'EU Taxonomy Assessment', type:'Classification', status:'Partial', quality:'Medium', source:'Internal' },
  { item:'Assurance Provider Report', type:'Assurance', status:'Pending', quality:'N/A', source:'PwC' },
  { item:'Transition Plan Document', type:'Strategy', status:'Draft', quality:'Medium', source:'Sustainability Team' },
];

const APPROVAL_CHAIN = [
  { level:1, role:'Data Owner', approver:'Department Heads', status:'Approved', date:'2025-03-15' },
  { level:2, role:'Sustainability Lead', approver:'Chief Sustainability Officer', status:'Approved', date:'2025-03-20' },
  { level:3, role:'Legal Review', approver:'General Counsel', status:'In Review', date:null },
  { level:4, role:'CFO Sign-off', approver:'Chief Financial Officer', status:'Pending', date:null },
  { level:5, role:'Board Approval', approver:'Audit Committee', status:'Pending', date:null },
];

const STATUS_COLORS = { Complete:T.green, 'Near Complete':T.blue, 'In Progress':T.amber, Overdue:T.red, 'Not Started':T.textMut, Collected:T.green, Partial:T.amber, Pending:T.red, Draft:T.blue, Approved:T.green, 'In Review':T.amber };

export default function ComplianceWorkflowAutomationPage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);
  const [alertSub, setAlertSub] = useState(false);

  const totalTasks = WORKFLOWS.reduce((s,w)=>s+w.totalTasks,0);
  const completedTasks = WORKFLOWS.reduce((s,w)=>s+w.completed,0);
  const overdueTasks = WORKFLOWS.reduce((s,w)=>s+w.overdue,0);

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:150 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CR6</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>COMPLIANCE WORKFLOW AUTOMATION</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Compliance Workflow Automation Engine</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>CSRD, TCFD, ISSB, SFDR & TPT workflow management with multi-level approval</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button onClick={() => setAlertSub(!alertSub)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${alertSub?T.green:T.border}`, background:alertSub?T.green+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{alertSub?'🔔 Subscribed':'🔕 Alerts'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 4 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Active Workflows', WORKFLOWS.length.toString(), '5 frameworks', T.navy)}
            {card('Total Tasks', totalTasks.toString(), completedTasks+' completed', T.green)}
            {card('Overdue Tasks', overdueTasks.toString(), 'Needs attention', T.red)}
            {card('Completion Rate', Math.round(completedTasks/totalTasks*100)+'%', 'Overall progress', T.gold)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Workflow Progress</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={WORKFLOWS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="name" width={180} tick={{ fontSize:9, fontFamily:T.mono }}/><Tooltip/><Legend/>
                <Bar dataKey="completed" stackId="a" fill={T.green} name="Complete"/>
                <Bar dataKey="inProgress" stackId="a" fill={T.amber} name="In Progress"/>
                <Bar dataKey="overdue" stackId="a" fill={T.red} name="Overdue"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Task Assignments</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead><tr>{['Task','Workflow','Assignee','Status','Priority','Due Date'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{TASKS.map((t,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{t.task}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:12 }}>{t.workflow}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{t.assignee}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(STATUS_COLORS[t.status]||T.textMut)+'18', color:STATUS_COLORS[t.status]||T.textMut }}>{t.status}</span></td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:t.priority==='High'?T.red+'18':T.amber+'18', color:t.priority==='High'?T.red:T.amber }}>{t.priority}</span></td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:12 }}>{t.dueDate}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Monthly Task Deadlines & Overdue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={DEADLINES_TIMELINE}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="active" fill={T.navy} name="Active Tasks"/>
              <Bar dataKey="overdue" fill={T.red} name="Overdue"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Evidence Collection Checklist</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead><tr>{['Evidence Item','Type','Status','Quality','Source'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{EVIDENCE.map((e,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{e.item}</td>
                <td style={{ padding:'8px 12px', fontSize:12 }}>{e.type}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(STATUS_COLORS[e.status]||T.textMut)+'18', color:STATUS_COLORS[e.status]||T.textMut }}>{e.status}</span></td>
                <td style={{ padding:'8px 12px', fontSize:12 }}>{e.quality}</td>
                <td style={{ padding:'8px 12px', fontSize:12 }}>{e.source}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>Multi-Level Approval Chain</h3>
          <div style={{ display:'grid', gap:12 }}>
            {APPROVAL_CHAIN.map((a,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:14, background:T.bg, borderRadius:8, borderLeft:`4px solid ${STATUS_COLORS[a.status]||T.textMut}` }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:T.navy, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.mono, fontSize:14, fontWeight:700 }}>{a.level}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:T.navy, fontSize:14 }}>{a.role}</div>
                  <div style={{ fontSize:12, color:T.textSec }}>{a.approver}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:(STATUS_COLORS[a.status]||T.textMut)+'18', color:STATUS_COLORS[a.status]||T.textMut }}>{a.status}</span>
                  {a.date && <div style={{ fontFamily:T.mono, fontSize:10, color:T.textMut, marginTop:4 }}>{a.date}</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16 }}>
            <h4 style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:8 }}>Approval Progress</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={APPROVAL_CHAIN}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="role" tick={{ fontSize:9, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,1]}/>
                <Bar dataKey="level" name="Level">{APPROVAL_CHAIN.map((a,i)=><Cell key={i} fill={a.status==='Approved'?T.green:a.status==='In Review'?T.amber:T.textMut}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>Audit Pack Generator</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:20 }}>
            {['CSRD Filing Pack','TCFD Report Pack','ISSB S2 Disclosure Pack','SFDR Periodic Pack','UK TPT Pack'].map((pack,i)=>(
              <div key={i} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:16, textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📦</div>
                <div style={{ fontWeight:600, color:T.navy, fontSize:13 }}>{pack}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Generate complete pack</div>
              </div>
            ))}
          </div>
          <div style={{ padding:12, background:T.green+'10', border:`1px solid ${T.green}30`, borderRadius:6, fontSize:12, color:T.textSec }}>
            Each audit pack includes: executive summary, data tables, methodology notes, evidence register, approval signatures, and assurance-ready documentation.
          </div>
          <div style={{ marginTop:16 }}>
            <h4 style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:8 }}>Evidence Collection Status</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={[{name:'Collected',value:EVIDENCE.filter(e=>e.status==='Collected').length},{name:'Partial',value:EVIDENCE.filter(e=>e.status==='Partial').length},{name:'Pending',value:EVIDENCE.filter(e=>e.status==='Pending').length},{name:'Draft',value:EVIDENCE.filter(e=>e.status==='Draft').length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {[T.green,T.amber,T.red,T.blue].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie><Tooltip/><Legend/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          EFRAG ESRS Implementation Guidance · TCFD Recommended Disclosures · IFRS ISSB S1/S2 · EU SFDR RTS · UK TPT Disclosure Framework · ISO 14064-1 GHG Accounting
        </div>
      </div>
    </div>
  );
}
