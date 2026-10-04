# 7. Planes y pagos

[← 6. La ciencia de los hábitos](06-khoa-hoc-thoi-quen.md) · [Índice](README.md) · [Siguiente: 8. Recomendaciones →](08-gioi-thieu-ban-be.md)

<!--op-->## En esta guía

[Prueba gratuita de 7 días](#dung-thu) · [Planes](#cac-goi) · [Dónde comprar](#noi-mua) · [Pasos para pagar](#thanh-toan) · [Activación y conciliación](#kich-hoat) · [Ampliaciones de plazo](#cong-don) · [Códigos de regalo (cupones)](#coupon) · [Descuento para familias recomendadas](#giam-gia) · [Reembolsos y cancelación](#hoan-tien) · [Correos que recibe](#email) · [Cuando vence un plan](#het-han) · [Relacionado](#lien-quan)<!--/op-->

<a id="dung-thu"></a>
## Prueba gratuita de 7 días

- **Gratis: 0 VND**, no se requiere tarjeta de crédito y **no se cobra automáticamente** al finalizar.
- Desbloquea todas las funciones del plan familiar, **sin límite de niños**.
- **Una vez por familia.** Si ya usó la prueba, el botón indicará: «Esta familia ya ha utilizado una prueba. Elija un plan para continuar».
- Cómo iniciarla: (a) automáticamente en el paso final de la [configuración familiar](01-bat-dau.md#thiet-lap), si no tiene un plan; (b) en `/start` («Inicie su prueba de 7 días»): inicie sesión con Google, configure su familia y pulse iniciar; (c) en el panel de prueba de la ventana de precios. Solo un padre de la familia puede iniciarla.
- El panel de prueba **no volverá a aparecer** después de que la familia haya pagado.
- Al acercarse el final de la prueba, el sistema envía un correo recordatorio ([correo electrónico](#email)).

<a id="cac-goi"></a>
## Planes

| Plan | Precio | Niños | Recomendado para |
|---|---|---|---|
| **Prueba gratuita de 7 días** | 0 VND | Ilimitados | Probarlo todo antes de decidir |
| **Plan para un niño** | 29,000 VND / mes | 1 niño | Familias que empiezan con un niño |
| **Plan familiar · Mensual** | 49,000 VND / mes | Ilimitados | Varios niños o acceso completo a todas las funciones |
| **Plan familiar · Anual** | 399,000 VND / año (precio habitual 588,000 VND; ahorra 189,000 VND, 32%) | Ilimitados | Mantener el uso el tiempo suficiente para que los pequeños pasos se conviertan en hábitos |
| **De por vida** | No se vende | Ilimitados | Solo lo concede manualmente un administrador<!--op--> ([10](10-quan-tri-va-van-hanh.md#khach-hang))<!--/op--> |

Todos los pagos son **únicos**, sin renovación automática. La pantalla de precios también enumera ventajas adicionales del plan familiar (informes semanales de seguimiento, competiciones familiares y asistencia técnica más rápida) y del plan anual (asistencia prioritaria y libro electrónico sobre crianza); el libro electrónico **todavía no está disponible**.

**Los nombres varían según la ubicación:** el sitio web de marketing llama «Plan Básico» al *Plan para un niño* y «Plan Premium» a los dos planes familiares (mensual y anual). Son los mismos productos y precios.

**El límite de niños de cada plan** se comprueba en la base de datos: el Plan para un niño permite hasta 1 niño; la prueba, los planes familiares y el plan de por vida no tienen límite; sin un plan activo, no puede añadir perfiles nuevos.

<a id="noi-mua"></a>
## Dónde comprar

| Punto de acceso | Descripción |
|---|---|
| Botón **Pasar a Pro** en la barra superior | Abre la ventana «Precios de KidHabit Hero Pro», donde puede elegir un plan |
| Ventana de precios cuando se requiere un plan | Por ejemplo, después de que venza un plan |
| Página `/pricing` y botón de selección de plan del [sitio web](11-website-va-trang-cong-khai.md#trang-chinh) | Le lleva a `/checkout?plan=…` en la aplicación |
| Página `/checkout` | Carga el plan seleccionado: inicie sesión, configure su familia si es necesario y pague |

Un enlace de plan no válido (antiguo o incompleto) muestra «Plan de pago no válido» y un botón para ver los precios. Los derechos del plan pertenecen a la **familia**, no a una dirección de correo electrónico.

<a id="thanh-toan"></a>
## Pasos para pagar

Los pagos se procesan mediante **PayOS (VietQR)**:

1. Elija un plan → inicie sesión con Google si es necesario → «Continuar al pago». Si su perfil está incompleto, indique su nombre completo y número de teléfono; los datos se recordarán para futuros pagos. Las ofertas son opcionales y están desactivadas de forma predeterminada. Confirme las condiciones si se le solicita y, después, introduzca un código de recomendación solo si su familia reúne los requisitos. No se puede crear el pedido mientras se envía el código. Los códigos solo pueden introducirse antes de generar el QR porque el servidor calcula el importe al crear el pedido; aplicar un código en esta ventana no sustituye un pedido existente.
2. La pantalla de pago muestra un **código VietQR** y los datos de la transferencia: nombre del beneficiario, banco, número de cuenta, **importe exacto** y **concepto de transferencia (obligatorio)**. Incluye botones para copiar cada dato, un botón **Descargar código QR** (para abrir la aplicación bancaria y elegir una imagen de la galería) y un enlace a la página segura de pago de PayOS. Si no se puede copiar, mantenga pulsado el texto, selecciónelo y cópielo manualmente. No hay cuenta atrás porque el servidor no impone un plazo de pago de 15 minutos.
3. Escanee con la aplicación bancaria o MoMo. **Mantenga el importe exacto y el concepto de transferencia.**
4. Si es necesario, pulse **«Ya he transferido»**; la aplicación comprueba el estado automáticamente. Los errores de estado aparecen en el idioma seleccionado y las comprobaciones automáticas continúan. Al finalizar, aparece «🎉 ¡Mejora completada!» y el plan se desbloquea de inmediato.

Si el pago está pendiente, **no vuelva a pagar enseguida**. El servidor establece el precio y no se puede cambiar desde el navegador. Solo un padre de la familia puede pagar; para crear un pago se requiere el [PIN](05-gia-dinh-va-cai-dat.md#pin) si se ha configurado uno. Al volver a la aplicación desde PayOS, verá el resultado del pago.

<a id="kich-hoat"></a>
## Activación y conciliación

El plan se activa cuando el sistema **confirma** el pago mediante una de tres vías independientes; gana la primera que llegue y el pago nunca se cuenta dos veces:

1. El **webhook** de PayOS llama a `/api/payment/webhook` (con comprobación de firma, importe, concepto de transferencia y titular del pedido).
2. **Consulta a PayOS:** mientras un padre está en la pantalla de pago, la aplicación consulta directamente a PayOS sobre el pedido. No depende del webhook.
3. **Conciliación en segundo plano:** cada 10 minutos, una tarea revisa los pedidos pendientes y consulta a PayOS.

Si transfirió el dinero pero no ve el plan, espere unos minutos, vuelva a abrir `/checkout` y contacte con asistencia indicando el código del pedido. <!--op-->El equipo de operaciones puede consultar el pedido en [Administración → Pagos](10-quan-tri-va-van-hanh.md#thanh-toan-admin).<!--/op-->

<a id="cong-don"></a>
## Ampliaciones de plazo

Si compra mientras su plan actual sigue activo, el tiempo se **añade al final del periodo actual**, incluido el tiempo de prueba restante: el plan mensual añade 1 mes y el anual añade 1 año. Comprar un plan inferior al que ya tiene **conserva el plan superior**. Un plan de por vida no se sustituye por otro.

<a id="coupon"></a>
## Códigos de regalo (cupones)

El equipo de operaciones crea los códigos de regalo. Introduzca uno en `Settings → Account → Coupon code → Apply code`.

- Un código añade **días adicionales** de acceso; aquí no se admiten códigos que solo descuentan el precio. Si la familia aún no tiene un plan de pago, cambia al Plan familiar · Mensual durante el número de días correspondiente; si ya tiene un plan, los días se añaden al final del periodo actual y el plan se mantiene. Los códigos no se pueden aplicar al plan De por vida.
- Cada familia puede usar **un código una vez**. Un código vencido, agotado o desactivado muestra: «No se encontró el código, ya se usó o venció».
- Tras **más de 10 intentos fallidos en 15 minutos**, el acceso se bloquea temporalmente durante unos minutos.

<a id="giam-gia"></a>
## Descuento para familias recomendadas

Una familia que introduce un código de recomendación (mediante un enlace `?ref=` o escribiéndolo) obtiene **un 10% de descuento en su primer plan anual** (399,000 VND pasa a 359,100 VND), solo si no tiene pedidos pagados anteriores. La pantalla de pago muestra «10% de descuento gracias al código de recomendación». Detalles: [8. Recomendaciones](08-gioi-thieu-ban-be.md#giam-10).

<a id="hoan-tien"></a>
## Reembolsos y cancelación

- **Reembolso en 30 días:** si no está satisfecho, envíe el código del pedido y la hora del pago al correo de asistencia dentro de los 30 días posteriores al pago. Los reembolsos se tramitan manualmente; al confirmarse, se recupera la comisión de recomendación de ese pedido si aún estaba pendiente ([8](08-gioi-thieu-ban-be.md#hoan-tien-hoa-hong)).
- El equipo de asistencia puede cancelar un **enlace de pago pendiente**; el pedido pasa a «cancelado» solo después de que PayOS lo confirme.
- La **cancelación del plan** la gestiona el equipo de asistencia y se confirma por correo electrónico. No se generan cargos automáticos.

<!--op-->Proceso interno: [Operaciones de correo y reembolsos](../runbooks/lifecycle-and-refunds.md) y [10. Administración](10-quan-tri-va-van-hanh.md#phieu-ho-tro).<!--/op-->

<a id="email"></a>
## Correos que recibe

Hay dos grupos de correos:

- **Correos de inicio de sesión** (enviados por Supabase): confirmación de registro, enlaces de acceso, recuperación, invitaciones, cambios de correo y nueva autenticación. La interfaz de correo está prediseñada ([plantillas](../../supabase/email-templates/README.md)).
- **Correos del ciclo de vida** (se pueden activar o desactivar): bienvenida e instrucciones de configuración (`welcome_setup`), recordatorios de fin de prueba (`trial_ending`), recibos (`payment_receipt`), actualizaciones de solicitudes de asistencia (`support_status`), reembolsos (`refund_status`) y confirmaciones de cancelación del plan (`subscription_cancelled`).

Los correos del ciclo de vida **no contienen datos de los niños**. Los correos promocionales solo se envían si aceptó recibir ofertas; retirar el consentimiento los detiene de inmediato. Las direcciones que hayan rebotado, generado una queja o se hayan dado de baja no recibirán más mensajes.

<a id="het-han"></a>
## Cuando vence un plan

Cuando vence la prueba o el plan sin renovarse, la familia deja de tener un plan: no puede añadir perfiles de niños y la aplicación le sugiere elegir un plan. **Los datos no se eliminan**; compre un plan o use un código de regalo para continuar.

<a id="lien-quan"></a>
## Relacionado

- Descuento del 10% y comisiones: [8. Recomendaciones](08-gioi-thieu-ban-be.md).
- Iniciar una prueba durante la configuración: [1. Primeros pasos](01-bat-dau.md#thiet-lap).
- Límites de niños y creación de perfiles: [5. Perfiles de niños](05-gia-dinh-va-cai-dat.md#ho-so).
- Gestión de pedidos, reembolsos y cambios de plan por el equipo de operaciones: [10. Administración y operaciones](10-quan-tri-va-van-hanh.md).
- Configuración de PayOS, webhook y conciliación: [Implementación](../deployment.md).
