const secaoUsuarios = document.getElementById("secao-usuarios");
const secaoProdutos = document.getElementById("secao-produtos");

const btnUsuarios = document.getElementById("editar-usuarios");
const btnProdutos = document.getElementById("editar-produtos");

let estado = null;

// Função para carregar arquivos CSV
async function carregarCSV(arquivo) {
  try {
    const response = await fetch(arquivo);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Erro ao carregar ${arquivo}:`, error);
    throw error;
  }
}

// Função para processar dados de usuários
function processarUsuarios(csvData) {
  const linhas = csvData.trim().split("\n");
  const cabecalhos = linhas[0].split(";");
  const dados = linhas.slice(1);

  const usuarios = [];

  for (const linha of dados) {
    if (!linha.trim()) continue;

    const valores = linha.split(";");
    const usuario = {};

    cabecalhos.forEach((cabecalho, index) => {
      usuario[cabecalho] = valores[index];
    });

    usuarios.push(usuario);
  }

  return usuarios;
}

// Função para processar dados de produtos
function processarProdutos(csvData) {
  const linhas = csvData.trim().split("\n");
  const cabecalhos = linhas[0].split(";");
  const dados = linhas.slice(1);

  const produtos = [];

  for (const linha of dados) {
    if (!linha.trim()) continue;

    const valores = linha.split(";");
    const produto = {};

    cabecalhos.forEach((cabecalho, index) => {
      produto[cabecalho] = valores[index];
    });

    produtos.push(produto);
  }

  return produtos;
}

// Função para gerar a tabela de usuários
function gerarTabelaUsuarios(usuarios) {
  const tbody = secaoUsuarios.querySelector("tbody");
  tbody.innerHTML = "";

  usuarios.forEach(usuario => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${usuario.id}</td>
      <td>${usuario.nome}</td>
      <td>${usuario.email}</td>
      <td>${usuario.tipo === "adm" ? "Administrador" : "Cliente"}</td>
      <td>
        <button class="btn cinza">Editar</button>
        <button class="btn vermelho">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Função para gerar a tabela de produtos
function gerarTabelaProdutos(produtos) {
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
        <button class="btn cinza">Editar</button>
        <button class="btn vermelho">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Carregar dados quando a página é aberta
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Carregar usuários
    const usuariosCSV = await carregarCSV("../CSVs/users.csv");
    const usuarios = processarUsuarios(usuariosCSV);
    gerarTabelaUsuarios(usuarios);

    // Carregar produtos
    const produtosCSV = await carregarCSV("../CSVs/produtos.csv");
    const produtos = processarProdutos(produtosCSV);
    gerarTabelaProdutos(produtos);
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dados. Verifique o console para mais detalhes.");
  }
});

// Lógica de alternância entre seções
btnUsuarios.addEventListener("click", () => {
  if (estado === "usuarios") {
    secaoUsuarios.style.display = "none";
    estado = null;
    btnUsuarios.checked = false;
  } else {
    secaoUsuarios.style.display = "block";
    secaoProdutos.style.display = "none";
    estado = "usuarios";
    btnProdutos.checked = false;
  }
});

btnProdutos.addEventListener("click", () => {
  if (estado === "produtos") {
    secaoProdutos.style.display = "none";
    estado = null;
    btnProdutos.checked = false;
  } else {
    secaoProdutos.style.display = "block";
    secaoUsuarios.style.display = "none";
    estado = "produtos";
    btnUsuarios.checked = false;
  }
});