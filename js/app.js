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
                    <p class="hero-hospital">وحدة جراحة عظام الأطفال- مستشفى الملك فيصل التخصصي ومركز الأبحاث</p>
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
                    <div class="group-title">📋 أدلة مهمة</div>
                    <div class="condition-list-card" data-page="surgery-guide">
                        <div class="card-icon cat-surgery">🏥</div>
                        <div class="card-info">
                            <h3>دليل ما قبل وبعد الجراحة</h3>
                            <p>تعليمات شاملة للتحضير للعمليات والعناية بعدها</p>
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
        // Use QR Server API for real, scannable QR codes
        $$('.qr-canvas').forEach(canvas => {
            const page = canvas.dataset.page;
            const baseUrl = window.location.href.split('#')[0].split('?')[0];
            const url = `${baseUrl}#${page}`;

            // Replace canvas with img using QR Server API
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=1e293b&bgcolor=ffffff&margin=10`;
            img.alt = `QR code for ${page}`;
            img.className = 'qr-image';
            img.width = 200;
            img.height = 200;
            img.style.borderRadius = '12px';
            img.style.border = '2px solid #e2e8f0';

            // Store the URL for print
            img.dataset.url = url;
            img.dataset.page = page;

            canvas.replaceWith(img);
        });

        // Print individual QR
        $$('.qr-print').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.qr-card');
                const img = card.querySelector('.qr-image');
                const title = card.querySelector('h3').textContent;
                const url = img.dataset.url;
                printQR(img.src, title, url);
            });
        });
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
                    <h3>وحدة جراحة عظام الأطفال- مستشفى الملك فيصل التخصصي ومركز الأبحاث</h3>
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
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '') || 'home';
        if (page !== state.currentPage) {
            navigateTo(page);
        }
    });

    // Check initial hash
    if (window.location.hash) {
        const page = window.location.hash.replace('#', '');
        setTimeout(() => navigateTo(page), 2000);
    }

    // Expose navigateTo globally for inline usage
    window.navigateTo = navigateTo;

})();
