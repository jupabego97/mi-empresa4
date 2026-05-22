# Páginas Shopify — plantillas NANOTRONICS

## Asignación automática (recomendado)

1. Inicia sesión en Shopify CLI:
   ```bash
   shopify auth login
   ```
2. Desde la carpeta `mi-empresa4`:
   ```bash
   npm run pages:assign
   ```
3. El script crea o actualiza cada página y asigna su plantilla (`templateSuffix`).

Tienda configurada en `shopify.theme.toml`: `gigahertz-emporium-1onmb.myshopify.com`  
Otra tienda: `npm run pages:assign -- --store=tu-tienda.myshopify.com`

## Mapa página → plantilla

| Página en Admin | Handle (URL) | Plantilla del theme |
|-----------------|--------------|---------------------|
| Nosotros | `nosotros` | **Nosotros** (`page.nosotros`) |
| Soporte | `soporte` | **Soporte** (`page.soporte`) |
| Contacto | `contacto` | **Contacto** (`page.contacto`) |
| Servicio técnico | `servicio-tecnico` | **Servicio técnico** (`page.servicio-tecnico`) |

URLs finales:
- `/pages/nosotros`
- `/pages/soporte`
- `/pages/contacto`
- `/pages/servicio-tecnico`

## Asignación manual en Admin

**Online Store → Pages →** abrir cada página → abajo **Theme template** → elegir la plantilla de la tabla → Guardar.

## Crear páginas si no existen

**Online Store → Pages → Add page**

- Título: como en la tabla  
- **Search engine listing → URL handle:** el handle exacto  
- **Theme template:** la plantilla correspondiente  
- Visible: sí (excepto styleguide si se usa)

## Plantilla genérica

Cualquier otra página puede usar **Página genérica** (`page.json` / `main-page`).
