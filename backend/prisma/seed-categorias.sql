-- Categorias iniciais do DangerMap. Rode UMA vez num banco novo (pode rodar de novo sem duplicar).
INSERT INTO categorias (nome, descricao, ativo) VALUES
  ('Buraco na Via', 'Rachaduras, crateras ou asfalto danificado que põe em risco o trânsito.', true),
  ('Iluminação Pública', 'Postes com lâmpadas apagadas ou fiação exposta gerando zonas escuras perigosas.', true),
  ('Alagamento', 'Pontos de acúmulo crítico de água durante ou após chuvas fortes.', true),
  ('Sinalização Danificada', 'Placas de trânsito arrancadas, semáforos intermitentes ou faixas apagadas.', true),
  ('Foco de Incêndio', 'Queimadas, fumaça densa ou fogo ativo próximo a áreas urbanas ou de vegetação.', true),
  ('Acidente de Trânsito', 'Colisões entre veículos ou atropelamentos que ainda bloqueiam a via.', true),
  ('Obra na Via', 'Obras, valas ou equipamentos de construção interditando parte da via sem sinalização adequada.', true),
  ('Pista Escorregadia', 'Óleo, lama ou piso liso que reduz a aderência e aumenta o risco de derrapagem.', true),
  ('Via Interditada', 'Bloqueios, barreiras ou desmoronamentos que impedem a passagem na via.', true),
  ('Vazamento de Gás', 'Vazamento de gás ou odor forte que representa risco de explosão ou intoxicação.', true),
  ('Animal na Pista', 'Animais soltos atravessando ou parados na via, oferecendo risco de colisão.', true),
  ('Animal Morto na Via', 'Carcaça de animal na pista, obstruindo o tráfego e atraindo outros animais.', true),
  ('Assalto ou Roubo', 'Local com histórico recente de assaltos ou roubos, exigindo atenção redobrada.', true),
  ('Risco de Queda', 'Calçadas quebradas, pisos molhados ou desníveis que aumentam o risco de quedas.', true)
ON CONFLICT (nome) DO NOTHING;
