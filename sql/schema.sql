-- Cria o banco de dados se ele não existir
CREATE DATABASE IF NOT EXISTS aps_monitor_db;

-- Usa o banco de dados que acabamos de criar
USE aps_monitor_db;

-- Cria a tabela para armazenar as leituras de consumo
CREATE TABLE IF NOT EXISTS leituras (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recurso VARCHAR(50) NOT NULL,
  mesAno VARCHAR(7) NOT NULL, -- Formato "YYYY-MM"
  consumo DECIMAL(10, 2) NOT NULL,
  data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cria a tabela para armazenar as metas
CREATE TABLE IF NOT EXISTS metas (
  recurso VARCHAR(50) PRIMARY KEY, -- 'agua' ou 'energia'
  valor DECIMAL(10, 2) NOT NULL
);

-- Insere as metas iniciais. Se já existirem, não faz nada.
-- O "ON DUPLICATE KEY UPDATE" evita erros se você rodar o script mais de uma vez.
INSERT INTO metas (recurso, valor) VALUES ('agua', 1500)
ON DUPLICATE KEY UPDATE valor = 1500;

INSERT INTO metas (recurso, valor) VALUES ('energia', 25000)
ON DUPLICATE KEY UPDATE valor = 25000;