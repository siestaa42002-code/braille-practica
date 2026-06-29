// Traducciones de toda la interfaz para español e inglés
const TRADUCCIONES = {
  es: {
    htmlLang: "es",
    metaDesc: "Aprende braille con ejercicios interactivos. Alfabeto, escritura, dictado y traductor.",
    pageTitle: "Practica Braille",

    cambiarTema: "Cambiar tema",

    cintilloHero: "Manual interactivo",
    heroTitular: "Aprende",
    heroTitularAcento: "braille",
    heroVolante: "Seis ejercicios para reconocer, escribir y oír el alfabeto. En español e inglés.",

    statRacha: "Racha",
    statMejor: "Mejor",
    statAciertos: "Aciertos",

    navAlfabeto: "Alfabeto",
    navAprender: "Aprender",
    navEscribir: "Escribir",
    navDictado: "Dictado",
    navTraductor: "Traductor",
    navCronometro: "Reto",

    seccionAlfabetoTitulo: "El alfabeto",
    seccionAlfabetoDesc: "Pasa el cursor o toca cualquier caracter para ver sus puntos.",
    filtroLetras: "Letras",
    filtroNumeros: "Números",
    filtroPuntuacion: "Puntuación",
    infoLabel: "Caracter",

    seccionAprenderTitulo: "Reconocer una celda",
    seccionAprenderDesc: "Identifica el caracter que corresponde a la celda mostrada.",
    nivelLabel: "Nivel",
    nivel1: "01 · Vocales",
    nivel2: "02 · Consonantes",
    nivel3: "03 · Alfabeto completo",
    nivel4: "04 · Con números",
    nivel5: "05 · Todo",
    preguntaCaracter: "¿Qué caracter es este?",
    feedbackCorrecto: "Correcto",
    feedbackEra: "Era",

    seccionEscribirTitulo: "Trazar los puntos",
    seccionEscribirDesc: "Activa los puntos correspondientes al caracter mostrado.",
    instruccionEscribir: "Activa los puntos correspondientes.",
    btnComprobar: "Comprobar",
    btnLimpiar: "Limpiar",
    feedbackCorrectoSig: "Correcto. Siguiente caracter en un segundo.",
    feedbackErroneoPuntos: "Incorrecto. Eran los puntos",
    ayudaTecladoTexto: "Atajos: usa las teclas",
    ayudaTecladoCierre: "para los puntos 1 al 6.",

    seccionDictadoTitulo: "Escribir al oído",
    seccionDictadoDesc: "Escucha la palabra y escríbela en braille letra por letra.",
    btnReproducir: "Reproducir",
    btnOtra: "Otra palabra",
    sufijoCaracteres: "caracteres",
    feedbackPerfecto: "Perfecto. Acertaste las {n} letras.",
    feedbackParcial: "Acertaste {a} de {t}. La palabra era",

    seccionTraductorTitulo: "Conversor",
    seccionTraductorDesc: "Escribe en un lado, el otro se actualiza en tiempo real.",
    labelTexto: "Texto",
    labelBraille: "Braille",
    placeholderTexto: "Escribe aquí...",
    btnCopiar: "Copiar",
    ejemploTexto: "hola mundo",
    toastCopiado: "Braille copiado",
    toastNoCopia: "No se pudo copiar",

    seccionRetoTitulo: "Contra el reloj",
    seccionRetoDesc: "Identifica el mayor número de caracteres en 60 segundos.",
    retoSegundos: "segundos",
    retoAciertosLabel: "aciertos",
    retoFallosLabel: "fallos",
    btnEmpezarReto: "Empezar reto",
    retoTerminado: "Tiempo terminado",
    retoFinal: "{a} aciertos · {f} fallos",
    btnVolver: "Volver a jugar",

    firmaHecho: "Hecho por",
    instalar: "Instalar app",

    anuncioNuevaCelda: "Nueva celda. Identifica el caracter.",
    anuncioCorrecto: "Correcto. Era",
    anuncioIncorrecto: "Incorrecto. Era",
    anuncioEscribir: "Escribe el caracter",
    anuncioRetoTerminado: "Reto terminado.",
  },

  en: {
    htmlLang: "en",
    metaDesc: "Learn braille with interactive exercises. Alphabet, writing, dictation and translator.",
    pageTitle: "Braille Practice",

    cambiarTema: "Toggle theme",

    cintilloHero: "Interactive handbook",
    heroTitular: "Learn",
    heroTitularAcento: "braille",
    heroVolante: "Six exercises to recognize, write and hear the alphabet. In Spanish and English.",

    statRacha: "Streak",
    statMejor: "Best",
    statAciertos: "Accuracy",

    navAlfabeto: "Alphabet",
    navAprender: "Learn",
    navEscribir: "Write",
    navDictado: "Dictation",
    navTraductor: "Translator",
    navCronometro: "Challenge",

    seccionAlfabetoTitulo: "The alphabet",
    seccionAlfabetoDesc: "Hover or tap any character to see its dots.",
    filtroLetras: "Letters",
    filtroNumeros: "Numbers",
    filtroPuntuacion: "Punctuation",
    infoLabel: "Character",

    seccionAprenderTitulo: "Recognize a cell",
    seccionAprenderDesc: "Identify the character corresponding to the cell shown.",
    nivelLabel: "Level",
    nivel1: "01 · Vowels",
    nivel2: "02 · Consonants",
    nivel3: "03 · Full alphabet",
    nivel4: "04 · With numbers",
    nivel5: "05 · Everything",
    preguntaCaracter: "Which character is this?",
    feedbackCorrecto: "Correct",
    feedbackEra: "It was",

    seccionEscribirTitulo: "Trace the dots",
    seccionEscribirDesc: "Activate the dots that match the shown character.",
    instruccionEscribir: "Activate the matching dots.",
    btnComprobar: "Check",
    btnLimpiar: "Clear",
    feedbackCorrectoSig: "Correct. Next character in one second.",
    feedbackErroneoPuntos: "Incorrect. The dots were",
    ayudaTecladoTexto: "Shortcuts: use keys",
    ayudaTecladoCierre: "for dots 1 to 6.",

    seccionDictadoTitulo: "Write by ear",
    seccionDictadoDesc: "Listen to the word and write it in braille letter by letter.",
    btnReproducir: "Play",
    btnOtra: "Another word",
    sufijoCaracteres: "characters",
    feedbackPerfecto: "Perfect. You got all {n} letters.",
    feedbackParcial: "You got {a} of {t}. The word was",

    seccionTraductorTitulo: "Converter",
    seccionTraductorDesc: "Type on one side, the other updates in real time.",
    labelTexto: "Text",
    labelBraille: "Braille",
    placeholderTexto: "Type here...",
    btnCopiar: "Copy",
    ejemploTexto: "hello world",
    toastCopiado: "Braille copied",
    toastNoCopia: "Could not copy",

    seccionRetoTitulo: "Against the clock",
    seccionRetoDesc: "Identify as many characters as you can in 60 seconds.",
    retoSegundos: "seconds",
    retoAciertosLabel: "hits",
    retoFallosLabel: "misses",
    btnEmpezarReto: "Start challenge",
    retoTerminado: "Time's up",
    retoFinal: "{a} hits · {f} misses",
    btnVolver: "Play again",

    firmaHecho: "Made by",
    instalar: "Install app",

    anuncioNuevaCelda: "New cell. Identify the character.",
    anuncioCorrecto: "Correct. It was",
    anuncioIncorrecto: "Incorrect. It was",
    anuncioEscribir: "Write the character",
    anuncioRetoTerminado: "Challenge ended.",
  },
};

function t(clave, params = {}) {
  const idiomaActual = (window.estado && window.estado.idioma) || localStorage.getItem("braille:idioma") || "es";
  const dict = TRADUCCIONES[idiomaActual] || TRADUCCIONES.es;
  let texto = dict[clave] || TRADUCCIONES.es[clave] || clave;
  Object.keys(params).forEach((k) => {
    texto = texto.replace(`{${k}}`, params[k]);
  });
  return texto;
}

function aplicarTraducciones() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const clave = el.dataset.i18n;
    el.textContent = t(clave);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const clave = el.dataset.i18nPlaceholder;
    el.setAttribute("placeholder", t(clave));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const clave = el.dataset.i18nAria;
    el.setAttribute("aria-label", t(clave));
  });
  const idiomaActual = (window.estado && window.estado.idioma) || "es";
  document.documentElement.lang = TRADUCCIONES[idiomaActual]?.htmlLang || idiomaActual;
  document.title = t("pageTitle");
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t("metaDesc"));
}