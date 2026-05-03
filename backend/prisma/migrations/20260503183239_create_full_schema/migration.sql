-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('usuario', 'admin');

-- CreateEnum
CREATE TYPE "TipoProblema" AS ENUM ('alagamento', 'buraco', 'seguranca', 'transito', 'arvore_caida', 'roubo', 'batida_de_carro', 'carro_no_acostamento', 'incendio', 'placa_danificada', 'obras_na_pista', 'via_interditada', 'perigo_na_pista', 'outros');

-- CreateEnum
CREATE TYPE "StatusOcorrencia" AS ENUM ('pendente', 'confirmado', 'resolvido');

-- CreateEnum
CREATE TYPE "Gravidade" AS ENUM ('baixo', 'medio', 'alto');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "tipo_usuario" "TipoUsuario" NOT NULL DEFAULT 'usuario',
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "tipo_problema" "TipoProblema" NOT NULL,
    "gravidade" "Gravidade" NOT NULL DEFAULT 'medio',
    "descricao" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "StatusOcorrencia" NOT NULL DEFAULT 'pendente',
    "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qtd_confirmacoes" INTEGER NOT NULL DEFAULT 0,
    "imagem_url" VARCHAR(255),
    "categoria_sugerida_ia" VARCHAR(100),
    "id_agrupamento" INTEGER,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmacoes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ocorrencia_id" INTEGER NOT NULL,
    "data_confirmacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirmacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ocorrencia_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "data_denuncia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo_notificacao" VARCHAR(50),
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacoes_sociais" (
    "id" SERIAL NOT NULL,
    "ocorrencia_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_interacao" VARCHAR(20),
    "data_interacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interacoes_sociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_sos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgao_contactado" VARCHAR(50),

    CONSTRAINT "logs_sos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_climaticos" (
    "id" SERIAL NOT NULL,
    "regiao" VARCHAR(100),
    "temperatura" DECIMAL(4,2),
    "condicao_tempo" VARCHAR(100),
    "data_leitura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dados_climaticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias_usuarios" (
    "id" SERIAL NOT NULL,
    "usuario_denunciado_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "motivo" TEXT,
    "ip_origem" VARCHAR(45),
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denuncias_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_atividades" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "acao" VARCHAR(255) NOT NULL,
    "ip_origem" VARCHAR(45),
    "user_agent" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "confirmacoes_usuario_id_ocorrencia_id_key" ON "confirmacoes"("usuario_id", "ocorrencia_id");

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmacoes" ADD CONSTRAINT "confirmacoes_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes_sociais" ADD CONSTRAINT "interacoes_sociais_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes_sociais" ADD CONSTRAINT "interacoes_sociais_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_sos" ADD CONSTRAINT "logs_sos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias_usuarios" ADD CONSTRAINT "denuncias_usuarios_usuario_denunciado_id_fkey" FOREIGN KEY ("usuario_denunciado_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias_usuarios" ADD CONSTRAINT "denuncias_usuarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_atividades" ADD CONSTRAINT "logs_atividades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
