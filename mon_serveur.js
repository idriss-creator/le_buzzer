const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let buzzedTeam = null;
let canBuzz = true;
let teams = {};

// Servez les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, "public")));

// Route principale pour servir l'index
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
    
    console.log(`Nouvelle connexion : ${socket.id}`);

    // Lorsqu'une équipe rejoint
    socket.on("join", (teamName) => {
        // Si aucun nom d'équipe n'est fourni, génère un nom par défaut basé sur l'ID
        teams[socket.id] = teamName || `Équipe ${socket.id.substring(0, 5)}`;
        console.log(`${teams[socket.id]} s'est connecté.`);
    });

    // Lorsqu'une équipe appuie sur le buzzer
    socket.on("buzz", () => {
        if (canBuzz && !buzzedTeam) {
            // Enregistre l'équipe qui a buzzé en premier
            buzzedTeam = teams[socket.id] || `Équipe ${socket.id.substring(0, 5)}`;
            canBuzz = false;

            // Verrouille les autres buzzers
            io.emit("lock"); 
            // Annonce le gagnant
            io.emit("winner", `Le premier à buzzer est ${buzzedTeam} !`);
            console.log(`${buzzedTeam} a buzzé !`);

            // Compte à rebours de 5 secondes avant de réinitialiser
            let countdown = 10;
            let countdownInterval = setInterval(() => {
                io.emit("countdown", countdown);  
                countdown--;

                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    buzzedTeam = null;  // Réinitialise l'équipe qui a buzzé
                    canBuzz = true;  // Permet aux autres de buzzer à nouveau
                    io.emit("reset");  // Réinitialise l'état du buzzer pour tout le monde
                    console.log("Buzzer réinitialisé.");
                }
            }, 1000);
        }
    });

    // Lorsqu'un utilisateur se déconnecte
    socket.on("disconnect", () => {
        const teamName = teams[socket.id];  // Récupère le nom de l'équipe si elle existe
        if (teamName) {
            console.log(`${teamName} (${socket.id}) s'est déconnecté.`);
            delete teams[socket.id];  // Supprime l'équipe uniquement si elle existe
        } else {
            console.log(`Un joueur (${socket.id}) s'est déconnecté, mais n'avait pas de nom d'équipe.`);
        }
    });
});

// Démarre le serveur sur le port défini ou 3000 par défaut
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
