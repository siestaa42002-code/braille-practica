// ===========================================================================
// Estado global
// ===========================================================================

const STORAGE = {
  tema: "braille:tema",
  idioma: "braille:idioma",
  racha: "braille:racha",
  mejorRacha: "braille:mejorRacha",
  totalIntentos: "braille:total",
  totalAciertos: "braille:aciertos",
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
  aprender: { nivel: 1, caracterActual: null },
  escribir: { caracterActual: null, puntosActivos: new Set() },
  dictado: { palabraActual: "", celdas: [], indiceActivo: 0 },
  reto: { activo: false, tiempoRestante: 60, aciertos: 0, fallos: 0, caracterActual: null, intervalo: null },
};

// ===========================================================================
// Helpers
// ===========================================================================

function anunciar(mensaje) {
  document.getElementById("anuncioSr").textContent = mensaje;
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
  document.getElementById("statRacha").textContent = estado.racha;
  document.getElementById("statMejor").textContent = estado.mejorRacha;
  const porcentaje = estado.totalIntentos === 0 ? "0%" : Math.round((estado.totalAciertos / estado.totalIntentos) * 100) + "%";
  document.getElementById("statAciertos").textContent = porcentaje;
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

function inicializarToggleVista() {
  document.querySelectorAll(".toggle-btn[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const vista = btn.dataset.view;
      document.querySelectorAll(".toggle-btn[data-view]").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
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
      document.getElementById(mapa[vista]).classList.remove("hidden");

      if (vista === "aprender") siguienteEjercicioAprender();
      if (vista === "escribir") siguienteEjercicioEscribir();
      if (vista === "dictado") siguienteDictado();
    });
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

    card.setAttribute("aria-label", `${nombreCaracter(item.caracter)}, puntos ${item.puntos.join(", ")}`);
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
  document.getElementById("puntosTexto").textContent = `Puntos ${item.puntos.join(", ")}`;
  document.getElementById("notaTexto").textContent = item.nota || "";
}

function inicializarFiltrosAlfabeto() {
  document.querySelectorAll(".filter-btn[data-categoria]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn[data-categoria]").forEach((b) => b.classList.remove("active"));
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
  const caracter = elementoAleatorio(caracteres);
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
  anunciar("Nueva celda. Identifica el caracter.");
}

function responderAprender(seleccion, boton) {
  const correcto = estado.aprender.caracterActual;
  const feedback = document.getElementById("feedbackAprender");
  document.querySelectorAll("#opcionesAprender .opcion-btn").forEach((b) => b.disabled = true);

  if (seleccion === correcto) {
    boton.classList.add("correcta");
    feedback.textContent = "Correcto";
    feedback.className = "feedback acierto";
    registrarAcierto();
    anunciar(`Correcto. Era ${nombreCaracter(correcto)}.`);
    setTimeout(siguienteEjercicioAprender, 900);
  } else {
    boton.classList.add("incorrecta");
    document.querySelectorAll("#opcionesAprender .opcion-btn").forEach((b) => {
      if (b.textContent === correcto) b.classList.add("correcta");
    });
    feedback.textContent = `Era ${correcto.toUpperCase()}`;
    feedback.className = "feedback fallo";
    registrarFallo();
    anunciar(`Incorrecto. Era ${nombreCaracter(correcto)}.`);
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

  anunciar(`Escribe el caracter ${nombreCaracter(caracter)} en braille.`);
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
    punto.setAttribute("aria-label", `Punto ${numero}, ${estado.escribir.puntosActivos.has(numero) ? "activo" : "inactivo"}`);
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
    feedback.textContent = "Correcto. Siguiente caracter en 1 segundo.";
    feedback.className = "feedback acierto";
    registrarAcierto();
    anunciar("Correcto.");
    setTimeout(siguienteEjercicioEscribir, 1100);
  } else {
    feedback.textContent = `Incorrecto. Eran los puntos ${correcto.join(", ")}.`;
    feedback.className = "feedback fallo";
    registrarFallo();
    anunciar(`Incorrecto. Eran los puntos ${correcto.join(" ")}.`);
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

  document.getElementById("palabraActual").textContent = `${estado.dictado.palabraActual.length} caracteres`;
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
      celda.style.outline = "2px solid var(--ambar)";
      celda.style.outlineOffset = "2px";
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
    mostrarToast("Tu navegador no soporta audio.");
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
    feedback.textContent = `Perfecto. Acertaste las ${total} letras.`;
    feedback.className = "feedback acierto";
    registrarAcierto();
    document.getElementById("palabraActual").textContent = `Era: "${palabra}"`;
    anunciar(`Perfecto. La palabra era ${palabra}.`);
    setTimeout(siguienteDictado, 2500);
  } else {
    feedback.textContent = `Acertaste ${aciertos} de ${total}. La palabra era "${palabra}".`;
    feedback.className = "feedback fallo";
    registrarFallo();
    document.getElementById("palabraActual").textContent = `Era: "${palabra}"`;
    anunciar(`Acertaste ${aciertos} de ${total}. La palabra era ${palabra}.`);
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

  textarea.value = estado.idioma === "es" ? "hola mundo" : "hello world";
  traducirAhora();

  document.getElementById("btnCopiarBraille").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(salida.textContent);
      mostrarToast("Braille copiado al portapapeles");
    } catch (e) {
      mostrarToast("No se pudo copiar");
    }
  });

  window._retraducirTraductor = () => {
    textarea.value = estado.idioma === "es" ? "hola mundo" : "hello world";
    traducirAhora();
  };
}

// ===========================================================================
// Vista: Reto cronometrado
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
    <p class="instruccion">¿Qué caracter es este?</p>
    <div id="opcionesReto" class="opciones-grid"></div>
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
  } else {
    estado.reto.fallos++;
    document.getElementById("retoFallos").textContent = estado.reto.fallos;
  }
  siguienteEjercicioReto();
}

function terminarReto() {
  clearInterval(estado.reto.intervalo);
  estado.reto.activo = false;

  const area = document.getElementById("retoArea");
  area.innerHTML = `
    <div style="text-align: center;">
      <p style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">
        Tiempo terminado
      </p>
      <p style="color: var(--texto-soft); margin-bottom: 2rem;">
        ${estado.reto.aciertos} aciertos · ${estado.reto.fallos} fallos
      </p>
      <button id="btnReiniciarReto" class="btn-primary btn-grande" type="button">Volver a jugar</button>
    </div>
  `;
  document.getElementById("btnReiniciarReto").addEventListener("click", iniciarReto);
  anunciar(`Reto terminado. ${estado.reto.aciertos} aciertos y ${estado.reto.fallos} fallos.`);
}

// ===========================================================================
// Dropdowns custom
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
    const texto = li.textContent.replace(/^✓\s*/, "").trim();

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
// Tema y PWA
// ===========================================================================

function aplicarTema() {
  document.documentElement.setAttribute("data-theme", estado.tema);
  document.querySelector('meta[name="theme-color"]').setAttribute(
    "content",
    estado.tema === "claro" ? "#F5F1E6" : "#14202B"
  );
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

  document.getElementById("linkInstall").addEventListener("click", async (e) => {
    e.preventDefault();
    if (!deferredInstallPrompt) {
      mostrarToast("Instalación no disponible en este navegador");
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === "accepted") {
      document.getElementById("linkInstall").classList.add("hidden");
    }
    deferredInstallPrompt = null;
  });
}

// ===========================================================================
// Init
// ===========================================================================

function init() {
  document.getElementById("anioActual").textContent = new Date().getFullYear();
  aplicarTema();
  actualizarStatsDOM();

  // Sincronizar selección inicial de idioma
  document.querySelectorAll("#dropdownIdioma li").forEach((li) => {
    li.classList.toggle("selected", li.dataset.value === estado.idioma);
    if (li.dataset.value === estado.idioma) {
      document.querySelector("#dropdownIdioma .dropdown-value").textContent = li.textContent;
    }
  });

  // Vistas iniciales
  renderAlfabeto();
  inicializarFiltrosAlfabeto();
  inicializarToggleVista();
  inicializarTraductor();

  // Dropdowns
  configurarDropdown("dropdownIdioma", (valor) => {
    estado.idioma = valor;
    localStorage.setItem(STORAGE.idioma, valor);
    document.documentElement.lang = valor;
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

  // Tema
  document.getElementById("btnTema").addEventListener("click", () => {
    estado.tema = estado.tema === "claro" ? "oscuro" : "claro";
    localStorage.setItem(STORAGE.tema, estado.tema);
    aplicarTema();
  });

  // Botones
  document.getElementById("btnComprobarEscribir").addEventListener("click", comprobarEscribir);
  document.getElementById("btnLimpiarEscribir").addEventListener("click", limpiarEscribir);
  document.getElementById("btnReproducir").addEventListener("click", reproducirPalabra);
  document.getElementById("btnComprobarDictado").addEventListener("click", comprobarDictado);
  document.getElementById("btnSaltarDictado").addEventListener("click", siguienteDictado);
  document.getElementById("btnIniciarReto").addEventListener("click", iniciarReto);

  // Cerrar dropdowns al hacer clic fuera
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}