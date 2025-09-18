-- =====================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS PARA O PROJETO "MAPA ECOLÓGICO"
-- =====================================================================

-- Garante que começaremos do zero, apagando qualquer versão anterior deste banco.
DROP DATABASE IF EXISTS mapa_ecologico_db;

-- Cria o novo banco de dados.
CREATE DATABASE IF NOT EXISTS mapa_ecologico_db;

-- Define o novo banco como o padrão para os comandos a seguir.
USE mapa_ecologico_db;

-- Cria a tabela que irá armazenar nossos pontos de interesse ecológico.
CREATE TABLE IF NOT EXISTS pontos_ecologicos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome_ponto VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Colunas para armazenar as coordenadas geográficas com alta precisão.
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Coluna para nosso fluxo de aprovação. O valor padrão 'pre_analise'
  -- será aplicado automaticamente a cada novo ponto inserido.
  status VARCHAR(20) NOT NULL DEFAULT 'pre_analise'
);

-- Fim do Script --