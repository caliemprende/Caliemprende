# Cali Emprende

Plataforma inicial para descubrir y registrar emprendimientos de Cali, Colombia.

## Tecnologías
- Next.js 14
- Supabase (Postgres y RLS)
- Wompi Web Checkout (COP)

## Configuración requerida en Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (solo servidor; nunca usar con prefijo NEXT_PUBLIC)
- `WOMPI_PUBLIC_KEY`
- `WOMPI_INTEGRITY_SECRET`
- `WOMPI_EVENTS_SECRET`
- `NEXT_PUBLIC_SITE_URL` (URL pública de producción)

No se debe guardar ninguna llave privada o secreta en el repositorio, en el navegador ni en mensajes.

## Preparar Supabase
1. Abre Supabase > SQL Editor.
2. Ejecuta el contenido completo de `supabase/schema.sql`.
3. Verifica que existan `businesses` y `payment_attempts`.

## Configurar webhook Wompi
En el Dashboard de Wompi, configura la URL HTTPS:
`https://cali-emprende.vercel.app/api/wompi/webhook`

Configura el evento `transaction.updated` para el ambiente que se vaya a probar. Usa credenciales de prueba antes de habilitar producción.

## Flujo implementado
- Registro de negocios: `POST /api/businesses`.
- Checkout: `POST /api/wompi/checkout` crea una referencia y la guarda antes de redirigir a Wompi.
- Webhook: valida el checksum SHA-256, referencia, moneda y monto; actualiza el intento y aprueba el negocio únicamente cuando Wompi informa `APPROVED`.

## Estado
La integración requiere ejecutar el SQL en Supabase, revisar las variables de entorno y realizar pagos de prueba. No anunciar pagos activos hasta completar esas verificaciones.
