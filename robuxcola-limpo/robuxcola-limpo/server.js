const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Permite que o Express entenda requisições JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORREÇÃO: Serve os arquivos estáticos direto da raiz (onde estão seus HTMLs, CSS e JS)
app.use(express.static(__dirname));

// --- BANCO DE DADOS TEMPORÁRIO ---
let chavesAtivas = [
    { key: "ktz", tempo: 1, dono: null }
];

// ==========================================
// ROTA PARA A PÁGINA PRINCIPAL DO SITE (/)
// ==========================================
app.get('/', (req, res) => {
    // Abre o arquivo de login principal (geralmente index.html)
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// ==========================================
// ROTA PARA ENTRAR NO PAINEL ADMIN
// ==========================================
app.get('/painel-admin', (req, res) => {
    // CORREÇÃO: Busca o painel direto na raiz do projeto
    res.sendFile(path.join(__dirname, 'painel-admin.html')); 
});

// ==========================================
// ROTA DA API: VERIFICAR A CHAVE (LOGIN)
// ==========================================
app.get('/api/verificar-key', (req, res) => {
    const { key, nick } = req.query;

    const chaveEncontrada = chavesAtivas.find(c => c.key === key);

    if (chaveEncontrada) {
        if (chaveEncontrada.dono === null || chaveEncontrada.dono === nick) {
            chaveEncontrada.dono = nick; 
            return res.json({ valida: true });
        }
    }

    return res.json({ valida: false });
});

// ==========================================
// ROTA DA API: MONITOR DE SESSÃO (LOCAL USER)
// ==========================================
app.get('/api/local-user', (req, res) => {
    const { userKey, customNick } = req.query;

    const chaveEncontrada = chavesAtivas.find(c => c.key === userKey);

    if (!chaveEncontrada || chaveEncontrada.dono !== customNick) {
        return res.status(401).json({ erro: "Sessão inválida ou expirada" });
    }

    return res.json({ status: "OK", dados: chaveEncontrada });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor nativo rodando com sucesso na porta ${PORT}`);
});
