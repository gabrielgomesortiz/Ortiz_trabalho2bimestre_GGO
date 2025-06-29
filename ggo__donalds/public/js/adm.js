let estado = null;
let usuarios = [];
let produtos = [];
const imagensPendentes = []; // [{ file, nomeArquivo, idProduto }]
const imagensParaExcluir = []; // Novo array para rastrear imagens a serem excluídas

let editandoUsuarioId = null;
let editandoProdutoId = null;

const secaoUsuarios = document.getElementById("secao-usuarios");
const secaoProdutos = document.getElementById("secao-produtos");

const btnUsuarios = document.getElementById("editar-usuarios");
const btnProdutos = document.getElementById("editar-produtos");

const formUsuario = document.getElementById("form-usuario");
const formProduto = document.getElementById("form-produto");


document.getElementById('btnVoltar').addEventListener('click', () => {
  window.location.href = '/index.html';
});

function gerarID(lista) {
  return lista.length ? Math.max(...lista.map(e => parseInt(e.id))) + 1 : 1;
}

function carregarCSV(arquivo) {
  return fetch(arquivo)
    .then(res => {
      if (!res.ok) {
        console.warn(`Arquivo CSV não encontrado ou erro ao carregar: ${arquivo}. Assumindo vazio.`);
        return "";
      }
      return res.text();
    })
    .catch(err => {
      console.error("Erro ao carregar CSV:", err);
      return "";
    });
}

function processarCSV(csv) {
  if (!csv || csv.trim() === '') return [];

  const linhas = csv.trim().split("\n");
  const linhasValidas = linhas.filter(linha => linha.trim() !== '');

  if (linhasValidas.length === 0 || (linhasValidas.length === 1 && linhasValidas[0].split(';').length > 1 && linhasValidas[0].includes(';'))) {
      return [];
  }

  const cabecalhos = linhasValidas[0].split(";").map(h => h.trim());
  return linhasValidas.slice(1).map(linha => {
    const obj = {};
    const valores = linha.split(";").map(v => v.trim());
    cabecalhos.forEach((header, i) => {
      obj[header] = valores[i] !== undefined ? valores[i] : '';
    });
    return obj;
  });
}

// --- TABELA USUÁRIOS ---
function gerarTabelaUsuarios(filtroId = null) {
  const tbody = secaoUsuarios.querySelector("tbody");
  tbody.innerHTML = "";

  let usuariosParaExibir = usuarios.filter(u => u.id && u.nome);

  if (filtroId) {
    usuariosParaExibir = usuariosParaExibir.filter(u => String(u.id) === String(filtroId));
  }

  if (usuariosParaExibir.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6">${filtroId ? `Usuário com ID ${filtroId} não encontrado.` : 'Nenhum usuário cadastrado.'}</td>`;
    tbody.appendChild(tr);
    return;
  }
  
  usuariosParaExibir.forEach(usuario => {
    const tr = document.createElement("tr");

    // === MODIFICAÇÃO AQUI: EXIBINDO ASTERISCOS PARA A SENHA ===
    const senhaExibida = '********'; // Oculta a senha visualmente
    // =========================================================

    tr.innerHTML = `
      <td>${usuario.id}</td>
      <td contenteditable="false">${usuario.nome}</td>
      <td contenteditable="false">${usuario.email}</td>
      <td>${senhaExibida}</td> <td>
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
    const tdSenha = tr.children[3]; // A TD da senha, que agora mostra asteriscos
    const tipoTexto = tr.querySelector(".tipo-texto");
    const selectTipo = tr.querySelector("select");

    const btnEditar = tr.querySelector(".btn.cinza");
    const btnSalvar = tr.querySelector(".btn.verde");
    const btnExcluir = tr.querySelector(".btn.vermelho");

    function ativarEdicao() {
      tdNome.setAttribute("contenteditable", "true");
      tdEmail.setAttribute("contenteditable", "true");
      // === MODIFICAÇÃO AQUI: TD SENHA NÃO EDITÁVEL DIRETAMENTE NA TABELA ===
      tdSenha.setAttribute("contenteditable", "false"); // Senha não deve ser editável diretamente na TD
      // ===================================================================

      tipoTexto.style.display = "none";
      selectTipo.style.display = "inline-block";

      btnEditar.style.display = "none";
      btnSalvar.style.display = "inline-block";
      
      // === MODIFICAÇÃO AQUI: SELEÇÃO DOS INPUTS POR ÍNDICE (para manter HTML inalterado) ===
      const inputsFormUsuario = formUsuario.querySelectorAll("input");
      const nomeInput = inputsFormUsuario[0]; // Primeiro input é o Nome
      const emailInput = inputsFormUsuario[1]; // Segundo input é o Email
      const senhaInputForm = inputsFormUsuario[2]; // Terceiro input é a Senha
      // =====================================================================================
      
      const tipoSelect = formUsuario.querySelector("select");
      
      nomeInput.value = usuario.nome;
      emailInput.value = usuario.email;
      
      senhaInputForm.value = ''; // Campo de senha fica vazio para forçar nova entrada ou manter existente
      
      tipoSelect.value = usuario.tipo;
      editandoUsuarioId = usuario.id;
      formUsuario.querySelector("button[type='submit']").textContent = "Atualizar Usuário";
    }

    function salvarEdicao() {
      const nomeEditado = tdNome.innerText.trim();
      const emailEditado = tdEmail.innerText.trim();
      // === MODIFICAÇÃO AQUI: PEGA A SENHA DO CAMPO DO FORMULÁRIO, NÃO DA TD DA TABELA ===
      const inputsFormUsuario = formUsuario.querySelectorAll("input");
      const senhaEditada = inputsFormUsuario[2].value.trim(); // Pega o valor do input de senha (índice 2)
      // =================================================================================
      const novoTipo = selectTipo.value;

      if (!nomeEditado || !emailEditado) { // Senha agora é opcional na edição
          alert('Nome e Email não podem ser vazios na tabela.');
          return;
      }

      const usuarioParaAtualizar = usuarios.find(u => u.id === usuario.id);
      if (usuarioParaAtualizar) {
        usuarioParaAtualizar.nome = nomeEditado;
        usuarioParaAtualizar.email = emailEditado;
        usuarioParaAtualizar.tipo = novoTipo;
        
        // === MODIFICAÇÃO AQUI: ATUALIZA SENHA SOMENTE SE UMA NOVA FOR DIGITADA ===
        if (senhaEditada) { // Se o campo de senha não estiver vazio, atualiza
            usuarioParaAtualizar.senha = senhaEditada;
        }
        // ======================================================================
      }
      gerarTabelaUsuarios();
      formUsuario.reset();
      editandoUsuarioId = null;
      formUsuario.querySelector("button[type='submit']").textContent = "Criar";
    }

    function excluirUsuarioAtual() {
      const confirmar = window.confirm(`Deseja realmente excluir o usuário "${usuario.nome}"?`);
      if (!confirmar) return;

      usuarios = usuarios.filter(u => u.id !== usuario.id);
      gerarTabelaUsuarios();
      formUsuario.reset();
      editandoUsuarioId = null;
      formUsuario.querySelector("button[type='submit']").textContent = "Criar";
    }

    btnEditar.addEventListener("click", ativarEdicao);
    btnSalvar.addEventListener("click", salvarEdicao);
    btnExcluir.addEventListener("click", excluirUsuarioAtual);

    tbody.appendChild(tr);
  });
}

// === MODIFICAÇÃO AQUI: AJUSTE NO EVENT LISTENER DO FORMULÁRIO DE USUÁRIO (por índice) ===
formUsuario.addEventListener("submit", e => {
  e.preventDefault();
  const inputsFormUsuario = formUsuario.querySelectorAll("input");
  const nomeInput = inputsFormUsuario[0]; 
  const emailInput = inputsFormUsuario[1];
  const senhaInput = inputsFormUsuario[2]; 
  const tipoSelect = formUsuario.querySelector("select");

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value.trim(); // Pega a senha digitada
  const tipo = tipoSelect.value;
  
  if (!nome || !email) { // Senha agora pode ser vazia na edição
    return alert("Nome e Email são obrigatórios!");
  }

  if (editandoUsuarioId !== null) {
    const u = usuarios.find(u => u.id == editandoUsuarioId);
    if (u) {
      u.nome = nome;
      u.email = email;
      u.tipo = tipo;
      if (senha) { // Somente atualiza a senha se uma nova foi digitada
          u.senha = senha;
      }
    }
    editandoUsuarioId = null;
    formUsuario.querySelector("button[type='submit']").textContent = "Criar";
  } else {
    // Para novos usuários, a senha é obrigatória
    if (!senha) {
        return alert("Para novos usuários, a senha é obrigatória!");
    }
    const usuarioExistente = usuarios.find(u => u.email === email);
    if (usuarioExistente) {
      return alert("Já existe um usuário com este e-mail!");
    }

    const id = gerarID(usuarios);
    usuarios.push({ id: String(id), nome, email, senha, tipo });
  }
  
  gerarTabelaUsuarios();
  formUsuario.reset();
});
// =========================================================================

// BUSCA USUÁRIOS
secaoUsuarios.querySelector(".busca-id button").addEventListener("click", () => {
  const inputBusca = secaoUsuarios.querySelector(".busca-id input[type='text']");
  const id = inputBusca.value.trim();

  if (!id) {
    gerarTabelaUsuarios();
    return;
  }
  gerarTabelaUsuarios(id);
  inputBusca.value = "";
  formUsuario.reset();
  editandoUsuarioId = null;
  formUsuario.querySelector("button[type='submit']").textContent = "Criar";
});


// --- TABELA PRODUTOS ---
function gerarTabelaProdutos(filtroId = null) {
  const tbody = secaoProdutos.querySelector("tbody");
  tbody.innerHTML = "";

  let produtosParaExibir = produtos.filter(p => p.id && p.nome);
  
  if (filtroId) {
    produtosParaExibir = produtosParaExibir.filter(p => String(p.id) === String(filtroId));
  }

  if (produtosParaExibir.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6">${filtroId ? `Produto com ID ${filtroId} não encontrado.` : 'Nenhum produto cadastrado.'}</td>`;
    tbody.appendChild(tr);
    return;
  }

  produtosParaExibir.forEach(produto => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td contenteditable="false">${produto.id}</td>
      <td contenteditable="false">${produto.nome}</td>
      <td contenteditable="false">R$ ${parseFloat(produto.preco).toFixed(2)}</td>
      <td>${produto.caminho__img}</td>
      <td>
        <span class="categoria-texto">${produto.categoria}</span>
        <select style="display:none;">
          <option value="acompanhamento" ${produto.categoria === "acompanhamento" ? "selected" : ""}>acompanhamento</option>
          <option value="bebida" ${produto.categoria === "bebida" ? "selected" : ""}>bebida</option>
          <option value="hamburguer" ${produto.categoria === "Hamburgue" ? "selected" : ""}>Hamburguer</option>
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
      
      const inputsFormProduto = formProduto.querySelectorAll("input");
      const nomeInput = inputsFormProduto[0]; // Primeiro input é o Nome
      const precoInput = inputsFormProduto[1]; // Segundo input é o Preço
      const fileInput = inputsFormProduto[2]; // Terceiro input é o File (imagem)

      const categoriaSelect = formProduto.querySelector("select");
      nomeInput.value = produto.nome;
      precoInput.value = parseFloat(produto.preco);
      categoriaSelect.value = produto.categoria;
      editandoProdutoId = produto.id;
      formProduto.querySelector("button[type='submit']").textContent = "Atualizar Produto";
    }

    function salvarEdicao() {
      const nomeEditado = tdNome.innerText.trim();
      const precoEditado = tdPreco.innerText.replace("R$", "").trim();
      const novaCategoria = selectCategoria.value;

      if (!nomeEditado || isNaN(parseFloat(precoEditado))) {
          alert('Nome do produto e preço são obrigatórios na tabela.');
          return;
      }

      const produtoParaAtualizar = produtos.find(p => p.id === produto.id);
      if (produtoParaAtualizar) {
        produtoParaAtualizar.nome = nomeEditado;
        produtoParaAtualizar.preco = parseFloat(precoEditado).toFixed(2);
        produtoParaAtualizar.categoria = novaCategoria;
      }
      gerarTabelaProdutos();
      formProduto.reset();
      editandoProdutoId = null;
      formProduto.querySelector("button[type='submit']").textContent = "Criar";
    }

    function excluirProdutoAtual() {
      const confirmar = window.confirm(`Deseja realmente excluir o produto "${produto.nome}"?`);
      if (!confirmar) return;

      // Adiciona o nome da imagem associada à lista de exclusão
      if (produto.caminho__img) {
          const nomeArquivo = produto.caminho__img.split('/').pop(); // Extrai apenas o nome do arquivo (ex: "63.jpeg")
          if (nomeArquivo) {
              imagensParaExcluir.push(nomeArquivo);
              console.log(`Imagem "${nomeArquivo}" adicionada à lista de exclusão.`);
          }
      }

      produtos = produtos.filter(p => p.id !== produto.id); // Remove o produto da lista
      gerarTabelaProdutos();
      formProduto.reset();
      editandoProdutoId = null;
      formProduto.querySelector("button[type='submit']").textContent = "Criar";
    }

    btnEditar.addEventListener("click", ativarEdicao);
    btnSalvar.addEventListener("click", salvarEdicao);
    btnExcluir.addEventListener("click", excluirProdutoAtual);

    tbody.appendChild(tr);
  });
}

formProduto.addEventListener("submit", e => {
  e.preventDefault();
  const inputsFormProduto = formProduto.querySelectorAll("input");
  const nomeInput = inputsFormProduto[0];
  const precoInput = inputsFormProduto[1];
  const fileInput = inputsFormProduto[2]; // O input de imagem é o terceiro input
  const categoriaSelect = formProduto.querySelector("select");

  const nome = nomeInput.value.trim();
  const preco = parseFloat(precoInput.value).toFixed(2);
  const categoria = categoriaSelect.value;
  const imagem = fileInput.files[0];

  if (!nome || isNaN(preco)) {
    return alert("Nome e Preço são obrigatórios para o produto!");
  }

  if (editandoProdutoId !== null) {
    const p = produtos.find(p => p.id == editandoProdutoId);
    if (p) {
      p.nome = nome;
      p.preco = preco;
      p.categoria = categoria;
      if (imagem) { 
        const imgNome = `${p.id}.jpeg`; 
        p.caminho__img = `imgs/${imgNome}`; 
        
        const existingImgIndex = imagensPendentes.findIndex(item => String(item.idProduto) === String(p.id));
        if (existingImgIndex > -1) {
            imagensPendentes[existingImgIndex] = { file: imagem, nomeArquivo: imgNome, idProduto: p.id };
        } else {
            imagensPendentes.push({ file: imagem, nomeArquivo: imgNome, idProduto: p.id });
        }
      }
    }
    editandoProdutoId = null;
    formProduto.querySelector("button[type='submit']").textContent = "Criar";
  } else { 
    if (!imagem) {
      return alert("Uma imagem é obrigatória ao adicionar um novo produto.");
    }
    const produtoExistente = produtos.find(p => p.nome === nome);
    if (produtoExistente) {
      return alert("Produto com este nome já existe!");
    }

    const id = gerarID(produtos);
    const imgNome = `${id}.jpeg`; 
    const caminho__img = `imgs/${imgNome}`;

    produtos.push({ id: String(id), nome, preco, caminho__img, categoria });
    
    imagensPendentes.push({ file: imagem, nomeArquivo: imgNome, idProduto: id });
  }

  gerarTabelaProdutos();
  formProduto.reset();
});

// BUSCA PRODUTOS
secaoProdutos.querySelector(".busca-id button").addEventListener("click", () => {
  const inputBusca = secaoProdutos.querySelector(".busca-id input[type='text']");
  const id = inputBusca.value.trim();

  if (!id) {
    gerarTabelaProdutos();
    return;
  }
  gerarTabelaProdutos(id);
  inputBusca.value = "";
  formProduto.reset();
  editandoProdutoId = null;
  formProduto.querySelector("button[type='submit']").textContent = "Criar";
});


// Alternância abas
btnUsuarios.addEventListener("click", () => {
  estado = "usuarios";
  secaoUsuarios.style.display = "block";
  secaoProdutos.style.display = "none";
  gerarTabelaUsuarios();
});

btnProdutos.addEventListener("click", () => {
  estado = "produtos";
  secaoUsuarios.style.display = "none";
  secaoProdutos.style.display = "block";
  gerarTabelaProdutos();
});

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  btnUsuarios.checked = true;
  secaoUsuarios.style.display = "block";
  secaoProdutos.style.display = "none";
  estado = "usuarios"; 

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
    console.error("Erro ao carregar dados na inicialização:", error);
  }
});

// Função para salvar todos os dados
async function salvarTudo(e) {
  if (e) e.preventDefault();

  const usuariosFiltrados = usuarios.filter(u => u.id && u.nome);
  const produtosFiltrados = produtos.filter(p => p.id && p.nome);

  if (usuariosFiltrados.length === 0 && produtosFiltrados.length === 0 && imagensPendentes.length === 0 && imagensParaExcluir.length === 0) {
    alert('Nenhum dado válido, imagem pendente ou imagem para exclusão.');
    return;
  }

  let salvamentoConcluido = false;

  try {
    // 1. Salvar usuários
    console.log("Salvando usuários...");
    const resUsuarios = await fetch('/salvar-usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarios: usuariosFiltrados }),
    });
    const msgUsuarios = await resUsuarios.text();
    console.log(msgUsuarios);

    // 2. Salvar produtos
    console.log("Salvando produtos...");
    const resProdutos = await fetch('/salvar-produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtos: produtosFiltrados }),
    });
    const msgProdutos = await resProdutos.text();
    console.log(msgProdutos);

    // 3. Excluir imagens (NOVO PASSO!)
    if (imagensParaExcluir.length > 0) {
        console.log(`Excluindo ${imagensParaExcluir.length} imagens...`);
        const resExcluirImagens = await fetch('/excluir-imagens', { // Nova rota
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagens: imagensParaExcluir }),
        });
        const msgExcluirImagens = await resExcluirImagens.text();
        console.log(msgExcluirImagens);
        imagensParaExcluir.length = 0; // Limpa a lista após o envio
    }

    // 4. Enviar imagens pendentes
    console.log(`Enviando ${imagensPendentes.length} imagens pendentes...`);
    for (const img of imagensPendentes) {
      const formData = new FormData();
      
      const desiredFileName = img.nomeArquivo; 
      const fileToUpload = new File([img.file], desiredFileName, { type: img.file.type });

      formData.append('imagem', fileToUpload); 
      formData.append('produtoId', img.idProduto); 
      formData.append('nomeArquivo', img.nomeArquivo); 

      try {
        console.log(`Tentando enviar imagem: ${img.nomeArquivo} para o ID: ${img.idProduto}`);
        const resp = await fetch('/upload-imagem', {
          method: 'POST',
          body: formData
        });
        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`Falha ao enviar imagem ${img.nomeArquivo}:`, errorText);
        } else {
            const texto = await resp.text();
            console.log(texto);
        }
      } catch (err) {
        console.error('Erro de rede ou ao enviar imagem:', err);
      }
    }

    imagensPendentes.length = 0; // limpa após envio

    if (!salvamentoConcluido) {
      alert('Todas as alterações, incluindo exclusões de imagens, salvas com sucesso!');
      salvamentoConcluido = true;
    }

  } catch (err) {
    console.error('Erro geral ao salvar dados ou imagens:', err);
    if (!salvamentoConcluido) {
      alert('Ocorreu um erro ao salvar os dados! Verifique o console para mais detalhes.');
    }
  }
}

document.getElementById("btnSalvarTudo").addEventListener("click", salvarTudo);