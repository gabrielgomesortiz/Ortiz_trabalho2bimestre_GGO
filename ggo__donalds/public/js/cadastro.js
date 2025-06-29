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

document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      button.innerHTML = olhoFechadoSVG;
    } else {
      input.type = 'password';
      button.innerHTML = olhoAbertoSVG;
    }
  });
});

// Manipula envio do formulário de cadastro
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmar_senha').value;

  const erroDiv = document.getElementById('errorMessage');
  const sucessoDiv = document.getElementById('successMessage');

  function mostrarMensagem(div, mensagem, tipo) {
    div.textContent = mensagem;
    div.className = tipo === 'erro' ? 'error-message' : 'success-message';
    div.style.display = 'block';
    if (tipo === 'erro') sucessoDiv.style.display = 'none';
    else erroDiv.style.display = 'none';
  }

  erroDiv.style.display = 'none';
  sucessoDiv.style.display = 'none';

  if (!nome || !email || !senha || !confirmarSenha) {
    mostrarMensagem(erroDiv, 'Por favor, preencha todos os campos.', 'erro');
    return;
  }

  if (senha.length < 6) {
    mostrarMensagem(erroDiv, 'A senha deve ter no mínimo 6 caracteres.', 'erro');
    return;
  }

  if (senha !== confirmarSenha) {
    mostrarMensagem(erroDiv, 'As senhas não coincidem.', 'erro');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/cadastrar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      mostrarMensagem(sucessoDiv, 'Conta criada com sucesso! Redirecionando...', 'sucesso');
      document.getElementById('signupForm').reset();
      setTimeout(() => {
        window.location.href = '/html/login.html';
      }, 2000);
    } else {
      mostrarMensagem(erroDiv, data.erro || 'Erro ao cadastrar usuário.', 'erro');
    }

  } catch (err) {
    console.error('Erro na requisição de cadastro:', err);
    mostrarMensagem(erroDiv, 'Erro ao conectar com o servidor.', 'erro');
  }
});