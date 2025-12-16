import requests

class SpoonacularService:
    """
        Serviço para integração com a Spoonacular API
    """
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.spoonacular.com"
    
    def search_recipes(self, meal_type, ingredients, diet=None, intolerances=None, number=12):
        """
            Busca receitas com base em parâmetros
            
            Args:
                meal_type: Tipo de refeição (ex: "main course", "dessert")
                ingredients: Lista de ingredientes
                diet: Tipo de dieta (ex: "vegan", "vegetarian")
                intolerances: Lista de intolerâncias
                number: Número de receitas a retornar
        """
        url = f"{self.base_url}/recipes/complexSearch"
        
        params = {
            'apiKey': self.api_key,
            'type': meal_type,
            'includeIngredients': ','.join(ingredients),
            'number': number,
            'addRecipeInformation': True,
            'fillIngredients': True,
            'instructionsRequired': True
        }
        
        if diet:
            params['diet'] = diet
        
        if intolerances:
            params['intolerances'] = ','.join(intolerances)
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Formata receitas
            recipes = []
            for recipe in data.get('results', []):
                recipes.append({
                    'id': recipe.get('id'),
                    'title': recipe.get('title'),
                    'image': recipe.get('image'),
                    'readyInMinutes': recipe.get('readyInMinutes'),
                    'servings': recipe.get('servings'),
                    'sourceUrl': recipe.get('sourceUrl'),
                    'summary': recipe.get('summary', ''),
                    'dishTypes': recipe.get('dishTypes', []),
                    'diets': recipe.get('diets', []),
                    'cuisines': recipe.get('cuisines', [])
                })
            
            return recipes
            
        except requests.exceptions.RequestException as e:
            print(f"Erro na API Spoonacular: {str(e)}")
            raise
    
    def get_recipe_information(self, recipe_id):
        """
            Obtem informações detalhadas de uma receita
        """
        url = f"{self.base_url}/recipes/{recipe_id}/information"
        
        params = {
            'apiKey': self.api_key,
            'includeNutrition': False
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                'id': data.get('id'),
                'title': data.get('title'),
                'image': data.get('image'),
                'readyInMinutes': data.get('readyInMinutes'),
                'servings': data.get('servings'),
                'sourceUrl': data.get('sourceUrl'),
                'summary': data.get('summary'),
                'instructions': data.get('instructions'),
                'extendedIngredients': data.get('extendedIngredients', []),
                'analyzedInstructions': data.get('analyzedInstructions', []),
                'dishTypes': data.get('dishTypes', []),
                'diets': data.get('diets', []),
                'cuisines': data.get('cuisines', []),
                'cheap': data.get('cheap', False),
                'veryHealthy': data.get('veryHealthy', False),
                'veryPopular': data.get('veryPopular', False)
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Erro ao buscar informações da receita: {str(e)}")
            raise