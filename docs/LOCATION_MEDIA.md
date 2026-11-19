# LiverCity — contenido de lugares

## Street View

El explorador de lugares puede mostrar una panorámica interactiva de Google Street View dentro de la ficha del lugar.

1. Crea una clave en Google Cloud para **Maps Embed API**.
2. Restringe la clave por HTTP referrer a `https://renziito.github.io/*` (y agrega localhost solo para pruebas).
3. Habilita únicamente Maps Embed API para esa clave.
4. Pega la clave en el atributo `content` de `<meta name="google-maps-embed-key" ...>` en `index.html`.

La clave se usa en el navegador y debe estar restringida por dominio y API. Maps Embed API requiere una clave válida y una cuenta de facturación, aunque las solicitudes de Embed están disponibles sin cargo según la documentación de Google. La existencia de Street View interior depende de que haya una panorámica publicada para el local; si no existe, el enlace permite abrir Google Maps y comprobar la cobertura.

## Galerías propias y curadas

Las galerías se administran en `src/data/locations.ts`, dentro del array `gallery` de cada lugar.

- Guarda fotos propias o seleccionadas con permiso/licencia compatible en `public/gallery/<id-del-lugar>/`.
- Usa nombres descriptivos y formatos optimizados WebP/JPEG.
- Agrega cada imagen al array correspondiente:

```ts
gallery: [
  {
    src: 'gallery/cavern/escenario-principal.webp',
    caption: 'Vista del escenario principal',
    credit: 'Fotografía propia de LiverCity'
  }
]
```

- Para material curado, registra siempre autor/fuente y licencia o permiso en `credit`.
- No uses imágenes encontradas en buscadores sin verificar sus derechos.
- Si todavía no hay material aprobado, deja `gallery: []`. La interfaz mostrará un aviso en lugar de inventar fotografías.

Las imágenes de la galería son contenido editorial del proyecto; no se descargan automáticamente de Google ni de una búsqueda externa.
