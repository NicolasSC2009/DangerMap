# DangerMap — Requisitos e Regras de Negócio

Documento de acompanhamento do projeto. Atualizado em **05/10/2026**, conferido item a item com o código (backend, banco e telas).

**Como ler a coluna "Situação"**

| Marca | Significado |
|---|---|
| ✅ | Atendido e funcionando |
| 🟡 | Atendido em parte (a observação diz o que falta) |
| ⛔ | Ainda não implementado |
| 📌 | Meta ou processo: não é código, precisa ser acompanhado fora do sistema |

**O que mudou em relação à versão anterior da lista**

- Itens **reescritos** porque o sistema mudou: RF07, RF08, RF09, RF10, RF13, RF14, RF18, RF19, RF20, RN07, RN16, RN17.
- Itens **novos**: RF33 a RF48 (funcionalidades que já existem e não estavam na lista), RNF-09 a RNF-15 e RN25 a RN44.
- Itens **que ainda não estão completos** estão marcados com 🟡 ou ⛔ e reunidos na seção "Pendências" no final.

---

## 1. Requisitos Funcionais — Usuário comum (cidadão)

### Conta e perfil

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RF01 | **Gerenciar cadastro e login.** O usuário cria conta com nome, e-mail e senha e entra com essas credenciais. A conta nasce ativa e o e-mail serve para entrar e recuperar a senha. | ✅ | Telas de login/cadastro; `POST /auth/cadastro` e `/auth/login`. Conta desativada não consegue entrar. |
| RF02 | **Visualizar perfil público.** Qualquer usuário logado abre o perfil público de outro. | ✅ | `GET /usuarios/:id/perfil`. |
| RF03 | **Dados públicos do perfil.** Mostra nome e data de cadastro; nunca mostra e-mail ou senha. | ✅ | |
| RF04 | **Histórico do perfil.** Lista as ocorrências do usuário (categoria, data, status e foto), sem as anônimas quando visto por terceiros. | ✅ | |
| RF05 | **Estatísticas de contribuição.** Total de registros e de confirmações. | ✅ | |
| RF21 | **Exclusão de conta (soft delete).** O usuário pede a exclusão da própria conta; ela é apenas inativada. | ✅ | `DELETE /auth/usuarios/excluir`, com confirmação digitando "EXCLUIR". Ação registrada em log. |

### Mapa e localização

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RF06 | **Visualizar mapa interativo.** Mapa dinâmico com as ocorrências ativas. O mapa se atualiza sozinho a cada minuto (pode ser desligado nas Configurações). | ✅ | `GET /ocorrencias` (pública). |
| RF07 | **Localização automática.** O sistema pede permissão para usar a posição do dispositivo e centraliza o mapa nela. O botão "Minha localização" volta a centralizar quando o usuário quiser. | ✅ | Se negar, vale RN17. |
| RF13 | **Filtrar ocorrências** por categoria, gravidade, status e período. | 🟡 | O servidor aceita os quatro filtros. Na tela do mapa já existem **gravidade** e **categoria** (com contador e botão "Limpar"); **status** e **período** ainda não têm campo na tela. |
| RF14 | **Agrupamento visual (clustering).** Marcadores muito próximos se juntam, no navegador, conforme o zoom. | ✅ | Ver RF38 e RN16. |
| RF19 | **Integração climática.** Mostra temperatura, umidade e condição do tempo do local do usuário, com a cidade (ex.: "Criciúma - SC"). A temperatura pode ser vista em °C ou °F. | ✅ | Fonte Open-Meteo, com cache de 30 min. Pode ser desligado nas Configurações. |
| RF36 | **Endereço legível.** Em qualquer ocorrência (formulário e detalhe) aparecem rua, bairro e cidade em vez de coordenadas. | ✅ | `GET /geo/endereco` (OpenStreetMap/Nominatim). |
| RF37 | **Buscar endereço no mapa.** Qualquer pessoa pesquisa rua, bairro ou cidade no Brasil e o mapa voa até o resultado, com marcador temporário. | ✅ | `GET /geo/buscar`. Não aceita CEP; ver Pendências. |
| RF38 | **Exibição por nível de zoom (estilo Waze).** Longe: nenhuma ocorrência (aparece um aviso para aproximar). Distância média: bolinhas amarelas. Perto: ícones das categorias e balões com número. Zoom máximo: ocorrências sobrepostas abrem em leque, sem ficar uma presa na outra. | ✅ | Regras em RN35. |

### Registro de ocorrências

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RF08 | **Registrar ocorrência.** O usuário cadastra um problema no mapa informando a **categoria** e o **local**; a descrição é opcional. A **gravidade não é escolhida**: o sistema define sozinho (RF34). | ✅ | `POST /ocorrencias`. |
| RF09 | **Registro via GPS (usuário comum).** O usuário comum só registra a até **1 km** da sua posição atual no dispositivo. O botão "Registrar ocorrência" usa a posição atual. | 🟡 | A distância é conferida **no aplicativo**; o servidor ainda não confere (ver Pendências). |
| RF10 | **Registro flexível (somente admin).** O admin registra clicando em qualquer ponto do mapa. Para chegar ao ponto, pode usar a busca de endereço (RF37). | 🟡 | Falta digitar coordenadas e buscar por CEP direto no formulário. A ferramenta de relatório já aceita coordenadas digitadas. |
| RF11 | **Registro anônimo.** Com a opção marcada, o autor não aparece para outros usuários; só ele e os admins veem a autoria. | ✅ | |
| RF12 | **Anexar foto.** Uma imagem pode ser enviada no registro. | ✅ | JPEG, PNG ou WebP, até 5 MB (RN33). |
| RF20 | **Sugestão de categoria por IA (opcional).** A IA analisa a foto anexada e sugere a categoria, considerando também o texto da descrição. | ✅ | `POST /ocorrencias/sugerir-categoria-imagem`. Consultiva (RN09) e só aparece com confiança ≥ 55% (RN42). |
| RF34 | **Gravidade automática.** A gravidade é calculada pelo servidor a partir da categoria e das palavras da descrição (ex.: "enorme" sobe um nível, "pequeno" desce um). O usuário vê a gravidade estimada antes de enviar. | ✅ | `POST /ocorrencias/estimar-gravidade`. Regra em RN25. |
| RF35 | **Restrição ao território brasileiro.** Pontos fora do Brasil são recusados, para qualquer tipo de conta (inclusive admin), tanto no app quanto no servidor. | ✅ | Fronteira oficial do IBGE (RN26). |
| RF43 | **Sugestão de categoria pelo texto.** Enquanto o usuário descreve o problema, o sistema sugere a categoria mais provável. | ✅ | `POST /ocorrencias/sugerir-categoria`. |

### Interação e comunidade

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RF15 | **Confirmar ocorrência.** O usuário valida ocorrências de terceiros (e pode retirar a confirmação). | ✅ | RN10 e RN28. |
| RF16 | **Denúncias.** O usuário reporta ocorrências suspeitas ou falsas e denuncia perfis por comportamento inadequado. | ✅ | RN29. |
| RF17 | **Engajamento social.** Curtir/apoiar e compartilhar o link da ocorrência (menu de compartilhar do aparelho ou cópia do link). | ✅ | |
| RF18 | **Central de notificações.** O sininho avisa sobre ocorrências próximas, confirmações, moderação, resolução e avisos do sistema. Se o usuário permitir, o aviso também aparece como notificação do navegador. | 🟡 | "Próximas" hoje significa usuários que já registraram algo a até 600 m (RN44). Avisos por posição em tempo real e a validação em campo (RF44) ainda não funcionam no app. |
| RF44 | **Validação em campo.** Quando o usuário passa a até 200 m de uma ocorrência pendente, é convidado a confirmar ou reportar. | ⛔ | O servidor está pronto (`POST /posicao-gps`), mas o aplicativo ainda não envia a posição. |

### Configurações, informação e instalação

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RF33 | **Recuperar senha por e-mail, em 3 etapas.** (1) informa o e-mail; (2) digita o código de 6 dígitos recebido; (3) só depois de o código ser aceito, define a nova senha. | ✅ | `POST /auth/esqueci-senha`, `/verificar-codigo` e `/resetar-senha` (RN30). Em testes, o e-mail depende da conta SMTP configurada. |
| RF39 | **Preferências do usuário.** Tema (claro, escuro ou do sistema), tamanho do texto, reduzir animações, estilo do mapa, mostrar clima, unidade de temperatura, lembrar última posição, agrupar ocorrências, tamanho dos marcadores, atualizar mapa sozinho, mostrar legenda, localização e notificações do navegador. | ✅ | Tela Configurações. Guardadas só no aparelho (RN40). Botão "Restaurar padrões". |
| RF40 | **Páginas de apoio.** Central de Ajuda (guia, FAQ, moderação, contato), Sobre o DangerMap e **Categorias de perigo** (busca, filtro por gravidade e botão "Ver no mapa"). Rodapé com atalhos em todas as páginas internas. | ✅ | Categorias abre também sem login. |
| RF41 | **Instalar e baixar o app.** O site pode ser instalado como aplicativo (celular e computador); há instalador para Windows na página "Baixar o app". | 🟡 | Android nativo ainda em desenvolvimento (testado só no emulador, sem arquivo para baixar). |
| RF42 | **Baixar meus dados (LGPD).** O usuário baixa um arquivo com conta, ocorrências, notificações e preferências. | ✅ | Configurações > Privacidade. |
| RF45 | **Foto de perfil local.** O usuário escolhe, recorta e ajusta uma foto para o avatar. | ✅ | A foto fica **só no aparelho**; o servidor não guarda (RN41). |
| RF46 | **Menu e navegação padronizados.** Os botões do canto superior direito (notificações, menu, painel admin, perfil/entrar) ficam no mesmo lugar em todas as páginas; o menu segue a ordem fixa: Mapa, Minhas ocorrências, Categorias; Configurações, Painel; Ajuda, Sobre, Baixar o app. | ✅ | |
| RF47 | **Carregamento com esqueleto.** Enquanto uma tela abre, aparece um esqueleto da própria tela em vez de uma tela em branco. | ✅ | Ver RNF-10. |
| RF48 | **Avisos na tela (toasts) sem repetição.** Só um aviso aparece por vez; um novo substitui o anterior e todos somem sozinhos. | ✅ | RN36. |

---

## 2. Requisitos Funcionais — Administrador (painel administrativo)

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RF22 | **Acesso restrito.** Só contas do tipo `admin` entram no painel. | ✅ | Bloqueio no servidor e na tela. |
| RF23 | **Gestão de usuários.** Visualizar, editar, desativar e reativar contas. | 🟡 | Hoje: fila de perfis denunciados, desativar e reativar. Falta listar todos os usuários e editar dados. |
| RF24 | **Reativação de contas.** Reativar contas que sofreram soft delete. | ✅ | `PATCH /admin/usuarios/:id/desbanir`. Só admin (RN04). |
| RF25 | **Fila de perfis denunciados.** Lista os perfis que passaram do limite de denúncias. | ✅ | Limite configurável (RN44). |
| RF26 | **Moderação de ocorrências.** O admin analisa denúncias e decide: **manter** (vira "confirmado"), **resolver** ou **rejeitar** (arquiva e some do mapa). O autor é avisado. | ✅ | Rejeitar arquiva; não apaga o registro (preserva o histórico). |
| RF27 | **Ocultação automática por denúncias.** Ocorrência que atinge o limite de denúncias some do mapa público e entra na fila de moderação. | ✅ | RN13. |
| RF28 | **Expiração de ocorrência resolvida.** Uma rotina automática (a cada hora) arquiva as ocorrências resolvidas há mais de 24 h. | ✅ | Prazo configurável (RN21). |
| RF29 | **Remoção isolada de mídia.** O admin apaga só a foto, mantendo os dados da ocorrência. | ✅ | RN22. |
| RF30 | **Dashboard e relatórios.** Painel com gráficos e exportação do relatório em PDF e em planilha (CSV). | ✅ | |
| RF31 | **Extração por região.** Consulta por **raio** customizável (PostGIS `ST_DWithin`) ou por **estado**, com tabela, filtros, planilha e impressão/PDF. | ✅ | `GET /admin/relatorio-regiao` e `/relatorio-estado`. |
| RF32 | **Categorias e parâmetros globais.** Criar, editar e desativar categorias; configurar parâmetros do sistema. | 🟡 | Categorias: ✅ completo. Parâmetros: só é possível **listar**; falta a tela e a rota para **alterar** (hoje só pelo banco). |

---

## 3. Requisitos Não Funcionais (RNF)

| ID | Requisito | Situação | Observações |
|---|---|---|---|
| RNF-01 | **Buscas geoespaciais em tempo real.** Índice espacial (PostGIS/GiST) nas coordenadas. | ✅ | `idx_ocorrencias_localizacao`. |
| RNF-02 | **Otimização de consultas.** Índices B-Tree em status, data_registro, categoria_id e usuario_id. | ✅ | Mais índices em denúncias e notificações. |
| RNF-03 | **Escalabilidade e disponibilidade.** Arquitetura para picos, com meta de 99,9% de disponibilidade. | 📌 | Depende de hospedagem e monitoramento ainda não definidos. |
| RNF-04 | **Criptografia de senhas.** Senhas guardadas com hash BCrypt. | ✅ | `bcryptjs`, custo 10. |
| RNF-05 | **Auditoria administrativa.** Ações críticas gravadas em `logs_atividades` (usuário, ação, IP e navegador). | 🟡 | Já registra: criar/editar/ativar/desativar categoria, moderar ocorrência, banir/reativar usuário, enviar/remover foto e excluir conta. Falta registrar login, troca de senha e alteração de parâmetros. |
| RNF-06 | **Proteção anti-bot (reCAPTCHA).** Obrigatório no cadastro e no registro de ocorrência. | ✅ | Em desenvolvimento, sem chave configurada, a checagem é dispensada; em produção é obrigatória. |
| RNF-07 | **Conformidade LGPD e backups.** Soft delete, anonimização e backups automáticos. | 🟡 | Soft delete ✅ e "baixar meus dados" ✅ (RF42). **Faltam** anonimização de dados de contas excluídas e rotina automática de backup. |
| RNF-08 | **Multiplataforma e responsividade.** Front modular em React para Web, Android e Desktop. | ✅ | Web responsiva; Windows (Electron) com instalador; Android (Capacitor) testado no emulador. Linux ainda não foi gerado. |
| RNF-09 | **Usabilidade e acessibilidade.** Tema claro/escuro/automático, texto grande, redução de animações, foco visível no teclado, textos sem jargão técnico, botões com tamanho confortável no celular. | ✅ | RF39. |
| RNF-10 | **Desempenho do front-end.** Telas carregadas sob demanda (cada rota vira um pedaço separado), esqueletos de carregamento e agrupamento das ocorrências feito no navegador, sem nova consulta a cada zoom. | ✅ | |
| RNF-11 | **Documentação da API.** Documentação interativa (Swagger) com referência aos requisitos. | ✅ | `/api/docs`. |
| RNF-12 | **Testes automatizados.** Regras críticas cobertas por testes (gravidade, sugestão de categoria, agrupamento, fronteira do Brasil, validações). | 🟡 | 74 testes no servidor. O front-end ainda não tem testes automatizados. |
| RNF-13 | **Resiliência a serviços externos.** Falha de clima, mapa, endereço ou fronteiras não derruba o sistema: tempo limite, cache e plano B. | ✅ | Clima: cache 30 min. Endereço: fila de 1 consulta/s e cache. Fronteiras: cache e retângulo aproximado como plano B. |
| RNF-14 | **Proteção contra abuso.** Limites de requisições nas rotas sensíveis. | 🟡 | Já há limite em criar ocorrência (RN23), recuperação de senha e consultas de localização (RN37). Falta limite de tentativas de login. |
| RNF-15 | **Privacidade da posição.** A posição do usuário serve para centralizar o mapa, validar o raio de registro e mostrar o clima; não é exibida a outros usuários. | ✅ | |

---

## 4. Regras de Negócio (RN)

### Conta, acesso e segurança

| ID | Regra | Situação |
|---|---|---|
| RN01 | **Unicidade de conta.** Restrição `UNIQUE` na coluna e-mail. | ✅ |
| RN02 | **Níveis de acesso.** Perfil padrão `usuario`; rotas administrativas só para `admin`. | ✅ |
| RN03 | **Privacidade e anonimato.** E-mail e hash da senha nunca são expostos. Com `anonimo = true`, a autoria fica oculta no mapa e para terceiros; só o autor e os administradores a enxergam. | ✅ |
| RN04 | **Exclusão lógica.** O usuário passa a `ativo = false`; só um admin reativa. Conta inativa não entra. | ✅ |
| RN15 | **Auditoria preservada.** Os logs permanecem mesmo se o usuário for apagado (`ON DELETE SET NULL`). | ✅ |
| RN15.1 | **Proteção de sessão (blacklist).** Tokens invalidados no logout ficam em `blacklist_tokens` e deixam de valer. | ✅ |
| RN24 | **Autenticação com dois tokens.** Access token de 15 minutos e refresh token de 7 dias em cookie `HttpOnly` (`SameSite=Strict`, `Secure` em produção). | ✅ |
| RN30 | **Recuperação de senha.** O código tem 6 dígitos, vale 15 minutos e só serve para o e-mail que o pediu. A resposta é a mesma exista ou não a conta (não revela quais e-mails estão cadastrados). Máximo de 10 tentativas a cada 15 minutos. | ✅ |
| RN31 | **Senha forte.** Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial. | ✅ |

### Ocorrências

| ID | Regra | Situação |
|---|---|---|
| RN05 | **Limites geográficos.** `CHECK`: latitude entre -90 e 90; longitude entre -180 e 180. | ✅ |
| RN06 | **Status inicial.** Toda ocorrência nasce `pendente`. | ✅ |
| RN07 | **Gravidade.** *(reescrita)* A gravidade é sempre definida pelo sistema (RN25); qualquer valor enviado pelo usuário é ignorado. O padrão `medio` do banco só vale como segurança. | ✅ |
| RN08 | **Restrição de categoria.** Ocorrências ligadas à categoria com `ON DELETE RESTRICT`; categorias são desativadas, não apagadas. | ✅ |
| RN09 | **Sugestão de IA é consultiva.** O campo mantido é `categoria_id`, escolhido pelo usuário. | ✅ |
| RN09.1 | **Descrição opcional.** O campo aceita `NULL` (e tem no máximo 1000 caracteres, RN34). | ✅ |
| RN13 | **Shadowban de ocorrência.** Ocorrência com denúncias no limite sai do mapa público. | ✅ |
| RN19 | **Alteração de status oficial.** Só admin ou rotinas automáticas do sistema mudam o status. | ✅ |
| RN21 | **Ciclo de vida da ocorrência resolvida.** Ocorrências `resolvido` ficam visíveis por 24 h e depois são arquivadas. | ✅ |
| RN22 | **Remoção exclusiva de evidência.** O admin pode definir `imagem_url = NULL` sem apagar a ocorrência. | ✅ |
| RN23 | **Limite de criação.** Máximo de 5 registros a cada 10 minutos por usuário e IP. | ✅ |
| RN25 | **Gravidade automática.** Parte de uma gravidade-base por categoria (alta: acidente, alagamento, assalto, incêndio, vazamento de gás; média: buraco, animal na pista ou morto, pista escorregadia, risco de queda, via interditada; baixa: iluminação, obra, sinalização). Palavras agravantes na descrição sobem um nível, atenuantes descem um nível, nunca passando de baixa/alta. Categorias novas são classificadas pelo nome e descrição. | ✅ |
| RN26 | **Território brasileiro.** O ponto precisa estar dentro da fronteira do Brasil (dados do IBGE, com tolerância de 300 m no litoral). Se o serviço de fronteiras estiver fora do ar, vale um retângulo aproximado do país. | ✅ |
| RN27 | **Raio de registro do cidadão.** O usuário comum só registra a até 1 km da própria posição; o admin não tem esse limite. | 🟡 |
| RN32 | **Fluxo de status.** `pendente` → `confirmado` (admin mantém) → `resolvido` → `arquivado` (24 h depois). Rejeitar leva direto a `arquivado`. Confirmações da comunidade aumentam o contador, mas não mudam o status. | ✅ |
| RN33 | **Foto.** Formatos JPEG, PNG ou WebP, até 5 MB. | ✅ |
| RN34 | **Descrição.** Até 1000 caracteres. | ✅ |
| RN42 | **IA de imagem.** A sugestão só é mostrada com confiança de pelo menos 55%. | ✅ |

### Confirmações, denúncias e moderação

| ID | Regra | Situação |
|---|---|---|
| RN10 | **Unicidade de confirmação.** `UNIQUE(usuario_id, ocorrencia_id)` em `confirmacoes`. | ✅ |
| RN11 | **Integridade.** `qtd_confirmacoes >= 0`. | ✅ |
| RN12 | **Exclusão de ocorrência.** Remove em cascata confirmações, denúncias e interações (`ON DELETE CASCADE`). | ✅ |
| RN14 | **Fila de moderação de usuários.** Usuários denunciados acima do limite vão para o painel admin. | ✅ |
| RN28 | **Confirmação.** O autor não confirma a própria ocorrência; cada usuário confirma uma vez, mas pode retirar a confirmação. | ✅ |
| RN29 | **Denúncia.** O motivo é obrigatório; cada usuário denuncia uma ocorrência uma única vez. Denúncia de perfil guarda também o IP de origem. | ✅ |

### Mapa, clima e localização

| ID | Regra | Situação |
|---|---|---|
| RN16 | **Agrupamento geográfico.** *(reescrita)* O agrupamento é feito no navegador, em pixels da tela, conforme o zoom (RN35). O servidor mantém também `GET /ocorrencias/clusters` (agrupamento por metros). | ✅ |
| RN17 | **Consentimento de localização.** *(reescrita)* O mapa só usa a posição com permissão. Se o GPS for negado, abre na visão padrão (Criciúma-SC, zoom 5) ou na última posição lembrada, e o usuário pode mudar de ideia nas Configurações. | ✅ |
| RN18 | **Limites climáticos.** Temperatura entre -60 °C e 60 °C; umidade entre 0 e 100%. | ✅ |
| RN20 | **Relatórios de área.** Consultas espaciais executadas no PostGIS. | ✅ |
| RN35 | **Níveis de zoom.** Abaixo do zoom 9: nenhuma ocorrência. Do 9 ao 12: bolinhas amarelas (juntam-se se estiverem a menos de ~30 px). Do 13 ao 16: ícones; vizinhos viram balão com número e a cor da maior gravidade. A partir do 17: nada é agrupado; ocorrências sobrepostas abrem em leque. O tamanho dos marcadores acompanha o zoom e a preferência do usuário. | ✅ |
| RN37 | **Limites das consultas de localização.** Busca e endereço: até 90 consultas por minuto por IP. Ao serviço externo de endereços: no máximo 1 por segundo (fila e cache de 7 dias para endereços e 24 h para buscas). | ✅ |
| RN38 | **Cache do clima.** Uma leitura vale por 30 minutos para a mesma região (coordenada arredondada a 0,01°). | ✅ |
| RN39 | **Atualização do mapa.** Com a preferência ligada, o mapa confere ocorrências novas a cada 60 s, só enquanto a aba está visível, e também ao voltar para ela. | ✅ |

### Interface

| ID | Regra | Situação |
|---|---|---|
| RN36 | **Avisos na tela.** Aparece só um por vez, no canto inferior direito; um novo substitui o anterior e todos somem em 4,5 s (inclusive com "reduzir animações" ligado). | ✅ |
| RN40 | **Preferências no aparelho.** Tema, texto, mapa e demais preferências ficam guardados só no aparelho de quem usa. | ✅ |
| RN41 | **Foto de perfil no aparelho.** A foto não é enviada ao servidor. | ✅ |
| RN43 | **Linguagem.** Textos da interface não usam termos técnicos (ex.: "baixar meus dados", não "baixar JSON"). | ✅ |

### Parâmetros e auditoria

| ID | Regra | Situação |
|---|---|---|
| RN44 | **Parâmetros padrão** (tabela `parametros_sistema`, lidos com cache de 60 s): limite de denúncias por ocorrência = 5; limite de denúncias por perfil = 5; horas para arquivar resolvida = 24; raio de validação em campo = 200 m; raio de aviso de proximidade = 600 m. | 🟡 *(só leitura; ver RF32)* |
| RN45 | **Registro de auditoria.** Cada ação crítica grava usuário, ação, IP e navegador em `logs_atividades` (lista em RNF-05). | 🟡 |

---

## 5. Pendências (o que ainda falta)

Ordenadas pelo que mais importa para a entrega.

| # | Item | Requisito | O que fazer |
|---|---|---|---|
| 1 | Alterar parâmetros do sistema pelo painel | RF32, RN44 | Criar a rota `PATCH /admin/parametros` e a tela (com registro em log). |
| 2 | Gestão completa de usuários | RF23 | Listar todos os usuários e permitir editar dados (hoje só a fila de denunciados). |
| 3 | Validação em campo | RF44, RF18 | O app precisa enviar a posição (`POST /posicao-gps`) e abrir a notificação "Ele ainda é real?". |
| 4 | Conferir o raio de 1 km também no servidor | RF09, RN27 | Hoje só o app confere; o servidor aceita qualquer ponto do Brasil. |
| 5 | Filtros de status e período na tela do mapa | RF13 | O servidor já filtra; falta o campo na tela. |
| 6 | Registro flexível do admin por coordenadas e CEP | RF10 | Campos no formulário do admin e busca por CEP. |
| 7 | Backups automáticos e anonimização de contas excluídas | RNF-07 | Rotina de backup do banco e rotina que anonimiza nome/e-mail de contas inativas após um prazo. |
| 8 | Mais ações no log de auditoria | RNF-05 | Registrar login, troca de senha e alteração de parâmetros. |
| 9 | Limite de tentativas de login | RNF-14 | Limitar tentativas por IP e e-mail. |
| 10 | Guardar o código de recuperação de senha com hash | RN30 | Hoje o código fica em texto no banco até expirar (15 min). |
| 11 | Aviso de proximidade por posição real | RF18 | Hoje usa quem já registrou ocorrência a até 600 m; o ideal é usar a posição atual de cada usuário. |
| 12 | App Android para baixar e versão Linux | RF41, RNF-08 | Gerar o APK assinado e o pacote Linux. |
| 13 | Testes automatizados no front-end | RNF-12 | Cobrir agrupamento por zoom, filtros e formulários. |
| 14 | Hospedagem e monitoramento | RNF-03 | Definir onde o sistema vai rodar e como medir a disponibilidade. |

---

## 6. Resumo da situação

Contagem dos itens acima (RF01 a RF48, RNF-01 a RNF-15 e RN01 a RN45, incluindo RN09.1 e RN15.1).

| Grupo | ✅ Atendido | 🟡 Parcial | ⛔ Pendente | 📌 Meta |
|---|---|---|---|---|
| RF (cidadão) | 31 | 5 | 1 | 0 |
| RF (admin) | 9 | 2 | 0 | 0 |
| RNF | 10 | 4 | 0 | 1 |
| RN | 44 | 3 | 0 | 0 |
