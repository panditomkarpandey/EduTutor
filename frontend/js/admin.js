// admin.js  –  Admin panel helpers (imported by admin.html)
// All functions are globally scoped so inline onclick= handlers work.

'use strict';

/* ── Drag-and-drop upload ───────────────────────────────────────────────── */
window.handleDrop = function(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('upload-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) window.setFile(file);
};

window.handleDragOver = function(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
};

window.handleDragLeave = function() {
  document.getElementById('upload-zone').classList.remove('drag-over');
};

window.onFileSelected = function() {
  const inp = document.getElementById('pdf-input');
  if (inp.files[0]) window.setFile(inp.files[0]);
};

window.setFile = function(file) {
  const MAX_MB = 50;
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Only PDF files are allowed', 'error');
    return;
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    showToast(`File too large (max ${MAX_MB}MB)`, 'error');
    return;
  }
  window._selectedFile = file;
  document.getElementById('file-info').classList.remove('hidden');
  document.getElementById('file-name').textContent =
    `${file.name}  (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  const titleInput = document.getElementById('tb-title');
  if (!titleInput.value) {
    titleInput.value = file.name.replace(/\.pdf$/i, '');
  }
};


/* ── Upload textbook ────────────────────────────────────────────────────── */
window.uploadTextbook = async function() {
  const file = window._selectedFile;
  if (!file) { showToast('Please select a PDF file first', 'error'); return; }

  const title = document.getElementById('tb-title').value.trim();
  if (!title) { showToast('Please enter a title', 'error'); return; }

  const btn = document.getElementById('upload-btn');
  setLoading(btn, true);

  const progress = document.getElementById('upload-progress');
  const progBar  = document.getElementById('prog-bar');
  const progText = document.getElementById('upload-status');
  const msgEl    = document.getElementById('upload-msg');

  progress.style.display = 'block';
  msgEl.classList.add('hidden');

  // Animated fake progress (real work happens server-side)
  const steps = [
    [0,  'Uploading PDF…'],
    [25, 'Extracting text…'],
    [50, 'Detecting chapters…'],
    [70, 'Generating embeddings…'],
    [90, 'Storing in MongoDB…'],
  ];
  let stepIdx = 0;
  const interval = setInterval(() => {
    if (stepIdx < steps.length) {
      const [pct, msg] = steps[stepIdx++];
      progBar.style.width = pct + '%';
      progText.textContent = msg;
    }
  }, 700);

  try {
    const form = new FormData();
    form.append('file',       file);
    form.append('title',      title);
    form.append('board',      document.getElementById('tb-board').value);
    form.append('class_name', document.getElementById('tb-class').value);
    form.append('subject',    document.getElementById('tb-subject').value);

    const data = await apiFetch('/admin/upload-textbook', { method: 'POST', body: form });

    clearInterval(interval);
    progBar.style.width = '100%';
    progText.textContent = 'Upload complete — processing in background…';

    msgEl.classList.remove('hidden');
    msgEl.innerHTML = `<div class="alert alert--success">
      ✅ ${escapeHtml(data.message)}<br>
      <span class="text-small">ID: ${data.textbook_id}</span>
    </div>`;

    window._selectedFile = null;
    document.getElementById('file-info').classList.add('hidden');
    document.getElementById('tb-title').value = '';
    document.getElementById('pdf-input').value = '';

    // Poll until ready
    _pollStatus(data.textbook_id, progBar, progText);

  } catch (err) {
    clearInterval(interval);
    progress.style.display = 'none';
    msgEl.classList.remove('hidden');
    msgEl.innerHTML = `<div class="alert alert--error">❌ ${escapeHtml(err.message)}</div>`;
  } finally {
    setLoading(btn, false);
  }
};

async function _pollStatus(id, bar, text) {
  for (let i = 0; i < 72; i++) {   // max 6 min (72 × 5s)
    await new Promise(r => setTimeout(r, 5000));
    try {
      const d = await apiFetch(`/admin/textbook-status/${id}`);
      text.textContent = `Status: ${d.status}  ·  ${d.chunk_count} chunks indexed`;
      if (d.status === 'ready') {
        bar.style.width = '100%';
        showToast(`✅ Textbook ready! ${d.chunk_count} chunks indexed.`, 'success');
        return;
      }
      if (d.status === 'error') {
        showToast('❌ Processing failed. Check the PDF and try again.', 'error');
        return;
      }
    } catch (_) { return; }
  }
}


/* ── Textbook table ─────────────────────────────────────────────────────── */
window.loadBooks = async function() {
  const wrap = document.getElementById('books-table-wrap');
  wrap.innerHTML = '<div class="text-soft text-center" style="padding:30px">Loading…</div>';
  try {
    const { textbooks } = await apiFetch('/admin/textbooks');
    if (!textbooks.length) {
      wrap.innerHTML = '<div class="text-soft text-center" style="padding:40px">No textbooks uploaded yet.</div>';
      return;
    }
    wrap.innerHTML = `
      <div style="overflow-x:auto">
        <table class="tb-table">
          <thead><tr>
            <th>Title</th><th>Board</th><th>Class</th><th>Subject</th>
            <th>Chunks</th><th>Status</th><th>Uploaded</th><th></th>
          </tr></thead>
          <tbody>
            ${textbooks.map(tb => `
              <tr>
                <td>
                  <strong>${escapeHtml(tb.title)}</strong><br>
                  <span class="text-small text-soft">${escapeHtml(tb.filename)}</span>
                </td>
                <td>${escapeHtml(tb.board)}</td>
                <td>${escapeHtml(tb.class_name)}</td>
                <td>${escapeHtml(tb.subject)}</td>
                <td>${tb.chunk_count}</td>
                <td><span class="status-${tb.status}">${tb.status}</span></td>
                <td class="text-small text-soft">${relativeTime(tb.created_at)}</td>
                <td>
                  <button class="btn btn--sm btn--danger"
                          onclick="deleteBook('${tb._id}', this)">Delete</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    wrap.innerHTML = `<div class="alert alert--error">${escapeHtml(err.message)}</div>`;
  }
};

window.deleteBook = async function(id, btn) {
  if (!confirm('Delete this textbook and ALL its embeddings? This cannot be undone.')) return;
  setLoading(btn, true);
  try {
    await apiFetch(`/admin/textbooks/${id}`, { method: 'DELETE' });
    showToast('Textbook deleted successfully', 'success');
    window.loadBooks();
  } catch (err) {
    showToast(err.message, 'error');
    setLoading(btn, false);
  }
};


/* ── Analytics ──────────────────────────────────────────────────────────── */
window.loadAnalytics = async function() {
  try {
    const data = await apiFetch('/analytics/dashboard');
    const o    = data.overview;

    setText('#st-students',  o.total_students);
    setText('#st-books',     o.total_textbooks);
    setText('#st-questions', o.total_questions);
    setText('#st-cache',     o.cache_ratio + '%');
    setText('#faq-count',    data.faq_cache.total_cached);
    setText('#faq-hits',     data.faq_cache.total_hits);
    setText('#avg-score',    o.avg_quiz_score + '%');
    setText('#total-chunks', o.total_chunks.toLocaleString());

    _renderBarChart('daily-chart', data.recent.daily,
      d => d._id.slice(5), d => d.count, 'var(--navy-light)');

    _renderBarChart('subject-chart', data.top_subjects,
      s => s.subject, s => s.count, 'var(--saffron)');

  } catch (err) {
    showToast('Analytics load failed: ' + err.message, 'error');
  }
};

function _renderBarChart(elId, rows, labelFn, valueFn, colour) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!rows || !rows.length) {
    el.innerHTML = '<div class="text-soft text-small">No data yet.</div>';
    return;
  }
  const max = Math.max(...rows.map(valueFn), 1);
  el.innerHTML = rows.map(r => `
    <div class="bar-row">
      <div class="bar-row__label">${escapeHtml(String(labelFn(r)).slice(0, 10))}</div>
      <div class="bar-row__track">
        <div class="bar-row__fill"
             style="width:${(valueFn(r) / max) * 100}%;background:${colour}">
        </div>
      </div>
      <div class="bar-row__val">${valueFn(r)}</div>
    </div>`).join('');
}


/* ── Students table ─────────────────────────────────────────────────────── */
window.loadStudents = async function() {
  const wrap = document.getElementById('students-table-wrap');
  wrap.innerHTML = '<div class="text-soft text-center" style="padding:30px">Loading…</div>';
  try {
    const { students } = await apiFetch('/analytics/students');
    if (!students.length) {
      wrap.innerHTML = '<div class="text-soft text-center" style="padding:40px">No students registered yet.</div>';
      return;
    }
    wrap.innerHTML = `
      <div style="overflow-x:auto">
        <table class="students-table">
          <thead><tr>
            <th>Name</th><th>Email</th><th>Language</th>
            <th>Joined</th><th>Last Login</th>
          </tr></thead>
          <tbody>
            ${students.map(s => `
              <tr>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td>${escapeHtml(s.email)}</td>
                <td><span class="badge badge--navy">${escapeHtml(s.language || 'en')}</span></td>
                <td class="text-small text-soft">${s.created_at  ? relativeTime(s.created_at)  : '–'}</td>
                <td class="text-small text-soft">${s.last_login  ? relativeTime(s.last_login)  : 'Never'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    wrap.innerHTML = `<div class="alert alert--error">${escapeHtml(err.message)}</div>`;
  }
};


/* ── Panel switcher ─────────────────────────────────────────────────────── */
window.switchAdminPanel = function(btn) {
  document.querySelectorAll('.admin-sidebar .nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.panel).classList.add('active');

  const actions = {
    'books-panel':     window.loadBooks,
    'analytics-panel': window.loadAnalytics,
    'students-panel':  window.loadStudents,
  };
  if (actions[btn.dataset.panel]) actions[btn.dataset.panel]();
};


/* ── Ollama health check ────────────────────────────────────────────────── */
window.checkOllamaHealth = async function() {
  const el = document.getElementById('ollama-status');
  el.textContent = 'Checking…';
  el.style.color  = 'var(--text-soft)';
  try {
    await apiFetch('/api/info');
    el.textContent = '✅  API is online';
    el.style.color = 'var(--green)';
  } catch (_) {
    el.textContent = '⚠️  API unreachable';
    el.style.color = '#c62828';
  }
};
