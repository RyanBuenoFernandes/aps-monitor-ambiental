// =====================================================================
// BACK-END PARA O PROJETO "Controle de Denúncias"
// =====================================================================

// 1. IMPORTAÇÕES
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer'); // <-- Nova dependência para upload

// 2. INICIALIZAÇÃO
const app = express();
const port = 3000;

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json()); // Para entender JSON
// express.urlencoded é útil para formulários, mas multer cuidará do nosso formulário de imagem
app.use(express.urlencoded({ extended: true }));

// 4. CONFIGURAÇÃO DO BANCO DE DADOS
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'controle_denuncias_db' // <-- Nova linha
}).promise();

// 5. CONFIGURAÇÃO DO MULTER PARA UPLOAD DE IMAGEM
// Usaremos o memoryStorage para manter o arquivo na memória RAM temporariamente
// antes de salvá-lo no banco de dados. É simples e eficiente para o nosso caso.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// =====================================================================
// 6. ENDPOINTS DA API
// =====================================================================

// Endpoint para o CIDADÃO enviar uma nova denúncia (com foto)
// Usamos 'upload.single("foto")' como um middleware para processar o arquivo de imagem
// que virá no campo "foto" do formulário.
app.post('/denuncias', upload.single('foto'), async (req, res) => {
  try {
    const { nome_cidadao, local_problema, descricao } = req.body;
    
    // O arquivo da imagem fica disponível em req.file
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }
    const fotoBuffer = req.file.buffer; // O conteúdo da imagem em formato binário

    const sql = 'INSERT INTO denuncias (nome_cidadao, local_problema, descricao, foto) VALUES (?, ?, ?, ?)';
    await db.query(sql, [nome_cidadao, local_problema, descricao, fotoBuffer]);

    res.status(201).json({ message: 'Denúncia registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar denúncia:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para o GESTOR ver a lista de todas as denúncias (SEM as fotos)
// Nós excluímos a coluna "foto" para que a resposta seja leve e rápida.
app.get('/denuncias', async (req, res) => {
  try {
    const sql = 'SELECT id, nome_cidadao, local_problema, descricao, status, data_criacao FROM denuncias ORDER BY data_criacao DESC';
    const [denuncias] = await db.query(sql);
    res.json(denuncias);
  } catch (error) {
    console.error('Erro ao buscar denúncias:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para buscar a FOTO de uma denúncia específica
// O front-end usará este endpoint para carregar a imagem sob demanda.
app.get('/denuncias/:id/foto', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT foto FROM denuncias WHERE id = ?';
    const [result] = await db.query(sql, [id]);

    if (result.length === 0 || !result[0].foto) {
      return res.status(404).json({ error: 'Foto não encontrada.' });
    }

    // Define o tipo de conteúdo da resposta como imagem e envia os dados da imagem (o buffer)
    res.setHeader('Content-Type', 'image/jpeg'); // Assumindo que as imagens são JPEG
    res.send(result[0].foto);
  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para o CIDADÃO ver o status das suas próprias denúncias
app.get('/denuncias/cidadao/:nome', async (req, res) => {
    try {
        const { nome } = req.params;
        // A lógica de negócio aqui: não mostrar denúncias em 'pre_analise'.
        const sql = "SELECT id, local_problema, descricao, status, data_criacao FROM denuncias WHERE nome_cidadao = ? AND status != 'pre_analise' ORDER BY data_criacao DESC";
        const [denuncias] = await db.query(sql, [nome]);
        res.json(denuncias);
    } catch (error) {
        console.error('Erro ao buscar denúncias do cidadão:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});


// Endpoint para o GESTOR atualizar o STATUS de uma denúncia
app.put('/denuncias/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // O novo status virá no corpo da requisição

    // Validação simples do status
    const statusPermitidos = ['analise', 'resolvida'];
    if (!statusPermitidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
    }

    const sql = 'UPDATE denuncias SET status = ? WHERE id = ?';
    await db.query(sql, [status, id]);

    res.json({ message: `Status da denúncia ${id} atualizado para ${status}.` });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para o GESTOR DELETAR uma denúncia
app.delete('/denuncias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM denuncias WHERE id = ?';
        await db.query(sql, [id]);
        res.json({ message: `Denúncia ${id} deletada com sucesso.` });
    } catch (error) {
        console.error('Erro ao deletar denúncia:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});


// 7. INICIA O SERVIDOR
app.listen(port, () => {
  console.log(`Servidor do Controle de Denúncias rodando em http://localhost:${port}`);
});