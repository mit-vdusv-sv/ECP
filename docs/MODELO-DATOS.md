# Modelo de datos y trazabilidad

El catálogo de `data/ecp-variables.json` alimenta exclusivamente la plataforma piloto. Su raíz contiene `schemaVersion`, `version`, `documentos`, `criterios`, `nodes` y `edges`. No hay un catálogo alternativo codificado en los formularios. El navegador mantiene una copia editada opcional de ese mismo catálogo.

## Contenido de aprendizaje de la Guía

`data/ecp-guia.json` es independiente del modelo de captura. Contiene la fuente original, criterios de lectura, diez `sections`, 476 `nodes` y 488 `edges`.

- Cada concepto contiene `id`, `nombre`, `descripcion`, `nivel`, `parentId`, `paginas`, `fuente` y `seccion`. Si se consulta un elemento sin definición autónoma, `contexto` y `contextoId` remiten a la explicación de su apartado, sin presentarla como definición literal.
- Cada relación contiene `id`, `source`, `target`, `tipo`, `descripcion`, `paginas` y `fuente`. El tipo `estructura` expresa organización de lectura; los otros tipos documentan secuencia, transversalidad o retroalimentación.
- No contiene estados de medición, unidades de captura, clasificaciones del piloto ni referencias a los TdR.
- `data/guia-paginas.json` conserva el texto extraído, la página impresa y su correspondencia en el archivo PDF. El original permanece sin cambios y su SHA-256 consta en `fuente.sha256`.
- La navegación del aprendizaje se guarda en la URL, no en el almacenamiento municipal.

## Nodos del catálogo de la plataforma

| Campo | Tipo y significado |
|---|---|
| `id` | Identificador estable, único, letras/números/guion/guion bajo |
| `nombre`, `descripcion` | Denominación y definición o síntesis del contenido |
| `nivel`, `categoria` | Organización conceptual: clave, eje, grupo, fase, principio, criterio, instrumento, variable, orientación, etc. |
| `claveECP`, `ejeECP` | Listas de claves k1–k4 y enfoques e1–e6. Pueden estar vacías para estructuras transversales; no implican exclusividad |
| `naturalezaMedicion` | Conceptual, directa, derivada, administrativa, GIS, teledetección, observación, percepción o metodología pendiente |
| `estadoMedicion` | Una de las tres clasificaciones definidas en README |
| `fuenteMedicion` | Fuente prevista, o `null` |
| `unidad`, `formula`, `periodicidad` | Metadatos documentales, texto o `null`; nunca se completan con supuestos silenciosos |
| `paginaGuia` | Número impreso de la guía, o `null`. Página física PDF = impresa + 3 |
| `paginaTdR` | Página de referencia de los TdR, o `null`; se usó exportación a PDF en Microsoft Word, 25 páginas |
| `fuenteDocumento` | Lista de nombres de documentos |
| `notas` | Límites, estado metodológico y observaciones |
| `parentId` | Agrupación de lectura opcional, sin ciclos |
| `version` | Revisión local de la definición |
| `captura` | Configuración de captura, o `null` |

`captura` contiene `tipo` (`number`/`text`), `unidadDemo`, límites de entrada opcionales, `geografica`, `grupoPoblacional` y `convencion`. Las unidades de captura de la demo NO son unidades documentales aprobadas. Una observación descriptiva conserva `unidad: null` en el registro. El valor numérico cero es un dato válido.

El orden de los ejes sigue las secciones 4.3 y 7.2 de la Guía (pp. 30 y 93): gobernanza; equidad/inclusión; economía; salud; proximidad; ecología. El gráfico p. 23 intercambia la numeración de salud e inclusión; se conserva la trazabilidad de esa decisión.

## Relaciones

Cada arista contiene `id`, `source`, `target`, `tipoRelacion`, `descripcion`, `paginaFuente` y `fuenteDocumento`. Ambos extremos deben existir, no se admiten autorrelaciones y no puede duplicarse la combinación origen/destino/tipo.

- `contiene`: organización explícita por sección, fase o conjunto documental.
- `asociacion-tematica`: correspondencia de lectura entre claves y enfoques, señalada como interpretación; no es asignación exclusiva ni causal.
- `precede`, `retroalimenta`, `habilita`, `sostiene`, `contribuye`, `favorece`, etc.: describen el vínculo específico con su justificación documental.
- `se-observa-mediante`: vincula un enfoque con un insumo, sin convertirlo en prueba de impacto.

La edición local puede introducir nodos sin referencia. Se permiten como trabajo en curso, pero la auditoría los muestra y nunca los cuenta como documentados. La base entregada tiene cero nodos y cero relaciones sin referencia.

## Registros

Los archivos de importación/exportación usan `{ "schemaVersion": 1, "records": [...] }`. `demo-data.json` añade `cantones` y la marca `demo: true`.

| Campo | Significado |
|---|---|
| `id`, `variableId`, `canton` | Identidad del registro, variable y cantón piloto |
| `valor`, `unidad` | Número finito o texto; unidad conforme a la ficha de captura |
| `periodo` | Fecha ISO real `AAAA-MM-DD`, usada como fecha de referencia |
| `ambito`, `sector` | Ámbito territorial y sector/polígono/barrio/tramo declarado |
| `escenario` | `actual` o `propuesto`; nunca se presenta como evaluación antes/después |
| `fuente`, `responsable` | Procedencia y unidad o responsable ficticio |
| `observacion`, `metodo`, `evidencia` | Explicación, supuestos y referencia verificable; la evidencia se trata como texto, no se ejecuta ni descarga automáticamente |
| `calidad` | Confianza declarada `alta`, `media` o `baja`, no una calificación estadística |
| `grupoPoblacional` | Desagregación requerida para participación por grupo, o `null` |
| `geometria` | `Point`, `LineString` o `Polygon` GeoJSON en EPSG:4326, o `null` |
| `estado` | `borrador`, `enviado`, `validado`, `observado` |
| `validacion` | Último comentario de revisión del MIT. Se conserva al editar o reenviar desde GADM; cada revisión anterior permanece en la bitácora |
| `revision`, `createdAt`, `updatedAt` | Control de versiones y marcas temporales |
| `definicion` | Instantánea de la ficha usada: protege el significado histórico ante cambios de catálogo |
| `demo` | Identifica datos ficticios de esta demostración |

El GeoJSON usa `[longitud, latitud]`, limita las coordenadas al rango válido y admite hasta 1000 vértices. Los anillos de polígono deben cerrar. No se comprueban topología avanzada, CRS de origen ni pertenencia a límites administrativos; esas verificaciones requieren un servicio geoespacial y capas oficiales.

La clave de duplicidad combina cantón, variable, fecha, sector normalizado, escenario y grupo poblacional. Una importación conserva registros existentes y reporta duplicados omitidos. La actualización se hace desde la ficha, con revisión esperada. El formulario no permite validar directamente desde GADM. Es un flujo de demostración, no una frontera de seguridad.

## Métricas del tablero

Estas fórmulas describen calidad y disponibilidad de información; son operaciones de la interfaz, no indicadores de implementación de política:

- **Cobertura** = pares distintos cantón–variable con al menos un registro filtrado / pares posibles de cantones seleccionados y variables actualmente habilitadas × 100. Se consideran los filtros de clave, eje, estado y situación. Tener varios períodos o sectores no duplica un par.
- **Registros validados** = registros filtrados con estado validado / total de registros filtrados × 100.
- **Completitud de metadatos** = campos presentes / campos posibles × 100, sobre diez campos por registro: valor, fecha, ámbito, sector, fuente, responsable, calidad, evidencia, método e instantánea de definición. No evalúa veracidad, representatividad ni calidad del método.
- Cuando el denominador es cero se presenta cero y la ausencia de registros, sin `NaN` ni infinito.

Los gráficos muestran valores reportados individuales bajo fecha, sector y situación comunes. Si hay más de un registro por cantón en esa selección, o difieren método, unidad o definición, se bloquea la comparación. No hay promedios automáticos, sumas entre indicadores, ponderaciones ni inferencia causal. La ausencia de datos no es valor cero: aparece como «Sin información».

## Validación y límites

`shared/model.js` es el contrato ejecutable. Valida catálogo, identificadores, páginas, jerarquías, extremos, estados, tipos, fechas, unidades, rangos, geometría y duplicados. Un archivo inválido se rechaza antes de modificar el almacenamiento. Los JSON importados tienen un máximo de 6 MB, 3000 nodos, 12000 relaciones o 5000 registros según su tipo. El espacio real disponible en localStorage puede ser menor: los errores de cuota se informan, sin mostrar guardado exitoso.

La interfaz escapa texto antes de insertarlo y emplea `textContent` en ventanas de mapa. No ejecuta fórmulas, HTML ni URLs proporcionadas por usuarios. No usa `eval` en el código propio. La bitácora es modificable por quien controle el navegador y no sustituye una auditoría institucional inmutable.

## Persistencia de comentarios del MIT

La observación se guarda desde un formulario integrado, con texto obligatorio y confirmación visible. `changeStatus` conserva el comentario cuando el GADM reenvía el registro; `upsert` conserva el comentario previo al corregir los datos municipales. Una nueva revisión del MIT actualiza el comentario actual y deja el anterior en el historial.

Si una versión anterior vació el comentario del registro, `reviewComment` consulta la última revisión almacenada en su bitácora. Solo se recuperan comentarios que efectivamente constan en ese historial. Un error de almacenamiento o conflicto de revisión mantiene abierto el formulario y conserva el texto escrito.
