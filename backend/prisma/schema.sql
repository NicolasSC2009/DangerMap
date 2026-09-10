-- ============================================================================
-- Script de referência do schema do DangerMap
-- Reflete o estado real do banco (confirmado via `prisma db pull` em 2026-09-09,
-- já com as correções da revisão de backend aplicadas). Uso: documentação /
-- recriação do zero. O Prisma (schema.prisma) é a fonte de verdade em runtime;
-- este arquivo é só para referência manual / pgAdmin.
-- ============================================================================

-- ============================================================================
-- 1. CRIAÇÃO DE TIPOS ENUM
-- ============================================================================
CREATE TYPE tipo_usuario_enum AS ENUM ('usuario', 'admin');
CREATE TYPE status_ocorrencia_enum AS ENUM ('pendente', 'confirmado', 'resolvido', 'arquivado');
CREATE TYPE gravidade_enum AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE tipo_notificacao_enum AS ENUM ('proximidade', 'validacao_campo', 'confirmacao', 'resolucao', 'sistema', 'moderacao');

-- ============================================================================
-- 2. TABELA DE CATEGORIAS
-- ============================================================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    icone_url VARCHAR(255)
);

-- ============================================================================
-- 3. TABELA DE USUÁRIOS
-- ============================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario tipo_usuario_enum DEFAULT 'usuario',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    senha_reset_token VARCHAR(255),
    senha_reset_expira TIMESTAMP
);

-- ============================================================================
-- 4. TABELA DE OCORRÊNCIAS
-- ============================================================================
-- Nota: a coluna "updated_at" foi removida deste script porque não existe de
-- fato no banco (confirmado via introspecção) - se você precisar dela,
-- é um ALTER TABLE novo, não algo já aplicado.
-- "data_resolucao" foi incorporada aqui (antes era um ALTER separado) e é
-- preenchida pelo backend quando uma ocorrência é marcada como "resolvido",
-- usada pelo job de arquivamento automático (24h após a resolução).
CREATE TABLE ocorrencias (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id INT REFERENCES categorias(id) ON DELETE RESTRICT,
    gravidade gravidade_enum DEFAULT 'medio',
    descricao TEXT,
    latitude DECIMAL(10, 8) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(11, 8) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    status status_ocorrencia_enum DEFAULT 'pendente',
    anonimo BOOLEAN DEFAULT FALSE,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP NULL,
    qtd_confirmacoes INT DEFAULT 0 CHECK (qtd_confirmacoes >= 0),
    imagem_url VARCHAR(255),
    categoria_ia VARCHAR(100),
    id_agrupamento INT
);

-- Índices Ocorrências
CREATE INDEX idx_ocorrencias_status ON ocorrencias(status);
CREATE INDEX idx_ocorrencias_data_registro ON ocorrencias(data_registro);
CREATE INDEX idx_ocorrencias_categoria ON ocorrencias(categoria_id);
CREATE INDEX idx_ocorrencias_usuario ON ocorrencias(usuario_id);
CREATE INDEX idx_ocorrencias_status_resolucao ON ocorrencias(status, data_resolucao);
CREATE INDEX idx_ocorrencias_localizacao ON ocorrencias USING GIST (
    (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography)
);

-- ============================================================================
-- 5. TABELA DE CONFIRMAÇÕES
-- ============================================================================
CREATE TABLE confirmacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    ocorrencia_id INT REFERENCES ocorrencias(id) ON DELETE CASCADE,
    data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, ocorrencia_id)
);

-- ============================================================================
-- 6. TABELA DE DENÚNCIAS (Ocorrências)
-- ============================================================================
CREATE TABLE denuncias (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    ocorrencia_id INT REFERENCES ocorrencias(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    data_denuncia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. TABELA DE NOTIFICAÇÕES
-- ============================================================================
-- Nota: colunas renomeadas de "tipo"/"data_criacao" para "tipo_notificacao"/
-- "data_envio", que são os nomes reais confirmados via introspecção do banco.
CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ocorrencia_id INT REFERENCES ocorrencias(id) ON DELETE SET NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo_notificacao tipo_notificacao_enum NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- ============================================================================
-- 8. TABELA DE INTERAÇÕES SOCIAIS
-- ============================================================================
CREATE TABLE interacoes_sociais (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INT REFERENCES ocorrencias(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_interacao VARCHAR(20),
    data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. TABELA DE CLIMA
-- ============================================================================
CREATE TABLE dados_climaticos (
    id SERIAL PRIMARY KEY,
    regiao VARCHAR(100) DEFAULT 'Desconhecida',
    temperatura DECIMAL(4, 2) CHECK (temperatura BETWEEN -60 AND 60),
    condicao_tempo VARCHAR(100),
    umidade INT CHECK (umidade BETWEEN 0 AND 100),
    data_leitura TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. TABELA DE DENÚNCIAS DE USUÁRIOS
-- ============================================================================
CREATE TABLE denuncias_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_denunciado_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    autor_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    motivo TEXT,
    ip_origem VARCHAR(45),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. TABELA DE LOGS DE ATIVIDADES
-- ============================================================================
CREATE TABLE logs_atividades (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(255) NOT NULL,
    ip_origem VARCHAR(45) DEFAULT '0.0.0.0',
    user_agent TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 12. TABELA DE BLACKLIST DE TOKENS
-- ============================================================================
CREATE TABLE blacklist_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL
);

CREATE INDEX idx_blacklist_token ON blacklist_tokens(token);
