// Class Details JavaScript
class ClassDetails {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.currentUser = { id: 1, name: "Juan Pérez" }; // Mock user
        this.classId = null;
        this.classData = null;
        this.userEnrollment = null;
        this.init();
    }

    init() {
        this.classId = this.getClassIdFromUrl();
        if (!this.classId) {
            this.showError();
            return;
        }
        this.loadClassDetails();
    }

    // Get class ID from URL parameters
    getClassIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Load class details
    async loadClassDetails() {
        try {
            const [classResponse, enrollmentResponse] = await Promise.all([
                fetch(`${this.API_BASE}/classes/${this.classId}`),
                fetch(`${this.API_BASE}/inscriptions/user/${this.currentUser.id}`)
            ]);

            if (classResponse.ok) {
                this.classData = await classResponse.json();
            } else {
                throw new Error('Class not found');
            }

            if (enrollmentResponse.ok) {
                const enrollments = await enrollmentResponse.json();
                this.userEnrollment = enrollments.find(e => e.class_id == this.classId);
            }

        } catch (error) {
            console.error('Error loading class details:', error);
            // Mock data for demo
            this.classData = {
                id: this.classId,
                name: "Yoga Matutino",
                description: "Una clase de yoga diseñada para comenzar el día con energía positiva. Trabajaremos posturas básicas, respiración consciente y relajación profunda. Perfecta para todos los niveles.",
                instructor_id: 2,
                instructor_name: "María García",
                instructor_bio: "Instructora certificada con 8 años de experiencia en Hatha Yoga y Vinyasa. Especializada en yoga para principiantes y terapéutico.",
                max_capacity: 20,
                schedule_date: "2024-01-25",
                schedule_time: "08:00",
                duration_minutes: 60,
                status: "active",
                enrolled_count: 15,
                created_at: "2024-01-01T00:00:00Z",
                requirements: "Traer mat de yoga y ropa cómoda. Agua opcional.",
                benefits: "Mejora flexibilidad, reduce estrés, fortalece músculos core."
            };

            // Mock enrollment data
            this.userEnrollment = this.classId == 1 ? {
                id: 1,
                user_id: 1,
                class_id: 1,
                status: "active",
                enrolled_at: "2024-01-15T10:00:00Z"
            } : null;
        }

        this.renderClassDetails();
        this.showClassDetails();
    }

    // Show class details section
    showClassDetails() {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('classDetails').style.display = 'block';
    }

    // Show error message
    showError() {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
    }

    // Render all class details
    renderClassDetails() {
        this.renderHeader();
        this.renderClassInfo();
        this.renderScheduleInfo();
        this.renderCapacityInfo();
        this.renderInstructorInfo();
        this.renderEnrollmentStatus();
        this.renderActions();
    }

    // Render class header
    renderHeader() {
        const headerContainer = document.getElementById('classHeader');
        const isPast = this.isClassPast();
        const isFull = this.classData.enrolled_count >= this.classData.max_capacity;
        
        headerContainer.innerHTML = `
            <div class="class-title">
                <h2>${this.classData.name}</h2>
                <div class="class-badges">
                    <span class="status-badge ${this.getStatusClass(isPast, isFull)}">
                        ${this.getStatusText(isPast, isFull)}
                    </span>
                    ${this.userEnrollment ? '<span class="enrolled-badge">Inscrito</span>' : ''}
                </div>
            </div>
            <p class="class-description">${this.classData.description}</p>
        `;
    }

    // Render class information
    renderClassInfo() {
        const container = document.getElementById('classInfo');
        container.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <strong>Duración:</strong>
                    <span>${this.classData.duration_minutes} minutos</span>
                </div>
                <div class="info-item">
                    <strong>Estado:</strong>
                    <span>${this.classData.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                </div>
                ${this.classData.requirements ? `
                <div class="info-item full-width">
                    <strong>Requisitos:</strong>
                    <span>${this.classData.requirements}</span>
                </div>
                ` : ''}
                ${this.classData.benefits ? `
                <div class="info-item full-width">
                    <strong>Beneficios:</strong>
                    <span>${this.classData.benefits}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Render schedule information
    renderScheduleInfo() {
        const container = document.getElementById('scheduleInfo');
        const classDate = new Date(this.classData.schedule_date + 'T' + this.classData.schedule_time);
        const now = new Date();
        const timeDiff = classDate - now;
        
        let timeUntilClass = '';
        if (timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            if (days > 0) {
                timeUntilClass = `En ${days} día${days > 1 ? 's' : ''} y ${hours} hora${hours > 1 ? 's' : ''}`;
            } else if (hours > 0) {
                timeUntilClass = `En ${hours} hora${hours > 1 ? 's' : ''}`;
            } else {
                timeUntilClass = 'Menos de 1 hora';
            }
        }

        container.innerHTML = `
            <div class="schedule-grid">
                <div class="schedule-item">
                    <strong>Fecha:</strong>
                    <span>${this.formatDate(this.classData.schedule_date)}</span>
                </div>
                <div class="schedule-item">
                    <strong>Hora:</strong>
                    <span>${this.classData.schedule_time}</span>
                </div>
                <div class="schedule-item">
                    <strong>Hora de fin:</strong>
                    <span>${this.calculateEndTime()}</span>
                </div>
                ${timeUntilClass ? `
                <div class="schedule-item full-width time-until">
                    <strong>Tiempo hasta la clase:</strong>
                    <span>${timeUntilClass}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Render capacity information
    renderCapacityInfo() {
        const container = document.getElementById('capacityInfo');
        const availableSpots = this.classData.max_capacity - this.classData.enrolled_count;
        const capacityPercentage = (this.classData.enrolled_count / this.classData.max_capacity) * 100;
        
        container.innerHTML = `
            <div class="capacity-display">
                <div class="capacity-numbers">
                    <div class="capacity-stat">
                        <span class="number">${this.classData.enrolled_count}</span>
                        <span class="label">Inscritos</span>
                    </div>
                    <div class="capacity-stat">
                        <span class="number">${availableSpots}</span>
                        <span class="label">Disponibles</span>
                    </div>
                    <div class="capacity-stat">
                        <span class="number">${this.classData.max_capacity}</span>
                        <span class="label">Capacidad Total</span>
                    </div>
                </div>
                <div class="capacity-bar">
                    <div class="capacity-fill" style="width: ${capacityPercentage}%"></div>
                </div>
                <p class="capacity-text">
                    ${availableSpots > 0 ? 
                        `${availableSpots} lugar${availableSpots > 1 ? 'es' : ''} disponible${availableSpots > 1 ? 's' : ''}` : 
                        'Clase llena'
                    }
                </p>
            </div>
        `;
    }

    // Render instructor information
    renderInstructorInfo() {
        const container = document.getElementById('instructorInfo');
        container.innerHTML = `
            <div class="instructor-card">
                <div class="instructor-avatar">
                    <span>${this.getInitials(this.classData.instructor_name)}</span>
                </div>
                <div class="instructor-details">
                    <h4>${this.classData.instructor_name || 'Por asignar'}</h4>
                    ${this.classData.instructor_bio ? 
                        `<p>${this.classData.instructor_bio}</p>` : 
                        '<p>Información del instructor no disponible.</p>'
                    }
                </div>
            </div>
        `;
    }

    // Render enrollment status
    renderEnrollmentStatus() {
        const container = document.getElementById('enrollmentStatus');
        
        if (!this.userEnrollment) {
            container.innerHTML = `
                <div class="enrollment-status not-enrolled">
                    <p><strong>Estado:</strong> No inscrito</p>
                    <p>Puedes inscribirte a esta clase si hay lugares disponibles.</p>
                </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="enrollment-status enrolled">
                    <p><strong>Estado:</strong> Inscrito</p>
                    <p>Te inscribiste el ${this.formatDate(this.userEnrollment.enrolled_at)}.</p>
                </div>
            `;
        }
    }

    // Render actions (e.g., enroll button)
    renderActions() {
        const container = document.getElementById('classActions');
        if (this.userEnrollment) {
            container.innerHTML = `
                <button class="btn enrolled" disabled>Ya estás inscrito</button>
            `;
        } else if (this.classData.enrolled_count < this.classData.max_capacity && !this.isClassPast()) {
            container.innerHTML = `
                <button class="btn enroll-btn" onclick="alert('Funcionalidad de inscripción próximamente')">Inscribirse</button>
            `;
        } else {
            container.innerHTML = `
                <button class="btn full" disabled>${this.isClassPast() ? 'Clase pasada' : 'Sin cupos disponibles'}</button>
            `;
        }
    }

    // Calculate end time of the class
    calculateEndTime() {
        const [hour, minute] = this.classData.schedule_time.split(':').map(Number);
        const start = new Date(`${this.classData.schedule_date}T${this.classData.schedule_time}`);
        start.setMinutes(start.getMinutes() + this.classData.duration_minutes);
        return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
    }

    // Get initials from a name
    getInitials(name) {
        return name.split(' ')
                   .map(word => word.charAt(0).toUpperCase())
                   .join('')
                   .slice(0, 2);
    }

    // Format date string to readable format
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Get class status CSS class
    getStatusClass(isPast, isFull) {
        if (isPast) return 'status-past';
        if (isFull) return 'status-full';
        return 'status-available';
    }

    // Get status text for class badge
    getStatusText(isPast, isFull) {
        if (isPast) return 'Finalizada';
        if (isFull) return 'Llena';
        return 'Disponible';
    }

    // Determine if class is in the past
    isClassPast() {
        const now = new Date();
        const classDate = new Date(`${this.classData.schedule_date}T${this.classData.schedule_time}`);
        return classDate < now;
    }
}

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => new ClassDetails());