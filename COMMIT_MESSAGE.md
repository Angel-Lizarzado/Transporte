# Mensaje de Commit Recomendado

```
feat: Sistema completo de gestión de transporte escolar

Implementa un sistema completo de gestión para transporte escolar privado
con soporte multi-organización, incluyendo:

Características principales:
- Dashboard administrativo con estadísticas y gráficos
- Gestión de representantes con códigos únicos (REP-XXXXX)
- Gestión de estudiantes con tarifas personalizables
- Gestión de docentes con códigos únicos (DOC-XXXXX)
- Sistema de transacciones y pagos
- Generación de recibos PDF
- Portal para representantes con acceso por código
- Conversión automática USD a Bs.F con API del BCV
- Actualización semanal automática de deudas (cron job)
- Tema claro/oscuro

Tecnologías:
- Next.js 14 con App Router
- TypeScript
- Tailwind CSS
- Supabase (Base de datos y autenticación)
- Recharts (Gráficos)
- jsPDF (Generación de PDFs)

Configuración:
- Variables de entorno requeridas en .env.local
- Migración SQL para campo code en passengers
- Cron job configurado para actualización semanal
```

## Alternativa más corta:

```
feat: Sistema de gestión de transporte escolar

Sistema completo para gestión de transporte escolar privado con
dashboard administrativo, gestión de representantes/estudiantes,
sistema de pagos, generación de PDFs y portal para representantes.

Tecnologías: Next.js 14, TypeScript, Supabase, Tailwind CSS
```

