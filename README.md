#  Jeu de Bibliothèque Multijoueur (Library Sorter)

**Projet de Développement Web - Année 2025**

Ce projet est une application web multijoueur en temps réel (1vs1) où deux joueurs incarnent des bibliothécaires. Le but est de récupérer des livres défilant sur un tapis roulant et de les classer stratégiquement dans une bibliothèque pour maximiser son score selon des règles de tri précises (ordre alphabétique, regroupement par genre, etc.).

##  Participants

* **Jean** : Développement Front-end, visualisation de données, animations (D3.js) et design de l'interface.
* **Anir** : Développement Back-end, communication temps réel (Socket.io), logique serveur et algorithmes de scoring.

---

## Installation et Lancement

### Prérequis
* **Node.js** (v14+ recommandé) installé sur la machine.
* Un navigateur web moderne (Chrome, Firefox, Edge).

### Instructions
1.  **Installation des dépendances** :
    Ouvrez un terminal à la racine du projet et lancez :
    ```bash
    npm install
    ```
    *(Installe express, socket.io, etc.)*

2.  **Lancement du serveur** :
    ```bash
    node serveur.js
    ```

3.  **Accès au jeu** :
    Ouvrez votre navigateur web et allez à l'adresse : `http://localhost:8888`
    *Pour tester seul : Ouvrez deux onglets différents (l'un sera le Joueur A, l'autre le Joueur B).*

---

##  Fonctionnalités Implémentées

### 1. Architecture & Réseau (Back-end)
* **Serveur Node.js/Express** : Point central de l'application.
* **Communication Temps Réel (Socket.io)** :
    * **Lobby d'attente** : Gestion des connexions, limitation à 2 joueurs max, rejet des pseudos en doublon.
    * **Système de Tour par Tour** : Le serveur impose le tour de jeu (A puis B) et bloque les actions illégales.
    * **Synchronisation d'État** : Les livres posés par l'adversaire apparaissent en temps réel sur l'écran du joueur local.
    * **Chat intégré** : Discussion en direct avec notifications systèmes (connexions, déconnexions, erreurs).
    * **Gestion des déconnexions** : Nettoyage automatique des joueurs si un onglet est fermé.

### 2. Interface & Animations (Front-end / D3.js)
L'interface est générée dynamiquement via **D3.js** (SVG) :
* **Décor Immersif** : Génération procédurale du décor (papier peint, plinthes, bibliothèques en bois).
* **Tapis Roulant Animé** :
    * Animation continue des mécanismes (roues et tapis).
    * Apparition cyclique des livres depuis la réserve (JSON).
    * Interaction "Pick & Place" : Sélection d'un livre (surbrillance dorée) et dépôt dans une zone libre.
* **Feedback Visuel** :
    * Code couleur dynamique selon le tour (Vert = À moi, Rouge = Attente).
    * Représentation des livres : **Couleur** = Genre, **Hauteur** = Format (Poche, Medium, Grand, Maxi).
    * Tooltips détaillés au clic sur un livre (Titre, Auteur, Genre...).

### 3. Système de Scoring Complexe
Le calcul des points est effectué côté serveur à chaque coup joué pour éviter la triche. Les points sont attribués selon :
* **Combinaisons (Streaks)** : Bonus cumulatifs si des livres adjacents partagent le même **Auteur**, **Genre** ou **Format**.
* **Ordre Alphabétique** : Bonus importants pour les suites de titres ou d'auteurs triés alphabétiquement.
* **Bonus d'Étagère** :
    * **Remplissage** : Points bonus si une étagère de 5 livres est pleine.
    * **Homogénéité** : Points massifs ("Perfect Streak") si toute l'étagère partage le même critère (ex: 5 livres du même genre).

---

##  Structure du Projet

* **`serveur.js`** : Cerveau du jeu. Contient la logique des tours, le stockage de l'état du jeu (tableaux `listeEtageres`) et la fonction critique `comptagePoints()`.
* **`gamelogic.js`** : (Prototype) Classes définissant les propriétés des objets Livres.
* **`client/`** :
    * **`index.html`** : Page unique contenant le Lobby, le Chat et le conteneur SVG du jeu.
    * **`AppD3.js`** : Script principal D3.js. Gère le dessin, les clics, les animations et la réception des événements socket pour la mise à jour graphique.
    * **`styles.css`** : Mise en page moderne (CSS Grid), dégradés et responsive design.
    * **`livres.json`** : Base de données d'une centaine de classiques de la littérature avec leurs métadonnées.



