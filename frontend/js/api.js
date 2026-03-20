// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = window.API_BASE || '/api';

// ── Token Management ──────────────────────────────────────────────────────────
const Auth = {
  getToken()  { return localStorage.getItem('edu_token'); },
  getRole()   { return localStorage.getItem('edu_role'); },
  getName()   { return localStorage.getItem('edu_name'); },
  setSession(token, role, name) {
    localStorage.setItem('edu_token', token);
    localStorage.setItem('edu_role', role);
    localStorage.setItem('edu_name', name);
  },
  clearSession() {
    localStorage.removeItem('edu_token');
    localStorage.removeItem('edu_role');
    localStorage.removeItem('edu_name');
  },
  isLoggedIn()  { return !!this.getToken(); },
  isAdmin()     { return this.getRole() === 'admin'; },
  requireAuth(redirectTo) {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo || '/login.html';
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
};

// ── HTTP Client ───────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  let body = options.body;

  // If FormData, remove Content-Type so browser sets boundary
  if (body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, { ...options, headers, body });

  if (res.status === 401) {
    Auth.clearSession();
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.detail || data.message || `Error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return data;
}

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(msg, type = 'default', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }
function show(el)   { if (el) el.classList.remove('hidden'); }
function hide(el)   { if (el) el.classList.add('hidden'); }
function setText(sel, val) { const el = $(sel); if (el) el.textContent = val; }
function setHTML(sel, val) { const el = $(sel); if (el) el.innerHTML = val; }

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Loading state helpers ─────────────────────────────────────────────────────
function setLoading(btn, loading, text = '') {
  if (!btn) return;
  if (loading) {
    btn._origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span>`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._origText || text;
    btn.disabled = false;
  }
}

// ── Tab switcher ──────────────────────────────────────────────────────────────
function initTabs(containerSel) {
  const container = $(containerSel);
  if (!container) return;
  $$('.tab-btn', container).forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn', container).forEach(b => b.classList.remove('active'));
      $$('.tab-panel', container).forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $(`#${btn.dataset.tab}`, container);
      if (panel) panel.classList.add('active');
    });
  });
}

// ── Navbar setup ──────────────────────────────────────────────────────────────
function setupNavbar() {
  const name = Auth.getName() || '?';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const navUser = document.getElementById('nav-user');
  const navName = document.getElementById('nav-name');
  const navAvatar = document.getElementById('nav-avatar');
  const logoutBtn = document.getElementById('logout-btn');

  if (navName) navName.textContent = name;
  if (navAvatar) navAvatar.textContent = initials;
  if (navUser) show(navUser);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clearSession();
      window.location.href = '/login.html';
    });
  }
}

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Language preference ───────────────────────────────────────────────────────
function getLanguage() {
  return localStorage.getItem('edu_lang') || 'en';
}
function setLanguage(lang) {
  localStorage.setItem('edu_lang', lang);
}
