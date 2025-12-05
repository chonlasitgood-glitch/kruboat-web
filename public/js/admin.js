import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, getDocs, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ Config (ใช้ตัวเดียวกับ RoomMate/Contact)
const firebaseConfig = {
    apiKey: "AIzaSyAlfZHbCFxGK3p3nDoAPy3m9KqZzmX2s9I",
    authDomain: "kruboat-web.firebaseapp.com",
    projectId: "kruboat-web",
    storageBucket: "kruboat-web.firebasestorage.app",
    messagingSenderId: "61868765546",
    appId: "1:61868765546:web:683b18ddf68c89dd317513"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PIN = "1234"; // รหัสผ่าน Admin

// Expose functions
window.checkLogin = checkLogin;
window.performLogin = performLogin;
window.logout = logout;
window.openAddProjectModal = openAddProjectModal;
window.closeAddProjectModal = closeAddProjectModal;
window.saveProject = saveProject;
window.openManageModal = openManageModal;
window.closeManageModal = closeManageModal;
window.deleteProject = deleteProject;
window.editProject = editProject; // New
window.openAddNewsModal = openAddNewsModal;
window.closeAddNewsModal = closeAddNewsModal;
window.saveNews = saveNews;
window.openManageNewsModal = openManageNewsModal;
window.closeManageNewsModal = closeManageNewsModal;
window.deleteNews = deleteNews;
window.editNews = editNews; // New
window.checkSystemStatus = checkSystemStatus;
window.saveNote = saveNote;
window.openInboxModal = openInboxModal;
window.closeInboxModal = closeInboxModal;
window.loadMessages = loadMessages;
window.deleteMessage = deleteMessage;

document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
});

// --- Helper ---
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
    // If already formatted
    if(dateString.includes('/')) return dateString;
    
    // From Timestamp
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

// --- Login & Dashboard ---
function checkLogin() {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword === ADMIN_PIN) {
        document.getElementById('login-modal').classList.add('hidden');
        showDashboard();
        loadNote();
        listenToMessages();
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
    }
}

function performLogin() {
    const input = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('login-error');
    
    if (input === ADMIN_PIN) {
        sessionStorage.setItem('admin_password', input);
        checkLogin();
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function logout() {
    sessionStorage.removeItem('admin_password');
    window.location.reload();
}

function showDashboard() {
    onSnapshot(collection(db, "projects"), (snap) => {
        document.getElementById('stat-projects').innerText = snap.size.toLocaleString();
        let downloads = 0, views = 0;
        snap.forEach(d => {
            downloads += (d.data().downloads || 0);
            views += (d.data().views || 0);
        });
        document.getElementById('stat-downloads').innerText = downloads.toLocaleString();
        document.getElementById('stat-views').innerText = views.toLocaleString();
    });

    onSnapshot(collection(db, "news"), (snap) => {
        document.getElementById('stat-news').innerText = snap.size.toLocaleString();
    });
}

// --- Project Management ---

async function saveProject() {
    const id = document.getElementById('p-id').value; // Check if ID exists (Edit mode)
    const title = document.getElementById('p-title').value;
    const category = document.getElementById('p-category').value;
    const tags = document.getElementById('p-tags').value;
    const desc = document.getElementById('p-desc').value;
    const detail = document.getElementById('p-detail').value;
    const linkPreview = document.getElementById('p-link-preview').value;
    const linkCode = document.getElementById('p-link-code').value;
    
    const images = [];
    for(let i=1; i<=5; i++) {
        const val = document.getElementById('p-image-'+i).value.trim();
        if(val) images.push(convertDriveImage(val));
    }

    if(!title || !tags || images.length === 0 || !desc) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    const btn = document.getElementById('save-project-btn');
    const originalText = btn.innerText;
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;

    const payload = {
        title, category, tags, images, description: desc, detail: detail || desc,
        link_preview: linkPreview, link_code: linkCode,
        author: "KruBoat"
    };

    try {
        if (id) {
            // Update existing
            await updateDoc(doc(db, "projects", id), payload);
            alert("แก้ไขโปรเจกต์สำเร็จ!");
        } else {
            // Add new
            payload.views = 0;
            payload.downloads = 0;
            payload.createdAt = serverTimestamp();
            await addDoc(collection(db, "projects"), payload);
            alert("เพิ่มโปรเจกต์สำเร็จ!");
        }
        
        closeAddProjectModal();
        if(!document.getElementById('manage-modal').classList.contains('hidden')) openManageModal();
    } catch(e) {
        alert("Error: " + e.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function openManageModal() {
    document.getElementById('manage-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-list-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';
    
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    if(snap.empty) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">ไม่มีข้อมูล</td></tr>';
        return;
    }
    
    tbody.innerHTML = "";
    snap.forEach(docSnap => {
        const p = docSnap.data();
        // Encode data for edit function to avoid quote issues
        const safeId = docSnap.id;
        
        tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 flex items-center gap-3">
                    <img src="${p.images ? p.images[0] : ''}" class="w-10 h-10 rounded object-cover">
                    <span class="truncate max-w-xs">${p.title}</span>
                </td>
                <td class="px-6 py-4">${p.category}</td>
                <td class="px-6 py-4 text-center">${p.views || 0} / ${p.downloads || 0}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                    <button onclick="editProject('${safeId}')" class="text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                    <button onclick="deleteProject('${safeId}', '${p.title}')" class="text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"><i class="fa-solid fa-trash"></i> ลบ</button>
                </td>
            </tr>
        `;
    });
}

async function editProject(id) {
    // Close manage modal first? Optional. Let's keep it open behind or close it.
    // Better to close it to avoid z-index issues or stacking.
    closeManageModal();
    
    const docSnap = await getDoc(doc(db, "projects", id));
    if (!docSnap.exists()) return alert("ไม่พบข้อมูล");
    
    const p = docSnap.data();
    
    // Fill form
    document.getElementById('p-id').value = id;
    document.getElementById('p-title').value = p.title;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-tags').value = p.tags;
    document.getElementById('p-desc').value = p.description;
    document.getElementById('p-detail').value = p.detail || "";
    document.getElementById('p-link-preview').value = p.link_preview || "";
    document.getElementById('p-link-code').value = p.link_code || "";
    
    // Fill images
    const images = p.images || [];
    for(let i=1; i<=5; i++) {
        document.getElementById('p-image-'+i).value = images[i-1] || "";
    }
    
    // Change modal title and button text
    document.getElementById('p-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i>แก้ไขโปรเจกต์';
    document.getElementById('save-project-btn').innerText = "อัปเดตข้อมูล";
    
    openAddProjectModal();
}

async function deleteProject(id, title) {
    if(confirm(`ลบโปรเจกต์ "${title}"?`)) {
        await deleteDoc(doc(db, "projects", id));
        openManageModal(); // Refresh
    }
}

function openAddProjectModal() { 
    document.getElementById('project-modal').classList.remove('hidden'); 
}

function closeAddProjectModal() { 
    document.getElementById('project-modal').classList.add('hidden');
    // Reset Form
    document.getElementById('p-id').value = "";
    const inputs = document.querySelectorAll('#project-modal input, #project-modal textarea');
    inputs.forEach(input => input.value = '');
    
    // Reset Text
    document.getElementById('p-modal-title').innerHTML = '<i class="fa-solid fa-plus-circle mr-2"></i>เพิ่มโปรเจกต์ใหม่';
    document.getElementById('save-project-btn').innerText = "บันทึกข้อมูล";
}

function closeManageModal() { document.getElementById('manage-modal').classList.add('hidden'); }


// --- 3. News Management ---

async function saveNews() {
    const id = document.getElementById('n-id').value;
    const title = document.getElementById('n-title').value;
    const tag = document.getElementById('n-tag').value;
    const content = document.getElementById('n-content').value;

    if(!title || !content) return alert("กรอกข้อมูลให้ครบ");
    
    const btn = document.getElementById('save-news-btn');
    btn.innerText = "กำลังบันทึก...";
    btn.disabled = true;

    const payload = {
        title, tag, content
    };

    try {
        if (id) {
            // Update
            await updateDoc(doc(db, "news", id), payload);
            alert("แก้ไขข่าวสำเร็จ!");
        } else {
            // Add
            payload.createdAt = serverTimestamp();
            await addDoc(collection(db, "news"), payload);
            alert("ประกาศข่าวสำเร็จ!");
        }
        closeAddNewsModal();
        if(!document.getElementById('manage-news-modal').classList.contains('hidden')) openManageNewsModal();
    } catch(e) {
        alert("Error: " + e.message);
    } finally {
        btn.innerText = "บันทึก";
        btn.disabled = false;
    }
}

async function openManageNewsModal() {
    document.getElementById('manage-news-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-news-body');
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    tbody.innerHTML = "";
    snap.forEach(docSnap => {
        const n = docSnap.data();
        let dateStr = "-";
        if(n.createdAt) dateStr = new Date(n.createdAt.toDate()).toLocaleDateString('th-TH');

        tbody.innerHTML += `
            <tr class="bg-white border-b">
                <td class="px-6 py-4">${dateStr}</td>
                <td class="px-6 py-4">${n.title}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded bg-gray-100 text-xs">${n.tag}</span></td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                    <button onclick="editNews('${docSnap.id}')" class="text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                    <button onclick="deleteNews('${docSnap.id}')" class="text-red-600"><i class="fa-solid fa-trash"></i> ลบ</button>
                </td>
            </tr>
        `;
    });
}

async function editNews(id) {
    closeManageNewsModal();
    const docSnap = await getDoc(doc(db, "news", id));
    if (!docSnap.exists()) return;
    
    const n = docSnap.data();
    
    document.getElementById('n-id').value = id;
    document.getElementById('n-title').value = n.title;
    document.getElementById('n-tag').value = n.tag;
    document.getElementById('n-content').value = n.content;
    
    document.getElementById('n-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i>แก้ไขข่าว';
    document.getElementById('save-news-btn').innerText = "อัปเดตข่าว";
    
    openAddNewsModal();
}

async function deleteNews(id) {
    if(confirm("ลบข่าวนี้?")) {
        await deleteDoc(doc(db, "news", id));
        openManageNewsModal();
    }
}

function openAddNewsModal() { document.getElementById('add-news-modal').classList.remove('hidden'); }
function closeAddNewsModal() { 
    document.getElementById('add-news-modal').classList.add('hidden'); 
    // Reset
    document.getElementById('n-id').value = "";
    document.getElementById('n-title').value = "";
    document.getElementById('n-content').value = "";
    document.getElementById('n-modal-title').innerHTML = '<i class="fa-solid fa-bullhorn mr-2"></i>ประกาศข่าวใหม่';
    document.getElementById('save-news-btn').innerText = "ประกาศข่าว";
}
function closeManageNewsModal() { document.getElementById('manage-news-modal').classList.add('hidden'); }

// --- 4. Note & Config, Inbox, System ---
// (ส่วนนี้เหมือนเดิม ไม่ต้องแก้)

async function loadNote() {
    const el = document.getElementById('admin-note-input');
    const docRef = doc(db, "config", "admin_note");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        el.value = snap.data().text || "";
    }
}

async function saveNote() {
    const val = document.getElementById('admin-note-input').value;
    const btn = document.getElementById('save-note-btn');
    btn.innerText = "...";
    await setDoc(doc(db, "config", "admin_note"), { text: val });
    btn.innerText = "บันทึก";
    setTimeout(() => btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-1"></i> บันทึก', 1000);
}

function listenToMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        let unread = 0;
        snapshot.forEach(d => { if(!d.data().read) unread++; });
        const badges = [document.getElementById('sidebar-inbox-badge'), document.getElementById('quick-inbox-badge')];
        badges.forEach(b => {
            if(b) {
                b.classList.toggle('hidden', unread === 0);
                b.innerText = unread > 9 ? '9+' : unread;
            }
        });
    });
}

function openInboxModal() {
    document.getElementById('inbox-modal').classList.remove('hidden');
    loadMessages();
}
function closeInboxModal() { document.getElementById('inbox-modal').classList.add('hidden'); }

function loadMessages() {
    const list = document.getElementById('inbox-list');
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        list.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const date = m.timestamp ? new Date(m.timestamp.toDate()).toLocaleString('th-TH') : "-";
            const bg = m.read ? "bg-white opacity-60" : "bg-blue-50 border-l-4 border-blue-500";
            if(!m.read) updateDoc(doc(db, "messages", d.id), { read: true }); 
            
            list.innerHTML += `
                <div class="p-4 ${bg} hover:bg-gray-50 border-b flex justify-between items-start">
                    <div>
                        <div class="font-bold text-sm">${m.name} <span class="text-xs font-normal text-gray-400 ml-2">${date}</span></div>
                        <div class="text-sm text-gray-600 mt-1">${m.message}</div>
                    </div>
                    <button onclick="deleteMessage('${d.id}')" class="text-gray-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        });
    });
}

async function deleteMessage(id) {
    if(confirm("ลบข้อความ?")) await deleteDoc(doc(db, "messages", id));
}

function checkSystemStatus() {
    const start = Date.now();
    getDoc(doc(db, "config", "admin_note")).then(() => {
        const ping = Date.now() - start;
        alert(`✅ System Online\nLatency: ${ping}ms\nDatabase: Connected`);
    }).catch(e => alert("❌ Error: " + e.message));
}

document.getElementById('password-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') performLogin();
});