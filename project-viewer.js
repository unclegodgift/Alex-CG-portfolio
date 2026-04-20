import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Функция обновления текста подсказки для 3D-вьювера
function updateViewerHint() {
    const hintElement = document.querySelector('.viewer-hint');
    if (!hintElement) return;
    
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileWidth = window.innerWidth <= 768;
    
    if (isTouchDevice && isMobileWidth) {
        hintElement.innerHTML = `<i data-feather="rotate-cw"></i> Вращайте одним пальцем, двумя — масштаб`;
    } else {
        hintElement.innerHTML = `<i data-feather="rotate-cw"></i> Вращайте модель мышью, колесо — масштаб`;
    }
    feather.replace();
}

// Получаем ID проекта из URL
const urlParams = new URLSearchParams(window.location.search);
const projectId = parseInt(urlParams.get('id')) || 1; // по умолчанию первый

// Находим данные проекта
const project = projectsData.find(p => p.id === projectId);
if (!project) {
    alert('Проект не найден');
    window.location.href = 'projects.html';
}

// Заполняем контент страницы
document.getElementById('project-title').textContent = project.title;
document.getElementById('project-category').textContent = project.category;
document.getElementById('project-description').textContent = project.description;
document.getElementById('project-software').textContent = project.software;
document.getElementById('project-date').textContent = project.date;

const featuresList = document.getElementById('project-features');
project.features.forEach(f => {
    const li = document.createElement('li');
    li.textContent = f;
    featuresList.appendChild(li);
});

// --- Переключение вкладок Изображения / 3D ---
const tabs = document.querySelectorAll('.viewer-tab');
const panels = {
    images: document.getElementById('images-view'),
    '3d': document.getElementById('3d-view')
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Object.values(panels).forEach(p => p.classList.remove('active'));
        panels[tabId].classList.add('active');
        
        if (tabId === '3d' && !window._3dInitialized) {
            const oldError = document.getElementById('model-error-message');
            if (oldError) oldError.remove();
            init3DViewer();
            window._3dInitialized = true;
        }
    });
});

// --- Слайдер изображений ---
let currentImageIndex = 0;
const images = project.images;

function initImageSlider() {
    const mainImage = document.getElementById('main-image');
    const thumbnailsContainer = document.getElementById('thumbnails');
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    
    if (!mainImage || !thumbnailsContainer) return;
    
    function updateMainImage(index) {
        mainImage.src = images[index].src;
        mainImage.alt = images[index].alt;
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
    
    images.forEach((img, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail' + (idx === 0 ? ' active' : '');
        thumb.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
        thumb.addEventListener('click', () => {
            currentImageIndex = idx;
            updateMainImage(currentImageIndex);
        });
        thumbnailsContainer.appendChild(thumb);
    });
    
    if (images.length > 0) updateMainImage(0);
    
    prevBtn?.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateMainImage(currentImageIndex);
    });
    nextBtn?.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateMainImage(currentImageIndex);
    });
}

// --- 3D Viewer (MatCap) ---
let scene, camera, renderer, controls;

function init3DViewer() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(4, 2, 5);
    camera.lookAt(0, 0.5, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.8;
    controls.enableZoom = true;
    controls.enableTouch = true;
    controls.enablePan = false;
    controls.target.set(0, 0.5, 0);
    
    const textureLoader = new THREE.TextureLoader();
    const matcapTexture = textureLoader.load('https://threejs.org/examples/textures/matcaps/matcap-porcelain-white.jpg');
    const matcapMaterial = new THREE.MeshMatcapMaterial({ 
        matcap: matcapTexture,
        side: THREE.DoubleSide   // обе стороны текстуры
    });
    
    const ambient = new THREE.AmbientLight(0x404060);
    scene.add(ambient);
    
    // Загрузка 3D-модели
    if (project.model3d) {
        const loader = new GLTFLoader();
        loader.load(project.model3d, (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshMatcapMaterial({ 
                        matcap: matcapTexture,
                        side: THREE.DoubleSide
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(model);
        }, undefined, (error) => {
            console.error('Ошибка загрузки модели:', error);
            // Показать заглушку, если модель не загрузилась
            showModelError();
        });
    } else {
        showModelError();
    }
    
    // Функция отображения сообщения об ошибке
    function showModelError() {
        // Создаём HTML-элемент с сообщением и помещаем поверх canvas
        const container = document.getElementById('canvas-container');
        if (!container) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'model-error-message';
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #efefef;
            font-size: 1rem;
            text-align: center;
            background: rgba(0,0,0,0.5);
            padding: 16px 24px;
            border-radius: 8px;
            border: 1px solid #fbbf24;
            backdrop-filter: blur(4px);
            pointer-events: none;
            z-index: 10;
        `;
        errorDiv.textContent = 'Произошла ошибка загрузки 3D-модели';
        container.style.position = 'relative';
        container.appendChild(errorDiv);
    }
    
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initImageSlider();
    feather.replace();

    // Обновляем подсказку в зависимости от устройства
    updateViewerHint();

    // Навигация между проектами (соседние ссылки)
    const currentIndex = projectsData.findIndex(p => p.id === projectId);
    const prevProject = projectsData[(currentIndex - 1 + projectsData.length) % projectsData.length];
    const nextProject = projectsData[(currentIndex + 1) % projectsData.length];
    const prevLink = document.getElementById('prev-project');
    const nextLink = document.getElementById('next-project');
    if (prevLink) prevLink.href = `project.html?id=${prevProject.id}`;
    if (nextLink) nextLink.href = `project.html?id=${nextProject.id}`;

    // Слушаем изменение размера окна (например, при повороте устройства или подключении тачскрина)
    window.addEventListener('resize', () => {
        updateViewerHint();
    });
});