// create-class.js
class CreateClassHandler {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.user = JSON.parse(localStorage.getItem('user'));
        this.token = localStorage.getItem('token');
        
        // Check authentication
        if (!this.token || !this.user || this.user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        this.form = document.getElementById('createClassForm');
        this.createBtn = document.getElementById('createBtn');
        this.createBtnText = document.getElementById('createBtnText');
        this.createSpinner = document.getElementById('createSpinner');
        this.messageContainer = document.getElementById('messageContainer');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInstructors();
        this.setMinDate();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleCreateClass(e));

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los datos ingresados.')) {
                window.location.href = 'admin-dashboard.html';
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Clear errors on input
        this.clearErrorsOnInput();

        // Date validation
        document.getElementById('schedule_date').addEventListener('change', () => {
            this.validateDate();
        });
    }

    clearErrorsOnInput() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
                this.hideMessage();
            });
        });
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('schedule_date').min = today;
    }

    async loadInstructors() {
        try {
            const instructors = await this.fetchInstructors();
            const select = document.getElementById('instructor_id');
            
            select.innerHTML = '<option value="">Selecciona un instructor</option>' +
                instructors.map(instructor => 
                    `<option value="${instructor.id}">${instructor.name}</option>`
                ).join('');
                
        } catch (error) {
            console.error('Error loading instructors:', error);
            this.showMessage('Error cargando la lista de instructores', 'error');
        }
    }

    async fetchInstructors() {
        // Simulate API call to get instructors
        // In real implementation: GET /users?role=admin or /instructors
        return [
            { id: 1, name: 'Ana Martínez - Yoga' },
            { id: 2, name: 'Carlos López - Pilates' },
            { id: 3, name: 'Laura Sánchez - Fitness' },
            { id: this.user.id, name: `${this.user.name} (Tú)` }
        ];
    }

    async handleCreateClass(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const classData = {
            name: formData.get('name'),
            description: formData.get('description'),
            instructor_id: parseInt(formData.get('instructor_id')),
            schedule_date: formData.get('schedule_date'),
            schedule_time: formData.get('schedule_time'),
            duration_minutes: parseInt(formData.get('duration_minutes')),
            max_capacity: parseInt(formData.get('max_capacity')),
            status: formData.get('status')
        };

        // Validación
        if (!this.validateForm(classData)) {
            return;
        }

        this.setLoadingState(true);
        this.hideMessage();

        try {
            const response = await this.createClass(classData);
            
            if (response.success) {
                this.handleCreateSuccess(response.data);
            } else {
                this.showMessage(response.message || 'Error creando la clase', 'error');
            }
        } catch (error) {
            console.error('Create class error:', error);
            this.showMessage('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateForm(data) {
        let isValid = true;
        
        // Validar nombre
        if (!data.name || data.name.trim().length < 3) {
            this.showFieldError('name', 'El nombre debe tener al menos 3 caracteres');
            isValid = false;
        }

        // Validar descripción
        if (!data.description || data.description.trim().length < 10) {
            this.showFieldError('description', 'La descripción debe tener al menos 10 caracteres');
            isValid = false;
        }

        // Validar instructor
        if (!data.instructor_id) {
            this.showFieldError('instructor_id', 'Selecciona un instructor');
            isValid = false;
        }

        // Validar fecha
        if (!data.schedule_date) {
            this.showFieldError('schedule_date', 'Selecciona una fecha');
            isValid = false;
        } else if (!this.isValidDate(data.schedule_date)) {
            this.showFieldError('schedule_date', 'La fecha debe ser hoy o en el futuro');
            isValid = false;
        }

        // Validar hora
        if (!data.schedule_time) {
            this.showFieldError('schedule_time', 'Selecciona una hora');
            isValid = false;
        }

        // Validar duración
        if (!data.duration_minutes || data.duration_minutes < 15 || data.duration_minutes > 180) {
            this.showFieldError('duration_minutes', 'La duración debe estar entre 15 y 180 minutos');
            isValid = false;
        }

        // Validar capacidad
        if (!data.max_capacity || data.max_capacity < 1 || data.max_capacity > 100) {
            this.showFieldError('max_capacity', 'La capacidad debe estar entre 1 y 100 personas');
            isValid = false;
        }

        // Validar estado
        if (!data.status || !['active', 'cancelled', 'completed'].includes(data.status)) {
            this.showFieldError('status', 'Selecciona un estado válido');
            isValid = false;
        }

        return isValid;
    }

    isValidDate(dateString) {
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    }

    validateDate() {
        const dateInput = document.getElementById('schedule_date');
        if (dateInput.value && !this.isValidDate(dateInput.value)) {
            this.showFieldError('schedule_date', 'La fecha debe ser hoy o en el futuro');
        } else {
            this.clearFieldError('schedule_date');
        }
    }

    async createClass(classData) {
        // Simulate API call
        // Real implementation: POST /classes/
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate some validation
                if (classData.name.toLowerCase().includes('test')) {
                    resolve({
                        success: false,
                        message: 'No se permiten clases de prueba'
                    });
                } else {
                    resolve({
                        success: true,
                        data: {
                            id: Math.floor(Math.random() * 1000) + 100,
                            ...classData,
                            enrolled_count: 0,
                            created_at: new Date().toISOString()
                        }
                    });
                }
            }, 1500);
        });

        // Real API call code:
        /*
        const response = await fetch(`${this.apiBaseUrl}/classes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(classData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
        */
    }

    handleCreateSuccess(data) {
        this.showMessage('¡Clase creada exitosamente!', 'success');
        
        // Reset form
        this.form.reset();
        this.setMinDate(); // Reset min date
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 2000);
    }

    setLoadingState(loading) {
        this.createBtn.disabled = loading;
        if (loading) {
            this.createBtnText.style.display = 'none';
            this.createSpinner.style.display = 'inline';
        } else {
            this.createBtnText.style.display = 'inline';
            this.createSpinner.style.display = 'none';
        }
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Scroll to first error
            if (document.querySelectorAll('.error-message[style*="block"]').length === 1) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        this.messageContainer.textContent = message;
        this.messageContainer.className = `message-container message-${type}`;
        this.messageContainer.style.display = 'block';
        
        // Auto hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 5000);
        }
    }

    hideMessage() {
        this.messageContainer.style.display = 'none';
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CreateClassHandler();
});