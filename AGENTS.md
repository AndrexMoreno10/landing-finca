
# Landing Finca — política de orquestación y ahorro

Consultar `PLAN_AHORRO_TOKENS.md` antes de delegar o ampliar contexto.

## Director

- Comunicarse en español, de forma clara y directa.
- El Director coordina, delimita el trabajo y valida el resultado final.
- Resolver directamente cambios pequeños: textos, estilos aislados, búsquedas simples, configuración y comandos rutinarios.
- Para un lote sustancial, coordinar normalmente una sola worker. No crear varias agentes para una misma cadena de implementación, iteración y QA.
- Mantener como máximo una worker activa, salvo que el usuario pida paralelización o existan tareas grandes realmente independientes.

## Worker

- Modelo preferido: `gpt-6-luna` con esfuerzo `low` para trabajo mecánico o bien delimitado.
- Agrupar implementación, correcciones y verificación en una sola asignación para conservar contexto.
- Entregar solo el contexto mínimo: objetivo, archivos relevantes, restricciones y criterio de aceptación. No copiar el historial completo.
- La devolución debe incluir: resumen breve, archivos cambiados, pruebas ejecutadas, resultado y bloqueos reales.
- Reutilizar la misma worker mientras conserve contexto útil. Tras dos intentos fallidos con diagnóstico concreto, escalar a `gpt-6.2-sol` con esfuerzo `low`; no multiplicar workers.
- Usar `gpt-6.1-terra` con esfuerzo `low` únicamente cuando el trabajo dependa principalmente de inspección visual o control del computador.
- Reservar modelos más costosos para arquitectura compleja, depuración difícil, seguridad o decisiones de alto impacto justificadas por evidencia.

## Investigación y Graphify

- Para HTML/CSS y cambios visuales localizados, usar primero `rg` y extractos pequeños.
- Usar Graphify solo ante dependencias desconocidas. Consultar con presupuestos de 600–1000 tokens y contexto acotado, por ejemplo `graphify query "símbolo" --budget 600 --context call`.
- Cada worktree genera su propio índice con `graphify extract . --code-only --no-cluster` cuando realmente lo necesite. No copiar grafos entre rutas.
- No usar extracción semántica, APIs cloud ni modo `watch`.

## Verificación y cierre

- Verificar la UI a 390 y 1440 px; añadir 320 px cuando el cambio pueda afectar móviles estrechos.
- El Director revisa el diff y la evidencia antes de declarar terminado el trabajo.
- Informar claramente qué quedó realizado y verificado, qué está pendiente y qué requiere intervención del usuario.
- Registrar comparaciones de ahorro solo entre tareas de alcance similar, indicando modelo, tokens, intentos y resultado. No prometer porcentajes sin medición comparable.
