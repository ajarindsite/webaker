// ============================================================
// ADJARINDO AI GENERATOR - VERSI SEMPURNA (FIXED)
// ============================================================
// ============================================================
// AUTHENTICATION SYSTEM
// ============================================================

function initAuth() {
    // Hapus data login sebelumnya (buat bersih)
    localStorage.removeItem('adjarindo_token');
    sessionStorage.removeItem('admin_session');
    
    // Tampilkan login
    showLogin();
    
    // Event listener untuk tombol login
    const loginBtn = document.getElementById('loginBtn');
    const tokenInput = document.getElementById('tokenInput');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    if (tokenInput) {
        tokenInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
}

function handleLogin() {
    const tokenInput = document.getElementById('tokenInput');
    const errorEl = document.getElementById('loginError');
    
    if (!tokenInput) return;
    
    const token = tokenInput.value.trim();
    
    if (!token) {
        if (errorEl) {
            errorEl.textContent = '❌ Masukkan token terlebih dahulu!';
            errorEl.classList.remove('hidden');
        }
        return;
    }
    
    // Cek token (hardcoded untuk demo)
    if (token === 'AJARIND2025') {
        localStorage.setItem('adjarindo_token', token);
        showApp();
        if (errorEl) errorEl.classList.add('hidden');
    } else {
        if (errorEl) {
            errorEl.textContent = '❌ Token salah! Hubungi admin.';
            errorEl.classList.remove('hidden');
        }
    }
}

function showLogin() {
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginPage) {
        loginPage.classList.add('active');
        loginPage.style.display = 'flex';
    }
    if (appContainer) {
        appContainer.classList.remove('active');
        appContainer.style.display = 'none';
    }
    if (adminDashboard) {
        adminDashboard.classList.remove('active');
        adminDashboard.style.display = 'none';
    }
}

function showApp() {
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginPage) {
        loginPage.classList.remove('active');
        loginPage.style.display = 'none';
    }
    if (appContainer) {
        appContainer.classList.add('active');
        appContainer.style.display = 'block';
    }
    if (adminDashboard) {
        adminDashboard.classList.remove('active');
        adminDashboard.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('adjarindo_token');
    sessionStorage.removeItem('admin_session');
    showLogin();
    const tokenInput = document.getElementById('tokenInput');
    if (tokenInput) tokenInput.value = '';
}

// ===== STATE =====
let currentMode = 'standar';
let currentTab = 'prota';
let savedResults = { prota: '', promes: '', rpp: '', modul: '' };

// ===== KONFIGURASI MODE =====
const modeConfig = {
    fast:   { label: 'Fast',   ai: 'groq',   model: 'llama-3.3-70b-versatile', maxTokens: 2048, description: 'Landing page & website sederhana' },
    standar:{ label: 'Standar',ai: 'groq',   model: 'qwen/qwen3.6-27b',       maxTokens: 4096, description: 'Aplikasi fungsional (Kas RT, Todo, dll)' },
    pro:    { label: 'Pro',    ai: 'gemini', model: 'gemini-2.5-flash',      maxTokens: 8192, description: 'Aplikasi kompleks (Manajemen, Multi-tab)' }
};

// ===== TEMPLATE PROMPT =====
const templates = {
    landing: {
        label: 'Landing Page',
        prompt: `Buat landing page untuk [nama bisnis] dengan:\n- Header logo & menu\n- Hero section dengan CTA\n- 3 fitur/keunggulan\n- Form kontak\n- Footer\n\nDesain: [warna/gaya], [framework], mobile-first.\n1 file HTML lengkap.`
    },
    aplikasi: {
        label: 'Aplikasi Fungsional',
        prompt: `Buat aplikasi [nama aplikasi] untuk [tujuan] dengan fitur:\n1. [fitur 1]\n2. [fitur 2]\n3. [fitur 3]\n\nMasuk pakai [login method].\nData disimpan di [localStorage / spreadsheet / dummy].\nDesain: [warna/gaya], mobile-first.\n1 file HTML lengkap.`
    },
    multitab: {
        label: 'Multi-Tab',
        prompt: `Buat aplikasi [nama] dengan tab:\n- Tab 1: [nama] → [fungsi]\n- Tab 2: [nama] → [fungsi]\n- Tab 3: [nama] → [fungsi]\n\nSetiap tab saling berkaitan.\nDesain: [warna/gaya], mobile-first.\n1 file HTML lengkap.`
    }
};

// ============================================================
// FUNGSI UI
// ============================================================

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-500/30', 'border-blue-400/50');
        b.classList.add('bg-white/10', 'text-white/70');
    });
    const btn = document.getElementById('mode' + mode.charAt(0).toUpperCase() + mode.slice(1));
    if (btn) {
        btn.classList.add('active', 'bg-blue-500/30', 'border-blue-400/50');
        btn.classList.remove('bg-white/10', 'text-white/70');
        btn.classList.add('text-white');
    }
    const config = modeConfig[mode];
    const statusMode = document.getElementById('statusMode');
    if (statusMode) {
        statusMode.textContent = 'Mode: ' + config.label + ' (' + config.description + ')';
    }
}

function applyTemplate() {
    const select = document.getElementById('templateSelect');
    const promptArea = document.getElementById('promptInput');
    if (!select || !promptArea) return;
    const val = select.value;
    if (val === 'custom') {
        promptArea.value = '';
        promptArea.placeholder = 'Tulis prompt custom di sini...';
        return;
    }
    if (templates[val]) {
        promptArea.value = templates[val].prompt;
        promptArea.placeholder = 'Isi bagian dalam kurung siku [...] dengan data kamu.';
    }
}

// ============================================================
// GENERATE
// ============================================================

async function generate() {
    const promptArea = document.getElementById('promptInput');
    if (!promptArea) return;
    const prompt = promptArea.value.trim();
    if (!prompt) {
        alert('Masukkan prompt atau pilih template!');
        return;
    }

    // Ambil API Key dari Settings Modal
    const geminiKey = document.getElementById('geminiKeyInput')?.value?.trim() || '';
    const groqKey   = document.getElementById('groqKeyInput')?.value?.trim() || '';
    const apiKey = geminiKey || groqKey;
    if (!apiKey) {
        alert('Masukkan API Key di Settings (⚙️) terlebih dahulu!');
        return;
    }

    if (prompt.length > 1500 && currentMode === 'fast') {
        if (!confirm('Prompt panjang (' + prompt.length + ' karakter). Mode Fast mungkin gagal. Lanjutkan?')) return;
    }

    const btn = document.getElementById('btnGen');
    const result = document.getElementById('resultArea');
    const statusMode = document.getElementById('statusMode');
    const statusLog = document.getElementById('statusLog');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    if (statusLog) statusLog.textContent = '⏳ Menghubungi AI...';

    const config = modeConfig[currentMode] || modeConfig.standar;
    if (statusMode) statusMode.textContent = '⏳ Menggunakan ' + config.label + ' (' + config.model + ')...';

    try {
        let content = '';
        let usedAI = config.ai;

        try {
            if (config.ai === 'gemini' && geminiKey) {
                content = await callGemini(prompt, geminiKey, config.maxTokens);
            } else if (groqKey) {
                content = await callGroq(prompt, groqKey, config.model, config.maxTokens);
            } else {
                throw new Error('Tidak ada API Key yang valid');
            }
        } catch (primaryError) {
            console.warn('⚠️ Primary AI error:', primaryError.message);
            if (statusLog) statusLog.textContent = '⚠️ ' + config.label + ' error, fallback ke Qwen...';
            const fallbackKey = groqKey || geminiKey;
            content = await callGroq(prompt, fallbackKey, 'qwen/qwen3.6-27b', 4096);
            usedAI = 'Qwen (Fallback)';
        }

        if (result) result.value = content;
        if (statusMode) statusMode.textContent = '✅ Selesai! (Pakai ' + usedAI + ')';
        if (statusLog) statusLog.textContent = '✅ Generate selesai!';

        // Coba parse JSON untuk preview
        try {
            const json = JSON.parse(content);
            if (json.html || json.css || json.js) {
                renderPreview(json);
            }
        } catch (_) { /* bukan JSON, abaikan */ }

    } catch (error) {
        if (result) result.value = '❌ Error: ' + error.message;
        if (statusMode) statusMode.textContent = '❌ Gagal generate';
        if (statusLog) statusLog.textContent = '❌ ' + error.message;
        console.error('Generate Error:', error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> Generate';
        }
    }
}

// ============================================================
// API CALLS
// ============================================================

async function callGemini(prompt, apiKey, maxTokens) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: maxTokens || 8192,
                responseMimeType: "application/json"
            }
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error('Gemini Error: ' + (error.error?.message || 'Unknown'));
    }
    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) throw new Error('Gemini: Tidak ada response');
    return data.candidates[0].content.parts[0].text;
}

async function callGroq(prompt, apiKey, model, maxTokens) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: model || 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'Kamu adalah AI expert yang membantu membuat kode web. Output harus valid dan siap pakai.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: maxTokens || 4096,
            response_format: model && model.includes('qwen') ? { type: 'json_object' } : undefined
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error('Groq Error: ' + (error.error?.message || 'Unknown'));
    }
    const data = await response.json();
    if (!data.choices || data.choices.length === 0) throw new Error('Groq: Tidak ada response');
    return data.choices[0].message.content;
}

// ============================================================
// PREVIEW (untuk hasil JSON)
// ============================================================

function renderPreview(json) {
    const iframe = document.getElementById('previewFrame');
    if (!iframe) return;
    const html = json.html || '';
    const css = json.css || '';
    const js = json.js || '';
    const fullHtml = `<html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
}

// ============================================================
// TOMBOL NEXT (untuk Multi-Tab) — OPSIONAL
// ============================================================

const nextMap = { prota: 'promes', promes: 'rpp', rpp: 'modul', modul: null };
const nextLabels = { prota: 'Promes', promes: 'RPP', rpp: 'Modul' };

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    const next = nextMap[tab];
    const btnNext = document.getElementById('btnNext');
    if (btnNext) btnNext.classList.toggle('hidden', !next);
}

function useForNext() {
    const next = nextMap[currentTab];
    if (!next) return;
    switchTab(next);
    const resultArea = document.getElementById('resultArea');
    if (resultArea) resultArea.value = '';
    alert('Silakan generate ' + nextLabels[currentTab] + ' berdasarkan ' + currentTab.toUpperCase() + ' yang sudah dibuat.');
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // AUTH (PALING PERTAMA)
    initAuth();
    
    // Mode
    setMode('standar');
    
    // Template
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', applyTemplate);
        applyTemplate();
    }
    
    // Multi-tab
    const btnNext = document.getElementById('btnNext');
    if (btnNext) btnNext.addEventListener('click', useForNext);
    switchTab('prota');
    
    // Tombol logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});
