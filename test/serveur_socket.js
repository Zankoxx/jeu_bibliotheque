var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var { Server } = require("socket.io")
var io = new Server(server)

server.listen(8888, () => {
    console.log('Le serveur écoute sur le port 8888')
})

app.get('/', (req, res) => {
    res.sendFile('client_socket.io.html', { root: __dirname })
})

var nomsJoueurs = []
var nbmax = 2

io.on('connection', socket => {

    socket.on('test', data => {
        console.log("Message reçu du client :", data)
        socket.emit('test', { 'quiterepond': 'le serveur !' })
    })

    socket.on('entree', nomJoueur => {
        if (nomsJoueurs.length >= nbmax) {
            socket.emit('entree', { autorise: false })
            return
        }

        nomsJoueurs.push(nomJoueur)
        socket.emit('entree', {
            autorise: true,
            nomJoueur: nomJoueur,
            numJoueur: nomsJoueurs.length - 1,
            nomsJoueurs: nomsJoueurs
        })

        if (nomsJoueurs.length > 1) {
            socket.broadcast.emit('entreeAutreJoueur', {
                nomJoueur: nomJoueur,
                nomsJoueurs: nomsJoueurs
            })
        }
    })

    socket.on('sortie', data => {
        var numJoueur = data.numJoueur
        var nomJoueur = data.nomJoueur
        if (numJoueur == null) return

        if (numJoueur != nomsJoueurs.length - 1) {
            for (var i = numJoueur; i < nomsJoueurs.length - 1; i++) {
                nomsJoueurs[i] = nomsJoueurs[i + 1]
            }
        }
        nomsJoueurs.pop()

        socket.emit('sortie')
        socket.broadcast.emit('sortieAutre', {
            nomsJoueurs: nomsJoueurs,
            numJoueur: numJoueur,
            nomJoueur: nomJoueur
        })
    })
    socket.on('reset', ()=> {
        nomsJoueurs = []
        socket.broadcast.emit('reset')
    })
    socket.on('message', data => {
        if (nomsJoueurs.includes(data.nomJoueur)){
        console.log(`${data.nomJoueur} a dit : ${data.message}`);
        io.emit('message', data)}
        // diffuse à TOUS les joueurs
        else (console.log("Message d'un joueur non reconnu"))
    });


})
