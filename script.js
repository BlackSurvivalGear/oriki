const D=window.ORIKI_DATA;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let currentPage='dashboard';
let favourites=JSON.parse(localStorage.getItem('oriki-favourites')||'[]');
let recent=JSON.parse(localStorage.getItem('oriki-recent')||'[]');

window.addEventListener('DOMContentLoaded',()=>{
  renderLanding(); bindShell();
});
function renderLanding(){
 const grid=$('#landingAiGrid'); if(!grid)return;
 grid.innerHTML=D.ais.slice(0,5).map(ai=>aiCard(ai,true)).join('');
 $$('.ai-card .fav').forEach(b=>b.onclick=()=>toggleFav(b.dataset.id));
}
function aiCard(ai,landing=false){return `<article class="ai-card reveal"><div class="ai-meta"><span>${ai.provider}</span><span>${ai.category}</span></div><h3 class="ai-name">${ai.name}</h3><p class="ai-desc">${ai.description}</p><div class="tags">${ai.capabilities.slice(0,4).map(x=>`<span class="tag">${x}</span>`).join('')}</div><div class="card-row"><a class="card-btn primary" href="${ai.url}" target="_blank" rel="noopener noreferrer">OPEN</a>${landing?'':'<button class="card-btn fav" data-id="'+ai.id+'">☆ FAVOURITE</button>'}</div></article>`}
function bindShell(){
 $('#enterApp').onclick=()=>showApp('dashboard'); $('#heroEnter').onclick=()=>showApp('dashboard'); $('#backSite').onclick=()=>showLanding();
 $$('.side-link').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
 $$('.purpose-grid button').forEach(b=>b.onclick=()=>showApp('library',b.dataset.purpose));
 $('#globalSearch').onclick=openSearch; $('#closeSearch').onclick=closeSearch;
 $('#searchInput').oninput=e=>search(e.target.value);
 $('#openSidebar').onclick=()=>$('.sidebar').classList.toggle('open');
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()});
}
function showLanding(){ $('#app').classList.add('hidden');$('#landing').classList.remove('hidden');$('#footer').classList.remove('hidden');window.scrollTo(0,0);}
function showApp(page='dashboard',purpose=''){ $('#landing').classList.add('hidden');$('#footer').classList.add('hidden');$('#app').classList.remove('hidden');showPage(page,purpose);window.scrollTo(0,0);}
function showPage(page,purpose=''){
 currentPage=page; $$('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 const titles={dashboard:['GOOD MORNING.','What intelligence do you need today?'],discover:['DISCOVER.','Start with the task, then find the intelligence.'],library:['AI LIBRARY.','Explore the growing ORÍKÌ intelligence catalogue.'],compare:['COMPARE.','Put intelligence side by side.'],workspace:['MY WORKSPACE.','Your saved intelligence, ready when you are.'],favourites:['FAVOURITES.','Your selected intelligence systems.'],recent:['RECENT.','Continue exploring where you left off.'],categories:['CATEGORIES.','Explore intelligence by capability.'],about:['ABOUT ORÍKÌ.','Know your intelligence.']};
 $('#pageTitle').textContent=titles[page]?.[0]||'ORÍKÌ AI';$('#pageSubtitle').textContent=titles[page]?.[1]||'';$('.sidebar').classList.remove('open');
 const c=$('#pageContent'); c.innerHTML=page==='dashboard'?dashboard():page==='library'||page==='discover'?library(purpose):page==='compare'?compare():page==='favourites'?collection(favourites,'No favourites yet.'):page==='recent'?collection(recent,'No recent intelligence yet.'):page==='workspace'?workspace():page==='categories'?categories():about();
 $$('.fav').forEach(b=>b.onclick=()=>toggleFav(b.dataset.id)); $$('.open-ai').forEach(b=>b.onclick=()=>openAI(b.dataset.id)); $$('.purpose-mini button').forEach(b=>b.onclick=()=>showPage('library',b.dataset.purpose));
 const input=$('#librarySearch');if(input)input.oninput=()=>filterLibrary(input.value);
}
function dashboard(){return `<div class="dashboard-grid reveal"><div class="welcome-panel"><p class="eyebrow">ORÍKÌ WORKSPACE</p><h2>What intelligence do you need today?</h2><p class="muted">Choose a purpose to begin discovering the systems best suited to your task.</p><div class="purpose-mini">${Object.entries(D.purposes).map(([k,v])=>`<button data-purpose="${k}"><b>${v.title}</b><span>${v.text}</span></button>`).join('')}</div></div><div><p class="dash-title">YOUR ORÍKÌ</p><div class="stats"><div class="stat"><strong>${D.ais.length}</strong><span>AI SYSTEMS</span></div><div class="stat"><strong>${favourites.length}</strong><span>FAVOURITES</span></div><div class="stat"><strong>${recent.length}</strong><span>RECENT</span></div></div></div></div><section style="margin-top:35px"><p class="dash-title">FEATURED INTELLIGENCE</p><div class="library-grid">${D.ais.slice(0,6).map(aiCard).join('')}</div></section>`}
function library(purpose=''){
 let ais=purpose?D.ais.filter(ai=>D.purposes[purpose]?.capabilities.some(c=>ai.capabilities.includes(c))):D.ais;
 return `<div class="library-toolbar"><input id="librarySearch" placeholder="Search AI, provider or capability..." aria-label="Search AI library"><button class="filter" id="filterBtn">ALL</button></div><div class="library-grid" id="libraryGrid">${ais.map(aiCard).join('')}</div>`;
}
function filterLibrary(q){const query=q.toLowerCase();const grid=$('#libraryGrid');if(!grid)return;const ais=D.ais.filter(a=>(a.name+a.provider+a.category+a.description+a.capabilities.join(' ')).toLowerCase().includes(query));grid.innerHTML=ais.length?ais.map(aiCard).join(''):'<div class="empty">No intelligence matched your search.</div>';$$( '.fav').forEach(b=>b.onclick=()=>toggleFav(b.dataset.id));}
function compare(){let selected=['chatgpt','claude','gemini'];return `<div class="compare-select">${D.ais.slice(0,6).map(ai=>`<button class="compare-chip ${selected.includes(ai.id)?'active':''}" data-id="${ai.id}">${ai.name}</button>`).join('')}</div><div id="compareTable">${compareTable(selected)}</div>`}
function compareTable(ids){const ais=ids.map(id=>D.ais.find(a=>a.id===id)).filter(Boolean);return `<table class="compare-table"><thead><tr><th>CAPABILITY</th>${ais.map(a=>`<th>${a.name}</th>`).join('')}</tr></thead><tbody>${['research','coding','writing','reasoning','analysis','search','create'].map(cap=>`<tr><td>${cap.toUpperCase()}</td>${ais.map(a=>`<td>${a.capabilities.includes(cap)?'●':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function collection(ids,empty){const ais=ids.map(id=>D.ais.find(a=>a.id===id)).filter(Boolean);return ais.length?`<div class="library-grid">${ais.map(aiCard).join('')}</div>`:`<div class="empty">${empty}<br><br>Explore the AI Library to add intelligence here.</div>`}
function workspace(){return `<div class="dash-card"><p class="eyebrow">YOUR WORKSPACE</p><h2>Built for the next stage.</h2><p class="muted">Stage 2 establishes the workspace shell. Saved intelligence and future AI sessions will live here as ORÍKÌ evolves.</p></div>`}
function categories(){const cats=[['RESEARCH','Find, investigate and synthesize knowledge.'],['CREATE','Write, design and generate new work.'],['BUILD','Code, engineer and develop software.'],['ANALYSE','Read data, documents and complex problems.'],['REASONING','Work through difficult multi-step problems.'],['SEARCH','Find current information and sources.']];return `<div class="category-grid">${cats.map(c=>`<article class="dash-card"><p class="eyebrow">CAPABILITY</p><h3>${c[0]}</h3><p class="muted">${c[1]}</p></article>`).join('')}</div>`}
function about(){return `<div class="dash-card" style="max-width:850px"><p class="eyebrow">ORÍKÌ</p><h2>KNOW YOUR INTELLIGENCE.</h2><p class="muted">ORÍKÌ is a discovery and decision layer for the expanding world of artificial intelligence. It helps you understand what exists, what each system is good at, and where to begin.</p><p class="muted">Stage 2 is intentionally API-free. The application shell, catalogue, search, comparison and local workspace foundations come first.</p></div>`}
function toggleFav(id){if(favourites.includes(id))favourites=favourites.filter(x=>x!==id);else favourites.push(id);localStorage.setItem('oriki-favourites',JSON.stringify(favourites));if(currentPage==='favourites'||currentPage==='dashboard')showPage(currentPage)}
function openAI(id){const ai=D.ais.find(a=>a.id===id);if(!ai)return;if(!recent.includes(id))recent=[id,...recent].slice(0,8);localStorage.setItem('oriki-recent',JSON.stringify(recent));window.open(ai.url,'_blank','noopener,noreferrer')}
function openSearch(){const m=$('#searchModal');m.classList.remove('hidden');$('#searchInput').focus();search('')}
function closeSearch(){$('#searchModal').classList.add('hidden')}
function search(q){const box=$('#searchResults');if(!q){box.innerHTML='<p class="muted">Search by AI name, provider, capability or task.</p>';return}const r=D.ais.filter(a=>(a.name+a.provider+a.category+a.description+a.capabilities.join(' ')).toLowerCase().includes(q.toLowerCase()));box.innerHTML=r.length?r.map(a=>`<div class="search-result"><b>${a.name}</b><span>${a.provider} · ${a.category}</span></div>`).join(''):'<p class="muted">No results.</p>'}
