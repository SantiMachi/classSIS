// admin-dashboard.js
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.user = JSON.parse(localStorage.getItem('user'));
        this.token = localStorage.getItem('token');
        
        // Check authentication
        if (!this.token || !this.user || this.user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayUserInfo();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Create class button
        document.getElementById('createClassBtn').addEventListener('click', () => {
            window.location.href = 'create-class.html';
        });

        // Filters
        document.getElementById('classFilter').addEventListener('change', () => {
            this.loadInscriptions();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.loadInscriptions();
        });

        document.getElementById('roleFilter').addEventListener('change', () => {
            this.loadUsers();
        });
    }

    displayUserInfo() {
        document.getElementById('userName').textContent = this.user.name;
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'classes':
                this.loadClasses();
                break;
            case 'inscriptions':
                this.loadInscriptions();
                this.loadClassesForFilter();
                break;
            case 'users':
                this.loadUsers();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading();
            
            // Load stats
            const [classes, inscriptions, users] = await Promise.all([
                this.fetchClasses(),
                this.fetchInscriptions(),
                this.fetchUsers()
            ]);

            this.updateStats(classes, inscriptions, users);
            this.loadRecentActivity();
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showMessage('Error cargando el dashboard', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateStats(classes, inscriptions, users) {
        document.getElementById('totalClasses').textContent = classes.length;
        document.getElementById('activeClasses').textContent = 
            classes.filter(c => c.status === 'active').length;
        document.getElementById('totalInscriptions').textContent = inscriptions.length;
        document.getElementById('totalUsers').textContent = users.length;
    }

    async loadRecentActivity() {
        // Simulate recent activity
        const activityContainer = document.getElementById('recentActivity');
        
        const activities = [
            { type: 'inscription', message: 'Nueva inscripción en Yoga Matutino', time: '2 horas' },
            { type: 'class', message: 'Clase de Pilates creada', time: '4 horas' },
            { type: 'user', message: 'Nuevo usuario registrado', time: '6 horas' }
        ];

        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-message">${activity.message}</span>
                <span class="activity-time">hace ${activity.time}</span>
            </div>
        `).join('');
    }

    async loadClasses() {
        try {
            this.showLoading();
            const classes = await this.fetchClasses();
            this.displayClasses(classes);
        } catch (error) {
            console.error('Error loading classes:', error);
            this.showMessage('Error cargando las clases', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayClasses(classes) {
        const container = document.getElementById('classesContainer');
        
        if (classes.length === 0) {
            container.innerHTML = '<p>No hay clases registradas.</p>';
            return;
        }

        container.innerHTML = classes.map(classItem => `
            <div class="class-card">
                <div class="class-header">
                    <h3>${classItem.name}</h3>
                    <span class="class-status status-${classItem.status}">${classItem.status}</span>
                </div>
                <p class="class-description">${classItem.description}</p>
                <div class="class-details">
                    <p><strong>Fecha:</strong> ${new Date(classItem.schedule_date).toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> ${classItem.schedule_time}</p>
                    <p><strong>Duración:</strong> ${classItem.duration_minutes} minutos</p>
                    <p><strong>Capacidad:</strong> ${classItem.enrolled_count}/${classItem.max_capacity}</p>
                </div>
                <div class="class-actions">
                    <button onclick="adminDashboard.editClass(${classItem.id})" class="edit-btn">Editar</button>
                    <button onclick="adminDashboard.deleteClass(${classItem.id})" class="delete-btn">Eliminar</button>
                    <button onclick="adminDashboard.viewClassInscriptions(${classItem.id})" class="view-btn">Ver Inscripciones</button>
                </div>
            </div>
        `).join('');
    }

    async loadInscriptions() {
        try {
            const classFilter = document.getElementById('classFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;
            
            let inscriptions = await this.fetchInscriptions();
            
            // Apply filters
            if (classFilter) {
                inscriptions = inscriptions.filter(i => i.class_id == classFilter);
            }
            if (statusFilter) {
                inscriptions = inscriptions.filter(i => i.status === statusFilter);
            }
            
            this.displayInscriptions(inscriptions);
        } catch (error) {
            console.error('Error loading inscriptions:', error);
            this.showMessage('Error cargando las inscripciones', 'error');
        }
    }

    displayInscriptions(inscriptions) {
        const container = document.getElementById('inscriptionsContainer');
        
        if (inscriptions.length === 0) {
            container.innerHTML = '<p>No hay inscripciones que mostrar.</p>';
            return;
        }

        container.innerHTML = `
            <table class="inscriptions-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Clase</th>
                        <th>Estado</th>
                        <th>Fecha de Inscripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${inscriptions.map(inscription => `
                        <tr>
                            <td>${inscription.user_name || 'Usuario ' + inscription.user_id}</td>
                            <td>${inscription.class_name || 'Clase ' + inscription.class_id}</td>
                            <td><span class="status-${inscription.status}">${inscription.status}</span></td>
                            <td>${new Date(inscription.enrolled_at).toLocaleDateString()}</td>
                            <td>
                                ${inscription.status === 'enrolled' ? 
                                    `<button onclick="adminDashboard.cancelInscription(${inscription.id})" class="cancel-btn">Cancelar</button>` :
                                    '<span>-</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadClassesForFilter() {
        try {
            const classes = await this.fetchClasses();
            const select = document.getElementById('classFilter');
            
            select.innerHTML = '<option value="">Todas las clases</option>' +
                classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading classes for filter:', error);
        }
    }

    async loadUsers() {
        try {
            const roleFilter = document.getElementById('roleFilter').value;
            let users = await this.fetchUsers();
            
            if (roleFilter) {
                users = users.filter(u => u.role === roleFilter);
            }
            
            this.displayUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showMessage('Error cargando los usuarios', 'error');
        }
    }

    displayUsers(users) {
        const container = document.getElementById('usersContainer');
        
        if (users.length === 0) {
            container.innerHTML = '<p>No hay usuarios que mostrar.</p>';
            return;
        }

        container.innerHTML = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Fecha de Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td><span class="role-${user.role}">${user.role}</span></td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                            <td>
                                <button onclick="adminDashboard.editUser(${user.id})" class="edit-btn">Editar</button>
                                ${user.id !== this.user.id ? 
                                    `<button onclick="adminDashboard.deleteUser(${user.id})" class="delete-btn">Eliminar</button>` :
                                    '<span>-</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // API Methods
    async fetchClasses() {
        // Simulate API call
        return [
            {
                id: 1,
                name: "Yoga Matutino",
                description: "Clase de yoga relajante para empezar el día",
                instructor_id: 1,
                max_capacity: 20,
                schedule_date: "2025-05-27",
                schedule_time: "08:00",
                duration_minutes: 60,
                status: "active",
                enrolled_count: 15
            },
            {
                id: 2,
                name: "Pilates Avanzado",
                description: "Clase intensiva de pilates",
                instructor_id: 2,
                max_capacity: 15,
                schedule_date: "2025-05-28",
                schedule_time: "19:00",
                duration_minutes: 45,
                status: "active",
                enrolled_count: 8
            }
        ];
    }

    async fetchInscriptions() {
        // Simulate API call
        return [
            {
                id: 1,
                user_id: 2,
                user_name: "Juan Pérez",
                class_id: 1,
                class_name: "Yoga Matutino",
                status: "enrolled",
                enrolled_at: "2025-05-26T10:30:00Z"
            },
            {
                id: 2,
                user_id: 3,
                user_name: "María García",
                class_id: 1,
                class_name: "Yoga Matutino",
                status: "enrolled",
                enrolled_at: "2025-05-25T15:20:00Z"
            }
        ];
    }

    async fetchUsers() {
        // Simulate API call
        return [
            {
                id: 1,
                name: "Admin User",
                email: "admin@test.com",
                role: "admin",
                created_at: "2025-01-01T00:00:00Z"
            },
            {
                id: 2,
                name: "Juan Pérez",
                email: "juan@test.com",
                role: "client",
                created_at: "2025-05-20T10:30:00Z"
            },
            {
                id: 3,
                name: "María García",
                email: "maria@test.com",
                role: "client",
                created_at: "2025-05-25T15:20:00Z"
            }
        ];
    }

    // Action Methods
    editClass(classId) {
        window.location.href = `edit-class.html?id=${classId}`;
    }

    async deleteClass(classId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
            try {
                // Simulate API call
                this.showMessage('Clase eliminada exitosamente', 'success');
                this.loadClasses();
            } catch (error) {
                this.showMessage('Error eliminando la clase', 'error');
            }
        }
    }

    viewClassInscriptions(classId) {
        this.showSection('inscriptions');
        document.getElementById('classFilter').value = classId;
        this.loadInscriptions();
    }

    async cancelInscription(inscriptionId) {
        if (confirm('¿Cancelar esta inscripción?')) {
            try {
                // Simulate API call
                this.showMessage('Inscripción cancelada', 'success');
                this.loadInscriptions();
            } catch (error) {
                this.showMessage('Error cancelando la inscripción', 'error');
            }
        }
    }

    editUser(userId) {
        // Could open a modal or navigate to edit page
        alert(`Editar usuario ${userId} - Funcionalidad por implementar`);
    }

    async deleteUser(userId) {
        if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            try {
                // Simulate API call
                this.showMessage('Usuario eliminado exitosamente', 'success');
                this.loadUsers();
            } catch (error) {
                this.showMessage('Error eliminando el usuario', 'error');
            }
        }
    }

    // Utility Methods
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        container.textContent = message;
        container.className = `message-container message-${type}`;
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});