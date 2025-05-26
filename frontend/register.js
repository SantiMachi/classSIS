// register.js
class RegisterHandler {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000'; // Cambia por tu URL base
        this.form = document.getElementById('registerForm');
        this.registerBtn = document.getElementById('registerBtn');
        this.registerBtnText = document.getElementById('registerBtnText');
        this.registerSpinner = document.getElementById('registerSpinner');
        this.errorContainer = document.getElementById('errorMessage');
        this.successContainer = document.getElementById('successMessage');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleRegister(e));
        this.clearErrorsOnInput();
    }

    clearErrorsOnInput() {
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
                this.hideMessages();
            });
        });
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const registerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            role: formData.get('role')
        };

        // Validación
        if (!this.validateForm(registerData)) {
            return;
        }

        this.setLoadingState(true);
        this.hideMessages();

        try {
            // Preparar datos para enviar (sin confirmPassword)
            const { confirmPassword, ...dataToSend } = registerData;
            
            const response = await this.registerUser(dataToSend);
            
            if (response.success) {
                this.handleRegisterSuccess(response.data);
            } else {
                this.showError(response.message || 'Error en el registro');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showError('Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm(data) {
        let isValid = true;
        
        // Validar nombre
        if (!data.name || data.name.trim().length < 2) {
            this.showFieldError('name', 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        }

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

        // Validar confirmación de contraseña
        if (data.password !== data.confirmPassword) {
            this.showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            isValid = false;
        }

        // Validar rol
        if (!data.role || !['client', 'admin'].includes(data.role)) {
            this.showFieldError('role', 'Selecciona un tipo de cuenta válido');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async registerUser(registerData) {
        // Simulación de llamada a API - reemplaza con tu endpoint real
        // const response = await fetch(`${this.apiBaseUrl}/users/`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(registerData)
        // });

        // Simulación temporal para testing
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simular verificación de email existente
                const existingEmails = ['admin@test.com', 'user@test.com'];
                
                if (existingEmails.includes(registerData.email)) {
                    resolve({
                        success: false,
                        message: 'Este email ya está registrado'
                    });
                } else {
                    resolve({
                        success: true,
                        data: {
                            user: {
                                id: Math.floor(Math.random() * 1000) + 3,
                                name: registerData.name,
                                email: registerData.email,
                                role: registerData.role,
                                created_at: new Date().toISOString()
                            }
                        }
                    });
                }
            }, 1500);
        });

        // Código real que deberías usar:
        /*
        const response = await fetch(`${this.apiBaseUrl}/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
        */
    }

    handleRegisterSuccess(data) {
        this.showSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
        
        // Reset form
        this.form.reset();
        
        // Redirigir al login después de un delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    setLoadingState(loading) {
        this.registerBtn.disabled = loading;
        if (loading) {
            this.registerBtnText.style.display = 'none';
            this.registerSpinner.style.display = 'inline';
        } else {
            this.registerBtnText.style.display = 'inline';
            this.registerSpinner.style.display = 'none';
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
    new RegisterHandler();
});

// Verificar si ya está logueado (redirigir si es así)
if (localStorage.getItem('token')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'client-dashboard.html';
    }
}