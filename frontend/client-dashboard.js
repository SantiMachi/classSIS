// Client Dashboard JavaScript
class ClientDashboard {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.currentUser = null;
        this.enrollments = [];
        this.classes = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadDashboardData();
    }

    // Load current user data
    loadUserData() {
        // In a real app, get from session/token
        this.currentUser = {
            id: 1,
            name: "Juan Pérez",
            email: "juan@example.com",
            role: "client"
        };
        
        document.getElementById('userName').textContent = this.currentUser.name;
    }

    // Load dashboard data
    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadUserEnrollments(),
                this.loadUserClasses(),
                this.updateStats()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Load user enrollments from API
    async loadUserEnrollments() {
        try {
            const response = await fetch(`${this.API_BASE}/inscriptions/user/${this.currentUser.id}`);
            if (response.ok) {
                this.enrollments = await response.json();
                this.renderRecentEnrollments();
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
                        schedule_date: "2024-01-20",
                        schedule_time: "08:00",
                        instructor_id: 2
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
                        schedule_date: "2024-01-18",
                        schedule_time: "18:00",
                        instructor_id: 3
                    }
                }
            ];
            this.renderRecentEnrollments();
        }
    }

    // Load classes for upcoming view
    async loadUserClasses() {
        try {
            const response = await fetch(`${this.API_BASE}/classes/`);
            if (response.ok) {
                this.classes = await response.json();
                this.renderUpcomingClasses();
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            // Mock data for demo
            this.classes = [
                {
                    id: 1,
                    name: "Yoga Matutino",
                    description: "Clase de yoga para comenzar el día",
                    instructor_id: 2,
                    max_capacity: 20,
                    schedule_date: "2024-01-25",
                    schedule_time: "08:00",
                    duration_minutes: 60,
                    status: "active",
                    enrolled_count: 15
                },
                {
                    id: 3,
                    name: "Zumba Nocturno",
                    description: "Baile y ejercicio",
                    instructor_id: 4,
                    max_capacity: 25,
                    schedule_date: "2024-01-26",
                    schedule_time: "19:00",
                    duration_minutes: 45,
                    status: "active",
                    enrolled_count: 12
                }
            ];
            this.renderUpcomingClasses();
        }
    }

    // Update stats counters
    updateStats() {
        const enrolledCount = this.enrollments.filter(e => e.status === 'active').length;
        const completedCount = this.enrollments.filter(e => e.status === 'completed').length;
        const upcomingCount = this.getUpcomingClasses().length;

        document.getElementById('enrolledCount').textContent = enrolledCount;
        document.getElementById('completedCount').textContent = completedCount;
        document.getElementById('upcomingCount').textContent = upcomingCount;
    }

    // Get upcoming classes for current user
    getUpcomingClasses() {
        const userClassIds = this.enrollments
            .filter(e => e.status === 'active')
            .map(e => e.class_id);
        
        return this.classes.filter(cls => {
            const classDate = new Date(cls.schedule_date + 'T' + cls.schedule_time);
            const now = new Date();
            return userClassIds.includes(cls.id) && classDate > now;
        });
    }

    // Render recent enrollments
    renderRecentEnrollments() {
        const container = document.getElementById('recentEnrollments');
        const recent = this.enrollments.slice(-3);

        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-message">No tienes inscripciones recientes</p>';
            return;
        }

        const html = recent.map(enrollment => `
            <div class="enrollment-card">
                <h4>${enrollment.class?.name || 'Clase'}</h4>
                <p>Estado: <span class="status-badge status-${enrollment.status}">${
                    this.getStatusText(enrollment.status)
                }</span></p>
                <p>Inscrito: <span class="date-display">${
                    this.formatDate(enrollment.enrolled_at)
                }</span></p>
                <p>Fecha clase: <span class="date-display">${
                    enrollment.class?.schedule_date || 'N/A'
                } ${enrollment.class?.schedule_time || ''}</span></p>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Render upcoming classes
    renderUpcomingClasses() {
        const container = document.getElementById('upcomingClasses');
        const upcoming = this.getUpcomingClasses().slice(0, 3);

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="empty-message">No tienes clases próximas</p>';
            return;
        }

        const html = upcoming.map(cls => `
            <div class="upcoming-class-card">
                <h4>${cls.name}</h4>
                <p class="class-description">${cls.description}</p>
                <p>Fecha: <span class="date-display">${cls.schedule_date}</span></p>
                <p>Hora: <span class="date-display">${cls.schedule_time}</span></p>
                <p>Duración: ${cls.duration_minutes} min</p>
                <p>Plazas: ${cls.enrolled_count}/${cls.max_capacity}</p>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Utility functions
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
}

// Navigation functions
function goToAvailableClasses() {
    window.location.href = 'available-classes.html';
}

function goToMyEnrollments() {
    window.location.href = 'my-enrollments.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ClientDashboard();
});