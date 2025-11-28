const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server)
// Lancer un serveur
app.get('/', (request, response) => {
    response.sendFile('ExempleProfTestSocket.html', {root: __dirname});
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
            let message = joueurs[data.numJoueur]+" : "+data.texte;
            console.log("Message à diffuser :", message)
            // io.emit('message',message)

            socket.emit('message', message);
            socket.broadcast.emit('messageAutre',message)
        }
    });

});
