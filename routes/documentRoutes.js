// routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configuração do Multer para salvar puramente na memória RAM
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // limite de 10MB
});

// Rota protegida com JWT
router.post('/', authMiddleware, upload.single('arquivo'), documentController.analisarDocumento);

module.exports = router;