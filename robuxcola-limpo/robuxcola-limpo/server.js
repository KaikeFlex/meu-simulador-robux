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
// ⚡ SEGURANÇA: APENAS LIMPA CHAVES EXPIRADAS (NÃO DELETA TUDO)
// ========================================================
function limparChavesExpiradas() {
    if (!fs.existsSync(FILE_PATH)) {
        // Se o arquivo não existir, cria ele vazio
        fs.writeFileSync(FILE_PATH, '', 'utf-8');
        return;
    }

    const conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
    const linhas = conteudo.split('\n').filter(l => l.trim() !== '');
    const agora = Date.now();

    // Filtra e mantém apenas as chaves que ainda estão no tempo válido
    const linhasValidas = linhas.filter(linha => {
        const [_, exp] = linha.split(';');
        return agora < parseInt(exp); // Mantém se o tempo atual for menor que o tempo de expiração
    });

    // Salva de volta no arquivo apenas o que ainda está valendo
    fs.writeFileSync(FILE_PATH, linhasValidas.join('\n') + (linhasValidas.length > 0 ? '\n' : ''), 'utf-8');
    console.log('🧹 Sistema iniciado: Chaves vencidas foram limpas. Chaves ativas preservadas!');
}

// Executa a limpeza inteligente assim que o servidor liga
limparChavesExpiradas();

// ========================================================
// ROTAS DO SEU SITE
// ========================================================

// Rota principal (Simulador)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'robuxcomprar.html'));
});

// Rota para o seu painel de administrador
app.get('/painel-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'painel.html')); 
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
        let [ch, exp, dono] = linha.split(';');
        
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

// Rota para criar chaves manuais pelo seu painel administrativo
app.post('/criar-chave-manual', (req, res) => {
    const { chave, minutos } = req.body;
    const expiracao = Date.now() + (parseInt(minutos) * 60 * 1000);
    
    // Adiciona a nova chave no fim do arquivo de forma permanente
    fs.appendFileSync(FILE_PATH, `${chave};${expiracao};Nenhum\n`, 'utf-8');
    res.json({ sucesso: true, mensagem: `Chave ${chave} criada com sucesso!` });
});

// Inicialização para a Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
});
