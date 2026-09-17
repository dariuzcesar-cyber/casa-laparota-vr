# Casa La Parota — Bitácora 360°
Guía de mantenimiento y publicación

## Estructura

```
index.html                      Landing principal (todo el CSS/JS va en línea)
assets/
  tour-theme.css                Tema oscuro compartido por TODOS los tours
  tour-enhance.js               Menú de escenas + nombres legibles (compartido)
  sergiologonegro.png           Logo (se fuerza a blanco con filter: brightness(0) invert(1))
  sergio-retrato.jpg            Retrato recortado y optimizado (640 px, 35 KB)
  sergiobookv1-92.jpg           Retrato original 4000×6000 (archivo, no se usa en web)
  proyecto_casa_la_parota.jpeg  Render de portada
tours/
  agosto-2026/                  Salida de Marzipano + 3 líneas añadidas (ver abajo)
_backup_pre_redesign/           Copia de los archivos previos al rediseño
```

## Publicar un mes nuevo

1. Exportar el recorrido con Marzipano Tool a `tours/<mes>-<año>/`.

2. En el `index.html` de ese tour, añadir **tres líneas**:

   En `<head>`, después de `<link rel="stylesheet" href="style.css">`:
   ```html
   <link rel="stylesheet" href="../../assets/tour-theme.css">
   ```

   Antes de `<script src="index.js"></script>`:
   ```html
   <script src="../../assets/tour-enhance.js"></script>
   ```

   Antes de `</body>`, la marca de agua:
   ```html
   <div class="tour-watermark" aria-hidden="true">
     <img src="../../assets/sergiologonegro.png" alt="">
     <span class="wm-label">Dirección de Obra<br>Arq. Sergio Díaz</span>
   </div>
   ```

   Opcional pero recomendado: vaciar `<ul class="scenes"></ul>` (el listado lo
   genera `tour-enhance.js`) y usar `img/expand.png` / `img/collapse.png` con
   las clases `icon off` / `icon on` en `#sceneListToggle`.

3. En `index.html` de la raíz, dentro de `SITE_CONFIG.months`, marcar el mes:
   ```js
   { slug:'septiembre-2026', label:'Septiembre', year:'2026',
     available:true, scenes:24, date:'30 Sep 2026' },
   ```

No hace falta tocar nada más: la línea de tiempo, la ficha técnica y el visor
se actualizan solos.

## Al terminar la obra

1. Exportar el recorrido final amueblado a `tours/final-amueblado/`.
2. En `SITE_CONFIG`:
   ```js
   mode: 'entregado',
   finalTour: { slug:'final-amueblado', label:'Recorrido Final',
                caption:'Casa terminada · Recorrido amueblado', available:true },
   ```

La landing conmuta sola: el recorrido final pasa a portada, la línea de tiempo
mensual se oculta y los meses publicados se agrupan en la sección
**Bitácora histórica de construcción**.

## Nombres de escena

`tour-enhance.js` traduce los nombres de captura a etiquetas legibles y las
agrupa por zona:

| Captura                    | Se muestra          | Grupo               |
|----------------------------|---------------------|---------------------|
| CLPAgostoFachadaFrente     | Fachada Frente      | Fachada exterior    |
| CLPAgostoFachadaIZQUIERDA2 | Fachada Izquierda 2 | Fachada exterior    |
| CLPEntradav1               | Entrada 1           | Acceso y vestíbulo  |

Para añadir zonas nuevas (Cocina, Recámaras, Terrazas…), ampliar el objeto
`ZONAS` en `assets/tour-enhance.js`. Ya están previstas las más comunes.

Conviene nombrar las capturas como `CLP<Mes><Zona>V<n>` para que el formateo
sea automático.

## Contactos en el código

- WhatsApp Arq. Sergio Díaz: `523121071335`
- WhatsApp Dariuz PH (autoría, pie de página): `523122247792`
