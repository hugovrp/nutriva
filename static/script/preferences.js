import dbManager from './database.js';

document.addEventListener('DOMContentLoaded', () => {
    initPreferences();
});

function initPreferences() {
    // Verifica se o usuário está logado
    const userEmail = sessionStorage.getItem('userEmail');
    const userName = sessionStorage.getItem('userName');
    
    if (!userEmail) {
        window.location.href = '../../templates/login.html';
        return;
    }

    const diets = [
        { id: 'vegan', name: 'Vegano', desc: 'Sem produtos de origem animal' },
        { id: 'vegetarian', name: 'Vegetariano', desc: 'Sem carne ou peixe' },
        { id: 'pescetarian', name: 'Pescetariano', desc: 'Vegetariano com peixe' },
        { id: 'paleo', name: 'Paleo', desc: 'Alimentos não processados' },
        { id: 'ketogenic', name: 'Cetogênica', desc: 'Baixo carboidrato, alto gordura' },
        { id: 'lowFODMAP', name: 'Low FODMAP', desc: 'Para síndrome do intestino irritável' },
        { id: 'omnivore', name: 'Onívoro', desc: 'Sem restrições' }
    ];

    const intolerances = [
        { apiValue: 'Dairy', name: 'Laticínios' },
        { apiValue: 'Egg', name: 'Ovo' },
        { apiValue: 'Gluten', name: 'Glúten' },
        { apiValue: 'Grain', name: 'Grãos' },
        { apiValue: 'Peanut', name: 'Amendoim' },
        { apiValue: 'Seafood', name: 'Frutos do Mar' },
        { apiValue: 'Sesame', name: 'Gergelim' },
        { apiValue: 'Shellfish', name: 'Crustáceos' },
        { apiValue: 'Soy', name: 'Soja' },
        { apiValue: 'Sulfite', name: 'Sulfitos' },
        { apiValue: 'Tree Nut', name: 'Nozes' },
        { apiValue: 'Wheat', name: 'Trigo' }
    ];

    let selectedDiet = '';
    let selectedIntolerances = [];

    const dietGrid = document.getElementById('dietGrid');
    const intolerancesGrid = document.getElementById('intolerancesGrid');
    const continueBtn = document.getElementById('continueBtn');
    const messageDiv = document.getElementById('message');
    const preferencesForm = document.getElementById('preferencesForm');

    // Renderiza opções de dieta
    diets.forEach(diet => {
        const dietOption = document.createElement('div');
        dietOption.className = 'diet-option';
        dietOption.dataset.dietId = diet.id;
        
        dietOption.innerHTML = `
            <div class="diet-option-header">
                <div class="diet-option-content">
                    <div class="diet-option-name">${diet.name}</div>
                    <div class="diet-option-desc">${diet.desc}</div>
                </div>
                <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        `;

        dietOption.addEventListener('click', () => {
            // Remove seleção anterior
            document.querySelectorAll('.diet-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Adiciona seleção atual
            dietOption.classList.add('selected');
            selectedDiet = diet.id;
            continueBtn.disabled = false;
        });

        dietGrid.appendChild(dietOption);
    });

    // Renderiza opções de intolerância
    intolerances.forEach(intolerance => {
        const intoleranceOption = document.createElement('div');
        intoleranceOption.className = 'intolerance-option';
        intoleranceOption.dataset.intolerance = intolerance.apiValue; 
        
        intoleranceOption.innerHTML = `
            <div class="intolerance-name">${intolerance.name}</div>
            <svg class="intolerance-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        intoleranceOption.addEventListener('click', () => {
            intoleranceOption.classList.toggle('selected');
            
            const index = selectedIntolerances.indexOf(intolerance.apiValue);
            if (index > -1) {
                selectedIntolerances.splice(index, 1);
            } else {
                selectedIntolerances.push(intolerance.apiValue); 
            }
        });

        intolerancesGrid.appendChild(intoleranceOption);
    });

    loadExistingPreferences();

    async function loadExistingPreferences() {
        try {
            const preferences = await dbManager.getPreferences(userEmail);
            
            if (preferences && preferences.diet) {
                // Seleciona dieta
                selectedDiet = preferences.diet;
                const dietOption = document.querySelector(`[data-diet-id="${preferences.diet}"]`);
                if (dietOption) {
                    dietOption.classList.add('selected');
                    continueBtn.disabled = false;
                }

                // Seleciona intolerâncias
                if (preferences.intolerances && Array.isArray(preferences.intolerances)) {
                    selectedIntolerances = [...preferences.intolerances];
                    preferences.intolerances.forEach(intoleranceValue => {
                        const intoleranceOption = document.querySelector(`[data-intolerance="${intoleranceValue}"]`);
                        if (intoleranceOption) {
                            intoleranceOption.classList.add('selected');
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideMessage() {
        messageDiv.className = 'message';
    }

    preferencesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        if (!selectedDiet) {
            showMessage('Por favor, selecione um tipo de dieta.', 'error');
            return;
        }

        continueBtn.disabled = true;
        const originalText = continueBtn.textContent;
        continueBtn.textContent = 'Salvando...';

        try {
            // Salva preferências no banco de dados
            await dbManager.savePreferences(userEmail, {
                diet: selectedDiet,
                intolerances: selectedIntolerances
            });

            // Remove flag de necessidade de preferências
            sessionStorage.removeItem('needsPreferences');

            showMessage('Preferências salvas com sucesso! Redirecionando...', 'success');

            setTimeout(() => {
                window.location.href = '../../templates/index.html';
            }, 1500);

        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            showMessage('Erro ao salvar preferências. Tente novamente.', 'error');
            continueBtn.disabled = false;
            continueBtn.textContent = originalText;
        }
    });
}