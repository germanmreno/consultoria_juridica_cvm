# AGENTS.md — Registro Jurídico de Alianzas Mineras (CVM)

## Contexto
Sistema interno para registrar alianzas mineras y sus 33+ documentos de
evaluación de contingencia, con indexación página a página de PDFs y
exportación de recortes por tipo de documento.

## Stack obligatorio (NO cambiar)
- JavaScript puro (PROHIBIDO TypeScript).
- client/: Vite + React 18 + Mantine v7 + Tailwind v3 (preflight desactivado).
- server/: Node + Express 4 + Prisma ORM (@prisma/client).
- PostgreSQL local. PROHIBIDO Docker.
- Fuente Georama (@fontsource/georama).
- Paleta: azul #1F3A6E, verde #7AB317, amarillo #F2A900.

## Puertos (fijos)
- Backend: 3022
- Frontend: 3025
- La app se sirve bajo la ruta base /consultoria/ (tanto frontend como API).
- Vite: base='/consultoria/', BrowserRouter basename='/consultoria'.
- Proxy en dev: /consultoria/api → http://localhost:3022 (con rewrite del prefijo).
- CORS solo admite https://cvm.com.ve en producción.

## Comandos
- Instalar todo: `npm run install:all`
- Inicializar DB: `npm run db:init` (requiere DATABASE_URL en server/.env)
- Desarrollo: `npm run dev` (client :3025, server :3022)
- Verificar client: `cd client && npm run build`
- Verificar server: `node --check` en archivos modificados

## Reglas de código
- SQL solo via Prisma (schema.prisma + migraciones). NUNCA modificar la DB a mano.
- Toda modificación de esquema: editar prisma/schema.prisma + nueva migración.
- Una sola instancia de PrismaClient (src/prisma.js); importar desde ahí.
- Toda ruta (salvo /api/auth/login) pasa por middleware verifyJWT; mutaciones de
  document-types y users exigen requireRole('ADMIN').
- Los tipos de documento viven en la tabla document_types (semilla: 33 requisitos);
  nuevos requisitos se agregan como filas, NUNCA hardcodeados en el frontend.
- Validar en rutas: 1 <= pageFrom <= pageTo <= file.pageCount antes de crear índices.
- Uploads: solo application/pdf, máx 200 MB, guardar en server/uploads/ con nombre uuid.
- Componentes UI con Mantine; Tailwind solo para layout/espaciado.
- Textos de UI en español. Cambios mínimos y mantenibles.
- No commitear .env, uploads/ ni migration_lock.toml fuera de prisma/migrations.

## Roles
- ADMIN: acceso total (CRUD alianzas, usuarios, tipos de documento, subida e indexación).
- OPERADOR: puede crear/editar alianzas, subir PDFs e indexar. No puede gestionar usuarios.
- VISUALIZADOR: solo lectura. Ve alianzas, requisitos y documentos indexados.
  No ve botones de crear/editar/subir/indexar. El frontend oculta toda UI de
  escritura. El backend rechaza mutaciones vía verifyJWT + requireRole.

## API
- /api/*, respuestas JSON { data } o { error }.
- Estados de requisito: "pendiente" | "cargado" (derivado de existencia de índices).
