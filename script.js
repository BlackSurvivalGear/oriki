const D=window.ORIKI_DATA;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let currentPage='dashboard';
let activePurpose='';
let favourites=JSON.parse(localStorage.getItem('oriki-favourites')||'[]');
let recent=JSON.parse(localStorage.getItem('oriki-recent')||'[]');

window.addEventListener('DOMContentLoaded',()=>{renderLanding();bindShell();});

function renderLanding(){
 const grid=$('#landingAiGrid'); if(!grid)return;
 grid.innerHTML=D.ais.slice(0,5).map(ai=>aiCard(ai,true)).join('');
}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function aiCard(ai,landing=false){return `<article class="ai-card reveal"><div class="ai-meta"><span>${escapeHtml(ai.provider)}</span><span>${escapeHtml(ai.type||ai.category)}</span></div><h3 class="ai-name">${escapeHtml(ai.name)}</h3><p class="ai-desc">${escapeHtml(ai.description)}</p><div class="tags">${ai.capabilities.slice(0,4).map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('')}</div><div class="card-row"><button class="card-btn primary open-ai" data-id="${ai.id}">VIEW</button>${landing?`<a class="card-btn" href="${ai.url}" target="_blank" rel="noopener noreferrer">OPEN</a>`:`<button class="card-btn fav" data-id="${ai.id}">${favourites.includes(ai.id)?'★ FAVOURITED':'☆ FAVOURITE'}</button>`}</div></article>`}
function bindShell(){
 $('#enterApp').onclick=()=>showApp('dashboard'); $('#heroEnter').onclick=()=>showApp('dashboard'); $('#backSite').onclick=()=>showLanding();
 $$('.side-link').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
 $$('.purpose-grid button').forEach(b=>b.onclick=()=>showApp('discover',b.dataset.purpose));
 $('#globalSearch').onclick=openSearch; $('#closeSearch').onclick=closeSearch;
 $('#searchInput').oninput=e=>search(e.target.value);
 $('#openSidebar').onclick=()=>$('.sidebar').classList.toggle('open');
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()});
}
function showLanding(){ $('#app').classList.add('hidden');$('#landing').classList.remove('hidden');$('#footer').classList.remove('hidden');window.scrollTo(0,0);}
function showApp(page='dashboard',purpose=''){ $('#landing').classList.add('hidden');$('#footer').classList.add('hidden');$('#app').classList.remove('hidden');showPage(page,purpose);window.scrollTo(0,0);}
function showPage(page,purpose=''){
 currentPage=page; activePurpose=purpose||''; $$('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 const titles={dashboard:['GOOD MORNING.','What intelligence do you need today?'],discover:['DISCOVER.','Start with the task, then find the intelligence.'],library:['INTELLIGENCE.','Explore the systems shaping the AI landscape.'],compare:['COMPARE.','Put intelligence side by side.'],workspace:['MY WORKSPACE.','Your saved intelligence, ready when you are.'],favourites:['FAVOURITES.','Your selected intelligence systems.'],recent:['RECENT.','Continue exploring where you left off.'],categories:['CATEGORIES.','Explore intelligence by capability.'],about:['ABOUT ORÍKÌ.','Know your intelligence.']};
 $('#pageTitle').textContent=titles[page]?.[0]||'ORÍKÌ AI';$('#pageSubtitle').textContent=titles[page]?.[1]||'';$('.sidebar').classList.remove('open');
 const c=$('#pageContent');
 c.innerHTML=page==='dashboard'?dashboard():page==='discover'?discover(purpose):page==='library'?library():page==='compare'?compare():page==='favourites'?collection(favourites,'No favourites yet.'):page==='recent'?collection(recent,'No recent intelligence yet.'):page==='workspace'?workspace():page==='categories'?categories():about();
 bindDynamic();
}
function bindDynamic(){
 $$('.fav').forEach(b=>b.onclick=()=>toggleFav(b.dataset.id));
 $$('.open-ai').forEach(b=>b.onclick=()=>openAI(b.dataset.id));
 $$('.purpose-mini button,.task-card').forEach(b=>b.onclick=()=>showPage('discover',b.dataset.purpose));
 $$('.discover-ai-btn').forEach(b=>b.onclick=()=>showPage('library',b.dataset.purpose));
 const input=$('#librarySearch');if(input)input.oninput=()=>filterLibrary();
 $$('.library-filter').forEach(el=>el.onchange=filterLibrary);
 $$('.compare-chip').forEach(b=>b.onclick=()=>toggleCompare(b.dataset.id));
 $$('.category-card').forEach(b=>b.onclick=()=>showPage('library',b.dataset.capability));
}
function dashboard(){return `<div class="dashboard-grid reveal"><div class="welcome-panel"><p class="eyebrow">ORÍKÌ WORKSPACE</p><h2>What intelligence do you need today?</h2><p class="muted">Start with a purpose. ORÍKÌ will narrow the landscape to the systems most relevant to your task.</p><div class="purpose-mini">${Object.entries(D.purposes).map(([k,v])=>`<button data-purpose="${k}"><b>${v.title}</b><span>${v.text}</span></button>`).join('')}</div></div><div><p class="dash-title">YOUR ORÍKÌ</p><div class="stats"><div class="stat"><strong>${D.ais.length}</strong><span>AI SYSTEMS</span></div><div class="stat"><strong>${favourites.length}</strong><span>FAVOURITES</span></div><div class="stat"><strong>${recent.length}</strong><span>RECENT</span></div></div></div></div><section style="margin-top:35px"><p class="dash-title">FEATURED INTELLIGENCE</p><div class="library-grid">${D.ais.slice(0,6).map(aiCard).join('')}</div></section>`}
function discover(purpose=''){
 const p=purpose&&D.purposes[purpose]?D.purposes[purpose]:null;
 const taskCards=Object.entries(D.purposes).map(([key,v],i)=>`<button class="task-card ${purpose===key?'selected':''}" data-purpose="${key}"><span>0${i+1}</span><strong>${v.title}</strong><em>${v.text}</em><small>Find intelligence for this purpose →</small></button>`).join('');
 if(!p)return `<div class="discover-intro"><div class="discover-copy"><p class="eyebrow">TASK FIRST</p><h2>WHAT ARE YOU<br><span>TRYING TO DO?</span></h2><p class="muted">Choose the outcome first. ORÍKÌ will identify the intelligence systems whose capabilities best match the task.</p></div><div class="task-grid">${taskCards}</div></div>`;
 const matches=recommend(purpose);
 return `<div class="discover-intro active"><div class="discover-copy"><p class="eyebrow">${p.title} INTELLIGENCE</p><h2>THE RIGHT<br><span>INTELLIGENCE.</span></h2><p class="muted">${p.text} ORÍKÌ has narrowed the catalogue using purpose and capability matches.</p><button class="text-btn discover-ai-btn" data-purpose="${purpose}">VIEW FULL INTELLIGENCE CATALOGUE →</button></div><div class="task-grid">${taskCards}</div></div><section class="recommendation"><div class="section-mini"><p class="eyebrow">ORÍKÌ RECOMMENDS</p><h3>INTELLIGENCE FOR ${p.title}</h3><span>${matches.length} matching systems</span></div><div class="library-grid">${matches.slice(0,6).map(aiCard).join('')}</div></section>`;
}
function recommend(purpose){const p=D.purposes[purpose];if(!p)return D.ais;return D.ais.filter(ai=>ai.purposes.includes(purpose)||p.capabilities.some(c=>ai.capabilities.includes(c))).sort((a,b)=>score(b,purpose)-score(a,purpose));}
function score(ai,purpose){const p=D.purposes[purpose];return (ai.purposes.includes(purpose)?5:0)+ai.capabilities.filter(c=>p.capabilities.includes(c)).length;}
function library(){return `<div class="library-toolbar"><input id="librarySearch" placeholder="Search intelligence, provider, type or capability..." aria-label="Search intelligence catalogue"><select class="library-filter" id="typeFilter" aria-label="Filter by type"><option value="">ALL TYPES</option>${[...new Set(D.ais.map(a=>a.type))].sort().map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x).toUpperCase()}</option>`).join('')}</select><select class="library-filter" id="capFilter" aria-label="Filter by capability"><option value="">ALL CAPABILITIES</option>${Object.keys(D.capabilityMeta).sort().map(x=>`<option value="${x}">${x.toUpperCase()}</option>`).join('')}</select><select class="library-filter" id="purposeFilter" aria-label="Filter by purpose"><option value="">ALL PURPOSES</option>${Object.keys(D.purposes).map(x=>`<option value="${x}">${x.toUpperCase()}</option>`).join('')}</select></div><div class="library-summary"><span><b id="libraryCount">${D.ais.length}</b> INTELLIGENCE SYSTEMS</span><span>FILTER THE LANDSCAPE BY TYPE, CAPABILITY OR PURPOSE</span></div><div class="library-grid" id="libraryGrid">${D.ais.map(aiCard).join('')}</div>`}
function filterLibrary(){const q=($('#librarySearch')?.value||'').toLowerCase().trim();const type=$('#typeFilter')?.value||'';const cap=$('#capFilter')?.value||'';const purpose=$('#purposeFilter')?.value||'';const ais=D.ais.filter(a=>{const text=(a.name+' '+a.provider+' '+a.type+' '+a.category+' '+a.description+' '+a.capabilities.join(' ')).toLowerCase();return (!q||text.includes(q))&&(!type||a.type===type)&&(!cap||a.capabilities.includes(cap))&&(!purpose||a.purposes.includes(purpose));});const grid=$('#libraryGrid');if(!grid)return;$('#libraryCount').textContent=ais.length;grid.innerHTML=ais.length?ais.map(aiCard).join(''):'<div class="empty">No intelligence matched those filters.</div>';bindDynamic();}
function compare(){let selected=['chatgpt','claude','gemini'];return `<div class="compare-intro"><p class="eyebrow">INTELLIGENCE BENCH</p><h2>COMPARE THE LANDSCAPE.</h2><p class="muted">Select systems to compare their declared capabilities. ORÍKÌ shows capability coverage rather than pretending there is one universal score.</p></div><div class="compare-select">${D.ais.slice(0,12).map(ai=>`<button class="compare-chip ${selected.includes(ai.id)?'active':''}" data-id="${ai.id}">${escapeHtml(ai.name)}</button>`).join('')}</div><div id="compareTable">${compareTable(selected)}</div>`}
function getSelected(){return $$('.compare-chip.active').map(b=>b.dataset.id);}
function toggleCompare(id){const selected=getSelected();if(selected.includes(id)){if(selected.length<=2)return;selected.splice(selected.indexOf(id),1);}else{if(selected.length>=4)return;selected.push(id);}$$('.compare-chip').forEach(b=>b.classList.toggle('active',selected.includes(b.dataset.id)));$('#compareTable').innerHTML=compareTable(selected);}
function compareTable(ids){const ais=ids.map(id=>D.ais.find(a=>a.id===id)).filter(Boolean);return `<table class="compare-table"><thead><tr><th>CAPABILITY</th>${ais.map(a=>`<th>${escapeHtml(a.name)}</th>`).join('')}</tr></thead><tbody>${Object.keys(D.capabilityMeta).map(cap=>`<tr><td><b>${cap.toUpperCase()}</b><small>${D.capabilityMeta[cap]}</small></td>${ais.map(a=>`<td>${a.capabilities.includes(cap)?'<span class="coverage yes">●</span>':'<span class="coverage">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function collection(ids,empty){const ais=ids.map(id=>D.ais.find(a=>a.id===id)).filter(Boolean);return ais.length?`<div class="library-grid">${ais.map(aiCard).join('')}</div>`:`<div class="empty">${empty}<br><br>Explore Intelligence to add systems here.</div>`}
function workspace(){return `<div class="dash-card"><p class="eyebrow">YOUR WORKSPACE</p><h2>Built for the next stage.</h2><p class="muted">Your saved intelligence and future AI sessions will live here as ORÍKÌ evolves.</p><div class="workspace-points"><span>Favourites are stored locally.</span><span>Recent intelligence is tracked locally.</span><span>No API keys are required at this stage.</span></div></div>`}
function categories(){return `<div class="category-grid">${Object.entries(D.capabilityMeta).map(([key,text])=>`<button class="dash-card category-card" data-capability="${key}"><p class="eyebrow">CAPABILITY</p><h3>${key.toUpperCase()}</h3><p class="muted">${text}</p><span class="category-count">${D.ais.filter(a=>a.capabilities.includes(key)).length} systems →</span></button>`).join('')}</div>`}
function about(){return `<div class="dash-card" style="max-width:850px"><p class="eyebrow">ORÍKÌ</p><h2>KNOW YOUR INTELLIGENCE.</h2><p class="muted">ORÍKÌ is a discovery and decision layer for the expanding world of artificial intelligence. It helps you understand what exists, what each system is good at, and where to begin.</p><p class="muted">The intelligence catalogue is structured by purpose, type and capability so the platform can evolve from a directory into a recommendation layer.</p></div>`}
function toggleFav(id){if(favourites.includes(id))favourites=favourites.filter(x=>x!==id);else favourites.push(id);localStorage.setItem('oriki-favourites',JSON.stringify(favourites));showPage(currentPage,activePurpose)}
function openAI(id){const ai=D.ais.find(a=>a.id===id);if(!ai)return;if(!recent.includes(id))recent=[id,...recent].slice(0,8);localStorage.setItem('oriki-recent',JSON.stringify(recent));window.open(ai.url,'_blank','noopener,noreferrer')}
function openSearch(){const m=$('#searchModal');m.classList.remove('hidden');$('#searchInput').focus();search('')}
function closeSearch(){$('#searchModal').classList.add('hidden')}
function search(q){const box=$('#searchResults');if(!q){box.innerHTML='<p class="muted">Search by AI name, provider, capability or task.</p>';return}const r=D.ais.filter(a=>(a.name+' '+a.provider+' '+a.type+' '+a.category+' '+a.description+' '+a.capabilities.join(' ')).toLowerCase().includes(q.toLowerCase()));box.innerHTML=r.length?r.slice(0,12).map(a=>`<div class="search-result"><b>${escapeHtml(a.name)}</b><span>${escapeHtml(a.provider)} · ${escapeHtml(a.type)}</span></div>`).join(''):'<p class="muted">No results.</p>'}
