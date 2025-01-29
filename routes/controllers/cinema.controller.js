const { logDebug, logError } = require("../../helpers/logger-api");

const ROOM_LAYOUTS = {
  room1: {
    name: "Main Hall",
    rows: 8,
    seatsPerRow: 12,
    totalSeats: 96,
  },
  room2: {
    name: "VIP Room",
    rows: 5,
    seatsPerRow: 8,
    totalSeats: 40,
  },
  room3: {
    name: "Family Room",
    rows: 6,
    seatsPerRow: 10,
    totalSeats: 60,
  },
};

class CinemaContext {
  constructor(wss) {
    this.wss = wss;
    this.sessions = new Map();
    this.reservations = new Map();
    this.rooms = ROOM_LAYOUTS;

    this.initializePredefinedSessions();
  }

  initializePredefinedSessions() {
    const movies = [
      { title: "The Last Horizon", price: 14.99 },
      { title: "Eclipse of the Stars", price: 21.99 },
      { title: "Neon Shadows", price: 13.99 },
      { title: "Cypress Shadows", price: 22.99 },
      { title: "Chronicles of the Void", price: 19.99 },
      { title: "Rogue Galaxy", price: 18.99 },
      { title: "Crimson Dawn", price: 16.99 },
      { title: "The Infinite Abyss", price: 20.99 },
      { title: "The Lost Frontier", price: 17.99 },
      { title: "The CD Protocol", price: 22.99 },
      { title: "The Dark Node Modules Abyss", price: 18.99 },
      { title: "The Dark Node Modules Chronicles", price: 21.99 },
      { title: "Frostbite", price: 15.99 },
      { title: "Quantum Rift", price: 17.99 },
      { title: "Spectral Forces", price: 19.99 },
      { title: "The Dark Matter", price: 22.99 },
      { title: "The Lost Colony", price: 18.99 },
      { title: "The Omega Paradox", price: 21.99 },
      { title: "The Playwright Protocol", price: 16.99 },
      { title: "The Time Paradox", price: 19.99 },
      { title: "The Void Protocol", price: 17.99 },
      { title: "Zero Hour", price: 15.99 },
      { title: "The Dark Frontier", price: 20.99 },
      { title: "The Dark Horizon", price: 18.99 },
      { title: "Playwright Rockers", price: 31.99 },
      { title: "Play it Right", price: 22.99 },
      { title: "Masters of the Playwright", price: 34.99 },
      { title: "The Playwright Rises", price: 27.99 },
    ];

    const sessions = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayInMs = 24 * 60 * 60 * 1000;

    const daysToGenerate = 30;

    const showTimes = [
      { time: 10, minute: 30 }, // 10:30 AM - Morning show
      { time: 13, minute: 15 }, // 1:15 PM - Matinee
      { time: 16, minute: 0 }, // 4:00 PM - Afternoon
      { time: 18, minute: 45 }, // 6:45 PM - Evening
      { time: 21, minute: 30 }, // 9:30 PM - Night show
      { time: 23, minute: 0 }, // 11:00 PM - Late show
    ];

    for (let day = 0; day < daysToGenerate; day++) {
      const currentDate = new Date(now);
      currentDate.setDate(now.getDate() + day);
      const baseTime = currentDate.getTime();

      showTimes.forEach((showTime, timeIndex) => {
        const sessionTime = new Date(baseTime);
        sessionTime.setHours(showTime.time, showTime.minute);

        if (sessionTime < new Date()) return;

        const movieIndex = (day * showTimes.length + timeIndex) % movies.length;
        const roomId = `room${(timeIndex % 3) + 1}`;

        const isWeekend = [5, 6, 0].includes(sessionTime.getDay());
        const basePrice = movies[movieIndex].price;
        const adjustedPrice = isWeekend ? basePrice * 1.2 : basePrice;

        sessions.push({
          id: `${sessionTime.getTime()}-${roomId}-${movieIndex}`,
          movieTitle: movies[movieIndex].title,
          datetime: sessionTime.toISOString(),
          roomId: roomId,
          room: this.rooms[roomId].name,
          price: Number(adjustedPrice.toFixed(2)),
          seatingPlan: this.generateSeatingPlan(roomId),
        });
      });
    }

    sessions.forEach((session) => {
      const sessionTime = new Date(session.datetime);
      const daysFromNow = Math.floor((sessionTime - now) / dayInMs);
      const hour = sessionTime.getHours();
      const isWeekend = [5, 6, 0].includes(sessionTime.getDay());

      let baseOccupancy = Math.max(1, Math.floor(20 - daysFromNow / 2));
      if (isWeekend) baseOccupancy += 5;
      if (hour >= 18 && hour <= 22) baseOccupancy += 3;

      const randomOccupiedSeats = Math.floor(Math.random() * baseOccupancy) + 2;

      for (let i = 0; i < randomOccupiedSeats; i++) {
        const randomRow = Math.floor(Math.random() * session.seatingPlan.length);
        const randomSeat = Math.floor(Math.random() * session.seatingPlan[0].length);
        if (session.seatingPlan[randomRow][randomSeat].status === "available") {
          session.seatingPlan[randomRow][randomSeat].status = "occupied";
        }
      }
      this.sessions.set(session.id, session);
    });
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  generateSeatingPlan(roomId) {
    const room = this.rooms[roomId];
    const seatingPlan = [];

    for (let row = 0; row < room.rows; row++) {
      const rowSeats = [];
      for (let seat = 0; seat < room.seatsPerRow; seat++) {
        rowSeats.push({
          id: `${row + 1}-${seat + 1}`,
          row: row + 1,
          number: seat + 1,
          status: "available",
        });
      }
      seatingPlan.push(rowSeats);
    }

    return seatingPlan;
  }
}

const cinemaHandlers = {
  cinemaGetRooms: (context, ws, data) => {
    ws.send(
      JSON.stringify({
        type: "cinemaRoomsUpdate",
        rooms: context.rooms,
      })
    );
  },

  cinemaGetSessions: (context, ws, data) => {
    const sessions = Array.from(context.sessions.values());
    ws.send(JSON.stringify({ type: "cinemaSessionsUpdate", sessions }));
  },

  cinemaAddSession: (context, ws, data) => {
    const { movieTitle, datetime, roomId, price } = data;
    const sessionId = Date.now().toString();
    const room = context.rooms[roomId];

    if (!room) {
      ws.send(JSON.stringify({ type: "cinemaError", message: "Invalid room selected" }));
      return;
    }

    const session = {
      id: sessionId,
      movieTitle,
      datetime,
      roomId,
      room: room.name,
      price,
      seatingPlan: context.generateSeatingPlan(roomId),
    };

    context.sessions.set(sessionId, session);
    context.broadcast({
      type: "cinemaSessionsUpdate",
      sessions: Array.from(context.sessions.values()),
    });
  },

  cinemaReserveTicket: (context, ws, data) => {
    const { sessionId, selectedSeats, userId } = data;
    const session = context.sessions.get(sessionId);

    if (!session) {
      ws.send(JSON.stringify({ type: "cinemaError", message: "Session not found" }));
      return;
    }

    selectedSeats.forEach(({ row, number }) => {
      session.seatingPlan[row - 1][number - 1].status = "occupied";
    });

    const reservation = {
      id: Date.now().toString(),
      sessionId,
      selectedSeats,
      userId,
      timestamp: new Date().toISOString(),
    };

    context.reservations.set(reservation.id, reservation);
    context.sessions.set(sessionId, session);

    ws.send(JSON.stringify({ type: "cinemaReservationConfirmed", reservation }));
    context.broadcast({
      type: "cinemaSessionsUpdate",
      sessions: Array.from(context.sessions.values()),
    });
  },

  cinemaGetReservations: (context, ws, data) => {
    const reservations = Array.from(context.reservations.values()).map((reservation) => {
      const session = context.sessions.get(reservation.sessionId);
      return {
        ...reservation,
        movieTitle: session?.movieTitle,
        room: session?.room,
        datetime: session?.datetime,
        price: session?.price,
        totalPrice: (session?.price || 0) * reservation.selectedSeats.length,
      };
    });
    ws.send(JSON.stringify({ type: "cinemaReservationsUpdate", reservations }));
  },
};

module.exports = { CinemaContext, cinemaHandlers, ROOM_LAYOUTS };
