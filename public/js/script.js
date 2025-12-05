import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, query, orderBy, limit, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ⚠️ Config (ใช้ตัวเดียวกับ RoomMate)
const firebaseConfig = {
    apiKey: "AIzaSyAlfZHbCFxGK3p3nDoAPy3m9KqZzmX2s9I",
    authDomain: "kruboat-web.firebaseapp.com",
    projectId: "kruboat-web",
    storageBucket: "kruboat-web.firebasestorage.app",
    messagingSenderId: "61868765546",
    appId: "1:61868765546:web:683b18ddf68c89dd317513"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Expose functions globally
window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
window.incrementStat = incrementStat;
window.loadHomePortfolio = loadHomePortfolio;
window.loadLibrary = loadLibrary;
window.loadProjectDetail = loadProjectDetail;

// --- Auth & Init Logic ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        initApp(); 
    } else {
        signInAnonymously(auth).catch((error) => {
            console.error("Auth Failed:", error);
        });
    }
});

function initApp() {
    if (document.getElementById('home-portfolio-grid')) {
        loadHomePortfolio();
    }
    if (document.getElementById('library-grid')) {
        loadLibrary();
    }
    if (window.location.href.includes('library_detail')) {
        loadProjectDetail();
    }
}

// --- Helper Functions ---
function convertDriveImage(url) {
    if (!url) return 'https://placehold.co/640x360?text=No+Image';
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
    return url;
}

function formatDate(val) {
    if (!val) return "-";
    let date;
    if (val.toDate) {
        date = val.toDate();
    } else {
        date = new Date(val);
    }
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function getDateObj(data) {
    if (data.createdAt) {
        return data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    } else if (data.date) {
        return new Date(data.date);
    }
    return new Date();
}

function getTagColorClass(tag) {
    switch (tag) {
        case 'อัปเดตระบบ': return 'bg-blue-100 text-blue-600';
        case 'ปิดปรับปรุง': return 'bg-red-100 text-red-600';
        case 'เนื้อหาใหม่': return 'bg-green-100 text-green-600';
        case 'กิจกรรม': return 'bg-orange-100 text-orange-600';
        default: return 'bg-gray-100 text-gray-600';
    }
}

// ฟังก์ชันเลือกสีหมวดหมู่
function getCategoryColor(category) {
    if(!category) return 'bg-gray-100 text-gray-600';
    const cat = category.toLowerCase();
    if (cat.includes('web')) return 'bg-purple-100 text-purple-600 border-purple-200';
    if (cat.includes('game')) return 'bg-pink-100 text-pink-600 border-pink-200';
    if (cat.includes('utility')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (cat.includes('data')) return 'bg-blue-100 text-blue-600 border-blue-200';
    if (cat.includes('template')) return 'bg-teal-100 text-teal-600 border-teal-200';
    return 'bg-indigo-100 text-indigo-600 border-indigo-200';
}

function renderSkeleton(count) {
    return Array(count).fill(0).map(() => `<div class="bg-white rounded-xl h-64 animate-pulse bg-gray-200"></div>`).join('');
}

// --- Core Functions ---

async function loadHomePortfolio() {
    const container = document.getElementById('home-portfolio-grid');
    if (!container) return;

    container.innerHTML = renderSkeleton(4);
    
    try {
        let q = query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(4));
        let snap = await getDocs(q);
        
        if (snap.empty) {
             const qBackup = query(collection(db, "projects"), limit(4));
             snap = await getDocs(qBackup);
        }
        
        if (snap.empty) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">ยังไม่มีผลงาน</div>';
        } else {
            container.innerHTML = "";
            snap.forEach(d => {
                const p = d.data();
                p.id = d.id;
                container.innerHTML += createCardHTML(p);
            });
        }
    } catch (error) {
        console.error("Error loading portfolio:", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-400 py-10">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    }
    
    loadNews();
}

async function loadLibrary() {
    const container = document.getElementById('library-grid');
    if (!container) return;

    container.innerHTML = renderSkeleton(6);
    
    try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        let snap = await getDocs(q);

        if (snap.empty) {
             const qBackup = collection(db, "projects");
             snap = await getDocs(qBackup);
        }
        
        if (snap.empty) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">ยังไม่มีผลงานในคลัง</div>';
        } else {
            container.innerHTML = "";
            snap.forEach(d => {
                const p = d.data();
                p.id = d.id;
                container.innerHTML += createCardHTML(p);
            });
        }
    } catch (error) {
        console.error("Error loading library:", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-400 py-10">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    }
}

async function loadNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    
    try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(4));
        let snap = await getDocs(q);
        
        if (snap.empty) {
             const qBackup = query(collection(db, "news"), limit(4));
             snap = await getDocs(qBackup);
        }
        
        if (snap.empty) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-4">ยังไม่มีข่าวประชาสัมพันธ์</div>';
            return;
        }
        
        container.innerHTML = "";
        snap.forEach(d => {
            const n = d.data();
            
            const dateObj = getDateObj(n);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('th-TH', { month: 'short' });
            const color = getTagColorClass(n.tag);
            
            const safeData = encodeURIComponent(JSON.stringify({ ...n, dateStr: dateObj.toISOString() }));
            
            container.innerHTML += `
            <div onclick='openNewsModal("${safeData}")' class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-start gap-4 cursor-pointer border border-transparent hover:border-blue-100">
                <div class="${color} w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-xs flex-col">
                    <span>${day}</span><span>${month}</span>
                </div>
                <div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border text-gray-500 mb-1 inline-block">${n.tag || 'ทั่วไป'}</span>
                    <h3 class="font-bold text-gray-800 text-sm line-clamp-1">${n.title}</h3>
                </div>
            </div>`;
        });
    } catch (error) {
        console.error("Error loading news:", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-400 text-xs">โหลดข่าวไม่ได้</div>';
    }
}

async function loadProjectDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if(!id) return;

    try {
        const snap = await getDoc(doc(db, "projects", id));
        if(snap.exists()) {
            const p = snap.data();
            p.id = snap.id;
            renderDetailHTML(p);
            
            await updateDoc(doc(db, "projects", id), { views: increment(1) });
        } else {
            alert("ไม่พบข้อมูลโปรเจกต์นี้");
            window.location.href = 'library.html';
        }
    } catch (error) {
        console.error("Error loading detail:", error);
    }
}

function createCardHTML(project) {
    const tags = project.tags ? project.tags.split(',').map(t => t.trim()) : [];
    const tagsHTML = tags.slice(0, 2).map(tag => 
        `<span class="text-[10px] uppercase font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">${tag}</span>`
    ).join('');

    const imgUrl = (project.images && project.images.length > 0) ? project.images[0] : project.image;
    const displayImg = convertDriveImage(imgUrl);
    const catColor = getCategoryColor(project.category);
    
    // เช็คลิงก์ปุ่ม
    const hasPreview = project.link_preview && project.link_preview.trim() !== "";
    const hasCode = project.link_code && project.link_code.trim() !== "";

    const previewBtn = hasPreview 
        ? `<a href="${project.link_preview}" target="_blank" class="flex items-center justify-center px-2 py-1.5 border border-blue-600 text-blue-600 text-xs font-bold rounded hover:bg-blue-50 transition">ตัวอย่าง</a>`
        : `<span class="flex items-center justify-center px-2 py-1.5 border border-gray-300 text-gray-300 text-xs font-bold rounded cursor-not-allowed select-none">ตัวอย่าง</span>`;

    const codeBtn = hasCode 
        ? `<a href="${project.link_code}" target="_blank" onclick="incrementStat('${project.id}', 'downloads')" class="flex items-center justify-center px-2 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition">รับโค้ด</a>`
        : `<span class="flex items-center justify-center px-2 py-1.5 bg-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed select-none">รับโค้ด</span>`;
    
    // สร้างรูปผู้แต่ง
    let authorIcon = `<i class="fa-solid fa-user-circle text-blue-600"></i>`;
    if (project.author && project.author.toLowerCase().includes('kruboat')) {
         authorIcon = `<img src="https://firebasestorage.googleapis.com/v0/b/kruboat-web.firebasestorage.app/o/kruboat.com-profile.JPG?alt=media&token=859324c7-8a3d-401b-acfa-f46f256b3122" class="w-4 h-4 rounded-full inline-block object-cover border border-blue-200" alt="KruBoat">`;
    }

    return `
    <div class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full group hover:-translate-y-1 overflow-hidden relative">
        <a href="library_detail.html?id=${project.id}" class="relative w-full aspect-video block overflow-hidden bg-gray-100">
            <img src="${displayImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
            
            <div class="absolute top-2 right-2 z-10">
                <span class="text-[10px] font-bold px-2 py-1 rounded shadow-sm border ${catColor}">${project.category}</span>
            </div>

            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                <span class="text-white font-bold border border-white px-4 py-2 rounded-full text-xs">ดูรายละเอียด</span>
            </div>
        </a>
        <div class="p-4 flex flex-col flex-grow">
            <div class="flex flex-wrap gap-1 mb-2">
                ${tagsHTML}
            </div>
            <h3 class="text-base font-bold text-gray-800 mb-1 leading-tight">
                <a href="library_detail.html?id=${project.id}" class="hover:text-blue-600 transition">${project.title}</a>
            </h3>
            <p class="text-gray-600 text-xs line-clamp-2 mb-3 flex-grow">${project.description}</p>
             <div class="flex items-center justify-between text-xs text-gray-500 mb-3 border-t pt-2">
                <div class="flex items-center gap-1">${authorIcon} ${project.author}</div>
                <div class="flex gap-3">
                    <span title="Views"><i class="fa-regular fa-eye"></i> ${project.views || 0}</span>
                    <span title="Downloads"><i class="fa-solid fa-download"></i> ${project.downloads || 0}</span>
                </div>
            </div>
             <div class="grid grid-cols-2 gap-2 mt-auto">
                ${previewBtn}
                ${codeBtn}
            </div>
        </div>
    </div>`;
}

function renderDetailHTML(p) {
    document.getElementById('d-title').innerText = p.title;
    document.getElementById('d-author').innerText = p.author;
    
    // เปลี่ยนรูปในหน้า Detail ด้วย
    const authorIconContainer = document.getElementById('d-author').previousElementSibling;
    if(authorIconContainer && p.author && p.author.toLowerCase().includes('kruboat')) {
        authorIconContainer.innerHTML = `<img src="https://firebasestorage.googleapis.com/v0/b/kruboat-web.firebasestorage.app/o/kruboat.com-profile.JPG?alt=media&token=859324c7-8a3d-401b-acfa-f46f256b3122" class="w-full h-full object-cover rounded-full">`;
    } else if(authorIconContainer) {
        authorIconContainer.innerHTML = `<div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-blue-600 text-xs"><i class="fa-solid fa-user"></i></div>`;
    }

    document.getElementById('d-views').innerText = (p.views || 0) + " views";
    
    const dateToDisplay = p.createdAt || p.date;
    document.getElementById('d-date').innerText = formatDate(dateToDisplay);

    document.getElementById('d-desc').innerHTML = p.detail || p.description;
    document.getElementById('s-downloads').innerText = (p.downloads || 0) + " ครั้ง";

    const tagsContainer = document.getElementById('d-tags');
    if(tagsContainer) {
        const catColor = getCategoryColor(p.category);
        let html = `<span class="text-xs font-bold px-2 py-1 rounded border ${catColor}">${p.category}</span>`;
        
        if(p.tags) {
            const tagsList = p.tags.split(',').map(t => t.trim());
            html += tagsList.map(tag => 
                `<span class="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-200">${tag}</span>`
            ).join('');
        }
        tagsContainer.innerHTML = html;
    }

    const galleryContainer = document.querySelector('.flex.overflow-x-auto');
    if(galleryContainer) {
        galleryContainer.innerHTML = "";
        const images = p.images || (p.image ? [p.image] : []);
        
        if (images.length > 0) {
            images.forEach(img => {
                if(img) {
                    galleryContainer.innerHTML += `
                    <div class="flex-shrink-0 w-full md:w-[80%] snap-center relative rounded-lg overflow-hidden h-64 border border-gray-200">
                        <img src="${convertDriveImage(img)}" class="absolute inset-0 w-full h-full object-cover">
                    </div>`;
                }
            });
        } else {
            galleryContainer.innerHTML = `<div class="flex-shrink-0 w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">ไม่มีรูปตัวอย่าง</div>`;
        }
    }
    
    const btnCode = document.getElementById('btn-code');
    if(btnCode) {
        if(p.link_code && p.link_code.trim() !== "") {
            btnCode.href = p.link_code;
            btnCode.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed', 'bg-gray-200', 'text-gray-400');
            btnCode.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            btnCode.innerHTML = '<i class="fa-brands fa-google-drive mr-2"></i> รับโค้ด (Copy File)';
            btnCode.onclick = function() { incrementStat(p.id, 'downloads'); };
        } else {
            btnCode.removeAttribute('href');
            btnCode.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed', 'bg-gray-200', 'text-gray-400');
            btnCode.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            btnCode.innerHTML = '<i class="fa-solid fa-ban mr-2"></i> ไม่มีโค้ด';
        }
    }
    
    const btnPreview = document.getElementById('btn-preview');
    if(btnPreview) {
        if(p.link_preview && p.link_preview.trim() !== "") {
            btnPreview.href = p.link_preview;
            btnPreview.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed', 'border-gray-300', 'text-gray-300');
            btnPreview.classList.add('border-blue-600', 'text-blue-600', 'hover:bg-blue-50');
            btnPreview.innerHTML = '<i class="fa-solid fa-desktop mr-2"></i> ดูตัวอย่าง';
        } else {
            btnPreview.removeAttribute('href');
            btnPreview.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed', 'border-gray-300', 'text-gray-300');
            btnPreview.classList.remove('border-blue-600', 'text-blue-600', 'hover:bg-blue-50');
            btnPreview.innerHTML = '<i class="fa-solid fa-ban mr-2"></i> ไม่มีตัวอย่าง';
        }
    }
}

async function incrementStat(id, type) {
    try {
        const ref = doc(db, "projects", id);
        await updateDoc(ref, {
            [type]: increment(1)
        });
    } catch (e) {
        console.error("Error incrementing stat:", e);
    }
}

function openNewsModal(data) {
    const n = JSON.parse(decodeURIComponent(data));
    document.getElementById('m-title').innerText = n.title;
    document.getElementById('m-content').innerHTML = n.content.replace(/\n/g, "<br>");
    document.getElementById('news-modal').classList.remove('hidden');
}

function closeNewsModal() { 
    document.getElementById('news-modal').classList.add('hidden'); 
}

// --- Mobile Menu Logic (ส่วนควบคุมปุ่ม Hamburger) ---
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // ตรวจสอบว่ามีปุ่มและเมนูในหน้านั้นจริงไหม (ป้องกัน Error)
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            // สลับการแสดงผล (ถ้าซ่อนอยู่ให้แสดง ถ้าแสดงอยู่ให้ซ่อน)
            mobileMenu.classList.toggle('hidden');
        });
    }
});