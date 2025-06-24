let estado = null;
let usuarios = [];
let produtos = [];
const imagensPendentes = []; // [{ file, nomeArquivo }]

let editandoUsuarioId = null;
let editandoProdutoId = null;

const secaoUsuarios = document.getElementById("secao-usuarios");
const secaoProdutos = document.getElementById("secao-produtos");

const btnUsuarios = document.getElementById("editar-usuarios");
const btnProdutos = document.getElementById("editar-produtos");

const formUsuario = document.getElementById("form-usuario");
const formProduto = document.getElementById("form-produto");

function gerarID(lista) {
  return lista.length ? Math.max(...lista.map(e => parseInt(e.id))) + 1 : 1;
}

function carregarCSV(arquivo) {
  return fetch(arquivo)
    .then(res => res.text())
    .catch(err => {
      console.error("Erro ao carregar CSV:", err);
      return "";
    });
}

function processarCSV(csv) {
  if (!csv || csv.trim() === '') return [];
  
  const linhas = csv.trim().split("\n");
  const linhasValidas = linhas.filter(linha => linha.trim() !== '');
  
  if (linhasValidas.length === 0) return [];
  
  const cabecalhos = linhasValidas[0].split(";");
  return linhasValidas.slice(1).map(linha => {
    const obj = {};
    const valores = linha.split(";");
    cabecalhos.forEach((header, i) => {
      obj[header] = valores[i] !== undefined ? valores[i] : '';
    });
    return obj;
  });
}

// TABELA USUÁRIOS
function gerarTabelaUsuarios() {
  const tbody = secaoUsuarios.querySelector("tbody");
  tbody.innerHTML = "";

  // Filtra usuários válidos
  const usuariosValidos = usuarios.filter(u => u.id && u.nome);
  
  usuariosValidos.forEach(usuario => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${usuario.id}</td>
      <td contenteditable="false">${usuario.nome}</td>
      <td contenteditable="false">${usuario.email}</td>
      <td contenteditable="false">${usuario.senha}</td>
      <td>
        <span class="tipo-texto">${usuario.tipo}</span>
        <select style="display:none;">
          <option value="adm" ${usuario.tipo === "adm" ? "selected" : ""}>adm</option>
          <option value="cliente" ${usuario.tipo === "cliente" ? "selected" : ""}>cliente</option>
        </select>
      </td>
      <td>
        <button class="btn cinza">Editar</button>
        <button class="btn verde" style="display:none;">Salvar</button>
        <button class="btn vermelho">Excluir</button>
      </td>
    `;

    const tdNome = tr.children[1];
    const tdEmail = tr.children[2];
    const tdSenha = tr.children[3];
    const tipoTexto = tr.querySelector(".tipo-texto");
    const selectTipo = tr.querySelector("select");

    const btnEditar = tr.querySelector(".btn.cinza");
    const btnSalvar = tr.querySelector(".btn.verde");
    const btnExcluir = tr.querySelector(".btn.vermelho");

    function ativarEdicao() {
      tdNome.setAttribute("contenteditable", "true");
      tdEmail.setAttribute("contenteditable", "true");
      tdSenha.setAttribute("contenteditable", "true");

      tipoTexto.style.display = "none";
      selectTipo.style.display = "inline-block";

      btnEditar.style.display = "none";
      btnSalvar.style.display = "inline-block";
    }

    function salvarEdicao() {
      const nomeEditado = tdNome.innerText.trim();
      const emailEditado = tdEmail.innerText.trim();
      const senhaEditada = tdSenha.innerText.trim();
      const novoTipo = selectTipo.value;

      usuario.nome = nomeEditado;
      usuario.email = emailEditado;
      usuario.senha = senhaEditada;
      usuario.tipo = novoTipo;

      gerarTabelaUsuarios();
    }

    function excluirUsuarioAtual() {
      const confirmar = window.confirm(`Deseja realmente excluir o usuário "${usuario.nome}"?`);
      if (!confirmar) return;

      usuarios = usuarios.filter(u => u.id !== usuario.id);
      gerarTabelaUsuarios();
    }

    btnEditar.addEventListener("click", ativarEdicao);
    btnSalvar.addEventListener("click", salvarEdicao);
    btnExcluir.addEventListener("click", excluirUsuarioAtual);

    tbody.appendChild(tr);
  });
}

function editarUsuario(id) {
  const u = usuarios.find(u => u.id == id);
  const [nome, email, senha, tipo] = formUsuario.querySelectorAll("input, select");
  nome.value = u.nome;
  email.value = u.email;
  senha.value = u.senha;
  tipo.value = u.tipo;
  editandoUsuarioId = id;
}

function excluirUsuario(id) {
  usuarios = usuarios.filter(u => u.id != id);
  gerarTabelaUsuarios();
}

formUsuario.addEventListener("submit", e => {
  e.preventDefault();
  const [nome, email, senha, tipo] = formUsuario.querySelectorAll("input, select");
  
  if (!nome.value.trim() || !email.value.trim() || !senha.value.trim()) {
    return alert("Preencha todos os campos obrigatórios!");
  }

  if (editandoUsuarioId !== null) {
    const u = usuarios.find(u => u.id == editandoUsuarioId);
    u.nome = nome.value;
    u.email = email.value;
    u.senha = senha.value;
    u.tipo = tipo.value;
    editandoUsuarioId = null;
  } else {
    const usuarioExistente = usuarios.find(u => u.email === email.value);
    if (usuarioExistente) {
      return alert("Já existe um usuário com este e-mail!");
    }

    const id = gerarID(usuarios);
    usuarios.push({ id, nome: nome.value, email: email.value, senha: senha.value, tipo: tipo.value });
  }
  
  gerarTabelaUsuarios();
  formUsuario.reset();
});

// TABELA PRODUTOS
function gerarTabelaProdutos() {
  const tbody = secaoProdutos.querySelector("tbody");
  tbody.innerHTML = "";

  const produtosValidos = produtos.filter(p => p.id && p.nome);
  
  produtosValidos.forEach(produto => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td contenteditable="false">${produto.id}</td>
      <td contenteditable="false">${produto.nome}</td>
      <td contenteditable="false">R$ ${produto.preco}</td>
      <td>${produto.caminho__img}</td>
      <td>
        <span class="categoria-texto">${produto.categoria}</span>
        <select style="display:none;">
          <option value="acompanhamentos" ${produto.categoria === "acompanhamentos" ? "selected" : ""}>acompanhamentos</option>
          <option value="bebidas" ${produto.categoria === "bebidas" ? "selected" : ""}>bebidas</option>
          <option value="Hamburgues" ${produto.categoria === "Hamburgues" ? "selected" : ""}>Hamburgues</option>
        </select>
      </td>
      <td>
        <button class="btn cinza">Editar</button>
        <button class="btn verde" style="display:none;">Salvar</button>
        <button class="btn vermelho">Excluir</button>
      </td>
    `;

    const tdNome = tr.children[1];
    const tdPreco = tr.children[2];
    const categoriaTexto = tr.querySelector(".categoria-texto");
    const selectCategoria = tr.querySelector("select");

    const btnEditar = tr.querySelector(".btn.cinza");
    const btnSalvar = tr.querySelector(".btn.verde");
    const btnExcluir = tr.querySelector(".btn.vermelho");

    function ativarEdicao() {
      tdNome.setAttribute("contenteditable", "true");
      tdPreco.setAttribute("contenteditable", "true");

      categoriaTexto.style.display = "none";
      selectCategoria.style.display = "inline-block";

      btnEditar.style.display = "none";
      btnSalvar.style.display = "inline-block";
    }

    function salvarEdicao() {
      const nomeEditado = tdNome.innerText.trim();
      const precoEditado = tdPreco.innerText.replace("R$", "").trim();
      const novaCategoria = selectCategoria.value;

      produto.nome = nomeEditado;
      produto.preco = precoEditado;
      produto.categoria = novaCategoria;

      gerarTabelaProdutos();
    }

    function excluirProdutoAtual() {
      const confirmar = window.confirm(`Deseja realmente excluir o produto "${produto.nome}"?`);
      if (!confirmar) return;

      produtos = produtos.filter(p => p.id !== produto.id);
      gerarTabelaProdutos();
    }

    btnEditar.addEventListener("click", ativarEdicao);
    btnSalvar.addEventListener("click", salvarEdicao);
    btnExcluir.addEventListener("click", excluirProdutoAtual);

    tbody.appendChild(tr);
  });
}

function editarProduto(id) {
  const p = produtos.find(p => p.id == id);
  const [nome, preco, , categoria] = formProduto.querySelectorAll("input, select");
  nome.value = p.nome;
  preco.value = p.preco;
  categoria.value = p.categoria;
  editandoProdutoId = id;
}

function excluirProduto(id) {
  produtos = produtos.filter(p => p.id != id);
  gerarTabelaProdutos();
}

formProduto.addEventListener("submit", e => {
  e.preventDefault();
  const [nomeInput, precoInput, fileInput, categoriaInput] = formProduto.querySelectorAll("input, select");

  const nome = nomeInput.value.trim();
  const preco = precoInput.value.trim();
  const categoria = categoriaInput.value;
  const imagem = fileInput.files[0];

  if (editandoProdutoId !== null) {
    const p = produtos.find(p => p.id == editandoProdutoId);
    p.nome = nome;
    p.preco = preco;
    p.categoria = categoria;
    editandoProdutoId = null;
    gerarTabelaProdutos();
    formProduto.reset();
    return;
  }

  if (!imagem) return alert("Imagem é obrigatória");

  const produtoExistente = produtos.find(p => p.nome === nome);
  if (produtoExistente) return alert("Produto já existe!");

  const id = gerarID(produtos);
  const imgNome = `${id}.png`;
  const caminho__img = `imgs/${imgNome}`;

  // Adiciona ao array principal
  produtos.push({ id, nome, preco, caminho__img, categoria });

  // Armazena imagem pendente
  imagensPendentes.push({ file: imagem, nomeArquivo: imgNome });

  gerarTabelaProdutos();
  formProduto.reset();
});


// BUSCA PRODUTOS
secaoProdutos.querySelector(".busca-id button").addEventListener("click", () => {
  const input = secaoProdutos.querySelector(".busca-id input");
  const id = input.value.trim();

  if (!id) return;

  const resultado = produtos.find(p => String(p.id) === id);

  const tbody = secaoProdutos.querySelector("tbody");
  tbody.innerHTML = "";

  if (resultado) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${resultado.id}</td>
      <td>${resultado.nome}</td>
      <td>R$ ${resultado.preco}</td>
      <td>${resultado.caminho__img}</td>
      <td>${resultado.categoria}</td>
      <td>
        <button class="btn cinza">Editar</button>
        <button class="btn vermelho">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6">Produto com ID ${id} não encontrado.</td>`;
    tbody.appendChild(tr);
  }

  input.value = "";
});

// BUSCA USUÁRIOS
secaoUsuarios.querySelector(".busca-id button").addEventListener("click", () => {
  const input = secaoUsuarios.querySelector(".busca-id input");
  const id = input.value.trim();

  if (!id) return;

  const resultado = usuarios.find(u => String(u.id) === id);

  const tbody = secaoUsuarios.querySelector("tbody");
  tbody.innerHTML = "";

  if (resultado) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${resultado.id}</td>
      <td contenteditable="false">${resultado.nome}</td>
      <td contenteditable="false">${resultado.email}</td>
      <td contenteditable="false">${resultado.senha}</td>
      <td>
        <span class="tipo-texto">${resultado.tipo}</span>
        <select style="display:none;">
          <option value="adm" ${resultado.tipo === "adm" ? "selected" : ""}>adm</option>
          <option value="cliente" ${resultado.tipo === "cliente" ? "selected" : ""}>cliente</option>
        </select>
      </td>
      <td>
        <button class="btn cinza">Editar</button>
        <button class="btn vermelho">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6">Usuário com ID ${id} não encontrado.</td>`;
    tbody.appendChild(tr);
  }

  input.value = "";
});

// Alternância abas
btnUsuarios.addEventListener("click", () => {
  estado = "usuarios";
  secaoUsuarios.style.display = "block";
  secaoProdutos.style.display = "none";
});

btnProdutos.addEventListener("click", () => {
  estado = "produtos";
  secaoUsuarios.style.display = "none";
  secaoProdutos.style.display = "block";
  gerarTabelaProdutos();
});

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [usuariosCSV, produtosCSV] = await Promise.all([
      carregarCSV("../CSVs/users.csv"),
      carregarCSV("../CSVs/produtos.csv")
    ]);
    
    usuarios = processarCSV(usuariosCSV).filter(u => u.id);
    produtos = processarCSV(produtosCSV).filter(p => p.id);
    
    gerarTabelaUsuarios();
    gerarTabelaProdutos();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
});

// Função para salvar todos os dados
function salvarTudo(e) {
  if (e) e.preventDefault();

  const usuariosFiltrados = usuarios.filter(u => u.id && u.nome);
  const produtosFiltrados = produtos.filter(p => p.id && p.nome);

  if (usuariosFiltrados.length === 0 && produtosFiltrados.length === 0) {
    alert('Nenhum dado válido para salvar!');
    return;
  }

  let salvamentoConcluido = false;

  // Salvar usuários
  fetch('/salvar-usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarios: usuariosFiltrados }),
  })
  .then(res => res.text())
  .then(msg => {
    console.log(msg);
    // Salvar produtos
    return fetch('/salvar-produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtos: produtosFiltrados }),
    });
  })
  .then(res => res.text())
  .then(async msg => {
    console.log(msg);

    // Agora envia as imagens pendentes
    for (const img of imagensPendentes) {
      const formData = new FormData();
      formData.append('imagem', img.file);
      formData.append('nomeArquivo', img.nomeArquivo);

      try {
        const resp = await fetch('/upload-imagem', {
          method: 'POST',
          body: formData
        });
        const texto = await resp.text();
        console.log(texto);
      } catch (err) {
        console.error('Erro ao enviar imagem:', err);
      }
    }

    imagensPendentes.length = 0; // limpa após envio

    if (!salvamentoConcluido) {
      alert('Alterações e imagens salvas com sucesso!');
      salvamentoConcluido = true;
    }
  })
  .catch(err => {
    console.error('Erro ao salvar dados:', err);
    if (!salvamentoConcluido) {
      alert('Ocorreu um erro ao salvar os dados!');
    }
  });
}

function getCookie(nome) {
    const match = document.cookie.match(new RegExp('(^| )' + nome + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  const usuario = getCookie('usuario');
  if (usuario) {
    const dados = JSON.parse(usuario);

    const divUser = document.querySelector('.user');

    const icone = document.createElement('span');
    icone.textContent = `👤 ${dados.nome.split(' ')[0]}`;
    icone.classList.add('usuario-logado');
    divUser.appendChild(icone);

    if (dados.tipo === 'adm') {
      const botaoCrud = document.createElement('button');
      botaoCrud.textContent = 'Acessar CRUD';
      botaoCrud.onclick = () => window.location.href = 'http://localhost:3001/html/adm.html';
      divUser.appendChild(botaoCrud);
    }
  }