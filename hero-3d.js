import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hero-canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Сцена
    const scene = new THREE.Scene();
    scene.background = null; // прозрачный

    // Камера
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3, 1.5, 4);
    camera.lookAt(0, 0.5, 0);

    // Рендерер с альфа-каналом
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Освещение (минимальное, чтобы модель была видна)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 1);
    scene.add(dirLight);
    const backLight = new THREE.PointLight(0x4466ff, 0.3);
    backLight.position.set(-2, 1, -2);
    scene.add(backLight);

    // Создаём группу для вращения
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Материалы: полупрозрачный с отображением сетки
    const transparentMaterial = new THREE.MeshPhongMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });

    // Загрузчик GLTF
    const loader = new GLTFLoader();
    const modelPath = 'models/hero.glb'; // Укажите ваш путь

    let originalModelSize; // сохраним оригинальный размер модели

    function scaleModelToFit() {
        if (!modelGroup || !originalModelSize) return;
        
        const container = document.getElementById('hero-canvas-container');
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        // Желаемый размер модели относительно контейнера (например, 80% от меньшей стороны)
        const targetSize = Math.min(containerWidth * 0.0075, window.innerHeight * 0.0075);
        const maxOriginalDim = Math.max(originalModelSize.x, originalModelSize.y, originalModelSize.z);
        const scale = targetSize / maxOriginalDim;
        
        modelGroup.scale.setScalar(scale);
        
        // Центрируем модель по вертикали (опционально)
        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        modelGroup.position.y = -center.y * scale + 0.5;
    }

    // Пытаемся загрузить модель
    loader.load(modelPath, 
        (gltf) => {
            const model = gltf.scene;

            // Вычисляем оригинальный размер модели
            const box = new THREE.Box3().setFromObject(model);
            originalModelSize = box.getSize(new THREE.Vector3());

            scaleModelToFit(); // масштабируем при первой загрузке
            
            // Обрабатываем все меши
            model.traverse((child) => {
                if (child.isMesh) {
                    // Сохраняем оригинальный материал для wireframe (геометрия)
                    const wireMesh = new THREE.Mesh(child.geometry, wireframeMaterial.clone());
                    wireMesh.position.copy(child.position);
                    wireMesh.rotation.copy(child.rotation);
                    wireMesh.scale.copy(child.scale);
                    
                    // Заменяем материал на прозрачный
                    child.material = transparentMaterial.clone();
                    child.material.color.setHex(0x88aaff);
                    
                    // Добавляем wireframe как отдельный объект
                    child.parent.add(wireMesh);
                }
            });
            
            modelGroup.add(model);
            
            console.log('Модель загружена успешно');
        },
        (xhr) => {
            console.log(`Загрузка модели: ${(xhr.loaded / xhr.total * 100)}%`);
        },
        (error) => {
            console.error('Ошибка загрузки модели:', error);
            // Загружаем демо-заглушку
            showHeroError();
        }
    );

    // Вместо loadFallbackModel() добавим функцию showHeroError()
    function showHeroError() {
        const container = document.getElementById('hero-canvas-container');
        if (!container) return;
        
        // Удаляем canvas рендерера, если он был создан
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) existingCanvas.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            min-height: 300px;
            color: #efefef;
            font-size: 1rem;
            text-align: center;
            background: rgba(0,0,0,0.5);
            border-radius: 24px;
            border: 1px solid #fbbf24;
            backdrop-filter: blur(4px);
        `;
        errorDiv.textContent = 'Произошла ошибка загрузки 3D-модели';
        container.appendChild(errorDiv);
    }

    // Анимация
    function animate() {
        requestAnimationFrame(animate);
        modelGroup.rotation.y += 0.0015;
        renderer.render(scene, camera);
    }
    animate();

    // Ресайз
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        scaleModelToFit(); // пересчитываем масштаб модели
    });
});