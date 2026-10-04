# 1. Premiers pas

[← Sommaire](README.md) · [Suivant : 2. Écran de l’enfant →](02-man-hinh-be.md)

<!--op-->## Dans ce guide

[Trois façons d’accéder à l’application](#cach-vao) · [Connexion](#dang-nhap) · [Configurer votre famille](#thiet-lap) · [Coordonnées du client](#thong-tin) · [Rôles](#vai-tro) · [Démo](#demo) · [Langue](#ngon-ngu) · [Obtenir de l’aide dans l’application](#tro-giup) · [À consulter également](#lien-quan)<!--/op-->

<a id="cach-vao"></a>
## Trois façons d’accéder à l’application

À votre première visite sur `app.kidhabithero.com`, l’écran « Comment souhaitez-vous accéder à KidHabit ? » propose trois options : deux boutons visibles et un volet replié pour les enfants. Les espaces parent et enfant sont distincts : les enfants ne voient jamais les paiements ni les paramètres familiaux.

| Option d’accès | Pour | Résultat |
|---|---|---|
| **Continuer en tant que parent** (connexion Google) | Parents et tuteurs | Ouvre le tableau de bord familial ([3](03-hom-nay-va-duyet-viec.md)). À la première connexion, vous suivrez les étapes de [configuration familiale](#thiet-lap). |
| **Cet appareil est-il celui d’un enfant ?** (ouvrir, puis choisir « Saisir un code ou scanner un QR code ») | Enfants | L’appareil est associé à un seul enfant et ouvre directement son [écran](02-man-hinh-be.md). Aucun compte n’est nécessaire pour l’enfant. |
| **Explorer la démo** (visible sous le bouton parent) | Tout le monde | Utilise des données d’exemple et ne nécessite aucun compte ([démo](#demo)). |

Les parents déjà connectés accèdent directement au tableau de bord. Pour revoir la page d’accueil du site, choisissez « Accueil » ou « Voir la page de présentation ». Une fois associé, l’appareil de l’enfant ouvre toujours directement l’interface enfant, sans afficher le tableau de bord parental ni la page des tarifs.

<a id="dang-nhap"></a>
## Connexion

- **Google** est la principale méthode de connexion des parents.
- **Code à usage unique envoyé par courriel** est la deuxième option ; elle est actuellement **désactivée** jusqu’à son activation<!--op--> (indicateur `emailCodeLogin`, [instructions d’activation](../deployment.md))<!--/op-->. Lorsqu’elle est activée, un volet « Autres façons de se connecter » apparaît sur l’écran d’accès ; en l’ouvrant, vous trouverez le champ « Ou recevoir un code de connexion par courriel ». Lorsque l’indicateur est désactivé, ce volet n’existe pas. Le parent saisit son adresse électronique, reçoit un court code numérique et le saisit pour se connecter. Il peut demander un nouveau code après quelques secondes ; un trop grand nombre de demandes impose d’attendre quelques minutes.
- Si la connexion échoue, l’application affiche un bref message et un bouton pour réessayer. Rien n’est enregistré.

Les parents qui se connectent depuis un lien de parrainage (`?ref=`) sont automatiquement enregistrés comme parrainés ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). Les personnes invitées comme aidants se connectent avec Google, puis acceptent l’invitation ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Créer le premier profil de votre enfant

Lors de votre première visite, la fenêtre « Créer le forfait familial selon l’âge » sert uniquement à créer un profil d’enfant :

- Saisissez le **nom complet de l’enfant** (obligatoire), son pseudonyme (facultatif) et son âge (5 ans par défaut).
- Ouvrez **Personnalisation supplémentaire** pour lire la description de l’étape d’âge, changer de mascotte (Leo par défaut), prévisualiser six habitudes de départ ou désactiver l’ajout de ces habitudes (activé par défaut). Les parents pourront les modifier par la suite.

Vous devez **confirmer que vous êtes le parent ou le tuteur légal de l’enfant** et accepter que KidHabit conserve son profil, ses habitudes et sa progression. Le consentement est enregistré avec la version de la politique ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)). Les classements publics sont désactivés par défaut.

Si la famille ne dispose pas d’un forfait, la configuration **démarre automatiquement un essai gratuit de 7 jours** (le bouton indique « Commencer l’essai de 7 jours »). Chaque famille ne peut utiliser l’essai qu’une fois ([7](07-goi-va-thanh-toan.md#dung-thu)).

Vous pouvez accéder directement à `/start` (« Commencer votre essai de 7 jours ») depuis le site web : connectez-vous avec Google, configurez votre famille, puis cliquez sur le bouton de démarrage.

<a id="thong-tin"></a>
## Coordonnées du client

Les parents doivent uniquement saisir leur **nom complet et leur numéro de téléphone au moment du paiement**, avant l’étape des conditions et du parrainage. Les numéros de téléphone doivent comporter de 9 à 15 chiffres. Les coordonnées sont conservées sur le serveur pour les paiements futurs ; les profils déjà complets passent cette étape. Cette exigence ne bloque ni la connexion ni la création d’un profil d’enfant. La réception de conseils et d’offres est facultative et désactivée par défaut. Les parents peuvent modifier leurs coordonnées ultérieurement dans `Family → Settings → Account` ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)) ; le retrait du consentement arrête immédiatement les courriels promotionnels ([7](07-goi-va-thanh-toan.md#email)). Si le chargement ou l’enregistrement échoue, appuyez sur **Réessayer**.

<a id="vai-tro"></a>
## Rôles familiaux

| Rôle | Peut faire | Ne peut pas faire |
|---|---|---|
| **Propriétaire de la famille** (créateur) | Tout ce que les parents peuvent faire, payer et supprimer les données familiales | Rien |
| **Parent ou tuteur** | Gérer les enfants, tâches, récompenses, approbations et appareils | Actions réservées au propriétaire (supprimer la famille) |
| **Aidant** | Consulter la progression dans la « Vue de l’aidant » | Modifier profils, tâches, étoiles ou forfait |
| **Enfant** (appareil associé) | Terminer ses tâches, demander des récompenses et tenir un journal | Voir les paiements, paramètres ou profils des autres enfants |

Seuls les parents de la famille peuvent démarrer un essai ou effectuer des paiements. Les actions sensibles nécessitent aussi un [code PIN](05-gia-dinh-va-cai-dat.md#pin).

<a id="demo"></a>
## Démo

« Explorer la démo » ouvre l’application avec trois enfants d’exemple (âgés de 8, 4 et 1 an), ainsi que des exemples de tâches, récompenses et groupes. Les données de démonstration sont enregistrées dans l’onglet actuel du navigateur et restent présentes après le rechargement de la page. Lorsque vous configurez une vraie famille ou vous connectez, les données de démo sont supprimées et **ne sont pas** mélangées aux données réelles. La démo n’envoie rien au serveur et ne nécessite aucun paiement.

<a id="ngon-ngu"></a>
## Langue

L’application prend en charge neuf langues : vietnamien, anglais, français, allemand, italien, espagnol, chinois, japonais et coréen. La langue initiale est choisie selon cet ordre : votre choix enregistré, le pays (d’après Cloudflare), la langue du navigateur, puis l’anglais. Modifiez-la avec le sélecteur de langue dans la barre supérieure. Votre choix est enregistré afin que la page, les titres et l’interface restent dans la même langue.

Sur un écran étroit, les commandes de la barre supérieure sont regroupées dans le **Menu** (bouton ⋮). Il comprend les groupes **Compte**, **Paramètres rapides** (langue, apparence claire ou sombre, taille du texte et son) et un lien vers le **Guide d’utilisation**. Les éléments moins fréquemment utilisés (tarifs, saisie du code d’association de l’enfant, guide des 16 forces, configuration familiale, accueil et état du stockage) se trouvent sous **Plus**, qui reste fermé jusqu’à son ouverture.

Certains contenus détaillés, notamment les parcours par âge et l’écran Aujourd’hui, ne sont pas encore traduits dans les neuf langues et apparaissent en anglais lorsqu’aucune traduction n’est disponible.

<a id="tro-giup"></a>
## Obtenir de l’aide dans l’application

Ce guide est intégré à l’application sous deux formes :

- **Un ? à côté de chaque élément.** Dans l’espace parental, un petit **?** s’affiche à côté du titre de chaque fonctionnalité, par exemple les approbations, déclencheurs, codes PIN, codes d’association et paiements. Survolez-le, appuyez dessus ou atteignez-le avec la touche Tabulation pour lire une brève explication d’une ou deux phrases. Cliquez sur **Voir les détails** pour ouvrir la partie correspondante du guide dans l’écran actuel, sans quitter votre activité. Dans cette fenêtre, suivez un lien vers une autre section ou cliquez sur **Retour**. Appuyez sur **Échap** ou à l’extérieur de l’explication pour la fermer.
- **Une page de guide dédiée.** Le bouton **Guide d’utilisation** dans la barre supérieure (ou `Family → Settings → Open user guide`) ouvre `/docs` : liste des chapitres, champ de **recherche** (avec ou sans accents), raccourcis **« Je souhaite… »** pour les tâches courantes et sommaire de chaque chapitre. Le bouton **Ouvrir le guide complet** dans la fenêtre de détails mène également à l’emplacement correspondant sur cette page.

Le guide complet est disponible en vietnamien et dans ses traductions, dont l’anglais actuellement. Dans les langues sans traduction, l’explication du ? apparaît en anglais tandis que la section détaillée est en vietnamien, avec un résumé rapide dans `/docs`.

<a id="lien-quan"></a>
## À consulter également

- Créer un profil d’enfant et associer son appareil : [5. Profils des enfants et association des appareils](05-gia-dinh-va-cai-dat.md#ho-so).
- Ce que font les enfants après leur accès : [2. Écran de l’enfant](02-man-hinh-be.md).
- Essais et tarifs : [7. Forfaits et paiement](07-goi-va-thanh-toan.md).
- Confidentialité des données des enfants : [9. Sécurité et confidentialité](09-bao-mat-va-rieng-tu.md).
- Page d’accueil du site web : [11. Site web et pages publiques](11-website-va-trang-cong-khai.md).
