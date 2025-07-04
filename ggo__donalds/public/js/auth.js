// Ícones SVG para mostrar/esconder senha
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



// Alterna mostrar/esconder senha com ícones
document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);

    if (!input) return;

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

// Manipula o envio do formulário de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('password').value.trim();
  const mensagemDiv = document.getElementById('errorMessage');

  if (!email || !senha) {
    mostrarMensagem(mensagemDiv, 'Por favor, preencha todos os campos.', 'erro');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      mostrarMensagem(mensagemDiv, `
        Login realizado com sucesso!<br>
        Nome: ${data.nome}<br>
        Email: ${data.email}<br>
        Tipo: ${data.tipo}
      `, 'sucesso');

      // Salva cookie com dados do usuário por 5 minutos (300s)
      document.cookie = `usuario=${encodeURIComponent(JSON.stringify(data))};max-age=1200;path=/`;

      if (data.tipo === 'adm') {
        showAdminChoice();
      } else {
        // Redireciona clientes para página principal
        window.location.href = '/index.html';
      }
    } else {
      mostrarMensagem(mensagemDiv, data.erro || data.message || 'Erro ao fazer login', 'erro');
    }
  } catch (error) {
    console.error('Erro ao conectar com o servidor:', error);
    mostrarMensagem(mensagemDiv, 'Erro ao conectar com o servidor. Verifique se o servidor está rodando.', 'erro');
  }
});

// Função para mostrar mensagem em div de feedback
function mostrarMensagem(div, texto, tipo) {
  div.style.display = 'block';
  div.className = tipo;
  div.innerHTML = texto;
}

// Tela de escolha para admins após login
function showAdminChoice() {
  const loginContainer = document.querySelector('.login-container');
  if (!loginContainer) {
    console.error("Contêiner de login não encontrado.");
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('loginForm').style.display = 'none';
  const mensagemDiv = document.getElementById('errorMessage');
  if (mensagemDiv) mensagemDiv.style.display = 'none';
  const footerLinks = document.querySelector('.footer-links');
  if (footerLinks) footerLinks.style.display = 'none';

  const choiceWrapper = document.createElement('div');
  choiceWrapper.id = 'adminChoiceWrapper';
  choiceWrapper.className = 'admin-choice-wrapper';

  const message = document.createElement('p');
  message.textContent = "Você é um administrador. Para onde deseja ir?";
  message.className = 'admin-choice-message';

  const btnAdm = document.createElement('button');
  btnAdm.textContent = "Área Administrativa";
  btnAdm.className = 'admin-choice-btn admin-btn-adm';
  btnAdm.addEventListener('click', () => {
    window.location.href = '/html/adm.html';
    choiceWrapper.remove();
  });

  const btnIndex = document.createElement('button');
  btnIndex.textContent = "Página Principal";
  btnIndex.className = 'admin-choice-btn admin-btn-index';
  btnIndex.addEventListener('click', () => {
    window.location.href = '/index.html';
    choiceWrapper.remove();
  });

  choiceWrapper.appendChild(message);
  choiceWrapper.appendChild(btnAdm);
  choiceWrapper.appendChild(btnIndex);

  loginContainer.appendChild(choiceWrapper);

  // Estilos inline para demonstração
  choiceWrapper.style.marginTop = '20px';
  choiceWrapper.style.padding = '20px';
  choiceWrapper.style.border = '1px solid #ddd';
  choiceWrapper.style.borderRadius = '8px';
  choiceWrapper.style.backgroundColor = '#f9f9f9';
  choiceWrapper.style.textAlign = 'center';
  choiceWrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

  message.style.marginBottom = '15px';
  message.style.fontSize = '1.1em';
  message.style.color = '#333';

  [btnAdm, btnIndex].forEach(btn => {
    btn.style.margin = '5px';
    btn.style.padding = '10px 20px';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '1em';
    btn.style.transition = 'background-color 0.2s ease';
  });

  btnAdm.style.backgroundColor = '#007bff';
  btnAdm.onmouseover = () => btnAdm.style.backgroundColor = '#0056b3';
  btnAdm.onmouseout = () => btnAdm.style.backgroundColor = '#007bff';

  btnIndex.style.backgroundColor = '#6c757d';
  btnIndex.onmouseover = () => btnIndex.style.backgroundColor = '#5a6268';
  btnIndex.onmouseout = () => btnIndex.style.backgroundColor = '#6c757d';
}
