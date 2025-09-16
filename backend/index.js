const express = require('express');
const cors = require('cors');
// 1. Importar a biblioteca mysql2
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 2. Configurar a conexão com o banco de dados MySQL
// Usamos um "pool" de conexões, que é mais eficiente para gerenciar múltiplas requisições.
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Sua senha do root (deixamos em branco, como combinado)
    database: 'aps_monitor_db'
}).promise(); // O .promise() permite usar a sintaxe moderna async/await

// --- ENDPOINTS ATUALIZADOS ---

// Endpoint para OBTER todas as leituras do BANCO DE DADOS
app.get('/leituras', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM leituras ORDER BY mesAno ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar leituras:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Endpoint para ADICIONAR uma nova leitura no BANCO DE DADOS
app.post('/leituras', async (req, res) => {
    try {
        const { recurso, mesAno, consumo } = req.body;
        const sql = 'INSERT INTO leituras (recurso, mesAno, consumo) VALUES (?, ?, ?)';
        // Usar "?" previne ataques de SQL Injection
        const [result] = await db.query(sql, [recurso, mesAno, consumo]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error('Erro ao inserir leitura:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Endpoint para OBTER as metas do BANCO DE DADOS
app.get('/metas', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM metas');
        // Transforma o array de resultado em um objeto, como o front-end espera
        const metasObjeto = rows.reduce((acc, meta) => {
            acc[meta.recurso] = meta.valor;
            return acc;
        }, {});
        res.json(metasObjeto);
    } catch (error) {
        console.error('Erro ao buscar metas:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Endpoint para ATUALIZAR/INSERIR uma meta no BANCO DE DADOS
app.post('/metas', async (req, res) => {
    try {
        const { recurso, valor } = req.body;
        // Este comando SQL especial INSERE uma nova meta se não existir,
        // ou ATUALIZA o valor se a meta para aquele recurso já existir.
        const sql = 'INSERT INTO metas (recurso, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?';
        await db.query(sql, [recurso, valor, valor]);
        res.status(200).send('Meta atualizada com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar meta:', error);
        res.status(500).send('Erro no servidor');
    }
});


app.listen(port, () => {
    console.log(`Servidor back-end rodando em http://localhost:${port} e conectado ao MySQL!`);
});