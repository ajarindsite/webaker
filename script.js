// ============================================================
// ADJARINDO AI WEB GENERATOR - FULL SCRIPT
// ============================================================

// ===== CONFIGURATION =====
const DEFAULT_TOKENS = ['AJARIND2025', 'ADMIN123'];
const STORAGE_KEYS = {
    tokens: 'adjarindo_tokens',
    stats: 'adjarindo_stats',
    gemini: 'gemini_key',
    groq: 'groq_key'
};

// ===== STATE =====
let state = {
    isLoggedIn: false,
    selectedAI: 'gemini',
    lastResponse: { html: '', css: '', js: '' },
    isGenerating: false
};

// ============================================================
// AUTHENTICATION SYSTEM
// ============================================================

function initAuth() {
    // Load tokens from localStorage
    let tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.tokens) || '[]');
    if (tokens.length === 0) {
        tokens = DEFAULT_TOKENS;
        localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(tokens));
    }

    // Check if user is logged in
    const savedToken = localStorage.getItem('adjarindo_token');
    if (savedToken && tokens.includes(savedToken)) {
        state.isLoggedIn = true;
        showApp();
    } else {
        showLogin();
    }

    // Login button
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('tokenInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const token = document.getElementById('tokenInput').value.trim();
    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.tokens) || '[]');
    
    if (tokens.includes(token)) {
        localStorage.setItem('adjarindo_token', token);
        state.isLoggedIn = true;
        
        // Update stats
        updateStats('login');
        
        showApp();
        document.getElementById('loginError').classList.add('hidden');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function showLogin() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('appContainer').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
}

function showApp() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('appContainer').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
}

function logout() {
    localStorage.removeItem('adjarindo_token');
    state.isLoggedIn = false;
    showLogin();
    document.getElementById('tokenInput').value = '';
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function initAdmin() {
    // Admin access via #admin or button
    const hash = window.location.hash;
    if (hash === '#admin') {
        showAdminDashboard();
    }

    document.getElementById('adminAccessBtn').addEventListener('click', () => {
        if (state.isLoggedIn) {
            showAdminDashboard();
        }
    });

    document.getElementById('backToAppBtn').addEventListener('click', () => {
        document.getElementById('adminDashboard').classList.remove('active');
        document.getElementById('appContainer').classList.add('active');
    });

    // Add token
    document.getElementById('addTokenBtn').addEventListener('click', addNewToken);
    document.getElementById('newTokenInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addNewToken();
    });

    // Render tokens
    renderTokens();
    renderStats();

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#admin' && state.isLoggedIn) {
            showAdminDashboard();
        }
    });
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
    
    if (!token) {
        alert('Masukkan token terlebih dahulu!');
        return;
    }

    let tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.tokens) || '[]');
    if (tokens.includes(token)) {
        alert('Token sudah ada!');
        return;
    }

    tokens.push(token);
    localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(tokens));
    input.value = '';
    renderTokens();
    alert('✅ Token berhasil ditambahkan!');
}

function deleteToken(token) {
    if (token === 'AJARIND2025') {
        alert('⚠️ Token default tidak bisa dihapus!');
        return;
    }

    if (!confirm(`Hapus token "${token}"?`)) return;

    let tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.tokens) || '[]');
    tokens = tokens.filter(t => t !== token);
    localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify(tokens));
    renderTokens();
}

function renderTokens() {
    const container = document.getElementById('tokenList');
    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.tokens) || '[]');
    
    if (tokens.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm">Belum ada token. Tambahkan token baru di atas.</p>';
        return;
    }

    container.innerHTML = tokens.map(token => `
        <div class="flex justify-between items-center glass p-3 rounded-lg hover:bg-white/5 transition">
            <span class="font-mono text-sm text-blue-300">${token}</span>
            <button onclick="deleteToken('${token}')" class="text-red-400 hover:text-red-300 transition ${token === 'AJARIND2025' ? 'opacity-50 cursor-not-allowed' : ''}" ${token === 'AJARIND2025' ? 'disabled' : ''}>
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// ============================================================
// STATISTICS SYSTEM
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
        // Count unique users (based on token)
        const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.tokens) || '[]');
        stats.totalUsers = tokens.length;
        
        // Active users today
        if (!stats.dailyLog) stats.dailyLog = {};
        if (!stats.dailyLog[today]) stats.dailyLog[today] = { logins: 0, generations: 0 };
        stats.dailyLog[today].logins += 1;
        
        // Calculate active users (last 24 hours)
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
    // AI Engine toggle
    document.querySelectorAll('.ai-engine-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ai-engine-btn').forEach(b => {
                b.classList.remove('active', 'bg-blue-600');
                b.classList.add('bg-slate-700');
            });
            this.classList.add('active', 'bg-blue-600');
            this.classList.remove('bg-slate-700');
            
            state.selectedAI = this.dataset.ai;
            
            // Show/hide Groq selector
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

    // Map framework to CDN
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

    // Map icons
    let iconCDN = '';
    if (icons.includes('Font Awesome')) {
        iconCDN = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">';
    } else if (icons.includes('Boxicons')) {
        iconCDN = '<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">';
    } else if (icons.includes('Remix')) {
        iconCDN = '<link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet">';
    }

    return `
Anda adalah AI Expert Web Developer. Tugas: Buat kode web berdasarkan instruksi user.

Aturan WAJIB:
1. Output HANYA boleh berupa JSON valid, tanpa markdown \`\`\`json atau teks lain.
2. Struktur JSON: {"html": "...", "css": "...", "js": "..."}
3. File HTML jangan masukkan <style> atau <script> inline, pisahkan ke css dan js.
4. Jangan ulangi tag <head>, <html>, <body>. Cukup isi tag body (struktur) untuk html.
5. CSS harus lengkap dengan styling yang modern dan responsive.
6. JS harus fungsional (jika ada interaksi).

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

Pastikan hasilnya responsive dan professional!
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
            // Fallback: coba Gemini dulu, lalu Groq
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
            statusLog.innerHTML = '✅ Generate sukses! Bisa download atau edit kode.';
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
                { role: 'system', content: 'You are a helpful AI that only outputs valid JSON.' },
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
        // Clean up markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        
        let htmlPart = parsed.html || '';
        let cssPart = parsed.css || '';
        let jsPart = parsed.js || '';

        // Auto-extract if AI put style/script in HTML
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

        // Update editors
        document.getElementById('htmlEditor').value = htmlPart;
        document.getElementById('cssEditor').value = cssPart;
        document.getElementById('jsEditor').value = jsPart;

        // Update preview
        updatePreview();

        // Enable buttons
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
    // Auto-update preview on input
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

    // Main files
    const fullHtml = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Generated by Adjarindo AI</title>\n  ${fontLink}\n  ${faLink}\n  ${frameworkCDN}\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n${html}\n  <script src="script.js"><\/script>\n</body>\n</html>`;
    
    zip.file("index.html", fullHtml);
    zip.file("style.css", css);
    zip.file("script.js", js);

    // Database Templates
    const dbTemplates = {
        'database-templates/google-sheets/appscript.js': `
// ============================================================
// GOOGLE SHEETS - App Script untuk Database
// ============================================================
// Cara pakai:
// 1. Buka https://sheets.google.com
// 2. Buat spreadsheet baru
// 3. Klik Extensions > Apps Script
// 4. Paste kode ini, klik Save, lalu Run

function createTables() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Users sheet
  let sheet = ss.getSheetByName('Users');
  if (!sheet) {
    sheet = ss.insertSheet('Users');
    sheet.getRange('A1:E1').setValues([
      ['ID', 'Name', 'Email', 'CreatedAt', 'Status']
    ]);
    sheet.setFrozenRows(1);
  }
  
  // Create Projects sheet
  sheet = ss.getSheetByName('Projects');
  if (!sheet) {
    sheet = ss.insertSheet('Projects');
    sheet.getRange('A1:F1').setValues([
      ['ID', 'UserID', 'ProjectName', 'HTML', 'CSS', 'JS']
    ]);
    sheet.setFrozenRows(1);
  }
  
  // Create Logs sheet
  sheet = ss.getSheetByName('Logs');
  if (!sheet) {
    sheet = ss.insertSheet('Logs');
    sheet.getRange('A1:D1').setValues([
      ['Timestamp', 'User', 'Action', 'Details']
    ]);
    sheet.setFrozenRows(1);
  }
  
  SpreadsheetApp.getUi().alert('✅ Database siap! Tabel Users, Projects, dan Logs telah dibuat.');
}

// Fungsi untuk menyimpan data
function saveProject(userId, projectName, html, css, js) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Projects');
  
  const lastRow = sheet.getLastRow();
  const newId = lastRow + 1;
  
  sheet.getRange(newId + 1, 1).setValue(newId);
  sheet.getRange(newId + 1, 2).setValue(userId);
  sheet.getRange(newId + 1, 3).setValue(projectName);
  sheet.getRange(newId + 1, 4).setValue(html);
  sheet.getRange(newId + 1, 5).setValue(css);
  sheet.getRange(newId + 1, 6).setValue(js);
  
  return newId;
}

// Fungsi untuk mendapatkan semua project
function getProjects() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Projects');
  const data = sheet.getDataRange().getValues();
  
  const headers = data[0];
  const projects = [];
  
  for (let i = 1; i < data.length; i++) {
    const project = {};
    for (let j = 0; j < headers.length; j++) {
      project[headers[j]] = data[i][j];
    }
    projects.push(project);
  }
  
  return projects;
}
        `,
        'database-templates/google-sheets/GUIDE.md': `# 📊 Google Sheets Database Setup

## Langkah 1: Buat Spreadsheet
1. Buka https://sheets.google.com
2. Klik tombol "+" untuk membuat spreadsheet baru
3. Beri nama: "Adjarindo Database"

## Langkah 2: Setup App Script
1. Klik menu "Extensions" > "Apps Script"
2. Hapus kode default, paste kode dari file appscript.js
3. Klik icon disk (Save) atau tekan Ctrl+S
4. Beri nama project: "Adjarindo DB"

## Langkah 3: Jalankan Script
1. Pilih fungsi "createTables" di dropdown
2. Klik tombol "Run" (▶️)
3. Izinkan akses (klik "Review Permissions" > "Allow")
4. Selesai! Tabel sudah dibuat.

## Cara Menggunakan
- Fungsi saveProject() untuk menyimpan project baru
- Fungsi getProjects() untuk mengambil semua project

💡 Tips: Simpan URL spreadsheet untuk akses mudah.
        `,
        'database-templates/supabase/schema.sql': `
-- ============================================================
-- SUPABASE DATABASE SCHEMA
-- ============================================================
-- Cara pakai:
-- 1. Buka https://supabase.com
-- 2. Buat project baru
-- 3. Buka SQL Editor
-- 4. Paste dan run kode ini

-- Tabel Users (auth.users sudah tersedia di Supabase)
-- Kita tambahkan tabel Projects dan Logs

-- Tabel Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html TEXT,
  css TEXT,
  js TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Logs
CREATE TABLE logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for logs
CREATE POLICY "Users can view own logs"
  ON logs FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_logs_user_id ON logs(user_id);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
        `,
        'database-templates/supabase/GUIDE.md': `# 🚀 Supabase Database Setup

## Langkah 1: Buat Akun Supabase
1. Buka https://supabase.com
2. Klik "Start your project"
3. Login dengan GitHub atau email

## Langkah 2: Buat Project Baru
1. Klik "New project"
2. Isi:
   - Name: "adjarindo-db"
   - Database Password: (buat yang kuat)
   - Region: Pilih yang terdekat
3. Klik "Create new project" (tunggu 2-3 menit)

## Langkah 3: Setup Database
1. Di dashboard, klik "SQL Editor" di sidebar kiri
2. Klik "New query"
3. Paste isi file schema.sql
4. Klik "Run" (▶️)

## Langkah 4: Dapatkan Credentials
1. Di sidebar kiri, klik "Settings" > "API"
2. Copy:
   - Project URL (contoh: https://xxxxx.supabase.co)
   - anon public key

## Cara Menggunakan
Simpan credentials di aplikasi Anda untuk koneksi ke Supabase.
        `,
        'database-templates/cloudflare-d1/schema.sql': `
-- ============================================================
-- CLOUDFLARE D1 DATABASE SCHEMA
-- ============================================================
-- Cara pakai:
-- 1. Buka https://dash.cloudflare.com
-- 2. Pilih "Workers & Pages" > "D1"
-- 3. Buat database baru
-- 4. Buka console dan paste kode ini

-- Tabel Projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  html TEXT,
  css TEXT,
  js TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Logs
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Trigger untuk auto-update updated_at
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
        `,
        'database-templates/cloudflare-d1/GUIDE.md': `# ⚡ Cloudflare D1 Database Setup

## Langkah 1: Buat Akun Cloudflare
1. Buka https://dash.cloudflare.com
2. Buat akun (gratis)

## Langkah 2: Buat Database D1
1. Di dashboard, klik "Workers & Pages"
2. Klik tab "D1" di sidebar
3. Klik "Create database"
4. Nama: "adjarindo-db"
5. Klik "Create"

## Langkah 3: Setup Schema
1. Klik database yang baru dibuat
2. Klik tab "Console"
3. Paste isi file schema.sql
4. Klik "Execute"

## Langkah 4: Dapatkan Credentials
1. Klik tab "API"
2. Copy:
   - Database ID
   - Account ID

## Cara Menggunakan
Integrasikan dengan Worker Anda menggunakan binding D1.
        `
    };

    // Add database templates
    Object.keys(dbTemplates).forEach(path => {
        zip.file(path, dbTemplates[path]);
    });

    // Deploy Guides
    const deployGuides = {
        'deploy-guides/cloudflare-pages.md': `# 🚀 Deploy ke Cloudflare Pages (GRATIS!)

## Step 1: Upload ke GitHub (2 menit)
1. Buka https://github.com dan login
2. Klik tombol hijau "New" di repositori
3. Nama repositori: "my-web"
4. Klik "Create repository"
5. Klik "Add file" > "Upload files"
6. Drag & drop semua file (index.html, style.css, script.js)
7. Klik "Commit changes"

## Step 2: Deploy ke Cloudflare (3 menit)
1. Buka https://dash.cloudflare.com
2. Pilih "Workers & Pages" di sidebar
3. Klik "Create application"
4. Pilih tab "Pages"
5. Klik "Connect to Git"
6. Pilih GitHub dan repositori "my-web"
7. Klik "Save and Deploy"

## Step 3: Selesai! (1 menit)
🎉 Web kamu online di: https://my-web.pages.dev

Bagikan linknya ke semua orang!`,
        'deploy-guides/vercel.md': `# 🚀 Deploy ke Vercel (GRATIS!)

## Step 1: Upload ke GitHub (2 menit)
1. Buka https://github.com dan login
2. Buat repositori baru
3. Upload semua file

## Step 2: Deploy ke Vercel (3 menit)
1. Buka https://vercel.com
2. Login dengan GitHub
3. Klik "Add New" > "Project"
4. Pilih repositori "my-web"
5. Klik "Deploy"

## Step 3: Selesai!
🎉 Web kamu online!`,
        'deploy-guides/netlify.md': `# 🚀 Deploy ke Netlify (GRATIS!)

## Cara Termudah: Drag & Drop
1. Buka https://app.netlify.com
2. Login dengan GitHub
3. Drag folder hasil download ke area drop
4. Tunggu deploy selesai

## Selesai!
🎉 Web kamu online!`
    };

    Object.keys(deployGuides).forEach(path => {
        zip.file(path, deployGuides[path]);
    });

    // Master Deploy Guide
    const masterGuide = `# 🚀 PANDUAN DEPLOY WEB (LENGKAP)

## Opsi 1: Cloudflare Pages (Rekomendasi)
📖 Baca: deploy-guides/cloudflare-pages.md
- Kelebihan: Cepat, gratis, CDN global
- Cocok untuk: Semua jenis web

## Opsi 2: Vercel
📖 Baca: deploy-guides/vercel.md
- Kelebihan: Mudah, integrasi GitHub bagus
- Cocok untuk: Web statis & dinamis

## Opsi 3: Netlify
📖 Baca: deploy-guides/netlify.md
- Kelebihan: Drag & drop, simple
- Cocok untuk: Web statis

## Opsi 4: Database Setup (Opsional)
Jika webmu butuh database:
- 📊 Google Sheets: database-templates/google-sheets/
- 🚀 Supabase: database-templates/supabase/
- ⚡ Cloudflare D1: database-templates/cloudflare-d1/

---
🎉 Selamat! Web kamu siap untuk di-deploy!`;

    zip.file('DEPLOY_GUIDE.md', masterGuide);

    // Generate ZIP
    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'Adjarindo_Web_Project.zip';
        a.click();
        URL.revokeObjectURL(a.href);
        document.getElementById('statusLog').innerHTML = '✅ ZIP berhasil diunduh!';
    } catch (error) {
        console.error('Zip Error:', error);
        document.getElementById('statusLog').innerHTML = '❌ Gagal membuat ZIP: ' + error.message;
    }
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
    const keys = getKeys();
    document.getElementById('geminiKeyInput').value = keys.gemini;
    document.getElementById('groqKeyInput').value = keys.groq;

    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('modal-open', 'flex');
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('modal-open', 'flex');
    });

    document.getElementById('saveKeysBtn').addEventListener('click', () => {
        const gemini = document.getElementById('geminiKeyInput').value.trim();
        const groq = document.getElementById('groqKeyInput').value.trim();
        saveKeys(gemini, groq);
        alert('✅ API Key berhasil disimpan!');
        document.getElementById('settingsModal').classList.remove('modal-open', 'flex');
    });
}

// ============================================================
// PWA
// ============================================================

function initPWA() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').classList.remove('hidden');
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            document.getElementById('installBtn').classList.add('hidden');
            deferredPrompt = null;
        }
    });
}

// ============================================================
// TABS
// ============================================================

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'border-blue-500', 'text-blue-400');
            });
            this.classList.add('active', 'border-blue-500', 'text-blue-400');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            const tabId = this.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.remove('hidden');
            
            // Refresh CodeMirror if needed
            if (this.dataset.tab === 'html') {
                document.getElementById('htmlEditor').focus();
            }
        });
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Auth
    initAuth();
    
    // Admin
    initAdmin();
    
    // AI
    initAI();
    
    // Editors
    initEditors();
    
    // Settings
    initSettings();
    
    // PWA
    initPWA();
    
    // Tabs
    initTabs();
    
    // Buttons
    document.getElementById('generateBtn').addEventListener('click', generateCode);
    document.getElementById('downloadBtn').addEventListener('click', downloadZip);
    document.getElementById('codesandboxBtn').addEventListener('click', openInCodeSandbox);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// ============================================================
// EXPOSE FUNCTIONS TO GLOBAL (for inline onclick)
// ============================================================

window.deleteToken = deleteToken;
window.downloadZip = downloadZip;
window.openInCodeSandbox = openInCodeSandbox;
