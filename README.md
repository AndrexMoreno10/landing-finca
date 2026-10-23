# Chalet Parque del Café

Landing bilingüe y servidor local Node.js (22 o superior), sin dependencias de ejecución. Playwright se utiliza solo para pruebas de navegador. Diseño adaptable, cotización COP/USD, solicitudes persistentes, WhatsApp, atribución de campañas y moderación de reseñas.

## Ejecutar

### Revisión pública en Vercel

La versión de revisión está en https://chalet-parque-del-cafe.vercel.app. Incluye el diseño y cotizador, con calendario demostrativo. No recibe reservas, reseñas, pagos ni datos de contacto. No depende de que el PC permanezca encendido.

El repositorio `AndrexMoreno10/landing-finca` está conectado a Vercel. Los cambios enviados a `main` disparan el build definido en `vercel.json`: genera `review-deploy/` y publica únicamente esa carpeta. El código del servidor local se conserva en GitHub, pero no se ejecuta en esta versión de revisión.

Para comprobar el paquete localmente:

```powershell
node scripts/build-review.mjs
```

El empaquetador copia únicamente archivos públicos y excluye la administración. Los datos de demostración son independientes de `data/` y `.env`. La persistencia real sigue siendo un pendiente antes del lanzamiento comercial. La versión pública tiene instrucciones `noindex`; cualquiera con el enlace puede abrirla.

### Controles en celular

El cotizador usa un botón principal de ancho completo. El calendario muestra la instrucción actual antes de cotizar. La barra inferior aparece entre las secciones informativas y se oculta junto al hero, cotizador, calendario y formulario, durante la edición de campos y mientras hay un diálogo abierto. `public/mobile-actions.js` mantiene ese estado.

### Servidor local completo

```powershell
npm start
```

Abrir http://localhost:3000. Administración: http://localhost:3000/admin.

Copiar `.env.example` a `.env` y completar valores. `ADMIN_TOKEN` protege el panel: introducir su valor en la pantalla de acceso. No subir `.env` ni `data/` a Git. El servidor guarda las solicitudes y reseñas en `data/store.json`; conservar respaldos privados.

## Pendientes antes de lanzar campañas

- Número real de WhatsApp con indicativo y solo dígitos, por ejemplo `57...`.
- Fotografías reales: las imágenes actuales son de inspiración (Unsplash), identificadas como referencia; no representan el chalet. Reemplazar los tres archivos de `public/assets`, añadir las cinco fotografías reales y actualizar los textos de referencia al integrarlas.
- Video real optimizado: colocar `public/assets/hero.mp4`. El sitio lo usa automáticamente, sin sonido y en bucle; respeta movimiento reducido y ahorro de datos. Recomendación de edición: 15–30 s, 1280 px, sin audio, MP4 H.264, idealmente menos de 4 MB. No se recibió material para editar.
- Confirmar tarifa de temporada, cargo de aseo (`CLEANING_FEE`), disponibilidad, términos de cancelación, responsable y contacto de privacidad. El aseo no suma cargos adicionales mientras la configuración sea 0.
- Datos bancarios y claves de Wompi. Las claves privadas quedan solo en el servidor.
- Facebook Marketplace y Meta Pixel: configurar `FACEBOOK_MARKETPLACE_URL`, `META_PIXEL_ID` y activar `ENABLE_MARKETING=true` cuando el aviso de privacidad esté listo. El pixel se carga solo con consentimiento. Eventos: PageView, CustomizeProduct, Lead y Contact. No se emite Purchase al solicitar reserva.
- Hosting con Node y almacenamiento persistente, HTTPS, dominio y copias de respaldo. No subir solo `public/` a hosting estático: el formulario requiere el servidor. Para Vercel/Netlify se debe migrar persistencia a una base de datos y adaptar las rutas. Esta versión escucha únicamente en localhost por defecto.

## Embudo de campañas

Usar enlaces como `https://DOMINIO/?utm_source=facebook&utm_medium=paid_social&utm_campaign=fin_ano&utm_content=video_piscina`. El formulario captura UTM y fbclid, valida las fechas y guarda el lead. WhatsApp lleva fechas, huéspedes y cotización. El panel muestra el origen y permite contactar, confirmar o cancelar solicitudes. Confirmar bloquea noches y evita confirmaciones cruzadas; cancelar libera el bloqueo. Las fechas introducidas por el visitante son solicitudes, no reservas confirmadas.

Conversión USD: ExchangeRate-API (`https://open.er-api.com/v6/latest/USD`), consultada por el servidor cada hora. Si falla, se muestra únicamente COP. USD es informativo; Wompi cobra en COP.

## Pagos

El administrador confirma la disponibilidad y genera un enlace Wompi firmado desde el panel. El cliente puede recibirlo por WhatsApp. No se aceptan pagos automáticos sobre fechas sin confirmar. Se usa Checkout Web documentado en https://docs.wompi.co/docs/colombia/widget-checkout-web/. El enlace es una integración preparada, no un pago verificado: comprobar cobros en el dashboard Wompi. No hay webhook de conciliación ni confirmación automática de pagos. Nunca marcar pagado desde un retorno del navegador. Probar primero con las credenciales sandbox del comercio.

## Reseñas

Toda reseña se guarda como `pending`. Solo el endpoint público de reseñas aprobadas devuelve contenido visible. Aprobar/rechazar requiere la clave de administrador. No hay testimonios inventados. Se necesita una política de verificación del huésped para moderar antes de publicar.

## Validación

```powershell
npm test
```

Pruebas de noches, capacidad, solapamientos, cálculo en servidor, administración protegida, confirmación y cancelación, y aprobación manual de reseñas. Las pruebas usan almacenamiento temporal aislado.

Para las pruebas visuales: `npm install`, `npx playwright install chromium`, iniciar la aplicación y ejecutar `npm run test:browser`. Opcionalmente definir `BROWSER_EXECUTABLE` con la ruta de un Chromium instalado. Capturas en `test-results/`. Las solicitudes del test de navegador se simulan y no agregan clientes de prueba a los datos locales.

## Referencias

- Dirección visual solicitada: https://haciendaelpercal.com (sin copiar sus activos ni contenidos).
- Fotografías ilustrativas: https://images.unsplash.com/photo-1441974231531-c6227db76b6e, https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7, https://images.unsplash.com/photo-1611892440504-42a792e24d32.

La instalación local está preparada para revisión del diseño y del embudo; las integraciones comerciales requieren los datos pendientes antes de captar tráfico real.

## Portada actualizada

Carrusel con las dos vistas del chalet suministradas por el cliente, tipografia Manrope y fotografias WebP (unos 655 KB entre ambas). Navegacion por flechas, indicadores, teclado y deslizamiento tactil; pausa manual, pausa fuera de pantalla y soporte de movimiento reducido. Estas imagenes sustituyen las referencias anteriores en portada y galeria. El carrusel reemplaza el video de portada en esta version.
