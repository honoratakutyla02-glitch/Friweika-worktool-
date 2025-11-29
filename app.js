/* Helpery */
const $ = id => document.getElementById(id);
const qsa = s => document.querySelectorAll(s);

/* NAVIGATION */
qsa('.nav .item').forEach(btn=>{
  btn.onclick = ()=>{
    qsa('.nav .item').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');

    $('translateCard').style.display = btn.dataset.tab==="translate"?"block":"none";
    $('historyCard').style.display   = btn.dataset.tab==="history" ?"block":"none";
    $('learnCard').style.display     = btn.dataset.tab==="learn"    ?"block":"none";

    if(btn.dataset.tab==="history") renderHistory();
  }
});

/* SETTINGS */
$('menuBtn').onclick = ()=> $('settingsPanel').style.display="block";
$('closeSettings').onclick = ()=> $('settingsPanel').style.display="none";

$('toggleDarkMode').onchange = ()=>{
  document.body.classList.toggle('dark-mode', $('toggleDarkMode').checked);
};

/* MAIN TRANSLATION FUNCTION */
async function translateText(){
  const q = $('sourceText').value.trim();
  if(!q) return;

  $('translatedText').value = "Tłumaczę...";

  const res = await fetch("/api/translate",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      q,
      source:$('langFrom').value,
      target:$('langTo').value
    })
  });

  const data = await res.json();

  $('translatedText').value = data.translation || "Błąd tłumaczenia";

  saveHistory(q, data.translation);
  renderHistory();
}

$('translateBtn').onclick = translateText;

/* GOOGLE BUTTON */
$('googleBtn').onclick = ()=>{
  const txt = encodeURIComponent($('sourceText').value);
  window.open(`https://translate.google.com/?sl=auto&tl=${$('langTo').value}&text=${txt}`,"_blank");
};

/* SAVE HISTORY */
function saveHistory(input, output){
  const list = JSON.parse(localStorage.getItem('fri_history')||"[]");
  list.unshift({input,output,date:new Date().toISOString()});
  if(list.length>200) list.length=200;
  localStorage.setItem("fri_history", JSON.stringify(list));
}

/* RENDER HISTORY */
function tokenize(str){
  if(!str) return "";
  return str.split(/\s+/).map(w=>{
    const lw = w.toLowerCase();
    if(lw==="der") return `<span class="tok der">der</span>`;
    if(lw==="die") return `<span class="tok die">die</span>`;
    if(lw==="das") return `<span class="tok das">das</span>`;
    if(lw==="und") return `<span class="tok prep">${w}</span>`;
    return `<span class="tok noun">${w}</span>`;
  }).join(" ");
}

function renderHistory(){
  const list = JSON.parse(localStorage.getItem("fri_history")||"[]");
  const box = $('historyList');
  box.innerHTML = "";

  list.forEach(item=>{
    const div = document.createElement('div');
    div.style="padding:10px;border:1px solid #ddd;border-radius:8px;margin:8px 0;background:#fff;";
    div.innerHTML = `
      <div style="opacity:.6;font-size:12px">${new Date(item.date).toLocaleString()}</div>
      <div style="margin-top:6px;font-weight:700">${item.output}</div>
      <div style="margin-top:8px">${tokenize(item.output)}</div>
    `;
    box.appendChild(div);
  });
}

$('clearHistoryBtn').onclick = ()=>{
  localStorage.removeItem("fri_history");
  renderHistory();
};

/* LEGEND */
$('legendToggle').onclick = ()=>{
  $('legendArea').style.display = $('legendArea').style.display==="none" ? "block" : "none";
};

/* FLASHCARDS */
const baseWords=[
  {w:"Tisch",a:"der",pl:"stół"},
  {w:"Frau",a:"die",pl:"kobieta"},
  {w:"Haus",a:"das",pl:"dom"},
  {w:"Buch",a:"das",pl:"książka"},
];

function renderFlashcards(){
  const area = $('flashcardsArea');
  area.innerHTML="";

  baseWords.forEach(x=>{
    const card = document.createElement('div');
    card.className="flashcard";
    card.innerHTML=`
      <div class="front">${x.a} ${x.w}</div>
      <div class="back">${x.pl}</div>
    `;
    card.onclick = ()=> card.classList.toggle('flip');
    area.appendChild(card);
  });
}

renderFlashcards();

/* IRREGULAR VERBS */
function renderIrr(){
  const area = $('irrArea');
  area.innerHTML="";
  const list = [
    {inf:"sein",p1:"bin",pret:"war",pp:"gewesen"},
    {inf:"haben",p1:"habe",pret:"hatte",pp:"gehabt"},
    {inf:"gehen",p1:"gehe",pret:"ging",pp:"gegangen"}
  ];

  let html = `<table class="irr"><tr><th>Inf</th><th>Präsens</th><th>Prät.</th><th>Partizip II</th></tr>`;

  list.forEach(v=>{
    html+=`<tr><td>${v.inf}</td><td>${v.p1}</td><td>${v.pret}</td><td>${v.pp}</td></tr>`;
  });

  html+="</table>";
  area.innerHTML=html;
}

renderIrr();
