// 1. Importações (Bibliotecas)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Configurações Iniciais do Servidor
const app = express();
app.use(express.json()); // Essencial: Permite que o servidor entenda o corpo da requisição em JSON
app.use(cors()); // Essencial: Permite que sites externos (Front-end) consultem sua API

// 3. Configuração da IA (Google Gemini)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERRO: GEMINI_API_KEY não encontrada no arquivo .env");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// --- ROTA DE STATUS (Desafio Extra) ---
app.get('/api/status', (req, res) => {
    return res.status(200).json({ 
        status: "Servidor da IA Operacional",
        mensagem: "O cérebro está online!",
        timestamp: new Date().toISOString()
    });
});

// 4. CRIANDO A ROTA (Endpoint) DA API: POST /api/chat
app.post('/api/chat', async (req, res) => {
    try {
        // Pega a pergunta que veio do corpo da requisição (JSON)
        const { pergunta } = req.body;

        // Validação: Se não enviarem a pergunta, retorna erro 400
        if (!pergunta) {
            return res.status(400).json({ 
                sucesso: false,
                erro: "Você precisa enviar uma 'pergunta' no formato JSON dentro do Body." 
            });
        }

        console.log(`📩 Nova pergunta recebida: "${pergunta}"`);

        // Chama o modelo Gemini 1.5 Flash (mais rápido para APIs)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Instrução de sistema para definir a personalidade (Robô Sarcástico)
        const promptFinal = `Instrução de Sistema: Você é um robô sarcástico, inteligente e levemente impaciente. 
        Responda a seguinte pergunta do usuário: ${pergunta}`;
        
        // Gera o conteúdo
        const result = await model.generateContent(promptFinal);
        const respostaDaIA = result.response.text();

        // DEVOLVE a resposta para o cliente (Insomnia/Postman/Browser)
        return res.status(200).json({ 
            sucesso: true,
            pergunta: pergunta,
            resposta: respostaDaIA 
        });

    } catch (erro) {
        console.error("❌ Erro crítico no servidor:", erro);
        return res.status(500).json({ 
            sucesso: false,
            erro: "Erro interno no servidor de IA. Verifique os logs." 
        });
    }
});

// 5. Ligar o Servidor na porta correta (Nuvem ou Local)
// A nuvem define a porta via process.env.PORT. Se não houver, usa a 3000 (local)
const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log("=========================================");
    console.log(`🚀 SERVIDOR IA ONLINE: Rodando na porta ${PORTA}`);
    console.log(`✅ Rota Status: GET http://localhost:${PORTA}/api/status (Apenas se local)`);
    console.log(`📩 Rota Chat: POST /api/chat`);
    console.log("=========================================");
});