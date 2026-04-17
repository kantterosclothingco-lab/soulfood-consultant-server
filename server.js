const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Soulfood consultant notification server is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// store active consultation requests
let pendingRequests = [];

io.on("connection", (socket) => {
  console.log("Consultant or client connected:", socket.id);

  // send existing pending requests to consultant
  socket.on("register-consultant", () => {
    socket.emit("pending-requests", pendingRequests);
  });

  // customer sends consultation request
  socket.on("new-request", (data) => {
    const request = {
      id: Date.now().toString(),
      ...data,
      status: "pending",
    };

    pendingRequests.push(request);

    // notify consultant
    io.emit("incoming-request", request);
  });

  // consultant accepts request
  socket.on("accept-request", ({ requestId }) => {
    const request = pendingRequests.find((r) => r.id === requestId);
    if (!request) return;

    request.status = "accepted";

    const roomId = `room-${requestId}`;

    io.emit("request-accepted", {
      requestId,
      roomId,
      ...request,
    });
  });

  // consultant rejects request
  socket.on("reject-request", ({ requestId }) => {
    pendingRequests = pendingRequests.filter(
      (r) => r.id !== requestId
    );

    io.emit("request-rejected", { requestId });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Consultant server running on port ${PORT}`);
});
