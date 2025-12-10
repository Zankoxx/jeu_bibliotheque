document.addEventListener('DOMContentLoaded', () => {
    // --- Initialisation ---
    const socket = io();
    const svg = d3.select("#affichageJeu")
        .append("svg")
        .attr("viewBox", "0 0 800 800")
        .style("width", "45%")
        .style("height", "90vh")
        .style("border", "1px solid black");

    // --- Variables Globales au jeu ---
    let tabLivres = [];
    const groupeBiblio = svg.append("g").attr("id", "groupeBiblio");
    const groupeTapis = svg.append("g").attr("id", "groupeTapis");
    const groupeLivres = svg.append("g").attr("id", "groupeLivres");
    groupeLivres.raise(); // Important pour que les livres soient au-dessus

    const Vitesse_Tapis = 70;
    const zonesEtagere = [
        { x: 50,  y: 470 }, { x: 110, y: 470 }, { x: 170, y: 470 }, { x: 230, y: 470 }, { x: 290, y: 470 },
        { x: 50,  y: 287 }, { x: 110, y: 287 }, { x: 170, y: 287 }, { x: 230, y: 287 }, { x: 290, y: 287 },
        { x: 50,  y: 104 }, { x: 110, y: 104 }, { x: 170, y: 104 }, { x: 230, y: 104 }, { x: 290, y: 104 },
        { x: 450, y: 470 }, { x: 510, y: 470 }, { x: 570, y: 470 }, { x: 630, y: 470 }, { x: 690, y: 470 },
        { x: 450, y: 287 }, { x: 510, y: 287 }, { x: 570, y: 287 }, { x: 630, y: 287 }, { x: 690, y: 287 },
        { x: 450, y: 104 }, { x: 510, y: 104 }, { x: 570, y: 104 }, { x: 630, y: 104 }, { x: 690, y: 104 },
    ];

    let rayon = 20;
    let nbCercles = 20;
    let anim = false;
    let mode = false;
    let animIntervalTapis = null;
    let animIntervalLivre = null;
    let livreSelectionne = null;
    let indexLivreActuel = 0;

    // --- Fonctions Utilitaires ---

    // Fonction pour couper le texte (DOIT être définie avant d'être utilisée)
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
        console.log(tabLivres);
    });

    // --- Dessin Bibliothèque ---
    function dessinerBiblio(x, y) {
        groupeBiblio.append("rect")
            .attr("x", x).attr("y", y).attr("width", 300).attr("height", 550).attr("fill", "white").attr("stroke", "black");
        groupeBiblio.append("line")
            .attr("x1", x).attr("y1", y + (550 / 3)).attr("x2", x + 300).attr("y2", y + (550 / 3)).attr("stroke", "black");
        groupeBiblio.append("line")
            .attr("x1", x).attr("y1", y + 2 * (550 / 3)).attr("x2", x + 300).attr("y2", y + 2 * (550 / 3)).attr("stroke", "black");
    }

    // --- Création Zones ---
    function creerZonesBiblio() {
        zonesEtagere.forEach(z => z.occupee = false);

        zonesEtagere.forEach((zone, i) => {
            const z = groupeBiblio.append("rect")
                .datum(zone) // <--- INDISPENSABLE pour que 'd' existe plus tard
                .attr("x", zone.x)
                .attr("y", zone.y - 20)
                .attr("width", 60)
                .attr("height", 150)
                .attr("fill", "transparent")
                .attr("stroke", "none")
                .attr("class", "zonePlacement");

            z.on("click", function(event) {
                if (livreSelectionne == null) return;
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

    // --- Tapis ---
    function creerCercleTapis1(x, y, r) {
        groupeTapis.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "lightgrey").attr("stroke", "black");
        groupeTapis.append("line").attr("x1", x).attr("y1", y - r).attr("x2", x).attr("y2", y + r).attr("stroke", "black");
        groupeTapis.append("line").attr("x1", x - r).attr("y1", y).attr("x2", x + r).attr("y2", y).attr("stroke", "black");
    }

    function creerCercleTapis2(x, y, r) {
        let d = r / Math.sqrt(2);
        groupeTapis.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "lightgrey").attr("stroke", "black");
        groupeTapis.append("line").attr("x1", x - d).attr("y1", y - d).attr("x2", x + d).attr("y2", y + d).attr("stroke", "black");
        groupeTapis.append("line").attr("x1", x - d).attr("y1", y + d).attr("x2", x + d).attr("y2", y - d).attr("stroke", "black");
    }

    function creerSolTapis() {
        if (!d3.select("#beltTexture").empty()) return;
        const beltHeight = 10;
        const beltYPosition = 760 - beltHeight;
        const patternWidth = 20;

        let defs = svg.select("defs");
        if (defs.empty()) defs = svg.append("defs");

        const beltPattern = defs.append("pattern")
            .attr("id", "beltTexture")
            .attr("width", patternWidth).attr("height", beltHeight).attr("patternUnits", "userSpaceOnUse");
        beltPattern.append("rect").attr("width", patternWidth).attr("height", beltHeight).attr("fill", "#333");
        beltPattern.append("line").attr("x1", patternWidth / 2).attr("y1", 0).attr("x2", patternWidth / 2).attr("y2", beltHeight).attr("stroke", "#555").attr("stroke-width", 2);

        svg.append("rect").attr("x", -20).attr("y", beltYPosition).attr("width", 840).attr("height", beltHeight).attr("fill", "url(#beltTexture)").attr("stroke", "none");
    }

    function gererAnimationTapis(actif) {
        const beltPattern = d3.select("#beltTexture");
        if (beltPattern.empty()) return;
        const patternWidth = 20;
        let duree = patternWidth / Vitesse_Tapis;
        let animation = beltPattern.select("animateTransform");

        if (actif) {
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
            if (!animation.empty()) animation.remove();
        }
    }

    function dessinerTapis(mode) {
        groupeTapis.selectAll("*").remove();
        for (let i = 0; i < nbCercles + 1; i++) {
            let x = 20 + i * rayon * 2;
            let y = 780;
            if (mode == true) creerCercleTapis1(x - 20, y, rayon);
            else creerCercleTapis2(x - 20, y, rayon);
        }
        creerSolTapis();
    }

    // --- Livres ---
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
            if (livreSelectionne) {
                livreSelectionne.select("rect").attr("stroke", "black").attr("stroke-width", 1);
            }
            livreSelectionne = livre;
            livre.select("rect").attr("stroke", "gold").attr("stroke-width", 5);

            const infoLivre = livre.datum();
            if (infoLivre.littérature === undefined) { infoLivre.littérature = "Inconnue"; }

            // Utilisation de couperEnLignes qui est maintenant accessible !
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
        let livreCrée = dessinerLivre(10, 620);
        let ysol = 750;
        socket.emit('demandeLivre', livreObj);
        socket.once('envoiLivre', (data) => {
            livreCrée.select("rect")
                .attr("fill", data.livreC)
                .attr("height", data.livreF);
            livreCrée.attr("transform", `translate(10, ${ysol - data.livreF})`);
            livreCrée.datum(livreObj);
            animerLivre(livreCrée, 800, ysol - data.livreF);
        })
    }

    // --- Gestion Animation ---
    svg.append("line").attr("x1", 0).attr("y1", 600).attr("x2", 800).attr("y2", 600).attr("stroke", "black");

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

                // --- CORRECTION CRASH INDEX ---
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

    // --- Lancement Initial ---
    dessinerTapis(mode);
    dessinerBiblio(50, 50);
    dessinerBiblio(450, 50);
    creerZonesBiblio();

    socket.on('StartAnimation', () => {
        startAnimation();
        console.log("L'animation démarre");
    })
    socket.on('StopAnimation', () => {
        stopAnimation();
        console.log("l'animation s'arrête");
    })

    // --- C'EST ICI QU'ON MET LE CODE ADVERSE (A l'intérieur de DOMContentLoaded) ---
    socket.on('LivreAdverse', (data) => {
        // 1. On sélectionne TOUTES les zones de placement
        d3.selectAll(".zonePlacement")
            // 2. On garde UNIQUEMENT celle qui a le bon index
            .filter((d, i) => i === data.index)
            .each(function(d) {
                // MAINTENANT 'd' EXISTE car on est dans la portée où .datum() a été appliqué

                // A. On marque la zone comme occupée
                d.occupee = true;

                // Calcul de la position
                let hauteurLivre = data.taille || 60;
                let zoneX = parseFloat(d3.select(this).attr("x"));
                let zoneY = parseFloat(d3.select(this).attr("y"));
                let nouveauY = zoneY + 130 + 20 - hauteurLivre;

                // B. On dessine le livre adverse
                // MAINTENANT 'groupeLivres' EXISTE car on est dans la même portée
                groupeLivres.append("g")
                    .attr("transform", `translate(${zoneX}, ${nouveauY})`)
                    .html(`
                        <rect width="60" height="${data.taille}" fill="${data.couleur || 'brown'}" stroke="black" rx="4"></rect>
                        <foreignObject x="0" y="0" width="60" height="${hauteurLivre}">
                            <div style="width:100%; height:100%; display:flex; justify-content:center; 
                            align-items:center; text-align:center; color: white; font-size:12px; font-weight: bold; 
                            border-color: white ; border-size ; 2px solid; pointer-events:none;">
                                ${couperEnLignes(data.titre || "", 2)}
                            </div>
                        </foreignObject>
                    `);
            });
    });

}); // <--- FIN DE DOMContentLoaded