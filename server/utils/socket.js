import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected via socket:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    });

    socket.on("joinHospital", (hospitalId) => {
      socket.join(hospitalId);
      console.log(`Hospital ${hospitalId} joined room`);
    });

    socket.on("joinAdmin", () => {
      socket.join("adminRoom");
      console.log("Admin joined adminRoom");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitEvent = (roomId, eventName, data) => {
  if (io) {
    io.to(roomId).emit(eventName, data);
  } else {
    console.warn("Attempted to emit socket event, but io is not initialized");
  }
};
