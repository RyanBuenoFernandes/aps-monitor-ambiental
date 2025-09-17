CREATE DATABASE IF NOT EXISTS controle_denuncias_db;

USE controle_denuncias_db;

CREATE TABLE IF NOT EXISTS denuncias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome_cidadao VARCHAR(255) NOT NULL,
  local_problema VARCHAR(255) NOT NULL,
  descricao TEXT,
  foto MEDIUMBLOB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pre_analise',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

