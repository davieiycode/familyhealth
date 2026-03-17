/* app.js - Family Health Interactivity */

document.addEventListener('DOMContentLoaded', () => {

    // --- Selectors ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const mainFab = document.getElementById('open-log-sheet');
    const logSheet = document.getElementById('log-sheet');
    const backdrop = document.getElementById('backdrop');

    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');

            // Update UI state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch views
            sections.forEach(sec => {
                if (sec.id === target) {
                    sec.classList.remove('hidden');
                } else {
                    sec.classList.add('hidden');
                }
            });

            // Auto-scroll to top when switching
            document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // --- Bottom Sheet Logic ---
    function openSheet() {
        logSheet.classList.add('open');
        backdrop.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.add('opacity-100');
        }, 10);
    }

    function closeSheet() {
        logSheet.classList.remove('open');
        backdrop.classList.remove('opacity-100');
        setTimeout(() => {
            backdrop.classList.add('hidden');
        }, 300);
    }

    mainFab.addEventListener('click', openSheet);
    backdrop.addEventListener('click', closeSheet);

    // --- Today Navigation ---
    const todayPrev = document.querySelector('.today-header-btn:first-of-type');
    const todayNext = document.querySelector('.today-header-btn:last-of-type');
    const todayTitle = document.querySelector('#dashboard h1');

    if (todayPrev) {
        todayPrev.addEventListener('click', () => {
            todayTitle.textContent = 'Yesterday';
            todayTitle.classList.add('text-blue-500');
        });
    }

    if (todayNext) {
        todayNext.addEventListener('click', () => {
            todayTitle.textContent = 'Today';
            todayTitle.classList.remove('text-blue-500');
        });
    }

    // --- Journal Daily Log (Calendar) Logic ---
    const dayPills = document.querySelectorAll('.calendar-day-pill');
    dayPills.forEach(pill => {
        pill.addEventListener('click', () => {
            dayPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const dayName = pill.querySelector('span:first-child').textContent;
            const dayNum = pill.querySelector('span:last-child').textContent;
            showToast(`Melihat log untuk: ${dayName}, ${dayNum} Maret`);
        });
    });

    // --- Time Pill Toggle (Dashboard/Today) ---
    const timePills = document.querySelectorAll('.time-pill-btn');
    timePills.forEach(pill => {
        pill.addEventListener('click', () => {
            pill.parentElement.querySelectorAll('.time-pill-btn').forEach(btn => btn.classList.remove('active'));
            pill.classList.add('active');
            console.log('Dashboard time range changed to:', pill.textContent.trim());
        });
    });

    // --- Quick Action Pills -> Open Sheet ---
    const quickActions = document.querySelectorAll('.quick-action-pill');
    quickActions.forEach(btn => {
        btn.addEventListener('click', openSheet);
    });

    // --- Records/Journal Filter Tabs ---
    const recordFilters = document.querySelectorAll('.filter-tab-pill');
    recordFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            recordFilters.forEach(btn => btn.classList.remove('active'));
            pill.classList.add('active');
            
            // Logic to filter the list would go here (placeholder for now)
            console.log('Filtering records by:', pill.textContent);
        });
    });

    // --- Sources Sync Simulation ---
    const syncButtons = document.querySelectorAll('.btn-sync-small');
    syncButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const originalText = btn.textContent;
            btn.textContent = 'Syncing...';
            btn.classList.add('opacity-50');
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = 'Synced';
                btn.classList.remove('opacity-50');
                btn.classList.add('text-emerald-500');
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('text-emerald-500');
                    btn.disabled = false;
                    
                    // Update the timestamp text
                    const statusText = btn.parentElement.querySelector('.source-sync-status');
                    if (statusText) statusText.textContent = 'Synced: Just now';
                }, 2000);
            }, 1500);
        });
    });

    // --- Settings View Navigation ---
    const openSettingsBtn = document.getElementById('open-settings-menu');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsView = document.getElementById('settings');
    const profileView = document.getElementById('profile');
    const navDock = document.querySelector('.nav-dock');

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            profileView.classList.add('hidden');
            settingsView.classList.remove('hidden');
            navDock.style.display = 'none'; // Hide nav dock for clean sub-page
            mainFab.style.display = 'none'; // Hide FAB
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsView.classList.add('hidden');
            profileView.classList.remove('hidden');
            navDock.style.display = 'flex'; // Show nav dock again
            mainFab.style.display = 'flex'; // Show FAB
        });
    }



    // --- Resume Category Clicks ---
    const resumeCategories = document.querySelectorAll('.resume-category-item');
    resumeCategories.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('.category-label').textContent;
            showToast(`Membuka kategori: ${label}`);
        });
    });

    // --- Profile List Item Interactions ---
    const profileItems = document.querySelectorAll('.profile-list-item');
    profileItems.forEach(item => {
        if (item.id === 'open-settings-menu') return; // Handled separately
        item.addEventListener('click', () => {
            const labelElement = item.querySelector('span:not(.material-icons)');
            const label = labelElement ? labelElement.textContent : 'Menu';
            
            if (label.includes('Keluar')) {
                if (confirm('Apakah Anda yakin ingin keluar?')) {
                    location.reload();
                }
            } else {
                showToast(`Menuju ke: ${label}`);
            }
        });
    });

    /**
     * Helper to show a simple premium toast
     */
    function showToast(message) {
        let toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-blue-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[1000] liquid-glass animate-bounce-short';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Edit & Click Logic
    document.querySelectorAll('.journal-entry .liquid-glass').forEach(card => {
        card.addEventListener('click', (e) => {
            const entry = card.closest('.journal-entry');
            const title = entry.querySelector('h4').textContent;
            showToast(`Mengalihkan ke mode edit: ${title}`);
            openSheet();
        });
    });

    document.querySelectorAll('.btn-edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid double triggering if child of clickable area
            const entry = e.target.closest('.journal-entry');
            const title = entry.querySelector('h4').textContent;
            showToast(`Mengalihkan ke mode edit: ${title}`);
            openSheet();
        });
    });

    // Delete Logic
    document.querySelectorAll('.btn-delete-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const entry = e.target.closest('.journal-entry');
            const title = entry.querySelector('h4').textContent;
            
            if (confirm(`Hapus catatan "${title}"?`)) {
                entry.style.opacity = '0';
                entry.style.transform = 'translateX(20px)';
                setTimeout(() => entry.remove(), 500);
                showToast('Catatan berhasil dihapus');
                
                // Sync the deletion if URL exists
                syncDataToSheets({ action: 'delete', title: title }, 'delete');
            }
        });
    });

    // --- Google Sheets Sync Logic ---
    const gasUrlInput = document.getElementById('gas-url-input');
    const saveSyncBtn = document.getElementById('save-sync-settings');

    // Load saved URL
    if (localStorage.getItem('gasUrl')) {
        gasUrlInput.value = localStorage.getItem('gasUrl');
    }

    saveSyncBtn.addEventListener('click', () => {
        const url = gasUrlInput.value.trim();
        if (url) {
            localStorage.setItem('gasUrl', url);
            alert('Konfigurasi berhasil disimpan! Anda sekarang terhubung ke Google Spreadsheet.');
        } else {
            alert('Masukkan URL Google Apps Script yang valid.');
        }
    });

    /**
     * Function to sync health records to Google Spreadsheet
     */
    async function syncDataToSheets(data, action = 'save') {
        const gasUrl = localStorage.getItem('gasUrl');
        if (!gasUrl) {
            console.warn('Sync cancelled: GAS URL not configured.');
            return;
        }

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors', // Common for Apps Script execution
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    timestamp: new Date().toISOString(),
                    data: data
                })
            });
            console.log('Sync successful:', response);
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    // --- Auto-Sync Interval (Every 10 seconds) ---
    setInterval(() => {
        const gasUrl = localStorage.getItem('gasUrl');
        if (gasUrl) {
            console.log('Auto-syncing data...');
            
            // For now, we sync a heartbeat/summary of local state
            // In a real scenario, this would be your local storage data
            const localData = {
                user: "Rafieiy",
                lastActive: new Date().toISOString(),
                healthScore: 63,
                timestamp: Date.now()
            };
            
            syncDataToSheets(localData, 'auto-sync');
        }
    }, 10000); // 10,000ms = 10 seconds

    // --- Liquid Glass Theme Switcher ---
    const themePills = document.querySelectorAll('.theme-pill');
    const htmlElement = document.documentElement;

    /**
     * Applies the selected theme
     */
    function applyTheme(mode) {
        // Remove active state from all pills
        themePills.forEach(p => p.classList.remove('active'));
        const activePill = document.querySelector(`.theme-pill[data-mode="${mode}"]`);
        if (activePill) activePill.classList.add('active');

        if (mode === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            localStorage.setItem('themeMode', 'system');
        } else {
            htmlElement.setAttribute('data-theme', mode);
            localStorage.setItem('themeMode', mode);
        }
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('themeMode') || 'system';
    applyTheme(savedTheme);

    themePills.forEach(pill => {
        pill.addEventListener('click', () => {
            const mode = pill.getAttribute('data-mode');
            applyTheme(mode);
        });
    });

    // Listen for System Theme Changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('themeMode') === 'system') {
            applyTheme('system');
        }
    });

    // --- Gestures (Swipe down to close sheet) ---
    let touchStartY = 0;
    logSheet.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    logSheet.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        if (diff > 50) {
            closeSheet();
        }
    });

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW Registered', reg))
                .catch(err => console.log('SW Failed', err));
        });
    }

});