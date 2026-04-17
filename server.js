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
    methods: ["GET", "POST"],
  },
});

let consultants = [];

io.on("connection", (socket) => {
  console.log("Consultant connected:", socket.id);

  socket.on("register-consultant", () => {
    if (!consultants.includes(socket.id)) {
      consultants.push(socket.id);
    }
    console.log("Consultant registered:", socket.id);
  });

  socket.on("disconnect", () => {
    consultants = consultants.filter((id) => id !== socket.id);
    console.log("Consultant disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Soulfood consultant notification server is running");
});

app.post("/notify-consultants", (req, res) => {
  const { request } = req.body;

  if (!request) {
    return res.status(400).json({ error: "Missing request" });
  }

  consultants.forEach((id) => {
    io.to(id).emit("incoming-call", request);
  });

  res.json({
    success: true,
    consultantsOnline: consultants.length,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Consultant server running on port ${PORT}`);
});
