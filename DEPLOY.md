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

## Advertencia de escala

El repositorio pesa **428 MB** y rastrea **10 252 archivos**; los tiles del
360° son el 99 %. Con un solo mes ya es lento de clonar y de subir.

- Cloudflare Pages tiene un tope de **20 000 archivos por despliegue**.
  Agosto ya usa 10 220. **El segundo mes revienta ese límite.**
- Un `git push` de este tamaño falla o se cuelga con frecuencia sobre HTTPS.

Antes de publicar septiembre hay que sacar los tiles de git. Dos caminos:

**A — Subida directa con Wrangler (recomendada).** Los tiles dejan de vivir
en el repo; git conserva solo el código.
```bash
npm install -g wrangler
wrangler pages deploy . --project-name=casa-laparota-vr
```
Y añadir `tours/*/tiles/` al `.gitignore`.

**B — Tiles en Cloudflare R2** y apuntar Marzipano a esa URL en
`tours/<mes>/index.js` (`var urlPrefix`). Es el camino limpio a largo plazo:
el repo se queda en pocos MB y no hay tope de archivos.

El límite de 20 000 archivos no es negociable: conviene resolverlo antes de
la captura de septiembre, no después.
