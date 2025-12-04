const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server)
const path = require('path');
// Lancer un serveur
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/AppD3.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'AppD3.js'));
});
/*app.get('/ClientSocket.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'ClientSocket.js'));
})*/
app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'styles.css'));
});

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
            let message = data.texte;
            console.log("Message à diffuser :", message)
            // io.emit('message',message)

            socket.emit('message', message);
            socket.broadcast.emit('messageAutre',message)
            // socket.broadcast.emit('messageAutre',{'message':message,'pseudo':data.numJoueur}) si affichage du pseudo en dehors du message
        }
    });

});


let nbBiblio = 2
let NbEtageresParBiblio = 3
let nbLivresEtagere = 5
let PointParLivre = 100 ;
const NbEtagereT = nbBiblio * NbEtageresParBiblio


function NouvellePartie (){
    var scoreA = 0;
    var scoreB = 0;
    var listeEtageres = new Array(NbEtagereT)
    for (let i = 0; i<NbEtagereT ; i++) {
        listeEtageres[i] = new Array(nbLivresEtagere)
        }
    console.log(listeEtageres)

}
// 
function ComptagePoint(etagere) { // Appelé quand l'étagère est pleine
    let ajoutPt = nbLivresEtagere * PointParLivre;
    let livreRef = etagere[0]
    if (etagere.every(l =>  l.genre === livreRef.genre )) {
        ajoutPt *= 2
    }

    if (etagere.every(l => l.auteur === livreRef.auteur )) {
        ajoutPt *= 10
    }

    if (etagere.every(l =>  l.littérature === livreRef.littérature)) {
        ajoutPt *= 6
    }

    if (etagere.every(l =>  l.titre[0] === livreRef.titre)[0]) {
        ajoutPt *= 3
    }

    /*
    if (for (let i = 0 ; i < etagere.length ; i++)  {
        etagere[i][0] = etagere[i+1]
    })
        */
    }
    
    if (listeEtageres.indexOf(etagere) < (NbEtagereT/2)){  // Si c'est l'étagère du joueur 1
        scoreA += ajoutPt
    }
    else {
        scoreB += ajoutPt
    }
}



const fs = require('fs')
const Livresbrut= fs.readFileSync('./client/livres.json','utf8');
const tabLivres = JSON.parse(Livresbrut);
for (const livre of tabLivres){ // Test affichage livre
    // console.log(livre.titre)
}

let testPoints = [
    {"titre":"La peste", "auteur":"Albert Camus", "nom":"Camus", "genre":"roman", "format":"medium"},
    {"titre":"L'étranger", "auteur":"Albert Camus", "nom":"Camus", "genre":"roman", "format":"medium"},
    {"titre":"Cartes sur table", "auteur":"Agatha Christie", "nom":"Christie", "genre":"policier", "littérature":"anglo-saxonne","format":"poche"}

]




