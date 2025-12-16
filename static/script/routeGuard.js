import dbManager from './database.js';

/**
 * Verifica se o usuário está autenticado e tem preferências configuradas
 * Redireciona para a página apropriada se necessário
 */
async function checkAuthAndPreferences() {
    const userEmail = sessionStorage.getItem('userEmail');
    const currentPage = window.location.pathname;

    // Se não está logado
    if (!userEmail) {
        // E não está na página de login, redireciona
        if (!currentPage.includes('login.html')) {
            window.location.href = '../../templates/login.html';
        }
        return false;
    }

    // Usuário logado, verifica preferências
    try {
        const preferences = await dbManager.getPreferences(userEmail);
        const hasPreferences = preferences && preferences.diet;

        // Se está na página de preferences
        if (currentPage.includes('preferences.html')) {
            // Se já tem preferências redireciona para index
            if (hasPreferences && !sessionStorage.getItem('editingPreferences')) {
                window.location.href = '../../templates/index.html';
            }
            return true;
        }

        // Se está tentando acessar index sem preferências
        if (currentPage.includes('index.html') && !hasPreferences) {
            sessionStorage.setItem('needsPreferences', 'true');
            window.location.href = '../../templates/preferences.html';
            return false;
        }

        return true;

    } catch (error) {
        console.error('Erro ao verificar preferências:', error);
        return false;
    }
}

/**
 * Função para fazer logout
 */
function logout() {
    sessionStorage.clear();
    window.location.href = '../../templates/login.html';
}

/**
 * Obter dados do usuário logado
 */
function getCurrentUser() {
    return {
        email: sessionStorage.getItem('userEmail'),
        name: sessionStorage.getItem('userName')
    };
}

// Executar verificação ao carregar qualquer página
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndPreferences();
});

export { checkAuthAndPreferences, logout, getCurrentUser };