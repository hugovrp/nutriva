const DB_CONFIG = {
    name: 'NutrivaDB',
    version: 1,
    stores: {
        users: 'users',
        preferences: 'preferences'
    }
};

class DatabaseManager {
    constructor() {
        this.db = null;
        this.initPromise = this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

            request.onerror = () => {
                console.error('Erro ao abrir banco de dados');
                reject(request.error);
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log('Banco de dados aberto com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                // Cria object store para usuários
                if (!db.objectStoreNames.contains(DB_CONFIG.stores.users)) {
                    const objectStore = db.createObjectStore(DB_CONFIG.stores.users, { keyPath: 'email' });
                    objectStore.createIndex('name', 'name', { unique: false });
                    console.log('Object store "users" criado');
                }

                // Cria object store para preferências
                if (!db.objectStoreNames.contains(DB_CONFIG.stores.preferences)) {
                    db.createObjectStore(DB_CONFIG.stores.preferences, { keyPath: 'email' });
                    console.log('Object store "preferences" criado');
                }
            };
        });
    }

    // Aguardar inicialização
    async ensureInitialized() {
        if (!this.db) {
            await this.initPromise;
        }
    }

    // Salvar usuário
    async saveUser(user) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([DB_CONFIG.stores.users], 'readwrite');
            const objectStore = transaction.objectStore(DB_CONFIG.stores.users);
            const request = objectStore.add(user);

            request.onsuccess = () => {
                console.log('Usuário salvo com sucesso');
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Erro ao salvar usuário');
                reject(request.error);
            };
        });
    }

    // Buscar usuário por e-mail
    async getUser(email) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([DB_CONFIG.stores.users], 'readonly');
            const objectStore = transaction.objectStore(DB_CONFIG.stores.users);
            const request = objectStore.get(email);

            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Erro ao buscar usuário');
                reject(request.error);
            };
        });
    }

    // Salvar preferências do usuário
    async savePreferences(email, preferences) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([DB_CONFIG.stores.preferences], 'readwrite');
            const objectStore = transaction.objectStore(DB_CONFIG.stores.preferences);
            
            const data = {
                email: email,
                ...preferences,
                updatedAt: new Date().toISOString()
            };
            
            const request = objectStore.put(data);

            request.onsuccess = () => {
                console.log('Preferências salvas com sucesso');
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Erro ao salvar preferências');
                reject(request.error);
            };
        });
    }

    // Buscar preferências do usuário
    async getPreferences(email) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([DB_CONFIG.stores.preferences], 'readonly');
            const objectStore = transaction.objectStore(DB_CONFIG.stores.preferences);
            const request = objectStore.get(email);

            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Erro ao buscar preferências');
                reject(request.error);
            };
        });
    }
}

// Criar e exportar instância global
const dbManager = new DatabaseManager();
export default dbManager;