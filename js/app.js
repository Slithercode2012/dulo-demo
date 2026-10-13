// Simple multi-file static app logic with Admin UI
// - Loads data/movies.json
// - Renders Home, Movies, TV, My List
// - Search, pagination, modal player, localStorage My List
// - Admin panel to add movies (saved to localStorage) and export JSON

const DATA_URL = 'data/movies.json';
const PER_PAGE = 8;

let MOVIES = [];
let state = { route: 'home', query: '', page: 1, filterGenre: null };

// Helpers
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if(k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => { if(c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}

async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    MOVIES = await res.json();
  }catch(e){
    console.error('Failed to load movies.json', e);
    MOVIES = [];
  }
  // load admin additions from localStorage (so admin additions persist)
  const additions = getAdminAdditions();
  if(additions.length) MOVIES = MOVIES.concat(additions);
}

// My List persistence
const MYLIST_KEY = 'dulo_mylist_v1';
function getMyList(){ try{ return JSON.parse(localStorage.getItem(MYLIST_KEY) || '[]') }catch(e){ return [] } }
function toggleMyList(id){
  const list = getMyList();
  const idx = list.indexOf(id);
  if(idx >= 0) list.splice(idx,1); else list.push(id);
  localStorage.setItem(MYLIST_KEY, JSON.stringify(list));
  renderCurrentRoute();
}

// Admin additions persistence
const ADMIN_ADD_KEY = 'dulo_admin_additions_v1';
function getAdminAdditions(){ try{ return JSON.parse(localStorage.getItem(ADMIN_ADD_KEY) || '[]') }catch(e){ return [] } }
function saveAdminAdditions(arr){ localStorage.setItem(ADMIN_ADD_KEY, JSON.stringify(arr)); }
function addAdminMovie(obj){ const arr = getAdminAdditions(); arr.unshift(obj); saveAdminAdditions(arr); MOVIES.unshift(obj); }

// Rendering helpers
function createCard(movie){
  const card = el('article', { class: 'movie-card', tabindex: 0, 'data-id': movie.id });
  const img = el('img', { src: movie.img, alt: movie.title });
  const info = el('div', { class: 'movie-info' },
    el('div', { class: 'movie-name' }, movie.title),
    el('div', { class: 'movie-sub muted' }, `${movie.genre} • ${movie.duration}`)
  );
  card.appendChild(img);
  card.appendChild(info);
  card.addEventListener('click', ()=> openPlayer(movie));
  card.addEventListener('keydown', (e)=> { if(e.key === 'Enter') openPlayer(movie); });
  return card;
}

function openPlayer(movie){
  const iframe = qs('#playerIframe');
  const modal = qs('#modal');
  const vid = movie.video || '';
  iframe.src = vid ? `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0` : '';
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}

function closePlayer(){
  qs('#playerIframe').src = '';
  qs('#modal').classList.remove('open'); qs('#modal').setAttribute('aria-hidden','true');
}

// Renderers
function renderHero(featured){
  const hero = el('section', { class: 'hero page-section', id: 'hero' });
  const left = el('div', { style: 'flex:1' },
    el('div', { class: 'hero-copy' },
      el('div', { style: 'display:inline-block;background:rgba(255,255,255,0.06);padding:6px 12px;border-radius:999px;font-weight:700;font-size:.78rem;margin-bottom:10px' }, 'Now Streaming'),
      el('h1', {}, featured.title),
      el('div', { style: 'display:flex;gap:12px;align-items:center;color:var(--muted);margin-top:8px' },
         el('div', { class: 'muted' }, String(featured.year)),
         el('div', { class: 'muted' }, '•'),
         el('div', { class: 'muted' }, featured.genre),
         el('div', { class: 'muted' }, `• ${featured.duration}`)
      ),
      el('p', {}, featured.desc),
      el('div', { style: 'margin-top:18px;display:flex;gap:12px' },
        el('button', { class: 'btn btn-primary', onclick: () => openPlayer(featured) }, '▶ Watch Now'),
        el('button', { class: 'btn', onclick: () => toggleMyList(featured.id), style: 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.04)' }, '+ My List')
      )
    )
  );

  const poster = el('div', { class: 'hero-poster' }, el('img', { src: featured.img, alt: featured.title }));
  hero.appendChild(left); hero.appendChild(poster);
  return hero;
}

function paginate(items, page=1, per=PER_PAGE){
  const total = Math.max(1, Math.ceil(items.length / per));
  const start = (page-1) * per;
  return { items: items.slice(start, start + per), page, total };
}

function renderPager(page, total){
  const pager = el('div', { class: 'pager' });
  if(total <= 1) return pager;
  for(let p = 1; p <= total; p++){
    const btn = el('button', { onclick: () => { state.page = p; renderCurrentRoute(); }, class: p === page ? 'active' : '' }, String(p));
    pager.appendChild(btn);
  }
  return pager;
}

function renderHome(){
  const featured = MOVIES[0] || { title: 'No title', desc: '', img: '', year: '', genre: '', duration:'' };
  const container = el('div', {});
  container.appendChild(renderHero(featured));

  const contentWrap = el('div', { class: 'content' });
  const main = el('main', { class: 'main-col' });
  const side = el('aside', { class: 'side-col' });

  // Continue Watching (first 4)
  const contPanel = el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', { class: 'section-title' }, 'Continue Watching'), el('div', { class: 'muted' }, 'View all')),
    el('div', { id: 'continueList', class: 'horizontal-list' })
  );
  const contListEl = contPanel.querySelector('#continueList');
  MOVIES.slice(0,4).forEach(m => contListEl.appendChild(createCard(m)));

  // Trending (rest)
  const trendPanel = el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', { class: 'section-title' }, 'Trending Now'), el('div', { class: 'muted' }, 'Browse all')),
    el('div', { id: 'trendingList', class: 'horizontal-list' })
  );
  const trendingListEl = trendPanel.querySelector('#trendingList');
  MOVIES.forEach((m, idx) => {
    if(idx >= 4) trendingListEl.appendChild(createCard(m));
  });

  // Genres
  const genresPanel = el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', { class: 'section-title' }, 'Popular Genres')),
    el('div', { id: 'genresList', class: 'genres' })
  );
  const genres = [...new Set(MOVIES.map(m => m.genre))];
  genres.forEach(g => genresPanel.querySelector('#genresList').appendChild(el('span', { class: 'chip', onclick: () => { state.filterGenre = g; state.route='movies'; state.page=1; renderCurrentRoute(); } }, g)));

  // Side: Top 10
  const topPanel = el('div', { class: 'panel' },
    el('div', { class: 'section-title' }, 'Top 10 Today'),
    el('ul', { id: 'topList', class: 'rank-list' })
  );
  const topListEl = topPanel.querySelector('#topList');
  MOVIES.slice().sort((a,b)=>parseFloat(b.rating||0)-parseFloat(a.rating||0)).slice(0,10).forEach((m,i)=>{
    const li = el('li', { class: 'rank-item', onclick: () => openPlayer(m) },
      el('div', {}, el('div', { style: 'font-weight:700' }, `${i+1}. ${m.title}`), el('div', { class: 'muted', style: 'margin-top:4px' }, `${m.genre} • ${m.duration}`)),
      el('div', {}, m.rating || '—')
    );
    topListEl.appendChild(li);
  });

  main.appendChild(contPanel);
  main.appendChild(trendPanel);
  main.appendChild(genresPanel);

  side.appendChild(topPanel);
  side.appendChild(el('div', { class: 'panel' }, el('div', { class: 'section-title' }, 'Quick Picks'),
    el('div', { style: 'margin-top:10px;display:flex;flex-direction:column;gap:10px' },
      el('div', {}, el('strong', {}, 'Fresh Releases'), el('div', { class: 'muted' }, 'Updated today')),
      el('div', {}, el('strong', {}, 'Award Winners'), el('div', { class: 'muted' }, 'Top-rated picks')),
      el('div', {}, el('strong', {}, 'New TV Series'), el('div', { class: 'muted' }, 'Latest episodes'))
    )
  ));

  contentWrap.appendChild(main);
  contentWrap.appendChild(side);
  container.appendChild(contentWrap);
  return container;
}

function renderListPage(title, items){
  const container = el('div', {});
  container.appendChild(el('section', { class: 'panel' }, el('div', { class: 'section-head' }, el('div', { class: 'section-title' }, title), el('div', { class: 'muted' }, `${items.length} results`)),
    el('div', { id: 'listArea', class: 'horizontal-list' })
  ));

  const pag = paginate(items, state.page, PER_PAGE);
  const listArea = container.querySelector('#listArea');
  pag.items.forEach(m => listArea.appendChild(createCard(m)));
  container.appendChild(renderPager(pag.page, pag.total));
  return container;
}

function renderMyList(){
  const ids = getMyList();
  const items = MOVIES.filter(m => ids.includes(m.id));
  return renderListPage('My List', items);
}

function renderAdmin(){
  const container = el('div', {});
  const panel = el('section', { class: 'panel' },
    el('div', { class: 'section-head' }, el('div', { class: 'section-title' }, 'Admin — Add Movie'), el('div', { class: 'muted' }, 'Local admin (stored in your browser)')),
    el('form', { id: 'adminForm' },
      el('div', {}, 'Title', el('input', { name: 'title', required: true, style: 'width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text)' })),
      el('div', { style: 'margin-top:10px' }, 'Year', el('input', { name: 'year', type: 'number', style: 'width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text)' })),
      el('div', { style: 'margin-top:10px' }, 'Genre', el('input', { name: 'genre', style: 'width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text)' })),
      el('div', { style: 'margin-top:10px' }, 'Duration', el('input', { name: 'duration', placeholder: 'e.g. 1h 45m', style: 'width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text)' })),
      el('div', { style: 'margin-top:10px' }, 'Poster Image URL', el('input', { name: 'img', placeholder: 'https://...', style: 'width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text)' })),
      el('div', { style: 'margin-top:10px' }, 'YouTube Video ID', el('input', { name: 'video', placeholder: 'YouTube ID (e.g. dQw4w9WgXcQ)', required:true, style: 'width:100%;margin-top:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text)' })),
      el('div', { style: 'margin-top:10px;display:flex;gap:8px' },
        el('button', { type: 'submit', class: 'btn btn-primary' }, 'Add Movie'),
        el('button', { type: 'button', id: 'exportBtn', class: 'btn' }, 'Export JSON')
      )
    )
  );

  const listPanel = el('section', { class: 'panel', style: 'margin-top:12px' }, el('div', { class: 'section-title' }, 'Admin Additions (local)'), el('div', { id: 'adminList', style: 'margin-top:10px;display:flex;flex-direction:column;gap:8px' }));

  panel.querySelector('#adminForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const movie = {
      id: 'adm_' + Date.now(),
      title: (fd.get('title') || '').trim(),
      img: (fd.get('img') || '').trim() || 'https://via.placeholder.com/640x360?text=No+Image',
      desc: '',
      year: parseInt(fd.get('year')) || 2026,
      genre: (fd.get('genre') || 'Misc').trim(),
      duration: (fd.get('duration') || '').trim() || '1h 30m',
      rating: '',
      video: (fd.get('video') || '').trim(),
      type: 'movie'
    };
    addAdminMovie(movie);
    renderCurrentRoute();
    renderAdmin();
    e.target.reset();
    alert('Movie added locally. Use Export JSON to save or ask Copilot to commit it to the repo.');
  });

  panel.querySelector('#exportBtn').addEventListener('click', ()=>{
    const data = getAdminAdditions();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'admin-additions.json' });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  container.appendChild(panel);
  container.appendChild(listPanel);

  // populate admin list
  const adminListEl = container.querySelector('#adminList');
  const arr = getAdminAdditions();
  if(arr.length === 0) adminListEl.appendChild(el('div', { class: 'muted' }, 'No local additions yet.'));
  arr.forEach(m => {
    const row = el('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:rgba(255,255,255,0.02)' },
      el('div', {}, el('div', { style: 'font-weight:700' }, m.title), el('div', { class: 'muted' }, `${m.genre} • ${m.duration}`)),
      el('div', {}, el('button', { class: 'btn', onclick: () => { navigator.clipboard.writeText(JSON.stringify(m)); alert('Single movie JSON copied to clipboard'); } }, 'Copy'), el('button', { class: 'btn', style: 'margin-left:8px', onclick: () => { const arr = getAdminAdditions().filter(x=>x.id!==m.id); saveAdminAdditions(arr); MOVIES = MOVIES.filter(x=>x.id!==m.id); renderAdmin(); renderCurrentRoute(); } }, 'Remove'))
    );
    adminListEl.appendChild(row);
  });

  return container;
}

// Router / main render
function renderCurrentRoute(){
  const app = qs('#app');
  app.innerHTML = '';
  let route = state.route || 'home';
  // apply search & filter
  const q = (state.query || '').trim().toLowerCase();

  if(route === 'home'){
    app.appendChild(renderHome());
  } else if(route === 'mylist'){
    app.appendChild(renderMyList());
  } else if(route === 'admin'){
    app.appendChild(renderAdmin());
  } else {
    // movies/tv/new/top = different filtered lists. For demo we filter by genre if set.
    let items = MOVIES.slice();
    if(state.filterGenre) items = items.filter(m => m.genre === state.filterGenre);
    if(route === 'tv') items = items.filter(m => m.type === 'tv');
    if(route === 'new') items = items.filter(m => m.year >= 2024);
    if(route === 'top') items = items.sort((a,b)=>parseFloat(b.rating||0)-parseFloat(a.rating||0));
    if(q) items = items.filter(m => m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
    app.appendChild(renderListPage(route.charAt(0).toUpperCase() + route.slice(1), items));
  }

  // update active nav link
  qsa('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.route === route));
}

// Event wiring
function setupEvents(){
  // nav
  qsa('.nav-link').forEach(a => a.addEventListener('click', (ev) => {
    ev.preventDefault();
    const route = a.dataset.route;
    state.route = route;
    state.page = 1;
    history.pushState({route}, '', `#${route}`);
    renderCurrentRoute();
  }));

  // search
  const searchInput = qs('#searchInput');
  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.query = searchInput.value || '';
      state.page = 1;
      renderCurrentRoute();
    }, 180);
  });

  // modal close
  qs('#closePlayer').addEventListener('click', closePlayer);
  qs('#modal').addEventListener('click', (e) => { if(e.target === qs('#modal')) closePlayer(); });
  document.addEventListener('keydown', (e)=> { if(e.key === 'Escape') closePlayer(); });

  // sign-in demo
  qs('#signinBtn').addEventListener('click', ()=> alert('Demo: sign-in not implemented. Replace with your auth flow.'));
  // handle back/forward
  window.addEventListener('popstate', () => {
    const route = (location.hash || '#home').replace('#','') || 'home';
    state.route = route;
    renderCurrentRoute();
  });
}

// Init
async function init(){
  await loadData();
  setupEvents();
  // initial route from hash
  state.route = (location.hash || '#home').replace('#','') || 'home';
  renderCurrentRoute();
}

init();
