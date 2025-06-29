const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const cors = require('cors');

const app = express();
const PORT = 3001;
app.use(cors());

app.use(express.json()); // Middleware para parsear JSON
app.use(express.urlencoded({ extended: true })); // Middleware para parsear dados de formulário
app.use(express.static('public')); // Serve arquivos estáticos da pasta 'public'


// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/imgs'),
  filename: (req, file, cb) => {
    let finalId = null;

    if (file.originalname) {
      const originalNameBase = path.parse(file.originalname).name;
      const match = originalNameBase.match(/^(\d+)$/);
      if (match && match[1]) {
        const parsedId = parseInt(match[1]);
        if (!isNaN(parsedId)) {
          finalId = String(parsedId);
          console.log(`ID encontrado em file.originalname: ${finalId}`);
        } else {
          console.warn(`Nome original do arquivo '${file.originalname}' não é um ID numérico válido.`);
        }
      } else {
        console.warn(`Nome original do arquivo '${file.originalname}' não está no formato 'ID.ext'.`);
      }
    }

    if (finalId === null && req.body && req.body.produtoId) {
      const parsedId = parseInt(req.body.produtoId);
      if (!isNaN(parsedId)) {
        finalId = String(parsedId);
        console.log(`ID encontrado em req.body.produtoId (fallback): ${finalId}`);
      } else {
        console.warn(`req.body.produtoId '${req.body.produtoId}' não é um número válido (fallback).`);
      }
    }

    if (finalId === null && req.body && req.body.nomeArquivo) {
      const nameWithoutExt = path.parse(req.body.nomeArquivo).name;
      const parsedId = parseInt(nameWithoutExt);
      if (!isNaN(parsedId)) {
        finalId = String(parsedId);
        console.log(`ID encontrado em req.body.nomeArquivo (fallback): ${finalId}`);
      } else {
        console.warn(`req.body.nomeArquivo '${req.body.nomeArquivo}' não contém um ID numérico válido (fallback).`);
      }
    }

    if (finalId === null) {
      const errorMessage = 'Erro: Não foi possível obter um ID de produto válido para nomear a imagem. Imagem não será salva.';
      console.error(errorMessage);
      return cb(new Error(errorMessage));
    }

    const finalFileName = `${finalId}.jpeg`;

    console.log(`Nome final da imagem a ser salvo: ${finalFileName}`);

    const caminhoCompleto = path.join(__dirname, 'public', 'imgs', finalFileName);
    if (fs.existsSync(caminhoCompleto)) {
      console.log(`Removendo imagem existente (substituição): ${caminhoCompleto}`);
      fs.unlinkSync(caminhoCompleto);
    }

    cb(null, finalFileName);
  }
});

const upload = multer({ storage });

// Rota para upload de imagem
app.post('/upload-imagem', upload.single('imagem'), (req, res) => {
  if (req.file) {
    console.log(`Imagem '${req.file.filename}' salva com sucesso.`);
    res.send(`Imagem '${req.file.filename}' salva com sucesso!`);
  } else {
    if (req.fileValidationError) {
      console.error('Erro de validação do arquivo:', req.fileValidationError.message);
      return res.status(400).send(`Erro no upload: ${req.fileValidationError.message}`);
    }
    console.error('Erro no upload: Nenhuma imagem recebida ou erro desconhecido.');
    res.status(400).send('Erro no upload: Nenhuma imagem recebida ou erro desconhecido.');
  }
});

// Rota para salvar produtos em CSV
app.post('/salvar-produtos', (req, res) => {
  const csv = ['id;nome;preco;caminho__img;categoria', ...req.body.produtos.map(p =>
    `${p.id};${p.nome};${p.preco};${p.caminho__img};${p.categoria}`
  )].join('\n');
  fs.writeFileSync('public/CSVs/produtos.csv', csv);
  res.send('Produtos salvos com sucesso!');
});

// Rota para salvar usuários em CSV
app.post('/salvar-usuarios', (req, res) => {
  const csv = ['id;nome;email;senha;tipo', ...req.body.usuarios.map(u =>
    `${u.id};${u.nome};${u.email};${u.senha};${u.tipo}`
  )].join('\n');
  fs.writeFileSync('public/CSVs/users.csv', csv);
  res.send('Usuários salvos com sucesso!');
});

// NOVA ROTA: Excluir imagens do servidor
app.post('/excluir-imagens', (req, res) => {
  const imagensParaExcluir = req.body.imagens; // Espera um array de nomes de arquivos (ex: ["1.jpeg", "2.jpeg"])
  let countExcluidas = 0;
  let countErros = 0;

  if (!Array.isArray(imagensParaExcluir) || imagensParaExcluir.length === 0) {
    return res.status(400).send('Nomes de imagens para excluir não fornecidos ou lista vazia.');
  }

  imagensParaExcluir.forEach(nomeArquivo => {
    const caminhoCompleto = path.join(__dirname, 'public', 'imgs', nomeArquivo);
    if (fs.existsSync(caminhoCompleto)) {
      try {
        fs.unlinkSync(caminhoCompleto);
        console.log(`Imagem excluída: ${nomeArquivo}`);
        countExcluidas++;
      } catch (err) {
        console.error(`Erro ao excluir imagem ${nomeArquivo}: ${err.message}`);
        countErros++;
      }
    } else {
      console.warn(`Imagem a ser excluída não encontrada: ${nomeArquivo}`);
      // Não incrementamos erros se a imagem já não existe, apenas avisamos.
    }
  });

  res.send(`Exclusão de imagens concluída. ${countExcluidas} imagens excluídas, ${countErros} erros.`);
});

// Rota de login
app.post('/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    const caminho = path.join(__dirname, 'public', 'CSVs', 'users.csv');

    if (!fs.existsSync(caminho)) {
      console.error('Arquivo usuarios.csv não encontrado no caminho:', caminho);
      return res.status(500).send({ erro: 'Arquivo CSV de usuários não encontrado no servidor.' });
    }

    const conteudo = fs.readFileSync(caminho, 'utf-8');
    const registros = parse(conteudo, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true
    });

    const usuario = registros.find(u => u.email === email && u.senha === senha);

    if (!usuario) {
      return res.status(401).send({ erro: 'Credenciais inválidas' });
    }

    res.send({ id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo });

  } catch (err) {
    console.error('Erro no login do servidor:', err);
    res.status(500).send({ erro: `Erro interno do servidor: ${err.message}` });
  }
});

app.post('/cadastrar-usuario', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).send({ erro: 'Todos os campos são obrigatórios.' });
  }

  const caminho = path.join(__dirname, 'public', 'CSVs', 'users.csv');

  if (!fs.existsSync(caminho)) {
    fs.writeFileSync(caminho, 'id;nome;email;senha;tipo\n');
  }

  let conteudo = fs.readFileSync(caminho, 'utf-8');
  conteudo = conteudo.trimEnd() + '\n'; // Remove espaços no fim e adiciona uma quebra de linha
  fs.writeFileSync(caminho, conteudo, 'utf-8');

  const linhas = conteudo.trim().split('\n');

  const jaExiste = linhas.some((linha, index) => {
    if (index === 0) return false; // Ignora cabeçalho
    const partes = linha.split(';');
    return partes[2] === email;
  });

  if (jaExiste) {
    return res.status(400).send({ erro: 'Já existe um usuário com este e-mail.' });
  }

  const ultimoId = linhas.length > 1
    ? Math.max(...linhas.slice(1).map(linha => parseInt(linha.split(';')[0], 10)))
    : 0;

  const novoId = ultimoId + 1;
  const tipo = 'cliente';

  const novaLinha = `${novoId};${nome};${email};${senha};${tipo}\n`;
  fs.appendFileSync(caminho, novaLinha, 'utf-8');

  res.send({ mensagem: 'Usuário cadastrado com sucesso!', id: novoId, tipo });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));