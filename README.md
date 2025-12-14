#  Jeu de Bibliothèque Multijoueur

**Projet de Développement Web - Année 2025**

Ce projet est une application web multijoueur en temps réel où deux joueurs incarnent des bibliothécaires. Le but est de récupérer des livres défilant sur un tapis roulant et de les classer stratégiquement dans une bibliothèque pour maximiser son score selon des règles de tri précises.

##  Participants

* **Jean** : Développement Front-end, visualisation de données et animations (D3.js).
* **Anir** : Développement Back-end, communication temps réel (Socket.io) et logique serveur.

---

##  Installation et Lancement

### Prérequis
* Node.js installé sur la machine.

### Instructions
1.  **Installation des dépendances** :
    Ouvrez un terminal à la racine du projet et lancez :
    ```bash
    npm install
    ```
    *(Cela installera `express`, `socket.io` et les autres dépendances nécessaires)*

2.  **Lancement du serveur** :
    ```bash
    node serveur.js
    ```

3.  **Accès au jeu** :
    Ouvrez votre navigateur web et allez à l'adresse : `http://localhost:8888`

---

## 🛠 Fonctionnalités Implémentées

### 1. Architecture Technique
* **Serveur (Node.js/Express)** : Gère la logique centrale du jeu et la distribution des fichiers statiques.
* **Communication Temps Réel (Socket.io)** :
    * Synchronisation instantanée des actions entre les joueurs.
    * Gestion d'un lobby d'attente pour 2 joueurs.
    * Système de **Chat en direct** intégré.

### 2. Interface Graphique et Animations (D3.js)
L'interface de jeu est entièrement générée dynamiquement via **D3.js** :
* **Tapis roulant animé** : Les livres arrivent en continu via une animation fluide.
* **Bibliothèque interactive** :
    * Visualisation des étagères et des montants en SVG.
    * Système de placement "Point & Click" : Sélectionner un livre sur le tapis puis cliquer sur un emplacement libre.
    * Représentation visuelle des livres (Couleur = Genre, Hauteur = Format).

### 3. Logique de Jeu et Score
Le serveur calcule le score en temps réel selon des algorithmes de tri :
* **Points d'adjacence** : Bonus si des livres voisins partagent le même **Auteur**, **Genre** ou **Littérature**.
* **Ordre Alphabétique** : Bonus significatif si les livres d'une étagère sont triés par auteur.
* **Complétion** : Bonus lorsqu'une étagère est entièrement remplie avec des critères homogènes.

---

##  Interface du Jeu

### Le Lobby
*Écran de connexion permettant de choisir son pseudo et de discuter via le chat en attendant l'adversaire.*
> *(Insérer ici une capture d'écran du lobby)*

### La Phase de Jeu
*Vue principale avec le tapis roulant en bas et les bibliothèques des joueurs.*
> *(Insérer ici une capture d'écran du jeu en cours)*

---

##  Structure des Fichiers

* **`serveur.js`** : Point d'entrée de l'application. Contient la configuration Express, la gestion des WebSockets et l'algorithme de calcul des scores.
* **`client/`** :
    * **`index.html`** : Structure HTML de la page unique (Lobby + Jeu).
    * **`AppD3.js`** : Cœur du rendu graphique. Contient tout le code D3.js pour dessiner le décor, les livres et gérer les animations.
    * **`ClientSocket.js`** : Gestion des événements Socket côté client (Chat, Connexion/Déconnexion).
    * **`styles.css`** : Feuilles de style pour la mise en page (Grid Layout) et le design moderne.
    * **`livres.json`** : Base de données des livres utilisés dans le jeu.

---

*Projet réalisé dans le cadre du cours de Développement Web.*
