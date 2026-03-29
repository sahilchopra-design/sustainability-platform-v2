const fs=require('fs'),path=require('path');
const fd=path.join(__dirname,'features');
const r=[];
function scan(d){
  fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{
    const f=path.join(d,e.name);
    if(e.isDirectory())scan(f);
    else if(e.name.endsWith('.jsx')&&f.includes('pages')){
      const c=fs.readFileSync(f,'utf8');
      const norm=f.split(path.sep).join('/');
      const idx=norm.indexOf('/features/');
      const slug=idx>=0?norm.substring(idx+10).split('/')[0]:'unknown';
      const lines=c.split('\n').length;
      const states=(c.match(/useState/g)||[]).length;
      const charts=(c.match(/BarChart|LineChart|AreaChart|PieChart|RadarChart|ScatterChart/g)||[]);
      const hasSearch=/search|setSearch|filterText/i.test(c);
      const hasSort=/sortCol|sortBy|setSort|sortDir/i.test(c);
      const hasSidePanel=/sidePanel|drawer|detailPanel|slideOut|selectedCompany|selectedRow/i.test(c);
      const hasPagination=/pageNum|currentPage|setPage|pagination|perPage/i.test(c);
      const hasCSV=/blob|download.*csv|export.*csv/i.test(c);
      let score=Math.min(states*3,30)+Math.min([...new Set(charts)].length*3,15);
      if(hasSearch)score+=5;if(hasSort)score+=5;if(hasSidePanel)score+=10;if(hasPagination)score+=5;if(hasCSV)score+=5;
      r.push({slug,lines,states,charts:[...new Set(charts)].length,
        S:hasSearch,O:hasSort,P:hasSidePanel,G:hasPagination,C:hasCSV,score});
    }
  });
}
scan(fd);
r.sort((a,b)=>a.score-b.score);
console.log('=== BOTTOM 40 BY INTERACTIVITY ===');
r.slice(0,40).forEach(m=>console.log(
  String(m.score).padStart(3)+' | '+
  String(m.lines).padStart(5)+'L | '+
  String(m.states).padStart(2)+'st | '+
  m.charts+'ch | '+
  (m.S?'S':'-')+(m.O?'O':'-')+(m.P?'P':'-')+(m.G?'G':'-')+(m.C?'C':'-')+' | '+
  m.slug
));
console.log('\n=== GAP ANALYSIS ===');
console.log('Total modules: '+r.length);
console.log('No search: '+r.filter(m=>!m.S).length+'/'+r.length);
console.log('No sort: '+r.filter(m=>!m.O).length+'/'+r.length);
console.log('No side panel: '+r.filter(m=>!m.P).length+'/'+r.length);
console.log('No pagination: '+r.filter(m=>!m.G).length+'/'+r.length);
console.log('No CSV export: '+r.filter(m=>!m.C).length+'/'+r.length);
console.log('Under 400 lines: '+r.filter(m=>m.lines<400).length);
console.log('Under 5 useState: '+r.filter(m=>m.states<5).length);
console.log('Score < 30: '+r.filter(m=>m.score<30).length);
console.log('Score 30-50: '+r.filter(m=>m.score>=30&&m.score<50).length);
console.log('Score 50-70: '+r.filter(m=>m.score>=50&&m.score<70).length);
console.log('Score 70+: '+r.filter(m=>m.score>=70).length);
