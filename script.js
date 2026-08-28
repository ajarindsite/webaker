// ============================================================
// ADJARINDO AI WEB GENERATOR - FINAL VERSION
// ============================================================

// ===== CONFIGURATION =====
const ADMIN_PASSWORD = '@jar1nd123';
const DEFAULT_TOKENS = ['AJARIND2025'];
const STORAGE_KEYS = {
    tokens: 'adjarindo_tokens',
    stats: 'adjarindo_stats',
    gemini: 'gemini_key',
    groq: 'groq_key',
    token: 'adjarindo_token'
};

// ===== STATE =====
let state = {
    isLoggedIn: false,
    selectedAI: 'gemini',
    lastResponse: { html: '', css: '', js: '' },
    isGenerating: false,
    currentToken: null
};

// ============================================================
// TOKEN SYSTEM
// ============================================================

function getTokens() {
    const data = localStorage.getItem(STORAGE_KEYS.tokens);
    if (!data) return [];
    try { return JSON.parse(data); } catch { return []; }
}

function saveTokens(tokens) {
    localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(tokens));
}

function generateTokenData(token, expiryType) {
    const now = new Date();
    const expiry = new Date(now);
    let maxUses = 0;
    if (expiryType === '24h') {
        expiry.setHours(expiry.getHours() + 24);
        maxUses = 0;
    } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
        maxUses = 3;
    }
    return {
        token: token,
        expiry: expiry.toISOString(),
        used: 0,
        maxUses: maxUses,
        created: now.toISOString(),
        expiryType: expiryType
    };
}

function isTokenValid(token) {
    const tokens = getTokens();
    const tokenData = tokens.find(t => t.token === token);
    if (!tokenData) {
        return { valid: false, reason: 'Token tidak ditemukan' };
    }
    const now = new Date();
    const expiry = new Date(tokenData.expiry);
    if (now > expiry) {
        const filtered = tokens.filter(t => t.token !== token);
        saveTokens(filtered);
        return { valid: false, reason: 'Token sudah expired' };
    }
    if (tokenData.maxUses > 0 && tokenData.used >= tokenData.maxUses) {
        const filtered = tokens.filter(t => t.token !== token);
        saveTokens(filtered);
        return { valid: false, reason: 'Token sudah mencapai batas penggunaan' };
    }
    return { 
        valid: true, 
        data: tokenData,
        remaining: tokenData.maxUses > 0 ? tokenData.maxUses - tokenData.used : '∞',
        expiryDate: new Date(tokenData.expiry).toLocaleString('id-ID')
    };
}

function useToken(token) {
    const tokens = getTokens();
    const index = tokens.findIndex(t => t.token === token);
    if (index !== -1) {
        tokens[index].used = (tokens[index].used || 0) + 1;
        saveTokens(tokens);
    }
}

function deleteToken(token) {
    if (token === 'AJARIND2025') {
        alert('⚠️ Token default tidak bisa dihapus!');
        return;
    }
    if (!confirm('Hapus token "' + token + '"?')) return;
    let tokens = getTokens();
    const filtered = tokens.filter(t => t.token !== token);
    saveTokens(filtered);
    renderTokens();
}

// ============================================================
// AUTHENTICATION
// ============================================================

function initAuth() {
    let tokens = getTokens();
    if (tokens.length === 0) {
        const defaultToken = generateTokenData('AJARIND2025', '24h');
        tokens.push(defaultToken);
        saveTokens(tokens);
        console.log('✅ Token default dibuat');
    }

    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    if (savedToken) {
        const validation = isTokenValid(savedToken);
        if (validation.valid) {
            state.isLoggedIn = true;
            state.currentToken = savedToken;
            showApp();
            return;
        } else {
            localStorage.removeItem(STORAGE_KEYS.token);
        }
    }
    
    showLogin();
    
    const loginBtn = document.getElementById('loginBtn');
    const tokenInput = document.getElementById('tokenInput');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    if (tokenInput) {
        tokenInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
        tokenInput.addEventListener('input', updateTokenInfo);
    }
}

function handleLogin() {
    const tokenInput = document.getElementById('tokenInput');
    const errorEl = document.getElementById('loginError');
    const infoEl = document.getElementById('tokenInfo');
    
    if (!tokenInput) return;
    
    const token = tokenInput.value.trim();
    
    if (!token) {
        if (errorEl) {
            errorEl.textContent = '❌ Masukkan token terlebih dahulu!';
            errorEl.classList.remove('hidden');
        }
        if (infoEl) infoEl.classList.add('hidden');
        return;
    }

    const validation = isTokenValid(token);
    console.log('Validasi token:', validation);
    
    if (!validation.valid) {
        if (errorEl) {
            errorEl.textContent = '❌ ' + validation.reason;
            errorEl.classList.remove('hidden');
        }
        if (infoEl) infoEl.classList.add('hidden');
        return;
    }

    useToken(token);
    localStorage.setItem(STORAGE_KEYS.token, token);
    state.isLoggedIn = true;
    state.currentToken = token;
    updateStats('login');
    showApp();
    if (errorEl) errorEl.classList.add('hidden');
    if (infoEl) infoEl.classList.add('hidden');
    tokenInput.value = '';
}

function showLogin() {
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginPage) loginPage.classList.add('active');
    if (appContainer) appContainer.classList.remove('active');
    if (adminDashboard) adminDashboard.classList.remove('active');
    
    updateTokenInfo();
}

function showApp() {
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginPage) loginPage.classList.remove('active');
    if (appContainer) appContainer.classList.add('active');
    if (adminDashboard) adminDashboard.classList.remove('active');
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.token);
    state.isLoggedIn = false;
    state.currentToken = null;
    showLogin();
    const tokenInput = document.getElementById('tokenInput');
    if (tokenInput) tokenInput.value = '';
}

function updateTokenInfo() {
    const tokenInput = document.getElementById('tokenInput');
    if (!tokenInput) return;
    
    const token = tokenInput.value.trim();
    const infoContainer = document.getElementById('tokenInfo');
    if (!infoContainer) return;
    
    if (token) {
        const validation = isTokenValid(token);
        if (validation.valid && validation.data) {
            infoContainer.classList.remove('hidden');
            
            const remainingEl = document.getElementById('tokenRemaining');
            const maxUsesEl = document.getElementById('tokenMaxUses');
            const expiryEl = document.getElementById('tokenExpiryDate');
            
            if (remainingEl) remainingEl.textContent = validation.remaining;
            if (maxUsesEl) maxUsesEl.textContent = validation.data.maxUses > 0 ? validation.data.maxUses : '∞';
            if (expiryEl) expiryEl.textContent = validation.expiryDate;
            return;
        }
    }
    infoContainer.classList.add('hidden');
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function initAdmin() {
    const hash = window.location.hash;
    if (hash === '#admin' && state.isLoggedIn) {
        if (sessionStorage.getItem('admin_session') === 'true') {
            showAdminDashboard();
        } else {
            promptAdminPassword();
        }
    }

    const adminAccessBtn = document.getElementById('adminAccessBtn');
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', function() {
            if (!state.isLoggedIn) return;
            if (sessionStorage.getItem('admin_session') === 'true') {
                showAdminDashboard();
            } else {
                promptAdminPassword();
            }
        });
    }

    const backBtn = document.getElementById('backToAppBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            const adminDashboard = document.getElementById('adminDashboard');
            const appContainer = document.getElementById('appContainer');
            if (adminDashboard) adminDashboard.classList.remove('active');
            if (appContainer) appContainer.classList.add('active');
        });
    }

    const addBtn = document.getElementById('addTokenBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewToken);
    }

    const newTokenInput = document.getElementById('newTokenInput');
    if (newTokenInput) {
        newTokenInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') addNewToken();
        });
    }

    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#admin' && state.isLoggedIn) {
            if (sessionStorage.getItem('admin_session') === 'true') {
                showAdminDashboard();
            } else {
                promptAdminPassword();
            }
        }
    });
}

function promptAdminPassword() {
    const password = prompt('🔐 Masukkan password admin:');
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_session', 'true');
        showAdminDashboard();
    } else if (password !== null) {
        alert('❌ Password salah!');
    }
}

function showAdminDashboard() {
    const appContainer = document.getElementById('appContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (appContainer) appContainer.classList.remove('active');
    if (adminDashboard) adminDashboard.classList.add('active');
    
    renderTokens();
    renderStats();
}

function addNewToken() {
    const input = document.getElementById('newTokenInput');
    if (!input) return;
    
    const token = input.value.trim();
    const expiryTypeSelect = document.getElementById('tokenExpiry');
    const expiryType = expiryTypeSelect ? expiryTypeSelect.value : '24h';
    
    if (!token) {
        alert('Masukkan token terlebih dahulu!');
        return;
    }

    let tokens = getTokens();
    if (tokens.some(function(t) { return t.token === token; })) {
        alert('Token sudah ada!');
        return;
    }

    const tokenData = generateTokenData(token, expiryType);
    tokens.push(tokenData);
    saveTokens(tokens);
    input.value = '';
    renderTokens();
    alert('✅ Token berhasil ditambahkan!\n\nToken: ' + token + '\nBerlaku: ' + (expiryType === '24h' ? '24 Jam (unlimited use)' : '3x Login (tanpa batas waktu)'));
}

function renderTokens() {
    const container = document.getElementById('tokenList');
    if (!container) return;
    
    const tokens = getTokens();
    const totalTokens = document.getElementById('totalTokens');
    
    if (tokens.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm">Belum ada token. Tambahkan token baru di atas.</p>';
        if (totalTokens) totalTokens.textContent = '0';
        return;
    }

    if (totalTokens) totalTokens.textContent = tokens.length;

    var html = '';
    for (var i = 0; i < tokens.length; i++) {
        var tokenData = tokens[i];
        var now = new Date();
        var expiry = new Date(tokenData.expiry);
        var isExpired = now > expiry;
        var isLimited = tokenData.maxUses > 0;
        var remaining = isLimited ? tokenData.maxUses - tokenData.used : '∞';
        var isDefault = tokenData.token === 'AJARIND2025';
        
        var statusBadge = '';
        if (isExpired) {
            statusBadge = '<span class="token-expiry-badge expired">❌ Expired</span>';
        } else if (isLimited && remaining <= 0) {
            statusBadge = '<span class="token-expiry-badge expired">❌ Habis</span>';
        } else if (isLimited) {
            statusBadge = '<span class="token-expiry-badge limited">🔢 ' + remaining + ' dari ' + tokenData.maxUses + '</span>';
        } else {
            statusBadge = '<span class="token-expiry-badge valid">⏰ ' + new Date(tokenData.expiry).toLocaleString('id-ID') + '</span>';
        }

        var expiryTypeLabel = tokenData.expiryType === '24h' ? '24 Jam' : '3x Login';
        var defaultBadge = isDefault ? '<span class="text-xs text-yellow-400">⭐ Default</span>' : '';
        var deleteButton = !isDefault ? '<button onclick="window.deleteToken(\'' + tokenData.token + '\')" class="text-red-400 hover:text-red-300 transition"><i class="fa-solid fa-trash"></i></button>' : '';

        html += '<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 glass p-3 rounded-lg hover:bg-white/5 transition">';
        html += '  <div class="flex flex-col md:flex-row md:items-center gap-2 flex-wrap">';
        html += '    <span class="font-mono text-sm text-blue-300">' + tokenData.token + '</span>';
        html += '    <span class="text-xs text-slate-400">' + expiryTypeLabel + '</span>';
        html += '    ' + statusBadge;
        html += '    ' + defaultBadge;
        html += '  </div>';
        html += '  <div class="flex items-center gap-2">';
        html += '    <span class="text-xs text-slate-500">Dipakai: ' + tokenData.used + 'x</span>';
        html += '    ' + deleteButton;
        html += '  </div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// ============================================================
// STATISTICS
// ============================================================

function getStats() {
    var defaultStats = {
        totalUsers: 1,
        totalGenerations: 0,
        activeUsers: 0,
        lastActive: new Date().toISOString(),
        dailyLog: {}
    };
    var stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || 'null');
    if (!stats) {
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(defaultStats));
        return defaultStats;
    }
    return stats;
}

function updateStats(type) {
    var stats = getStats();
    var today = new Date().toISOString().split('T')[0];
    if (type === 'login') {
        var tokens = getTokens();
        stats.totalUsers = tokens.length;
        if (!stats.dailyLog) stats.dailyLog = {};
        if (!stats.dailyLog[today]) stats.dailyLog[today] = { logins: 0, generations: 0 };
        stats.dailyLog[today].logins += 1;
        var last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        var active = 0;
        for (var date in stats.dailyLog) {
            if (date >= last24h) {
                active += stats.dailyLog[date].logins + stats.dailyLog[date].generations;
            }
        }
        stats.activeUsers = active;
        stats.lastActive = new Date().toISOString();
    }
    if (type === 'generate') {
        stats.totalGenerations += 1;
        if (!stats.dailyLog) stats.dailyLog = {};
        if (!stats.dailyLog[today]) stats.dailyLog[today] = { logins: 0, generations: 0 };
        stats.dailyLog[today].generations += 1;
        stats.lastActive = new Date().toISOString();
    }
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
    renderStats();
}

function renderStats() {
    var stats = getStats();
    var el1 = document.getElementById('totalUsers');
    var el2 = document.getElementById('totalGenerations');
    var el3 = document.getElementById('activeUsers');
    if (el1) el1.textContent = stats.totalUsers || 0;
    if (el2) el2.textContent = stats.totalGenerations || 0;
    if (el3) el3.textContent = stats.activeUsers || 0;
}

// ============================================================
// AI ENGINE
// ============================================================

function initAI() {
    var buttons = document.querySelectorAll('.ai-engine-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            var allBtns = document.querySelectorAll('.ai-engine-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active', 'bg-blue-600');
                allBtns[j].classList.add('bg-slate-700');
            }
            this.classList.add('active', 'bg-blue-600');
            this.classList.remove('bg-slate-700');
            state.selectedAI = this.dataset.ai;
            var groqSelector = document.getElementById('groqSelector');
            if (groqSelector) {
                if (state.selectedAI === 'gemini') {
                    groqSelector.classList.add('hidden');
                } else {
                    groqSelector.classList.remove('hidden');
                }
            }
        });
    }
}

function buildSystemPrompt() {
    var frameworkEl = document.getElementById('framework');
    var styleEl = document.getElementById('style');
    var fontEl = document.getElementById('font');
    var iconsEl = document.getElementById('icons');
    var promptInput = document.getElementById('promptInput');
    
    var frameworkVal = frameworkEl ? frameworkEl.value : 'Tailwind CSS (CDN)';
    var styleVal = styleEl ? styleEl.value : 'Glassmorphism';
    var fontVal = fontEl ? fontEl.value : 'Plus Jakarta Sans';
    var iconsVal = iconsEl ? iconsEl.value : 'Font Awesome 6';
    var userPrompt = promptInput ? promptInput.value : '';

    var frameworkCDN = '';
    if (frameworkVal.indexOf('Tailwind') !== -1) {
        frameworkCDN = '<script src="https://cdn.tailwindcss.com"><\/script>';
    } else if (frameworkVal.indexOf('Bootstrap') !== -1) {
        frameworkCDN = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
    } else if (frameworkVal.indexOf('Bulma') !== -1) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">';
    } else if (frameworkVal.indexOf('Materialize') !== -1) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">';
    }

    var iconCDN = '';
    if (iconsVal.indexOf('Font Awesome') !== -1) {
        iconCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">';
    } else if (iconsVal.indexOf('Boxicons') !== -1) {
        iconCDN = '<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">';
    } else if (iconsVal.indexOf('Remix') !== -1) {
        iconCDN = '<link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet">';
    }

    return 'Anda adalah AI Expert Web Developer. Buat kode web FUNGSIONAL dan SIAP PAKAI.\n\n' +
        'Aturan WAJIB:\n' +
        '1. Output HANYA JSON valid, tanpa markdown.\n' +
        '2. Struktur: {"html": "...", "css": "...", "js": "..."}\n' +
        '3. HTML cukup isi tag body, tanpa <style> atau <script> inline.\n' +
        '4. CSS dan JS dipisahkan.\n' +
        '5. RESPONSE HARUS SINGKAT! Maksimal 2000 karakter.\n\n' +
        'Spesifikasi:\n' +
        '- Framework: ' + frameworkVal + '\n' +
        '- Desain: ' + styleVal + '\n' +
        '- Font: ' + fontVal + '\n' +
        '- Icons: ' + iconsVal + '\n\n' +
        'Instruksi User: ' + userPrompt + '\n\n' +
        'PASTIKAN: responsive, semua tombol berfungsi, JS FUNGSIONAL, siap deploy.';
}

// ============================================================
// AI ENGINE - API CALLS (GEMINI 2.5 FLASH)
// ============================================================

async function generateCode() {
    var promptInput = document.getElementById('promptInput');
    if (!promptInput) {
        alert('Form tidak ditemukan!');
        return;
    }
    
    var prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Masukkan deskripsi web yang ingin dibuat!');
        return;
    }

    var keys = getKeys();
    if (!keys.gemini && !keys.groq) {
        alert('Mohon masukkan API Key di Settings terlebih dahulu!');
        return;
    }

    if (state.isGenerating) return;
    state.isGenerating = true;

    var systemPrompt = buildSystemPrompt();
    var statusLog = document.getElementById('statusLog');
    var generateBtn = document.getElementById('generateBtn');

    if (statusLog) statusLog.innerHTML = '⏳ Menghubungi AI...';
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating...';
    }

    try {
        var result = null;
        
        if (state.selectedAI === 'gemini' && keys.gemini) {
            if (statusLog) statusLog.innerHTML = '🤖 Menggunakan Gemini 2.5 Flash...';
            result = await callGemini(systemPrompt, keys.gemini);
        } else if (state.selectedAI === 'groq' && keys.groq) {
            if (statusLog) statusLog.innerHTML = '⚡ Menggunakan Groq...';
            result = await callGroq(systemPrompt, keys.groq);
        } else {
            if (keys.gemini) {
                try {
                    if (statusLog) statusLog.innerHTML = '🤖 Mencoba Gemini...';
                    result = await callGemini(systemPrompt, keys.gemini);
                } catch (e) {
                    if (statusLog) statusLog.innerHTML = '⚠️ Gemini error, beralih ke Groq...';
                    if (keys.groq) {
                        result = await callGroq(systemPrompt, keys.groq);
                    } else {
                        throw new Error('Tidak ada API Key yang valid');
                    }
                }
            } else if (keys.groq) {
                result = await callGroq(systemPrompt, keys.groq);
            } else {
                throw new Error('Tidak ada API Key yang valid');
            }
        }

        if (result) {
            console.log('📥 Response length:', result.length);
            processAIResponse(result);
            updateStats('generate');
            if (statusLog) statusLog.innerHTML = '✅ Generate sukses! WEB APP FUNGSIONAL siap pakai! 🚀';
        }

    } catch (error) {
        console.error('❌ Generate Error:', error);
        if (statusLog) statusLog.innerHTML = '❌ Error: ' + error.message;
    }

    state.isGenerating = false;
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Generate Kode';
    }
}

// ===== GEMINI 2.5 FLASH =====
async function callGemini(prompt, apiKey) {
    var response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        var error = await response.json();
        throw new Error(error.error?.message || 'Gemini API Error');
    }

    var data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Tidak ada response dari Gemini');
    }

    return data.candidates[0].content.parts[0].text;
}

// ===== GROQ - SUPPORT SEMUA MODEL =====
async function callGroq(prompt, apiKey) {
    var groqModel = document.getElementById('groqModel');
    var model = groqModel ? groqModel.value : 'groq/compound';
    
    console.log('📤 Menggunakan model Groq:', model);
    
    // Daftar model yang support response_format json_object
    var jsonSupportModels = [
        'groq/compound',
        'groq/compound-mini',
        'qwen/qwen3.6-27b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b'
    ];
    
    // Cek apakah model support JSON mode
    var supportsJson = jsonSupportModels.includes(model);
    
    var requestBody = {
        model: model,
        messages: [
            { role: 'system', content: 'You must respond with valid JSON only. The response must be a valid JSON object with keys: html, css, js. Keep response concise.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
    };
    
    // Hanya tambahkan response_format jika model mendukung
    if (supportsJson) {
        requestBody.response_format = { type: 'json_object' };
    }
    
    var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        var error = await response.json();
        console.error('❌ Groq API Error:', error);
        throw new Error(error.error?.message || 'Groq API Error');
    }

    var data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error('Tidak ada response dari Groq');
    }

    var content = data.choices[0].message.content;
    console.log('📥 Groq response length:', content.length);
    
    return content;
}

// ============================================================
// PROCESS & RENDER (DENGAN REPAIR JSON + FALLBACK)
// ============================================================

function processAIResponse(text) {
    try {
        console.log('📝 Raw response length:', text.length);
        console.log('📝 Preview:', text.substring(0, 300) + '...');
        
        // 1. Bersihkan markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // 2. Coba cari JSON lengkap di dalam teks
        var jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            var potentialJson = jsonMatch[0];
            try {
                JSON.parse(potentialJson);
                text = potentialJson;
            } catch (e2) {
                console.warn('⚠️ JSON belum lengkap, mencoba repair...');
                text = repairIncompleteJSON(potentialJson);
            }
        }
        
        // 3. Parse JSON
        var parsed = JSON.parse(text);
        
        var htmlPart = parsed.html || parsed.HTML || '';
        var cssPart = parsed.css || parsed.CSS || '';
        var jsPart = parsed.js || parsed.JS || parsed.javascript || '';
        
        // 4. Auto-extract dari HTML
        if (!cssPart && htmlPart) {
            var styleMatch = htmlPart.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            if (styleMatch) {
                cssPart = styleMatch[1].trim();
                htmlPart = htmlPart.replace(/<style[^>]*>[\s\S]*?<\/style>/, '');
            }
        }
        if (!jsPart && htmlPart) {
            var scriptMatch = htmlPart.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (scriptMatch) {
                jsPart = scriptMatch[1].trim();
                htmlPart = htmlPart.replace(/<script[^>]*>[\s\S]*?<\/script>/, '');
            }
        }
        
        state.lastResponse = { html: htmlPart, css: cssPart, js: jsPart };
        
        var htmlEditor = document.getElementById('htmlEditor');
        var cssEditor = document.getElementById('cssEditor');
        var jsEditor = document.getElementById('jsEditor');
        
        if (htmlEditor) htmlEditor.value = htmlPart;
        if (cssEditor) cssEditor.value = cssPart;
        if (jsEditor) jsEditor.value = jsPart;
        
        updatePreview();
        
        var downloadBtn = document.getElementById('downloadBtn');
        var codesandboxBtn = document.getElementById('codesandboxBtn');
        if (downloadBtn) downloadBtn.disabled = false;
        if (codesandboxBtn) codesandboxBtn.disabled = false;
        
        console.log('✅ Parse success!');
        console.log('📊 HTML:', htmlPart.length, 'CSS:', cssPart.length, 'JS:', jsPart.length);
        
    } catch (e) {
        console.error('❌ Parse Error:', e.message);
        console.error('📝 Full text preview:', text.substring(0, 500));
        
        // FALLBACK: Manual extract
        var manualResult = manualExtract(text);
        if (manualResult) {
            console.log('✅ Manual extraction success!');
            state.lastResponse = manualResult;
            
            var htmlEditor = document.getElementById('htmlEditor');
            var cssEditor = document.getElementById('cssEditor');
            var jsEditor = document.getElementById('jsEditor');
            
            if (htmlEditor) htmlEditor.value = manualResult.html;
            if (cssEditor) cssEditor.value = manualResult.css;
            if (jsEditor) jsEditor.value = manualResult.js;
            
            updatePreview();
            
            var downloadBtn = document.getElementById('downloadBtn');
            var codesandboxBtn = document.getElementById('codesandboxBtn');
            if (downloadBtn) downloadBtn.disabled = false;
            if (codesandboxBtn) codesandboxBtn.disabled = false;
            return;
        }
        
        throw new Error('Gagal parse JSON dari AI. Coba lagi dengan prompt yang lebih pendek.');
    }
}

// ===== REPAIR INCOMPLETE JSON =====
function repairIncompleteJSON(text) {
    var lines = text.split('\n');
    var lastLine = lines[lines.length - 1];
    
    if (lastLine && !lastLine.includes('"') && !lastLine.includes('}')) {
        lines.pop();
    }
    
    var fixed = lines.join('\n');
    var openBraces = (fixed.match(/\{/g) || []).length;
    var closeBraces = (fixed.match(/\}/g) || []).length;
    var openBrackets = (fixed.match(/\[/g) || []).length;
    var closeBrackets = (fixed.match(/\]/g) || []).length;
    
    while (openBraces > closeBraces) {
        fixed += '}';
        closeBraces++;
    }
    while (openBrackets > closeBrackets) {
        fixed += ']';
        closeBrackets++;
    }
    
    return fixed;
}

// ===== MANUAL EXTRACT (FALLBACK) =====
function manualExtract(text) {
    try {
        var htmlMatch = text.match(/"html"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);
        var cssMatch = text.match(/"css"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);
        var jsMatch = text.match(/"js"\s*:\s*"([\s\S]*?)"(?=\s*[,}])/);
        
        var html = htmlMatch ? htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
        var css = cssMatch ? cssMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
        var js = jsMatch ? jsMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
        
        if (html || css || js) {
            return { html: html, css: css, js: js };
        }
    } catch (e) {}
    return null;
}

function updatePreview() {
    var htmlEditor = document.getElementById('htmlEditor');
    var cssEditor = document.getElementById('cssEditor');
    var jsEditor = document.getElementById('jsEditor');
    
    var html = htmlEditor ? htmlEditor.value : '';
    var css = cssEditor ? cssEditor.value : '';
    var js = jsEditor ? jsEditor.value : '';

    var fontSelect = document.getElementById('font');
    var frameworkSelect = document.getElementById('framework');
    
    var fontName = fontSelect ? fontSelect.value : 'Plus Jakarta Sans';
    var fontLink = '<link href="https://fonts.googleapis.com/css2?family=' + fontName.replace(/ /g, '+') + ':wght@400;600;800&display=swap" rel="stylesheet">';
    var faLink = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">';
    
    var frameworkCDN = '';
    var framework = frameworkSelect ? frameworkSelect.value : 'Tailwind CSS (CDN)';
    if (framework.indexOf('Tailwind') !== -1) {
        frameworkCDN = '<script src="https://cdn.tailwindcss.com"><\/script>';
    } else if (framework.indexOf('Bootstrap') !== -1) {
        frameworkCDN = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
    } else if (framework.indexOf('Bulma') !== -1) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">';
    } else if (framework.indexOf('Materialize') !== -1) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">';
    }

    var fullHtml = '<html><head>' + fontLink + faLink + frameworkCDN + '<style>' + css + '</style></head><body>' + html + '<script>' + js + '<\/script></body></html>';

    var iframe = document.getElementById('previewFrame');
    if (iframe) {
        if (iframe.src && iframe.src.indexOf('blob:') === 0) {
            URL.revokeObjectURL(iframe.src);
        }
        var blob = new Blob([fullHtml], { type: 'text/html' });
        var url = URL.createObjectURL(blob);
        iframe.src = url;
    }
}

// ============================================================
// EDITOR
// ============================================================

function initEditors() {
    var ids = ['htmlEditor', 'cssEditor', 'jsEditor'];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) {
            el.addEventListener('input', updatePreview);
        }
    }
}

// ============================================================
// CODE SANDBOX
// ============================================================

function openInCodeSandbox() {
    var htmlEditor = document.getElementById('htmlEditor');
    var cssEditor = document.getElementById('cssEditor');
    var jsEditor = document.getElementById('jsEditor');
    
    var html = htmlEditor ? htmlEditor.value : '';
    var css = cssEditor ? cssEditor.value : '';
    var js = jsEditor ? jsEditor.value : '';

    var files = {
        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Adjarindo AI</title>\n  <style>' + css + '</style>\n</head>\n<body>\n' + html + '\n  <script>' + js + '<\/script>\n</body>\n</html>',
        'style.css': css,
        'script.js': js
    };

    var params = new URLSearchParams({
        files: JSON.stringify(files),
        title: 'Generated by Adjarindo AI'
    });

    window.open('https://codesandbox.io/api/v1/sandboxes/define?' + params.toString(), '_blank');
}

// ============================================================
// SETTINGS
// ============================================================

function getKeys() {
    return {
        gemini: localStorage.getItem(STORAGE_KEYS.gemini) || '',
        groq: localStorage.getItem(STORAGE_KEYS.groq) || ''
    };
}

function saveKeys(gemini, groq) {
    localStorage.setItem(STORAGE_KEYS.gemini, gemini);
    localStorage.setItem(STORAGE_KEYS.groq, groq);
}

function initSettings() {
    var keys = getKeys();
    var geminiInput = document.getElementById('geminiKeyInput');
    var groqInput = document.getElementById('groqKeyInput');
    if (geminiInput) geminiInput.value = keys.gemini;
    if (groqInput) groqInput.value = keys.groq;

    var settingsBtn = document.getElementById('settingsBtn');
    var closeSettings = document.getElementById('closeSettings');
    var saveKeysBtn = document.getElementById('saveKeysBtn');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            var modal = document.getElementById('settingsModal');
            if (modal) modal.classList.add('modal-open', 'flex');
        });
    }

    if (closeSettings) {
        closeSettings.addEventListener('click', function() {
            var modal = document.getElementById('settingsModal');
            if (modal) modal.classList.remove('modal-open', 'flex');
        });
    }

    if (saveKeysBtn) {
        saveKeysBtn.addEventListener('click', function() {
            var gemini = document.getElementById('geminiKeyInput');
            var groq = document.getElementById('groqKeyInput');
            var geminiVal = gemini ? gemini.value.trim() : '';
            var groqVal = groq ? groq.value.trim() : '';
            saveKeys(geminiVal, groqVal);
            alert('✅ API Key berhasil disimpan!');
            var modal = document.getElementById('settingsModal');
            if (modal) modal.classList.remove('modal-open', 'flex');
        });
    }
}

// ============================================================
// DOWNLOAD ZIP
// ============================================================

async function downloadZip() {
    var statusLog = document.getElementById('statusLog');
    if (statusLog) statusLog.innerHTML = '⏳ Mengemas file ZIP...';

    var htmlEditor = document.getElementById('htmlEditor');
    var cssEditor = document.getElementById('cssEditor');
    var jsEditor = document.getElementById('jsEditor');
    
    var html = htmlEditor ? htmlEditor.value : '';
    var css = cssEditor ? cssEditor.value : '';
    var js = jsEditor ? jsEditor.value : '';

    var zip = new JSZip();

    var fontSelect = document.getElementById('font');
    var frameworkSelect = document.getElementById('framework');
    
    var fontName = fontSelect ? fontSelect.value : 'Plus Jakarta Sans';
    var fontLink = '<link href="https://fonts.googleapis.com/css2?family=' + fontName.replace(/ /g, '+') + ':wght@400;600;800&display=swap" rel="stylesheet">';
    var faLink = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">';
    
    var frameworkCDN = '';
    var framework = frameworkSelect ? frameworkSelect.value : 'Tailwind CSS (CDN)';
    if (framework.indexOf('Tailwind') !== -1) {
        frameworkCDN = '<script src="https://cdn.tailwindcss.com"><\/script>';
    } else if (framework.indexOf('Bootstrap') !== -1) {
        frameworkCDN = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
    } else if (framework.indexOf('Bulma') !== -1) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">';
    } else if (framework.indexOf('Materialize') !== -1) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">';
    }

    var fullHtml = '<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Generated by Adjarindo AI</title>\n  ' + fontLink + '\n  ' + faLink + '\n  ' + frameworkCDN + '\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n' + html + '\n  <script src="script.js"><\/script>\n</body>\n</html>';
    
    zip.file("index.html", fullHtml);
    zip.file("style.css", css);
    zip.file("script.js", js);

    // Database Templates
    var dbTemplates = {
        'database-templates/google-sheets/appscript.js': '// Google Sheets App Script\nfunction createTables() {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var sheet = ss.getSheetByName(\'Users\');\n  if (!sheet) {\n    sheet = ss.insertSheet(\'Users\');\n    sheet.getRange(\'A1:E1\').setValues([[\'ID\', \'Name\', \'Email\', \'CreatedAt\', \'Status\']]);\n  }\n  sheet = ss.getSheetByName(\'Projects\');\n  if (!sheet) {\n    sheet = ss.insertSheet(\'Projects\');\n    sheet.getRange(\'A1:F1\').setValues([[\'ID\', \'UserID\', \'ProjectName\', \'HTML\', \'CSS\', \'JS\']]);\n  }\n  SpreadsheetApp.getUi().alert(\'✅ Database siap!\');\n}',
        'database-templates/google-sheets/GUIDE.md': '# Google Sheets Setup\n1. Buka https://sheets.google.com\n2. Buat spreadsheet baru\n3. Klik Extensions > Apps Script\n4. Paste kode appscript.js\n5. Klik Save dan Run',
        'database-templates/supabase/schema.sql': 'CREATE TABLE projects (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES auth.users(id),\n  name TEXT NOT NULL,\n  html TEXT,\n  css TEXT,\n  js TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\nALTER TABLE projects ENABLE ROW LEVEL SECURITY;',
        'database-templates/supabase/GUIDE.md': '# Supabase Setup\n1. Buka https://supabase.com\n2. Buat project baru\n3. Buka SQL Editor\n4. Paste schema.sql\n5. Klik Run',
        'database-templates/cloudflare-d1/schema.sql': 'CREATE TABLE IF NOT EXISTS projects (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  name TEXT NOT NULL,\n  html TEXT,\n  css TEXT,\n  js TEXT,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);',
        'database-templates/cloudflare-d1/GUIDE.md': '# Cloudflare D1 Setup\n1. Buka https://dash.cloudflare.com\n2. Pilih Workers & Pages > D1\n3. Buat database baru\n4. Buka Console dan paste schema.sql'
    };

    for (var path in dbTemplates) {
        zip.file(path, dbTemplates[path]);
    }

    var deployGuides = {
        'deploy-guides/cloudflare-pages.md': '# Deploy ke Cloudflare Pages\n\n1. Upload ke GitHub\n2. Buka Cloudflare Dashboard\n3. Pilih Workers & Pages\n4. Connect ke GitHub\n5. Deploy!',
        'deploy-guides/vercel.md': '# Deploy ke Vercel\n\n1. Upload ke GitHub\n2. Buka Vercel\n3. Import dari GitHub\n4. Deploy!',
        'deploy-guides/netlify.md': '# Deploy ke Netlify\n\n1. Buka Netlify\n2. Drag & drop folder\n3. Selesai!'
    };

    for (var path2 in deployGuides) {
        zip.file(path2, deployGuides[path2]);
    }

    zip.file('DEPLOY_GUIDE.md', '# PANDUAN DEPLOY\n\nBaca file di folder deploy-guides/\n\n🎉 Selamat!');

    try {
        var content = await zip.generateAsync({ type: 'blob' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'Adjarindo_Web_Project.zip';
        a.click();
        URL.revokeObjectURL(a.href);
        if (statusLog) statusLog.innerHTML = '✅ ZIP berhasil diunduh!';
    } catch (error) {
        console.error('Zip Error:', error);
        if (statusLog) statusLog.innerHTML = '❌ Gagal membuat ZIP: ' + error.message;
    }
}

// ============================================================
// PWA
// ============================================================

function initPWA() {
    var deferredPrompt;
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        var installBtn = document.getElementById('installBtn');
        if (installBtn) installBtn.classList.remove('hidden');
    });

    var installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async function() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                installBtn.classList.add('hidden');
                deferredPrompt = null;
            }
        });
    }
}

// ============================================================
// TABS
// ============================================================

function initTabs() {
    var tabs = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var allTabs = document.querySelectorAll('.tab-btn');
            for (var j = 0; j < allTabs.length; j++) {
                allTabs[j].classList.remove('active', 'border-blue-500', 'text-blue-400');
            }
            this.classList.add('active', 'border-blue-500', 'text-blue-400');
            
            var contents = document.querySelectorAll('.tab-content');
            for (var k = 0; k < contents.length; k++) {
                contents[k].classList.add('hidden');
            }
            var tabId = this.dataset.tab + 'Tab';
            var target = document.getElementById(tabId);
            if (target) target.classList.remove('hidden');
            
            if (this.dataset.tab === 'html') {
                var editor = document.getElementById('htmlEditor');
                if (editor) editor.focus();
            }
        });
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Adjarindo AI Generator starting...');
    
    initAuth();
    initAdmin();
    initAI();
    initEditors();
    initSettings();
    initPWA();
    initTabs();
    
    var generateBtn = document.getElementById('generateBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var codesandboxBtn = document.getElementById('codesandboxBtn');
    var logoutBtn = document.getElementById('logoutBtn');
    
    if (generateBtn) generateBtn.addEventListener('click', generateCode);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadZip);
    if (codesandboxBtn) codesandboxBtn.addEventListener('click', openInCodeSandbox);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    console.log('✅ Adjarindo AI Generator ready!');
});

// ============================================================
// EXPOSE FUNCTIONS TO GLOBAL
// ============================================================

window.deleteToken = deleteToken;
window.downloadZip = downloadZip;
window.openInCodeSandbox = openInCodeSandbox;
window.generateCode = generateCode;
window.logout = logout;
