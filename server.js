const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

let estadoJuego = {
    tablero: Array(9).fill(null),
    turno: 'X',
    hostId: null
};

io.on('connection', (socket) => {
    // Al conectar, preguntamos: ¿Eres el host?
    socket.on('registrar-host', () => {
        estadoJuego.hostId = socket.id;
        console.log("Host registrado");
    });

    socket.on('registrar-jugador', (rol) => {
        socket.join('jugadores');
        socket.emit('confirmar-rol', rol);
    });

    socket.on('intento-movimiento', (index) => {
        // Lógica de validación
        if (estadoJuego.tablero[index] === null) {
            estadoJuego.tablero[index] = estadoJuego.turno;
            estadoJuego.turno = (estadoJuego.turno === 'X') ? 'O' : 'X';
            
            // Enviamos el nuevo estado a TODO EL MUNDO
            io.emit('actualizar-estado', estadoJuego);
        }
    });
});

// Usar el puerto que asigne Render o el 3000 por defecto
const PORT = process.env.PORT || 3000;

http.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});