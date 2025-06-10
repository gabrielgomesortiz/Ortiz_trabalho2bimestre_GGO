// ========== VARIÁVEIS GLOBAIS ==========
const PEDIDO_KEY = 'pedidoAtual';
const CACHE_KEY = 'cardapioCache';
const CACHE_EXPIRATION = 3600000; // 1 hora em milissegundos
let cardapioCompleto = {};
let pedidos = {
  hamburgueres: {},
  acompanhamentos: {},
  bebidas: {},
};
let categoriaAtual = "hamburgueres";
let cardapioCarregado = false;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  inicializarAplicacao();
});

window.addEventListener('beforeunload', () => {
  limparPedidos();
});

function limparPedidos() {
  // Só limpa os pedidos se não houver um pedido salvo na sessionStorage
  if (!sessionStorage.getItem(PEDIDO_KEY)) {
    pedidos = {
      hamburgueres: {},
      acompanhamentos: {},
      bebidas: {},
    };
  }
}
async function inicializarAplicacao() {
  try {
    // Carrega pedidos salvos se existirem
    carregarPedidosSalvos();
    
    // Sempre começar com hambúrgueres
    categoriaAtual = "hamburgueres";
    
    // Carrega apenas hambúrgueres inicialmente
    await carregarCSV("./CSVs/hamburgue.csv", "hamburgueres");
    
    // Configura listeners e mostra hambúrgueres
    configurarEventListeners();
    carregarCategoria("hamburgueres");
    
    // Carrega as outras categorias em segundo plano
    carregarOutrasCategoriasEmSegundoPlano();
  } catch (error) {
    console.error("Erro na inicialização:", error);
    mostrarErroCarregamento();
  }
}

function carregarPedidosSalvos() {
  const pedidoSalvo = sessionStorage.getItem(PEDIDO_KEY);
  if (pedidoSalvo) {
    try {
      const pedido = JSON.parse(pedidoSalvo);
      
      // Resetar pedidos atuais
      pedidos = {
        hamburgueres: {},
        acompanhamentos: {},
        bebidas: {},
      };
      
      // Recriar a estrutura de pedidos a partir do pedido salvo
      for (const categoria in pedido.pedidos) {
        if (pedido.pedidos[categoria]) {
          pedido.pedidos[categoria].forEach(item => {
            pedidos[categoria][item.id] = item.quantidade;
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar pedido salvo:', e);
    }
  }
}

function carregarOutrasCategoriasEmSegundoPlano() {
  Promise.all([
    carregarCSV("./CSVs/acompanhamentos.csv", "acompanhamentos"),
    carregarCSV("./CSVs/bebidas.csv", "bebidas")
  ]).then(() => {
    cardapioCarregado = true;
    salvarCacheCardapio();
  }).catch(error => {
    console.error("Erro ao carregar outras categorias:", error);
  });
}

// ========== FUNÇÕES DE CACHE ==========
function verificarCacheCardapio() {
  const cacheData = localStorage.getItem(CACHE_KEY);
  if (!cacheData) return null;

  try {
    const { timestamp, dados } = JSON.parse(cacheData);
    const agora = new Date().getTime();

    if (agora - timestamp < CACHE_EXPIRATION) {
      return { valido: true, dados };
    }
  } catch (e) {
    console.error('Erro ao ler cache:', e);
  }

  return null;
}

function salvarCacheCardapio() {
  const cacheData = {
    timestamp: new Date().getTime(),
    dados: {
      cardapio: cardapioCompleto,
      categoriaAtual
    }
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

// ========== FUNÇÕES DE CARREGAMENTO ==========
async function carregarCSV(nomeArquivo, categoria) {
  try {
    const response = await fetch(nomeArquivo);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.text();
    processarCSV(data, categoria);
    return true;
  } catch (error) {
    console.error(`Erro ao carregar ${nomeArquivo}:`, error);
    throw error;
  }
}

function carregarCategoria(categoria) {
  categoriaAtual = categoria;
  
  const itensCardapio = Object.keys(cardapioCompleto)
    .filter(key => key.startsWith(categoria))
    .map(key => ({
      ...cardapioCompleto[key],
      idUnico: key,
      id: key.split('_')[1]
    }));

  gerarCardapio(itensCardapio);
}

// ========== FUNÇÕES DE INTERFACE ==========
function menu() {
  const listaMenu = document.querySelector(".menu__opcoes");
  const menu = document.querySelector("#menu");

  listaMenu.style.display = listaMenu.style.display === "block" ? "none" : "block";
  menu.style.border = listaMenu.style.display === "block" ? "1px solid black" : "none";
}

function gerarCardapio(itens) {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.innerHTML = "";

  if (itens.length === 0) {
    cardapioContainer.innerHTML = '<p class="sem-itens">Carregando itens...</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  itens.forEach(item => {
    const itemElement = document.createElement('section');
    itemElement.className = 'item-cardapio';
    itemElement.innerHTML = `
      <img src="${item.caminho_img}" alt="${item.nome}" onerror="this.src='./assets/imagem-padrao.jpg'">
      <p>
        <strong>${item.nome}</strong><br>
        R$ ${item.preco.toFixed(2)}
      </p>
      <input type="number" data-id="${item.idUnico}" class="quantidade" min="0">
    `;
    fragment.appendChild(itemElement);
  });

  cardapioContainer.appendChild(fragment);
  configurarEventListenersQuantidade();
  atualizarQuantidadesNosInputs();
}

function configurarEventListenersQuantidade() {
  document.querySelectorAll('.quantidade').forEach(input => {
    input.addEventListener('change', atualizarQuantidade);
    input.addEventListener('blur', validarQuantidade);
  });
}

function validarQuantidade(e) {
  const input = e.target;
  const value = parseInt(input.value);
  
  if (isNaN(value) || value < 0) {
    input.value = "0";
    input.dispatchEvent(new Event('change'));
  }
}

function atualizarQuantidadesNosInputs() {
  document.querySelectorAll('.quantidade').forEach(input => {
    const idCompleto = input.dataset.id;
    const [categoria, idItem] = idCompleto.split('_');

    input.value = pedidos[categoria]?.[idItem] || "";
  });
}



function atualizarQuantidade() {
  const idCompleto = this.dataset.id;
  const [categoria, idItem] = idCompleto.split("_");
  const quantidade = parseInt(this.value) || 0;

  atualizarPedido(categoria, idItem, quantidade);
  mostrarQuantidadeNoConsole();
}

function atualizarPedido(categoria, idItem, quantidade) {
  if (quantidade > 0) {
    pedidos[categoria][idItem] = quantidade;
  } else {
    delete pedidos[categoria][idItem];
  }
}

function mostrarQuantidadeNoConsole() {
  let totalItens = 0;
  for (const categoria in pedidos) {
    totalItens += Object.values(pedidos[categoria]).reduce((sum, qtd) => sum + qtd, 0);
  }
  console.log(`Total de itens no pedido: ${totalItens}`);
}

function temPedidos() {
  return Object.values(pedidos).some(categoria => Object.keys(categoria).length > 0);
}

function gerarJSONPedido() {
  if (!temPedidos()) {
    mostrarModal("Por favor, adicione itens ao seu pedido antes de finalizar!");
    return false;
  }

  const pedidoFinal = {
    data: new Date().toLocaleString('pt-BR'),
    pedidos: {},
    totalGeral: 0,
    itensTotais: 0
  };

  for (const categoria in pedidos) {
    if (Object.keys(pedidos[categoria]).length === 0) continue;

    pedidoFinal.pedidos[categoria] = [];

    for (const idItem in pedidos[categoria]) {
      const idCompleto = `${categoria}_${idItem}`;
      const quantidade = pedidos[categoria][idItem];

      if (cardapioCompleto[idCompleto]) {
        const itemInfo = cardapioCompleto[idCompleto];
        const precoTotal = parseFloat((itemInfo.preco * quantidade).toFixed(2));

        pedidoFinal.pedidos[categoria].push({
          id: idItem,
          nome: itemInfo.nome,
          precoUnitario: itemInfo.preco,
          quantidade: quantidade,
          precoTotal: precoTotal,
        });

        pedidoFinal.totalGeral += precoTotal;
        pedidoFinal.itensTotais += quantidade;
      }
    }
  }

  pedidoFinal.totalGeral = parseFloat(pedidoFinal.totalGeral.toFixed(2));
  sessionStorage.setItem(PEDIDO_KEY, JSON.stringify(pedidoFinal));
  window.location.href = "./html/conta.html";
  return true;
}
// ========== PROCESSAMENTO DE CSV ==========
function processarCSV(csvData, categoria) {
  const linhas = csvData.trim().split("\n");
  if (linhas.length < 2) return;

  const cabecalhos = linhas[0].split(";").map(h => h.trim());
  const indiceId = cabecalhos.indexOf('id');
  const indiceNome = cabecalhos.indexOf('nome');
  const indicePreco = cabecalhos.indexOf('preco');
  const indiceImagem = cabecalhos.indexOf('caminho__img');

  if ([indiceId, indiceNome, indicePreco, indiceImagem].some(i => i === -1)) {
    console.error(`CSV da categoria ${categoria} está com formato incorreto`);
    return;
  }

  for (let i = 1; i < linhas.length; i++) {
    if (!linhas[i].trim()) continue;

    const valores = linhas[i].split(";").map(v => v.trim());
    const id = valores[indiceId];
    const nome = valores[indiceNome];
    const preco = parseFloat(valores[indicePreco]);
    const caminho_img = valores[indiceImagem];

    if (!id || !nome || isNaN(preco)) continue;

    const idUnico = `${categoria}_${id}`;

    cardapioCompleto[idUnico] = {
      nome,
      preco,
      caminho_img,
      categoria
    };
  }
}

// ========== CONFIGURAÇÃO DE EVENTOS ==========
function configurarEventListeners() {
  // Navegação entre categorias
  document.querySelectorAll('.cabecalho__nav .comidas').forEach(botao => {
    botao.addEventListener('click', function() {
      const categoria = this.id === 'hamburguer' ? 'hamburgueres' :
                      this.id === 'porcoes' ? 'acompanhamentos' : 'bebidas';
      
      if (cardapioCarregado || Object.keys(cardapioCompleto).length > 0) {
        carregarCategoria(categoria);
      } else {
        categoriaAtual = categoria;
        carregarCSV(`./CSVs/${categoria}.csv`, categoria);
      }
    });
  });

  // Formulário de pedido
  document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();
    gerarJSONPedido();
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.cabecalho__menu')) {
      const listaMenu = document.querySelector(".menu__opcoes");
      const menu = document.querySelector("#menu");

      if (listaMenu.style.display === 'block') {
        listaMenu.style.display = 'none';
        menu.style.border = 'none';
      }
    }
  });
}

function mostrarErroCarregamento() {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.innerHTML = `
    <div class="erro-carregamento">
      <p>Não foi possível carregar o cardápio. Por favor, tente recarregar a página.</p>
      <button onclick="location.reload()">Recarregar</button>
    </div>
  `;
}



/*// ========== VARIÁVEIS GLOBAIS ==========
const PEDIDO_KEY = 'pedidoAtual';
const CACHE_KEY = 'cardapioCache';
const CACHE_EXPIRATION = 3600000; // 1 hora em milissegundos
let cardapioCompleto = {};
let pedidos = {
  hamburgueres: {},
  acompanhamentos: {},
  bebidas: {},
};
let categoriaAtual = "hamburgueres";
let cardapioCarregado = false;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  inicializarAplicacao();
});

window.addEventListener('beforeunload', () => {
  limparPedidos();
});

function limparPedidos() {
  if (!sessionStorage.getItem(PEDIDO_KEY)) {
    pedidos = {
      hamburgueres: {},
      acompanhamentos: {},
      bebidas: {},
    };
  }
}

async function inicializarAplicacao() {
  try {
    carregarPedidosSalvos();
    categoriaAtual = "hamburgueres";
    
    // Carrega todos os produtos de uma vez
    await carregarCSV("./CSVs/produtos.csv");
    
    configurarEventListeners();
    carregarCategoria("hamburgueres");
    cardapioCarregado = true;
    salvarCacheCardapio();
  } catch (error) {
    console.error("Erro na inicialização:", error);
    mostrarErroCarregamento();
  }
}

function carregarPedidosSalvos() {
  const pedidoSalvo = sessionStorage.getItem(PEDIDO_KEY);
  if (pedidoSalvo) {
    try {
      const pedido = JSON.parse(pedidoSalvo);
      
      pedidos = {
        hamburgueres: {},
        acompanhamentos: {},
        bebidas: {},
      };
      
      for (const categoria in pedido.pedidos) {
        if (pedido.pedidos[categoria]) {
          pedido.pedidos[categoria].forEach(item => {
            pedidos[categoria][item.id] = item.quantidade;
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar pedido salvo:', e);
    }
  }
}

// ========== FUNÇÕES DE CACHE ==========
function verificarCacheCardapio() {
  const cacheData = localStorage.getItem(CACHE_KEY);
  if (!cacheData) return null;

  try {
    const { timestamp, dados } = JSON.parse(cacheData);
    const agora = new Date().getTime();

    if (agora - timestamp < CACHE_EXPIRATION) {
      return { valido: true, dados };
    }
  } catch (e) {
    console.error('Erro ao ler cache:', e);
  }

  return null;
}

function salvarCacheCardapio() {
  const cacheData = {
    timestamp: new Date().getTime(),
    dados: {
      cardapio: cardapioCompleto,
      categoriaAtual
    }
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

// ========== FUNÇÕES DE CARREGAMENTO ==========
async function carregarCSV(nomeArquivo) {
  try {
    const response = await fetch(nomeArquivo);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.text();
    processarCSV(data);
    return true;
  } catch (error) {
    console.error(`Erro ao carregar ${nomeArquivo}:`, error);
    throw error;
  }
}

function carregarCategoria(categoria) {
  categoriaAtual = categoria;
  
  const itensCardapio = Object.keys(cardapioCompleto)
    .filter(key => cardapioCompleto[key].categoria === categoria.replace('es', '')) // Remove 'es' para hamburgueres -> hamburguer
    .map(key => ({
      ...cardapioCompleto[key],
      idUnico: key,
      id: key.split('_')[1]
    }));

  gerarCardapio(itensCardapio);
}

// ========== FUNÇÕES DE INTERFACE ==========
function menu() {
  const listaMenu = document.querySelector(".menu__opcoes");
  const menu = document.querySelector("#menu");

  listaMenu.style.display = listaMenu.style.display === "block" ? "none" : "block";
  menu.style.border = listaMenu.style.display === "block" ? "1px solid black" : "none";
}

function gerarCardapio(itens) {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.innerHTML = "";

  if (itens.length === 0) {
    cardapioContainer.innerHTML = '<p class="sem-itens">Carregando itens...</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  itens.forEach(item => {
    const itemElement = document.createElement('section');
    itemElement.className = 'item-cardapio';
    itemElement.innerHTML = `
      <img src="${item.caminho__img}" alt="${item.nome}" onerror="this.src='./assets/imagem-padrao.jpg'">
      <p>
        <strong>${item.nome}</strong><br>
        R$ ${item.preco.toFixed(2)}
      </p>
      <input type="number" data-id="${item.idUnico}" class="quantidade" min="0">
    `;
    fragment.appendChild(itemElement);
  });

  cardapioContainer.appendChild(fragment);
  configurarEventListenersQuantidade();
  atualizarQuantidadesNosInputs();
}

function configurarEventListenersQuantidade() {
  document.querySelectorAll('.quantidade').forEach(input => {
    input.addEventListener('change', atualizarQuantidade);
    input.addEventListener('blur', validarQuantidade);
  });
}

function validarQuantidade(e) {
  const input = e.target;
  const value = parseInt(input.value);
  
  if (isNaN(value) || value < 0) {
    input.value = "0";
    input.dispatchEvent(new Event('change'));
  }
}

function atualizarQuantidadesNosInputs() {
  document.querySelectorAll('.quantidade').forEach(input => {
    const idCompleto = input.dataset.id;
    const [categoria, idItem] = idCompleto.split('_');

    input.value = pedidos[categoria]?.[idItem] || "";
  });
}

function atualizarQuantidade() {
  const idCompleto = this.dataset.id;
  const [categoria, idItem] = idCompleto.split("_");
  const quantidade = parseInt(this.value) || 0;

  atualizarPedido(categoria, idItem, quantidade);
  mostrarQuantidadeNoConsole();
}

function atualizarPedido(categoria, idItem, quantidade) {
  if (quantidade > 0) {
    pedidos[categoria][idItem] = quantidade;
  } else {
    delete pedidos[categoria][idItem];
  }
}

function mostrarQuantidadeNoConsole() {
  let totalItens = 0;
  for (const categoria in pedidos) {
    totalItens += Object.values(pedidos[categoria]).reduce((sum, qtd) => sum + qtd, 0);
  }
  console.log(`Total de itens no pedido: ${totalItens}`);
}

function temPedidos() {
  return Object.values(pedidos).some(categoria => Object.keys(categoria).length > 0);
}

function gerarJSONPedido() {
  if (!temPedidos()) {
    mostrarModal("Por favor, adicione itens ao seu pedido antes de finalizar!");
    return false;
  }

  const pedidoFinal = {
    data: new Date().toLocaleString('pt-BR'),
    pedidos: {},
    totalGeral: 0,
    itensTotais: 0
  };

  for (const categoria in pedidos) {
    if (Object.keys(pedidos[categoria]).length === 0) continue;

    pedidoFinal.pedidos[categoria] = [];

    for (const idItem in pedidos[categoria]) {
      const idCompleto = `${categoria}_${idItem}`;
      const quantidade = pedidos[categoria][idItem];

      if (cardapioCompleto[idCompleto]) {
        const itemInfo = cardapioCompleto[idCompleto];
        const precoTotal = parseFloat((itemInfo.preco * quantidade).toFixed(2));

        pedidoFinal.pedidos[categoria].push({
          id: idItem,
          nome: itemInfo.nome,
          precoUnitario: itemInfo.preco,
          quantidade: quantidade,
          precoTotal: precoTotal,
        });

        pedidoFinal.totalGeral += precoTotal;
        pedidoFinal.itensTotais += quantidade;
      }
    }
  }

  pedidoFinal.totalGeral = parseFloat(pedidoFinal.totalGeral.toFixed(2));
  sessionStorage.setItem(PEDIDO_KEY, JSON.stringify(pedidoFinal));
  window.location.href = "./html/conta.html";
  return true;
}

// ========== PROCESSAMENTO DE CSV ==========
function processarCSV(csvData) {
  const linhas = csvData.trim().split("\n");
  if (linhas.length < 2) return;

  const cabecalhos = linhas[0].split(";").map(h => h.trim());
  const indiceId = cabecalhos.indexOf('id');
  const indiceNome = cabecalhos.indexOf('nome');
  const indicePreco = cabecalhos.indexOf('preco');
  const indiceImagem = cabecalhos.indexOf('caminho__img');
  const indiceCategoria = cabecalhos.indexOf('categoria');

  if ([indiceId, indiceNome, indicePreco, indiceImagem, indiceCategoria].some(i => i === -1)) {
    console.error("CSV está com formato incorreto");
    return;
  }

  for (let i = 1; i < linhas.length; i++) {
    if (!linhas[i].trim()) continue;

    const valores = linhas[i].split(";").map(v => v.trim());
    const id = valores[indiceId];
    const nome = valores[indiceNome];
    const preco = parseFloat(valores[indicePreco]);
    const caminho__img = valores[indiceImagem];
    const categoria = valores[indiceCategoria];

    if (!id || !nome || isNaN(preco) || !categoria) continue;

    // Mapeia as categorias para o formato usado no código
    let categoriaCodigo;
    if (categoria === 'hamburguer') categoriaCodigo = 'hamburgueres';
    else if (categoria === 'acompanhamento') categoriaCodigo = 'acompanhamentos';
    else if (categoria === 'bebida') categoriaCodigo = 'bebidas';
    else continue;

    const idUnico = `${categoriaCodigo}_${id}`;

    cardapioCompleto[idUnico] = {
      nome,
      preco,
      caminho__img,
      categoria
    };
  }
}

// ========== CONFIGURAÇÃO DE EVENTOS ==========
function configurarEventListeners() {
  // Navegação entre categorias
  document.querySelectorAll('.cabecalho__nav .comidas').forEach(botao => {
    botao.addEventListener('click', function() {
      const categoria = this.id === 'hamburguer' ? 'hamburgueres' :
                      this.id === 'porcoes' ? 'acompanhamentos' : 'bebidas';
      
      carregarCategoria(categoria);
    });
  });

  // Formulário de pedido
  document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();
    gerarJSONPedido();
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.cabecalho__menu')) {
      const listaMenu = document.querySelector(".menu__opcoes");
      const menu = document.querySelector("#menu");

      if (listaMenu.style.display === 'block') {
        listaMenu.style.display = 'none';
        menu.style.border = 'none';
      }
    }
  });
}

function mostrarErroCarregamento() {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.innerHTML = `
    <div class="erro-carregamento">
      <p>Não foi possível carregar o cardápio. Por favor, tente recarregar a página.</p>
      <button onclick="location.reload()">Recarregar</button>
    </div>
  `;
}*/