const API_URL = "https://script.google.com/macros/s/AKfycbzC8znKAdu6230TgnQdjZjNVn6GJTY1FtX2FFifHFyoafbZ2gjEcCu_KIK1zpX8mdUh/exec";

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

function renderSkeleton(count) {
    return Array(count).fill(0).map(() => `
        <div class="bg-white rounded-xl p-0 shadow-sm border border-gray-100 flex flex-col h-full animate-pulse overflow-hidden">
            <div class="bg-gray-200 w-full aspect-video"></div>
            <div class="p-4 flex flex-col flex-grow space-y-3">
                <div class="flex gap-2">
                    <div class="bg-gray-200 w-16 h-5 rounded"></div>
                    <div class="bg-gray-200 w-12 h-5 rounded"></div>
                </div>
                <div class="bg-gray-200 w-3/4 h-6 rounded"></div>
                <div class="bg-gray-200 w-full h-4 rounded"></div>
                <div class="bg-gray-200 w-5/6 h-4 rounded"></div>
                <div class="mt-auto pt-4 flex justify-between">
                    <div class="bg-gray-200 w-20 h-4 rounded"></div>
                    <div class="bg-gray-200 w-10 h-4 rounded"></div>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                    <div class="bg-gray-200 h-8 rounded"></div>
                    <div class="bg-gray-200 h-8 rounded"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function incrementStat(id, type) {
    fetch(API_URL + `?action=updateStat&id=${id}&type=${type}`, { mode: 'no-cors' }).catch(err => console.error(err));
}

function getTagColorClass(tag) {
    switch (tag) {
        case 'อัปเดตระบบ': return 'bg-blue-100 text-blue-600';
        case 'ปิดปรับปรุง': return 'bg-red-100 text-red-600';
        case 'เนื้อหาใหม่': return 'bg-green-100 text-green-600';
        case 'กิจกรรม': return 'bg-orange-100 text-orange-600';
        case 'ด่วนที่สุด': return 'bg-red-600 text-white';
        case 'แก้ไขบั๊ก': return 'bg-purple-100 text-purple-600';
        default: return 'bg-gray-100 text-gray-600';
    }
}

// --- HTML Generators ---

function createCardHTML(project) {
    const tags = project.tags ? project.tags.split(',').map(t => t.trim()) : [];
    const tagsHTML = tags.slice(0, 2).map(tag => 
        `<span class="text-[10px] uppercase font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">${tag}</span>`
    ).join('');

    const imageUrl = convertDriveImage(project.image);
    const hasPreview = project.link_preview && project.link_preview.trim() !== "";
    const hasCode = project.link_code && project.link_code.trim() !== "";

    const previewClass = hasPreview ? 
        "border border-blue-600 text-blue-600 hover:bg-blue-50" : 
        "border border-gray-300 text-gray-400 cursor-not-allowed opacity-50 pointer-events-none";
        
    const codeClass = hasCode ? 
        "bg-blue-600 text-white hover:bg-blue-700" : 
        "bg-gray-300 text-white cursor-not-allowed opacity-50 pointer-events-none";

    const previewHref = hasPreview ? `href="${project.link_preview}" target="_blank"` : "";
    const codeHref = hasCode ? `href="${project.link_code}" target="_blank"` : "";
    const downloadAction = hasCode ? `onclick="incrementStat('${project.id}', 'downloads')"` : "";

    return `
    <div class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col h-full group hover:-translate-y-1 overflow-hidden">
        <a href="library_detail.html?id=${project.id}" class="relative w-full aspect-video block overflow-hidden cursor-pointer bg-gray-100">
            <img src="${imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/640x360?text=Image+Error';">
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                <span class="text-white font-bold border border-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition text-xs">ดูรายละเอียด</span>
            </div>
        </a>
        <div class="p-4 flex flex-col flex-grow">
            <div class="flex flex-wrap gap-1 mb-2">
                <span class="text-[10px] uppercase font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200">${project.category}</span>
                ${tagsHTML}
            </div>
            <h3 class="text-base font-bold text-gray-800 mb-1 leading-tight">
                <a href="library_detail.html?id=${project.id}" class="hover:text-blue-600 transition">${project.title}</a>
            </h3>
            <p class="text-gray-600 text-xs line-clamp-2 mb-3 flex-grow">
                ${project.description}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-500 mb-3 border-t pt-2 border-gray-100">
                <div class="flex items-center gap-1"><i class="fa-solid fa-user-circle text-blue-600"></i> ${project.author}</div>
                <div class="flex items-center gap-2"><span><i class="fa-solid fa-download"></i> ${project.downloads || 0}</span></div>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-auto">
                <a ${previewHref} class="flex items-center justify-center px-2 py-1.5 text-xs font-bold rounded ${previewClass}">
                    ตัวอย่าง
                </a>
                <a ${codeHref} ${downloadAction} class="flex items-center justify-center px-2 py-1.5 text-xs font-bold rounded ${codeClass}">
                    รับโค้ด
                </a>
            </div>
        </div>
    </div>
    `;
}

function createNewsHTML(newsItem) {
    const date = new Date(newsItem.date);
    const day = date.getDate();
    const month = date.toLocaleDateString('th-TH', { month: 'short' });
    const colorClass = getTagColorClass(newsItem.tag);
    const newsDataSafe = encodeURIComponent(JSON.stringify(newsItem));

    return `
    <div onclick="openNewsModal('${newsDataSafe}')" class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-start gap-4 cursor-pointer group border border-transparent hover:border-blue-100 h-full">
        <div class="flex flex-col items-center gap-2 w-14 flex-shrink-0">
            <div class="${colorClass} w-14 h-14 flex flex-col items-center justify-center rounded-xl shadow-sm text-center group-hover:scale-105 transition">
                <span class="text-lg font-bold leading-none">${day}</span>
                <span class="text-[10px] font-medium leading-none mt-0.5 opacity-90">${month}</span>
            </div>
            <span class="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-center w-full truncate">
                ${newsItem.tag}
            </span>
        </div>
        <div class="flex-1 min-w-0 py-0.5">
            <h3 class="font-bold text-gray-800 text-sm md:text-base leading-tight group-hover:text-blue-600 transition line-clamp-2 mb-1.5">
                ${newsItem.title}
            </h3>
            <p class="text-gray-500 text-xs leading-relaxed line-clamp-2">
                ${newsItem.content}
            </p>
        </div>
    </div>
    `;
}

// --- Main Loading Functions ---

async function loadHomePortfolio() {
    const container = document.getElementById('home-portfolio-grid');
    if (container) {
        container.innerHTML = renderSkeleton(4);
        try {
            const response = await fetch(API_URL + "?action=getAllProjects");
            const data = await response.json();
            data.reverse();
            container.innerHTML = data.slice(0, 4).map(p => createCardHTML(p)).join('');
        } catch (e) { 
            console.error(e);
            container.innerHTML = `<p class="text-red-500 text-center col-span-full">ไม่สามารถโหลดข้อมูลได้</p>`;
        }
    }
    loadNews();
}

async function loadLibrary() {
    const container = document.getElementById('library-grid');
    if (container) {
        container.innerHTML = renderSkeleton(6);
        try {
            const res = await fetch(API_URL + "?action=getAllProjects");
            const data = await res.json();
            data.reverse();
            window.allProjects = data;
            container.innerHTML = data.map(p => createCardHTML(p)).join('');
        } catch(e){ 
            console.error(e);
            container.innerHTML = `<p class="text-red-500 text-center col-span-full">ไม่สามารถโหลดข้อมูลได้</p>`;
        }
    }
}

async function loadNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    
    container.innerHTML = Array(4).fill(0).map(() => `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-4 animate-pulse">
            <div class="flex flex-col gap-2 w-14">
                <div class="bg-gray-200 w-14 h-14 rounded-xl"></div>
                <div class="bg-gray-200 w-14 h-4 rounded"></div>
            </div>
            <div class="flex-1 space-y-2 py-1">
                <div class="bg-gray-200 w-3/4 h-4 rounded"></div>
                <div class="bg-gray-200 w-full h-3 rounded"></div>
                <div class="bg-gray-200 w-5/6 h-3 rounded"></div>
            </div>
        </div>
    `).join('');

    try {
        const response = await fetch(API_URL + "?action=getNews");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error("ข้อมูลที่ได้ไม่ใช่อาร์เรย์ (อาจลืม Deploy GAS)");
        }

        data.reverse();
        const latestNews = data.slice(0, 4);

        if (latestNews.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center text-gray-400">ยังไม่มีข่าวประชาสัมพันธ์</div>`;
        } else {
            container.innerHTML = latestNews.map(item => createNewsHTML(item)).join('');
        }
    } catch (error) {
        console.error("Error loading news:", error);
        container.innerHTML = `<p class="text-red-500 text-center col-span-full text-xs">โหลดข่าวไม่ได้: ${error.message}</p>`;
    }
}

async function loadProjectDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;
    try {
        const res = await fetch(API_URL + `?action=getProjectById&id=${id}`);
        const project = await res.json();
        if(project) {
            renderDetailHTML(project);
            incrementStat(id, 'views');
        }
    } catch(e){ console.error(e); }
}

function renderDetailHTML(project) {
    const authorName = project.author || "-";
    document.getElementById('d-title').innerText = project.title;
    document.getElementById('d-author').innerText = authorName;
    document.getElementById('d-date').innerText = formatDate(project.date);
    document.getElementById('d-views').innerText = (project.views || 0) + ' views';
    
    // --- เปลี่ยนรูปโปรไฟล์ตามชื่อ ---
    const authorIcon = document.getElementById('d-author-icon');
    if(authorIcon) {
        if(authorName.toLowerCase().includes('kruboat')) {
            // ถ้าชื่อมีคำว่า KruBoat (ไม่สนตัวเล็กใหญ่) ให้ใส่รูป
            authorIcon.innerHTML = `<img src="https://lh3.googleusercontent.com/d/1VUZ7MASQaCBSjW1IdE4Ip4O81Jxzqyk6" class="w-full h-full object-cover">`;
            authorIcon.className = "w-6 h-6 rounded-full shadow-sm overflow-hidden"; // ปรับสไตล์นิดหน่อย
        } else {
            // ถ้าไม่ใช่ ให้ใช้ไอคอนเดิม
            authorIcon.innerHTML = `<i class="fa-solid fa-user"></i>`;
            authorIcon.className = "w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-blue-600 text-xs overflow-hidden";
        }
    }

    const tags = project.tags ? project.tags.split(',') : [];
    const tagsContainer = document.getElementById('d-tags');
    tagsContainer.innerHTML = `<span class="px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-bold">${project.category}</span>` + 
        tags.map(t => `<span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">${t.trim()}</span>`).join('');

    document.getElementById('d-desc').innerHTML = project.detail || project.description;
    document.getElementById('d-image-main').src = convertDriveImage(project.image);
    document.getElementById('s-downloads').innerText = (project.downloads || 0) + ' ครั้ง';

    const btnCode = document.getElementById('btn-code');
    const btnPreview = document.getElementById('btn-preview');
    
    if(btnCode) {
        if (project.link_code && project.link_code.trim() !== "") {
            btnCode.href = project.link_code;
            btnCode.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            btnCode.onclick = function() { incrementStat(project.id, 'downloads'); };
        } else {
            btnCode.removeAttribute('href');
            btnCode.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        }
        btnCode.innerHTML = `<i class="fa-brands fa-google-drive mr-2"></i> รับโค้ด (Copy File)`;
    }
    
    if(btnPreview) {
        if (project.link_preview && project.link_preview.trim() !== "") {
            btnPreview.href = project.link_preview;
            btnPreview.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        } else {
            btnPreview.removeAttribute('href');
            btnPreview.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        }
        btnPreview.innerHTML = `<i class="fa-solid fa-desktop mr-2"></i> ดูตัวอย่างจริง`;
    }
}

// Modal Functions
function openNewsModal(encodedData) {
    const newsItem = JSON.parse(decodeURIComponent(encodedData));
    const modal = document.getElementById('news-modal');
    document.getElementById('m-date').innerText = formatDate(newsItem.date);
    document.getElementById('m-tag').innerText = newsItem.tag;
    document.getElementById('m-title').innerText = newsItem.title;
    document.getElementById('m-content').innerText = newsItem.content;
    const colorClass = getTagColorClass(newsItem.tag);
    const tagEl = document.getElementById('m-tag');
    tagEl.className = `px-3 py-1 rounded-full text-xs font-bold ${colorClass}`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
    const modal = document.getElementById('news-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}