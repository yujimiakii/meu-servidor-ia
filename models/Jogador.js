const mongoose = require('mongoose');

const JogadorSchema = new mongoose.Schema({
    nickname: { type: String, required: true, unique: true },
    xp: { type: Number, default: 0 },
    nivel: { type: String, default: "Novato" }
});

module.exports = mongoose.model('Jogador', JogadorSchema);