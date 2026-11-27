(() => {
  const hero = document.querySelector('.keys');
  if (!hero) return;
  const stage = hero.querySelector('.keys__instrument');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const buttons = Array.from(stage.querySelectorAll('button'));
  const heading = hero.querySelector('h1');
  const details = hero.querySelector('.keys__details');
  const link = details.querySelector('a');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const projects = [
    ['Service','UX','일리 정기구독','옵션을 바꿔도 방금 고른 원두는 그대로.','정기구독 사례 보기','#impact-tab-illy'],
    ['Trade','Watch','하나은행 Trade Watch','12,000개 이상의 품목 코드를 요약·결과·상세로 나눴습니다.','정보 설계 사례 보기','#impact-tab-hana'],
    ['Brand','Routine','일리 × 일리윤','아침·오후·밤의 루틴을 따라 두 브랜드의 제품을 만납니다.','캠페인 열기','https://www.illycaffe.co.kr/illy_illiyoon/index.php']
  ];
  // Coordinates are measured on the key bed. Each profile is a stack of rounded rings.
  const caps = [
    {x:46,y:101,w:172,h:68,label:'service UX',color:[242,241,234]},
    {x:139,y:28,w:167,h:67,label:'trade watch',color:[238,239,234]},
    {x:226,y:102,w:161,h:67,label:'brand',color:[171,185,232]},
    {x:315,y:28,w:72,h:67,label:'→',color:[53,54,64]},
    {x:46,y:178,w:341,h:64,label:'open case',color:[60,78,239]}
  ];
  let selected=0, strike=-1, start=0, tilt=0, targetTilt=0, frame=0;
  let scale=1, originX=0, originY=0;
  function project(x,y,z) {
    return [originX+scale*(x*.98 + y*(.32+tilt)-240),originY+scale*(-x*.22 + y*.77-z*.94-46)];
  }
  function ring(x,y,w,h,r,z) {
    const pts=[];
    for (const [cx,cy,angle] of [[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]]) {
      for(let i=0;i<=6;i++) {
        const a=(angle+i*15)*Math.PI/180;
        pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a),z]);
      }
    }
    return pts;
  }
  function paint(points,fill) {
    ctx.beginPath();
    points.forEach(([x,y,z],i)=>{const p=project(x,y,z);if(i)ctx.lineTo(...p);else ctx.moveTo(...p)});
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  }
  function tone(rgb,light) {return 'rgb('+rgb.map(c=>Math.max(0,Math.min(255,Math.round(c*light)))).join(',')+')'}
  function solid(layers,rgb,top) {
    for(let l=1;l<layers.length;l++) {
      const low=layers[l-1],high=layers[l];
      for(let i=0;i<low.length;i++) {
        const j=(i+1)%low.length,dx=low[j][0]-low[i][0],dy=low[j][1]-low[i][1];
        const len=Math.hypot(dx,dy)||1;
        const side=.72+.16*dx/len-.15*dy/len+(l===layers.length-1?.12:0);
        paint([low[i],low[j],high[j],high[i]],tone(rgb,side));
      }
    }
    const grad=ctx.createLinearGradient(0,0,canvas.clientWidth,canvas.clientHeight);
    grad.addColorStop(0,tone(top,1.1));grad.addColorStop(.6,tone(top,1));grad.addColorStop(1,tone(top,.92));
    paint(layers[layers.length-1],grad);
  }
  function inscription(text,x,y,z,size,color,center=false) {
    const p=project(x,y,z);
    ctx.save();ctx.transform(.98*scale,-.22*scale,(.32+tilt)*scale,.77*scale,...p);
    ctx.fillStyle=color;ctx.textAlign=center?'center':'left';ctx.font='600 '+size+'px Arial, sans-serif';ctx.fillText(text,0,0);ctx.restore();
  }
  function draw(now) {
    frame=0;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w || !h)return;
    const ratio=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    }
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    scale=Math.min(w/535,h/340);originX=w*.49;originY=h*.48;
    tilt+= (targetTilt-tilt)*.16;
    const elapsed=now-start,depth=strike<0||elapsed>=360?0:elapsed<85?9*elapsed/85:9*Math.exp(-(elapsed-85)/72)*Math.cos((elapsed-85)/49);
    ctx.save();ctx.shadowColor='rgba(42,45,91,.34)';ctx.shadowBlur=25*scale;ctx.shadowOffsetY=18*scale;
    paint(ring(7,12,398,236,22,-17),'#999bab');ctx.restore();
    solid([ring(3,3,414,256,25,-15),ring(0,0,420,262,25,-7),ring(0,0,420,262,25,8),ring(3,3,414,256,22,12)], [158,161,167],[215,216,218]);
    paint(ring(13,13,394,234,17,12),'#85888f');
    paint(ring(16,16,388,228,15,12),'#585c68');
    // Cylindrical rotary encoder with concentric brushed-metal faces.
    const disk=(x,y,r,z)=>Array.from({length:64},(_,i)=>[x+r*Math.cos(i*Math.PI/32),y+r*Math.sin(i*Math.PI/32),z]);
    const dialZ=35-(strike===3?depth*.22:0);
    solid([disk(83,62,40,13),disk(83,62,40,dialZ),disk(83,62,37,dialZ+3)],[170,171,178],[207,209,212]);
    paint(disk(83,62,27,dialZ+3.3),'#747782');paint(disk(83,62,24,dialZ+3.6),'#c4c5ca');
    const angle=(-2.45+selected*1.17);
    const tip=project(83+18*Math.cos(angle),62+18*Math.sin(angle),dialZ+4);
    const inside=project(83+7*Math.cos(angle),62+7*Math.sin(angle),dialZ+4);
    ctx.beginPath();ctx.moveTo(...inside);ctx.lineTo(...tip);ctx.strokeStyle='#354bea';ctx.lineWidth=3*scale;ctx.lineCap='round';ctx.stroke();
    for(const i of [3,1,2,0,4]){
      const c=caps[i],z=(i===4?49:44)-(i===selected?2:0)-(i===strike?depth:0);
      const r=(inset,corner,elevation)=>ring(c.x+inset,c.y+inset,c.w-2*inset,c.h-2*inset,corner,elevation);
      solid([r(0,9,12),r(0,9,17),r(6,8,z-4),r(9,7,z)],c.color,c.color);
      inscription(c.label,c.x+c.w/2,c.y+c.h/2+5,z+.2,i===3?29:17,i>=3?'#fff':'#252630',true);
      if(i===selected)paint(ring(c.x+14,c.y+13,16,3,1.4,z+.4),'#3449e8');
      const center=project(c.x+c.w/2,c.y+c.h/2,z);
      Object.assign(buttons[i].style,{left:center[0]+'px',top:center[1]+'px',width:Math.max(44,c.w*scale*.86)+'px',height:Math.max(44,c.h*scale*.65)+'px',rotate:'-12deg',transformOrigin:'0 0'});
    }
    if(Math.abs(targetTilt-tilt)>.0002||(!reduced.matches && elapsed<360 && strike>=0))schedule();
  }
  function schedule(){if(ctx && !frame)frame=requestAnimationFrame(draw)}
  function select(index,pressed=index){
    const p=projects[index];selected=index;strike=pressed;start=performance.now()-(reduced.matches?400:0);
    const em=document.createElement('em'),dot=document.createElement('i');
    em.textContent=p[1];dot.textContent='.';heading.replaceChildren(p[0],document.createElement('br'),em,dot);
    details.querySelector('h2').textContent=p[2];details.querySelector('p').textContent=p[3];
    link.textContent=p[4];link.href=p[5];link.target=index===2?'_blank':'_self';link.rel='noopener noreferrer';
    hero.querySelector('#keys-count').textContent='0'+(index+1)+' / 03';
    buttons.slice(0,3).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    if(!reduced.matches && heading.animate)heading.animate([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:250,easing:'ease-out'});
    schedule();
  }
  function activate(i){if(i===4){strike=4;start=performance.now();schedule();link.click()}else select(i===3?(selected+1)%3:i,i)}
  buttons.forEach((button,i)=>button.addEventListener('click',()=>activate(i)));
  stage.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const n=(selected+(e.key==='ArrowRight'?1:2))%3;select(n);buttons[n].focus()});
  document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]')||hero.getBoundingClientRect().bottom<innerHeight*.4)return;if(['1','2','3'].includes(e.key))select(Number(e.key)-1)});
  link.addEventListener('click',()=>{if(link.hash){const tab=document.querySelector(link.hash);tab?.click();tab?.focus({preventScroll:true})}});
  if(!ctx)return;
  stage.classList.add('is-ready');
  stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;const rect=stage.getBoundingClientRect();targetTilt=((e.clientX-rect.left)/rect.width-.5)*.09;schedule()});
  stage.addEventListener('pointerleave',()=>{targetTilt=0;schedule()});
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect(),dial=project(83,62,38);
    if(Math.hypot(e.clientX-r.left-dial[0],e.clientY-r.top-dial[1])<40*scale)activate(3);
  });
  if(window.ResizeObserver)new ResizeObserver(schedule).observe(stage);
  else window.addEventListener('resize',schedule);
  schedule();
})();
