# 9. Sécurité et confidentialité

[← 8. Parrainer un proche](08-gioi-thieu-ban-be.md) · [Sommaire](README.md) · [Suivant : 10. Administration et opérations →](10-quan-tri-va-van-hanh.md)

<!--op-->## Dans ce guide

[Données stockées](#du-lieu) · [Qui peut voir quoi](#ai-thay) · [Code d’association de votre enfant](#ma-ghep) · [Code PIN](#pin) · [Consentement](#dong-thuan) · [Classement public](#bxh-cong-khai) · [Partage d’étapes marquantes](#chia-se) · [Confidentialité du parrainage](#gioi-thieu-rieng-tu) · [Suggestions par IA](#goi-y-ai) · [Mesures et rappels](#do-luong) · [Téléchargement et suppression des données](#xoa-du-lieu) · [Mesures de protection techniques](#ky-thuat) · [Limites juridiques](#phap-ly) · [Sujets associés](#lien-quan)<!--/op-->

Cette page explique en termes simples comment KidHabit protège les données de votre enfant. Pour les détails techniques, consultez [Sécurité et confidentialité](../security-privacy.md).

<a id="du-lieu"></a>
## Données stockées

L’application stocke le profil de votre enfant (nom, pseudonyme, âge), ses habitudes, sa progression, ses points, ses récompenses et ses appareils associés, ainsi que le forfait souscrit et les coordonnées du parent (nom complet, numéro de téléphone, adresse électronique). Les fonctionnalités facultatives peuvent aussi inclure un journal en une phrase, un plan de déclenchement, la façon dont votre enfant a réalisé chaque tentative et une liste de souhaits. **Nous n’envoyons jamais** les données de votre enfant, les codes de session, codes PIN, clés PayOS ou contenus de webhook à un système analytique.

<a id="ai-thay"></a>
## Qui peut voir quoi

| Personne | Peut voir | Ne peut pas voir |
|---|---|---|
| Parent | Toutes les données de sa propre famille | Les données des autres familles |
| Aidant | Noms des enfants, habitudes actives (avec leur fréquence), nombre total de tâches terminées ou approuvées par enfant et décompte quotidien des 7 derniers jours, en lecture seule | Ne peut rien modifier ; ne voit ni les tâches individuelles, heures, notes, âge, pseudonymes, récompenses, groupes, forfaits, paiements, paramètres ni les autres membres |
| Enfant (appareil associé) | Ses propres données | Profils des autres enfants, paiements, paramètres ou code PIN |
| Opérateur | Profils des parents (nom, adresse électronique, téléphone), forfaits et commandes ; chaque action est consignée | Profils des enfants, tâches ou journal de l’enfant |

Chaque famille est isolée des autres au niveau de la base de données : un compte ne peut pas lire ni écrire les données d’une autre famille, même en cas de problème d’interface. Chaque donnée appartient à un `family_id` ; forfaits et avantages sont liés à la famille, et non à une adresse électronique.

<a id="ma-ghep"></a>
## Code d’association de votre enfant

- Chaque code ouvre **un seul profil d’enfant** et ne contient ni code PIN ni donnée familiale. La base de données ne conserve qu’une empreinte du code.
- La session de l’appareil de votre enfant est enregistrée dans un cookie HTTP uniquement, inaccessible aux scripts de la page ; chaque requête ne renvoie que les données d’un seul enfant.
- Les saisies répétées d’un code erroné sont soumises à une **limitation du débit**.
- Les parents peuvent **renouveler le code** (l’ancien devient invalide) et **révoquer des appareils individuellement** à tout moment ([5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)). L’affichage, la modification ou la révocation d’un code nécessite le code PIN.

<a id="pin"></a>
## Code PIN

Le code PIN à 4 chiffres est vérifié par le **serveur**. Après sa saisie correcte, le navigateur reçoit un cookie de déverrouillage signé et associé au parent et à la famille. Il reste valide pendant **2 heures** et est supprimé lorsque vous verrouillez de nouveau l’espace. Pour les familles ayant défini un code PIN, les actions sensibles sont refusées tant que l’espace n’est pas déverrouillé : supprimer la famille, révoquer des appareils, consulter ou modifier des codes d’association, créer des paiements, approuver des tâches ou des récompenses, ajouter ou déduire manuellement des étoiles et consulter les informations de versement du parrainage. Un enfant peut terminer une tâche sur l’appareil du parent sans saisir le code PIN. Pour définir un code PIN, consultez [5](05-gia-dinh-va-cai-dat.md#pin).

<a id="dong-thuan"></a>
## Consentement

- Lors de la [configuration de la famille](01-bat-dau.md#thiet-lap), l’adulte doit confirmer être parent ou tuteur légal et accepter le stockage des données de l’enfant. Le consentement est conservé avec la **version de la politique**.
- Le classement public, les mesures anonymes, les rappels et les offres promotionnelles sont des **choix facultatifs**, **désactivés par défaut**, et peuvent être désactivés à nouveau. Les retraits sont conservés sous forme d’horodatage plutôt que de supprimer l’historique du consentement.
- Les aidants ne peuvent accéder à la famille qu’avec une invitation à usage unique créée par un parent (valable 72 heures) ; elle peut être révoquée ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="bxh-cong-khai"></a>
## Classement public

Un enfant apparaît dans le classement public uniquement si **les deux conditions** suivantes sont réunies : la famille a activé le partage (désactivé par défaut et modifiable uniquement par un parent) **et** son profil a été inscrit au classement (les nouveaux profils sont privés par défaut). Le classement n’affiche que le pseudonyme (ou « Super Kid »), l’avatar, les points gagnés pendant la période, la série et le rang ; il ne contient **ni** code d’enfant ou de famille, vrai nom ni âge. Les points sont calculés à partir des tâches confirmées pendant la période, et non du solde actuel ; échanger des étoiles contre des récompenses ne modifie donc pas le classement. Les classements familial et de groupe n’utilisent que les données de leurs périmètres respectifs. Paramètres : [5](05-gia-dinh-va-cai-dat.md#rieng-tu) ; vue de l’enfant : [2](02-man-hinh-be.md#bang-xep-hang).

<a id="chia-se"></a>
## Partage d’étapes marquantes

L’option « Partager une étape positive » ([3](03-hom-nay-va-duyet-viec.md#thong-ke)) affiche toujours **un aperçu que vous pouvez confirmer** avant d’ouvrir le panneau de partage de l’appareil. Par défaut, le contenu ne comporte ni nom, âge, photo ou tâche de l’enfant, ni code de suivi.

<a id="gioi-thieu-rieng-tu"></a>
## Confidentialité du parrainage

Le code de parrainage est conservé dans le cookie `kidhabit_ref` pendant 60 jours (puis supprimé après son enregistrement). Seuls les administrateurs autorisés peuvent consulter les coordonnées bancaires du parrain ; celui-ci ne voit que les quatre derniers chiffres. Les parrains **ne voient jamais** d’informations sur la famille parrainée ([8](08-gioi-thieu-ban-be.md)).

<a id="goi-y-ai"></a>
## Suggestions par IA

Cette fonctionnalité est activée progressivement et **désactivée par défaut** ; elle apparaît uniquement après votre accord dans Paramètres → Confidentialité (carte **Suggestions par IA**). Lorsque vous appuyez sur un bouton de suggestion, l’application demande à un modèle d’IA (Cloudflare Workers AI) de préparer une proposition :

- **Suggérer des petites étapes avec l’IA** (dans le formulaire d’habitude) : seuls **le nom de l’habitude que vous venez de saisir** (après suppression des liens, adresses électroniques et numéros de téléphone) et une tranche d’âge sont transmis.
- **Résumer la semaine avec l’IA** : seuls **les décomptes de la semaine** (réalisées seul, avec un rappel, ensemble, non réalisées) sont transmis, sans nom d’habitude ni nom d’enfant.

**Ne sont jamais transmis** : nom ou pseudonyme de l’enfant, journal, texte écrit par l’enfant, photos ou votre adresse électronique. Les données envoyées et les réponses ne sont **pas inscrites dans les journaux système**. Le résultat est uniquement une suggestion marquée « rédigée par l’IA » : vous la lisez et choisissez **Utiliser** ou **Ignorer** ; l’application ne l’applique jamais d’elle-même. Chaque famille dispose d’un nombre limité de suggestions quotidiennes et la fonction s’interrompt lorsque le quota partagé est épuisé. Comme les autres actions sensibles, elle nécessite votre code PIN. La désactivation de l’option l’arrête immédiatement.

<a id="do-luong"></a>
## Mesures et rappels

- Les **mesures anonymes** sont strictement délimitées : les événements ne contiennent ni noms, contenu des habitudes, codes d’enfant/famille/utilisateur ou d’association, données de paiement ni horodatages précis. **Aucune destination de collecte n’est actuellement configurée** ; rien ne quitte donc l’appareil, même si un parent donne son consentement. Aucun indicateur (utilisateurs actifs quotidiens, fidélisation, NPS, etc.) ne sera publié sans mesures réelles. Voir [Analytique produit](../product-analytics.md).
- Les **rappels** servent uniquement à vous signaler les tâches nécessitant une approbation ; ils ne servent pas à la publicité.
- Les données sur la façon dont votre enfant réalise chaque tâche et les plans de déclenchement servent **uniquement à proposer des pistes aux parents** ; elles ne servent pas à classer ni à comparer les enfants ([6](06-khoa-hoc-thoi-quen.md#logic)).

<a id="xoa-du-lieu"></a>
## Télécharger et supprimer les données

- **Téléchargement** : copie JSON des données familiales ([5](05-gia-dinh-va-cai-dat.md#du-lieu)) et CSV des entrées du journal en une phrase ([3](03-hom-nay-va-duyet-viec.md#thong-ke)). Gardez ces fichiers confidentiels, car ils contiennent les données de votre enfant.
- **Suppression définitive** : seul le **propriétaire de la famille** peut l’effectuer depuis `Today → Analytics`, en saisissant exactement `DELETE FAMILY` (code PIN requis s’il a été défini). Cette opération supprime les profils des enfants, habitudes, progression, récompenses, appareils et sessions associés ; elle est irréversible. Restaurer le compte de connexion **ne restaure pas** les données supprimées ([Récupération des données](../data-recovery.md)).

<a id="ky-thuat"></a>
## Mesures de protection techniques

| Mesure | Ce que cela signifie pour vous |
|---|---|
| Isolation des familles et verrous de ligne dans les transactions | Les données de familles différentes ne peuvent pas être mélangées |
| Toutes les commandes d’écriture reposant sur un cookie refusent les requêtes inter-origines | Un site inconnu ne peut pas agir en votre nom |
| PayOS « fail closed » : vérification de la signature, du montant, du contenu, du propriétaire de la commande et des doublons | Une fausse notification ne peut pas activer un forfait |
| Essai unique et vérification des forfaits dans la base de données | Il est impossible de contourner les limites en modifiant l’interface |
| Politique de sécurité du contenu (CSP), protection contre l’encadrement et permissions minimales du navigateur | Risque réduit lié au code malveillant |
| Fonctions sensibles exécutées uniquement côté serveur ; nouvelles fonctions fermées par défaut | Surface d’attaque réduite |
| Vérification en deux étapes pour les administrateurs et consignation de chaque action avec son motif | Traçabilité et contrôle |

<a id="phap-ly"></a>
## Limites juridiques

Les paramètres par défaut sont conçus de manière **prudente** pour les données des enfants, mais cela ne constitue **pas une certification** de conformité à COPPA ou au RGPD-K. Avant d’activer le classement public sur un marché donné, faites examiner les exigences relatives à l’âge du consentement, à la durée de conservation, aux droits d’accès et de suppression. Les pages `Privacy`, `Terms` et `Contact` du [site web](11-website-va-trang-cong-khai.md#phap-ly-web) peuvent rester à l’état de brouillon (non indexées et absentes du pied de page ou du paiement) jusqu’à l’activation de l’indicateur d’approbation juridique. Pour signaler un incident, ne transmettez aucun secret ni aucune donnée d’enfant par un canal public.

<a id="lien-quan"></a>
## Sujets associés

- Codes PIN, appareils et aidants : [5. Famille et paramètres](05-gia-dinh-va-cai-dat.md).
- Classements : [2. Écran de l’enfant](02-man-hinh-be.md#bang-xep-hang).
- Administration et journaux d’activité : [10. Administration et opérations](10-quan-tri-va-van-hanh.md).
- Réponse aux incidents : [Réponse aux incidents](../runbooks/incident-response.md).
