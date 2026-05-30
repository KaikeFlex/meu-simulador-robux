const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FILE_PATH = path.join(__dirname, 'chaves.txt');

// Garante que o arquivo de chaves existe ao iniciar o servidor
if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, '', 'utf-8');
}

// ========================================================
// 💻 SEU PAINEL VISUAL DE ADMINISTRADOR COMPLETO
// ========================================================
app.get('/painel-admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Painel Admin - Gerenciador de Keys</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121214; color: #e1e1e6; padding: 40px; margin: 0; }
            .container { max-width: 800px; margin: 0 auto; background: #202024; padding: 30px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
            h1 { color: #00b37e; border-bottom: 2px solid #29292e; padding-bottom: 10px; margin-top: 0; }
            h2 { color: #61dafb; margin-top: 30px; }
            .form-group { margin-bottom: 15px; display: flex; gap: 10px; }
            input, select, button { padding: 12px; border-radius: 6px; border: 1px solid #29292e; background: #121214; color: #fff; font-size: 14px; }
            input { flex: 1; }
            button { background: #00b37e; cursor: pointer; font-weight: bold; border: none; transition: background 0.2s; }
            button:hover { background: #00875f; }
            .btn-danger { background: #f75a68; }
            .btn-danger:hover { background: #c53030; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; background: #29292e; border-radius: 6px; overflow: hidden; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #202024; }
            th { background: #121214; color: #00b37e; }
            tr:hover { background: #323238; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚡ Painel de Administração de Chaves</h1>
            
            <h2>🔑 Criar Nova Chave</h2>
            <div class="form-group">
                <input type="text" id="novaChave" placeholder="Digite a Key (Ex: VIP-123)">
                <input type="number" id="tempoMinutos" placeholder="Tempo em Minutos (Ex: 60)">
                <button onclick="criarChave()">Gerar Key</button>
            </div>

            <h2>📋 Chaves Ativas no Sistema</h2>
            <table>
                <thead>
                    <tr>
                        <th>Chave (Key)</th>
                        <th>Tempo Restante</th>
                        <th>Dono Bloqueado (Nick)</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabelaChaves">
                    <!-- Preenchido automaticamente -->
                </tbody>
            </table>
        </div>

        <script>
            async function carregarChaves() {
                const res = await fetch('/api/listar-chaves');
                const chaves = await res.json();
                const tbody = document.getElementById('tabelaChaves');
                tbody.innerHTML = '';

                if (chaves.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#8d8d99;">Nenhuma chave ativa no momento.</td></tr>';
                    return;
                }

                chaves.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = \`
                        <td style="font-weight:bold; color:#e1e1e6;">\${c.chave}</td>
                        <td style="color:#61dafb;">\${c.tempoRestante}</td>
                        <td><span style="color:\${c.dono !== 'Nenhum' ? '#00b37e' : '#8d8d99'}">\th \${c.dono}</span></td>
                        <td><button class="btn-danger" onclick="deletarChave('\${c.chave}')">Remover</button></td>
                    \`;
                    tbody.appendChild(tr);
                });
            }

            async function criarChave() {
                const chave = document.getElementById('novaChave').value.trim();
                const minutos = document.getElementById('tempoMinutos').value.trim();
                if(!chave || !minutos) return alert('Preencha todos os campos!');

                const res = await fetch('/criar-chave-manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chave, minutos })
                });
                const dados = await res.json();
                if(dados.sucesso) {
                    document.getElementById('novaChave').value = '';
                    document.getElementById('tempoMinutos').value = '';
                    carregarChaves();
                }
            }

            async function deletarChave(chave) {
                if(!confirm('Tem certeza que deseja apagar esta chave?')) return;
                const res = await fetch('/api/deletar-chave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chave })
                });
                const dados = await res.json();
                if(dados.sucesso) carregarChaves();
            }

            carregarChaves();
            setInterval(carregarChaves, 4000);
        </script>
    </body>
    </html>
    `);
});

// ========================================================
// ⚡ CONTROLE INTERNO DAS CHAVES (APIs)
// ========================================================

app.get('/api/listar-chaves', (req, res) => {
    if (!fs.existsSync(FILE_PATH)) return res.json([]);
    const conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
    const linhas = conteudo.split('\n').filter(l => l.trim() !== '');
    const agora = Date.now();

    const lista = linhas.map(linha => {
        const [ch, exp, dono] = linha.split(';');
        const tempoRestanteMs = parseInt(exp) - agora;
        let tempoTexto = "";

        if (tempoRestanteMs <= 0) {
            tempoTexto = "Expirada";
        } else {
            const min = Math.floor(tempoRestanteMs / 60000);
            tempoTexto = min > 0 ? `${min} min` : "Menos de 1 min";
        }

        return { chave: ch, tempoRestante: tempoTexto, dono: dono || "Nenhum" };
    });

    res.json(lista);
});

app.post('/criar-chave-manual', (req, res) => {
    const { chave, minutos } = req.body;
    const expiracao = Date.now() + (parseInt(minutos) * 60 * 1000);
    
    fs.appendFileSync(FILE_PATH, `${chave};${expiracao};Nenhum\n`, 'utf-8');
    res.json({嘘cesso: true });
});

app.post('/api/deletar-chave', (req, res) => {
    const { chave } = req.body;
    if (!fs.existsSync(FILE_PATH)) return res.json({ sucesso: false });

    const conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
    const linhas = conteudo.split('\n').filter(l => l.trim() !== '');

    const novasLinhas = linhas.filter(linha => {
        const [ch] = linha.split(';');
        return ch !== chave;
    });

    fs.writeFileSync(FILE_PATH, novasLinhas.join('\n') + (novasLinhas.length > 0 ? '\n' : ''), 'utf-8');
    res.json({ sucesso: true });
});

app.post('/verificar-chave', (req, res) => {
    const { chave, nick } = req.body;
    if (!fs.existsSync(FILE_PATH)) return res.json({ valido: false, mensagem: "Sem chaves ativas." });

    let conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
    let linhas = conteudo.split('\n').filter(l => l.trim() !== '');
    let chaveValida = false;
    let mensagemErro = "Chave inválida ou expirada.";
    const agora = Date.now();

    let novasLinhas = linhas.map(linha => {
        let [ch, exp, dono] = linha.split(';');
        if (!dono || dono.trim() === "") dono = "Nenhum";
        
        if (ch === chave) {
            if (agora > parseInt(exp)) {
                mensagemErro = "Esta chave já expirou!";
                return linha; 
            }
            if (dono !== "Nenhum" && dono.toLowerCase() !== nick.toLowerCase()) {
                mensagemErro = `Esta chave está trancada no Nick: ${dono}`;
                return linha;
            }
            
            chaveValida = true;
            if (dono === "Nenhum") {
                dono = nick;
            }
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

// Arquivos estáticos declarados DEPOIS das rotas principais para não bugar
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'robuxcomprar.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
});
