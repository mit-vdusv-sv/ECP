# Red viva ECP y plataforma piloto GADM MIT

Dos aplicaciones estáticas y funcionales para explorar la Estrategia de Cambio de Paradigma y demostrar el registro municipal y la consulta consolidada. No requieren backend, cuentas, compilación ni servicios de pago.

La red de aprendizaje contiene **476 conceptos** organizados en **10 temas**, exclusivamente a partir de la Guía ECP. La plataforma conserva su catálogo de captura, con **38 variables habilitadas**. La base demo incluye **62 registros ficticios** de Ibarra, Riobamba, Loja y Portoviejo. No se calcula un índice agregado de implementación ni un ranking municipal.

## Abrir localmente

Descomprime el paquete, abre una terminal en esta carpeta y ejecuta:

```sh
python -m http.server 8000
```

En Windows también puedes usar `py -m http.server 8000`. Visita `http://localhost:8000/`. Necesitas Python solo para servir los archivos en la prueba local; GitHub Pages no lo necesita. No abras los HTML mediante doble clic (`file://`): los módulos y los JSON requieren HTTP.

## Publicar en GitHub Pages

1. Crea un repositorio y sube el **contenido de esta carpeta**, de modo que `index.html`, `.nojekyll`, `data/`, `red-ecp/` y `plataforma/` queden en su raíz.
2. En **Settings → Pages**, elige **Deploy from a branch**.
3. Selecciona la rama que contiene los archivos, normalmente `main`, y la carpeta **/(root)**. Guarda.
4. Abre la URL que muestre GitHub cuando termine la publicación.

Todas las rutas de la aplicación son relativas y funcionan bajo el nombre de un repositorio. La publicación se realiza con las opciones descritas en la [documentación oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Este paquete está preparado para publicar; no se ha creado un repositorio remoto ni publicado un sitio.

Las bibliotecas están incluidas localmente. El fondo de OpenStreetMap requiere internet y muestra su atribución. Si no carga, permanecen disponibles las geometrías y la tabla. La Guía original se incluye sin modificaciones en `assets/documentos/guia-ecp.pdf` (aproximadamente 25 MB) para consultar cada página desde la red. Los TdR originales no se incluyen.

## Probar GADM y MIT en dos ventanas

1. En la plataforma, selecciona **Ibarra** y **Ingresar como GADM**.
2. Usa **Abrir vista MIT en nueva ventana**. Debe ser el mismo navegador, perfil y origen (protocolo, dominio y puerto).
3. En GADM elige una variable, por ejemplo **Ancho útil de aceras**, y pulsa **Registrar información**.
4. Completa valor, fecha, sector, fuente y responsable. Para enviar, agrega evidencia y método. Guarda un borrador o envíalo.
5. En MIT filtra Ibarra y consulta el registro recién creado; aparece sin recargar.
6. En GADM abre su ficha, pulsa **Editar registro**, cambia el valor y guarda o envía. Comprueba el nuevo valor en MIT.
7. En MIT abre un registro enviado y pulsa **Validar registro** o **Observar registro**. Para observarlo, escribe el comentario en la ficha y pulsa **Guardar observación**. Queda visible en «Comentario del MIT» para ambos roles.
8. El GADM puede corregir y reenviar el dato sin borrar el comentario. Las revisiones anteriores permanecen en la ficha y en la bitácora.

La sincronización usa `BroadcastChannel`, persistencia en `localStorage` y el evento `storage` como respaldo. No se sincronizan navegadores, perfiles ni equipos distintos. No abras una ventana en `localhost` y otra en `127.0.0.1`: son orígenes distintos. La ruta del sitio forma parte del espacio de almacenamiento para separar proyectos alojados en el mismo dominio.

## Usar la red como herramienta de aprendizaje

La red es una lectura informativa de la Guía ECP. No muestra categorías del piloto, estados de medición ni contenido de los TdR.

1. Recorre los diez temas desde el índice: sentido del cambio, uso de la Guía, contexto, cuatro claves, seis enfoques, espacio público efectivo, aplicación, ciclo de vida, mecanismos y glosario.
2. Selecciona un concepto en el mapa o en la lista para abrir su explicación. Los contenidos se despliegan por tema para mantener legible la red.
3. Usa la búsqueda para localizar conceptos en todos los temas. Los enlaces conservan el concepto seleccionado y funcionan con Atrás y recarga.
4. Pulsa una referencia de página o **Leer en la Guía**. El lector incluye el texto de las páginas impresas 5–104 y un enlace a la página correspondiente del PDF original, con imágenes y tablas.
5. Usa **Ver mapa general** para cambiar de tema. Los botones inferiores permiten continuar el recorrido.

Las líneas continuas son agrupaciones de lectura. Las líneas discontinuas muestran relaciones explicadas en la Guía, como la secuencia del ciclo, la participación transversal y la retroalimentación. Al seleccionar una relación se puede consultar su explicación y fuente.

El contenido de la red es de consulta. Se retiraron la edición de nodos y las clasificaciones de captura para conservar la coherencia documental. Las ediciones del catálogo local del piloto no alteran la red de aprendizaje. Los colores identifican temas, no estados de medición.

La red lee `data/ecp-guia.json`. La plataforma utiliza `data/ecp-variables.json` para sus formularios y datos; se mantiene independiente porque su propósito y fuentes son diferentes. El catálogo de la plataforma y sus registros existentes se conservan.

## Criterios de la plataforma piloto

La fuente conceptual es `guia-paradigma-DIGITAL.pdf`, que se ha interpretado como la Guía ECP mencionada en el encargo. La fuente funcional es `TdR_Digi_GADs_CORREGIDO_TIC.docx`. `referencia_red.png` no fue proporcionado; la red utiliza la paleta y organización conceptual de la guía sin copiar logos.

- `MEDIBLE_TDR_ACTUAL`: insumos que el alcance de los TdR permite registrar, observar o recibir como resultados reportados. No equivale a una ficha institucional aprobada.
- `MEDIBLE_CON_METODOLOGIA_O_LEVANTAMIENTO`: orientaciones que requieren método, muestra, instrumento o levantamiento adicional. Sin captura en este piloto.
- `NO_OPERACIONALIZADA_ACTUALMENTE`: conceptos, principios y dimensiones sin cálculo suficientemente definido. Sin captura.

La Guía (p. 93) declara que sus orientaciones no constituyen una metodología cerrada. Los TdR (pp. 14 y 16) prevén validar el marco en E2. Se conservan `unidad`, `formula` y `periodicidad` en `null` cuando no están definidas. Las unidades prácticas de los valores ficticios figuran por separado en `captura.unidadDemo` y se muestran como convenciones demo. No hay fórmulas inventadas ni evaluación automática de cumplimiento normativo.

El tablero solo calcula estadísticas de información: cobertura, proporción de registros validados y completitud de metadatos. Sus definiciones están en [el modelo de datos](docs/MODELO-DATOS.md). Los gráficos comparan valores reportados con filtros comunes; bloquean conjuntos con métodos, unidades o versiones diferentes, sin promediarlos.

## Almacenamiento y operaciones

Todo se guarda en el perfil local del navegador. Al borrar los datos del sitio o usar otro perfil se pierde esta copia. Exporta los registros y la bitácora para conservarlos. Los roles son una simulación y no un control de acceso. Utiliza información ficticia; este no es un entorno institucional para datos personales.

- Editar un registro crea una nueva revisión y lo devuelve a borrador, salvo que se envíe directamente.
- Las validaciones y observaciones quedan en la bitácora con autor simulado, hora y valores anteriores/nuevos.
- Importar añade registros válidos. Los duplicados se omiten; no se sobrescriben silenciosamente. Un error estructural rechaza todo el archivo antes de escribir.
- La importación GADM solo admite su cantón. MIT admite los cuatro.
- `Restablecer datos demo` reemplaza los registros de los cuatro cantones, tras confirmación; conserva el catálogo editado y registra la acción en la bitácora.
- Las escrituras se serializan mediante Web Locks cuando está disponible, y se comprueba la revisión al editar. Sin Web Locks se usa una actualización síncrona que relee el almacenamiento; no ofrece garantías transaccionales entre procesos simultáneos. Esta limitación desaparece con una API transaccional.

## Estructura

```text
index.html                         Portada de acceso
red-ecp/                           Red de aprendizaje y lector de la Guía
plataforma/                        Roles, captura, consulta, mapas y gráficos
shared/model.js                    Contratos y validación
shared/storage.js                  Repositorio local y sincronización
shared/ui.js                       Diálogos, fichas y utilidades seguras
shared/styles.css                  Identidad visual compartida
data/ecp-guia.json                  Contenido exclusivo de la Guía para aprendizaje
data/guia-paginas.json               Texto extraído para consulta por página
data/ecp-variables.json             Catálogo de captura de la plataforma
data/demo-data.json                 Registros ficticios y cantones
data/auditoria-base.json            Conteos, páginas y hashes de fuentes
assets/vendor/                     Bibliotecas y licencias incluidas
assets/documentos/guia-ecp.pdf       Guía original, sin modificaciones
docs/                              Modelo, auditoría, arquitectura y pruebas
tests/model.test.mjs                Pruebas de contratos y métricas
```

## Pruebas

Con Node.js instalado, ejecuta las pruebas de datos sin instalar dependencias:

```sh
node --test tests/model.test.mjs tests/guide.test.mjs tests/review.test.mjs
```

El detalle de comprobaciones de navegador y sus límites está en [PRUEBAS.md](docs/PRUEBAS.md). No se requiere Node para publicar ni utilizar el sitio.

## Evolución hacia una plataforma institucional

Sustituye `shared/storage.js` por un repositorio HTTP con el mismo contrato de lectura, escritura, importación, revisión y suscripción. Mantén el catálogo versionado y la instantánea de definición en cada registro. La interfaz y las métricas no necesitan convertirse en una aplicación monolítica.

La [arquitectura de evolución](docs/ARQUITECTURA.md) describe API versionada, historial, FIWARE/NGSI-LD, base geoespacial, identidad, respaldo e interoperabilidad. Son trabajos de una futura etapa; este paquete no simula que esas capacidades productivas estén implementadas.

## Dependencias

| Componente | Versión incluida | Uso | Licencia |
|---|---|---|---|
| Cytoscape.js | 3.30.4 | Red y navegación | MIT |
| Leaflet | 1.9.4 | Mapa y geometrías | BSD-2-Clause |
| Chart.js | 4.4.8 | Gráficos comparativos | MIT |

Documentación: [Cytoscape.js](https://js.cytoscape.org/), [Leaflet](https://leafletjs.com/reference.html), [Chart.js](https://www.chartjs.org/docs/latest/). Las licencias se conservan en `assets/vendor/`. Las versiones están fijadas para reproducibilidad; no se afirma que sean las versiones más recientes. Revisa actualizaciones y vulnerabilidades antes de una publicación institucional.
