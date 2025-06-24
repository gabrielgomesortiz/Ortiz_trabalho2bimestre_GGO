const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync'); // Usado para parsear CSV de forma síncrona

const app = express();
const PORT = 3001; // Porta em que o servidor irá rodar

// Middleware para parsear JSON e dados de formulário URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da pasta 'public'
// Isso significa que arquivos em 'public' (como HTML, CSS, JS, imagens)
// estarão disponíveis diretamente via URL, ex: localhost:3001/index.html
app.use(express.static('public'));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  // Define o diretório de destino para os arquivos enviados
  destination: (req, file, cb) => cb(null, 'public/imgs'),
  // Define o nome do arquivo no disco
  filename: (req, file, cb) => {
    let nomeFinal = req.body.nomeArquivo || file.originalname; // Pega nome do corpo da requisição ou nome original
    nomeFinal = '63.jpeg'; // **ATENÇÃO: Nome do arquivo fixo para '63.jpeg'. Ele sempre sobrescreverá.**
    console.log(nomeFinal) // Loga o nome final para depuração

    // Garante que o nome do arquivo termine em .jpeg
    if (!nomeFinal.endsWith('.jpeg')) {
      nomeFinal = nomeFinal.split('.')[0] + '.jpeg';
    }

    // Constrói o caminho completo do arquivo
    const caminhoCompleto = path.join(__dirname, 'public', 'imgs', nomeFinal);

    // Se o arquivo já existe, o remove antes de salvar o novo
    if (fs.existsSync(caminhoCompleto)) {
      fs.unlinkSync(caminhoCompleto);
    }

    // Chama o callback com o nome final do arquivo
    cb(null, nomeFinal);
  }
});

const upload = multer({ storage }); // Inicializa o Multer com a configuração de storage

// Rota para upload de imagem
app.post('/upload-imagem', upload.single('imagem'), (req, res) => {
  res.send('Imagem salva com nome personalizado com sucesso!');
});

// Rota para salvar produtos em um arquivo CSV
app.post('/salvar-produtos', (req, res) => {
  // Constrói o conteúdo CSV a partir dos produtos recebidos no corpo da requisição
  const csv = ['id;nome;preco;caminho__img;categoria', ...req.body.produtos.map(p =>
    `${p.id};${p.nome};${p.preco};${p.caminho__img};${p.categoria}`
  )].join('\n');
  // Escreve o conteúdo CSV no arquivo 'produtos.csv' na pasta 'public/CSVs'
  fs.writeFileSync('public/CSVs/produtos.csv', csv);
  res.send('Produtos salvos com sucesso!');
});

// Rota de login
app.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body; // Extrai email e senha do corpo da requisição
    // Constrói o caminho completo para o arquivo 'usuarios.csv'
    // **NOTA:** A pasta 'CSVs' DEVE ter esse nome EXATO no seu sistema de arquivos (maiúsculas/minúsculas)
    const caminho = path.join(__dirname, 'public', 'CSVs', 'users.csv');

    // Verifica se o arquivo CSV de usuários existe
    if (!fs.existsSync(caminho)) {
      console.error('Arquivo usuarios.csv não encontrado no caminho:', caminho);
      return res.status(500).send({ erro: 'Arquivo CSV de usuários não encontrado no servidor.' });
    }

    // Lê o conteúdo do arquivo CSV
    const conteudo = fs.readFileSync(caminho, 'utf-8');
    // Faz o parse do conteúdo CSV, esperando delimitador ';', colunas e ignorando linhas vazias
    const registros = parse(conteudo, {
      delimiter: ';',
      columns: true, // Trata a primeira linha como cabeçalhos das colunas
      skip_empty_lines: true // Ignora linhas em branco
    });

    // Procura por um usuário que corresponda ao email e senha fornecidos
    const usuario = registros.find(u => u.email === email && u.senha === senha);

    // Se nenhum usuário for encontrado, retorna erro de credenciais inválidas
    if (!usuario) {
      return res.status(401).send({ erro: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    // Se o login for bem-sucedido, envia os dados do usuário (filtrados) para o frontend
    res.send({ id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo });

  } catch (err) {
    // Captura e loga quaisquer erros que ocorram durante o processo de login
    console.error('Erro no login do servidor:', err);
    res.status(500).send({ erro: `Erro interno do servidor: ${err.message}` });
  }
});

// Inicia o servidor na porta definida
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
