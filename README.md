# SignFlow

**Firma digital de documentos, sin reuniones ni impresoras.**

SignFlow es una aplicación web que permite enviar documentos para firma remota y recibirlos firmados en tiempo real. El emisor define la zona exacta donde debe ir la firma, comparte un código de 8 caracteres, y el firmante accede, dibuja su firma y el PDF firmado queda disponible para ambas partes.

---

## Demo

🔗 [signflow-eight.vercel.app](https://signflow-eight.vercel.app)

---

## Flujo de uso

```
Emisor                          Firmante
  │                                │
  ├─ Sube el documento PDF         │
  ├─ Define la zona de firma       │
  ├─ Obtiene código XXXXXXXX ──────┤
  │                                ├─ Ingresa el código
  │                                ├─ Ve el PDF con zona marcada
  │                                ├─ Dibuja su firma
  │                                └─ Confirma → PDF firmado en la nube
  │
  └─ Ingresa el mismo código → Descarga el PDF firmado
```

---

## Características

- **Zona de firma precisa** — el emisor dibuja un rectángulo sobre el PDF indicando exactamente dónde debe firmar el destinatario
- **Firma manuscrita digital** — canvas de alta resolución con soporte para mouse y pantallas táctiles
- **PDF firmado real** — la firma se incrusta en el PDF usando pdf-lib, con fondo transparente
- **Acceso compartido** — ambas partes pueden descargar el documento firmado usando el mismo código
- **Sin registro** — funciona con sesiones anónimas, sin necesidad de crear cuenta
- **Almacenamiento en la nube** — documentos y firmas guardados en Appwrite Storage y Firestore

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML · CSS · JavaScript vanilla (SPA) |
| Renderizado PDF | [PDF.js](https://mozilla.github.io/pdf.js/) v3.11 |
| Edición PDF | [pdf-lib](https://pdf-lib.js.org/) v1.17 |
| Base de datos | [Appwrite](https://appwrite.io) Cloud (Firestore) |
| Almacenamiento | Appwrite Storage |
| Autenticación | Appwrite Anonymous Sessions |
| Deploy | [Vercel](https://vercel.com) |

---

## Estructura del proyecto

```
signflow/
├── index.html      # Shell HTML — solo contiene el div#app y los scripts
├── app.js          # Lógica completa: router, vistas, eventos, Appwrite
├── style.css       # Design system completo con tokens CSS
├── vercel.json     # Configuración de rutas para Vercel
└── README.md
```

---

## Configuración de Appwrite

### Colección `documents`

| Campo | Tipo | Tamaño |
|-------|------|--------|
| `fileName` | String | 255 |
| `fileSize` | Integer | — |
| `fileType` | String | 100 |
| `fileId` | String | 36 |
| `code` | String | 8 |
| `status` | String | 20 |
| `signZoneX` | Float | — |
| `signZoneY` | Float | — |
| `signZoneW` | Float | — |
| `signZoneH` | Float | — |
| `signZonePage` | Integer | — |
| `signZoneScale` | Float | — |
| `signatureData` | String | 500000 |
| `signedFileId` | String | 36 |
| `signedAt` | String | 50 |

### Permisos requeridos

**Colección `documents`:** `Any` → Create, Read, Update

**Bucket de Storage:** `Any` → Create, Read

---

## Correr localmente

No requiere build ni dependencias de Node. Solo un servidor HTTP estático:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Luego abre `http://localhost:8000`.

---

## Variables de configuración

Las credenciales de Appwrite están definidas directamente en `app.js`:

```js
const APPWRITE_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT  = 'tu-project-id';
const APPWRITE_DB       = 'tu-database-id';
const APPWRITE_COL      = 'documents';
const APPWRITE_BUCKET   = 'tu-bucket-id';
```

> La API key de Appwrite es pública por diseño. La seguridad real está en las reglas de permisos de la colección y el bucket.

---

## Limitaciones del plan gratuito de Appwrite

| Recurso | Límite gratuito |
|---------|----------------|
| Storage | 2 GB |
| Tamaño por archivo | 50 MB |
| DB Reads | 500K / mes |
| DB Writes | 250K / mes |
| Proyectos | 2 |

Suficiente para cientos de documentos mensuales sin costo.

---

## Roadmap

- [ ] Múltiples zonas de firma por documento
- [ ] Notificación por email al emisor cuando se firma
- [ ] Historial de documentos por sesión
- [ ] Soporte para imágenes (PNG/JPG) además de PDF
- [ ] Verificación de integridad del documento firmado

---

## Licencia

MIT
