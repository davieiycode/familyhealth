// ===== FamilyHealth PWA — Full CRUD + Google Sheets Sync =====
(function() {
  'use strict';

  // ===== DOM HELPERS =====
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  const generateId = uid;

  // ===== DATA LAYER (localStorage) =====
  const DB = {
    _get(key) { try { return JSON.parse(localStorage.getItem('fh_' + key) || '[]'); } catch { return []; } },
    _set(key, arr) { localStorage.setItem('fh_' + key, JSON.stringify(arr)); },
    
    // ---- Entries (generic health entries) ----
    entries: {
      getAll() { return DB._get('entries'); },
      add(entry) { const all = DB._get('entries'); entry.id = entry.id || uid(); entry.date = entry.date || new Date().toISOString(); all.unshift(entry); DB._set('entries', all); return entry; },
      update(id, data) { const all = DB._get('entries'); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('entries', all); } return all[i]; },
      delete(id) { DB._set('entries', DB._get('entries').filter(e => e.id !== id)); },
    },

    // ---- Growth ----
    growth: {
      getAll() { return DB._get('growth'); },
      add(entry) { const all = DB._get('growth'); entry.id = entry.id || uid(); entry.date = entry.date || new Date().toISOString(); all.unshift(entry); DB._set('growth', all); return entry; },
      update(id, data) { const all = DB._get('growth'); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('growth', all); } return all[i]; },
      delete(id) { DB._set('growth', DB._get('growth').filter(e => e.id !== id)); },
    },

    // ---- Symptoms ----
    symptoms: {
      getAll() { return DB._get('symptoms'); },
      add(entry) { const all = DB._get('symptoms'); entry.id = entry.id || uid(); entry.date = entry.date || new Date().toISOString(); all.unshift(entry); DB._set('symptoms', all); return entry; },
      update(id, data) { const all = DB._get('symptoms'); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('symptoms', all); } return all[i]; },
      delete(id) { DB._set('symptoms', DB._get('symptoms').filter(e => e.id !== id)); },
    },

    // ---- Medications ----
    medications: {
      getAll() { return DB._get('medications'); },
      add(entry) { const all = DB._get('medications'); entry.id = entry.id || uid(); entry.date = entry.date || new Date().toISOString(); all.unshift(entry); DB._set('medications', all); return entry; },
      update(id, data) { const all = DB._get('medications'); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('medications', all); } return all[i]; },
      delete(id) { DB._set('medications', DB._get('medications').filter(e => e.id !== id)); },
    },

    // ---- Vitals ----
    vitals: {
      getAll() { return DB._get('vitals'); },
      add(entry) { const all = DB._get('vitals'); entry.id = entry.id || uid(); entry.date = entry.date || new Date().toISOString(); all.unshift(entry); DB._set('vitals', all); return entry; },
      update(id, data) { const all = DB._get('vitals'); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('vitals', all); } return all[i]; },
      delete(id) { DB._set('vitals', DB._get('vitals').filter(e => e.id !== id)); },
    },

    // ---- Vaccines ----
    vaccines: {
      getAll() { return DB._get('vaccines'); },
      add(entry) { const all = DB._get('vaccines'); entry.id = entry.id || uid(); entry.date = entry.date || new Date().toISOString(); all.unshift(entry); DB._set('vaccines', all); return entry; },
      update(id, data) { const all = DB._get('vaccines'); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('vaccines', all); } return all[i]; },
      delete(id) { DB._set('vaccines', DB._get('vaccines').filter(e => e.id !== id)); },
    },

    // ---- Children ----
    children: {
      getAll() { 
        let all = DB._get('children'); 
        if (all.length === 0) {
          all = [
            { id: '1', name: 'Ahmad Rafiei Jr.', birthDate: '2024-01-12', gender: 'boy' },
            { id: '2', name: 'Aisyah Rafiei', birthDate: '2025-09-12', gender: 'girl' }
          ];
          DB._set('children', all);
        }
        return all;
      },
      add(entry) { const all = DB.children.getAll(); entry.id = entry.id || uid(); all.push(entry); DB._set('children', all); return entry; },
      update(id, data) { const all = DB.children.getAll(); const i = all.findIndex(e => e.id === id); if (i >= 0) { Object.assign(all[i], data); DB._set('children', all); } return all[i]; },
      delete(id) { DB._set('children', DB.children.getAll().filter(e => e.id !== id)); },
    },

    // ---- Google Sheets URL ----
    getSheetUrl() { return localStorage.getItem('fh_sheets_url') || ''; },
    setSheetUrl(url) { localStorage.setItem('fh_sheets_url', url); },
  };

  // ===== GOOGLE SHEETS SYNC =====
  const Sheets = {
    async ping() {
      const url = DB.getSheetUrl();
      if (!url) return { success: false, error: 'URL belum diatur' };
      try {
        const resp = await fetch(url + '?action=ping');
        return await resp.json();
      } catch (e) { return { success: false, error: e.message }; }
    },

    async push(sheetName, data) {
      const url = DB.getSheetUrl();
      if (!url) return { success: false, error: 'URL belum diatur' };
      try {
        const resp = await fetch(url + '?action=bulkSync', { method: 'POST', body: JSON.stringify({ sheets: { [sheetName]: data } }), headers: { 'Content-Type': 'text/plain' } });
        return await resp.json();
      } catch (e) { return { success: false, error: e.message }; }
    },

    async syncAll() {
      const url = DB.getSheetUrl();
      if (!url) { showSnackbar('⚠️ URL Google Sheets belum diatur'); return; }
      
      showSnackbar('🔄 Menyinkronkan ke Google Sheets...');
      const syncBtn = $('#btnSyncSheets');
      if (syncBtn) { syncBtn.disabled = true; syncBtn.innerHTML = '<span class="material-symbols-rounded rotating">sync</span> Sinkronkan...'; }
      
      try {
        const payload = {
          data: {
            Entries: DB.entries.getAll(),
            Growth: DB.growth.getAll(),
            Symptoms: DB.symptoms.getAll(),
            Medications: DB.medications.getAll(),
            Vitals: DB.vitals.getAll(),
            Vaccines: DB.vaccines.getAll(),
          }
        };
        const resp = await fetch(url + '?action=sync', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
        const result = await resp.json();
        
        if (result.success) {
          // Update local with merged data from server
          if (result.results) {
            Object.entries(result.results).forEach(([sheet, data]) => {
              if (data.remoteData) {
                const key = sheet.toLowerCase();
                DB._set(key, data.remoteData);
              }
            });
          }
          localStorage.setItem('fh_last_sync', new Date().toISOString());
          updateSyncStatus();
          showSnackbar('✅ Sinkronisasi berhasil!');
        } else {
          showSnackbar('❌ Gagal: ' + (result.error || 'Unknown'));
        }
      } catch (e) {
        showSnackbar('❌ Gagal sinkronisasi: ' + e.message);
      } finally {
        if (syncBtn) { syncBtn.disabled = false; syncBtn.innerHTML = '<span class="material-symbols-rounded">sync</span> Sinkronkan'; }
      }
    },

    async pull(sheetName) {
      const url = DB.getSheetUrl();
      if (!url) return [];
      try {
        const resp = await fetch(url + '?action=getAll&sheet=' + sheetName);
        const result = await resp.json();
        return result.success ? result.data : [];
      } catch { return []; }
    }
  };

  // ===== SERVICE WORKER =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // ===== NAVIGATION =====
  const navItems = $$('.nav-item');
  const sidebarItems = $$('.sidebar__item');
  const pages = $$('.page');

  function navigateTo(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    navItems.forEach(n => { n.classList.remove('active'); const icon = $('span.material-symbols-rounded', n); if (icon) icon.style.fontVariationSettings = ''; });
    sidebarItems.forEach(s => s.classList.remove('active'));
    const page = $(`#${pageId}`);
    if (page) page.classList.add('active');
    const navItem = $(`.nav-item[data-page="${pageId}"]`);
    if (navItem) { navItem.classList.add('active'); const icon = $('span.material-symbols-rounded', navItem); if (icon) icon.style.fontVariationSettings = "'FILL' 1"; }
    const sideItem = $(`.sidebar__item[data-page="${pageId}"]`);
    if (sideItem) sideItem.classList.add('active');
    const topTitle = $('.top-bar__title');
    const titles = { pageHome:'Family<span>Health</span>', pageChild:'Tumbuh <span>Kembang</span>', pageVaccine:'Jadwal <span>Imunisasi</span>', pageSymptoms:'Gejala & <span>Symptom</span>', pageHabits:'Kebiasaan <span>Harian</span>', pageVitals:'Vital <span>Signs</span>', pageArticles:'Artikel <span>Kesehatan</span>', pageProfile:'Profil <span>Keluarga</span>' };
    if (topTitle && titles[pageId]) topTitle.innerHTML = titles[pageId];
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { observeAnimatedElements(); renderDynamicLists(); }, 100);
  }

  navItems.forEach(item => item.addEventListener('click', () => navigateTo(item.dataset.page)));
  sidebarItems.forEach(item => item.addEventListener('click', () => navigateTo(item.dataset.page)));

  $$('.quick-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const map = { child:'pageChild', vaccine:'pageVaccine', symptom:'pageSymptoms', medication:'pageHome', habits:'pageHabits', vitals:'pageVitals', growth:'pageChild', articles:'pageArticles' };
      const page = map[btn.dataset.action]; if (page) navigateTo(page);
    });
  });

  $$('.section-header__action').forEach(btn => {
    btn.addEventListener('click', () => { if (btn.dataset.action === 'articles') navigateTo('pageArticles'); });
  });

  $('#btnAvatar')?.addEventListener('click', () => navigateTo('pageProfile'));

  // ===== GREETING =====
  function updateGreeting() {
    const h = new Date().getHours(); const el = $('#greetingText'); if (!el) return;
    if (h < 10) el.textContent = 'Selamat Pagi ☀️'; else if (h < 15) el.textContent = 'Selamat Siang 🌤️';
    else if (h < 18) el.textContent = 'Selamat Sore 🌆'; else el.textContent = 'Selamat Malam 🌙';
  }
  updateGreeting();

  // ===== HEALTH SCORE =====
  function animateHealthScore() {
    const el = $('#healthScore'); const fill = $('#healthProgressFill'); if (!el) return;
    const target = 82; let current = 0;
    const timer = setInterval(() => { current += 2; if (current >= target) { current = target; clearInterval(timer); } el.textContent = current; if (fill) fill.style.width = current + '%'; }, 18);
  }
  setTimeout(animateHealthScore, 400);

  // ===== RENDER DYNAMIC LISTS =====
  function renderDynamicLists() {
    renderEntryList();
    renderSymptomHistory();
    renderMedicationList();
    renderGrowthHistory();
    renderVitalHistory();
    renderVaccineList();
    renderChildProfiles();
    renderTodaySummary();
  }

  // ---- Child Profiles ----
  function renderChildProfiles() {
    const containers = [$('#childProfiles'), $('#childProfilesGrowth')];
    const children = DB.children.getAll();
    
    containers.forEach(container => {
      if (!container) return;
      const activeId = $('.child-card.active-child', container)?.dataset.child || children[0]?.id;
      
      container.innerHTML = children.map(c => {
        const age = calculateAge(c.birthDate);
        const isActive = c.id === activeId;
        return `
          <div class="child-card ${isActive ? 'active-child' : ''} log-card--dynamic" data-child="${c.id}" data-id="${c.id}" data-store="children">
            <div class="child-avatar child-avatar--${c.gender}">${c.gender === 'boy' ? '👦' : '👧'}</div>
            <div class="child-info">
              <p class="child-info__name">${esc(c.name)}</p>
              <p class="child-info__age">${age}</p>
            </div>
            <div class="log-card__actions">
              <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${c.id}" data-store="children" title="Edit"><span class="material-symbols-rounded">edit</span></button>
              <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${c.id}" data-store="children" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
            </div>
          </div>
        `;
      }).join('');
      
      // Attach selection listener
      $$('.child-card', container).forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.log-card__actions')) return;
          $$('.child-card', container).forEach(c => c.classList.remove('active-child'));
          card.classList.add('active-child');
          showSnackbar(`👶 Profil ${$('p.child-info__name', card)?.textContent || ''} dipilih`);
        });
      });
      attachEntryListeners(container);
    });
  }

  function calculateAge(birthDate) {
    if (!birthDate) return 'Umur tidak diketahui';
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years > 0) return `${years} tahun ${months} bulan`;
    return `${months} bulan`;
  }

  // ---- Entry List (Home) ----
  function renderEntryList() {
    const container = $('#entryListDynamic');
    if (!container) return;
    const entries = DB.entries.getAll().slice(0, 10);
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded" style="font-size:48px;color:var(--md-outline)">inbox</span><p style="color:var(--md-on-surface-variant);font-size:0.82rem;margin-top:8px">Belum ada entri. Tekan + untuk menambah.</p></div>';
      return;
    }
    container.innerHTML = entries.map(e => `
      <div class="log-card log-card--dynamic" data-id="${e.id}" data-store="entries">
        <div class="log-card__icon log-card__icon--mood"><span class="material-symbols-rounded">${getEntryIcon(e.type)}</span></div>
        <div class="log-card__content">
          <p class="log-card__title">${esc(e.title)}</p>
          <p class="log-card__desc">${esc(e.notes || '')} • ${formatDate(e.date)}</p>
        </div>
        <span class="log-card__badge log-card__badge--info">${esc(e.type)}</span>
        <div class="log-card__actions">
          <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${e.id}" data-store="entries" title="Edit"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${e.id}" data-store="entries" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>
    `).join('');
    attachEntryListeners(container);
  }

  // ---- Symptom History ----
  function renderSymptomHistory() {
    const container = $('#symptomHistory');
    if (!container) return;
    const symptoms = DB.symptoms.getAll().slice(0, 10);
    if (symptoms.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded" style="font-size:36px;color:var(--md-outline)">health_and_safety</span><p style="color:var(--md-on-surface-variant);font-size:0.8rem;margin-top:8px">Belum ada riwayat gejala</p></div>';
      return;
    }
    container.innerHTML = symptoms.map(s => {
      const tagNames = { headache:'Sakit Kepala', fatigue:'Kelelahan', nausea:'Mual', pain:'Nyeri', dizzy:'Pusing', cough:'Batuk', fever:'Demam', insomnia:'Insomnia' };
      const tags = (Array.isArray(s.tags) ? s.tags : []).map(t => tagNames[t] || t).join(', ');
      return `
        <div class="log-card log-card--dynamic" data-id="${s.id}" data-store="symptoms">
          <div class="log-card__icon log-card__icon--mood"><span class="material-symbols-rounded">sick</span></div>
          <div class="log-card__content">
            <p class="log-card__title">${esc(tags || 'Gejala')}</p>
            <p class="log-card__desc">${esc(s.notes || '')} • ${formatDate(s.date)}</p>
          </div>
          <span class="log-card__badge log-card__badge--warning">Lv. ${s.severity}</span>
          <div class="log-card__actions">
            <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${s.id}" data-store="symptoms" title="Edit"><span class="material-symbols-rounded">edit</span></button>
            <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${s.id}" data-store="symptoms" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
          </div>
        </div>`;
    }).join('');
    attachEntryListeners(container);
  }

  // ---- Medication List ----
  function renderMedicationList() {
    const container = $('#medListDynamic');
    if (!container) return;
    const meds = DB.medications.getAll();
    if (meds.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = meds.map(m => `
      <div class="med-card" data-id="${m.id}" data-store="medications">
        <div class="med-card__pill"><span class="material-symbols-rounded">pill</span></div>
        <div class="med-card__info">
          <p class="med-card__name">${esc(m.name)}</p>
          <p class="med-card__dose">${esc(m.dose)}</p>
          <p class="med-card__time">${esc(m.time)}</p>
        </div>
        <button class="med-card__check ${m.taken ? 'taken' : ''}" data-id="${m.id}"><span class="material-symbols-rounded">check</span></button>
        <div class="log-card__actions">
          <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${m.id}" data-store="medications" title="Edit"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${m.id}" data-store="medications" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>`).join('');
    
    $$('.med-card__check', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const taken = !btn.classList.contains('taken');
        btn.classList.toggle('taken');
        DB.medications.update(id, { taken });
        showSnackbar(taken ? '✅ Obat ditandai sudah diminum' : 'Tanda obat dibatalkan');
      });
    });
    attachEntryListeners(container);
  }

  // ---- Growth History ----
  function renderGrowthHistory() {
    const container = $('#growthHistory');
    if (!container) return;
    const growths = DB.growth.getAll().slice(0, 10);
    if (growths.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded" style="font-size:36px;color:var(--md-outline)">show_chart</span><p style="color:var(--md-on-surface-variant);font-size:0.8rem;margin-top:8px">Belum ada data pertumbuhan tersimpan</p></div>';
      return;
    }
    container.innerHTML = growths.map(g => `
      <div class="log-card log-card--dynamic" data-id="${g.id}" data-store="growth">
        <div class="log-card__icon log-card__icon--child"><span class="material-symbols-rounded">monitoring</span></div>
        <div class="log-card__content">
          <p class="log-card__title">BB: ${g.weight}kg • TB: ${g.height}cm • LK: ${g.headCirc}cm</p>
          <p class="log-card__desc">${g.childName || 'Anak'} • ${formatDate(g.date)}</p>
        </div>
        <div class="log-card__actions">
          <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${g.id}" data-store="growth" title="Edit"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${g.id}" data-store="growth" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>`).join('');
    attachEntryListeners(container);
  }

  // ---- Vital History ----
  function renderVitalHistory() {
    const container = $('#vitalHistory');
    if (!container) return;
    const vitals = DB.vitals.getAll().slice(0, 10);
    if (vitals.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded" style="font-size:36px;color:var(--md-outline)">monitor_heart</span><p style="color:var(--md-on-surface-variant);font-size:0.8rem;margin-top:8px">Belum ada data vital tersimpan</p></div>';
      return;
    }
    container.innerHTML = vitals.map(v => `
      <div class="log-card log-card--dynamic" data-id="${v.id}" data-store="vitals">
        <div class="log-card__icon log-card__icon--exercise"><span class="material-symbols-rounded">monitor_heart</span></div>
        <div class="log-card__content">
          <p class="log-card__title">${esc(v.type)}: ${esc(v.value)} ${esc(v.unit || '')}</p>
          <p class="log-card__desc">${formatDate(v.date)}</p>
        </div>
        <div class="log-card__actions">
          <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${v.id}" data-store="vitals" title="Edit"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${v.id}" data-store="vitals" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>`).join('');
    attachEntryListeners(container);
  }

  // ---- Vaccine Dynamic List ----
  function renderVaccineList() {
    const container = $('#vaccineListDynamic');
    if (!container) return;
    const vacs = DB.vaccines.getAll();
    if (vacs.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = vacs.map(v => {
      const sc = v.status === 'done' ? 'done' : v.status === 'missed' ? 'missed' : 'upcoming';
      const label = v.status === 'done' ? '✓ Selesai' : v.status === 'missed' ? '⚠ Terlewat' : '⏰ Akan Datang';
      return `
        <div class="vaccine-card vaccine-card--${sc} log-card--dynamic" data-id="${v.id}" data-store="vaccines">
          <div class="vaccine-card__icon vaccine-card__icon--${sc}"><span class="material-symbols-rounded">vaccines</span></div>
          <div class="vaccine-card__info">
            <p class="vaccine-card__name">${esc(v.name)}</p>
            <p class="vaccine-card__detail">${esc(v.notes || '')} • ${formatDate(v.date)}</p>
          </div>
          <span class="vaccine-card__status vaccine-card__status--${sc}">${label}</span>
          <div class="log-card__actions">
            <button class="icon-btn icon-btn--sm btn-edit-entry" data-id="${v.id}" data-store="vaccines" title="Edit"><span class="material-symbols-rounded">edit</span></button>
            <button class="icon-btn icon-btn--sm btn-del-entry" data-id="${v.id}" data-store="vaccines" title="Hapus"><span class="material-symbols-rounded">delete</span></button>
          </div>
        </div>`;
    }).join('');
    attachEntryListeners(container);
  }

  // ===== SHARED VIEW/EDIT/DELETE LISTENERS =====
  function attachEntryListeners(container) {
    $$('.log-card--dynamic, .med-card, .vaccine-card', container).forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.log-card__actions') || e.target.closest('.med-card__check')) return;
        const { id, store } = card.dataset;
        if (id && store) openViewModal(id, store);
      });
    });

    $$('.btn-del-entry', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { id, store } = btn.dataset;
        openConfirmModal(id, store);
      });
    });
    $$('.btn-edit-entry', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { id, store } = btn.dataset;
        openEditModal(id, store);
      });
    });
  }

  // ===== VIEW MODAL =====
  function openViewModal(id, store) {
    if (!DB[store]) return;
    const item = DB[store].getAll().find(e => e.id === id);
    if (!item) return;

    const modal = $('#modalView');
    const container = $('#viewContentContainer');
    const title = $('#viewTitle');
    const icon = $('#viewIcon');
    if (!modal || !container) return;

    title.textContent = item.title || item.name || item.type || 'Detail Entry';
    icon.textContent = getEntryIcon(item.type || store);
    
    let html = `
      <div class="view-item"><span class="view-label">Waktu</span><span class="view-value">${formatDate(item.date)}</span></div>
    `;

    const exclude = ['id', 'date', 'synced', 'title', 'type'];
    Object.entries(item).forEach(([key, val]) => {
      if (exclude.includes(key)) return;
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      let displayVal = val;
      if (Array.isArray(val)) displayVal = val.join(', ');
      if (typeof val === 'boolean') displayVal = val ? 'Ya' : 'Tidak';
      
      html += `<div class="view-item"><span class="view-label">${esc(label)}</span><span class="view-value">${esc(String(displayVal || '-'))}</span></div>`;
    });

    container.innerHTML = html;
    
    const btnEdit = $('#btnEditFromView');
    btnEdit.onclick = () => { modal.classList.remove('open'); openEditModal(id, store); };

    modal.classList.add('open');
  }

  $('#btnCloseView')?.addEventListener('click', () => $('#modalView').classList.remove('open'));
  $('#modalView')?.addEventListener('click', (e) => { if (e.target === $('#modalView')) $('#modalView').classList.remove('open'); });

  // ===== CONFIRM DELETE MODAL =====
  function openConfirmModal(id, store) {
    const modal = $('#modalConfirm');
    if (!modal) return;
    modal.classList.add('open');
    const btnYes = $('#btnConfirmYes');
    const btnNo = $('#btnConfirmNo');
    const newBtnYes = btnYes.cloneNode(true);
    btnYes.replaceWith(newBtnYes);
    newBtnYes.addEventListener('click', () => {
      if (DB[store]) { DB[store].delete(id); }
      modal.classList.remove('open');
      renderDynamicLists();
      showSnackbar('🗑️ Data berhasil dihapus');
    });
    btnNo.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
  }

  // ===== EDIT MODAL =====
  function openEditModal(id, store) {
    if (!DB[store]) return;
    const all = DB[store].getAll();
    const item = all.find(e => e.id === id);
    if (!item) return;
    
    const modal = $('#modalEdit');
    if (!modal) return;
    
    // Populate fields
    $('#editId').value = id;
    $('#editStore').value = store;
    
    const fieldsContainer = $('#editFieldsContainer');
    fieldsContainer.innerHTML = '';
    
    const excludeKeys = ['id', 'date', 'synced'];
    Object.entries(item).forEach(([key, val]) => {
      if (excludeKeys.includes(key)) return;
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const displayVal = Array.isArray(val) ? val.join(', ') : (typeof val === 'boolean' ? (val ? 'Ya' : 'Tidak') : val);
      fieldsContainer.innerHTML += `
        <div class="input-field">
          <label class="input-field__label">${esc(label)}</label>
          <input class="input-field__input edit-field" data-key="${esc(key)}" value="${esc(String(displayVal || ''))}" placeholder="${esc(label)}">
        </div>`;
    });
    
    modal.classList.add('open');
  }

  // Save edit
  $('#btnSaveEdit')?.addEventListener('click', () => {
    const id = $('#editId')?.value;
    const store = $('#editStore')?.value;
    if (!id || !store || !DB[store]) return;
    
    const data = {};
    $$('.edit-field').forEach(field => {
      let val = field.value;
      const key = field.dataset.key;
      if (key === 'tags') val = val.split(',').map(s => s.trim()).filter(Boolean);
      else if (key === 'taken') val = val.toLowerCase() === 'ya' || val === 'true';
      else if (key === 'severity') val = parseInt(val) || 1;
      else if (['weight', 'height', 'headCirc', 'current', 'target'].includes(key)) val = parseFloat(val) || 0;
      data[key] = val;
    });
    
    DB[store].update(id, data);
    $('#modalEdit')?.classList.remove('open');
    renderDynamicLists();
    showSnackbar('✏️ Data berhasil diperbarui!');
  });

  $('#btnCancelEdit')?.addEventListener('click', () => $('#modalEdit')?.classList.remove('open'));
  $('#modalEdit')?.addEventListener('click', (e) => { if (e.target === $('#modalEdit')) $('#modalEdit')?.classList.remove('open'); });

  // ===== ADD MODAL LOGIC (TWO-STEP) =====
  let currentEntryType = '';

  // Open Step 1 (Picker)
  $('#fab')?.addEventListener('click', () => {
    const modal = $('#modalAdd');
    if (!modal) return;
    $('#entryStep1').style.display = 'block';
    $('#entryStep2').style.display = 'none';
    modal.classList.add('open');
  });

  // Handle Type Selection
  $$('.entry-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      currentEntryType = type;
      showEntryForm(type);
    });
  });

  // Back Button to Step 1
  $('#btnBackToTypes')?.addEventListener('click', () => {
    $('#entryStep1').style.display = 'block';
    $('#entryStep2').style.display = 'none';
  });

  function showEntryForm(type) {
    const container = $('#entryFormContainer');
    const title = $('#entryFormTitle');
    container.innerHTML = '';
    
    // Set title based on type
    const typeLabel = $(`.entry-type-btn[data-type="${type}"] .entry-type-label`)?.innerText || 'Form';
    title.innerText = typeLabel;

    // Generate specific form
    container.innerHTML = generateFormHtml(type);
    
    // Switch view
    $('#entryStep1').style.display = 'none';
    $('#entryStep2').style.display = 'block';
  }

  function generateFormHtml(type) {
    switch(type) {
      case 'tekanan_darah':
        return `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="input-field"><label class="input-field__label">Sistolik (Atas)</label><input class="input-field__input" id="inp_sys" type="number" placeholder="120"></div>
            <div class="input-field"><label class="input-field__label">Diastolik (Bawah)</label><input class="input-field__input" id="inp_dia" type="number" placeholder="80"></div>
          </div>
          <p style="font-size:0.75rem;color:var(--md-outline);margin-top:-8px">Normal: < 120/80 mmHg</p>
        `;
      case 'gula_darah':
        return `
          <div class="input-field"><label class="input-field__label">Nilai (mg/dL)</label><input class="input-field__input" id="inp_glucose" type="number" placeholder="95"></div>
          <div class="chip-group" style="margin-top:0"><button class="chip active chip-opt" data-val="Puasa">Puasa</button><button class="chip chip-opt" data-val="Sewaktu">Sewaktu</button><button class="chip chip-opt" data-val="2j PP">2j PP</button></div>
        `;
      case 'lab':
        return `
          <div class="lab-grid">
            <div class="lab-group-title">Hematologi</div>
            <div class="input-field"><label class="input-field__label">Hemoglobin</label><input class="input-field__input" id="lab_hb" placeholder="12.0 - 16.0"></div>
            <div class="input-field"><label class="input-field__label">Leukosit</label><input class="input-field__input" id="lab_leu" placeholder="5rb - 10rb"></div>
            <div class="lab-group-title">Profil Lipid</div>
            <div class="input-field"><label class="input-field__label">Kolesterol Total</label><input class="input-field__input" id="lab_chol" placeholder="< 200"></div>
            <div class="input-field"><label class="input-field__label">LDL</label><input class="input-field__input" id="lab_ldl" placeholder="< 130"></div>
            <div class="lab-group-title">Lainnya</div>
            <div class="input-field" style="grid-column: 1 / -1"><label class="input-field__label">Catatan Hasil Lain</label><textarea class="input-field__input" id="lab_notes" rows="2" placeholder="Sebutkan jenis dan nilai pemeriksaan lab lainnya..."></textarea></div>
          </div>
        `;
      case 'obat':
        return `
          <div class="input-field"><label class="input-field__label">Nama Obat/Suplemen</label><input class="input-field__input" id="inp_med_name" placeholder="cth: Paracetamol"></div>
          <div class="input-field"><label class="input-field__label">Dosis</label><input class="input-field__input" id="inp_med_dose" placeholder="cth: 500mg, 1 tablet"></div>
          <div class="input-field"><label class="input-field__label">Keterangan</label><input class="input-field__input" id="inp_med_notes" placeholder="cth: 3x1 setelah makan"></div>
        `;
      case 'pertumbuhan':
        return `
          <div class="input-field"><label class="input-field__label">Anak</label><select class="input-field__input" id="inp_child_id">${DB.children.getAll().map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="input-field"><label class="input-field__label">Berat (kg)</label><input class="input-field__input" id="inp_weight" type="number" step="0.1" placeholder="12.5"></div>
            <div class="input-field"><label class="input-field__label">Tinggi (cm)</label><input class="input-field__input" id="inp_height" type="number" step="0.1" placeholder="87"></div>
          </div>
        `;
      case 'children':
        return `
          <div class="input-field"><label class="input-field__label">Nama Lengkap</label><input class="input-field__input" id="inp_child_name" placeholder="cth: Ahmad Jr."></div>
          <div class="input-field"><label class="input-field__label">Tanggal Lahir</label><input class="input-field__input" id="inp_child_birth" type="date"></div>
          <div class="input-field"><label class="input-field__label">Jenis Kelamin</label><select class="input-field__input" id="inp_child_gender"><option value="boy">Laki-laki</option><option value="girl">Perempuan</option></select></div>
        `;
      default:
        return `<div class="input-field"><label class="input-field__label">Judul</label><input class="input-field__input" id="inp_def_title"></div><div class="input-field"><label class="input-field__label">Catatan</label><textarea class="input-field__input" id="inp_def_notes" rows="3"></textarea></div>`;
    }
  }

  // Handle Save Entry
  $('#btnSaveEntry')?.addEventListener('click', () => {
    const type = currentEntryType;
    let data = { id: generateId(), date: new Date().toISOString(), synced: false };

    if (type === 'tekanan_darah') {
      const sys = $('#inp_sys').value; const dia = $('#inp_dia').value;
      if (!sys || !dia) { showSnackbar('⚠️ Isi nilai tekanan darah'); return; }
      DB.vitals.add({ ...data, type: 'Tekanan Darah', value: `${sys}/${dia}`, unit: 'mmHg' });
    } else if (type === 'gula_darah') {
      const val = $('#inp_glucose').value; const cond = $('.chip-opt.active')?.innerText || '';
      if (!val) { showSnackbar('⚠️ Isi nilai gula darah'); return; }
      DB.vitals.add({ ...data, type: `Gula Darah (${cond})`, value: val, unit: 'mg/dL' });
    } else if (type === 'lab') {
      const note = $('#lab_notes').value || '';
      DB.entries.add({ ...data, type: 'Hasil Lab', title: 'Laboratorium', value: '📊 Tersimpan', notes: note });
    } else if (type === 'obat') {
      const name = $('#inp_med_name').value;
      if (!name) { showSnackbar('⚠️ Masukkan nama obat'); return; }
      DB.medications.add({ ...data, name, dose: $('#inp_med_dose').value || '1x sehari', time: 'Hari ini', taken: false, notes: $('#inp_med_notes').value || '' });
    } else if (type === 'gejala') {
      const title = $('#inp_sym_title').value;
      if (!title) { showSnackbar('⚠️ Masukkan gejala'); return; }
      const sev = parseInt($('.severity-dot.active', $('#inp_sym_severity_dynamic'))?.dataset.level || '1');
      DB.symptoms.add({ ...data, tags: [title.toLowerCase()], severity: sev, notes: '', area: 'Umum' });
    } else if (type === 'children') {
      const name = $('#inp_child_name').value;
      const bday = $('#inp_child_birth').value;
      if (!name || !bday) { showSnackbar('⚠️ Lengkapi data anak'); return; }
      DB.children.add({ ...data, name, birthDate: bday, gender: $('#inp_child_gender').value });
    } else if (type === 'pertumbuhan') {
      const cid = $('#inp_child_id').value;
      const w = $('#inp_weight').value;
      const h = $('#inp_height').value;
      const cname = DB.children.getAll().find(c => c.id === cid)?.name || 'Anak';
      DB.growth.add({ ...data, childId: cid, childName: cname, weight: w, height: h, headCirc: 0 });
    } else {
      const title = $('#inp_def_title')?.value || currentEntryType;
      DB.entries.add({ ...data, type: 'Umum', title, value: '', notes: $('#inp_def_notes')?.value || '' });
    }

    $('#modalAdd').classList.remove('open');
    renderDynamicLists();
    showSnackbar('✅ Entri berhasil disimpan!');
  });

  $('#btnCancelEntry')?.addEventListener('click', () => $('#modalAdd').classList.remove('open'));
  $('#modalAdd')?.addEventListener('click', (e) => { if (e.target === $('#modalAdd')) $('#modalAdd').classList.remove('open'); });

  // ===== SYMPTOM PAGE SAVE (Old UI still valid) =====
  $('#btnSaveSymptom')?.addEventListener('click', () => {
    const activeTags = $$('.symptom-tag.active').map(t => t.dataset.tag);
    const severity = parseInt($('.severity-dot.active')?.dataset.level || '1');
    const notes = $('#symptomNote')?.value || '';
    if (activeTags.length === 0 && !notes) { showSnackbar('⚠️ Pilih atau tulis gejala'); return; }
    DB.symptoms.add({ id: generateId(), date: new Date().toISOString(), tags: activeTags, severity, notes, area: 'Umum', synced: false });
    $$('.symptom-tag').forEach(t => t.classList.remove('active'));
    if ($('#symptomNote')) $('#symptomNote').value = '';
    renderDynamicLists();
    showSnackbar('✅ Gejala berhasil dicatat!');
  });

  // Common UI event for dynamic forms
  document.addEventListener('click', e => {
    if (e.target.classList.contains('severity-dot')) {
      const parent = e.target.parentElement;
      if (parent.classList.contains('severity-slider')) {
        $$('.severity-dot', parent).forEach(d => d.classList.remove('active'));
        e.target.classList.add('active');
      }
    }
  });

  // ===== GROWTH SAVE =====
  $('#btnSaveGrowth')?.addEventListener('click', () => {
    const inputs = $$('.growth-input .input-field__input');
    const weight = parseFloat(inputs[0]?.value) || 0;
    const height = parseFloat(inputs[1]?.value) || 0;
    const headCirc = parseFloat(inputs[2]?.value) || 0;
    if (!weight && !height && !headCirc) { showSnackbar('⚠️ Isi minimal satu data'); return; }
    const activeChild = $('.child-card.active-child');
    const childName = $('p.child-info__name', activeChild)?.textContent || 'Anak';
    DB.growth.add({ childId: activeChild?.dataset.child || '1', childName, weight, height, headCirc });
    inputs.forEach(inp => inp.value = '');
    renderGrowthHistory();
    showSnackbar('📊 Data pertumbuhan berhasil disimpan!');
  });

  // ===== VITAL SAVE =====
  $('#btnSaveVital')?.addEventListener('click', () => {
    const type = $('#vitalType')?.value || '';
    const value = $('#vitalValue')?.value || '';
    const unit = $('#vitalUnit')?.value || '';
    if (!value) { showSnackbar('⚠️ Masukkan nilai vital'); return; }
    DB.vitals.add({ type, value, unit });
    if ($('#vitalValue')) $('#vitalValue').value = '';
    renderVitalHistory();
    showSnackbar('❤️ Data vital berhasil disimpan!');
  });

  // ===== CHILD CARD SELECTION (already handled in render) =====

  // ===== MEDICATION (default) =====
  $$('.med-card__check').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('taken');
      showSnackbar(btn.classList.contains('taken') ? '✅ Obat ditandai sudah diminum' : 'Tanda obat dibatalkan');
    });
  });

  // ===== ADD CHILD =====
  $('#btnAddChild')?.addEventListener('click', () => {
    currentEntryType = 'children';
    const modal = $('#modalAdd');
    if (!modal) return;
    showEntryForm('children');
    modal.classList.add('open');
  });

  // ===== GOOGLE SHEETS SETTINGS =====
  $('#btnSaveSheetUrl')?.addEventListener('click', () => {
    const url = $('#inputSheetUrl')?.value?.trim();
    if (!url) { showSnackbar('⚠️ Masukkan URL Google Apps Script'); return; }
    DB.setSheetUrl(url);
    updateSyncStatus();
    showSnackbar('✅ URL berhasil disimpan! Coba sinkronkan.');
  });

  $('#btnTestConnection')?.addEventListener('click', async () => {
    const btn = $('#btnTestConnection');
    btn.disabled = true; btn.textContent = 'Testing...';
    const result = await Sheets.ping();
    btn.disabled = false; btn.textContent = 'Test Koneksi';
    if (result.success) {
      showSnackbar('✅ Koneksi berhasil! ' + (result.message || ''));
      $('#syncStatus')?.classList.add('connected');
      if ($('#syncStatusText')) $('#syncStatusText').textContent = 'Terhubung';
    } else {
      showSnackbar('❌ Gagal: ' + (result.error || 'Tidak dapat terhubung'));
    }
  });

  $('#btnSyncSheets')?.addEventListener('click', () => Sheets.syncAll());

  function updateSyncStatus() {
    const url = DB.getSheetUrl();
    const lastSync = localStorage.getItem('fh_last_sync');
    const statusEl = $('#syncStatusText');
    const inputEl = $('#inputSheetUrl');
    if (inputEl && url) inputEl.value = url;
    if (statusEl) {
      if (url) {
        statusEl.textContent = lastSync ? `Terakhir sync: ${formatDate(lastSync)}` : 'Siap sinkronkan';
        $('#syncStatus')?.classList.add('connected');
      } else {
        statusEl.textContent = 'Belum terhubung';
        $('#syncStatus')?.classList.remove('connected');
      }
    }
  }
  updateSyncStatus();

  // ===== CHARTS =====
  function renderBarChart(containerId, data, color) {
    const container = $(`#${containerId}`); if (!container) return;
    container.innerHTML = ''; const max = Math.max(...data);
    data.forEach((val, i) => {
      const bar = document.createElement('div'); bar.className = 'chart-bar'; bar.setAttribute('data-value', val);
      bar.style.height = '4px'; bar.style.background = color; bar.style.opacity = '0.85';
      container.appendChild(bar);
      setTimeout(() => { bar.style.height = `${(val / max) * 100}%`; }, 100 + i * 80);
    });
  }
  function renderLabels(containerId, labels) {
    const container = $(`#${containerId}`); if (!container) return;
    container.innerHTML = ''; labels.forEach(l => { const span = document.createElement('span'); span.textContent = l; container.appendChild(span); });
  }
  function renderMiniChart(containerId, data, color) {
    const container = $(`#${containerId}`); if (!container) return;
    container.innerHTML = ''; const max = Math.max(...data);
    data.forEach((val, i) => {
      const span = document.createElement('span'); span.style.height = '4px'; span.style.background = color; container.appendChild(span);
      setTimeout(() => { span.style.height = `${(val / max) * 100}%`; }, 50 + i * 40);
    });
  }

  setTimeout(() => {
    renderBarChart('sleepChart', [7.2, 6.8, 7.5, 8.0, 6.5, 7.8, 7.5], '#b4c9ff');
    renderLabels('sleepLabels', ['Sen','Sel','Rab','Kam','Jum','Sab','Min']);
    renderBarChart('stepsChart', [6200, 8400, 7100, 9200, 5600, 10400, 7800], '#7dd39a');
    renderLabels('stepsLabels', ['Sen','Sel','Rab','Kam','Jum','Sab','Min']);
    renderMiniChart('hrChart', [68, 72, 70, 75, 71, 69, 72, 74, 70, 72], '#f6b8d4');
    renderMiniChart('bpChart', [118, 122, 119, 125, 120, 117, 121, 120, 123, 120], '#7db8d3');
    renderMiniChart('spo2Chart', [97, 98, 97, 99, 98, 98, 97, 98, 99, 98], '#7dd3c0');
  }, 800);

  // ===== CHIP FILTERS =====
  $$('.chip-group').forEach(group => {
    $$('.chip', group).forEach(chip => {
      chip.addEventListener('click', () => { $$('.chip', group).forEach(c => c.classList.remove('active')); chip.classList.add('active'); });
    });
  });

  // ===== HABIT ACTIONS =====
  $$('.habit-item__action').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.background = 'var(--md-primary)'; btn.style.color = 'var(--md-on-primary)';
      btn.innerHTML = '<span class="material-symbols-rounded">check</span>';
      showSnackbar('✅ Progress diperbarui!');
      const fill = btn.closest('.habit-item')?.querySelector('.habit-item__bar-fill');
      if (fill) fill.style.width = Math.min(parseFloat(fill.style.width) + 12, 100) + '%';
    });
  });

  // ---- Today Summary (Dynamic) ----
  function renderTodaySummary() {
    const container = $('#todaySummaryList');
    if (!container) return;
    
    const meds = DB.medications.getAll().filter(m => !m.taken).slice(0, 2);
    const symptoms = DB.symptoms.getAll().slice(0, 1);
    
    let html = '';
    
    if (meds.length > 0) {
      meds.forEach(m => {
        html += `
          <div class="log-card log-card--dynamic" data-id="${m.id}" data-store="medications">
            <div class="log-card__icon log-card__icon--meds"><span class="material-symbols-rounded">pill</span></div>
            <div class="log-card__content">
              <p class="log-card__title">Belum Diminum: ${esc(m.name)}</p>
              <p class="log-card__desc">${esc(m.dose)} • ${esc(m.time)}</p>
            </div>
            <span class="log-card__badge log-card__badge--warning">PENTING</span>
          </div>
        `;
      });
    }
    
    if (symptoms.length > 0) {
      const s = symptoms[0];
      html += `
        <div class="log-card log-card--dynamic" data-id="${s.id}" data-store="symptoms">
          <div class="log-card__icon log-card__icon--mood"><span class="material-symbols-rounded">sick</span></div>
          <div class="log-card__content">
            <p class="log-card__title">Log Gejala Terakhir</p>
            <p class="log-card__desc">Keparahan: Lv ${s.severity} • ${formatDate(s.date)}</p>
          </div>
          <span class="log-card__badge log-card__badge--info">CEK</span>
        </div>
      `;
    }
    
    if (!html) {
      html = `
        <div class="log-card"><div class="log-card__icon log-card__icon--mood"><span class="material-symbols-rounded">sentiment_satisfied</span></div><div class="log-card__content"><p class="log-card__title">Keluarga Sehat</p><p class="log-card__desc">Belum ada tugas atau keluhan mendesak hari ini.</p></div><span class="log-card__badge log-card__badge--good">Baik</span></div>
      `;
    }
    
    container.innerHTML = html;
    attachEntryListeners(container);
  }

  // ===== VACCINE & ARTICLE CLICKS =====
  $$('.vaccine-card').forEach(card => { 
    card.addEventListener('click', () => {
      const { id, store } = card.dataset;
      if (id && store) openViewModal(id, store);
      else showSnackbar(`💉 Detail ${$('p.vaccine-card__name', card)?.textContent || 'Vaksin'}`);
    }); 
  });
  $$('.article-card').forEach(card => { card.addEventListener('click', () => showSnackbar(`📖 Membuka: ${($('p.article-card__title', card)?.textContent || '').substring(0, 40)}...`)); });
  $$('#pageArticles .log-card').forEach(card => { card.addEventListener('click', () => showSnackbar(`📖 Membuka: ${($('p.log-card__title', card)?.textContent || '').substring(0, 40)}...`)); });

  // ===== SNACKBAR =====
  let snackTimer;
  function showSnackbar(msg) {
    const el = $('#snackbar'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(snackTimer); snackTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  // ===== NOTIFICATION =====
  $('#btnNotifications')?.addEventListener('click', () => {
    showSnackbar('🔔 Imunisasi DPT-HB-Hib 4 dalam 3 hari!');
    const dot = $('.notification-dot'); if (dot) dot.style.display = 'none';
  });

  // ===== PROFILE MENU =====
  const profileActions = {
    menuEmergency: '🚨 Membuka Kartu Darurat...',
    menuRecords: '📁 Mengakses Rekam Medis...',
    menuDevices: '⌚ Mencari Perangkat Terhubung...',
    menuVisitPrep: '📋 Menyiapkan Kunjungan Dokter...',
    menuExport: '📥 Mengekspor data kesehatan...',
    menuHelp: '❓ Membuka Pusat Bantuan...'
  };
  Object.entries(profileActions).forEach(([id, msg]) => { 
    $(`#${id}`)?.addEventListener('click', () => {
      if (id === 'menuExport') {
        const data = {
          entries: DB.entries.getAll(),
          growth: DB.growth.getAll(),
          symptoms: DB.symptoms.getAll(),
          medications: DB.medications.getAll(),
          vitals: DB.vitals.getAll(),
          vaccines: DB.vaccines.getAll(),
          children: DB.children.getAll()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `familyhealth_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showSnackbar('✅ Data berhasil diekspor!');
      } else {
        showSnackbar(msg);
      }
    }); 
  });

  // Settings page
  $('#menuSettings')?.addEventListener('click', () => navigateTo('pageProfile'));

  // ===== INTERSECTION OBSERVER =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; } });
  }, { threshold: 0.05 });

  function observeAnimatedElements() {
    const selectors = '.log-card, .med-card, .insight-card, .vital-card, .habit-item, .child-card, .vaccine-card, .article-card, .growth-chart-container, .sheets-settings';
    $$(selectors).forEach(el => {
      if (el.dataset.observed) return; el.dataset.observed = '1';
      el.style.opacity = '0'; el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.5s var(--md-motion-decel), transform 0.5s var(--md-motion-spring)';
      observer.observe(el);
    });
  }
  observeAnimatedElements();

  // ===== GROWTH DOTS =====
  $$('.growth-dot').forEach(dot => { dot.addEventListener('click', () => showSnackbar(`📊 ${dot.title}`)); });

  // ===== PWA INSTALL =====
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });

  // ===== HELPERS =====
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function formatDate(d) { 
    if (!d) return ''; 
    try { const dt = new Date(d); return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  }
  function getEntryIcon(type) {
    const icons = { 
      'Gejala':'sick', 'Obat':'pill', 'Tanda Vital':'monitor_heart', 
      'Mood':'sentiment_satisfied', 'Kebiasaan':'self_improvement', 
      'Pertumbuhan Anak':'child_care', 'Imunisasi':'vaccines',
      'children': 'child_care', 'vitals': 'monitor_heart', 'growth': 'trending_up',
      'symptoms': 'sick', 'medications': 'pill', 'vaccines': 'vaccines',
      'entries': 'note_add'
    };
    return icons[type] || 'note_add';
  }

  // ===== INITIAL RENDER =====
  renderDynamicLists();

})();
