const secaoUsuarios = document.getElementById("secao-usuarios");
const secaoProdutos = document.getElementById("secao-produtos");

const btnUsuarios = document.getElementById("editar-usuarios");
const btnProdutos = document.getElementById("editar-produtos");

const formUsuario = document.getElementById("form-usuario");
const formProduto = document.getElementById("form-produto");

let estado = null;
let usuarios = [];
let produtos = [];

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
  const linhas = csv.trim().split("\n");
  const cabecalhos = linhas[0].split(";");
  return linhas.slice(1).map(linha => {
    const obj = {};
    linha.split(";").forEach((v, i) => obj[cabecalhos[i]] = v);
    return obj;
  });
}

function gerarTabelaUsuarios() {
  const tbody = secaoUsuarios.querySelector("tbody");
  tbody.innerHTML = "";
  usuarios.forEach(usuario => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${usuario.id}</td>
      <td>${usuario.nome}</td>
      <td>${usuario.email}</td>
      <td>${usuario.tipo}</td>
      <td>
        <button class="btn cinza" onclick="editarUsuario(${usuario.id})">Editar</button>
        <button class="btn vermelho" onclick="excluirUsuario(${usuario.id})">Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function gerarTabelaProdutos() {
  const tbody = secaoProdutos.querySelector("tbody");
  tbody.innerHTML = "";
  produtos.forEach(produto => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${produto.id}</td>
      <td>${produto.nome}</td>
      <td>${produto.caminho__img}</td>
      <td>R$ ${produto.preco}</td>
      <td>${produto.categoria}</td>
      <td>
        <button class="btn cinza" onclick="editarProduto(${produto.id})">Editar</button>
        <button class="btn vermelho" onclick="excluirProduto(${produto.id})">Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// CRUD Usuários
formUsuario.addEventListener("submit", e => {
  e.preventDefault();
  const [nome, email, senha, tipo] = formUsuario.querySelectorAll("input, select");
  const id = gerarID(usuarios);
  usuarios.push({ id, nome: nome.value, email: email.value, senha: senha.value, tipo: tipo.value });
  gerarTabelaUsuarios();
  formUsuario.reset();
});

function excluirUsuario(id) {
  usuarios = usuarios.filter(u => u.id != id);
  gerarTabelaUsuarios();
}

function editarUsuario(id) {
  const u = usuarios.find(u => u.id == id);
  const [nome, email, senha, tipo] = formUsuario.querySelectorAll("input, select");
  nome.value = u.nome;
  email.value = u.email;
  senha.value = u.senha;
  tipo.value = u.tipo;
  formUsuario.onsubmit = function (e) {
    e.preventDefault();
    u.nome = nome.value;
    u.email = email.value;
    u.senha = senha.value;
    u.tipo = tipo.value;
    gerarTabelaUsuarios();
    formUsuario.reset();
    formUsuario.onsubmit = null;
  }
}

// CRUD Produtos
formProduto.addEventListener("submit", e => {
  e.preventDefault();
  const [nomeInput, precoInput, fileInput, categoriaInput] = formProduto.querySelectorAll("input, select");
  const id = gerarID(produtos);
  const nome = nomeInput.value;
  const preco = precoInput.value;
  const categoria = categoriaInput.value;

  if (!fileInput.files[0]) return alert("Imagem é obrigatória");

  const imgNome = `produto_${id}.png`;
  const caminho__img = `imgs/${imgNome}`;
  const reader = new FileReader();
  reader.onload = () => {
    const a = document.createElement("a");
    a.href = reader.result;
    a.download = imgNome;
    a.click();
  };
  reader.readAsDataURL(fileInput.files[0]);

  produtos.push({ id, nome, preco, caminho__img, categoria });
  gerarTabelaProdutos();
  formProduto.reset();
});

function excluirProduto(id) {
  produtos = produtos.filter(p => p.id != id);
  gerarTabelaProdutos();
}

function editarProduto(id) {
  const p = produtos.find(p => p.id == id);
  const [nome, preco, , categoria] = formProduto.querySelectorAll("input, select");
  nome.value = p.nome;
  preco.value = p.preco;
  categoria.value = p.categoria;
  formProduto.onsubmit = function (e) {
    e.preventDefault();
    p.nome = nome.value;
    p.preco = preco.value;
    p.categoria = categoria.value;
    gerarTabelaProdutos();
    formProduto.reset();
    formProduto.onsubmit = null;
  }
}

// Busca por ID
secaoProdutos.querySelector(".busca-id button").addEventListener("click", () => {
  const input = secaoProdutos.querySelector(".busca-id input");
  const id = input.value.trim();

  if (!id) return;

  const resultado = produtos.find(p => String(p.id) === id);

  const tbody = secaoProdutos.querySelector("tbody");
  tbody.innerHTML = ""; // limpa tabela

  if (resultado) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${resultado.id}</td>
      <td>${resultado.nome}</td>
      <td>${resultado.caminho__img}</td>
      <td>R$ ${resultado.preco}</td>
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


// Alternância de abas
btnUsuarios.addEventListener("click", () => {
  secaoUsuarios.style.display = estado === "usuarios" ? "none" : "block";
  secaoProdutos.style.display = "none";
  estado = estado === "usuarios" ? null : "usuarios";
});

btnProdutos.addEventListener("click", () => {
  secaoProdutos.style.display = estado === "produtos" ? "none" : "block";
  secaoUsuarios.style.display = "none";
  estado = estado === "produtos" ? null : "produtos";
});

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  const usuariosCSV = await carregarCSV("../CSVs/users.csv");
  const produtosCSV = await carregarCSV("../CSVs/produtos.csv");
  usuarios = processarCSV(usuariosCSV);
  produtos = processarCSV(produtosCSV);
  gerarTabelaUsuarios();
  gerarTabelaProdutos();
});
