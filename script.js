// ============================================================
// ADJARINDO AI WEB GENERATOR - FIXED VERSION
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

function generateTokenData(token, expiryType = '24h') {
    const now = new Date();
    const expiry = new Date(now);
    let maxUses = 0;
    if (expiryType === '24h') {
        expiry.setHours(expiry.getHours() + 24);
        maxUses = 0;
    } else if (expiryType === '3x') {
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
        return { valid: false, reason: 'Token sudah expired (melewati 24 jam)' };
    }
    if (tokenData.maxUses > 0 && tokenData.used >= tokenData.maxUses) {
        const filtered = tokens.filter(t => t.token !== token);
        saveTokens(filtered);
        return { valid: false, reason: `Token sudah digunakan ${tokenData.maxUses} kali (batas maksimal)` };
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

function removeToken(token) {
    let tokens = getTokens();
    const filtered = tokens.filter(t => t.token !== token);
    saveTokens(filtered);
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
    updateTokenInfo();
    
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('tokenInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const token = document.getElementById('tokenInput').value.trim();
    const errorEl = document.getElementById('loginError');
    const infoEl = document.getElementById('tokenInfo');
    
    if (!token) {
        errorEl.textContent = '❌ Masukkan token terlebih dahulu!';
        errorEl.classList.remove('hidden');
        infoEl.classList.add('hidden');
        return;
    }

    const validation = isTokenValid(token);
    console.log('Validasi token:', validation);
    
    if (!validation.valid) {
        errorEl.textContent = `❌ ${validation.reason}`;
        errorEl.classList.remove('hidden');
        infoEl.classList.add('hidden');
        return;
    }

    useToken(token);
    localStorage.setItem(STORAGE_KEYS.token, token);
    state.isLoggedIn = true;
    state.currentToken = token;
    updateStats('login');
    showApp();
    errorEl.classList.add('hidden');
    infoEl.classList.add('hidden');
    document.getElementById('tokenInput').value = '';
}

function showLogin() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('appContainer').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
    updateTokenInfo();
}

function showApp() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('appContainer').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.token);
    state.isLoggedIn = false;
    state.currentToken = null;
    showLogin();
    document.getElementById('tokenInput').value = '';
}

function updateTokenInfo() {
    const token = document.getElementById('tokenInput').value.trim();
    const infoContainer = document.getElementById('tokenInfo');
    if (token) {
        const validation = isTokenValid(token);
        if (validation.valid && validation.data) {
            infoContainer.classList.remove('hidden');
            document.getElementById('tokenRemaining').textContent = validation.remaining;
            document.getElementById('tokenMaxUses').textContent = validation.data.maxUses > 0 ? validation.data.maxUses : '∞';
            document.getElementById('tokenExpiryDate').textContent = validation.expiryDate;
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

    document.getElementById('adminAccessBtn').addEventListener('click', () => {
        if (!state.isLoggedIn) return;
        if (sessionStorage.getItem('admin_session') === 'true') {
            showAdminDashboard();
        } else {
            promptAdminPassword();
        }
    });

    document.getElementById('backToAppBtn').addEventListener('click', () => {
        document.getElementById('adminDashboard').classList.remove('active');
        document.getElementById('appContainer').classList.add('active');
    });

    document.getElementById('addTokenBtn').addEventListener('click', addNewToken);
    document.getElementById('newTokenInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addNewToken();
    });

    window.addEventListener('hashchange', () => {
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
    document.getElementById('appContainer').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    renderTokens();
    renderStats();
}

function addNewToken() {
    const input = document.getElementById('newTokenInput');
    const token = input.value.trim();
    const expiryType = document.getElementById('tokenExpiry').value;
    
    if (!token) {
        alert('Masukkan token terlebih dahulu!');
        return;
    }

    let tokens = getTokens();
    if (tokens.some(t => t.token === token)) {
        alert('Token sudah ada!');
        return;
    }

    const tokenData = generateTokenData(token, expiryType);
    tokens.push(tokenData);
    saveTokens(tokens);
    input.value = '';
    renderTokens();
    alert(`✅ Token berhasil ditambahkan!\n\nToken: ${token}\nBerlaku: ${expiryType === '24h' ? '24 Jam (unlimited use)' : '3x Login (tanpa batas waktu)'}`);
}

function deleteToken(token) {
    if (token === 'AJARIND2025') {
        alert('⚠️ Token default tidak bisa dihapus!');
        return;
    }
    if (!confirm(`Hapus token "${token}"?`)) return;
    removeToken(token);
    renderTokens();
}

function renderTokens() {
    const container = document.getElementById('tokenList');
    const tokens = getTokens();
    const totalTokens = document.getElementById('totalTokens');
    
    if (tokens.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm">Belum ada token. Tambahkan token baru di atas.</p>';
        if (totalTokens) totalTokens.textContent = '0';
        return;
    }

    if (totalTokens) totalTokens.textContent = tokens.length;

    container.innerHTML = tokens.map(tokenData => {
        const now = new Date();
        const expiry = new Date(tokenData.expiry);
        const isExpired = now > expiry;
        const isLimited = tokenData.maxUses > 0;
        const remaining = isLimited ? tokenData.maxUses - tokenData.used : '∞';
        const isDefault = tokenData.token === 'AJARIND2025';
        
        let statusBadge = '';
        if (isExpired) {
            statusBadge = '<span class="token-expiry-badge expired">❌ Expired</span>';
        } else if (isLimited && remaining <= 0) {
            statusBadge = '<span class="token-expiry-badge expired">❌ Habis</span>';
        } else if (isLimited) {
            statusBadge = `<span class="token-expiry-badge limited">🔢 ${remaining} dari ${tokenData.maxUses}</span>`;
        } else {
            statusBadge = `<span class="token-expiry-badge valid">⏰ ${new Date(tokenData.expiry).toLocaleString('id-ID')}</span>`;
        }

        const expiryTypeLabel = tokenData.expiryType === '24h' ? '24 Jam' : '3x Login';

        return `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 glass p-3 rounded-lg hover:bg-white/5 transition">
                <div class="flex flex-col md:flex-row md:items-center gap-2 flex-wrap">
                    <span class="font-mono text-sm text-blue-300">${tokenData.token}</span>
                    <span class="text-xs text-slate-400">${expiryTypeLabel}</span>
                    ${statusBadge}
                    ${isDefault ? '<span class="text-xs text-yellow-400">⭐ Default</span>' : ''}
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-500">Dipakai: ${tokenData.used}x</span>
                    ${!isDefault ? `<button onclick="deleteToken('${tokenData.token}')" class="text-red-400 hover:text-red-300 transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// STATISTICS
// ============================================================

function getStats() {
    const defaultStats = {
        totalUsers: 1,
        totalGenerations: 0,
        activeUsers: 0,
        lastActive: new Date().toISOString(),
        dailyLog: {}
    };
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || 'null');
    if (!stats) {
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(defaultStats));
        return defaultStats;
    }
    return stats;
}

function updateStats(type) {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];
    if (type === 'login') {
        const tokens = getTokens();
        stats.totalUsers = tokens.length;
        if (!stats.dailyLog) stats.dailyLog = {};
        if (!stats.dailyLog[today]) stats.dailyLog[today] = { logins: 0, generations: 0 };
        stats.dailyLog[today].logins += 1;
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        stats.activeUsers = Object.keys(stats.dailyLog)
            .filter(date => date >= last24h)
            .reduce((sum, date) => sum + stats.dailyLog[date].logins + stats.dailyLog[date].generations, 0);
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
    const stats = getStats();
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('totalGenerations').textContent = stats.totalGenerations || 0;
    document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
}

// ============================================================
// AI ENGINE
// ============================================================

function initAI() {
    document.querySelectorAll('.ai-engine-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ai-engine-btn').forEach(b => {
                b.classList.remove('active', 'bg-blue-600');
                b.classList.add('bg-slate-700');
            });
            this.classList.add('active', 'bg-blue-600');
            this.classList.remove('bg-slate-700');
            state.selectedAI = this.dataset.ai;
            document.getElementById('groqSelector').classList.toggle('hidden', state.selectedAI === 'gemini');
        });
    });
}

function buildSystemPrompt() {
    const framework = document.getElementById('framework').value;
    const style = document.getElementById('style').value;
    const font = document.getElementById('font').value;
    const icons = document.getElementById('icons').value;
    const userPrompt = document.getElementById('promptInput').value;

    let frameworkCDN = '';
    if (framework.includes('Tailwind')) {
        frameworkCDN = '<script src="https://cdn.tailwindcss.com"><\/script>';
    } else if (framework.includes('Bootstrap')) {
        frameworkCDN = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
    } else if (framework.includes('Bulma')) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">';
    } else if (framework.includes('Materialize')) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">';
    }

    let iconCDN = '';
    if (icons.includes('Font Awesome')) {
        iconCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">';
    } else if (icons.includes('Boxicons')) {
        iconCDN = '<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">';
    } else if (icons.includes('Remix')) {
        iconCDN = '<link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet">';
    }

    return `
Anda adalah AI Expert Web Developer. Tugas: Buat kode web yang FUNGSIONAL dan SIAP PAKAI berdasarkan instruksi user.

Aturan WAJIB:
1. Output HANYA boleh berupa JSON valid, tanpa markdown \`\`\`json atau teks lain.
2. Struktur JSON: {"html": "...", "css": "...", "js": "..."}
3. File HTML jangan masukkan <style> atau <script> inline, pisahkan ke css dan js.
4. Jangan ulangi tag <head>, <html>, <body>. Cukup isi tag body (struktur) untuk html.
5. CSS harus lengkap dengan styling yang modern, responsive, dan FUNGSIONAL.
6. JS harus FUNGSIONAL (bisa interaksi, validasi form, dll) - BUKAN hanya contoh!

Spesifikasi Teknis:
- Framework CSS: ${framework}
- Desain Konsep: ${style}
- Font: ${font} (Via Google Fonts: https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;600;800&display=swap)
- Icons: ${icons} (Via CDN: ${iconCDN})

Instruksi User: ${userPrompt}

Tips Desain:
- Glassmorphism: gunakan backdrop-filter: blur(), background: rgba(), border: 1px solid rgba()
- Neumorphism: gunakan box-shadow dengan warna gelap dan terang
- Minimalis Flat: gunakan warna solid, shadow minimal
- Dark Mode: background #0f172a atau #1a1a2e, teks putih
- Gradient Vibes: gunakan gradien warna cerah
- Minimalis White: background putih, teks gelap
- Retro Wave: warna neon, font bold, border glow

PASTIKAN:
✅ Hasilnya responsive di semua device
✅ Semua tombol dan form berfungsi
✅ JavaScript yang dihasilkan FUNGSIONAL (bukan dummy)
✅ Hasilnya siap pakai untuk di-deploy
`;
}

async function generateCode() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (!prompt) {
        alert('Masukkan deskripsi web yang ingin dibuat!');
        return;
    }

    const keys = getKeys();
    if (!keys.gemini && !keys.groq) {
        alert('Mohon masukkan API Key di Settings terlebih dahulu!');
        return;
    }

    if (state.isGenerating) return;
    state.isGenerating = true;

    const systemPrompt = buildSystemPrompt();
    const statusLog = document.getElementById('statusLog');
    const generateBtn = document.getElementById('generateBtn');

    statusLog.innerHTML = '⏳ Menghubungi AI...';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating...';

    try {
        let result = null;
        
        if (state.selectedAI === 'gemini' && keys.gemini) {
            statusLog.innerHTML = '🤖 Menggunakan Gemini 2.5 Flash...';
            result = await callGemini(systemPrompt, keys.gemini);
        } else if (state.selectedAI === 'groq' && keys.groq) {
            statusLog.innerHTML = '⚡ Menggunakan Groq...';
            result = await callGroq(systemPrompt, keys.groq);
        } else {
            if (keys.gemini) {
                try {
                    statusLog.innerHTML = '🤖 Mencoba Gemini...';
                    result = await callGemini(systemPrompt, keys.gemini);
                } catch (e) {
                    statusLog.innerHTML = '⚠️ Gemini error, beralih ke Groq...';
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
            processAIResponse(result);
            updateStats('generate');
            statusLog.innerHTML = '✅ Generate sukses! Hasil WEB APP FUNGSIONAL siap pakai! 🚀';
        }

    } catch (error) {
        statusLog.innerHTML = `❌ Error: ${error.message}`;
        console.error('Generate Error:', error);
    }

    state.isGenerating = false;
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Generate Kode';
}

async function callGemini(prompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Tidak ada response dari Gemini');
    }

    return data.candidates[0].content.parts[0].text;
}

async function callGroq(prompt, apiKey) {
    const model = document.getElementById('groqModel').value;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful AI that only outputs valid JSON. The JSON must be valid and parseable.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8192,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API Error');
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error('Tidak ada response dari Groq');
    }

    return data.choices[0].message.content;
}

// ============================================================
// PROCESS & RENDER
// ============================================================

function processAIResponse(text) {
    try {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        
        let htmlPart = parsed.html || '';
        let cssPart = parsed.css || '';
        let jsPart = parsed.js || '';

        if (!cssPart && htmlPart) {
            const styleMatch = htmlPart.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            if (styleMatch) {
                cssPart = styleMatch[1].trim();
                htmlPart = htmlPart.replace(/<style[^>]*>[\s\S]*?<\/style>/, '');
            }
        }
        if (!jsPart && htmlPart) {
            const scriptMatch = htmlPart.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (scriptMatch) {
                jsPart = scriptMatch[1].trim();
                htmlPart = htmlPart.replace(/<script[^>]*>[\s\S]*?<\/script>/, '');
            }
        }

        state.lastResponse = { html: htmlPart, css: cssPart, js: jsPart };

        document.getElementById('htmlEditor').value = htmlPart;
        document.getElementById('cssEditor').value = cssPart;
        document.getElementById('jsEditor').value = jsPart;

        updatePreview();

        document.getElementById('downloadBtn').disabled = false;
        document.getElementById('codesandboxBtn').disabled = false;

    } catch (e) {
        console.error('Parse Error:', e, text);
        throw new Error('Gagal parse JSON dari AI. Coba lagi.');
    }
}

function updatePreview() {
    const html = document.getElementById('htmlEditor').value;
    const css = document.getElementById('cssEditor').value;
    const js = document.getElementById('jsEditor').value;

    const fontName = document.getElementById('font').value;
    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;600;800&display=swap" rel="stylesheet">`;
    const faLink = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;
    
    let frameworkCDN = '';
    const framework = document.getElementById('framework').value;
    if (framework.includes('Tailwind')) {
        frameworkCDN = '<script src="https://cdn.tailwindcss.com"><\/script>';
    } else if (framework.includes('Bootstrap')) {
        frameworkCDN = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
    } else if (framework.includes('Bulma')) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">';
    } else if (framework.includes('Materialize')) {
        frameworkCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">';
    }

    const fullHtml = `
        <html>
            <head>
                ${fontLink}
                ${faLink}
                ${frameworkCDN}
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
        </html>
    `;

    const iframe = document.getElementById('previewFrame');
    if (iframe.src && iframe.src.startsWith('blob:')) {
        URL.revokeObjectURL(iframe.src);
    }
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
}

// ============================================================
// EDITOR
// ============================================================

function initEditors() {
    ['htmlEditor', 'cssEditor', 'jsEditor'].forEach(id => {
        document.getElementById(id).addEventListener('input', updatePreview);
    });
}

// ============================================================
// CODE SANDBOX
// ============================================================

function openInCodeSandbox() {
    const html = document.getElementById('htmlEditor').value;
    const css = document.getElementById('cssEditor').value;
    const js = document.getElementById('jsEditor').value;

    const files = {
        'index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Adjarindo AI</title>\n  <style>${css}</style>\n</head>\n<body>\n${html}\n  <script>${js}<\/script>\n</body>\n</html>`,
        'style.css': css,
        'script.js': js
    };

    const params = new URLSearchParams({
        files: JSON.stringify(files),
        title: 'Generated by Adjarindo AI'
    });

    window.open(`https://codesandbox.io/api/v1/sandboxes/define?${params}`, '_blank');
}

// ============================================================
// DOWNLOAD ZIP
// ============================================================

async function downloadZip() {
    const statusLog = document.getElementById('statusLog');
    statusLog.innerHTML = '⏳ Mengemas file ZIP...';

    const html = document.getElementById('htmlEditor').value;
    const css = document.getElementById('cssEditor').value;
    const js = document.getElementById('jsEditor').value;

    const zip = new JSZip();

    const fontName = document.getElementById('font').value;
    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:
