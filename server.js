const express = require("express");
const app = express();
const PORT = 3000;
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userleave,
  getroomusers,
} = require("./utils/users");
const botname = "ChatCord Bot";
//set static folder
app.use(express.static(path.join(__dirname, "public")));
//Run when client connects
io.on("connection", (socket) => {
  console.log("New WS connection.... ");
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    //Welcome current user
    socket.emit("message", formatMessage(botname, "Welcome to ChatCord"));
    //Broadcast when user connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botname, `${user.username} has joined the chat`)
      );
    //Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getroomusers(user.room),
    });

    //Runs when client disconnect
    socket.on("disconnect", () => {
      const user = userleave(socket.id);
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botname, ` ${user.username} has left chat`)
        );
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getroomusers(user.room),
        });
      }
    });
    //Listen for chat msg
    socket.on("chat-msg", (msg) => {
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
  });
});

app.get("/", (req, res) => {
  return res.sendFile("./public");
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
