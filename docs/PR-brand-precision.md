# PR: Brand precision NANOTRONICS

## Resumen

Define desde cero la **identidad**, **catálogo** y **operación** de NANOTRONICS como fuente de verdad en `docs/` y la conecta al theme vía Theme Editor.

## Cambios principales

### Documentación (`docs/`)

- `00-cuestionario.md` — guía de descubrimiento por fases
- `01-identidad.md`, `personas.md`, `voz-de-marca.md`
- `02-catalogo.md` — categorías, marcas, servicios (precios VALIDAR)
- `03-operacion.md` — envíos, pagos, WhatsApp, SEO local

### Theme settings (nuevas secciones en Theme Editor)

- **Identidad de marca** — historia, misión, valores, USP, geo, horarios
- **Métricas de confianza** — cifras centralizadas para hero y nosotros
- **Operación** — umbral envío gratis, tiempos, devoluciones, garantía reparación
- **WhatsApp** — mensajes por contexto (general, producto, servicio, carrito)

### Liquid / templates

- Hero y Nosotros leen métricas e historia desde `settings`
- Servicio técnico: bloques con `price_from`, `turnaround`, `warranty_note`
- `templates/page.servicio-tecnico.json` con 6 servicios preset
- PDP FAQ y stock alineados a políticas operativas
- `shipping-progress` usa umbral configurable
- `meta-tags`: schema **LocalBusiness** + geo

## Pendiente del negocio (VALIDAR)

1. NIT, dirección exacta y coordenadas GPS
2. Cifras reales (clientes, años, rating)
3. Precios de servicios técnicos
4. Marcas con factura oficial + logos
5. Políticas legales en Shopify Admin

## Cómo probar

1. Conectar theme desde rama `brand-precision`
2. Theme Editor → revisar **Identidad de marca** y **Operación**
3. Páginas: `/pages/nosotros`, `/pages/servicio-tecnico`, `/pages/contacto`
4. PDP: FAQ y barra envío en carrito

## Commits

- `feat(brand): fase 1 identidad`
- `feat(brand): fase 2 catalogo`
- `feat(brand): fase 3 operacion`
