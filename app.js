{
const $=id=>document.getElementById(id);
const STANDALONE=!(window.claude&&window.claude.use);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LANGS=window.ICCEM_I18N.langs, TX=window.ICCEM_I18N.tx;
const S={lang:'es',view:'panorama',reg:'',dis:'',mun:'',A:2022,B:2026,ciit:false,ind:'i',heat:false,unit:'r',cA:'',cB:'',sort:'kB',dir:1,limit:40,bsort:'iB',bdir:-1};
try{const l=localStorage.getItem('iccemLang2');if(l&&LANGS[l])S.lang=l}catch(e){}
const pick=(lg,k)=>{let v=TX[lg]&&TX[lg][k];if(v==null&&lg!=='es'&&lg!=='za')v=TX.en[k];if(v==null)v=TX.es[k];return v};
const t=(k,...a)=>{let v=pick(S.lang,k);if(v==null)return k;return typeof v==='function'?v(...a):v};
const loc=()=>LANGS[S.lang].locale;
const nf=(v,d=1)=>Number(v).toLocaleString(loc(),{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=(v,d=1)=>(v>0?'+':v<0?'−':'±')+nf(Math.abs(v),d);
const SEC=()=>t('sectors'), DIM=()=>t('dims'), DIMS=()=>t('dimsShort'), STN=()=>t('stab');
const STC=["#24458f","#93aede","#f0c9a0","#a3123a"];
const LVC=["#24458f","#5b7fc0","#c27a1a","#a3123a"];
const lvl=v=>v>=70?0:v>=50?1:v>=30?2:3;
const REGC={"Cañada":"#7a4a9a","Costa":"#1f8a9e","Istmo":"#a3123a","Mixteca":"#b0742a","Papaloapan":"#2c7a3f","Sierra Norte":"#4b5d2a","Sierra Sur":"#24458f","Valles Centrales":"#5b534d"};
const VIEWS=[['panorama','M3 12h4l3-8 4 16 3-8h4'],['regional','M4 20V10M10 20V4M16 20v-7M22 20H2'],['years','M3 17l6-6 4 4 8-8M15 7h6v6'],['sens','M4 6h16M7 12h10M10 18h4'],['ranking','M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1'],['ficha','M5 3h14v18H5zM9 7h6M9 11h6M9 15h4'],['method','M12 8v5M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z']];
let D,M,byC,feats,heat,files={},DL=null;
const shortN=n=>n.replace('Heroica Ciudad de ','').replace('Heroica Villa de ','').replace(' de Porfirio Díaz','').replace(' de Zaragoza','');

/* ---------- data helpers ---------- */
const inScope=m=>(!S.reg||m.r===S.reg)&&(!S.dis||m.d===S.dis)&&(!S.ciit||m.ciit);
const scopeMs=()=>S.mun?[byC[S.mun]]:M.filter(inScope);
function agg(ms,y){y=String(y);const n=ms.length||1,o={n:ms.length,i:0,dm:[0,0,0,0,0,0],t:0,p:0,s:new Array(23).fill(0),st:[0,0,0,0]};
  for(const m of ms){const r=m.y[y];o.i+=r.i/n;r.dm.forEach((v,j)=>o.dm[j]+=v/n);o.t+=r.t;o.p+=m.p;r.s.forEach((v,j)=>o.s[j]+=v);o.st[r.st]++}return o}
const scopeName=()=>S.mun?byC[S.mun].n:S.dis?t('districtOf',S.dis):S.reg?t('regionOf',S.reg):t('stateName');
const val=(m,y,k)=>{const r=m.y[y];if(k==='i')return r.i;if(k==='t')return r.t;if(k==='pc')return m.p?r.t/m.p*1000:0;if(k==='st')return r.st;return r.dm[+k]};
const indName=k=>k==='i'?'ICCEM':k==='t'?t('ue'):k==='pc'?t('uePc'):k==='st'?t('stability'):DIM()[+k];

/* ---------- boot ---------- */
Promise.all(['data.json','mun.json','heat.json'].map(f=>fetch(f).then(r=>r.json()))).then(([d,topo,h])=>{
  D=d;M=d.m;heat=h;byC=Object.fromEntries(M.map(m=>[m.c,m]));
  feats=topojson.feature(topo,topo.objects.src).features;feats.forEach(f=>f.c=String(f.properties.ID).slice(-3));
  const byR=d3.rollup(M,v=>d3.mean(v,m=>m.y[S.B].i),m=>m.r);const rs=[...byR.keys()].sort((a,b)=>byR.get(b)-byR.get(a));S.cA=rs[0];S.cB='Istmo'===rs[0]?rs[1]:'Istmo';
  mapP=makeMap('map','mapBox','tip',true);mapR=makeMap('rmap','rmapBox','rtip',false);
  bind();fromHash();renderAll();
}).catch(e=>{$('title').textContent='No se pudieron cargar los datos.';console.error(e)});

(async()=>{try{if(STANDALONE){['dlX','dlS','dlP'].forEach(id=>$(id).disabled=false);return}DL=await window.claude.use('downloads');if(DL)['dlX','dlS','dlP'].forEach(id=>$(id).disabled=false);else $('dlMsg').textContent=t('dlUnavailable')}catch(e){}})();

function fromHash(){const h=location.hash.slice(1);if(VIEWS.some(v=>v[0]===h))S.view=h}
function bind(){
  $('lang').innerHTML=Object.entries(LANGS).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('');
  $('lang').onchange=e=>{S.lang=e.target.value;try{localStorage.setItem('iccemLang2',S.lang)}catch(x){}renderAll()};
  window.addEventListener('hashchange',()=>{fromHash();renderAll()});
  $('fReg').onchange=e=>{S.reg=e.target.value;S.dis='';S.mun='';S.limit=40;renderAll();mapP.zoomTo()};
  $('fDis').onchange=e=>{S.dis=e.target.value;if(S.dis){S.reg=M.find(m=>m.d===S.dis).r}S.mun='';renderAll();mapP.zoomTo()};
  $('fMun').onchange=e=>{selMun(e.target.value);mapP.zoomTo()};
  $('yA').onchange=e=>{S.A=+e.target.value;renderAll()};$('yB').onchange=e=>{S.B=+e.target.value;renderAll()};
  $('fCiit').onchange=e=>{S.ciit=e.target.checked;if(S.mun&&!byC[S.mun].ciit)S.mun='';renderAll();mapP.zoomTo()};
  $('ind').onchange=e=>{S.ind=e.target.value;renderPanorama()};
  $('heat').onchange=e=>{S.heat=e.target.checked;renderPanorama()};
  $('uR').onclick=()=>{S.unit='r';setUnits();renderRegional()};$('uD').onclick=()=>{S.unit='d';setUnits();renderRegional()};
  $('cA').onchange=e=>{S.cA=e.target.value;renderRegional()};$('cB').onchange=e=>{S.cB=e.target.value;renderRegional()};
  $('more').onclick=()=>{S.limit+=80;renderRanking()};
  $('dlX').onclick=()=>saveFile('ICCEM_Oaxaca_2022-2026.xlsx');$('dlS').onclick=()=>saveFile('ICCEM_Oaxaca_shapefile.zip');$('dlP').onclick=makePDF;
}
function selMun(c){S.mun=c;if(c){const m=byC[c];S.reg=m.r;S.dis=m.d}renderAll()}
function setUnits(){const us=units();if(!us.find(u=>u.k===S.cA))S.cA=us[0].k;if(!us.find(u=>u.k===S.cB)||S.cB===S.cA)S.cB=(us.find(u=>u.k!==S.cA)||us[0]).k}

/* ---------- global render ---------- */
function renderAll(){
  document.documentElement.lang=S.lang;$('lang').value=S.lang;
  document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));
  $('menu').innerHTML=VIEWS.map(([k,p])=>`<a href="#${k}" ${S.view===k?'aria-current="page"':''}><svg viewBox="0 0 24 24"><path d="${p}"/></svg>${esc(t('v_'+k))}</a>`).join('');
  VIEWS.forEach(([k])=>$('v-'+k).hidden=S.view!==k);
  renderFilters();
  $('title').textContent=t('t_'+S.view);
  $('subtitle').textContent=t('sub_'+S.view,scopeName(),S.A,S.B);
  ({panorama:renderPanorama,regional:()=>{setUnits();renderRegional()},years:renderYears,sens:renderSens,ranking:renderRanking,ficha:renderFicha,method:renderMethod})[S.view]();
}
function renderFilters(){
  const regs=[...new Set(M.map(m=>m.r))].sort((a,b)=>a.localeCompare(b,'es'));
  $('fReg').innerHTML=`<option value="">${esc(t('allRegions',regs.length))}</option>`+regs.map(r=>`<option ${r===S.reg?'selected':''}>${esc(r)}</option>`).join('');
  const dis=[...new Set(M.filter(m=>!S.reg||m.r===S.reg).map(m=>m.d))].sort((a,b)=>a.localeCompare(b,'es'));
  $('fDis').innerHTML=`<option value="">${esc(t('allDistricts',dis.length))}</option>`+dis.map(d=>`<option ${d===S.dis?'selected':''}>${esc(d)}</option>`).join('');
  const ms=M.filter(m=>(!S.reg||m.r===S.reg)&&(!S.dis||m.d===S.dis)&&(!S.ciit||m.ciit)).sort((a,b)=>a.n.localeCompare(b.n,'es'));
  $('fMun').innerHTML=`<option value="">${esc(t('allMuns',ms.length))}</option>`+ms.map(m=>`<option value="${m.c}" ${m.c===S.mun?'selected':''}>${esc(m.n)}</option>`).join('');
  for(const id of['yA','yB'])$(id).innerHTML=D.meta.years.map(y=>`<option value="${y}" ${y===(id==='yA'?S.A:S.B)?'selected':''}>${y} · DENUE ${esc(D.meta.ed[y])}</option>`).join('');
  $('fCiit').checked=S.ciit;
}

/* ---------- map ---------- */
let mapP,mapR;
function makeMap(svgId,boxId,tipId,full){
  const svg=d3.select('#'+svgId),g=svg.append('g'),gT=g.append('g'),gH=g.append('g'),gM=g.append('g'),gL=g.append('g');let path,proj,zoom,cur={};
  const useTiles=full&&STANDALONE;let tk=d3.zoomIdentity;
  const R0=20037508.342789244,TS=2*R0;
  const tiles=()=>{if(!useTiles||!proj)return;const b=$(boxId),W=b.clientWidth,H=b.clientHeight;const inv=(sx,sy)=>proj.invert([(sx-tk.x)/tk.k,(sy-tk.y)/tk.k]);const p0=inv(0,0),p1=inv(W,H);const mpp=Math.abs(p1[0]-p0[0])/W;let z=Math.max(5,Math.min(17,Math.round(Math.log2(156543.034/mpp))));const sz=TS/2**z;
    const x0=Math.floor((Math.min(p0[0],p1[0])+R0)/sz),x1=Math.floor((Math.max(p0[0],p1[0])+R0)/sz),y0=Math.floor((R0-Math.max(p0[1],p1[1]))/sz),y1=Math.floor((R0-Math.min(p0[1],p1[1]))/sz);const ts=[];
    for(let X=x0;X<=x1;X++)for(let Y=y0;Y<=y1;Y++)ts.push({z,X,Y,k:z+'/'+X+'/'+Y});if(ts.length>120)return;
    gT.selectAll('image').data(ts,d=>d.k).join('image').attr('href',d=>`https://${'abcd'[(d.X+d.Y)%4]}.basemaps.cartocdn.com/light_all/${d.z}/${d.X}/${d.Y}.png`).each(function(d){const a=proj([-R0+d.X*sz,R0-d.Y*sz]),c=proj([-R0+(d.X+1)*sz,R0-(d.Y+1)*sz]);d3.select(this).attr('x',a[0]).attr('y',a[1]).attr('width',c[0]-a[0]+.5).attr('height',c[1]-a[1]+.5)}).attr('preserveAspectRatio','none')};
  if(useTiles){const at=document.createElement('div');at.className='attr';at.innerHTML='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>';$(boxId).appendChild(at);gM.style('fill-opacity',.82)}
  if(full){zoom=d3.zoom().scaleExtent([1,16]).on('end',()=>tiles()).on('zoom',e=>{tk=e.transform;g.attr('transform',e.transform);gM.selectAll('path').style('stroke-width',p=>(p.sel?2.2:.35)/e.transform.k);gL.selectAll('text').style('font-size',11/e.transform.k+'px').style('stroke-width',3/e.transform.k+'px')});svg.call(zoom);
    $('zin').onclick=()=>svg.transition().call(zoom.scaleBy,1.6);$('zout').onclick=()=>svg.transition().call(zoom.scaleBy,1/1.6);$('zre').onclick=()=>svg.transition().call(zoom.transform,d3.zoomIdentity)}
  const tip=$(tipId);
  gM.selectAll('path').data(feats).join('path').attr('class','m')
    .on('mousemove',(e,f)=>{if(!cur.tip)return;const r=$(boxId).getBoundingClientRect();tip.style.display='block';tip.style.left=Math.min(e.clientX-r.left+12,r.width-210)+'px';tip.style.top=(e.clientY-r.top+12)+'px';tip.innerHTML=cur.tip(byC[f.c])})
    .on('mouseleave',()=>tip.style.display='none').on('click',(e,f)=>cur.click&&cur.click(byC[f.c]));
  const draw=()=>{const b=$(boxId),W=b.clientWidth,H=b.clientHeight;if(!W)return;proj=d3.geoIdentity().reflectY(true).fitExtent([[full?56:8,8],[W-8,H-8]],{type:'FeatureCollection',features:feats});path=d3.geoPath(proj);gM.selectAll('path').attr('d',path);paint();tiles()};
  const paint=()=>{if(!path||!cur.fill)return;
    gM.selectAll('path').each(function(f){f.sel=cur.sel&&cur.sel(byC[f.c])}).attr('fill',f=>cur.fill(byC[f.c])).classed('dim',f=>cur.dim?cur.dim(byC[f.c]):false).style('stroke',f=>f.sel?'var(--hi)':null).style('stroke-width',f=>f.sel?(full?2.2:.9):null);
    gM.selectAll('path').filter(f=>f.sel).raise();
    gH.selectAll('rect').remove();gL.selectAll('text').remove();
    if(cur.heat){const C=heat.size,yi=heat.years.indexOf(+cur.heat)+2,cells=heat.cells.filter(c=>c[yi]>0),mx=d3.max(cells,c=>c[yi]);
      const col=d3.scaleSequentialLog([1,mx],d3.interpolateRgbBasis(['#fde9c9','#f2a65a','#c43b2d','#5c0620']));
      gH.raise();gH.selectAll('rect').data(cells).join('rect').attr('x',c=>proj([c[0]*C,(c[1]+1)*C])[0]).attr('y',c=>proj([c[0]*C,(c[1]+1)*C])[1]).attr('width',c=>proj([(c[0]+1)*C,0])[0]-proj([c[0]*C,0])[0]+.3).attr('height',c=>proj([0,c[1]*C])[1]-proj([0,(c[1]+1)*C])[1]+.3).attr('fill',c=>col(c[yi])).attr('opacity',.85).style('pointer-events','none');
      cur.heatMax=mx}
    if(cur.labels){gL.raise();const lab=cur.labels();gL.selectAll('text').data(lab).join('text').attr('class','lab').attr('text-anchor','middle').attr('x',m=>path.centroid(feats.find(f=>f.c===m.c))[0]).attr('y',m=>path.centroid(feats.find(f=>f.c===m.c))[1]).text(m=>shortN(m.n))}
  };
  new ResizeObserver(draw).observe($(boxId));
  return{set(o){cur=o;if(!path)draw();else paint()},zoomTo(){if(!full||!path)return;const b=$(boxId),W=b.clientWidth,H=b.clientHeight;
      const fs=feats.filter(f=>S.mun?f.c===S.mun:inScope(byC[f.c]));if(!fs.length||(!S.mun&&!S.reg&&!S.dis&&!S.ciit)){svg.transition().call(zoom.transform,d3.zoomIdentity);return}
      const bb=path.bounds({type:'FeatureCollection',features:fs});let k=Math.min(S.mun?7:14,.85/Math.max((bb[1][0]-bb[0][0])/W,(bb[1][1]-bb[0][1])/H));
      svg.transition().duration(600).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-(bb[0][0]+bb[1][0])/2,-(bb[0][1]+bb[1][1])/2))},get heatMax(){return cur.heatMax}};
}

/* ---------- radar ---------- */
function radar(svgId,series,legId){
  const s=$(svgId);const draw=()=>{const W=s.clientWidth,H=s.clientHeight;if(!W)return;const R=Math.min(W/2-(W<480?72:92),H/2-34),cx=W/2,cy=H/2+4,n=6,lab=W<420?DIMS():DIM();
    const pt=(i,v)=>[cx+Math.sin(i/n*2*Math.PI)*R*v/100,cy-Math.cos(i/n*2*Math.PI)*R*v/100];
    let h=[25,50,75,100].map(v=>`<polygon points="${d3.range(n).map(i=>pt(i,v).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`).join('');
    h+=d3.range(n).map(i=>{const[x,y]=pt(i,100),[lx,ly]=pt(i,118);return`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/><text x="${lx}" y="${ly+4}" text-anchor="${Math.abs(lx-cx)<8?'middle':lx>cx?'start':'end'}" font-size="${W<480?11.5:12.5}" font-weight="600" fill="var(--ink)">${esc(lab[i])}</text>`}).join('');
    h+=series.map(se=>`<polygon points="${se.v.map((v,i)=>pt(i,v).join(',')).join(' ')}" fill="${se.fill?se.c:'none'}" fill-opacity=".22" stroke="${se.c}" stroke-width="${se.w||2}" ${se.dash?'stroke-dasharray="5 4"':''}/>`+(se.fill?se.v.map((v,i)=>`<circle cx="${pt(i,v)[0]}" cy="${pt(i,v)[1]}" r="3.5" fill="${se.c}"/>`).join(''):'')).join('');
    s.innerHTML=h};
  if(s._ro)s._ro.disconnect();s._ro=new ResizeObserver(draw);s._ro.observe(s);draw();
  if(legId)$(legId).innerHTML=series.map(se=>`<span><span class="dot" style="background:${se.c}"></span>${esc(se.name)}</span>`).join('');
}

/* ---------- PANORAMA ---------- */
function renderPanorama(){
  const ms=scopeMs(),a=agg(ms,S.A),b=agg(ms,S.B),st=agg(M,S.B),stA=agg(M,S.A);
  const L=t('levels'),lv=lvl(b.i);
  const m1=S.mun?byC[S.mun]:null;
  const cards=[`<div class="kpi main" style="--c:${LVC[lv]}"><div class="k">${esc(S.mun?'ICCEM':t('iccemAvg'))} ${S.B}</div><b>${nf(b.i)}</b><div class="lv">${esc(L[lv])} · ${sg(b.i-a.i)} ${esc(t('vs'))} ${S.A}</div></div>`];
  b.dm.forEach((v,j)=>{const l=lvl(v);cards.push(`<div class="kpi" style="--c:${LVC[l]}"><div class="k">${esc(DIM()[j])}</div><b>${nf(v)}</b><div class="lv"><i></i>${esc(L[l])} · ${sg(v-a.dm[j])}</div></div>`)});
  cards.push(`<div class="kpi"><div class="k">${esc(t('ue'))} ${S.B}</div><b>${nf(b.t,0)}</b><div class="lv">${sg((b.t/a.t-1)*100)} % · ${nf(b.t/b.p*1000,1)} ${esc(t('per1000'))}</div></div>`);
  if(m1)cards.push(`<div class="kpi"><div class="k">${esc(t('stateRank'))}</div><b>${m1.y[S.B].k}.º</b><div class="lv">${esc(t('of570'))} · <span class="st st${m1.y[S.B].st}">${esc(STN()[m1.y[S.B].st])}</span></div></div>`);
  else cards.push(`<div class="kpi"><div class="k">${esc(t('municipalities'))}</div><b>${nf(b.n,0)}</b><div class="lv">${nf(b.st[0]+b.st[1],0)} ${esc(t('stableShort'))}</div></div>`);
  $('kpis').innerHTML=cards.join('');
  // indicator select
  const opts=['i','0','1','2','3','4','5','t','pc','st'];
  $('ind').innerHTML=opts.map(k=>`<option value="${k}" ${k===S.ind?'selected':''}>${esc(indName(k))}</option>`).join('')+`<option value="chg" ${S.ind==='chg'?'selected':''}>${esc(t('chgIccem',S.A,S.B))}</option>`;
  $('heat').checked=S.heat;
  // map colors
  let fill,leg,tip;
  if(S.heat){fill=()=>'var(--heatbg)';$('mapTitle').textContent=t('heatTitle',S.B);}
  else if(S.ind==='st'){fill=m=>STC[m.y[S.B].st];leg=STN().map((n,i)=>`<span><span class="dot" style="background:${STC[i]}"></span>${esc(n)}</span>`).join('');}
  else if(S.ind==='chg'){const vs=M.map(m=>Math.abs(m.y[S.B].i-m.y[S.A].i)).sort(d3.ascending),mx=d3.quantile(vs,.95)||1;const c=d3.scaleDiverging([-mx,0,mx],d3.interpolateRgbBasis(['#a3123a','#e9a3ad','#efe9e4','#93aede','#24458f']));fill=m=>c(m.y[S.B].i-m.y[S.A].i);leg=`<span>${sg(-mx)}</span><span class="bar" style="background:linear-gradient(90deg,#a3123a,#e9a3ad,#efe9e4,#93aede,#24458f)"></span><span>${sg(mx)}</span><span>${esc(t('chgLeg'))}</span>`}
  else if(S.ind==='t'||S.ind==='pc'){const q=d3.scaleQuantile(M.map(m=>val(m,S.B,S.ind)),d3.quantize(d3.interpolateRgb('#f6e3e2','#5c0620'),7));fill=m=>q(val(m,S.B,S.ind));leg=`<span>${esc(t('lower'))}</span><span class="bar" style="background:linear-gradient(90deg,#f6e3e2,#5c0620)"></span><span>${esc(t('higher'))}</span><span>· ${esc(t('septiles'))}</span>`}
  else{fill=m=>LVC[lvl(val(m,S.B,S.ind))];leg=t('levels').map((n,i)=>`<span><span class="dot" style="background:${LVC[i]}"></span>${esc(n)} (${['≥70','50–70','30–50','<30'][i]})</span>`).join('')}
  if(!S.heat)$('mapTitle').textContent=S.ind==='chg'?t('chgIccem',S.A,S.B):`${indName(S.ind)}, ${S.B}`;
  tip=m=>`<b>${esc(m.n)}</b><br>${esc(m.r)} · ${esc(m.d)}<br>ICCEM ${S.B}: ${nf(m.y[S.B].i)} (${m.y[S.B].k}.º) · ${sg(m.y[S.B].i-m.y[S.A].i)}<br>${esc(t('ue'))}: ${nf(m.y[S.B].t,0)}`;
  const big=M.slice().sort((x,y)=>y.y[S.B].t-x.y[S.B].t);
  mapP.set({fill,tip,click:m=>{selMun(m.c===S.mun?'':m.c)},sel:m=>m.c===S.mun,dim:m=>!S.mun&&!inScope(m),heat:S.heat?S.B:null,
    labels:()=>{const L2=big.filter(inScope).slice(0,$('mapBox').clientWidth<520?6:S.reg||S.dis?8:12);if(S.mun&&!L2.includes(byC[S.mun]))L2.push(byC[S.mun]);return L2}});
  if(S.heat){const mx=mapP.heatMax||1;leg=`<span>1</span><span class="bar" style="background:linear-gradient(90deg,#fde9c9,#f2a65a,#c43b2d,#5c0620)"></span><span>${nf(mx,0)}</span><span>${esc(t('heatLeg'))}</span>`}
  $('legend').innerHTML=leg;
  // radar
  const ser=[{name:`${scopeName()} ${S.B}`,c:'#c27a1a',v:b.dm,fill:true,w:2.5},{name:`${scopeName()} ${S.A}`,c:'#c27a1a',v:a.dm,dash:true,w:1.5},{name:`${t('stateAvg')} ${S.B}`,c:'#24458f',v:st.dm,w:1.6}];
  if(!S.mun&&!S.reg&&!S.dis&&!S.ciit)ser.pop();
  radar('radar',ser,'radarLeg');
  // reading
  const best=d3.maxIndex(b.dm),worst=d3.minIndex(b.dm),gap=b.i-st.i;
  const isState=!S.mun&&!S.reg&&!S.dis&&!S.ciit;
  $('reading').textContent=isState?t('readingState',DIM()[best],nf(b.dm[best]),DIM()[worst],nf(b.dm[worst]),S.B,sg(b.i-a.i),S.A):t('reading',scopeName(),DIM()[best],nf(b.dm[best]),DIM()[worst],nf(b.dm[worst]),sg(gap),S.B,sg(b.i-a.i),S.A);
  // sectors
  const tot=b.t||1,stt=st.t,secs=b.s.map((v,j)=>({j,v,sh:v/tot*100,lq:(v/tot)/(st.s[j]/stt),d:v-a.s[j]})).sort((x,y)=>y.v-x.v).slice(0,10);
  $('secTitle').textContent=t('secTitle',S.B);
  $('secRows').innerHTML=secs.map(x=>`<div class="row"><span title="${esc(SEC()[x.j])}">${esc(SEC()[x.j])}</span><span class="t"><i style="width:${Math.min(100,x.sh/secs[0].sh*100)}%"></i></span><span class="v">${nf(x.sh)} % · <span title="LQ">${nf(x.lq,2)}</span></span></div>`).join('')+`<p class="note">${esc(t('secNote'))}</p>`;
  // trend
  $('trendTitle').textContent=t('trendTitle');
  const ys=D.meta.years,s=$('trend');const lines=[{n:scopeName(),c:'#c27a1a',v:ys.map(y=>agg(ms,y).i),w:3}];
  if(S.mun||S.dis){const rm=M.filter(m=>m.r===(S.mun?byC[S.mun].r:S.reg));lines.push({n:t('regionOf',S.mun?byC[S.mun].r:S.reg),c:'#7a4a9a',v:ys.map(y=>agg(rm,y).i),w:1.8})}
  if(!isState)lines.push({n:t('stateAvg'),c:'#24458f',v:ys.map(y=>agg(M,y).i),w:1.8});
  const draw=()=>{const W=s.clientWidth,H=s.clientHeight;if(!W)return;const p={l:34,r:14,t:10,b:26};const x=d3.scalePoint(ys,[p.l,W-p.r]),all=lines.flatMap(l=>l.v),y=d3.scaleLinear([Math.max(0,d3.min(all)-5),Math.min(100,d3.max(all)+5)],[H-p.b,p.t]).nice();const ln=d3.line().x((v,i)=>x(ys[i])).y(v=>y(v));
    s.innerHTML=y.ticks(4).map(v=>`<line x1="${p.l}" x2="${W-p.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${p.l-6}" y="${y(v)+4}" text-anchor="end" font-size="12" fill="var(--mute)">${v}</text>`).join('')+ys.map(v=>`<text x="${x(v)}" y="${H-6}" text-anchor="middle" font-size="12" fill="var(--mute)">${v}</text>`).join('')+lines.map(l=>`<path d="${ln(l.v)}" fill="none" stroke="${l.c}" stroke-width="${l.w}"/>`+l.v.map((v,i)=>`<circle cx="${x(ys[i])}" cy="${y(v)}" r="3" fill="${l.c}"/>`).join('')).join('')};
  if(s._ro)s._ro.disconnect();s._ro=new ResizeObserver(draw);s._ro.observe(s);draw();
  $('trendLeg').innerHTML=lines.map(l=>`<span><span class="dot" style="background:${l.c}"></span>${esc(l.n)}</span>`).join('');
}

/* ---------- REGIONAL ---------- */
function units(){const key=S.unit==='r'?'r':'d';const g=d3.group(M.filter(m=>!S.ciit||m.ciit),m=>m[key]);return[...g].map(([k,ms])=>({k,ms,r:key==='d'?ms[0].r:k}))}
function renderRegional(){
  $('uR').setAttribute('aria-pressed',S.unit==='r');$('uD').setAttribute('aria-pressed',S.unit==='d');
  const us=units(),A=S.A,B=S.B,st=agg(M,B),stA=agg(M,A);
  $('cA').innerHTML=us.map(u=>`<option ${u.k===S.cA?'selected':''}>${esc(u.k)}</option>`).join('');$('cB').innerHTML=us.map(u=>`<option ${u.k===S.cB?'selected':''}>${esc(u.k)}</option>`).join('');
  const rows=us.map(u=>{const a=agg(u.ms,A),b=agg(u.ms,B);return{u,a,b,k:u.k,n:b.n,iA:a.i,iB:b.i,d:b.i-a.i,t:b.t,pc:b.t/b.p*1000,stb:(b.st[0]+b.st[1])/b.n*100,best:d3.maxIndex(b.dm),worst:d3.minIndex(b.dm)}});
  const rk=rows.slice().sort((x,y)=>y.iB-x.iB);rk.forEach((r,i)=>r.rk=i+1);const rkA=rows.slice().sort((x,y)=>y.iA-x.iA);rkA.forEach((r,i)=>r.rkA=i+1);
  const uname=S.unit==='r'?t('region'):t('district');
  $('boardTitle').textContent=t('boardTitle',S.unit==='r'?t('regions'):t('districts'),A,B);
  const cols=[['rk',t('place'),1],['k',uname,0],['n',t('municipalities'),1],['iA','ICCEM '+A,1],['iB','ICCEM '+B,1],['d',t('change'),1],['t',t('ue')+' '+B,1],['pc',t('per1000'),1],['stb',t('pctStable'),1],['best',t('strength'),0],['worst',t('weakness'),0]];
  const bt=$('board');bt.tHead.innerHTML=`<tr>${cols.map(c=>`<th data-k="${c[0]}" class="${c[2]?'n':''}">${esc(c[1])}${S.bsort===c[0]?(S.bdir>0?' ▲':' ▼'):''}</th>`).join('')}</tr>`;
  const sk=S.bsort==='rk'?'iB':S.bsort;const sorted=rows.slice().sort((x,y)=>{const p=x[sk],q=y[sk];return(typeof p==='string'?p.localeCompare(q,'es'):p-q)*(S.bsort==='rk'?-S.bdir:S.bdir)});
  bt.tBodies[0].innerHTML=sorted.map(r=>`<tr class="click" data-k="${esc(r.k)}"${r.k===S.cA||r.k===S.cB?' style="background:color-mix(in srgb,var(--amber) 12%,transparent)"':''}><td class="n">${r.rk}${r.rkA!==r.rk?` <span class="${r.rkA>r.rk?'up':'down'}" style="font-size:12px">${r.rkA>r.rk?'▲':'▼'}${Math.abs(r.rkA-r.rk)}</span>`:''}</td><td><span class="dot" style="background:${REGC[r.u.r]}"></span>${esc(r.k)}</td><td class="n">${r.n}</td><td class="n">${nf(r.iA)}</td><td class="n"><b>${nf(r.iB)}</b></td><td class="n ${r.d>=0?'up':'down'}">${sg(r.d)}</td><td class="n">${nf(r.t,0)}</td><td class="n">${nf(r.pc)}</td><td class="n">${nf(r.stb,0)} %</td><td>${esc(DIMS()[r.best])}</td><td>${esc(DIMS()[r.worst])}</td></tr>`).join('');
  bt.tHead.querySelectorAll('th').forEach(th=>th.onclick=()=>{const k=th.dataset.k;S.bdir=S.bsort===k?-S.bdir:(['k','best','worst'].includes(k)?1:-1);S.bsort=k;renderRegional()});
  bt.tBodies[0].querySelectorAll('tr').forEach(tr=>tr.onclick=()=>{const k=tr.dataset.k;if(k!==S.cA){S.cB=S.cA;S.cA=k}renderRegional()});
  // duel
  const RA=rows.find(r=>r.k===S.cA),RB=rows.find(r=>r.k===S.cB);
  $('duelTitle').textContent=t('duelTitle',S.cA,S.cB,B);
  radar('radar2',[{name:S.cA,c:'#c27a1a',v:RA.b.dm,fill:true,w:2.5},{name:S.cB,c:'#24458f',v:RB.b.dm,fill:true,w:2},{name:t('stateAvg'),c:'var(--mute)',v:st.dm,dash:true,w:1.4}],'radar2Leg');
  $('gapRows').innerHTML=RA.b.dm.map((v,j)=>{const g=v-RB.b.dm[j],w=Math.min(50,Math.abs(g)/2);return`<div class="row" style="grid-template-columns:9.5em minmax(0,1fr) 4.5em"><span>${esc(DIMS()[j])}</span><span class="t" style="background:linear-gradient(90deg,transparent calc(50% - 1px),var(--mute) calc(50% - 1px),var(--mute) calc(50% + 1px),transparent calc(50% + 1px)),var(--line)"><i style="left:${g>=0?50:50-w}%;width:${w}%;background:${g>=0?'#c27a1a':'#24458f'}"></i></span><span class="v">${sg(g)}</span></div>`}).join('')+`<p class="note">${esc(t('gapNote',S.cA,S.cB))}</p>`;
  const adv=RA.b.dm.map((v,j)=>v-RB.b.dm[j]);
  $('duelRead').textContent=t('duelRead',S.cA,S.cB,sg(RA.iB-RB.iB),DIM()[d3.maxIndex(adv)],sg(d3.max(adv)),DIM()[d3.minIndex(adv)],sg(d3.min(adv)),RA.rk,RB.rk,rows.length);
  // regional map
  $('rmapTitle').textContent=t('rmapTitle',S.unit==='r'?t('regions'):t('districts'),B);
  const uv=Object.fromEntries(rows.map(r=>[r.k,r.iB])),ext=d3.extent(rows,r=>r.iB),col=d3.scaleSequential(ext,d3.interpolateRgbBasis(['#f8ece8','#e39a9e','#b5223f','#5c0620']));
  const key=S.unit==='r'?'r':'d';
  mapR.set({fill:m=>uv[m[key]]!=null?col(uv[m[key]]):'var(--line)',tip:m=>`<b>${esc(m[key])}</b><br>ICCEM ${B}: ${nf(uv[m[key]]??0)}<br><span style="opacity:.8">${esc(m.n)}</span>`,sel:m=>m[key]===S.cA||m[key]===S.cB,dim:m=>S.ciit&&!m.ciit,click:m=>{if(m[key]!==S.cA){S.cB=S.cA;S.cA=m[key]}renderRegional()}});
  $('rmapLeg').innerHTML=`<span>${nf(ext[0])}</span><span class="bar" style="background:linear-gradient(90deg,#f8ece8,#e39a9e,#b5223f,#5c0620)"></span><span>${nf(ext[1])}</span><span>${esc(t('rmapLeg'))}</span>`;
  // dimension matrix
  $('dimMxTitle').textContent=t('dimMxTitle',B);
  const mcols=['i',0,1,2,3,4,5],cs=mcols.map(c=>{const vs=rows.map(r=>c==='i'?r.iB:r.b.dm[c]);return d3.scaleSequential(d3.extent(vs),d3.interpolateRgb('#f7ede6','#a3123a'))});
  $('dimMx').innerHTML=`<thead><tr><th>${esc(uname)}</th>${mcols.map(c=>`<th>${esc(c==='i'?'ICCEM':DIMS()[c])}</th>`).join('')}</tr></thead><tbody>${rk.map(r=>`<tr><td class="rn">${esc(r.k)}</td>${mcols.map((c,ci)=>{const v=c==='i'?r.iB:r.b.dm[c],bg=cs[ci](v),dark=d3.lab(bg).l<55;return`<td style="background:${bg};color:${dark?'#fff':'#1d1916'}">${nf(v)}</td>`}).join('')}</tr>`).join('')}<tr><td class="rn">${esc(t('stateAvg'))}</td><td>${nf(st.i)}</td>${st.dm.map(v=>`<td>${nf(v)}</td>`).join('')}</tr></tbody>`;
  // LQ matrix
  $('lqTitle').textContent=t('lqTitle',B);
  const lqc=d3.scaleDiverging([-1,0,1],d3.interpolateRgbBasis(['#24458f','#93aede','#f6f2ee','#e9a3ad','#a3123a']));
  const keep=d3.range(23).filter(j=>st.s[j]>0);
  $('lqMx').innerHTML=`<thead><tr><th>${esc(uname)}</th>${keep.map(j=>`<th title="${esc(SEC()[j])}">${esc(D.meta.sectors[j])}<br>${esc(SEC()[j].split(' ')[0].slice(0,9))}</th>`).join('')}</tr></thead><tbody>${rk.map(r=>`<tr><td class="rn">${esc(r.k)}</td>${keep.map(j=>{const lq=r.b.t&&st.s[j]?(r.b.s[j]/r.b.t)/(st.s[j]/st.t):0,bg=lq>0?lqc(Math.max(-1,Math.min(1,Math.log2(lq)))):'var(--line)';return`<td style="background:${bg};color:${lq>2||lq<.5&&lq>0?'#fff':'#1d1916'}" title="${esc(SEC()[j])}: ${nf(r.b.s[j],0)}">${lq?nf(lq,2):'–'}</td>`}).join('')}</tr>`).join('')}</tbody>`;
  // shift-share
  $('ssTitle').textContent=t('ssTitle',S.cA,A,B);
  const ss=u=>{const a=agg(u.ms,A),b=agg(u.ms,B),g=st.t/stA.t-1;let NS=0,IM=0,CE=0;const per=d3.range(23).map(j=>{const ea=a.s[j],eb=b.s[j],gi=stA.s[j]?st.s[j]/stA.s[j]-1:0,ns=ea*g,im=ea*(gi-g),ce=(eb-ea)-ns-im;NS+=ns;IM+=im;CE+=ce;return{j,ea,eb,d:eb-ea,ns,im,ce}});return{per,NS,IM,CE,d:b.t-a.t,a:a.t}};
  const R=ss(us.find(u=>u.k===S.cA));
  $('ssKpi').innerHTML=[[t('ssTotal'),R.d,(R.d/R.a*100)],[t('ssNS'),R.NS],[t('ssIM'),R.IM],[t('ssCE'),R.CE]].map(([k,v,p],i)=>`<div class="kpi" style="--c:${i===3?(v>=0?'#24458f':'#a3123a'):'var(--line)'}"><div class="k">${esc(k)}</div><b class="${i===3?(v>=0?'up':'down'):''}">${sg(v,0)}</b>${p!=null?`<div class="lv">${sg(p)} %</div>`:''}</div>`).join('');
  const ssH=`<tr><th>${esc(t('sector'))}</th><th class="n">${A}</th><th class="n">${B}</th><th class="n">${esc(t('change'))}</th><th class="n">${esc(t('ssNSs'))}</th><th class="n">${esc(t('ssIMs'))}</th><th class="n">${esc(t('ssCEs'))}</th></tr>`;
  $('ssT').tHead.innerHTML=ssH;
  $('ssT').tBodies[0].innerHTML=R.per.filter(x=>x.ea||x.eb).sort((x,y)=>Math.abs(y.ce)-Math.abs(x.ce)).slice(0,12).map(x=>`<tr><td>${esc(SEC()[x.j])}</td><td class="n">${nf(x.ea,0)}</td><td class="n">${nf(x.eb,0)}</td><td class="n">${sg(x.d,0)}</td><td class="n">${sg(x.ns,0)}</td><td class="n">${sg(x.im,0)}</td><td class="n ${x.ce>=0?'up':'down'}"><b>${sg(x.ce,0)}</b></td></tr>`).join('');
  $('ssAllT').tHead.innerHTML=`<tr><th>${esc(uname)}</th><th class="n">${esc(t('ssTotal'))}</th><th class="n">${esc(t('ssNSs'))}</th><th class="n">${esc(t('ssIMs'))}</th><th class="n">${esc(t('ssCEs'))}</th><th class="n">${esc(t('ssCEpct'))}</th></tr>`;
  $('ssAllT').tBodies[0].innerHTML=us.map(u=>({u,r:ss(u)})).sort((x,y)=>y.r.CE/y.r.a-x.r.CE/x.r.a).map(({u,r})=>`<tr><td>${esc(u.k)}</td><td class="n">${sg(r.d,0)}</td><td class="n">${sg(r.NS,0)}</td><td class="n">${sg(r.IM,0)}</td><td class="n ${r.CE>=0?'up':'down'}">${sg(r.CE,0)}</td><td class="n">${sg(r.CE/r.a*100)} %</td></tr>`).join('');
}

/* ---------- YEARS ---------- */
function renderYears(){
  const A=S.A,B=S.B,ms=M.filter(inScope).map(m=>({m,d:m.y[B].i-m.y[A].i}));
  const dk=ms.map(x=>x.m.y[A].k-x.m.y[B].k),up=ms.filter(x=>x.d>0).length;
  $('cmpLede').textContent=A===B?t('pickTwo'):t('cmpLede',up,ms.length,scopeName(),D.meta.ed[A],D.meta.ed[B],sg(d3.median(ms,x=>x.d)),dk.filter(v=>v>=20).length,dk.filter(v=>v<=-20).length);
  const head=`<tr><th>${esc(t('municipality'))}</th><th>${esc(t('region'))}</th><th class="n">ICCEM</th><th class="n">${esc(t('change'))}</th><th class="n">${esc(t('place'))}</th></tr>`;$('gH').innerHTML=head;$('lH').innerHTML=head;
  const row=x=>`<tr class="click" data-c="${x.m.c}"><td>${esc(x.m.n)}</td><td>${esc(x.m.r)}</td><td class="n">${nf(x.m.y[A].i)} → ${nf(x.m.y[B].i)}</td><td class="n ${x.d>=0?'up':'down'}">${sg(x.d)}</td><td class="n">${x.m.y[A].k} → ${x.m.y[B].k}</td></tr>`;
  const srt=ms.slice().sort((a,b)=>b.d-a.d);$('gain').innerHTML=srt.slice(0,10).map(row).join('');$('loss').innerHTML=srt.slice(-10).reverse().map(row).join('');
  for(const id of['gain','loss'])$(id).querySelectorAll('tr').forEach(tr=>tr.onclick=()=>{S.mun=tr.dataset.c;selMun(tr.dataset.c);location.hash='ficha'});
  const s=$('regChart'),ys=D.meta.years,data=Object.keys(REGC).map(r=>({r,v:ys.map(y=>d3.mean(M.filter(m=>m.r===r&&(!S.ciit||m.ciit)),m=>m.y[y].i))})).filter(d=>!isNaN(d.v[0]));
  const draw=()=>{const W=s.clientWidth,H=s.clientHeight;if(!W)return;const pad={l:34,r:W>560?130:14,t:10,b:26};const x=d3.scalePoint(ys,[pad.l,W-pad.r]),y=d3.scaleLinear([d3.min(data,d=>d3.min(d.v))-3,d3.max(data,d=>d3.max(d.v))+3],[H-pad.b,pad.t]).nice();const line=d3.line().x((v,i)=>x(ys[i])).y(v=>y(v));
    const lab=data.map(d=>({r:d.r,y:y(d.v.at(-1))})).sort((a,b)=>a.y-b.y);for(let i=1;i<lab.length;i++)lab[i].y=Math.max(lab[i].y,lab[i-1].y+14);
    s.innerHTML=y.ticks(5).map(v=>`<line x1="${pad.l}" x2="${W-pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pad.l-6}" y="${y(v)+4}" text-anchor="end" font-size="12" fill="var(--mute)">${v}</text>`).join('')+[A,B].map(yy=>`<line x1="${x(yy)}" x2="${x(yy)}" y1="${pad.t}" y2="${H-pad.b}" stroke="var(--anil)" stroke-dasharray="3 3"/>`).join('')+ys.map(v=>`<text x="${x(v)}" y="${H-6}" text-anchor="middle" font-size="12" fill="var(--mute)">${v}</text>`).join('')+data.map(d=>`<path d="${line(d.v)}" fill="none" stroke="${REGC[d.r]}" stroke-width="${S.reg===d.r?3.5:1.8}"/>`).join('')+(W>560?lab.map(l=>`<text x="${W-pad.r+6}" y="${l.y+4}" font-size="12" fill="${REGC[l.r]}">${esc(l.r)}</text>`).join(''):'');
    $('regLeg').innerHTML=W>560?'':data.map(d=>`<span><span class="dot" style="background:${REGC[d.r]}"></span>${esc(d.r)}</span>`).join('')};
  if(s._ro)s._ro.disconnect();s._ro=new ResizeObserver(draw);s._ro.observe(s);draw();
}

/* ---------- SENSITIVITY ---------- */
function renderSens(){
  const sn=D.meta.sens,by=sn.byYear[String(S.B)],ys=D.meta.years,ms=M.filter(inScope),cnt=[0,0,0,0];ms.forEach(m=>cnt[m.y[S.B].st]++);
  $('sensLede').textContent=t('sensLede',S.B,nf(Math.min(...by.sp.slice(1)),2),nf(Math.max(...by.sp.slice(1)),2),ms.length,cnt[0]+cnt[1],cnt[3],sn.nsim);
  $('scenH').innerHTML=`<tr><th>${esc(t('scenario'))}</th><th>${esc(t('weights'))}</th><th class="n">Spearman</th><th class="n">${esc(t('top50'))}</th></tr>`;
  $('scenT').innerHTML=sn.scen.map((sc,i)=>`<tr${i===0?' style="font-weight:700"':''}><td>${esc(t('scenNames')[i])}</td><td>${sc[1].map(w=>nf(w*100,0)).join(' · ')}</td><td class="n">${nf(by.sp[i],3)}</td><td class="n">${nf(by.top50[i]*100,0)} %</td></tr>`).join('');
  $('stkBox').innerHTML=ys.map(y=>{const c=[0,0,0,0];ms.forEach(m=>c[m.y[y].st]++);const n=ms.length||1;return`<div class="row" style="grid-template-columns:3.5em minmax(0,1fr) 8em"><span${y===S.B?' style="font-weight:700"':''}>${y}</span><span class="stk">${c.map((v,i)=>`<span title="${esc(STN()[i])}: ${v}" style="width:${v/n*100}%;background:${STC[i]}"></span>`).join('')}</span><span class="v">${c[0]+c[1]} ${esc(t('stableShort'))}</span></div>`}).join('');
  $('stLeg').innerHTML=STN().map((n,i)=>`<span class="st st${i}">${esc(n)}</span>`).join(' ')+`<span>${esc(t('stabNote'))}</span>`;
}

/* ---------- RANKING ---------- */
function rankRows(){const A=S.A,B=S.B;return M.filter(inScope).map(m=>({c:m.c,n:m.n,r:m.r,d:m.d,vA:m.y[A].i,vB:m.y[B].i,dv:m.y[B].i-m.y[A].i,kB:m.y[B].k,kA:m.y[A].k,dk:m.y[A].k-m.y[B].k,rr:m.y[B].rr,st:m.y[B].st,mc:m.y[B].mc,w:m.y[B].mc[2]-m.y[B].mc[0]})).sort((a,b)=>{const x=a[S.sort],y=b[S.sort];return(typeof x==='string'?x.localeCompare(y,'es'):x-y)*S.dir})}
function renderRanking(){
  const A=S.A,B=S.B,rows=rankRows();
  const cols=[['kB',t('place'),1],['n',t('municipality'),0],['r',t('region'),0],['d',t('district'),0],['vA','ICCEM '+A,1],['vB','ICCEM '+B,1],['dv',t('change'),1],['dk',t('places'),1],['rr',t('regPlace'),1],['st',t('stability'),0],['w','P5–P95',1]];
  $('rank').tHead.innerHTML=`<tr>${cols.map(c=>`<th data-k="${c[0]}" class="${c[2]?'n':''}">${esc(c[1])}${S.sort===c[0]?(S.dir>0?' ▲':' ▼'):''}</th>`).join('')}</tr>`;
  $('rank').tHead.querySelectorAll('th').forEach(th=>th.onclick=()=>{const k=th.dataset.k;S.dir=S.sort===k?-S.dir:(['n','r','d','kB','st','w','rr'].includes(k)?1:-1);S.sort=k;renderRanking()});
  $('rankNote').textContent=t('rankNote',rows.length,scopeName(),B,A);
  $('rank').tBodies[0].innerHTML=rows.slice(0,S.limit).map(x=>`<tr class="click" data-c="${x.c}"><td class="n">${x.kB}</td><td>${esc(x.n)}</td><td>${esc(x.r)}</td><td>${esc(x.d)}</td><td class="n">${nf(x.vA)}</td><td class="n">${nf(x.vB)}</td><td class="n ${x.dv>0?'up':x.dv<0?'down':''}">${sg(x.dv)}</td><td class="n ${x.dk>0?'up':x.dk<0?'down':''}">${x.dk?sg(x.dk,0):'0'}</td><td class="n">${x.rr}</td><td><span class="st st${x.st}">${esc(STN()[x.st])}</span></td><td class="n">${x.mc[0]}–${x.mc[2]}</td></tr>`).join('');
  $('more').style.display=rows.length>S.limit?'':'none';
  $('rank').tBodies[0].querySelectorAll('tr').forEach(tr=>tr.onclick=()=>{selMun(tr.dataset.c);location.hash='ficha'});
}

/* ---------- FICHA ---------- */
function fichaMun(){if(S.mun)return byC[S.mun];const ms=M.filter(inScope);return ms.reduce((a,b)=>b.y[S.B].i>a.y[S.B].i?b:a)}
function renderFicha(){
  const m=fichaMun(),A=S.A,B=S.B,a=m.y[A],b=m.y[B],L=t('levels'),lv=lvl(b.i);
  const secs=a.s.map((v,i)=>({i,a:v,b:b.s[i],d:b.s[i]-v})).filter(x=>x.a||x.b).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d));
  $('ficha').innerHTML=`${S.mun?'':`<p class="note">${esc(t('fichaAuto',scopeName()))}</p>`}<h2>${esc(m.n)}</h2>
   <div class="note">${esc(m.r)} · ${esc(t('districtOf',m.d))} · ${nf(m.p,0)} ${esc(t('inhab'))}${m.ciit?'<span class="tag">CIIT</span>':''}</div>
   <div class="kpis" style="margin-top:12px">
    <div class="kpi main" style="--c:${LVC[lv]}"><div class="k">ICCEM ${B}</div><b>${nf(b.i)}</b><div class="lv">${esc(L[lv])} · ${sg(b.i-a.i)} ${esc(t('vs'))} ${A}</div></div>
    <div class="kpi"><div class="k">${esc(t('stateRank'))}</div><b>${b.k}.º</b><div class="lv">${a.k} → ${b.k} · ${esc(t('regPlace'))} ${b.rr}</div></div>
    <div class="kpi"><div class="k">${esc(t('ue'))} ${B}</div><b>${nf(b.t,0)}</b><div class="lv">${sg(b.t-a.t,0)} · ${nf(b.t/m.p*1000,1)} ${esc(t('per1000'))}</div></div>
   </div>
   ${m.off!=null?`<p class="note">${esc(t('officialCiit'))}: ${nf(m.off,2)}</p>`:''}
   <h3 style="margin-top:14px">${esc(t('dimsYears',A,B))}</h3>
   <div class="rows">${b.dm.map((v,j)=>`<div class="row"><span>${esc(DIM()[j])}</span><span class="t"><i style="width:${v}%;background:${LVC[lvl(v)]}"></i></span><span class="v">${nf(a.dm[j])} → ${nf(v)}</span></div>`).join('')}</div>
   <details><summary>${esc(t('secDetail',A,B,nf(a.t,0),nf(b.t,0)))}</summary><div class="scroll"><table><thead><tr><th>${esc(t('sector'))}</th><th class="n">${A}</th><th class="n">${B}</th><th class="n">${esc(t('change'))}</th></tr></thead><tbody>
   ${secs.map(x=>`<tr><td>${esc(SEC()[x.i])}</td><td class="n">${nf(x.a,0)}</td><td class="n">${nf(x.b,0)}</td><td class="n ${x.d>0?'up':x.d<0?'down':''}">${sg(x.d,0)}</td></tr>`).join('')}</tbody></table></div></details>`;
  const rg=agg(M.filter(x=>x.r===m.r),B),st=agg(M,B);
  radar('radar3',[{name:`${shortN(m.n)} ${B}`,c:'#c27a1a',v:b.dm,fill:true,w:2.5},{name:`${shortN(m.n)} ${A}`,c:'#c27a1a',v:a.dm,dash:true,w:1.4},{name:t('regionOf',m.r),c:'#7a4a9a',v:rg.dm,w:1.6},{name:t('stateAvg'),c:'#24458f',v:st.dm,w:1.6}],'radar3Leg');
  $('robTitle').textContent=t('robTitle',B);
  $('rob').innerHTML=`<p><span class="st st${b.st}">${esc(STN()[b.st])}</span></p>
   <div class="iv"><i style="left:${(b.mc[0]-1)/569*100}%;width:${Math.max(.6,(b.mc[2]-b.mc[0])/569*100)}%"></i><b style="left:calc(${(b.k-1)/569*100}% - 1px)"></b></div>
   <div class="ivl"><span>1</span><span>${esc(t('ivText',b.mc[0],b.mc[2],b.k))}</span><span>570</span></div>
   <div class="scroll"><table style="margin-top:8px"><thead><tr><th>${esc(t('scenario'))}</th><th class="n">ICCEM ${B}</th><th class="n">${esc(t('place'))} ${A}</th><th class="n">${esc(t('place'))} ${B}</th></tr></thead><tbody>
   ${D.meta.sens.scen.map((sc,i)=>`<tr${i===0?' style="font-weight:700"':''}><td>${esc(t('scenNames')[i])}</td><td class="n">${nf(b.sc[i])}</td><td class="n">${a.sk[i]}</td><td class="n">${b.sk[i]}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- METHOD ---------- */
function renderMethod(){const v=D.meta.validation;$('methodBody').innerHTML=t('method',nf(v.spearman,2),nf(v.pearson,2),Object.values(D.meta.ed).join(', '),D.meta.sens.nsim)}

/* ---------- downloads ---------- */
const SRC={'ICCEM_Oaxaca_2022-2026.xlsx':'xlsx.b64.txt','ICCEM_Oaxaca_shapefile.zip':'shp.b64.txt'};
async function getFile(f){if(!files[f])files[f]=await fetch(SRC[f]).then(r=>{if(!r.ok)throw new Error(r.status);return r.text()}).then(b=>{const s=atob(b.trim()),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer});return files[f].slice(0)}
async function saveFile(f){const msg=$('dlMsg');if(STANDALONE){const a=document.createElement('a');a.href='descargas/'+f;a.download=f;document.body.appendChild(a);a.click();a.remove();msg.textContent=t('dlDone',f);return}if(!DL){msg.textContent=t('dlUnavailable');return}
  try{msg.textContent=t('dlPreparing');const data=await getFile(f);await DL.save({filename:f,data});msg.textContent=t('dlDone',f)}catch(e){msg.textContent=e&&e.code==='declined'?t('dlDeclined'):e&&e.code==='rate_limited'?t('dlWait'):t('dlFail')}}
async function makePDF(){
  const msg=$('dlMsg');if(!DL&&!STANDALONE){msg.textContent=t('dlUnavailable');return}
  if(!window.jspdf){msg.textContent=t('dlFail');return}
  const lg=['zh','ja'].includes(S.lang)?'en':S.lang,T=(k,...a)=>{let v=pick(lg,k);return typeof v==='function'?v(...a):v};
  const fmt=(v,d=1)=>Number(v).toLocaleString(LANGS[lg].locale,{minimumFractionDigits:d,maximumFractionDigits:d}),sgn=(v,d=1)=>(v>0?'+':v<0?'-':'')+fmt(Math.abs(v),d);
  const clean=s=>String(s).replace(/[−–]/g,'-').replace(/[’]/g,"'").replace(/[^\x00-\xFF]/g,'');
  const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});const W=210;let y=0;
  const ms=scopeMs(),a=agg(ms,S.A),b=agg(ms,S.B),st=agg(M,S.B),m1=S.mun?byC[S.mun]:null,sc=S.mun?byC[S.mun].n:S.dis?T('districtOf',S.dis):S.reg?T('regionOf',S.reg):T('stateName');
  doc.setFillColor(163,18,58);doc.rect(0,0,W,30,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text(clean(T('pdfTitle')),14,13);
  doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(clean(`${sc} · ${S.A} -> ${S.B}`),14,21);doc.setFontSize(8.5);doc.text(clean(T('pdfSource')+' · '+new Date().toISOString().slice(0,10)),14,26.5);
  doc.setTextColor(29,25,22);y=42;
  const L=T('levels'),lv=lvl(b.i);
  doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text(clean(T('keyInd')),14,y);y+=4;
  const kp=[[ (m1?'ICCEM':T('iccemAvg'))+' '+S.B,fmt(b.i),clean(L[lv])+' · '+sgn(b.i-a.i)+' vs '+S.A],[T('ue')+' '+S.B,fmt(b.t,0),sgn((b.t/a.t-1)*100)+' %'],[T('per1000'),fmt(b.t/b.p*1000),''],m1?[T('stateRank'),m1.y[S.B].k+' / 570',clean(STN_l(lg)[m1.y[S.B].st])]:[T('municipalities'),String(b.n),'']];
  kp.forEach((k,i)=>{const x=14+i*46;doc.setDrawColor(230,221,211);doc.roundedRect(x,y,43,22,2,2);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(107,98,91);doc.text(clean(k[0]),x+3,y+5,{maxWidth:38});doc.setTextColor(29,25,22);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(clean(k[1]),x+3,y+14);doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(clean(k[2]),x+3,y+19.5,{maxWidth:38})});
  y+=32;
  // radar
  const cx=55,cy=y+38,R=30,pt=(i,v)=>[cx+Math.sin(i/6*2*Math.PI)*R*v/100,cy-Math.cos(i/6*2*Math.PI)*R*v/100];
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(clean(T('hexTitle')),14,y);
  doc.setDrawColor(220,210,200);[25,50,75,100].forEach(v=>{for(let i=0;i<6;i++){const p=pt(i,v),q=pt((i+1)%6,v);doc.line(p[0],p[1],q[0],q[1])}});
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');const ds=pick(lg,'dimsShort');for(let i=0;i<6;i++){const p=pt(i,100),l=pt(i,118);doc.line(cx,cy,p[0],p[1]);doc.text(clean(ds[i]),l[0],l[1]+1,{align:Math.abs(l[0]-cx)<3?'center':l[0]>cx?'left':'right'})}
  const poly=(v,c,w)=>{doc.setDrawColor(...c);doc.setLineWidth(w);for(let i=0;i<6;i++){const p=pt(i,v[i]),q=pt((i+1)%6,v[(i+1)%6]);doc.line(p[0],p[1],q[0],q[1])}doc.setLineWidth(.2)};
  poly(st.dm,[36,69,143],.5);poly(b.dm,[194,122,26],1.1);
  doc.setFontSize(7.5);doc.setTextColor(194,122,26);doc.text(clean(sc+' '+S.B),14,cy+44);doc.setTextColor(36,69,143);doc.text(clean(T('stateAvg')+' '+S.B),70,cy+44);doc.setTextColor(29,25,22);
  // dims table
  let ty=y+4;const tx=112;doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(clean(T('dimension')),tx,ty);doc.text(String(S.A),tx+50,ty,{align:'right'});doc.text(String(S.B),tx+64,ty,{align:'right'});doc.text('Oaxaca',tx+84,ty,{align:'right'});ty+=2;doc.setDrawColor(230,221,211);doc.line(tx,ty,tx+86,ty);ty+=5;doc.setFont('helvetica','normal');
  const dn=pick(lg,'dims');[['ICCEM',a.i,b.i,st.i],...b.dm.map((v,j)=>[dn[j],a.dm[j],v,st.dm[j]])].forEach(r=>{doc.text(clean(r[0]),tx,ty);doc.text(fmt(r[1]),tx+50,ty,{align:'right'});doc.setFont('helvetica','bold');doc.text(fmt(r[2]),tx+64,ty,{align:'right'});doc.setFont('helvetica','normal');doc.text(fmt(r[3]),tx+84,ty,{align:'right'});ty+=6.2});
  y=cy+52;
  // reading
  const best=d3.maxIndex(b.dm),worst=d3.minIndex(b.dm);
  doc.setFontSize(9.5);const rd=doc.splitTextToSize(clean(T('reading',sc,dn[best],fmt(b.dm[best]),dn[worst],fmt(b.dm[worst]),sgn(b.i-st.i),S.B,sgn(b.i-a.i),S.A)),182);doc.text(rd,14,y);y+=rd.length*4.6+5;
  // sectors
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(clean(T('secTitle',S.B)),14,y);y+=6;doc.setFontSize(8.5);
  const sn=pick(lg,'sectors'),tot=b.t||1;b.s.map((v,j)=>({j,v,a:a.s[j],lq:(v/tot)/(st.s[j]/st.t)})).sort((p,q)=>q.v-p.v).slice(0,8).forEach(x=>{doc.setFont('helvetica','normal');doc.text(clean(sn[x.j]),14,y);doc.setFillColor(163,18,58);doc.rect(70,y-2.8,Math.max(.5,x.v/tot*100*1.1),3,'F');doc.text(`${fmt(x.v/tot*100)} %  ·  LQ ${fmt(x.lq,2)}  ·  ${sgn(x.v-x.a,0)}`,150,y);y+=5.5});
  y+=4;
  if(m1){const r=m1.y[S.B];doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(clean(T('robTitle',S.B)),14,y);y+=6;doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.text(clean(`${STN_l(lg)[r.st]} · `+T('ivText',r.mc[0],r.mc[2],r.k)),14,y,{maxWidth:182});y+=9}
  doc.setFontSize(7.5);doc.setTextColor(107,98,91);doc.text(doc.splitTextToSize(clean(T('pdfMethod')),182),14,282);
  try{msg.textContent=t('dlPreparing');const name=`ICCEM_${clean(sc).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').slice(0,40)}_${S.A}-${S.B}.pdf`;if(STANDALONE)doc.save(name);else await DL.save({filename:name,data:doc.output('arraybuffer')});msg.textContent=t('dlDone',name)}catch(e){msg.textContent=e&&e.code==='declined'?t('dlDeclined'):t('dlFail')}
}
function STN_l(lg){return pick(lg,'stab')}
}
