import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['User Directory','Role & Permission Matrix','Team Management','Security & Compliance'];

const FIRST_NAMES=['Sarah','James','Emily','Michael','Olivia','William','Ava','Benjamin','Sophia','Ethan','Isabella','Alexander','Mia','Daniel','Charlotte','Matthew','Amelia','David','Harper','Joseph','Evelyn','Andrew','Abigail','Samuel','Elizabeth','Nathan','Grace','Christopher','Victoria','Ryan','Chloe','Lucas','Penelope','Henry','Lily','Owen','Zoey','Jack','Hannah','Liam','Nora','Thomas','Stella','Logan','Aria','Sebastian','Leah','Caleb','Hazel','Isaac'];
const LAST_NAMES=['Chen','O\'Brien','Nakamura','Patel','Kowalski','Williams','Garcia','Kim','Johansson','Al-Rashid','Thompson','Dubois','Santos','Andersson','Nguyen','Rivera','Schmidt','Yamamoto','Okonkwo','Murphy','Petrov','Chang','Hansen','Morales','Singh','Campbell','Fischer','Tanaka','Bennett','Costa','Park','Reeves','Larsen','Ali','Volkov','Torres','Lehmann','Watanabe','Osei','Sullivan','Kuznetsov','Zhao','Ericsson','Vasquez','Gupta','MacDonald','Weber','Sato','Abubakar','Quinn'];
const ROLES=['Super Admin','Platform Admin','ESG Analyst','Portfolio Manager','Risk Officer','Compliance Officer','Read-Only Viewer','External Auditor'];
const TEAMS=['ESG Strategy','Climate Risk','Regulatory Compliance','Portfolio Analytics','Supply Chain','Nature & Biodiversity'];
const STATUSES=['Active','Active','Active','Active','Active','Active','Active','Suspended','Invited','Active'];
const TIERS=['Enterprise','Enterprise','Professional','Professional','Professional','Enterprise','Basic','Professional','Enterprise','Professional'];

const USERS=Array.from({length:50},(_,i)=>{
  const fn=FIRST_NAMES[i%50],ln=LAST_NAMES[i%50];
  const role=ROLES[Math.floor(sr(i*7)*8)];
  const team=TEAMS[Math.floor(sr(i*11)*6)];
  const status=STATUSES[Math.floor(sr(i*13)*10)];
  const tier=TIERS[Math.floor(sr(i*17)*10)];
  const mfaEnabled=sr(i*19)>0.3;
  const daysAgo=Math.floor(sr(i*23)*90);
  const loginDate=new Date(2026,2,29-daysAgo);
  const sessCount=Math.floor(sr(i*29)*200+10);
  const modulesAccessed=Math.floor(sr(i*31)*40+5);
  return{
    id:i+1,firstName:fn,lastName:ln,name:`${fn} ${ln}`,
    email:`${fn.toLowerCase()}.${ln.toLowerCase().replace("'","")}@sustainanalytics.io`,
    role,team,status,tier,mfaEnabled,
    lastLogin:status==='Invited'?'Never':loginDate.toISOString().split('T')[0],
    loginCount:status==='Invited'?0:sessCount,
    modulesAccessed,
    created:new Date(2025,Math.floor(sr(i*37)*12),Math.floor(sr(i*41)*28)+1).toISOString().split('T')[0],
    apiKeysCount:Math.floor(sr(i*43)*4),
    failedLogins:Math.floor(sr(i*47)*8),
    securityScore:Math.floor(sr(i*53)*30+70),
    lastPasswordChange:new Date(2026,Math.floor(sr(i*59)*3),Math.floor(sr(i*61)*28)+1).toISOString().split('T')[0],
    ipAddress:`192.168.${Math.floor(sr(i*67)*255)}.${Math.floor(sr(i*71)*255)}`,
    browser:['Chrome 122','Firefox 124','Safari 17','Edge 122'][Math.floor(sr(i*73)*4)],
    os:['Windows 11','macOS 14','Ubuntu 22','macOS 13'][Math.floor(sr(i*79)*4)],
    dataExports:Math.floor(sr(i*83)*50),
    approvals:Math.floor(sr(i*89)*30),
  };
});

const DOMAINS=['ESG Strategy','Climate Risk','Regulatory Reporting','Portfolio Analytics','Supply Chain ESG',
  'Nature & Biodiversity','Governance Intelligence','Social & Just Transition','Decarbonisation & SBTi',
  'Private Markets ESG','Quantitative ESG','Financed Emissions','ESG Ratings Intelligence',
  'Transition Planning','Climate Finance','Physical Risk','Macro & Systemic Risk','Water Risk',
  'Circular Economy','Air Quality & Health','Land Use & Deforestation','Human Rights',
  'Executive Pay','Board Composition','Shareholder Activism','Anti-Corruption',
  'Proxy Voting','Diversity & Inclusion','Living Wage','Modern Slavery',
  'Community Impact','Workplace Health','CSRD/ESRS','SFDR','ISSB','UK SDR',
  'SEC Climate','CBAM Compliance','Green Taxonomy','Climate Sovereign Bonds',
  'Carbon Markets','Scenario Modelling','Contagion Analysis'];

const MODULES_PER_DOMAIN=[6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6];
const TOTAL_MODULES=DOMAINS.reduce((a,_,i)=>a+MODULES_PER_DOMAIN[i],0);

const ACTIONS=['view','edit','export','delete','approve'];
const ROLE_PERMS=ROLES.map((role,ri)=>{
  const perms={};
  DOMAINS.forEach((d,di)=>{
    const base=sr(ri*100+di*7);
    perms[d]={
      view:ri<=5||base>0.1,
      edit:ri<=3||(ri===4&&base>0.3)||(ri===5&&base>0.5),
      export:ri<=4||base>0.4,
      delete:ri<=1,
      approve:ri<=2||(ri===4&&base>0.5)||(ri===5&&base>0.6),
    };
  });
  return{role,perms};
});

const TEAM_DATA=TEAMS.map((team,ti)=>({
  id:ti+1,name:team,
  lead:USERS.find(u=>u.team===team&&(u.role==='Super Admin'||u.role==='Platform Admin'))||USERS.filter(u=>u.team===team)[0],
  members:USERS.filter(u=>u.team===team),
  modulesOwned:DOMAINS.slice(ti*7,ti*7+7).filter(Boolean),
  dataScope:['Full Portfolio Access','Climate & Physical Risk Data','Regulatory Filing Data','Portfolio Holdings & NAV','Supply Chain Tier 1-3','Biodiversity & Ecosystem Data'][ti],
  crossDeps:TEAMS.filter((_,j)=>j!==ti&&sr(ti*100+j)>0.5),
  activityLast30d:Math.floor(sr(ti*200)*5000+1000),
  openTickets:Math.floor(sr(ti*201)*15+2),
  avgResponseTime:+(sr(ti*203)*4+0.5).toFixed(1),
  complianceScore:Math.floor(sr(ti*207)*15+85),
}));

const SECURITY_EVENTS=Array.from({length:60},(_,i)=>({
  id:i+1,
  type:['Login Success','Login Failed','MFA Challenge','Password Reset','API Key Created','Session Expired','Permission Change','Data Export','Account Locked','IP Blocked'][Math.floor(sr(i*300)*10)],
  user:USERS[Math.floor(sr(i*301)*50)].name,
  timestamp:new Date(2026,2,29-Math.floor(sr(i*303)*30),Math.floor(sr(i*307)*24),Math.floor(sr(i*311)*60)).toISOString().replace('T',' ').slice(0,16),
  ip:`${Math.floor(sr(i*313)*200+10)}.${Math.floor(sr(i*317)*255)}.${Math.floor(sr(i*319)*255)}.${Math.floor(sr(i*323)*255)}`,
  severity:['Low','Low','Medium','Low','Medium','Low','High','Medium','High','High'][Math.floor(sr(i*300)*10)],
  success:sr(i*329)>0.2,
}));

const SESSION_DATA=Array.from({length:30},(_,i)=>({
  id:`sess_${String(i+1).padStart(4,'0')}`,
  user:USERS[Math.floor(sr(i*400)*50)].name,
  startTime:new Date(2026,2,29,Math.floor(sr(i*401)*24),Math.floor(sr(i*403)*60)).toISOString().replace('T',' ').slice(0,16),
  duration:`${Math.floor(sr(i*407)*120+5)}min`,
  ip:`192.168.${Math.floor(sr(i*409)*255)}.${Math.floor(sr(i*411)*255)}`,
  device:['Desktop','Laptop','Tablet','Mobile'][Math.floor(sr(i*413)*4)],
  active:sr(i*417)>0.4,
  pagesViewed:Math.floor(sr(i*419)*50+3),
}));

const SOC2_CHECKLIST=[
  {control:'CC1.1',desc:'COSO Principle 1 — Integrity & Ethical Values',status:'Compliant',evidence:'Code of conduct, annual training records'},
  {control:'CC1.2',desc:'Board Oversight of Internal Controls',status:'Compliant',evidence:'Board meeting minutes, governance charter'},
  {control:'CC2.1',desc:'Information Communication — Internal',status:'Compliant',evidence:'Internal comms policy, audit notifications'},
  {control:'CC3.1',desc:'Risk Assessment — Fraud Risk',status:'Partial',evidence:'Fraud risk matrix, pending anomaly detection'},
  {control:'CC5.1',desc:'Logical Access Controls',status:'Compliant',evidence:'RBAC config, MFA logs, session management'},
  {control:'CC5.2',desc:'Authentication & Credential Management',status:'Compliant',evidence:'Password policy, MFA enforcement, SSO config'},
  {control:'CC6.1',desc:'Encryption at Rest',status:'Compliant',evidence:'AES-256 config, key rotation logs'},
  {control:'CC6.2',desc:'Encryption in Transit',status:'Compliant',evidence:'TLS 1.3 certs, HSTS headers'},
  {control:'CC7.1',desc:'Monitoring & Detection',status:'Compliant',evidence:'Audit trail logs, alert configs'},
  {control:'CC7.2',desc:'Incident Response',status:'Partial',evidence:'IR playbook drafted, tabletop pending'},
  {control:'CC8.1',desc:'Change Management',status:'Compliant',evidence:'Git history, PR reviews, CI/CD logs'},
  {control:'CC9.1',desc:'Vendor Management',status:'Partial',evidence:'Vendor register, pending risk assessments'},
];

const API_KEYS_DATA=Array.from({length:15},(_,i)=>({
  id:`key_${String(i+1).padStart(3,'0')}`,
  name:['Data Export API','Portfolio Sync','Risk Engine','Compliance Bot','Webhook Relay','Report Generator','External Feed','Analytics Pipeline','Audit Logger','Backup Service','Migration Tool','Test Harness','Dev Sandbox','Staging Sync','Monitoring Agent'][i],
  user:USERS[Math.floor(sr(i*500)*50)].name,
  created:new Date(2025,Math.floor(sr(i*503)*12),Math.floor(sr(i*507)*28)+1).toISOString().split('T')[0],
  expires:new Date(2026,Math.floor(sr(i*509)*6)+3,Math.floor(sr(i*511)*28)+1).toISOString().split('T')[0],
  lastUsed:sr(i*513)>0.2?new Date(2026,2,29-Math.floor(sr(i*517)*14)).toISOString().split('T')[0]:'Never',
  requests7d:Math.floor(sr(i*519)*10000),
  scope:['read','read/write','read','admin','read/write','read','read','read/write','write','read','admin','read','read/write','read/write','read'][i],
  active:sr(i*521)>0.15,
}));

const IP_WHITELIST=['10.0.0.0/8','172.16.0.0/12','192.168.1.0/24','203.0.113.0/24','198.51.100.0/24','100.64.0.0/10'];

export default function UserRoleManagementPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[filterRole,setFilterRole]=useState('All');
  const[filterTeam,setFilterTeam]=useState('All');
  const[filterStatus,setFilterStatus]=useState('All');
  const[sortCol,setSortCol]=useState('name');
  const[sortDir,setSortDir]=useState(1);
  const[selectedUser,setSelectedUser]=useState(null);
  const[showInvite,setShowInvite]=useState(false);
  const[selectedUsers,setSelectedUsers]=useState([]);
  const[permView,setPermView]=useState('grid');
  const[compareRoles,setCompareRoles]=useState([0,2]);
  const[customRoleName,setCustomRoleName]=useState('');
  const[domainFilter,setDomainFilter]=useState('All');
  const[selectedTeam,setSelectedTeam]=useState(null);
  const[secTab,setSecTab]=useState(0);
  const[mfaPolicy,setMfaPolicy]=useState('Required');
  const[sessionTimeout,setSessionTimeout]=useState(30);
  const[passMinLength,setPassMinLength]=useState(12);
  const[passRequireSpecial,setPassRequireSpecial]=useState(true);
  const[secSearch,setSecSearch]=useState('');
  const[page,setPage]=useState(0);
  const PAGE_SIZE=12;

  const filteredUsers=useMemo(()=>{
    let u=[...USERS];
    if(search)u=u.filter(x=>x.name.toLowerCase().includes(search.toLowerCase())||x.email.toLowerCase().includes(search.toLowerCase()));
    if(filterRole!=='All')u=u.filter(x=>x.role===filterRole);
    if(filterTeam!=='All')u=u.filter(x=>x.team===filterTeam);
    if(filterStatus!=='All')u=u.filter(x=>x.status===filterStatus);
    u.sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];return(av<bv?-1:av>bv?1:0)*sortDir;});
    return u;
  },[search,filterRole,filterTeam,filterStatus,sortCol,sortDir]);

  const pagedUsers=useMemo(()=>filteredUsers.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filteredUsers,page]);
  const totalPages=Math.ceil(filteredUsers.length/PAGE_SIZE);

  const roleDistribution=useMemo(()=>ROLES.map(r=>({name:r,count:USERS.filter(u=>u.role===r).length})),[]);
  const teamDistribution=useMemo(()=>TEAMS.map(t=>({name:t,count:USERS.filter(u=>u.team===t).length})),[]);
  const statusDistribution=useMemo(()=>['Active','Suspended','Invited'].map(s=>({name:s,count:USERS.filter(u=>u.status===s).length})),[]);
  const mfaStats=useMemo(()=>[{name:'MFA Enabled',value:USERS.filter(u=>u.mfaEnabled).length},{name:'MFA Disabled',value:USERS.filter(u=>!u.mfaEnabled).length}],[]);

  const loginTrend=useMemo(()=>Array.from({length:30},(_,i)=>({
    day:`Mar ${i+1}`,
    logins:Math.floor(sr(i*600)*80+20),
    failed:Math.floor(sr(i*601)*8),
    unique:Math.floor(sr(i*603)*35+10),
  })),[]);

  const securityScoreDistribution=useMemo(()=>{
    const buckets=[0,0,0,0,0];
    USERS.forEach(u=>{const s=u.securityScore;if(s>=90)buckets[0]++;else if(s>=80)buckets[1]++;else if(s>=70)buckets[2]++;else if(s>=60)buckets[3]++;else buckets[4]++;});
    return[{range:'90-100',count:buckets[0]},{range:'80-89',count:buckets[1]},{range:'70-79',count:buckets[2]},{range:'60-69',count:buckets[3]},{range:'<60',count:buckets[4]}];
  },[]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>-d);else{setSortCol(col);setSortDir(1);}};
  const toggleUserSelect=(id)=>setSelectedUsers(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const ss={wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text,padding:24},
    card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16},
    tabBar:{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:24},
    tabBtn:(a)=>({padding:'12px 24px',cursor:'pointer',border:'none',background:a?T.surface:'transparent',color:a?T.gold:T.textSec,fontWeight:a?700:500,fontSize:14,fontFamily:T.font,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',transition:'all 0.2s'}),
    input:{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface,outline:'none',minWidth:200},
    select:{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,color:T.text,background:T.surface},
    btn:(c=T.navy)=>({padding:'8px 18px',background:c,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600}),
    btnOutline:{padding:'8px 18px',background:'transparent',color:T.navy,border:`1px solid ${T.navy}`,borderRadius:8,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600},
    badge:(c)=>({display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:c==='Active'?'#dcfce7':c==='Suspended'?'#fee2e2':c==='Invited'?'#fef3c7':c==='High'?'#fee2e2':c==='Medium'?'#fef3c7':'#dcfce7',color:c==='Active'?T.green:c==='Suspended'?T.red:c==='Invited'?T.amber:c==='High'?T.red:c==='Medium'?T.amber:T.green}),
    th:{padding:'10px 12px',textAlign:'left',fontSize:12,fontWeight:700,color:T.textSec,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px'},
    td:{padding:'10px 12px',fontSize:13,borderBottom:`1px solid ${T.borderL}`,verticalAlign:'middle'},
    metric:{textAlign:'center',padding:16},
    metricVal:{fontSize:28,fontWeight:800,fontFamily:T.mono,color:T.navy},
    metricLbl:{fontSize:11,color:T.textSec,marginTop:4,fontWeight:600,textTransform:'uppercase'},
    grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16},
    mono:{fontFamily:T.mono,fontSize:12},
    panel:{position:'fixed',top:0,right:0,width:480,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.gold}`,zIndex:1000,overflowY:'auto',padding:24,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},
    overlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:999},
  };

  const renderUserDirectory=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input style={ss.input} placeholder="Search users by name or email..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
        <select style={ss.select} value={filterRole} onChange={e=>{setFilterRole(e.target.value);setPage(0);}}>
          <option value="All">All Roles</option>{ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <select style={ss.select} value={filterTeam} onChange={e=>{setFilterTeam(e.target.value);setPage(0);}}>
          <option value="All">All Teams</option>{TEAMS.map(t=><option key={t}>{t}</option>)}
        </select>
        <select style={ss.select} value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(0);}}>
          <option value="All">All Status</option><option>Active</option><option>Suspended</option><option>Invited</option>
        </select>
        <button style={ss.btn(T.gold)} onClick={()=>setShowInvite(true)}>+ Invite User</button>
        {selectedUsers.length>0&&<span style={{fontSize:12,color:T.textSec,fontFamily:T.mono}}>{selectedUsers.length} selected</span>}
        {selectedUsers.length>0&&<button style={ss.btn(T.amber)} onClick={()=>setSelectedUsers([])}>Bulk Suspend</button>}
        {selectedUsers.length>0&&<button style={ss.btnOutline}>Export Selected</button>}
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'Total Users',value:USERS.length,color:T.navy},{label:'Active',value:USERS.filter(u=>u.status==='Active').length,color:T.green},{label:'MFA Enabled',value:USERS.filter(u=>u.mfaEnabled).length,color:T.sage},{label:'Avg Security Score',value:Math.round(USERS.reduce((a,u)=>a+u.securityScore,0)/USERS.length),color:T.gold}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Role Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={roleDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,count})=>`${name.split(' ')[0]} (${count})`}>
              {roleDistribution.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Team Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teamDistribution}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-20} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={ss.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={ss.th}><input type="checkbox" onChange={e=>setSelectedUsers(e.target.checked?filteredUsers.map(u=>u.id):[])}/></th>
              {[['name','Name'],['email','Email'],['role','Role'],['team','Team'],['status','Status'],['lastLogin','Last Login'],['mfaEnabled','MFA'],['tier','Tier'],['securityScore','Sec Score']].map(([k,l])=>(
                <th key={k} style={ss.th} onClick={()=>handleSort(k)}>{l}{sortCol===k?(sortDir===1?' ▲':' ▼'):''}</th>
              ))}
            </tr></thead>
            <tbody>{pagedUsers.map(u=>(
              <tr key={u.id} style={{cursor:'pointer',background:selectedUsers.includes(u.id)?T.surfaceH:'transparent'}} onClick={()=>setSelectedUser(u)}>
                <td style={ss.td}><input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={()=>toggleUserSelect(u.id)} onClick={e=>e.stopPropagation()}/></td>
                <td style={{...ss.td,fontWeight:600}}>{u.name}</td>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{u.email}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',background:T.surfaceH,borderRadius:4,fontSize:11,fontWeight:600}}>{u.role}</span></td>
                <td style={ss.td}>{u.team}</td>
                <td style={ss.td}><span style={ss.badge(u.status)}>{u.status}</span></td>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{u.lastLogin}</td>
                <td style={ss.td}><span style={{color:u.mfaEnabled?T.green:T.red,fontWeight:700,fontSize:12}}>{u.mfaEnabled?'ON':'OFF'}</span></td>
                <td style={ss.td}><span style={{fontSize:11}}>{u.tier}</span></td>
                <td style={{...ss.td,...ss.mono}}><span style={{color:u.securityScore>=80?T.green:u.securityScore>=60?T.amber:T.red,fontWeight:700}}>{u.securityScore}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16}}>
          <span style={{fontSize:12,color:T.textSec}}>{filteredUsers.length} users total</span>
          <div style={{display:'flex',gap:8}}>{Array.from({length:totalPages},(_,i)=>(
            <button key={i} onClick={()=>setPage(i)} style={{...ss.btn(page===i?T.navy:T.bg),color:page===i?'#fff':T.text,padding:'4px 12px',fontSize:12}}>{i+1}</button>
          ))}</div>
        </div>
      </div>

      {selectedUser&&<><div style={ss.overlay} onClick={()=>setSelectedUser(null)}/><div style={ss.panel}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18}}>{selectedUser.name}</h3>
          <button onClick={()=>setSelectedUser(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{...ss.mono,color:T.textSec,marginBottom:16}}>{selectedUser.email}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {[['Role',selectedUser.role],['Team',selectedUser.team],['Status',selectedUser.status],['Tier',selectedUser.tier],['MFA',selectedUser.mfaEnabled?'Enabled':'Disabled'],['Security Score',selectedUser.securityScore],['Last Login',selectedUser.lastLogin],['Login Count',selectedUser.loginCount],['Modules Used',selectedUser.modulesAccessed],['API Keys',selectedUser.apiKeysCount],['Data Exports',selectedUser.dataExports],['Approvals',selectedUser.approvals]].map(([k,v],i)=>(
            <div key={i} style={{padding:8,background:T.surfaceH,borderRadius:8}}>
              <div style={{fontSize:10,color:T.textMut,fontWeight:600,textTransform:'uppercase'}}>{k}</div>
              <div style={{fontSize:14,fontWeight:600,marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Recent Activity</div>
        <div style={{maxHeight:200,overflowY:'auto',marginBottom:16}}>
          {Array.from({length:10},(_,i)=>({
            action:['Viewed ESG Dashboard','Exported Portfolio Report','Updated Risk Parameters','Approved Calculation','Logged In','Modified Company Data','Generated CSRD Report','Accessed API','Changed Password','Viewed Audit Trail'][i],
            time:`${i+1}h ago`,
          })).map((a,i)=>(
            <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.borderL}`,display:'flex',justifyContent:'space-between',fontSize:12}}>
              <span>{a.action}</span><span style={{...ss.mono,color:T.textMut}}>{a.time}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Permissions Matrix (from Role)</div>
        <div style={{maxHeight:200,overflowY:'auto'}}>
          {DOMAINS.slice(0,12).map((d,i)=>{
            const rp=ROLE_PERMS.find(r=>r.role===selectedUser.role);
            const p=rp?.perms[d]||{};
            return(<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:`1px solid ${T.borderL}`,fontSize:11}}>
              <span style={{width:160,fontWeight:600}}>{d}</span>
              {ACTIONS.map(a=><span key={a} style={{width:50,textAlign:'center',color:p[a]?T.green:T.red,fontWeight:600}}>{p[a]?'Y':'N'}</span>)}
            </div>);
          })}
        </div>
        <div style={{display:'flex',gap:8,marginTop:20}}>
          <button style={ss.btn(T.navy)}>Edit User</button>
          <button style={ss.btn(selectedUser.status==='Suspended'?T.green:T.red)}>{selectedUser.status==='Suspended'?'Reactivate':'Suspend'}</button>
          <button style={ss.btnOutline}>Reset Password</button>
        </div>
      </div></>}

      {showInvite&&<><div style={ss.overlay} onClick={()=>setShowInvite(false)}/><div style={{...ss.panel,width:420}}>
        <h3 style={{margin:'0 0 20px'}}>Invite New User</h3>
        {[['First Name','text'],['Last Name','text'],['Email','email']].map(([label,type],i)=>(
          <div key={i} style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>{label}</label>
            <input style={{...ss.input,width:'100%'}} type={type} placeholder={label}/>
          </div>
        ))}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>Role</label>
          <select style={{...ss.select,width:'100%'}}>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>Team</label>
          <select style={{...ss.select,width:'100%'}}>{TEAMS.map(t=><option key={t}>{t}</option>)}</select>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>Subscription Tier</label>
          <select style={{...ss.select,width:'100%'}}><option>Enterprise</option><option>Professional</option><option>Basic</option></select>
        </div>
        <div style={{display:'flex',gap:8,marginTop:20}}>
          <button style={ss.btn(T.gold)}>Send Invitation</button>
          <button style={ss.btnOutline} onClick={()=>setShowInvite(false)}>Cancel</button>
        </div>
      </div></>}
    </div>
  );

  const renderRoleMatrix=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center'}}>
        <button style={ss.btn(permView==='grid'?T.navy:T.bg)} onClick={()=>setPermView('grid')}>Permission Grid</button>
        <button style={ss.btn(permView==='compare'?T.navy:T.bg)} onClick={()=>setPermView('compare')}>Compare Roles</button>
        <button style={ss.btn(permView==='custom'?T.navy:T.bg)} onClick={()=>setPermView('custom')}>Custom Role Builder</button>
        <select style={ss.select} value={domainFilter} onChange={e=>setDomainFilter(e.target.value)}>
          <option value="All">All Domains ({DOMAINS.length})</option>{DOMAINS.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'Total Roles',value:ROLES.length},{label:'Total Domains',value:DOMAINS.length},{label:'Total Modules',value:TOTAL_MODULES},{label:'Permission Entries',value:ROLES.length*DOMAINS.length*5}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={ss.metricVal}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      {permView==='grid'&&<div style={{...ss.card,overflowX:'auto'}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Role x Domain Permission Matrix</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>
            <th style={{...ss.th,position:'sticky',left:0,background:T.surface,zIndex:2,minWidth:160}}>Domain</th>
            {ROLES.map(r=><th key={r} style={{...ss.th,textAlign:'center',minWidth:90}} colSpan={1}>{r.split(' ')[0]}</th>)}
          </tr></thead>
          <tbody>{(domainFilter==='All'?DOMAINS:DOMAINS.filter(d=>d===domainFilter)).map((d,di)=>(
            <tr key={di} style={{background:di%2===0?'transparent':T.surfaceH}}>
              <td style={{...ss.td,position:'sticky',left:0,background:di%2===0?T.surface:T.surfaceH,fontWeight:600,fontSize:11}}>{d}</td>
              {ROLES.map((r,ri)=>{
                const rp=ROLE_PERMS[ri].perms[d];
                if(!rp)return<td key={ri} style={{...ss.td,textAlign:'center'}}>-</td>;
                const granted=ACTIONS.filter(a=>rp[a]).length;
                return<td key={ri} style={{...ss.td,textAlign:'center'}}>
                  <div style={{display:'flex',gap:2,justifyContent:'center'}}>
                    {ACTIONS.map(a=><span key={a} title={`${a}: ${rp[a]?'Yes':'No'}`} style={{width:10,height:10,borderRadius:2,background:rp[a]?T.green:T.red,opacity:rp[a]?1:0.3}}/>)}
                  </div>
                  <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{granted}/{ACTIONS.length}</div>
                </td>;
              })}
            </tr>
          ))}</tbody>
        </table>
        <div style={{marginTop:12,display:'flex',gap:16,fontSize:11,color:T.textSec}}>
          {ACTIONS.map((a,i)=><span key={a}>Pos {i+1}: {a}</span>)}
        </div>
      </div>}

      {permView==='compare'&&<div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Role Comparison</div>
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <select style={ss.select} value={compareRoles[0]} onChange={e=>setCompareRoles([+e.target.value,compareRoles[1]])}>{ROLES.map((r,i)=><option key={i} value={i}>{r}</option>)}</select>
          <span style={{alignSelf:'center',fontWeight:700}}>vs</span>
          <select style={ss.select} value={compareRoles[1]} onChange={e=>setCompareRoles([compareRoles[0],+e.target.value])}>{ROLES.map((r,i)=><option key={i} value={i}>{r}</option>)}</select>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={ss.th}>Domain</th>
            <th style={ss.th}>Action</th>
            <th style={{...ss.th,textAlign:'center'}}>{ROLES[compareRoles[0]]}</th>
            <th style={{...ss.th,textAlign:'center'}}>{ROLES[compareRoles[1]]}</th>
            <th style={{...ss.th,textAlign:'center'}}>Diff</th>
          </tr></thead>
          <tbody>{DOMAINS.slice(0,15).flatMap((d,di)=>ACTIONS.map((a,ai)=>{
            const p1=ROLE_PERMS[compareRoles[0]].perms[d]?.[a];
            const p2=ROLE_PERMS[compareRoles[1]].perms[d]?.[a];
            const diff=p1!==p2;
            return<tr key={`${di}-${ai}`} style={{background:diff?'#fef3c7':'transparent'}}>
              {ai===0?<td style={{...ss.td,fontWeight:600}} rowSpan={5}>{d}</td>:null}
              <td style={{...ss.td,fontSize:11}}>{a}</td>
              <td style={{...ss.td,textAlign:'center',color:p1?T.green:T.red,fontWeight:700}}>{p1?'YES':'NO'}</td>
              <td style={{...ss.td,textAlign:'center',color:p2?T.green:T.red,fontWeight:700}}>{p2?'YES':'NO'}</td>
              <td style={{...ss.td,textAlign:'center'}}>{diff?<span style={{color:T.amber,fontWeight:700}}>DIFF</span>:'-'}</td>
            </tr>;
          }))}</tbody>
        </table>
      </div>}

      {permView==='custom'&&<div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Custom Role Builder</div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>Role Name</label>
          <input style={{...ss.input,width:300}} value={customRoleName} onChange={e=>setCustomRoleName(e.target.value)} placeholder="e.g. Senior ESG Analyst"/>
        </div>
        <div style={{marginBottom:8,fontSize:12,color:T.textSec}}>Select base template:</div>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {ROLES.map(r=><button key={r} style={{...ss.btnOutline,fontSize:11,padding:'4px 12px'}}>{r}</button>)}
        </div>
        <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Configure Permissions</div>
        <div style={{maxHeight:400,overflowY:'auto'}}>
          {DOMAINS.slice(0,20).map((d,di)=>(
            <div key={di} style={{padding:'8px 0',borderBottom:`1px solid ${T.borderL}`}}>
              <div style={{fontWeight:600,fontSize:12,marginBottom:4}}>{d}</div>
              <div style={{display:'flex',gap:12}}>
                {ACTIONS.map(a=>(
                  <label key={a} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,cursor:'pointer'}}>
                    <input type="checkbox" defaultChecked={a==='view'}/>
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginTop:20}}>
          <button style={ss.btn(T.gold)}>Save Custom Role</button>
          <button style={ss.btnOutline}>Reset</button>
        </div>
      </div>}

      <div style={{...ss.card,marginTop:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Role Usage Analytics</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ROLES.map((r,i)=>({role:r.split(' ')[0],users:USERS.filter(u=>u.role===r).length,domains:Object.keys(ROLE_PERMS[i].perms).filter(d=>ROLE_PERMS[i].perms[d].view).length,exports:Math.floor(sr(i*700)*100+10)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="role" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/>
            <Bar dataKey="users" fill={T.navy} name="Users" radius={[4,4,0,0]}/>
            <Bar dataKey="domains" fill={T.gold} name="Domains Accessible" radius={[4,4,0,0]}/>
            <Legend/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTeamManagement=()=>(
    <div>
      <div style={{...ss.grid,gridTemplateColumns:'repeat(3,1fr)',marginBottom:24}}>
        {TEAM_DATA.map(t=>(
          <div key={t.id} style={{...ss.card,cursor:'pointer',border:selectedTeam===t.id?`2px solid ${T.gold}`:`1px solid ${T.border}`}} onClick={()=>setSelectedTeam(selectedTeam===t.id?null:t.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700}}>{t.name}</div>
              <span style={{...ss.mono,fontSize:11,color:T.textMut}}>{t.members.length} members</span>
            </div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>Lead: {t.lead?.name||'Unassigned'}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div style={{padding:6,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
                <div style={{...ss.mono,fontWeight:700,color:T.navy}}>{t.modulesOwned.length}</div>
                <div style={{fontSize:9,color:T.textMut}}>Modules</div>
              </div>
              <div style={{padding:6,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
                <div style={{...ss.mono,fontWeight:700,color:T.sage}}>{t.complianceScore}%</div>
                <div style={{fontSize:9,color:T.textMut}}>Compliance</div>
              </div>
            </div>
            <div style={{fontSize:10,color:T.textMut}}>Scope: {t.dataScope}</div>
          </div>
        ))}
      </div>

      {selectedTeam&&(()=>{
        const t=TEAM_DATA.find(x=>x.id===selectedTeam);
        if(!t)return null;
        return<div style={ss.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h3 style={{margin:0,fontSize:18}}>{t.name}</h3>
            <div style={{display:'flex',gap:8}}>
              <button style={ss.btn(T.gold)}>Add Member</button>
              <button style={ss.btnOutline}>Edit Team</button>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[['Members',t.members.length,T.navy],['Activity (30d)',fmt(t.activityLast30d),T.gold],['Avg Response',`${t.avgResponseTime}h`,T.sage],['Open Tickets',t.openTickets,T.amber]].map(([l,v,c],i)=>(
              <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:8,textAlign:'center'}}>
                <div style={{...ss.mono,fontSize:20,fontWeight:700,color:c}}>{v}</div>
                <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Team Members</div>
          <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16}}>
            <thead><tr>{['Name','Role','Status','Last Login','Modules Used','Security'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{t.members.map(u=>(
              <tr key={u.id}>
                <td style={{...ss.td,fontWeight:600}}>{u.name}</td>
                <td style={ss.td}>{u.role}</td>
                <td style={ss.td}><span style={ss.badge(u.status)}>{u.status}</span></td>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{u.lastLogin}</td>
                <td style={ss.td}>{u.modulesAccessed}</td>
                <td style={{...ss.td,...ss.mono,color:u.securityScore>=80?T.green:T.amber,fontWeight:700}}>{u.securityScore}</td>
              </tr>
            ))}</tbody>
          </table>

          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Owned Modules / Domains</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
            {t.modulesOwned.map((m,i)=><span key={i} style={{padding:'4px 12px',background:T.surfaceH,borderRadius:20,fontSize:11,fontWeight:600}}>{m}</span>)}
          </div>

          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Cross-Team Dependencies</div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {t.crossDeps.map((d,i)=><span key={i} style={{padding:'4px 12px',background:'#ede9fe',borderRadius:20,fontSize:11,fontWeight:600,color:'#7c3aed'}}>{d}</span>)}
          </div>

          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Team Activity (30 Days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={Array.from({length:30},(_,i)=>({day:i+1,actions:Math.floor(sr(selectedTeam*1000+i)*200+50)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="day" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/>
              <Area type="monotone" dataKey="actions" fill={T.gold} fillOpacity={0.2} stroke={T.gold} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>;
      })()}

      <div style={ss.card}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Team Comparison Dashboard</div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={[{metric:'Members',ESG:8,Climate:9,Regulatory:7,Portfolio:10,Supply:6,Nature:5},{metric:'Compliance',ESG:92,Climate:88,Regulatory:95,Portfolio:87,Supply:83,Nature:90},{metric:'Activity',ESG:78,Climate:85,Regulatory:72,Portfolio:90,Supply:65,Nature:70},{metric:'Response Time',ESG:85,Climate:75,Regulatory:90,Portfolio:70,Supply:80,Nature:88},{metric:'Modules',ESG:7,Climate:7,Regulatory:7,Portfolio:7,Supply:5,Nature:5}]}>
            <PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:T.textSec}}/>
            <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Radar name="ESG Strategy" dataKey="ESG" stroke={T.navy} fill={T.navy} fillOpacity={0.1}/>
            <Radar name="Climate Risk" dataKey="Climate" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/>
            <Radar name="Regulatory" dataKey="Regulatory" stroke={T.sage} fill={T.sage} fillOpacity={0.1}/>
            <Legend/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderSecurityCompliance=()=>{
    const SEC_TABS=['MFA & Sessions','Password & Access','Audit & GDPR','API Keys & SOC 2'];
    return<div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {SEC_TABS.map((st,i)=><button key={i} style={{...ss.btn(secTab===i?T.navy:T.bg),color:secTab===i?'#fff':T.text}} onClick={()=>setSecTab(i)}>{st}</button>)}
      </div>

      <div style={{...ss.grid,gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
        {[{label:'MFA Adoption',value:`${Math.round(USERS.filter(u=>u.mfaEnabled).length/USERS.length*100)}%`,color:T.green},{label:'Active Sessions',value:SESSION_DATA.filter(s=>s.active).length,color:T.navy},{label:'Failed Logins (7d)',value:SECURITY_EVENTS.filter(e=>e.type==='Login Failed').length,color:T.red},{label:'Avg Security Score',value:Math.round(USERS.reduce((a,u)=>a+u.securityScore,0)/USERS.length),color:T.gold}].map((m,i)=>(
          <div key={i} style={ss.card}><div style={ss.metric}><div style={{...ss.metricVal,color:m.color}}>{m.value}</div><div style={ss.metricLbl}>{m.label}</div></div></div>
        ))}
      </div>

      {secTab===0&&<>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>MFA Enforcement Dashboard</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>MFA Policy</div>
              <select style={ss.select} value={mfaPolicy} onChange={e=>setMfaPolicy(e.target.value)}>
                <option>Required</option><option>Optional</option><option>Required for Admins Only</option>
              </select>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={mfaStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  <Cell fill={T.green}/><Cell fill={T.red}/>
                </Pie><Tooltip {...tip}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Users Without MFA</div>
              <div style={{maxHeight:240,overflowY:'auto'}}>
                {USERS.filter(u=>!u.mfaEnabled).map(u=>(
                  <div key={u.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.borderL}`,fontSize:12}}>
                    <span style={{fontWeight:600}}>{u.name}</span>
                    <span style={{color:T.red,fontWeight:600}}>{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={ss.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700}}>Active Sessions ({SESSION_DATA.filter(s=>s.active).length})</div>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <span style={{fontSize:12,color:T.textSec}}>Session Timeout:</span>
              <select style={ss.select} value={sessionTimeout} onChange={e=>setSessionTimeout(+e.target.value)}>
                {[15,30,60,120].map(m=><option key={m} value={m}>{m} min</option>)}
              </select>
              <button style={ss.btn(T.red)}>Force Logout All</button>
            </div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Session ID','User','Start','Duration','IP','Device','Pages','Actions'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{SESSION_DATA.filter(s=>s.active).map(s=>(
              <tr key={s.id}>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{s.id}</td>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{s.user}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{s.startTime}</td>
                <td style={ss.td}>{s.duration}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{s.ip}</td>
                <td style={ss.td}>{s.device}</td>
                <td style={{...ss.td,...ss.mono}}>{s.pagesViewed}</td>
                <td style={ss.td}><button style={{...ss.btn(T.red),padding:'2px 8px',fontSize:10}}>End</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>}

      {secTab===1&&<>
        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Password Policy Configuration</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div>
              {[['Minimum Length',passMinLength,'number',setPassMinLength],['Maximum Age (days)',90,'number',null],['History (prevent reuse)',5,'number',null]].map(([label,val,type,setter],i)=>(
                <div key={i} style={{marginBottom:16}}>
                  <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>{label}</label>
                  <input style={ss.input} type={type} value={val} onChange={setter?e=>setter(+e.target.value):undefined} readOnly={!setter}/>
                </div>
              ))}
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                <input type="checkbox" checked={passRequireSpecial} onChange={e=>setPassRequireSpecial(e.target.checked)}/>
                Require special characters
              </label>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>IP Whitelist</div>
              <div style={{maxHeight:200,overflowY:'auto',marginBottom:12}}>
                {IP_WHITELIST.map((ip,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',borderBottom:`1px solid ${T.borderL}`,...ss.mono,fontSize:12}}>
                    <span>{ip}</span><button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:12}}>Remove</button>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <input style={ss.input} placeholder="Add CIDR range..."/>
                <button style={ss.btn(T.sage)}>Add</button>
              </div>
              <div style={{marginTop:16,fontSize:12,fontWeight:600,marginBottom:8}}>SSO / SAML Configuration</div>
              <div style={{padding:12,background:T.surfaceH,borderRadius:8,fontSize:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>SSO Provider</span><span style={{...ss.mono,fontWeight:700}}>Okta</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>SAML Entity ID</span><span style={{...ss.mono,fontSize:10}}>urn:sustainanalytics:saml</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>ACS URL</span><span style={{...ss.mono,fontSize:10}}>https://app.sustainanalytics.io/sso/acs</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>Status</span><span style={{color:T.green,fontWeight:700}}>Active</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Login Attempts (30 Days)</div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={loginTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="day" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Legend/>
              <Area type="monotone" dataKey="logins" fill={T.navy} fillOpacity={0.15} stroke={T.navy} name="Successful"/>
              <Area type="monotone" dataKey="failed" fill={T.red} fillOpacity={0.15} stroke={T.red} name="Failed"/>
              <Area type="monotone" dataKey="unique" fill={T.gold} fillOpacity={0.15} stroke={T.gold} name="Unique Users"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Security Score Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={securityScoreDistribution}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="range" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.sage} radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </>}

      {secTab===2&&<>
        <div style={ss.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700}}>Security Event Log</div>
            <input style={ss.input} placeholder="Search events..." value={secSearch} onChange={e=>setSecSearch(e.target.value)}/>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Time','User','Event Type','IP Address','Severity','Status'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{SECURITY_EVENTS.filter(e=>!secSearch||e.user.toLowerCase().includes(secSearch.toLowerCase())||e.type.toLowerCase().includes(secSearch.toLowerCase())).slice(0,20).map(e=>(
              <tr key={e.id}>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.timestamp}</td>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{e.user}</td>
                <td style={ss.td}>{e.type}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{e.ip}</td>
                <td style={ss.td}><span style={ss.badge(e.severity)}>{e.severity}</span></td>
                <td style={ss.td}><span style={{color:e.success?T.green:T.red,fontWeight:600,fontSize:12}}>{e.success?'OK':'FAIL'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>GDPR Data Access Log (Article 30)</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Date','User','Data Subject','Purpose','Legal Basis','Retention'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{Array.from({length:12},(_,i)=>({
              date:new Date(2026,2,29-i*3).toISOString().split('T')[0],
              user:USERS[Math.floor(sr(i*800)*50)].name,
              subject:['Portfolio Holdings','Company ESG Data','Employee Records','Client PII','Vendor Data','Counterparty Info'][Math.floor(sr(i*803)*6)],
              purpose:['Analytics','Reporting','Compliance','Audit','Export','Review'][Math.floor(sr(i*807)*6)],
              basis:['Legitimate Interest','Consent','Legal Obligation','Contract Performance'][Math.floor(sr(i*811)*4)],
              retention:['30 days','90 days','1 year','3 years','7 years'][Math.floor(sr(i*813)*5)],
            })).map((r,i)=>(
              <tr key={i}>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{r.date}</td>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{r.user}</td>
                <td style={ss.td}>{r.subject}</td>
                <td style={ss.td}>{r.purpose}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',background:'#ede9fe',borderRadius:4,fontSize:10,color:'#7c3aed'}}>{r.basis}</span></td>
                <td style={{...ss.td,...ss.mono,fontSize:11}}>{r.retention}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>User Consent Tracking</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {['Data Processing Consent','Marketing Communications','Third-Party Sharing','Analytics Cookies','Essential Cookies','Data Retention Policy'].map((c,i)=>(
              <div key={i} style={{padding:12,background:T.surfaceH,borderRadius:8}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{c}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{...ss.mono,fontSize:11,color:T.green}}>{Math.floor(sr(i*900)*15+35)} consented</span>
                  <span style={{...ss.mono,fontSize:11,color:T.red}}>{Math.floor(sr(i*901)*8+1)} declined</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {secTab===3&&<>
        <div style={ss.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700}}>API Key Management</div>
            <button style={ss.btn(T.gold)}>Generate New Key</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Key ID','Name','Owner','Created','Expires','Last Used','Requests (7d)','Scope','Status'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{API_KEYS_DATA.map(k=>(
              <tr key={k.id}>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{k.id}</td>
                <td style={{...ss.td,fontWeight:600,fontSize:12}}>{k.name}</td>
                <td style={ss.td}>{k.user}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{k.created}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{k.expires}</td>
                <td style={{...ss.td,...ss.mono,fontSize:10}}>{k.lastUsed}</td>
                <td style={{...ss.td,...ss.mono}}>{fmt(k.requests7d)}</td>
                <td style={ss.td}><span style={{padding:'2px 8px',background:k.scope==='admin'?'#fee2e2':k.scope==='read/write'?'#fef3c7':'#dcfce7',borderRadius:4,fontSize:10,fontWeight:600}}>{k.scope}</span></td>
                <td style={ss.td}><span style={{color:k.active?T.green:T.red,fontWeight:700,fontSize:12}}>{k.active?'Active':'Revoked'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={ss.card}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>SOC 2 Type II Compliance Checklist</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Control','Description','Status','Evidence'].map(h=><th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>{SOC2_CHECKLIST.map((c,i)=>(
              <tr key={i} style={{background:c.status==='Partial'?'#fef3c7':'transparent'}}>
                <td style={{...ss.td,...ss.mono,fontWeight:700}}>{c.control}</td>
                <td style={{...ss.td,fontSize:12}}>{c.desc}</td>
                <td style={ss.td}><span style={ss.badge(c.status==='Compliant'?'Active':'Invited')}>{c.status}</span></td>
                <td style={{...ss.td,fontSize:11,color:T.textSec}}>{c.evidence}</td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{marginTop:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:12,color:T.textSec}}>Compliance Score: <span style={{...ss.mono,fontWeight:700,color:T.green}}>{Math.round(SOC2_CHECKLIST.filter(c=>c.status==='Compliant').length/SOC2_CHECKLIST.length*100)}%</span></div>
            <div style={{display:'flex',gap:8}}>
              <button style={ss.btn(T.navy)}>Export SOC 2 Report</button>
              <button style={ss.btnOutline}>Schedule Audit</button>
            </div>
          </div>
        </div>
      </>}
    </div>;
  };

  return(
    <div style={ss.wrap}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginBottom:4}}>PLATFORM ADMINISTRATION / USER & ROLE MANAGEMENT</div>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>User & Role Management</h1>
        <p style={{margin:'4px 0 0',fontSize:13,color:T.textSec}}>Enterprise IAM for sustainability platform -- {USERS.length} users, {ROLES.length} roles, {TEAMS.length} teams, {TOTAL_MODULES} modules</p>
      </div>
      <div style={ss.tabBar}>{TABS.map((t,i)=><button key={i} style={ss.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}</div>
      {tab===0&&renderUserDirectory()}
      {tab===1&&renderRoleMatrix()}
      {tab===2&&renderTeamManagement()}
      {tab===3&&renderSecurityCompliance()}
    </div>
  );
}