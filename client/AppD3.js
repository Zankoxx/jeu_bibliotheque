document.addEventListener('DOMContentLoaded', () => {
    const socket = io()
    const svg = d3.select("#affichageJeu")
        .append("svg")
        .attr("viewBox", "0 0 800 800")  // <-- système interne
        .style("width", "45%")          // <-- s'adapte à la largeur
        .style("height", "98vh")         // Toute la hauteur
        .style("border", "1px solid black"); // Pour voir les bordures du svg

    // Reception du json
   let tabLivres = []
    socket.on('RéceptionJSON' , data => {
        console.log("JSON récupéré")
        tabLivres = data.tabLivres
        console.log(tabLivres)
    })
    

    const groupeBiblio = svg.append("g").attr("id", "groupeBiblio"); // Crée le groupe bibliothèque dans le svg
    const groupeTapis = svg.append("g").attr("id", "groupeTapis"); // Crée le groupe tapis dans le svg
    const groupeLivres = svg.append("g").attr("id", "groupeLivres");     // Crée le groupe livres dans le svg
    groupeLivres.raise();
    const Vitesse_Tapis = 70 ; // Vitesse du tapis en pixels par seconde
    const zonesEtagere = [
    // Bibliothèque 1, étagère du bas
    { x: 50,  y: 470 },
    { x: 110, y: 470 },
    { x: 170, y: 470 },
    { x: 230, y: 470 },
    { x: 290, y: 470 },

    // Bibliothèque 1, étagère du milieu
    { x: 50,  y: 287 },
    { x: 110, y: 287 },
    { x: 170, y: 287 },
    { x: 230, y: 287 },
    { x: 290, y: 287 },

    // Bibliothèque 1, étagère du haut
    { x: 50,  y: 104 },
    { x: 110, y: 104 },
    { x: 170, y: 104 },
    { x: 230, y: 104 },
    { x: 290, y: 104 },

    // Bibliothèque 2, étagère du bas
    { x: 450, y: 470 },
    { x: 510, y: 470 },
    { x: 570, y: 470 },
    { x: 630, y: 470 },
    { x: 690, y: 470 },
    
    // Bibliothèque 2, étagère du milieu
    { x: 450, y: 287 },
    { x: 510, y: 287 },
    { x: 570, y: 287 },
    { x: 630, y: 287 },
    { x: 690, y: 287 },

    // Bibliothèque 2, étagère du haut
    { x: 450, y: 104 },
    { x: 510, y: 104 },
    { x: 570, y: 104 },
    { x: 630, y: 104 },
    { x: 690, y: 104 },

    ];


    let rayon = 20;
    let nbCercles = 20;
    let anim = false; // Si l'animation est en cours ou pas
    let mode = false; // false = Tapis2, true = Tapis1
    let animIntervalTapis = null;
    let animIntervalLivre = null;
    let livreSelectionne = null;
    let indexLivreActuel = 0;

    // Fonction pour dessiner une bibliotheque
    function dessinerBiblio(x, y) {
        groupeBiblio.append("rect")
            .attr("x", x).attr("y", y).attr("width", 300).attr("height", 550).attr("fill", "white").attr("stroke", "black");
        groupeBiblio.append("line")
            .attr("x1", x).attr("y1", y + (550 / 3)).attr("x2", x + 300).attr("y2", y + (550 / 3)).attr("stroke", "black");
        groupeBiblio.append("line")
            .attr("x1", x).attr("y1", y + 2 * (550 / 3)).attr("x2", x + 300).attr("y2", y + 2 * (550 / 3)).attr("stroke", "black");
    }


    // Fonction pour faire les zones de placement des livres dans les biblio
    function creerZonesBiblio() {

        // On s'assure que toutes les zones sont libres au début
        zonesEtagere.forEach(z => z.occupee = false);

        zonesEtagere.forEach((zone, i) => {
        const z = groupeBiblio.append("rect")
            .attr("x", zone.x)
            .attr("y", zone.y)
            .attr("width", 60)
            .attr("height", 130)
            .attr("fill", "transparent")
            .attr("stroke", "none")
            .attr("class", "zonePlacement");
        // Clique sur une zone = pose du livre
        z.on("click", function(event) {
            if (livreSelectionne == null) return; // Sécurité
            if (zone.occupee === true) {
                console.log("Impossible, zone déjà prise !");
                d3.select("#chat")
                    .append("h3")
                    .text("Impossible, zone déjà prise !")
                    .style("color", "purple")
                    .style("margin", "5px 0")
                    .style("text-align", "center");
                return;
            }
            livreSelectionne.interrupt(); // Stop l'animation

            // --- CALCUL DE LA NOUVELLE POSITION ---
            // 1. On récupère la hauteur actuelle du livre sélectionné
            let hauteurLivre = livreSelectionne.select("rect").attr("height");

            // 2. On calcule le Y aligné : Sol de l'étagère - Hauteur du livre
            let nouveauY = zone.y - hauteurLivre + 130; // 130 = hauteur de la zone

            // 3. On place le livre avec le nouveau Y
            livreSelectionne.attr("transform", `translate(${zone.x}, ${nouveauY})`);
            // --------------------------------------

            livreSelectionne.select("rect")
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            zone.occupee = true;
            console.log("Livre posé dans zone", i);
            livreSelectionne = null;
        });
        z.on ("mouseover", function(event) {
            // Sécurité
            if (!livreSelectionne) return;
            if (zone.occupee === true) return;

            // 1. On récupère la hauteur actuelle du livre sélectionné (encore)
            let hauteurLivre = livreSelectionne.select("rect").attr("height");
            // 2. On calcule le Y aligné : Sol de l'étagère - Hauteur du livre
            let nouveauY = zone.y - hauteurLivre + 130; // 130 = hauteur de la zone
            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("fill", "lightgrey")
                // On change la forme de la zone pour qu'elle ressemble au livre
                .attr("height", hauteurLivre)
                .attr("y", nouveauY);
        });
        z.on("mouseout", function(event) {
            d3.select(this)
                .attr("stroke", "none")
                .attr("fill", "transparent")
            //On remet la forme d'origine de la zone
                .attr("height", 130)   // On remet la hauteur totale de l'étagère
                .attr("y", zone.y);    // On remet le Y d'origine (le haut de la zone)
        })
    });
    }


    // Fonctions pour créer les cercles
    // Tapis1 = vertical + horizontal, Tapis2 = diagonales
    function creerCercleTapis1(x, y, r) {
        groupeTapis.append("circle")
            .attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "lightgrey").attr("stroke", "black");
        groupeTapis.append("line")
            .attr("x1", x).attr("y1", y - r).attr("x2", x).attr("y2", y + r).attr("stroke", "black"); // Ligne verticale
        groupeTapis.append("line")
            .attr("x1", x - r).attr("y1", y).attr("x2", x + r).attr("y2", y).attr("stroke", "black"); // Ligne horizontale
    }

    function creerCercleTapis2(x, y, r) {
        let d = r / Math.sqrt(2); // Pour avoir les lignes diagonales il faut cette valeur
        groupeTapis.append("circle")
            .attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "lightgrey").attr("stroke", "black");
        groupeTapis.append("line")
            .attr("x1", x - d).attr("y1", y - d).attr("x2", x + d).attr("y2", y + d).attr("stroke", "black");
        groupeTapis.append("line")
            .attr("x1", x - d).attr("y1", y + d).attr("x2", x + d).attr("y2", y - d).attr("stroke", "black");
    }

    // Cree le sol du tapis roulant avec un motif animé
    function creerSolTapis() {
    // Vérification : si le tapis existe déjà, on ne le recrée pas
    if (!d3.select("#beltTexture").empty()) return;

    const beltHeight = 10;
    const beltYPosition = 760 - beltHeight;
    const patternWidth = 20;

    // 1. Défs et Motif
    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");

    const beltPattern = defs.append("pattern")
        .attr("id", "beltTexture")
        .attr("width", patternWidth)
        .attr("height", beltHeight)
        .attr("patternUnits", "userSpaceOnUse");

    // Fond du tapis (gris foncé)
    beltPattern.append("rect")
        .attr("width", patternWidth).attr("height", beltHeight)
        .attr("fill", "#333");

    // Rayure pour l'effet de vitesse
    beltPattern.append("line")
        .attr("x1", patternWidth / 2).attr("y1", 0)
        .attr("x2", patternWidth / 2).attr("y2", beltHeight)
        .attr("stroke", "#555")
        .attr("stroke-width", 2);

    // 2. Le Rectangle qui utilise le motif
    svg.append("rect")
        .attr("x", 0)
        .attr("y", beltYPosition)
        .attr("width", 800)
        .attr("height", beltHeight)
        .attr("fill", "url(#beltTexture)")
        .attr("stroke", "none");
}



    function gererAnimationTapis(actif) {
    // On récupère le motif via son ID
    const beltPattern = d3.select("#beltTexture");
    
    // Sécurité : si le motif n'existe pas encore, on sort
    if (beltPattern.empty()) return;

    const patternWidth = 20; 
    // On suppose que Vitesse_Tapis est une variable globale définie plus haut
    let duree = patternWidth / Vitesse_Tapis; 

    let animation = beltPattern.select("animateTransform");

    if (actif) {
        // Si on veut activer et que l'animation n'existe pas, on l'ajoute
        if (animation.empty()) {
            beltPattern.append("animateTransform")
                .attr("attributeName", "patternTransform")
                .attr("type", "translate")
                .attr("from", "0 0")
                .attr("to", `${patternWidth} 0`)
                .attr("dur", duree + "s")
                .attr("repeatCount", "indefinite");
        }
    } else {
        // Si on veut désactiver et qu'elle existe, on la supprime
        if (!animation.empty()) {
            animation.remove();
        }
    }
}

    


// Affiche un tapis complet selon le mode
    
    
    function dessinerTapis(mode) {
        groupeTapis.selectAll("*").remove(); // Si un tapis est deja affiché le retire (supprime tout ce qu'il y a dans le groupe tapis)

        for (let i = 0; i < nbCercles; i++) {
            let x = 20 + i * rayon * 2;
            let y = 780;

            if (mode == true)
                creerCercleTapis1(x, y, rayon);
            else
                creerCercleTapis2(x, y, rayon);
        }
        creerSolTapis();
        
    }

    // Tapis de base avant de lanceer l'animation
    dessinerTapis(mode); // mode = false de base donc c'est un Tapis2
    

    // Fonction pour dessiner un livre
    function dessinerLivre(x, y, largeur = 60) {
        const livre = groupeLivres.append("g")
            .attr("class","livre")
            .attr("transform", "translate(" + x + "," + y + ")");

        // Rectangle du livre
        livre.append("rect")
            .attr("width", largeur)
            .attr("height", 0)
            .attr("stroke", "black")
            .attr("rx", 4);

        // Rendre le livre clickable
        livre.on("click", function (event) {
            event.stopPropagation();

            // Si un autre livre était déjà sélectionné, remettre son contour normal
            if (livreSelectionne) {
                livreSelectionne.select("rect")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
            }

            livreSelectionne = livre;

            // Mets un contour sur le livre selectionné pour le reconnaitre
            livre.select("rect")
                .attr("stroke", "gold")
                .attr("stroke-width", 5);

            // Récupère les infos attachées au livre
            const infoLivre = livre.datum();

            // Affiche toutes les infos dans le div
            if (infoLivre.littérature === undefined) {infoLivre.littérature = "Inconnue";}
            d3.select("#infoLivre").html(`
                <b>Titre :</b> ${infoLivre.titre} <br>
                <b>Auteur :</b> ${infoLivre.auteur} <br>
                <b>Genre :</b> ${infoLivre.genre} <br>
                <b>Littérature :</b> ${infoLivre.littérature} <br>
                <b>Format :</b> ${infoLivre.format}
            `);

            console.log("Livre sélectionné");
        })

        return livre;
    }


    // Fonction pour animer un livre sur le tapis roulant
    function animerLivre(livre, xCible, yCible, duree = 10000) {
        const distance = xCible - 10; // Distance à parcourir (800 - position de départ 10)
        duree = (distance / Vitesse_Tapis) * 1000; // Calcul de la durée en ms en fonction de la vitesse du tapis
        livre.transition()
            .duration(duree)
            .ease(d3.easeLinear) // Vitesse constante du début à la fin
            .attr("transform", "translate(" + xCible + "," + yCible + ")")
            .on("end", () => livre.remove()); // Supprmier le livre quand l'animation est finie
    }

    function spawnLivre(livreObj) {
        let livreCrée = dessinerLivre(10, 620);
        let ysol = 750;
        socket.emit('demandeLivre', livreObj);
        //let idLivre = "Livre"+(indexLivreActuel+1);
        socket.once('envoiLivre', (data) => {
            livreCrée.select("rect")
                .attr("fill", data.livreC)
                .attr("height", data.livreF)
               // .attr("id",idLivre)
            livreCrée.attr("transform", `translate(10, ${ysol - data.livreF})`)
            livreCrée.datum(livreObj);
            /*d3.select(`#${idLivre}`).html(`<b class="infoJSONLivreTitre">${livreObj.titre}</b>
                            <br> <p class="infoJSONLivreAuteur">${livreObj.nom}</p>`);*/
            animerLivre(livreCrée,800,ysol - data.livreF);
        })
    }

    svg.append("line")
        .attr("x1", 0).attr("y1", 600).attr("x2", 800).attr("y2", 600).attr("stroke", "black");

    
     // Fonction qui démarre l'animation
    
    
    
        function startAnimation() {
        if (anim == true)
            return; // Si animation deja en cours on relance pas
        anim = true;
        gererAnimationTapis(anim)
        animIntervalTapis = setInterval(() => {
            mode = !mode;
            dessinerTapis(mode);
        }, 150);
        animIntervalLivre =
        // Fonction qui spawn le prochain livre toutes les 10 secondes
        setInterval(function () {
        // On prend le livre courant du tableau
        const livreObj = tabLivres[indexLivreActuel];

        // Spawn le livre sur le tapis roulant
        spawnLivre(livreObj);

        // Passe au livre suivant (boucle si on arrive à la fin)
        indexLivreActuel += 1;

    }, 10000); // 10000 ms = 10 secondes
    }

    // Fonction qui stop l'animation
    function stopAnimation() {
        anim = false;
        gererAnimationTapis(anim)
        clearInterval(animIntervalTapis);
        clearInterval(animIntervalLivre);
    }
    
    dessinerBiblio(50, 50);
    dessinerBiblio(450, 50);
    creerZonesBiblio();
    let testDansBiblio = dessinerLivre(50, 470);
    let testDansBiblio2 = dessinerLivre(110, 470);
    let testDansBiblio3 = dessinerLivre(170, 470);
    let testDansBiblio4 = dessinerLivre(230, 470);
    let testDansBiblio5 = dessinerLivre(290, 470);

    //let test = spawnLivre(choisirLivre(0))

    socket.on('StartAnimation',() => {
        startAnimation()
        console.log("L'animation démarre")
    })
    socket.on('StopAnimation',() => {
        stopAnimation()
        console.log("l'animation s'arrête")
    })
});
