

-- Passo 2: Cria um novo banco de dados para o sistema de controle de denúncias.
CREATE DATABASE IF NOT EXISTS controle_denuncias_db;
-- Passo 3: Define o novo banco de dados como o padrão para os comandos a seguir.
USE controle_denuncias_db;

-- Passo 4: Cria a tabela "denuncias", que será a principal do nosso sistema.
CREATE TABLE IF NOT EXISTS denuncias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome_cidadao VARCHAR(255) NOT NULL,
  local_problema VARCHAR(255) NOT NULL,
  descricao TEXT,

  -- MEDIUMBLOB suporta arquivos de imagem de até 16MB,
  -- ideal para fotos de celular.
  foto MEDIUMBLOB NOT NULL,

  -- O status padrão ao criar uma nova denúncia será 'pre_analise'.
  -- Isso segue a regra de negócio que definimos.
  status VARCHAR(50) NOT NULL DEFAULT 'pre_analise',

  -- A data de criação será registrada automaticamente.
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fim do Script --