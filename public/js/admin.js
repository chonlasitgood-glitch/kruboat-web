const API_URL = "https://script.google.com/macros/s/AKfycbxkaGc8gLW98phQ1rslCfV2aeOrFtH-62pR7gFjiKbAIqcUvRpWWRs0f3mkMBbYaaLh/exec";

let CURRENT_PASSWORD = "";

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
});

// --- Helper Functions ---
function convertDriveImage(url) {
    if (!url) return 'https://placehold.co/640x360?text=No+Image';
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
    }
    return url;
}

function formatDate(dateString) {
    if(!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

// --- Login & Dashboard ---
function checkLogin() {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword) {
        CURRENT_PASSWORD = savedPassword;
        showDashboard();
        loadNote();
    } else {
        const modal = document.getElementById('login-modal');
        if(modal) modal.classList.remove('hidden');
    }
}

async function performLogin() {
    const input = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    if (!input) {
        errorMsg.innerText = "กรุณากรอกรหัสผ่าน";
        errorMsg.classList.remove('hidden');
        return;
    }

    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
    loginBtn.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', password: input })
        });
        const result = await response.json();

        if (result.status === 'success') {
            sessionStorage.setItem('admin_password', input);
            CURRENT_PASSWORD = input;
            document.getElementById('login-modal').classList.add('hidden');
            showDashboard();
            loadNote();
        } else {
            throw new Error(result.message || 'รหัสผ่านไม่ถูกต้อง');
        }
    } catch (error) {
        errorMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> ${error.message}`;
        errorMsg.classList.remove('hidden');
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

function logout() {
    sessionStorage.removeItem('admin_password');
    window.location.reload();
}

async function showDashboard() {
    try {
        const res = await fetch(API_URL + "?action=getAllProjects");
        const projects = await res.json();
        const totalProjects = projects.length;
        const totalViews = projects.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalDownloads = projects.reduce((sum, p) => sum + (p.downloads || 0), 0);

        updateText('stat-projects', totalProjects.toLocaleString());
        updateText('stat-views', totalViews.toLocaleString());
        updateText('stat-downloads', totalDownloads.toLocaleString());
    } catch (e) {
        console.error("Load Dashboard Error:", e);
    }

    try {
        const resNews = await fetch(API_URL + "?action=getNews");
        const news = await resNews.json();
        if(Array.isArray(news)) updateText('stat-news', news.length.toLocaleString());
    } catch (e) {
        console.log("News API might not be ready yet");
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// --- Project Management Functions ---
function openAddProjectModal() { document.getElementById('project-modal').classList.remove('hidden'); }
function closeAddProjectModal() { document.getElementById('project-modal').classList.add('hidden'); }

async function saveProject() {
    const title = document.getElementById('p-title').value;
    const category = document.getElementById('p-category').value;
    const tags = document.getElementById('p-tags').value;
    const image = document.getElementById('p-image').value;
    const desc = document.getElementById('p-desc').value;
    const detail = document.getElementById('p-detail').value;
    const linkPreview = document.getElementById('p-link-preview').value;
    const linkCode = document.getElementById('p-link-code').value;

    if(!title || !tags || !image || !desc) { alert("กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน"); return; }

    const btn = document.getElementById('save-project-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;

    const newId = 'P' + Date.now();
    const payload = {
        id: newId, title: title, category: category, tags: tags, image: image, description: desc,
        detail: detail || desc, link_preview: linkPreview, link_code: linkCode,
        author: 'KruBoat', views: 0, downloads: 0, date: new Date().toISOString()
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST', body: JSON.stringify({ action: 'addProject', password: CURRENT_PASSWORD, payload: payload })
        });
        const result = await response.json();
        if(result.status === 'success') { alert("บันทึกข้อมูลเรียบร้อยแล้ว!"); closeAddProjectModal(); showDashboard(); if(!document.getElementById('manage-modal').classList.contains('hidden')) openManageModal(); } 
        else { throw new Error(result.message); }
    } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); } finally { btn.innerHTML = originalText; btn.disabled = false; }
}

async function openManageModal() {
    document.getElementById('manage-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-list-body');
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8"><i class="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูล...</td></tr>`;
    try {
        const res = await fetch(API_URL + "?action=getAllProjects");
        const projects = await res.json();
        projects.reverse();
        if (projects.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-400">ยังไม่มีข้อมูล</td></tr>`; return; }
        tbody.innerHTML = projects.map(p => `
            <tr class="bg-white border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3"><img src="${convertDriveImage(p.image)}" class="w-10 h-10 rounded object-cover border"><div class="truncate max-w-xs" title="${p.title}">${p.title}</div></td>
                <td class="px-6 py-4"><span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-500">${p.category}</span></td>
                <td class="px-6 py-4 text-center text-xs text-gray-500"><div><i class="fa-solid fa-eye mr-1"></i> ${p.views || 0}</div><div><i class="fa-solid fa-download mr-1"></i> ${p.downloads || 0}</div></td>
                <td class="px-6 py-4 text-right"><button onclick="deleteProject('${p.id}', '${p.title}')" class="text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-xs px-3 py-2 text-center inline-flex items-center"><i class="fa-solid fa-trash-can mr-1"></i> ลบ</button></td>
            </tr>
        `).join('');
    } catch (error) { tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">โหลดข้อมูลไม่สำเร็จ</td></tr>`; }
}

function closeManageModal() { document.getElementById('manage-modal').classList.add('hidden'); }

async function deleteProject(id, title) {
    if (!confirm(`คุณต้องการลบโปรเจกต์ "${title}" ใช่หรือไม่?`)) return;
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteProject', password: CURRENT_PASSWORD, id: id }) });
        const result = await response.json();
        if (result.status === 'success') { alert("ลบข้อมูลสำเร็จ!"); openManageModal(); showDashboard(); } 
        else { throw new Error(result.message); }
    } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
}

// --- News Management Functions ---
function openAddNewsModal() { document.getElementById('add-news-modal').classList.remove('hidden'); }
function closeAddNewsModal() { document.getElementById('add-news-modal').classList.add('hidden'); }

async function saveNews() {
    const title = document.getElementById('n-title').value;
    const tag = document.getElementById('n-tag').value;
    const content = document.getElementById('n-content').value;

    if(!title || !content) { alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return; }

    const btn = document.getElementById('save-news-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;

    const newId = 'N' + Date.now();
    const payload = {
        id: newId, title: title, tag: tag, content: content,
        date: new Date().toISOString()
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST', body: JSON.stringify({ action: 'addNews', password: CURRENT_PASSWORD, payload: payload })
        });
        const result = await response.json();
        if(result.status === 'success') { 
            alert("ประกาศข่าวสำเร็จ!"); 
            closeAddNewsModal(); 
            showDashboard(); 
            if(!document.getElementById('manage-news-modal').classList.contains('hidden')) openManageNewsModal();
        } else { throw new Error(result.message); }
    } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); } finally { btn.innerHTML = originalText; btn.disabled = false; }
}

async function openManageNewsModal() {
    document.getElementById('manage-news-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-news-body');
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8"><i class="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูล...</td></tr>`;

    try {
        const res = await fetch(API_URL + "?action=getNews");
        const news = await res.json();
        news.reverse();

        if (news.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-400">ยังไม่มีข่าว</td></tr>`; return; }

        tbody.innerHTML = news.map(n => `
            <tr class="bg-white border-b hover:bg-gray-50 transition">
                <td class="px-6 py-4 font-medium text-gray-500">${formatDate(n.date)}</td>
                <td class="px-6 py-4 font-medium text-gray-900">${n.title}</td>
                <td class="px-6 py-4"><span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-500">${n.tag}</span></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteNews('${n.id}', '${n.title}')" class="text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-xs px-3 py-2 text-center inline-flex items-center">
                        <i class="fa-solid fa-trash-can mr-1"></i> ลบ
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) { tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500">โหลดข้อมูลไม่สำเร็จ</td></tr>`; }
}

function closeManageNewsModal() { document.getElementById('manage-news-modal').classList.add('hidden'); }

async function deleteNews(id, title) {
    if (!confirm(`คุณต้องการลบข่าว "${title}" ใช่หรือไม่?`)) return;
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteNews', password: CURRENT_PASSWORD, id: id }) });
        const result = await response.json();
        if (result.status === 'success') { alert("ลบข่าวสำเร็จ!"); openManageNewsModal(); showDashboard(); } 
        else { throw new Error(result.message); }
    } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); }
}

async function checkSystemStatus() {
    alert("กำลังตรวจสอบสถานะระบบ... กรุณารอสักครู่");
    const startTime = Date.now();
    try {
        const response = await fetch(API_URL + "?action=getAllProjects");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const endTime = Date.now();
        const latency = endTime - startTime;
        if (Array.isArray(data)) {
            alert(`✅ ระบบทำงานปกติ\n\n- API Status: Online\n- Database: Connected\n- Latency: ${latency} ms\n- Total Projects: ${data.length}`);
        } else {
            throw new Error("Invalid Data Format");
        }
    } catch (error) {
        alert(`❌ พบปัญหาการเชื่อมต่อ\n\nError: ${error.message}\nกรุณาตรวจสอบ Google Apps Script หรือการเชื่อมต่อเน็ต`);
    }
}

// --- Note System Functions ---
async function loadNote() {
    const noteInput = document.getElementById('admin-note-input');
    noteInput.value = "กำลังโหลด...";
    noteInput.disabled = true;

    try {
        const response = await fetch(API_URL + "?action=getConfig");
        const config = await response.json();
        noteInput.value = config.admin_note || ""; 
    } catch (error) {
        console.error("Load Note Error:", error);
        noteInput.value = "โหลดบันทึกไม่สำเร็จ";
    } finally {
        noteInput.disabled = false;
    }
}

async function saveNote() {
    const noteInput = document.getElementById('admin-note-input');
    const btn = document.getElementById('save-note-btn');
    const content = noteInput.value;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    noteInput.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveConfig',
                password: CURRENT_PASSWORD,
                key: 'admin_note',
                value: content
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            btn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            btn.classList.add('bg-green-500', 'hover:bg-green-600');
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
                btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                btn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
                btn.innerHTML = originalText;
            }, 2000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert("บันทึกไม่สำเร็จ: " + error.message);
        btn.innerHTML = originalText;
    } finally {
        btn.disabled = false;
        noteInput.disabled = false;
    }
}

document.getElementById('password-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') performLogin();
});

// --- Mobile Sidebar Toggle (เพิ่มใหม่) ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    
    // ทำให้เป็น Absolute Overlay บนมือถือ
    if (!sidebar.classList.contains('hidden')) {
        sidebar.classList.add('absolute', 'inset-y-0', 'left-0', 'h-full');
    } else {
        sidebar.classList.remove('absolute', 'inset-y-0', 'left-0', 'h-full');
    }
}