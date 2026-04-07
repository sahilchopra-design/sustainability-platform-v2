const fs=require('fs'),path=require('path');
const r=[];
function scan(d){
  fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{
    const f=path.join(d,e.name);
    if(e.isDirectory())scan(f);
    else if(e.name.endsWith('.jsx')&&f.includes('pages')){
      const c=fs.readFileSync(f,'utf8');
      const parts=f.split(path.sep);
      const fi=parts.indexOf('features');
      const slug=fi>=0&&parts.length>fi+1?parts[fi+1]:'unknown';
      const lines=c.split('\n').length;
      const states=(c.match(/useState/g)||[]).length;
      const charts=[...new Set((c.match(/BarChart|LineChart|AreaChart|PieChart|RadarChart|ScatterChart/g)||[]))].length;
      const S=/search|setSearch|filterText/i.test(c);
      const O=/sortCol|sortBy|setSort|sortDir/i.test(c);
      const P=/sidePanel|drawer|detailPanel|slideOut|selectedCompany|selectedRow|selected&&/i.test(c);
      const G=/pageNum|currentPage|setPage|pagination|perPage/i.test(c);
      const C=/blob|CSV|download.*csv|export.*csv/i.test(c);
      let score=Math.min(states*3,30)+Math.min(charts*3,15);
      if(S)score+=5;if(O)score+=5;if(P)score+=10;if(G)score+=5;if(C)score+=5;
      r.push({slug,score,lines,states,charts,S,O,P,G,C});
    }
  });
}
scan(path.join(__dirname,'features'));
r.sort((a,b)=>a.score-b.score);

const total=r.length;
const avg=Math.round(r.reduce((s,m)=>s+m.score,0)/total);
const u30=r.filter(m=>m.score<30).length;
const u50=r.filter(m=>m.score>=30&&m.score<50).length;
const u70=r.filter(m=>m.score>=50&&m.score<70).length;
const o70=r.filter(m=>m.score>=70).length;

console.log('=== INTERACTIVITY RE-SCAN ===');
console.log('Total modules: '+total);
console.log('Avg score: '+avg);
console.log('Score <30: '+u30);
console.log('Score 30-49: '+u50);
console.log('Score 50-69: '+u70);
console.log('Score 70+: '+o70);
console.log('\n=== BOTTOM 15 ===');
r.slice(0,15).forEach(m=>console.log(
  String(m.score).padStart(3)+' | '+
  String(m.lines).padStart(5)+'L | '+
  (m.S?'S':'-')+(m.O?'O':'-')+(m.P?'P':'-')+(m.G?'G':'-')+(m.C?'C':'-')+' | '+
  m.slug
));
console.log('\n=== MISSING FEATURES ===');
console.log('No search: '+r.filter(m=>!m.S).length+'/'+total);
console.log('No sort: '+r.filter(m=>!m.O).length+'/'+total);
console.log('No side panel: '+r.filter(m=>!m.P).length+'/'+total);
console.log('No pagination: '+r.filter(m=>!m.G).length+'/'+total);
console.log('No CSV export: '+r.filter(m=>!m.C).length+'/'+total);
