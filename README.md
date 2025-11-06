# Gestor de Transporte Escolar

Sistema completo de gestión para transporte escolar privado con soporte multi-organización, diseñado para facilitar la administración de representantes, estudiantes, docentes y transacciones financieras.

## 🚀 Características Principales

- **Gestión Multi-Organización**: Soporte para múltiples administradores gestionando sus propios transportes
- **Dashboard Intuitivo**: Panel de control con estadísticas en tiempo real, gráficos y métricas clave
- **Gestión de Representantes**: Sistema completo con códigos únicos (REP-XXXXX) para identificación
- **Gestión de Estudiantes**: Registro de niños con tarifas personalizables y asignación a representantes
- **Gestión de Docentes**: Registro de docentes con códigos únicos (DOC-XXXXX)
- **Sistema de Transacciones**: Registro completo de pagos y cargos con historial detallado
- **Generación de Recibos PDF**: Recibos profesionales con toda la información relevante
- **Conversión de Moneda**: Integración automática con API del BCV para conversión USD ↔ Bs.F
- **Tema Claro/Oscuro**: Interfaz adaptable con soporte para modo oscuro
- **Acceso para Representantes**: Portal independiente donde los representantes pueden consultar su información con solo su código
- **Actualización Automática**: Sistema de cron jobs para actualización semanal automática de deudas

## 🛠️ Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Estilos modernos y responsivos
- **Supabase** - Backend como servicio (Base de datos y autenticación)
- **Recharts** - Gráficos interactivos
- **jsPDF** - Generación de documentos PDF
- **DolarAPI** - Integración para tasas de cambio

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
│   └── top-debtors.tsx        # Lista de mayores deudores
├── lib/
│   ├── supabase/               # Clientes de Supabase
│   ├── currency.ts             # Conversión de moneda
│   ├── pdf-generator.ts        # Generación de PDFs
│   └── utils.ts                # Utilidades generales
└── migrations/                 # Migraciones SQL
```

## 🎯 Uso

### Para Administradores

1. **Iniciar Sesión**: Acceder con email y contraseña en `/auth/login`
2. **Configuración Inicial**: Configurar nombre del transporte, tarifa general y preferencias en **Ajustes**
3. **Gestionar Representantes**: Crear y administrar representantes con códigos únicos
4. **Registrar Estudiantes**: Asignar niños a representantes con tarifas personalizables
5. **Registrar Docentes**: Gestionar docentes con códigos únicos
6. **Registrar Pagos**: Registrar pagos y generar recibos PDF
7. **Monitorear Dashboard**: Visualizar estadísticas, gráficos y representantes con mayor deuda

### Para Representantes

1. **Acceder**: Ir a `/representante/login`
2. **Ingresar Código**: Usar el código único asignado (formato REP-XXXXX)
3. **Consultar Información**: Ver deuda actual, niños registrados e historial de transacciones
4. **Descargar Recibo**: Generar y descargar recibo PDF con toda la información

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

#### Configuración en Vercel

1. Ir a **Settings** > **Cron Jobs**
2. Agregar nuevo cron job:
   - **Path**: `/api/cron/weekly-charge`
   - **Schedule**: `0 6 * * 5` (viernes a las 6am)
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

## 💱 Conversión de Moneda

El sistema utiliza la API de [DolarAPI](https://ve.dolarapi.com/v1/dolares/oficial) para obtener la tasa de cambio oficial del BCV.

- Las tarifas se configuran en USD
- La conversión a Bs.F se muestra automáticamente en todas las secciones
- La tasa se actualiza automáticamente cada hora
- Se muestra la tasa actual en el dashboard

## 🎨 Personalización

### Color Principal

El color principal del sistema es `#330000` (vinotinto). Se puede modificar en:

- `tailwind.config.ts`: Configuración de colores de Tailwind
- `app/globals.css`: Variables CSS personalizadas

## 🗄️ Base de Datos

El esquema de la base de datos está diseñado para Supabase e incluye:

- **Organizaciones**: Gestión multi-tenant
- **Representantes**: Con códigos únicos y información de contacto
- **Pasajeros**: Estudiantes y docentes con tarifas personalizables
- **Transacciones**: Historial completo de cargos y pagos
- **Configuración**: Ajustes por organización

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

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## 🤝 Contribuir

Este es un proyecto privado. Para contribuciones, contactar al administrador del repositorio.

## 📄 Licencia

Este proyecto es privado y propietario.

## 🔒 Seguridad

- Las credenciales nunca deben subirse al repositorio
- Usar variables de entorno para toda la información sensible
- El `CRON_SECRET` debe ser único y seguro
- Las rutas de administración están protegidas con autenticación

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

Desarrollado con ❤️ para facilitar la gestión de transporte escolar
