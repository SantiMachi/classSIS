// Available Classes JavaScript
class AvailableClasses {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.currentUser = { id: 1, name: "Juan Pérez" }; // Mock user
        this.classes = [];
        this.filteredClasses = [];
        this.userEnrollments = [];
        this.selectedClass = null;
        this.init();
    }

    init() {
        this.loadClasses();
        this.loadUserEnrollments();
    }

    // Load all available classes
    async loadClasses() {
        this.showLoading(true);
        try {
            const response = await fetch(`${this.API_BASE}/classes/`);
            if (response.ok) {
                this.classes = await response.json();
            } else {
                throw new Error('Failed to load classes');
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            // Mock data for demo
            this.classes = [
                {
                    id: 1,
                    name: "Yoga Matutino",
                    description: "Clase de yoga para comenzar el día con energía positiva",
                    instructor_id: 2,
                    instructor_name: "María García",
                    max_capacity: 20,
                    schedule_date: "2024-01-25",
                    schedule_time: "08:00",
                    duration_minutes: 60,
                    status: "active",
                    enrolled_count: 15
                },
                {
                    id: 2,
                    name: "Pilates Avanzado",
                    description: "Fortalecimiento del core y flexibilidad",
                    instructor_id: 3,
                    instructor_name: "Carlos López",
                    max_capacity: 15,
                    schedule_date: "2024-01-25",
                    schedule_time: "18:00",
                    duration_minutes: 45,
                    status: "active",
                    enrolled_count: 15
                },
                {
                    id: 3,
                    name: "Zumba Nocturno",
                    description: "Baile y ejercicio cardiovascular",
                    instructor_id: 4,
                    instructor_name: "Ana Martínez",
                    max_capacity: 25,
                    schedule_date: "2024-01-26",
                    schedule_time: "19:00",
                    duration_minutes: 45,
                    status: "active",
                    enrolled_count: 12
                },
                {
                    id: 4,
                    name: "Crossfit Básico",
                    description: "Entrenamiento funcional de alta intensidad",
                    instructor_id: 5,
                    instructor_name: "Roberto Silva",
                    max_capacity: 12,
                    schedule_date: "2025-10-27",
                    schedule_time: "17:00",
                    duration_minutes: 50,
                    status: "active",
                    enrolled_count: 8
                }
            ];
        }
        
        this.filteredClasses = [...this.classes];
        this.renderClasses();
        this.showLoading(false);
    }

    // Load user enrollments to check which classes user is already enrolled in
    async loadUserEnrollments() {
        try {
            const response = await fetch(`${this.API_BASE}/inscriptions/user/${this.currentUser.id}`);
            if (response.ok) {
                this.userEnrollments = await response.json();
            }
        } catch (error) {
            console.error('Error loading user enrollments:', error);
            // Mock data
            this.userEnrollments = [
                { id: 1, class_id: 1, status: "active" }
            ];
        }
    }

    // Render classes grid
    renderClasses() {
        const container = document.getElementById('classesContainer');
        const noResults = document.getElementById('noResults');
        
        if (this.filteredClasses.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        
        const html = this.filteredClasses.map(cls => {
            const isEnrolled = this.userEnrollments.some(e => e.class_id === cls.id && e.status === 'active');
            const isFull = cls.enrolled_count >= cls.max_capacity;
            const isPast = this.isClassPast(cls);
            
            return `
                <div class="class-card" data-class-id="${cls.id}">
                    <div class="class-header">
                        <h3>${cls.name}</h3>
                        <span class="class-status ${this.getStatusClass(cls, isEnrolled, isFull, isPast)}">
                            ${this.getStatusText(cls, isEnrolled, isFull, isPast)}
                        </span>
                    </div>
                    <div class="class-body">
                        <p><strong>Descripción:</strong> ${cls.description}</p>
                        <p><strong>Instructor:</strong> ${cls.instructor_name || 'Por asignar'}</p>
                        <p><strong>Fecha:</strong> ${this.formatDate(cls.schedule_date)}</p>
                        <p><strong>Hora:</strong> ${cls.schedule_time}</p>
                        <p><strong>Duración:</strong> ${cls.duration_minutes} minutos</p>
                        <p><strong>Capacidad:</strong> ${cls.enrolled_count}/${cls.max_capacity}</p>
                        <div class="capacity-bar">
                            <div class="capacity-fill" style="width: ${(cls.enrolled_count / cls.max_capacity) * 100}%"></div>
                        </div>
                    </div>
                    <div class="class-actions">
                        ${this.renderClassActions(cls, isEnrolled, isFull, isPast)}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    renderClassActions(cls, isEnrolled, isFull, isPast) {
        if (isPast) {
            return '<button disabled>Clase pasada</button>';
        }
        
        if (isEnrolled) {
            return '<button disabled>Ya inscrito</button>';
        }
        
        if (isFull) {
            return '<button disabled>Clase llena</button>';
        }
        
        return `<button onclick="showEnrollmentModal(${cls.id})">Inscribirse</button>`;
    }

    // Apply filters
    applyFilters() {
        const dateFilter = document.getElementById('dateFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        this.filteredClasses = this.classes.filter(cls => {
            const matchesDate = !dateFilter || cls.schedule_date === dateFilter;
            const matchesStatus = !statusFilter || this.getClassStatus(cls) === statusFilter;
            const matchesSearch = !searchFilter || 
                cls.name.toLowerCase().includes(searchFilter) ||
                cls.description.toLowerCase().includes(searchFilter);
                
            return matchesDate && matchesStatus && matchesSearch;
        });
        
        this.renderClasses();
    }

    // Clear all filters
    clearFilters() {
        document.getElementById('dateFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('searchFilter').value = '';
        this.filteredClasses = [...this.classes];
        this.renderClasses();
    }

    // Show enrollment modal
    showEnrollmentModal(classId) {
        const cls = this.classes.find(c => c.id === classId);
        if (!cls) return;
        
        this.selectedClass = cls;
        const modal = document.getElementById('enrollmentModal');
        const content = document.getElementById('modalContent');
        
        content.innerHTML = `
            <div class="enrollment-details">
                <h4>${cls.name}</h4>
                <p><strong>Descripción:</strong> ${cls.description}</p>
                <p><strong>Instructor:</strong> ${cls.instructor_name || 'Por asignar'}</p>
                <p><strong>Fecha:</strong> ${this.formatDate(cls.schedule_date)}</p>
                <p><strong>Hora:</strong> ${cls.schedule_time}</p>
                <p><strong>Duración:</strong> ${cls.duration_minutes} minutos</p>
                <p><strong>Espacios disponibles:</strong> ${cls.max_capacity - cls.enrolled_count}</p>
                <div class="confirmation-text">
                    <p>¿Estás seguro de que quieres inscribirte a esta clase?</p>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // Close enrollment modal
    closeEnrollmentModal() {
        document.getElementById('enrollmentModal').style.display = 'none';
        this.selectedClass = null;
    }

    // Confirm enrollment
    async confirmEnrollment() {
        if (!this.selectedClass) return;
        
        const confirmBtn = document.getElementById('confirmEnrollBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Inscribiendo...';
        
        try {
            const response = await fetch(`${this.API_BASE}/inscriptions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    class_id: this.selectedClass.id
                })
            });
            
            if (response.ok) {
                const enrollment = await response.json();
                alert('¡Inscripción exitosa!');
                
                // Update local data
                this.userEnrollments.push(enrollment);
                const classIndex = this.classes.findIndex(c => c.id === this.selectedClass.id);
                if (classIndex !== -1) {
                    this.classes[classIndex].enrolled_count++;
                }
                
                this.renderClasses();
                this.closeEnrollmentModal();
            } else {
                throw new Error('Failed to enroll');
            }
        } catch (error) {
            console.error('Error enrolling in class:', error);
            alert('Error al inscribirse en la clase. Por favor, intenta de nuevo.');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Inscribirse';
        }
    }

    // Utility functions
    isClassPast(cls) {
        const classDateTime = new Date(cls.schedule_date + 'T' + cls.schedule_time);
        return classDateTime < new Date();
    }

    getClassStatus(cls) {
        if (cls.enrolled_count >= cls.max_capacity) return 'full';
        return cls.status;
    }

    getStatusClass(cls, isEnrolled, isFull, isPast) {
        if (isPast) return 'status-past';
        if (isEnrolled) return 'status-enrolled';
        if (isFull) return 'status-full';
        return 'status-available';
    }

    getStatusText(cls, isEnrolled, isFull, isPast) {
        if (isPast) return 'Pasada';
        if (isEnrolled) return 'Inscrito';
        if (isFull) return 'Llena';
        return 'Disponible';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    showLoading(show) {
        document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
    }
}

// Global functions
function showEnrollmentModal(classId) {
    window.availableClasses.showEnrollmentModal(classId);
}

function closeEnrollmentModal() {
    window.availableClasses.closeEnrollmentModal();
}

function confirmEnrollment() {
    window.availableClasses.confirmEnrollment();
}

function applyFilters() {
    window.availableClasses.applyFilters();
}

function clearFilters() {
    window.availableClasses.clearFilters();
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = 'login.html';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.availableClasses = new AvailableClasses();
});