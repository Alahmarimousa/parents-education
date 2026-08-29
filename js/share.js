/* ============================================
   Parents Education Portal - Sharing
   WhatsApp / Telegram / Native share / Copy / Email / Print
   ============================================ */

(function () {
    'use strict';

    /* The access token carried by the printed QR codes. Shared links include it
       so a relative who receives the link on WhatsApp lands directly on the
       topic, exactly as if they had scanned the QR code in the clinic. */
    const ACCESS_TOKEN = 'PedOrtho-Portal-2026';
    const FALLBACK_BASE_URL = 'https://alahmarimousa.github.io/parents-education/';
    const PORTAL_NAME = 'بوابة تثقيف الأسرة - وحدة جراحة عظام الأطفال';

    // ---- Link building ----
    function baseUrl() {
        if (location.protocol === 'http:' || location.protocol === 'https:') {
            // Drop the implicit index.html so links and QR payloads stay short -
            // the built-in QR generator only reaches version 6.
            return (location.origin + location.pathname).replace(/index\.html$/, '');
        }
        return FALLBACK_BASE_URL;
    }

    function buildUrl(page, section) {
        const params = new URLSearchParams();
        params.set('access', ACCESS_TOKEN);
        if (page) params.set('page', page);
        if (section !== undefined && section !== null && section !== '') {
            params.set('section', section);
        }
        return baseUrl() + '#' + params.toString();
    }

    function buildMessage(ctx) {
        const lines = ['📚 ' + PORTAL_NAME, ''];
        if (ctx.title) lines.push('📌 ' + ctx.title);
        if (ctx.subtitle) lines.push(ctx.subtitle);
        lines.push('', ctx.url);
        return lines.join('\n');
    }

    // ---- Share targets ----
    const ICONS = {
        whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" fill="currentColor"/>',
        telegram: '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0m4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635" fill="currentColor"/>',
        native: '<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92" fill="currentColor"/>',
        copy: '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z" fill="currentColor"/>',
        email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4-8 5-8-5V6l8 5 8-5z" fill="currentColor"/>',
        print: '<path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3m-3 11H8v-5h8zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-1-9H6v4h12z" fill="currentColor"/>'
    };

    const TARGETS = [
        { id: 'whatsapp', label: 'واتساب' },
        { id: 'telegram', label: 'تيليجرام' },
        { id: 'native', label: 'مشاركة' },
        { id: 'copy', label: 'نسخ الرابط' },
        { id: 'email', label: 'بريد إلكتروني' },
        { id: 'print', label: 'طباعة' }
    ];

    function supportsNativeShare() {
        return typeof navigator.share === 'function';
    }

    function send(targetId, ctx) {
        const message = buildMessage(ctx);
        switch (targetId) {
            case 'whatsapp':
                openExternal('https://wa.me/?text=' + encodeURIComponent(message));
                break;
            case 'telegram':
                openExternal('https://t.me/share/url?url=' + encodeURIComponent(ctx.url) +
                    '&text=' + encodeURIComponent(message));
                break;
            case 'email':
                location.href = 'mailto:?subject=' + encodeURIComponent(ctx.title || PORTAL_NAME) +
                    '&body=' + encodeURIComponent(message);
                break;
            case 'native':
                nativeShare(ctx);
                break;
            case 'copy':
                copyLink(ctx.url);
                break;
            case 'print':
                closeSheet();
                setTimeout(() => window.print(), 250);
                break;
        }
    }

    function openExternal(url) {
        const win = window.open(url, '_blank', 'noopener');
        if (!win) location.href = url;
    }

    function nativeShare(ctx) {
        if (!supportsNativeShare()) {
            copyLink(ctx.url);
            return;
        }
        navigator.share({
            title: ctx.title || PORTAL_NAME,
            text: buildMessage(ctx),
            url: ctx.url
        }).then(closeSheet).catch(() => { /* user dismissed the share sheet */ });
    }

    function copyLink(url) {
        writeToClipboard(url).then(ok => {
            toast(ok ? 'تم نسخ الرابط ✓' : 'تعذّر نسخ الرابط، انسخه يدوياً');
        });
    }

    function writeToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(() => true).catch(() => legacyCopy(text));
        }
        return Promise.resolve(legacyCopy(text));
    }

    function legacyCopy(text) {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '-1000px';
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(area);
        return ok;
    }

    // ---- Toast ----
    let toastTimer = null;
    function toast(text) {
        let el = document.querySelector('.share-toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'share-toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.textContent = text;
        // Restart the entry animation on repeated copies.
        el.classList.remove('visible');
        void el.offsetWidth;
        el.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('visible'), 2600);
    }

    // ---- Share sheet ----
    let sheet = null;
    let backdrop = null;
    let activeCtx = null;
    let lastFocused = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function buildSheet() {
        backdrop = document.createElement('div');
        backdrop.className = 'share-backdrop';
        backdrop.addEventListener('click', closeSheet);

        sheet = document.createElement('div');
        sheet.className = 'share-sheet';
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-modal', 'true');
        sheet.setAttribute('aria-labelledby', 'shareSheetTitle');
        sheet.innerHTML = `
            <div class="share-sheet-grip"></div>
            <div class="share-sheet-head">
                <h3 id="shareSheetTitle">مشاركة مع الأهل</h3>
                <button type="button" class="share-sheet-close" aria-label="إغلاق">✕</button>
            </div>
            <p class="share-sheet-topic"></p>
            <div class="share-targets">
                ${TARGETS.map(t => `
                    <button type="button" class="share-target share-target-${t.id}" data-target="${t.id}">
                        <span class="share-target-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${ICONS[t.id]}</svg>
                        </span>
                        <span class="share-target-label">${t.label}</span>
                    </button>
                `).join('')}
            </div>
            <div class="share-link-row">
                <span class="share-link-text" dir="ltr"></span>
            </div>
            <p class="share-sheet-note">الرابط يفتح الموضوع مباشرة على هاتف من يستقبله، تماماً مثل مسح رمز QR.</p>
        `;

        sheet.querySelector('.share-sheet-close').addEventListener('click', closeSheet);
        sheet.querySelectorAll('.share-target').forEach(btn => {
            btn.addEventListener('click', () => {
                if (activeCtx) send(btn.dataset.target, activeCtx);
            });
        });
        sheet.querySelector('.share-link-row').addEventListener('click', () => {
            if (activeCtx) copyLink(activeCtx.url);
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(sheet);
    }

    function openSheet(ctx) {
        if (!sheet) buildSheet();
        activeCtx = ctx;
        lastFocused = document.activeElement;

        sheet.querySelector('.share-sheet-topic').textContent = ctx.title || '';
        sheet.querySelector('.share-link-text').textContent = ctx.url;
        // The native share sheet only exists on devices that offer one.
        sheet.querySelector('.share-target-native').classList.toggle('hidden', !supportsNativeShare());

        backdrop.classList.add('visible');
        sheet.classList.add('visible');
        document.body.classList.add('share-open');
        document.addEventListener('keydown', onKeydown);
        sheet.querySelector('.share-sheet-close').focus();
    }

    function closeSheet() {
        if (!sheet) return;
        backdrop.classList.remove('visible');
        sheet.classList.remove('visible');
        document.body.classList.remove('share-open');
        document.removeEventListener('keydown', onKeydown);
        activeCtx = null;
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        lastFocused = null;
    }

    function onKeydown(e) {
        if (e.key === 'Escape') closeSheet();
    }

    // ---- Public API ----
    /**
     * Share a topic or a single section.
     * @param {{page?:string, section?:number|string, title?:string, subtitle?:string, target?:string}} opts
     *   target: omit (or 'sheet') to open the share sheet, or name a target
     *   such as 'whatsapp' to go straight there.
     */
    function share(opts) {
        const o = opts || {};
        const ctx = {
            title: o.title || '',
            subtitle: o.subtitle || '',
            url: buildUrl(o.page, o.section)
        };
        if (!o.target || o.target === 'sheet') {
            openSheet(ctx);
        } else {
            send(o.target, ctx);
        }
    }

    window.PortalShare = {
        share,
        close: closeSheet,
        buildUrl,
        toast,
        accessToken: ACCESS_TOKEN,
        escapeHtml
    };
})();
