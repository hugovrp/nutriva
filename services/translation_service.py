from deep_translator import GoogleTranslator
import re

class TranslationService:
    """
        Serviço para traduzir textos de receitas do inglês para português
    """
    
    def __init__(self):
        self.translator = GoogleTranslator(source='en', target='pt')
        
    def translate_text(self, text):
        """
            Traduz um texto do inglês para português
        """
        if not text or text.strip() == '':
            return text
            
        try:
            # Remove tags HTML temporariamente
            html_tags = re.findall(r'<[^>]+>', text)
            text_without_html = re.sub(r'<[^>]+>', '|||TAG|||', text)
            
            # Traduz o texto
            translated = self.translator.translate(text_without_html)
            
            # Recoloca as tags HTML
            for tag in html_tags:
                translated = translated.replace('|||TAG|||', tag, 1)
            
            return translated
            
        except Exception as e:
            print(f"Erro ao traduzir texto: {str(e)}")
            return text  # Retorna texto original em caso de erro
    
    def translate_ingredients(self, ingredients):
        """
            Traduz a lista de ingredientes
        """
        if not ingredients:
            return []
        
        translated_ingredients = []
        
        for ingredient in ingredients:
            try:
                translated = {
                    'id': ingredient.get('id'),
                    'name': self.translate_text(ingredient.get('name', '')),
                    'original': self.translate_text(ingredient.get('original', '')),
                    'amount': ingredient.get('amount'),
                    'unit': ingredient.get('unit', ''),
                    'measures': ingredient.get('measures')
                }
                translated_ingredients.append(translated)
                
            except Exception as e:
                print(f"Erro ao traduzir ingrediente: {str(e)}")
                translated_ingredients.append(ingredient)
        
        return translated_ingredients
    
    def translate_instructions(self, instructions):
        """
            Traduz instruções de preparo
        """
        if not instructions:
            return instructions
        
        # Se for uma string
        if isinstance(instructions, str):
            return self.translate_text(instructions)
        
        # Se for uma lista de passos
        if isinstance(instructions, list):
            translated_instructions = []
            
            for instruction_set in instructions:
                translated_steps = []
                
                for step in instruction_set.get('steps', []):
                    translated_step = {
                        'number': step.get('number'),
                        'step': self.translate_text(step.get('step', '')),
                        'ingredients': step.get('ingredients', []),
                        'equipment': step.get('equipment', [])
                    }
                    translated_steps.append(translated_step)
                
                translated_instructions.append({
                    'name': instruction_set.get('name', ''),
                    'steps': translated_steps
                })
            
            return translated_instructions
        
        return instructions
    
    def translate_recipe(self, recipe):
        """
            Traduz uma receita
        """
        if not recipe:
            return recipe
        
        try:
            translated_recipe = recipe.copy()
            
            # Traduz campos de texto
            if 'title' in recipe:
                translated_recipe['title'] = self.translate_text(recipe['title'])
            
            if 'summary' in recipe and recipe['summary']:
                translated_recipe['summary'] = self.translate_text(recipe['summary'])
            
            # Traduz ingredientes
            if 'extendedIngredients' in recipe:
                translated_recipe['extendedIngredients'] = self.translate_ingredients(
                    recipe['extendedIngredients']
                )
            
            # Traduz instruções
            if 'instructions' in recipe and recipe['instructions']:
                translated_recipe['instructions'] = self.translate_text(recipe['instructions'])
            
            if 'analyzedInstructions' in recipe:
                translated_recipe['analyzedInstructions'] = self.translate_instructions(
                    recipe['analyzedInstructions']
                )
            
            return translated_recipe
            
        except Exception as e:
            print(f"Erro ao traduzir receita: {str(e)}")
            return recipe  # Retorna receita original em caso de erro