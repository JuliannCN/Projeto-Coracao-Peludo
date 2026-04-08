# Corações Peludos

Plataforma web para **adoção responsável de animais**, conectando usuários e ONGs, além de oferecer um espaço de **fórum para troca de experiências, dicas e curiosidades**.

> Status do projeto: Em desenvolvimento (não totalmente funcional)

---

## Sobre o Projeto

O **Corações Peludos** tem como objetivo facilitar o processo de adoção de animais, promovendo uma conexão mais eficiente entre pessoas interessadas em adotar e organizações responsáveis.

Além disso, o sistema busca criar uma comunidade ativa através de um fórum interativo.

---

## Status Atual

O projeto ainda está em fase de desenvolvimento e pode apresentar:

* Funcionalidades incompletas
* Integrações parciais (Frontend ↔ Backend)
* Possíveis erros de autenticação e banco de dados
* Rotas ainda em construção

---

##  Tecnologias Utilizadas

###  Backend

* Python
* FastAPI
* MongoDB
* JWT (Autenticação)
* Bcrypt (Hash de senha)

###  Frontend

* HTML / CSS / JavaScript
* Consumo de API via Fetch

---

## Como Executar o Projeto

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd coracoes-peludos
```

---

### 2. Crie um ambiente virtual

```bash
python -m venv venv
```

Ative o ambiente:

* Windows:

```bash
venv\Scripts\activate
```

* Linux/Mac:

```bash
source venv/bin/activate
```

---

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

---

### 4. Configure o arquivo `.env`

Crie um arquivo `.env` na raiz do backend:

```env
MONGO_URI=sua_string_do_mongo
JWT_SECRET=sua_chave_secreta
```

---

### 5. Execute o backend

```bash
uvicorn server:app --reload
```

A API estará disponível em:

```
http://localhost:8000
```

---

### 6. Execute o frontend

Abra o arquivo:

```
public/index.html
```

Ou utilize uma extensão como **Live Server** no VS Code.

---

## 🔐 Funcionalidades (Planejadas / Parciais)

* [x] Estrutura base do backend
* [x] Conexão com MongoDB
* [x] Sistema de autenticação (JWT)
* [ ] Cadastro e login de usuários
* [ ] Cadastro de pets por ONGs
* [ ] Sistema de adoção
* [ ] Fórum com postagens e comentários
* [ ] Favoritos
* [ ] Chat entre usuário e ONG

---

## ⚠️ Problemas Conhecidos

* Uso inconsistente entre PyMongo e async/await
* Configuração de cookies pode falhar em ambiente local
* Rotas podem não estar totalmente integradas
* Frontend ainda básico e não totalmente conectado à API

---

## 🚀 Próximos Passos

* Padronizar acesso ao banco (async ou sync)
* Melhorar estrutura das rotas
* Criar interface mais moderna (UI/UX)
* Implementar autenticação completa no frontend
* Adicionar tratamento de erros mais robusto

---

## 🤝 Contribuição

Este projeto está em desenvolvimento e aberto para melhorias.

Sugestões, correções e ideias são bem-vindas!

---

## 📄 Licença

Este projeto é de uso educacional.

---

## 🧠 Autor

Desenvolvido por Juliann Costa Nascimento, Augusto Mendes Martins e Gustavo Vitor Dos Reis.
Projeto acadêmico com foco em aprendizado de desenvolvimento web fullstack 🚀
