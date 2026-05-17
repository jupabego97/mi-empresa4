# Brand brief NANOTRONICS

Fuente de verdad para identidad, catálogo y operación del theme Shopify.

## Cómo usar estos documentos

| Archivo | Contenido | Estado |
|---------|-----------|--------|
| [00-cuestionario.md](./00-cuestionario.md) | Preguntas guía por fase | Plantilla |
| [01-identidad.md](./01-identidad.md) | Quiénes somos | Borrador — validar |
| [personas.md](./personas.md) | 3 perfiles de cliente | Borrador — validar |
| [voz-de-marca.md](./voz-de-marca.md) | Tono y frases tipo | Borrador — validar |
| [02-catalogo.md](./02-catalogo.md) | Qué vendemos y servicios | Borrador — validar |
| [03-operacion.md](./03-operacion.md) | Cómo lo hacemos | Borrador — validar |

**Leyenda de estado en los docs:**

- `CONFIRMADO` — dato verificado o alineado con `config/settings_data.json`
- `VALIDAR` — placeholder; reemplazar antes de publicar campañas pagas
- `PENDIENTE` — falta respuesta del negocio

## Sincronización con el theme

Los valores `CONFIRMADO` se reflejan en:

- `config/settings_schema.json` — campos editables en Theme Editor
- `config/settings_data.json` — valores por defecto
- Secciones Liquid que leen `settings.*`

Tras actualizar un doc, revisar Theme Editor → **Identidad de marca**, **Operación** y **Contacto**.
