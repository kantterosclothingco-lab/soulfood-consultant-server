const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let consultants = [];

io.on("connection", (socket) => {
  console.log("Consultant connected:", socket.id);

  socket.on("register-consultant", () => {
    consultants.push(socket.id);
    console.log("Consultant registered:", socket.id);
  });

  socket.on("disconnect", () => {
    consultants = consultants.filter((id) => id !== socket.id);
    console.log("Consultant disconnected:", socket.id);
  });
});

app.post("/notify-consultants", (req, res) => {
  const { request } = req.body;

  console.log("Incoming consultation request:", request.id);

  consultants.forEach((id) => {
    io.to(id).emit("incoming-call", request);
  });

  res.json({ success: true });
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Consultant app server running on http://localhost:${PORT}`);
});
