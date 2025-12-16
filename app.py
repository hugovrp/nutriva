import os
from flask_cors import CORS
from flask import Flask, request, jsonify, send_file
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from services.spoonacular_service import SpoonacularService
from services.fooddata_service import FoodDataService
from services.gemini_service import GeminiService
from services.translation_service import TranslationService

app = Flask(__name__, static_folder='./', static_url_path='')
CORS(app)

load_dotenv()

# Inicializar serviços
spoonacular = SpoonacularService(os.getenv("SPOONACULAR_API_KEY"))
fooddata = FoodDataService(os.getenv("FOOD_DATA_API_KEY"))
gemini = GeminiService(os.getenv("GOOGLE_API_KEY"))
translator = TranslationService()

@app.route('/', methods=['GET'])
def home():
    return send_file('./templates/login.html')

@app.route('/api/recipes/search', methods=['POST'])
def search_recipes():
    """
    Buscar receitas com base nos parâmetros do usuário
    """
    try:
        data = request.json
        
        # Parâmetros da busca
        meal_type = data.get('mealType')
        ingredients = data.get('ingredients', [])
        diet = data.get('diet')
        intolerances = data.get('intolerances', [])
        
        # Busca receitas na Spoonacular
        recipes = spoonacular.search_recipes(
            meal_type=meal_type,
            ingredients=ingredients,
            diet=diet,
            intolerances=intolerances
        )
        
        # Sugestões da IA
        ai_context = gemini.analyze_recipes(recipes, {
            'diet': diet,
            'intolerances': intolerances,
            'ingredients': ingredients
        })
        
        return jsonify({
            'success': True,
            'recipes': recipes,
            'ai_suggestions': ai_context
        })
        
    except Exception as e:
        print(f"Erro ao buscar receitas: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe_details(recipe_id):
    """
        Obtem detalhes completos de uma receita (com tradução)
    """
    try:
        recipe_details = spoonacular.get_recipe_information(recipe_id)
        
        # Traduz receita
        translated_recipe = translator.translate_recipe(recipe_details)
        
        return jsonify({
            'success': True,
            'recipe': translated_recipe
        })
        
    except Exception as e:
        print(f"Erro ao buscar detalhes da receita: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/suggestions', methods=['POST'])
def get_ai_suggestions():
    """
        Obtem sugestões personalizadas da IA
    """
    try:
        data = request.json
        
        suggestions = gemini.get_personalized_suggestions(
            ingredients=data.get('ingredients', []),
            diet=data.get('diet'),
            intolerances=data.get('intolerances', []),
            meal_type=data.get('mealType')
        )
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
        
    except Exception as e:
        print(f"Erro ao obter sugestões da IA: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/nutrition/ingredient/<ingredient_name>', methods=['GET'])
def get_ingredient_nutrition(ingredient_name):
    """
        Busca informações nutricionais de um ingrediente específico
    """
    try:
        # Busca no FoodData Central API
        foods = fooddata.search_food(ingredient_name, page_size=5)
        
        if not foods or len(foods) == 0:
            return jsonify({
                'success': False,
                'error': 'Ingrediente não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'foods': foods
        })
        
    except Exception as e:
        print(f"Erro ao buscar informações nutricionais: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/nutrition/details/<int:fdc_id>', methods=['GET'])
def get_nutrition_details(fdc_id):
    """
        Obtem detalhes nutricionais completos de um alimento
    """
    try:
        details = fooddata.get_food_details(fdc_id)
        
        return jsonify({
            'success': True,
            'details': details
        })
        
    except Exception as e:
        print(f"Erro ao buscar detalhes nutricionais: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/nutrition/compare', methods=['POST'])
def compare_ingredients_nutrition():
    """
        Compara informações nutricionais de múltiplos ingredientes
    """
    try:
        data = request.json
        ingredients = data.get('ingredients', [])
        
        if not ingredients or len(ingredients) == 0:
            return jsonify({
                'success': False,
                'error': 'Lista de ingredientes é obrigatória'
            }), 400
        
        # Busca informações nutricionais de cada ingrediente
        results = []
        for ingredient in ingredients:
            try:
                foods = fooddata.search_food(ingredient, page_size=1)
                if foods and len(foods) > 0:
                    # Pega apenas o primeiro resultado
                    food = foods[0]
                    results.append({
                        'ingredient': ingredient,
                        'found': True,
                        'data': food
                    })
                else:
                    results.append({
                        'ingredient': ingredient,
                        'found': False,
                        'data': None
                    })
            except Exception as e:
                print(f"Erro ao buscar {ingredient}: {str(e)}")
                results.append({
                    'ingredient': ingredient,
                    'found': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'comparisons': results
        })
        
    except Exception as e:
        print(f"Erro ao comparar ingredientes: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(debug=True, host='0.0.0.0', port=port)