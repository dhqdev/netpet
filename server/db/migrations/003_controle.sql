-- netpet · 003 · Controle de migrações e dados fixos
-- (a tabela de controle é criada pelo script de migração; aqui ficam os dados que o app precisa para funcionar)

insert into categorias (slug, nome, icone, ordem) values
  ('banho',      'Banho e tosa', 'drop',        1),
  ('vet',        'Veterinário',  'stethoscope', 2),
  ('hotel',      'Hotel',        'bed',         3),
  ('creche',     'Creche',       'school',      4),
  ('adestrador', 'Adestrador',   'whistle',     5),
  ('passeador',  'Passeador',    'leash',       6);

insert into selos (slug, nome, icone) values
  ('patas-ativas',   'Patas Ativas',   'trophy'),
  ('vacinas-em-dia', 'Vacinas em dia', 'shieldCheck'),
  ('explorador',     'Explorador',     'camera'),
  ('resgatado',      'Resgatado',      'heart');
