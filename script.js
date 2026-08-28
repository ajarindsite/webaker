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
        const tokens = getTokens();
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
// DOWNLOAD ZIP (dengan template database lengkap)
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

    // Database Templates (lengkap)
    const dbTemplates = {
        'database-templates/google-sheets/appscript.js': `// ============================================================\n// GOOGLE SHEETS - App Script untuk Database\n// ============================================================\n// Cara pakai:\n// 1. Buka https://sheets.google.com\n// 2. Buat spreadsheet baru\n// 3. Klik Extensions > Apps Script\n// 4. Paste kode ini, klik Save, lalu Run\n\nfunction createTables() {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  \n  // Create Users sheet\n  let sheet = ss.getSheetByName('Users');\n  if (!sheet) {\n    sheet = ss.insertSheet('Users');\n    sheet.getRange('A1:E1').setValues([\n      ['ID', 'Name', 'Email', 'CreatedAt', 'Status']\n    ]);\n    sheet.setFrozenRows(1);\n  }\n  \n  // Create Projects sheet\n  sheet = ss.getSheetByName('Projects');\n  if (!sheet) {\n    sheet = ss.insertSheet('Projects');\n    sheet.getRange('A1:F1').setValues([\n      ['ID', 'UserID', 'ProjectName', 'HTML', 'CSS', 'JS']\n    ]);\n    sheet.setFrozenRows(1);\n  }\n  \n  SpreadsheetApp.getUi().alert('✅ Database siap! Tabel Users dan Projects telah dibuat.');\n}\n\nfunction saveProject(userId, projectName, html, css, js) {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  const sheet = ss.getSheetByName('Projects');\n  const lastRow = sheet.getLastRow();\n  const newId = lastRow + 1;\n  sheet.getRange(newId + 1, 1).setValue(newId);\n  sheet.getRange(newId + 1, 2).setValue(userId);\n  sheet.getRange(newId + 1, 3).setValue(projectName);\n  sheet.getRange(newId + 1, 4).setValue(html);\n  sheet.getRange(newId + 1, 5).setValue(css);\n  sheet.getRange(newId + 1, 6).setValue(js);\n  return newId;\n}\n\nfunction getProjects() {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  const sheet = ss.getSheetByName('Projects');\n  const data = sheet.getDataRange().getValues();\n  const headers = data[0];\n  const projects = [];\n  for (let i = 1; i < data.length; i++) {\n    const project = {};\n    for (let j = 0; j < headers.length; j++) {\n      project[headers[j]] = data[i][j];\n    }\n    projects.push(project);\n  }\n  return projects;\n}`,
        'database-templates/google-sheets/GUIDE.md': `# 📊 Google Sheets Database Setup\n\n## Langkah 1: Buat Spreadsheet\n1. Buka https://sheets.google.com\n2. Klik tombol "+" untuk membuat spreadsheet baru\n3. Beri nama: "Adjarindo Database"\n\n## Langkah 2: Setup App Script\n1. Klik menu "Extensions" > "Apps Script"\n2. Hapus kode default, paste kode dari file appscript.js\n3. Klik icon disk (Save) atau tekan Ctrl+S\n4. Beri nama project: "Adjarindo DB"\n\n## Langkah 3: Jalankan Script\n1. Pilih fungsi "createTables" di dropdown\n2. Klik tombol "Run" (▶️)\n3. Izinkan akses (klik "Review Permissions" > "Allow")\n4. Selesai! Tabel sudah dibuat.\n\n## Cara Menggunakan\n- Fungsi saveProject() untuk menyimpan project baru\n- Fungsi getProjects() untuk mengambil semua project\n\n💡 Tips: Simpan URL spreadsheet untuk akses mudah.`,
        'database-templates/supabase/schema.sql': `-- ============================================================\n-- SUPABASE DATABASE SCHEMA\n-- ============================================================\n-- Cara pakai:\n-- 1. Buka https://supabase.com\n-- 2. Buat project baru\n-- 3. Buka SQL Editor\n-- 4. Paste dan run kode ini\n\n-- Tabel Projects\nCREATE TABLE projects (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,\n  name TEXT NOT NULL,\n  html TEXT,\n  css TEXT,\n  js TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- Row Level Security\nALTER TABLE projects ENABLE ROW LEVEL SECURITY;\n\n-- Policy: Users can only see their own projects\nCREATE POLICY "Users can view own projects"\n  ON projects FOR SELECT\n  USING (auth.uid() = user_id);\n\nCREATE POLICY "Users can insert own projects"\n  ON projects FOR INSERT\n  WITH CHECK (auth.uid() = user_id);\n\n-- Indexes\nCREATE INDEX idx_projects_user_id ON projects(user_id);\nCREATE INDEX idx_projects_created_at ON projects(created_at DESC);`,
        'database-templates/supabase/GUIDE.md': `# 🚀 Supabase Database Setup\n\n## Langkah 1: Buat Akun Supabase\n1. Buka https://supabase.com\n2. Klik "Start your project"\n3. Login dengan GitHub atau email\n\n## Langkah 2: Buat Project Baru\n1. Klik "New project"\n2. Isi:\n   - Name: "adjarindo-db"\n   - Database Password: (buat yang kuat)\n   - Region: Pilih yang terdekat\n3. Klik "Create new project"\n\n## Langkah 3: Setup Database\n1. Di dashboard, klik "SQL Editor"\n2. Klik "New query"\n3. Paste isi file schema.sql\n4. Klik "Run"\n\n## Langkah 4: Dapatkan Credentials\n1. Klik "Settings" > "API"\n2. Copy Project URL dan anon public key`,
        'database-templates/cloudflare-d1/schema.sql': `-- ============================================================\n-- CLOUDFLARE D1 DATABASE SCHEMA\n-- ============================================================\n-- Cara pakai:\n-- 1. Buka https://dash.cloudflare.com\n-- 2. Pilih "Workers & Pages" > "D1"\n-- 3. Buat database baru\n-- 4. Buka console dan paste kode ini\n\nCREATE TABLE IF NOT EXISTS projects (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id TEXT NOT NULL,\n  name TEXT NOT NULL,\n  html TEXT,\n  css TEXT,\n  js TEXT,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);\nCREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);`,
        'database-templates/cloudflare-d1/GUIDE.md': `# ⚡ Cloudflare D1 Database Setup\n\n## Langkah 1: Buat Akun Cloudflare\n1. Buka https://dash.cloudflare.com\n2. Buat akun (gratis)\n\n## Langkah 2: Buat Database D1\n1. Klik "Workers & Pages"\n2. Klik tab "D1"\n3. Klik "Create database"\n4. Nama: "adjarindo-db"\n\n## Langkah 3: Setup Schema\n1. Klik database yang baru dibuat\n2. Klik tab "Console"\n3. Paste isi file schema.sql\n4. Klik "Execute"\n\n## Langkah 4: Dapatkan Credentials\n1. Klik tab "API"\n2. Copy Database ID dan Account ID`
    };

    Object.keys(dbTemplates).forEach(path => {
        zip.file(path, dbTemplates[path]);
    });

    // Deploy Guides
    const deployGuides = {
        'deploy-guides/cloudflare-pages.md': `# 🚀 Deploy ke Cloudflare Pages (GRATIS!)\n\n## Step 1: Upload ke GitHub (2 menit)\n1. Buka https://github.com dan login\n2. Klik "New" di repositori\n3. Nama: "my-web"\n4. Klik "Create repository"\n5. Drag & drop semua file\n6. Klik "Commit changes"\n\n## Step 2: Deploy ke Cloudflare (3 menit)\n1. Buka https://dash.cloudflare.com\n2. Pilih "Workers & Pages"\n3. Klik "Create application"\n4. Pilih tab "Pages"\n5. Klik "Connect to Git"\n6. Pilih GitHub dan repositori "my-web"\n7. Klik "Save and Deploy"\n\n## Step 3: Selesai!\n🎉 Web online di: https://my-web.pages.dev`,
        'deploy-guides/vercel.md': `# 🚀 Deploy ke Vercel (GRATIS!)\n\n## Step 1: Upload ke GitHub (2 menit)\n1. Buka https://github.com\n2. Buat repositori baru\n3. Upload semua file\n\n## Step 2: Deploy ke Vercel (3 menit)\n1. Buka https://vercel.com\n2. Login dengan GitHub\n3. Klik "Add New" > "Project"\n4. Pilih repositori\n5. Klik "Deploy"\n\n## Step 3: Selesai!\n🎉 Web online!`,
        'deploy-guides/netlify.md': `# 🚀 Deploy ke Netlify (GRATIS!)\n\n## Cara Termudah: Drag & Drop\n1. Buka https://app.netlify.com\n2. Login dengan GitHub\n3. Drag folder hasil download ke area drop\n4. Tunggu deploy selesai\n\n## Selesai!\n🎉 Web online!`
    };

    Object.keys(deployGuides).forEach(path => {
        zip.file(path, deployGuides[path]);
    });

    // Master Deploy Guide
    const masterGuide = `# 🚀 PANDUAN DEPLOY WEB (LENGKAP)\n\n## Opsi 1: Cloudflare Pages (Rekomendasi)\n📖 Baca: deploy-guides/cloudflare-pages.md\n- Kelebihan: Cepat, gratis, CDN global\n- Cocok untuk: Semua jenis web\n\n## Opsi 2: Vercel\n📖 Baca: deploy-guides/vercel.md\n- Kelebihan: Mudah, integrasi GitHub bagus\n\n## Opsi 3: Netlify\n📖 Baca: deploy-guides/netlify.md\n- Kelebihan: Drag & drop, simple\n\n## Opsi 4: Database Setup (Opsional)\nJika webmu butuh database:\n- 📊 Google Sheets: database-templates/google-sheets/\n- 🚀 Supabase: database-templates/supabase/\n- ⚡ Cloudflare D1: database-templates/cloudflare-d1/\n\n---\n🎉 Selamat! Web kamu siap untuk di-deploy!`;

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
    
    // Update token info on input
    document.getElementById('tokenInput').addEventListener('input', updateTokenInfo);
});

// ============================================================
// EXPOSE FUNCTIONS TO GLOBAL (for inline onclick)
// ============================================================

window.deleteToken = deleteToken;
window.downloadZip = downloadZip;
window.openInCodeSandbox = openInCodeSandbox;