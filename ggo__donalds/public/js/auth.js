// SVGs para os ícones de olho (mostrar/esconder senha)
const olhoAbertoSVG = `
  <svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`;

const olhoFechadoSVG = `
  <svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.48 21.48 0 0 1 5-5"/>
    <path d="M1 1l22 22"/>
  </svg>
`;

// Adiciona event listeners para os botões de mostrar/esconder senha
document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target'); // Pega o ID do input de senha
    const input = document.getElementById(targetId); // Encontra o input de senha

    // Alterna o tipo do input (password/text) e o ícone do botão
    if (input.type === 'password') {
      input.type = 'text';
      button.innerHTML = olhoFechadoSVG;
      button.setAttribute('aria-label', 'Esconder senha');
    } else {
      input.type = 'password';
      button.innerHTML = olhoAbertoSVG;
      button.setAttribute('aria-label', 'Mostrar senha');
    }
  });
});

// Adiciona event listener para o formulário de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Impede o comportamento padrão do formulário (recarregar a página)

  // Captura os valores do email e senha
  const email = document.getElementById('email').value;
  const senha = document.getElementById('password').value;
  const mensagemDiv = document.getElementById('errorMessage'); // Elemento para exibir mensagens

  try {
    // Faz a requisição POST para a rota de login no servidor
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }) // Envia email e senha como JSON
    });

    const data = await response.json(); // Converte a resposta para JSON

    mensagemDiv.style.display = 'block'; // Mostra a div de mensagem

    // Verifica se a resposta do servidor foi bem-sucedida (status 2xx)
    if (response.ok) {
      mensagemDiv.className = 'sucesso'; // Define a classe CSS para sucesso
      mensagemDiv.innerHTML = `
        Login realizado com sucesso!<br>
        Nome: ${data.nome}<br>
        Email: ${data.email}<br>
        Tipo: ${data.tipo}
      `;

      // Salva os dados do usuário em um cookie (codificados para JSON seguro)
      document.cookie = `usuario=${encodeURIComponent(JSON.stringify(data))};path=/`;

      // Redireciona o usuário com base no tipo retornado pelo servidor
      if (data.tipo === 'adm') {
        // Se o usuário é administrador, mostra a interface de escolha
        showAdminChoice();
      } else {
        // Para outros tipos de usuário (ex: 'cliente'), redireciona para a página principal
        window.location.href = '/index.html';
      }

    } else {
      // Se a resposta não foi bem-sucedida, exibe a mensagem de erro do servidor
      mensagemDiv.className = 'erro'; // Define a classe CSS para erro
      mensagemDiv.textContent = data.erro || data.message || 'Erro ao fazer login';
    }
  } catch (error) {
    // Captura erros de rede ou outros erros durante a requisição
    console.error('Erro de conexão ou durante o login:', error);
    mensagemDiv.style.display = 'block';
    mensagemDiv.className = 'erro';
    mensagemDiv.textContent = 'Erro ao conectar com o servidor. Verifique se o servidor está rodando e a URL está correta.';
  }
});

// Função para exibir a UI de escolha para o administrador
function showAdminChoice() {
  const loginContainer = document.querySelector('.login-container'); // Onde a nova UI será injetada
  if (!loginContainer) {
    console.error("Contêiner de login não encontrado para a escolha do administrador.");
    // Fallback: se o contêiner não for encontrado, redireciona para o index
    window.location.href = '/index.html';
    return;
  }

  // Oculta o formulário de login, mensagem de erro e links do rodapé temporariamente
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('errorMessage').style.display = 'none';
  const footerLinks = document.querySelector('.footer-links');
  if (footerLinks) {
      footerLinks.style.display = 'none';
  }

  // Cria a div que irá envolver as opções de escolha
  const choiceWrapper = document.createElement('div');
  choiceWrapper.id = 'adminChoiceWrapper';
  choiceWrapper.className = 'admin-choice-wrapper'; // Classe para estilização

  // Cria a mensagem para o administrador
  const message = document.createElement('p');
  message.textContent = "Você é um administrador. Para onde deseja ir?";
  message.className = 'admin-choice-message';

  // Cria o botão para a Área Administrativa
  const btnAdm = document.createElement('button');
  btnAdm.textContent = "Área Administrativa";
  btnAdm.className = 'admin-choice-btn admin-btn-adm';
  btnAdm.addEventListener('click', () => {
    window.location.href = '/html/adm.html'; // Redireciona para a página administrativa
    // Remove a UI de escolha após a seleção (opcional, pode ser feito via CSS também)
    choiceWrapper.remove();
  });

  // Cria o botão para a Página Principal
  const btnIndex = document.createElement('button');
  btnIndex.textContent = "Página Principal";
  btnIndex.className = 'admin-choice-btn admin-btn-index';
  btnIndex.addEventListener('click', () => {
    window.location.href = '/index.html'; // Redireciona para a página principal
    // Remove a UI de escolha após a seleção
    choiceWrapper.remove();
  });

  // Adiciona os elementos criados à div de escolha
  choiceWrapper.appendChild(message);
  choiceWrapper.appendChild(btnAdm);
  choiceWrapper.appendChild(btnIndex);

  // Adiciona a div de escolha ao contêiner de login
  loginContainer.appendChild(choiceWrapper);

  // --- Estilos CSS inline (apenas para demonstração, idealmente coloque em login.css) ---
  // Estilos para a div de escolha
  choiceWrapper.style.marginTop = '20px';
  choiceWrapper.style.padding = '20px';
  choiceWrapper.style.border = '1px solid #ddd';
  choiceWrapper.style.borderRadius = '8px';
  choiceWrapper.style.backgroundColor = '#f9f9f9';
  choiceWrapper.style.textAlign = 'center';
  choiceWrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

  // Estilos para a mensagem
  message.style.marginBottom = '15px';
  message.style.fontSize = '1.1em';
  message.style.color = '#333';

  // Estilos para os botões
  btnAdm.style.margin = '5px';
  btnAdm.style.padding = '10px 20px';
  btnAdm.style.backgroundColor = '#007bff';
  btnAdm.style.color = 'white';
  btnAdm.style.border = 'none';
  btnAdm.style.borderRadius = '5px';
  btnAdm.style.cursor = 'pointer';
  btnAdm.style.fontSize = '1em';
  btnAdm.style.transition = 'background-color 0.2s ease'; // Adiciona transição
  // Adiciona hover via JS para manter tudo no JS
  btnAdm.onmouseover = () => btnAdm.style.backgroundColor = '#0056b3';
  btnAdm.onmouseout = () => btnAdm.style.backgroundColor = '#007bff';


  btnIndex.style.margin = '5px';
  btnIndex.style.padding = '10px 20px';
  btnIndex.style.backgroundColor = '#6c757d';
  btnIndex.style.color = 'white';
  btnIndex.style.border = 'none';
  btnIndex.style.borderRadius = '5px';
  btnIndex.style.cursor = 'pointer';
  btnIndex.style.fontSize = '1em';
  btnIndex.style.transition = 'background-color 0.2s ease'; // Adiciona transição
  // Adiciona hover via JS para manter tudo no JS
  btnIndex.onmouseover = () => btnIndex.style.backgroundColor = '#5a6268';
  btnIndex.onmouseout = () => btnIndex.style.backgroundColor = '#6c757d';
}
