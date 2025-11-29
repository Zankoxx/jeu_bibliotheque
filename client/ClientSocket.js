/* ClientSocket.js
   Gère la connexion socket et la mise à jour du DOM.
   Chargé avec `defer` (donc exécuté après parsing du DOM).
*/

document.addEventListener('DOMContentLoaded', () => {
        const socket = io(); // /socket.io/socket.io.js doit être disponible

        var numJoueur = -1;
        // demande Joueurs (je sais pas comment est appelé cette fonction désolé)
        function demandeJoueurs() {
            console.log('Demande des joueurs');
            socket.emit('joueurs');
        }

        // Pour afficher le nombre de joueurs sur la page
        socket.on('joueurs', nomsJoueurs => {
            console.log(`Noms des joueurs reçus du serveur : ${nomJoueurs}`);
            listeJoueurs.value = nomsJoueurs;
        });

        function entrerDansLaPartie() {
            let nom = nomJ.value;
            console.log("Entrée de "+nom);
            if (nom != "" && nom != " ") socket.emit('entree', nom);
        }


        socket.on('entree', data => {
            console.log("Le serveur confirme mon entrée avec numJoueur="+data.numJoueur);
            numJoueur = data.numJoueur;
            btentree.disabled = true;
            btsortie.disabled = false;
            listeJoueurs.textContent = data.nomsJoueurs;
            numJ.textContent = data.numJoueur;
        });
        socket.on('entreeAutreJoueur', data => {
            console.log("Le serveur confirme l'entrée de "+data.nomJoueur);
            listeJoueurs.textContent = data.nomsJoueurs;
        });

        function quitterLaPartie() {
            let nom = nomJ.value;
            console.log("Sortie de "+nom);
            if (nom != "" && nom != " ") socket.emit('sortie', nom);
        }


        socket.on('sortie', data => {
            console.log("Le serveur confirme ma sortie");
            //console.dir(data);
            numJoueur = -1;
            nomJ.value = "";
            numJ.textContent = "";
            btentree.disabled = false;
            btsortie.disabled = true;
            listeJoueurs.textContent = data.nomsJoueurs;
            messageServeur.textContent = "";
        });
        socket.on('sortieAutreJoueur', data => {
            console.log(`Le serveur confirme la sortie de $(data.nomJoueur) de numéro $(data.numJoueur)`);
            if (numJoueur > data.numJoueur) {
                numJoueur--;
                numJ.textContent = numJoueur;
            }
            listeJoueurs.textContent = data.nomsJoueurs;
        });
        // Envoie du message avec le numJoueur et le texte du message associé
        function envoiMessage(input) {
            console.log("Envoi du message :", input.value)
            socket.emit("message", {'numJoueur':numJoueur, 'texte':input.value});

        }

        // Réception d'un message classique et l'ajoute en dessous des autres messages
        socket.on('message', message => {
            console.log("Réception du message :", message);
            messages.innerHTML += `<div class="messages" style="text-align:right">${message}</div> <br>` // ou text-align:right si le messageAutre marche
            message.value = "";
        });

        socket.on('messageAutre',message => {
            console.log("Réception du message :", message);
            messages.innerHTML += `<div class="messages" style="text-align:left">${message}</div> <br>`
            message.value = ""
        })



        // Réception du message serveur et affiche sur le chat avec une couleur en fonction du type de message
        socket.on('messageServeur', message => {
            console.log("Message serveur :", message);
            let color = "black";

            if (message.includes("rejoint la partie") ) {
                color = "green";
            } else if (message.includes("quitté la partie")
                || message.includes('Nom de joueur déjà enregistré')
                || message.includes('Nombre de joueurs déjà atteint !')) {
                color = "red";
            }
            messages.innerHTML += `<h3 style="color:${color}; margin:5px 0; text-align:center">${message}</h3>`;
        });

        // Demande initiale des joueurs au chargement
    })