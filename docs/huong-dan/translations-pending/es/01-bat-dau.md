# 1. Primeros pasos

[← Índice](README.md) · [Siguiente: 2. Pantalla del niño →](02-man-hinh-be.md)

<!--op-->## En esta guía

[Tres formas de entrar en la aplicación](#cach-vao) · [Iniciar sesión](#dang-nhap) · [Configurar su familia](#thiet-lap) · [Información del cliente](#thong-tin) · [Roles](#vai-tro) · [Demostración](#demo) · [Idioma](#ngon-ngu) · [Encontrar ayuda en la aplicación](#tro-giup) · [Relacionado](#lien-quan)<!--/op-->

<a id="cach-vao"></a>
## Tres formas de entrar en la aplicación

Cuando abra `app.kidhabithero.com` por primera vez, la pantalla «¿Cómo desea entrar en KidHabit?» ofrece tres opciones: dos botones visibles y un bloque desplegable para niños. Las áreas de padres y niños están separadas: los niños nunca ven los pagos ni la configuración familiar.

| Opción de acceso | Para quién | Qué ocurre |
|---|---|---|
| **Continuar como padre o madre** (iniciar sesión con Google) | Padres, madres y tutores | Abre el panel familiar ([3](03-hom-nay-va-duyet-viec.md)). La primera vez, deberá completar la [configuración familiar](#thiet-lap). |
| **¿Este es el dispositivo de un niño?** (abrirlo y elegir «Introducir código o escanear QR») | Niños | El dispositivo se vincula exactamente con un niño y abre directamente la [pantalla del niño](02-man-hinh-be.md). El niño no necesita una cuenta. |
| **Explorar la demostración** (visible, debajo del botón para padres) | Todas las personas | Usa datos de ejemplo y no requiere una cuenta ([demostración](#demo)). |

Los padres que ya hayan iniciado sesión accederán directamente al panel. Para volver a ver la página de inicio, elija «Inicio» o «Ver página de inicio». Una vez vinculado el dispositivo de un niño, siempre abrirá directamente la interfaz infantil y no mostrará el panel para padres ni la página de precios.

<a id="dang-nhap"></a>
## Iniciar sesión

- **Google** es el método principal para que los padres inicien sesión.
- **Un código de un solo uso enviado por correo electrónico** es la segunda opción y actualmente está **desactivada** hasta que se habilite<!--op--> (la marca `emailCodeLogin`, [cómo habilitarla](../deployment.md))<!--/op-->. Cuando está habilitada, aparece un bloque desplegable «Otras formas de iniciar sesión» en la pantalla de acceso; al abrirlo, se muestra el campo «O bien, reciba un código de acceso por correo electrónico». Con la marca desactivada, el bloque no existe. Los padres introducen su correo electrónico, reciben un código numérico breve y lo introducen para iniciar sesión. Pueden solicitar otro código al cabo de unos segundos; si hacen demasiadas solicitudes, deberán esperar unos minutos.
- Si el inicio de sesión falla, la aplicación muestra un mensaje breve y un botón para volver a intentarlo. No se guarda nada.

Los padres que inician sesión mediante un enlace de recomendación (`?ref=`) quedan registrados automáticamente como referidos ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). Las personas invitadas como cuidadores inician sesión con Google y luego aceptan la invitación ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Crear el primer perfil de niño

La primera vez que entre, la ventana «Crear el plan familiar según la edad» solo crea un perfil de niño:

- Introduzca el **nombre completo del niño** (obligatorio), un apodo (opcional) y la edad (5 años de forma predeterminada).
- Abra **Más opciones de personalización** para leer sobre la etapa de edad, cambiar la mascota (Leo de forma predeterminada), obtener una vista previa de seis hábitos iniciales o desactivar la incorporación de hábitos iniciales (activada de forma predeterminada). Podrá editar estos datos más adelante.

Debe **confirmar que es el padre, la madre o el tutor legal del niño** y aceptar que KidHabit almacene el perfil, los hábitos y el progreso del niño. El consentimiento se registra con la versión de la política ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)). Las clasificaciones públicas están desactivadas de forma predeterminada.

Si la familia no tiene un plan, al completar la configuración se **iniciará automáticamente una prueba gratuita de 7 días** (el botón dice «Iniciar prueba de 7 días»). Cada familia solo puede usar la prueba una vez ([7](07-goi-va-thanh-toan.md#dung-thu)).

Puede abrir `/start` («Inicie su prueba de 7 días») directamente desde el sitio web: inicie sesión con Google, configure su familia y, después, pulse iniciar.

<a id="thong-tin"></a>
## Información del cliente

Los padres solo deben introducir su **nombre completo y número de teléfono al finalizar la compra**, antes de los pasos de condiciones y recomendación. Los números de teléfono deben tener entre 9 y 15 dígitos. Los datos se guardan en el servidor para futuros pagos; quienes ya tengan un perfil completo se saltan este paso. Iniciar sesión y crear un perfil de niño no dependen de este requisito. Recibir orientación y ofertas es opcional y está desactivado de forma predeterminada. Puede editar sus datos más adelante en `Family → Settings → Account` ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)); al darse de baja, los correos promocionales se detienen de inmediato ([7](07-goi-va-thanh-toan.md#email)). Si falla la carga o el guardado, pulse **Intentar de nuevo**.

<a id="vai-tro"></a>
## Roles familiares

| Rol | Puede hacer | No puede hacer |
|---|---|---|
| **Propietario de la familia** (creador) | Todo lo que pueden hacer los padres, gestionar pagos y eliminar los datos familiares | Nada |
| **Padre, madre o tutor** | Gestionar a los niños, las tareas, las recompensas, las aprobaciones y los dispositivos | Acciones exclusivas del propietario (eliminar la familia) |
| **Cuidador** | Ver el progreso en «Vista del cuidador» | Editar perfiles, tareas, estrellas o el plan |
| **Niño** (dispositivo vinculado) | Completar sus propias tareas, solicitar recompensas y llevar un diario | Ver pagos, configuración o perfiles de otros niños |

Solo los padres de la familia pueden iniciar una prueba o realizar pagos. Algunas acciones sensibles también requieren un [PIN](05-gia-dinh-va-cai-dat.md#pin).

<a id="demo"></a>
## Demostración

«Explorar la demostración» abre la aplicación con tres niños de ejemplo (de 8, 4 y 1 año), además de tareas, recompensas y grupos de muestra. Los datos de demostración se guardan en la pestaña actual del navegador, por lo que permanecen al volver a cargar la página. Cuando configure una familia real o inicie sesión, los datos de demostración se eliminarán y **no** se mezclarán con los datos reales. La demostración no envía nada al servidor ni requiere pago.

<a id="ngon-ngu"></a>
## Idioma

La aplicación admite nueve idiomas: vietnamita, inglés, francés, alemán, italiano, español, chino, japonés y coreano. El idioma inicial se elige en este orden: su preferencia guardada, el país (según Cloudflare), el idioma del navegador y, por último, inglés. Cámbielo con el selector de idioma de la barra superior. Su elección se guarda para que la página, los títulos y la interfaz mantengan el mismo idioma.

En pantallas estrechas, los controles de la barra superior se trasladan a **Menú** (el botón ⋮). Incluye los grupos **Cuenta** y **Configuración rápida** (idioma, tema claro u oscuro, tamaño del texto y sonido), además de un enlace a la **Guía del usuario**. Las opciones menos frecuentes (precios, introducir el código de vinculación de un niño, la guía de las 16 fortalezas, configuración familiar, Inicio y estado del almacenamiento) están en **Más**, que permanece cerrado hasta que lo abra.

Algunos contenidos detallados, incluidos los recorridos por edad y la pantalla Hoy, todavía no se han traducido a los nueve idiomas y aparecerán en inglés cuando no haya traducción.

<a id="tro-giup"></a>
## Encontrar ayuda en la aplicación

Esta guía está integrada en la aplicación de dos formas:

- **Un signo ? junto a cada elemento.** En el área para padres, aparece un pequeño **?** junto al título de cada función, como aprobaciones, indicaciones, PIN, códigos de vinculación y pagos. Pase el cursor por encima, tóquelo o selecciónelo con la tecla Tab para leer una explicación breve de una o dos frases. Pulse **Ver detalles** para abrir la sección pertinente de la guía en la pantalla actual, sin salir de lo que está haciendo. En esa ventana, pulse un enlace a otra sección para seguir leyendo o pulse **Atrás** para volver. Pulse **Esc** o toque fuera de la ventana para cerrar la explicación.
- **Una página dedicada a la guía.** El botón **Guía del usuario** de la barra superior (o `Family → Settings → Open user guide`) abre `/docs`: una lista de capítulos, un cuadro de **búsqueda** (puede escribir con o sin tildes), un grupo de accesos directos **«Quiero…»** para tareas frecuentes y el índice de cada capítulo. El botón **Abrir la guía completa** de la ventana de detalles también lleva a la ubicación correspondiente de esta página.

La guía completa está disponible en vietnamita y en versiones traducidas, que actualmente incluyen el inglés. En los idiomas sin traducción, la explicación del signo ? aparece en inglés y la sección detallada en vietnamita, con un resumen rápido en `/docs`.

<a id="lien-quan"></a>
## Relacionado

- Crear un perfil de niño y vincular su dispositivo: [5. Perfiles de niños y vinculación de dispositivos](05-gia-dinh-va-cai-dat.md#ho-so).
- Lo que ven los niños después de entrar: [2. Pantalla del niño](02-man-hinh-be.md).
- Pruebas, planes y precios: [7. Planes y pagos](07-goi-va-thanh-toan.md).
- Privacidad de los datos de los niños: [9. Seguridad y privacidad](09-bao-mat-va-rieng-tu.md).
- Página de inicio del sitio web: [11. Sitio web y páginas públicas](11-website-va-trang-cong-khai.md).
