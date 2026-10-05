# Casa La Parota — Despliegue

## Por qué "la página no se actualizaba"

El código en disco estaba correcto. Los tres culpables reales fueron:

1. **Sin control de caché.** No existía `_headers`, así que el navegador y
   Cloudflare decidían por su cuenta cuánto tiempo conservar el HTML. El
   `index.html` nuevo llegaba, pero el **iframe** seguía sirviendo el tour
   viejo desde caché — de ahí la sensación de "bucle": la portada cambiaba
   y el recorrido no.
2. **`.git/index.lock` residual.** Un proceso de git previo dejó el archivo
   de bloqueo. A partir de ahí, *todo* `git add` / `git commit` fallaba con
   `Unable to create index.lock: File exists`. Los cambios nunca llegaban a
   un commit, así que nunca llegaban al deploy.
3. **Respaldos publicados.** `_backup_pre_redesign/*.bak` estaba en git, o
   sea que el código viejo se desplegaba junto al sitio.

## Publicar cambios

```bash
cd ~/Desktop/CasaLaParotaVR
git status                      # debe estar limpio
git push origin main
```

Si `push` se queda colgado o falla por el peso del repo (437 MB de tiles):

```bash
git config http.postBuffer 524288000
git config http.version HTTP/1.1
git push origin main
```

Si aparece `Unable to create '.git/index.lock': File exists`:

```bash
rm -f .git/index.lock
```

Esto es lo que bloqueaba los commits. No es un proceso colgado: es un
archivo huérfano. Borrarlo es seguro si no hay otro git corriendo.

## Forzar que Cloudflare sirva la versión nueva

1. **Subir el sello de versión** en `index.html`, dentro de `SITE_CONFIG`:
   ```js
   version: '2026.09.17.1',   // -> 2026.10.01.1 en el siguiente deploy
   ```
   Ese valor se añade como `?v=` a la URL del recorrido. Sin cambiarlo, el
   navegador puede seguir mostrando el tour anterior aunque el deploy sea nuevo.

2. En el panel de Cloudflare Pages, tras el deploy: **Caching → Purge Everything**.

3. Para comprobar en el navegador, recarga dura: `Cmd + Shift + R`.

## Verificar que el deploy trae lo correcto

```bash
curl -sI https://<tu-dominio>/ | grep -i cache-control
# esperado: public, max-age=0, must-revalidate

curl -s https://<tu-dominio>/ | grep -o "version: '[^']*'"
# debe coincidir con el SITE_CONFIG local
```

## Tiles en Cloudflare R2 (desde octubre 2026)

Los tiles del 360° ya **no viven en git ni en Cloudflare Pages**. Pasaban de
22 000 archivos y el tope de Pages es 20 000. Ahora están en R2:

- Bucket: `casa-la-parota-tiles`
- URL pública: `https://tiles.dariuzph.com/<mes>/<escena>/...`
- `tours/<mes>/index.js` apunta ahí con `var urlPrefix`.
- `tours/*/tiles/` está en `.gitignore`: la carpeta sigue en tu disco
  (es el respaldo local) pero no se sube a GitHub. El deploy de Pages
  queda en unas decenas de archivos.

### Publicar un mes nuevo

1. Exportar con Marzipano a `tours/<mes>-<año>/` y aplicar las 3 líneas de
   `MANTENIMIENTO.md`.
2. En `tours/<mes>-<año>/index.js` cambiar:
   ```js
   var urlPrefix = "https://tiles.dariuzph.com/<mes>-<año>";
   ```
3. Subir los tiles **antes** de hacer push (si no, el sitio queda sin imagen):
   ```bash
   export R2_ACCESS_KEY_ID="..."        # token casa-la-parota-subida
   export R2_SECRET_ACCESS_KEY="..."
   scripts/subir-tiles.sh <mes>-<año>
   ```
   Requiere `brew install rclone`. Las claves se guardan en el gestor de
   contraseñas, nunca en el repo.
4. Comprobar `https://tiles.dariuzph.com/<mes>-<año>/0-frente/preview.jpg`
   (o la primera escena del tour).
5. Marcar el mes en `SITE_CONFIG`, subir `version` y hacer `git push`.

### Notas
- El bucket tiene CORS `*` (GET/HEAD): el visor WebGL lo necesita. Si algún
  día se restringe, incluir el dominio del sitio y `http://localhost:8000`.
- Los tiles se suben con `Cache-Control: immutable` de un año; si hay que
  reemplazar un tile, usa una carpeta/nombre nuevo o purga la caché de
  `tiles.dariuzph.com` en Cloudflare.
- Cupo gratis de R2: 10 GB, 1 M escrituras y 10 M lecturas al mes.
