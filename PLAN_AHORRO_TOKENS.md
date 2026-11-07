# Plan de ahorro de tokens
- Director coordina una hija GPT-6-Luna. Agrupar implementación, iteración y QA en una tarea; no crear agentes para cambios pequeños.
- Tras dos intentos sin resolver, registrar diagnóstico concreto y pasar a Sol low antes de crear más agentes.
- Consultar el grafo solo ante dependencias desconocidas: `graphify query "simbolo" --budget 600` (máximo 1000). Usar `rg` y extractos pequeños para HTML/CSS.
- No releer documentación ni historial ya conocidos. Comunicar resumen, diff y evidencia.
- Generar índice local por checkout: `graphify extract . --code-only --no-cluster`. Actualizar tras un lote de cambios de código; sin watch, APIs cloud ni extracción semántica.
- La hija genera su propio índice al necesitarlo; no copiar el grafo de la raíz. HTML/CSS pueden carecer de símbolos AST útiles; revisar con rg.
- Verificar UI a 390 y 1440 px; añadir 320 si afecta móvil.
- Comparar sesiones de alcance similar, registrando modelo, tokens, intentos y resultado. No prometer porcentajes ni confundir benchmark contra corpus completo con ahorro real.

Baseline raíz: Graphify 0.9.63, extract --code-only --no-cluster: 16 archivos de código, 98 nodos y 172 aristas; registro indica explícitamente no LLM extraction (0 llamadas LLM de extracción). CSS fue omitido por extensión; HTML no ofrece un mapa completo de estructura visual. Consulta de prueba: updateQuote con presupuesto 600. La hija queda configurada para generar índice propio cuando lo necesite.

Limitación comprobada: query --budget 600 puede exceder su presupuesto al incluir aristas (updateQuote devolvió unos 1574 tokens); usar --context call y recortar salida si hace falta. El grafo persistido tiene 98 nodos y 172 aristas; el conteo de extracción inicial anterior puede diferir de la normalización posterior.
