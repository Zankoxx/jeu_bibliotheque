document.addEventListener('DOMContentLoaded', () => {
    // Initialisation
    const socket = window.socket
    const svg = d3.select("#affichageJeu")
        .append("svg")
        .attr("viewBox", "0 0 800 800")
        .style("width", "100%")
        .style("height", "90vh")
        .style("border", "1px solid black"); // Pour voir les bordures du svg

    // Variables globales du jeu
    let tabLivres = [];
    let estMonTour = false;
    const groupeDecor = svg.append("g").attr("id", "groupeDecor");
    const groupeBiblio = svg.append("g").attr("id", "groupeBiblio");
    const groupeTapis = svg.append("g").attr("id", "groupeTapis");
    const groupeRoues = svg.append("g").attr("id", "groupeRoues");
    const groupeLivres = svg.append("g").attr("id", "groupeLivres");
    groupeLivres.raise(); // Important pour que les livres soient au-dessus
    groupeDecor.lower()

    const Vitesse_Tapis = 70; // Vitesse du tapis en pixels par seconde
    const zonesEtagere = [
        // Bibliothèque 1, étagère du bas
        { x: 50,  y: 458 },
        { x: 110, y: 458 }, 
        { x: 170, y: 458 }, 
        { x: 230, y: 458 }, 
        { x: 290, y: 458 },

        // Bibliothèque 1, étagère du milieu
        { x: 50,  y: 277 }, 
        { x: 110, y: 277 }, 
        { x: 170, y: 277 }, 
        { x: 230, y: 277 }, 
        { x: 290, y: 277 },

        // Bibliothèque 1, étagère du haut
        { x: 50,  y: 84 }, 
        { x: 110, y: 84 }, 
        { x: 170, y: 84 }, 
        { x: 230, y: 84 }, 
        { x: 290, y: 84 },

        // Bibliothèque 2, étagère du bas
        { x: 450, y: 460 }, 
        { x: 510, y: 460 }, 
        { x: 570, y: 460 }, 
        { x: 630, y: 460 }, 
        { x: 690, y: 460 },

        // Bibliothèque 2, étagère du milieu
        { x: 450, y: 277 }, 
        { x: 510, y: 277 }, 
        { x: 570, y: 277 }, 
        { x: 630, y: 277 }, 
        { x: 690, y: 277 },

        // Bibliothèque 2, étagère du haut
        { x: 450, y: 84 }, 
        { x: 510, y: 84 }, 
        { x: 570, y: 84 }, 
        { x: 630, y: 84 }, 
        { x: 690, y: 84 },
    ];

    let rayon = 20; // Rayon d'un cercle du tapis
    let nbCercles = 20;
    let anim = false; // Si l'animation est en cours ou pas
    let mode = false; // false = Tapis2, true = Tapis1
    let animIntervalTapis = null;
    let animIntervalLivre = null;
    let livreSelectionne = null;
    let indexLivreActuel = 0;

    // Fonction pour couper le texte
    function couperEnLignes(texte, nbMots) {
        if (!texte) return ""; // Sécurité si le texte est vide
        const mots = texte.trim().split(/\s+/);
        let lignes = [];
        while (mots.length > 0) {
            lignes.push(mots.splice(0, nbMots).join(' '));
        }
        return lignes.join('<br>');
    }

    // Reception du json
    socket.on('RéceptionJSON' , data => {
        console.log("JSON récupéré");
        tabLivres = data.tabLivres;
        indexLivreActuel = 0; // Réinitialisation de l'index
        console.log(tabLivres);
    });

    // Fonction pour dessiner une bibliotheque
    function dessinerBiblio(x, y) {
        // Dimensions exactes de la zone de jeu
        const largeurInterne = 300;
        const hauteurInterne = 550;
        const tier = hauteurInterne / 3;

        // Dimensions de la déco (autour)
        const epaisseurCadre = 20; // Epaisseur des montants sur les côtés
        const hauteurCorniche = 30; // Le chapeau en haut
        const epaisseurEtagere = 12; // Epaisseur visuelle des planches

        // Couleurs
        const boisFonce = "#6D4C41";  // Fond
        const boisCadre = "#8D6E63";  // Montants
        const boisClair = "#A1887F";  // Planches

        // Le fond, on le met exactement dans la zone pour que ce soit sombre derrière les livres
        groupeBiblio.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", largeurInterne)
            .attr("height", hauteurInterne)
            .attr("fill", "#4E342E") // Très foncé
            .attr("stroke", "none");

        // Les montants extérieurs (le cadre quoi)
        // Montant gauche (dessiné à x - 20)
        groupeBiblio.append("rect")
            .attr("x", x - epaisseurCadre)
            .attr("y", y)
            .attr("width", epaisseurCadre)
            .attr("height", hauteurInterne + epaisseurCadre) // Descend un peu plus bas pour faire pied
            .attr("fill", boisCadre)
            .attr("stroke", "black");

        // Montant droit (dessiné à x + 300)
        groupeBiblio.append("rect")
            .attr("x", x + largeurInterne)
            .attr("y", y)
            .attr("width", epaisseurCadre)
            .attr("height", hauteurInterne + epaisseurCadre)
            .attr("fill", boisCadre)
            .attr("stroke", "black");

        // Corniche (Le toit, au dessus de y)
        groupeBiblio.append("rect")
            .attr("x", x - epaisseurCadre - 10) // Déborde un peu sur les côtés
            .attr("y", y - hauteurCorniche)
            .attr("width", largeurInterne + (epaisseurCadre * 2) + 20)
            .attr("height", hauteurCorniche)
            .attr("fill", boisCadre)
            .attr("stroke", "black")
            .attr("rx", 3); // Coins un peu arrondis

        // Les planches (visuel seulement)
        // On dessine un rectangle juste en dessous de la ligne ou se pose le livre
        // pour donner l'impression que le livre est posé dessus.

        // Planche du haut 
        groupeBiblio.append("rect")
            .attr("x", x)
            .attr("y", y + tier -10)
            .attr("width", largeurInterne)
            .attr("height", epaisseurEtagere)
            .attr("fill", boisClair)
            .attr("stroke", "black");

        // Planche du milieu 
        groupeBiblio.append("rect")
            .attr("x", x)
            .attr("y", y + (tier * 2))
            .attr("width", largeurInterne)
            .attr("height", epaisseurEtagere)
            .attr("fill", boisClair)
            .attr("stroke", "black");

        // Planche du bas 
        groupeBiblio.append("rect")
            .attr("x", x)
            .attr("y", y + hauteurInterne - epaisseurEtagere +10) // Juste à la fin
            .attr("width", largeurInterne)
            .attr("height", epaisseurEtagere)
            .attr("fill", boisClair)
            .attr("stroke", "black");
    }
    function creerDecorFond() {
        const hauteurSol = 600; // Le niveau où le mur s'arrête (derrière le tapis)

        // Motif papier peint (rayures)
        let defs = svg.select("defs");
        if (defs.empty()) defs = svg.append("defs");

        const motifMur = defs.append("pattern")
            .attr("id", "motifPapierPeint")
            .attr("width", 40) // Largeur du motif qui se répète
            .attr("height", 40)
            .attr("patternUnits", "userSpaceOnUse");

        // Fond du papier peint (beige crème)
        motifMur.append("rect")
            .attr("width", 40).attr("height", 40)
            .attr("fill", "#f4a968"); // OldLace

        // Rayure verticale (beige un peu plus foncé)
        motifMur.append("rect")
            .attr("width", 20).attr("height", 40)
            .attr("fill", "#FAEBD7"); // AntiqueWhite

        // Le mur
        groupeDecor.append("rect")
            .attr("x", -20)
            .attr("y", 0)
            .attr("width", 800+20)
            .attr("height", hauteurSol)
            .attr("fill", "url(#motifPapierPeint)"); // On applique le motif

        // Le sol
        groupeDecor.append("rect")
            .attr("x", 0-20)
            .attr("y", hauteurSol)
            .attr("width", 800+40)
            .attr("height", 800 - hauteurSol) // Jusqu'en bas
            .attr("fill", "#8D6E63")
            .lower(); // Marron bois

        // Séparation mur/sol
        groupeDecor.append("rect")
            .attr("x", -20)
            .attr("y", hauteurSol - 15) // Juste au dessus du sol
            .attr("width", 800+40)
            .attr("height", 15)
            .attr("fill", "#FFF8E1") 
            .attr("stroke", "#D7CCC8"); // Petit contour gris léger

    }

    // Fonction pour faire les zones de placement des livres dans les biblio
    function creerZonesBiblio() {
        zonesEtagere.forEach(z => z.occupee = false);

        zonesEtagere.forEach((zone, i) => {
            const z = groupeBiblio.append("rect")
                .datum(zone)
                .attr("x", zone.x)
                .attr("y", zone.y - 20)
                .attr("width", 60)
                .attr("height", 150)
                .attr("fill", "transparent")
                .attr("stroke", "none")
                .attr("class", "zonePlacement");

            z.on("click", function(event) {
                if (livreSelectionne == null) return;
                if (!estMonTour) return; // Sécurité supplémentaire
                if (zone.occupee === true) {
                    if (typeof ajouterMessageChat === "function") {
                        ajouterMessageChat("Impossible, zone déjà prise !", "system");
                    }
                    return;
                }
                livreSelectionne.interrupt();

                let hauteurLivre = livreSelectionne.select("rect").attr("height");
                let nouveauY = zone.y - hauteurLivre + 130;

                livreSelectionne.attr("transform", `translate(${zone.x}, ${nouveauY})`);

                livreSelectionne.select("rect")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);
                livreSelectionne.style("pointer-events", "none"); // Désactive les interactions
                zone.occupee = true;

                // Envoi au serveur
                if (zone.occupee){
                    let info = livreSelectionne.datum();
                    socket.emit('LivrePlacé', {
                        'index': i,
                        'JSONLivre': info,
                        'hauteur': hauteurLivre
                    });
                }
                livreSelectionne = null;
            });

            z.on("mouseover", function(event) {
                if (!livreSelectionne) return;
                if (zone.occupee === true) return;

                let hauteurLivre = livreSelectionne.select("rect").attr("height");
                let nouveauY = zone.y - hauteurLivre + 130;
                d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("fill", "lightgrey")
                    .attr("height", hauteurLivre)
                    .attr("y", nouveauY);
            });

            z.on("mouseout", function(event) {
                d3.select(this)
                    .attr("stroke", "none")
                    .attr("fill", "transparent")
                    .attr("height", 150)
                    .attr("y", zone.y - 20);
            })
        });
    }

    // Fonctions pour créer les cercles
    // Tapis1 = vertical + horizontal, Tapis2 = diagonales
    function creerCercleTapis1(x, y, r) {
        groupeRoues.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "lightgrey").attr("stroke", "black");
        groupeRoues.append("line").attr("x1", x).attr("y1", y - r).attr("x2", x).attr("y2", y + r).attr("stroke", "black");
        groupeRoues.append("line").attr("x1", x - r).attr("y1", y).attr("x2", x + r).attr("y2", y).attr("stroke", "black");
    }

    function creerCercleTapis2(x, y, r) {
        let d = r / Math.sqrt(2);
        groupeRoues.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "lightgrey").attr("stroke", "black");
        groupeRoues.append("line").attr("x1", x - d).attr("y1", y - d).attr("x2", x + d).attr("y2", y + d).attr("stroke", "black");
        groupeRoues.append("line").attr("x1", x - d).attr("y1", y + d).attr("x2", x + d).attr("y2", y - d).attr("stroke", "black");
    }

    // Cree le sol du tapis roulant avec un motif animé
    function creerSolTapis() {
        if (!d3.select("#textureTapis").empty()) return;
        const hauteurTapis = 10;
        const posYTapis = 760 - hauteurTapis;
        const largeurPaterne = 20;

        let defs = svg.select("defs");
        if (defs.empty()) defs = svg.append("defs");

        const paterneTapis = defs.append("pattern")
            .attr("id", "textureTapis")
            .attr("width", largeurPaterne).attr("height", hauteurTapis).attr("patternUnits", "userSpaceOnUse");
        paterneTapis.append("rect").attr("width", largeurPaterne).attr("height", hauteurTapis).attr("fill", "#333");
        paterneTapis.append("line").attr("x1", largeurPaterne / 2).attr("y1", 0).attr("x2", largeurPaterne / 2).attr("y2", hauteurTapis).attr("stroke", "#555").attr("stroke-width", 2);

        svg.append("rect").attr("x", -20).attr("y", posYTapis).attr("width", 840).attr("height", hauteurTapis).attr("fill", "url(#textureTapis)").attr("stroke", "none");
        groupeTapis.append("rect").attr("x",-20).attr("y",hauteurTapis + posYTapis -1).attr("width",840).attr("height",rayon*2+1).attr("fill","#333").attr("stroke","none")
    }

    function gererAnimationTapis(actif) {
        // On récupère le motif via son ID
        const paterneTapis = d3.select("#textureTapis");

        // Sécurité : si le motif n'existe pas encore, on sort
        if (paterneTapis.empty()) return;

        const largeurTapis = 20;
        let duree = largeurTapis / Vitesse_Tapis;
        let animation = paterneTapis.select("animateTransform");

        if (actif) {
            // Si on veut activer et que l'animation n'existe pas, on l'ajoute
            if (animation.empty()) {
                paterneTapis.append("animateTransform")
                    .attr("attributeName", "patternTransform")
                    .attr("type", "translate")
                    .attr("from", "0 0")
                    .attr("to", `${largeurTapis} 0`)
                    .attr("dur", duree + "s")
                    .attr("repeatCount", "indefinite");
            }
        } else {
            // Si on veut désactiver et qu'elle existe, on la supprime
            if (!animation.empty()) animation.remove();
        }
    }

    // Affiche un tapis complet selon le mode
    function dessinerTapis(mode) {
        // Si un tapis est deja affiché le retire (supprime tout ce qu'il y a dans le groupe tapis)
        groupeRoues.selectAll("*").remove();
        for (let i = 0; i < nbCercles + 1; i++) {
            let x = 20 + i * rayon * 2;
            let y = 780;
            if (mode == true) creerCercleTapis1(x - 20, y, rayon);
            else creerCercleTapis2(x - 20, y, rayon);
        }
        creerSolTapis();
    }

    // Fonction pour dessiner un livre
    function dessinerLivre(x, y, largeur = 60) {
        const livre = groupeLivres.append("g")
            .attr("class", "livre")
            .attr("transform", "translate(" + x + "," + y + ")");

        livre.append("rect")
            .attr("width", largeur)
            .attr("height", 0)
            .attr("stroke", "black")
            .attr("rx", 4);

        livre.on("click", function(event) {
            event.stopPropagation();
            if (!estMonTour) {
                alert("Attendez votre tour !");
                return;
            }
            if (livreSelectionne) {
                livreSelectionne.select("rect").attr("stroke", "black").attr("stroke-width", 1);
            }
            livreSelectionne = livre;
            livre.select("rect").attr("stroke", "gold").attr("stroke-width", 5);

            const infoLivre = livre.datum();
            if (infoLivre.littérature === undefined) { infoLivre.littérature = "Inconnue"; }

            d3.select("#infoLivre").html(`
                <div style="display: flex; flex-direction: column; align-items: center; font-size:15px;gap: 2px; margin-bottom: 4px;">
                    <span style="font-weight: bold; font-size: 1.1em;">Titre</span>
                    <span style="text-align: center; line-height: 1.1;">${couperEnLignes(infoLivre.titre, 3)}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size:14px; margin-bottom: 4px;">
                    <span style="font-weight: bold; font-size: 1.1em;">Auteur</span>
                    <span style="text-align: center; line-height: 1.1;">${couperEnLignes(infoLivre.auteur, 2)}</span>
                </div>
                <div style="line-height: 1.4;">
                    <b>Genre :</b> ${infoLivre.genre} <br>
                    <b>Littérature :</b> ${infoLivre.littérature} <br>
                    <b>Format :</b> ${infoLivre.format}
                </div>
            `);
            console.log("Livre sélectionné");
        })
        return livre;
    }

    // Fonction pour animer un livre sur le tapis roulant
    function animerLivre(livre, xCible, yCible, duree = 10000) {
        const distance = xCible - 10;
        duree = (distance / Vitesse_Tapis) * 1000;
        livre.transition()
            .duration(duree)
            .ease(d3.easeLinear)
            .attr("transform", "translate(" + xCible + "," + yCible + ")")
            .on("end", () => livre.remove());
    }

    function spawnLivre(livreObj) {
        // On crée le groupe et le rectangle de base
        let livreCrée = dessinerLivre(10, 620);
        let ysol = 750;

        socket.emit('demandeLivre', livreObj);

        socket.once('envoiLivre', (data) => {
            // Récupération des données du serveur
            let hauteur = data.livreF;
            let couleur = data.livreC;

            // On met à jour le rectangle existant (créé par dessinerLivre)
            livreCrée.select("rect")
                .attr("fill", couleur)
                .attr("height", hauteur);

            // On ajoute le texte par dessus (ForeignObject)
            livreCrée.append("foreignObject")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 60)
                .attr("height", hauteur)
                .style("pointer-events", "none") // Permet de cliquer sur le livre à travers le texte, important
                .html(`
                    <div style="
                        width:100%; height:100%;
                        display:flex; justify-content:center; align-items:center;
                        text-align:center; color: white; font-size:9px; font-weight: bold;
                        padding: 2px; box-sizing: border-box;
                        text-shadow: 1px 1px 1px black;">
                        ${couperEnLignes(livreObj.titre || "Sans titre", 2)}
                    </div>
                `);

            // Positionnement et animation
            livreCrée.attr("transform", `translate(10, ${ysol - hauteur})`);
            livreCrée.datum(livreObj); // On attache les données pour le clic
            animerLivre(livreCrée, 800, ysol - hauteur);
        })
    }

    // Gestion animation

    function startAnimation() {
        if (anim == true) return;
        anim = true;
        gererAnimationTapis(anim);

        animIntervalTapis = setInterval(() => {
            mode = !mode;
            dessinerTapis(mode);
        }, 150);

        animIntervalLivre = setInterval(function() {
            if (tabLivres.length > 0) {
                const livreObj = tabLivres[indexLivreActuel];
                spawnLivre(livreObj);

                // On boucle pour ne pas dépasser la taille du tableau
                indexLivreActuel = (indexLivreActuel + 1) % tabLivres.length;
            }
        }, 10000);
    }

    function stopAnimation() {
        anim = false;
        gererAnimationTapis(anim);
        clearInterval(animIntervalTapis);
        clearInterval(animIntervalLivre);
    }

    // Lancement initial
    creerDecorFond()
    dessinerTapis(mode); // Tapis de base avant de lanceer l'animation, mode = false de base donc c'est un Tapis2
    dessinerBiblio(50, 40);
    dessinerBiblio(450, 40);
    creerZonesBiblio();

    socket.on('StartAnimation', () => {
        startAnimation();
        console.log("L'animation démarre");
    })
    socket.on('StopAnimation', () => {
        stopAnimation();
        console.log("l'animation s'arrête");
    })

    // Livre adverse
    socket.on('LivreAdverse', (data) => {
        // On cherche dans le groupeLivres un livre qui a le même titre que celui placé
        groupeLivres.selectAll(".livre")
            .filter(function(d) { return d && d.titre === data.titre; }) // On filtre par titre
            .remove(); // On le supprime du DOM
        // On sélectionne toutes les zones de placement
        d3.selectAll(".zonePlacement")
            // On garde que celle qui a le bon index
            .filter((d, i) => i === data.index)
            .each(function(d) {
                // On marque la zone comme occupée
                d.occupee = true;

                // Calcul de la position
                let hauteurLivre = data.taille || 60;
                let zoneX = parseFloat(d3.select(this).attr("x"));
                let zoneY = parseFloat(d3.select(this).attr("y"));
                let nouveauY = zoneY + 130 + 20 - hauteurLivre;

                // On dessine le livre adverse
                groupeLivres.append("g")
                    .attr("transform", `translate(${zoneX}, ${nouveauY})`)
                    .html(`
                        <rect width="60" height="${data.taille}" fill="${data.couleur || 'brown'}" stroke="black" rx="4"></rect>
                        <foreignObject x="0" y="0" width="60" height="${hauteurLivre}" pointer-events="none">
                            <div style="
                                    width:100%; height:100%;
                                    display:flex; justify-content:center; align-items:center;
                                    text-align:center; color: white; font-size:9px; font-weight: bold;
                                    padding: 2px; box-sizing: border-box;
                                    text-shadow: 1px 1px 1px black;">
                                    ${couperEnLignes(data.titre || "Sans titre", 2)}
                            </div>
                        </foreignObject>
                    `);
            });
    });

    socket.on('ChangementTour', (indexTour) => {
        // numJoueur est défini dans index.html
        if (indexTour === numJoueur) {
            estMonTour = true;
            console.log("C'est à moi de jouer !");
            d3.select("#infoLivre").style("border", "5px solid green");
        } else {
            estMonTour = false;
            console.log("Attente de l'adversaire...");
            d3.select("#infoLivre").style("border", "5px solid red");

            // Désélectionner le livre en cours si on en avait un
            livreSelectionne = null;
            d3.selectAll(".livre rect").attr("stroke", "black").attr("stroke-width", 1);
        }
    });

});
