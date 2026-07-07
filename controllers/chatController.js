const { GoogleGenerativeAI } = require("@google/generative-ai");
const Jogador = require('../models/Jogador');
const axios = require('axios');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// FERRAMENTA 1: Clima (Sprint 1)
async function buscarClimaTempoReal(cidade) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&units=metric&appid=${process.env.WEATHER_API_KEY}&lang=pt_br`;
        const res = await axios.get(url);
        return { 
            temp: res.data.main.temp, 
            condicao: res.data.weather[0].description, 
            cidade: res.data.name 
        };
    } catch (err) { 
        return { erro: "Cidade não encontrada no mapa mundi do laboratório!" }; 
    }
}

// FERRAMENTA 2: Sistema de XP (Sprint 2)
async function adicionarXP(nickname, acao) {
    let pontos = acao === "acertou" ? 50 : -10;
    let jogador = await Jogador.findOne({ nickname });
    
    if (!jogador) {
        jogador = new Jogador({ nickname, xp: 0 });
    }

    jogador.xp += pontos;
    if (jogador.xp < 0) jogador.xp = 0;

    // Títulos Dinâmicos
    if (jogador.xp >= 500) jogador.nivel = "Lenda do Código 🏆";
    else if (jogador.xp >= 200) jogador.nivel = "Sênior 👨‍🔬";
    else if (jogador.xp >= 100) jogador.nivel = "Pleno 🧪";
    else jogador.nivel = "Novato 🛡️";

    await jogador.save();
    return { novoXP: jogador.xp, nivel: jogador.nivel, mensagem: `XP alterado em ${pontos}!` };
}

// Configuração das Tools para o Gemini
const tools = [{
    functionDeclarations: [
        {
            name: "buscarClimaTempoReal",
            description: "Obtém o clima de uma cidade. Use sempre que o usuário perguntar sobre tempo, temperatura ou se deve levar casaco.",
            parameters: { type: "OBJECT", properties: { cidade: { type: "STRING" } }, required: ["cidade"] }
        },
        {
            name: "adicionarXP",
            description: "Adiciona ou remove XP do jogador. 'acertou' para respostas corretas, 'errou' para respostas erradas.",
            parameters: { 
                type: "OBJECT", 
                properties: { 
                    nickname: { type: "STRING" }, 
                    acao: { type: "STRING", enum: ["acertou", "errou"] } 
                }, 
                required: ["nickname", "acao"] 
            }
        }
    ]
}];

exports.enviarPergunta = async (req, res) => {
    const { pergunta, nickname } = req.body;

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite",
            tools: tools,
            systemInstruction: `Você é o Cientista Maluco do Laboratório de Overflowia. 
            Seu objetivo é ensinar programação com charadas. 
            Se o usuário acertar, use adicionarXP(acao='acertou'). Se errar, use adicionarXP(acao='errou').
            O jogador atual é: ${nickname}. Seja ansioso, use emojis de ciência e fale sobre o reator explodindo!`
        });

        const chat = model.startChat();
        let result = await chat.sendMessage(pergunta);
        let response = result.response;

        // Loop de Function Calling
        const calls = response.functionCalls();
        if (calls) {
            const responseParts = [];
            for (const call of calls) {
                if (call.name === "buscarClimaTempoReal") {
                    const data = await buscarClimaTempoReal(call.args.cidade);
                    responseParts.push({ functionResponse: { name: call.name, response: data } });
                }
                if (call.name === "adicionarXP") {
                    const data = await adicionarXP(nickname, call.args.acao);
                    responseParts.push({ functionResponse: { name: call.name, response: data } });
                }
            }
            // Envia de volta para o Gemini gerar o texto final
            result = await chat.sendMessage(responseParts);
            response = result.response;
        }

        res.json({ sucesso: true, resposta: response.text() });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, erro: "O Reator explodiu! Erro no servidor." });
    }
};

exports.limparHistorico = async (req, res) => {
    // Lógica para limpar (opcional se não estiver usando histórico no banco)
    res.json({ sucesso: true });
};