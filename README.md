# Gestor de Transporte Escolar

Sistema completo de gestión para transporte escolar privado con soporte multi-organización, diseñado para facilitar la administración de representantes, estudiantes, docentes y transacciones financieras.

## 🚀 Características Principales

### Gestión y Administración
- **Multi-Organización**: Soporte para múltiples administradores gestionando sus propios transportes
- **Dashboard Intuitivo**: Panel de control con estadísticas en tiempo real, gráficos y métricas clave
- **Gestión de Representantes**: Sistema completo con códigos únicos (REP-XXXXX) para identificación
- **Gestión de Estudiantes**: Registro de niños con tarifas personalizables y asignación a representantes
- **Gestión de Docentes**: Registro de docentes con códigos únicos (DOC-XXXXX) que actúan como sus propios representantes
- **Sistema de Transacciones**: Registro completo de pagos y cargos con historial detallado
- **Generación de Recibos PDF**: Recibos profesionales con toda la información relevante

### Características Avanzadas
- **Conversión de Moneda en Tiempo Real**: Integración automática con API del BCV para conversión USD ↔ Bs.F
- **Visualización de Fecha de Tasa**: Muestra la fecha de actualización de la tasa BCV (DD/MM)
- **Soporte Offline (PWA)**: Acceso a datos guardados sin conexión a internet
- **Tema Claro/Oscuro**: Interfaz adaptable con colores optimizados para ambos modos
- **Acceso para Representantes**: Portal independiente donde los representantes pueden consultar su información con solo su código
- **Actualización Automática**: Sistema de cron jobs para actualización semanal automática de deudas
- **Progressive Web App (PWA)**: Instalable en dispositivos móviles como aplicación nativa

### Mejoras de UX/UI
- **Colores Adaptativos**: Color vinotinto en modo claro, blanco en modo oscuro para mejor visibilidad
- **Dashboard Optimizado**: Layout mejorado sin secciones duplicadas
- **Indicador de Estado Offline**: Banner visual cuando no hay conexión a internet
- **Botón Flotante BCV**: Visualización elegante de la tasa del día con fecha
- **Cards Interactivas**: Efectos hover y transiciones suaves

## 🛠️ Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Estilos modernos y responsivos
- **Supabase** - Backend como servicio (Base de datos y autenticación)
- **Recharts** - Gráficos interactivos
- **jsPDF** - Generación de documentos PDF
- **DolarAPI** - Integración para tasas de cambio
- **IndexedDB** - Almacenamiento local para soporte offline
- **next-pwa** - Progressive Web App con service workers

## 📋 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Supabase
- Base de datos configurada (ver sección de Base de Datos)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Transporte
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
CRON_SECRET=tu_secreto_para_cron
```

### 4. Configurar base de datos

Ejecutar la migración SQL en Supabase:

```sql
-- Ver archivo migrations/add_code_to_passengers.sql
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
Transporte/
├── app/
│   ├── api/                    # API Routes
│   │   ├── cron/               # Cron jobs para actualizaciones automáticas
│   │   └── public/             # Endpoints públicos
│   ├── auth/                   # Autenticación de administradores
│   ├── dashboard/              # Panel de administración
│   └── representante/          # Portal para representantes
├── components/
│   ├── ui/                     # Componentes UI reutilizables
│   ├── debt-chart.tsx          # Gráfico de deudas
│   ├── top-debtors.tsx         # Lista de mayores deudores
│   └── offline-indicator.tsx   # Indicador de modo offline
├── lib/
│   ├── supabase/               # Clientes de Supabase
│   ├── offline/                # Almacenamiento offline (IndexedDB)
│   ├── currency.ts             # Conversión de moneda con caché
│   ├── pdf-generator.ts        # Generación de PDFs
│   └── utils.ts                # Utilidades generales
├── hooks/
│   └── useOnlineStatus.ts      # Hook para detectar estado online/offline
├── migrations/                 # Migraciones SQL
└── public/
    ├── manifest.json           # Configuración PWA
    └── sw.js                   # Service Worker (generado automáticamente)
```

## 🎯 Uso

### Para Administradores

1. **Iniciar Sesión**: Acceder con email y contraseña en `/auth/login`
2. **Configuración Inicial**: Configurar nombre del transporte, tarifa general y preferencias en **Ajustes**
3. **Gestionar Representantes**: Crear y administrar representantes con códigos únicos
4. **Registrar Estudiantes**: Asignar niños a representantes con tarifas personalizables
5. **Registrar Docentes**: Gestionar docentes (actúan como sus propios representantes)
6. **Registrar Pagos**: Registrar pagos y generar recibos PDF
7. **Monitorear Dashboard**: Visualizar estadísticas, gráficos y representantes con mayor deuda

### Para Representantes

1. **Acceder**: Ir a `/representante/login`
2. **Ingresar Código**: Usar el código único asignado (formato REP-XXXXX)
3. **Consultar Información**: Ver deuda actual, niños registrados e historial de transacciones
4. **Descargar Recibo**: Generar y descargar recibo PDF con toda la información

### Modo Offline

La aplicación funciona sin conexión a internet:
- **Datos Guardados**: Visualiza información previamente cargada
- **Tasa BCV**: Muestra la última tasa guardada con su fecha
- **Indicador Visual**: Banner amarillo indica cuando estás offline
- **Sincronización Automática**: Los datos se actualizan al reconectar

> **Nota**: El modo offline es solo lectura. No puedes crear o editar datos sin conexión.

## 📊 API Pública

### Consultar Representante por Código

```http
GET /api/public/representative/[code]
```

**Ejemplo:**
```bash
curl https://tu-dominio.com/api/public/representative/REP-12345
```

**Respuesta:**
```json
{
  "representative": {
    "id": "...",
    "alias": "...",
    "code": "REP-12345",
    "phone": "...",
    "address": "..."
  },
  "transportName": "...",
  "passengers": [...],
  "debt": {
    "current": 100,
    "currentBSF": 22755.67,
    "dollarRate": 227.5567
  },
  "transactions": [...]
}
```

## ⏰ Cron Jobs

### Actualización Semanal Automática

El sistema incluye un endpoint para actualizar automáticamente las deudas semanales cada viernes a las 6:00 AM.

**Mejoras Implementadas:**
- ✅ Soporte para docentes sin representante
- ✅ Concepto de transacción incluye fecha
- ✅ Rollback automático en caso de error
- ✅ Logs detallados en el dashboard

#### Configuración en Vercel

1. Ir a **Settings** > **Cron Jobs**
2. Agregar nuevo cron job:
   - **Path**: `/api/cron/weekly-charge`
   - **Schedule**: `0 6 * * 5` (viernes a las 6am UTC)
   - **Method**: POST
   - **Headers**: 
     ```
     Authorization: Bearer [CRON_SECRET]
     ```

#### Ejecución Manual

```bash
curl -X POST https://tu-dominio.com/api/cron/weekly-charge \
  -H "Authorization: Bearer [CRON_SECRET]"
```

#### Verificación

Los logs del CRON aparecen en la sección "Últimos logs del CRON" del dashboard.

## 💱 Conversión de Moneda

El sistema utiliza la API de [DolarAPI](https://ve.dolarapi.com/v1/dolares/oficial) para obtener la tasa de cambio oficial del BCV.

**Características:**
- Las tarifas se configuran en USD
- La conversión a Bs.F se muestra automáticamente en todas las secciones
- La tasa se actualiza automáticamente cada hora
- **Caché inteligente**: Guarda la tasa en IndexedDB para uso offline
- **Visualización de fecha**: Muestra cuándo se actualizó la tasa (DD/MM)
- Se muestra en el header y en un botón flotante elegante

**Ubicaciones de la tasa:**
- Header del dashboard (esquina superior derecha)
- Botón flotante (esquina inferior derecha)
- Ambos muestran la fecha de actualización

## 🎨 Personalización

### Color Principal

El sistema usa un color vinotinto que se adapta según el tema:
- **Modo Claro**: `#660000` (vinotinto)
- **Modo Oscuro**: `#ffffff` (blanco) para mejor visibilidad

Se puede modificar en:
- `app/dashboard/page.tsx`: Variables `ACCENT_LIGHT` y `ACCENT_DARK`
- `tailwind.config.ts`: Configuración de colores de Tailwind
- `app/globals.css`: Variables CSS personalizadas

## 📱 Progressive Web App (PWA)

La aplicación puede instalarse como app nativa en dispositivos móviles.

### Instalación en Móvil

1. Abrir la app en el navegador móvil
2. Buscar opción "Agregar a pantalla de inicio" o "Instalar app"
3. Seguir las instrucciones del navegador
4. La app aparecerá como ícono en tu dispositivo

### Características PWA

- ✅ Funciona offline (modo lectura)
- ✅ Instalable en iOS y Android
- ✅ Ícono personalizado
- ✅ Pantalla de inicio sin barra del navegador
- ✅ Caché inteligente de recursos

> **Nota**: El PWA está deshabilitado en desarrollo. Para probarlo, construir en modo producción o desplegar a Vercel.

## 🗄️ Base de Datos

El esquema de la base de datos está diseñado para Supabase e incluye:

- **organizations**: Gestión multi-tenant
- **representatives**: Con códigos únicos y información de contacto
- **passengers**: Estudiantes y docentes con tarifas personalizables
  - Los docentes tienen `representante_id` NULL (son sus propios representantes)
  - Los niños requieren un `representante_id`
- **transactions**: Historial completo de cargos y pagos
  - Usa `representante_id` o `passenger.id` para docentes
- **app_config**: Ajustes por organización
- **cron_logs**: Registro de ejecuciones del CRON job

Ejecutar la migración `migrations/add_code_to_passengers.sql` para agregar el campo `code` a la tabla `passengers`.

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conectar el repositorio a Vercel
2. Configurar variables de entorno en el dashboard de Vercel
3. Configurar cron jobs (ver sección de Cron Jobs)
4. Desplegar

### Variables de Entorno Requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

### Configuración PWA en Producción

El archivo `vercel.json` ya incluye la configuración para el CRON job. El service worker se genera automáticamente en producción.

## 📝 Scripts Disponibles

```bash
# Desarrollo (PWA deshabilitado)
npm run dev

# Construcción para producción
npm run build

# Iniciar servidor de producción (con PWA)
npm start

# Linting
npm run lint
```

## 🆕 Cambios Recientes

### Dashboard Mejorado
- ✅ Color vinotinto visible en modo oscuro (cambia a blanco)
- ✅ Eliminada sección duplicada de deuda
- ✅ Layout optimizado (2 columnas en sección media)
- ✅ Botón flotante BCV con gradiente y fecha
- ✅ Cards con efectos hover y bordes redondeados

### CRON Job Corregido
- ✅ Soporte para docentes sin representante
- ✅ Fecha incluida en concepto de transacción
- ✅ Logs mejorados en dashboard

### Soporte Offline
- ✅ IndexedDB para caché local
- ✅ Indicador visual de modo offline
- ✅ Tasa BCV guardada con fecha
- ✅ Fallback automático a datos guardados

## 🤝 Contribuir

Este es un proyecto privado. Para contribuciones, contactar al administrador del repositorio.

## 📄 Licencia

Este proyecto es privado y propietario.

## 🔒 Seguridad

- Las credenciales nunca deben subirse al repositorio
- Usar variables de entorno para toda la información sensible
- El `CRON_SECRET` debe ser único y seguro
- Las rutas de administración están protegidas con autenticación
- Los datos offline se almacenan localmente en el dispositivo del usuario

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

Desarrollado con ❤️ para facilitar la gestión de transporte escolar
