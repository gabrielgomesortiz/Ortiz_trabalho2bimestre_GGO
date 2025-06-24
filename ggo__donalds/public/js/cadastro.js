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
