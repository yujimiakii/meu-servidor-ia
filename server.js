// 1. Bibliotecas
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// 2. CRIAÇÃO DO APP (precisa vir ANTES de qualquer app.use!)
const app = express();

// 3. Middlewares e arquivos estáticos
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve o index.html e arquivos da pasta

// 4. Rota raiz para abrir a interface web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. Conexão com o Banco de Dados (segura contra crash)
if (!process.env.MONGO_URI) {
    console.error("❌ AVISO: Variável MONGO_URI não foi configurada no .env!");
} else {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("🧪 Conectado ao MongoDB do Laboratório"))
        .catch(err => console.error("❌ Erro ao conectar ao banco:", err.message));
}

// 6. Rota para gerar Token JWT
app.post('/api/auth/token', (req, res) => {
    const { nickname } = req.body;
    if (!nickname) {
        return res.status(400).json({ erro: "Nickname é obrigatório para gerar credencial." });
    }

    const secret = process.env.JWT_SECRET || "chave_secreta_padrao_laboratorio";
    const token = jwt.sign({ nickname }, secret, { expiresIn: '8h' });

    return res.json({ token });
});

// 7. Registro das Rotas da Aplicação
const chatRoutes = require('./routes/chatRoutes');
const documentRoutes = require('./routes/documentRoutes');
const Jogador = require('./models/Jogador');

app.use('/api/chat', chatRoutes);
app.use('/api/chat/documento', documentRoutes); // Sprint 6 RAG

// 8. Rota do Ranking
app.get('/api/ranking', async (req, res) => {
    try {
        const top = await Jogador.find().sort({ xp: -1 }).limit(10);
        res.json(top);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar ranking" });
    }
});

// 9. Rota de Saúde (Health Check)
app.get('/api/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';
    res.status(200).json({
        status: "ok",
        bancoDeDados: dbStatus,
        timestamp: new Date().toISOString(),
        servidor: "online"
    });
});

// 10. Inicialização do Servidor (compatível com local e Vercel)
const PORT = process.env.PORT || 3000;

// Não deixa rodar app.listen dentro da Vercel (ela gerencia as portas sozinha)
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Reator rodando na porta ${PORT}`));
}

module.exports = app;