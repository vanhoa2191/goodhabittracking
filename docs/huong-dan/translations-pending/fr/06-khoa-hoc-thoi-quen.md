# 6. Science des habitudes

[← 5. Famille et paramètres](05-gia-dinh-va-cai-dat.md) · [Sommaire](README.md) · [Suivant : 7. Forfaits et paiement →](07-goi-va-thanh-toan.md)

<!--op-->## Dans ce chapitre

[Principes](#nguyen-tac) · [Cadre des 47 habitudes](#khung) · [16 forces et 7 façons de donner](#chan-dung) · [Quatre phases d’une habitude](#bon-pha) · [Logique des suggestions dans l’application](#logic) · [Règles de suggestion](#goi-y) · [Ce que l’application n’affirme pas](#khong-tuyen-bo) · [Fonctionnalités fondées sur ces connaissances](#ung-dung) · [À consulter également](#lien-quan)<!--/op-->

Ce document explique **pourquoi** l’application fonctionne ainsi, pour vous aider à comprendre ses suggestions et à savoir quand agir autrement. La version complète fondée sur les sources est [Science des habitudes et logique adaptative](../habit-science-and-adaptive-logic.md) ; tout le contenu public est vérifié à l’aide du [registre des affirmations](../claims-ledger.md).

<a id="nguyen-tac"></a>
## Principes

1. **Il n’existe pas de durée de « 21 jours ».** Les recherches montrent que le temps nécessaire pour qu’un comportement devienne presque automatique varie fortement d’une personne à l’autre, de quelques semaines à quelques mois, et a surtout été mesuré chez des adultes. L’application ne promet pas la formation d’une habitude après un nombre fixe de jours.
2. **Les déclencheurs comptent plus que la volonté.** Une formulation précise « si… alors… » (« Après m’être brossé les dents, je lis une page ») et un contexte stable aident l’enfant à commencer plus facilement ([déclencheur](04-thiet-ke-thoi-quen.md#chuong-trinh)).
3. **Un oubli ne ruine pas une habitude.** Reprenez simplement le lendemain, sans punition ni recommencement. Plusieurs oublis consécutifs indiquent qu’il faut ajuster l’approche, pas que l’enfant est « paresseux ».
4. **Apportez le soutien nécessaire, puis réduisez-le** : faire ensemble → rappeler → laisser l’enfant agir seul.
5. **Une reconnaissance précise vaut mieux que des récompenses conditionnelles.** Nommez clairement ce que votre enfant vient de faire ; privilégiez les récompenses matérielles avec modération et réduisez-les progressivement. Les étoiles, séries et badges servent uniquement à encourager ; ils ne jugent **pas** le caractère ni ne comparent les enfants.
6. **N’introduisez pas trop d’habitudes nouvelles à la fois.** Les avertissements souples de l’application selon l’âge relèvent d’une convention de conception, et non d’un nombre directement étayé par des données.
7. **Le sommeil est la base** des autres habitudes.

Les seuils précis (7/10 fois, 8/10 fois, 60 %…) indiqués dans le document source ont un niveau de confiance **faible** : ce sont des hypothèses à vérifier avec des données réelles, et non des faits scientifiques.

<a id="khung"></a>
## Cadre des 47 habitudes

Le cadre comprend **47 habitudes pour les enfants de 0 à 18 ans**, organisées selon deux dimensions :

**Cinq étapes** (tranches d’âge indicatives, pas des tests) :

| Étape | Âge | Nom | Rôle de l’adulte |
|---|---|---|---|
| GD1 | 0–3 | Sécurité et bases sensorielles | Montrer l’exemple et décrire |
| GD2 | 3–6 | Exploration et volonté | Faire ensemble et rappeler |
| GD3 | 6–12 | Persévérance et compétences | Encadrer et faire ensemble |
| GD4 | 12–15 | Identité et émotions | Soutenir et convenir de règles communes |
| GD5 | 15–18 | Orientation et responsabilité | Conseiller et soutenir |

**Cinq domaines** : vie intérieure, santé, relations, études, finances.

Chaque habitude présente **son sens pour l’enfant**, **comment l’adulte peut le soutenir**, des signes de progression et des étiquettes de concepts (forces, façons de donner). Les profils d’enfants utilisent **quatre tranches d’âge** (0–3, 3–6, 6–12, 12–18 ans) pour le pack de départ et l’interface ; le [parcours](04-thiet-ke-thoi-quen.md#lo-trinh) et la [bibliothèque](04-thiet-ke-thoi-quen.md#khung-47) emploient les cinq étapes ci-dessus. Données et processus éditoriaux : [Contrat des données du cadre des habitudes](../habit-framework-data-contract.md).

Le cadre est disponible dans l’application ([bibliothèque](04-thiet-ke-thoi-quen.md#khung-47)) et sur le site web ([page du cadre des habitudes](11-website-va-trang-cong-khai.md#trang-khung)).

<a id="chan-dung"></a>
## 16 forces et 7 façons de donner

Les **16 forces** sont des *axes de développement*, et non des types de personnalité servant à étiqueter les enfants : sagesse studieuse, joie paisible, caractère entier, excellence, capacité remarquable, équilibre physique, santé de fer, défense exceptionnelle, communication sage, autodiscipline, vision claire, compréhension de la vie, leadership bienveillant, vertu en action, abondance et bonne fortune, et **humanité accomplie** (seizième force et objectif général). Elles se répartissent en quatre groupes : caractère, vertu, capacité et vision.

- Chaque force est un [badge](02-man-hinh-be.md#huy-hieu) débloqué après la réalisation du nombre requis d’actions associées ; la force 16 se débloque lorsque toutes les autres sont obtenues.

Les **7 façons de donner** sont sept gestes simples que chacun peut offrir chaque jour : **un sourire** (par le visage), **un regard chaleureux** (par les yeux), **des paroles aimables** (par la parole), **la gratitude** (par le cœur), **le pardon** (avec un cœur ouvert), **des actes de bonté** (en rendant service) et **faire de la place aux autres** (en leur cédant de l’espace). L’application emploie des mots courants et ne promet aucun mérite ni résultat spirituel.

Le **guide des 16 forces et du don** (bouton de la barre supérieure) comporte trois onglets :

1. **16 forces et 4 étapes** : choisissez l’âge de votre enfant, consultez les actions détaillées de chaque force, puis choisissez **« Appliquer pour (nom) »** pour ajouter le groupe d’actions au programme.
2. **7 façons de donner** : sens et pratique quotidienne de chacune.
3. **Montrer l’exemple et 6 principes** : art de *montrer l’exemple* (« Ne vous contentez pas d’expliquer les valeurs : vivez celles que vous souhaitez transmettre »), **six mots d’or pour une parentalité avisée** (simple, joyeuse, confiante, douce, cohérente et intentionnelle) et **liste de réflexion du soir en cinq questions** (à prendre deux minutes avant le coucher).

Pour les enfants de **0 à 3 ans**, l’apprentissage se fait principalement par observation ; l’écran affiche donc le « Journal parental de l’exemple » : les parents pratiquent chaque jour les 16 actions de développement du caractère pour montrer la voie à leur enfant. L’activité est attribuée au parent, et non récompensée à l’enfant.

<a id="bon-pha"></a>
## Quatre phases d’une habitude

Chaque habitude de l’enfant passe par quatre phases. La phase dépend **de ce que l’enfant fait réellement**, pas du nombre de jours.

| Phase | Objectif principal | Rôle des adultes |
|---|---|---|
| 1. **Définir le déclencheur** | Choisir le contexte et formuler « si… alors… » | Décider ensemble et consigner le plan |
| 2. **Construire la routine** | Répéter régulièrement dans le même contexte | Faire ensemble ou rappeler, et féliciter précisément |
| 3. **Réduire le soutien** | Passer de l’action faite ensemble au rappel, puis à l’autonomie | Retirer le soutien progressivement, étape par étape |
| 4. **Routine installée** | Vérifier moins souvent | Reconnaître par des mots et intervenir moins |

Passage d’une phase à l’autre : 1→2 lorsqu’un plan de déclenchement existe et que l’enfant l’a essayé au moins 3 fois ; 2→3 après au moins 7 réalisations sur les 10 dernières (habitudes hebdomadaires : 5 sur 6) ; 3→4 lorsque l’enfant l’a **réalisée seul** au moins 8 fois sur les 10 dernières (hebdomadaires : 5 sur 6) ; retour à la phase 3 si le résultat descend sous 6 sur 10. Un seul oubli ne change pas la phase.

<a id="logic"></a>
## Logique des suggestions dans l’application

Les phases et suggestions sont **calculées** à partir des données observées, et ne sont pas stockées comme des valeurs fixes. Chaque occurrence prévue d’une habitude constitue une *occasion* avec l’un de ces résultats : l’enfant l’a réalisée seul, a eu besoin d’un rappel, l’a faite avec quelqu’un, n’a pas indiqué comment il l’a réalisée, l’a manquée ou a choisi de la faire plus tard (ce dernier cas ne compte pas comme un oubli). Une [pause](05-gia-dinh-va-cai-dat.md#tam-nghi) familiale est exclue des occasions. « Manière non consignée » compte comme une tâche terminée, mais **pas comme une réalisation autonome** ; [consigner comment l’enfant a procédé](03-hom-nay-va-duyet-viec.md#muc-ho-tro) rend donc les suggestions plus précises.

Les trois niveaux de difficulté (simple, modéré, complexe) servent uniquement à afficher « généralement quelques semaines / quelques semaines à quelques mois / quelques mois » et à fixer le seuil de suggestion « risque de blocage » ; multipliez-le par 1,5 pour les enfants de moins de 6 ans. La personne qui confirme le niveau de soutien varie aussi selon l’âge : parents pour 0–3 ans ; confirmation parentale pour 3–12 ans ; confirmation parentale avec participation de l’enfant à la conception pour 12–15 ans ; à partir de 15 ans, l’enfant confirme lui-même son autonomie.

<a id="goi-y"></a>
### Règles de suggestion

| Suggestion | Quand elle apparaît | Contenu |
|---|---|---|
| **Blocage pendant la construction** | Durée en phase 2 supérieure au seuil du niveau de difficulté | Simplifier, changer le déclencheur ou l’horaire et prévoir les week-ends et journées chargées |
| **Dépendance aux rappels** | En phase 3, au moins 6 des 10 dernières occasions ont nécessité un rappel | Essayer un repère visuel ou laisser l’enfant définir le rappel |
| **Trop de nouvelles habitudes** | Nombre d’habitudes en phase 1–2 supérieur à la limite d’âge | Mettre temporairement une habitude en pause |
| **Presque une routine** | Seuil de passage à la phase 4 atteint | Passer aux félicitations verbales et réduire progressivement les étoiles |
| **Revenir d’un niveau** | 3 oublis parmi les 5 dernières occasions en phase 3 | Revenir au niveau de soutien précédent |
| **Vérifier comment cela se passe** | 3 oublis consécutifs en phase 2 | Revoir le déclencheur, la difficulté et le plan pour le week-end |
| **Consigner comment l’enfant a procédé** | Plus de la moitié des occasions récentes ne sont pas consignées et l’habitude approche du seuil de transition | Demander avec douceur : « Comment as-tu fait ? » |

La limite de nouvelles habitudes simultanées (avertissement souple, sans blocage) est de 1 pour 0–3 ans, 2 pour 3–6 ans, 3 pour 6–15 ans et 4 à partir de 15 ans. Trois suggestions au maximum sont affichées par enfant ; la suggestion « Plus tard » reste masquée 14 jours. Cette analyse sert **uniquement à guider les parents** et ne sert jamais à classer ni comparer les enfants.

<a id="khong-tuyen-bo"></a>
## Ce que l’application n’affirme pas

- Elle ne dit pas qu’une habitude se forme après un nombre fixe de jours et ne promet pas de résultat particulier (meilleurs résultats scolaires, meilleur comportement) pour un enfant.
- Elle ne prétend pas que l’efficacité des badges, séries ou étoiles pour accroître la motivation a été « prouvée ».
- Elle n’étiquette pas les enfants (« lent », « faible », « paresseux ») et ne les compare pas.
- Le contenu sur la santé ne remplace pas les conseils d’un médecin ou d’un psychologue.
- Le contenu philosophique du cadre est exprimé en langage courant et n’est pas présenté comme une conclusion scientifique.

<a id="ung-dung"></a>
## Fonctionnalités fondées sur ces connaissances

| Connaissance | Fonctionnalité |
|---|---|
| Déclencheurs « Si… alors… » | [Déclencheurs et programmes](04-thiet-ke-thoi-quen.md#chuong-trinh) |
| Quatre phases, réduction du soutien | [Consigner comment l’enfant a procédé](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [Progression et suggestions](03-hom-nay-va-duyet-viec.md#tien-trien), [Bilan hebdomadaire](03-hom-nay-va-duyet-viec.md#nhin-lai-tuan) |
| Un oubli n’est pas grave | [Série](02-man-hinh-be.md#sao-cap-chuoi), [report](02-man-hinh-be.md#hoan-thanh), [pause](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Limiter les nouvelles habitudes simultanées | [Parcours par âge](04-thiet-ke-thoi-quen.md#lo-trinh) (ajout d’une habitude à chaque étape), avertissements de limite |
| Félicitations verbales | [Encouragement](02-man-hinh-be.md#hoan-thanh), [Lettre du matin](02-man-hinh-be.md#thu-buoi-sang), [boutique privilégiant les expériences](04-thiet-ke-thoi-quen.md#kho-qua) |
| 16 forces et 7 façons de donner | [Badge](02-man-hinh-be.md#huy-hieu), [Cadre des 47 habitudes](04-thiet-ke-thoi-quen.md#khung-47), guide |
| Montrer l’exemple | Enfants de 0 à 3 ans, « Profil parental de l’exemple » dans la barre supérieure |

<a id="lien-quan"></a>
## À consulter également

- Appliquer le cadre et les programmes : [4. Concevoir des habitudes](04-thiet-ke-thoi-quen.md).
- Consulter les suggestions et la progression : [3. Aujourd’hui et suivi des tâches](03-hom-nay-va-duyet-viec.md).
- Articles destinés aux parents sur le site : [11. Site web et pages publiques](11-website-va-trang-cong-khai.md#blog).
- Règles concernant les données des enfants : [9. Sécurité et confidentialité](09-bao-mat-va-rieng-tu.md).
