// 1. Carrega o sistema de segurança
require('dotenv').config();

// 2. Importa as bibliotecas necessárias
const { GoogleGenerativeAI } = require("@google/generative-ai");
const readline = require("readline/promises");
const fs = require("fs"); // Módulo nativo do Node para manipular arquivos
const PDFDocument = require("pdfkit"); // Biblioteca para criar PDFs

// 3. Verifica a chave
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERRO: Chave da API não encontrada. Verifique seu arquivo .env!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- FUNÇÃO PARA GERAR O PDF ---
function gerarRelatorioPDF(pergunta, resposta, numeroRelatorio) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const nomeArquivo = `relatorio_experimento_${numeroRelatorio}.pdf`;
        
        // Cria o arquivo na sua pasta
        const stream = fs.createWriteStream(nomeArquivo);
        doc.pipe(stream);

        // Escreve o conteúdo dentro do PDF
        doc.fontSize(18).text('🧪 RELATÓRIO DO LABORATÓRIO SECRETO 🧪', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Data do Incidente: ${new Date().toLocaleString()}`);
        doc.moveDown(2);
        
        doc.fontSize(14).text(`👤 VOCÊ PERGUNTOU:`);
        doc.fontSize(12).text(pergunta);
        doc.moveDown();
        
        doc.fontSize(14).text(`👨‍🔬 CIENTISTA RESPONDEU:`);
        doc.fontSize(12).text(resposta);

        // Finaliza a criação do PDF
        doc.end();

        // Avisa quando terminar de salvar
        stream.on('finish', () => {
            console.log(`\n📄 Relatório salvo com sucesso: ${nomeArquivo}`);
            resolve();
        });
        
        stream.on('error', reject);
    });
}

async function iniciarInterface() {
    try {
        console.log("=========================================");
        console.log("🧪 BEM-VINDO AO LABORATÓRIO SECRETO! 🧪");
        console.log("=========================================\n");

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "Você é um Cientista Maluco no meio de um experimento perigoso e prestes a explodir. Você é genial, mas muito paranóico e apressado. Responda às perguntas de forma curta, ansiosa e sempre citando algo de química, física ou informática dando errado no fundo."
        });

        const chat = model.startChat({ history:[] });

        console.log("🧪 [CIENTISTA]: RÁPIDO! O que você quer me perguntar? Meu reator quântico está superaquecendo!! (Digite 'sair' para fugir)\n");

        let contadorDePdfs = 1; // Contador para não sobreescrever os arquivos

        // Loop da conversa
        while (true) {
            const perguntaUsuario = await rl.question("👤 Você: ");

            if (perguntaUsuario.toLowerCase() === 'sair') {
                console.log("\n🏃 Você correu e escapou do laboratório antes da explosão!");
                rl.close();
                break;
            }

            console.log("⏳ (O Cientista está calculando desesperadamente...)");

            // IA gera a resposta
            const result = await chat.sendMessage(perguntaUsuario);
            const resposta = result.response.text();

            console.log("\n🧪 [CIENTISTA]: " + resposta);

            // GERA O PDF COM A RESPOSTA!
            await gerarRelatorioPDF(perguntaUsuario, resposta, contadorDePdfs);
            contadorDePdfs++; // Aumenta o número para o próximo PDF (ex: relatorio_2.pdf)
            
            console.log("-----------------------------------------");
        }

    } catch (erro) {
        console.error("\n❌ ERRO CRÍTICO NO LABORATÓRIO:", erro.message);
        rl.close();
    }
}
// Adicione isso na última linha para o programa começar!
iniciarInterface();