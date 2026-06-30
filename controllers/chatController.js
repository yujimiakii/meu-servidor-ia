const { GoogleGenerativeAI } = require("@google/generative-ai");
const Post = require("../models/Post");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =========================================================================
// FASE 1: A ferramenta local para consultar a API de Clima (OpenWeatherMap)
// =========================================================================
async function buscarClimaTempoReal(cidade) {
    try {
        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            return { erro: "Chave da API do clima (WEATHER_API_KEY) não configurada no servidor." };
        }
        
        // Monta a URL para buscar em graus Celsius e idioma em português
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;
        
        const response = await fetch(url);
        if (!response.ok) {
            return { erro: `Não foi possível encontrar as informações climáticas para a cidade "${cidade}".` };
        }
        
        const data = await response.json();
        return {
            temperatura: `${data.main.temp}°C`,
            sensacaoTermica: `${data.main.feels_like}°C`,
            clima: data.weather[0].description,
            umidade: `${data.main.humidity}%`,
            cidade: data.name
        };
    } catch (error) {
        console.error("Erro na busca de clima:", error);
        return { erro: "Ocorreu um erro interno ao buscar as informações climáticas." };
    }
}

// =========================================================================
// FASE 2: O manual de instruções (JSON Schema) para o Gemini
// =========================================================================
const declaracaoClima = {
    name: "buscarClimaTempoReal",
    description: "Obtém a temperatura exata e o clima atual de uma cidade. Use sempre que o usuário perguntar sobre o tempo, chuva, clima ou temperatura de alguma localidade.",
    parameters: {
        type: "OBJECT",
        properties: {
            cidade: {
                type: "STRING",
                description: "O nome da cidade. Ex: Assis Chateaubriand, Curitiba, Tokyo."
            }
        },
        required: ["cidade"]
    }
};

// =========================================================================
// FASE 3 e 4: O loop de conversação e tomada de decisão autônoma da IA
// =========================================================================
exports.enviarMensagem = async (req, res) => {
    try {
        const msgUsuario = req.body.mensagem;

        if (!msgUsuario) {
            return res.status(400).json({ resposta: "Erro: Nenhuma mensagem foi fornecida no corpo da requisição." });
        }

        // RAG: Busca posts relacionados no MongoDB para alimentar o contexto local
        const palavrasChave = msgUsuario.split(" ").filter(p => p.length > 3);
        const contextoDb = await Post.find({
            $or: [
                { titulo: { $regex: palavrasChave.join("|"), $options: "i" } },
                { desc: { $regex: palavrasChave.join("|"), $options: "i" } }
            ]
        }).limit(3);

        let textoContexto = "Nenhum post relevante encontrado no fórum local.";
        if (contextoDb.length > 0) {
            textoContexto = contextoDb.map(p => `Título: ${p.titulo} \nSolução: ${p.desc}`).join("\n\n");
        }

        // Conecta as ferramentas (tools) e define a nova personalidade séria/educada
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Você é o Overflowia Assistant, um assistente virtual altamente profissional, calmo, capacitado e extremamente educado. Suas respostas devem ser claras, cordiais e objetivas. Utilize as ferramentas integradas sempre que necessário para complementar suas respostas com dados em tempo real.",
            tools: [{ functionDeclarations: [declaracaoClima] }] // O superpoder é inserido aqui!
        });

        // Engenharia de Prompt combinando RAG e a pergunta do usuário
        const prompt = `Você é o Overflowia Assistant. Responda à dúvida de forma educada e formal.
        Se houver código na sua resposta final, envolva-o obrigatoriamente nas tags HTML para manter a formatação do site: <div class="code-block"><pre><code>...</code></pre></div>.
        
        [CONTEXTO DO FÓRUM LOCAL (RAG)]:
        ${textoContexto}
        
        [PERGUNTA DO USUÁRIO]:
        ${msgUsuario}`;

        // Inicia a sessão de chat
        const chat = model.startChat({ history: [] });
        let result = await chat.sendMessage(prompt);

        // Verifica de forma segura se a IA decidiu invocar a nossa ferramenta de Clima
        const functionCalls = typeof result.response.functionCalls === 'function' 
            ? result.response.functionCalls() 
            : result.response.functionCalls;

        const call = functionCalls?.[0];
        let respostaFinal = "";

        if (call) {
            const { name, args } = call;
            console.log(`🔌 IA acionou de forma autônoma a ferramenta: "${name}" com os argumentos:`, args);

            if (name === "buscarClimaTempoReal") {
                // 1. Executa a função local de busca do clima
                const dadosClima = await buscarClimaTempoReal(args.cidade);

                // 2. Devolve os dados obtidos para o Gemini estruturar o texto final para o usuário
                const novoResult = await chat.sendMessage([{
                    functionResponse: {
                        name: "buscarClimaTempoReal",
                        response: dadosClima
                    }
                }]);

                respostaFinal = novoResult.response.text();
            }
        } else {
            // Se nenhuma função foi chamada, usa a resposta de texto direta
            respostaFinal = result.response.text();
        }

        console.log("🤖 Overflowia Assistant respondeu com sucesso!");
        res.json({ resposta: respostaFinal });

    } catch (error) {
        console.error("❌ Erro no processamento da IA:", error);
        res.status(500).json({ resposta: "Prezado usuário, ocorreu um erro interno de processamento. Por favor, tente novamente mais tarde." });
    }
};

// Limpar o Histórico
exports.limparHistorico = async (req, res) => {
    try {
        await Post.deleteMany({});
        res.json({ sucesso: true, mensagem: "Histórico limpo com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao limpar histórico." });
    }
};