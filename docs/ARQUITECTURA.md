# Arquitectura de la demostración y evolución

El piloto separa el catálogo documental, el repositorio de datos, la validación, las métricas y las interfaces. La red de aprendizaje consulta exclusivamente su contenido derivado de la Guía; la plataforma conserva su catálogo de captura. Las bibliotecas están fijadas e incluidas en el paquete para evitar que una caída de CDN impida abrir los controles.

## Capas actuales

```text
ecp-guia.json + guia-paginas.json + PDF original
                     │
                     └──► red de aprendizaje / búsqueda / lector documental

ecp-variables.json ──► formularios GADM
                             │
                    repositorio local
                       │         │
                  historial    BroadcastChannel / storage
                                 │
                                 └──► MIT / métricas / tabla / mapa
```

El repositorio expone `loadBase`, `catalog`, `saveCatalog`, `readData`, `upsert`, `removeRecord`, `changeStatus`, `importRecords`, `resetDemo` y `subscribe`. El almacenamiento incluye registros e historial en un único sobre, para que cada escritura local no deje un dato sin su evento de auditoría. Las operaciones usan Web Locks donde esté disponible.

No hay autenticación, API productiva, FIWARE activo, base remota, sincronización entre equipos, sensores, recepción de fotografías, PWA ciudadana completa, motor de escenarios paramétricos ni simulación predictiva. La solicitud específica delimita dos aplicaciones y una demostración estática; las capacidades productivas de los TdR se documentan como evolución, sin presentarlas como entregadas.

## Sustitución del repositorio por una API

Mantener los contratos de modelo y UI; implementar un adaptador HTTP con estas operaciones propuestas:

| Operación local | API futura propuesta |
|---|---|
| Leer catálogo | `GET /api/v1/catalogs/ecp/versions/{version}` |
| Publicar nueva definición | `POST /api/v1/catalogs/ecp/versions` |
| Consultar registros | `GET /api/v1/records` con filtros y paginación |
| Crear registro | `POST /api/v1/records`, con clave de idempotencia |
| Editar registro | `PATCH /api/v1/records/{id}` con `If-Match`/ETag |
| Enviar, validar u observar | `POST /api/v1/records/{id}/transitions` |
| Eliminar | `DELETE /api/v1/records/{id}` según retención institucional |
| Importar | `POST /api/v1/imports`, validación previa y reporte transaccional |
| Leer bitácora | `GET /api/v1/audit-events` |
| Suscribirse | SSE o WebSocket autorizado por cantón y rol |

Los endpoints son una propuesta de implementación futura, no requisitos textuales inventados ni servicios disponibles. Documentarlos mediante OpenAPI, con errores estructurados, validación del servidor y pruebas de intercambio. Un conflicto de revisión debe devolver 409/412; ningún cliente puede validar por cambiar un campo sin permisos.

## Persistencia y contexto

Usar almacenamiento geoespacial con historia transaccional, catálogos inmutables por versión y claves de entidad estables. Separar `VariableDefinition`, `Observation`, `Municipality`, `TerritorialScope`, `EvidenceReference` y `AuditEvent`. Conservar la geometría de intercambio EPSG:4326 y registrar CRS de origen, licencia, custodio, linaje y clasificación de acceso.

Los TdR pp. 9 y 16 prefieren NGSI-LD para nuevos desarrollos. Mapear las entidades y relaciones al Context Broker con identificadores estables; preservar atributos temporales y referencias de fuente. FIWARE no demuestra por sí solo interoperabilidad: se requieren contratos, vocabularios identificados, transformaciones verificadas y pruebas. El piloto no declara compatibilidad NGSI-LD ejecutada.

## Identidad, operación y continuidad

Implementar un proveedor de identidad OIDC/OAuth y autorización del servidor: administración MIT, administración GADM, edición, validación, consulta y participación ciudadana. La asignación definitiva de validación debe acordarse institucionalmente. Sustituir nombres de rol de demostración por identidades autorizadas.

La bitácora deberá ser transaccional, protegida y retenida conforme a los TdR (pp. 12–13). Añadir HTTPS, gestión de secretos fuera del código, minimización de datos, clasificación de acceso, retención y controles institucionales para evidencia y ubicación. Implementar respaldos y probar restauración; los TdR establecen como referencias RPO de 24 horas y RTO de 8 horas, salvo exigencias mayores del MIT.

Preparar despliegue reproducible OCI, monitoreo y diagnóstico, seguridad, rendimiento y accesibilidad de producción. El piloto no acredita pruebas con 50 usuarios autenticados ni cumplimiento integral de WCAG 2.2 AA. El diseño usa HTML semántico, etiquetas, foco visible, formularios accesibles y alternativas tabulares; la certificación productiva requiere una revisión específica con tecnologías de asistencia.

## Escenarios y participación

Los registros distinguen situación actual y escenario propuesto. No se generan alternativas automáticamente ni se pronostican temperaturas, inundaciones o flujos. Una etapa posterior puede incorporar escenarios con supuestos y reglas aprobadas, manteniendo separado el dato observado de la estimación.

La captura actual admite referencias de aportes, conteos y trazabilidad. La aplicación ciudadana de los TdR, sus encuestas, moderación, fotografías y procesos de codiseño requieren un módulo adicional, responsabilidades operativas y reglas de protección de información.
