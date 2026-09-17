/* ============================================================
   CASA LA PAROTA · MEJORAS DEL VISOR MARZIPANO
   Archivo compartido por todos los tours mensuales.
   Debe cargarse DESPUÉS de data.js y ANTES de index.js:
     <script src="data.js"></script>
     <script src="../../assets/tour-enhance.js"></script>
     <script src="index.js"></script>

   Responsabilidades:
   1. Construir el menú de escenas desde APP_DATA (el generador
      de Marzipano solo escribía la primera escena, dejando 19
      puntos inalcanzables desde el panel).
   2. Traducir los nombres técnicos de captura a etiquetas
      legibles en español y agruparlos por zona.
   3. Renombrar los hotspots con las mismas etiquetas.
   ============================================================ */
(function () {
  'use strict';

  var data = window.APP_DATA;
  if (!data || !data.scenes) return;

  var MESES = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/gi;

  /* Diccionario de zonas: primera palabra -> rótulo del grupo */
  var ZONAS = {
    'Fachada'  : 'Fachada exterior',
    'Entrada'  : 'Acceso y vestíbulo',
    'Patio'    : 'Patios',
    'Sala'     : 'Áreas sociales',
    'Comedor'  : 'Áreas sociales',
    'Cocina'   : 'Cocina y servicios',
    'Recamara' : 'Recámaras',
    'Recámara' : 'Recámaras',
    'Bano'     : 'Baños',
    'Baño'     : 'Baños',
    'Terraza'  : 'Terrazas',
    'Azotea'   : 'Azotea',
    'Jardin'   : 'Jardín',
    'Alberca'  : 'Alberca'
  };

  var ACENTOS = {
    'Bano':'Baño', 'Banos':'Baños',
    'Recamara':'Recámara', 'Recamaras':'Recámaras',
    'Jardin':'Jardín', 'Salon':'Salón',
    'Habitacion':'Habitación', 'Construccion':'Construcción',
    'Cimentacion':'Cimentación', 'Garage':'Cochera'
  };

  function titleCase(w) {
    if (!w) return w;
    if (/^\d+$/.test(w)) return w;
    var t = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    return ACENTOS[t] || t;
  }

  /* CLPAgostoFachadaFrente -> "Fachada Frente"
     CLPEntradaV15          -> "Entrada 15"
     CLPAgostoFachadaIZQUIERDA2 -> "Fachada Izquierda 2" */
  function prettify(raw) {
    var s = String(raw || '');
    s = s.replace(/^CLP/i, '');
    s = s.replace(MESES, '');
    s = s.replace(/[_-]+/g, ' ');
    s = s.replace(/([a-záéíóúñ])[vV](\d)/g, '$1 $2');   // "Entradav1"/"EntradaV2" -> "Entrada 1"
    s = s.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
    s = s.replace(/([A-ZÁÉÍÓÚÑ]{2,})([A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g, '$1 $2');
    s = s.replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])(\d)/g, '$1 $2');
    s = s.replace(/\b[Vv]\s+(\d+)/g, '$1');          // "V 15" -> "15"
    s = s.replace(/\s+/g, ' ').trim();

    var out = s.split(' ').map(titleCase).join(' ');
    return out || String(raw);
  }

  /* Enriquece APP_DATA: label legible + zona.
     index.js lee scene.data.name para el título y los tooltips,
     así que sustituimos ahí el nombre ya formateado. */
  data.scenes.forEach(function (sc, i) {
    sc.rawName = sc.name;
    sc.label   = prettify(sc.name);
    sc.index   = i + 1;
    var first  = sc.label.split(' ')[0];
    sc.zone    = ZONAS[first] || first || 'Recorrido';
    sc.name    = sc.label;
  });

  /* ---------- Construcción del panel de escenas ---------- */
  var list = document.querySelector('#sceneList .scenes');
  if (!list) return;

  list.innerHTML = '';

  var head = document.createElement('div');
  head.className = 'scene-panel-head';
  head.innerHTML =
    '<div class="kicker">Bitácora 360°</div>' +
    '<div class="ttl">' + (data.name || 'Recorrido') + '</div>' +
    '<div class="meta">' + data.scenes.length + ' puntos de captura</div>';
  list.appendChild(head);

  var zonaActual = null;
  data.scenes.forEach(function (sc) {
    if (sc.zone !== zonaActual) {
      zonaActual = sc.zone;
      var g = document.createElement('li');
      g.className = 'scene-group';
      g.textContent = zonaActual;
      list.appendChild(g);
    }
    var a = document.createElement('a');
    a.href = 'javascript:void(0)';
    a.className = 'scene';
    a.setAttribute('data-id', sc.id);
    a.setAttribute('title', sc.label);

    var li = document.createElement('li');
    li.className = 'text';
    li.textContent = sc.label;
    li.setAttribute('data-idx', String(sc.index).padStart(2, '0'));

    a.appendChild(li);
    list.appendChild(a);
  });

  /* Marzipano marca body.single-scene solo cuando hay una escena;
     con el listado completo garantizamos el modo multi-escena. */
  if (data.scenes.length > 1) {
    document.body.classList.add('multiple-scenes');
    document.body.classList.remove('single-scene');
  }
})();
