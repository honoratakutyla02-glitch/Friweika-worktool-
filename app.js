* app.js - główna logika frontu (split version) */

/* HELPERS */
const $ = id => document.getElementById(id);
const qsa = sel => document.querySelectorAll(sel);
const escapeHtml = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* NAV */
const tabs = qsa('.nav .item');
const translateCard = $('translateCard');
const historyCard = $('historyCard');
const learnCard = $('learnCard');

tabs.forEach(t=>{
  t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    translateCard.style.display = tab==='translate' ? 'block':'none';
    historyCard.style.display   = tab==='history'  ? 'block':'none';
    learnCard.style.display     = tab==='learn'    ? 'block':'none';
    if(tab==='history') renderHistory();
  });
});

/* SETTINGS */
const menuBtn = $('menuBtn'); const settingsPanel = $('settingsPanel');
menuBtn.addEventListener('click', ()=> settingsPanel.style.display = settingsPanel.style.display==='block' ? 'none' : 'block' );
$('closeSettings').addEventListener('click', ()=> settingsPanel.style.display='none' );

const savedDark = localStorage.getItem('fw_dark') === '1';
const savedColor = localStorage.getItem('fw_coloring') !== '0';
const savedDates = localStorage.getItem('fw_dates') !== '0';
const savedAppLang = localStorage.getItem('fw_app_lang') || 'pl';

$('toggleDarkMode').checked = savedDark;
$('toggleColoring').checked = savedColor;
$('toggleDates').checked = savedDates;
$('appLang').value = savedAppLang;

$('quickDark').checked = savedDark;
$('quickColor').checked = savedColor;

if(savedDark) enableDarkMode(true);
if(!savedColor) toggleColoring(false);

$('saveSettings').addEventListener('click', ()=>{
  localStorage.setItem('fw_dark', $('toggleDarkMode').checked ? '1':'0');
  localStorage.setItem('fw_coloring', $('toggleColoring').checked ? '1':'0');
  localStorage.setItem('fw_dates', $('toggleDates').checked ? '1':'0');
  localStorage.setItem('fw_app_lang', $('appLang').value || 'pl');
  alert('Zapisano ustawienia.');
  settingsPanel.style.display='none';
  renderHistory();
});

$('quickDark').addEventListener('change', e => {
  $('toggleDarkMode').checked = e.target.checked;
  enableDarkMode(e.target.checked);
});
$('quickColor').addEventListener('change', e => {
  $('toggleColoring').checked = e.target.checked;
  toggleColoring(e.target.checked);
});

function enableDarkMode(enable){
  if(enable){ document.body.classList.add('dark-mode'); $('quickDark').checked = true; }
  else { document.body.classList.remove('dark-mode'); $('quickDark').checked = false; }
}
$('toggleDarkMode').addEventListener('change', ()=> enableDarkMode($('toggleDarkMode').checked));

function toggleColoring(enable){
  const historyList = $('historyList');
  if(!enable){ historyList.classList.add('no-colors'); $('quickColor').checked = false; }
  else { historyList.classList.remove('no-colors'); $('quickColor').checked = true; }
}
$('toggleColoring').addEventListener('change', ()=> toggleColoring($('toggleColoring').checked));

/* TRANSLATOR: najpierw API, potem fallback */
async function callTranslateAPI(q, source, target){
  try{
    const res = await fetch('/api/translate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ q, source, target }) });
    if(res.ok){
      const j = await res.json();
      if(j && j.translation) return j.translation;
      if(j && j.ok && j.message) return j.message;
    }
  }catch(e){ /* fallback */ }
  return null;
}

function improvedTranslate(text, source, target){
  const mapPhrase = {
    'pl->de': {
      'hej, mógłbyś do mnie przyjść? potrzebuję pomocy': 'Hey, könntest du zu mir kommen? Ich brauche Hilfe.',
      'hej, przyjdź do biura po pracy': 'Hallo, komm bitte nach der Arbeit ins Büro.'
    }
  };
  const key = ${source}->${target};
  const norm = (text||'').trim().toLowerCase();
  if(mapPhrase[key] && mapPhrase[key][norm]) return mapPhrase[key][norm];

  if(source==='pl' && target==='de'){
    const map = {'hej':'Hey,','przyjdź':'komm','do':'zu','biura':'Büro','po':'nach','pracy':'der Arbeit','potrzebuję':'ich brauche','pomocy':'Hilfe'};
    return text.split(/\s+/).map(w=>{
      const clean = w.replace(/[.,!?]/g,'').toLowerCase();
      return map[clean] ? map[clean] : w;
    }).join(' ').replace(/\s+/g,' ').trim();
  }

  if(source==='de' && target==='pl'){
    const map = {'hallo':'hej','kommen':'przyjdź','zu':'do','mir':'mnie','ich':'ja','brauche':'potrzebuję','hilfe':'pomoc'};
    return text.split(/\s+/).map(w=>{
      const clean = w.replace(/[.,!?"]/g,'').toLowerCase();
      return map[clean] ? map[clean] : w;
    }).join(' ');
  }
  return text;
}

$('translateBtn').addEventListener('click', async ()=>{
  const qtext = $('sourceText').value.trim();
  if(!qtext){ alert('Wpisz tekst.'); return; }
  const out = $('translatedText'); out.value = 'Tłumaczę...';
  const source = $('langFrom').value; const target = $('langTo').value;

  const apiRes = await callTranslateAPI(qtext, source, target);
  if(apiRes !== null){ out.value = apiRes; saveHistory(qtext, apiRes, source, target); renderHistory(); return; }

  const res = improvedTranslate(qtext, source, target);
  out.value = res;
  saveHistory(qtext, res, source, target);
  renderHistory();
});

$('googleBtn').addEventListener('click', ()=> {
  const txt = encodeURIComponent($('sourceText').value || '');
  window.open('https://translate.google.com/?sl=auto&tl='+$('langTo').value+'&text='+txt, '_blank');
});

/* mic */
let recognition;
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'pl-PL';
  recognition.interimResults = false;
  recognition.onresult = e => $('sourceText').value = [...e.results].map(r=>r[0].transcript).join('');
}
$('micBtn').addEventListener('click', ()=> {
  if(!recognition){ alert('Brak wsparcia mikrofonu.'); return; }
  recognition.start();
});
$('imgBtn').addEventListener('click', ()=> alert('OCR / upload dodać później.')) ;

/* HISTORY */
function saveHistory(input, output, source='auto', target='auto'){
  const list = JSON.parse(localStorage.getItem('fri_history')||'[]');
  list.unshift({ input, output, source, target, date: new Date().toISOString() });
  if(list.length>300) list.length=300;
  localStorage.setItem('fri_history', JSON.stringify(list));
}

$('histFilterBtn').addEventListener('click', renderHistory);
$('histSearch').addEventListener('input', debounce(()=> renderHistory(), 250));

function renderHistory(){
  const raw = JSON.parse(localStorage.getItem('fri_history')||'[]');
  const box = $('historyList'); box.innerHTML = '';
  const search = ($('histSearch').value||'').trim().toLowerCase();
  const lang = $('histLang').value;

  let list = raw.slice(0);
  if(lang !== 'all') list = list.filter(it => it.source === lang || it.target === lang);
  if(search) list = list.filter(it => (it.input||'').toLowerCase().includes(search) || (it.output||'').toLowerCase().includes(search));
  if(!list.length){ box.innerHTML = '<p class="small">Brak wyników w historii.</p>'; return; }

  list.forEach(item=>{
    const div = document.createElement('div'); div.className='history-item';
    const dateStr = new Date(item.date).toLocaleString();
    const showDates = $('toggleDates').checked;

    // render: input text + colored tokens of translation (no duplicate raw copy)
    const colored = tokenizeAndRender(item.output, item.target || 'de');
    div.innerHTML = `
      <div class="date">${showDates ? escapeHtml(dateStr) : ''}</div>
      <div><b>Wejście:</b> ${escapeHtml(item.input)}</div>
      <div style="margin-top:8px">${colored}</div>
    `;
    box.appendChild(div);
  });

  if(!$('toggleColoring').checked) box.classList.add('no-colors'); else box.classList.remove('no-colors');
}

$('clearHistoryBtn').addEventListener('click', ()=> {
  if(confirm('Wyczyścić historię?')){ localStorage.removeItem('fri_history'); renderHistory(); }
});

/* TOKENIZER */
const detMap = { der:'det-der', die:'det-die', das:'det-das' };

function tokenizeAndRender(sentence, lang='de'){
  if(!sentence) return '';
  const parts = sentence.split(/\s+/).filter(Boolean);
  const tokens = [];
  for(let i=0;i<parts.length;i++){
    const raw = parts[i];
    const clean = raw.replace(/[.,!?;:"]+$/g,'');
    const lower = clean.toLowerCase();

    if(detMap[lower] && parts[i+1]){
      const next = parts[i+1].replace(/[.,!?;:"]+$/g,'');
      const role = guessRole(next, lang);
      tokens.push({ text: clean + ' ' + next, classes: [detMap[lower], role] });
      i++; continue;
    }

    const role = guessRole(clean, lang);
    tokens.push({ text: clean, classes: [role] });
  }

  return tokens.map(t => <span class="tok ${t.classes.join(' ')}">${escapeHtml(t.text)}</span>).join(' ');
}

function guessRole(word, lang){
  const w = (word||'').replace(/[.,!?;:"]/g,'');
  const lw = w.toLowerCase();
  if(['in','im','ins','auf','an','mit','für','zu','nach','unter','über','zwischen','bei'].includes(lw)) return 'prep';
  if(['schnell','langsam','gerne','heute','bald','noch'].includes(lw)) return 'adv';
  if(['ist','hat','läuft','geht','kommt','sieht','muss','kann','brauche','brauchen'].includes(lw)) return 'verb';
  if(word && word[0] === word[0].toUpperCase()) return 'noun';
  if(lw.endsWith('ć')||lw.endsWith('ć')||lw.endsWith('ić')||lw.endsWith('ować')) return 'verb';
  if(lw.endsWith('y')||lw.endsWith('ny')||lw.endsWith('owy')||lw.endsWith('a')||lw.endsWith('e')||lw.endsWith('o')) return 'adj';
  return 'noun';
}

/* NAUKA: articles + flashcards + irregular + phrases */
const articles = [
  {word:'Tisch', article:'der', translation:'stół'},
  {word:'Frau', article:'die', translation:'kobieta'},
  {word:'Haus', article:'das', translation:'dom'},
  {word:'Apfel', article:'der', translation:'jabłko'},
  {word:'Katze', article:'die', translation:'kotka'},
  {word:'Buch', article:'das', translation:'książka'},
  {word:'Stuhl', article:'der', translation:'krzesło'},
  {word:'Blume', article:'die', translation:'kwiat'},
  {word:'Fenster', article:'das', translation:'okno'}
];

function seedArticleQuiz(){
  const area = $('articleQuiz'); area.innerHTML = '';
  const sample = shuffleArray(articles).slice(0,4);
  sample.forEach(a=>{
    const card = document.createElement('div'); card.style='border:1px solid #eee;padding:10px;border-radius:8px;background:#fff;min-width:180px';
    card.innerHTML = `<div style="font-weight:700;margin-bottom:8px">${a.word} — <small style="opacity:.75">${a.translation}</small></div>
      <div style="display:flex;gap:6px">
        <button class="btn-ghost" data-ans="der">der</button>
        <button class="btn-ghost" data-ans="die">die</button>
        <button class="btn-ghost" data-ans="das">das</button>
      </div>
      <div class="result" style="margin-top:8px"></div>`;
    area.appendChild(card);
    card.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=> {
        const ans = b.dataset.ans; const res = card.querySelector('.result');
        if(ans === a.article){ res.innerHTML = '<span style="color:green;font-weight:700">Dobrze ✓</span>'; b.style.borderColor='green'; }
        else { res.innerHTML = <span style="color:red;font-weight:700">Źle — poprawnie: ${a.article}</span>; }
      });
    });
  });
}
$('shuffleArticles').addEventListener('click', seedArticleQuiz);
seedArticleQuiz();

function seedFlashcards(){
  const area = $('flashcardArea'); area.innerHTML = '';
  const set = shuffleArray(articles).slice(0,4);
  set.forEach(a=>{
    const fc = document.createElement('div'); fc.className='flashcard'; fc.tabIndex=0;
    fc.innerHTML = `<div class="flashcard-inner">
      <div class="flashcard-front" style="display:flex;align-items:center;justify-content:center"><div style="text-align:center"><div style="font-weight:800">${a.word}</div><div style="margin-top:8px;padding:4px 8px;border-radius:6px;border:1px solid #eee;display:inline-block;font-size:13px;color:#333">${a.article}</div></div></div>
      <div class="flashcard-back" style="display:flex;align-items:center;justify-content:center"><div style="text-align:center"><div style="font-weight:700">${a.translation}</div></div></div>
    </div>`;
    area.appendChild(fc);
    fc.addEventListener('click', ()=> fc.classList.toggle('flipped'));
  });
}
seedFlashcards();

function seedIrregularTable(){
  const area = $('irregularTableArea'); area.innerHTML = '';
  const list = [
    {inf:'sein', pres:'ich bin', pret:'ich war', part:'gewesen', pl:'być'},
    {inf:'haben', pres:'ich habe', pret:'ich hatte', part:'gehabt', pl:'mieć'},
    {inf:'gehen', pres:'ich gehe', pret:'ich ging', part:'gegangen', pl:'iść'},
    {inf:'sehen', pres:'ich sehe', pret:'ich sah', part:'gesehen', pl:'widzieć'},
    {inf:'essen', pres:'ich esse', pret:'ich aß', part:'gegessen', pl:'jeść'}
  ];
  const tbl = document.createElement('div');
  tbl.innerHTML = '<table style="width:100%;border-collapse:collapse"><thead><tr style="text-align:left"><th>Infinitiv</th><th>Präsens (1. os.)</th><th>Präteritum</th><th>Partizip II</th><th>PL</th></tr></thead></table>';
  const tbody = document.createElement('tbody');
  list.forEach(v=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="padding:6px 8px;border-top:1px solid #eee">${v.inf}</td>
                    <td style="padding:6px 8px;border-top:1px solid #eee">${v.pres}</td>
                    <td style="padding:6px 8px;border-top:1px solid #eee">${v.pret}</td>
                    <td style="padding:6px 8px;border-top:1px solid #eee">${v.part}</td>
                    <td style="padding:6px 8px;border-top:1px solid #eee">${v.pl}</td>`;
    tbody.appendChild(tr);
  });
  tbl.querySelector('table').appendChild(tbody);
  area.appendChild(tbl);
}
seedIrregularTable();

function seedWorkPhrases(){
  const area = $('workPhrasesArea'); area.innerHTML = '';
  const phrases = [
    {pl:'Czy możesz mi pomóc?', de:'Kannst du mir helfen?'},
    {pl:'Masz chwilę?', de:'Hast du kurz Zeit?'},
    {pl:'Masz taśmę?', de:'Hast du Klebeband?'},
    {pl:'Kierownik jest na miejscu?', de:'Ist der Leiter da?'}
  ];
  phrases.forEach(p=>{
    const el = document.createElement('div');
    el.style = 'padding:8px;border-radius:6px;border:1px solid #eee;margin-bottom:6px;background:#fff';
    el.innerHTML = <div style="font-weight:700">${p.pl}</div><div style="opacity:.75">${p.de}</div>;
    area.appendChild(el);
  });
}
seedWorkPhrases();

$('addModuleBtn').addEventListener('click', ()=>{
  const modules = $('modulesArea');
  const m = document.createElement('div'); m.className='module card';
  m.innerHTML = <div style="display:flex;justify-content:space-between;align-items:center"><b>Nowy moduł</b><button class="btn-ghost" data-close>Usuń</button></div><div style="margin-top:8px">Treść modułu…</div>;
  modules.appendChild(m);
  m.querySelector('[data-close]').addEventListener('click', ()=> m.remove());
});

/* UTIL */
function shuffleArray(arr){ const c=[...arr]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]] } return c; }
function debounce(fn,wait=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); } }

/* INIT */
(function init(){
  translateCard.style.display='block'; historyCard.style.display='none'; learnCard.style.display='none';
  $('quickDark').checked = $('toggleDarkMode').checked;
  $('quickColor').checked = $('toggleColoring').checked;
  if(!localStorage.getItem('fri_history')){
    saveHistory('hej, mógłbyś do mnie przyjść? potrzebuję pomocy', 'Hey, könntest du zu mir kommen? Ich brauche Hilfe.', 'pl', 'de');
  }
  renderHistory();
})();
