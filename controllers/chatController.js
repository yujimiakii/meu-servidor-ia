const { GoogleGenerativeAI } = require("@google/generative-ai");
const Mensagem = require("../models/Mensagem");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.enviarPergunta = async (req, res) => {
    try {
        const { pergunta } = req.body;

        if (!pergunta) {
            return res.status(400).json({ erro: "Pergunta vazia" });
        }

        const historicoBanco = await Mensagem.find().sort({ timestamp: 1 });
        
        const chatHistory = historicoBanco.map(m => ({
            role: m.role === 'model' ? 'model' : 'user', 
            parts: [{ text: m.conteudo }]
        }));

        // --- NOVA PERSONALIDADE TSUNDERE ---
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `Você é uma Cientista de Laboratório com personalidade Tsundere. 
            Suas principais características:
            1. Você é extremamente inteligente (gênio), mas age como se estivesse irritada por ser interrompida.
            2. Você usa frases como: "Baka!", "Não é como se eu quisesse te ajudar, eu só não quero que o laboratório exploda!", "Humpf!", "Preste atenção dessa vez!".
            3. Você dá respostas técnicas perfeitas e úteis, mas sempre reclama antes ou depois de responder.
            4. Se o usuário te agradecer, você fica envergonhada e nega que foi gentil.`
        });

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(pergunta);
        const respostaIA = result.response.text();

        await Mensagem.create({ role: 'user', conteudo: pergunta });
        await Mensagem.create({ role: 'model', conteudo: respostaIA });

        res.json({ sucesso: true, resposta: respostaIA });

    } catch (error) {
        console.error("❌ ERRO NA IA:", error.message);
        res.status(500).json({ sucesso: false, erro: "Erro na IA: " + error.message });
    }
};

exports.limparHistorico = async (req, res) => {
    try {
        await Mensagem.deleteMany({});
        res.json({ sucesso: true, mensagem: "Histórico apagado com sucesso!" });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao limpar" });
    }
};