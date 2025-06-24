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
  // Verifica se há um pedido em andamento
  const pedidoSalvo = localStorage.getItem(PEDIDO_KEY);
  if (pedidoSalvo) {
    try {
      const pedido = JSON.parse(pedidoSalvo);
      // Restaura as quantidades dos itens
      for (const categoria in pedido.pedidos) {
        if (pedido.pedidos[categoria]) {
          pedido.pedidos[categoria].forEach(item => {
            if (pedidos[categoria]) {
              pedidos[categoria][item.id] = item.quantidade;
            }
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar pedido salvo:', e);
    }
  }
  
  // Restante do seu código de inicialização...
  carregarPedidosSalvos();
  categoriaAtual = "hamburgueres";
  await carregarCSV("./CSVs/produtos.csv");
  configurarEventListeners();
  carregarCategoria("hamburgueres");
  cardapioCarregado = true;
  salvarCacheCardapio();
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
      sessionStorage.removeItem(PEDIDO_KEY); // Limpa o pedido corrompido
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
  }
  catch (error) {
    console.error(`Erro ao carregar ${nomeArquivo}:`, error);
    throw error;
  }
}

function carregarCategoria(categoria) {
  categoriaAtual = categoria;

  // O filtro agora compara com a categoria EXATA que está no CSV
  const itensCardapio = Object.keys(cardapioCompleto)
    .filter(key => {
      // Obtenha a categoria do item no cardapioCompleto
      const itemCategoria = cardapioCompleto[key].categoria;
      // Mapeie a categoria do botão para a categoria do CSV
      switch (categoria) {
        case 'hamburgueres': return itemCategoria === 'hamburguer';
        case 'acompanhamentos': return itemCategoria === 'acompanhamento';
        case 'bebidas': return itemCategoria === 'bebida';
        default: return false;
      }
    })
    .map(key => ({
      ...cardapioCompleto[key],
      idUnico: key,
      id: key.split('_')[1] // Garante que o 'id' simples também está disponível
    }));

  gerarCardapio(itensCardapio);
}

// ========== FUNÇÕES DE INTERFACE ==========
function menu() {
  const listaMenu = document.querySelector(".menu__opcoes");
  const menuBtn = document.querySelector("#menu");

  listaMenu.style.display = listaMenu.style.display === "block" ? "none" : "block";
  menuBtn.style.border = listaMenu.style.display === "block" ? "1px solid black" : "none";
}

// Única e correta implementação da função gerarCardapio
function gerarCardapio(itens) {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.innerHTML = ""; // Limpa o conteúdo existente

  if (!itens || itens.length === 0) {
    cardapioContainer.innerHTML = '<p class="sem-itens">Nenhum item encontrado nesta categoria.</p>';
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

    // Mude a linha abaixo para usar uma string vazia ''
    input.value = pedidos[categoria]?.[idItem] || ''; // Alterado de 0 para ''
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
  if (!pedidos[categoria]) {
    pedidos[categoria] = {}; // Inicializa a subcategoria se ainda não existir
  }
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

// Funções para Modal - Adicionado aqui para garantir que existe
function mostrarModal(mensagem) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'simple-modal-overlay';
    modalContainer.innerHTML = `
            <div class="simple-modal-content">
                <p>${mensagem}</p>
                <button onclick="document.querySelector('.simple-modal-overlay').remove()">OK</button>
            </div>
        `;
    document.body.appendChild(modalContainer);

    // Estilos básicos para o modal (você pode transferir para um CSS, se quiser)
    const style = document.createElement('style');
    style.textContent = `
            .simple-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .simple-modal-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                max-width: 300px;
            }
            .simple-modal-content button {
                margin-top: 15px;
                padding: 8px 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .simple-modal-content button:hover {
                background-color: #0056b3;
            }
        `;
    document.head.appendChild(style);
}

function gerarJSONPedido() {
  // NOVO: Verifica se o usuário está logado antes de finalizar o pedido
  const usuarioStr = getCookie("usuario");
  if (!usuarioStr) {
    mostrarModal("Você precisa estar logado para finalizar seu pedido!");
    // Opcional: Redirecionar para a página de login
    // window.location.href = 'http://localhost:3001/html/login.html';
    return false; // Impede a continuação do processo
  }

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
  localStorage.setItem(PEDIDO_KEY, JSON.stringify(pedidoFinal));
  window.location.href = "./html/conta.html";
  return true;
}

// ========== PROCESSAMENTO DE CSV ==========
function processarCSV(csvData) {
  const linhas = csvData.trim().split("\n");
  if (linhas.length < 2) {
    console.error("CSV não possui dados suficientes.");
    return;
  }

  const cabecalhos = linhas[0].split(";").map(h => h.trim());
  const indiceId = cabecalhos.indexOf('id');
  const indiceNome = cabecalhos.indexOf('nome');
  const indicePreco = cabecalhos.indexOf('preco');
  const indiceImagem = cabecalhos.indexOf('caminho__img');
  const indiceCategoria = cabecalhos.indexOf('categoria');

  if ([indiceId, indiceNome, indicePreco, indiceImagem, indiceCategoria].some(i => i === -1)) {
    console.error("CSV está com formato incorreto. Verifique os cabeçalhos.");
    return;
  }

  cardapioCompleto = {}; // Limpa o cardápio antes de processar

  for (let i = 1; i < linhas.length; i++) {
    if (!linhas[i].trim()) continue;

    const valores = linhas[i].split(";").map(v => v.trim());
    const id = valores[indiceId];
    // CORRIGIDO: Era 'indiceIndiceNome', agora é 'indiceNome'
    const nome = valores[indiceNome]; 
    const preco = parseFloat(valores[indicePreco].replace(',', '.'));
    const caminho__img = valores[indiceImagem];
    const categoriaCSV = valores[indiceCategoria]; // Categoria exata do CSV

    if (!id || !nome || isNaN(preco) || !categoriaCSV) {
      console.warn(`Linha CSV inválida ignorada: "${linhas[i]}"`);
      continue;
    }

    // Mapeia a categoria do CSV para a chave de categoria no objeto 'pedidos'
    let categoriaParaPedidos;
    switch (categoriaCSV) {
      case 'hamburguer':
        categoriaParaPedidos = 'hamburgueres';
        break;
      case 'acompanhamento':
        categoriaParaPedidos = 'acompanhamentos';
        break;
      case 'bebida':
        categoriaParaPedidos = 'bebidas';
        break;
      default:
        console.warn(`Categoria desconhecida ignorada: "${categoriaCSV}" para o item "${nome}"`);
        continue; // Ignora categorias desconhecidas
    }

    // O idUnico deve usar a categoria que corresponde à estrutura de 'pedidos'
    const idUnico = `${categoriaParaPedidos}_${id}`;

    // Adiciona o item ao cardápio completo, mantendo a categoria original do CSV
    if (!cardapioCompleto[idUnico]) {
      cardapioCompleto[idUnico] = {
        id,
        nome,
        preco,
        caminho__img,
        categoria: categoriaCSV // Importante: armazena a categoria como está no CSV
      };
    } else {
      console.warn(`Item duplicado com ID único: ${idUnico}. A primeira ocorrência será mantida.`);
    }
  }

  console.log('Cardápio processado:', cardapioCompleto);
}

// ========== CONFIGURAÇÃO DE EVENTOS ==========
function configurarEventListeners() {
  // Navegação entre categorias
  document.querySelectorAll('.cabecalho__nav .comidas').forEach(botao => {
    botao.addEventListener('click', function () {
      // Os IDs dos botões ('hamburguer', 'porcoes', 'bebidas')
      // já correspondem bem às categorias que queremos carregar.
      const categoria = this.id === 'hamburguer' ? 'hamburgueres' :
        this.id === 'porcoes' ? 'acompanhamentos' : 'bebidas';

      carregarCategoria(categoria);
    });
  });

  // Formulário de pedido
  document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    gerarJSONPedido();
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', function (e) {
    const menuElement = document.querySelector("#menu");
    const listaMenu = document.querySelector(".menu__opcoes");

    if (!menuElement.contains(e.target) && !listaMenu.contains(e.target)) {
      if (listaMenu.style.display === 'block') {
        listaMenu.style.display = 'none';
        menuElement.style.border = 'none';
      }
    }
  });
}

function mostrarErroCarregamento() {
  const cardapioContainer = document.querySelector(".cardapio");
  if (cardapioContainer) {
    cardapioContainer.innerHTML = '<p class="sem-itens" style="color: red;">Erro ao carregar o cardápio. Por favor, tente novamente mais tarde.</p>';
  }
}

// Função auxiliar para ler cookies
function getCookie(nome) {
  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nome}=`);
  if (partes.length === 2) return partes.pop().split(';').shift();
  return null; // Retorna null se o cookie não for encontrado
}

// ========== LÓGICA DE EXIBIÇÃO DE INFORMAÇÕES DO USUÁRIO LOGADO (MODIFICADO) ==========
window.onload = () => {
  const usuarioStr = getCookie("usuario");
  const userDiv = document.querySelector(".user"); // Referência ao div.user existente

  if (userDiv) { // Verifica se o elemento .user existe no HTML
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(decodeURIComponent(usuarioStr));
        // Se o usuário estiver logado, substitui o conteúdo do div.user
        userDiv.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 20px;
            background-color: #f0f0f0; /* Um fundo suave para o status */
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            <span style="font-size: 1.2em;">${usuario.icone || '👤'} <br> </span>
            <span style="font-weight: bold; color: #333;"> ${usuario.nome}</span>
          </div>
        `;
        console.log('Dados do usuário logado carregados do cookie:', usuario);

      } catch (e) {
        console.error("Erro ao ler ou parsear o cookie do usuário:", e);
        // Em caso de erro com o cookie, restaura os botões de login
        renderLoginButtons(userDiv);
      }
    } else {
      // Se não houver cookie, garante que os botões de login/cadastro estejam visíveis
      renderLoginButtons(userDiv);
      console.log('Nenhum cookie de usuário encontrado. O usuário não está logado.');
    }
  } else {
    console.warn('Elemento com classe "user" não encontrado no DOM. O status do usuário não será exibido.');
  }
};

// Função auxiliar para renderizar os botões de login/cadastro
function renderLoginButtons(containerElement) {
  containerElement.innerHTML = `
    <button class="criar_entrar_conta" onclick="window.location.href='http://localhost:3001/html/sinup.html'">
      Criar Conta
    </button>
    <button class="criar_entrar_conta" onclick="window.location.href='http://localhost:3001/html/login.html'">
      Entrar
    </button>
  `;
}
