const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let buzzedTeam = null; // Stocke l'équipe qui a buzzé
let canBuzz = true; // Contrôle si les équipes peuvent buzzer

// Servir le fichier HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "mon_buzzer.html"));
});

// Gérer les connexions des clients
io.on("connection", (socket) => {
    console.log(`Nouvelle connexion : ${socket.id}`);

    socket.on("join", (teamName) => {
        socket.teamName = teamName || `Équipe ${socket.id.substring(0, 5)}`;
        console.log(`${socket.teamName} s'est connecté.`);
    });

    socket.on("buzz", () => {
        if (canBuzz && !buzzedTeam) {
            buzzedTeam = socket.teamName || `Équipe ${socket.id.substring(0, 5)}`;
            canBuzz = false; // Désactiver le buzzer

            io.emit("lock"); // Bloquer les buzzers
            io.emit("winner", `Le gagnant est ${buzzedTeam} !`);
            console.log(`${buzzedTeam} a buzzé !`);

            // Réactivation du buzzer après 20 secondes
            setTimeout(() => {
                buzzedTeam = null;
                canBuzz = true;
                io.emit("reset"); // Débloquer le buzzer
                console.log("Buzzer réinitialisé après 20 secondes.");
            }, 3000);
        }
    });

    

    socket.on("disconnect", () => {
        console.log(`${socket.teamName || "Un joueur"} (${socket.id}) s'est déconnecté.`);
    });
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
