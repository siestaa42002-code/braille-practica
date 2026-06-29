# Practica Braille

Web interactiva para aprender el alfabeto braille, escribir, traducir y entrenar el oído con dictados. Disponible en español e inglés.

## Modos

- **Alfabeto**: explora visualmente cada letra, número y signo de puntuación con su representación en braille y los puntos activos.
- **Aprender**: te mostramos una celda braille y eliges qué caracter es. Cinco niveles desde vocales hasta el set completo.
- **Escribir**: te damos un caracter y dibujas el braille haciendo clic en los puntos. Soporta atajos de teclado estilo Perkins (F D S J K L = puntos 1 a 6).
- **Dictado**: usa la API de síntesis de voz del navegador para leer palabras en voz alta. Tú las escribes en braille letra por letra.
- **Traductor**: bidireccional en tiempo real. Escribes texto y aparece en braille.
- **Reto**: cronómetro de 60 segundos para ver cuántos caracteres identificas.

## Funcionalidades adicionales

- Idioma español e inglés con vocales acentuadas, eñe y diéresis para el español
- Modo claro (default) y oscuro
- Estadísticas guardadas en local: racha actual, mejor racha, porcentaje de aciertos
- PWA instalable con soporte offline
- Accesibilidad: navegación por teclado, etiquetas ARIA, anuncios para lectores de pantalla
- Open Graph tags para previews al compartir

## Estructura

```
braille-practica/
├── index.html
├── styles.css
├── script.js
├── braille-data.js         (mapa de caracteres a puntos braille)
├── manifest.json           (PWA)
├── sw.js                   (service worker)
├── favicon.svg
├── og-image.svg            (preview redes)
├── netlify.toml
├── .gitignore
└── README.md
```

## Stack

HTML, CSS y JavaScript puro. Sin dependencias ni build step.

## Correr en local

Abrir `index.html` con Live Server desde VS Code, o servir la carpeta con cualquier servidor estático.

## Despliegue

### GitHub

```bash
git init
git add .
git commit -m "Primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/braille-practica.git
git push -u origin main
```

### Netlify

Conecta el repo en https://app.netlify.com y deja:
- Build command: vacío
- Publish directory: `.`

Cada push a `main` redespliega automáticamente.

## Convención de puntos braille

La celda braille tiene seis puntos numerados así:

```
1 . 4
2 . 5
3 . 6
```

Los datos viven en `braille-data.js` donde cada caracter se representa como un array de los puntos que están activados. Por ejemplo, la letra A son los puntos 1, mientras que la M son los puntos 1, 3 y 4.

## Datos cubiertos

- Español: 26 letras del alfabeto latino + ñ + vocales con tilde (á, é, í, ó, ú) + ü
- Inglés: 26 letras del alfabeto latino
- Números 0 a 9 (con signo numérico convencional)
- Puntuación: , ; : . ! ? ' - ( )
- Signo de mayúscula

## Licencia

Uso libre.