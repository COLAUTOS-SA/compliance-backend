# Compliance Backend

API backend para el sistema de debida diligencia y cumplimiento SAGRILAF de COLAUTOS. Expone servicios REST para usuarios, roles, contrapartes, solicitudes, archivos, conceptos, accionistas, segmentos e integracion con Adobe Sign.

## Tecnologia principal

- Node.js
- Express
- MySQL, mediante `mysql2/promise`
- Multer para manejo de archivos
- Adobe Sign API para acuerdos y webhooks
- Dotenv para configuracion local

## Requisitos

- Node.js 18 o superior recomendado
- npm
- Base de datos MySQL accesible desde el entorno de ejecucion
- Credenciales y plantillas de Adobe Sign si se usaran los flujos de firma
- Acceso a la ruta de almacenamiento configurada para archivos

## Instalacion

```bash
npm install
```

Para desarrollo:

```bash
npm run dev
```

Para ejecucion normal:

```bash
npm start
```

Por defecto la API escucha en el puerto `3001`, salvo que se defina `PORT`.

## Configuracion de entorno

Este proyecto usa variables de entorno cargadas por `dotenv`. Los archivos `.env`, `.env.*` y `.env.example` estan ignorados por Git porque pueden contener credenciales, rutas internas o datos sensibles. Cree el archivo de entorno localmente segun el ambiente donde se ejecute.

Variables principales:

```env
PORT=3001
API_PREFIX_FALLBACK=true

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=compliance
DB_PORT=3306

STORAGE_PATH=C:\ruta\segura\uploads\adobe
STORAGE_URL=/uploads/adobe

SMB_HOST=
SMB_USER=
SMB_PASS=

ADOBE_CLIENT_ID=
ADOBE_SIGN_CLIENT_ID=
ADOBE_CLIENT_SECRET=
ADOBE_REFRESH_TOKEN=
ADOBE_OAUTH_SCOPE=agreement_read:account agreement_write:account webhook_read:account webhook_write:account
ADOBE_OAUTH_BASE_URL=https://api.na1.adobesign.com/oauth/v2
ADOBE_API_BASE_URL=https://api.na1.adobesign.com/api/rest/v6
ADOBE_REDIRECT_URL=
ADOBE_WEBHOOKS_SECRET=
ADOBE_WEBHOOK_SECRET=

ADOBE_TEMPLATE_PROVEEDOR=
ADOBE_TEMPLATE_CLIENTE=
ADOBE_TEMPLATE_ACCIONISTA=
ADOBE_TEMPLATE_EMPLEADO=
ADOBE_TEMPLATE_DEFAULT=
```

Notas:

- `API_PREFIX_FALLBACK=true` permite que las rutas funcionen tambien sin `/api`, util para proxies que recortan el prefijo antes de llegar a Node.
- `STORAGE_PATH` define la ruta fisica de archivos generados o recibidos desde Adobe Sign.
- `STORAGE_URL` define la URL publica desde la cual se sirven esos archivos.
- Las variables de Adobe Sign solo son obligatorias para los flujos de firma, plantillas y webhooks.

## Estructura del proyecto

```text
src/
  app.js                  Punto de entrada de Express
  config/db.js            Pool de conexion a MySQL
  routes/                 Definicion de rutas HTTP
  controllers/            Logica de entrada/salida por recurso
  models/                 Consultas y acceso a datos
  services/               Servicios externos y almacenamiento
sql/                      Scripts SQL de soporte
```

## Rutas principales

Todas las rutas se montan bajo `/api`.

- `GET /api/` estado basico de la API
- `GET /db-health` prueba de conexion a base de datos
- `/api/usuarios`
- `/api/roles`
- `/api/tipos-contraparte`
- `/api/contrapartes`
- `/api/solicitudes`
- `/api/archivos`
- `/api/estado-archivo`
- `/api/conceptos`
- `/api/accionistas`
- `/api/segmentos`
- `/api/adobe`
- `/api/files`

Los archivos de Adobe se sirven desde:

```text
/uploads/adobe
```

## Base de datos

La conexion se configura en `src/config/db.js` con un pool de MySQL. Los scripts disponibles en `sql/` contienen cambios o estructuras de apoyo para funcionalidades especificas, como acuerdos de Adobe y respuestas de archivo.

Antes de levantar el servicio:

1. Cree o seleccione la base de datos de cumplimiento.
2. Ejecute los scripts SQL necesarios para el ambiente.
3. Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_PORT`.
4. Valide la conexion con `GET /db-health`.

## Integracion Adobe Sign

La integracion vive principalmente en:

- `src/services/adobeSignService.js`
- `src/routes/adobeRoutes.js`
- `src/models/adobeAgreementModel.js`

El backend permite trabajar con plantillas por segmento o tipo de contraparte, almacenar informacion de acuerdos y procesar callbacks/webhooks. Para produccion, valide que las URLs publicas, secretos de webhook y rutas de almacenamiento esten alineadas con la configuracion de Adobe Sign.

## Buenas practicas de seguridad

- No subir archivos `.env`, `.env.*` ni `.env.example`.
- No registrar tokens, secretos ni credenciales en commits.
- Mantener `STORAGE_PATH` fuera de carpetas publicas si contiene documentos sensibles.
- Revisar permisos de red y base de datos por ambiente.
- Rotar credenciales si accidentalmente fueron expuestas.

## Despliegue

Checklist recomendado:

1. Instalar dependencias con `npm ci`.
2. Definir variables de entorno en el servidor o servicio de despliegue.
3. Ejecutar migraciones o scripts SQL requeridos.
4. Verificar `GET /db-health`.
5. Configurar proxy reverso hacia el puerto del proceso Node.
6. Confirmar que `/api/` responde correctamente desde el dominio publico.

## Comandos utiles

```bash
npm install
npm run dev
npm start
```
