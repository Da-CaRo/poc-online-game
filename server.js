const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

// Estado inicial del juego
let estadoJuego = {
    tablero: Array(9).fill(null),
    turnoActual: 'X',
    ganador: null,
    jugadores: { X: null, O: null }
};

// Combinaciones para ganar
const COMBINACIONES_GANADORAS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontales
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticales
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

function verificarGanador(tablero) {
    for (let combo of COMBINACIONES_GANADORAS) {
        const [a, b, c] = combo;
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
            return tablero[a];
        }
    }
    return tablero.includes(null) ? null : 'Empate';
}

io.on('connection', (socket) => {
    console.log('Nueva conexión:', socket.id);

    socket.on('registrar-host', () => {
        console.log('Host detectado');
        socket.emit('actualizar-estado', estadoJuego);
    });

    socket.on('registrar-jugador', () => {
        if (!estadoJuego.jugadores.X) {
            estadoJuego.jugadores.X = socket.id;
            socket.emit('asignar-ficha', 'X');
        } else if (!estadoJuego.jugadores.O) {
            estadoJuego.jugadores.O = socket.id;
            socket.emit('asignar-ficha', 'O');
        } else {
            socket.emit('error-mensaje', 'Partida llena');
        }
        io.emit('actualizar-estado', estadoJuego);
    });

    socket.on('intento-movimiento', (index) => {
        const ficha = socket.id === estadoJuego.jugadores.X ? 'X' : (socket.id === estadoJuego.jugadores.O ? 'O' : null);

        if (ficha && ficha === estadoJuego.turnoActual && !estadoJuego.ganador && estadoJuego.tablero[index] === null) {
            estadoJuego.tablero[index] = ficha;
            
            const resultado = verificarGanador(estadoJuego.tablero);
            if (resultado) {
                estadoJuego.ganador = resultado;
            } else {
                estadoJuego.turnoActual = (ficha === 'X') ? 'O' : 'X';
            }
            
            io.emit('actualizar-estado', estadoJuego);
        }
    });

    socket.on('reiniciar', () => {
        estadoJuego.tablero = Array(9).fill(null);
        estadoJuego.turnoActual = 'X';
        estadoJuego.ganador = null;
        io.emit('actualizar-estado', estadoJuego);
    });

    socket.on('disconnect', () => {
        if (socket.id === estadoJuego.jugadores.X) estadoJuego.jugadores.X = null;
        if (socket.id === estadoJuego.jugadores.O) estadoJuego.jugadores.O = null;
        io.emit('actualizar-estado', estadoJuego);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));