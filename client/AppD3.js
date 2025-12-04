document.addEventListener('DOMContentLoaded', () => {
    const svg = d3.select("#affichageJeu")
        .append("svg")
        .attr("viewBox", "0 0 800 800")  // <-- système interne
        .style("width", "45%")          // <-- s'adapte à la largeur
        .style("height", "98vh")         // Toute la hauteur
        .style("border", "1px solid black"); // Pour voir les bordures du svg

    async function chargerLivres() {
            let res = await fetch("livres.json");
            return await res.json();
        }

        async function choisirLivre(id) {
            let livres = await chargerLivres();
            return livres.find(l => l.id === id);
        }

        const svg = d3.select("#affichageJeu")
        .append("svg")
            .attr("viewBox", "0 0 800 800")  // <-- système interne
            .style("width", "45%")          // <-- s'adapte à la largeur
            .style("height", "98vh")         // Toute la hauteur
            .style("border", "1px solid black"); // Pour voir les bordures du svg
        
        const biblio = svg.append("g").attr("id","biblio"); // Crée le groupe bibliothèque dans le svg
        const tapis = svg.append("g").attr("id","tapis"); // Crée le groupe tapis dans le svg
        const livres = svg.append("g").attr("id","livres"); // Crée le groupe livres dans le svg

        let rayon = 20;
        let nbCercles = 20;
        let anim = false; // Si l'animation est en cours ou pas
        let mode = false; // false = Tapis2, true = Tapis1
        let animInterval = null;
        let livreSelectionne = null;
        let indexLivreActuel = 0;

        // Fonction pour dessiner une bibliotheque
        function dessinerBiblio(x,y){
            biblio.append("rect")
                .attr("x", x).attr("y", y).attr("width", 300).attr("height", 550).attr("fill", "white").attr("stroke", "black"); 
            biblio.append("line")
                .attr("x1", x).attr("y1", y + (550/3)).attr("x2", x + 300).attr("y2", y + (550/3)).attr("stroke", "black");
            biblio.append("line")
                .attr("x1", x).attr("y1", y + 2*(550/3)).attr("x2", x + 300).attr("y2", y + 2*(550/3)).attr("stroke", "black");
            biblio.on("click", function(event) {
                // Si aucun livre n'est selectionné ne fait rien
                if (livreSelectionne == null) 
                    return;

                // Arrete l'animation du livre pour pouvoir le poser su la biblio
                livreSelectionne.interrupt();

                // Convertit la position du clic dans le SVG
                const [x, y] = d3.pointer(event);

                // Place le livre
                livreSelectionne.attr("transform", "translate(" + x + "," + y + ")");

                console.log("Livre posé en étagère à", x, y);

                // Retire le contour de sélection quand on place le livre
                livreSelectionne.select("rect")
                        .attr("stroke", "black")
                        .attr("stroke-width", 1);

                livreSelectionne = null; // reset
            });
        }

        
        // Fonctions pour créer les cercles
        // Tapis1 = vertical + horizontal, Tapis2 = diagonales
        function creerCercleTapis1(x,y,r){
        tapis.append("circle")
            .attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "white").attr("stroke", "black");
        tapis.append("line")
            .attr("x1", x).attr("y1", y-r).attr("x2", x).attr("y2", y+r).attr("stroke", "black"); // Ligne verticale
        tapis.append("line")
            .attr("x1", x-r).attr("y1", y).attr("x2", x+r).attr("y2", y).attr("stroke", "black"); // Ligne horizontale
        }

        function creerCercleTapis2(x,y,r){
        let d = r / Math.sqrt(2); // Pour avoir les lignes diagonales il faut cette valeur
        tapis.append("circle")
            .attr("cx", x).attr("cy", y).attr("r", r).attr("fill", "white").attr("stroke", "black");
        tapis.append("line")
            .attr("x1", x-d).attr("y1", y-d).attr("x2", x+d).attr("y2", y+d).attr("stroke", "black");
        tapis.append("line")
            .attr("x1", x-d).attr("y1", y+d).attr("x2", x+d).attr("y2", y-d).attr("stroke", "black");
        }

        // Affiche un tapis complet selon le mode
        function dessinerTapis(mode) {
            tapis.selectAll("*").remove(); // Si un tapis est deja affiché le retire (supprime tout ce qu'il y a dans le groupe tapis)

            for (let i = 0; i < nbCercles; i++) {
                let x = 20 + i * rayon * 2;
                let y = 780;

                if (mode == true) 
                    creerCercleTapis1(x, y, rayon);
                else 
                    creerCercleTapis2(x, y, rayon);
            }
        }

        // Tapis de base avant de lanceer l'animation
        dessinerTapis(mode); // mode = false de base donc c'est un Tapis2

        // Fonction qui démarre l'animation
        function startAnimation() {
            if (anim == true) 
                return; // Si animation deja en cours on relance pas
            anim = true;

            animInterval = setInterval(() => {
                mode = !mode;
                dessinerTapis(mode);
            }, 100);
        }

        // Fonction qui stop l'animation
        function stopAnimation() {
            anim = false;
            clearInterval(animInterval);
        }

        // Fonction pour dessiner un livre
        function dessinerLivre(x, y, couleur="steelblue", largeur = 60, hauteur = 130) {
            const livre = livres.append("g")
                .attr("class", "livre")
                .attr("transform", "translate(" + x + "," + y + ")");

            // Rectangle du livre
            livre.append("rect")
                .attr("width", largeur)
                .attr("height", hauteur)
                .attr("fill", couleur)
                .attr("stroke", "black")
                .attr("rx", 4);

            // Rendre le livre clickable
            livre.on("click", function(event){
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
                d3.select("#infoLivre").text(infoLivre.titre)

                console.log("Livre sélectionné");
            })

            return livre;
        }

        // Fonction pour animer un livre sur le tapis roulant
        function animerLivre(livre, xCible=800, yCible=630, duree=10000) {
            livre.transition()
                .duration(duree)
                .ease(d3.easeLinear) // Vitesse constante du début à la fin
                .attr("transform", "translate(" + xCible + "," + yCible + ")")
                .on("end", () => livre.remove()); // Supprmier le livre quand l'animation est finie
        }

        function spawnLivre(livreObj){
            let livreCrée = dessinerLivre(10,630);
            livreCrée.datum(livreObj);
            animerLivre(livreCrée);
        }

        svg.append("line")
            .attr("x1", 0).attr("y1", 600).attr("x2", 800).attr("y2", 600).attr("stroke", "black");

        dessinerBiblio(50,50);
        dessinerBiblio(450,50);
        let testDansBiblio = dessinerLivre(50, 470);
        let testDansBiblio2 = dessinerLivre(110, 470);
        let testDansBiblio3 = dessinerLivre(170, 470);
        let testDansBiblio4 = dessinerLivre(230, 470);
        let testDansBiblio5 = dessinerLivre(290, 470);
        startAnimation()
         // stopAnimation()

        let test = spawnLivre(choisirLivre(0))

        // Fonction qui spawn le prochain livre toutes les 10 secondes
        setInterval(function() {
            // On prend le livre courant du tableau
            const livreObj = choisirLivre(indexLivreActuel)

            // Spawn le livre sur le tapis roulant
            spawnLivre(livreObj);

            // Passe au livre suivant (boucle si on arrive à la fin)
            indexLivreActuel += 1;

        }, 10000); // 10000 ms = 10 secondes
