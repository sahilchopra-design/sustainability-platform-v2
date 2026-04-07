const fs=require('fs'),path=require('path');
const r=[];
function scan(d){
  fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{
    const f=path.join(d,e.name);
    if(e.isDirectory())scan(f);
    else if(e.name.endsWith('.jsx')&&f.includes('pages')){
      const c=fs.readFileSync(f,'utf8');
      const sep=path.sep==='\\' ? '\\\\' : '/';
      const re=new RegExp('features' + sep + '([^' + sep + ']+)');
      const m=f.match(re);
      const slug=m?m[1]:e.name;
      const states=(c.match(/useState/g)||[]).length;
      const charts=[...new Set((c.match(/BarChart|LineChart|AreaChart|PieChart|RadarChart|ScatterChart/g)||[]))].length;
      const S=/search|setSearch|filterText/i.test(c);
      const O=/sortCol|sortBy|setSort|sortDir/i.test(c);
      const P=/sidePanel|drawer|detailPanel|slideOut|selectedCompany|selectedRow/i.test(c);
      const G=/pageNum|currentPage|setPage|pagination|perPage/i.test(c);
      let score=Math.min(states*3,30)+Math.min(charts*3,15);
      if(S)score+=5;if(O)score+=5;if(P)score+=10;if(G)score+=5;
      r.push({slug,score,states,charts,S,O,P,G});
    }
  });
}
scan(path.join(__dirname,'features'));
r.sort((a,b)=>a.score-b.score);
const low=r.filter(m=>m.score<30);
console.log('Total modules <30 interactivity: '+low.length+'/'+r.length);
console.log('');
low.forEach(m=>console.log(String(m.score).padStart(2)+' | '+m.slug));
