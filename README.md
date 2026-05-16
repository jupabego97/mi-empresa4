# NANOTRONICS — Shopify Theme

Tienda tecnológica premium para **NANOTRONICS** (El Carmen de Viboral, Antioquia).

Stack: **Shopify Online Store 2.0** · **Liquid** · **Tailwind CSS v4** · **Alpine.js**

## Fases

| Fase | Contenido |
|------|-----------|
| **1** | Sistema de diseño + styleguide (`/pages/styleguide`) |
| **2** | Home, categoría, producto, carrito, búsqueda, servicio técnico, nosotros, contacto, mini-cart, menú móvil |

## Instalación

```bash
cd mi-empresa4
npm install
npm run build
```

## Desarrollo

```bash
# Terminal 1 — CSS watch
npm run dev

# Terminal 2 — Shopify preview
npm run theme:dev
```

## Páginas a crear en Shopify Admin

| Página | Template |
|--------|----------|
| Styleguide | `page.styleguide` |
| Servicio técnico | `page.servicio-tecnico` |
| Nosotros | `page.nosotros` |
| Contacto | `page.contacto` |

## Templates incluidos

- `index.json` — Home
- `collection.json` — Categoría con filtros
- `product.json` — PDP con galería y sticky CTA móvil
- `cart.json` — Carrito + checkout trust
- `search.json` — Resultados de búsqueda
- `page.*.json` — Páginas institucionales

## Personalización (Theme Editor)

- Logo, colores, WhatsApp
- Home: hero, categorías, colección destacada, reseñas
- Dirección, NIT, teléfono, email

## Estructura

```
theme/
  sections/     home-*, main-*, page-*, cart-drawer, header, footer
  snippets/     product-card, product-form, cart-drawer, ...
  templates/    index, collection, product, cart, search, page.*
src/tailwind.css
```

## Publicar

```bash
npm run theme:push
```

Repo: [jupabego97/mi-empresa4](https://github.com/jupabego97/mi-empresa4)
