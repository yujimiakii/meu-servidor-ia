const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');

// Permite servir o HTML e arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Entrega o index.html na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// 1. Importação das rotas
const chatRoutes = require('./routes/chatRoutes');
const documentRoutes = require('./routes/documentRoutes'); // Rota RAG da Sprint 6
const Jogador = require('./models/Jogador');

const app = express();

// 2. Middlewares essenciais
app.use(cors());
app.use(express.json());

// Conexão com o Banco de Dados protegida contra crash
if (!process.env.MONGO_URI) {
    console.error("❌ AVISO CRÍTICO: Variável MONGO_URI não foi configurada!");
} else {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("🧪 Conectado ao MongoDB do Laboratório"))
        .catch(err => console.error("❌ Erro ao conectar ao banco:", err.message));
}

// 4. Rota para gerar Token JWT (necessário para liberar a leitura de documentos)
app.post('/api/auth/token', (req, res) => {
    const { nickname } = req.body;
    if (!nickname) {
        return res.status(400).json({ erro: "Nickname é obrigatório para gerar credencial." });
    }

    const secret = process.env.JWT_SECRET || "chave_secreta_padrao_laboratorio";
    const token = jwt.sign({ nickname }, secret, { expiresIn: '8h' });

    return res.json({ token });
});

// Servir arquivos estáticos da pasta raiz (como index.html, imagens, etc.)
app.use(express.static(path.join(__dirname)));

// Rota raiz para abrir a interface web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. Registro das Rotas da Aplicação
app.use('/api/chat', chatRoutes);                    // Conversa normal + ferramentas
app.use('/api/chat/documento', documentRoutes);      // Sprint 6: RAG com PDF/TXT e proteção JWT

// 6. Rota do Ranking (Sprint 2)
app.get('/api/ranking', async (req, res) => {
    try {
        const top = await Jogador.find().sort({ xp: -1 }).limit(10);
        res.json(top);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar ranking" });
    }
});

// 7. Rota de Saúde do Servidor (Health Check)
app.get('/api/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';
    res.status(200).json({
        status: "ok",
        bancoDeDados: dbStatus,
        timestamp: new Date().toISOString(),
        servidor: "online"
    });
});



// 8. Inicialização do Servidor
// Substitua o app.listen pelo formato compatível abaixo:
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Reator rodando na porta ${PORT}`));
}

module.exports = app;