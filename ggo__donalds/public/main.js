// ========== VARIÁVEIS GLOBAIS ==========
const PEDIDO_KEY = 'pedidoAtual';
let cardapioCompleto = {};
let pedidos = {
  hamburgueres: {},
  acompanhamentos: {},
  bebidas: {},
};
let categoriaAtual = "hamburgueres";
let cardapioCarregado = false;

document.addEventListener('DOMContentLoaded', inicializarAplicacao);

function inicializarAplicacao() {
  carregarPedidosSalvosLocalStorage();
  categoriaAtual = "hamburgueres";

  carregarCSV("./CSVs/produtos.csv")
    .then(() => {
      console.log('Cardápio carregado diretamente do CSV.');
      configurarEventListeners();
      carregarCategoria(categoriaAtual);
      cardapioCarregado = true;
    })
    .catch((error) => {
      console.error('Falha ao carregar o cardápio:', error);
      mostrarErroCarregamento();
    });
}

function carregarPedidosSalvosLocalStorage() {
  const pedidoSalvo = localStorage.getItem(PEDIDO_KEY);
  if (pedidoSalvo) {
    try {
      const parsedPedido = JSON.parse(pedidoSalvo);
      pedidos = { hamburgueres: {}, acompanhamentos: {}, bebidas: {} };

      for (const categoria in parsedPedido.pedidos) {
        parsedPedido.pedidos[categoria]?.forEach(item => {
          if (pedidos[categoria]) pedidos[categoria][item.id] = item.quantidade;
        });
      }
    } catch (e) {
      console.error('Erro ao carregar pedido salvo do localStorage:', e);
      localStorage.removeItem(PEDIDO_KEY);
    }
  }
}

async function carregarCSV(nomeArquivo) {
  const response = await fetch(nomeArquivo);
  if (!response.ok) throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
  const data = await response.text();
  processarCSV(data);
}

function processarCSV(csvData) {
  const linhas = csvData.trim().split("\n");
  const cabecalhos = linhas[0].split(";").map(h => h.trim());
  const headerMap = {
    id: cabecalhos.indexOf('id'),
    nome: cabecalhos.indexOf('nome'),
    preco: cabecalhos.indexOf('preco'),
    caminho__img: cabecalhos.indexOf('caminho__img'),
    categoria: cabecalhos.indexOf('categoria')
  };

  cardapioCompleto = {};

  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(";").map(v => v.trim());
    const id = valores[headerMap.id];
    const nome = valores[headerMap.nome];
    const preco = parseFloat(valores[headerMap.preco].replace(',', '.'));
    const caminho__img = valores[headerMap.caminho__img];
    const categoriaCSV = valores[headerMap.categoria];

    let categoriaParaPedidos;
    switch (categoriaCSV) {
      case 'hamburguer': categoriaParaPedidos = 'hamburgueres'; break;
      case 'acompanhamento': categoriaParaPedidos = 'acompanhamentos'; break;
      case 'bebida': categoriaParaPedidos = 'bebidas'; break;
      default: continue;
    }

    const idUnico = `${categoriaParaPedidos}_${id}`;
    cardapioCompleto[idUnico] = { id, nome, preco, caminho__img, categoria: categoriaCSV };
  }
}

function carregarCategoria(categoria) {
  categoriaAtual = categoria;
  const itensCardapio = Object.keys(cardapioCompleto)
    .filter(key => {
      const cat = cardapioCompleto[key].categoria;
      return (
        (categoria === 'hamburgueres' && cat === 'hamburguer') ||
        (categoria === 'acompanhamentos' && cat === 'acompanhamento') ||
        (categoria === 'bebidas' && cat === 'bebida')
      );
    })
    .map(key => ({
      ...cardapioCompleto[key],
      idUnico: key,
      id: key.split('_')[1]
    }));

  gerarCardapio(itensCardapio);
}

function gerarCardapio(itens) {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.innerHTML = "";

  if (!itens.length) {
    cardapioContainer.innerHTML = '<p class="sem-itens">Nenhum item encontrado nesta categoria.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  itens.forEach(item => {
    const itemElement = document.createElement('section');
    itemElement.className = 'item-cardapio';
    itemElement.innerHTML = `
      <img src="${item.caminho__img}" alt="${item.nome}" onerror="this.src='./assets/imagem-padrao.jpg'">
      <p><strong>${item.nome}</strong><br>R$ ${item.preco.toFixed(2)}</p>
      <input type="number" data-id="${item.idUnico}" class="quantidade">
    `;
    fragment.appendChild(itemElement);
  });

  cardapioContainer.appendChild(fragment);
  configurarEventListenersQuantidade();
  atualizarQuantidadesNosInputs();
}

function configurarEventListenersQuantidade() {
  const cardapioContainer = document.querySelector(".cardapio");
  cardapioContainer.addEventListener('change', e => {
    if (e.target.classList.contains('quantidade')) atualizarQuantidade.call(e.target);
  });
  cardapioContainer.addEventListener('blur', e => {
    if (e.target.classList.contains('quantidade')) validarQuantidade.call(e.target);
  }, true);
}

function atualizarQuantidadesNosInputs() {
  document.querySelectorAll('.quantidade').forEach(input => {
    const [categoria, idItem] = input.dataset.id.split('_');
    input.value = pedidos[categoria]?.[idItem] || '';
  });
}

function atualizarQuantidade() {
  const [categoria, idItem] = this.dataset.id.split("_");
  const quantidade = parseInt(this.value) || 0;

  if (!pedidos[categoria]) pedidos[categoria] = {};
  if (quantidade > 0) pedidos[categoria][idItem] = quantidade;
  else delete pedidos[categoria][idItem];
}

function validarQuantidade() {
  const value = parseInt(this.value);
  if (isNaN(value) || value < 0) this.value = "0";
}

function configurarEventListeners() {
  document.querySelectorAll('.cabecalho__nav .comidas').forEach(botao => {
    botao.addEventListener('click', function () {
      const map = {
        'hamburguer': 'hamburgueres',
        'porcoes': 'acompanhamentos',
        'bebidas': 'bebidas'
      };
      carregarCategoria(map[this.id]);
    });
  });

  document.querySelector("#menu")?.addEventListener('click', () => {
    const lista = document.querySelector(".menu__opcoes");
    const menuBtn = document.querySelector("#menu");
    const visivel = lista.style.display === "block";
    lista.style.display = visivel ? "none" : "block";
    menuBtn.style.border = visivel ? "none" : "1px solid black";
  });

  document.querySelector("form")?.addEventListener("submit", function (e) {
    e.preventDefault();
    gerarJSONPedido();
  });

  document.addEventListener('click', e => {
    const menuBtn = document.querySelector("#menu");
    const listaMenu = document.querySelector(".menu__opcoes");
    if (listaMenu.style.display === 'block' &&
        !menuBtn.contains(e.target) &&
        !listaMenu.contains(e.target)) {
      listaMenu.style.display = 'none';
      menuBtn.style.border = 'none';
    }
  });
}

function gerarJSONPedido() {
  const usuarioStr = getCookie("usuario");

  // Verifica se está logado
  if (!usuarioStr) {
    alert("Você precisa estar logado para visualizar conta!");
    return;
  }

  // Verifica se há produtos selecionados
  const pedidoTemItens = Object.values(pedidos).some(categoria => Object.keys(categoria).length > 0);
  if (!pedidoTemItens) {
    alert("Você precisa selecionar ao menos um produto!");
    return;
  }

  // Monta o pedido
  const pedidoFinal = {
    data: new Date().toLocaleString('pt-BR'),
    pedidos: {},
    totalGeral: 0,
    itensTotais: 0
  };

  for (const categoria in pedidos) {
    if (!Object.keys(pedidos[categoria]).length) continue;
    pedidoFinal.pedidos[categoria] = [];

    for (const idItem in pedidos[categoria]) {
      const idCompleto = `${categoria}_${idItem}`;
      const itemInfo = cardapioCompleto[idCompleto];
      const quantidade = pedidos[categoria][idItem];
      const precoTotal = parseFloat((itemInfo.preco * quantidade).toFixed(2));

      pedidoFinal.pedidos[categoria].push({
        id: idItem,
        nome: itemInfo.nome,
        precoUnitario: itemInfo.preco,
        quantidade,
        precoTotal,
      });

      pedidoFinal.totalGeral += precoTotal;
      pedidoFinal.itensTotais += quantidade;
    }
  }

  pedidoFinal.totalGeral = parseFloat(pedidoFinal.totalGeral.toFixed(2));
  localStorage.setItem(PEDIDO_KEY, JSON.stringify(pedidoFinal));
  window.location.href = "./html/conta.html";
}


function mostrarErroCarregamento() {
  const container = document.querySelector(".cardapio");
  if (container) {
    container.innerHTML = '<p class="sem-itens" style="color: red; text-align: center; padding: 20px;">Erro ao carregar o cardápio.</p>';
  }
}

function getCookie(nome) {
  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nome}=`);
  if (partes.length === 2) return decodeURIComponent(partes.pop().split(';').shift());
  return null;
}
 window.addEventListener('load', () => {
  const usuarioStr = getCookie("usuario");
  const userDiv = document.querySelector(".user");

  if (!userDiv) {
    console.warn('Elemento ".user" não encontrado no DOM.');
    return;
  }

  if (usuarioStr) {
    try {
      const usuario = JSON.parse(usuarioStr);

      userDiv.style.display = 'flex';
      userDiv.style.alignItems = 'center';

      userDiv.innerHTML = `
        <div class="usuario-dropdown" style="position: relative; display: flex; align-items: center;">
          <div class="usuario-avatar" id="usuarioAvatar" title="Clique para mais opções" style="cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <img src="./assets/user.svg" alt="Ícone de Usuário" style="width: 24px; height: 24px;">
          </div>
          <div class="usuario-menu" id="usuarioMenu" style="display: none; position: absolute; background: white; border: 1px solid #ccc; border-radius: 8px; padding: 10px; margin-top: 8px; right: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 150px;">
            <div class="usuario-nome-menu" style="font-weight: 600; margin-bottom: 10px;">${usuario.nome}</div>
            <button onclick="logoutUsuario()" class="dropdown-btn" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Sair</button>
          </div>
        </div>
      `;

      if (usuario.tipo === 'adm') {
        const btnAdm = document.createElement('button');
        btnAdm.textContent = "Admin";
        btnAdm.className = "admin-btn";
        btnAdm.style.marginLeft = "10px";
        btnAdm.addEventListener('click', () => {
          window.location.href = '/html/adm.html';
        });
        userDiv.appendChild(btnAdm);
      }

      const avatar = document.getElementById("usuarioAvatar");
      const menu = document.getElementById("usuarioMenu");

      if (avatar && menu) {
        avatar.addEventListener("click", e => {
          e.stopPropagation();
          menu.style.display = menu.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", e => {
          if (!avatar.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = "none";
          }
        });
      }
    } catch (e) {
      console.error("Erro ao parsear cookie do usuário:", e);
      renderLoginButtons(userDiv);
    }
  } else {
    renderLoginButtons(userDiv);
    console.log('Usuário não logado.');
  }
});

function renderLoginButtons(containerElement) {
  containerElement.innerHTML = `
    <button class="criar_entrar_conta" onclick="window.location.href='http://localhost:3001/html/sinup.html'">Criar Conta</button>
    <button class="criar_entrar_conta" onclick="window.location.href='http://localhost:3001/html/login.html'">Entrar</button>
  `;
}

function logoutUsuario() {
  document.cookie = "usuario=; max-age=0; path=/";
  localStorage.removeItem(PEDIDO_KEY);
  pedidos = {
    hamburgueres: {},
    acompanhamentos: {},
    bebidas: {},
  };
  window.location.href = '/';
}
