// edit-class.js
class EditClassHandler {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.user = JSON.parse(localStorage.getItem('user'));
        this.token = localStorage.getItem('token');
        
        // Check authentication
        if (!this.token || !this.user || this.user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        this.classId = this.getClassIdFromUrl();
        if (!this.classId) {
            this.showError('ID de clase no válido');
            return;
        }

        this.form = document.getElementById('editClassForm');
        this.saveBtn = document.getElementById('saveBtn');
        this.saveBtnText = document.getElementById('saveBtnText');
        this.saveSpinner = document.getElementById('saveSpinner');
        this.messageContainer = document.getElementById('messageContainer');
        this.currentClass = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadClassData();
    }

    getClassIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleUpdateClass(e));

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            if (this.hasUnsavedChanges()) {
                if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
                    window.location.href = 'admin-dashboard.html';
                }
            } else {
                window.location.href = 'admin-dashboard.html';
            }
        });

        // View inscriptions button
        document.getElementById('viewInscriptionsBtn').addEventListener('click', () => {
            window.location.href = `admin-dashboard.html?section=inscriptions&classId=${this.classId}`;
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Clear errors on input
        this.clearErrorsOnInput();

        // Capacity validation
        document.getElementById('max_capacity').addEventListener('input', () => {
            this.validateCapacity();
        });

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

    async loadClassData() {
        try {
            this.showLoading();
            
            // Load class data and instructors in parallel
            const [classData] = await Promise.all([
                this.fetchClass(this.classId),
            ]);

            if (classData) {
                this.currentClass = classData;
                this.populateForm(classData);
                this.showForm();
            } else {
                this.showError('Clase no encontrada');
            }
        } catch (error) {
            console.error('Error loading class:', error);
            this.showError('Error cargando los datos de la clase');
        } finally {
            this.hideLoading();
        }
    }

    async fetchClass(classId) {
        // Simulate API call - GET /classes/{class_id}
        const respuesta = await fetch('http://localhost:8000/classes/'); // Reemplaza con tu URL
        const mockClasses = await respuesta.json();

        return mockClasses.find(c => c.id == classId);

        // Real API call:
        /*
        const response = await fetch(`${this.apiBaseUrl}/classes/${classId}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
        */
    }


    populateForm(classData) {
        document.getElementById('name').value = classData.name;
        document.getElementById('description').value = classData.description;
        document.getElementById('schedule_date').value = classData.schedule_date;
        document.getElementById('schedule_time').value = classData.schedule_time;
        document.getElementById('duration_minutes').value = classData.duration_minutes;
        document.getElementById('max_capacity').value = classData.max_capacity;
        document.getElementById('status').value = classData.status;
        document.getElementById('enrolledCount').textContent = classData.enrolled_count;

        this.validateCapacity();
    }


    validateCapacity() {
        const maxCapacity = parseInt(document.getElementById('max_capacity').value);
        const enrolledCount = this.currentClass ? this.currentClass.enrolled_count : 0;
        const warningElement = document.getElementById('capacityWarning');

        if (maxCapacity && maxCapacity < enrolledCount) {
            warningElement.style.display = 'block';
        } else {
            warningElement.style.display = 'none';
        }
    }

    validateDate() {
        const dateInput = document.getElementById('schedule_date');
        if (dateInput.value && !this.isValidDate(dateInput.value)) {
            this.showFieldError('schedule_date', 'La fecha debe ser hoy o en el futuro');
        } else {
            this.clearFieldError('schedule_date');
        }
    }

    isValidDate(dateString) {
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    }

    async handleUpdateClass(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const classData = {
            name: formData.get('name'),
            description: formData.get('description'),
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
            const response = await this.updateClass(this.classId, classData);
            
            if (response.success) {
                this.handleUpdateSuccess(response.data);
            } else {
                this.showMessage(response.message || 'Error actualizando la clase', 'error');
            }
        } catch (error) {
            console.error('Update class error:', error);
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
        } else if (this.currentClass && data.max_capacity < this.currentClass.enrolled_count) {
            this.showFieldError('max_capacity', 
                `No puedes reducir la capacidad por debajo de ${this.currentClass.enrolled_count} (personas ya inscritas)`);
            isValid = false;
        }

        // Validar estado
        if (!data.status || !['active', 'cancelled', 'completed'].includes(data.status)) {
            this.showFieldError('status', 'Selecciona un estado válido');
            isValid = false;
        }

        return isValid;
    }

    async updateClass(classId, classData) {

        // Real API call:
        
        const response = await fetch(`http://localhost:8000/classes/${classId}`, {
            method: 'PUT',
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
        
    }

    handleUpdateSuccess(data) {
        this.currentClass = data; // Update current class data
        this.showMessage('¡Clase actualizada exitosamente!', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 2000);
    }

    hasUnsavedChanges() {
        if (!this.currentClass) return false;

        const formData = new FormData(this.form);
        return (
            formData.get('name') !== this.currentClass.name ||
            formData.get('description') !== this.currentClass.description ||
            formData.get('schedule_date') !== this.currentClass.schedule_date ||
            formData.get('schedule_time') !== this.currentClass.schedule_time ||
            parseInt(formData.get('duration_minutes')) !== this.currentClass.duration_minutes ||
            parseInt(formData.get('max_capacity')) !== this.currentClass.max_capacity ||
            formData.get('status') !== this.currentClass.status
        );
    }

    showLoading() {
        document.getElementById('loadingContainer').style.display = 'block';
        this.form.style.display = 'none';
        document.getElementById('errorContainer').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingContainer').style.display = 'none';
    }

    showForm() {
        this.form.style.display = 'block';
        document.getElementById('errorContainer').style.display = 'none';
    }

    showError(message) {
        document.getElementById('errorContainer').style.display = 'block';
        this.form.style.display = 'none';
    }

    setLoadingState(loading) {
        this.saveBtn.disabled = loading;
        if (loading) {
            this.saveBtnText.style.display = 'none';
            this.saveSpinner.style.display = 'inline';
        } else {
            this.saveBtnText.style.display = 'inline';
            this.saveSpinner.style.display = 'none';
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
    new EditClassHandler();
});