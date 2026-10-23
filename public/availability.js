(() => {
  const root=document.querySelector('#availability-calendar');if(!root)return;
  const lang=()=>document.documentElement.lang==='en'?'en':'es';
  const pad=n=>String(n).padStart(2,'0');
  const key=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
  const fromKey=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));};
  const todayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dateLabel=s=>new Intl.DateTimeFormat(lang()==='es'?'es-CO':'en-US',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(fromKey(s));
  const monthName=d=>new Intl.DateTimeFormat(lang()==='es'?'es-CO':'en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(d);
  const state={month:new Date(),blocks:[],arrival:'',departure:'',loaded:false,loading:false,request:0};state.month.setDate(1);
  const status=document.querySelector('#calendar-status'),quote=document.querySelector('#calendar-quote'),retry=document.querySelector('#calendar-retry'),label=document.querySelector('#calendar-month-label');
  const arrivalStep=document.querySelector('#date-step-arrival'),departureStep=document.querySelector('#date-step-departure'),stepMiddle=document.querySelector('#calendar-step-middle');
  const arrivalValue=document.querySelector('#selected-arrival'),departureValue=document.querySelector('#selected-departure');
  const t=(es,en)=>lang()==='es'?es:en;
  const overlaps=(a,d)=>state.blocks.some(b=>a<b.departure&&d>b.arrival);
  const visibleMonths=()=>matchMedia('(max-width:720px)').matches?1:2;
  async function load(){
    const token=++state.request;state.loading=true;render();
    const start=new Date(Date.UTC(state.month.getFullYear(),state.month.getMonth(),1));
    const end=new Date(Date.UTC(state.month.getFullYear(),state.month.getMonth()+visibleMonths(),1));
    try{const r=await fetch(`/api/availability?from=${key(start.getUTCFullYear(),start.getUTCMonth(),1)}&to=${key(end.getUTCFullYear(),end.getUTCMonth(),1)}`,{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();if(token!==state.request)return;state.blocks=data.blocks;state.loaded=true;}
    catch{if(token===state.request){state.blocks=[];state.loaded=false;}}
    finally{if(token===state.request){state.loading=false;render();}}
  }
  function renderMonth(offset){
    const d=new Date(Date.UTC(state.month.getFullYear(),state.month.getMonth()+offset,1));const y=d.getUTCFullYear(),m=d.getUTCMonth();
    const first=(d.getUTCDay()+6)%7;const days=new Date(Date.UTC(y,m+1,0)).getUTCDate();
    const weekdays=lang()==='es'?['L','M','X','J','V','S','D']:['M','T','W','T','F','S','S'];
    const section=document.createElement('div');section.className='calendar-month';
    const heading=document.createElement('h3');heading.textContent=monthName(d).replace(/^./,c=>c.toLocaleUpperCase(lang()==='es'?'es-CO':'en-US'));section.append(heading);
    const grid=document.createElement('div');grid.className='calendar-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label',monthName(d));
    weekdays.forEach((w,i)=>{const el=document.createElement('span');el.className='calendar-weekday';el.setAttribute('aria-hidden','true');el.textContent=w;grid.append(el)});
    for(let i=0;i<first;i++){const blank=document.createElement('span');blank.className='calendar-blank';blank.setAttribute('aria-hidden','true');grid.append(blank)}
    for(let day=1;day<=days;day++){
      const value=key(y,m,day),el=document.createElement('button');el.type='button';el.className='calendar-day';el.textContent=String(day);el.dataset.date=value;
      const occupied=state.blocks.some(b=>value>=b.arrival&&value<b.departure);
      const past=value<todayKey(),selected=value===state.arrival||value===state.departure,between=state.arrival&&state.departure&&value>state.arrival&&value<state.departure;
      el.disabled=occupied||past||!state.loaded||state.loading;el.classList.toggle('is-occupied',occupied);el.classList.toggle('is-available',!occupied&&!past&&state.loaded&&!state.loading);el.classList.toggle('is-selected',selected);el.classList.toggle('is-between',Boolean(between));el.classList.toggle('is-today',value===todayKey());
      el.setAttribute('aria-label',`${dateLabel(value)} \u00b7 ${occupied?t('Ocupado','Unavailable'):t('Disponible','Available')}${selected?' \u00b7 '+t('Seleccionado','Selected'):''}`);el.setAttribute('aria-pressed',String(Boolean(selected||between)));
      el.addEventListener('click',()=>choose(value));grid.append(el);
    }
    section.append(grid);return section;
  }
  function render(){
    const count=visibleMonths();
    label.textContent=count===1?monthName(state.month):`${monthName(state.month)}  \u00b7  ${monthName(new Date(Date.UTC(state.month.getFullYear(),state.month.getMonth()+1,1)))}`;
    root.replaceChildren(...Array.from({length:count},(_,i)=>renderMonth(i)));
    arrivalValue.textContent=state.arrival?dateLabel(state.arrival):t('Selecciona llegada','Choose arrival');
    departureValue.textContent=state.departure?dateLabel(state.departure):t('Selecciona salida','Choose departure');
    stepMiddle.textContent='\u2192';
    stepMiddle.classList.remove('stay-summary');
    if(state.arrival&&state.departure){const nights=Math.round((fromKey(state.departure)-fromKey(state.arrival))/86400000);stepMiddle.textContent=t(`${nights+1} días \u00b7 ${nights} noches`,`${nights+1} days \u00b7 ${nights} nights`);stepMiddle.classList.add('stay-summary');}
    arrivalStep.classList.toggle('is-current',!state.arrival);
    arrivalStep.classList.toggle('is-complete',Boolean(state.arrival));
    departureStep.classList.toggle('is-current',Boolean(state.arrival&&!state.departure));
    departureStep.classList.toggle('is-complete',Boolean(state.departure));
    const prev=document.querySelector('#calendar-prev'),next=document.querySelector('#calendar-next');
    const current=new Date();current.setDate(1);prev.disabled=state.month<=current;next.disabled=state.month.getFullYear()>current.getFullYear()||(state.month.getFullYear()===current.getFullYear()&&state.month.getMonth()>=current.getMonth()+10);
    quote.disabled=!(state.arrival&&state.departure&&state.loaded);
    retry.hidden=state.loaded||state.loading;
    if(state.loading)status.textContent=t('Actualizando disponibilidad…','Updating availability…');
    else if(!state.loaded)status.textContent=t('No pudimos actualizar la disponibilidad. Intenta de nuevo.','We could not update availability. Please try again.');
    else if(!state.arrival)status.textContent=t('1. Elige tu fecha de llegada.','1. Choose your check-in date.');
    else if(!state.departure)status.textContent=t(`Llegada: ${dateLabel(state.arrival)}. Ahora elige tu salida.`,`Check-in: ${dateLabel(state.arrival)}. Now choose your check-out.`);
    else status.textContent=t('Fechas seleccionadas. Ya puedes ver tu cotización.','Dates selected. You can view your quote now.');
  }
  function choose(value){
    if(!state.arrival||state.departure||value<=state.arrival){state.arrival=value;state.departure='';}
    else if(overlaps(state.arrival,value)){state.arrival=value;state.departure='';}
    else state.departure=value;
    render();
  }
  document.querySelector('#calendar-prev').addEventListener('click',()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()-1,1);state.arrival='';state.departure='';load()});
  document.querySelector('#calendar-next').addEventListener('click',()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()+1,1);state.arrival='';state.departure='';load()});
  retry.addEventListener('click',load);
  quote.addEventListener('click',()=>{if(!state.arrival||!state.departure)return;const form=document.querySelector('#reservation-form');form.elements.arrival.value=state.arrival;form.elements.departure.value=state.departure;form.elements.departure.min=state.arrival;form.elements.arrival.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#reservar').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
  new MutationObserver(()=>{if(state.loaded)render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  matchMedia('(max-width:720px)').addEventListener('change',load);
  load();
})();
