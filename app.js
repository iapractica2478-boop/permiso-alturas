/* Permiso de Trabajo Seguro en Alturas - M & M TORRES
   Formulario web estático: funciona en celular y computador. */
(function () {
  "use strict";

  var CFG = window.TSA_CONFIG || {};
  var DESTINO = CFG.correoDestino || "auxingenieria@mymtorres.com";
  var STORE_KEY = "tsa_permiso_borrador_v1";
  var N_WORKERS = 5;
  var OTRO = "__otro__";

  // ---------- Estructura del formato (igual al Excel) ----------
  var APTITUD = [
    "¿Ha presentado fiebre las últimas 24 horas?",
    "¿Descansó adecuadamente el periodo previo al inicio de actividades?",
    "¿El concepto médico es apto para laborar en altura?",
    "¿Ha consumido alcohol en las últimas 24 horas?",
    "¿Se siente en condiciones para realizar el trabajo?",
    "¿Le ha sido explicado el procedimiento a realizar?",
    "¿Sufre de vértigo?",
    "¿Ha sufrido algún accidente en una labor similar?"
  ];
  var MEDIDAS = [
    "Se cuenta con programa de protección contra caídas",
    "Se cuenta con medidas colectivas de prevención",
    "Delimitación del área",
    "Línea de advertencia",
    "Señalización del área",
    "Barandas",
    "Control de acceso",
    "Control de superficies con huecos o aberturas",
    "Manejo de desniveles",
    "Ayudante de seguridad",
    "Otros, ¿cuáles?"
  ];
  var EQUIPOS = ["Andamios", "Escaleras", "Elevadores de personal / andamio colgante", "Otro, ¿cuál?"];
  var SISTEMAS = [
    { t: "1. Restricción", items: ["1.1. Con eslinga de restricción", "1.2. Punto de anclaje fijo ó móvil", "1.3. Freno en pectoral"] },
    { t: "2. Posicionamiento", items: ["2.1. Con eslinga de posicionamiento", "2.2. Punto de anclaje fijo ó móvil", "2.3. Freno en pectoral"] },
    { t: "3. Detención de caída", items: ["3.1. Con freno dorsal y pectoral", "3.2. Punto de anclaje fijo ó móvil", "3.3. Eslinga en Y con ABS", "3.4. Línea de vida retráctil"] }
  ];
  var EPP = [
    ["Casco - Barbuquejo", "Gafas", "Guantes", "Tapabocas / Protección respiratoria", "Protección auditiva"],
    ["Botas de seguridad", "Camisa manga larga", "Pantalón tipo industrial"],
    ["Arnés cuerpo entero", "Eslinga en Y con y sin ABS", "Eslinga de posicionamiento", "Cuerda", "Tie Off"],
    ["Descendedor", "Ascendedor", "Mosquetón", "Freno de cuerda o Guaya"]
  ];
  var PERSONAS = [
    { k: "autoriza", t: "12. Persona que autoriza el trabajo" },
    { k: "emergencia", t: "13. Persona que activa el plan de emergencia" },
    { k: "coordinador", t: "14. Coordinador de trabajo en alturas (Cuando es diferente de la persona que autoriza el trabajo)" }
  ];

  // ---------- Estado ----------
  var S = {};
  var personal = (CFG.personal || []).slice();

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var a in attrs) {
      if (a === "text") e.textContent = attrs[a];
      else if (a === "html") e.innerHTML = attrs[a];
      else e.setAttribute(a, attrs[a]);
    }
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hoyCorta() { var d = new Date(); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function hoyISO() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function isoACorta(v) { if (!v) return ""; var p = v.split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : v; }
  function horaAhora() { var d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } }
  function load() { try { var r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } }

  function toast(msg, ms) {
    var t = $("toast"); t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add("hidden"); }, ms || 3500);
  }
  function busy(on, txt) { $("busyText").textContent = txt || "Generando PDF…"; $("busy").classList.toggle("hidden", !on); }

  // ---------- Controles ----------
  function seg(key, opts) {
    opts = opts || ["SI", "NO", "N/A"];
    var box = el("div", { class: "seg", role: "group", "data-seg": key });
    opts.forEach(function (o) {
      var b = el("button", { type: "button", "data-v": o, "aria-pressed": S[key] === o ? "true" : "false", text: o });
      b.addEventListener("click", function () {
        S[key] = S[key] === o ? "" : o;
        box.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-v") === S[key] ? "true" : "false"); });
        save();
      });
      box.appendChild(b);
    });
    return box;
  }
  function bindInput(node, key) {
    node.setAttribute("data-k", key);
    if (S[key] != null) node.value = S[key];
    node.addEventListener("input", function () { S[key] = node.value; node.classList.remove("req-missing"); save(); });
    node.addEventListener("change", function () { S[key] = node.value; save(); });
    return node;
  }
  function textInput(key, ph, cls) {
    return bindInput(el("input", { type: "text", placeholder: ph || "", class: cls || "", autocomplete: "off" }), key);
  }

  // ---------- Firma ----------
  var sig = { key: null, btn: null, drawn: false };
  function sigButton(key, label) {
    var b = el("button", { type: "button", class: "sig-btn", "aria-label": "Firmar: " + label });
    function paint() {
      b.innerHTML = "";
      if (S[key]) b.appendChild(el("img", { src: S[key], alt: "Firma" }));
      else b.textContent = "✍ Toque para firmar";
    }
    paint();
    b._paint = paint;
    b.addEventListener("click", function () { openSig(key, b, label); });
    return b;
  }
  function openSig(key, btn, label) {
    sig.key = key; sig.btn = btn; sig.drawn = false;
    $("sigTitle").textContent = "Firma – " + (label || "");
    var c = $("sigCanvas"), ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    if (S[key]) { var im = new Image(); im.onload = function () { ctx.drawImage(im, 0, 0, c.width, c.height); }; im.src = S[key]; sig.drawn = true; }
    $("sigModal").classList.remove("hidden");
  }
  function initSigPad() {
    var c = $("sigCanvas"), ctx = c.getContext("2d"), drawing = false, last = null;
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1f66";
    function pos(e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; }
    c.addEventListener("pointerdown", function (e) { drawing = true; last = pos(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
    c.addEventListener("pointermove", function (e) {
      if (!drawing) return; var p = pos(e);
      ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#0b1f66";
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; sig.drawn = true; e.preventDefault();
    });
    function up() { drawing = false; }
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    $("sigClear").addEventListener("click", function () { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); sig.drawn = false; });
    $("sigCancel").addEventListener("click", function () { $("sigModal").classList.add("hidden"); });
    $("sigOk").addEventListener("click", function () {
      S[sig.key] = sig.drawn ? c.toDataURL("image/png") : "";
      save(); sig.btn._paint(); $("sigModal").classList.add("hidden");
    });
  }

  // ---------- Personal (desde Excel) ----------
  function loadPersonal() {
    if (!window.XLSX || location.protocol === "file:") return Promise.resolve(false);
    return fetch("LISTADO_PERSONAL.xlsx", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      var wb = XLSX.read(buf, { type: "array" });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      var head = (rows[0] || []).map(function (h) { return String(h).toUpperCase().trim(); });
      var iN = head.findIndex(function (h) { return h.indexOf("NOMBRE") >= 0; });
      var iC = head.findIndex(function (h) { return h === "CC" || h.indexOf("CEDULA") >= 0 || h.indexOf("CÉDULA") >= 0 || h.indexOf("DOCUMENTO") >= 0; });
      if (iN < 0) iN = 0; if (iC < 0) iC = 1;
      var list = [];
      rows.slice(1).forEach(function (r) {
        var n = String(r[iN] || "").trim(), c = String(r[iC] || "").replace(/[^\dA-Za-z]/g, "");
        if (n) list.push({ nombre: n, cc: c });
      });
      if (list.length) { personal = list; return true; }
      return false;
    }).catch(function () { return false; });
  }
  function sortPersonal() {
    personal.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); });
  }

  // ---------- Sección 2: trabajadores ----------
  function workerName(i) { return S["w" + i + "_sel"] === OTRO ? (S["w" + i + "_nombreOtro"] || "") : (S["w" + i + "_nombre"] || ""); }
  function workerCC(i) { return S["w" + i + "_sel"] === OTRO ? (S["w" + i + "_ccOtro"] || "") : (S["w" + i + "_cc"] || ""); }

  function buildWorkers() {
    var host = $("workers"); host.innerHTML = "";
    for (var i = 1; i <= N_WORKERS; i++) host.appendChild(buildWorker(i));
  }
  function buildWorker(i) {
    var p = "w" + i + "_";
    var selN = el("select", { class: "pick", "aria-label": "Nombre trabajador " + i, id: p + "selN" });
    var selC = el("select", { class: "pick", "aria-label": "CC trabajador " + i, id: p + "selC" });
    selN.appendChild(el("option", { value: "", text: "Seleccione nombre…" }));
    selC.appendChild(el("option", { value: "", text: "Seleccione CC…" }));
    personal.forEach(function (x, idx) {
      selN.appendChild(el("option", { value: String(idx), text: x.nombre }));
      selC.appendChild(el("option", { value: String(idx), text: x.cc }));
    });
    selN.appendChild(el("option", { value: OTRO, text: "Otro (escribir)…" }));
    selC.appendChild(el("option", { value: OTRO, text: "Otro (escribir)…" }));

    var otroWrap = el("div", { class: "grid2" + (S[p + "sel"] === OTRO ? "" : " hidden"), style: "margin-top:8px" }, [
      el("label", null, ["Nombre completo", textInput(p + "nombreOtro", "Nombre y apellidos")]),
      el("label", null, ["C.C / C.E / P.A / P.T", (function () { var t = textInput(p + "ccOtro", "Número"); t.setAttribute("inputmode", "numeric"); return t; })()])
    ]);

    // restaurar selección
    var cur = S[p + "sel"];
    if (cur === OTRO) { selN.value = OTRO; selC.value = OTRO; }
    else if (S[p + "nombre"]) {
      var idx = personal.findIndex(function (x) { return x.nombre === S[p + "nombre"]; });
      if (idx >= 0) { selN.value = String(idx); selC.value = String(idx); }
    }

    function apply(v) {
      selN.value = v; selC.value = v;
      S[p + "sel"] = v;
      if (v === OTRO) { S[p + "nombre"] = ""; S[p + "cc"] = ""; otroWrap.classList.remove("hidden"); }
      else {
        otroWrap.classList.add("hidden");
        var x = personal[+v];
        S[p + "nombre"] = v === "" || !x ? "" : x.nombre;
        S[p + "cc"] = v === "" || !x ? "" : x.cc;
      }
      selN.classList.remove("req-missing");
      save();
    }
    selN.addEventListener("change", function () { apply(selN.value); });
    selC.addEventListener("change", function () { apply(selC.value); });

    var checks = el("div", { class: "checks" }, [
      ["eps", "EPS"], ["arl", "ARL"], ["cons", "Constancia de capacitación / certificado"], ["anc", "Verificación de puntos de anclaje"]
    ].map(function (c) {
      return el("div", { class: "check-item" }, [el("span", { text: c[1] }), seg(p + c[0], ["SI", "NO"])]);
    }));

    return el("div", { class: "worker" }, [
      el("div", { class: "worker-head" }, [el("span", { class: "worker-num", text: String(i) }), "Trabajador " + i]),
      el("div", { class: "grid2" }, [
        el("label", null, ["Nombre completo", selN]),
        el("label", null, ["C.C / C.E / P.A / P.T", selC])
      ]),
      otroWrap,
      el("div", { class: "grid2", style: "margin-top:10px" }, [
        el("label", { class: "span2" }, ["Firma", sigButton(p + "firma", "Trabajador " + i)])
      ]),
      checks
    ]);
  }

  // ---------- Sección 3: aptitud ----------
  function buildAptitud() {
    var t = $("aptitud"); t.innerHTML = "";
    var h = "<thead><tr><th>Pregunta</th>";
    for (var i = 1; i <= N_WORKERS; i++) h += "<th>Trab. " + i + "</th>";
    t.innerHTML = h + "</tr></thead>";
    var tb = el("tbody");
    APTITUD.forEach(function (q, qi) {
      var tr = el("tr", null, [el("td", { text: q })]);
      for (var i = 1; i <= N_WORKERS; i++) tr.appendChild(el("td", null, [seg("apt" + qi + "_" + i, ["SI", "NO"])]));
      tb.appendChild(tr);
    });
    var trC = el("tr", null, [el("td", { text: "Hora de última comida" })]);
    var trD = el("tr", null, [el("td", { text: "Tiempo descansado previo a las actividades (horas)" })]);
    for (var j = 1; j <= N_WORKERS; j++) {
      trC.appendChild(el("td", null, [bindInput(el("input", { type: "time", "aria-label": "Hora última comida trabajador " + j }), "comida_" + j)]));
      trD.appendChild(el("td", null, [bindInput(el("input", { type: "number", min: "0", max: "24", step: "0.5", inputmode: "decimal", "aria-label": "Horas descansadas trabajador " + j }), "descanso_" + j)]));
    }
    tb.appendChild(trC); tb.appendChild(trD);
    t.appendChild(tb);
  }

  // ---------- Secciones 6 y 7 ----------
  function buildChecklist(hostId, items, pfx) {
    var host = $(hostId); host.innerHTML = "";
    items.forEach(function (it, j) {
      var isOtro = j === items.length - 1;
      var labelBox = el("div", { class: "row-label" }, [it]);
      if (isOtro) labelBox.appendChild(textInput(pfx + "_otro", "¿Cuál?", "otro"));
      host.appendChild(el("div", { class: "row" }, [
        labelBox,
        seg(pfx + j),
        textInput(pfx + j + "_obs", "Observación", "obs")
      ]));
    });
  }

  // ---------- Sección 8 ----------
  function buildSistemas() {
    var host = $("sistemas"); host.innerHTML = "";
    SISTEMAS.forEach(function (g, gi) {
      var col = el("div", { class: "sys-col" }, [el("h3", { text: g.t })]);
      g.items.forEach(function (it, ii) {
        col.appendChild(el("div", { class: "row" }, [el("div", { class: "row-label", text: it }), seg("sis" + gi + "_" + ii)]));
      });
      var otro = el("div", { class: "row-label" }, ["Otro, ¿cuál?", textInput("sis" + gi + "_otro", "¿Cuál?", "otro")]);
      col.appendChild(el("div", { class: "row" }, [otro, seg("sis" + gi + "_o")]));
      host.appendChild(col);
    });
  }

  // ---------- Sección 9 ----------
  function buildEpp() {
    var host = $("epp"); host.innerHTML = "";
    EPP.forEach(function (col, ci) {
      var c = el("div", { class: "epp-col" });
      col.forEach(function (it, ii) {
        c.appendChild(el("div", { class: "row" }, [el("div", { class: "row-label", text: it }), seg("epp" + ci + "_" + ii)]));
      });
      var otro = el("div", { class: "row-label" }, ["Otro, ¿cuál?", textInput("epp" + ci + "_otro", "¿Cuál?", "otro")]);
      c.appendChild(el("div", { class: "row" }, [otro, seg("epp" + ci + "_o")]));
      host.appendChild(c);
    });
  }

  // ---------- Secciones 12-14 ----------
  function buildPersonas() {
    var dl = $("dlPersonal");
    if (!dl) { dl = el("datalist", { id: "dlPersonal" }); document.body.appendChild(dl); }
    dl.innerHTML = "";
    personal.forEach(function (x) { dl.appendChild(el("option", { value: x.nombre })); });
    document.querySelectorAll(".person").forEach(function (box) {
      var k = "p_" + box.getAttribute("data-key") + "_";
      box.innerHTML = "";
      var n = textInput(k + "nombre", "Escriba o seleccione"); n.setAttribute("list", "dlPersonal");
      var c = textInput(k + "cc", "Número"); c.setAttribute("inputmode", "numeric");
      n.addEventListener("input", function () {
        var m = personal.find(function (x) { return x.nombre.toLowerCase() === n.value.trim().toLowerCase(); });
        if (m) { c.value = m.cc; S[k + "cc"] = m.cc; save(); }
      });
      box.appendChild(el("div", { class: "grid2" }, [
        el("label", null, ["Nombre completo", n]),
        el("label", null, ["CC", c]),
        el("label", { class: "span2" }, ["Firma", sigButton(k + "firma", box.closest(".card").querySelector("h2").textContent)])
      ]));
    });
  }

  // ---------- Sección 1 ----------
  function buildBasicos() {
    var sel = $("ciudad");
    sel.innerHTML = "";
    sel.appendChild(el("option", { value: "", text: "Seleccione la ciudad…" }));
    (CFG.ciudades || []).forEach(function (c) { sel.appendChild(el("option", { value: c, text: c })); });
    sel.appendChild(el("option", { value: OTRO, text: "Otra…" }));
    ["ciudad", "ciudadOtra", "fechaFinal", "altura", "horaInicio", "horaFin", "tipoTrabajo", "descripcion", "procedimiento", "herramientas", "observaciones"]
      .forEach(function (id) { bindInput($(id), id); });
    function toggleOtra() { $("ciudadOtraWrap").classList.toggle("hidden", sel.value !== OTRO); }
    sel.addEventListener("change", toggleOtra); toggleOtra();
    $("fecha").value = S.fecha;
  }
  function ciudadTxt() { return S.ciudad === OTRO ? (S.ciudadOtra || "") : (S.ciudad || ""); }

  function defaults() {
    S.fecha = hoyCorta();                       // fecha corta automática
    if (!S.fechaFinal) S.fechaFinal = hoyISO(); // fecha final de ejecución (editable)
    if (!S.horaInicio) S.horaInicio = horaAhora();
  }

  function buildAll() {
    defaults();
    buildBasicos(); buildWorkers(); buildAptitud();
    buildChecklist("medidas", MEDIDAS, "med");
    buildChecklist("equipos", EQUIPOS, "eq");
    buildSistemas(); buildEpp(); buildPersonas();
  }

  // ---------- Validación ----------
  function validar() {
    var faltan = [];
    function mark(node, name) { if (node) node.classList.add("req-missing"); faltan.push({ node: node, name: name }); }
    if (!ciudadTxt()) mark(S.ciudad === OTRO ? $("ciudadOtra") : $("ciudad"), "Ciudad");
    if (!S.fechaFinal) mark($("fechaFinal"), "Fecha final del trabajo");
    if (!S.altura) mark($("altura"), "Altura");
    if (!S.tipoTrabajo) mark($("tipoTrabajo"), "Tipo de trabajo");
    if (!workerName(1)) mark($("w1_selN"), "Trabajador 1");
    if (faltan.length) {
      toast("Complete: " + faltan.map(function (f) { return f.name; }).join(", "), 5000);
      if (faltan[0].node) { faltan[0].node.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return false;
    }
    return true;
  }

  // ---------- Réplica del formato para PDF ----------
  function X(v, want) { return v === want ? "X" : ""; }
  function v(k) { return esc(S[k] || ""); }
  function header() {
    return '<table class="hdr"><colgroup><col style="width:15%"><col style="width:65%"><col style="width:20%"></colgroup><tr>' +
      '<td><img src="' + (window.TSA_LOGO || "img/logo-mym.png") + '" alt=""></td>' +
      '<td class="c b" style="font-size:12px">PERMISO DE TRABAJO SEGURO EN ALTURAS</td>' +
      '<td class="c b" style="font-size:9px">VERSION: 04<br>FECHA:07/07/2025</td></tr></table>';
  }
  function sec(t, cols) { return '<tr><td class="sec" colspan="' + cols + '">' + esc(t) + "</td></tr>"; }
  function sigImg(k) { return S[k] ? '<img src="' + S[k] + '" alt="">' : ""; }
  function multi(k, minH) { return '<td class="multi g" style="min-height:' + minH + 'px;height:' + minH + 'px">' + v(k) + "</td>"; }

  function page1() {
    var h = header();
    // 1
    h += '<table><colgroup><col style="width:22%"><col style="width:30%"><col style="width:38%"><col style="width:10%"></colgroup>';
    h += sec("1. Datos básicos del permiso de trabajo en alturas", 4);
    h += "<tr><td>Ciudad  Y Fecha</td><td class=\"g\" colspan=\"3\">" + esc(ciudadTxt()) + (ciudadTxt() ? ", " : "") + esc(S.fecha) + "</td></tr>";
    h += "<tr><td>Fecha final del Trabajo</td><td class=\"g\" colspan=\"3\">" + esc(isoACorta(S.fechaFinal)) + "</td></tr>";
    h += '<tr><td>Empresa:</td><td class="c">M &amp; M TORRES</td><td>Altura aproximada a la cual se va a desarrollar la actividad:</td><td class="g c">' + (S.altura ? v("altura") + " Mts" : "") + "</td></tr>";
    h += '<tr><td>Hora de inicio del Trabajo:</td><td class="g c">' + v("horaInicio") + '</td><td>Hora de finalización del trabajo:</td><td class="g c">' + v("horaFin") + "</td></tr>";
    h += '<tr><td colspan="4">Tipo de trabajo:</td></tr><tr><td class="g tall" colspan="4">' + v("tipoTrabajo") + "</td></tr></table>";
    // 2
    h += '<table><colgroup><col style="width:4%"><col style="width:25%"><col style="width:12%"><col style="width:15%">' +
      '<col style="width:3.5%"><col style="width:3.5%"><col style="width:3.5%"><col style="width:3.5%"><col style="width:7.5%"><col style="width:7.5%"><col style="width:7.5%"><col style="width:7.5%"></colgroup>';
    h += sec("2. Trabajadores, verificaciones de certificación y afiliación vigente", 12);
    h += '<tr><th rowspan="2">Nº</th><th rowspan="2">Nombre completo</th><th rowspan="2">C.C / C.E / P.A / P.T</th><th rowspan="2">Firma</th>' +
      '<th colspan="2">EPS</th><th colspan="2">ARL</th><th colspan="2" style="font-size:7.5px">Constancia de capacitación o certificado de competencia laboral</th><th colspan="2" style="font-size:7.5px">Verificación de puntos de anclaje por trabajador</th></tr>';
    h += "<tr><th>SI</th><th>NO</th><th>SI</th><th>NO</th><th>SI</th><th>NO</th><th>SI</th><th>NO</th></tr>";
    for (var i = 1; i <= N_WORKERS; i++) {
      var p = "w" + i + "_";
      h += '<tr><td class="c b">' + i + '</td><td class="g" style="font-size:8.5px">' + esc(workerName(i)) + '</td><td class="g c">' + esc(workerCC(i)) + '</td><td class="sig">' + sigImg(p + "firma") + "</td>";
      ["eps", "arl", "cons", "anc"].forEach(function (c) { h += '<td class="x">' + X(S[p + c], "SI") + '</td><td class="x">' + X(S[p + c], "NO") + "</td>"; });
      h += "</tr>";
    }
    h += "</table>";
    // 3
    h += '<table><colgroup><col style="width:55%">' + new Array(11).join('<col style="width:4.5%">') + "</colgroup>";
    h += sec("3. Verificación de requerimientos de aptitud", 11);
    h += '<tr><th rowspan="2">Pregunta</th><th colspan="5">SI</th><th colspan="5">NO</th></tr><tr>';
    for (var a = 0; a < 2; a++) for (var b = 1; b <= 5; b++) h += "<th>" + b + "</th>";
    h += "</tr>";
    APTITUD.forEach(function (q, qi) {
      h += "<tr><td>" + esc(q) + "</td>";
      for (var w = 1; w <= 5; w++) h += '<td class="x">' + X(S["apt" + qi + "_" + w], "SI") + "</td>";
      for (var w2 = 1; w2 <= 5; w2++) h += '<td class="x">' + X(S["apt" + qi + "_" + w2], "NO") + "</td>";
      h += "</tr>";
    });
    [["Hora de ultima comida", "comida_"], ["Tiempo descansado previo a las actividades ¿horas?", "descanso_"]].forEach(function (r) {
      h += "<tr><td>" + esc(r[0]) + "</td>";
      for (var w = 1; w <= 5; w++) h += '<td class="c" colspan="2" style="font-size:8px">' + (S[r[1] + w] ? w + ": " + v(r[1] + w) : "") + "</td>";
      h += "</tr>";
    });
    h += "</table>";
    // 4 y 5
    h += "<table>" + sec("4. Descripción de la tarea", 1) + "<tr>" + multi("descripcion", 34) + "</tr></table>";
    h += "<table>" + sec("5. Procedimiento de la tarea a realizar", 1) + "<tr>" + multi("procedimiento", 78) + "</tr></table>";
    // 6
    h += checklistTable("6. Medidas de prevención contra caídas", "Cumple", MEDIDAS, "med");
    return h;
  }

  function checklistTable(title, colTitle, items, pfx) {
    var h = '<table><colgroup><col style="width:40%"><col style="width:6.66%"><col style="width:6.66%"><col style="width:6.68%"><col style="width:40%"></colgroup>';
    h += sec(title, 5);
    h += '<tr><th rowspan="2">Ítems</th><th colspan="3">' + colTitle + '</th><th rowspan="2">Observación</th></tr><tr><th>SI</th><th>NO</th><th>N/A</th></tr>';
    items.forEach(function (it, j) {
      var lbl = esc(it);
      if (j === items.length - 1 && S[pfx + "_otro"]) lbl += " " + v(pfx + "_otro");
      var val = S[pfx + j];
      h += "<tr><td>" + lbl + '</td><td class="x">' + X(val, "SI") + '</td><td class="x">' + X(val, "NO") + '</td><td class="x">' + X(val, "N/A") + "</td><td>" + v(pfx + j + "_obs") + "</td></tr>";
    });
    return h + "</table>";
  }

  function page2() {
    var h = header();
    h += checklistTable("7. Equipos, sistema de acceso para trabajo en alturas.", "Apto para ser usado", EQUIPOS, "eq");
    // 8
    h += '<table><colgroup><col style="width:27%"><col style="width:6.3%"><col style="width:27%"><col style="width:6.3%"><col style="width:27%"><col style="width:6.4%"></colgroup>';
    h += sec("8. Sistemas", 6);
    h += '<tr><td colspan="6" class="c">Verifique el tipo de sistema a utilizar en la actividad y marque con <b>SI, NO o N/A</b></td></tr>';
    h += "<tr>" + SISTEMAS.map(function (g) { return '<th colspan="2">' + esc(g.t) + "</th>"; }).join("") + "</tr>";
    for (var r = 0; r < 4; r++) {
      h += "<tr>";
      SISTEMAS.forEach(function (g, gi) {
        var it = g.items[r];
        h += it ? "<td>" + esc(it) + '</td><td class="x">' + v("sis" + gi + "_" + r) + "</td>" : "<td></td><td></td>";
      });
      h += "</tr>";
    }
    h += "<tr>" + SISTEMAS.map(function (g, gi) {
      return '<td class="tall">Otro, ¿cuál? ' + v("sis" + gi + "_otro") + '</td><td class="x">' + v("sis" + gi + "_o") + "</td>";
    }).join("") + "</tr></table>";
    // 9
    h += '<table><colgroup><col style="width:19%"><col style="width:6%"><col style="width:19%"><col style="width:6%"><col style="width:19%"><col style="width:6%"><col style="width:19%"><col style="width:6%"></colgroup>';
    h += sec("9. Elementos de protección personal y elementos de protección contra caidas", 8);
    h += '<tr><td colspan="8">Si el personal cuenta con los siguientes EPP y EPCC, marque <b>SI</b>, de lo contrario <b>NO o N/A</b></td></tr>';
    for (var rr = 0; rr < 6; rr++) {
      h += "<tr>";
      EPP.forEach(function (col, ci) {
        if (rr < col.length) h += "<td>" + esc(col[rr]) + '</td><td class="x">' + v("epp" + ci + "_" + rr) + "</td>";
        else if (rr === col.length) h += "<td>Otro, ¿cuál? " + v("epp" + ci + "_otro") + '</td><td class="x">' + v("epp" + ci + "_o") + "</td>";
        else h += "<td></td><td></td>";
      });
      h += "</tr>";
    }
    h += "</table>";
    // 10, 11
    h += "<table>" + sec("10. Herramientas a utilizar", 1) + "<tr>" + multi("herramientas", 64) + "</tr>" +
      "<tr><td><b>Nota:</b> Mencione las herramientas a utilizar, de acuerdo a la actividad a ejecutar. Recuerde realizar el chequeo preoperacional y garantizar el buen estado de las mismas.</td></tr></table>";
    h += "<table>" + sec("11. Observaciones", 1) + "<tr>" + multi("observaciones", 64) + "</tr></table>";
    // 12-14
    PERSONAS.forEach(function (pp) {
      var k = "p_" + pp.k + "_";
      h += '<table><colgroup><col style="width:36.7%"><col style="width:26.6%"><col style="width:36.7%"></colgroup>' + sec(pp.t, 3) +
        "<tr><th>Nombre completo</th><th>CC</th><th>Firma</th></tr>" +
        '<tr><td class="g">' + v(k + "nombre") + '</td><td class="g c">' + v(k + "cc") + '</td><td class="sig">' + sigImg(k + "firma") + "</td></tr></table>";
    });
    return h;
  }

  function fileName() {
    var c = ciudadTxt().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return "Permiso_Alturas_" + S.fecha.split("/").reverse().join("-") + (c ? "_" + c : "") + "_" + horaAhora().replace(":", "") + ".pdf";
  }

  function renderPdf() {
    var host = $("pdfHost");
    host.innerHTML = '<div class="sheet" id="pg1">' + page1() + '</div><div class="sheet" id="pg2">' + page2() + "</div>";
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait", compress: true });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    var pages = [$("pg1"), $("pg2")];
    var chain = Promise.resolve();
    pages.forEach(function (pg, idx) {
      chain = chain.then(function () {
        return html2canvas(pg, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true, windowWidth: 900 });
      }).then(function (cv) {
        if (idx > 0) doc.addPage();
        var img = cv.toDataURL("image/jpeg", 0.9);
        var ratio = Math.min(W / cv.width, H / cv.height);
        var w = cv.width * ratio, h = cv.height * ratio;
        doc.addImage(img, "JPEG", (W - w) / 2, 0, w, h);
      });
    });
    return chain.then(function () {
      doc.setProperties({ title: "Permiso de Trabajo Seguro en Alturas", subject: ciudadTxt() + " " + S.fecha, author: "M & M TORRES" });
      host.innerHTML = "";
      return doc.output("blob");
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1]); };
      r.onerror = rej; r.readAsDataURL(blob);
    });
  }

  function asunto() { return "Permiso de Trabajo en Alturas - " + ciudadTxt() + " - " + S.fecha + (S.tipoTrabajo ? " - " + S.tipoTrabajo : ""); }
  function cuerpo() {
    var ws = [];
    for (var i = 1; i <= N_WORKERS; i++) if (workerName(i)) ws.push("  " + i + ". " + workerName(i) + " - CC " + workerCC(i));
    return "Cordial saludo,\n\nSe envía el Permiso de Trabajo Seguro en Alturas (PDF adjunto).\n\n" +
      "Ciudad y fecha: " + ciudadTxt() + ", " + S.fecha + "\n" +
      "Fecha final del trabajo: " + isoACorta(S.fechaFinal) + "\n" +
      "Tipo de trabajo: " + (S.tipoTrabajo || "") + "\n" +
      "Altura aproximada: " + (S.altura || "") + " Mts\n" +
      "Hora inicio / fin: " + (S.horaInicio || "") + " / " + (S.horaFin || "") + "\n" +
      "Trabajadores:\n" + (ws.join("\n") || "  -") + "\n\nM & M TORRES";
  }

  var lastPdf = null;
  function makePdf() {
    var sig = JSON.stringify(S);
    if (lastPdf && lastPdf.sig === sig) return Promise.resolve(lastPdf);
    busy(true, "Generando PDF…");
    return renderPdf().then(function (blob) {
      lastPdf = { sig: sig, blob: blob, name: fileName() };
      return lastPdf;
    }).finally(function () { busy(false); });
  }

  function onPdf() {
    if (!validar()) return;
    makePdf().then(function (p) { download(p.blob, p.name); toast("PDF guardado: " + p.name); })
      .catch(function (e) { console.error(e); toast("No se pudo generar el PDF. Intente de nuevo."); });
  }

  function enviarManual(p) {
    var file = null;
    try { file = new File([p.blob], p.name, { type: "application/pdf" }); } catch (e) { /* navegador antiguo */ }
    var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (esMovil && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { navigator.clipboard && navigator.clipboard.writeText(DESTINO); } catch (e) { /* opcional */ }
      return navigator.share({ files: [file], title: asunto(), text: "Para: " + DESTINO + "\n\n" + cuerpo() })
        .then(function () { toast("Elija su app de correo y envíe a " + DESTINO + " (copiado).", 6000); })
        .catch(function (e) { if (e && e.name === "AbortError") return; mailtoFallback(p); });
    }
    mailtoFallback(p);
    return Promise.resolve();
  }
  function mailtoFallback(p) {
    download(p.blob, p.name);
    var href = "mailto:" + DESTINO + "?subject=" + encodeURIComponent(asunto()) +
      "&body=" + encodeURIComponent(cuerpo() + "\n\n(Adjunte el archivo " + p.name + " que se acaba de descargar.)");
    setTimeout(function () { location.href = href; }, 400);
    toast("Se descargó el PDF. Adjúntelo en el correo que se abrió para " + DESTINO + ".", 7000);
  }

  function onEnviar() {
    if (!validar()) return;
    makePdf().then(function (p) {
      var url = (CFG.urlEnvioCorreo || "").trim();
      if (!url) return enviarManual(p);
      busy(true, "Enviando correo a " + DESTINO + "…");
      return blobToBase64(p.blob).then(function (b64) {
        return fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ to: DESTINO, subject: asunto(), body: cuerpo(), filename: p.name, pdf: b64 })
        });
      }).then(function (r) { return r.json(); }).then(function (j) {
        busy(false);
        if (j && j.ok) toast("✔ Enviado a " + DESTINO, 5000);
        else throw new Error((j && j.error) || "Error del servidor");
      }).catch(function (e) {
        busy(false); console.error(e);
        toast("No se pudo enviar automáticamente. Se abrirá el envío manual.", 4000);
        return enviarManual(p);
      });
    }).catch(function (e) { busy(false); console.error(e); toast("No se pudo generar el PDF. Intente de nuevo."); });
  }

  function onNuevo() {
    if (!confirm("¿Borrar todos los datos y empezar un permiso nuevo?")) return;
    S = {}; lastPdf = null; save(); buildAll(); window.scrollTo(0, 0);
  }

  // ---------- Inicio ----------
  function init() {
    S = load() || {};
    initSigPad();
    buildAll();
    $("btnPdf").addEventListener("click", onPdf);
    $("btnEnviar").addEventListener("click", onEnviar);
    $("btnNuevo").addEventListener("click", onNuevo);
    loadPersonal().then(function (fromExcel) {
      sortPersonal();
      $("personalInfo").textContent = personal.length + " persona(s) en el listado" + (fromExcel ? " (LISTADO_PERSONAL.xlsx)" : "") +
        ". Al escoger el nombre, la C.C se llena sola (y viceversa).";
      buildWorkers(); buildPersonas();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  // API mínima para pruebas
  window.__TSA = { state: function () { return S; }, makePdf: makePdf };
})();
