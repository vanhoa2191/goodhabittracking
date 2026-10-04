# Guide d’utilisation de KidHabit Hero

Ce guide décrit **toutes les fonctionnalités de KidHabit Hero** telles que les utilisateurs les voient et les utilisent, puis montre comment elles sont **reliées** entre elles. Chaque fichier commence par « Dans ce guide » et se termine par « À consulter également », afin de passer d’une fonctionnalité à celles qui lui sont liées sans recommencer vos recherches.

KidHabit Hero aide les parents et les enfants à développer de bonnes habitudes grâce à de petites actions quotidiennes : les parents attribuent des tâches, les enfants les marquent comme terminées, les parents les approuvent et les enfants gagnent des étoiles qu’ils peuvent échanger contre des récompenses choisies par leurs parents. Les étoiles ne servent pas à comparer les enfants ni à juger leur caractère ([voir les principes](06-khoa-hoc-thoi-quen.md#nguyen-tac)).

## Parcours selon votre rôle

| Vous êtes | À lire dans cet ordre |
|---|---|
| Un parent qui découvre l’application | [1. Premiers pas](01-bat-dau.md) → [2. Écran de l’enfant](02-man-hinh-be.md) → [3. Aujourd’hui et approbations](03-hom-nay-va-duyet-viec.md) |
| Un parent qui souhaite concevoir des habitudes | [4. Concevoir des habitudes](04-thiet-ke-thoi-quen.md) → [6. Science des habitudes](06-khoa-hoc-thoi-quen.md) |
| Un parent qui gère la famille et les appareils | [5. Famille et paramètres](05-gia-dinh-va-cai-dat.md) → [9. Sécurité et confidentialité](09-bao-mat-va-rieng-tu.md) |
| Un parent intéressé par les forfaits et le paiement | [7. Forfaits et paiement](07-goi-va-thanh-toan.md) → [8. Parrainer un proche](08-gioi-thieu-ban-be.md) |
| Un opérateur ou un agent d’assistance | [10. Administration et opérations](10-quan-tri-va-van-hanh.md) |
| Un visiteur du site ou un rédacteur | [11. Site web et pages publiques](11-website-va-trang-cong-khai.md) |
| Une personne qui souhaite une vue d’ensemble | [12. Carte des liens et scénarios](12-ban-do-lien-ket.md) et [13. Glossaire](13-thuat-ngu.md) |

## Sommaire

1. [Premiers pas](01-bat-dau.md) : façons d’accéder à l’application, connexion, configuration d’une famille, rôles, langue et démonstration.
2. [Écran de l’enfant](02-man-hinh-be.md) : tâches, achèvement, report, minuteurs, étoiles, niveaux, séries, badges, récompenses, classements, mascottes, lettres du matin, journaux et ville de rêve.
3. [Aujourd’hui et approbations](03-hom-nay-va-duyet-viec.md) : tâches et récompenses en attente, progression de chaque enfant, bilan hebdomadaire, statistiques, impression et partage.
4. [Concevoir des habitudes](04-thiet-ke-thoi-quen.md) : gestion des tâches, bibliothèque, cadre des 47 habitudes, programmes et déclencheurs, parcours par âge et bibliothèque de récompenses.
5. [Famille et paramètres](05-gia-dinh-va-cai-dat.md) : profils des enfants, association des appareils, aidants, compte, code PIN, apparence, confidentialité, rappels, installation, données et pause.
6. [Science des habitudes](06-khoa-hoc-thoi-quen.md) : principes, quatre phases, logique de suggestion, 16 forces de caractère et 7 façons de donner.
7. [Forfaits et paiement](07-goi-va-thanh-toan.md) : essais, forfaits, PayOS, activation, codes promotionnels, remboursements et courriels.
8. [Parrainer un proche](08-gioi-thieu-ban-be.md) : codes de parrainage, réductions de 10 %, commissions de 30 % et retraits.
9. [Sécurité et confidentialité](09-bao-mat-va-rieng-tu.md) : codes PIN et d’association, consentement, données des enfants et suppression des données.
10. [Administration et opérations](10-quan-tri-va-van-hanh.md) : page d’administration, rôles, assistance, tâches en arrière-plan et documentation technique.
11. [Site web et pages publiques](11-website-va-trang-cong-khai.md) : page d’accueil, blog, cadre, parcours, science et pages juridiques.
12. [Carte des liens et scénarios](12-ban-do-lien-ket.md) : diagrammes de dépendances, parcours de bout en bout et résolution des problèmes.
13. [Glossaire](13-thuat-ngu.md).

<!--op-->## Deux espaces et trois groupes d’utilisateurs

KidHabit Hero comporte deux espaces distincts, chacun avec sa propre adresse :

| Espace | Adresse | Utilisation | Documentation |
|---|---|---|---|
| **Application** | `app.kidhabithero.com` | Connexion, gestion de la famille, tâches des enfants, paiement et administration | 1 à 10 |
| **Site de présentation** | `kidhabithero.com` | Présentation, tarifs, blog, cadre des habitudes et conditions | [11](11-website-va-trang-cong-khai.md) |

L’application distingue trois groupes d’utilisateurs, chacun ayant accès à son propre espace :

- **Parents** (propriétaires de la famille, parents, tuteurs) : se connectent avec Google et accèdent aux espaces Aujourd’hui, Conception et Famille.
- **Enfants** : accèdent à l’application avec un code ou un QR code fourni par un parent (aucun compte requis) et ne voient que leur propre espace.
- **Aidants** (grands-parents ou proches) : sont invités par les parents et peuvent uniquement consulter la progression ; ils ne peuvent rien modifier.<!--/op-->

## Catalogue des fonctionnalités

La colonne « État » indique si une fonctionnalité est activée pour tous les utilisateurs (**Activée**) ou pas encore disponible (**Désactivée**).<!--op--> Cet état provient des variables de configuration de la version actuelle ; les opérateurs peuvent le modifier dans [le déploiement](../deployment.md).<!--/op-->

| Fonctionnalité | Utilisateurs | Emplacement | Condition | État | Liens |
|---|---|---|---|---|---|
| Connexion Google | Parents | Écran d’accès | Aucune | Activée | [1](01-bat-dau.md#dang-nhap) |
| Connexion avec un code envoyé par courriel | Parents | Écran d’accès | Non disponible<!--op--> (`emailCodeLogin` flag)<!--/op--> | **Désactivée** | [1](01-bat-dau.md#dang-nhap) |
| Démonstration (données d’exemple) | Tout le monde | Écran d’accès | Aucune | Activée | [1](01-bat-dau.md#demo) |
| Création du premier profil d’enfant | Parents | Première utilisation | Consentement à la gestion des données | Activée | [1](01-bat-dau.md#thiet-lap) |
| Neuf langues avec détection automatique | Tout le monde | Partout | Aucune | Activée | [1](01-bat-dau.md#ngon-ngu) |
| Accès de l’enfant avec un code familial ou QR code | Enfants | Écran d’accès | Profil créé par un parent | Activée | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi), [9](09-bao-mat-va-rieng-tu.md#ma-ghep) |
| Tâches quotidiennes selon le moment de la journée | Enfants | Écran de l’enfant | Tâches attribuées | Activée | [2](02-man-hinh-be.md#nhiem-vu) |
| Balayer pour terminer ou reporter une tâche | Enfants | Écran de l’enfant | Aucune | Activée | [2](02-man-hinh-be.md#hoan-thanh) |
| Minuteur pour les tâches chronométrées | Enfants | Écran de l’enfant | Tâche avec une durée en minutes | Activée | [2](02-man-hinh-be.md#dem-gio) |
| Lecture à voix haute des tâches | Enfants | Écran de l’enfant | Appareil compatible | Activée | [2](02-man-hinh-be.md#doc-to) |
| Étoiles, niveaux et séries | Enfants, parents | Les deux | Aucune | Activée | [2](02-man-hinh-be.md#sao-cap-chuoi) |
| Badges (5 de base et 16 profils de caractère) | Enfants | Écran de l’enfant | Tâches terminées | Activée | [2](02-man-hinh-be.md#huy-hieu), [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Échanger des récompenses et définir des objectifs | Enfants, parents | Les deux | Bibliothèque de récompenses créée par un parent | Activée | [2](02-man-hinh-be.md#qua), [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Classements familiaux et de groupe | Enfants | Écran de l’enfant | Aucune | Activée | [2](02-man-hinh-be.md#bang-xep-hang) |
| Classement public | Enfants | Écran de l’enfant | Un parent l’active et choisit l’enfant | Activée (désactivée par défaut pour chaque famille) | [5](05-gia-dinh-va-cai-dat.md#rieng-tu), [9](09-bao-mat-va-rieng-tu.md#bxh-cong-khai) |
| Mascottes et couleurs | Enfants | Écran de l’enfant | Changement de mascotte une fois tous les 7 jours | Activée | [2](02-man-hinh-be.md#linh-vat) |
| Lettre matinale de la mascotte | Enfants | Écran de l’enfant | À partir de 07:00 | **Activée** | [2](02-man-hinh-be.md#thu-buoi-sang) |
| Journal en une phrase | Enfants, parents | Les deux | Aucune | **Activée** | [2](02-man-hinh-be.md#nhat-ky), [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Ville de rêve | Enfants | Écran de l’enfant | Construire avec des étoiles | **Activée** | [2](02-man-hinh-be.md#thanh-pho) |
| Apparence selon l’âge | Enfants, parents | Les deux | Épinglage possible par les parents | **Activée** | [2](02-man-hinh-be.md#giao-dien-tuoi), [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Approbation des tâches et récompenses | Parents | Aujourd’hui | Code PIN si défini | Activée | [3](03-hom-nay-va-duyet-viec.md#duyet) |
| Ajout ou déduction manuelle d’étoiles | Parents | Profils des enfants | Code PIN si défini | Activée | [3](03-hom-nay-va-duyet-viec.md#chinh-sao) |
| Vue Aujourd’hui de l’enfant, progression et bilan hebdomadaire | Parents | Aujourd’hui | Programme d’habitudes requis pour la progression et le bilan | **Activée** | [3](03-hom-nay-va-duyet-viec.md#hom-nay) |
| Enregistrer comment l’enfant a réalisé la tâche | Parents, enfants dès 15 ans | Aujourd’hui, écran de l’enfant | Programme d’habitudes activé | **Activée** | [3](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [6](06-khoa-hoc-thoi-quen.md#bon-pha) |
| Statistiques sur 7 jours, impression hebdomadaire et partage d’étapes marquantes | Parents | Aujourd’hui → Statistiques | Aucune | Activée | [3](03-hom-nay-va-duyet-viec.md#thong-ke) |
| Gérer les tâches et en créer de nouvelles | Parents | Conception → Gestion des tâches | Forfait requis | Activée | [4](04-thiet-ke-thoi-quen.md#quan-ly-viec) |
| Cadre des 47 habitudes pour les 0 à 18 ans | Parents | Gestion des tâches → Bibliothèque | Forfait requis | Activée | [4](04-thiet-ke-thoi-quen.md#khung-47), [6](06-khoa-hoc-thoi-quen.md#khung) |
| Programme et déclencheurs « si… alors… » | Parents | Gestion des tâches | Programme d’habitudes activé | **Activée** | [4](04-thiet-ke-thoi-quen.md#chuong-trinh), [6](06-khoa-hoc-thoi-quen.md#logic) |
| Parcours par âge (5 étapes) | Parents | Conception → Parcours | Forfait requis | Activée | [4](04-thiet-ke-thoi-quen.md#lo-trinh) |
| Guide des 16 profils de caractère et des 7 façons de donner | Parents | Barre supérieure | Aucune | Activée | [6](06-khoa-hoc-thoi-quen.md#chan-dung) |
| Bibliothèque de récompenses et suggestions | Parents | Conception → Récompenses | Forfait requis | Activée | [4](04-thiet-ke-thoi-quen.md#kho-qua) |
| Profils des enfants et forfaits par âge | Parents | Famille → Profils des enfants | Nombre d’enfants selon le forfait | Activée | [5](05-gia-dinh-va-cai-dat.md#ho-so) |
| Associer et révoquer des appareils | Parents | Profils des enfants, Paramètres | Code PIN si défini | Activée | [5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi) |
| Inviter un aidant (consultation uniquement) | Parents | Paramètres | Lien valable 72 heures | Activée | [5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc) |
| Code PIN parental | Parents | Paramètres | Aucune | Activée | [5](05-gia-dinh-va-cai-dat.md#pin), [9](09-bao-mat-va-rieng-tu.md#pin) |
| Mettre toute la famille en pause | Parents | Paramètres | Aucune | Activée | [5](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Rappels aux parents | Parents | Paramètres | Consentement parental | **Activée** | [5](05-gia-dinh-va-cai-dat.md#nhac-viec) |
| Installer l’application (PWA) | Tout le monde | Paramètres, navigateur | Aucune | Activée | [5](05-gia-dinh-va-cai-dat.md#pwa) |
| Télécharger et restaurer les données familiales | Parents | Paramètres | Aucune | Activée | [5](05-gia-dinh-va-cai-dat.md#du-lieu) |
| Supprimer définitivement les données familiales | Propriétaire de la famille | Statistiques | Saisir `DELETE FAMILY` | Activée | [9](09-bao-mat-va-rieng-tu.md#xoa-du-lieu) |
| Essai de 7 jours | Parents | `/start`, tarifs, configuration | Une fois par famille | Activée | [7](07-goi-va-thanh-toan.md#dung-thu) |
| Paiement VietQR par PayOS | Parents | Tarifs, `/checkout` | Connexion requise | Activée | [7](07-goi-va-thanh-toan.md#thanh-toan) |
| Code cadeau (coupon) | Parents | Famille → Compte | Code valide | Activée | [7](07-goi-va-thanh-toan.md#coupon) |
| Parrainage, réduction de 10 %, commission de 30 % | Parents | Paramètres, lien `?ref=` | Code PIN requis pour retirer de l’argent | Activée | [8](08-gioi-thieu-ban-be.md) |
| Courriels liés au cycle de vie | Parents | Boîte de réception | Configuration du courriel | Selon la configuration | [7](07-goi-va-thanh-toan.md#email) |
| Page d’administration (6 sections) | Administrateurs | `/admin` | Rôle et vérification en deux étapes | Activée | [10](10-quan-tri-va-van-hanh.md#admin) |

## Conventions de ce guide

- **Les chemins dans l’application** utilisent la forme `Espace → Élément`, par exemple `Famille → Paramètres`.
- « Un forfait » signifie que la famille est en période d’essai ou dispose d’un forfait qui n’a pas expiré ([7](07-goi-va-thanh-toan.md)).
- « Code PIN si défini » signifie que l’action n’est exécutée qu’après saisie du code PIN parental valide dans ce navigateur ([5](05-gia-dinh-va-cai-dat.md#pin)).
- Les prix, seuils et délais indiqués sont ceux en vigueur à la date de rédaction ; la source faisant autorité est la documentation technique liée à la fin de chaque fichier.

<!--op-->## Maintenir le guide à jour

- Lorsqu’une fonctionnalité est ajoutée ou modifiée, mettez à jour le **catalogue des fonctionnalités ci-dessus** et le fichier qui la décrit ; ajoutez des liens vers les fonctionnalités associées à la fin du fichier (« À consulter également »).
- Chaque section possède une ancre `<a id="…"></a>` pour créer des liens ; ne renommez pas les ancres déjà utilisées. Le test `tests/unit/user-guide-links.test.ts` signale les liens internes ou ancres cassés.
- Les prix, seuils et indicateurs de version proviennent du code source ; si les valeurs diffèrent, le code source fait foi : mettez le guide à jour en conséquence.
- Dernière mise à jour : 10/03/2026.
- Les chapitres 1 à 9, 12 et 13 apparaissent aussi dans l’application (`/docs` et le ? dans l’espace parental). Après toute modification du Markdown, exécutez `npm run guide:build` pour reconstruire `public/guide` ; le test `tests/unit/guide-build.test.ts` signale si vous l’oubliez. Le contenu destiné uniquement aux opérateurs doit être placé entre les commentaires HTML `<!-- op -->` et `<!-- /op -->` (écrits sans espaces ; des espaces sont ajoutés ici pour rendre cet exemple inopérant) et n’apparaît pas dans l’application.
- **Traductions :** placez la traduction de chaque chapitre (même nom de fichier, en conservant chaque ligne `<a id="…"></a>`, chaque cible de lien et le nombre de lignes, colonnes et éléments de liste) dans `docs/huong-dan/i18n/<language code>/`, ajoutez le code à `GUIDE_TRANSLATIONS` dans `src/lib/guide/guide-locale.ts`, puis exécutez `npm run guide:build`. Le test `tests/unit/guide-translations.test.ts` compare la structure de chaque traduction à la version vietnamienne. Lorsqu’un chapitre vietnamien est modifié, mettez à jour les traductions correspondantes.
- Pour ajouter un ?, ajoutez son code dans `src/lib/guide/help-topic-id.ts`, rédigez une explication (en vietnamien et en anglais) dans `src/lib/guide/help-topics.ts` qui renvoie à une section existante du guide, puis placez `<HelpTip topic="…" />` à côté du titre dans l’écran concerné.

## Documentation technique associée

[Architecture](../architecture.md) · [Sécurité et confidentialité](../security-privacy.md) · [Science des habitudes et logique adaptative](../habit-science-and-adaptive-logic.md) · [Contrat des données du cadre des habitudes](../habit-framework-data-contract.md) · [Programme de parrainage](../affiliate-program.md) · [Analytique produit](../product-analytics.md) · [Déploiement](../deployment.md) · [Récupération des données](../data-recovery.md) · [Registre des affirmations](../claims-ledger.md) · [Guide de publication du blog](../blog-guide.md) · [Courriels et remboursements](../runbooks/lifecycle-and-refunds.md)<!--/op-->
