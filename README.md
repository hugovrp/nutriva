# 🍽️ Nutriva - Planejador Inteligente de Receitas

> Plataforma web que transforma seus ingredientes em refeições deliciosas e nutritivas, com análise de IA e informações nutricionais completas.

[![Python](https://img.shields.io/badge/Python-3.12+-blue?style=for-the-badge&logo=python)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 📋 Sobre o Projeto

**Nutriva** é um sistema inteligente de planejamento de receitas que combina três poderosas APIs para oferecer uma experiência única:

- 🔍 **Busca Inteligente** de receitas baseada em ingredientes disponíveis
- 🤖 **Análise de IA** personalizada usando Google Gemini
- 📊 **Informações Nutricionais** detalhadas dos ingredientes via FoodData Central
- ✂️ **Filtros Avançados** por tipo de dieta e intolerâncias alimentares
- 🌍 **Tradução Automática** de receitas do inglês para português
- 👤 **Perfil Personalizado** com preferências alimentares salvas localmente

> **Disciplina**: Webservices  
> **Curso**: Sistemas para Internet  
> **Tipo**: Trabalho Individual 

---

## 🚀 Tecnologias

### Backend
- **Python 3.12+** - Linguagem principal
- **Flask 3.0** - Framework web minimalista
- **Flask-CORS** - Gerenciamento de CORS
- **Requests** - Cliente HTTP para APIs externas
- **python-dotenv** - Gerenciamento de variáveis de ambiente

### APIs Integradas
- **Spoonacular API** - Busca e detalhes de receitas
- **Google Gemini 2.5 Flash** - Análises e sugestões personalizadas com IA
- **FoodData Central (USDA)** - Informações nutricionais oficiais
- **Deep Translator** - Tradução automática de conteúdo

### Frontend
- **HTML5 + CSS3** - Interface moderna e responsiva
- **JavaScript ES6+** - Lógica de interação
- **IndexedDB** - Banco de dados local do navegador
- **Fetch API** - Comunicação HTTP com backend (usado no `apiService.js`)

> 💡 **Sobre o Fetch API**: Todas as requisições HTTP para o backend Flask são feitas através do `apiService.js`, que encapsula o Fetch API em métodos reutilizáveis como `searchRecipes()`, `getRecipeDetails()`, etc.

### Persistência
- **IndexedDB** - Armazenamento local de:
  - Credenciais de usuários
  - Preferências alimentares

---

## 📦 Pré-requisitos

- [Python 3.12+](https://www.python.org/downloads/)
- [pip](https://pip.pypa.io/en/stable/installation/) (gerenciador de pacotes Python)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

### API Keys Necessárias

Você precisará de chaves de API (gratuitas) para:

1. **Spoonacular API** - [Obter chave](https://spoonacular.com/food-api)
   
2. **Google Gemini API** - [Obter chave](https://makersuite.google.com/app/apikey)
   
3. **FoodData Central API** - [Obter chave](https://fdc.nal.usda.gov/api-key-signup.html)

---

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/hugovrp/nutriva.git
cd nutriva
```

### 2. Crie um ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Spoonacular API - Para buscar receitas
SPOONACULAR_API_KEY=sua_chave_spoonacular_aqui

# Google Gemini API - Para análises de IA
GOOGLE_API_KEY=sua_chave_gemini_aqui

# FoodData Central API - Para informações nutricionais
FOOD_DATA_API_KEY=sua_chave_fooddata_aqui
```

### 5. Execute o servidor

```bash
python app.py
```

O servidor estará disponível em: **http://localhost:5050**

---

## 🎯 Funcionalidades Principais

### 1. Sistema de Autenticação Local

Sistema de login/registro usando **IndexedDB** para armazenamento local:

```javascript
// Usuários e suas preferências são armazenados localmente
const DB_CONFIG = {
    name: 'NutrivaDB',
    version: 1,
    stores: {
        users: 'users',             // Credenciais
        preferences: 'preferences'  // Dieta e intolerâncias
    }
};
```

### 2. Busca Inteligente de Receitas

Busca personalizada considerando:
- ✅ Tipo de refeição (café da manhã, almoço, jantar, sobremesa...)
- ✅ Ingredientes disponíveis
- ✅ Tipo de dieta (vegano, vegetariano, cetogênico...)
- ✅ Intolerâncias alimentares (glúten, lactose, nozes...)

```python
@app.route('/api/recipes/search', methods=['POST'])
def search_recipes():
    recipes = spoonacular.search_recipes(
        meal_type=meal_type,
        ingredients=ingredients,
        diet=diet,
        intolerances=intolerances
    )
    
    # Enriquece com análise de IA
    ai_context = gemini.analyze_recipes(recipes, user_preferences)
```

### 3. Análise Personalizada com IA

O **Google Gemini** analisa as receitas encontradas e fornece:

```
✨ Recomendações personalizadas baseadas em suas preferências
💡 Dicas de como aproveitar melhor os ingredientes
🔄 Sugestões de ajustes nas receitas
```

### 4. Informações Nutricionais Detalhadas

Clique em **"📊 Ver Informações Nutricionais"** no modal de receitas para ver:

- 🔥 **Calorias** por 100g de cada ingrediente
- 💪 **Proteínas** para acompanhamento de macros
- 🍞 **Carboidratos** para controle glicêmico
- 🥑 **Gorduras** para balanço nutricional

```python
@app.route('/api/nutrition/compare', methods=['POST'])
def compare_ingredients_nutrition():
    # Busca dados nutricionais de múltiplos ingredientes
    for ingredient in ingredients:
        foods = fooddata.search_food(ingredient)
        # Compara e retorna tabela nutricional
```

### 5. Tradução Automática

Todas as receitas são automaticamente traduzidas do inglês para português:

- 📝 Títulos das receitas
- 🥘 Lista de ingredientes
- 📋 Instruções de preparo
- ℹ️ Descrições e resumos

```python
def translate_recipe(recipe):
    translated_recipe['title'] = translate_text(recipe['title'])
    translated_recipe['ingredients'] = translate_ingredients(recipe['ingredients'])
    translated_recipe['instructions'] = translate_instructions(recipe['instructions'])
```

---

## 🔒 Considerações de Segurança

- ✅ **Armazenamento Local**: Credenciais mantidas apenas no navegador do usuário
- ✅ **API Keys Protegidas**: Mantidas no backend, nunca expostas ao frontend
- ✅ **CORS Configurado**: Apenas origens permitidas podem acessar a API
- ✅ **Validação de Dados**: Validação dupla (frontend + backend)
- ✅ **Tratamento de Erros**: Mensagens genéricas para o usuário, logs detalhados no servidor

---

## 📊 Dietas Suportadas

- 🌱 **Vegano** - Sem produtos de origem animal
- 🥗 **Vegetariano** - Sem carne ou peixe
- 🐟 **Pescetariano** - Vegetariano com peixe
- 🥩 **Paleo** - Alimentos não processados
- 🥑 **Cetogênica** - Baixo carboidrato, alta gordura
- 🔄 **Low FODMAP** - Para síndrome do intestino irritável
- 🍖 **Onívoro** - Sem restrições

---

## 🚫 Intolerâncias Suportadas

- 🥛 Laticínios
- 🥚 Ovo
- 🌾 Glúten
- 🌾 Grãos
- 🥜 Amendoim
- 🦐 Frutos do Mar
- 🌰 Gergelim
- 🦞 Crustáceos
- 🌰 Soja
- ⚗️ Sulfitos
- 🌰 Nozes
- 🌾 Trigo

---

## 📝 API Endpoints

### Receitas
```
POST   /api/recipes/search           Buscar receitas
GET    /api/recipes/<id>             Detalhes da receita
```

### Inteligência Artificial
```
POST   /api/ai/suggestions           Sugestões personalizadas
```

### Nutrição
```
GET    /api/nutrition/ingredient/<nome>     Info de um ingrediente
GET    /api/nutrition/details/<fdc_id>      Detalhes completos
POST   /api/nutrition/compare                Comparar ingredientes
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é um trabalho acadêmico desenvolvido para a disciplina de **Webservices** do curso de **Sistemas para Internet**.

---

## 👨‍💻 Autor

**Hugo Vinícius Rodrigues Pereira**

[![GitHub](https://img.shields.io/badge/GitHub-hugovrp-black?style=flat-square&logo=github)](https://github.com/hugovrp)