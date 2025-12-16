const API_BASE_URL = 'http://localhost:5050/api';

class APIService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Método auxiliar para fazer requisições
    async _request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            console.log(`Fazendo requisição para: ${url}`, config);
            
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Resposta recebida:', data);
            
            return data;

        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }

    // Busca receitas com base nos parâmetros do usuário    
    async searchRecipes(params) {
        try {
            // Validar parâmetros
            if (!params.mealType) {
                throw new Error('Tipo de refeição é obrigatório');
            }
            
            if (!params.ingredients || params.ingredients.length === 0) {
                throw new Error('Pelo menos um ingrediente é necessário');
            }

            return await this._request('/recipes/search', {
                method: 'POST',
                body: JSON.stringify({
                    mealType: params.mealType,
                    ingredients: params.ingredients,
                    diet: params.diet || null,
                    intolerances: params.intolerances || []
                })
            });

        } catch (error) {
            console.error('Erro ao buscar receitas:', error);
            throw error;
        }
    }

    // Obtem detalhes de uma receita específica
    async getRecipeDetails(recipeId) {
        try {
            if (!recipeId) {
                throw new Error('ID da receita é obrigatório');
            }

            return await this._request(`/recipes/${recipeId}`, {
                method: 'GET'
            });

        } catch (error) {
            console.error('Erro ao buscar detalhes da receita:', error);
            throw error;
        }
    }

    // Obtem sugestões do Gemini
    async getAISuggestions(params) {
        try {
            return await this._request('/ai/suggestions', {
                method: 'POST',
                body: JSON.stringify({
                    ingredients: params.ingredients || [],
                    mealType: params.mealType || '',
                    diet: params.diet || null,
                    intolerances: params.intolerances || []
                })
            });

        } catch (error) {
            console.error('Erro ao obter sugestões da IA:', error);
            throw error;
        }
    }

    // Busca informações nutricionais de um ingrediente
    async getIngredientNutrition(ingredientName) {
        try {
            if (!ingredientName) {
                throw new Error('Nome do ingrediente é obrigatório');
            }

            return await this._request(`/nutrition/ingredient/${encodeURIComponent(ingredientName)}`, {
                method: 'GET'
            });

        } catch (error) {
            console.error('Erro ao buscar informações nutricionais:', error);
            throw error;
        }
    }

    // Obtem detalhes nutricionais completos de um alimento
    async getNutritionDetails(fdcId) {
        try {
            if (!fdcId) {
                throw new Error('ID do alimento é obrigatório');
            }

            return await this._request(`/nutrition/details/${fdcId}`, {
                method: 'GET'
            });

        } catch (error) {
            console.error('Erro ao buscar detalhes nutricionais:', error);
            throw error;
        }
    }

    // Compara informações nutricionais de múltiplos ingredientes
    async compareIngredientsNutrition(ingredients) {
        try {
            if (!ingredients || ingredients.length === 0) {
                throw new Error('Lista de ingredientes é obrigatória');
            }

            return await this._request('/nutrition/compare', {
                method: 'POST',
                body: JSON.stringify({ ingredients })
            });

        } catch (error) {
            console.error('Erro ao comparar ingredientes:', error);
            throw error;
        }
    }

    // Verifica status da API
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '/')}`);
            return response.ok;
        } catch (error) {
            console.error('API não está respondendo:', error);
            return false;
        }
    }
}

const apiService = new APIService();
export default apiService;