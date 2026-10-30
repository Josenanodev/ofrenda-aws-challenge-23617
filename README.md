# Brownsky · Siempre cerquita

Landing page y ofrenda interactiva de Día de Muertos para Brownsky, construida con HTML, CSS y JavaScript vanilla, sin dependencias de ejecución.

## Ejecutar

```powershell
npm run dev
```

Abrir http://127.0.0.1:4173. Los archivos publicables están en `brownsky/dist/`; también se puede abrir `brownsky/dist/index.html` directamente. La creación de identificadores para recuerdos requiere un navegador moderno y un contexto seguro (localhost o HTTPS).

## Interacciones

- Encender y apagar la vela para revelar una dedicatoria, iluminar el retrato y encender las veladoras del altar.
- Compartir velitas y dejar flores, agua, premios y una pelota.
- Escribir y eliminar recuerdos. Los recuerdos y los contadores se guardan únicamente en el navegador mediante localStorage; no se comparten entre dispositivos o visitantes.
- Activar notas ambientales suaves generadas mediante Web Audio, sin reproducción automática.
- Mandar un abrazo con partículas de corazones.

Diseño adaptable a móvil, tableta y escritorio; controles de teclado, diálogo accesible y respeto por la preferencia de movimiento reducido. La fotografía se conserva en `brownsky/dist/assets/brownsky.jpg`. Las fuentes de Google tienen alternativas locales si no hay conexión.

## Challenge AWS / JSConf México 2026

El altar de tres niveles, el papel recortado de los niveles y la interacción de la vela se adaptaron de [anacunha/jsconfmx-ofrenda](https://github.com/anacunha/jsconfmx-ofrenda). Se personalizaron el título, la dedicatoria, la foto de Brownsky, el color lila y el control de encendido/apagado con `aria-pressed` y `aria-controls`. La landing añade ofrendas, recuerdos locales y sonido opcional.

## Publicar con AWS Amplify Hosting

El código está listo para conectar el repositorio a Amplify. El despliegue lo realiza el propietario de la cuenta; este proyecto no crea recursos de AWS ni publica automáticamente.

1. Sube estos archivos a tu repositorio de GitHub, incluida la foto y el archivo `amplify.yml` en la raíz.
2. En Amplify Hosting, crea una app, selecciona GitHub, tu repositorio y la rama que vayas a publicar.
3. Conserva la configuración de `amplify.yml`: valida el JavaScript y publica **`brownsky/dist`**. No necesita instalar dependencias ni compilar. No uses `/` como salida con esta estructura.
4. Despliega y comprueba tu URL de `amplifyapp.com`: foto de Brownsky, vela encendida/apagada y dedicatoria visible al encenderla.

Referencia: [configuración de build de AWS Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html).

## Verificar JavaScript

```powershell
npm run check
```
