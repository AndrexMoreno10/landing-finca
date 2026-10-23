(() => {
 const hero=document.querySelector('.hero'),slides=[...document.querySelectorAll('.hero-slide')],dots=[...document.querySelectorAll('.carousel-dot')];
 if(!hero||!slides.length)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let current=0,timer=null,paused=reduce.matches,inView=true;
 const pauseButton=document.querySelector('#carousel-pause');
 function updatePause(){if(pauseButton){pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.firstElementChild.textContent=paused?'\u25b6':'\u275a\u275a';}}
 document.querySelector('#carousel-prev')?.addEventListener('click',()=>show(current-1));
 document.querySelector('#carousel-next')?.addEventListener('click',()=>show(current+1));
 pauseButton?.addEventListener('click',()=>{paused=!paused;updatePause();schedule()});
 reduce.addEventListener('change',()=>{paused=reduce.matches;updatePause()});
 updatePause();
 function schedule(){clearInterval(timer);if(!paused&&!document.hidden&&inView)timer=setInterval(()=>show(current+1,false),5000)}
 function show(n,announce=true){current=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===current);s.setAttribute('aria-hidden',String(i!==current))});dots.forEach((d,i)=>d.classList.toggle('is-current',i===current));const counter=document.querySelector('.carousel-index');if(counter)counter.textContent=`0${current+1} / 0${slides.length}`;if(announce){const status=document.querySelector('.carousel-status');if(status)status.textContent=document.documentElement.lang==='en'?`Image ${current+1} of ${slides.length}`:`Imagen ${current+1} de ${slides.length}`;}schedule()}
 hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1))}});
 let start=null;hero.addEventListener('touchstart',e=>{start={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}}, {passive:true});hero.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(current+(dx<0?1:-1));start=null},{passive:true});
 document.addEventListener('visibilitychange',schedule);new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule()},{threshold:.1}).observe(hero);reduce.addEventListener('change',()=>{paused=reduce.matches;schedule()});schedule();
})();
