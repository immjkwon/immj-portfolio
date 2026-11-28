(() => {
  const hero = document.querySelector('.keys');
  if (!hero) return;
  const stage = hero.querySelector('.keys__instrument');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const buttons = Array.from(stage.querySelectorAll('button'));
  const heading = hero.querySelector('.keys__project-name');
  const details = hero.querySelector('.keys__details');
  const link = details.querySelector('a');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const projects = [
    ['Service','UX','일리 정기구독','구독 상품 상세, 옵션 선택, 주기 설정, 결제 유도 영역 전체 구독 흐름 UI 구현','정기구독 사례 보기','#impact-tab-illy'],
    ['Trade','Watch','하나은행 Trade Watch','12,000개 이상 품목 코드 및 다단 카테고리를 요약/결과/상세 3단 구조로 재구성','정보 설계 사례 보기','#impact-tab-hana'],
    ['Brand','Routine','일리 × 일리윤','커피·뷰티 이종 브랜드 간 콜라보 프로모션 랜딩 페이지 구현','캠페인 열기','https://www.illycaffe.co.kr/illy_illiyoon/index.php']
  ];
  // Orthographic studio render. Layer coordinates are in the 1040 × 754 camera frame.
  const layers = [{"key": -1, "x": 67, "y": 134, "w": 907, "h": 519, "sy": 0}, {"key": 3, "x": 637, "y": 118, "w": 170, "h": 141, "sy": 521}, {"key": 1, "x": 313, "y": 155, "w": 335, "h": 178, "sy": 664}, {"key": 2, "x": 500, "y": 216, "w": 344, "h": 182, "sy": 844}, {"key": 0, "x": 162, "y": 288, "w": 365, "h": 187, "sy": 1028}, {"key": 4, "x": 230, "y": 305, "w": 696, "h": 264, "sy": 1217}];
  const centers = [[344.25, 348.42], [480.54, 210.84], [671.96, 274.04], [722.01, 156.03], [578.02, 406.07]];
  const widths = [290,252,257,101,570];
  const dial = [205.49, 275.83];
  const atlas = new Image();
  let selected=0, strike=-1, start=0, frame=0;
  let held=-1;
  let dialFrom=-2.45, dialTo=-2.45, dialAngle=-2.45;
  function schedule() {
    if (ctx && !frame) frame=requestAnimationFrame(draw);
  }
  function draw(now) {
    frame=0;
    if (!atlas.naturalWidth) return;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if (!w || !h) return;
    const density=Math.min(devicePixelRatio || 1,2);
    if(canvas.width!==Math.round(w*density)||canvas.height!==Math.round(h*density)){
      canvas.width=Math.round(w*density);canvas.height=Math.round(h*density);
    }
    ctx.setTransform(canvas.width/1040,0,0,canvas.height/754,0,0);
    ctx.clearRect(0,0,1040,754);
    const elapsed=reduced.matches?400:Math.max(0,now-start);
    const pulse=elapsed<80?elapsed/80:Math.max(0,1-(elapsed-80)/180)**2;
    for(const part of layers){
      const pressed=part.key>=0 && (held===part.key || strike===part.key);
      const travel=pressed && !reduced.matches ? 13*(held===part.key?1:pulse) : 0;
      ctx.drawImage(atlas,0,part.sy,part.w,part.h,part.x,part.y+travel,part.w,part.h);
    }
    const t=Math.min(1,elapsed/290);
    dialAngle=dialFrom+(dialTo-dialFrom)*(1-(1-t)**3);
    const dx=30.18*Math.cos(dialAngle)-10.98*Math.sin(dialAngle);
    const dy=-6.85*Math.cos(dialAngle)-18.84*Math.sin(dialAngle);
    ctx.beginPath();ctx.moveTo(dial[0]+dx*.35,dial[1]+dy*.35);ctx.lineTo(dial[0]+dx,dial[1]+dy);
    ctx.lineCap='round';ctx.lineWidth=4.5;ctx.strokeStyle='#384cdc';ctx.stroke();
    if (!reduced.matches && strike>=0 && elapsed<300) schedule();
  }
  atlas.onload=()=>{
    if(!ctx)return;
    stage.classList.add('is-ready');
    buttons.forEach((button,i)=>{
      button.style.left=centers[i][0]/1040*100+'%';
      button.style.top=centers[i][1]/754*100+'%';
      button.style.width=widths[i]/1040*100+'%';
      button.style.height='max(44px, 11%)';
      button.style.transform='translate(-50%,-50%) rotate(-13deg)';
    });
    schedule();
  };
  atlas.src='./assets/images/project-keyboard.webp';
  function select(index,pressed=index){
    const p=projects[index];
    dialFrom=dialAngle;dialTo=-2.45+index*1.17;
    hero.dataset.project=['service','trade','brand'][index];
    selected=index;strike=pressed;start=performance.now()-(reduced.matches?400:0);
    const em=document.createElement('em'),dot=document.createElement('i');
    em.textContent=p[1];dot.textContent='.';heading.replaceChildren(p[0]+' ',em,dot);
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
  const comparison = document.querySelector('.bean-case');
  if (comparison) {
    const toggle = comparison.querySelector('[data-bean-toggle]');
    let changed = false;
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      changed = !changed;
      comparison.querySelector('[data-before]').textContent = changed ? '원두를 선택하세요' : '원두 A';
      comparison.querySelector('[data-before-note]').textContent = changed ? '다시 선택해야 진행 가능' : '원두 선택 완료';
      comparison.querySelector('[data-after-note]').textContent = changed ? '선택 유지 · 다음 단계로 진행' : '원두 선택 완료';
      toggle.textContent = changed ? '처음 상태로 보기' : '구독 옵션 바꿔보기';
    });
  }
  if(!ctx)return;
  buttons.forEach((button,i)=>{
    button.addEventListener('pointerdown',()=>{held=i;schedule()});
  });
  function release(){if(held>=0){held=-1;schedule()}}
  window.addEventListener('pointerup',release);
  window.addEventListener('pointercancel',release);
  window.addEventListener('blur',release);
  canvas.addEventListener('click',event=>{
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)*1040/rect.width;
    const y=(event.clientY-rect.top)*754/rect.height;
    if(Math.hypot((x-dial[0])/63,(y-dial[1])/48)<1)activate(3);
  });
  if(window.ResizeObserver)new ResizeObserver(schedule).observe(stage);
  else window.addEventListener('resize',schedule);
  schedule();
})();

(() => {
  const filters = document.querySelector('.folio-filters');
  if (!filters) return;
  const cards = Array.from(document.querySelectorAll('.folio-works [data-role]'));
  const options = Array.from(filters.querySelectorAll('button'));
  const count = filters.querySelector('output');
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const choice = event.target.closest('button[data-filter]');
    if (!choice) return;
    options.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = choice.dataset.filter !== 'all' && choice.dataset.filter !== card.dataset.role;
      if (!card.hidden) visible++;
    });
    count.textContent = visible + '개 작업';
  });
})();

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.workflow-gallery-item').forEach(card => {
    const source = card.querySelector('[data-image]')?.dataset.image;
    const visual = card.querySelector('.workflow-gallery-visual');
    if (!source || !visual) return;
    const proof = new Image();
    proof.className = 'folio-proof';
    proof.alt = '';
    proof.loading = 'lazy';
    proof.addEventListener('error', () => proof.remove(), {once:true});
    proof.src = source;
    visual.append(proof);
  });

  const archive = document.querySelector('.folio-works');
  if (!archive || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  function reveal(card, delay) {
    if (reduced.matches) return;
    card.getAnimations().forEach(animation => animation.cancel());
    card.animate([
      {opacity:.35, transform:'translateY(18px)', clipPath:'inset(0 0 9% 0)'},
      {opacity:1, transform:'translateY(0)', clipPath:'inset(0 0 0 0)'}
    ], {duration:360, delay, easing:'cubic-bezier(.16,.72,.24,1)', fill:'backwards'});
  }
  const observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach((entry,index) => {
      observer.unobserve(entry.target);
      reveal(entry.target,(index%3)*45);
    });
  }, {threshold:.08});
  const cards = Array.from(archive.children);
  cards.forEach(card => observer.observe(card));
  document.querySelector('.folio-filters')?.addEventListener('click', event => {
    if (!event.target.closest('[data-filter]')) return;
    cards.forEach(card => {
      observer.unobserve(card);
      if (!card.hidden) observer.observe(card);
    });
  });
})();
