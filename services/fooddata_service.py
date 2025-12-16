import requests

class FoodDataService:
    """
    Serviço para integração com a FoodData Central API
    """
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.nal.usda.gov/fdc/v1"
    
    def search_food(self, query, page_size=10):
        """
        Buscar alimentos no FoodData Central
        
        Args:
            query: Nome do alimento
            page_size: Número de resultados
        """
        url = f"{self.base_url}/foods/search"
        
        params = {
            'api_key': self.api_key,
            'query': query,
            'pageSize': page_size,
            'dataType': ['Foundation', 'SR Legacy']
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            foods = []
            for food in data.get('foods', []):
                # Extrair nutrientes principais
                nutrients = {}
                for nutrient in food.get('foodNutrients', []):
                    nutrient_name = nutrient.get('nutrientName')
                    nutrient_value = nutrient.get('value')
                    nutrient_unit = nutrient.get('unitName')
                    
                    if nutrient_name and nutrient_value is not None:
                        nutrients[nutrient_name] = {
                            'value': nutrient_value,
                            'unit': nutrient_unit
                        }
                
                foods.append({
                    'fdcId': food.get('fdcId'),
                    'description': food.get('description'),
                    'dataType': food.get('dataType'),
                    'brandOwner': food.get('brandOwner'),
                    'nutrients': nutrients
                })
            
            return foods
            
        except requests.exceptions.RequestException as e:
            print(f"Erro na API FoodData Central: {str(e)}")
            raise
    
    def get_food_details(self, fdc_id):
        """
        Obter detalhes completos de um alimento específico
        
        Args:
            fdc_id: ID do alimento no FoodData Central
        """
        url = f"{self.base_url}/food/{fdc_id}"
        
        params = {
            'api_key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Extrair informações nutricionais detalhadas
            nutrients = {}
            for nutrient in data.get('foodNutrients', []):
                nutrient_info = nutrient.get('nutrient', {})
                nutrient_name = nutrient_info.get('name')
                
                if nutrient_name:
                    nutrients[nutrient_name] = {
                        'value': nutrient.get('amount'),
                        'unit': nutrient_info.get('unitName'),
                        'derivationCode': nutrient.get('derivationCode'),
                        'nutrientId': nutrient_info.get('id')
                    }
            
            return {
                'fdcId': data.get('fdcId'),
                'description': data.get('description'),
                'dataType': data.get('dataType'),
                'brandOwner': data.get('brandOwner'),
                'ingredients': data.get('ingredients'),
                'servingSize': data.get('servingSize'),
                'servingSizeUnit': data.get('servingSizeUnit'),
                'nutrients': nutrients,
                'foodCategory': data.get('foodCategory', {}).get('description')
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Erro ao buscar detalhes do alimento: {str(e)}")
            raise
    
    def get_nutrients_summary(self, fdc_id):
        """
        Obter resumo dos principais nutrientes
        """
        try:
            food = self.get_food_details(fdc_id)
            nutrients = food.get('nutrients', {})
            
            # Nutrientes principais
            summary = {
                'calories': nutrients.get('Energy', {}).get('value', 0),
                'protein': nutrients.get('Protein', {}).get('value', 0),
                'carbs': nutrients.get('Carbohydrate, by difference', {}).get('value', 0),
                'fat': nutrients.get('Total lipid (fat)', {}).get('value', 0),
                'fiber': nutrients.get('Fiber, total dietary', {}).get('value', 0),
                'sugar': nutrients.get('Sugars, total including NLEA', {}).get('value', 0),
                'sodium': nutrients.get('Sodium, Na', {}).get('value', 0),
                'cholesterol': nutrients.get('Cholesterol', {}).get('value', 0)
            }
            
            return summary
            
        except Exception as e:
            print(f"Erro ao obter resumo de nutrientes: {str(e)}")
            raise