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
async function enviarMsgChat() {
    // Pegamos o nome do usuário que está logado no LocalStorage
    const nickname = localStorage.getItem('userName') || "Jogador Anonimo";
    const msgDigitada = chatTextArea.value.trim();
    if (!msgDigitada) return;

    // 1. Mostrar mensagem do usuário na tela
    msgArea.insertAdjacentHTML('beforeend', `
        <article class="message user-message" style="margin-top:20px;">
            <div class="message-content"> <p>${msgDigitada}</p> </div>
        </article>`);

    chatTextArea.value = '';
    msgArea.scrollTop = msgArea.scrollHeight;

    // 2. Feedback de Carregamento
    chatInputBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    chatInputBtn.disabled = true;

    try {
        // 3. Chamada para o seu Back-end no Render
        const response = await fetch('https://SUA-URL-DO-RENDER.com/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: msgDigitada, nickname: nickname })
        });

        const data = await response.json();

        // 4. Mostrar resposta da IA
        msgArea.insertAdjacentHTML('beforeend', `
        <article class="message ai-message">
            <div class="avatar-ai"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <p>${data.texto}</p>
            </div>
        </article>`);

        // Desafio Hacker: Confetes se o bot der parabéns
        if (data.texto.includes("Parabéns") || data.texto.includes("XP")) {
            // Se você adicionar a lib confetti, chame aqui!
            console.log("Estourar confetes!");
        }

    } catch (err) {
        console.error("Erro na API:", err);
    } finally {
        chatInputBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        chatInputBtn.disabled = false;
        msgArea.scrollTop = msgArea.scrollHeight;
    }
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

async function mostrarRanking() {
    const container = document.getElementById('ranking-container');
    const lista = document.getElementById('ranking-lista');
    container.style.display = 'block';
    lista.innerHTML = "Carregando...";

    try {
        const res = await fetch('https://SUA-URL-DO-RENDER.com/api/ranking');
        const dados = await res.json();
        
        lista.innerHTML = dados.map((j, i) => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333">
                <span>${i+1}º ${j.nivel}: <strong>${j.nickname}</strong></span>
                <span style="color:var(--accent-color)">${j.xp} XP</span>
            </div>
        `).join('');
    } catch (err) {
        lista.innerHTML = "Erro ao caracher ranking.";
    }
}
// Adicione isso na última linha para o programa começar!
iniciarInterface();