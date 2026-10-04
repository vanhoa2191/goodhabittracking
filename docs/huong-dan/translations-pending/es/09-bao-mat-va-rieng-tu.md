# 9. Seguridad y privacidad

[← 8. Recomendar a un amigo](08-gioi-thieu-ban-be.md) · [Índice](README.md) · [Siguiente: 10. Administración y operaciones →](10-quan-tri-va-van-hanh.md)

<!--op-->## En esta guía

[Qué datos se guardan](#du-lieu) · [Quién puede ver qué](#ai-thay) · [Código de vinculación de su hijo](#ma-ghep) · [PIN](#pin) · [Consentimiento](#dong-thuan) · [Clasificación pública](#bxh-cong-khai) · [Compartir logros](#chia-se) · [Privacidad del programa de recomendaciones](#gioi-thieu-rieng-tu) · [Sugerencias con IA](#goi-y-ai) · [Analítica y recordatorios](#do-luong) · [Descargar y eliminar datos](#xoa-du-lieu) · [Protecciones técnicas](#ky-thuat) · [Limitaciones legales](#phap-ly) · [Temas relacionados](#lien-quan)<!--/op-->

Esta página explica en lenguaje sencillo qué hace KidHabit para proteger los datos de su hijo. Para conocer los detalles técnicos, consulte [Seguridad y privacidad](../security-privacy.md).

<a id="du-lieu"></a>
## Qué datos se guardan

La aplicación guarda el perfil de su hijo (nombre, apodo y edad), los hábitos, el progreso, los puntos, las recompensas, los dispositivos vinculados, el plan de suscripción y los datos de contacto de los padres (nombre completo, teléfono y correo electrónico). Las funciones opcionales también pueden incluir un diario de una frase, un plan de señales, cómo completa su hijo cada intento y una lista de deseos. **Nunca** enviamos los datos de su hijo, códigos de sesión, PIN, claves PayOS ni contenido de webhooks a ningún sistema de analítica.

<a id="ai-thay"></a>
## Quién puede ver qué

| Persona | Puede ver | No puede ver |
|---|---|---|
| Padre o madre | Todos los datos de su propia familia | Datos de otras familias |
| Cuidador | Nombres de los niños, hábitos activos (con su calendario de repetición), total de intentos completados o aprobados de cada niño y recuento diario de los últimos 7 días, en modo de solo lectura | No puede hacer cambios ni ver intentos individuales, horas del día, notas, edad, apodos, recompensas, grupos, suscripciones, pagos, configuración ni otros miembros |
| Niño (dispositivo vinculado) | Sus propios datos | Perfiles de otros niños, pagos, configuración o PIN |
| Operador | Perfiles de padres (nombre, correo y teléfono), planes de suscripción y pedidos; todas las acciones quedan registradas | Perfiles de niños, tareas o el diario del niño |

Cada familia se mantiene en un «compartimento» separado en la base de datos: ninguna cuenta puede leer ni escribir los datos de otra familia, aunque haya un error en la interfaz. Cada dato pertenece a un `family_id`; los planes y beneficios pertenecen a la familia, no a una dirección de correo electrónico.

<a id="ma-ghep"></a>
## Código de vinculación de su hijo

- Cada código abre **exactamente un perfil de niño** y no contiene PIN ni datos familiares. La base de datos solo guarda un hash del código.
- La sesión del dispositivo del niño se guarda en una cookie HTTP-only que los scripts de página no pueden leer; cada solicitud devuelve datos de un solo niño.
- La introducción repetida de códigos incorrectos está sujeta a **limitación de frecuencia**.
- Los padres pueden **renovar el código** (el anterior deja de ser válido) y **revocar dispositivos individuales** en cualquier momento ([5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)). Consultar, cambiar o revocar un código requiere el PIN.

<a id="pin"></a>
## PIN

El PIN de 4 dígitos se verifica en el **servidor**. Después de introducir el PIN correcto, el navegador recibe una cookie de desbloqueo firmada y vinculada al padre y a la familia. Es válida durante **2 horas** y se elimina al volver a bloquear. En las familias que han configurado un PIN, las acciones sensibles se rechazan hasta que se desbloquea el acceso: eliminar la familia, revocar dispositivos, consultar o cambiar códigos de vinculación, crear pagos, aprobar tareas y recompensas, añadir o descontar estrellas manualmente y consultar datos de pago de recomendaciones. El niño puede tocar para completar una tarea en el dispositivo de los padres sin introducir el PIN. Consulte las instrucciones para configurar un PIN en [5](05-gia-dinh-va-cai-dat.md#pin).

<a id="dong-thuan"></a>
## Consentimiento

- Durante la [configuración familiar](01-bat-dau.md#thiet-lap), el adulto debe confirmar que es el padre, la madre o el tutor legal y aceptar que se guarden los datos del niño. El consentimiento se guarda junto con la **versión de la política**.
- La clasificación pública, la analítica anónima, los recordatorios y las ofertas promocionales son opciones **voluntarias**, **desactivadas de forma predeterminada**, que pueden desactivarse de nuevo. Las retiradas se conservan como una marca de tiempo, en lugar de borrar el historial de consentimiento.
- Los cuidadores solo pueden entrar en la familia mediante una invitación de un solo uso creada por un padre (vence a las 72 horas); se puede revocar ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="bxh-cong-khai"></a>
## Clasificación pública

Un niño aparece en la clasificación pública solo si se cumplen **ambas** condiciones: la familia ha activado el uso compartido (desactivado de forma predeterminada y modificable solo por un padre) **y** el perfil del niño está marcado para participar (los perfiles nuevos son privados de forma predeterminada). La clasificación solo muestra el apodo (o «Super Kid»), el avatar, los puntos obtenidos durante el periodo, la racha y la categoría; **no** incluye el código del niño, el código familiar, el nombre real ni la edad. Los puntos se obtienen de los registros confirmados durante el periodo, no del saldo actual; por eso, canjear estrellas por recompensas no cambia la clasificación. Los paneles Familia y Grupo solo usan datos de sus respectivos ámbitos. Configuración: [5](05-gia-dinh-va-cai-dat.md#rieng-tu); experiencia del niño: [2](02-man-hinh-be.md#bang-xep-hang).

<a id="chia-se"></a>
## Compartir logros

«Compartir un logro positivo» ([3](03-hom-nay-va-duyet-viec.md#thong-ke)) siempre ofrece a los padres **una vista previa y la opción de confirmar** antes de abrir el panel para compartir del dispositivo. De forma predeterminada, el contenido no incluye el nombre, la edad, la foto ni las tareas del niño, y no lleva código de seguimiento.

<a id="gioi-thieu-rieng-tu"></a>
## Privacidad del programa de recomendaciones

El código de recomendación se guarda en la cookie `kidhabit_ref` durante 60 días (y se elimina después de registrarlo). Solo los administradores autorizados pueden ver los datos bancarios de quien recomienda; esa persona solo ve los últimos 4 dígitos. Quienes recomiendan **nunca** ven información de la familia recomendada ([8](08-gioi-thieu-ban-be.md)).

<a id="goi-y-ai"></a>
## Sugerencias con IA

Esta función se está activando gradualmente y está **desactivada de forma predeterminada**; solo aparece cuando da su consentimiento en Configuración → Privacidad (tarjeta **Sugerencias con IA**). Al tocar un botón de sugerencia, la aplicación solicita a un modelo de IA (Cloudflare Workers AI) que redacte una propuesta:

- **Sugerir pasos pequeños con IA** (en el formulario del hábito): solo se envían **el nombre del hábito que acaba de escribir** (después de eliminar enlaces, correos electrónicos y teléfonos) y una franja de edad.
- **Resumir la semana con IA**: solo se envían **los recuentos de la semana** (realizado por su cuenta, con recordatorio, juntos, no realizado), sin nombres de hábitos ni del niño.

**Nunca se envían**: el nombre o apodo del niño, el diario, nada escrito por su hijo, fotos ni su correo electrónico. Lo que se envía y lo que se recibe **no se escribe en los registros del sistema**. El resultado es solo una sugerencia marcada como «redactada por IA»: usted la lee y elige **Usar** o **Descartar**; la aplicación no aplica nada por su cuenta. Cada familia tiene un número limitado de sugerencias al día, y la función se pausa cuando se agota la cuota compartida. Como otras acciones sensibles, requiere su PIN. Al desactivar la opción, la función se detiene de inmediato.

<a id="do-luong"></a>
## Analítica y recordatorios

- La **analítica anónima** tiene límites estrictos: los eventos no contienen nombres, contenido de hábitos, códigos de niño/familia/usuario, códigos de vinculación, datos de pago ni marcas de tiempo exactas. **Actualmente no hay ningún destino de recopilación configurado**, así que no sale nada del dispositivo, ni siquiera si un padre da su consentimiento. No se publicarán métricas (DAU, retención, NPS, etc.) sin mediciones reales. Consulte [Analítica de producto](../product-analytics.md).
- Los **recordatorios** solo se usan para avisarle de tareas que requieren aprobación; no se usan para publicidad.
- Los datos sobre cómo completa su hijo cada intento y los planes de señales se usan **solo para ofrecer sugerencias a los padres**; no se utilizan para clasificar ni comparar a los niños ([6](06-khoa-hoc-thoi-quen.md#logic)).

<a id="xoa-du-lieu"></a>
## Descargar y eliminar datos

- **Descargar**: una copia JSON de los datos familiares ([5](05-gia-dinh-va-cai-dat.md#du-lieu)) y un CSV de las entradas del diario de una frase ([3](03-hom-nay-va-duyet-viec.md#thong-ke)). Mantenga estos archivos privados porque contienen datos de su hijo.
- **Eliminación permanente**: solo el **propietario de la familia** puede hacerlo desde `Today → Analytics`, escribiendo exactamente `DELETE FAMILY` (se requiere el PIN si está configurado). Se eliminan los perfiles de niños, hábitos, progreso, recompensas, dispositivos vinculados y sesiones vinculadas; no se puede deshacer. Restaurar la cuenta de inicio de sesión **no** recupera los datos eliminados ([Recuperación de datos](../data-recovery.md)).

<a id="ky-thuat"></a>
## Protecciones técnicas

| Protección | Qué significa para usted |
|---|---|
| Aislamiento familiar y bloqueos de filas en transacciones | Los datos de familias distintas no se mezclan |
| Todos los comandos de escritura basados en cookies rechazan solicitudes de otro origen | Un sitio desconocido no puede actuar en su nombre |
| PayOS con «fallo seguro»: comprobación de firma, importe, contenido, titular del pedido y procesamiento duplicado | Una notificación falsa no puede activar un plan |
| Prueba de un solo uso y comprobaciones de planes en la base de datos | No se pueden eludir los límites cambiando la interfaz |
| Política de seguridad del contenido (CSP), protecciones de marcos y permisos mínimos del navegador | Menor riesgo por código malicioso |
| Las funciones sensibles solo se ejecutan en el servidor; las nuevas funciones están cerradas de forma predeterminada | Menor superficie de abuso |
| Los administradores necesitan verificación en dos pasos y cada acción se registra con un motivo | Trazabilidad y control |

<a id="phap-ly"></a>
## Limitaciones legales

Los valores predeterminados están diseñados de forma **prudente** para los datos de los niños, pero esto **no certifica** el cumplimiento de COPPA o GDPR-K. Antes de activar la clasificación pública en un mercado concreto, solicite una revisión legal de la edad de consentimiento, el plazo de conservación, los derechos de acceso y los derechos de eliminación. Las páginas `Privacy`, `Terms` y `Contact` del [sitio web](11-website-va-trang-cong-khai.md#phap-ly-web) pueden seguir siendo borradores (sin indexar ni mostrarse en el pie de página o el pago) hasta que se active la opción de aprobación legal. Para informar de un incidente, no envíe secretos ni datos de niños por un canal público.

<a id="lien-quan"></a>
## Temas relacionados

- PIN, dispositivos y cuidadores: [5. Familia y configuración](05-gia-dinh-va-cai-dat.md).
- Clasificaciones: [2. Pantalla del niño](02-man-hinh-be.md#bang-xep-hang).
- Administración y registros de acciones: [10. Administración y operaciones](10-quan-tri-va-van-hanh.md).
- Respuesta a incidentes: [Respuesta a incidentes](../runbooks/incident-response.md).
