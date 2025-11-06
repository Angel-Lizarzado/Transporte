# Guía de Despliegue

## Despliegue en Vercel

### 1. Preparación

1. Asegúrate de que el repositorio esté en GitHub
2. Verifica que todas las variables de entorno estén documentadas
3. Ejecuta `npm run build` localmente para verificar que no hay errores

### 2. Configuración en Vercel

1. Conectar el repositorio de GitHub a Vercel
2. Configurar las siguientes variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
CRON_SECRET=tu_secreto_para_cron
```

3. Configurar el Framework Preset: **Next.js**
4. Configurar Build Command: `npm run build`
5. Configurar Output Directory: `.next`

### 3. Configurar Cron Jobs

1. Ir a **Settings** > **Cron Jobs** en Vercel
2. Agregar nuevo cron job:
   - **Path**: `/api/cron/weekly-charge`
   - **Schedule**: `0 6 * * 5` (viernes a las 6:00 AM UTC)
   - **Method**: POST
   - **Headers**:
     ```
     Authorization: Bearer [CRON_SECRET]
     ```

### 4. Verificar Despliegue

1. Verificar que la aplicación se despliegue correctamente
2. Probar el login de administradores
3. Probar el login de representantes
4. Verificar que los cron jobs estén configurados

### 5. Configuración de Base de Datos

1. Ejecutar la migración SQL en Supabase:
   ```sql
   -- Ver migrations/add_code_to_passengers.sql
   ```

2. Verificar que todas las tablas estén creadas correctamente

## Variables de Entorno

Todas las variables de entorno deben configurarse en Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio (solo para operaciones del servidor)
- `CRON_SECRET`: Secreto para proteger el endpoint de cron jobs

## Notas Importantes

- El archivo `.env.local` nunca debe subirse al repositorio
- Las credenciales deben configurarse solo en Vercel
- El `CRON_SECRET` debe ser único y seguro
- Verificar que el cron job esté configurado correctamente después del despliegue

