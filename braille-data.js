/*
  Dotzy - Practica Braille
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/braille-practica
*/

// Datos de braille: mapa de caracter a puntos activos (1-6) en una celda braille.
// Convención de puntos:
//   1 . 4
//   2 . 5
//   3 . 6

// Alfabeto latino base (común a español e inglés)
const BRAILLE_BASE = {
  a: [1],
  b: [1, 2],
  c: [1, 4],
  d: [1, 4, 5],
  e: [1, 5],
  f: [1, 2, 4],
  g: [1, 2, 4, 5],
  h: [1, 2, 5],
  i: [2, 4],
  j: [2, 4, 5],
  k: [1, 3],
  l: [1, 2, 3],
  m: [1, 3, 4],
  n: [1, 3, 4, 5],
  o: [1, 3, 5],
  p: [1, 2, 3, 4],
  q: [1, 2, 3, 4, 5],
  r: [1, 2, 3, 5],
  s: [2, 3, 4],
  t: [2, 3, 4, 5],
  u: [1, 3, 6],
  v: [1, 2, 3, 6],
  w: [2, 4, 5, 6],
  x: [1, 3, 4, 6],
  y: [1, 3, 4, 5, 6],
  z: [1, 3, 5, 6],
};

// Caracteres especiales del español
const BRAILLE_ESPANOL_EXTRA = {
  "ñ": [1, 2, 4, 5, 6],
  "á": [1, 2, 3, 5, 6],
  "é": [2, 3, 4, 6],
  "í": [3, 4],
  "ó": [3, 4, 6],
  "ú": [2, 3, 4, 5, 6],
  "ü": [1, 2, 5, 6],
};

// Números (precedidos por el signo de número en uso real)
const BRAILLE_NUMEROS = {
  "1": [1],
  "2": [1, 2],
  "3": [1, 4],
  "4": [1, 4, 5],
  "5": [1, 5],
  "6": [1, 2, 4],
  "7": [1, 2, 4, 5],
  "8": [1, 2, 5],
  "9": [2, 4],
  "0": [2, 4, 5],
};

// Puntuación común
const BRAILLE_PUNTUACION = {
  ",": [2],
  ";": [2, 3],
  ":": [2, 5],
  ".": [2, 5, 6],
  "!": [2, 3, 5],
  "?": [2, 6],
  "'": [3],
  "-": [3, 6],
  "(": [1, 2, 3, 5, 6],
  ")": [1, 2, 3, 5, 6],
};

// Signos especiales
const SIGNO_NUMERO = [3, 4, 5, 6];
const SIGNO_MAYUSCULA = [6];

// Idiomas disponibles
const IDIOMAS = {
  es: {
    nombre: "Español",
    codigoVoz: "es-ES",
    letras: { ...BRAILLE_BASE, ...BRAILLE_ESPANOL_EXTRA },
    palabrasDictado: [
      "casa", "libro", "amor", "luna", "sol", "agua", "mesa", "perro", "gato",
      "flor", "cielo", "tierra", "mar", "rio", "campo", "vida", "tiempo", "ayer",
      "hoy", "pan", "vino", "color", "musica", "danza", "fiesta", "amigo",
      "familia", "mama", "papa", "hijo", "hija", "abuelo", "abuela", "hermano",
      "noche", "dia", "manana", "tarde", "verano", "invierno", "primavera",
    ],
  },
  en: {
    nombre: "English",
    codigoVoz: "en-US",
    letras: BRAILLE_BASE,
    palabrasDictado: [
      "house", "book", "love", "moon", "sun", "water", "table", "dog", "cat",
      "flower", "sky", "earth", "sea", "river", "field", "life", "time",
      "yesterday", "today", "bread", "wine", "color", "music", "dance", "party",
      "friend", "family", "mom", "dad", "son", "daughter", "brother", "sister",
      "night", "day", "morning", "evening", "summer", "winter", "spring", "fall",
    ],
  },
};

// Convierte un array de puntos a su caracter Unicode Braille Pattern
// Los caracteres viven en U+2800 a U+28FF, con bits según los puntos activos.
// Mapa de bits: punto 1 = bit 0, punto 2 = bit 1, punto 3 = bit 2,
//               punto 4 = bit 3, punto 5 = bit 4, punto 6 = bit 5.
function puntosACaracter(puntos) {
  if (!puntos || puntos.length === 0) return "⠀"; // U+2800 espacio braille
  let codigo = 0x2800;
  puntos.forEach((p) => {
    codigo |= 1 << (p - 1);
  });
  return String.fromCodePoint(codigo);
}

// Convierte texto a string de caracteres braille
function textoABraille(texto, idioma = "es") {
  const datos = IDIOMAS[idioma];
  let resultado = "";
  let dentroDeNumero = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i].toLowerCase();
    const original = texto[i];

    if (ch === " ") {
      resultado += " ";
      dentroDeNumero = false;
      continue;
    }

    // Mayúscula
    if (original !== ch && /[a-zñáéíóúü]/.test(ch)) {
      resultado += puntosACaracter(SIGNO_MAYUSCULA);
    }

    // Número
    if (/[0-9]/.test(ch)) {
      if (!dentroDeNumero) {
        resultado += puntosACaracter(SIGNO_NUMERO);
        dentroDeNumero = true;
      }
      resultado += puntosACaracter(BRAILLE_NUMEROS[ch]);
      continue;
    } else {
      dentroDeNumero = false;
    }

    // Letras
    if (datos.letras[ch]) {
      resultado += puntosACaracter(datos.letras[ch]);
      continue;
    }

    // Puntuación
    if (BRAILLE_PUNTUACION[ch]) {
      resultado += puntosACaracter(BRAILLE_PUNTUACION[ch]);
      continue;
    }

    // Si no encuentra, devuelve un signo de interrogación braille
    resultado += "⠿";
  }

  return resultado;
}

// Construye el catálogo de caracteres por categoría para mostrar en la sección Alfabeto
function obtenerCatalogo(idioma = "es") {
  const datos = IDIOMAS[idioma];
  const letras = Object.entries(datos.letras).map(([letra, puntos]) => ({
    caracter: letra,
    puntos,
    categoria: "letras",
  }));

  const numeros = Object.entries(BRAILLE_NUMEROS).map(([n, puntos]) => ({
    caracter: n,
    puntos,
    categoria: "numeros",
    nota: "Precede signo numérico ⠼",
  }));

  const puntuacion = Object.entries(BRAILLE_PUNTUACION).map(([s, puntos]) => ({
    caracter: s,
    puntos,
    categoria: "puntuacion",
  }));

  return { letras, numeros, puntuacion };
}

// Para el modo aprender: obtener todos los caracteres de un nivel
function obtenerCaracteresPorNivel(nivel, idioma = "es") {
  const datos = IDIOMAS[idioma];
  switch (nivel) {
    case 1: // Vocales
      return idioma === "es"
        ? ["a", "e", "i", "o", "u"]
        : ["a", "e", "i", "o", "u"];
    case 2: // Consonantes simples
      return ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t"];
    case 3: // Alfabeto completo
      return Object.keys(datos.letras);
    case 4: // Con números
      return [...Object.keys(datos.letras), ...Object.keys(BRAILLE_NUMEROS)];
    case 5: // Todo
      return [
        ...Object.keys(datos.letras),
        ...Object.keys(BRAILLE_NUMEROS),
        ...Object.keys(BRAILLE_PUNTUACION),
      ];
    default:
      return Object.keys(datos.letras);
  }
}

// Obtener los puntos de un caracter
function obtenerPuntos(caracter, idioma = "es") {
  const datos = IDIOMAS[idioma];
  if (datos.letras[caracter]) return datos.letras[caracter];
  if (BRAILLE_NUMEROS[caracter]) return BRAILLE_NUMEROS[caracter];
  if (BRAILLE_PUNTUACION[caracter]) return BRAILLE_PUNTUACION[caracter];
  return null;
}

// Nombre legible de un caracter (para anuncios de accesibilidad)
function nombreCaracter(caracter) {
  const nombres = {
    ",": "coma",
    ";": "punto y coma",
    ":": "dos puntos",
    ".": "punto",
    "!": "signo de exclamación",
    "?": "signo de interrogación",
    "'": "apóstrofo",
    "-": "guion",
    "(": "paréntesis abierto",
    ")": "paréntesis cerrado",
    "ñ": "eñe",
    "á": "a con tilde",
    "é": "e con tilde",
    "í": "i con tilde",
    "ó": "o con tilde",
    "ú": "u con tilde",
    "ü": "u con diéresis",
  };
  return nombres[caracter] || caracter;
}