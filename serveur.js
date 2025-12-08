const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server)
const path = require('path');

// Lecture du fichier JSON des livres
const fs = require('fs')
const Livresbrut= fs.readFileSync('./client/livres.json','utf8');
const tabLivres = JSON.parse(Livresbrut);


// Variables de la partie
let nbBiblio = 2
let NbEtageresParBiblio = 3
let nbLivresEtagere = 5
let listeEtageres = null ;
let PointParLivre = 100 ;
const NbEtagereT = nbBiblio * NbEtageresParBiblio



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
/*app.get('/ClientSocket.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'ClientSocket.js'));
})*/

var nbJoueurs = 2; // Limite de nombre de joueurs Maxiumm
var joueurs = []; // Liste des joueurs géré par le serveur
// var jeton = -1; // a une utilité pour savoir a qui est le tout mais pas indispensable

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
                joueurs.push(nomJoueur);
                console.dir(joueurs);
                socket.emit('messageServeur', 'Vous avez rejoint la partie');
                socket.broadcast.emit('messageServeur', `${nomJoueur} a rejoint la partie`);
                if (joueurs.length == nbJoueurs) {
                    // jeton = 0;
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
            // jeton = -1;
            let nomsJoueurs = "";
            for (let nom of joueurs) nomsJoueurs += nom+" ";
            socket.emit('sortie', {'nomJoueur':nomJoueur,
                'nomsJoueurs':nomsJoueurs});
            socket.broadcast.emit('sortieAutreJoueur',
                {'nomJoueur':nomJoueur, // Pour information
                    'numJoueur': index,
                    'nomsJoueurs':nomsJoueurs});
            socket.emit('messageServeur', 'Vous avez quitté la partie');
            socket.broadcast.emit('messageServeur', `${nomJoueur} a quitté la partie`);
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
            // io.emit('message',message)

            socket.emit('message', message);
            socket.broadcast.emit('messageAutre',message)
            // socket.broadcast.emit('messageAutre',{'message':message,'pseudo':data.numJoueur}) si affichage du pseudo en dehors du message
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
    
    socket.on('stop' ,() => {
        io.emit('StopAnimation')
    })
    /* 
    socket.on('reprendre',() => {
        io.emit('StartAnimation')
        io.emit('EtatBoutonStopetReprendre')
    }) 
    */
   // reception du livre quand il est placé dans la bibliothèque
    socket.on('LivrePlacé' , data => {
        console.log(data.JSONLivre)

        if (data.index < 5)
            listeEtageres[0][data.index].push(data.JSONLivre);
        else if (data.index < 10)
            listeEtageres[1][data.index-5].push(data.JSONLivre);
        else if (data.index < 15)
            listeEtageres[2][data.index-10].push(data.JSONLivre);
        else if (data.index < 20)
            listeEtageres[3][data.index-15].push(data.JSONLivre);
        else if (data.index < 25)
            listeEtageres[4][data.index-20].push(data.JSONLivre);    
        else if (data.index < 30)
            listeEtageres[5][data.index-25].push(data.JSONLivre);   

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
            case "roman":
                return "#FF0000"; // 1. Basique (Rouge)
            case "théâtre":
                return "#FFA500"; // 2. Chaude (Orange Vif)
            case "sf":
                return "#87CEEB"; // 3. Froide (Bleu Ciel)
            case "poésie":
                return "#191970"; // 4. Foncé (Bleu Nuit)
            case "thriller":
                return "#7205a6"; // 5. Clair (Vert Menthe)
            case "policier":
                return "#008000"; // 6. Basique (Vert)
            case "feelgood":
                return "#FFDB58"; // 7. Chaude (Jaune Moutarde)
            case "aventures":
                return "#E6E6FA"; // 8. Froide (Violet Lavande)
            case "essai":
                return "#36454F"; // 9. Foncé (Gris Anthracite)
            case "humour":
                return "#ef07eb"; // 10. Clair (Rose Poudré)
            case "fantasy":
                return "#09bc72"; // 11. Basique (Bleu)
            default:
                return "#6c6464"; // Une couleur par défaut (Gris clair)
        }
    }
}

function getSize(livreJSON) {
    if (livreJSON !== null) {
        switch (livreJSON.format) {
            case "poche":
                return 70
            case "medium":
                return 90
            case "grand":
                return 110
            case "maxi":
                return 130
            default:
                return 130 // Une taille par défaut
        }
    }
}




function NouvellePartie (){
    var scoreA = 0;
    var scoreB = 0;
    var listeEtageres = new Array(NbEtagereT)
    for (let i = 0; i<NbEtagereT ; i++) {
        listeEtageres[i] = new Array(nbLivresEtagere)
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

/*
function ComptagePoint(etagere,livre) { // Appelé quand l'étagère est pleine
    let ajoutPt = nbLivresEtagere * PointParLivre;
    for (let l of etagere)
    
    bonus
    if (etagere.every(l =>  l.genre === livreRef.genre )) {ajoutPt *= 2}

    if (etagere.every(l => l.auteur === livreRef.auteur )) {ajoutPt *= 10}

    if (etagere.every(l =>  l.littérature === livreRef.littérature)) {ajoutPt *= 6}

    if (etagere.every(l =>  l.titre[0] === livreRef.titre)[0]) {ajoutPt *= 3} if (EstOrdreAlphabetiqueTitre(etagere)) {ajoutPt *=10}
    

    
    if (listeEtageres.indexOf(etagere) < (NbEtagereT/2)){  // Si c'est l'étagère du joueur 1
        scoreA += ajoutPt
    }
    else {
        scoreB += ajoutPt
    }
    

    return ajoutPt;}
*/





for (const livre of tabLivres){ // Test affichage livre
    // console.log(livre.titre)
}

let testPoints = [
    {"titre":"Ca pue", "auteur":"Albert Camus", "nom":"Camus", "genre":"roman", "format":"medium"},
    {"titre":"C'est étranger", "auteur":"Albert Camus", "nom":"Camus", "genre":"roman", "format":"medium"},
    {"titre":"Cartes sur table", "auteur":"Albert Camus", "nom":"Christie", "genre":"roman", "littérature":"anglo-saxonne","format":"poche"},
    {"titre":"Cartes sur table", "auteur":"Albert Camus", "nom":"Christie", "genre":"roman", "littérature":"anglo-saxonne","format":"poche"},
    {"titre":"Cartes sur table", "auteur":"Albert Camus", "nom":"Christie", "genre":"roman", "littérature":"anglo-saxonne","format":"poche"}
]


//console.log(ComptagePoint(testPoints));






