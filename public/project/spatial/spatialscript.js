/**
 * SPATIAL SCRIPT - Shared Logic for AR Math
 * จัดการเรื่อง Three.js, การสร้างบล็อก, และ Utility Functions
 */

// --- Constants ---
const COLORS = {
    block: 0xff8800,
    blockEmissive: 0xaa4400,
    builderBlock: 0x22c55e,
    builderEmissive: 0x004400,
    highlight: 0x3b82f6,
    highlightEmissive: 0x1d4ed8
};

// --- Three.js Setup Helper ---
function initThreeJS(canvasId) {
    const canvas = document.getElementById(canvasId);
    const scene = new THREE.Scene();
    
    // Camera Setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    
    const backLight = new THREE.DirectionalLight(0x0088ff, 0.8);
    backLight.position.set(-5, -5, -10);
    scene.add(backLight);

    // Resize Handler
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    return { scene, camera, renderer };
}

// --- Block Factory ---
function createBlockMesh(x, y, z, isBuilder = false) {
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const material = new THREE.MeshPhongMaterial({
        color: isBuilder ? COLORS.builderBlock : COLORS.block,
        emissive: isBuilder ? COLORS.builderEmissive : COLORS.blockEmissive,
        emissiveIntensity: 0.2,
        transparent: true, 
        opacity: isBuilder ? 1.0 : 0.9, 
        shininess: 80,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isBlock = true;

    // Outline
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const outline = new THREE.Mesh(geometry, outlineMat);
    outline.scale.set(1.05, 1.05, 1.05);
    mesh.add(outline);

    // Wireframe
    const wireGeo = new THREE.EdgesGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wire);

    mesh.position.set(x, y, z);
    return mesh;
}

// --- Thumbnail Generator ---
function drawThumbnail(canvas, blocks) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = 12; // Adjusted scale
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#06b6d4"; // Cyan-500
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    
    if(!blocks || blocks.length === 0) return;

    // Simple Isometric Projection Sort
    const sorted = [...blocks].sort((a,b) => (a.z - b.z) || (a.y - b.y) || (a.x - b.x));
    
    sorted.forEach(b => {
        // Isometric Math
        const isoX = (b.x - b.z) * scale * 0.866;
        const isoY = (b.x + b.z) * scale * 0.5 - (b.y * scale * 1.2);
        
        ctx.fillRect(cx + isoX - scale/2, cy + isoY - scale/2, scale, scale);
        ctx.strokeRect(cx + isoX - scale/2, cy + isoY - scale/2, scale, scale);
    });
}

// Export functions to global scope (for simple HTML inclusion)
window.SpatialScript = {
    initThreeJS,
    createBlockMesh,
    drawThumbnail,
    COLORS
};