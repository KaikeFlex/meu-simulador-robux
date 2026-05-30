const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Permite que o Express entenda requisições JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos estáticos (HTML, CSS, JS do frontend) que estão na pasta public
app.use(express.static(path.join(__dirname, 'public')));

// --- BANCO DE DADOS TEMPORÁRIO (Apenas exemplo, adapte para o seu) ---
let chavesAtivas = [
    { key: "ktz", tempo: 1, dono: null }
];

// ==========================================
// ROTA PARA ENTRAR NO PAINEL ADMIN
// ==========================================
app.get('/painel-admin', (req, res) => {
    // Certifique-se de que o ficheiro do painel existe nesta pasta
    res.sendFile(path.join(__dirname, 'public', 'painel-admin.html')); 
});

// ==========================================
// ROTA DA API: VERIFICAR A CHAVE (LOGIN)
// ==========================================
app.get('/api/verificar-key', (req, res) => {
    const { key, nick } = req.query;

    // Procura se a chave existe no sistema
    const chaveEncontrada = chavesAtivas.find(c => c.key === key);

    if (chaveEncontrada) {
        // Se a chave não tem dono ou já é do utilizador atual, valida o acesso
        if (chaveEncontrada.dono === null || chaveEncontrada.dono === nick) {
            chaveEncontrada.dono = nick; // Bloqueia a chave para este Nick
            return res.json({ valida: true });
        }
    }

    // Se não encontrar ou se já tiver outro dono logado
    return res.json({ valida: false });
});

// ==========================================
// ROTA DA API: MONITOR DE SESSÃO (LOCAL USER)
// ==========================================
app.get('/api/local-user', (req, res) => {
    const { userKey, customNick } = req.query;

    const chaveEncontrada = chavesAtivas.find(c => c.key === userKey);

    // Se a chave sumiu do sistema ou o dono mudou (outro dispositivo entrou)
    if (!chaveEncontrada || chaveEncontrada.dono !== customNick) {
        return res.status(401).json({ erro: "Sessão inválida ou expirada" });
    }

    return res.json({ status: "OK", dados: chaveEncontrada });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor nativo rodando com sucesso na porta ${PORT}`);
});
