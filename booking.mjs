export function quote(input, cleaning = 0, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const valid = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
  if (!valid(input.arrival) || !valid(input.departure)) throw Error('Fechas inválidas / Invalid dates');
  const nights = (Date.parse(input.departure)-Date.parse(input.arrival))/86400000;
  if (input.arrival < today || nights < 1 || nights > 90) throw Error('Selecciona fechas futuras y entre 1 y 90 noches / Choose future dates, 1–90 nights');
  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 26) throw Error('Entre 1 y 26 huéspedes / Between 1 and 26 guests');
  return {arrival:input.arrival,departure:input.departure,guests,nights,nightly:1500000,cleaning,total: nights*1500000+cleaning};
}
export function overlaps(a,b) {return a.arrival < b.departure && a.departure > b.arrival;}
