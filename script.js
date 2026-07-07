/*
  Dotzy - Practica Braille
  Autor: siestaa42002-code
  Repositorio: https://github.com/siestaa42002-code/braille-practica
  Sitio: https://dotzy.netlify.app
  Licencia: MIT
*/// ===========================================================================
// Estado global
// ===========================================================================

const STORAGE = {
  tema: "braille:tema",
  idioma: "braille:idioma",
  racha: "braille:racha",
  mejorRacha: "braille:mejorRacha",
  totalIntentos: "braille:total",
  totalAciertos: "braille:aciertos",
  sonido: "braille:sonido",
  statsPorModo: "braille:statsPorModo",
  memoriaAprender: "braille:memoriaAprender",
  mejorReto: "braille:mejorReto",
};

const estado = {
  tema: localStorage.getItem(STORAGE.tema) || "claro",
  idioma: localStorage.getItem(STORAGE.idioma) || "es",
  vistaActiva: "alfabeto",
  categoria: "letras",
  racha: parseInt(localStorage.getItem(STORAGE.racha), 10) || 0,
  mejorRacha: parseInt(localStorage.getItem(STORAGE.mejorRacha), 10) || 0,
  totalIntentos: parseInt(localStorage.getItem(STORAGE.totalIntentos), 10) || 0,
  totalAciertos: parseInt(localStorage.getItem(STORAGE.totalAciertos), 10) || 0,
  sonidoActivo: localStorage.getItem(STORAGE.sonido) !== "off",
  statsPorModo: JSON.parse(localStorage.getItem(STORAGE.statsPorModo) || '{"aprender":{"aciertos":0,"intentos":0},"escribir":{"aciertos":0,"intentos":0},"dictado":{"aciertos":0,"intentos":0},"reto":{"aciertos":0,"intentos":0}}'),
  memoriaAprender: JSON.parse(localStorage.getItem(STORAGE.memoriaAprender) || "{}"),
  mejorReto: parseInt(localStorage.getItem(STORAGE.mejorReto), 10) || 0,
  aprender: { nivel: 1, caracterActual: null },
  escribir: { caracterActual: null, puntosActivos: new Set() },
  dictado: { palabraActual: "", celdas: [], indiceActivo: 0 },
  reto: { activo: false, tiempoRestante: 60, aciertos: 0, fallos: 0, caracterActual: null, intervalo: null },
};

window.estado = estado;

// ===========================================================================
// Helpers
// ===========================================================================

function anunciar(mensaje) {
  const el = document.getElementById("anuncioSr");
  if (el) el.textContent = mensaje;
}

function mostrarToast(mensaje, duracion = 2200) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("visible");
  clearTimeout(mostrarToast._timeout);
  mostrarToast._timeout = setTimeout(() => toast.classList.remove("visible"), duracion);
}

function elementoAleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function crearCeldaBraille(puntosActivos = [], { interactiva = false, tamano = "normal" } = {}) {
  const contenedor = document.createElement("div");
  contenedor.className = tamano === "grande" ? "celda-grande" : tamano === "alfabeto" ? "alfabeto-celda" : "celda";
  if (interactiva) contenedor.classList.add("celda-editable");

  const orden = [1, 4, 2, 5, 3, 6];
  orden.forEach((numero) => {
    const punto = interactiva ? document.createElement("button") : document.createElement("span");
    punto.className = "punto";
    if (puntosActivos.includes(numero)) punto.classList.add("activo");
    punto.dataset.punto = numero;
    if (interactiva) {
      punto.type = "button";
      punto.setAttribute("aria-label", `Punto ${numero}, ${puntosActivos.includes(numero) ? "activo" : "inactivo"}`);
      punto.setAttribute("aria-pressed", puntosActivos.includes(numero));
    }
    contenedor.appendChild(punto);
  });

  return contenedor;
}

// ===========================================================================
// Sistema de audio con Web Audio API
// ===========================================================================

let audioCtx = null;

function inicializarAudio() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    audioCtx = null;
  }
  return audioCtx;
}

function reproducirTono(frecuencia, duracion, tipo = "sine", volumen = 0.15) {
  if (!estado.sonidoActivo) return;
  const ctx = inicializarAudio();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = frecuencia;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volumen, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duracion);
  } catch (e) {}
}

function sonidoAcierto() {
  reproducirTono(660, 0.08, "sine", 0.12);
  setTimeout(() => reproducirTono(880, 0.14, "sine", 0.12), 60);
}

function sonidoFallo() {
  reproducirTono(220, 0.18, "sine", 0.1);
}

// ===========================================================================
// Stats por modo
// ===========================================================================

function guardarStatsPorModo() {
  localStorage.setItem(STORAGE.statsPorModo, JSON.stringify(estado.statsPorModo));
}

function registrarStatModo(modo, acierto) {
  if (!estado.statsPorModo[modo]) {
    estado.statsPorModo[modo] = { aciertos: 0, intentos: 0 };
  }
  estado.statsPorModo[modo].intentos++;
  if (acierto) estado.statsPorModo[modo].aciertos++;
  guardarStatsPorModo();
  actualizarBadgesModo();
}

function actualizarBadgesModo() {
  const modos = ["aprender", "escribir", "dictado", "reto"];
  modos.forEach((modo) => {
    const badge = document.querySelector(`[data-modo-badge="${modo}"]`);
    if (badge) {
      const stats = estado.statsPorModo[modo];
      if (stats && stats.intentos > 0) {
        badge.textContent = stats.intentos;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  });
}

// ===========================================================================
// Repetición espaciada
// ===========================================================================

function guardarMemoriaAprender() {
  localStorage.setItem(STORAGE.memoriaAprender, JSON.stringify(estado.memoriaAprender));
}

function registrarResultadoMemoria(caracter, acierto) {
  if (!estado.memoriaAprender[caracter]) {
    estado.memoriaAprender[caracter] = { aciertos: 0, fallos: 0, peso: 1 };
  }
  const m = estado.memoriaAprender[caracter];
  if (acierto) {
    m.aciertos++;
    m.peso = Math.max(0.3, m.peso - 0.2);
  } else {
    m.fallos++;
    m.peso = Math.min(5, m.peso + 0.8);
  }
  guardarMemoriaAprender();
}

function elegirCaracterPonderado(caracteres) {
  const pesos = caracteres.map((c) => {
    const m = estado.memoriaAprender[c];
    if (!m) return 2;
    return m.peso;
  });
  const total = pesos.reduce((s, p) => s + p, 0);
  let r = Math.random() * total;
  for (let i = 0; i < caracteres.length; i++) {
    r -= pesos[i];
    if (r <= 0) return caracteres[i];
  }
  return caracteres[caracteres.length - 1];
}

// ===========================================================================
// Estadísticas
// ===========================================================================

function guardarEstadisticas() {
  localStorage.setItem(STORAGE.racha, estado.racha);
  localStorage.setItem(STORAGE.mejorRacha, estado.mejorRacha);
  localStorage.setItem(STORAGE.totalIntentos, estado.totalIntentos);
  localStorage.setItem(STORAGE.totalAciertos, estado.totalAciertos);
  actualizarStatsDOM();
}

function actualizarStatsDOM() {
  const r = document.getElementById("statRacha");
  const m = document.getElementById("statMejor");
  const a = document.getElementById("statAciertos");
  if (r) r.textContent = estado.racha;
  if (m) m.textContent = estado.mejorRacha;
  if (a) {
    a.textContent = estado.totalIntentos === 0 ? "0%" : Math.round((estado.totalAciertos / estado.totalIntentos) * 100) + "%";
  }
}

function registrarAcierto() {
  estado.racha++;
  if (estado.racha > estado.mejorRacha) estado.mejorRacha = estado.racha;
  estado.totalIntentos++;
  estado.totalAciertos++;
  guardarEstadisticas();
}

function registrarFallo() {
  estado.racha = 0;
  estado.totalIntentos++;
  guardarEstadisticas();
}

// ===========================================================================
// Cambio de vista
// ===========================================================================

function cambiarVista(vista) {
  document.querySelectorAll(".nav-item[data-view]").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  const btn = document.querySelector(`.nav-item[data-view="${vista}"]`);
  if (btn) {
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
  }
  estado.vistaActiva = vista;

  document.querySelectorAll(".vista").forEach((v) => v.classList.add("hidden"));
  const mapa = {
    alfabeto: "vistaAlfabeto",
    aprender: "vistaAprender",
    escribir: "vistaEscribir",
    dictado: "vistaDictado",
    traductor: "vistaTraductor",
    cronometro: "vistaCronometro",
  };
  const target = document.getElementById(mapa[vista]);
  if (target) target.classList.remove("hidden");

  if (vista === "aprender") siguienteEjercicioAprender();
  if (vista === "escribir") siguienteEjercicioEscribir();
  if (vista === "dictado") siguienteDictado();
}

function inicializarToggleVista() {
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => cambiarVista(btn.dataset.view));
  });
}

// ===========================================================================
// Vista: Alfabeto
// ===========================================================================

function renderAlfabeto() {
  const catalogo = obtenerCatalogo(estado.idioma);
  const items = catalogo[estado.categoria] || catalogo.letras;
  const grid = document.getElementById("alfabetoGrid");
  grid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "alfabeto-item";
    card.dataset.caracter = item.caracter;

    const letra = document.createElement("span");
    letra.className = "alfabeto-letra";
    letra.textContent = item.caracter;
    card.appendChild(letra);

    const celdaMini = crearCeldaBraille(item.puntos, { tamano: "alfabeto" });
    card.appendChild(celdaMini);

    card.setAttribute("aria-label", `${nombreCaracter(item.caracter)}, ${item.puntos.join(", ")}`);
    card.addEventListener("click", () => destacarCaracter(item));
    card.addEventListener("mouseenter", () => destacarCaracter(item, false));

    grid.appendChild(card);
  });
}

function destacarCaracter(item, marcarActivo = true) {
  if (marcarActivo) {
    document.querySelectorAll(".alfabeto-item").forEach((c) => c.classList.remove("activo"));
    const card = document.querySelector(`[data-caracter="${item.caracter}"]`);
    if (card) card.classList.add("activo");
  }

  const panel = document.getElementById("caracterDestacado");
  panel.hidden = false;

  const celdaContenedor = document.getElementById("celdaDestacada");
  celdaContenedor.innerHTML = "";
  const orden = [1, 4, 2, 5, 3, 6];
  orden.forEach((numero) => {
    const punto = document.createElement("span");
    punto.className = "punto";
    if (item.puntos.includes(numero)) punto.classList.add("activo");
    celdaContenedor.appendChild(punto);
  });

  document.getElementById("caracterTexto").textContent = item.caracter;
  document.getElementById("puntosTexto").textContent = `Puntos ${item.puntos.join(" · ")}`;
  document.getElementById("notaTexto").textContent = item.nota || "";
}

function inicializarFiltrosAlfabeto() {
  document.querySelectorAll(".filtro[data-categoria]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro[data-categoria]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      estado.categoria = btn.dataset.categoria;
      renderAlfabeto();
      document.getElementById("caracterDestacado").hidden = true;
    });
  });
}

// ===========================================================================
// Vista: Aprender
// ===========================================================================

function siguienteEjercicioAprender() {
  const caracteres = obtenerCaracteresPorNivel(estado.aprender.nivel, estado.idioma);
  const caracter = elegirCaracterPonderado(caracteres);
  estado.aprender.caracterActual = caracter;

  const puntos = obtenerPuntos(caracter, estado.idioma);
  const contenedor = document.getElementById("celdaAprender");
  contenedor.innerHTML = "";
  const orden = [1, 4, 2, 5, 3, 6];
  orden.forEach((numero) => {
    const punto = document.createElement("span");
    punto.className = "punto";
    if (puntos.includes(numero)) punto.classList.add("activo");
    contenedor.appendChild(punto);
  });

  const distractores = caracteres.filter((c) => c !== caracter);
  const distractoresAleatorios = [];
  while (distractoresAleatorios.length < 3 && distractores.length > 0) {
    const idx = Math.floor(Math.random() * distractores.length);
    distractoresAleatorios.push(distractores.splice(idx, 1)[0]);
  }
  const opciones = [caracter, ...distractoresAleatorios].sort(() => Math.random() - 0.5);

  const opcionesEl = document.getElementById("opcionesAprender");
  opcionesEl.innerHTML = "";
  opciones.forEach((op) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "opcion-btn";
    btn.textContent = op;
    btn.setAttribute("aria-label", nombreCaracter(op));
    btn.addEventListener("click", () => responderAprender(op, btn));
    opcionesEl.appendChild(btn);
  });

  document.getElementById("feedbackAprender").textContent = "";
  document.getElementById("feedbackAprender").className = "feedback";
  anunciar(t("anuncioNuevaCelda"));
}

function responderAprender(seleccion, boton) {
  const correcto = estado.aprender.caracterActual;
  const feedback = document.getElementById("feedbackAprender");
  document.querySelectorAll("#opcionesAprender .opcion-btn").forEach((b) => b.disabled = true);

  if (seleccion === correcto) {
    boton.classList.add("correcta");
    feedback.textContent = t("feedbackCorrecto");
    feedback.className = "feedback acierto";
    registrarAcierto();
    registrarStatModo("aprender", true);
    registrarResultadoMemoria(correcto, true);
    sonidoAcierto();
    anunciar(`${t("anuncioCorrecto")} ${nombreCaracter(correcto)}.`);
    setTimeout(siguienteEjercicioAprender, 900);
  } else {
    boton.classList.add("incorrecta");
    document.querySelectorAll("#opcionesAprender .opcion-btn").forEach((b) => {
      if (b.textContent === correcto) b.classList.add("correcta");
    });
    feedback.textContent = `${t("feedbackEra")} ${correcto.toUpperCase()}`;
    feedback.className = "feedback fallo";
    registrarFallo();
    registrarStatModo("aprender", false);
    registrarResultadoMemoria(correcto, false);
    sonidoFallo();
    anunciar(`${t("anuncioIncorrecto")} ${nombreCaracter(correcto)}.`);
    setTimeout(siguienteEjercicioAprender, 1600);
  }
}

// ===========================================================================
// Vista: Escribir
// ===========================================================================

function siguienteEjercicioEscribir() {
  const caracteres = obtenerCaracteresPorNivel(3, estado.idioma);
  const caracter = elementoAleatorio(caracteres);
  estado.escribir.caracterActual = caracter;
  estado.escribir.puntosActivos = new Set();

  document.getElementById("promptEscribir").textContent = caracter;
  renderCeldaEscribir();
  document.getElementById("feedbackEscribir").textContent = "";
  document.getElementById("feedbackEscribir").className = "feedback";

  anunciar(`${t("anuncioEscribir")} ${nombreCaracter(caracter)}.`);
}

function renderCeldaEscribir() {
  const contenedor = document.getElementById("celdaEscribir");
  contenedor.innerHTML = "";
  const orden = [1, 4, 2, 5, 3, 6];
  orden.forEach((numero) => {
    const punto = document.createElement("button");
    punto.type = "button";
    punto.className = "punto";
    punto.dataset.punto = numero;
    if (estado.escribir.puntosActivos.has(numero)) punto.classList.add("activo");
    punto.setAttribute("aria-pressed", estado.escribir.puntosActivos.has(numero));
    punto.addEventListener("click", () => {
      if (estado.escribir.puntosActivos.has(numero)) {
        estado.escribir.puntosActivos.delete(numero);
      } else {
        estado.escribir.puntosActivos.add(numero);
      }
      renderCeldaEscribir();
    });
    contenedor.appendChild(punto);
  });
}

function comprobarEscribir() {
  const correcto = obtenerPuntos(estado.escribir.caracterActual, estado.idioma);
  const propuesta = [...estado.escribir.puntosActivos].sort();
  const correctoOrdenado = [...correcto].sort();
  const acierta = JSON.stringify(propuesta) === JSON.stringify(correctoOrdenado);

  const feedback = document.getElementById("feedbackEscribir");
  if (acierta) {
    feedback.textContent = t("feedbackCorrectoSig");
    feedback.className = "feedback acierto";
    registrarAcierto();
    registrarStatModo("escribir", true);
    sonidoAcierto();
    anunciar(t("feedbackCorrecto"));
    setTimeout(siguienteEjercicioEscribir, 1100);
  } else {
    feedback.textContent = `${t("feedbackErroneoPuntos")} ${correcto.join(", ")}.`;
    feedback.className = "feedback fallo";
    registrarFallo();
    registrarStatModo("escribir", false);
    sonidoFallo();
  }
}

function limpiarEscribir() {
  estado.escribir.puntosActivos = new Set();
  renderCeldaEscribir();
  document.getElementById("feedbackEscribir").textContent = "";
  document.getElementById("feedbackEscribir").className = "feedback";
}

function configurarAtajosEscribir() {
  const mapa = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
  document.addEventListener("keydown", (e) => {
    if (estado.vistaActiva !== "escribir") return;
    if (document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "INPUT") return;
    const tecla = e.key.toLowerCase();
    if (mapa[tecla]) {
      e.preventDefault();
      const num = mapa[tecla];
      if (estado.escribir.puntosActivos.has(num)) {
        estado.escribir.puntosActivos.delete(num);
      } else {
        estado.escribir.puntosActivos.add(num);
      }
      renderCeldaEscribir();
    } else if (e.key === "Enter") {
      e.preventDefault();
      comprobarEscribir();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      limpiarEscribir();
    }
  });
}

// ===========================================================================
// Vista: Dictado
// ===========================================================================

function siguienteDictado() {
  const palabras = IDIOMAS[estado.idioma].palabrasDictado;
  estado.dictado.palabraActual = elementoAleatorio(palabras);
  estado.dictado.celdas = estado.dictado.palabraActual.split("").map(() => new Set());
  estado.dictado.indiceActivo = 0;

  document.getElementById("palabraActual").textContent = `${estado.dictado.palabraActual.length} ${t("sufijoCaracteres")}`;
  renderCeldasDictado();
  document.getElementById("feedbackDictado").textContent = "";
  document.getElementById("feedbackDictado").className = "feedback";

  reproducirPalabra();
}

function renderCeldasDictado() {
  const contenedor = document.getElementById("celdasDictado");
  contenedor.innerHTML = "";
  estado.dictado.celdas.forEach((puntos, i) => {
    const celda = crearCeldaBraille([...puntos], { interactiva: true });
    if (i === estado.dictado.indiceActivo) {
      celda.style.borderColor = "var(--dorado)";
      celda.style.boxShadow = "0 0 0 3px rgba(255, 214, 10, 0.2)";
    }
    celda.dataset.indice = i;
    celda.querySelectorAll(".punto").forEach((p) => {
      const numero = parseInt(p.dataset.punto, 10);
      p.addEventListener("click", (e) => {
        e.stopPropagation();
        if (estado.dictado.celdas[i].has(numero)) {
          estado.dictado.celdas[i].delete(numero);
        } else {
          estado.dictado.celdas[i].add(numero);
        }
        estado.dictado.indiceActivo = i;
        renderCeldasDictado();
      });
    });
    celda.addEventListener("click", () => {
      estado.dictado.indiceActivo = i;
      renderCeldasDictado();
    });
    contenedor.appendChild(celda);
  });
}

function reproducirPalabra() {
  if (!("speechSynthesis" in window)) {
    document.getElementById("palabraActual").textContent = estado.dictado.palabraActual;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(estado.dictado.palabraActual);
  utterance.lang = IDIOMAS[estado.idioma].codigoVoz;
  utterance.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function comprobarDictado() {
  const palabra = estado.dictado.palabraActual;
  let aciertos = 0;
  const total = palabra.length;

  for (let i = 0; i < palabra.length; i++) {
    const ch = palabra[i].toLowerCase();
    const correcto = obtenerPuntos(ch, estado.idioma) || [];
    const propuesta = [...estado.dictado.celdas[i]].sort();
    if (JSON.stringify(propuesta) === JSON.stringify([...correcto].sort())) {
      aciertos++;
    }
  }

  const feedback = document.getElementById("feedbackDictado");
  if (aciertos === total) {
    feedback.textContent = t("feedbackPerfecto", { n: total });
    feedback.className = "feedback acierto";
    registrarAcierto();
    registrarStatModo("dictado", true);
    sonidoAcierto();
    document.getElementById("palabraActual").textContent = `"${palabra}"`;
    setTimeout(siguienteDictado, 2500);
  } else {
    feedback.textContent = `${t("feedbackParcial", { a: aciertos, t: total })} "${palabra}".`;
    feedback.className = "feedback fallo";
    registrarFallo();
    registrarStatModo("dictado", false);
    sonidoFallo();
    document.getElementById("palabraActual").textContent = `"${palabra}"`;
  }
}

// ===========================================================================
// Vista: Traductor
// ===========================================================================

function inicializarTraductor() {
  const textarea = document.getElementById("traductorTexto");
  const salida = document.getElementById("traductorBraille");

  const traducirAhora = () => {
    salida.textContent = textoABraille(textarea.value, estado.idioma);
  };

  textarea.addEventListener("input", traducirAhora);

  textarea.value = t("ejemploTexto");
  traducirAhora();

  document.getElementById("btnCopiarBraille").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(salida.textContent);
      mostrarToast(t("toastCopiado"));
    } catch (e) {
      mostrarToast(t("toastNoCopia"));
    }
  });

  window._retraducirTraductor = () => {
    textarea.value = t("ejemploTexto");
    traducirAhora();
  };
}

// ===========================================================================
// Vista: Reto
// ===========================================================================

function iniciarReto() {
  estado.reto.activo = true;
  estado.reto.tiempoRestante = 60;
  estado.reto.aciertos = 0;
  estado.reto.fallos = 0;

  document.getElementById("retoAciertos").textContent = 0;
  document.getElementById("retoFallos").textContent = 0;
  document.getElementById("retoTiempo").textContent = 60;

  const area = document.getElementById("retoArea");
  area.innerHTML = `
    <div class="celda-grande" id="celdaReto"></div>
    <p class="pregunta">${t("preguntaCaracter")}</p>
    <div id="opcionesReto" class="opciones"></div>
  `;

  siguienteEjercicioReto();

  estado.reto.intervalo = setInterval(() => {
    estado.reto.tiempoRestante--;
    document.getElementById("retoTiempo").textContent = estado.reto.tiempoRestante;
    if (estado.reto.tiempoRestante <= 0) terminarReto();
  }, 1000);
}

function siguienteEjercicioReto() {
  const caracteres = obtenerCaracteresPorNivel(3, estado.idioma);
  const caracter = elementoAleatorio(caracteres);
  estado.reto.caracterActual = caracter;

  const puntos = obtenerPuntos(caracter, estado.idioma);
  const contenedor = document.getElementById("celdaReto");
  contenedor.innerHTML = "";
  const orden = [1, 4, 2, 5, 3, 6];
  orden.forEach((numero) => {
    const punto = document.createElement("span");
    punto.className = "punto";
    if (puntos.includes(numero)) punto.classList.add("activo");
    contenedor.appendChild(punto);
  });

  const distractores = caracteres.filter((c) => c !== caracter);
  const distractoresAleatorios = [];
  while (distractoresAleatorios.length < 3 && distractores.length > 0) {
    const idx = Math.floor(Math.random() * distractores.length);
    distractoresAleatorios.push(distractores.splice(idx, 1)[0]);
  }
  const opciones = [caracter, ...distractoresAleatorios].sort(() => Math.random() - 0.5);

  const opcionesEl = document.getElementById("opcionesReto");
  opcionesEl.innerHTML = "";
  opciones.forEach((op) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "opcion-btn";
    btn.textContent = op;
    btn.addEventListener("click", () => responderReto(op));
    opcionesEl.appendChild(btn);
  });
}

function responderReto(seleccion) {
  if (seleccion === estado.reto.caracterActual) {
    estado.reto.aciertos++;
    document.getElementById("retoAciertos").textContent = estado.reto.aciertos;
    registrarStatModo("reto", true);
    sonidoAcierto();
  } else {
    estado.reto.fallos++;
    document.getElementById("retoFallos").textContent = estado.reto.fallos;
    registrarStatModo("reto", false);
    sonidoFallo();
  }
  siguienteEjercicioReto();
}

function terminarReto() {
  clearInterval(estado.reto.intervalo);
  estado.reto.activo = false;

  const puntaje = estado.reto.aciertos;
  const esRecord = puntaje > estado.mejorReto;
  if (esRecord) {
    estado.mejorReto = puntaje;
    localStorage.setItem(STORAGE.mejorReto, puntaje);
  }

  const mensajeRecord = esRecord && puntaje > 0
    ? `<p style="color: var(--dorado-texto); font-weight: 600; margin-bottom: 1.5rem;">${t("nuevoRecord")}</p>`
    : estado.mejorReto > 0
      ? `<p style="color: var(--texto-tenue); font-size: 0.9rem; margin-bottom: 1.5rem;">${t("tuRecord")}: ${estado.mejorReto}</p>`
      : "";

  const area = document.getElementById("retoArea");
  area.innerHTML = `
    <div style="text-align: center;">
      <p style="font-family: var(--geist); font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">
        ${t("retoTerminado")}
      </p>
      <p style="color: var(--texto-medio); margin-bottom: 0.75rem; font-size: 1.15rem;">
        ${t("retoFinal", { a: estado.reto.aciertos, f: estado.reto.fallos })}
      </p>
      ${mensajeRecord}
      <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
        <button id="btnReiniciarReto" class="btn-primario btn-grande" type="button">${t("btnVolver")}</button>
        <button id="btnCompartirReto" class="btn-fantasma btn-grande" type="button">${t("btnCompartir")}</button>
      </div>
    </div>
  `;
  document.getElementById("btnReiniciarReto").addEventListener("click", iniciarReto);
  document.getElementById("btnCompartirReto").addEventListener("click", compartirReto);

  if (esRecord && puntaje > 0) {
    sonidoAcierto();
    setTimeout(sonidoAcierto, 200);
  }

  anunciar(`${t("anuncioRetoTerminado")} ${estado.reto.aciertos}, ${estado.reto.fallos}.`);
}

async function compartirReto() {
  const puntaje = estado.reto.aciertos;
  const fallos = estado.reto.fallos;
  const texto = t("textoCompartir", { a: puntaje, f: fallos });
  const url = "https://dotzy.netlify.app";

  const datos = {
    title: "Dotzy",
    text: texto,
    url: url,
  };

  if (navigator.share) {
    try {
      await navigator.share(datos);
      return;
    } catch (e) {
      // Usuario canceló o navegador no lo permitió
    }
  }

  try {
    await navigator.clipboard.writeText(`${texto}\n${url}`);
    mostrarToast(t("toastCopiado"));
  } catch (e) {
    mostrarToast(t("toastNoCopia"));
  }
}

// ===========================================================================
// Dropdowns
// ===========================================================================

function configurarDropdown(id, onChange) {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;
  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(".dropdown-menu");

  menu.addEventListener("click", (e) => {
    e.stopPropagation();
    const li = e.target.closest("li[data-value]");
    if (!li) return;
    const valor = li.dataset.value;
    const texto = li.textContent.trim();

    menu.querySelectorAll("li").forEach((item) => item.classList.remove("selected"));
    li.classList.add("selected");
    toggle.querySelector(".dropdown-value").textContent = texto;

    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");

    console.log(`[Dropdown ${id}] Cambio a:`, valor);
    onChange(valor);
  });

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const estaAbierto = dropdown.classList.contains("open");
    document.querySelectorAll(".dropdown.open").forEach((d) => {
      if (d !== dropdown) {
        d.classList.remove("open");
        d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      }
    });
    dropdown.classList.toggle("open", !estaAbierto);
    toggle.setAttribute("aria-expanded", !estaAbierto);
  });

  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      toggle.click();
      const primer = menu.querySelector("li");
      if (primer) primer.focus();
    }
  });

  menu.querySelectorAll("li").forEach((li, i, lista) => {
    li.tabIndex = 0;
    li.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        (lista[i + 1] || lista[0]).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        (lista[i - 1] || lista[lista.length - 1]).focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        li.click();
        toggle.focus();
      } else if (e.key === "Escape") {
        dropdown.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  });
}

// ===========================================================================
// Tema, easter egg y PWA
// ===========================================================================

function aplicarTema() {
  document.documentElement.setAttribute("data-theme", estado.tema);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", estado.tema === "claro" ? "#FAFAF7" : "#0A0A0C");
  const icono = document.getElementById("iconoTema");
  if (icono) icono.textContent = estado.tema === "claro" ? "◐" : "◑";
}

function renderFirmaBraille() {
  // Easter egg: el nombre Santiago en braille en el footer
  const nombre = "santiago";
  const braille = textoABraille(nombre, "es");
  const el = document.getElementById("firmaBraille");
  if (el) el.textContent = braille;
}

let deferredInstallPrompt = null;

function inicializarPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById("linkInstall").classList.remove("hidden");
  });

  const linkInstall = document.getElementById("linkInstall");
  if (linkInstall) {
    linkInstall.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === "accepted") {
        linkInstall.classList.add("hidden");
      }
      deferredInstallPrompt = null;
    });
  }
}

// ===========================================================================
// Sincronizar selección inicial
// ===========================================================================

function sincronizarDropdownIdiomaInicial() {
  document.querySelectorAll("#dropdownIdioma li").forEach((li) => {
    li.classList.toggle("selected", li.dataset.value === estado.idioma);
    if (li.dataset.value === estado.idioma) {
      const valor = li.dataset.value === "es" ? "ES" : "EN";
      document.querySelector("#dropdownIdioma .dropdown-value").textContent = valor;
    }
  });
}

// ===========================================================================
// Init
// ===========================================================================

function init() {
  const anio = document.getElementById("anioActual");
  if (anio) anio.textContent = new Date().getFullYear();

  aplicarTema();
  aplicarTraducciones();
  actualizarStatsDOM();
  actualizarBadgesModo();
  actualizarIconoSonido();
  sincronizarDropdownIdiomaInicial();
  renderFirmaBraille();

  renderAlfabeto();
  inicializarFiltrosAlfabeto();
  inicializarToggleVista();
  inicializarTraductor();

  configurarDropdown("dropdownIdioma", (valor) => {
    estado.idioma = valor;
    localStorage.setItem(STORAGE.idioma, valor);
    const dv = document.querySelector("#dropdownIdioma .dropdown-value");
    if (dv) dv.textContent = valor === "es" ? "ES" : "EN";
    aplicarTraducciones();
    renderAlfabeto();
    document.getElementById("caracterDestacado").hidden = true;
    if (estado.vistaActiva === "aprender") siguienteEjercicioAprender();
    if (estado.vistaActiva === "escribir") siguienteEjercicioEscribir();
    if (estado.vistaActiva === "dictado") siguienteDictado();
    if (typeof window._retraducirTraductor === "function") {
      window._retraducirTraductor();
    }
  });

  configurarDropdown("dropdownNivel", (valor) => {
    estado.aprender.nivel = parseInt(valor, 10);
    siguienteEjercicioAprender();
  });

  document.getElementById("btnTema").addEventListener("click", () => {
    estado.tema = estado.tema === "claro" ? "oscuro" : "claro";
    localStorage.setItem(STORAGE.tema, estado.tema);
    aplicarTema();
  });

  const btnSonido = document.getElementById("btnSonido");
  if (btnSonido) {
    btnSonido.addEventListener("click", () => {
      estado.sonidoActivo = !estado.sonidoActivo;
      localStorage.setItem(STORAGE.sonido, estado.sonidoActivo ? "on" : "off");
      actualizarIconoSonido();
      if (estado.sonidoActivo) {
        inicializarAudio();
        sonidoAcierto();
      }
    });
  }

  document.getElementById("btnComprobarEscribir").addEventListener("click", comprobarEscribir);
  document.getElementById("btnLimpiarEscribir").addEventListener("click", limpiarEscribir);
  document.getElementById("btnReproducir").addEventListener("click", reproducirPalabra);
  document.getElementById("btnComprobarDictado").addEventListener("click", comprobarDictado);
  document.getElementById("btnSaltarDictado").addEventListener("click", siguienteDictado);
  document.getElementById("btnIniciarReto").addEventListener("click", iniciarReto);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown.open").forEach((d) => {
        d.classList.remove("open");
        d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      });
    }
  });

  configurarAtajosEscribir();
  inicializarPWA();
}

function actualizarIconoSonido() {
  const icono = document.getElementById("iconoSonido");
  const btn = document.getElementById("btnSonido");
  if (icono) icono.textContent = estado.sonidoActivo ? "♪" : "♪̸";
  if (btn) {
    btn.style.opacity = estado.sonidoActivo ? "1" : "0.5";
    btn.setAttribute("aria-label", estado.sonidoActivo ? t("desactivarSonido") : t("activarSonido"));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}