import google.generativeai as genai
import json

class GeminiService:
    """
        Serviço para integração com o Google Gemini
    """
    
    def __init__(self, api_key):
        if not api_key:
            print("AVISO: API key do Gemini não configurada")
            self.model = None
            return
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        except Exception as e:
            print(f"Erro ao configurar Gemini: {str(e)}")
            self.model = None
    
    def analyze_recipes(self, recipes, user_preferences):
        """
            Analisa receitas e fornecer insights personalizados
        """
        if not self.model:
            return {
                'analysis': 'IA não disponível no momento. Verifique sua API key do Google Gemini.',
                'recommendations': []
            }
        
        if not recipes:
            return {
                'analysis': 'Nenhuma receita encontrada para análise.',
                'recommendations': []
            }
        
        recipe_titles = [r.get('title', 'Sem título') for r in recipes[:5]]
        
        prompt = f"""
                    Você é um assistente culinário especializado. Analise as seguintes receitas considerando as preferências do usuário:

                    Preferências do usuário:
                    - Dieta: {user_preferences.get('diet', 'Nenhuma especificada')}
                    - Intolerâncias: {', '.join(user_preferences.get('intolerances', [])) or 'Nenhuma'}
                    - Ingredientes disponíveis: {', '.join(user_preferences.get('ingredients', []))}

                    Receitas encontradas:
                    {json.dumps(recipe_titles, indent=2, ensure_ascii=False)}

                    Por favor, forneça:
                    1. Uma breve análise de quais receitas são mais adequadas para o usuário
                    2. Dicas de como aproveitar melhor os ingredientes disponíveis
                    3. Sugestões de ajustes nas receitas para melhor atender às preferências

                    Responda em português de forma clara e concisa (máximo 150 palavras).
                """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                'analysis': response.text,
                'recipes_analyzed': len(recipes)
            }
        except Exception as e:
            error_msg = str(e)
            print(f"Erro ao analisar receitas com Gemini: {error_msg}")
            
            if "API key" in error_msg or "authentication" in error_msg.lower():
                return {
                    'analysis': 'Erro de autenticação com a IA. Verifique sua API key do Google Gemini.',
                    'error': error_msg
                }
            elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
                return {
                    'analysis': 'Limite de uso da IA atingido. Tente novamente mais tarde.',
                    'error': error_msg
                }
            else:
                return {
                    'analysis': 'Não foi possível gerar análise no momento. Tente novamente.',
                    'error': error_msg
                }
    
    def get_personalized_suggestions(self, ingredients, diet, intolerances, meal_type):
        """
            Obtem sugestões personalizadas de receitas da IA
        """
        if not self.model:
            return {
                'suggestions': 'IA não disponível. Verifique sua API key do Google Gemini.'
            }
        
        prompt = f"""
                    Você é um chef especializado em nutrição. Com base nas seguintes informações, sugira ideias criativas de receitas:

                    Ingredientes disponíveis: {', '.join(ingredients) if ingredients else 'Nenhum especificado'}
                    Tipo de refeição: {meal_type or 'Não especificado'}
                    Dieta: {diet or 'Sem restrições'}
                    Intolerâncias: {', '.join(intolerances) if intolerances else 'Nenhuma'}

                    Por favor, forneça:
                    1. 3 ideias de pratos que podem ser feitos com esses ingredientes
                    2. Dicas de combinações de sabores
                    3. Sugestões de ingredientes adicionais que combinariam bem

                    Seja criativo e prático. Responda em português (máximo 200 palavras).
                """
        try:
            response = self.model.generate_content(prompt)
            
            return {
                'suggestions': response.text
            }
        except Exception as e:
            error_msg = str(e)
            print(f"Erro ao obter sugestões do Gemini: {error_msg}")
            
            if "API key" in error_msg or "authentication" in error_msg.lower():
                return {
                    'suggestions': 'Erro de autenticação. Verifique sua API key.',
                    'error': error_msg
                }
            else:
                return {
                    'suggestions': 'Não foi possível gerar sugestões no momento.',
                    'error': error_msg
                }
    