# Guía del usuario de KidHabit Hero

Esta guía describe **todas las funciones de KidHabit Hero** tal como las usan las personas y explica cómo **se conectan** entre sí. Cada archivo empieza con «En esta guía» y termina con «Relacionado», para que pueda pasar de una función a otras relacionadas sin volver a empezar la búsqueda.

KidHabit Hero ayuda a padres e hijos a desarrollar buenos hábitos mediante pequeñas acciones diarias: los padres asignan tareas, los niños las marcan como completadas, los padres las aprueban y los niños reúnen estrellas para canjear recompensas elegidas por sus padres. La aplicación no usa las estrellas para comparar a los niños ni juzgar su carácter ([consulte los principios](06-khoa-hoc-thoi-quen.md#nguyen-tac)).

## Leer según su función

| Usted es… | Lea en este orden |
|---|---|
| Un padre o madre que empieza | [1. Primeros pasos](01-bat-dau.md) → [2. Pantalla del niño](02-man-hinh-be.md) → [3. Hoy y aprobaciones](03-hom-nay-va-duyet-viec.md) |
| Un padre o madre que quiere diseñar hábitos | [4. Diseño de hábitos](04-thiet-ke-thoi-quen.md) → [6. La ciencia de los hábitos](06-khoa-hoc-thoi-quen.md) |
| Un padre o madre que gestiona la familia y los dispositivos | [5. Familia y configuración](05-gia-dinh-va-cai-dat.md) → [9. Seguridad y privacidad](09-bao-mat-va-rieng-tu.md) |
| Un padre o madre interesado en planes y pagos | [7. Planes y pagos](07-goi-va-thanh-toan.md) → [8. Recomendar a un amigo](08-gioi-thieu-ban-be.md) |
| Un operador o agente de asistencia | [10. Administración y operaciones](10-quan-tri-va-van-hanh.md) |
| Una persona que consulta el sitio web o redacta contenido | [11. Sitio web y páginas públicas](11-website-va-trang-cong-khai.md) |
| Alguien que quiere ver el panorama general | [12. Mapa de conexiones y escenarios](12-ban-do-lien-ket.md) y [13. Glosario](13-thuat-ngu.md) |

## Contenido

1. [Primeros pasos](01-bat-dau.md): formas de acceder, iniciar sesión, configurar la familia, roles, idioma y demostración.
2. [Pantalla del niño](02-man-hinh-be.md): tareas, finalización, aplazamientos, temporizadores, estrellas, niveles, rachas, insignias, recompensas, clasificaciones, mascotas, cartas matutinas, diarios y ciudad de los sueños.
3. [Hoy y aprobaciones](03-hom-nay-va-duyet-viec.md): tareas y recompensas pendientes de aprobación, progreso de cada niño, revisión semanal, estadísticas, impresión y uso compartido.
4. [Diseño de hábitos](04-thiet-ke-thoi-quen.md): gestión de tareas, biblioteca, marco de 47 hábitos, programas y señales, recorridos por edad y biblioteca de recompensas.
5. [Familia y configuración](05-gia-dinh-va-cai-dat.md): perfiles infantiles, vinculación de dispositivos, cuidadores, cuenta, PIN, apariencia, privacidad, recordatorios, instalación de la aplicación, datos y pausas.
6. [La ciencia de los hábitos](06-khoa-hoc-thoi-quen.md): principios, cuatro fases, lógica de sugerencias, 16 perfiles de carácter y 7 formas de dar.
7. [Planes y pagos](07-goi-va-thanh-toan.md): pruebas, planes, PayOS, activación, cupones, reembolsos y correo electrónico.
8. [Recomendar a un amigo](08-gioi-thieu-ban-be.md): códigos de recomendación, descuentos del 10%, comisiones del 30% y retiradas.
9. [Seguridad y privacidad](09-bao-mat-va-rieng-tu.md): PIN, códigos de vinculación, consentimiento, datos de los niños y eliminación de datos.
10. [Administración y operaciones](10-quan-tri-va-van-hanh.md): página de administración, roles, asistencia, tareas en segundo plano y documentación técnica.
11. [Sitio web y páginas públicas](11-website-va-trang-cong-khai.md): página de inicio, blog, marco, recorrido, ciencia y páginas legales.
12. [Mapa de conexiones y escenarios](12-ban-do-lien-ket.md): diagramas de dependencias, recorridos completos y solución de problemas.
13. [Glosario](13-thuat-ngu.md).

<!--op-->## Dos espacios y tres grupos de usuarios

KidHabit Hero tiene dos espacios separados, cada uno con su propia dirección:

| Espacio | Dirección | Uso | Documentación |
|---|---|---|---|
| **Aplicación** | `app.kidhabithero.com` | Inicio de sesión, gestión familiar, tareas de los niños, pagos y administración | 1 a 10 |
| **Sitio web de presentación** | `kidhabithero.com` | Presentación, precios, blog, marco de hábitos y condiciones | [11](11-website-va-trang-cong-khai.md) |

La aplicación tiene tres grupos de usuarios, y cada uno ve su propia área:

- **Padres** (propietarios de la familia, padres, madres y tutores): inician sesión con Google y ven las áreas Hoy, Diseño y Familia.
- **Niños**: acceden con un código o QR que les da un padre (no se requiere cuenta) y solo ven su propia área.
- **Cuidadores** (abuelos u otros familiares): reciben una invitación de los padres y solo pueden consultar el progreso; no pueden editar nada.<!--/op-->

## Catálogo de funciones

La columna «Estado» indica si una función está activada para todos (**Activada**) o todavía no está disponible (**Desactivada**).<!--op--> El estado procede de las variables de configuración de la versión actual; los operadores pueden cambiarlo en [implementación](../deployment.md).<!--/op-->

| Función | Quién la usa | Dónde | Requisito | Estado | Relacionado |
|---|---|---|---|---|---|
| Inicio de sesión con Google | Padres | Pantalla de acceso | Ninguno | Activada | [1](01-bat-dau.md#dang-nhap) |
| Inicio de sesión con código enviado por correo | Padres | Pantalla de acceso | No disponible<!--op--> (marca `emailCodeLogin`)<!--/op--> | **Desactivada** | [1](01-bat-dau.md#dang-nhap) |
| Demostración (datos de ejemplo) | Todas las personas | Pantalla de acceso | Ninguno | Activada | [1](01-bat-dau.md#demo) |
| Crear el primer perfil de niño | Padres | Primera vez | Consentimiento para tratar los datos | Activada | [1](01-bat-dau.md#thiet-lap) |
| Nueve idiomas con detección automática | Todas las personas | En toda la aplicación | Ninguno | Activada | [1](01-bat-dau.md#ngon-ngu) |
| El niño entra con código familiar o QR | Niños | Pantalla de acceso | Un padre creó el perfil | Activada | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi), [9](09-bao-mat-va-rieng-tu.md#ma-ghep) |
| Tareas diarias según el momento del día | Niños | Pantalla del niño | Tareas asignadas | Activada | [2](02-man-hinh-be.md#nhiem-vu) |
| Deslizar para completar o aplazar | Niños | Pantalla del niño | Ninguno | Activada | [2](02-man-hinh-be.md#hoan-thanh) |
| Temporizador para tareas con duración | Niños | Pantalla del niño | Una tarea con duración en minutos | Activada | [2](02-man-hinh-be.md#dem-gio) |
| Lectura de tareas en voz alta | Niños | Pantalla del niño | Dispositivo compatible | Activada | [2](02-man-hinh-be.md#doc-to) |
| Estrellas, niveles y rachas | Niños, padres | Ambas | Ninguno | Activada | [2](02-man-hinh-be.md#sao-cap-chuoi) |
| Insignias (5 básicas y 16 perfiles de carácter) | Niños | Pantalla del niño | Tareas completadas | Activada | [2](02-man-hinh-be.md#huy-hieu), [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Canjear recompensas y fijar objetivos | Niños, padres | Ambas | El padre creó una biblioteca de recompensas | Activada | [2](02-man-hinh-be.md#qua), [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Clasificación familiar y de grupo | Niños | Pantalla del niño | Ninguno | Activada | [2](02-man-hinh-be.md#bang-xep-hang) |
| Clasificación pública | Niños | Pantalla del niño | Un padre la activa y elige al niño | Activada (desactivada de forma predeterminada para cada familia) | [5](05-gia-dinh-va-cai-dat.md#rieng-tu), [9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai) |
| Mascotas y colores | Niños | Pantalla del niño | Cambiar de mascota una vez cada 7 días | Activada | [2](02-man-hinh-be.md#linh-vat) |
| Carta matutina de la mascota | Niños | Pantalla del niño | Desde las 07:00 | **Activada** | [2](02-man-hinh-be.md#thu-buoi-sang) |
| Diario de una frase | Niños, padres | Ambas | Ninguno | **Activada** | [2](02-man-hinh-be.md#nhat-ky), [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Ciudad de los Sueños | Niños | Pantalla del niño | Usar estrellas para construirla | **Activada** | [2](02-man-hinh-be.md#thanh-pho) |
| Apariencia según la edad | Niños, padres | Ambas | Los padres pueden fijarla | **Activada** | [2](02-man-hinh-be.md#giao-dien-tuoi), [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Aprobar tareas y recompensas | Padres | Hoy | PIN, si se configuró uno | Activada | [3](03-hom-nay-va-duyet-viec.md#duyet) |
| Añadir o descontar estrellas manualmente | Padres | Perfiles de niños | PIN, si se configuró uno | Activada | [3](03-hom-nay-va-duyet-viec.md#chinh-sao) |
| Vista Hoy del niño (tareas, racha, 7 días), progreso y revisión semanal | Padres | Hoy | Progreso y revisión semanal requieren el programa de hábitos activado | **Activada** | [3](03-hom-nay-va-duyet-viec.md#hom-nay) |
| Registrar cómo lo hizo el niño (solo, con indicación, juntos) | Padres, niños desde 15 años | Hoy, pantalla infantil | Programa de hábitos activado | **Activada** | [3](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [6](06-khoa-hoc-thoi-quen.md#bon-pha) |
| Estadísticas de 7 días, impresión semanal y compartir logros | Padres | Hoy → Estadísticas | Ninguno | Activada | [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Gestionar tareas y crear tareas personalizadas | Padres | Diseño → Gestión de tareas | Un plan | Activada | [4](04-thiet-ke-thoi-quen.md#quan-ly-viec) |
| Marco de 47 hábitos para edades de 0 a 18 años | Padres | Gestión de tareas → Biblioteca | Un plan | Activada | [4](04-thiet-ke-thoi-quen.md#khung-47), [6](06-khoa-hoc-thoi-quen.md#khung) |
| Programa y señales «si… entonces…» | Padres | Gestión de tareas | Programa de hábitos activado | **Activada** | [4](04-thiet-ke-thoi-quen.md#chuong-trinh), [6](06-khoa-hoc-thoi-quen.md#logic) |
| Recorrido por edad (5 etapas) | Padres | Diseño → Recorridos | Un plan | Activada | [4](04-thiet-ke-thoi-quen.md#lo-trinh) |
| Guía de 16 perfiles de carácter y 7 formas de dar | Padres | Barra superior | Ninguno | Activada | [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Biblioteca de recompensas y sugerencias | Padres | Diseño → Recompensas | Un plan | Activada | [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Perfiles de niños y paquetes por edad | Padres | Familia → Perfiles de niños | La cantidad de niños depende del plan | Activada | [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Vincular y revocar dispositivos | Padres | Perfiles de niños, Configuración | PIN, si se configuró uno | Activada | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi) |
| Invitar a un cuidador (solo lectura) | Padres | Configuración | Enlace válido 72 horas | Activada | [5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc) |
| PIN parental | Padres | Configuración | Ninguno | Activada | [5](05-gia-dinh-va-cai-dat.md#pin), [9](09-bao-mat-va-rieng-tu.md#pin) |
| Pausa para toda la familia | Padres | Configuración | Ninguno | Activada | [5](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Recordatorios para padres | Padres | Configuración | Consentimiento de los padres | **Activada** | [5](05-gia-dinh-va-cai-dat.md#nhac-viec) |
| Instalar la aplicación (PWA) | Todas las personas | Configuración, navegador | Ninguno | Activada | [5](05-gia-dinh-va-cai-dat.md#pwa) |
| Descargar y restaurar datos familiares | Padres | Configuración | Ninguno | Activada | [5](05-gia-dinh-va-cai-dat.md#du-lieu) |
| Eliminar permanentemente los datos familiares | Propietario de la familia | Estadísticas | Escribir `DELETE FAMILY` | Activada | [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu) |
| Prueba de 7 días | Padres | `/start`, precios, configuración | Una vez por familia | Activada | [7](07-goi-va-thanh-toan.md#dung-thu) |
| Pago VietQR mediante PayOS | Padres | Precios, `/checkout` | Inicio de sesión | Activada | [7](07-goi-va-thanh-toan.md#thanh-toan) |
| Código de regalo (cupón) | Padres | Familia → Cuenta | Código válido | Activada | [7](07-goi-va-thanh-toan.md#coupon) |
| Recomendar a un amigo, 10% de descuento, 30% de comisión | Padres | Configuración, enlace `?ref=` | Se requiere PIN para retirar dinero | Activada | [8](08-gioi-thieu-ban-be.md) |
| Correo del ciclo de vida | Padres | Bandeja de entrada | Configuración del correo | Según configuración | [7](07-goi-va-thanh-toan.md#email) |
| Página de administración (6 secciones) | Administradores | `/admin` | Rol y verificación en dos pasos | Activada | [10](10-quan-tri-va-van-hanh.md#admin) |

## Convenciones de esta guía

- Las rutas dentro de la aplicación usan el formato `Área → Elemento`, por ejemplo, `Family → Settings`.
- «Un plan» significa que la familia está en un periodo de prueba o tiene un plan no vencido ([7](07-goi-va-thanh-toan.md)).
- «PIN, si se configuró uno» significa que la acción solo se ejecuta después de introducir en este navegador un PIN parental correcto y vigente ([5](05-gia-dinh-va-cai-dat.md#pin)).
- Los precios, umbrales y plazos son los vigentes al redactar el texto; la fuente autorizada está en la documentación técnica enlazada al final de cada archivo.

<!--op-->## Mantener la guía al día

- Al añadir o cambiar una función, actualice el **catálogo de funciones anterior** y el archivo que la describe; añada enlaces a funciones relacionadas al final del archivo («Relacionado»).
- Cada sección tiene un ancla `<a id="…"></a>` para crear enlaces; no cambie el nombre de las anclas existentes. La prueba `tests/unit/user-guide-links.test.ts` informa si hay enlaces internos o anclas rotos.
- Los precios, umbrales y marcas de versión proceden del código fuente; si difieren, prevalece el código, así que actualice la guía para que coincida.
- Última actualización: 10/03/2026.
- Los capítulos 1 a 9, 12 y 13 también aparecen en la aplicación (`/docs` y el signo ? del área para padres). Después de editar Markdown, ejecute `npm run guide:build` para reconstruir `public/guide`; la prueba `tests/unit/guide-build.test.ts` informa si se olvida. El contenido exclusivo para operadores va entre el par de comentarios HTML `<!-- op -->` y `<!-- /op -->` (escritos sin espacios; aquí se añaden espacios para que el ejemplo no tenga efecto) y no aparece en la aplicación.
- **Traducciones:** coloque la traducción de cada capítulo (con el mismo nombre de archivo y conservando todas las líneas `<a id="…"></a>`, destinos de enlaces y cantidad de filas, columnas y elementos de lista) en `docs/huong-dan/i18n/<language code>/`; añada el código a `GUIDE_TRANSLATIONS` en `src/lib/guide/guide-locale.ts` y ejecute `npm run guide:build`. La prueba `tests/unit/guide-translations.test.ts` compara la estructura de cada traducción con la versión vietnamita. Al editar un capítulo vietnamita, actualice las traducciones correspondientes.
- Añada un ? a cada función nueva: agregue su código a `src/lib/guide/help-topic-id.ts`, escriba una explicación (en vietnamita e inglés) en `src/lib/guide/help-topics.ts` que apunte a una sección existente de la guía y coloque `<HelpTip topic="…" />` junto al encabezado de la pantalla.

## Documentación técnica relacionada

[Arquitectura](../architecture.md) · [Seguridad y privacidad](../security-privacy.md) · [Ciencia de los hábitos y lógica adaptativa](../habit-science-and-adaptive-logic.md) · [Contrato de datos del marco de hábitos](../habit-framework-data-contract.md) · [Programa de recomendaciones](../affiliate-program.md) · [Analítica de producto](../product-analytics.md) · [Implementación](../deployment.md) · [Recuperación de datos](../data-recovery.md) · [Registro de afirmaciones](../claims-ledger.md) · [Guía de publicación del blog](../blog-guide.md) · [Correo del ciclo de vida y reembolsos](../runbooks/lifecycle-and-refunds.md)<!--/op-->
