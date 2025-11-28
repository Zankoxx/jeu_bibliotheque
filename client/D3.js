const svg = d3.select("#affichageJeu")
        .append("svg")
            .attr("viewBox", "0 0 800 800")  // <-- système interne
            .style("width", "45%")          // <-- s'adapte à la largeur
            .style("height", "98vh")         // Toute la hauteur
            .style("border", "1px solid black"); // Pour voir les bordures du svg
        
        const tapis = svg.append("g").attr("id","tapis"); // Crée le groupe tapis dans le svg
        const livres = svg.append("g").attr("id","livres"); // Crée le groupe livres dans le svg

        
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

        let rayon = 20;
        let nbCercles = 20;
        let anim = false; // Si l'animation est en cours ou pas
        let mode = false; // false = Tapis2, true = Tapis1
        let animInterval = null;

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


        svg.append("line")
            .attr("x1", 0).attr("y1", 600).attr("x2", 800).attr("y2", 600).attr("stroke", "black");

        function creerLivre(x, y, largeur, hauteur, titre, couleur="steelblue") {
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

            // Titre centré
            livre.append("text")
                .attr("x", largeur / 2)
                .attr("y", hauteur / 2 + 4)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("fill", "white")
                .text(titre);

            return livre;
        }

        function animerLivre(livre, xCible=800, yCible=720, duree=10000) {
            livre.transition()
                .duration(duree)
                .ease(d3.easeLinear) // Vitesse constante du début à la fin
                .attr("transform", "translate(" + xCible + "," + yCible + ")")
                .on("end", () => livre.remove()); // Supprmier le livre quand l'animation est finie
        }

        let test = creerLivre(10, 720, 60, 40, "Dune", "#4A90E2");
        animerLivre(test);
        startAnimation()
        stopAnimation()
