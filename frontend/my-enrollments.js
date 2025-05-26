// My Enrollments JavaScript
class MyEnrollments {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.currentUser = { id: 1, name: "Juan Pérez" }; // Mock user
        this.enrollments = [];
        this.filteredEnrollments = [];
        this.currentFilter = 'all';
        this.selectedEnrollment = null;
        this.init();
    }

    init() {
        this.loadEnrollments();
    }

    // Load user enrollments
    async loadEnrollments() {
        this.showLoading(true);
        try {
            const response = await fetch(`${this.API_BASE}/inscriptions/user/${this.currentUser.id}`);
            if (response.ok) {
                this.enrollments = await response.json();
            } else {
                throw new Error('Failed to load enrollments');
            }
        } catch (error) {
            console.error('Error loading enrollments:', error);
            // Mock data for demo
            this.enrollments = [
                {
                    id: 1,
                    user_id: 1,
                    class_id: 1,
                    status: "active",
                    enrolled_at: "2024-01-15T10:00:00Z",
                    class: {
                        id: 1,
                        name: "Yoga Matutino",
                        description: "Clase de yoga para comenzar el día",
                        instructor_name: "María García",
                        schedule_date: "2024-01-25",
                        schedule_time: "08:00",
                        duration_minutes: 60,
                        max_capacity: 20,
                        enrolled_count: 15
                    }
                },
                {
                    id: 2,
                    user_id: 1,
                    class_id: 2,
                    status: "completed",
                    enrolled_at: "2024-01-10T14:00:00Z",
                    class: {
                        id: 2,
                        name: "Pilates Avanzado",
                        description: "Fortalecimiento del core y flexibilidad",
                        instructor_name: "Carlos López",
                        schedule_date: "2024-01-18",
                        schedule_time: "18:00",
                        duration_minutes: 45,
                        max_capacity: 15,
                        enrolled_count: 12
                    }
                },
                {
                    id: 3,
                    user_id: 1,
                    class_id: 3,
                    status: "active",
                    enrolled_at: "2024-01-20T09:30:00Z",
                    class: {
                        id: 3,
                        name: "Zumba Nocturno",
                        description: "Baile y ejercicio cardiovascular",
                        instructor_name: "Ana Martínez",
                        schedule_date: "2024-01-26",
                        schedule_time: "19:00",
                        duration_minutes: 45,
                        max_capacity: 25,
                        enrolled_count: 12
                    }
                },
                {
                    id: 4,
                    user_id: 1,
                    class_id: 4,
                    status: "cancelled",
                    enrolled_at: "2024-01-12T16:45:00Z",
                    class: {
                        id: 4,
                        name: "Crossfit Básico",
                        description: "Entrenamiento funcional de alta intensidad",
                        instructor_name: "Roberto Silva",
                        schedule_date: "2024-01-22",
                        schedule_time: "17:00",
                        duration_minutes: 50,
                        max_capacity: 12,
                        enrolled_count: 8
                    }
                }
            ];
        }
        
        this.updateStats();
        this.filterByStatus(this.currentFilter);
        this.showLoading(false);
    }

    // Filter enrollments by status
    filterByStatus(status) {
        this.currentFilter = status;
        
        // Update active tab
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Filter enrollments
        if (status === 'all') {
            this.filteredEnrollments = [...this.enrollments];
        } else {
            this.filteredEnrollments = this.enrollments.filter(e => e.status === status);
        }
        
        this.renderEnrollments();
    }

    // Update summary statistics
    updateStats() {
        const total = this.enrollments.length;
        const active = this.enrollments.filter(e => e.status === 'active').length;
        const completed = this.enrollments.filter(e => e.status === 'completed').length;
        const upcoming = this.enrollments.filter(e => {
            if (e.status !== 'active') return false;
            const classDate = new Date(e.class.schedule_date + 'T' + e.class.schedule_time);
            return classDate > new Date();
        }).length;

        document.getElementById('totalEnrollments').textContent = total;
        document.getElementById('activeEnrollments').textContent = active;
        document.getElementById('completedEnrollments').textContent = completed;
        document.getElementById('upcomingEnrollments').textContent = upcoming;
    }

    // Render enrollments list
    renderEnrollments() {
        const container = document.getElementById('enrollmentsContainer');
        const noEnrollments = document.getElementById('noEnrollments');
        
        if (this.filteredEnrollments.length === 0) {
            container.innerHTML = '';
            noEnrollments.style.display = 'block';
            return;
        }
        
        noEnrollments.style.display = 'none';
        
        // Sort by enrollment date (newest first)
        const sortedEnrollments = [...this.filteredEnrollments].sort((a, b) => 
            new Date(b.enrolled_at) - new Date(a.enrolled_at)
        );
        
        const html = sortedEnrollments.map(enrollment => {
            const isUpcoming = this.isUpcoming(enrollment);
            const isPast = this.isPast(enrollment);
            
            return `
                <div class="enrollment-card" data-enrollment-id="${enrollment.id}">
                    <div class="enrollment-header">
                        <div class="enrollment-title">
                            <h3>${enrollment.class.name}</h3>
                            <span class="enrollment-status ${enrollment.status}">
                                ${this.getStatusText(enrollment.status)}
                            </span>
                        </div>
                        <div class="enrollment-date">
                            <small>Inscrito: ${this.formatDate(enrollment.enrolled_at)}</small>
                        </div>
                    </div>
                    
                    <div class="enrollment-body">
                        <div class="class-info">
                            <p><strong>Descripción:</strong> ${enrollment.class.description}</p>
                            <p><strong>Instructor:</strong> ${enrollment.class.instructor_name}</p>
                            <p><strong>Fecha de clase:</strong> ${this.formatDate(enrollment.class.schedule_date)}</p>
                            <p><strong>Hora:</strong> ${enrollment.class.schedule_time}</p>
                            <p><strong>Duración:</strong> ${enrollment.class.duration_minutes} minutos</p>
                        </div>
                        
                        <div class="class-timing">
                            ${this.getTimingInfo(enrollment, isUpcoming, isPast)}
                        </div>
                    </div>
                    
                    <div class="enrollment-actions">
                        ${this.renderEnrollmentActions(enrollment, isUpcoming, isPast)}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    // Get timing information for the class
    getTimingInfo(enrollment, isUpcoming, isPast) {
        if (enrollment.status === 'cancelled') {
            return '<p class="timing-info cancelled">Inscripción cancelada</p>';
        }
        
        if (enrollment.status === 'completed') {
            return '<p class="timing-info completed">Clase completada</p>';
        }
        
        if (isPast) {
            return '<p class="timing-info past">Clase ya pasó</p>';
        }
        
        if (isUpcoming) {
            const classDate = new Date(enrollment.class.schedule_date + 'T' + enrollment.class.schedule_time);
            const now = new Date();
            const diffTime = classDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return '<p class="timing-info today">¡Clase hoy!</p>';
            } else if (diffDays === 1) {
                return '<p class="timing-info tomorrow">Clase mañana</p>';
            } else {
                return `<p class="timing-info upcoming">En ${diffDays} días</p>`;
            }
        }
        
        return '';
    }

    // Render action buttons for each enrollment
    renderEnrollmentActions(enrollment, isUpcoming, isPast) {
        if (enrollment.status === 'cancelled') {
            return '<button disabled>Cancelada</button>';
        }
        
        if (enrollment.status === 'completed') {
            return '<button onclick="viewClassDetails(' + enrollment.class.id + ')">Ver detalles</button>';
        }
        
        if (isPast) {
            return '<button disabled>Clase pasada</button>';
        }
        
        if (isUpcoming) {
            return `
                <button onclick="viewClassDetails(${enrollment.class.id})">Ver detalles</button>
                <button onclick="showCancelModal(${enrollment.id})" class="cancel-btn">Cancelar inscripción</button>
            `;
        }
        
        return '<button onclick="viewClassDetails(' + enrollment.class.id + ')">Ver detalles</button>';
    }

    // Show cancellation confirmation modal
    showCancelModal(enrollmentId) {
        const enrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (!enrollment) return;
        
        this.selectedEnrollment = enrollment;
        const modal = document.getElementById('cancelModal');
        const content = document.getElementById('cancelModalContent');
        
        const classDate = new Date(enrollment.class.schedule_date + 'T' + enrollment.class.schedule_time);
        const now = new Date();
        const hoursUntilClass = (classDate - now) / (1000 * 60 * 60);
        
        content.innerHTML = `
            <div class="cancel-details">
                <h4>¿Cancelar inscripción a "${enrollment.class.name}"?</h4>
                <p><strong>Fecha de clase:</strong> ${this.formatDate(enrollment.class.schedule_date)}</p>
                <p><strong>Hora:</strong> ${enrollment.class.schedule_time}</p>
                <p><strong>Instructor:</strong> ${enrollment.class.instructor_name}</p>
                
                ${hoursUntilClass < 24 ? 
                    '<div class="warning"><p>⚠️ La clase es en menos de 24 horas. La cancelación podría tener restricciones.</p></div>' : 
                    ''
                }
                
                <p>Esta acción no se puede deshacer.</p>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // Close cancellation modal
    closeCancelModal() {
        document.getElementById('cancelModal').style.display = 'none';
        this.selectedEnrollment = null;
    }

    // Confirm cancellation
    async confirmCancellation() {
        if (!this.selectedEnrollment) return;
        
        const confirmBtn = document.getElementById('confirmCancelBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Cancelando...';
        
        try {
            const response = await fetch(`${this.API_BASE}/inscriptions/${this.selectedEnrollment.id}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Update local data
                const enrollmentIndex = this.enrollments.findIndex(e => e.id === this.selectedEnrollment.id);
                if (enrollmentIndex !== -1) {
                    this.enrollments[enrollmentIndex].status = 'cancelled';
                }
                
                alert('Inscripción cancelada exitosamente.');
                this.updateStats();
                this.filterByStatus(this.currentFilter);
                this.closeCancelModal();
            } else {
                throw new Error('Failed to cancel enrollment');
            }
        } catch (error) {
            console.error('Error cancelling enrollment:', error);
            alert('Error al cancelar la inscripción. Por favor, intenta de nuevo.');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Sí, cancelar';
        }
    }

    // Utility functions
    isUpcoming(enrollment) {
        if (enrollment.status !== 'active') return false;
        const classDate = new Date(enrollment.class.schedule_date + 'T' + enrollment.class.schedule_time);
        return classDate > new Date();
    }

    isPast(enrollment) {
        const classDate = new Date(enrollment.class.schedule_date + 'T' + enrollment.class.schedule_time);
        return classDate < new Date();
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Activa',
            'completed': 'Completada',
            'cancelled': 'Cancelada'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    showLoading(show) {
        document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
    }
}

// Global functions
function filterByStatus(status) {
    window.myEnrollments.filterByStatus(status);
}

function showCancelModal(enrollmentId) {
    window.myEnrollments.showCancelModal(enrollmentId);
}

function closeCancelModal() {
    window.myEnrollments.closeCancelModal();
}

function confirmCancellation() {
    window.myEnrollments.confirmCancellation();
}

function viewClassDetails(classId) {
    window.location.href = `class-details.html?id=${classId}`;
}

function goToAvailableClasses() {
    window.location.href = 'available-classes.html';
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = 'login.html';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.myEnrollments = new MyEnrollments();
});