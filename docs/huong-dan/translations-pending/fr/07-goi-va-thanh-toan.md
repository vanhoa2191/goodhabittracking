# 7. Forfaits et paiement

[← 6. Science des habitudes](06-khoa-hoc-thoi-quen.md) · [Sommaire](README.md) · [Suivant : 8. Parrainage →](08-gioi-thieu-ban-be.md)

<!--op-->## Dans ce guide

[Essai gratuit de 7 jours](#dung-thu) · [Forfaits](#cac-goi) · [Où souscrire](#noi-mua) · [Étapes de paiement](#thanh-toan) · [Activation et rapprochement](#kich-hoat) · [Prolongation](#cong-don) · [Codes cadeaux (coupons)](#coupon) · [Réduction pour les familles parrainées](#giam-gia) · [Remboursements et annulation](#hoan-tien) · [Courriels qui vous sont envoyés](#email) · [Expiration d’un forfait](#het-han) · [À consulter également](#lien-quan)<!--/op-->

<a id="dung-thu"></a>
## Essai gratuit de 7 jours

- **Gratuit : 0 VND**, sans carte bancaire et **sans prélèvement automatique** à la fin de l’essai.
- Donne accès à toutes les fonctionnalités du forfait Famille, sans **limite du nombre d’enfants**.
- **Une seule fois par famille.** Si vous avez déjà utilisé l’essai, le bouton de démarrage affiche : « Cette famille a déjà utilisé un essai. Choisissez un forfait pour continuer. »
- Pour démarrer : (a) automatiquement à la dernière étape de la [configuration familiale](01-bat-dau.md#thiet-lap) si vous n’avez pas de forfait ; (b) sur `/start` (« Commencer votre essai de 7 jours ») : connectez-vous avec Google, configurez votre famille et appuyez sur le bouton ; (c) dans le panneau d’essai de la fenêtre des tarifs. Seul un parent de la famille peut démarrer l’essai.
- Le panneau d’essai **ne réapparaît pas** après un paiement de la famille.
- À l’approche de la fin de l’essai, le système envoie un courriel de rappel ([courriels](#email)).

<a id="cac-goi"></a>
## Forfaits

| Forfait | Prix | Enfants | Idéal pour |
|---|---|---|---|
| **Essai gratuit de 7 jours** | 0 VND | Illimité | Tout essayer avant de décider |
| **Forfait Essentiel** | 29,000 VND / mois | 1 enfant | Familles qui commencent avec un enfant |
| **Forfait Famille · Mensuel** | 49,000 VND / mois | Illimité | Plusieurs enfants ou accès complet à toutes les fonctionnalités |
| **Forfait Famille · Annuel** | 399,000 VND / an (prix normal 588,000 VND, économie de 189,000 VND, 32 %) | Illimité | Continuer assez longtemps pour que de petits pas deviennent des habitudes |
| **À vie** | Non vendu | Illimité | Attribué manuellement par un administrateur uniquement<!--op--> ([10](10-quan-tri-va-van-hanh.md#khach-hang))<!--/op--> |

Tous les paiements sont **ponctuels**, sans renouvellement automatique. La page des tarifs présente également des avantages supplémentaires pour le forfait Famille (rapports de suivi hebdomadaires, défis familiaux et assistance technique accélérée) et le forfait annuel (assistance prioritaire et livre numérique sur la parentalité) ; ce livre numérique **n’est pas encore disponible**.

**Les noms varient selon l’emplacement :** le site marketing appelle le *Forfait Essentiel* « Forfait Basic » et les deux forfaits Famille « Forfait Premium » (mensuel ou annuel). Il s’agit des mêmes produits aux mêmes prix.

**Le nombre d’enfants par forfait** est vérifié dans la base de données : le forfait Essentiel autorise 1 enfant au maximum ; l’essai, les forfaits Famille et À vie sont illimités ; sans forfait actif, vous ne pouvez pas ajouter de profil d’enfant.

<a id="noi-mua"></a>
## Où souscrire

| Point d’accès | Description |
|---|---|
| Bouton **Passer à Pro** dans la barre supérieure | Ouvre la fenêtre « Tarifs KidHabit Hero Pro », où vous pouvez choisir un forfait |
| Fenêtre des tarifs lorsqu’un forfait est requis | Par exemple, après l’expiration d’un forfait |
| Page `/pricing` et bouton de sélection d’un forfait sur le [site web](11-website-va-trang-cong-khai.md#trang-chinh) | Vous dirige vers `/checkout?plan=…` dans l’application |
| Page `/checkout` | Charge le forfait sélectionné : connectez-vous, configurez votre famille si nécessaire, puis payez |

Un lien de forfait invalide (informations manquantes ou obsolètes) affiche « Forfait de paiement invalide » et un bouton permettant de consulter les tarifs. Les droits appartiennent à la **famille**, et non à une adresse électronique.

<a id="thanh-toan"></a>
## Étapes de paiement

Les paiements sont traités par **PayOS (VietQR)** :

1. Choisissez un forfait → connectez-vous avec Google si nécessaire → « Continuer vers le paiement ». Si votre profil est incomplet, saisissez votre nom complet et votre numéro de téléphone ; ces coordonnées seront mémorisées pour vos prochains paiements. Les offres sont facultatives et désactivées par défaut. Confirmez ensuite les conditions si cela vous est demandé, puis saisissez un code de parrainage uniquement si votre famille y est admissible. La création de la commande est désactivée pendant l’envoi du code. Un code ne peut être saisi qu’avant la création du QR code, car le serveur calcule le montant lors de la création de la commande ; cette fenêtre ne remplace pas une commande existante après l’application d’un code.
2. L’écran de paiement affiche un **QR code VietQR** et les coordonnées du virement : nom du bénéficiaire, banque, numéro de compte, **montant exact** et **libellé de virement (obligatoire)**. Des boutons permettent de copier chaque élément ; le bouton **Télécharger le QR code** permet d’ouvrir votre application bancaire et de choisir une image de votre galerie à scanner ; un lien ouvre également la page de paiement sécurisée PayOS. Si la copie échoue, maintenez le doigt appuyé pour sélectionner le texte et le copier manuellement. Aucun compte à rebours n’est affiché, car le serveur n’impose pas de délai de paiement de 15 minutes.
3. Scannez le code avec votre application bancaire ou MoMo. **Respectez le montant exact et le libellé de virement.**
4. Si nécessaire, appuyez sur **« J’ai effectué le virement »** ; l’application vérifie automatiquement l’état du paiement. Les erreurs d’état sont affichées dans la langue sélectionnée et les vérifications automatiques continuent. Une fois l’opération terminée, le message « 🎉 Mise à niveau réussie ! » s’affiche et le forfait est immédiatement activé.

Si le paiement est en attente, **ne payez pas immédiatement une deuxième fois**. Le prix est défini par le serveur et ne peut pas être modifié dans le navigateur. Seul un parent de la famille peut payer ; la création d’un paiement nécessite le [code PIN](05-gia-dinh-va-cai-dat.md#pin) s’il a été défini. Le retour à l’application depuis la page PayOS affiche le résultat du paiement.

<a id="kich-hoat"></a>
## Activation et rapprochement

Le forfait est activé lorsque le système **confirme** le paiement par l’une de trois voies indépendantes ; la première confirmation reçue l’emporte et le paiement n’est jamais compté deux fois :

1. Le **webhook** PayOS appelle `/api/payment/webhook` (avec vérification de la signature, du montant, du libellé du virement et du propriétaire de la commande).
2. **Vérification auprès de PayOS :** lorsqu’un parent se trouve sur l’écran de paiement, l’application interroge directement PayOS au sujet de la commande. Cette vérification ne dépend pas du webhook.
3. **Rapprochement en arrière-plan :** toutes les 10 minutes, une tâche d’arrière-plan examine les commandes en attente et interroge PayOS.

Si vous avez effectué le virement sans voir le forfait : patientez quelques minutes, rouvrez `/checkout`, puis contactez l’assistance en indiquant le code de commande. <!--op-->L’équipe des opérations peut consulter la commande dans [Administration → Paiements](10-quan-tri-va-van-hanh.md#thanh-toan-admin).<!--/op-->

<a id="cong-don"></a>
## Prolongation

Si vous achetez alors que votre forfait est toujours actif, sa durée est **ajoutée à la fin de la période en cours**, y compris le temps d’essai restant : le forfait mensuel ajoute 1 mois et le forfait annuel 1 an. L’achat d’un forfait inférieur à celui que vous possédez **ne remplace pas le forfait supérieur**. Un forfait à vie n’est pas remplacé par un autre forfait.

<a id="coupon"></a>
## Codes cadeaux (coupons)

Les codes cadeaux sont créés par l’équipe des opérations. Saisissez-en un dans `Settings → Account → Coupon code → Apply code`.

- Un code cadeau ajoute des **jours d’accès supplémentaires** ; les codes offrant uniquement une réduction ne peuvent pas être utilisés ici. Si la famille n’a pas encore de forfait payant, elle passe au forfait Famille · Mensuel pour le nombre de jours correspondant ; si elle a déjà un forfait, les jours sont ajoutés à la fin de sa période actuelle et son forfait ne change pas. Les codes cadeaux ne s’appliquent pas au forfait À vie.
- Chaque famille ne peut utiliser **un code qu’une seule fois**. Un code expiré, épuisé ou désactivé affiche : « Code introuvable, déjà utilisé ou expiré. »
- Après **plus de 10 échecs en 15 minutes**, l’accès est temporairement verrouillé pendant quelques minutes.

<a id="giam-gia"></a>
## Réduction pour les familles parrainées

Une famille qui saisit un code de parrainage (via un lien `?ref=` ou manuellement) bénéficie de **10 % de réduction sur son premier forfait annuel**, si elle n’a encore passé aucune commande payante (399,000 VND passe à 359,100 VND). L’écran de paiement affiche « 10 % de réduction grâce au code de parrainage ». Détails : [8. Parrainage](08-gioi-thieu-ban-be.md#giam-10).

<a id="hoan-tien"></a>
## Remboursements et annulation

- **Remboursement sous 30 jours :** si vous n’êtes pas satisfait, envoyez le code de commande et la date du paiement à l’adresse électronique de l’assistance dans les 30 jours suivant le paiement. Les remboursements sont traités manuellement ; dès leur confirmation, la commission associée à cette commande, si elle est encore en attente, est récupérée ([8](08-gioi-thieu-ban-be.md#hoan-tien-hoa-hong)).
- Un **lien de paiement en attente** peut être annulé par l’équipe d’assistance ; la commande ne passe à l’état « annulée » qu’après confirmation de PayOS.
- **L’annulation du forfait** est traitée par l’équipe d’assistance et confirmée par courriel. Aucun prélèvement automatique n’est effectué.

<!--op-->Procédure interne : [Opérations de messagerie et remboursements](../runbooks/lifecycle-and-refunds.md) et [10. Administration](10-quan-tri-va-van-hanh.md#phieu-ho-tro).<!--/op-->

<a id="email"></a>
## Courriels qui vous sont envoyés

Les courriels sont répartis en deux catégories :

- **Courriels de connexion** (envoyés par Supabase) : confirmation d’inscription, liens de connexion, récupération, invitations, changements d’adresse électronique et réauthentification. L’interface de messagerie est préconçue ([modèles](../../supabase/email-templates/README.md)).
- **Courriels de cycle de vie** (qui peuvent être activés ou désactivés) : bienvenue et instructions de configuration (`welcome_setup`), rappels de fin d’essai (`trial_ending`), reçus de paiement (`payment_receipt`), mises à jour des demandes d’assistance (`support_status`), remboursements (`refund_status`) et confirmations d’annulation d’abonnement (`subscription_cancelled`).

Les courriels de cycle de vie **ne contiennent pas de données d’enfant**. Les courriels promotionnels ne sont envoyés que si vous avez accepté de recevoir des offres ; retirer votre consentement les arrête immédiatement. Les adresses en échec de distribution, ayant signalé un abus ou désabonnées ne reçoivent plus de messages.

<a id="het-han"></a>
## Expiration d’un forfait

À l’expiration de l’essai ou du forfait sans renouvellement, la famille n’est plus considérée comme ayant un forfait : vous ne pouvez plus ajouter de profil d’enfant et l’application vous propose de choisir un forfait. **Les données ne sont pas supprimées** ; achetez un forfait ou utilisez un code cadeau pour continuer.

<a id="lien-quan"></a>
## À consulter également

- Réduction de 10 % et commissions : [8. Parrainage](08-gioi-thieu-ban-be.md).
- Démarrer un essai pendant la configuration : [1. Premiers pas](01-bat-dau.md#thiet-lap).
- Limite d’enfants et ajout de profils : [5. Profils des enfants](05-gia-dinh-va-cai-dat.md#ho-so).
- Traitement des commandes, remboursements et modifications de forfaits par l’équipe des opérations : [10. Administration et opérations](10-quan-tri-va-van-hanh.md).
- Configuration de PayOS, des webhooks et du rapprochement : [Déploiement](../deployment.md).
