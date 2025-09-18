// =====================================================================
// BACK-END PARA O PROJETO "MAPA ECOLÓGICO DE GOIÁS"
// =====================================================================

// 1. IMPORTAÇÕES
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// 2. INICIALIZAÇÃO
const app = express();
const port = 3000;

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json()); // Habilita o back-end para receber dados em formato JSON

// 4. CONFIGURAÇÃO DO BANCO DE DADOS
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Sua senha, se houver
  database: 'mapa_ecologico_db' // Conectando ao nosso novo banco
}).promise();


// =====================================================================
// 5. ENDPOINTS DA API
// =====================================================================

// Endpoint para REGISTRAR um novo ponto ecológico
app.post('/pontos', async (req, res) => {
  try {
    const { nome_ponto, descricao, latitude, longitude } = req.body;
    const sql = 'INSERT INTO pontos_ecologicos (nome_ponto, descricao, latitude, longitude) VALUES (?, ?, ?, ?)';
    await db.query(sql, [nome_ponto, descricao, latitude, longitude]);
    res.status(201).json({ message: 'Ponto ecológico sugerido com sucesso! Aguardando análise.' });
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para BUSCAR todos os pontos APROVADOS (para o mapa principal)
app.get('/pontos/aprovados', async (req, res) => {
  try {
    const sql = "SELECT * FROM pontos_ecologicos WHERE status = 'aprovado'";
    const [pontos] = await db.query(sql);
    res.json(pontos);
  } catch (error) {
    console.error('Erro ao buscar pontos aprovados:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para BUSCAR todos os pontos PENDENTES (para o painel do gestor)
app.get('/pontos/pendentes', async (req, res) => {
  try {
    const sql = "SELECT * FROM pontos_ecologicos WHERE status = 'pre_analise'";
    const [pontos] = await db.query(sql);
    res.json(pontos);
  } catch (error) {
    console.error('Erro ao buscar pontos pendentes:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Endpoint para o GESTOR APROVAR um ponto
app.put('/pontos/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Apenas 'aprovado' é um status válido para este endpoint
        if (status !== 'aprovado') {
            return res.status(400).json({ error: "Status inválido para esta operação." });
        }
        
        const sql = 'UPDATE pontos_ecologicos SET status = ? WHERE id = ?';
        await db.query(sql, [status, id]);
        res.json({ message: `Ponto ${id} aprovado com sucesso!` });
    } catch (error) {
        console.error('Erro ao aprovar ponto:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Endpoint para o GESTOR RECUSAR (deletar) um ponto
app.delete('/pontos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM pontos_ecologicos WHERE id = ?';
    await db.query(sql, [id]);
    res.json({ message: `Ponto ${id} recusado e deletado com sucesso.` });
  } catch (error) {
    console.error('Erro ao deletar ponto:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});


// 6. INICIA O SERVIDOR
app.listen(port, () => {
  console.log(`Servidor do Mapa Ecológico rodando em http://localhost:${port}`);
});