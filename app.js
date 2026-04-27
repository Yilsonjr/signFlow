// ============================================================
// SIGNFLOW — app.js
// ============================================================

// ── Appwrite config ──────────────────────────────────────────
const APPWRITE_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT  = '69ed2bd70024539b431a';
const APPWRITE_DB       = '69ed2dbb00235dbf613f';
const COL_DOCS          = 'documents';
const COL_USERS         = 'users';
const APPWRITE_BUCKET   = '69ed3b5800208f4433f2';

const PLANS = {
    free: { label: 'Gratuito', limit: 3,  price: 0 },
    pro:  { label: 'Pro',      limit: 999, price: 19 }
};

// ── Appwrite client ──────────────────────────────────────────
const client    = new Appwrite.Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
const databases = new Appwrite.Databases(client);
const storage   = new Appwrite.Storage(client);
const account   = new Appwrite.Account(client);

// ── State ────────────────────────────────────────────────────
const state = {
    user: null,          // Appwrite account object
    userDoc: null,       // users collection document
    isAnon: false,       // true when signer (no account)
    currentFile: null,
    currentFileBytes: null,
    pdfDoc: null,
    currentPage: 1,
    totalPages: 1,
    pdfScale: 1.5,
    signZone: null,
    currentDocCode: null,
    currentDocData: null
};

// ── Router ───────────────────────────────────────────────────
const App = {
    async init() {
        // Check URL for signing code
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            // Signer flow — anonymous session
            await startAnonSession();
            render('codeInput');
            setTimeout(() => {
                const el = document.getElementById('codeInput');
                if (el) el.value = code.toUpperCase();
            }, 100);
            return;
        }

        // Check existing session
        try {
            state.user = await account.get();
            if (state.user.email) {
                await loadUserDoc();
                render('dashboard');
            } else {
                // Anonymous session leftover — go to landing
                render('landing');
            }
        } catch {
            render('landing');
        }
    }
};

async function startAnonSession() {
    try {
        const u = await account.get();
        if (!u.email) { state.isAnon = true; return; }
    } catch {
        await account.createAnonymousSession();
        state.isAnon = true;
    }
}

async function loadUserDoc() {
    try {
        state.userDoc = await databases.getDocument(APPWRITE_DB, COL_USERS, state.user.$id);
    } catch {
        // Create user doc if not exists
        const now = new Date();
        const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        state.userDoc = await databases.createDocument(APPWRITE_DB, COL_USERS, state.user.$id, {
            userId: state.user.$id,
            email: state.user.email,
            plan: 'free',
            docsUsed: 0,
            resetDate
        });
    }
    // Reset monthly counter if needed
    if (new Date() > new Date(state.userDoc.resetDate)) {
        const resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
        state.userDoc = await databases.updateDocument(APPWRITE_DB, COL_USERS, state.user.$id, {
            docsUsed: 0,
            resetDate: resetDate.toISOString()
        });
    }
}

function canUpload() {
    if (!state.userDoc) return false;
    const plan = PLANS[state.userDoc.plan] || PLANS.free;
    return state.userDoc.docsUsed < plan.limit;
}

function docsRemaining() {
    if (!state.userDoc) return 0;
    const plan = PLANS[state.userDoc.plan] || PLANS.free;
    return Math.max(0, plan.limit - state.userDoc.docsUsed);
}

// ── Render ───────────────────────────────────────────────────
function render(view, data = {}) {
    const app = document.getElementById('app');
    const key = view.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    app.innerHTML = (Views[key] || Views.landing)(data);
    if (Events[key]) Events[key](data);
}

// ── Views ────────────────────────────────────────────────────
const Views = {
    header(opts = {}) {
        const { back, backLabel = '← Volver', backTo = 'landing' } = opts;
        const isAuth = state.user && state.user.email;
        const backBtn = back ? `<button class="btn-back" data-back="${backTo}">${backLabel}</button>` : '';
        return `
        <header class="app-header">
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="app-brand" id="brandLink">SignFlow</div>
                    <div class="d-flex align-items-center gap-3">
                        ${isAuth ? `
                        <span class="plan-badge plan-${state.userDoc?.plan || 'free'}">
                            ${PLANS[state.userDoc?.plan || 'free'].label}
                        </span>
                        <button class="btn btn-sm btn-outline-secondary" id="dashBtn">Dashboard</button>
                        <button class="btn btn-sm btn-outline-secondary" id="logoutBtn">Salir</button>
                        ` : `
                        <div class="firebase-badge">
                            <span class="firebase-status-dot" style="background:${state.isAnon ? '#C9A84C' : '#1B4332'}"></span>
                            <span>${state.isAnon ? 'Firmante' : 'Visitante'}</span>
                        </div>
                        `}
                    </div>
                </div>
            </div>
        </header>
        ${backBtn}`;
    },

    landing() {
        return `
        ${this.header()}
        <div class="landing-container">
            <div class="landing-content">
                <span class="landing-eyebrow">Firma digital · Segura · Verificable</span>
                <h1 class="landing-title">SignFlow</h1>
                <p class="landing-subtitle">Envía documentos para firma y recíbelos firmados, sin reuniones ni impresoras.</p>
                <div class="landing-cards">
                    <div class="landing-card" data-action="login">
                        <div class="landing-icon">📤</div>
                        <h3>Enviar para firma</h3>
                        <p>Inicia sesión para subir documentos y gestionar tus firmas.</p>
                        <span class="landing-card-arrow">↗</span>
                    </div>
                    <div class="landing-card" data-action="sign">
                        <div class="landing-icon">✍️</div>
                        <h3>Firmar documento</h3>
                        <p>Ingresa el código de 8 caracteres que recibiste.</p>
                        <span class="landing-card-arrow">↗</span>
                    </div>
                </div>
            </div>
        </div>`;
    },

    login() {
        return `
        ${this.header({ back: true, backTo: 'landing' })}
        <div class="view-container">
            <div class="view-content-center">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2>Iniciar sesión</h2>
                        <p class="text-muted">Accede a tu cuenta para enviar documentos</p>
                    </div>
                    <div class="auth-body">
                        <div class="form-group mb-3">
                            <label class="form-label-sf">Correo electrónico</label>
                            <input type="email" class="input-sf" id="loginEmail" placeholder="tu@email.com" autocomplete="email">
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label-sf">Contraseña</label>
                            <input type="password" class="input-sf" id="loginPassword" placeholder="••••••••" autocomplete="current-password">
                        </div>
                        <button class="btn btn-primary w-100 btn-lg" id="loginBtn">Iniciar sesión</button>
                        <div class="auth-divider">o</div>
                        <button class="btn btn-outline-secondary w-100" id="goRegisterBtn">Crear cuenta nueva</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    register() {
        return `
        ${this.header({ back: true, backTo: 'login' })}
        <div class="view-container">
            <div class="view-content-center">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2>Crear cuenta</h2>
                        <p class="text-muted">Empieza gratis con 3 documentos al mes</p>
                    </div>
                    <div class="auth-body">
                        <div class="form-group mb-3">
                            <label class="form-label-sf">Nombre completo</label>
                            <input type="text" class="input-sf" id="regName" placeholder="Juan Pérez" autocomplete="name">
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label-sf">Correo electrónico</label>
                            <input type="email" class="input-sf" id="regEmail" placeholder="tu@email.com" autocomplete="email">
                        </div>
                        <div class="form-group mb-4">
                            <label class="form-label-sf">Contraseña</label>
                            <input type="password" class="input-sf" id="regPassword" placeholder="Mínimo 8 caracteres" autocomplete="new-password">
                        </div>
                        <button class="btn btn-primary w-100 btn-lg" id="registerBtn">Crear cuenta</button>
                        <div class="auth-divider">o</div>
                        <button class="btn btn-outline-secondary w-100" id="goLoginBtn">Ya tengo cuenta</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    dashboard() {
        const plan = state.userDoc?.plan || 'free';
        const used = state.userDoc?.docsUsed || 0;
        const limit = PLANS[plan].limit;
        const pct = Math.min(100, Math.round((used / limit) * 100));
        const name = state.user?.name || state.user?.email?.split('@')[0] || 'Usuario';

        return `
        ${this.header()}
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h2>Bienvenido, ${name}</h2>
                    <p class="text-muted">Gestiona tus documentos para firma</p>
                </div>
                <button class="btn btn-primary" id="newDocBtn">+ Nuevo documento</button>
            </div>

            <div class="stats-row">
                <div class="stat-card">
                    <div class="stat-label">Plan actual</div>
                    <div class="stat-value">${PLANS[plan].label}</div>
                    ${plan === 'free' ? `<button class="btn-upgrade" id="upgradeBtn">Actualizar a Pro →</button>` : ''}
                </div>
                <div class="stat-card">
                    <div class="stat-label">Documentos este mes</div>
                    <div class="stat-value">${used} <span class="stat-limit">/ ${limit === 999 ? '∞' : limit}</span></div>
                    ${plan === 'free' ? `
                    <div class="usage-bar-wrap">
                        <div class="usage-bar" style="width:${pct}%"></div>
                    </div>` : ''}
                </div>
                <div class="stat-card">
                    <div class="stat-label">Documentos pendientes</div>
                    <div class="stat-value" id="pendingCount">—</div>
                </div>
            </div>

            <div class="docs-section">
                <div class="docs-section-header">
                    <h3>Documentos recientes</h3>
                </div>
                <div id="docsList" class="docs-list">
                    <div class="docs-loading">Cargando documentos...</div>
                </div>
            </div>
        </div>`;
    },

    upload() {
        const remaining = docsRemaining();
        return `
        ${this.header({ back: true, backLabel: '← Dashboard', backTo: 'dashboard' })}
        <div class="view-container">
            <div class="view-content">
                <div class="view-header">
                    <span class="step-badge">1</span>
                    <h2>Subir documento</h2>
                </div>
                ${remaining <= 1 && state.userDoc?.plan === 'free' ? `
                <div class="alert-sf alert-warn mb-4">
                    ⚠️ Te ${remaining === 0 ? 'quedaste sin' : 'queda 1'} documento disponible este mes.
                    <button class="btn-link ms-2" id="upgradeAlertBtn">Actualizar a Pro</button>
                </div>` : ''}
                <div class="upload-section">
                    <div class="drag-drop-area" id="dragDrop">
                        <div class="drag-drop-icon">📄</div>
                        <h4>Arrastra un PDF aquí</h4>
                        <p class="text-muted mb-3">o haz clic para seleccionar</p>
                        <p class="text-muted small mb-0">PDF · PNG · JPG — Máx. 50 MB</p>
                        <input type="file" id="fileInput" class="d-none" accept=".pdf,.png,.jpg,.jpeg">
                    </div>
                    <div class="file-info-card mt-3" id="fileInfo" style="display:none">
                        <div class="d-flex justify-content-between align-items-center">
                            <div id="fileInfoText"></div>
                            <button class="btn btn-sm btn-outline-secondary" id="clearFileBtn">Cambiar</button>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-lg w-100 mt-3" id="nextBtn" disabled>
                        Continuar → Definir zona de firma
                    </button>
                </div>
            </div>
        </div>`;
    },

    signZone() {
        return `
        ${this.header()}
        <div class="zone-layout">
            <div class="zone-pdf-panel">
                <div class="zone-toolbar">
                    <button class="btn-back mb-0" id="backBtn">← Volver</button>
                    <span class="step-badge">2</span>
                    <span class="ms-2 fw-semibold" style="font-size:.85rem">Dibuja la zona de firma</span>
                    <span class="text-muted ms-2 small d-none d-md-inline">Haz clic y arrastra sobre el PDF</span>
                    <div class="ms-auto d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-secondary" id="prevPageBtn">←</button>
                        <span class="text-muted small" id="pageInfo">1 / 1</span>
                        <button class="btn btn-sm btn-outline-secondary" id="nextPageBtn">→</button>
                    </div>
                </div>
                <div class="pdf-canvas-wrapper" id="pdfWrapper">
                    <canvas id="pdfCanvas"></canvas>
                    <canvas id="overlayCanvas"></canvas>
                </div>
            </div>
            <div class="zone-sidebar">
                <h5>Zona de firma</h5>
                <div class="zone-info" id="zoneInfo">
                    <p class="mb-0">Dibuja un rectángulo sobre el PDF para definir dónde debe firmar el destinatario.</p>
                </div>
                <div id="zonePreview" style="display:none" class="zone-preview-box">
                    <div class="text-muted small mb-2">Vista previa:</div>
                    <div class="zone-preview-rect">✍️ Firma aquí</div>
                </div>
                <button class="btn btn-outline-secondary w-100" id="clearZoneBtn" style="display:none">🗑️ Borrar zona</button>
                <div class="mt-auto pt-3">
                    <button class="btn btn-primary w-100" id="uploadBtn" disabled>Subir y generar código →</button>
                </div>
            </div>
        </div>`;
    },

    share(data) {
        const code = data.code || '--------';
        const url = `${location.origin}${location.pathname}?code=${code}`;
        return `
        ${this.header()}
        <div class="view-container">
            <div class="view-content-center">
                <div class="share-card">
                    <div class="share-icon mb-3">🎉</div>
                    <h2 class="mb-2">¡Documento listo!</h2>
                    <p class="text-muted mb-4">Comparte este código con el firmante</p>
                    <div class="code-display mb-4">${code}</div>
                    <div class="d-grid gap-2 mb-3">
                        <button class="btn btn-primary" id="copyCodeBtn">📋 Copiar código</button>
                        <button class="btn btn-outline-secondary" id="copyLinkBtn">🔗 Copiar enlace</button>
                        <button class="btn btn-success" id="whatsappBtn">💬 Compartir por WhatsApp</button>
                    </div>
                    <button class="btn btn-link" id="backDashBtn">← Volver al dashboard</button>
                </div>
            </div>
        </div>`;
    },

    codeInput() {
        return `
        ${this.header({ back: true, backTo: 'landing' })}
        <div class="view-container">
            <div class="view-content-center">
                <div class="code-input-card">
                    <div class="text-center mb-4">
                        <div class="code-icon mb-3">🔐</div>
                        <h2>Firmar Documento</h2>
                        <p class="text-muted">Ingresa el código de 8 caracteres</p>
                    </div>
                    <div class="code-input-group mb-3">
                        <input type="text" class="code-input" id="codeInput"
                            maxlength="8" placeholder="XXXXXXXX" autocomplete="off">
                        <button class="btn btn-primary btn-lg" id="submitCodeBtn">Verificar</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    signature(data) {
        return `
        ${this.header()}
        <div class="sign-layout">
            <div class="sign-pdf-panel">
                <div class="zone-toolbar">
                    <button class="btn-back mb-0" id="backBtn">← Cancelar</button>
                    <span class="fw-semibold" style="font-size:.85rem">📄 ${data.fileName || 'Documento'}</span>
                    <div class="ms-auto d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-secondary" id="prevPageBtn">←</button>
                        <span class="text-muted small" id="pageInfo">1 / 1</span>
                        <button class="btn btn-sm btn-outline-secondary" id="nextPageBtn">→</button>
                    </div>
                </div>
                <div class="pdf-canvas-wrapper" id="pdfWrapper">
                    <canvas id="pdfCanvas"></canvas>
                    <canvas id="signOverlay"></canvas>
                </div>
            </div>
            <div class="zone-sidebar">
                <h5>Tu firma</h5>
                <p class="text-muted small">Dibuja tu firma en el recuadro</p>
                <div class="signature-pad-container mb-2">
                    <canvas id="signaturePad" class="signature-pad"></canvas>
                </div>
                <button class="btn btn-outline-secondary btn-sm w-100 mb-3" id="clearSignBtn">🗑️ Limpiar</button>
                <div class="mt-auto">
                    <button class="btn btn-primary w-100 btn-lg" id="confirmSignBtn">✓ Confirmar y firmar</button>
                </div>
            </div>
        </div>`;
    },

    done(data) {
        const codeSection = data.code ? `
            <div class="signed-code-box mb-4">
                <p class="text-muted small mb-2">El emisor puede descargar el documento con este código:</p>
                <div class="code-display-sm">${data.code}</div>
            </div>` : '';
        const downloadBtn = data.downloadUrl ? `
            <a href="${data.downloadUrl}" download="documento_firmado.pdf" class="btn btn-success btn-lg w-100 mb-3">
                📥 Descargar PDF firmado
            </a>` : '';
        return `
        ${this.header()}
        <div class="view-container">
            <div class="view-content-center">
                <div class="confirmation-card text-center">
                    <div class="confirmation-icon mb-4">${data.icon || '✅'}</div>
                    <h2 class="mb-3">${data.title || '¡Completado!'}</h2>
                    <p class="text-muted mb-4">${data.message || ''}</p>
                    ${codeSection}
                    ${downloadBtn}
                    <button class="btn btn-outline-secondary w-100" id="backHomeBtn">← Volver al inicio</button>
                </div>
            </div>
        </div>`;
    },

    pricing() {
        return `
        ${this.header({ back: true, backTo: 'dashboard' })}
        <div class="view-container">
            <div class="pricing-container">
                <div class="text-center mb-5">
                    <h2>Elige tu plan</h2>
                    <p class="text-muted">Sin contratos, cancela cuando quieras</p>
                </div>
                <div class="pricing-cards">
                    <div class="pricing-card">
                        <div class="pricing-plan-name">Gratuito</div>
                        <div class="pricing-price">$0<span>/mes</span></div>
                        <ul class="pricing-features">
                            <li>✓ 3 documentos por mes</li>
                            <li>✓ Firma manuscrita digital</li>
                            <li>✓ PDF firmado descargable</li>
                            <li>✓ Código de acceso único</li>
                        </ul>
                        <button class="btn btn-outline-secondary w-100" disabled>Plan actual</button>
                    </div>
                    <div class="pricing-card pricing-card-featured">
                        <div class="pricing-badge">Recomendado</div>
                        <div class="pricing-plan-name">Pro</div>
                        <div class="pricing-price">$19<span>/mes</span></div>
                        <ul class="pricing-features">
                            <li>✓ Documentos ilimitados</li>
                            <li>✓ Firma manuscrita digital</li>
                            <li>✓ PDF firmado descargable</li>
                            <li>✓ Código de acceso único</li>
                            <li>✓ Historial completo</li>
                            <li>✓ Soporte prioritario</li>
                        </ul>
                        <button class="btn btn-primary w-100" id="buyProBtn">Actualizar a Pro</button>
                    </div>
                </div>
            </div>
        </div>`;
    }
};

// ── Events ───────────────────────────────────────────────────
const Events = {
    landing() {
        document.getElementById('brandLink').onclick = () => render('landing');
        document.querySelectorAll('.landing-card').forEach(c => {
            c.onclick = () => {
                if (c.dataset.action === 'login') render('login');
                if (c.dataset.action === 'sign') render('codeInput');
            };
        });
    },

    login() {
        setupBackBtn();
        document.getElementById('brandLink').onclick = () => render('landing');
        document.getElementById('goRegisterBtn').onclick = () => render('register');
        document.getElementById('loginBtn').onclick = doLogin;
        document.getElementById('loginPassword').onkeypress = e => { if (e.key === 'Enter') doLogin(); };
    },

    register() {
        setupBackBtn();
        document.getElementById('brandLink').onclick = () => render('landing');
        document.getElementById('goLoginBtn').onclick = () => render('login');
        document.getElementById('registerBtn').onclick = doRegister;
    },

    dashboard() {
        document.getElementById('brandLink').onclick = () => render('dashboard');
        document.getElementById('newDocBtn').onclick = () => {
            if (!canUpload()) { render('pricing'); return; }
            render('upload');
        };
        document.getElementById('logoutBtn').onclick = doLogout;
        document.getElementById('dashBtn').onclick = () => render('dashboard');
        loadDashboardDocs();
    },

    upload() {
        setupBackBtn('dashboard');
        document.getElementById('brandLink').onclick = () => render('dashboard');
        document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
        document.getElementById('dashBtn')?.addEventListener('click', () => render('dashboard'));

        const dragDrop = document.getElementById('dragDrop');
        const fileInput = document.getElementById('fileInput');
        dragDrop.onclick = () => fileInput.click();
        dragDrop.ondragover = e => { e.preventDefault(); dragDrop.classList.add('drag-over'); };
        dragDrop.ondragleave = () => dragDrop.classList.remove('drag-over');
        dragDrop.ondrop = e => {
            e.preventDefault();
            dragDrop.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        };
        fileInput.onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };
        document.getElementById('clearFileBtn').onclick = clearFile;
        document.getElementById('nextBtn').onclick = () => render('signZone');
        document.getElementById('upgradeAlertBtn')?.addEventListener('click', () => render('pricing'));
    },

    signZone() {
        document.getElementById('brandLink').onclick = () => render('dashboard');
        document.getElementById('backBtn').onclick = () => render('upload');
        document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
        document.getElementById('dashBtn')?.addEventListener('click', () => render('dashboard'));
        renderPDF('pdfCanvas', state.currentFileBytes, state.currentPage, state.pdfScale, () => {
            setupZoneDrawing();
            updatePageInfo();
        });
        document.getElementById('prevPageBtn').onclick = () => {
            if (state.currentPage > 1) { state.currentPage--; reRenderZonePage(); }
        };
        document.getElementById('nextPageBtn').onclick = () => {
            if (state.currentPage < state.totalPages) { state.currentPage++; reRenderZonePage(); }
        };
        document.getElementById('clearZoneBtn').onclick = clearZone;
        document.getElementById('uploadBtn').onclick = uploadDocument;
    },

    share(data) {
        document.getElementById('brandLink').onclick = () => render('dashboard');
        document.getElementById('backDashBtn').onclick = () => render('dashboard');
        document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
        document.getElementById('dashBtn')?.addEventListener('click', () => render('dashboard'));
        const code = data.code;
        const url = `${location.origin}${location.pathname}?code=${code}`;
        document.getElementById('copyCodeBtn').onclick = () => {
            navigator.clipboard.writeText(code);
            toast('Código copiado ✅', 'success');
        };
        document.getElementById('copyLinkBtn').onclick = () => {
            navigator.clipboard.writeText(url);
            toast('Enlace copiado ✅', 'success');
        };
        document.getElementById('whatsappBtn').onclick = () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(`Firma este documento con el código: *${code}*\n${url}`)}`, '_blank');
        };
    },

    codeInput() {
        setupBackBtn('landing');
        document.getElementById('brandLink').onclick = () => render('landing');
        const input = document.getElementById('codeInput');
        const btn = document.getElementById('submitCodeBtn');
        btn.onclick = verifyCode;
        input.onkeypress = e => { if (e.key === 'Enter') verifyCode(); };
        input.focus();
    },

    signature(data) {
        document.getElementById('brandLink').onclick = () => render('landing');
        document.getElementById('backBtn').onclick = () => render('landing');
        renderPDF('pdfCanvas', state.currentFileBytes, state.currentPage, state.pdfScale, () => {
            drawSignZoneOverlay();
            updatePageInfo();
        });
        document.getElementById('prevPageBtn').onclick = () => {
            if (state.currentPage > 1) { state.currentPage--; reRenderSignPage(); }
        };
        document.getElementById('nextPageBtn').onclick = () => {
            if (state.currentPage < state.totalPages) { state.currentPage++; reRenderSignPage(); }
        };
        setupSignaturePad();
        document.getElementById('clearSignBtn').onclick = () => {
            const c = document.getElementById('signaturePad');
            const r = c.getBoundingClientRect();
            c.getContext('2d').clearRect(0, 0, r.width, r.height);
        };
        document.getElementById('confirmSignBtn').onclick = saveSignature;
    },

    done() {
        document.getElementById('brandLink').onclick = () => render('landing');
        document.getElementById('backHomeBtn').onclick = () => {
            state.isAnon ? render('landing') : render('dashboard');
        };
    },

    pricing() {
        setupBackBtn('dashboard');
        document.getElementById('brandLink').onclick = () => render('dashboard');
        document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
        document.getElementById('dashBtn')?.addEventListener('click', () => render('dashboard'));
        document.getElementById('buyProBtn').onclick = () => {
            toast('Integración de pagos próximamente 🚀', 'info');
        };
    }
};

// ── Auth ─────────────────────────────────────────────────────
async function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPassword').value;
    if (!email || !pass) { toast('Completa todos los campos', 'error'); return; }
    showLoading('Iniciando sesión...');
    try {
        await account.createEmailPasswordSession(email, pass);
        state.user = await account.get();
        await loadUserDoc();
        hideLoading();
        render('dashboard');
    } catch(e) {
        hideLoading();
        toast('Credenciales incorrectas', 'error');
    }
}

async function doRegister() {
    const name  = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass  = document.getElementById('regPassword').value;
    if (!name || !email || !pass) { toast('Completa todos los campos', 'error'); return; }
    if (pass.length < 8) { toast('La contraseña debe tener al menos 8 caracteres', 'error'); return; }
    showLoading('Creando cuenta...');
    try {
        await account.create(Appwrite.ID.unique(), email, pass, name);
        await account.createEmailPasswordSession(email, pass);
        state.user = await account.get();
        await loadUserDoc();
        hideLoading();
        toast('¡Cuenta creada! Bienvenido 🎉', 'success');
        render('dashboard');
    } catch(e) {
        hideLoading();
        toast(e.message || 'Error al crear cuenta', 'error');
    }
}

async function doLogout() {
    showLoading('Cerrando sesión...');
    try {
        await account.deleteSession('current');
    } catch {}
    state.user = null;
    state.userDoc = null;
    state.isAnon = false;
    hideLoading();
    render('landing');
}

// ── Dashboard docs ───────────────────────────────────────────
async function loadDashboardDocs() {
    try {
        const res = await databases.listDocuments(APPWRITE_DB, COL_DOCS, [
            Appwrite.Query.equal('ownerId', state.user.$id),
            Appwrite.Query.orderDesc('$createdAt'),
            Appwrite.Query.limit(20)
        ]);
        const list = document.getElementById('docsList');
        const pending = res.documents.filter(d => d.status === 'pending').length;
        const pendingEl = document.getElementById('pendingCount');
        if (pendingEl) pendingEl.textContent = pending;

        if (res.documents.length === 0) {
            list.innerHTML = `<div class="docs-empty">
                <p class="text-muted">Aún no tienes documentos. <button class="btn-link" id="firstDocBtn">Sube el primero →</button></p>
            </div>`;
            document.getElementById('firstDocBtn')?.addEventListener('click', () => render('upload'));
            return;
        }

        list.innerHTML = res.documents.map(doc => `
            <div class="doc-row" data-code="${doc.code}">
                <div class="doc-icon">📄</div>
                <div class="doc-info">
                    <div class="doc-name">${doc.fileName}</div>
                    <div class="doc-meta">Código: <strong>${doc.code}</strong> · ${new Date(doc.$createdAt).toLocaleDateString()}</div>
                </div>
                <div class="doc-status status-${doc.status}">
                    ${doc.status === 'signed' ? '✅ Firmado' : '⏳ Pendiente'}
                </div>
                <div class="doc-actions">
                    ${doc.status === 'signed' && doc.signedFileId ? `
                    <button class="btn btn-sm btn-outline-secondary" data-download="${doc.signedFileId}">📥</button>` : `
                    <button class="btn btn-sm btn-outline-secondary" data-copy="${doc.code}">📋</button>`}
                </div>
            </div>
        `).join('');

        // Events for doc rows
        list.querySelectorAll('[data-download]').forEach(btn => {
            btn.onclick = async () => {
                const fileId = btn.dataset.download;
                const url = storage.getFileDownload(APPWRITE_BUCKET, fileId);
                window.open(url, '_blank');
            };
        });
        list.querySelectorAll('[data-copy]').forEach(btn => {
            btn.onclick = () => {
                const code = btn.dataset.copy;
                const url = `${location.origin}${location.pathname}?code=${code}`;
                navigator.clipboard.writeText(url);
                toast('Enlace copiado ✅', 'success');
            };
        });
    } catch(e) {
        console.error(e);
        document.getElementById('docsList').innerHTML = `<div class="docs-empty"><p class="text-muted">Error cargando documentos</p></div>`;
    }
}

// ── File handling ────────────────────────────────────────────
function handleFile(file) {
    if (file.size > 50 * 1024 * 1024) { toast('Máximo 50 MB', 'error'); return; }
    state.currentFile = file;
    state.currentPage = 1;
    state.signZone = null;
    const reader = new FileReader();
    reader.onload = e => { state.currentFileBytes = e.target.result; };
    reader.readAsArrayBuffer(file);
    document.getElementById('fileInfoText').innerHTML =
        `<strong>${file.name}</strong><br><small class="text-muted">${(file.size/1024).toFixed(1)} KB</small>`;
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('nextBtn').disabled = false;
}

function clearFile() {
    state.currentFile = null;
    state.currentFileBytes = null;
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('nextBtn').disabled = true;
}

// ── PDF rendering ────────────────────────────────────────────
async function renderPDF(canvasId, arrayBuffer, pageNum, scale, callback) {
    if (!arrayBuffer) return;
    try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
        state.pdfDoc = pdf;
        state.totalPages = pdf.numPages;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.getElementById(canvasId);
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const overlay = document.getElementById('overlayCanvas') || document.getElementById('signOverlay');
        if (overlay) { overlay.width = viewport.width; overlay.height = viewport.height; }
        if (callback) callback();
    } catch(e) {
        console.error(e);
        toast('Error al renderizar el PDF', 'error');
    }
}

function updatePageInfo() {
    const el = document.getElementById('pageInfo');
    if (el) el.textContent = `${state.currentPage} / ${state.totalPages}`;
}

function reRenderZonePage() {
    renderPDF('pdfCanvas', state.currentFileBytes, state.currentPage, state.pdfScale, () => {
        setupZoneDrawing();
        updatePageInfo();
        if (state.signZone?.page === state.currentPage) drawZoneRect(state.signZone);
    });
}

function reRenderSignPage() {
    renderPDF('pdfCanvas', state.currentFileBytes, state.currentPage, state.pdfScale, () => {
        drawSignZoneOverlay();
        updatePageInfo();
    });
}

// ── Zone drawing ─────────────────────────────────────────────
function setupZoneDrawing() {
    const overlay = document.getElementById('overlayCanvas');
    if (!overlay) return;
    let drawing = false, startX, startY;

    overlay.onmousedown = e => {
        const r = overlay.getBoundingClientRect();
        startX = e.clientX - r.left; startY = e.clientY - r.top;
        drawing = true; state.signZone = null;
    };
    overlay.onmousemove = e => {
        if (!drawing) return;
        const r = overlay.getBoundingClientRect();
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        drawRect(ctx, startX, startY, e.clientX - r.left - startX, e.clientY - r.top - startY);
    };
    overlay.onmouseup = e => {
        if (!drawing) return; drawing = false;
        const r = overlay.getBoundingClientRect();
        const ex = e.clientX - r.left, ey = e.clientY - r.top;
        const x = Math.min(startX, ex), y = Math.min(startY, ey);
        const w = Math.abs(ex - startX), h = Math.abs(ey - startY);
        if (w < 20 || h < 10) { toast('Zona muy pequeña', 'warning'); return; }
        state.signZone = { x, y, w, h, page: state.currentPage, scale: state.pdfScale };
        showZoneConfirmed();
    };
    overlay.ontouchstart = e => {
        e.preventDefault();
        const r = overlay.getBoundingClientRect();
        startX = e.touches[0].clientX - r.left; startY = e.touches[0].clientY - r.top;
        drawing = true;
    };
    overlay.ontouchmove = e => {
        e.preventDefault();
        if (!drawing) return;
        const r = overlay.getBoundingClientRect();
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        drawRect(ctx, startX, startY, e.touches[0].clientX - r.left - startX, e.touches[0].clientY - r.top - startY);
    };
    overlay.ontouchend = e => {
        e.preventDefault(); if (!drawing) return; drawing = false;
        const r = overlay.getBoundingClientRect();
        const ex = e.changedTouches[0].clientX - r.left, ey = e.changedTouches[0].clientY - r.top;
        const x = Math.min(startX, ex), y = Math.min(startY, ey);
        const w = Math.abs(ex - startX), h = Math.abs(ey - startY);
        if (w < 20 || h < 10) return;
        state.signZone = { x, y, w, h, page: state.currentPage, scale: state.pdfScale };
        showZoneConfirmed();
    };
}

function drawRect(ctx, x, y, w, h) {
    ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
    ctx.fillStyle = 'rgba(27,67,50,.12)';
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(27,67,50,.85)';
    ctx.font = 'bold 12px DM Sans, sans-serif';
    ctx.fillText('✍️ Zona de firma', x + 8, y + 18);
}

function drawZoneRect(zone) {
    const overlay = document.getElementById('overlayCanvas');
    if (!overlay || !zone) return;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    drawRect(ctx, zone.x, zone.y, zone.w, zone.h);
}

function showZoneConfirmed() {
    document.getElementById('zoneInfo').innerHTML = `<p class="mb-0 text-success">✅ Zona definida en página ${state.signZone.page}</p>`;
    document.getElementById('zonePreview').style.display = 'block';
    document.getElementById('clearZoneBtn').style.display = 'block';
    document.getElementById('uploadBtn').disabled = false;
    drawZoneRect(state.signZone);
}

function clearZone() {
    state.signZone = null;
    const overlay = document.getElementById('overlayCanvas');
    if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
    document.getElementById('zoneInfo').innerHTML = `<p class="mb-0">Dibuja un rectángulo sobre el PDF para definir dónde debe firmar el destinatario.</p>`;
    document.getElementById('zonePreview').style.display = 'none';
    document.getElementById('clearZoneBtn').style.display = 'none';
    document.getElementById('uploadBtn').disabled = true;
}

function drawSignZoneOverlay() {
    const overlay = document.getElementById('signOverlay');
    if (!overlay || !state.currentDocData?.signZone) return;
    const zone = state.currentDocData.signZone;
    if (zone.page !== state.currentPage) return;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
    ctx.fillStyle = 'rgba(27,67,50,.08)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.fillStyle = 'rgba(27,67,50,.8)';
    ctx.font = 'bold 12px DM Sans, sans-serif';
    ctx.fillText('✍️ Firma aquí', zone.x + 8, zone.y + 18);
}

// ── Signature pad ────────────────────────────────────────────
function setupSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    const ctx = canvas.getContext('2d');
    function syncSize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1.8;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    syncSize();
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    }
    let drawing = false, points = [];
    function startDraw(e) { e.preventDefault(); drawing = true; points = [getPos(e)]; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); }
    function draw(e) {
        e.preventDefault(); if (!drawing) return;
        const pos = getPos(e); points.push(pos);
        if (points.length < 3) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); return; }
        const p1 = points[points.length - 2], p2 = points[points.length - 1];
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, mx, my); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx, my);
    }
    function stopDraw(e) {
        if (e) e.preventDefault();
        if (drawing && points.length > 0) { const l = points[points.length-1]; ctx.lineTo(l.x, l.y); ctx.stroke(); }
        drawing = false; points = [];
    }
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw, { passive: false });
}

// ── Upload document ──────────────────────────────────────────
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

async function uploadDocument() {
    if (!state.currentFile || !state.signZone) return;
    if (!canUpload()) { render('pricing'); return; }
    showLoading('Subiendo documento...');
    try {
        const code = generateCode();
        const uploaded = await storage.createFile(APPWRITE_BUCKET, Appwrite.ID.unique(), state.currentFile);
        await databases.createDocument(APPWRITE_DB, COL_DOCS, code, {
            fileName: state.currentFile.name,
            fileSize: state.currentFile.size,
            fileType: state.currentFile.type,
            fileId: uploaded.$id,
            code,
            ownerId: state.user.$id,
            status: 'pending',
            signZoneX: state.signZone.x, signZoneY: state.signZone.y,
            signZoneW: state.signZone.w, signZoneH: state.signZone.h,
            signZonePage: state.signZone.page, signZoneScale: state.signZone.scale,
            signatureData: null, signedFileId: null, signedAt: null
        });
        // Increment usage counter
        await databases.updateDocument(APPWRITE_DB, COL_USERS, state.user.$id, {
            docsUsed: (state.userDoc.docsUsed || 0) + 1
        });
        state.userDoc.docsUsed = (state.userDoc.docsUsed || 0) + 1;
        state.currentDocCode = code;
        hideLoading();
        render('share', { code });
    } catch(e) {
        hideLoading();
        console.error(e);
        toast('Error al subir: ' + e.message, 'error');
    }
}

// ── Verify code ──────────────────────────────────────────────
async function verifyCode() {
    const code = document.getElementById('codeInput').value.trim().toUpperCase();
    if (code.length !== 8) { toast('El código debe tener 8 caracteres', 'error'); return; }
    showLoading('Buscando documento...');
    try {
        const doc = await databases.getDocument(APPWRITE_DB, COL_DOCS, code);
        if (doc.status === 'signed') {
            if (doc.signedFileId) {
                showLoading('Descargando documento firmado...');
                const url = storage.getFileDownload(APPWRITE_BUCKET, doc.signedFileId);
                const res = await fetch(url);
                const blob = await res.blob();
                hideLoading();
                render('done', {
                    icon: '📄', title: 'Documento ya firmado',
                    message: `Firmado el ${new Date(doc.signedAt).toLocaleString()}`,
                    downloadUrl: URL.createObjectURL(blob)
                });
            } else {
                hideLoading();
                toast('Este documento ya fue firmado', 'warning');
            }
            return;
        }
        const fileUrl = storage.getFileDownload(APPWRITE_BUCKET, doc.fileId);
        const response = await fetch(fileUrl);
        state.currentFileBytes = (await response.arrayBuffer()).slice(0);
        state.currentPage = 1;
        state.currentDocCode = code;
        state.currentDocData = { ...doc, signZone: { x: doc.signZoneX, y: doc.signZoneY, w: doc.signZoneW, h: doc.signZoneH, page: doc.signZonePage, scale: doc.signZoneScale } };
        hideLoading();
        toast('Documento encontrado ✅', 'success');
        setTimeout(() => render('signature', { fileName: doc.fileName }), 400);
    } catch(e) {
        hideLoading();
        if (e.code === 404) toast('Código no encontrado', 'error');
        else toast('Error: ' + e.message, 'error');
    }
}

// ── Save signature ───────────────────────────────────────────
function extractSignatureTransparent(src) {
    const tmp = document.createElement('canvas');
    tmp.width = src.width; tmp.height = src.height;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, tmp.width, tmp.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const b = (d[i] + d[i+1] + d[i+2]) / 3;
        if (b > 200) { d[i+3] = 0; }
        else { const a = Math.min(255, Math.round((1 - b/255)*255*1.4)); d[i]=0; d[i+1]=0; d[i+2]=0; d[i+3]=a; }
    }
    ctx.putImageData(img, 0, 0);
    return tmp.toDataURL('image/png');
}

async function saveSignature() {
    const sigCanvas = document.getElementById('signaturePad');
    const blank = document.createElement('canvas');
    blank.width = sigCanvas.width; blank.height = sigCanvas.height;
    if (sigCanvas.toDataURL() === blank.toDataURL()) { toast('Por favor dibuja tu firma primero', 'error'); return; }
    showLoading('Aplicando firma al documento...');
    try {
        const zone = state.currentDocData.signZone;
        const pdfDoc = await PDFLib.PDFDocument.load(state.currentFileBytes.slice(0));
        const page = pdfDoc.getPages()[zone.page - 1];
        const { width: pdfW, height: pdfH } = page.getSize();
        const pdfCanvas = document.getElementById('pdfCanvas');
        const scaleX = pdfW / pdfCanvas.width;
        const scaleY = pdfH / pdfCanvas.height;
        const pdfX = zone.x * scaleX;
        const pdfY = pdfH - (zone.y + zone.h) * scaleY;
        const sigDataUrl = extractSignatureTransparent(sigCanvas);
        const sigBytes = Uint8Array.from(atob(sigDataUrl.split(',')[1]), c => c.charCodeAt(0));
        const sigImage = await pdfDoc.embedPng(sigBytes);
        page.drawImage(sigImage, { x: pdfX, y: pdfY, width: zone.w * scaleX, height: zone.h * scaleY });
        const signedBlob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
        const signedFile = new File([signedBlob], `signed_${state.currentDocData.fileName}`, { type: 'application/pdf' });
        const uploaded = await storage.createFile(APPWRITE_BUCKET, Appwrite.ID.unique(), signedFile);
        await databases.updateDocument(APPWRITE_DB, COL_DOCS, state.currentDocCode, {
            status: 'signed', signedFileId: uploaded.$id, signedAt: new Date().toISOString()
        });
        hideLoading();
        render('done', {
            icon: '✅', title: '¡Documento firmado!',
            message: 'Tu firma ha sido aplicada y guardada en la nube.',
            downloadUrl: URL.createObjectURL(signedBlob),
            code: state.currentDocCode
        });
    } catch(e) {
        hideLoading();
        console.error(e);
        toast('Error al firmar: ' + e.message, 'error');
    }
}

// ── Helpers ──────────────────────────────────────────────────
function setupBackBtn(defaultTo = 'landing') {
    const btn = document.getElementById('backBtn');
    if (btn) btn.onclick = () => render(btn.dataset.back || defaultTo);
    document.querySelectorAll('[data-back]').forEach(b => {
        b.onclick = () => render(b.dataset.back);
    });
}

function showLoading(text = 'Cargando...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}
function hideLoading() { document.getElementById('loadingOverlay').style.display = 'none'; }

function toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    c.appendChild(el);
    setTimeout(() => { el.style.animation = 'slideOut .3s ease-in forwards'; setTimeout(() => el.remove(), 300); }, 3500);
}

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
