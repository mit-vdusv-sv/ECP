# Verificación de la versión de aprendizaje

Revisión del 25 de septiembre de 2026. Las pruebas usaron perfiles aislados y datos ficticios. Los archivos fuente originales se conservaron sin cambios.

## Resultados

| Comprobación | Resultado |
|---|---|
| Contratos de registros y métricas del piloto | 10 de 10 aprobadas |
| Contenido, referencias e integridad de la Guía | 4 de 4 aprobadas |
| chrome 153.0.8010.53 | 21 de 21 aprobadas |
| edge 153.0.4234.48 | 21 de 21 aprobadas |
| firefox 153.0 | 21 de 21 aprobadas |
| webkit 26.5 | 21 de 21 aprobadas |
| Errores JavaScript en las corridas finales | 0 |
| Recursos locales con respuesta HTTP de error | 0 |

WebKit verifica el motor; no equivale a probar Safari directamente en macOS o iOS.

## Red de aprendizaje

- Carga exclusiva del contenido de la Guía: sin consultas al catálogo del piloto, sin estados de medición y sin escribir en localStorage.
- Navegación por diez temas; cuatro claves, seis enfoques y cinco fases; consulta de la relación de retroalimentación del ciclo.
- Búsqueda de conceptos y siglas, resultado vacío y cierre de búsqueda.
- Lectura de la página 53, navegación anterior/siguiente, selección de la página 104 y enlace al PDF con correspondencia de página impresa y física.
- Enlaces a conceptos, recarga y botón Atrás del navegador.
- Índice móvil, mapa, fichas y lector sin desplazamiento horizontal a 360 px; texto ampliado al 200%.
- Revisión visual de la red en escritorio y celular, y del acceso por rol de la plataforma.
- Integridad SHA-256 del PDF, referencias a páginas existentes, identificadores únicos, relaciones válidas y jerarquía sin ciclos.

## Plataforma piloto

Se volvió a probar el flujo GADM–MIT: crear y enviar un registro, comprobar su aparición sin recarga, editarlo, validar desde MIT y comprobar el estado en GADM. Se repitió con BroadcastChannel deshabilitado para verificar el respaldo mediante `storage`.

También se verificaron conflictos de revisión, rechazo de captura no habilitada, importación con 62 duplicados omitidos, texto HTML tratado como texto, bitácora, restablecimiento y adaptación de GADM/MIT a 390 px. El acceso usa el título «Plataforma piloto GADM / MIT» y el tablero «Tablero consolidado».

## Reproducir

Las pruebas de datos no necesitan paquetes:

```sh
node --test tests/model.test.mjs tests/guide.test.mjs
```

Para las pruebas de interfaz, con el sitio servido por HTTP en el puerto 8000:

```sh
npm install --no-save playwright
node tests/browser.cjs
```

El navegador predeterminado es Chrome instalado. En PowerShell, `QA_ENGINE` admite `edge`, `firefox` o `webkit`. Para los dos últimos instala sus motores con `npx playwright install firefox webkit`. `TEST_BASE_URL` permite cambiar la URL. Las capturas y los resultados se guardan en `.test-results/`, excluido de Git. Estas dependencias solo sirven para las pruebas; el sitio no requiere compilación.

## Alcance

No se realizó certificación WCAG, prueba con dispositivos físicos ni validación metodológica institucional del contenido. Las referencias documentales y la consulta del original permiten revisar las síntesis. Los roles de la plataforma siguen siendo una simulación local. Los resultados detallados corresponden a esta versión y constan en `pruebas-resultados.json`.


## Corrección de observaciones MIT · versión 2.0.1

Se reprodujeron dos pérdidas del comentario en la versión anterior: editar un registro desde GADM y reenviarlo a validación. Las seis pruebas de regresión de `tests/review.test.mjs` pasan con la corrección. Incluyen persistencia, conservación durante corrección/reenvío, notas vacías, conflictos de revisión y recuperación desde la bitácora.

La observación se ingresa ahora en la propia ficha y se guarda con un botón explícito. `tests/review-browser.cjs` verifica ocho comprobaciones por navegador: formulario, guardado/recarga, lectura GADM y conservación, historial de revisiones, fallo de almacenamiento con texto preservado, conflicto de versión, vista móvil/validación y consola sin errores. Pasaron en Chrome, Edge, Firefox y WebKit. WebKit sigue siendo una prueba del motor, no de Safari en dispositivos físicos.

Las pruebas usan perfiles aislados y no restablecen los registros del usuario. Los resultados están en `pruebas-observacion-mit.json`. Para reproducir:

```sh
node --test tests/model.test.mjs tests/review.test.mjs
node tests/review-browser.cjs
```

El segundo comando utiliza la misma instalación opcional de Playwright y las variables `QA_ENGINE` y `TEST_BASE_URL` descritas arriba.
