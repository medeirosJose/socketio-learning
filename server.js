const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let ultimaImagem = "";
let usuarios = {};

// Rota cachorro
app.get("/buscarCachorro", async (req, res) => {
  try {
    const response = await axios.get("https://dog.ceo/api/breeds/image/random");
    ultimaImagem = response.data.message;
    io.emit("novaImagem", ultimaImagem); // troca a imagem para todos os clientes
    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao buscar imagem de cachorro:", error);
    res.sendStatus(500);
  }
});

// Rota gato
app.get("/buscarGato", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.thecatapi.com/v1/images/search"
    );
    ultimaImagem = response.data[0].url;
    io.emit("novaImagem", ultimaImagem);
    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao buscar imagem de gato:", error);
    res.sendStatus(500);
  }
});

// Rota para o chat
app.get("/chat", (req, res) => {
  res.sendFile(__dirname + "/chat.html");
});

// Rota para o canvas
app.get("/canvas", (req, res) => {
  res.sendFile(__dirname + "/canvas.html");
});

// rota para o extras
app.get("/extras", (req, res) => {
  res.sendFile(__dirname + "/extras.html");
});

// conexão de um novo usuário
io.on("connection", (socket) => {
  const userId = socket.id;
  usuarios[userId] = true;
  atualizarUsuariosConectados();

  // fica aguardando receber uma mensagem do cliente (chat.html)
  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", { userId, message });
  });

  socket.on("disconnect", () => {
    delete usuarios[userId];
    atualizarUsuariosConectados();
  });

  socket.on("draw", function (data) {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clearCanvas", function () {
    io.emit("clearCanvas");
  });
});

// atualiza a lista de usuários conectados para todos os clientes
function atualizarUsuariosConectados() {
  const numeroUsuarios = Object.keys(usuarios).length;
  io.emit("usuariosConectados", Object.keys(usuarios));
  io.emit("atualizarContador", numeroUsuarios);
  console.log("Usuários conectados:", numeroUsuarios);
}

// rota para o index (página inicial)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// inicia o servidor na porta 3000
server.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
