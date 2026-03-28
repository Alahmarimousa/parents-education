/* ============================================
   Parents Education Portal - Main Application
   SPA Router, Search, Navigation, QR Generator
   ============================================ */

(function() {
    'use strict';

    // ---- App State ----
    const state = {
        currentPage: 'home',
        sideNavOpen: false,
        searchOpen: false
    };

    // ---- DOM Elements ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---- Initialize ----
    document.addEventListener('DOMContentLoaded', () => {
        // If access is denied, don't initialize the app
        if (window.__ACCESS_DENIED__) return;
        setTimeout(() => {
            const splash = $('#splash-screen');
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                $('#app').classList.remove('hidden');
            }, 500);
        }, 1800);

        initNavigation();
        initSearch();
        initBackToTop();
        renderPage('home');
    });

    // ---- Navigation ----
    function initNavigation() {
        // Menu button
        $('#menuBtn').addEventListener('click', toggleSideNav);
        $('#navOverlay').addEventListener('click', closeSideNav);

        // Nav links
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                navigateTo(page);
                closeSideNav();
            });
        });

        // Bottom nav
        $$('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(item.dataset.page);
            });
        });

        // Header title -> home
        $('#headerTitle').addEventListener('click', () => navigateTo('home'));
    }

    function toggleSideNav() {
        state.sideNavOpen = !state.sideNavOpen;
        $('#sideNav').classList.toggle('open', state.sideNavOpen);
        $('#navOverlay').classList.toggle('active', state.sideNavOpen);
        $('#menuBtn').classList.toggle('active', state.sideNavOpen);
    }

    function closeSideNav() {
        state.sideNavOpen = false;
        $('#sideNav').classList.remove('open');
        $('#navOverlay').classList.remove('active');
        $('#menuBtn').classList.remove('active');
    }

    function navigateTo(page) {
        state.currentPage = page;
        renderPage(page);
        updateActiveNav(page);
        // Update hash with page param while preserving access token
        const params = new URLSearchParams(window.location.hash.substring(1));
        params.set('page', page);
        const newHash = '#' + params.toString();
        if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeSearch();
    }

    function updateActiveNav(page) {
        $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
        $$('.bottom-nav-item').forEach(l => l.classList.toggle('active', l.dataset.page === page));
    }

    // ---- Search ----
    function initSearch() {
        $('#searchBtn').addEventListener('click', toggleSearch);
        $('#searchClose').addEventListener('click', closeSearch);

        const input = $('#searchInput');
        input.addEventListener('input', () => {
            const query = input.value.trim();
            if (query.length >= 2) {
                performSearch(query);
            } else {
                $('#searchResults').classList.remove('active');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = $('.search-result-item');
                if (first) first.click();
            }
        });
    }

    function toggleSearch() {
        state.searchOpen = !state.searchOpen;
        const bar = $('#searchBar');
        bar.classList.toggle('hidden', !state.searchOpen);
        if (state.searchOpen) {
            setTimeout(() => $('#searchInput').focus(), 100);
        }
    }

    function closeSearch() {
        state.searchOpen = false;
        $('#searchBar').classList.add('hidden');
        $('#searchInput').value = '';
        $('#searchResults').classList.remove('active');
    }

    function performSearch(query) {
        const results = [];
        const allConditions = getAllConditions();
        const q = query.toLowerCase();

        allConditions.forEach(c => {
            const nameMatch = c.name.includes(q);
            const altMatch = (c.altNames || []).some(n => n.includes(q));
            const keyMatch = (c.keywords || []).some(k => k.includes(q));
            if (nameMatch || altMatch || keyMatch) {
                results.push(c);
            }
        });

        const container = $('#searchResults');
        if (results.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">لا توجد نتائج</div>';
        } else {
            container.innerHTML = results.map(r => `
                <div class="search-result-item" data-page="${r.id}">
                    <div class="result-icon">${r.icon}</div>
                    <div class="result-text">
                        <h4>${r.name}</h4>
                        <p>${r.shortDesc || ''}</p>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    navigateTo(item.dataset.page);
                });
            });
        }
        container.classList.add('active');
    }

    function getAllConditions() {
        const conditions = [];
        if (window.conditionsNeuro) conditions.push(...window.conditionsNeuro);
        if (window.conditionsSkeletal) conditions.push(...window.conditionsSkeletal);
        if (window.conditionsHip) conditions.push(...window.conditionsHip);
        if (window.conditionsFractures) conditions.push(...window.conditionsFractures);
        // Add surgery guide
        conditions.push({
            id: 'surgery-guide',
            name: 'دليل ما قبل وبعد الجراحة',
            icon: '📋',
            shortDesc: 'تعليمات شاملة للتحضير للعمليات الجراحية والعناية بعدها',
            keywords: ['جراحة', 'عملية', 'تحضير', 'تخدير', 'ما بعد', 'ما قبل']
        });
        // Add cast care sections
        if (window.castCareData) conditions.push(...window.castCareData);
        return conditions;
    }

    // ---- Back to Top ----
    function initBackToTop() {
        const btn = $('#backToTop');
        window.addEventListener('scroll', () => {
            btn.classList.toggle('hidden', window.scrollY < 400);
        });
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Page Rendering ----
    function renderPage(page) {
        const main = $('#mainContent');
        switch (page) {
            case 'home':
                main.innerHTML = renderHomePage();
                bindHomeEvents();
                break;
            case 'categories':
                main.innerHTML = renderCategoriesPage();
                bindCategoryEvents();
                break;
            case 'surgery-guide':
                main.innerHTML = renderSurgeryGuidePage();
                bindSectionToggles();
                break;
            case 'qr-codes':
                main.innerHTML = renderQRPage();
                generateQRCodes();
                break;
            default:
                const condition = findCondition(page);
                if (condition) {
                    main.innerHTML = renderConditionPage(condition);
                    bindSectionToggles();
                    bindQuickNav();
                    bindFAQToggles();
                    // Auto-open first section
                    const firstSection = main.querySelector('.section-header');
                    if (firstSection) firstSection.click();
                }
                break;
        }
    }

    function findCondition(id) {
        const all = getAllConditions();
        return all.find(c => c.id === id);
    }

    // ---- Home Page ----
    function renderHomePage() {
        const neuro = window.conditionsNeuro || [];
        const skeletal = window.conditionsSkeletal || [];
        const hip = window.conditionsHip || [];
        const fractures = window.conditionsFractures || [];

        return `
            <div class="hero-section">
                <div class="hero-content">
                    <h1>بوابة تثقيف الأسرة</h1>
                    <p class="hero-hospital">وحدة جراحة عظام الأطفال</p>
                    <p>دليلكم الشامل لفهم حالات عظام الأطفال وعلاجاتها الجراحية وغير الجراحية</p>
                    <div class="hero-badge">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
                        محتوى طبي تعليمي موثوق
                    </div>
                </div>
            </div>

            <div class="disclaimer-banner">
                <div class="disc-icon">⚕️</div>
                <p><strong>تنبيه مهم:</strong> هذا المحتوى للأغراض التعليمية فقط ولا يُغني عن استشارة الطبيب المختص. استشر طبيب طفلك دائماً قبل اتخاذ أي قرارات علاجية.</p>
            </div>

            <div class="section-container">
                <div class="section-title">
                    <div class="title-icon cat-neuro">🧠</div>
                    الحالات العصبية والعضلية
                </div>
                <div class="categories-grid">
                    ${neuro.map(c => renderCategoryCard(c, 'cat-neuro')).join('')}
                </div>
            </div>

            <div class="section-container">
                <div class="section-title">
                    <div class="title-icon cat-bone">🦴</div>
                    أمراض العظام والمفاصل
                </div>
                <div class="categories-grid">
                    ${skeletal.map(c => renderCategoryCard(c, 'cat-bone')).join('')}
                </div>
            </div>

            <div class="section-container">
                <div class="section-title">
                    <div class="title-icon cat-hip">🏃</div>
                    أمراض الورك والمشي
                </div>
                <div class="categories-grid">
                    ${hip.map(c => renderCategoryCard(c, 'cat-hip')).join('')}
                </div>
            </div>

            <div class="section-container">
                <div class="section-title">
                    <div class="title-icon cat-fracture">🩹</div>
                    الكسور
                </div>
                <div class="categories-grid">
                    ${fractures.map(c => renderCategoryCard(c, 'cat-fracture')).join('')}
                </div>
            </div>

            <div class="section-container">
                <div class="section-title">
                    <div class="title-icon cat-surgery">📋</div>
                    أدلة مهمة
                </div>
                <div class="categories-grid">
                    <div class="category-card" data-page="surgery-guide">
                        <div class="category-icon cat-surgery">🏥</div>
                        <h3>دليل ما قبل وبعد الجراحة</h3>
                        <p>تعليمات شاملة</p>
                    </div>
                    <div class="category-card" data-page="cast-care">
                        <div class="category-icon cat-surgery">🦴</div>
                        <h3>العناية بالجبيرة</h3>
                        <p>بعد الجراحة</p>
                    </div>
                    <div class="category-card" data-page="spica-cast-care">
                        <div class="category-icon cat-hip">👶</div>
                        <h3>الجبيرة الحوضية</h3>
                        <p>دليل العناية الشامل</p>
                    </div>
                    <div class="category-card" data-page="qr-codes">
                        <div class="category-icon cat-surgery">📱</div>
                        <h3>رموز QR للطباعة</h3>
                        <p>سهولة الوصول</p>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCategoryCard(condition, colorClass) {
        return `
            <div class="category-card" data-page="${condition.id}">
                <div class="category-icon ${colorClass}">${condition.icon}</div>
                <h3>${condition.name}</h3>
                <p>${condition.shortDesc || ''}</p>
            </div>
        `;
    }

    function bindHomeEvents() {
        $$('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                if (page) navigateTo(page);
            });
        });
    }

    // ---- Categories Page ----
    function renderCategoriesPage() {
        const groups = [
            { title: '🧠 الحالات العصبية والعضلية', items: window.conditionsNeuro || [], color: 'cat-neuro' },
            { title: '🦴 أمراض العظام والمفاصل', items: window.conditionsSkeletal || [], color: 'cat-bone' },
            { title: '🏃 أمراض الورك والمشي', items: window.conditionsHip || [], color: 'cat-hip' },
            { title: '🩹 الكسور', items: window.conditionsFractures || [], color: 'cat-fracture' }
        ];

        return `
            <div class="condition-header" style="background: linear-gradient(135deg, #0e7490, #155e75);">
                <h1>جميع الأقسام</h1>
                <p class="subtitle">تصفح جميع الحالات والمواضيع المتاحة</p>
            </div>
            <div class="section-container categories-page">
                ${groups.map(g => `
                    <div class="category-group">
                        <div class="group-title">${g.title}</div>
                        ${g.items.map(c => `
                            <div class="condition-list-card" data-page="${c.id}">
                                <div class="card-icon ${g.color}">${c.icon}</div>
                                <div class="card-info">
                                    <h3>${c.name}</h3>
                                    <p>${c.shortDesc || ''}</p>
                                </div>
                                <div class="card-arrow">◀</div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}

                <div class="category-group">
                    <div class="group-title">📋 أدلة الجراحة والعناية</div>
                    <div class="condition-list-card" data-page="surgery-guide">
                        <div class="card-icon cat-surgery">🏥</div>
                        <div class="card-info">
                            <h3>دليل ما قبل وبعد الجراحة</h3>
                            <p>تعليمات شاملة للتحضير للعمليات والعناية بعدها</p>
                        </div>
                        <div class="card-arrow">◀</div>
                    </div>
                    <div class="condition-list-card" data-page="cast-care">
                        <div class="card-icon cat-surgery">🦴</div>
                        <div class="card-info">
                            <h3>العناية بالجبيرة بعد الجراحة</h3>
                            <p>تعليمات العناية بالجبيرة وعلامات الخطر والحياة اليومية</p>
                        </div>
                        <div class="card-arrow">◀</div>
                    </div>
                    <div class="condition-list-card" data-page="spica-cast-care">
                        <div class="card-icon cat-hip">👶</div>
                        <div class="card-info">
                            <h3>العناية بالجبيرة الحوضية (البنطلونية)</h3>
                            <p>دليل شامل للعناية بالطفل في الجبيرة الحوضية بعد عملية خلع الورك</p>
                        </div>
                        <div class="card-arrow">◀</div>
                    </div>
                </div>
            </div>
        `;
    }

    function bindCategoryEvents() {
        $$('.condition-list-card').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo(card.dataset.page);
            });
        });
    }

    // ---- Condition Page ----
    function renderConditionPage(condition) {
        const sections = condition.sections || [];
        const quickNavTabs = sections.map((s, i) => `
            <button class="quick-nav-tab${i === 0 ? ' active' : ''}" data-section="section-${i}">${s.title}</button>
        `).join('');

        const sectionsHtml = sections.map((s, i) => renderSection(s, i)).join('');

        return `
            <div class="condition-header">
                <div class="breadcrumb">
                    <a href="#" data-nav="home">الرئيسية</a>
                    <span>›</span>
                    <span>${condition.name}</span>
                </div>
                <h1>${condition.name}</h1>
                ${condition.englishName ? `<p class="subtitle">${condition.englishName}</p>` : ''}
                ${condition.badges ? `
                    <div class="condition-badges">
                        ${condition.badges.map(b => `<span class="condition-badge">${b}</span>`).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="quick-nav">
                <div class="quick-nav-inner">
                    ${quickNavTabs}
                </div>
            </div>

            <div class="condition-content">
                ${sectionsHtml}
            </div>
        `;
    }

    function renderSection(section, index) {
        const iconColors = {
            'overview': '#dbeafe',
            'causes': '#fce7f3',
            'symptoms': '#fef3c7',
            'diagnosis': '#e0e7ff',
            'conservative': '#d1fae5',
            'surgical': '#ede9fe',
            'pre-surgery': '#cffafe',
            'post-surgery': '#d1fae5',
            'rehab': '#fef3c7',
            'emergency': '#fee2e2',
            'faq': '#f0f9ff'
        };

        const sectionIcons = {
            'overview': '📖',
            'causes': '🔬',
            'symptoms': '🩺',
            'diagnosis': '🔍',
            'conservative': '💊',
            'surgical': '🔪',
            'pre-surgery': '📋',
            'post-surgery': '🏥',
            'rehab': '🏋️',
            'emergency': '🚨',
            'faq': '❓',
            'types': '📊',
            'classification': '📊'
        };

        const bgColor = iconColors[section.type] || '#f0f9ff';
        const icon = sectionIcons[section.type] || '📄';

        return `
            <div class="content-section" id="section-${index}">
                <div class="section-header" data-target="section-body-${index}">
                    <div class="section-icon" style="background: ${bgColor}">${icon}</div>
                    <h2>${section.title}</h2>
                    <svg class="toggle-icon" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor"/></svg>
                </div>
                <div class="section-body" id="section-body-${index}">
                    ${section.content}
                </div>
            </div>
        `;
    }

    function bindSectionToggles() {
        $$('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.target;
                const body = document.getElementById(targetId);
                const isOpen = body.classList.contains('open');

                header.classList.toggle('open', !isOpen);
                body.classList.toggle('open', !isOpen);
            });
        });

        // Breadcrumb nav
        $$('.breadcrumb a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(a.dataset.nav || 'home');
            });
        });
    }

    function bindQuickNav() {
        $$('.quick-nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.quick-nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetSection = document.getElementById(tab.dataset.section);
                if (targetSection) {
                    // Open the section
                    const header = targetSection.querySelector('.section-header');
                    const body = targetSection.querySelector('.section-body');
                    if (header && body && !body.classList.contains('open')) {
                        header.classList.add('open');
                        body.classList.add('open');
                    }
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    function bindFAQToggles() {
        $$('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                const answer = q.nextElementSibling;
                if (answer) answer.classList.toggle('open');
            });
        });
    }

    // ---- Surgery Guide Page ----
    function renderSurgeryGuidePage() {
        const guide = window.surgeryGuideData || {};
        return `
            <div class="condition-header" style="background: linear-gradient(135deg, #059669, #047857);">
                <div class="breadcrumb">
                    <a href="#" data-nav="home">الرئيسية</a>
                    <span>›</span>
                    <span>دليل الجراحة</span>
                </div>
                <h1>دليل ما قبل وبعد الجراحة</h1>
                <p class="subtitle">كل ما تحتاج معرفته للتحضير لعملية طفلك والعناية به بعدها</p>
            </div>
            <div class="condition-content">
                ${(guide.sections || []).map((s, i) => renderSection(s, i)).join('')}
            </div>
        `;
    }

    // ---- QR Code Page ----
    function renderQRPage() {
        const allConditions = getAllConditions();

        return `
            <div class="condition-header" style="background: linear-gradient(135deg, #7c3aed, #5b21b6);">
                <h1>رموز QR للطباعة</h1>
                <p class="subtitle">امسح الرمز بكاميرا هاتفك للوصول المباشر لكل موضوع</p>
            </div>
            <div class="section-container">
                <div class="info-box tip">
                    <div class="info-box-icon">💡</div>
                    <div class="info-box-content">
                        <strong>كيفية الاستخدام</strong>
                        <p>اطبع هذه الرموز وضعها في العيادة أو غرف الانتظار ليتمكن المرضى وأسرهم من الوصول للمعلومات بسهولة عبر هواتفهم.</p>
                    </div>
                </div>
                <div class="qr-grid" id="qrGrid">
                    ${allConditions.map(c => `
                        <div class="qr-card" data-condition-id="${c.id}">
                            <h3>${c.icon} ${c.name}</h3>
                            <canvas class="qr-canvas" data-page="${c.id}"></canvas>
                            <div class="qr-actions">
                                <button class="btn btn-sm btn-primary qr-print" data-id="${c.id}">🖨️ طباعة</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function generateQRCodes() {
        const ACCESS_TOKEN = 'PedOrtho-Portal-2026';
        const BASE_URL = 'https://alahmarimousa.github.io/parents-education/';

        $$('.qr-canvas').forEach(canvasEl => {
            const page = canvasEl.dataset.page;
            const url = `${BASE_URL}#access=${ACCESS_TOKEN}&page=${page}`;

            // Generate QR code on canvas using built-in generator
            const size = 200;
            canvasEl.width = size;
            canvasEl.height = size;
            canvasEl.style.borderRadius = '12px';
            canvasEl.style.border = '2px solid #e2e8f0';
            canvasEl.dataset.url = url;
            canvasEl.dataset.page = page;
            canvasEl.className = 'qr-image';

            drawQR(canvasEl, url, size);
        });

        // Print individual QR
        $$('.qr-print').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.qr-card');
                const qrEl = card.querySelector('.qr-image');
                const title = card.querySelector('h3').textContent;
                const url = qrEl.dataset.url;
                const imgSrc = qrEl.toDataURL('image/png');
                printQR(imgSrc, title, url);
            });
        });
    }

    // ---- Minimal QR Code Generator (supports alphanumeric URLs) ----
    function drawQR(canvas, text, size) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Use QRCode matrix generation
        const qr = generateQRMatrix(text);
        if (!qr) {
            ctx.fillStyle = '#ef4444';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('QR Error', size / 2, size / 2);
            return;
        }

        const modules = qr.length;
        const cellSize = (size - 20) / modules;
        const offset = 10;

        ctx.fillStyle = '#1e293b';
        for (let r = 0; r < modules; r++) {
            for (let c = 0; c < modules; c++) {
                if (qr[r][c]) {
                    ctx.fillRect(
                        offset + c * cellSize,
                        offset + r * cellSize,
                        cellSize + 0.5,
                        cellSize + 0.5
                    );
                }
            }
        }
    }

    // QR Code matrix generator (Version 1-6, Error Correction L)
    function generateQRMatrix(data) {
        // Encode data as byte mode
        const dataBytes = [];
        for (let i = 0; i < data.length; i++) {
            const code = data.charCodeAt(i);
            if (code < 128) dataBytes.push(code);
            else if (code < 2048) {
                dataBytes.push(192 | (code >> 6));
                dataBytes.push(128 | (code & 63));
            } else {
                dataBytes.push(224 | (code >> 12));
                dataBytes.push(128 | ((code >> 6) & 63));
                dataBytes.push(128 | (code & 63));
            }
        }

        // Version capacities for byte mode, EC level L
        const versionCapacity = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586];
        let version = 0;
        for (let v = 1; v <= 16; v++) {
            if (dataBytes.length <= versionCapacity[v]) { version = v; break; }
        }
        if (version === 0) return null;

        const size = 17 + version * 4;
        const matrix = Array.from({length: size}, () => Array(size).fill(null));
        const reserved = Array.from({length: size}, () => Array(size).fill(false));

        // Place finder patterns
        function placeFinder(row, col) {
            for (let r = -1; r <= 7; r++) {
                for (let c = -1; c <= 7; c++) {
                    const mr = row + r, mc = col + c;
                    if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;
                    if (r === -1 || r === 7 || c === -1 || c === 7) {
                        matrix[mr][mc] = false;
                    } else if ((r === 0 || r === 6) || (c === 0 || c === 6)) {
                        matrix[mr][mc] = true;
                    } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                        matrix[mr][mc] = true;
                    } else {
                        matrix[mr][mc] = false;
                    }
                    reserved[mr][mc] = true;
                }
            }
        }

        placeFinder(0, 0);
        placeFinder(0, size - 7);
        placeFinder(size - 7, 0);

        // Timing patterns
        for (let i = 8; i < size - 8; i++) {
            matrix[6][i] = (i % 2 === 0);
            reserved[6][i] = true;
            matrix[i][6] = (i % 2 === 0);
            reserved[i][6] = true;
        }

        // Alignment patterns for version >= 2
        if (version >= 2) {
            const alignPos = getAlignmentPositions(version);
            for (const r of alignPos) {
                for (const c of alignPos) {
                    if (reserved[r] && reserved[r][c]) continue;
                    for (let dr = -2; dr <= 2; dr++) {
                        for (let dc = -2; dc <= 2; dc++) {
                            const mr = r + dr, mc = c + dc;
                            if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;
                            if (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) {
                                matrix[mr][mc] = true;
                            } else {
                                matrix[mr][mc] = false;
                            }
                            reserved[mr][mc] = true;
                        }
                    }
                }
            }
        }

        // Reserve format info areas
        for (let i = 0; i < 8; i++) {
            reserved[8][i] = true;
            reserved[8][size - 1 - i] = true;
            reserved[i][8] = true;
            reserved[size - 1 - i][8] = true;
        }
        reserved[8][8] = true;
        // Dark module
        matrix[size - 8][8] = true;
        reserved[size - 8][8] = true;

        // Reserve version info for version >= 7
        if (version >= 7) {
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 3; j++) {
                    reserved[i][size - 11 + j] = true;
                    reserved[size - 11 + j][i] = true;
                }
            }
        }

        // Encode data
        const ecInfo = getECInfo(version);
        const totalCodewords = ecInfo.totalCodewords;
        const ecCodewordsPerBlock = ecInfo.ecPerBlock;
        const blocks = ecInfo.blocks;

        // Build data bit stream
        const bits = [];
        // Mode indicator: byte = 0100
        bits.push(0, 1, 0, 0);
        // Character count
        const ccBits = version <= 9 ? 8 : 16;
        for (let i = ccBits - 1; i >= 0; i--) bits.push((dataBytes.length >> i) & 1);
        // Data
        for (const b of dataBytes) {
            for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
        }
        // Terminator
        const totalDataBits = (totalCodewords - ecCodewordsPerBlock * blocks.reduce((s, b) => s + b.count, 0)) * 8;
        for (let i = 0; i < 4 && bits.length < totalDataBits; i++) bits.push(0);
        // Pad to byte boundary
        while (bits.length % 8 !== 0) bits.push(0);
        // Pad codewords
        let padByte = 0;
        while (bits.length < totalDataBits) {
            const p = padByte % 2 === 0 ? 0xEC : 0x11;
            for (let i = 7; i >= 0; i--) bits.push((p >> i) & 1);
            padByte++;
        }

        // Convert to bytes
        const dataCodewords = [];
        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
            dataCodewords.push(byte);
        }

        // Generate EC codewords using Reed-Solomon
        const allBlocks = [];
        let offset = 0;
        for (const block of blocks) {
            for (let b = 0; b < block.count; b++) {
                const blockData = dataCodewords.slice(offset, offset + block.dataCodewords);
                offset += block.dataCodewords;
                const ec = reedSolomonEncode(blockData, ecCodewordsPerBlock);
                allBlocks.push({ data: blockData, ec: ec });
            }
        }

        // Interleave
        const finalData = [];
        const maxDataLen = Math.max(...allBlocks.map(b => b.data.length));
        for (let i = 0; i < maxDataLen; i++) {
            for (const block of allBlocks) {
                if (i < block.data.length) finalData.push(block.data[i]);
            }
        }
        for (let i = 0; i < ecCodewordsPerBlock; i++) {
            for (const block of allBlocks) {
                if (i < block.ec.length) finalData.push(block.ec[i]);
            }
        }

        // Convert to bits
        const finalBits = [];
        for (const b of finalData) {
            for (let i = 7; i >= 0; i--) finalBits.push((b >> i) & 1);
        }
        // Remainder bits
        const remainderBits = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < (remainderBits[version] || 0); i++) finalBits.push(0);

        // Place data bits
        let bitIdx = 0;
        let upward = true;
        for (let col = size - 1; col >= 0; col -= 2) {
            if (col === 6) col = 5; // skip timing column
            const rows = upward ? Array.from({length: size}, (_, i) => size - 1 - i) : Array.from({length: size}, (_, i) => i);
            for (const row of rows) {
                for (let c = 0; c < 2; c++) {
                    const cc = col - c;
                    if (cc < 0) continue;
                    if (reserved[row][cc]) continue;
                    matrix[row][cc] = bitIdx < finalBits.length ? finalBits[bitIdx] === 1 : false;
                    bitIdx++;
                }
            }
            upward = !upward;
        }

        // Apply mask (mask 0: (row + col) % 2 === 0)
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!reserved[r][c]) {
                    if ((r + c) % 2 === 0) matrix[r][c] = !matrix[r][c];
                }
            }
        }

        // Write format info (mask 0, EC level L)
        const formatBits = getFormatBits(0, 1); // mask 0, ecl L=1
        for (let i = 0; i < 15; i++) {
            const bit = ((formatBits >> (14 - i)) & 1) === 1;
            // Around top-left finder
            if (i < 6) matrix[8][i] = bit;
            else if (i < 8) matrix[8][i + 1] = bit;
            else if (i < 9) matrix[8 - (i - 8)][8] = bit;
            else matrix[14 - i][8] = bit;
            // Around other finders
            if (i < 8) matrix[size - 1 - i][8] = bit;
            else matrix[8][size - 15 + i] = bit;
        }

        // Write version info for version >= 7
        if (version >= 7) {
            const versionBits = getVersionBits(version);
            for (let i = 0; i < 18; i++) {
                const bit = ((versionBits >> i) & 1) === 1;
                const r = Math.floor(i / 3);
                const c = i % 3;
                matrix[r][size - 11 + c] = bit;
                matrix[size - 11 + c][r] = bit;
            }
        }

        return matrix.map(row => row.map(v => v === true));
    }

    function getAlignmentPositions(version) {
        if (version === 1) return [];
        const positions = [
            [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
            [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
            [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74]
        ];
        return positions[version - 1] || [];
    }

    function getECInfo(version) {
        // EC Level L data: [totalCodewords, ecPerBlock, [{count, dataCodewords}]]
        const table = {
            1: { totalCodewords: 26, ecPerBlock: 7, blocks: [{ count: 1, dataCodewords: 19 }] },
            2: { totalCodewords: 44, ecPerBlock: 10, blocks: [{ count: 1, dataCodewords: 34 }] },
            3: { totalCodewords: 70, ecPerBlock: 15, blocks: [{ count: 1, dataCodewords: 55 }] },
            4: { totalCodewords: 100, ecPerBlock: 20, blocks: [{ count: 1, dataCodewords: 80 }] },
            5: { totalCodewords: 134, ecPerBlock: 26, blocks: [{ count: 1, dataCodewords: 108 }] },
            6: { totalCodewords: 172, ecPerBlock: 18, blocks: [{ count: 2, dataCodewords: 68 }] },
            7: { totalCodewords: 196, ecPerBlock: 20, blocks: [{ count: 2, dataCodewords: 78 }] },
            8: { totalCodewords: 242, ecPerBlock: 24, blocks: [{ count: 2, dataCodewords: 97 }] },
            9: { totalCodewords: 292, ecPerBlock: 30, blocks: [{ count: 2, dataCodewords: 116 }] },
            10: { totalCodewords: 346, ecPerBlock: 18, blocks: [{ count: 2, dataCodewords: 68 }, { count: 2, dataCodewords: 69 }] },
        };
        return table[version];
    }

    // Reed-Solomon encoder over GF(256)
    function reedSolomonEncode(data, ecCount) {
        // GF(256) log/exp tables
        const exp = new Uint8Array(512);
        const log = new Uint8Array(256);
        let x = 1;
        for (let i = 0; i < 255; i++) {
            exp[i] = x;
            log[x] = i;
            x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
        }
        for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];

        // Generator polynomial
        const gen = new Uint8Array(ecCount + 1);
        gen[0] = 1;
        for (let i = 0; i < ecCount; i++) {
            for (let j = ecCount; j >= 1; j--) {
                gen[j] = gen[j] ^ (gen[j - 1] === 0 ? 0 : exp[log[gen[j - 1]] + i]);
            }
        }

        // Division
        const result = new Uint8Array(ecCount);
        const msg = new Uint8Array(data.length + ecCount);
        for (let i = 0; i < data.length; i++) msg[i] = data[i];

        for (let i = 0; i < data.length; i++) {
            const coef = msg[i];
            if (coef !== 0) {
                for (let j = 0; j <= ecCount; j++) {
                    msg[i + j] ^= (gen[j] === 0 ? 0 : exp[log[gen[j]] + log[coef]]);
                }
            }
        }

        for (let i = 0; i < ecCount; i++) result[i] = msg[data.length + i];
        return Array.from(result);
    }

    function getFormatBits(mask, ecl) {
        // ecl: L=1, M=0, Q=3, H=2
        const data = (ecl << 3) | mask;
        let bits = data << 10;
        // BCH(15,5) division by x10+x8+x5+x4+x2+x+1 (0x537)
        for (let i = 4; i >= 0; i--) {
            if (bits & (1 << (i + 10))) bits ^= (0x537 << i);
        }
        bits = (data << 10) | bits;
        // XOR mask
        return bits ^ 0x5412;
    }

    function getVersionBits(version) {
        let bits = version << 12;
        // BCH(18,6) division by x12+x11+x10+x9+x8+x5+x2+1 (0x1F25)
        for (let i = 5; i >= 0; i--) {
            if (bits & (1 << (i + 12))) bits ^= (0x1F25 << i);
        }
        return (version << 12) | bits;
    }

    function printQR(imgSrc, title, url) {
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>QR - ${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
                    h1 { font-size: 24px; margin-bottom: 20px; }
                    img { border: 10px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    p { color: #666; margin-top: 20px; font-size: 14px; }
                    .url { font-size: 11px; color: #999; word-break: break-all; margin-top: 10px; direction: ltr; }
                    .header { border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h2 { color: #0891b2; font-size: 18px; }
                    .header h3 { color: #475569; font-size: 14px; font-weight: normal; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>بوابة تثقيف الأسرة</h2>
                    <h3>وحدة جراحة عظام الأطفال</h3>
                </div>
                <h1>${title}</h1>
                <img src="${imgSrc}" width="250" height="250">
                <p>امسح رمز QR بكاميرا هاتفك للوصول المباشر لهذا الموضوع</p>
                <div class="url">${url}</div>
                <script>window.onload=function(){setTimeout(function(){window.print();},500);}</script>
            </body>
            </html>
        `);
    }

    // ---- Hash routing ----
    // Hash format: #access=TOKEN&page=somepage
    function getPageFromHash() {
        const hash = window.location.hash;
        if (!hash) return null;
        const params = new URLSearchParams(hash.substring(1));
        return params.get('page') || null;
    }

    window.addEventListener('hashchange', () => {
        const page = getPageFromHash();
        if (page && page !== state.currentPage) {
            navigateTo(page);
        }
    });

    // Check initial page from hash (set by access-gate.js)
    if (window.__INITIAL_PAGE__) {
        setTimeout(() => navigateTo(window.__INITIAL_PAGE__), 2000);
    }

    // Expose navigateTo globally for inline usage
    window.navigateTo = navigateTo;

})();
