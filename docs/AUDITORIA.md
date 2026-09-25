# Auditoría del inventario documental

La base de la plataforma piloto contiene 455 nodos, 526 conexiones y cero elementos sin referencia. La clasificación inicial es: 38 medibles dentro del alcance TdR, 19 que requieren metodología o levantamiento y 398 no operacionalizados. La mayoría de estos últimos son principios, estructuras o instrumentos, no indicadores que deban transformarse en números.

## Criterio de consolidación

El inventario reúne los conceptos y conjuntos operativos del cuerpo de la Guía, incluidas las tablas de principios, el diagrama de espacio público efectivo, las fases y las orientaciones de impacto. Se consolidan repeticiones entre páginas; los nombres de secciones se conservan como grupos. Un mismo tema puede aparecer como principio, criterio y observable de captura cuando esas funciones son distintas: no deben contarse como indicadores independientes de desempeño.

| Bloque de la Guía | Páginas impresas | Representación |
|---|---|---|
| Visión y cuatro claves | 5–14, 21–26 | Sistema, claves, instrumentos y relaciones |
| Aprendizajes y condiciones habilitantes | 15–20 | Modelos, adaptación, capacidades y financiamiento |
| Recursos e incentivos | 27–30 | Reorientación de incentivos; las ponderaciones históricas no se reutilizan como score ECP |
| Seis enfoques y principios | 30–49 | Gobernanza, equidad, economía, salud, proximidad y ecología |
| Espacio público efectivo y soporte ecosistémico | 49–54 | Cuatro condiciones, subcriterios y principios de simultaneidad y protección |
| Aplicación, piso común y gradualidad | 55–66 | Participación, instrumentos, tipologías, roles, brechas y armonización |
| Ciclo de vida | 67–90 | Cinco fases, productos, controles y retroalimentación |
| Marco de indicadores y mecanismos | 91–100 | MNI, dimensiones, orientaciones, UEP y MdG/SMER |
| Glosario | 101–104 | Definiciones y referencias complementarias |
| Bibliografía | 105–122 | Referencias de consulta; no se convierten las obras citadas en nuevos indicadores |
| Cubiertas, créditos e índices | Páginas físicas iniciales y finales | No son variables ECP |

`data/auditoria-base.json` incluye un registro por cada una de las 128 páginas físicas de la Guía, las páginas que se citan directamente en nodos y los hashes SHA-256 de ambos documentos originales. Una página sin nodos propios puede corresponder a contenido repetido o consolidado en páginas adyacentes; el conteo de referencias por sí solo no demuestra exhaustividad semántica.

## Fuentes y límites

La Guía utiliza numeración impresa que empieza en la cuarta página física. Las fichas muestran ambos números. Los TdR se exportaron a PDF desde Word para fijar una referencia de 25 páginas; el índice heredado del documento no coincide en todo con la paginación actual. Repaginar con otra aplicación o fuentes puede cambiar esos números. Los nombres de sección permiten ubicar el contenido adicionalmente.

El orden de los seis ejes sigue pp. 30 y 93. La lámina p. 23 numera salud como eje 2 e inclusión como 4; el texto invierte ese orden. Se eligieron los identificadores conforme a la estructura textual y se documentó la diferencia, sin alterar las fuentes.

Las asignaciones temáticas y la clasificación de medición son decisiones analíticas conservadoras para esta aplicación. Se distinguen de citas literales y de una aprobación del MIT. La referencia de cada variable de captura lleva tanto a su sustento conceptual como al alcance TdR pp. 10, 14–16. Las descripciones son síntesis; consultar los originales para interpretar requisitos institucionales completos.

## Verificar la red de aprendizaje

La revisión de aprendizaje usa `data/ecp-guia.json`, con 476 conceptos, 488 relaciones y diez temas. Todas sus referencias corresponden exclusivamente a la Guía. No contiene la matriz interpretativa entre claves y ejes ni las categorías de medición del piloto.

Se incorporan las ocho transiciones de la sección 4.1, el contexto histórico, los principios de simultaneidad y protección, y los términos y siglas del glosario. Los conceptos permiten consultar su página original. El texto extraído cubre las páginas impresas 5–104; el PDF incluido conserva las 128 páginas físicas, incluidos créditos y bibliografía.

La organización en diez recorridos y sus agrupaciones es editorial y se identifica como ayuda de lectura. Las relaciones de secuencia, participación durante el ciclo y retroalimentación incluyen su explicación y página propias. Las síntesis no reemplazan el texto original.

Las pruebas `tests/guide.test.mjs` comprueban fuente única, ausencia de campos de captura, identificadores únicos, jerarquía sin ciclos, referencias consultables, estructura de claves/enfoques/fases e integridad del PDF. `data/auditoria-base.json` se conserva como registro del catálogo del piloto, no como auditoría de esta nueva red.
