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
    
    // Verificar cache primeiro
    const cache = verificarCacheCardapio();
    if (cache && cache.valido) {
      cardapioCompleto = cache.dados.cardapio;
      cardapioCarregado = true;
    } else {
      // Carrega todos os CSVs
      await Promise.all([
        carregarCSV("./CSVs/hamburgueres.csv", "hamburgueres"),
        carregarCSV("./CSVs/acompanhamentos.csv", "acompanhamentos"),
        carregarCSV("./CSVs/bebidas.csv", "bebidas")
      ]);
      cardapioCarregado = true;
      salvarCacheCardapio();
    }
    
    configurarEventListeners();
    carregarCategoria("hamburgueres");
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
    cardapioContainer.innerHTML = '<p class="sem-itens">Nenhum item disponível nesta categoria</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  itens.forEach(item => {
    const itemElement = document.createElement('section');
    itemElement.className = 'item-cardapio';
    itemElement.innerHTML = `
      <img src="${item.caminho_img || './assets/imagem-padrao.jpg'}" alt="${item.nome}" onerror="this.src='./assets/imagem-padrao.jpg'">
      <p>
        <strong>${item.nome}</strong><br>
        R$ ${item.preco.toFixed(2)}
      </p>
      <input type="number" data-id="${item.idUnico}" class="quantidade" min="0" value="${pedidos[item.idUnico.split('_')[0]]?.[item.id] || 0}">
    `;
    fragment.appendChild(itemElement);
  });

  cardapioContainer.appendChild(fragment);
  configurarEventListenersQuantidade();
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
    atualizarQuantidade.call(input);
  }
}

function atualizarQuantidade() {
  const idCompleto = this.dataset.id;
  const [categoria, idItem] = idCompleto.split("_");
  const quantidade = parseInt(this.value) || 0;

  if (quantidade > 0) {
    pedidos[categoria][idItem] = quantidade;
  } else {
    delete pedidos[categoria][idItem];
  }
  
  mostrarQuantidadeNoConsole();
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
  const indiceImagem = cabecalhos.indexOf('caminho_img');

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
      
      if (cardapioCarregado) {
        carregarCategoria(categoria);
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

function mostrarModal(mensagem) {
  alert(mensagem); // Substituir por um modal mais elegante se necessário
}