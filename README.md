# Gestor de Transporte Escolar

Sistema completo de gestión para transporte escolar privado con soporte multi-organización, diseñado para facilitar la administración de representantes, estudiantes, docentes y transacciones financieras.

## 🚀 Características Principales

- **Multi-Organización**: Soporte para múltiples administradores gestionando sus propios transportes
- **Dashboard Intuitivo**: Panel de control con estadísticas en tiempo real, gráficos y métricas clave
- **Gestión Completa**: Representantes, estudiantes y docentes con códigos únicos
- **Sistema de Transacciones**: Registro de pagos y cargos con historial detallado
- **Recibos PDF**: Generación automática de recibos profesionales
- **Conversión de Moneda**: Integración con API del BCV para USD ↔ Bs.F
- **CRON Jobs**: Actualización automática de deudas semanales
- **PWA**: Instalable como app nativa en dispositivos móviles
- **Modo Offline**: Visualización de datos guardados sin conexión
- **Tema Claro/Oscuro**: Interfaz adaptable con colores optimizados

## 🛠️ Tecnologías

- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase (Base de datos y autenticación)
- Recharts (Gráficos)
- jsPDF (Generación de PDFs)
- IndexedDB (Almacenamiento offline)
- next-pwa (Progressive Web App)

## 🔧 Instalación

### 1. Clonar e instalar

```bash
git clone <repository-url>
cd Transporte
npm install
```

### 2. Configurar variables de entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
CRON_SECRET=tu_secreto_para_cron
```

### 3. Configurar base de datos

Ejecutar las migraciones SQL en Supabase (ver carpeta `migrations/`)

### 4. Iniciar

```bash
npm run dev
```

Aplicación disponible en [http://localhost:3000](http://localhost:3000)

## 🎯 Uso

### Para Administradores

1. Iniciar sesión en `/auth/login`
2. Configurar transporte en **Ajustes**
3. Gestionar representantes, estudiantes y docentes
4. Registrar pagos y generar recibos
5. Monitorear estadísticas en el dashboard

### Para Representantes

1. Acceder en `/representante/login`
2. Ingresar código único (REP-XXXXX)
3. Consultar deuda e historial
4. Descargar recibos PDF

### Modo Offline

- Visualiza datos previamente cargados
- Muestra última tasa BCV guardada con fecha
- Banner indica estado offline
- Solo lectura (no permite crear/editar)

## 📊 API Pública

### Consultar Representante

```http
GET /api/public/representative/[code]
```

Retorna información del representante, pasajeros, deuda y transacciones.

## ⏰ CRON Job

Actualización automática de deudas cada viernes a las 6:00 AM UTC.

### Configuración en Vercel

1. **Settings** > **Cron Jobs**
2. Path: `/api/cron/weekly-charge`
3. Schedule: `0 6 * * 5`
4. Method: POST
5. Header: `Authorization: Bearer [CRON_SECRET]`

Los logs aparecen en el dashboard.

## 💱 Conversión de Moneda

- Integración con [DolarAPI](https://ve.dolarapi.com/v1/dolares/oficial)
- Actualización automática cada hora
- Caché offline con IndexedDB
- Visualización de fecha de actualización

## 📱 Progressive Web App

Instalable en dispositivos móviles:
- Funciona offline (modo lectura)
- Ícono personalizado
- Sin barra del navegador

> **Nota**: PWA deshabilitado en desarrollo. Usar `npm run build && npm start` para probar.

## 🗄️ Base de Datos

Esquema Supabase:
- **organizations**: Multi-tenant
- **representatives**: Códigos únicos
- **passengers**: Estudiantes y docentes
- **transactions**: Historial de pagos/cargos
- **app_config**: Configuración por organización
- **cron_logs**: Logs de ejecuciones automáticas

## 🚢 Despliegue

### Vercel

1. Conectar repositorio
2. Configurar variables de entorno
3. Configurar CRON job
4. Desplegar

## 📝 Scripts

```bash
npm run dev    # Desarrollo
npm run build  # Producción
npm start      # Servidor producción
npm run lint   # Linting
```

## 🎨 Personalización

Color principal vinotinto (`#660000`) adaptativo:
- Modo claro: vinotinto
- Modo oscuro: blanco

Modificar en `tailwind.config.ts` y `app/globals.css`

---

**Desarrollado con ❤️ por [Angel Lizarzado](https://github.com/Angel-Lizarzado)** · 2025
