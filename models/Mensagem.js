const mongoose = require('mongoose');

const MensagemSchema = new mongoose.Schema({
    role: { type: String, required: true }, // 'user' ou 'model'
    conteudo: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mensagem', MensagemSchema);