let qrcode;

document.addEventListener('DOMContentLoaded', function() {
    gerarQrCode();
    
    document.getElementById('pix').addEventListener('change', function() {
        if(this.checked) {
            gerarQrCode();
        }
    });
});

function gerarQrCode() {
    const qrcodeElement = document.getElementById('qrcode');
    const pixCode = document.getElementById('pix_code_text').innerText;
    
    qrcodeElement.innerHTML = '';
    
    qrcode = new QRCode(qrcodeElement, {
        text: pixCode,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function copiarCodigoPix() {
    const codigo = document.getElementById('pix_code_text').innerText;
    navigator.clipboard.writeText(codigo).then(() => {
        alert('Código PIX copiado com sucesso!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar código PIX');
    });
}

function validarCartao(numeroCartao) {
    const numeroLimpo = numeroCartao.replace(/\D/g, '');
    
    if (numeroLimpo.length < 13 || numeroLimpo.length > 19) {
        return false;
    }
    
    let soma = 0;
    let deveDobrar = false;
    
    for (let i = numeroLimpo.length - 1; i >= 0; i--) {
        let digito = parseInt(numeroLimpo.charAt(i), 10);
        
        if (deveDobrar) {
            digito *= 2;
            if (digito > 9) {
                digito = (digito % 10) + 1;
            }
        }
        
        soma += digito;
        deveDobrar = !deveDobrar;
    }
    
    return (soma % 10) === 0;
}

function validarCPF(cpf) {
    let strCPF = '';
    for (let i = 0; i < cpf.length; i++) {
        if (cpf[i] >= '0' && cpf[i] <= '9') {
            strCPF += cpf[i];
        }
    }
    
    if (strCPF.length !== 11) {
        return false;
    }
    
    let todosIguais = true;
    for (let j = 1; j < 11; j++) {
        if (strCPF[j] !== strCPF[0]) {
            todosIguais = false;
            break;
        }
    }
    if (todosIguais) {
        return false;
    }
    
    let soma = 0;
    for (let k = 0; k < 9; k++) {
        soma += parseInt(strCPF[k]) * (10 - k);
    }
    let resto = soma % 11;
    let digito1 = (resto < 2) ? 0 : 11 - resto;
    
    soma = 0;
    for (let l = 0; l < 10; l++) {
        soma += parseInt(strCPF[l]) * (11 - l);
    }
    resto = soma % 11;
    let digito2 = (resto < 2) ? 0 : 11 - resto;
    
    return (parseInt(strCPF[9]) === digito1 && parseInt(strCPF[10]) === digito2);
}

function pagar() {
    const metodo = document.querySelector('input[name="metodoPagamento"]:checked').value;
    
    if(metodo === 'cartao') {
        const cpf = document.getElementById('input_cpf').value;
        const endereco = document.getElementById('input_endereco').value;
        const numCartao = document.getElementById('input_cartao_num').value;
        
        if(!cpf || !endereco || !numCartao) {
            alert('Por favor, preencha todos os campos do cartão!');
            return;
        }
        
        if (!validarCPF(cpf)) {
            alert('CPF inválido! Por favor, verifique os dados.');
            return;
        }
        
        if (!validarCartao(numCartao)) {
            alert('Número de cartão inválido! Por favor, verifique os dados.');
            return;
        }
    }
    
    alert(`Pagamento via ${metodo === 'cartao' ? 'Cartão' : 'PIX'} realizado com sucesso!`);
}