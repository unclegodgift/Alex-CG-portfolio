// Инициализация Feather Icons (работает на всех страницах)
function initFeatherIcons() {
    if (typeof feather !== 'undefined') {
        feather.replace();
    } else {
        console.warn('Feather Icons library not loaded');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Меняем иконку: если меню активно – показываем "x", иначе "menu"
            const icon = menuBtn.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.setAttribute('data-feather', 'x');
                } else {
                    icon.setAttribute('data-feather', 'menu');
                }
                feather.replace();
            }
        });
        
        // Закрываем меню при клике на ссылку (опционально)
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-feather', 'menu');
                    feather.replace();
                }
            });
        });
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu?.classList.remove('active');
            const icon = menuBtn?.querySelector('i');
            if (icon) {
                icon.setAttribute('data-feather', 'menu');
                feather.replace();
            }
        }
    });
});

// Запускаем замену иконок при загрузке DOM
document.addEventListener('DOMContentLoaded', initFeatherIcons);

(function() {
    const canvas = document.getElementById('vanta-bg');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let points = [];
    const numPoints = 40;
    const maxDistance = 150;
    const pointSpeed = 0.2;
    
    // Настройки внешнего вида
    const pointColor = '#c4f2ffff';          // можно менять на любой HEX
    const pointOpacity = 1;              // прозрачность точек (0–1)
    const lineBaseOpacity = 0.12;          // базовая прозрачность линий
    
    function hexToRgb(hex) {
    // 1. Удаляем решётку в начале строки, если она есть
    hex = hex.replace(/^#/, '');

    // 2. Если запись сокращённая (например, "fb2" или "fbbf24"),
    //    то преобразуем 3 символа в 6: "fb2" → "ffbb22"
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // 3. Извлекаем значения красного, зелёного и синего каналов
    //    Берём подстроки по два символа и переводим из 16-ричной системы в десятичную
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 4. Возвращаем объект с каналами
    return { r, g, b };
}
    
    const rgb = hexToRgb(pointColor);
    
    let mouse = { x: null, y: null, radius: 100 };
    
    function init() {
        resize();
        createPoints();
        animate();
    }
    
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    function createPoints() {
        points = [];
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * pointSpeed,
                vy: (Math.random() - 0.5) * pointSpeed,
                radius: 0.5 + Math.random() * 1.5
            });
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Обновление позиций (без изменений)
        points.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            
            if (mouse.x && mouse.y) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    p.x += Math.cos(angle) * force * 2;
                    p.y += Math.sin(angle) * force * 2;
                }
            }
        });
        
        // Рисуем линии
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dx = points[i].x - points[j].x;
                const dy = points[i].y - points[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < maxDistance) {
                    const opacity = lineBaseOpacity * (1 - dist / maxDistance);
                    // Используем RGB из переменной
                    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Рисуем точки
        points.forEach(p => {
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pointOpacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });
    window.addEventListener('resize', () => {
        resize();
        createPoints();
    });
    
    init();
    
})();

// Инициализация EmailJS (замените на свой User ID)
(function() {
    emailjs.init("eA7h-2uTA3fu_y82T"); // Замените на реальный ключ
})();

// Обработка формы
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('#contact-form'); // Убедитесь, что у формы id="contact-form"
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Показываем индикатор загрузки (можно добавить спиннер)
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
            
            // Отправляем форму через EmailJS
            emailjs.sendForm('service_1m030sg', 'template_zku2mos', this)
                .then(() => {
                    alert('Сообщение успешно отправлено!');
                    contactForm.reset(); // Очищаем поля
                })
                .catch((error) => {
                    console.error('Ошибка:', error);
                    alert('Произошла ошибка. Попробуйте позже.');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                });
        });
    }
});