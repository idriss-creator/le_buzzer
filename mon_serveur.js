const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let buzzedTeam = null; // Stocke l'équipe qui a buzzé en premier

// Servir le fichier HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mon_buzzer.html'));
});

io.on("connection", (socket) => {
    console.log("Nouvelle connexion :", socket.id);

    // Réinitialiser le buzzer lorsque la connexion est établie
    socket.emit("reset");

    socket.on("buzz", () => {
        if (!buzzedTeam) {
            buzzedTeam = socket.id; // Associe l'équipe qui a buzzé à l'ID du socket
            io.emit("lock"); // Verrouiller le buzzer pour tous les clients
            io.emit("winner", `Le gagnant est l'équipe ${buzzedTeam}`);
            console.log(`${buzzedTeam} a buzzé !`);

            // Réinitialiser le buzzer après 20 secondes
            setTimeout(() => {
                buzzedTeam = null;
                io.emit("reset"); // Réactiver le buzzer
                console.log("Buzzer réinitialisé après 20 secondes");
            }, 20000); // 20 secondes
        }
    });

    socket.on("reset", () => {
        buzzedTeam = null; // Réinitialiser l'équipe qui a buzzé
        io.emit("reset"); // Réactiver le buzzer
        console.log("Buzzer réinitialisé manuellement");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
socket.on('join', (teamName) => {
    socket.teamName = teamName; // Associer l'équipe à l'ID du socket
});

socket.on('buzz', () => {
    if (!buzzedTeam) {
        buzzedTeam = socket.teamName; // Utiliser le nom de l'équipe plutôt que l'ID
        io.emit('lock');
        io.emit('winner', `Le gagnant est l'équipe ${buzzedTeam}`);
        console.log(`${buzzedTeam} a buzzé !`);
        // Le reste du code pour réinitialiser après 20 secondes
    }
});
socket.on("disconnect", () => {
    if (socket.id === buzzedTeam) {
        buzzedTeam = null; // Réinitialiser si le gagnant déconnecte
        io.emit("reset");
    }
    console.log(`${socket.id} s'est déconnecté`);
});
