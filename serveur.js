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
    })
    socket.on('ArrêterPartie', () => {
        io.emit('StopAnimation')
    })


    // reception du livre quand il est placé dans la bibliothèque
    socket.on('LivrePlacé' , data => {
        console.log(data.JSONLivre)

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

function EstOrdreAlphabetiqueTitre(etagere) {
    let titres = etagere.map(livre => livre.titre);
    for (let i = 0; i < titres.length - 1; i++) {
        if (titres[i] > titres[i + 1]) {
            return false;
        }
    }
    return true;
}

function comptagePoints() {
    let score = 0;
    function estComplete(etagere) {
        return etagere.every(livre => livre !== null && livre !== 0);
    }

    for (let e = 0; e < NbEtagereT; e++) {
        const etagere = listeEtageres[e];
        const criteres = ["auteur", "genre", "littérature"];
        criteres.forEach(critere => {
            let chaineLongueur = 1;
            for (let i = 1; i < nbLivresEtagere; i++) {
                const prev = etagere[i - 1];
                const curr = etagere[i];
                if (!prev || !curr) {
                    chaineLongueur = 1;
                    continue;
                }
                if (prev[critere] === curr[critere]) {
                    chaineLongueur++;
                    score += chaineLongueur;
                } else {
                    chaineLongueur = 1;
                }
            }
        });

        let chainAlpha = 1;
        for (let i = 1; i < nbLivresEtagere; i++) {
            const prev = etagere[i - 1];
            const curr = etagere[i];
            if (!prev || !curr) {
                chainAlpha = 1;
                continue;
            }
            if (prev.auteur.localeCompare(curr.auteur) <= 0) {
                chainAlpha++;
                score += chainAlpha * 2;
            } else {
                chainAlpha = 1;
            }
        }

        if (estComplete(etagere)) {
            let tousGenre = true;
            let tousAuteur = true;
            let tousLitt = true;

            const genreRef = etagere[0].genre;
            const auteurRef = etagere[0].auteur;
            const littRef = etagere[0].littérature;

            for (let i = 1; i < nbLivresEtagere; i++) {
                if (etagere[i].genre !== genreRef) tousGenre = false;
                if (etagere[i].auteur !== auteurRef) tousAuteur = false;
                if (etagere[i].littérature !== littRef) tousLitt = false;
            }

            if (tousGenre) { score += 20; }
            if (tousAuteur) { score += 30; }
            if (tousLitt) { score += 15; }
        }
    }
    console.log("-> Score total actuel :", score);
    return score;

}
