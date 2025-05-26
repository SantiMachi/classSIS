// login.js
class LoginHandler {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000'; // Cambia por tu URL base
        this.form = document.getElementById('loginForm');
        this.loginBtn = document.getElementById('loginBtn');
        this.loginBtnText = document.getElementById('loginBtnText');
        this.loginSpinner = document.getElementById('loginSpinner');
        this.errorContainer = document.getElementById('errorMessage');
        this.successContainer = document.getElementById('successMessage');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        this.clearErrorsOnInput();
    }

    clearErrorsOnInput() {
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
                this.hideMessages();
            });
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Validación básica
        if (!this.validateForm(loginData)) {
            return;
        }

        this.setLoadingState(true);
        this.hideMessages();

        try {
            const response = await this.loginUser(loginData);
            
            if (response.success) {
                this.handleLoginSuccess(response.data);
            } else {
                this.showError(response.message || 'Error en el inicio de sesión');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm(data) {
        let isValid = true;
        
        // Validar email
        if (!data.email || !this.isValidEmail(data.email)) {
            this.showFieldError('email', 'Ingresa un email válido');
            isValid = false;
        }

        // Validar contraseña
        if (!data.password || data.password.length < 6) {
            this.showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async loginUser(loginData) {
        // Simulación de llamada a API - reemplaza con tu endpoint real
        // const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(loginData)
        // });

        // Simulación temporal para testing
        return new Promise((resolve) => {
            setTimeout(() => {
                if (loginData.email === 'admin@test.com' && loginData.password === 'admin123') {
                    resolve({
                        success: true,
                        data: {
                            user: {
                                id: 1,
                                name: 'Admin User',
                                email: 'admin@test.com',
                                role: 'admin'
                            },
                            token: 'fake-jwt-token'
                        }
                    });
                } else if (loginData.email === 'user@test.com' && loginData.password === 'user123') {
                    resolve({
                        success: true,
                        data: {
                            user: {
                                id: 2,
                                name: 'Regular User',
                                email: 'user@test.com',
                                role: 'client'
                            },
                            token: 'fake-jwt-token-2'
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Credenciales inválidas'
                    });
                }
            }, 1000);
        });

        // Código real que deberías usar:
        /*
        const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
        */
    }

    handleLoginSuccess(data) {
        // Guardar datos de usuario y token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        this.showSuccess('¡Inicio de sesión exitoso!');
        
        // Redirigir según el rol
        setTimeout(() => {
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'client-dashboard.html';
            }
        }, 1500);
    }

    setLoadingState(loading) {
        this.loginBtn.disabled = loading;
        if (loading) {
            this.loginBtnText.style.display = 'none';
            this.loginSpinner.style.display = 'inline';
        } else {
            this.loginBtnText.style.display = 'inline';
            this.loginSpinner.style.display = 'none';
        }
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    showError(message) {
        this.errorContainer.textContent = message;
        this.errorContainer.style.display = 'block';
        this.successContainer.style.display = 'none';
    }

    showSuccess(message) {
        this.successContainer.textContent = message;
        this.successContainer.style.display = 'block';
        this.errorContainer.style.display = 'none';
    }

    hideMessages() {
        this.errorContainer.style.display = 'none';
        this.successContainer.style.display = 'none';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new LoginHandler();
});

// Verificar si ya está logueado
if (localStorage.getItem('token')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'client-dashboard.html';
    }
}