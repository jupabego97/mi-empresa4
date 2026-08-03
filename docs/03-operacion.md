# 03 — Operación NANOTRONICS

> **Estado:** Parcialmente completado desde cuestionario.

## Resumen

| Proceso | Política | Estado |
|---------|----------|--------|
| Garantía productos | Mínimo 3 meses | CONFIRMADO |
| Cambios / devoluciones | 15 días | CONFIRMADO |
| Garantía reparación | 30 días | CONFIRMADO |
| Respuesta WhatsApp | ~5 min (horario tienda) | CONFIRMADO |
| Pagos | Efectivo en tienda, transferencia, Mercado Pago | CONFIRMADO |
| Envío gratis umbral | $200.000 (theme, draft) | VALIDAR — no publicar en tienda |
| Tiempos envío en theme | Medellín 1-2 días · Nacional 2-5 días (draft) | VALIDAR — no publicar en tienda |
| Transportadoras | — | PENDIENTE — campo vacío en theme |

## Cómo está cableado en el theme

Setting `publish_shipping_claims` (Theme Editor → **Operación**):

- **Off (default):** no se muestran umbral de envío gratis, ETAs ni transportadoras. Copy seguro: checkout / WhatsApp / recogida en tienda.
- **On:** solo activar cuando esta tabla marque CONFIRMADO para umbral, tiempos y transportadoras.

Valores draft guardados (no visibles mientras el switch esté off):

- `free_shipping_threshold`: 200000
- `shipping_medellin`: 1-2 días hábiles
- `shipping_national`: 2-5 días hábiles
- `shipping_carriers`: vacío hasta confirmar

## Horarios tienda

- **Lun–Sáb:** 10:00 – 20:00
- **Dom:** 10:00 – 19:00

## Pagos

| Método | Activo |
|--------|--------|
| Efectivo en tienda | Sí |
| Transferencia | Sí |
| Mercado Pago | Sí |
| Addi / PSE / Nequi | No marcado en cuestionario |

## WhatsApp

| Contexto | Mensaje sugerido |
|----------|------------------|
| General | Hola NANOTRONICS, necesito información sobre un producto o servicio |
| Producto | Hola, me interesa este producto: |
| Servicio técnico | Hola, quiero solicitar servicio técnico para mi equipo |

**SLA:** Respuesta en aproximadamente 5 minutos en horario de atención de tienda.

## SEO local

Referencia interna en `settings.seo_local_keywords` (no se inyecta como meta keywords):

- nanotronics viboral
- tienda tecnologia carmen de viboral
- servicio tecnico viboral
- accesorios celular viboral
- parlantes viboral

Completar 5 búsquedas reales del negocio cuando haya datos de Search Console / ads.

## Envíos — checklist para pasar a CONFIRMADO

Completar en cuestionario y luego:

1. Confirmar umbral de envío gratis ($ COP)
2. Confirmar tiempos Medellín / nacional
3. Confirmar transportadoras
4. Activar `publish_shipping_claims` en Theme Editor
5. Actualizar esta tabla a CONFIRMADO
