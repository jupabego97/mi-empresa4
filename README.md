# NANOTRONICS — Shopify Theme

Tienda tecnológica premium para **NANOTRONICS** (El Carmen de Viboral, Antioquia).

Stack: **Shopify Online Store 2.0** · **Liquid** · **Tailwind CSS v4** · **Alpine.js**

## Brand brief (fuente de verdad)

Documentación de identidad, catálogo y operación en [`docs/`](docs/README.md). Los valores editables del negocio viven en **Theme Editor** → secciones *Identidad de marca*, *Métricas de confianza* y *Operación*.

Rama de trabajo: `brand-precision`.

## Identidad

- **Paleta**: azul royal `#1D4ED8` · azul eléctrico `#2D7CFF` · azul oscuro `#050B1F` · acentos luminosos sutiles
- **Tipografía**: Inter (400-800)
- **Inspiración**: Apple + Amazon + Nvidia + Mercado Libre + tiendas gamer premium
- **Foco**: conversión, velocidad, claridad, confianza, mobile first

## Páginas y secciones

### Home (orden CRO)

1. **Announcement bar** — envíos, garantía, tienda física
2. **Header sticky** premium con mega-menu, search prominente, ofertas destacado
3. **Hero** con tech grid, badges, métricas de confianza, tarjeta flotante
4. **Trust strip** — 5 razones de confianza
5. **Categorías** destacadas con cards visuales
6. **Productos destacados** — grid de 8 cards premium
7. **Promo / Urgencia** con countdown en tiempo real
8. **Beneficios** — 6 razones para comprar
9. **Marcas oficiales** — strip de logos
10. **Banner Servicio Técnico** — taller, beneficios, CTA WhatsApp
11. **Reseñas** verificadas con rating y producto
12. **Footer** con newsletter, social, payment row, links estructurados

### PDP (Página de producto)

- Galería con zoom, navegación, thumbs, eager + priority
- Vendor / brand · rating · reseñas · badges múltiples
- Precio grande con descuento %, cuotas y método sin tarjeta (Addi)
- Stock real con dot · key-specs grid (procesador, RAM, etc.)
- Form con variantes radio · cantidad · 3 CTAs (Add / Buy now / WhatsApp)
- Trust grid (envío, garantía, pagos, devoluciones) + payment icons
- Acordeones: descripción · specs metafields · video · FAQ múltiple · reviews
- Sidebar sticky con asesoría, servicio técnico, tienda física
- Productos relacionados
- Sticky CTA móvil con WhatsApp + Add to cart

### Otros

- **Categoría** — filtros laterales, sort, paginación
- **Carrito** — barra de progreso de envío gratis, upsells, garantía
- **Cart drawer** — slide-over con shipping bar
- **Checkout trust** — seguridad, envío, ayuda
- **Servicio técnico** — hero, servicios, proceso, taller, CTA
- **Nosotros** — historia, métricas, misión, valores, equipo
- **Contacto** — WhatsApp prioritario, teléfono, email, formulario
- **Búsqueda** — input grande, grid resultados
- **Mobile bottom nav** — 5 tabs (home, categorías, search, cart, WhatsApp)
- **WhatsApp FAB** flotante con animación pulse

## Performance

- CSS minificado ~95KB con Tailwind v4 + theme tokens
- Imágenes WebP via `image_url` con widths responsivos y `sizes`
- LCP image: hero con `loading="eager"` + `fetchpriority="high"`
- Lazy loading global · Alpine.js diferido (~46KB)
- `prefers-reduced-motion` respetado
- Sin sliders pesados ni JS innecesario

## Conversión (CRO)

- Trust visible en hero, header, PDP, carrito, footer
- Urgencia con countdown y stock bajo
- Prueba social con reseñas verificadas y métricas
- Múltiples CTAs por página (comprar / WhatsApp)
- Cuotas e instalments visibles en cada precio
- Free-shipping progress bar en carrito
- Sticky add-to-cart en móvil
- WhatsApp prominente en cada paso

## Instalación

```bash
cd mi-empresa4
npm install
npm run build
```

## Desarrollo

```bash
npm run dev          # CSS watch
npm run theme:dev    # Shopify preview
```

## Theme Editor — qué configurar

| Sección | Configuración clave |
|---------|---------------------|
| Marca | Logo, colores brand |
| WhatsApp | Número, mensaje default, FAB on/off |
| Anuncio superior | 3 mensajes rotativos |
| Redes sociales | Facebook, Instagram, TikTok, YouTube |
| Hero | Imagen, headline, métricas |
| Promo | Countdown date, colección de ofertas |
| Marcas | Subir logos PNG/WebP |

## Páginas a crear en Shopify Admin

| Página | Template |
|--------|----------|
| Servicio técnico | `page.servicio-tecnico` |
| Nosotros | `page.nosotros` |
| Contacto | `page.contacto` |
| Styleguide (interno) | `page.styleguide` |

## Templates incluidos

- `index.json` — Home (9 secciones CRO)
- `collection.json` — Categoría con filtros
- `product.json` — PDP premium con specs/FAQ/video
- `cart.json` — Carrito con shipping bar y upsells
- `search.json` — Resultados
- `page.*.json` — Páginas institucionales

## Estructura

```
assets/       theme.css, theme.js, alpine.min.js, icons.svg, nano-logo.png
config/       settings_schema.json, settings_data.json
layout/       theme.liquid
locales/      es.default.json
sections/     announcement-bar, header, footer, home-*, main-*, page-*, trust-strip, ...
snippets/     btn, badge, product-card, product-form, product-gallery, price,
              shipping-progress, cart-line-item, trust-badges, payment-icons,
              meta-tags, breadcrumbs, icon, icon-sprite, ...
src/          tailwind.css (fuente, no se sube)
templates/    index.json, product.json, collection.json, ...
tools/        scripts (build-icons, copy-alpine)
```

## Publicar

```bash
npm run theme:push
```

Repo: [jupabego97/mi-empresa4](https://github.com/jupabego97/mi-empresa4)
