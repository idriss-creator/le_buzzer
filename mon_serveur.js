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

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
    
    console.log(`Nouvelle connexion : ${socket.id}`);

    socket.on("join", (teamName) => {
        
        teams[socket.id] = teamName || `Équipe ${socket.id.substring(0, 5)}`;

        console.log(`${teams[socket.id]} s'est connecté.`);
    });

    socket.on("buzz", () => {
        if (canBuzz && !buzzedTeam) {
            buzzedTeam = teams[socket.id] || `Équipe ${socket.id.substring(0, 5)}`;
            canBuzz = false;

            io.emit("lock"); 
            io.emit("winner", `Le premier à buzzer est ${buzzedTeam} !`);
            console.log(`${buzzedTeam} a buzzé !`);

            let countdown = 5;
            let countdownInterval = setInterval(() => {
                io.emit("countdown", countdown);  
                countdown--;

                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    buzzedTeam = null;
                    canBuzz = true;
                    io.emit("reset");  
                    console.log("Buzzer réinitialisé.");
                }
            }, 1000);
        }
    });

    socket.on("disconnect", () => {
        console.log(`${teams[socket.id] || "Un joueur"} (${socket.id}) s'est déconnecté.`);
        delete teams[socket.id]; 
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
