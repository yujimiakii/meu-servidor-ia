const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const Jogador = require('./models/Jogador');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🧪 Conectado ao MongoDB do Laboratório"))
    .catch(err => console.error("Erro ao conectar ao banco:", err));

// Rotas
app.use('/api/chat', chatRoutes);

// Rota de Ranking (Sprint 2)
app.get('/api/ranking', async (req, res) => {
    try {
        const top = await Jogador.find().sort({ xp: -1 }).limit(10);
        res.json(top);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar ranking" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Reator rodando na porta ${PORT}`));