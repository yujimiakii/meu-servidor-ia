require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão MongoDB (Substitua pela sua URL no .env)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Conectado"))
    .catch(err => console.error("❌ Erro MongoDB:", err));

// Rotas
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));