# 5. Familia y configuración

[← 4. Diseño de hábitos](04-thiet-ke-thoi-quen.md) · [Índice](README.md) · [Siguiente: 6. La ciencia de los hábitos →](06-khoa-hoc-thoi-quen.md)

<!--op-->## En esta guía

[Perfiles de niños](#ho-so) · [Vincular el dispositivo de un niño](#ghep-thiet-bi) · [Gestionar dispositivos](#thiet-bi) · [Invitar a un cuidador](#nguoi-cham-soc) · [Grupos de configuración](#cai-dat) · [Cuenta y sincronización](#tai-khoan) · [Privacidad y notificaciones](#rieng-tu) · [Recordatorios](#nhac-viec) · [Apariencia](#giao-dien) · [PIN](#pin) · [Tomarse un descanso](#tam-nghi) · [Instalar la aplicación](#pwa) · [Datos familiares](#du-lieu) · [Ofertas y recomendaciones](#uu-dai) · [Relacionado](#lien-quan)<!--/op-->

El área **Familia** tiene dos secciones: `Family → Child profiles` y `Family → Settings`.

<a id="ho-so"></a>
## Perfiles de niños

Cada niño tiene un perfil separado con:

| Información | Notas |
|---|---|
| Nombre real | Lo usan los padres; no se muestra públicamente salvo que usted decida compartirlo |
| Apodo | Nombre que aparece en la clasificación; si se deja en blanco, la clasificación pública usa «Super Child» |
| Edad (0 a 18) | Control deslizante; determina automáticamente la **etapa** (0–3, 3–6, 6–12, 12–18) con una descripción. Determina las recomendaciones, el [recorrido](04-thiet-ke-thoi-quen.md#lo-trinh) y la [interfaz según la edad](02-man-hinh-be.md#giao-dien-tuoi) |
| Mascota y color | Seis [mascotas](02-man-hinh-be.md#linh-vat) |
| Clasificación | Elija si participa en la clasificación pública y si se muestra el nombre real o solo el apodo (se recomienda el apodo). Los perfiles nuevos son **privados** de forma predeterminada |
| Interfaz según la edad | Al editar un perfil: **Automática según la edad**, fijar la franja 3–8 o 9–12, desde los 13 años o **mantener la interfaz actual**. La elección de los padres tiene prioridad sobre la del dispositivo del niño |

Desde la tarjeta del perfil, los padres pueden:

- **Añadir, editar o eliminar** un perfil de niño. La cantidad de niños depende del [plan](07-goi-va-thanh-toan.md#cac-goi): el plan Básico permite hasta 1; la prueba y los planes familiares no tienen límite. Cuando vence un plan, no se puede añadir otro perfil sin un plan.
- **Cargar el paquete según la edad** («Añadir automáticamente 6 hábitos adecuados para la edad…») para obtener seis tareas iniciales de inmediato.
- **[Añadir o descontar estrellas manualmente](03-hom-nay-va-duyet-viec.md#chinh-sao)**.
- Consultar las estrellas, el nivel, la racha y si el niño está oculto de la clasificación.
- Abrir el **código de conexión y el código QR** del niño ([más abajo](#ghep-thiet-bi)).

<a id="ghep-thiet-bi"></a>
## Vincular el dispositivo de un niño

Cada niño tiene **un código de conexión permanente** (y un código QR correspondiente). El código da acceso solo a ese niño, no contiene PIN ni datos familiares y permanece igual hasta que un padre lo renueva.

1. **Obtener el código del niño**: en `Family → Child profiles`, copie el código o toque «Mostrar código QR». Si se configuró, necesitará el [PIN](#pin).
2. **Abrir el dispositivo del niño**: abra la aplicación, abra «¿Este es el dispositivo de un niño?» y elija «Introducir código o escanear QR» (o «Código del niño» en la barra superior).
3. **Escanear el código QR o introducir el código**: el dispositivo inicia sesión automáticamente en el perfil correspondiente. Muestra «¡Conexión correcta!» y el niño toca «Iniciar las tareas del niño».

Después de vincularlo, el dispositivo abre directamente la [pantalla del niño](02-man-hinh-be.md), sin mostrar el panel para padres ni páginas de venta.

- **Renovar el código** de un niño («Crear un código nuevo para este niño») o **de todos los niños** («Crear códigos nuevos para niños»): los códigos anteriores dejan de funcionar. Hágalo solo si sospecha que alguien ha visto un código. Se requiere un PIN.
- Si no se abre la cámara: conceda permiso para usarla, emplee una conexión segura (https) o introduzca el código manualmente.
- Demasiados intentos incorrectos activarán la limitación de frecuencia ([9](09-bao-mat-va-rieng-tu.md#ma-ghep)).

<a id="thiet-bi"></a>
## Gestionar dispositivos

`Settings → Devices & family rhythm → Children's devices` muestra los dispositivos vinculados: a qué niño pertenecen, cuándo se conectaron por última vez y si ha vencido el acceso. **Revoque el acceso** inmediatamente si se pierde un dispositivo o deja de usarse (se requiere PIN). Cada dispositivo solo puede acceder al perfil de **un** niño.

<a id="nguoi-cham-soc"></a>
## Invitar a un cuidador

Para abuelos o familiares que desean seguir el progreso, pero **no pueden cambiar nada**.

1. En `Settings`, pulse **Crear invitación para cuidador**. El enlace de invitación, de **un solo uso**, solo aparece al crearlo y **vence a las 72 horas**. Cópielo y envíeselo a esa persona.
2. La persona invitada abre el enlace, inicia sesión con Google y pulsa aceptar. Si la invitación venció, se revocó o la cuenta ya pertenece a otra familia, verá «Invitación no válida…».
3. Accede al **espacio del cuidador**: puede consultar el progreso de cada niño en modo de solo lectura: «Hoy: x / y tareas» (y es la cantidad de tareas programadas para hoy según su regla de repetición; si no hay, «Hoy no hay tareas programadas»), «Últimos 7 días: x / y», los hábitos de cada niño y el total secundario de finalizaciones de «Siempre». Los cuidadores solo ven cantidades por día, no qué tarea se hizo, a qué hora ni ninguna nota.
4. Los padres pueden **Revocar invitación** en cualquier momento desde la lista «Invitaciones activas».

<a id="cai-dat"></a>
## Grupos de configuración

`Family → Settings` está dividido en grupos; la barra «Grupos de configuración» lleva a cada sección:

| Grupo | Contenido |
|---|---|
| **Dispositivos y ritmo familiar** | Dispositivos de los niños, instalación de la aplicación, cuidadores y [pausa familiar](#tam-nghi) |
| **Cuenta y sincronización** | Información del cliente, códigos de regalo y datos familiares |
| **Privacidad y notificaciones** | Clasificación pública, medición anónima y recordatorios |
| **Apariencia** | Tema claro, oscuro y configuración del dispositivo |
| **Proteger el área para padres** | PIN |
| **Ofertas y recomendaciones** | Campo para el código de recomendación y tarjeta Recomendar a un amigo (al final de la página, solo visible con sesión iniciada) |

La barra de direcciones recuerda la sección abierta (por ejemplo, `?section=settings#settings-security`): al recargar permanece en la misma sección y el botón Atrás del navegador vuelve a la anterior. El enlace solo selecciona una sección dentro del área para padres y no desbloquea nada; en modo infantil se ignora la parte `section`.

Al final de la página encontrará «Abrir la guía del usuario» (la página `/docs` de la aplicación; consulte [encontrar ayuda en la aplicación](01-bat-dau.md#tro-giup)) y enlaces a Privacidad, Condiciones y Contactar con asistencia ([11](11-website-va-trang-cong-khai.md)).

<a id="tai-khoan"></a>
## Cuenta y sincronización

- **Estado**: «Cuenta familiar», verificada, «Nube lista». Los datos familiares se sincronizan automáticamente entre teléfonos, tabletas y ordenadores, sin configuración técnica.
- **Información del cliente**: nombre completo, teléfono (de 9 a 15 dígitos), correo electrónico (solo lectura) y opción para recibir guías y ofertas. Se usa para ayudar con la cuenta y los pagos.
- **Código de cupón**: introduzca un código de regalo para añadir días de acceso ([7](07-goi-va-thanh-toan.md#coupon)).

<a id="rieng-tu"></a>
## Privacidad y notificaciones

- **Compartir en la clasificación pública**: opción para toda la familia, **desactivada de forma predeterminada**, que solo puede cambiar un padre. Al activarla, aparecen únicamente los niños seleccionados en el [perfil](#ho-so), y solo con apodo, avatar, puntuación del periodo, racha y categoría. Puede desactivarla en cualquier momento ([9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai)).
- **Medición anónima**: opción de consentimiento de los padres, desactivada de forma predeterminada. Actualmente no hay ningún destino de recopilación configurado, así que los eventos no salen del dispositivo ([analítica de producto](../product-analytics.md)).
- **Recordatorios**: consulte [más abajo](#nhac-viec).

<a id="nhac-viec"></a>
### Recordatorios para padres

Active «Permitir recordatorios de elementos que requieren atención» para recibir avisos cuando una tarea o recompensa necesite aprobación. Los recordatorios solo se refieren a elementos pendientes de aprobación, no son publicidad y pueden desactivarse en cualquier momento. Para recibir notificaciones fuera de la aplicación, pulse «Permitir notificaciones en este dispositivo»; si el dispositivo las bloquea, los recordatorios seguirán apareciendo en la aplicación (consulte el [aviso de Hoy](03-hom-nay-va-duyet-viec.md#nhac-viec-ngan)).

<a id="giao-dien"></a>
## Apariencia

- **Claro, Oscuro, Configuración del dispositivo** en el grupo Apariencia.
- **Tipo y tamaño de letra**: abra la ventana «Configuración de tipo y tamaño de letra» desde la barra superior para que a su hijo le resulte más fácil leer.
- **Idioma**: el selector de idioma de la barra superior ([1](01-bat-dau.md#ngon-ngu)).
- **Interfaz infantil según la edad**: fíjela al [editar el perfil del niño](#ho-so).

<a id="pin"></a>
## PIN parental

El PIN tiene **exactamente 4 dígitos** y protege el área de gestión familiar. No lo comparta con los niños.

- **Crear**: introduzca el PIN y vuelva a introducirlo para confirmar. **Cambiar**: introduzca el PIN actual y, después, dos veces el nuevo.
- Cuando se configura un PIN, se requiere para cambiar de la pantalla del niño al modo para padres. Tras introducirlo correctamente, este navegador permanece desbloqueado durante **2 horas**; al volver a bloquear, se borra el desbloqueo.
- Estas acciones sensibles requieren este desbloqueo: consultar o cambiar el código de conexión de un niño, revocar un dispositivo, aprobar tareas y recompensas, añadir o descontar estrellas manualmente, crear un pago, eliminar la familia, guardar datos bancarios o retirar dinero de recomendaciones. Si el área está bloqueada, la aplicación vuelve a la pantalla de bloqueo.
- Para retirar dinero de recomendaciones, la familia **debe tener un PIN configurado** ([8](08-gioi-thieu-ban-be.md#rut-tien)).
- Tras demasiados intentos incorrectos, deberá esperar unos minutos («Ha realizado demasiados intentos»).
- Si un niño toca completar en el dispositivo de los padres, **no** se requiere PIN.

<a id="tam-nghi"></a>
## Tomarse un descanso en familia

En `Settings → Family break`, pulse **Tomarse un descanso** y confirme cuando toda la familia necesite desconectar (por enfermedad, viaje o vacaciones). Durante el descanso:

- la pantalla del niño oculta los recordatorios de progreso, las rachas y la clasificación, y muestra un mensaje amable ([2](02-man-hinh-be.md#tam-nghi-be));
- los niños pueden seguir completando tareas; las estrellas, las recompensas y las tareas no se eliminan;
- los días de descanso no interrumpen la [racha](02-man-hinh-be.md#sao-cap-chuoi) ni cuentan como incumplidos al [calcular las fases de hábitos](06-khoa-hoc-thoi-quen.md#logic);
- se pausan los [recordatorios](#nhac-viec).

Pulse **Reanudar** cuando quiera.

<a id="pwa"></a>
## Instalar la aplicación

La tarjeta «Instalar KidHabit Hero» permite abrir la aplicación rápidamente como una app y seguir recibiendo nuevas versiones desde la web. En Android/Chrome, pulse «Instalar ahora»; en iPhone, abra Safari → Compartir → Añadir a la pantalla de inicio. También hay un botón «Actualizar datos de la aplicación» para cuando haga falta.

<a id="du-lieu"></a>
## Datos familiares

La tarjeta «Datos familiares» permite **descargar una copia JSON** con los perfiles de los niños, hábitos, historial de finalizaciones, recompensas, grupos, diarios, señales y registros de cómo trabajó el niño. El archivo **no contiene el PIN ni información de pago**, pero sí datos de su hijo; manténgalo en privado. «Restaurar desde un archivo JSON» solo sirve para datos guardados en este dispositivo (sustituye todos los datos locales); en las cuentas de Google, los datos se guardan en el servidor familiar. Exporte por separado el diario del niño desde [Estadísticas](03-hom-nay-va-duyet-viec.md#thong-ke). Eliminación permanente: [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu).

<a id="uu-dai"></a>
## Ofertas y recomendaciones

El último grupo de `Settings`, visible solo con la sesión iniciada:

- **Código de recomendación**: campo «¿Tiene un código de recomendación de un amigo?» (solo se muestra mientras la familia reúne los requisitos).
- **Recomendar a un amigo**: tarjeta para obtener un enlace, consultar comisiones y retirar dinero ([8](08-gioi-thieu-ban-be.md)).

<a id="lien-quan"></a>
## Relacionado

- Dónde usa el código el niño y qué ve: [2. Pantalla del niño](02-man-hinh-be.md).
- Límites de niños según el plan, compra de planes y cupones: [7. Planes y pagos](07-goi-va-thanh-toan.md).
- Por qué son seguros los códigos de conexión y los PIN: [9. Seguridad y privacidad](09-bao-mat-va-rieng-tu.md).
- Las retiradas por recomendación requieren un PIN: [8. Recomendar a un amigo](08-gioi-thieu-ban-be.md).
