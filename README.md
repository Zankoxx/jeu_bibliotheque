#  Jeu de Bibliothèque Multijoueur

Ce projet est une application web multijoueur en temps réel où deux joueurs s'affrontent, le but est de récupérer des livres défilant sur un tapis roulant et de les classer stratégiquement dans une bibliothèque pour maximiser son score selon des règles de tri précises (ordre alphabétique, regroupement par genre, etc).

##  Participants

* **NEJJARI Anir** 
* **MARCO Jean, numéro étudiant: 22303943** 


## Fonctionnalités Implémentées

### 1. Architecture Technique
* **Serveur (Node.js/Express)** : Gère la logique centrale du jeu et la distribution des fichiers statiques.
* **Communication Temps Réel (Socket.io)** :
    * **Lobby d'attente** : Gestion des connexions, limitation à 2 joueurs max, rejet des pseudos en doublon.
    * **Système de Tour par Tour** : Le serveur impose le tour de jeu (A puis B) et bloque les actions illégales.
    * **Synchronisation d'État** : Les livres posés par l'adversaire apparaissent en temps réel sur l'écran du joueur local.
    * **Chat intégré** : 
    -Discussion en direct avec notifications systèmes (connexions, déconnexions, erreurs).
    -Messagerie moderne avec ton message à droite et message du joueur en face à gauche
    -Heure en temps réel
    * **Gestion des déconnexions** : Nettoyage automatique des joueurs si un onglet est fermé.

### 2. Interface & Animations (D3.js)
L'interface est générée dynamiquement via **D3.js** (SVG) :
* **Décor Immersif** : Génération procédurale du décor (papier peint, plinthes, bibliothèques en bois).
* **Tapis Roulant Animé** :
    * Animation continue des mécanismes (roues et tapis).
    * Apparition cyclique des livres depuis la réserve (JSON).
    * Interaction "Pick & Place" : Sélection d'un livre (surbrillance dorée) et dépôt dans une zone libre.
* **Feedback Visuel** :
    * Code couleur dynamique selon le tour (Vert = À moi, Rouge = Attente).
    * Représentation visuelle des livres : chaque genre est représenté par une couleure différente,
    et chaque format (poche, medium, grand, maxi) par une taille différente.
    * Tooltips détaillés au clic sur un livre (titre, auteur, genre...).


### 3. Système de Scoring Complexe
Le calcul des points est effectué côté serveur à chaque coup joué pour éviter la triche. Les points sont attribués selon :
* **Combinaisons (Streaks)** : Bonus cumulatifs si des livres adjacents partagent le même **Auteur**, **Genre** ou **Format**.
* **Ordre Alphabétique** : Bonus importants pour les suites de titres ou d'auteurs triés alphabétiquement.
* **Bonus d'Étagère** :
    * **Remplissage** : Points bonus si une étagère de 5 livres est pleine.
    * **Homogénéité** : Points massifs ("Perfect Streak") si toute l'étagère partage le même critère (ex: 5 livres du même genre).


##  Interface du Jeu

### Le Lobby
*Écran de connexion permettant de choisir son pseudo et de discuter via le chat en attendant l'adversaire.*
> *(Insérer ici une capture d'écran du lobby)*

### La Phase de Jeu
*Vue principale avec le tapis roulant en bas et les bibliothèques des joueurs.*
> *(Insérer ici une capture d'écran du jeu en cours)*


##  Structure des Fichiers

* **`serveur.js`** : Point d'entrée de l'application. Contient la configuration Express, la gestion des WebSockets et l'algorithme de calcul des scores.
* **`client/`** :
    * **`index.html`** : Structure HTML de la page unique (Lobby + Jeu).
    * **`AppD3.js`** : Cœur du rendu graphique. Contient tout le code D3.js pour dessiner le décor, les livres et gérer les animations.
    * **`styles.css`** : Feuilles de style pour la mise en page et le design moderne.
    * **`livres.json`** : Base de données des livres utilisés dans le jeu.

