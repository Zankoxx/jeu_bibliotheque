const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server)
const path = require('path');

// Lecture du fichier JSON des livres
const fs = require('fs')
// Assurez-vous que le chemin est correct selon votre structure de dossier
// Ici on suppose que le dossier est jeu_bibliotheque
const Livresbrut= fs.readFileSync('./client/livres.json','utf8');
const tabLivres = JSON.parse(Livresbrut);


// Variables de la partie
let nbBiblio = 2
let NbEtageresParBiblio = 3
let nbLivresEtagere = 5
let listeEtageres = null ;
let PointParLivre = 100 ;
const NbEtagereT = nbBiblio * NbEtageresParBiblio
let tourJoueurActuel = 0; // 0 pour Joueur A, 1 pour Joueur B

let scoreA = 0;
let scoreB = 0;

// Lancer un serveur
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/AppD3.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'AppD3.js'));
});

app.get ('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'styles.css'));
});

var nbJoueurs = 2; // Limite de nombre de joueurs Maxiumm
var joueurs = []; // Liste des joueurs géré par le serveur

server.listen(8888, () => {
    console.log('Le serveur écoute sur le port 8888');
});

// Connexion globale de tous les joueurs
io.on('connection', (socket) => {
    //
    socket.on('joueurs', () => {
        let nomsJoueurs = "";
        for (let nom of joueurs) nomsJoueurs += nom+" ";
        console.log("Envoi des noms de joueurs : "+nomsJoueurs);
        socket.emit('joueurs', nomsJoueurs);
    });
    // Entrée d'un joueur dans la partie
    socket.on('entree', nomJoueur => {
        console.log("Entrée dans la partie de "+nomJoueur);
        if (joueurs.length < nbJoueurs)
            if (!joueurs.includes(nomJoueur)) {
                socket.nomJoueur = nomJoueur; // Sauvegarde du nom du joueur dans la socket au cas ou le serveur plante pour mieux le retrouver
                joueurs.push(nomJoueur);
                console.dir(joueurs);
                socket.emit('messageServeur', 'Vous avez rejoint la partie');
                socket.broadcast.emit('messageServeur', `${nomJoueur} a rejoint la partie`);
                if (joueurs.length == nbJoueurs) {
                    console.log("Le jeton passe à 0, la partie peut commencer");
                    io.emit('messageServeur', 'La partie peut commencer');
                    io.emit('NouvellePartie')
                }
                let nomsJoueurs = "";
                for (let nom of joueurs) nomsJoueurs += nom+" ";
                socket.emit('entree', {'nomJoueur':nomJoueur,
                    'numJoueur':joueurs.length-1,
                    'nomsJoueurs':nomsJoueurs});
                socket.broadcast.emit('entreeAutreJoueur',
                    {'nomJoueur':nomJoueur,
                        'nomsJoueurs':nomsJoueurs});
            }
            else socket.emit('messageServeur', 'Nom de joueur déjà enregistré');
        else socket.emit('messageServeur', 'Nombre de joueurs déjà atteint !');
    });
    // Sortie d'un joueur de la partie
    socket.on('sortie', nomJoueur => {
        console.log("Sortie de la partie de "+nomJoueur);
        let index = joueurs.indexOf(nomJoueur)
        if  (index != -1) {
            joueurs.splice(index, 1);
            let nomsJoueurs = "";
            for (let nom of joueurs) nomsJoueurs += nom+" ";
            socket.emit('sortie', {'nomJoueur':nomJoueur,
                'nomsJoueurs':nomsJoueurs});
            socket.broadcast.emit('sortieAutreJoueur',
                {'nomJoueur':nomJoueur,
                    'numJoueur': index,
                    'nomsJoueurs':nomsJoueurs});
            socket.emit('messageServeur', 'Vous avez quitté la partie');
            socket.broadcast.emit('messageServeur', `${nomJoueur} a quitté la partie`);
            socket.broadcast.emit('StopAnimation')
        }
        else socket.emit('messageServeur', 'Joueur inconnu');
    });
    // Envoi du message au client
    socket.on('message', data => {
        console.log("Message à diffuser de",data.numJoueur,":",data.texte);
        if (data.numJoueur == -1) socket.emit('messageServeur', 'Vous devez entrer dans la partie !');
        else {
            let message = joueurs[data.numJoueur] + " : " + data.texte;
            console.log("Message à diffuser :", message)
            socket.emit('message', message);
            socket.broadcast.emit('messageAutre',message)

        }
    });

    // Gère la déconnexion brutale (Fermeture onglet, perte internet, F5)
    socket.on('disconnect', () => {
        console.log("Un client s'est déconnecté");

        // Si ce client était un joueur identifié (qui était entré dans la partie)
        if (socket.nomJoueur) {
            let nom = socket.nomJoueur;
            console.log("C'était le joueur : " + nom);

            // On le retire du tableau
            let index = joueurs.indexOf(nom);
            if (index != -1) {
                joueurs.splice(index, 1);

                // On prépare la liste mise à jour pour les survivants
                let nomsJoueurs = "";
                for (let n of joueurs) nomsJoueurs += n + " ";

                // On prévient tout le monde que ce joueur est parti
                socket.broadcast.emit('sortieAutreJoueur', {
                    'nomJoueur': nom,
                    'numJoueur': index,
                    'nomsJoueurs': nomsJoueurs
                });

                socket.broadcast.emit('messageServeur', `${nom} a été déconnecté.`);
                socket.broadcast.emit('StopAnimation')
            }
        }
    });
    socket.on('CommencerPartie', () => {
        io.emit('StartAnimation')
        io.emit('RéceptionJSON' , {'tabLivres':shuffle(tabLivres)})
        NouvellePartie();
        console.log("affichagetableauvide")
        console.log(listeEtageres);
        console.log("On va faire démarrer l'animation")
        tourJoueurActuel = 0; // Le premier joueur de la liste commence
        io.emit('ChangementTour', tourJoueurActuel); // On prévient tout le monde
    })
    socket.on('ArrêterPartie', () => {
        io.emit('StopAnimation')
    })


    // reception du livre quand il est placé dans la bibliothèque
    socket.on('LivrePlacé' , data => {
        console.log(data.JSONLivre)

        // Retrouver l'index du joueur qui envoie la requête
        let indexJoueur = joueurs.indexOf(socket.nomJoueur);

        // VERIFICATION : Est-ce bien son tour ?
        if (indexJoueur !== tourJoueurActuel) {
            socket.emit('messageServeur', "Ce n'est pas votre tour !");
            return; // On arrête tout, on ne place pas le livre
        }


        if (data.index < 5) {
            console.log(listeEtageres)
            listeEtageres[0][data.index] = data.JSONLivre;
        }
        else if (data.index < 10){
            listeEtageres[1][data.index-5]= data.JSONLivre;
            console.log(listeEtageres[1])}
        else if (data.index < 15){
            listeEtageres[2][data.index-10]= data.JSONLivre;
            console.log(listeEtageres[2])}
        else if (data.index < 20){
            listeEtageres[3][data.index-15]= data.JSONLivre;
            console.log(listeEtageres[3])}
        else if (data.index < 25){
            listeEtageres[4][data.index-20]= data.JSONLivre;
            console.log(listeEtageres[4])}
        else if (data.index < 30){
            listeEtageres[5][data.index-25]= data.JSONLivre;
            console.log(listeEtageres[5])}
        if (data.index < 15) {
            scoreA = comptagePoints()
            io.emit('majScoreA',scoreA)
        }
        else {
            scoreB = comptagePoints()
            io.emit('majScoreB',scoreB)
        }
        socket.broadcast.emit('LivreAdverse',
            {
                'index':data.index,
                'couleur':getColor(data.JSONLivre),
                'taille':getSize(data.JSONLivre),
                'titre':data.JSONLivre.titre,
                'auteur':data.JSONLivre.auteur,
            });

        // Une fois l'action finie, on change de tour
        tourJoueurActuel = (tourJoueurActuel + 1) % 2; // Alterne entre 0 et 1
        io.emit('ChangementTour', tourJoueurActuel); // Informe les clients du changement

    })

    socket.on('demandeLivre', data => {
        socket.emit('envoiLivre', {'livreC':getColor(data),'livreF':getSize(data)})
    })

});

// Mélanger le JSON
function shuffle (tableau) {
    for (let i = tableau.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
    }
    return tableau;}

function getColor(livreJSON) {
    if (livreJSON !== null) {
        switch (livreJSON.genre) {
            case "roman": return "#FF0000";
            case "théâtre": return "#FFA500";
            case "sf": return "#87CEEB";
            case "poésie": return "#191970";
            case "thriller": return "#7205a6";
            case "policier": return "#008000";
            case "feelgood": return "#FFDB58";
            case "aventures": return "#E6E6FA";
            case "essai": return "#36454F";
            case "humour": return "#ef07eb";
            case "fantasy": return "#09bc72";
            default: return "#6c6464";
        }
    }
}

function getSize(livreJSON) {
    if (livreJSON !== null) {
        switch (livreJSON.format) {
            case "poche": return 90
            case "medium": return 110
            case "grand": return 130
            case "maxi": return 150
            default: return 130
        }
    }
}

function NouvellePartie (){
    scoreA = 0;
    scoreB = 0;
    listeEtageres = new Array(NbEtagereT)
    for (let i = 0; i<NbEtagereT ; i++) {
        listeEtageres[i] = new Array(nbLivresEtagere).fill(0)
    }
    console.log(listeEtageres)

}






// CALCUL DES POINTS (avec tous les caractéristiques indiqués)



// Fonction utilitaire pour le bonus de "Streak Parfaite" (Etagère complète avec le même critère)
function bonusStreakParfaite(streak) {
    // On utilise ta variable globale nbLivresEtagere
    if (streak === nbLivresEtagere) { return 2; }
    else { return 0; }
}

// Fonction qui calcule les points d'UNE SEULE étagère (adaptée de ton camarade)
function calculerPointsEtagere(etagereBrute) {

    // 1. On nettoie l'étagère pour ne garder que les vrais livres (pas les null/0)
    // Cela permet de comparer des livres qui sont côte à côte
    const livres = etagereBrute.filter(livre => livre !== null && livre !== 0);

    let pointsEtagere = livres.length; // 1 point par livre posé de base

    // Si l'étagère est vide, 0 points
    if (livres.length === 0) return 0;

    // Si l'étagère est pleine (comparé à ta variable globale), +1 point
    if (livres.length === nbLivresEtagere) { pointsEtagere += 1; }

    // Initialisation des compteurs de "Streak" (Suite)
    let streak_TITRE = 1;      let same_TITRE = 0;
    let streak_AUTEUR = 1;     let same_AUTEUR = 0;
    let streak_GENRE = 1;
    let streak_LITT = 1;
    let streak_FORMAT = 1;

    // Boucle de comparaison (on commence au 2ème livre)
    for (let i = 1; i < livres.length; i++) {
        let curr = livres[i];      // Livre actuel
        let prev = livres[i - 1];  // Livre précédent

        // --- A. TITRE (Ordre Alphabétique) ---
        // On utilise localeCompare pour bien gérer les accents, c'est plus propre que ">="
        if (curr.titre.localeCompare(prev.titre) >= 0) {
            streak_TITRE++;
            if (curr.titre === prev.titre) {
                same_TITRE++; // Titre identique
            } else {
                pointsEtagere += same_TITRE; // On valide les points des identiques précédents
                same_TITRE = 0;
            }
        } else if (streak_TITRE > 1) {
            // La suite est brisée, on encaisse les points accumulés
            pointsEtagere += streak_TITRE + same_TITRE;
            streak_TITRE = 1; same_TITRE = 0;
        }

        // --- B. AUTEUR (Ordre Alphabétique) ---
        // Note: Ton camarade utilisait "nom", toi "auteur"
        if (curr.auteur.localeCompare(prev.auteur) >= 0) {
            streak_AUTEUR++;
            if (curr.auteur === prev.auteur) {
                same_AUTEUR++;
            } else {
                pointsEtagere += same_AUTEUR;
                same_AUTEUR = 0;
            }
        } else if (streak_AUTEUR > 1) {
            pointsEtagere += streak_AUTEUR + same_AUTEUR;
            streak_AUTEUR = 1; same_AUTEUR = 0;
        }

        // --- C. GENRE (Identique) ---
        if (curr.genre === prev.genre) {
            streak_GENRE++;
        } else if (streak_GENRE > 1) {
            pointsEtagere += streak_GENRE;
            streak_GENRE = 1;
        }

        // --- D. LITTÉRATURE (Identique) ---
        // Ton camarade avait une formule spéciale (*1.2)
        if (curr.littérature === prev.littérature) {
            streak_LITT++;
        } else if (streak_LITT > 1) {
            pointsEtagere += Math.floor(streak_LITT * 1.2);
            streak_LITT = 1;
        }

        // --- E. FORMAT (Identique) ---
        // On vérifie que la propriété existe bien dans tes objets livres
        if (curr.format && prev.format && curr.format === prev.format) {
            streak_FORMAT++;
        } else if (streak_FORMAT > 1) {
            pointsEtagere += streak_FORMAT;
            streak_FORMAT = 1;
        }
    }

    // --- FIN DE BOUCLE : On ajoute les points des streaks qui étaient encore actives ---

    if (streak_TITRE > 1) {
        pointsEtagere += streak_TITRE + same_TITRE + bonusStreakParfaite(streak_TITRE);
    }

    if (streak_AUTEUR > 1) {
        pointsEtagere += streak_AUTEUR + same_AUTEUR + bonusStreakParfaite(streak_AUTEUR);
    }

    if (streak_GENRE > 1) {
        // Logique spéciale de ton camarade pour le genre complet (+50% des points si full)
        let bonusGenre = (bonusStreakParfaite(streak_GENRE) > 0) ? (livres.length * 0.5) : 0;
        pointsEtagere += streak_GENRE + bonusGenre;
    }

    if (streak_LITT > 1) {
        pointsEtagere += Math.floor(streak_LITT * 1.2) + bonusStreakParfaite(streak_LITT);
    }

    if (streak_FORMAT > 1) {
        pointsEtagere += streak_FORMAT + bonusStreakParfaite(streak_FORMAT);
    }

    return Math.floor(pointsEtagere);
}

// TA FONCTION PRINCIPALE (Mise à jour)
function comptagePoints() {
    let scoreTotal = 0;

    // On boucle sur toutes tes étagères (0 à NbEtagereT)
    for (let e = 0; e < NbEtagereT; e++) {
        // On récupère ton tableau de livres pour cette étagère
        const etagereCourante = listeEtageres[e];

        // On calcule les points via la nouvelle logique
        let pointsEtagere = calculerPointsEtagere(etagereCourante);

        scoreTotal += pointsEtagere;
    }

    console.log("➡️ Score total calculé (Logique Camarade) :", scoreTotal);
    return scoreTotal;
}
