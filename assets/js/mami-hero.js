/* MamiPicks hero: paper-cut lightbox, age slider, music box. Needs gsap. */
(() => {
const W = 400, H = 660, TAU = Math.PI * 2, D2R = Math.PI / 180;
let DPR = 1;
// OS 'reduce motion' only drops the screen shake; gentle sparkles and motion stay on
const osReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reduce = false;

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const P = d => new Path2D(d);
const C = (x,y,r) => { const p = new Path2D(); p.arc(x,y,r,0,TAU); return p; };
const E = (x,y,rx,ry,rot) => { const p = new Path2D(); p.ellipse(x,y,rx,ry,(rot||0)*D2R,0,TAU); return p; };
const rotAbout = (ctx,a,x,y) => { ctx.translate(x,y); ctx.rotate(a); ctx.translate(-x,-y); };
function mkCanvas(w=W,h=H){ const c=document.createElement('canvas'); c.width=Math.round(w*DPR); c.height=Math.round(h*DPR); const x=c.getContext('2d'); x.setTransform(DPR,0,0,DPR,0,0); return [c,x]; }
function hex(h){ h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); }
function shade(h,k){ const [r,g,b]=hex(h); const f=v=>Math.round(k<0?v*(1+k):v+(255-v)*k); return `rgb(${f(r)},${f(g)},${f(b)})`; }
const HEART = P('M0 -4 C0 -9 -7 -9 -7 -4 C-7 0 0 4 0 6 C0 4 7 0 7 -4 C7 -9 0 -9 0 -4 Z');

// ---------- transforms ----------
// tf can be: old array [dx,dy,deg,px,py] | object {x,y,r,px,py,s} | list of objects
function applyOne(ctx,tf){
  if(Array.isArray(tf)){ ctx.translate(tf[0],tf[1]); if(tf[2]) rotAbout(ctx,tf[2]*D2R,tf[3],tf[4]); return; }
  const px=tf.px||0, py=tf.py||0;
  ctx.translate(px+(tf.x||0),py+(tf.y||0)); if(tf.r) ctx.rotate(tf.r*D2R); if(tf.s&&tf.s!==1) ctx.scale(tf.s,tf.s); ctx.translate(-px,-py);
}
function applyTf(ctx,tf){ if(!tf) return; if(Array.isArray(tf)&&typeof tf[0]==='object') tf.forEach(t=>applyOne(ctx,t)); else applyOne(ctx,tf); }
function tfPoint(tf,x,y){ const m=new DOMMatrix(); const fake={translate:(a,b)=>m.translateSelf(a,b),rotate:a=>m.rotateSelf(a/D2R),scale:(a,b)=>m.scaleSelf(a,b)}; applyTf(fake,tf); const p=m.transformPoint({x,y}); return [p.x,p.y]; }

// ---------- MOM (shared character, local coords from the approved 0–6m file) ----------
const MOM = {
  backHair:{items:[
    {p:P('M165 122 C158 80 200 58 242 68 C288 80 304 122 294 170 C288 208 300 248 314 282 C284 294 256 274 250 240 Z'),f:'hair'},
    {p:C(270,80,25),f:'hair'}],
    strands:[P('M270 118 C284 160 280 200 298 250'),P('M258 138 C268 180 262 214 276 252'),P('M262 74 A9 9 0 1 1 276 88'),P('M282 150 C292 190 292 224 306 266')]},
  torso:[
    {p:P('M66 440 C70 360 100 290 160 262 C186 251 246 249 272 262 C334 290 352 360 352 440 Z'),f:'dress'},
    {p:P('M66 440 C70 360 100 290 160 262 C186 251 246 249 272 262 C334 290 352 360 352 440 C358 500 368 620 376 760 L42 760 C50 620 60 500 66 440 Z'),f:'dress'},
    {p:P('M150 266 C180 252 250 252 280 266 C310 278 322 300 320 336 C318 372 302 404 296 426 C318 500 340 620 352 760 L78 760 C90 620 112 500 134 426 C128 404 112 372 110 336 C108 300 120 278 150 266 Z'),f:'dress'},
    {p:P('M132 418 C180 430 250 430 298 418 L301 436 C250 448 180 448 129 436 Z'),f:'dress2'},
    {p:P('M196 210 L234 210 L238 258 C222 270 206 270 192 258 Z'),f:'skin'},
    {p:P('M184 258 C200 282 232 282 250 258 L262 264 C240 296 196 296 172 264 Z'),f:'dress2'}],
  head:{items:[
    {p:E(215,155,44,52),f:'skin'},
    {p:C(194,178,8),f:'blush'},{p:C(240,175,8),f:'blush'},
    {p:E(195,165.5,3.3,3.4,0),f:'ink'},{p:E(229,163.5,3.3,3.4,0),f:'ink'},
    {p:C(196.2,164.6,.9),f:'hi'},{p:C(230.2,162.6,.9),f:'hi'},
    {p:P('M188 163 Q196 158.5 206 162 L206 158 L188 158 Z'),f:'lid'},{p:P('M222 161 Q230 156.5 240 160 L240 156 L222 156 Z'),f:'lid'},
    {p:P('M168 162 C158 110 194 90 228 93 C264 96 272 132 262 164 C256 136 240 117 214 119 C192 121 176 136 168 162 Z'),f:'hair'}],
    lines:[P('M188 163 Q196 158.5 206 162'),P('M222 161 Q230 156.5 240 160'),P('M216 168 Q212 179 219 181'),P('M207 191 Q215 197 223 190')],
    strands:[P('M178 150 C186 126 208 112 236 112'),P('M192 134 C208 120 228 116 252 124'),P('M189 152 Q197 149 205 151'),P('M223 150 Q231 147 239 149')]}
};
// place = where mom stands in this pose; tilt = how far she bends her head toward the child
function momParts(place,tilt,standing){
  const T=MOM.torso, torso=standing?[T[2],T[4],T[5],T[3]]:[T[1],T[4],T[5]];
  return {
    backHair:{tf:[place,{x:0,y:14}],items:MOM.backHair.items,strands:MOM.backHair.strands},
    torso:{tf:[place],items:torso},
    head:{tf:[place,{x:0,y:14,r:tilt,px:215,py:160}],items:MOM.head.items,lines:MOM.head.lines,strands:MOM.head.strands}
  };
}

// ---------- CHILD helpers (canvas coords) ----------
function kidHead(cx,cy,r,o){
  const it=[], ln=[], st=[];
  if(o.bob) it.push({p:P(`M${cx-r-7} ${cy+r*.55} C${cx-r-14} ${cy-r-14} ${cx+r+14} ${cy-r-14} ${cx+r+7} ${cy+r*.55} C${cx+r*.5} ${cy+r*.75} ${cx-r*.5} ${cy+r*.75} ${cx-r-7} ${cy+r*.55} Z`),f:'khair'});
  if(!o.bob){ it.push({p:C(cx-r+1,cy+r*.12,r*.2),f:'skin'}); it.push({p:C(cx+r-1,cy+r*.12,r*.2),f:'skin'}); }
  it.push({p:C(cx,cy,r),f:'skin'});
  const ex=r*.36, ey=cy+r*.08, eyeY=ey;
  it.push({p:C(cx-r*.56,cy+r*.4,r*.17),f:'blush'},{p:C(cx+r*.56,cy+r*.4,r*.17),f:'blush'});
  const gx=o.gaze?o.gaze[0]:0, gy=o.gaze?o.gaze[1]:0;
  if(o.eyes==='open'){ [cx-ex,cx+ex].forEach(x=>{ it.push({p:E(x+gx,eyeY+gy,r*.085,r*.1),f:'ink'}); it.push({p:C(x+gx+r*.03,eyeY+gy-r*.035,r*.03),f:'hi'}); }); }
  if(o.eyes==='happy'){ [cx-ex,cx+ex].forEach(x=>ln.push(P(`M${x-r*.13} ${eyeY+r*.04} Q${x} ${eyeY-r*.12} ${x+r*.13} ${eyeY+r*.04}`))); }
  if(o.eyes==='read'){ [cx-ex,cx+ex].forEach(x=>{ const y=eyeY+r*.1;
      it.push({p:E(x,y,r*.1,r*.12),f:'ink'}); it.push({p:C(x+r*.035,y+r*.03,r*.03),f:'hi'});
      it.push({p:P(`M${x-r*.17} ${y-r*.02} Q${x} ${y-r*.12} ${x+r*.17} ${y-r*.02} L${x+r*.17} ${y-r*.2} L${x-r*.17} ${y-r*.2} Z`),f:'lid'});
      ln.push(P(`M${x-r*.17} ${y-r*.02} Q${x} ${y-r*.12} ${x+r*.17} ${y-r*.02}`)); }); }
  if(o.eyes==='down'){ [cx-ex,cx+ex].forEach(x=>ln.push(P(`M${x-r*.14} ${eyeY} Q${x} ${eyeY+r*.12} ${x+r*.14} ${eyeY}`))); }
  const my=cy+r*.46;
  if(o.mouth==='smile') ln.push(P(`M${cx-r*.18} ${my} Q${cx} ${my+r*.16} ${cx+r*.18} ${my}`));
  if(o.mouth==='open') it.push({p:P(`M${cx-r*.2} ${my-r*.02} Q${cx} ${my+r*.32} ${cx+r*.2} ${my-r*.02} Q${cx} ${my+r*.06} ${cx-r*.2} ${my-r*.02} Z`),f:'mouth'});
  if(o.mouth==='o') it.push({p:E(cx,my+r*.06,r*.08,r*.1),f:'mouth'});
  if(o.hair==='tuft'){
    it.push({p:P(`M${cx-r*.42} ${cy-r*.86} C${cx-r*.3} ${cy-r*1.22} ${cx+r*.3} ${cy-r*1.26} ${cx+r*.46} ${cy-r*.86} C${cx+r*.2} ${cy-r*.98} ${cx-r*.14} ${cy-r*.98} ${cx-r*.42} ${cy-r*.86} Z`),f:'khair'});
    st.push(P(`M${cx-r*.05} ${cy-r*1.05} q${r*.18} ${-r*.22} ${r*.3} ${-r*.02} q${-r*.06} ${r*.14} ${-r*.18} ${r*.04}`));
  }
  if(o.hair==='cap'||o.bob){
    it.push({p:P(`M${cx-r*1.02} ${cy+r*.02} C${cx-r*1.1} ${cy-r*1.28} ${cx+r*1.1} ${cy-r*1.28} ${cx+r*1.02} ${cy+r*.02} C${cx+r*.86} ${cy-r*.42} ${cx+r*.5} ${cy-r*.56} ${cx+r*.18} ${cy-r*.44} C${cx-r*.06} ${cy-r*.62} ${cx-r*.46} ${cy-r*.6} ${cx-r*.66} ${cy-r*.42} C${cx-r*.84} ${cy-r*.34} ${cx-r*.96} ${cy-r*.18} ${cx-r*1.02} ${cy+r*.02} Z`),f:'khair'});
    st.push(P(`M${cx-r*.5} ${cy-r*.86} C${cx-r*.2} ${cy-r*1.02} ${cx+r*.2} ${cy-r*1.02} ${cx+r*.56} ${cy-r*.84}`));
    if(o.curl) st.push(P(`M${cx+r*.1} ${cy-r*1.02} q${r*.1} ${-r*.3} ${r*.32} ${-r*.2} q-${r*.04} ${r*.16} ${-r*.16} ${r*.08}`));
  }
  return {items:it,lines:ln,strands:st};
}
// thick paper strip (arm, leg) with the same rim light as a sheet
const L = (d,w,f) => ({s:P(d),w,f});
function OH(ex,ey,px,py,rx=18,ry=13,out=.62){
  const a=Math.atan2(ey-py,ex-px); return {p:E(ex+Math.cos(a)*rx*out,ey+Math.sin(a)*rx*out,rx,ry,a/D2R),f:'skin'};
}
// paper hand: palm + fingers pointing along the angle, thumb as its own small sheet, two finger cuts
function hand(wx,wy,deg,sc=1,flip=false){
  const M=new DOMMatrix().translate(wx,wy).rotate(deg).scale(sc,flip?-sc:sc);
  const mk=d=>{ const p=new Path2D(); p.addPath(P(d),M); return p; };
  return {items:[{p:mk('M-3 -8 C6 -11 18 -10 26 -7 C32 -5 33 2 29 5 C21 9 8 9 -3 7 C-6 3 -6 -4 -3 -8 Z'),f:'skin'},
                 {p:mk('M6 -8 C9 -16 17 -18 19 -13 C20 -10 15 -8 12 -5 Z'),f:'skin',sh:.5},
                 {p:mk('M-9 -11 C-3 -12 1 -11 3 -9 L3 9 C1 11 -3 12 -9 11 Z'),f:'dress',sh:.6}],
          faint:[mk('M18 -3 Q24 -3.5 30 -2.5'),mk('M18 1.5 Q23 2 28 3')]};
}

// ---------- paper-cut lightbox style ----------
const LB = {
  pal:{dress:'#ea93a0',dress2:'#d77484',skin:'#f7d4bd',hair:'#f1dfaa',wrap:'#fff6e6',wrap2:'#f8dcae',blush:'#f29a8f',ink:'#6b3b33',
       khair:'#f3d99a',butter:'#fbe2a0',sky:'#bcdcec',sky2:'#9fcbe0',mint:'#c8e6cf',mint2:'#a9d6b4',cream:'#fff4e2',shoe:'#e8888e',mouth:'#c4646c',
       page:'#fffaf0',cover:'#9fcbe0',gold:'#f8cf74',shadowg:'rgba(150,80,60,.18)'},
  sheet(ctx,path,color,sh=1,rim=true){
    ctx.save(); ctx.shadowColor='rgba(120,60,50,.30)'; ctx.shadowBlur=9*DPR*sh; ctx.shadowOffsetX=2.5*DPR*sh; ctx.shadowOffsetY=5*DPR*sh; ctx.fillStyle=color; ctx.fill(path); ctx.restore();
    if(!rim) return;
    ctx.save(); ctx.clip(path);
    ctx.translate(1.4,2); ctx.strokeStyle='rgba(255,252,240,.6)'; ctx.lineWidth=2.4; ctx.stroke(path);
    ctx.translate(-2.8,-4); ctx.strokeStyle='rgba(90,40,30,.18)'; ctx.lineWidth=2.4; ctx.stroke(path);
    ctx.restore();
  },
  strip(ctx,path,w,color){
    // paper strip: shadow, darker lower edge, lighter upper edge, body
    const [t,x]=mkCanvas(); x.lineCap='round'; x.lineJoin='round'; x.setTransform(ctx.getTransform());
    x.strokeStyle=color; x.lineWidth=w; x.stroke(path);
    x.globalCompositeOperation='source-atop';
    x.save(); x.translate(-.8,1.6); x.strokeStyle='rgba(90,40,30,.2)'; x.lineWidth=w; x.stroke(path); x.restore();
    x.save(); x.translate(.6,-1.4); x.strokeStyle=shade(color,.35); x.lineWidth=w; x.stroke(path); x.restore();
    x.strokeStyle=color; x.lineWidth=w-3.4; x.stroke(path);
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.shadowColor='rgba(120,60,50,.30)'; ctx.shadowBlur=9*DPR; ctx.shadowOffsetX=2.5*DPR; ctx.shadowOffsetY=5*DPR; ctx.drawImage(t,0,0); ctx.restore();
  },
  part(def){
    const [c,ctx]=mkCanvas(), pal=this.pal;
    ctx.save(); applyTf(ctx,def.tf);
    for(const it of def.items){
      if(it.f==='blush'){ ctx.save(); ctx.globalAlpha=.45; ctx.fillStyle=pal.blush; ctx.fill(it.p); ctx.restore(); continue; }
      if(it.f==='ink'||it.f==='hi'){ ctx.fillStyle=it.f==='ink'?'#4a3a40':'#fffaf2'; ctx.fill(it.p); continue; }
      if(it.f==='lid'){ ctx.fillStyle=pal.skin; ctx.fill(it.p); continue; }
      if(it.f==='mouth'){ ctx.fillStyle=pal.mouth; ctx.fill(it.p); continue; }
      if(it.f==='shadowg'){ ctx.save(); ctx.filter=`blur(${3*DPR}px)`; ctx.fillStyle=pal.shadowg; ctx.fill(it.p); ctx.restore(); continue; }
      if(it.f==='plain'){ ctx.fillStyle=it.c; ctx.fill(it.p); continue; }
      if(it.s){ this.strip(ctx,it.s,it.w,pal[it.f]); continue; }
      this.sheet(ctx,it.p,pal[it.f]||it.f,it.sh||1);
    }
    ctx.restore();
    grainAtop(ctx,.1);
    ctx.save(); applyTf(ctx,def.tf);
    if(def.lines){ ctx.lineCap='round'; ctx.strokeStyle=def.ink||pal.ink; ctx.lineWidth=def.lw||2; def.lines.forEach(l=>ctx.stroke(l)); }
    if(def.strands){ ctx.lineCap='round'; ctx.strokeStyle=shade(def.strandCol||pal.hair,-.3); ctx.globalAlpha=.75; ctx.lineWidth=1.4; def.strands.forEach(l=>ctx.stroke(l)); ctx.globalAlpha=1; }
    if(def.faint){ ctx.lineCap='round'; ctx.strokeStyle='rgba(150,120,100,.35)'; ctx.lineWidth=1.6; def.faint.forEach(l=>ctx.stroke(l)); }
    ctx.restore();
    return c;
  },
  bg(){
    const [c,ctx]=mkCanvas();
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#fff1dc'); g.addColorStop(.6,'#ffe1cf'); g.addColorStop(1,'#fdd3c6');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H); grainAtop(ctx,.05,'multiply'); return c;
  },
  glow(){
    const [c,ctx]=mkCanvas();
    const g=ctx.createRadialGradient(205,190,0,205,190,230);
    g.addColorStop(0,'rgba(255,252,235,1)'); g.addColorStop(.25,'rgba(255,240,200,.9)'); g.addColorStop(.6,'rgba(255,220,180,.35)'); g.addColorStop(1,'rgba(255,210,180,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff4cf'; ctx.beginPath(); ctx.arc(205,190,62,0,TAU); ctx.fill(); return c;
  },
  layer(kind){
    const [c,ctx]=mkCanvas(W+40,H); ctx.translate(20,0); const r=mulberry(kind==='clouds'?5:9);
    const p=new Path2D();
    if(kind==='clouds'){ p.rect(-20,258,W+40,200); for(let x=-20;x<=W+20;x+=38){ p.moveTo(x+34,258); p.arc(x,258,22+r()*16,0,TAU); } this.sheet(ctx,p,'#f6d5df',.8,false); }
    else { p.moveTo(-20,330); p.bezierCurveTo(60,290,120,300,180,322); p.bezierCurveTo(240,342,300,290,W+20,312); p.lineTo(W+20,H+10); p.lineTo(-20,H+10); p.closePath();
      [[30,300],[52,294],[352,296],[372,302]].forEach(([x,y])=>{ p.moveTo(x+12,y); p.arc(x,y,12,0,TAU); p.rect(x-1.5,y,3,26); });
      this.sheet(ctx,p,'#fbc3a6',.9,false); }
    grainAtop(ctx,.08); return c;
  },
  mobile(){
    const star=new Path2D(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?7:16; i?star.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):star.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } star.closePath();
    const moon=P('M0 -16 A16 16 0 1 0 0 16 A11 16 0 0 1 0 -16 Z');
    const heart=new Path2D(); heart.addPath(HEART,new DOMMatrix().scale(1.8));
    return [{x:60,len:96,p:star,ph:0,amp:9},{x:100,len:58,p:heart,ph:1.7,amp:7},{x:346,len:82,p:moon,ph:.9,amp:8}];
  },
  frame(){
    const [c,ctx]=mkCanvas(), b=14;
    ctx.save(); ctx.beginPath(); ctx.rect(b,b,W-2*b,H-2*b); ctx.clip();
    ctx.shadowColor='rgba(90,45,25,.42)'; ctx.shadowBlur=22*DPR; ctx.strokeStyle='#000'; ctx.lineWidth=40; ctx.strokeRect(b-20,b-20,W-2*b+40,H-2*b+40); ctx.restore();
    const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#f1d6ae'); g.addColorStop(1,'#dcb486');
    const f=new Path2D(); f.rect(0,0,W,H); f.rect(b,b,W-2*b,H-2*b);
    ctx.fillStyle=g; ctx.fill(f,'evenodd');
    ctx.strokeStyle='rgba(255,248,230,.6)'; ctx.lineWidth=1; ctx.strokeRect(b-.5,b-.5,W-2*b+1,H-2*b+1);
    ctx.save(); ctx.globalAlpha=.25; ctx.strokeStyle='#b88a5a'; ctx.lineWidth=.6; const r=mulberry(4);
    for(let i=0;i<40;i++){ const y=r()*H; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(b,y+r()*4); ctx.moveTo(W-b,y); ctx.lineTo(W,y+r()*4); ctx.stroke(); }
    ctx.restore();
    const v=ctx.createRadialGradient(W/2,H/2,140,W/2,H/2,320); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(90,40,30,.16)');
    ctx.fillStyle=v; ctx.fillRect(b,b,W-2*b,H-2*b); return c;
  },
  particle(){ const [c,ctx]=mkCanvas(24,24); const g=ctx.createRadialGradient(12,12,0,12,12,12); g.addColorStop(0,'rgba(255,250,220,1)'); g.addColorStop(.35,'rgba(255,225,150,.75)'); g.addColorStop(1,'rgba(255,210,140,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,24,24); return c; }
};

// ---------- textures ----------
function noiseTile(seed,size=128,lo=0,hi=255){
  const c=document.createElement('canvas'); c.width=c.height=size; const x=c.getContext('2d');
  const d=x.createImageData(size,size), r=mulberry(seed);
  for(let i=0;i<d.data.length;i+=4){ const v=lo+r()*(hi-lo); d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255; }
  x.putImageData(d,0,0); return c;
}
const GRAIN = noiseTile(7);
function grainAtop(ctx,alpha,op='source-atop'){ ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation=op; ctx.globalAlpha=alpha; ctx.fillStyle=ctx.createPattern(GRAIN,'repeat'); ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.restore(); }

// =====================================================================
// POSES
// =====================================================================
const POSES = [];

// ---- 0–6 months (approved, unchanged) ----
POSES.push((() => {
  const parts = {
    backHair:{tf:[0,14],items:MOM.backHair.items,strands:MOM.backHair.strands},
    torso:{items:[MOM.torso[1],MOM.torso[4],MOM.torso[5]]},
    head:{tf:[0,14,-12,215,160],items:MOM.head.items,lines:MOM.head.lines,strands:MOM.head.strands},
    baby:{items:[
      {p:C(118,300,42),f:'wrap2'},
      {p:P('M95 300 C100 262 160 254 216 270 C266 284 302 310 292 346 C282 376 220 382 164 366 C114 352 92 330 95 300 Z'),f:'wrap'},
      {p:P('M150 284 C185 300 222 300 250 288 C232 314 180 318 150 284 Z'),f:'wrap2'}]},
    babyHead:{tf:[-2,6,-14,124,296],items:[{p:C(124,296,32),f:'skin'},{p:C(108,308,5.5),f:'blush'},{p:C(142,310,5.5),f:'blush'}],
      lines:[P('M117 268 Q125 258 129 270'),P('M108 297 Q113 302 118 297'),P('M129 299 Q134 304 139 299'),P('M120 311 Q124 314 128 311')]},
    babyHand:{items:[{p:C(172,302,9),f:'skin'}]},
    armLow:{items:[{p:P('M112 278 C84 292 66 318 74 338 C100 334 124 340 154 356 C196 376 252 374 296 346 L310 370 C268 402 200 412 138 398 C88 388 50 362 52 328 C54 302 76 284 112 278 Z'),f:'dress'}]},
    arms:{items:[{p:E(300,358,15,11,-30),f:'skin'},{p:P('M336 336 C318 302 286 290 254 298 L258 326 C280 318 304 324 318 350 Z'),f:'dress'}]},
    mhand:{items:[{p:E(242,310,19,12,-18),f:'skin'}]}
  };
  return {
    id:'a', title:'0–6 tháng · Mẹ ôm bé nằm trên tay', tag:'done',
    desc:'Đã duyệt. Đầu bé gối lên khuỷu tay mẹ, mẹ khẽ đung đưa.',
    parts, order:['backHair','torso','head','armLow','baby','babyHead','babyHand','arms','mhand'],
    rock:[2,200,440,5.6], breath:true,
    motion(t){
      const headA=(-1.5+2.5*Math.sin(TAU*(t-.4)/5.6))*D2R;
      const babyA=5*(.5-.5*Math.cos(TAU*t/4.4))*D2R;
      const hs=Math.max(0,Math.sin(TAU*t/3)), hy=-4*hs*hs*hs;
      const mx=-4*(.5-.5*Math.cos(TAU*t/3.4));
      return { head:c=>rotAbout(c,headA,215,224), babyHead:c=>rotAbout(c,babyA*.6,126,330), babyHand:c=>c.translate(2*hs,hy), mhand:c=>c.translate(mx,0) };
    }
  };
})());

// ---- 6–12 months: baby sits on mom's hip ----
POSES.push((() => {
  const place={x:0,y:0,s:1,px:215,py:60};
  const m=momParts(place,-9);
  const bx=122, by=228, br=33;
  const head=kidHead(bx,by,br,{eyes:'open',gaze:[2,-1.5],mouth:'open',hair:'tuft'});
  const parts = {
    ...m,
    babyArmOut:{items:[L('M90 290 C76 304 68 322 70 340',15,'wrap'),{p:C(70,346,8.5),f:'skin'}]},
    babyBody:{items:[
      {p:P('M94 266 C72 282 66 330 74 362 C84 394 142 402 170 384 C188 358 184 298 158 270 C140 256 110 256 94 266 Z'),f:'wrap'},
      {p:P('M100 268 C114 282 136 282 150 268 C140 258 112 258 100 268 Z'),f:'wrap2'},
      {p:C(124,314,3.2),f:'wrap2'},{p:C(124,334,3.2),f:'wrap2'},{p:C(124,354,3.2),f:'wrap2'}]},
    babyHead:{items:head.items,lines:head.lines,strands:head.strands,strandCol:'#f3d99a'},
    momArmR:{items:[OH(196,354,224,380),L('M326 302 C344 346 334 386 304 396 C268 404 224 380 196 354',28,'dress')]},
    babyArmUp:{items:[L('M150 284 C162 274 172 262 180 254',14,'wrap'),{p:C(184,249,8.5),f:'skin'}]},
    momArmL:{items:[OH(174,402,152,409,18,13),L('M100 306 C84 350 82 388 98 404 C118 412 148 410 174 402',30,'dress')]},
    babyLeg:{items:[L('M136 372 C156 384 172 398 180 414',22,'wrap'),{p:E(184,425,9,12,-20),f:'skin'}]},
    babyLeg2:{items:[L('M100 370 C98 388 96 402 94 416',22,'wrap'),{p:E(93,427,9,12,8),f:'skin'}]}
  };
  return {
    id:'b', title:'6–12 tháng · Bé ngồi trên hông mẹ', tag:'new',
    desc:'Bé ngồi trên cẳng tay mẹ, mặc áo liền kem, có chỏm tóc xoăn. Tay mẹ ôm bụng bé, tay kia đỡ dưới đùi bé. Mẹ nhún nhẹ, bé đá hai chân, một tay với lên cằm mẹ, tay kia vẫy.',
    parts, order:['backHair','torso','head','babyArmOut','babyBody','babyHead','momArmR','babyArmUp','momArmL','babyLeg2','babyLeg'],
    rock:[1.4,200,440,5.2], breath:true, kidTf:{x:6,y:0,s:.85,px:128,py:398},
    motion(t){
      const bounce=-3*Math.pow(Math.abs(Math.sin(TAU*t/2.4)),1.5);
      const up=c=>c.translate(0,bounce);
      const headA=(-1+2*Math.sin(TAU*(t-.5)/5.2))*D2R;
      return {
        head:c=>rotAbout(c,headA,215,224),
        babyArmOut:c=>{ up(c); rotAbout(c,(10*Math.sin(t*3.1+1))*D2R,90,290); },
        babyBody:up, momArmL:up, momHandL:up,
        babyHead:c=>{ up(c); rotAbout(c,(4*Math.sin(TAU*t/3.6))*D2R,bx,by+br); },
        babyArmUp:c=>{ up(c); rotAbout(c,(-8+9*Math.sin(t*2.3))*D2R,150,284); },
        babyLeg:c=>{ up(c); rotAbout(c,(7*Math.sin(t*3.4))*D2R,136,372); },
        babyLeg2:c=>{ up(c); rotAbout(c,(-7*Math.sin(t*3.4+1.2))*D2R,100,370); },
        momArmR:c=>c.translate(0,bounce*.6)
      };
    }
  };
})());

// ---- 1–2 years: toddler stands and walks, holding mom's hand ----
POSES.push((() => {
  const place={x:66,y:0,s:.8,px:215,py:60};
  const m=momParts(place,-13,true);
  const kx=100, ky=318, kr=31;
  const head=kidHead(kx,ky,kr,{eyes:'open',gaze:[1.5,0],mouth:'open',hair:'cap'});
  const parts = {
    ...m,
    momArmR:{tf:[place],items:[OH(328,440,334,400,20,15),L('M314 300 C330 350 334 400 328 440',28,'dress')]},
    ground:{items:[{p:E(102,430,46,6),f:'shadowg'}]},
    legL:{items:[L('M88 398 L84 420',15,'skin'),{p:E(80,427,13,7.5,0),f:'shoe'}]},
    legR:{items:[L('M114 398 L118 420',15,'skin'),{p:E(122,427,13,7.5,0),f:'shoe'}]},
    kidArmL:{items:[L('M80 356 C70 362 62 368 56 376',13,'cream'),{p:C(53,380,8),f:'skin'}]},
    kidBody:{items:[
      {p:P('M78 350 C68 364 68 386 74 402 L128 402 C134 386 132 364 122 350 C110 342 90 342 78 350 Z'),f:'cream'},
      {p:P('M74 380 L128 380 L130 406 L104 408 L101 400 L98 408 L72 406 Z'),f:'sky'},
      {p:P('M82 356 L86 382 L92 382 L90 354 Z'),f:'sky'},{p:P('M118 356 L114 382 L108 382 L110 354 Z'),f:'sky'},
      {p:C(89,385,2.6),f:'cream'},{p:C(111,385,2.6),f:'cream'}]},
    kidHead:{items:head.items,lines:head.lines,strands:head.strands,strandCol:'#f3d99a'},
    kidArmR:{items:[L('M120 356 C132 360 142 363 150 365',13,'cream')]},
    momArmL:{tf:[place],items:[OH(70,432,80,402,20,15),L('M118 300 C100 350 80 402 70 432',28,'dress')]},
    hands:{items:[{p:C(150,365,8.5),f:'skin'}]}
  };
  return {
    id:'c', title:'1–2 tuổi · Bé nắm tay mẹ tập đi', tag:'new',
    desc:'Mẹ đứng cúi nhìn, bé cao tới hông mẹ, giơ tay nắm tay mẹ, tay kia dang ra giữ thăng bằng. Bé bước lẫm chẫm, người lắc nhẹ sang hai bên.',
    parts, order:['backHair','torso','head','momArmR','ground','legL','legR','kidArmL','kidBody','kidHead','kidArmR','momArmL','hands'],
    rock:[.8,250,440,6], breath:true, kid:true, kidTf:{x:17,y:-6,s:.9,px:100,py:428},
    motion(t){
      const ph=TAU*t/1.5;            // one step pair every 1.5 s
      const sway=2.2*Math.sin(ph);   // side to side wobble
      const liftL=Math.max(0,Math.sin(ph)), liftR=Math.max(0,-Math.sin(ph));
      const body=c=>{ c.translate(sway*.6,-1.5*Math.abs(Math.sin(ph))); rotAbout(c,sway*.9*D2R,100,428); };
      const headA=(-1+1.6*Math.sin(TAU*(t-.4)/6))*D2R;
      const hp=tfPoint(place,215,224);
      return {
        head:c=>rotAbout(c,headA,hp[0],hp[1]),
        legL:c=>{ c.translate(sway*.6,-5*liftL); rotAbout(c,-6*liftL*D2R,88,398); },
        legR:c=>{ c.translate(sway*.6,-5*liftR); rotAbout(c,6*liftR*D2R,114,398); },
        kidBody:body, kidHead:c=>{ body(c); rotAbout(c,(-3*Math.sin(ph))*D2R,kx,ky+kr); },
        kidArmL:c=>{ body(c); rotAbout(c,(10*Math.sin(ph+1))*D2R,80,356); },
        kidArmR:c=>c.translate(sway*.25,0),
        momArmL:c=>rotAbout(c,(sway*.3)*D2R,203,252), hands:c=>c.translate(sway*.4,0),
        ground:c=>c.translate(sway*.4,0)
      };
    }
  };
})());

// ---- 2–3 years: child runs beside mom with a pinwheel ----
POSES.push((() => {
  const place={x:70,y:4,s:.8,px:215,py:60};
  const m=momParts(place,-12,true);
  const kx=96, ky=270, kr=32;
  const head=kidHead(kx,ky,kr,{eyes:'happy',mouth:'open',hair:'cap'});
  // pinwheel (spins around its own centre)
  const pw=new Path2D(); const pc=[70,214];
  for(let i=0;i<4;i++){ const a=i*Math.PI/2; const M=new DOMMatrix().translate(pc[0],pc[1]).rotate(a/D2R);
    const blade=new Path2D('M0 0 L0 -26 C10 -24 18 -14 14 -4 Z'); pw.addPath(blade,M); }
  const parts = {
    ...m,
    momArmR:{tf:[place],items:[OH(328,440,334,400,20,15),L('M314 300 C330 350 334 400 328 440',28,'dress')]},
    ground:{items:[{p:E(100,428,40,5),f:'shadowg'}]},
    legBack:{items:[L('M108 366 L120 390 L142 396',16,'sky2'),{p:E(149,395,12,7.5,14),f:'shoe'}]},
    kidArmBack:{items:[L('M114 316 C126 330 136 340 146 346',13,'butter'),{p:C(150,349,8),f:'skin'}]},
    kidBody:{items:[
      {p:P('M78 306 C66 322 66 350 74 368 L124 364 C130 344 128 320 116 304 C104 296 88 296 78 306 Z'),f:'butter'},
      {p:P('M72 356 L126 352 L130 376 L72 380 Z'),f:'sky2'},
      {p:P('M84 306 C92 314 104 314 112 304 C104 300 92 300 84 306 Z'),f:'cream'},
      {p:P('M76 330 C92 334 110 334 126 328 L126 336 C110 342 92 342 76 338 Z'),f:'cream'}]},
    legFront:{items:[L('M84 372 L68 394 L70 416',16,'sky2'),{p:E(66,422,13,7.5,-4),f:'shoe'}]},
    kidHead:{items:head.items,lines:head.lines,strands:head.strands,strandCol:'#f3d99a'},
    kidArmFront:{items:[L('M80 314 C74 292 72 266 72 242',13,'butter'),{p:C(72,238,8.5),f:'skin'},L('M72 240 L70 216',3,'gold')]},
    pinwheel:{items:[{p:pw,f:'#f6a8b8',sh:.6},{p:C(pc[0],pc[1],3.4),f:'gold'}],lw:1},
    momArmL:{tf:[place],items:[OH(40,392,58,370,20,15),L('M100 302 C80 340 58 370 40 392',28,'dress')]}
  };
  return {
    id:'d', title:'2–3 tuổi · Bé chạy cạnh mẹ', tag:'new',
    desc:'Bé cười híp mắt chạy trước, tay giơ chong chóng giấy đang quay, tay kia với lại phía mẹ. Mẹ đưa tay đón theo. Chân bé chạy, người nhún nhanh.',
    parts, order:['backHair','torso','head','momArmR','ground','legBack','kidArmBack','kidBody','legFront','kidHead','kidArmFront','pinwheel','momArmL'],
    rock:[.8,250,440,5], breath:true, kid:true, kidTf:{x:-8,y:-4,s:1.15,px:100,py:428},
    motion(t){
      const ph=TAU*t/.9;                       // running stride
      const bob=-4*Math.abs(Math.sin(ph));
      const lean=c=>{ c.translate(0,bob); rotAbout(c,-4*D2R,100,428); };
      const s=Math.sin(ph);
      const headA=(-1.5+2*Math.sin(TAU*(t-.4)/5))*D2R;
      const hp=tfPoint(place,215,224);
      const armRock=(-4+5*Math.sin(t*1.7))*D2R;
      return {
        head:c=>rotAbout(c,headA,hp[0],hp[1]),
        momArmL:c=>{ const sp=tfPoint(place,100,302); rotAbout(c,armRock,sp[0],sp[1]); },
        legFront:c=>{ lean(c); rotAbout(c,(16*s)*D2R,84,372); },
        legBack:c=>{ lean(c); rotAbout(c,(-16*s)*D2R,108,366); },
        kidBody:lean,
        kidHead:c=>{ lean(c); rotAbout(c,(3*Math.sin(ph*.5))*D2R,kx,ky+kr); },
        kidArmBack:c=>{ lean(c); rotAbout(c,(12*s)*D2R,114,316); },
        kidArmFront:c=>{ lean(c); rotAbout(c,(-5*s)*D2R,80,314); },
        pinwheel:c=>{ lean(c); rotAbout(c,(-5*s)*D2R,80,314); rotAbout(c,t*5,pc[0],pc[1]); },
      };
    }
  };
})());

// ---- 3–5 years: mom and child sit and read a book ----
POSES.push((() => {
  const place={x:8,y:-6,s:.9,px:215,py:60};
  const m=momParts(place,-6);
  const kx=208, ky=296, kr=34;
  const head=kidHead(kx,ky,kr,{eyes:'open',gaze:[0,3],mouth:'o',bob:true});
  const lines=[];
  for(let i=0;i<4;i++){ const y=388+i*7; lines.push(P(`M${142+i*.6} ${y-1-i*.4} Q${170} ${y-4} ${198} ${y+2}`)); }
  const spineX=208;
  const pageL=P(`M${spineX} 374 C184 362 154 362 128 370 L120 422 C150 414 182 414 ${spineX} 426 Z`);
  const pageR=P(`M${spineX} 374 C232 362 262 362 288 370 L296 422 C266 414 234 414 ${spineX} 426 Z`);
  const turnPage=P(`M${spineX} 374 C232 362 262 362 288 370 L296 422 C266 414 234 414 ${spineX} 426 Z`);
  const sun=C(256,392,9);
  const rays=[]; for(let i=0;i<8;i++){ const a=i*TAU/8; rays.push(P(`M${256+Math.cos(a)*13} ${392+Math.sin(a)*13} L${256+Math.cos(a)*18} ${392+Math.sin(a)*18}`)); }
  const parts = {
    ...m,
    kidHair:{items:[head.items[0]],strandCol:'#f3d99a'},
    kidBody:{items:[
      {p:P('M166 330 C144 344 136 380 134 560 L284 560 C282 380 274 344 252 330 C232 320 186 320 166 330 Z'),f:'mint'},
      {p:P('M184 328 C196 342 222 342 234 328 C222 320 196 320 184 328 Z'),f:'mint2'}]},
    kidHead:{items:head.items.slice(1),lines:head.lines,strands:head.strands,strandCol:'#f3d99a',lw:2.3,ink:'#4a2e2a'},
    momArms:{items:[OH(112,402,92,372),OH(306,402,348,372),L('M122 300 C98 334 92 372 112 402',28,'dress'),L('M318 300 C342 334 348 372 306 402',28,'dress')]},
    book:{items:[
      {p:P(`M${spineX} 380 C180 366 146 366 116 374 L110 430 C146 422 180 422 ${spineX} 434 C236 422 270 422 306 430 L300 374 C270 366 236 366 ${spineX} 380 Z`),f:'cover'},
      {p:pageL,f:'page',sh:.5},{p:pageR,f:'page',sh:.5},
      {p:sun,f:'gold',sh:.4},
      {p:P('M150 404 C150 396 160 394 166 400 C172 394 182 396 182 404 C182 412 170 416 166 420 C162 416 150 412 150 404 Z'),f:'#f4a9b6',sh:.4}],
      faint:[...rays,P(`M${spineX} 376 L${spineX} 426`),P('M232 410 Q248 406 280 410'),P('M232 416 Q250 412 284 416')]},
    turn:{items:[{p:turnPage,f:'page',sh:.6}],faint:[P('M228 392 Q250 388 280 392'),P('M228 400 Q252 396 282 400'),P('M228 408 Q252 404 282 408')]},
    kidHands:{items:[L('M176 340 C164 356 158 372 160 392',14,'mint'),{p:E(162,398,10,8,10),f:'skin'},
                     L('M242 340 C252 356 254 372 250 388',14,'mint'),{p:E(248,394,9,8,0),f:'skin'},{p:E(246,384,3.4,7,-10),f:'skin'}]}
  };
  return {
    id:'e', title:'3–5 tuổi · Mẹ và bé ngồi đọc sách', tag:'new',
    desc:'Bé tóc bob mở mắt nhìn sách, ngồi trong lòng mẹ, áo len bạc hà. Mẹ vòng tay giữ sách, cả hai nhìn xuống trang. Bé chỉ vào hình mặt trời, miệng đọc theo, thỉnh thoảng lật một trang.',
    parts, order:['backHair','torso','head','kidHair','kidBody','kidHead','book','turn','momArms','kidHands'],
    rock:[.6,215,440,6], breath:true,
    motion(t){
      const headA=(-1+1.5*Math.sin(TAU*(t-.4)/6))*D2R;
      const hp=tfPoint(place,215,224);
      const cyc=t%7, k=Math.min(1,Math.max(0,(cyc-5.2)/1.2));     // page turns once every 7 s
      const sx=Math.cos(Math.PI*(k<1?(k*k*(3-2*k)):1));
      const tap=Math.max(0,Math.sin(TAU*t/1.6))**3*2.5;
      const nod=(2*Math.sin(TAU*t/2.2))*D2R;
      return {
        head:c=>rotAbout(c,headA,hp[0],hp[1]),
        kidHead:c=>rotAbout(c,nod,kx,ky+kr), kidHair:c=>rotAbout(c,nod,kx,ky+kr),
        turn:c=>{ if(cyc<5.2||k>=1) return false; c.translate(spineX,400); c.scale(sx,1-.06*Math.sin(Math.PI*k)); c.translate(-spineX,-400); },
        kidHands:c=>c.translate(0,-tap*.4)
      };
    }
  };
})());


// =====================================================================
// HERO RUNTIME: full-bleed lightbox, age slider, paper slide transitions, music box
// =====================================================================
POSES[0].momNames=['armLow','arms','mhand'];
// where each child "grows" from (sprite coords), and how much it grows across its age band
const GROW=[{p:[126,330],a:.05},{p:[128,398],a:.06},{p:[100,428],a:.12},{p:[100,428],a:.1},{p:[208,430],a:.06}];
const GROUPS=[{lo:0,hi:6,name:'0–6 months'},{lo:6,hi:12,name:'6–12 months'},{lo:12,hi:24,name:'1–2 years'},{lo:24,hi:36,name:'2–3 years'},{lo:36,hi:60,name:'3–5 years'}];
const TICKS=[[0,'0m'],[6,'6m'],[12,'1y'],[24,'2y'],[36,'3y'],[60,'5y']];
// low-density screens (most PCs) render at 2x and downscale, so lines and paper grain look as fine as on a phone
const DEV=window.devicePixelRatio||1, SS=Math.max(2,DEV);

const hero=document.querySelector('.hero'); if(!hero||!window.gsap) return;
const cv=hero.querySelector('canvas.scene'), g2=cv.getContext('2d');
let LW=400, LH=480, K=1, RES=1, FX=0, FY=40, portrait=false;
let layers=null, sprites=[], spriteRes=0;

// ---------- sprites (built once per resolution, trimmed to their content) ----------
function trim(c){
  const w=c.width,h=c.height, d=c.getContext('2d').getImageData(0,0,w,h).data;
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y+=2){ const row=y*w*4; for(let x=0;x<w;x+=2){ if(d[row+x*4+3]>3){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } } }
  if(x1<0) return null;
  x0=Math.max(0,x0-4); y0=Math.max(0,y0-4); x1=Math.min(w,x1+5); y1=Math.min(h,y1+5);
  const o=document.createElement('canvas'); o.width=x1-x0; o.height=y1-y0; o.getContext('2d').drawImage(c,-x0,-y0);
  return {img:o,x:x0/DPR,y:y0/DPR,w:o.width/DPR,h:o.height/DPR};
}
function buildPose(i){
  if(sprites[i]) return sprites[i];
  const pose=POSES[i], spr={};
  pose.order.forEach(n=>{ spr[n]=trim(LB.part(pose.parts[n])); });
  return sprites[i]=spr;
}
function queueSprites(){
  const order=[cur, cur+1, cur-1, 0,1,2,3,4].filter((v,i,a)=>v>=0&&v<5&&a.indexOf(v)===i);
  const step=()=>{ const n=order.find(i=>!sprites[i]); if(n===undefined) return; buildPose(n); (window.requestIdleCallback||setTimeout)(step,{timeout:300}); };
  step();
}

// ---------- background built for the current hero size ----------
function mkL(w,h){ const c=document.createElement('canvas'); c.width=Math.ceil(w*RES); c.height=Math.ceil(h*RES); const x=c.getContext('2d'); x.setTransform(RES,0,0,RES,0,0); return [c,x]; }
function hillY(x){ return FY+(portrait?300:322)+12*Math.sin(x/68+.6)+9*Math.sin(x/31+2.1); }
function buildLayers(){
  const L={};
  { const [c,x]=mkL(LW,LH); const g=x.createLinearGradient(0,0,0,LH); g.addColorStop(0,'#fff3df'); g.addColorStop(.55,'#ffe3d0'); g.addColorStop(1,'#fdd3c6'); x.fillStyle=g; x.fillRect(0,0,LW,LH); grainAtop(x,.05,'multiply'); L.bg=c; }
  { const [c,x]=mkL(LW,LH); const cx=FX+205, cy=FY+190;
    const g=x.createRadialGradient(cx,cy,0,cx,cy,300); g.addColorStop(0,'rgba(255,252,235,1)'); g.addColorStop(.22,'rgba(255,240,200,.9)'); g.addColorStop(.6,'rgba(255,220,180,.35)'); g.addColorStop(1,'rgba(255,210,180,0)');
    x.fillStyle=g; x.fillRect(0,0,LW,LH); x.fillStyle='#fff4cf'; x.beginPath(); x.arc(cx,cy,64,0,TAU); x.fill(); L.glow=c; }
  { const [c,x]=mkL(LW+60,LH); x.translate(30,0); const r=mulberry(5), p=new Path2D(), y=FY+258;
    p.rect(-30,y,LW+60,LH-y+10); for(let X=-30;X<=LW+30;X+=38){ p.moveTo(X+40,y); p.arc(X,y,22+r()*16,0,TAU); }
    LB.sheet(x,p,'#f6d5df',.8,false); grainAtop(x,.08); L.clouds=c; }
  { const [c,x]=mkL(LW+60,LH); x.translate(30,0); const r=mulberry(9), p=new Path2D();
    p.moveTo(-30,hillY(-30)); for(let X=-22;X<=LW+30;X+=8) p.lineTo(X,hillY(X)); p.lineTo(LW+30,LH+10); p.lineTo(-30,LH+10); p.closePath();
    const n=Math.max(4,Math.round(LW/110));
    for(let i=0;i<n;i++){ const X=(i+.2+r()*.6)*LW/n, y=hillY(X)-18-r()*8, rr=11+r()*5; if(X>FX+60&&X<FX+340) continue;
      p.moveTo(X+rr,y); p.arc(X,y,rr,0,TAU); p.moveTo(X+rr*1.6+rr*.8,y+6); p.arc(X+rr*1.6,y+6,rr*.8,0,TAU); p.rect(X-1.5,y,3,26); }
    LB.sheet(x,p,'#fbc3a6',.9,false); grainAtop(x,.08); L.hills=c; }
  { const [c,x]=mkL(LW,LH), b=14;
    x.save(); x.beginPath(); x.rect(b,b,LW-2*b,LH-2*b); x.clip(); x.shadowColor='rgba(90,45,25,.42)'; x.shadowBlur=22*RES; x.strokeStyle='#000'; x.lineWidth=40; x.strokeRect(b-20,b-20,LW-2*b+40,LH-2*b+40); x.restore();
    const g=x.createLinearGradient(0,0,LW,LH); g.addColorStop(0,'#f1d6ae'); g.addColorStop(1,'#dcb486');
    const f=new Path2D(); f.rect(0,0,LW,LH); f.rect(b,b,LW-2*b,LH-2*b); x.fillStyle=g; x.fill(f,'evenodd');
    x.strokeStyle='rgba(255,248,230,.6)'; x.lineWidth=1; x.strokeRect(b-.5,b-.5,LW-2*b+1,LH-2*b+1);
    x.save(); x.globalAlpha=.25; x.strokeStyle='#b88a5a'; x.lineWidth=.6; const r=mulberry(4);
    for(let i=0;i<LH/9;i++){ const y=r()*LH; x.beginPath(); x.moveTo(0,y); x.lineTo(b,y+r()*4); x.moveTo(LW-b,y); x.lineTo(LW,y+r()*4); x.stroke(); }
    for(let i=0;i<LW/9;i++){ const X=r()*LW; x.beginPath(); x.moveTo(X,0); x.lineTo(X+r()*4,b); x.moveTo(X,LH-b); x.lineTo(X+r()*4,LH); x.stroke(); }
    x.restore();
    const v=x.createRadialGradient(LW/2,LH/2,Math.min(LW,LH)*.35,LW/2,LH/2,Math.max(LW,LH)*.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(90,40,30,.16)');
    x.fillStyle=v; x.fillRect(b,b,LW-2*b,LH-2*b); L.frame=c; }
  { const [c,x]=mkL(LW,LH); const top=LH-(portrait?150:130); const g=x.createLinearGradient(0,top,0,LH);
    g.addColorStop(0,'rgba(255,246,236,0)'); g.addColorStop(.55,'rgba(255,246,236,.55)'); g.addColorStop(1,'rgba(255,248,240,.82)'); x.fillStyle=g; x.fillRect(0,top,LW,LH-top); L.fog=c; }
  // hanging mobile spread across the width
  const star=new Path2D(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?7:16; i?star.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):star.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } star.closePath();
  const moon=P('M0 -16 A16 16 0 1 0 0 16 A11 16 0 0 1 0 -16 Z'); const heart=new Path2D(); heart.addPath(HEART,new DOMMatrix().scale(1.8));
  const small=new Path2D(); small.addPath(star,new DOMMatrix().scale(.7));
  // on phones the title sits at the top, so the mobile hangs only on the right, clear of the words
  const M=portrait?[{f:.8,len:150,p:small,ph:2.4,amp:6},{f:.91,len:96,p:moon,ph:.9,amp:8}]
    :[{f:.06,len:96,p:star,ph:0,amp:9},{f:.15,len:58,p:heart,ph:1.7,amp:7},{f:.91,len:82,p:moon,ph:.9,amp:8}];
  if(!portrait&&LW>640) M.push({f:.38,len:44,p:small,ph:2.4,amp:6},{f:.72,len:40,p:heart,ph:3.1,amp:6});
  L.mob=M.map(m=>({...m,x:m.f*LW}));
  { const [c,x]=[document.createElement('canvas')]; c.width=c.height=48; const xx=c.getContext('2d'); const g=xx.createRadialGradient(24,24,0,24,24,24); g.addColorStop(0,'rgba(255,250,220,1)'); g.addColorStop(.35,'rgba(255,225,150,.75)'); g.addColorStop(1,'rgba(255,210,140,0)'); xx.fillStyle=g; xx.fillRect(0,0,48,48); L.mote=c; }
  layers=L;
}

function layout(){
  const r=hero.getBoundingClientRect(), cw=r.width, ch=r.height;
  portrait = cw/ch<=1.1 || cw<=760;
  if(portrait){ LW=380; K=cw/LW; LH=ch/K; FX=(LW-400)/2;
    const cb=(hero.querySelector('.hero-cta').getBoundingClientRect().bottom-r.top)/K;
    FY=Math.min(LH-440-60,Math.max(cb-28,LH-440-170)); }
  else { LH=520; K=ch/LH; LW=cw/K; FY=LH-440-40; FX=Math.min(LW-410,Math.max(LW*.5,LW*.7-200)); }
  RES=Math.min(3.2,K*SS);
  cv.width=Math.round(cw*DEV); cv.height=Math.round(ch*DEV);
  const sr=Math.min(3.2,Math.max(1,K*SS));
  if(Math.abs(sr-spriteRes)/Math.max(spriteRes,.01)>.18){ spriteRes=sr; DPR=sr; sprites=[]; buildPose(cur); queueSprites(); }
  buildLayers(); sizeSpark();
}

// ---------- scene state ----------
const SAVED_START=[1,6,12,24,36];
let months=1, cur=0, touched=false, dragging=false;
try{ const sv=localStorage.getItem('mami-age'), ix=['0-6m','6-12m','1-2y','2-3y','3-5y'].indexOf(sv); if(ix>0){ months=SAVED_START[ix]; cur=ix; } }catch(e){}
const tr={from:-1,p:1};                 // paper slide between poses
const fx={shake:0};
const motes=[];
function growthFor(i){ const G=GROUPS[i], m=Math.min(G.hi,Math.max(G.lo,months)); const f=(m-G.lo)/(G.hi-G.lo); return 1-GROW[i].a/2+GROW[i].a*f; }

function drawPose(ctx,i,t,yOff,rot){
  const pose=POSES[i], spr=sprites[i]; if(!spr) return false;
  const mo=pose.motion(t), [ra,rx,ry,rp]=pose.rock, rock=ra*D2R*Math.sin(TAU*t/rp);
  const breath=1+.006*(1+Math.sin(TAU*t/2.8));
  const momSet=new Set(['backHair','torso','head','momArmR',...(pose.momNames||[])]);
  const gs=i===cur?growthFor(i):1, gp=GROW[i].p;
  pose.order.forEach(n=>{ const s=spr[n]; if(!s) return;
    ctx.save(); ctx.translate(0,yOff); if(rot) rotAbout(ctx,rot,200,440);
    const isMom=momSet.has(n)||n.startsWith('mom');
    if(!pose.kid||isMom) rotAbout(ctx,rock,rx,ry);
    if(pose.kidTf&&!isMom) applyTf(ctx,pose.kidTf);
    if(!isMom&&gs!==1){ ctx.translate(gp[0],gp[1]); ctx.scale(gs,gs); ctx.translate(-gp[0],-gp[1]); }
    if(n==='torso'){ ctx.translate(0,440); ctx.scale(1,breath); ctx.translate(0,-440); }
    if(mo[n]&&mo[n](ctx)===false){ ctx.restore(); return; }
    ctx.drawImage(s.img,s.x,s.y,s.w,s.h); ctx.restore(); });
  return true;
}
const easeIn=x=>x*x*x, easeOutBack=x=>{ const c1=1.5,c3=c1+1; return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2); };

function render(t,dt){
  if(!layers) return;
  const ctx=g2; ctx.imageSmoothingEnabled=true; ctx.setTransform(DEV*K,0,0,DEV*K,0,0); ctx.clearRect(0,0,LW,LH);
  ctx.drawImage(layers.bg,0,0,LW,LH);
  ctx.save(); ctx.globalAlpha=.94+.06*Math.sin(7.3*t*.3)*Math.sin(3.1*t*.3); ctx.drawImage(layers.glow,0,0,LW,LH); ctx.restore();
  ctx.drawImage(layers.clouds,-30+Math.sin(t*.35)*3,0,LW+60,LH);
  const sk=1+fx.shake*3.2;
  layers.mob.forEach(m=>{ ctx.save(); rotAbout(ctx,Math.sin(t*(1.1+fx.shake*1.6)+m.ph)*m.amp*sk*D2R,m.x,14);
    ctx.strokeStyle='rgba(140,90,70,.55)'; ctx.lineWidth=.8; ctx.beginPath(); ctx.moveTo(m.x,14); ctx.lineTo(m.x,m.len); ctx.stroke();
    ctx.translate(m.x,14+m.len); ctx.shadowColor='rgba(120,60,50,.3)'; ctx.shadowBlur=6*K*DEV; ctx.shadowOffsetX=2*K*DEV; ctx.shadowOffsetY=4*K*DEV; ctx.fillStyle='#f8cf74'; ctx.fill(m.p);
    ctx.shadowColor='transparent'; ctx.save(); ctx.clip(m.p); ctx.translate(1,1.5); ctx.strokeStyle='rgba(255,250,225,.7)'; ctx.lineWidth=2; ctx.stroke(m.p); ctx.restore(); ctx.restore(); });
  ctx.drawImage(layers.hills,-30+Math.sin(t*.35+1)*5,0,LW+60,LH);

  ctx.save(); ctx.translate(FX,FY);
  if(tr.p<1 && tr.from>=0){
    const a=Math.min(1,tr.p/.55), b=Math.max(0,(tr.p-.3)/.7);
    drawPose(ctx,tr.from,t,easeIn(a)*540,easeIn(a)*4*D2R);
    if(b>0) drawPose(ctx,cur,t,(1-easeOutBack(b))*540,(1-b)*-3*D2R);
  } else if(!drawPose(ctx,cur,t,0,0)){ buildPose(cur); }
  ctx.restore();

  if(!reduce){ if(Math.random()<dt/.5) motes.push({x:20+Math.random()*(LW-40),y:LH*.55+Math.random()*LH*.4,v:10+Math.random()*14,ph:Math.random()*6,s:8+Math.random()*14,age:0,life:6+Math.random()*3}); }
  for(let i=motes.length-1;i>=0;i--){ const p=motes[i]; p.age+=dt; if(p.age>p.life){ motes.splice(i,1); continue; } const k=p.age/p.life;
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=Math.sin(Math.PI*k)*.8; ctx.drawImage(layers.mote,p.x+Math.sin(p.age*.8+p.ph)*8-p.s/2,p.y-p.v*p.age-p.s/2,p.s,p.s); ctx.restore(); }
  ctx.drawImage(layers.fog,0,0,LW,LH);
  ctx.drawImage(layers.frame,0,0,LW,LH);
}

function setPose(i){
  if(i===cur) return;
  if(reduce){ cur=i; buildPose(i); return; }
  const shown = tr.p<1 && tr.from>=0 && tr.p<.45 ? tr.from : cur;
  buildPose(i);
  tr.from=shown; cur=i; tr.p=0;
  gsap.killTweensOf(tr); gsap.to(tr,{p:1,duration:1.05,ease:'none'});
  gsap.killTweensOf(fx); fx.shake=osReduce?0:1; gsap.to(fx,{shake:0,duration:1.6,ease:'power2.out'});
}

// ---------- mum view: mum holds the newborn, the slider is hidden ----------
let mumMode=false;
function setMum(on){ if(on===mumMode) return; mumMode=on; hero.classList.toggle('mum',on); setPose(on?0:groupOf(Math.round(months))); }

// ---------- age slider ----------
const slider=hero.querySelector('.slider'), knob=slider.querySelector('.knob'), fill=slider.querySelector('.fill'), bubble=slider.querySelector('.bubble'),
      ticksEl=slider.querySelector('.ticks'), hint=hero.querySelector('.hint'), ctaAge=hero.querySelector('.hero-cta-age');
const SEG=[0,.2,.4,.6,.8,1], MB=[0,6,12,24,36,60];
const m2p=m=>{ for(let i=0;i<5;i++) if(m<=MB[i+1]) return SEG[i]+(m-MB[i])/(MB[i+1]-MB[i])*.2; return 1; };
const p2m=p=>{ for(let i=0;i<5;i++) if(p<=SEG[i+1]) return MB[i]+(p-SEG[i])/.2*(MB[i+1]-MB[i]); return 60; };
const groupOf=m=>m<6?0:m<12?1:m<24?2:m<36?3:4;
function ageText(m){ m=Math.round(m); if(m<12) return m+(m===1?' month':' months'); const y=Math.floor(m/12), r=m%12; return y+(y>1?' years':' year')+(r?' '+r+(r===1?' month':' months'):''); }
TICKS.forEach(([m,l])=>{ const d=document.createElement('span'); d.className='tick'; d.textContent=l; d.style.left=(m2p(m)*100)+'%'; d.dataset.m=m; ticksEl.appendChild(d); });
const tickEls=[...ticksEl.children];

function paint(){
  const p=m2p(months); knob.style.left=(p*100)+'%'; fill.style.width=(p*100)+'%';
  const txt=ageText(months); bubble.textContent=txt;
  const sw=slider.clientWidth, bw=bubble.offsetWidth, kx=p*sw; const dx=Math.max(bw/2-kx-4,Math.min(0,sw-kx-bw/2+4)); bubble.style.setProperty('--dx',dx+'px');
  slider.setAttribute('aria-valuenow',Math.round(months)); slider.setAttribute('aria-valuetext',txt);
  const g=groupOf(Math.round(months)); ctaAge.textContent=GROUPS[g].name;
  tickEls.forEach(e=>e.classList.toggle('on',+e.dataset.m<=months));
}
function setMonths(m,fromUser){
  m=Math.max(1,Math.min(60,m)); const before=groupOf(Math.round(months)); months=m; const after=groupOf(Math.round(months));
  paint();
  if(after!==before && !mumMode){ setPose(after); if(fromUser){ burst(); sound.ting(after); } sound.setGroup(after); }
}
function valueFromX(x){ const r=slider.getBoundingClientRect(); return p2m(Math.max(0,Math.min(1,(x-r.left)/r.width))); }
let userOff=false;
function musicOn(){ if(userOff||sound.on) return; sound.setGroup(cur); sound.start(); sbtn.setAttribute('aria-pressed','true'); }
function firstTouch(){ if(touched) return; touched=true; slider.classList.remove('idle'); hint.classList.remove('show'); introTl&&introTl.kill(); }
slider.addEventListener('pointerdown',e=>{ e.preventDefault(); firstTouch(); sound.unlock(); musicOn(); dragging=true; slider.classList.add('dragging'); slider.setPointerCapture(e.pointerId); setMonths(valueFromX(e.clientX),true); });
slider.addEventListener('pointermove',e=>{ if(!dragging) return; const before=months; setMonths(valueFromX(e.clientX),true); if(Math.abs(months-before)>.05) trail(); });
const endDrag=()=>{ if(!dragging) return; dragging=false; slider.classList.remove('dragging'); months=Math.round(months); paint(); applyFilter(); };
slider.addEventListener('pointerup',endDrag); slider.addEventListener('pointercancel',endDrag); slider.addEventListener('lostpointercapture',endDrag);
slider.addEventListener('keydown',e=>{
  const step={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1,PageUp:6,PageDown:-6}[e.key];
  let m=null; if(step) m=Math.round(months)+step; if(e.key==='Home') m=1; if(e.key==='End') m=60;
  if(m===null) return; e.preventDefault(); firstTouch(); sound.unlock(); musicOn(); setMonths(m,true); trail(); applyFilter();
});

// ---------- tell the page which age group to show ----------
let filtered=-1;
function applyFilter(){ const g=groupOf(Math.round(months)); if(g===filtered) return; filtered=g; document.dispatchEvent(new CustomEvent('mami:age',{detail:{group:g}})); }

// ---------- sparkles around the slider ----------
const spark=hero.querySelector('.spark'), sctx=spark.getContext('2d'); let SW=0,SH=0; const sp=[];
function sizeSpark(){ const r=spark.getBoundingClientRect(); SW=r.width; SH=r.height; spark.width=Math.round(SW*DEV); spark.height=Math.round(SH*DEV); }
function knobXY(){ const a=spark.getBoundingClientRect(), b=knob.getBoundingClientRect(); return [b.left+b.width/2-a.left,b.top+b.height/2-a.top]; }
function addSpark(x,y,vx,vy,life,size,g){ if(!reduce) sp.push({x,y,vx,vy,life,age:0,size,g:g||0}); }
function trail(){ const [x,y]=knobXY(); for(let i=0;i<2;i++) addSpark(x+(Math.random()-.5)*14,y+(Math.random()-.5)*10,(Math.random()-.5)*20,10+Math.random()*30,.9+Math.random()*.5,2+Math.random()*3,60); }
function burst(){ const [x,y]=knobXY(); for(let i=0;i<26;i++){ const a=Math.random()*TAU, v=40+Math.random()*120; addSpark(x,y,Math.cos(a)*v,Math.sin(a)*v-30,.7+Math.random()*.6,2.5+Math.random()*3.5,120); } }
function idleSparks(){ const [x,y]=knobXY(); for(let i=0;i<7;i++){ const a=Math.random()*TAU, v=15+Math.random()*35; addSpark(x,y,Math.cos(a)*v,Math.sin(a)*v-10,.8+Math.random()*.6,1.5+Math.random()*2.5,20); } }
function drawSparks(dt){
  sctx.setTransform(DEV,0,0,DEV,0,0); sctx.clearRect(0,0,SW,SH);
  for(let i=sp.length-1;i>=0;i--){ const p=sp[i]; p.age+=dt; if(p.age>p.life){ sp.splice(i,1); continue; }
    p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.98; const k=p.age/p.life, a=Math.sin(Math.PI*Math.min(1,k*1.4))*(1-k*.3), s=p.size*(1-k*.4);
    sctx.save(); sctx.globalCompositeOperation='lighter'; sctx.translate(p.x,p.y); sctx.rotate(p.age*2);
    sctx.fillStyle=`rgba(255,226,140,${a})`; sctx.beginPath(); sctx.moveTo(0,-s*2.2); sctx.quadraticCurveTo(s*.3,-s*.3,s*2.2,0); sctx.quadraticCurveTo(s*.3,s*.3,0,s*2.2); sctx.quadraticCurveTo(-s*.3,s*.3,-s*2.2,0); sctx.quadraticCurveTo(-s*.3,-s*.3,0,-s*2.2); sctx.fill();
    sctx.fillStyle=`rgba(255,255,240,${a})`; sctx.beginPath(); sctx.arc(0,0,s*.55,0,TAU); sctx.fill(); sctx.restore(); }
}

// ---------- music box (made in code, no audio file) ----------
const sound=(()=>{
  let ac=null, out=null, on=false, muted=false, timer=null, step=0, nextT=0, group=0;
  const BPM=[66,76,88,100,112];
  const MEL=[76,null,79,null,81,79, 76,null,74,null,72,null, 74,76,79,null,76,74, 72,null,null,null,null,null,
             79,null,81,null,84,81, 79,null,76,null,74,null, 76,79,81,null,79,76, 74,null,72,null,null,null];
  const BASS=[[60,67],[57,64],[62,67],[60,67],[65,69],[60,64],[57,64],[55,62]];
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function unlock(){
    if(!ac){ const A=window.AudioContext||window.webkitAudioContext; if(!A) return; ac=new A();
      out=ac.createGain(); out.gain.value=.5;
      const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=5200;
      const dl=ac.createDelay(); dl.delayTime.value=.27; const fb=ac.createGain(); fb.gain.value=.28; const wet=ac.createGain(); wet.gain.value=.22;
      out.connect(lp); lp.connect(ac.destination); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(ac.destination); }
    if(ac.state==='suspended') ac.resume();
  }
  function tine(m,t,vel,len){
    const f=hz(m), g=ac.createGain(); g.connect(out);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vel,t+.004); g.gain.exponentialRampToValueAtTime(.0001,t+len);
    [[1,1,'sine'],[2,.22,'sine'],[4.2,.07,'sine']].forEach(([mul,amp,type],j)=>{ const o=ac.createOscillator(), og=ac.createGain(); o.type=type; o.frequency.value=f*mul; og.gain.value=amp;
      if(j===2){ og.gain.setValueAtTime(amp,t); og.gain.exponentialRampToValueAtTime(.0001,t+.25); }
      o.connect(og); og.connect(g); o.start(t); o.stop(t+len+.05); });
  }
  function tick(){
    const eighth=60/BPM[group]/2;
    while(nextT<ac.currentTime+.15){
      const i=step%MEL.length, bar=Math.floor(i/6)%8, pos=i%6, n=MEL[i];
      if(n) tine(n,nextT,.16,1.7);
      if(pos===0) tine(BASS[bar][0],nextT,.09,2);
      if(pos===2||pos===4) tine(BASS[bar][1],nextT,.05,1.4);
      if(!n && group>=2 && pos%2===1) tine(BASS[bar][1]+12,nextT,.045,.9);
      step++; nextT+=eighth*(group>=3&&step%2?0.94:1);
    }
  }
  return {
    unlock,
    get on(){ return on; },
    start(){ unlock(); if(!ac) return; on=true; muted=false; nextT=ac.currentTime+.08; step=0; clearInterval(timer); timer=setInterval(tick,40); tick(); },
    stop(){ on=false; muted=true; clearInterval(timer); },
    setGroup(g){ group=g; },
    ting(g){ if(muted||!ac) return; const t=ac.currentTime+.01; tine(96,t,.12,1.1); tine(103,t+.07,.08,.9); }
  };
})();
const sbtn=hero.querySelector('.sound');
sbtn.addEventListener('click',()=>{ if(sound.on){ userOff=true; sound.stop(); sbtn.setAttribute('aria-pressed','false'); } else { userOff=false; sound.setGroup(cur); sound.start(); sbtn.setAttribute('aria-pressed','true'); } });

// ---------- intro hint: the star slides a little, then glints every 3 s until someone drags it ----------
let introTl=null;
function intro(){
  if(reduce){ hint.classList.add('show'); return; }
  const m0=months, o={m:m0}, top=Math.min(GROUPS[cur].hi-.6,m0+(cur<2?3.4:cur<4?7:14));
  introTl=gsap.timeline({delay:1.2})
    .call(()=>hint.classList.add('show'))
    .to(o,{m:top,duration:1.1,ease:'sine.inOut',onUpdate:()=>{ months=o.m; paint(); trail(); }})
    .to(o,{m:m0,duration:1,ease:'sine.inOut',onUpdate:()=>{ months=o.m; paint(); }});
}
let idleAcc=0;

// ---------- loop ----------
let t=0, visible=true;
new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting)).observe(hero);
const T0=parseFloat(new URLSearchParams(location.search).get('t'));
gsap.ticker.lagSmoothing(500,33);
gsap.ticker.add((time,deltaMs)=>{
  if(!visible) return;
  // gentle breathing/rocking always runs (slower when the OS asks for reduced motion); only big effects are skipped
  const dt=Math.min(.05,deltaMs/1000); if(isNaN(T0)) t+=reduce?dt*.6:dt; else t=T0;
  render(t,reduce?0:dt);
  if(!touched&&!reduce){ idleAcc+=dt; if(idleAcc>3){ idleAcc=0; idleSparks(); } }
  drawSparks(dt);
});
let rz=null; addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(layout,150); });
filtered=groupOf(Math.round(months)); layout(); paint(); intro();
// the age chips further down call this so the scene follows them
window.MamiHero={
  setGroup(g){ if(groupOf(Math.round(months))===g) return; firstTouch(); const o={m:months};
    gsap.to(o,{m:SAVED_START[g],duration:reduce?0:.6,ease:'power2.inOut',onUpdate:()=>{ setMonths(o.m,false); },onComplete:()=>{ months=SAVED_START[g]; paint(); filtered=g; }}); },
  setMonths:(m)=>setMonths(m,true),
  setMum,
  get state(){ return {months,cur,LW,LH,FX,FY,K}; }
};
})();
