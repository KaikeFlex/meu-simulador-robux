const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos HTML
app.use(express.static(__dirname));

const FILE_PATH = path.join(__dirname, 'chaves.txt');

// ========================================================
// ⚡ SEGURANÇA: APENAS LIMPA CHAVES EXPIRADAS
// ========================================================
function limparChavesExpiradas() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, '', 'utf-8');
        return;
    }

    const conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
    const linhas = conteudo.split('\n').filter(l => l.trim() !== '');
    const agora = Date.now();

    // Mantém só as chaves dentro da validade
    const linhasValidas = linhas.filter(linha => {
        const partes = linha.split(';');
        if (partes.length < 2) return false;
        const exp = partes[1];
        return agora < parseInt(exp); 
    });

    fs.writeFileSync(FILE_PATH, linhasValidas.join('\n') + (linhasValidas.length > 0 ? '\n' : ''), 'utf-8');
    console.log('🧹 Sistema iniciado: Chaves antigas e vencidas limpas. Chaves VIP mantidas!');
}

limparChavesExpiradas();

// ========================================================
// ROTAS DO SEU SITE
// ========================================================

// Rota principal (Simulador)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'robuxcomprar.html'));
});

// Processo de verificação de chaves do Simulador
app.post('/verificar-chave', (req, res) => {
    const { chave, nick } = req.body;
    
    if (!fs.existsSync(FILE_PATH)) {
        return res.json({ valido: false, mensagem: "Nenhuma chave ativa no sistema." });
    }

    let conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
    let linhas = conteudo.split('\n').filter(l => l.trim() !== '');
    let chaveValida = false;
    let mensagemErro = "Chave inválida ou expirada.";
    const agora = Date.now();

    let novasLinhas = linhas.map(linha => {
        let partes = linha.split(';');
        if (partes.length < 2) return linha;
        let [ch, exp, dono] = partes;
        if (!dono) dono = "Nenhum";
        
        if (ch === chave) {
            if (agora > parseInt(exp)) {
                mensagemErro = "Esta chave já expirou!";
                return linha; 
            }
            if (dono !== "Nenhum" && dono !== nick) {
                mensagemErro = "Esta chave já está em uso por outro Nick!";
                return linha;
            }
            
            chaveValida = true;
            dono = nick; 
            return `${ch};${exp};${dono}`;
        }
        return linha;
    });

    fs.writeFileSync(FILE_PATH, novasLinhas.join('\n') + '\n', 'utf-8');

    if (chaveValida) {
        return res.json({ valido: true });
    } else {
        return res.json({ valido: false, mensagem: mensagemErro });
    }
});

// Rota para o Bot do Discord ou você criar chaves manualmente (Via API / Postman)
app.post('/criar-chave-manual', (req, res) => {
    const { chave, minutos } = req.body;
    const expiracao = Date.now() + (parseInt(minutos) * 60 * 1000);
    
    fs.appendFileSync(FILE_PATH, `${chave};${expiracao};Nenhum\n`, 'utf-8');
    res.json({ sucesso: true, mensagem: `Chave ${chave} criada com sucesso!` });
});

// Inicialização para a Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
});
