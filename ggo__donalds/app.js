const express = require('express');
const app = express();
const PORT = 3000;

// Serve TODOS os arquivos da pasta 'public' como estáticos
app.use(express.static('public'));

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});