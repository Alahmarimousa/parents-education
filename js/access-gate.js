/**
 * Access Gate - Restricts access to users with the correct token in the URL hash.
 * The QR code contains the full URL with the secret token.
 * Without the token, visitors see an "Access Denied" screen.
 */
(function() {
    'use strict';

    // Secret access token - change this to update the QR code access
    const ACCESS_TOKEN = 'PedOrtho-Portal-2026';

    // Parse hash parameters (format: #access=TOKEN&page=somepage)
    function getHashParams() {
        const hash = window.location.hash;
        if (!hash) return {};
        return Object.fromEntries(new URLSearchParams(hash.substring(1)));
    }

    function isAuthorized() {
        const params = getHashParams();
        if (params.access === ACCESS_TOKEN) {
            // Store in sessionStorage so navigation within the page works
            sessionStorage.setItem('pe_authorized', 'true');
            return true;
        }
        // Check sessionStorage for already-authorized sessions
        return sessionStorage.getItem('pe_authorized') === 'true';
    }

    // Expose helper to get the initial page from hash (e.g., #access=TOKEN&page=cerebral-palsy)
    window.__INITIAL_PAGE__ = getHashParams().page || null;

    function showAccessDenied() {
        // Hide everything
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('app').classList.add('hidden');

        // Create access denied screen
        const gate = document.createElement('div');
        gate.id = 'access-gate';
        gate.innerHTML = `
            <div class="gate-container">
                <div class="gate-icon">
                    <svg viewBox="0 0 24 24" width="80" height="80">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#0891b2"/>
                    </svg>
                </div>
                <h1 class="gate-title">الوصول مقيّد</h1>
                <p class="gate-subtitle">Access Restricted</p>
                <p class="gate-message">هذا المحتوى متاح فقط عبر رمز QR المخصص</p>
                <p class="gate-message-en">This content is only accessible via the authorized QR code.</p>
                <div class="gate-divider"></div>
                <div class="gate-info">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4z" fill="#0891b2"/>
                    </svg>
                    <span>يرجى مسح رمز QR للدخول</span>
                </div>
                <p class="gate-footer">وحدة جراحة عظام الأطفال</p>
            </div>
        `;
        document.body.appendChild(gate);
    }

    // Run gate check immediately
    if (!isAuthorized()) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showAccessDenied);
        } else {
            showAccessDenied();
        }
        // Prevent other scripts from running by setting a global flag
        window.__ACCESS_DENIED__ = true;
    }
})();
