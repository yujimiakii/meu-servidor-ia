// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Espera formato "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    try {
        const secret = process.env.JWT_SECRET || "chave_secreta_padrao_laboratorio";
        const decodificado = jwt.verify(token, secret);
        req.user = decodificado;
        next();
    } catch (err) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
    }
};