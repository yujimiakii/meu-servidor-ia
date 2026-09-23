// controllers/documentController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analisarDocumento = async (req, res) => {
    try {
        const { pergunta } = req.body;
        const file = req.file;

        if (!pergunta) {
            return res.status(400).json({ erro: "A pergunta é obrigatória." });
        }

        if (!file) {
            return res.status(400).json({ erro: "O arquivo PDF/TXT é obrigatório." });
        }

        let textoExtraido = "";

        // Extrai texto dependendo do tipo do arquivo em memória (RAM)
        if (file.mimetype === "application/pdf") {
            const data = await pdfParse(file.buffer);
            textoExtraido = data.text;
        } else if (file.mimetype === "text/plain") {
            textoExtraido = file.buffer.toString("utf-8");
        } else {
            return res.status(400).json({ erro: "Formato inválido. Apenas .pdf e .txt são aceitos." });
        }

        if (!textoExtraido.trim()) {
            return res.status(400).json({ erro: "Não foi possível extrair texto do documento fornecido." });
        }

        // Engenharia de Prompt RAG (Regra Estrita Anti-Alucinação)
        const promptRAG = `
Você é um analista de dados corporativo extremamente preciso.
Abaixo está um documento de referência. Responda à pergunta do usuário baseando-se APENAS no texto fornecido.
Se a resposta não estiver no texto, diga exatamente: "Desculpe, não encontrei essa informação no documento." NÃO INVENTE DADOS.

DOCUMENTO:
"""
${textoExtraido}
"""

PERGUNTA DO USUÁRIO: ${pergunta}
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(promptRAG);
        const resposta = result.response.text();

        return res.json({ sucesso: true, resposta });
    } catch (error) {
        console.error("Erro no RAG:", error);
        return res.status(500).json({ erro: "Erro ao processar o documento com o analista." });
    }
};