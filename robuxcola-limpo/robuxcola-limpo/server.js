const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos HTML (garante que procura na pasta correta)
app.use(express.static(__dirname));

const FILE_PATH = path.join(__dirname, 'chaves.txt');

// Função para gerar uma chave aleatória simples (Ex: TESTE-A8F2K9)
function gerarChaveAleatoria() {
    return 'TESTE-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// ========================================================
// ⚡ LIMPEZA COMPLETA: APAGA AS CHAVES ANTIGAS E CRIA 2 NOVAS
// ========================================================
function inicializarChaves() {
    const agora = Date.now();
    const tempoValidade = 10 * 60 * 1000; // 10 minutos de duração
    const expiracao = agora + tempoValidade;

    // Cria as duas chaves novas aleatórias
    const chave1 = gerarChaveAleatoria();
    const chave2 = gerarChaveAleatoria();

    // Monta o texto que vai para o arquivo (formato: CHAVE;EXPIRACAO;DONO)
    const dadosIniciais = `${chave1};${expiracao};Nenhum\n${chave2};${expiracao};Nenhum\n`;

    // Escreve do zero no arquivo chaves.txt, apagando tudo o que existia antes!
    fs.writeFileSync(FILE_PATH, dadosIniciais, 'utf-8');
    
    console.log('🧹 Arquivo limpo! Chaves antigas deletadas.');
    console.log(`🔑 Novas chaves de teste criadas: [${chave1}] e [${chave2}]`);
}

// Executa a função assim que o servidor da Render liga
inicializarChaves();

// ========================================================
// ROTAS DO TEU SITE
// ========================================================

// Rota principal (leva para o simulador)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'robuxcomprar.html'));
});

// Rota para o teu painel de administrador
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
                mensagemErro = "Esta chave de teste já expirou!";
                return linha; 
            }
            if (dono !== "Nenhum" && dono !== nick) {
                mensagemErro = "Esta chave já está em uso por outro Nick!";
                return linha;
            }
            
            chaveValida = true;
            dono = nick; // Vincula a chave ao nick de quem entrou
            return `${ch};${exp};${dono}`;
        }
        return linha;
    });

    fs.writeFileSync(FILE_PATH, novasLinhas.join('\n') + '\n', 'utf-8');

    if (chaveValida) {
        return res.json({ valido: true });
    } else {
        return res.json({ valido: false, message: mensagemErro });
    }
});

// Rota para criar chaves manuais (para os teus clientes VIPs/Fixos)
app.post('/criar-chave-manual', (req, res) => {
    const { chave, minutos } = req.body;
    const expiracao = Date.now() + (parseInt(minutos) * 60 * 1000);
    
    // Adiciona a chave VIP no final do arquivo sem apagar as outras
    fs.appendFileSync(FILE_PATH, `${chave};${expiracao};Nenhum\n`, 'utf-8');
    res.json({ sucesso: true, mensagem: `Chave ${chave} criada!` });
});

// Inicialização correta para a Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
});
