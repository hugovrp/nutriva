import { logout, getCurrentUser } from './routeGuard.js';
import dbManager from './database.js';
import apiService from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    initIndex();
});

function initIndex() {
    const mealTypeSelect = document.getElementById('mealTypeSelect');
    const ingredientInput = document.getElementById('ingredientInput');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const ingredientTags = document.getElementById('ingredientTags');
    const searchBtn = document.getElementById('searchBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const recipesSection = document.getElementById('recipesSection');
    const recipesGrid = document.getElementById('recipesGrid');
    const recipesCount = document.getElementById('recipesCount');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');

    let selectedMealType = '';
    let ingredients = [];
    let recipes = [];
    let userPreferences = null;

    // Tipos de refeição
    const mealTypes = [
        { value: 'main course', label: 'Prato Principal', emoji: '🍽️' },
        { value: 'side dish', label: 'Acompanhamento', emoji: '🥗' },
        { value: 'dessert', label: 'Sobremesa', emoji: '🍰' },
        { value: 'appetizer', label: 'Entrada', emoji: '🥙' },
        { value: 'salad', label: 'Salada', emoji: '🥗' },
        { value: 'bread', label: 'Pão', emoji: '🍞' },
        { value: 'breakfast', label: 'Café da Manhã', emoji: '🍳' },
        { value: 'soup', label: 'Sopa', emoji: '🍲' },
        { value: 'beverage', label: 'Bebida', emoji: '🥤' },
        { value: 'sauce', label: 'Molho', emoji: '🥫' },
        { value: 'marinade', label: 'Marinada', emoji: '🧂' },
        { value: 'fingerfood', label: 'Petisco', emoji: '🍢' },
        { value: 'snack', label: 'Lanche', emoji: '🍿' },
        { value: 'drink', label: 'Drink', emoji: '🍹' }
    ];

    // Carrega preferências do usuário
    async function loadUserPreferences() {
        try {
            const user = getCurrentUser();
            userPreferences = await dbManager.getPreferences(user.email);
            console.log('Preferências carregadas:', userPreferences);
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }

    mealTypes.forEach(meal => {
        const option = document.createElement('option');
        option.value = meal.value;
        option.textContent = `${meal.emoji} ${meal.label}`;
        mealTypeSelect.appendChild(option);
    });

    mealTypeSelect.addEventListener('change', (e) => {
        selectedMealType = e.target.value;
        updateSearchButton();
    });

    addIngredientBtn.addEventListener('click', addIngredient);
    
    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addIngredient();
        }
    });

    searchBtn.addEventListener('click', handleSearch);

    logoutBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente sair?')) {
            logout();
        }
    });

    function addIngredient() {
        const value = ingredientInput.value.trim();
        
        if (!value) return;
        
        if (ingredients.includes(value.toLowerCase())) {
            showNotification('Este ingrediente já foi adicionado!', 'warning');
            return;
        }

        ingredients.push(value.toLowerCase());
        ingredientInput.value = '';
        renderIngredientTags();
        updateSearchButton();
    }

    function removeIngredient(index) {
        ingredients.splice(index, 1);
        renderIngredientTags();
        updateSearchButton();
    }

    function renderIngredientTags() {
        if (ingredients.length === 0) {
            ingredientTags.style.display = 'none';
            ingredientTags.innerHTML = '';
            return;
        }

        ingredientTags.style.display = 'flex';
        ingredientTags.innerHTML = '';

        ingredients.forEach((ingredient, index) => {
            const tag = document.createElement('div');
            tag.className = 'ingredient-tag';
            
            tag.innerHTML = `
                <span>${ingredient}</span>
                <button class="remove-tag-btn" data-index="${index}" type="button">
                    ✕
                </button>
            `;

            const removeBtn = tag.querySelector('.remove-tag-btn');
            removeBtn.addEventListener('click', () => {
                removeIngredient(index);
            });

            ingredientTags.appendChild(tag);
        });
    }

    function updateSearchButton() {
        searchBtn.disabled = !(selectedMealType && ingredients.length > 0);
    }

    async function handleSearch() {
        if (!selectedMealType || ingredients.length === 0) return;

        emptyState.style.display = 'none';
        recipesSection.style.display = 'none';
        loadingState.style.display = 'block';
        searchBtn.disabled = true;

        try {
            const searchParams = {
                mealType: selectedMealType,
                ingredients: ingredients,
                diet: userPreferences?.diet || null,
                intolerances: userPreferences?.intolerances || []
            };

            console.log('Buscando receitas com:', searchParams);

            const response = await apiService.searchRecipes(searchParams);

            if (response.success) {
                recipes = response.recipes || [];
            
                if (response.ai_suggestions?.analysis) {
                    showAISuggestions(response.ai_suggestions.analysis);
                }
                
                renderRecipes();
            } else {
                throw new Error(response.error || 'Erro ao buscar receitas');
            }

        } catch (error) {
            console.error('Erro ao buscar receitas:', error);
            showNotification('Erro ao buscar receitas. Verifique se o servidor está rodando.', 'error');
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
        } finally {
            searchBtn.disabled = false;
        }
    }

    function renderRecipes() {
        loadingState.style.display = 'none';

        if (recipes.length === 0) {
            emptyState.querySelector('.empty-title').textContent = 'Nenhuma receita encontrada';
            emptyState.querySelector('.empty-text').textContent = 
                'Tente usar diferentes ingredientes ou tipo de refeição';
            emptyState.style.display = 'block';
            recipesSection.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        recipesSection.style.display = 'block';
        recipesCount.textContent = recipes.length;

        recipesGrid.innerHTML = '';

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
            // Imagem (usar placeholder se não houver)
            const imageUrl = recipe.image || 'https://via.placeholder.com/400x300?text=Sem+Imagem';
            
            // Badges de dieta
            const dietBadges = recipe.diets?.slice(0, 2).map(diet => 
                `<span class="recipe-badge">${diet}</span>`
            ).join('') || '';

            card.innerHTML = `
                <img src="${imageUrl}" 
                     alt="${recipe.title}" 
                     class="recipe-image"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Sem+Imagem'" />
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-time">⏱️ ${recipe.readyInMinutes || '30'} min</span>
                        <span class="recipe-servings">🍽️ ${recipe.servings || '2'} porções</span>
                    </div>
                    ${dietBadges ? `<div class="recipe-badges">${dietBadges}</div>` : ''}
                </div>
            `;

            card.addEventListener('click', () => {
                showRecipeDetails(recipe.id);
            });

            recipesGrid.appendChild(card);
        });
    }

    async function showRecipeDetails(recipeId) {
        try {
            loadingState.style.display = 'block';
            recipesSection.style.display = 'none';

            const response = await apiService.getRecipeDetails(recipeId);

            if (response.success) {
                displayRecipeModal(response.recipe);
            } else {
                throw new Error(response.error || 'Erro ao carregar detalhes');
            }

        } catch (error) {
            console.error('Erro ao carregar detalhes da receita:', error);
            showNotification('Erro ao carregar detalhes da receita', 'error');
        } finally {
            loadingState.style.display = 'none';
            recipesSection.style.display = 'block';
        }
    }

    function displayRecipeModal(recipe) {
        const ingredientsList = recipe.extendedIngredients?.length > 0
            ? recipe.extendedIngredients.map(ing => 
                `<li>${ing.original || ing.name}</li>`
              ).join('')
            : '<li>Ingredientes não disponíveis</li>';

        let instructionsHTML = '';
        if (recipe.instructions) {
            instructionsHTML = `
                <div class="recipe-instructions">
                    <h3>📝 Modo de Preparo</h3>
                    <div class="instructions-content">${recipe.instructions}</div>
                </div>
            `;
        } else if (recipe.analyzedInstructions?.length > 0) {
            const steps = recipe.analyzedInstructions[0].steps.map(step => 
                `<li><strong>Passo ${step.number}:</strong> ${step.step}</li>`
            ).join('');
            instructionsHTML = `
                <div class="recipe-instructions">
                    <h3>📝 Modo de Preparo</h3>
                    <ol class="instructions-list">${steps}</ol>
                </div>
            `;
        }

        // Cria modal
        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">✕</button>
                <h2>${recipe.title}</h2>
                <img src="${recipe.image}" alt="${recipe.title}" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px;">
                
                <div class="recipe-info">
                    <p><strong>⏱️ Tempo:</strong> ${recipe.readyInMinutes} minutos</p>
                    <p><strong>🍽️ Porções:</strong> ${recipe.servings}</p>
                </div>

                <div class="recipe-ingredients">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3>🥘 Ingredientes</h3>
                        <button class="nutrition-btn" id="showNutritionBtn">
                            📊 Ver Informações Nutricionais
                        </button>
                    </div>
                    <ul class="ingredients-list">
                        ${ingredientsList}
                    </ul>
                    <div id="nutritionInfo" style="display: none; margin-top: 20px;"></div>
                </div>

                ${instructionsHTML}

                ${recipe.summary ? `
                    <div class="recipe-summary">
                        <h3>ℹ️ Sobre a Receita</h3>
                        ${recipe.summary}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        
        // Botão de informações nutricionais
        const nutritionBtn = modal.querySelector('#showNutritionBtn');
        const nutritionInfo = modal.querySelector('#nutritionInfo');
        
        if (nutritionBtn && recipe.extendedIngredients?.length > 0) {
            nutritionBtn.addEventListener('click', async () => {
                nutritionBtn.disabled = true;
                nutritionBtn.textContent = '⏳ Carregando...';
                
                try {
                    await showNutritionInfo(recipe.extendedIngredients, nutritionInfo);
                    nutritionBtn.textContent = '✓ Informações Carregadas';
                } catch (error) {
                    nutritionBtn.disabled = false;
                    nutritionBtn.textContent = '📊 Ver Informações Nutricionais';
                    showNotification('Erro ao carregar informações nutricionais', 'error');
                }
            });
        }
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async function showNutritionInfo(ingredients, container) {
        try {
            // Extrai nome dos ingredientes
            const ingredientNames = ingredients.slice(0, 5).map(ing => 
                ing.name || ing.original.split(' ')[0]
            );
            
            console.log('Buscando informações nutricionais para:', ingredientNames);
            
            const response = await apiService.compareIngredientsNutrition(ingredientNames);
            
            if (!response.success) {
                throw new Error(response.error || 'Erro ao buscar informações');
            }
            
            // Renderiza informações nutricionais
            let html = '<div class="nutrition-comparison"><h4>📊 Comparação Nutricional (por 100g)</h4>';
            
            response.comparisons.forEach(comparison => {
                if (comparison.found && comparison.data) {
                    const nutrients = comparison.data.nutrients;
                    
                    html += `
                        <div class="nutrition-item">
                            <h5>${comparison.ingredient}</h5>
                            <div class="nutrition-grid">
                                ${nutrients['Energy'] ? `<p><strong>Calorias:</strong> ${nutrients['Energy'].value} ${nutrients['Energy'].unit}</p>` : ''}
                                ${nutrients['Protein'] ? `<p><strong>Proteína:</strong> ${nutrients['Protein'].value} ${nutrients['Protein'].unit}</p>` : ''}
                                ${nutrients['Carbohydrate, by difference'] ? `<p><strong>Carboidratos:</strong> ${nutrients['Carbohydrate, by difference'].value} ${nutrients['Carbohydrate, by difference'].unit}</p>` : ''}
                                ${nutrients['Total lipid (fat)'] ? `<p><strong>Gordura:</strong> ${nutrients['Total lipid (fat)'].value} ${nutrients['Total lipid (fat)'].unit}</p>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="nutrition-item">
                            <h5>${comparison.ingredient}</h5>
                            <p style="color: #999;">Informações não disponíveis</p>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
            
            container.innerHTML = html;
            container.style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao mostrar informações nutricionais:', error);
            throw error;
        }
    }

    function showAISuggestions(analysis) {
        const existingSuggestion = document.querySelector('.ai-suggestion');
        if (existingSuggestion) {
            existingSuggestion.remove();
        }

        if (!analysis || 
            analysis.includes('não disponível') || 
            analysis.includes('Não foi possível') ||
            analysis.includes('Verifique sua API key')) {
            console.log('IA não disponível ou erro:', analysis);
            return;
        }

        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'ai-suggestion';
        suggestionDiv.innerHTML = `
            <div class="ai-header">
                <span class="ai-icon">🤖</span>
                <strong>Análise Personalizada</strong>
            </div>
            <p>${analysis}</p>
        `;

        recipesSection.insertBefore(suggestionDiv, recipesGrid);
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    loadUserPreferences();
    const user = getCurrentUser();
    console.log('Usuário logado:', user.name, user.email);
}