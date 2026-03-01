INSERT INTO users (name,email,password,role,cpf,cnpj,birth_date,phone,bio,verified) VALUES
('Carlos Mendes','carlos@email.com','hash','TUTOR','12345678900',NULL,'1990-05-10','11999990001','Amo cães',true),
('Ana Souza','ana@email.com','hash','TUTOR','98765432100',NULL,'1995-03-22','11999990002','Adoro gatos',true),
('Pedro Lima','pedro@email.com','hash','TUTOR','74185296300',NULL,'1988-08-12','11999990003','Quero adotar',true),
('ONG Vida Animal','vida@email.com','hash','ONG',NULL,'12345678000190',NULL,'1133333333','Resgate animal',true),
('ONG Patinhas','patinhas@email.com','hash','ONG',NULL,'98765432000110',NULL,'1144444444','Proteção animal',true),
('Juliana Rocha','juliana@email.com','hash','TUTOR','11122233344',NULL,'1992-01-15','11999990004','Mãe de pet',true),
('Marcos Silva','marcos@email.com','hash','TUTOR','22233344455',NULL,'1985-07-30','11999990005','Voluntário',true),
('ONG Amor Pet','amorpet@email.com','hash','ONG',NULL,'22333444000155',NULL,'1155555555','Adoção responsável',true),
('Fernanda Alves','fernanda@email.com','hash','TUTOR','33344455566',NULL,'1998-09-09','11999990006','Amante de animais',true),
('Ricardo Santos','ricardo@email.com','hash','TUTOR','44455566677',NULL,'1987-11-11','11999990007','Quer adotar gato',true);

INSERT INTO addresses (user_id,cep,street,number,neighborhood,city,state) VALUES
(1,'01001-000','Rua A','100','Centro','São Paulo','SP'),
(2,'20000-000','Rua B','200','Copacabana','Rio de Janeiro','RJ'),
(3,'30000-000','Rua C','300','Savassi','Belo Horizonte','MG'),
(4,'40000-000','Av. D','400','Centro','Salvador','BA'),
(5,'50000-000','Rua E','500','Boa Viagem','Recife','PE'),
(6,'60000-000','Rua F','600','Aldeota','Fortaleza','CE'),
(7,'70000-000','Rua G','700','Asa Sul','Brasília','DF'),
(8,'80000-000','Rua H','800','Centro','Curitiba','PR'),
(9,'90000-000','Rua I','900','Moinhos','Porto Alegre','RS'),
(10,'11000-000','Rua J','1000','Gonzaga','Santos','SP');

INSERT INTO animals (owner_id,name,species,breed,age,size,gender,vaccinated,castrated,description,status) VALUES
(4,'Thor','Cachorro','Labrador',3,'Grande','Macho',true,true,'Brincalhão','AVAILABLE'),
(4,'Luna','Gato','Siamês',2,'Pequeno','Fêmea',true,true,'Carinhosa','AVAILABLE'),
(5,'Max','Cachorro','Vira-lata',4,'Médio','Macho',true,false,'Energético','AVAILABLE'),
(5,'Mia','Gato','Persa',1,'Pequeno','Fêmea',true,false,'Calma','AVAILABLE'),
(8,'Bob','Cachorro','Poodle',5,'Pequeno','Macho',true,true,'Amigável','RESERVED'),
(8,'Mel','Gato','Angorá',3,'Pequeno','Fêmea',true,true,'Dócil','AVAILABLE'),
(4,'Rex','Cachorro','Pastor Alemão',6,'Grande','Macho',true,true,'Protetor','ADOPTED'),
(5,'Nina','Gato','Vira-lata',2,'Pequeno','Fêmea',true,false,'Brincalhona','AVAILABLE'),
(8,'Toby','Cachorro','Bulldog',4,'Médio','Macho',true,true,'Companheiro','AVAILABLE'),
(4,'Lili','Gato','Maine Coon',3,'Grande','Fêmea',true,true,'Independente','AVAILABLE');

INSERT INTO adoption_requests (animal_id, requester_id, status, message, interview_date) VALUES
(1,1,'PENDING','Tenho espaço grande e experiência com cães','2025-02-10'),
(2,2,'APPROVED','Sempre quis um gato siamês','2025-02-05'),
(3,3,'REJECTED','Moro em apartamento pequeno','2025-02-03'),
(4,6,'PENDING','Tenho quintal fechado','2025-02-12'),
(5,7,'PENDING','Já tive poodle antes','2025-02-15'),
(6,9,'APPROVED','Tenho telas nas janelas','2025-02-01'),
(7,10,'REJECTED','Não tenho muito tempo livre','2025-01-28'),
(8,1,'PENDING','Amo gatos brincalhões','2025-02-20'),
(9,2,'PENDING','Procuro um companheiro','2025-02-18'),
(10,3,'APPROVED','Tenho casa ampla','2025-01-30');

INSERT INTO shelter_requests (animal_id, ong_id, status, notes) VALUES
(1,4,'ACCEPTED','Espaço disponível'),
(2,4,'PENDING','Avaliação em andamento'),
(3,5,'DECLINED','Lotação máxima'),
(4,5,'ACCEPTED','Temos estrutura adequada'),
(5,8,'PENDING','Análise de documentação'),
(6,8,'ACCEPTED','Pode ser acolhido'),
(7,4,'DECLINED','Sem espaço no momento'),
(8,5,'PENDING','Aguardando visita'),
(9,8,'ACCEPTED','Animal saudável'),
(10,4,'PENDING','Processo inicial');

INSERT INTO forum_posts (author_id, title, content, category, likes) VALUES
(1,'Como preparar a casa para adoção?','Quais cuidados devo ter antes de adotar?','Adoção',5),
(2,'Melhor ração para gatos?','Sugestões de ração premium','Alimentação',8),
(3,'Vacinação anual é obrigatória?','Dúvidas sobre calendário de vacinas','Saúde',4),
(6,'Castrar é seguro?','Quais benefícios da castração?','Saúde',6),
(7,'Passeios diários','Quantas vezes devo passear com meu cão?','Cuidados',3),
(9,'Adaptação com crianças','Como introduzir o pet na família?','Adoção',9),
(10,'Areia para gatos','Qual marca recomendam?','Cuidados',2),
(4,'Importância da adoção responsável','Adotar é um ato de amor','Informativo',12),
(5,'Voluntariado em ONGs','Como posso ajudar?','Voluntariado',7),
(8,'Eventos de adoção','Participe do nosso evento','Eventos',10);

INSERT INTO forum_comments (post_id, author_id, content) VALUES
(1,2,'Prepare telas e caminhas confortáveis.'),
(2,3,'Uso ração super premium e recomendo.'),
(3,1,'Sim, é essencial manter em dia.'),
(4,7,'A castração evita doenças futuras.'),
(5,6,'Passeio pelo menos duas vezes ao dia.'),
(6,9,'Adaptação deve ser gradual.'),
(7,10,'Prefiro areia biodegradável.'),
(8,1,'Adoção salva vidas!'),
(9,2,'Voluntariado é gratificante.'),
(10,3,'Eventos ajudam muito na divulgação.');

INSERT INTO news (title, content, author, published) VALUES
('Feira de adoção em São Paulo','Evento reúne mais de 50 animais','Equipe CP',true),
('Campanha de vacinação gratuita','Vacinação antirrábica disponível','Equipe CP',true),
('Aumento de adoções em 2025','Dados mostram crescimento de 20%','Equipe CP',true),
('Nova lei de proteção animal','Reforço nas penalidades','Equipe CP',true),
('Cuidados no verão','Proteja seu pet do calor','Equipe CP',true),
('Importância da microchipagem','Segurança para seu animal','Equipe CP',true),
('Resgate histórico','ONG salva 30 cães','Equipe CP',true),
('Doações aumentam no inverno','Solidariedade cresce','Equipe CP',true),
('Castração reduz abandono','Estudo comprova eficácia','Equipe CP',true),
('Evento beneficente','Arrecadação para abrigos','Equipe CP',true);

INSERT INTO favorites (user_id, animal_id) VALUES
(1,1),
(2,2),
(3,3),
(6,4),
(7,5),
(9,6),
(10,7),
(1,8),
(2,9),
(3,10);