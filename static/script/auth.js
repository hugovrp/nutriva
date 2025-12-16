import dbManager from './database.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    const authForm = document.getElementById('authForm');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const messageDiv = document.getElementById('message');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const nameInput = document.getElementById('name');
    const confirmPassInput = document.getElementById('confirmPassword');

    let isLoginMode = true;

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;
        
        // Garante que a mensagem esteja visível na tela
        messageDiv.style.display = 'block'; 
        
        // Scroll suave apenas se necessário
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideMessage() {
        messageDiv.className = 'message';
        messageDiv.style.display = 'none'; 
    }

    function switchToLogin() {
        isLoginMode = true;
        loginToggle.classList.add('active');
        registerToggle.classList.remove('active');
        formTitle.textContent = 'Bem-vindo!';
        formSubtitle.textContent = 'Entre para começar sua jornada saudável';
        submitBtn.textContent = 'Entrar';
        
        nameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        
        nameInput.removeAttribute('required');
        confirmPassInput.removeAttribute('required');

        hideMessage();
        authForm.reset();
        emailInput.classList.remove('input-error');
    }

    function switchToRegister() {
        isLoginMode = false;
        registerToggle.classList.add('active');
        loginToggle.classList.remove('active');
        formTitle.textContent = 'Criar Conta';
        formSubtitle.textContent = 'Junte-se a nós e descubra receitas incríveis';
        submitBtn.textContent = 'Cadastrar';
        
        nameGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        
        nameInput.setAttribute('required', 'true');
        confirmPassInput.setAttribute('required', 'true');

        hideMessage();
        authForm.reset();
        emailInput.classList.remove('input-error');
    }

    loginToggle.addEventListener('click', switchToLogin);
    registerToggle.addEventListener('click', switchToRegister);

    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    emailInput.addEventListener('input', () => {
        emailInput.classList.remove('input-error');
    });

    async function handleLogin(email, password) {
        try {
            const user = await dbManager.getUser(email);
            
            if (!user || user.password !== password) {
                showMessage('E-mail ou senha incorretos.', 'error');
                return false;
            }

            // Verificar se o usuário já preencheu as preferências
            const preferences = await dbManager.getPreferences(email);

            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userName', user.name);

            if (!preferences || !preferences.diet) {
                // Usuário precisa preencher preferências
                sessionStorage.setItem('needsPreferences', 'true');
                showMessage('Login realizado!', 'success');
                
                setTimeout(() => {
                    window.location.href = '../../templates/preferences.html';
                }, 1500);
            } else {
                // Usuário já tem preferências, vai direto para o index
                showMessage('Login realizado com sucesso!', 'success');
                
                setTimeout(() => {
                    window.location.href = '../../templates/index.html';
                }, 1500);
            }

            return true;

        } catch (error) {
            console.error(error);
            showMessage('Erro no sistema. Tente novamente.', 'error');
            return false;
        }
    }

    async function handleRegister(name, email, password, confirmPassword) {
        // Validações extras
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem', 'error');
            return false;
        }

        try {
            const existingUser = await dbManager.getUser(email);
            
            if (existingUser) {
                showMessage('Este e-mail já possui cadastro.', 'error');
                return false;
            }

            const newUser = {
                email: email,
                password: password,
                name: name.trim(),
                createdAt: new Date().toISOString()
            };

            await dbManager.saveUser(newUser);
            showMessage('Conta criada!', 'success');

            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userName', name.trim());
            sessionStorage.setItem('needsPreferences', 'true');
            
            setTimeout(() => {
                window.location.href = '../../templates/preferences.html'; 
            }, 1500);

            return true;

        } catch (error) {
            console.error(error);
            showMessage('Erro ao criar conta.', 'error');
            return false;
        }
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(); 

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('E-mail inválido.', 'error');
            emailInput.classList.add('input-error');
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processando...';

        try {
            if (isLoginMode) {
                await handleLogin(email, password);
            } else {
                const name = nameInput.value;
                const confirmPassword = confirmPassInput.value;
                
                if (!name.trim()) {
                     showMessage('O nome é obrigatório.', 'error');
                     submitBtn.disabled = false;
                     submitBtn.textContent = originalText;
                     return;
                }
                
                await handleRegister(name, email, password, confirmPassword);
            }
        } catch (err) {
            console.error(err);
        } finally {
            // Se não redirecionou, reabilita o botão
            setTimeout(() => {
                if(document.querySelector('.message.error')) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }, 500);
        }
    });

    // Verificação de sessão existente, redireciona para preferences se necessário
    checkExistingSession();
}

async function checkExistingSession() {
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (userEmail) {
        try {
            const preferences = await dbManager.getPreferences(userEmail);
            
            if (!preferences || !preferences.diet) {
                // Usuário logado mas sem preferências
                window.location.href = '../../templates/preferences.html';
            } else {
                // Usuário logado e com preferências
                window.location.href = '../../templates/index.html';
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
        }
    }
}