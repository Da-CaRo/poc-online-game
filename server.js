const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

let estadoJuego = {
    tablero: Array(9).fill(null),
    turnoActual: 'X', // Empieza la X
    jugadores: {
        X: null, // Guardaremos el socket.id del jugador X
        O: null  // Guardaremos el socket.id del jugador O
    }
};

io.on('connection', (socket) => {
    
    socket.on('registrar-jugador', () => {
        // Asignar rol automáticamente por orden de llegada
        if (!estadoJuego.jugadores.X) {
            estadoJuego.jugadores.X = socket.id;
            socket.emit('asignar-ficha', 'X');
        } else if (!estadoJuego.jugadores.O) {
            estadoJuego.jugadores.O = socket.id;
            socket.emit('asignar-ficha', 'O');
        } else {
            socket.emit('error-mensaje', 'Partida llena');
        }
        // Enviar estado inicial
        io.emit('actualizar-estado', estadoJuego);
    });

    socket.on('intento-movimiento', (index) => {
        const id = socket.id;
        const fichaJugador = (id === estadoJuego.jugadores.X) ? 'X' : 
                             (id === estadoJuego.jugadores.O) ? 'O' : null;

        // VALIDACIÓN: 
        // 1. ¿Es un jugador registrado?
        // 2. ¿Es su turno?
        // 3. ¿La casilla está vacía?
        if (fichaJugador && 
            fichaJugador === estadoJuego.turnoActual && 
            estadoJuego.tablero[index] === null) {
            
            estadoJuego.tablero[index] = fichaJugador;
            // Cambiar turno
            estadoJuego.turnoActual = (fichaJugador === 'X') ? 'O' : 'X';
            
            io.emit('actualizar-estado', estadoJuego);
        }
    });

    socket.on('disconnect', () => {
        if (socket.id === estadoJuego.jugadores.X) estadoJuego.jugadores.X = null;
        if (socket.id === estadoJuego.jugadores.O) estadoJuego.jugadores.O = null;
    });
});