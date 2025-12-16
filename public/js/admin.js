import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, getDocs, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ Config
const firebaseConfig = {
    apiKey: "AIzaSyAlfZHbCFxGK3p3nDoAPy3m9KqZzmX2s9I",
    authDomain: "kruboat-web.firebaseapp.com",
    projectId: "kruboat-web",
    storageBucket: "kruboat-web.firebasestorage.app",
    messagingSenderId: "61868765546",
    appId: "1:61868765546:web:683b18ddf68c89dd317513"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);

const ADMIN_PIN = "0903498148";

// ✅ Expose Functions Globally
window.checkLogin = checkLogin;
window.performLogin = performLogin;
window.logout = logout;

// Library (Old Projects)
window.openLibraryModal = openLibraryModal;
window.closeLibraryModal = closeLibraryModal;
window.saveLibrary = saveLibrary;
window.openManageLibraryModal = openManageLibraryModal;
window.closeManageLibraryModal = closeManageLibraryModal;
window.deleteLibrary = deleteLibrary;
window.editLibrary = editLibrary;

// Projects (New Web Projects)
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;
window.openManageProjectsModal = openManageProjectsModal;
window.closeManageProjectsModal = closeManageProjectsModal;
window.deleteProject = deleteProject;
window.editProject = editProject;

// Apps
window.openAddAppModal = openAddAppModal;
window.closeAddAppModal = closeAddAppModal;
window.saveApp = saveApp;
window.openManageAppsModal = openManageAppsModal;
window.closeManageAppsModal = closeManageAppsModal;
window.deleteApp = deleteApp;
window.editApp = editApp;

// News
window.openAddNewsModal = openAddNewsModal;
window.closeAddNewsModal = closeAddNewsModal;
window.saveNews = saveNews;
window.openManageNewsModal = openManageNewsModal;
window.closeManageNewsModal = closeManageNewsModal;
window.deleteNews = deleteNews;
window.editNews = editNews;

// System
window.checkSystemStatus = checkSystemStatus;
window.saveNote = saveNote;
window.openInboxModal = openInboxModal;
window.closeInboxModal = closeInboxModal;
window.loadMessages = loadMessages;
window.deleteMessage = deleteMessage;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    signInAnonymously(auth).catch((error) => {
        console.error("Firebase Auth Error:", error);
        alert("ไม่สามารถเชื่อมต่อฐานข้อมูลได้: " + error.message);
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Firebase Connected");
            checkLogin(); 
        }
    });
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
    if(typeof dateString === 'string' && dateString.includes('-')) return dateString; // YYYY-MM-DD
    let date;
    if(dateString.toDate) date = dateString.toDate();
    else date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

// --- Security Helper ---
function isAuthenticated() {
    return sessionStorage.getItem('admin_password') === ADMIN_PIN;
}

function authGuard() {
    if (!isAuthenticated()) {
        alert("⛔ Unauthorized Access!\nกรุณาเข้าสู่ระบบก่อนทำรายการ");
        window.location.reload();
        return false;
    }
    return true;
}

// --- Login Logic ---
function checkLogin() {
    const savedPassword = sessionStorage.getItem('admin_password');
    if (savedPassword === ADMIN_PIN) {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('protected-content').classList.remove('hidden'); 
        showDashboard();
        loadNote();
        listenToMessages();
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('protected-content').classList.add('hidden');
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

// --- Dashboard ---
function showDashboard() {
    if(!isAuthenticated()) return;

    // Library Count (formerly Projects)
    onSnapshot(collection(db, "library"), (snap) => {
        const el = document.getElementById('stat-library');
        if(el) el.innerText = snap.size.toLocaleString();
    });

    // Projects Count (New Web Projects)
    onSnapshot(collection(db, "projects"), (snap) => {
        const el = document.getElementById('stat-projects');
        if(el) el.innerText = snap.size.toLocaleString();
    });

    // Apps Count
    onSnapshot(collection(db, "apps"), (snap) => {
        const el = document.getElementById('stat-apps');
        if(el) el.innerText = snap.size.toLocaleString();
    });

    // News Count
    onSnapshot(collection(db, "news"), (snap) => {
        const el = document.getElementById('stat-news');
        if(el) el.innerText = snap.size.toLocaleString();
    });
}

// ================= LIBRARY (Old Projects) =================
function openLibraryModal() { if(authGuard()) document.getElementById('library-modal').classList.remove('hidden'); }
function closeLibraryModal() { 
    document.getElementById('library-modal').classList.add('hidden'); 
    document.getElementById('lib-id').value = "";
    document.querySelectorAll('#library-modal input, #library-modal textarea').forEach(i=>i.value='');
    document.getElementById('save-lib-btn').innerText = 'บันทึกข้อมูล';
    document.getElementById('lib-modal-title').innerHTML = '<i class="fa-solid fa-code mr-2"></i>เพิ่ม Source Code (Library)';
}
function closeManageLibraryModal() { document.getElementById('manage-library-modal').classList.add('hidden'); }

async function saveLibrary() {
    if(!authGuard()) return;

    const id = document.getElementById('lib-id').value;
    const title = document.getElementById('lib-title').value;
    const category = document.getElementById('lib-category').value;
    const tags = document.getElementById('lib-tags').value;
    const desc = document.getElementById('lib-desc').value;
    const detail = document.getElementById('lib-detail').value;
    const linkPreview = document.getElementById('lib-link-preview').value;
    const linkCode = document.getElementById('lib-link-code').value;
    
    const images = [];
    for(let i=1; i<=2; i++) {
        const el = document.getElementById('lib-image-'+i);
        if(el && el.value.trim()) images.push(el.value.trim());
    }

    if(!title || !tags || !desc) return alert("กรอกข้อมูลให้ครบ (ชื่อ, Tag, คำอธิบาย)");

    const btn = document.getElementById('save-lib-btn');
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;

    const payload = {
        title, category, tags, images, description: desc, detail: detail || desc,
        link_preview: linkPreview, link_code: linkCode,
        author: "KruBoat"
    };

    try {
        if (id) {
            await updateDoc(doc(db, "library", id), payload);
            alert("แก้ไข Library สำเร็จ!");
        } else {
            payload.views = 0; payload.downloads = 0; payload.createdAt = serverTimestamp();
            await addDoc(collection(db, "library"), payload);
            alert("เพิ่ม Library สำเร็จ!");
        }
        closeLibraryModal();
        if(!document.getElementById('manage-library-modal').classList.contains('hidden')) openManageLibraryModal();
    } catch(e) { alert(e.message); } 
    finally { btn.innerText = "บันทึกข้อมูล"; btn.disabled = false; }
}

async function openManageLibraryModal() {
    if(!authGuard()) return;
    document.getElementById('manage-library-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-library-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';
    
    const q = query(collection(db, "library"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    if(snap.empty) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">ไม่มีข้อมูล</td></tr>'; return; }
    
    tbody.innerHTML = "";
    snap.forEach(docSnap => {
        const p = docSnap.data();
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.image || "");
        tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 flex items-center gap-3"><img src="${convertDriveImage(img)}" class="w-10 h-10 rounded object-cover"><span class="truncate max-w-xs font-medium">${p.title}</span></td>
                <td class="px-6 py-4">${p.category}</td>
                <td class="px-6 py-4 text-center">${p.views||0} / ${p.downloads||0}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editLibrary('${docSnap.id}')" class="text-blue-600 mr-2"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteLibrary('${docSnap.id}', '${p.title}')" class="text-red-600"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

async function editLibrary(id) {
    if(!authGuard()) return;
    closeManageLibraryModal();
    
    try {
        const snap = await getDoc(doc(db, "library", id));
        if(!snap.exists()) return alert("ไม่พบข้อมูล");
        
        const p = snap.data();
        document.getElementById('lib-id').value = id;
        document.getElementById('lib-title').value = p.title;
        document.getElementById('lib-category').value = p.category;
        document.getElementById('lib-tags').value = p.tags;
        document.getElementById('lib-desc').value = p.description;
        document.getElementById('lib-detail').value = p.detail || "";
        document.getElementById('lib-link-preview').value = p.link_preview || "";
        document.getElementById('lib-link-code').value = p.link_code || "";
        
        const imgs = p.images || (p.image ? [p.image] : []);
        for(let i=1; i<=2; i++) { 
            const el = document.getElementById('lib-image-'+i);
            if(el) el.value = imgs[i-1] || ""; 
        }
        
        document.getElementById('lib-modal-title').innerHTML = 'แก้ไข Library';
        document.getElementById('save-lib-btn').innerText = 'อัปเดต';
        openLibraryModal();
        
    } catch(e) { console.error(e); alert("Error: " + e.message); }
}

async function deleteLibrary(id, title) {
    if(authGuard() && confirm(`ลบ Library "${title}"?`)) {
        await deleteDoc(doc(db, "library", id));
        openManageLibraryModal(); 
    }
}

// ================= PROJECTS (New Web Projects) =================
function openProjectModal() { if(authGuard()) document.getElementById('project-modal').classList.remove('hidden'); }
function closeProjectModal() { 
    document.getElementById('project-modal').classList.add('hidden'); 
    document.getElementById('proj-id').value = "";
    document.querySelectorAll('#project-modal input, #project-modal textarea, #project-modal select').forEach(i=>i.value='');
    document.getElementById('save-proj-btn').innerText = 'บันทึก';
    document.getElementById('proj-modal-title').innerHTML = '<i class="fa-solid fa-diagram-project mr-2"></i>เพิ่มโปรเจกต์ใหม่';
}
function closeManageProjectsModal() { document.getElementById('manage-projects-modal').classList.add('hidden'); }

async function saveProject() {
    if(!authGuard()) return;

    const id = document.getElementById('proj-id').value;
    const title = document.getElementById('proj-title').value;
    const description = document.getElementById('proj-desc').value;
    const category = document.getElementById('proj-tag').value; // Using as category/tag
    const tagColor = document.getElementById('proj-color').value || 'bg-gray-500';
    const link = document.getElementById('proj-link').value;
    const displayDate = document.getElementById('proj-date').value;

    if(!title || !description || !category || !link) return alert("กรอกข้อมูลให้ครบ (Title, Desc, Tag, Link)");

    const btn = document.getElementById('save-proj-btn');
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;

    const payload = { title, description, category, tagColor, link, displayDate };

    try {
        if (id) {
            await updateDoc(doc(db, "projects", id), payload);
            alert("แก้ไขโปรเจกต์สำเร็จ!");
        } else {
            payload.createdAt = serverTimestamp();
            await addDoc(collection(db, "projects"), payload);
            alert("เพิ่มโปรเจกต์สำเร็จ!");
        }
        closeProjectModal();
        if(!document.getElementById('manage-projects-modal').classList.contains('hidden')) openManageProjectsModal();
    } catch(e) { alert(e.message); } 
    finally { btn.innerText = "บันทึก"; btn.disabled = false; }
}

async function openManageProjectsModal() {
    if(!authGuard()) return;
    document.getElementById('manage-projects-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-projects-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';
    
    // Sort by displayDate if available, else createdAt
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc")); 
    const snap = await getDocs(q);
    
    if(snap.empty) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">ไม่มีข้อมูล</td></tr>'; return; }
    
    tbody.innerHTML = "";
    snap.forEach(docSnap => {
        const p = docSnap.data();
        // Generate Color Dot
        const colorDot = `<span class="w-3 h-3 rounded-full inline-block mr-2 ${p.tagColor}"></span>`;
        
        tbody.innerHTML += `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 text-xs text-gray-500">${p.displayDate || "-"}</td>
                <td class="px-6 py-4 font-bold text-gray-700">${p.title}</td>
                <td class="px-6 py-4 flex items-center">${colorDot} ${p.category}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editProject('${docSnap.id}')" class="text-blue-600 mr-2"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteProject('${docSnap.id}', '${p.title}')" class="text-red-600"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

async function editProject(id) {
    if(!authGuard()) return;
    closeManageProjectsModal();
    try {
        const snap = await getDoc(doc(db, "projects", id));
        if(!snap.exists()) return alert("ไม่พบข้อมูล");
        const p = snap.data();
        
        document.getElementById('proj-id').value = id;
        document.getElementById('proj-title').value = p.title;
        document.getElementById('proj-desc').value = p.description;
        document.getElementById('proj-tag').value = p.category;
        document.getElementById('proj-color').value = p.tagColor || 'bg-gray-500';
        document.getElementById('proj-link').value = p.link;
        document.getElementById('proj-date').value = p.displayDate || "";

        document.getElementById('proj-modal-title').innerHTML = 'แก้ไขโปรเจกต์';
        document.getElementById('save-proj-btn').innerText = 'อัปเดต';
        openProjectModal();
    } catch(e) { console.error(e); alert("Error: " + e.message); }
}

async function deleteProject(id, title) {
    if(authGuard() && confirm(`ลบโปรเจกต์ "${title}"?`)) {
        await deleteDoc(doc(db, "projects", id));
        openManageProjectsModal(); 
    }
}

// ================= NEWS =================
function openAddNewsModal() { if(authGuard()) document.getElementById('add-news-modal').classList.remove('hidden'); }
function closeAddNewsModal() { 
    document.getElementById('add-news-modal').classList.add('hidden'); 
    document.getElementById('n-id').value = "";
    document.querySelectorAll('#add-news-modal input, #add-news-modal textarea').forEach(i=>i.value='');
    document.getElementById('n-modal-title').innerText = 'ประกาศข่าวใหม่';
    document.getElementById('save-news-btn').innerText = 'ประกาศข่าว';
}
function closeManageNewsModal() { document.getElementById('manage-news-modal').classList.add('hidden'); }

async function saveNews() {
    if(!authGuard()) return;
    const id = document.getElementById('n-id').value;
    const title = document.getElementById('n-title').value;
    const tag = document.getElementById('n-tag').value;
    const content = document.getElementById('n-content').value;

    if(!title || !content) return alert("กรอกข้อมูลให้ครบ");
    const btn = document.getElementById('save-news-btn');
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;

    const payload = { title, tag, content };
    try {
        if (id) { await updateDoc(doc(db, "news", id), payload); alert("แก้ไขข่าวสำเร็จ!"); } 
        else { payload.createdAt = serverTimestamp(); await addDoc(collection(db, "news"), payload); alert("ประกาศข่าวสำเร็จ!"); }
        closeAddNewsModal();
        if(!document.getElementById('manage-news-modal').classList.contains('hidden')) openManageNewsModal();
    } catch(e) { alert("Error: " + e.message); } finally { btn.innerText = "บันทึก"; btn.disabled = false; }
}

async function openManageNewsModal() {
    if(!authGuard()) return;
    document.getElementById('manage-news-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-news-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';
    try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (snap.empty) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">ไม่มีข้อมูล</td></tr>'; return; }
        tbody.innerHTML = "";
        snap.forEach(docSnap => {
            const n = docSnap.data();
            tbody.innerHTML += `
                <tr class="bg-white border-b">
                    <td class="px-6 py-4">${formatDate(n.createdAt)}</td>
                    <td class="px-6 py-4">${n.title}</td>
                    <td class="px-6 py-4"><span class="px-2 py-1 rounded bg-gray-100 text-xs">${n.tag}</span></td>
                    <td class="px-6 py-4 text-right flex justify-end gap-2">
                        <button onclick="editNews('${docSnap.id}')" class="text-blue-600 bg-blue-50 px-2 py-1 rounded"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                        <button onclick="deleteNews('${docSnap.id}')" class="text-red-600 bg-red-50 px-2 py-1 rounded"><i class="fa-solid fa-trash"></i> ลบ</button>
                    </td>
                </tr>`;
        });
    } catch(e) { console.error(e); }
}

async function editNews(id) {
    if(!authGuard()) return;
    closeManageNewsModal();
    try {
        const docSnap = await getDoc(doc(db, "news", id));
        if (!docSnap.exists()) return alert("ไม่พบข้อมูล");
        const n = docSnap.data();
        document.getElementById('n-id').value = id;
        document.getElementById('n-title').value = n.title;
        document.getElementById('n-tag').value = n.tag;
        document.getElementById('n-content').value = n.content;
        document.getElementById('n-modal-title').innerHTML = 'แก้ไขข่าว';
        document.getElementById('save-news-btn').innerText = "อัปเดตข่าว";
        openAddNewsModal();
    } catch(e) { alert("Error: " + e.message); }
}

async function deleteNews(id) { if(authGuard() && confirm("ลบข่าวนี้?")) { await deleteDoc(doc(db, "news", id)); openManageNewsModal(); } }

// ================= APPS =================
function openAddAppModal() { if(authGuard()) document.getElementById('app-modal').classList.remove('hidden'); }
function closeAddAppModal() { 
    document.getElementById('app-modal').classList.add('hidden');
    document.getElementById('a-id').value = "";
    document.querySelectorAll('#app-modal input, #app-modal textarea').forEach(i => i.value = '');
    document.getElementById('a-modal-title').innerHTML = '<i class="fa-solid fa-rocket mr-2"></i>เพิ่มแอพใหม่';
    document.getElementById('save-app-btn').innerText = "บันทึก";
}
function closeManageAppsModal() { document.getElementById('manage-apps-modal').classList.add('hidden'); }

async function saveApp() {
    if(!authGuard()) return;
    const id = document.getElementById('a-id').value;
    const name = document.getElementById('a-name').value;
    const category = document.getElementById('a-category').value;
    const desc = document.getElementById('a-desc').value;
    const image = document.getElementById('a-image').value;
    const link = document.getElementById('a-link').value;

    if(!name || !desc || !image || !link) return alert("กรอกข้อมูลให้ครบ");
    const btn = document.getElementById('save-app-btn');
    btn.innerText = "กำลังบันทึก..."; btn.disabled = true;

    const payload = { name, category, description: desc, image, link };

    try {
        if(id) { await updateDoc(doc(db, "apps", id), payload); alert("แก้ไขแอพสำเร็จ!"); } 
        else { payload.createdAt = serverTimestamp(); await addDoc(collection(db, "apps"), payload); alert("เพิ่มแอพสำเร็จ!"); }
        closeAddAppModal();
        if(!document.getElementById('manage-apps-modal').classList.contains('hidden')) openManageAppsModal();
    } catch(e) { alert("Error: " + e.message); } finally { btn.innerText = "บันทึก"; btn.disabled = false; }
}

async function openManageAppsModal() {
    if(!authGuard()) return;
    document.getElementById('manage-apps-modal').classList.remove('hidden');
    const tbody = document.getElementById('manage-apps-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Loading...</td></tr>';
    try {
        const q = query(collection(db, "apps"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if(snap.empty) { tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">ไม่มีข้อมูล</td></tr>'; return; }
        tbody.innerHTML = "";
        snap.forEach(docSnap => {
            const a = docSnap.data();
            tbody.innerHTML += `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-6 py-4 flex items-center gap-3"><img src="${convertDriveImage(a.image)}" class="w-10 h-10 rounded object-cover"><span class="font-medium">${a.name}</span></td>
                    <td class="px-6 py-4 capitalize">${a.category}</td>
                    <td class="px-6 py-4 text-right flex justify-end gap-2">
                        <button onclick="editApp('${docSnap.id}')" class="text-blue-600 bg-blue-50 px-2 py-1 rounded"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                        <button onclick="deleteApp('${docSnap.id}', '${a.name}')" class="text-red-600 bg-red-50 px-2 py-1 rounded"><i class="fa-solid fa-trash"></i> ลบ</button>
                    </td>
                </tr>`;
        });
    } catch(e) { console.error(e); }
}

async function editApp(id) {
    if(!authGuard()) return;
    closeManageAppsModal();
    try {
        const docSnap = await getDoc(doc(db, "apps", id));
        if (!docSnap.exists()) return alert("ไม่พบข้อมูล");
        const a = docSnap.data();
        document.getElementById('a-id').value = id;
        document.getElementById('a-name').value = a.name;
        document.getElementById('a-category').value = a.category;
        document.getElementById('a-desc').value = a.description;
        document.getElementById('a-image').value = a.image;
        document.getElementById('a-link').value = a.link;
        document.getElementById('a-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i>แก้ไขแอพ';
        document.getElementById('save-app-btn').innerText = "อัปเดต";
        openAddAppModal();
    } catch(e) { alert("Error: " + e.message); }
}

async function deleteApp(id, name) { if(authGuard() && confirm(`ลบแอพ "${name}"?`)) { await deleteDoc(doc(db, "apps", id)); openManageAppsModal(); } }

// ================= INBOX =================
function listenToMessages() {
    if(!isAuthenticated()) return;
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        let unread = 0;
        snapshot.forEach(d => { if(!d.data().read) unread++; });
        const badges = [document.getElementById('sidebar-inbox-badge'), document.getElementById('quick-inbox-badge'), document.getElementById('inbox-count')];
        badges.forEach(b => { 
            if(b) { 
                b.classList.toggle('hidden', unread===0); 
                b.innerText = unread > 9 ? '9+' : unread; 
            } 
        });
    });
}
function openInboxModal() { if(authGuard()) { document.getElementById('inbox-modal').classList.remove('hidden'); loadMessages(); } }
function closeInboxModal() { document.getElementById('inbox-modal').classList.add('hidden'); }
function loadMessages() {
    const list = document.getElementById('inbox-list');
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        if(snap.empty) { list.innerHTML = '<div class="text-center py-10 text-gray-400">ยังไม่มีข้อความ</div>'; return; }
        list.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const date = m.timestamp ? new Date(m.timestamp.toDate()).toLocaleString('th-TH') : "-";
            const bg = m.read ? "bg-white opacity-60" : "bg-blue-50 border-l-4 border-blue-500";
            if(!m.read) updateDoc(doc(db, "messages", d.id), { read: true }); 
            list.innerHTML += `
                <div class="p-4 ${bg} hover:bg-gray-50 border-b flex justify-between items-start">
                    <div><div class="font-bold text-sm">${m.name} <span class="text-xs font-normal text-gray-400 ml-2">${date}</span></div><div class="text-sm text-gray-600 mt-1">${m.message}</div></div>
                    <button onclick="deleteMessage('${d.id}')" class="text-gray-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>`;
        });
    });
}
async function deleteMessage(id) { if(authGuard() && confirm("ลบข้อความ?")) await deleteDoc(doc(db, "messages", id)); }

// ================= SYSTEM =================
async function loadNote() {
    if(!isAuthenticated()) return;
    const el = document.getElementById('admin-note-input');
    el.value = "กำลังโหลด..."; el.disabled = true;
    try {
        const snap = await getDoc(doc(db, "config", "admin_note"));
        if (snap.exists()) { el.value = snap.data().text || ""; } else { el.value = ""; }
    } catch (error) { el.value = "โหลดไม่สำเร็จ"; } finally { el.disabled = false; }
}
async function saveNote() {
    if(!authGuard()) return;
    const val = document.getElementById('admin-note-input').value;
    const btn = document.getElementById('save-note-btn');
    btn.innerText = "...";
    await setDoc(doc(db, "config", "admin_note"), { text: val });
    btn.innerText = "บันทึก";
}
function checkSystemStatus() {
    const start = Date.now();
    getDoc(doc(db, "config", "admin_note")).then(() => {
        alert(`✅ System Online\nPing: ${Date.now() - start}ms`);
    }).catch(e => alert("❌ Error: " + e.message));
}

document.getElementById('password-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') performLogin();
});