# SignFlow v2.0 - Angular 21

**Firma digital de documentos, sin reuniones ni impresoras.**

Nueva versión reescrita en Angular 21 con standalone components, signals, Bootstrap 5 y diseño moderno.

## 🚀 Características

- **Angular 21** - Framework moderno con standalone components
- **Bootstrap 5** - UI responsive y moderna
- **Múltiples firmantes** - Asigna diferentes zonas de firma a cada firmante
- **Múltiples zonas de firma** - Define varias áreas de firma en un mismo documento
- **Firma tipográfica** - Además de manuscrita, genera firmas con fuentes elegantes
- **PayPal** - Integración de pagos para plan Pro ($19/mes)
- **Hash SHA-256** - Verificación de integridad del documento
- **Audit trail** - Registro de todas las acciones (apertura, firma, descarga)
- **Notificaciones** - Email al emisor cuando se firma el documento
- **Appwrite** - Backend serverless con autenticación, base de datos y storage

## 📦 Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (standalone components) |
| UI | Bootstrap 5 + CSS3 |
| PDF Render | PDF.js 3.11 |
| PDF Edición | pdf-lib 1.17 |
| Backend | Appwrite Cloud |
| Pagos | PayPal SDK |
| Deploy | Vercel |

## 🛠️ Instalación

```bash
# Navegar al directorio
cd signflow-ng

# Instalar dependencias
npm install

# Configurar variables de entorno en src/app/core/services/appwrite.service.ts
const APPWRITE_CONFIG = {
  endpoint: 'https://sfo.cloud.appwrite.io/v1',
  project: 'TU_PROJECT_ID',
  database: 'TU_DATABASE_ID',
  bucket: 'TU_BUCKET_ID'
};

# Ejecutar en desarrollo
ng serve

# Build para producción
ng build --configuration production
```

## 📋 Configuración de Appwrite

### Colecciones necesarias:

**users**:
- userId (string)
- email (string)
- name (string)
- plan (enum: free, pro)
- docsUsed (integer)
- resetDate (datetime)
- paypalSubscriptionId (string, optional)

**documents**:
- fileName (string)
- fileSize (integer)
- fileType (string)
- fileId (string)
- docCode (string, 8 chars)
- ownerId (string)
- status (enum: pending, partial, signed)
- signZones (json)
- originalHash (string)
- signedFileId (string, optional)
- signedAt (datetime, optional)

**signers**:
- docId (string)
- signerName (string)
- signerEmail (string)
- zoneIndex (integer)
- code (string, 8 chars)
- status (enum: pending, signed)
- signatureData (string, optional)
- signedFileId (string, optional)
- signedAt (datetime, optional)

### Permisos:
- **users**: Authenticated → Create, Read, Update
- **documents**: Authenticated → Create, Read; Any → Read (by code)
- **signers**: Any → Create, Read, Update
- **Storage bucket**: Any → Create, Read

## 💳 PayPal

1. Crear cuenta de negocio en [PayPal Developer](https://developer.paypal.com/)
2. Crear una app y obtener el Client ID
3. Crear un plan de suscripción
4. Actualizar el Client ID en `src/index.html`:
```html
<script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD&intent=subscription&vault=true"></script>
```

## 🚀 Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📝 Cambios desde v1.0

- ✅ Reescrita completamente en Angular 21
- ✅ Standalone components (sin NgModules)
- ✅ Signals para estado reactivo
- ✅ Lazy loading de rutas
- ✅ Guards de autenticación
- ✅ Múltiples firmantes por documento
- ✅ Múltiples zonas de firma
- ✅ Firma tipográfica con fuentes elegantes
- ✅ PayPal en vez de Stripe
- ✅ Hash SHA-256 para integridad
- ✅ Audit trail completo
- ✅ Diseño moderno con Bootstrap 5

## 📄 Licencia

MIT
