# 5. Famille et paramètres

[← 4. Concevoir des habitudes](04-thiet-ke-thoi-quen.md) · [Sommaire](README.md) · [Suivant : 6. Science des habitudes →](06-khoa-hoc-thoi-quen.md)

<!--op-->## Dans ce guide

[Profils des enfants](#ho-so) · [Associer l’appareil d’un enfant](#ghep-thiet-bi) · [Gérer les appareils](#thiet-bi) · [Inviter un aidant](#nguoi-cham-soc) · [Groupes de paramètres](#cai-dat) · [Compte et synchronisation](#tai-khoan) · [Confidentialité et notifications](#rieng-tu) · [Rappels](#nhac-viec) · [Apparence](#giao-dien) · [Code PIN](#pin) · [Faire une pause](#tam-nghi) · [Installer l’application](#pwa) · [Données familiales](#du-lieu) · [Offres et parrainage](#uu-dai) · [À consulter également](#lien-quan)<!--/op-->

L’espace **Famille** comprend deux sections : `Family → Child profiles` et `Family → Settings`.

<a id="ho-so"></a>
## Profils des enfants

Chaque enfant dispose d’un profil distinct comprenant :

| Information | Remarques |
|---|---|
| Nom réel | Utilisé par les parents ; non affiché publiquement sauf si vous choisissez de le partager |
| Pseudonyme | Nom affiché dans le classement ; si aucun n’est indiqué, le classement public affiche « Super Child » |
| Âge (0 à 18 ans) | Curseur ; détermine automatiquement l’**étape** (0–3, 3–6, 6–12, 12–18) et sa description. Celle-ci détermine les recommandations, le [parcours](04-thiet-ke-thoi-quen.md#lo-trinh) et l’[interface selon l’âge](02-man-hinh-be.md#giao-dien-tuoi) |
| Mascotte et couleur | Six [mascottes](02-man-hinh-be.md#linh-vat) |
| Classement | Choisissez de participer au classement public et d’y montrer le vrai nom ou le pseudonyme seul (pseudonyme recommandé). Les nouveaux profils sont **privés** par défaut |
| Interface selon l’âge | Lors de la modification du profil : **Automatique selon l’âge**, épingler la tranche 3–8 ou 9–12 ans, l’interface à partir de 13 ans ou **conserver l’interface actuelle**. Le choix du parent prime sur celui de l’appareil de l’enfant |

Depuis la carte de profil, les parents peuvent :

- **Ajouter, modifier ou supprimer** un profil d’enfant. Le nombre d’enfants dépend du [forfait](07-goi-va-thanh-toan.md#cac-goi) : le forfait Essentiel en autorise un ; l’essai et les forfaits Famille n’ont pas de limite. Après l’expiration d’un forfait, aucun nouveau profil ne peut être ajouté sans forfait.
- **Charger le pack par âge** (« Ajouter automatiquement 6 habitudes adaptées à l’âge… ») pour obtenir immédiatement six tâches de départ.
- **[Ajouter ou déduire des étoiles manuellement](03-hom-nay-va-duyet-viec.md#chinh-sao)**.
- Consulter les étoiles, le niveau, la série et la visibilité de l’enfant dans le classement.
- Ouvrir le **code d’association et le QR code** de l’enfant ([ci-dessous](#ghep-thiet-bi)).

<a id="ghep-thiet-bi"></a>
## Associer l’appareil d’un enfant

Chaque enfant possède **un code d’association permanent** (et un QR code correspondant). Le code donne uniquement accès au profil de cet enfant, ne contient ni code PIN ni données familiales, et reste identique jusqu’à son renouvellement par un parent.

1. **Obtenir le code de l’enfant** : dans `Family → Child profiles`, copiez le code ou appuyez sur « Afficher le QR code ». Le [code PIN](#pin) est requis s’il a été défini.
2. **Ouvrir l’appareil de l’enfant** : ouvrez l’application, puis « Cet appareil est-il celui d’un enfant ? » et choisissez « Saisir un code ou scanner un QR code » (ou « Code enfant » dans la barre supérieure).
3. **Scanner le QR code ou saisir le code** : l’appareil ouvre automatiquement le profil de l’enfant concerné. Le message « Connexion réussie ! » apparaît et l’enfant appuie sur « Commencer les tâches ».

Après l’association, l’appareil ouvre directement l’[écran de l’enfant](02-man-hinh-be.md), sans afficher le tableau de bord parental ni les pages de vente.

- **Renouveler le code** d’un enfant (« Créer un nouveau code pour cet enfant ») ou de **tous les enfants** (« Créer de nouveaux codes enfants ») : les anciens codes cessent de fonctionner. Faites-le uniquement si vous pensez qu’un code a été divulgué. Un code PIN est requis.
- Si l’appareil photo ne s’ouvre pas : autorisez son utilisation, vérifiez que la connexion est sécurisée (https) ou saisissez le code manuellement.
- Un trop grand nombre de tentatives incorrectes entraîne une limitation d’accès ([9](09-bao-mat-va-rieng-tu.md#ma-ghep)).

<a id="thiet-bi"></a>
## Gérer les appareils

`Settings → Devices & family rhythm → Children's devices` répertorie les appareils associés : enfant concerné, dernière activité et expiration éventuelle de l’accès. **Révoquez immédiatement l’accès** en cas de perte ou d’inutilisation d’un appareil (code PIN requis). Chaque appareil ne peut accéder qu’au profil d’**un seul** enfant.

<a id="nguoi-cham-soc"></a>
## Inviter un aidant

Pour les grands-parents ou proches qui souhaitent suivre la progression sans **pouvoir rien modifier**.

1. Dans `Settings`, appuyez sur **Créer une invitation pour un aidant**. Le lien à **usage unique** n’apparaît qu’à sa création et **expire au bout de 72 heures**. Copiez-le et transmettez-le à la personne.
2. La personne invitée ouvre le lien, se connecte avec Google et accepte l’invitation. Si celle-ci a expiré, a été révoquée ou si le compte appartient déjà à une autre famille, le message « Invitation invalide… » apparaît.
3. La personne ouvre l’**Espace de l’aidant** et consulte la progression en lecture seule : « Aujourd’hui : x / y tâches » (y correspond aux tâches prévues aujourd’hui selon leur fréquence ; en l’absence de tâche : « Aucune tâche prévue aujourd’hui »), « 7 derniers jours : x / y », habitudes de chaque enfant et total des tâches terminées « Depuis toujours » à titre secondaire. Les aidants ne voient que les décomptes quotidiens, pas les tâches effectuées, leur horaire ni les notes.
4. Les parents peuvent **révoquer l’invitation** à tout moment depuis la liste « Invitations actives ».

<a id="cai-dat"></a>
## Groupes de paramètres

`Family → Settings` est divisé en groupes ; la barre « Groupes de paramètres » permet d’accéder à chaque section :

| Groupe | Contenu |
|---|---|
| **Appareils et rythme familial** | Appareils des enfants, installation de l’application, aidants, [pause familiale](#tam-nghi) |
| **Compte et synchronisation** | Coordonnées du client, codes cadeaux, données familiales |
| **Confidentialité et notifications** | Classement public, mesures anonymes, rappels |
| **Apparence** | Clair, sombre, paramètres de l’appareil |
| **Protéger l’espace parental** | Code PIN |
| **Offres et parrainage** | Champ du code de parrainage, carte Parrainer un proche (en bas de page, visible uniquement lorsque vous êtes connecté) |

La barre d’adresse mémorise la section ouverte (par exemple `?section=settings#settings-security`) : après rechargement, vous revenez à cette section et le bouton Retour du navigateur affiche la précédente. Le lien ne sélectionne qu’une section de l’espace parental et ne déverrouille rien ; en mode enfant, la partie `section` est ignorée.
En bas de page se trouvent « Ouvrir le guide d’utilisation » (page `/docs` de l’application ; voir [obtenir de l’aide dans l’application](01-bat-dau.md#tro-giup)) et des liens vers Confidentialité, Conditions et Contacter l’assistance ([11](11-website-va-trang-cong-khai.md)).

<a id="tai-khoan"></a>
## Compte et synchronisation

- **État** : « Compte familial », vérifié, « Cloud prêt ». Les données familiales sont synchronisées automatiquement sur les téléphones, tablettes et ordinateurs, sans configuration technique.
- **Coordonnées du client** : nom complet, numéro de téléphone (9 à 15 chiffres), adresse électronique (lecture seule) et choix de recevoir des guides et des offres. Elles servent à votre compte et à vos paiements.
- **Code promotionnel** : saisissez un code cadeau pour ajouter des jours d’accès ([7](07-goi-va-thanh-toan.md#coupon)).

<a id="rieng-tu"></a>
## Confidentialité et notifications

- **Partager dans le classement public** : option pour toute la famille, **désactivée par défaut**, modifiable uniquement par un parent. Lorsqu’elle est activée, seuls les enfants choisis dans leur [profil](#ho-so) apparaissent avec pseudonyme, avatar, score de la période, série et rang. Désactivez-la à tout moment ([9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai)).
- **Mesures anonymes** : consentement parental, désactivé par défaut. Aucune destination de collecte n’est actuellement configurée ; les événements ne quittent donc pas l’appareil ([analytique produit](../product-analytics.md)).
- **Rappels** : voir [ci-dessous](#nhac-viec).

<a id="nhac-viec"></a>
### Rappels aux parents

Activez « Autoriser les rappels pour les éléments nécessitant une attention » pour recevoir un rappel lorsqu’une tâche ou récompense doit être approuvée. Les rappels concernent uniquement les éléments à approuver, jamais la publicité, et peuvent être désactivés à tout moment. Pour recevoir des notifications hors de l’application, appuyez sur « Autoriser les notifications sur cet appareil » ; si l’appareil les bloque, les rappels restent visibles dans l’application (voir la [bannière Aujourd’hui](03-hom-nay-va-duyet-viec.md#nhac-viec-ngan)).

<a id="giao-dien"></a>
## Apparence

- **Clair, Sombre, Paramètres de l’appareil** dans le groupe Apparence.
- **Police et taille** : ouvrez la fenêtre « Paramètres de police et de taille » dans la barre supérieure pour faciliter autant que possible la lecture de votre enfant.
- **Langue** : sélecteur dans la barre supérieure ([1](01-bat-dau.md#ngon-ngu)).
- **Interface de l’enfant selon l’âge** : épinglez-la lors de la [modification du profil](#ho-so).

<a id="pin"></a>
## Code PIN parental

Le code PIN comporte **exactement 4 chiffres** et protège l’espace de gestion familiale. Ne le communiquez pas aux enfants.

- **Créer** : saisissez le code PIN, puis saisissez-le de nouveau pour confirmer. **Modifier** : saisissez le code PIN actuel, puis deux fois le nouveau.
- Lorsqu’un code PIN est défini, le passage de l’écran enfant au mode Parent exige sa saisie. Après validation, ce navigateur reste déverrouillé pendant **2 heures** ; un nouveau verrouillage efface le déverrouillage.
- Ces actions sensibles nécessitent ce déverrouillage : consulter ou modifier un code de connexion d’enfant, révoquer un appareil, approuver des tâches ou récompenses, ajouter ou déduire des étoiles manuellement, créer un paiement, supprimer la famille, enregistrer des coordonnées bancaires ou retirer des commissions de parrainage. Si l’espace n’est pas déverrouillé, l’application revient à l’écran de verrouillage.
- Le retrait d’une commission de parrainage nécessite qu’un code PIN soit **défini pour la famille** ([8](08-gioi-thieu-ban-be.md#rut-tien)).
- Après trop de tentatives incorrectes, vous devez attendre quelques minutes (« Vous avez fait trop de tentatives »).
- Un enfant qui marque une tâche comme terminée sur l’appareil du parent **n’a pas besoin** du code PIN.

<a id="tam-nghi"></a>
## Faire une pause en famille

Dans `Settings → Family break`, appuyez sur **Faire une pause**, puis confirmez que toute la famille a besoin de repos (maladie, voyage ou vacances). Pendant la pause :

- l’écran enfant masque les rappels de progression, séries et classement, et affiche un message bienveillant ([2](02-man-hinh-be.md#tam-nghi-be)) ;
- les enfants peuvent continuer leurs tâches ; étoiles, récompenses et tâches ne sont pas supprimées ;
- les jours de pause ne brisent pas la [série](02-man-hinh-be.md#sao-cap-chuoi) et ne comptent pas comme manqués dans le [calcul des phases](06-khoa-hoc-thoi-quen.md#logic) ;
- les [rappels](#nhac-viec) sont suspendus.

Appuyez sur **Reprendre** lorsque vous le souhaitez.

<a id="pwa"></a>
## Installer l’application

La carte « Installer KidHabit Hero » permet d’ouvrir rapidement l’application comme une application installée, tout en continuant de recevoir les nouvelles versions du site. Sur Android/Chrome, appuyez sur « Installer maintenant » ; sur iPhone, ouvrez Safari → Partager → Ajouter à l’écran d’accueil. Un bouton « Actualiser les données de l’application » est également disponible si nécessaire.

<a id="du-lieu"></a>
## Données familiales

La carte « Données familiales » permet de **télécharger une copie JSON** contenant les profils des enfants, habitudes, historique des réalisations, récompenses, groupes, journaux, signaux et consignations de la façon dont l’enfant a procédé. Le fichier **ne contient ni le code PIN ni les informations de paiement**, mais contient les données de votre enfant ; gardez-le confidentiel. « Restaurer depuis un fichier JSON » concerne uniquement les données stockées sur cet appareil (toutes les données locales seront remplacées) ; pour les comptes Google, les données sont enregistrées sur le serveur de la famille. Exportez séparément le journal de l’enfant depuis [Statistiques](03-hom-nay-va-duyet-viec.md#thong-ke). Suppression définitive : [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu).

<a id="uu-dai"></a>
## Offres et parrainage

Dernier groupe de `Settings`, visible uniquement lorsque vous êtes connecté :

- **Code de parrainage** : champ « Vous avez un code de parrainage d’un proche ? » (affiché uniquement si la famille est admissible).
- **Parrainer un proche** : carte permettant d’obtenir un lien, suivre les commissions et retirer de l’argent ([8](08-gioi-thieu-ban-be.md)).

<a id="lien-quan"></a>
## À consulter également

- Où les enfants saisissent le code et ce qu’ils voient : [2. Écran de l’enfant](02-man-hinh-be.md).
- Limites d’enfants selon le forfait, achat et coupons : [7. Forfaits et paiement](07-goi-va-thanh-toan.md).
- Sécurité des codes d’association et PIN : [9. Sécurité et confidentialité](09-bao-mat-va-rieng-tu.md).
- Un code PIN est nécessaire pour retirer les commissions : [8. Parrainer un proche](08-gioi-thieu-ban-be.md).
