// ==================== SIGNFLOW ====================
const APPWRITE_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT  = '69ed2bd70024539b431a';
const APPWRITE_DB       = '69ed2dbb00235dbf613f';
const APPWRITE_COL      = 'documents';
const APPWRITE_BUCKET   = '69ed3b5800208f4433f2';

const client    = new Appwrite.Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
const databases = new Appwrite.Databases(client);
const storage   = new Appwrite.Storage(client);
const account   = new Appwrite.Account(client);

// ==================== STATE ====================
const state = {
    connected: false,
    currentFile: null,
    currentFileBytes: null,   // ArrayBuffer del PDF
    pdfDoc: null,             // pdf.js document
    currentPage: 1,
    totalPages: 1,
    pdfScale: 1.5,
    signZone: null,           // { x, y, w, h } en coordenadas del canvas
    isDrawingZone: false,
    zoneStart: null,
    currentDocCode: null,
    currentDocData: null      // datos del documento al firmar
};

// ==================== APPWRITE INIT ====================
async function initAppwrite() {
    try {
        await account.get();
    } catch {
        await account.createAnonymousSession();
    }
    state.connected = true;
    console.log('✅ Appwrite conectado');
}

// ==================== ROUTER ====================
const App = {
    async init() {
        try { await initAppwrite(); } catch(e) { console.error(e); }

        // Verificar si hay código en la URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            this.render('code-input');
            setTimeout(() => {
                const input = document.getElementById('codeInput');
                if (input) { input.value = code.toUpperCase(); }
            }, 100);
        } else {
            this.render('landing');
        }
    },

    render(view, data = {}) {
        const app = document.getElementById('app');
        // Convertir kebab-case a camelCase para buscar en Views/Events
        const key = view.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        app.innerHTML = Views[key] ? Views[key](data) : Views.landing();
        if (Events[key]) Events[key](data);
    }
};

// ==================== VIEWS ====================
const Views = {
    header(backBtn = null) {
        const ok = state.connected;
        const back = backBtn ? `<button class="btn-back" id="backBtn">${backBtn}</button>` : '';
        return `
        <header class="app-header">
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="app-brand" id="brandLink">SignFlow</div>
                    <div class="firebase-badge" style="border-color:${ok?'#10B981':'#EF4444'}">
                        <span class="firebase-status-dot" style="background:${ok?'#10B981':'#EF4444'}"></span>
                        <span>${ok?'Conectado':'Sin conexión'}</span>
                    </div>
                </div>
            </div>
        </header>
        ${back}`;
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
                    <div class="landing-card" data-action="sender">
                        <div class="landing-icon">📤</div>
                        <h3>Enviar para firma</h3>
                        <p>Sube el documento, define la zona y comparte el código.</p>
                        <span class="landing-card-arrow">↗</span>
                    </div>
                    <div class="landing-card" data-action="signer">
                        <div class="landing-icon">✍️</div>
                        <h3>Firmar documento</h3>
                        <p>Ingresa el código de 8 caracteres y firma al instante.</p>
                        <span class="landing-card-arrow">↗</span>
                    </div>
                </div>
            </div>
        </div>`;
    },

    upload() {
        return `
        ${this.header('← Volver')}
        <div class="view-container">
            <div class="view-content">
                <div class="view-header">
                    <span class="step-badge">1</span>
                    <h2>Subir documento</h2>
                </div>
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
                    <span class="ms-2 fw-semibold">Dibuja la zona de firma</span>
                    <span class="text-muted ms-3 small d-none d-md-inline">Haz clic y arrastra sobre el PDF</span>
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
                <h5 class="mb-3">Zona de firma</h5>
                <div class="zone-info" id="zoneInfo">
                    <p class="text-muted small">Dibuja un rectángulo sobre el PDF para definir dónde debe firmar el destinatario.</p>
                </div>
                <div id="zonePreview" style="display:none" class="zone-preview-box mb-3">
                    <div class="text-muted small mb-1">Vista previa:</div>
                    <div class="zone-preview-rect">✍️ Firma aquí</div>
                </div>
                <button class="btn btn-outline-secondary w-100 mb-2" id="clearZoneBtn" style="display:none">
                    🗑️ Borrar zona
                </button>
                <button class="btn btn-primary w-100" id="uploadBtn" disabled>
                    Subir y generar código →
                </button>
            </div>
        </div>`;
    },

    share(data) {
        const code = data.code || '--------';
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
                    <button class="btn btn-link text-muted" id="backHomeBtn">← Volver al inicio</button>
                </div>
            </div>
        </div>`;
    },

    codeInput() {
        return `
        ${this.header('← Volver')}
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
                    <span class="fw-semibold">📄 ${data.fileName || 'Documento'}</span>
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
                <h5 class="mb-1">Tu firma</h5>
                <p class="text-muted small mb-3">Dibuja tu firma en el recuadro</p>
                <div class="signature-pad-container mb-2">
                    <canvas id="signaturePad" class="signature-pad"></canvas>
                </div>
                <div class="d-flex gap-2 mb-3">
                    <button class="btn btn-outline-secondary btn-sm flex-grow-1" id="clearSignBtn">🗑️ Limpiar</button>
                </div>
                <button class="btn btn-primary w-100 btn-lg" id="confirmSignBtn">
                    ✓ Confirmar y firmar
                </button>
            </div>
        </div>`;
    },

    done(data) {
        const downloadBtn = data.downloadUrl ? `
            <a href="${data.downloadUrl}" download="documento_firmado.pdf" class="btn btn-success btn-lg w-100 mb-3">
                📥 Descargar PDF firmado
            </a>` : '';
        const codeSection = data.code ? `
            <div class="signed-code-box mb-3">
                <p class="text-muted small mb-1">El emisor puede descargar el documento firmado con este código:</p>
                <div class="code-display-sm">${data.code}</div>
            </div>` : '';
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
    }
};

// ==================== EVENTS ====================
const Events = {
    landing() {
        document.getElementById('brandLink').onclick = () => App.render('landing');
        document.querySelectorAll('.landing-card').forEach(c => {
            c.onclick = () => {
                if (c.dataset.action === 'sender') App.render('upload');
                if (c.dataset.action === 'signer') App.render('code-input');
            };
        });
    },

    upload() {
        document.getElementById('brandLink').onclick = () => App.render('landing');
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => App.render('landing');

        const dragDrop = document.getElementById('dragDrop');
        const fileInput = document.getElementById('fileInput');

        dragDrop.onclick = () => fileInput.click();
        dragDrop.ondragover = (e) => { e.preventDefault(); dragDrop.classList.add('drag-over'); };
        dragDrop.ondragleave = () => dragDrop.classList.remove('drag-over');
        dragDrop.ondrop = (e) => {
            e.preventDefault();
            dragDrop.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
        };
        fileInput.onchange = (e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); };

        document.getElementById('clearFileBtn').onclick = clearFile;
        document.getElementById('nextBtn').onclick = () => App.render('signZone');
    },

    signZone() {
        document.getElementById('brandLink').onclick = () => App.render('landing');
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => App.render('upload');

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
        document.getElementById('brandLink').onclick = () => App.render('landing');
        document.getElementById('backHomeBtn').onclick = () => App.render('landing');
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
        document.getElementById('brandLink').onclick = () => App.render('landing');
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => App.render('landing');
        const input = document.getElementById('codeInput');
        const btn = document.getElementById('submitCodeBtn');
        const submit = () => verifyCode();
        btn.onclick = submit;
        input.onkeypress = (e) => { if (e.key === 'Enter') submit(); };
        input.focus();
    },

    signature(data) {
        document.getElementById('brandLink').onclick = () => App.render('landing');
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => App.render('landing');

        // Renderizar PDF con zona marcada
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
            const canvas = document.getElementById('signaturePad');
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        };
        document.getElementById('confirmSignBtn').onclick = () => saveSignature();
    },

    done() {
        document.getElementById('brandLink').onclick = () => App.render('landing');
        const backBtn = document.getElementById('backHomeBtn');
        if (backBtn) backBtn.onclick = () => App.render('landing');
    }
};

// ==================== FILE HANDLING ====================
function handleFileSelect(file) {
    if (file.size > 50 * 1024 * 1024) { toast('Máximo 50 MB', 'error'); return; }
    state.currentFile = file;
    state.currentPage = 1;
    state.signZone = null;

    const reader = new FileReader();
    reader.onload = (e) => {
        state.currentFileBytes = e.target.result;
    };
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

// ==================== PDF RENDERING ====================
async function renderPDF(canvasId, arrayBuffer, pageNum, scale, callback) {
    if (!arrayBuffer) return;
    try {
        // Usar una copia para no consumir el buffer original
        const pdfData = new Uint8Array(arrayBuffer.slice(0));
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        state.pdfDoc = pdf;
        state.totalPages = pdf.numPages;

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.getElementById(canvasId);
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        // Ajustar overlay canvas al mismo tamaño
        const overlay = document.getElementById('overlayCanvas') || document.getElementById('signOverlay');
        if (overlay) {
            overlay.width = viewport.width;
            overlay.height = viewport.height;
        }

        if (callback) callback();
    } catch(e) {
        console.error('Error renderizando PDF:', e);
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
        if (state.signZone && state.signZone.page === state.currentPage) {
            drawZoneRect(state.signZone);
        }
    });
}

function reRenderSignPage() {
    renderPDF('pdfCanvas', state.currentFileBytes, state.currentPage, state.pdfScale, () => {
        drawSignZoneOverlay();
        updatePageInfo();
    });
}

// ==================== ZONE DRAWING ====================
function setupZoneDrawing() {
    const overlay = document.getElementById('overlayCanvas');
    if (!overlay) return;

    let drawing = false, startX, startY;

    overlay.onmousedown = (e) => {
        const r = overlay.getBoundingClientRect();
        startX = e.clientX - r.left;
        startY = e.clientY - r.top;
        drawing = true;
        state.signZone = null;
    };

    overlay.onmousemove = (e) => {
        if (!drawing) return;
        const r = overlay.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        drawRect(ctx, startX, startY, x - startX, y - startY);
    };

    overlay.onmouseup = (e) => {
        if (!drawing) return;
        drawing = false;
        const r = overlay.getBoundingClientRect();
        const endX = e.clientX - r.left;
        const endY = e.clientY - r.top;

        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const w = Math.abs(endX - startX);
        const h = Math.abs(endY - startY);

        if (w < 20 || h < 10) { toast('Zona muy pequeña, dibuja un área más grande', 'warning'); return; }

        state.signZone = { x, y, w, h, page: state.currentPage, scale: state.pdfScale };
        showZoneConfirmed();
    };

    // Touch support
    overlay.ontouchstart = (e) => {
        e.preventDefault();
        const r = overlay.getBoundingClientRect();
        startX = e.touches[0].clientX - r.left;
        startY = e.touches[0].clientY - r.top;
        drawing = true;
    };
    overlay.ontouchmove = (e) => {
        e.preventDefault();
        if (!drawing) return;
        const r = overlay.getBoundingClientRect();
        const x = e.touches[0].clientX - r.left;
        const y = e.touches[0].clientY - r.top;
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        drawRect(ctx, startX, startY, x - startX, y - startY);
    };
    overlay.ontouchend = (e) => {
        e.preventDefault();
        if (!drawing) return;
        drawing = false;
        const r = overlay.getBoundingClientRect();
        const endX = e.changedTouches[0].clientX - r.left;
        const endY = e.changedTouches[0].clientY - r.top;
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const w = Math.abs(endX - startX);
        const h = Math.abs(endY - startY);
        if (w < 20 || h < 10) return;
        state.signZone = { x, y, w, h, page: state.currentPage, scale: state.pdfScale };
        showZoneConfirmed();
    };
}

function drawRect(ctx, x, y, w, h) {
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = 'rgba(124, 58, 237, 0.9)';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText('✍️ Zona de firma', x + 8, y + 20);
}

function drawZoneRect(zone) {
    const overlay = document.getElementById('overlayCanvas');
    if (!overlay || !zone) return;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    drawRect(ctx, zone.x, zone.y, zone.w, zone.h);
}

function showZoneConfirmed() {
    console.log('✅ Zona confirmada:', state.signZone);
    document.getElementById('zoneInfo').innerHTML =
        `<p class="text-success small">✅ Zona definida en página ${state.signZone.page}</p>`;
    document.getElementById('zonePreview').style.display = 'block';
    document.getElementById('clearZoneBtn').style.display = 'block';
    document.getElementById('uploadBtn').disabled = false;
    drawZoneRect(state.signZone);
}

function clearZone() {
    state.signZone = null;
    const overlay = document.getElementById('overlayCanvas');
    if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
    document.getElementById('zoneInfo').innerHTML =
        `<p class="text-muted small">Dibuja un rectángulo sobre el PDF para definir dónde debe firmar el destinatario.</p>`;
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

    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);

    ctx.fillStyle = 'rgba(124, 58, 237, 0.85)';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText('✍️ Firma aquí', zone.x + 8, zone.y + 20);
}

// ==================== SIGNATURE PAD ====================
function setupSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    const ctx = canvas.getContext('2d');

    // Sincronizar resolución interna con tamaño visual real
    function syncCanvasSize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth   = 1.8;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.globalCompositeOperation = 'source-over';
    }

    syncCanvasSize();

    // Obtener coordenadas correctas relativas al canvas
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    let drawing = false;
    let points = [];

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        points = [getPos(e)];
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
    }

    function draw(e) {
        e.preventDefault();
        if (!drawing) return;
        const pos = getPos(e);
        points.push(pos);

        if (points.length < 3) {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            return;
        }

        // Curva suavizada con punto medio
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX, midY);
    }

    function stopDraw(e) {
        if (e) e.preventDefault();
        if (drawing && points.length > 0) {
            const last = points[points.length - 1];
            ctx.lineTo(last.x, last.y);
            ctx.stroke();
        }
        drawing = false;
        points = [];
    }

    // Mouse
    canvas.addEventListener('mousedown',  startDraw);
    canvas.addEventListener('mousemove',  draw);
    canvas.addEventListener('mouseup',    stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    // Touch
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove',  draw,      { passive: false });
    canvas.addEventListener('touchend',   stopDraw,  { passive: false });

    // Limpiar
    document.getElementById('clearSignBtn').onclick = () => {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
    };

    // Re-sincronizar si cambia el tamaño de ventana
    window.addEventListener('resize', syncCanvasSize, { once: true });
}

// ==================== UPLOAD DOCUMENT ====================
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function uploadDocument() {
    if (!state.currentFile || !state.signZone) {
        console.log('❌ Falta archivo o zona:', { file: !!state.currentFile, zone: !!state.signZone });
        return;
    }
    console.log('📤 Iniciando subida...');
    showLoading('Subiendo documento...');

    try {
        const code = generateCode();

        // Subir archivo a Appwrite Storage
        const uploaded = await storage.createFile(
            APPWRITE_BUCKET,
            Appwrite.ID.unique(),
            state.currentFile
        );

        // Guardar en Appwrite Database con la zona de firma
        await databases.createDocument(APPWRITE_DB, APPWRITE_COL, code, {
            fileName: state.currentFile.name,
            fileSize: state.currentFile.size,
            fileType: state.currentFile.type,
            fileId: uploaded.$id,
            code: code,
            status: 'pending',
            signZoneX: state.signZone.x,
            signZoneY: state.signZone.y,
            signZoneW: state.signZone.w,
            signZoneH: state.signZone.h,
            signZonePage: state.signZone.page,
            signZoneScale: state.signZone.scale,
            signatureData: null,
            signedAt: null
        });

        state.currentDocCode = code;
        hideLoading();
        App.render('share', { code });

    } catch(e) {
        hideLoading();
        console.error(e);
        toast('Error al subir: ' + e.message, 'error');
    }
}

// ==================== VERIFY CODE ====================
async function verifyCode() {
    const code = document.getElementById('codeInput').value.trim().toUpperCase();
    if (code.length !== 8) { toast('El código debe tener 8 caracteres', 'error'); return; }

    showLoading('Buscando documento...');
    try {
        const doc = await databases.getDocument(APPWRITE_DB, APPWRITE_COL, code);
        hideLoading();

        if (doc.status === 'signed') {
            // Si ya está firmado, ofrecer descarga del documento firmado
            if (doc.signedFileId) {
                showLoading('Descargando documento firmado...');
                try {
                    const signedUrl = storage.getFileDownload(APPWRITE_BUCKET, doc.signedFileId);
                    const res = await fetch(signedUrl);
                    const blob = await res.blob();
                    const localUrl = URL.createObjectURL(blob);
                    hideLoading();
                    App.render('done', {
                        icon: '📄',
                        title: 'Documento ya firmado',
                        message: `Firmado el ${new Date(doc.signedAt).toLocaleString()}`,
                        downloadUrl: localUrl
                    });
                } catch(e) {
                    hideLoading();
                    toast('Error al obtener el documento firmado', 'error');
                }
            } else {
                toast('Este documento ya fue firmado', 'warning');
            }
            return;
        }

        // Descargar el archivo desde Storage
        showLoading('Cargando documento...');
        const fileUrl = storage.getFileDownload(APPWRITE_BUCKET, doc.fileId);
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();

        // Guardar una copia del buffer para poder reutilizarlo
        state.currentFileBytes = arrayBuffer.slice(0);
        state.currentPage = 1;
        state.currentDocCode = code;
        state.currentDocData = {
            ...doc,
            signZone: {
                x: doc.signZoneX,
                y: doc.signZoneY,
                w: doc.signZoneW,
                h: doc.signZoneH,
                page: doc.signZonePage,
                scale: doc.signZoneScale
            }
        };

        hideLoading();
        toast('Documento encontrado ✅', 'success');
        setTimeout(() => App.render('signature', { fileName: doc.fileName }), 400);

    } catch(e) {
        hideLoading();
        if (e.code === 404) toast('Código no encontrado', 'error');
        else toast('Error: ' + e.message, 'error');
    }
}

// ==================== SAVE SIGNATURE ====================
// Extrae la firma con fondo transparente y trazos en negro puro
function extractSignatureTransparent(sourceCanvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;

    const tmp = document.createElement('canvas');
    tmp.width  = w;
    tmp.height = h;
    const ctx = tmp.getContext('2d');

    // Copiar el canvas original
    ctx.drawImage(sourceCanvas, 0, 0);

    // Recorrer pixels: hacer blanco → transparente, oscuro → negro puro
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r + g + b) / 3;

        if (brightness > 200) {
            // Pixel claro → transparente
            data[i+3] = 0;
        } else {
            // Pixel oscuro → negro puro con opacidad proporcional
            const alpha = Math.min(255, Math.round((1 - brightness / 255) * 255 * 1.4));
            data[i]   = 0;
            data[i+1] = 0;
            data[i+2] = 0;
            data[i+3] = alpha;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return tmp.toDataURL('image/png');
}

async function saveSignature() {
    const sigCanvas = document.getElementById('signaturePad');

    // Verificar que hay firma
    const blank = document.createElement('canvas');
    blank.width = sigCanvas.width; blank.height = sigCanvas.height;
    if (sigCanvas.toDataURL() === blank.toDataURL()) {
        toast('Por favor dibuja tu firma primero', 'error');
        return;
    }
    showLoading('Aplicando firma al documento...');

    try {
        const zone = state.currentDocData.signZone;
        const scale = zone.scale || 1.5;

        // Cargar PDF con pdf-lib (slice para no consumir el buffer original)
        const pdfBytes = state.currentFileBytes.slice(0);
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const page = pages[zone.page - 1];
        const { width: pdfW, height: pdfH } = page.getSize();

        // Convertir coordenadas de canvas a coordenadas PDF
        const scaleX = pdfW / (document.getElementById('pdfCanvas').width);
        const scaleY = pdfH / (document.getElementById('pdfCanvas').height);

        const pdfX = zone.x * scaleX;
        const pdfY = pdfH - (zone.y + zone.h) * scaleY; // PDF tiene Y invertido
        const pdfZoneW = zone.w * scaleX;
        const pdfZoneH = zone.h * scaleY;

        // Extraer firma con fondo transparente
        const sigDataUrl = extractSignatureTransparent(sigCanvas);
        const sigBase64 = sigDataUrl.split(',')[1];
        const sigBytes = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0));
        const sigImage = await pdfDoc.embedPng(sigBytes);

        // Dibujar firma en la zona definida
        page.drawImage(sigImage, {
            x: pdfX,
            y: pdfY,
            width: pdfZoneW,
            height: pdfZoneH
        });

        // Guardar PDF firmado
        const signedPdfBytes = await pdfDoc.save();
        const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
        const signedUrl = URL.createObjectURL(signedBlob);

        // Guardar PDF firmado en Appwrite Storage
        const signedFile = new File([signedBlob], `signed_${state.currentDocData.fileName}`, { type: 'application/pdf' });
        const uploadedSigned = await storage.createFile(APPWRITE_BUCKET, Appwrite.ID.unique(), signedFile);
        const signedDownloadUrl = storage.getFileDownload(APPWRITE_BUCKET, uploadedSigned.$id);

        // Actualizar documento en Appwrite con referencia al PDF firmado
        await databases.updateDocument(APPWRITE_DB, APPWRITE_COL, state.currentDocCode, {
            status: 'signed',
            signatureData: sigCanvas.toDataURL('image/png'),
            signedFileId: uploadedSigned.$id,
            signedAt: new Date().toISOString()
        });

        hideLoading();

        // Ofrecer descarga inmediata al firmante y mostrar código para que el emisor descargue
        App.render('done', {
            icon: '✅',
            title: '¡Documento firmado!',
            message: `El documento ha sido firmado y guardado en la nube. La persona que envió el documento puede descargarlo usando el código <strong>${state.currentDocCode}</strong>.`,
            downloadUrl: URL.createObjectURL(signedBlob),
            code: state.currentDocCode
        });

    } catch(e) {
        hideLoading();
        console.error(e);
        toast('Error al firmar: ' + e.message, 'error');
    }
}

// ==================== UTILS ====================
function showLoading(text = 'Cargando...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
function toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    c.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
