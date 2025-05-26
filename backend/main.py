from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import json
import os
import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI


# Configuración de la aplicación
app = FastAPI(title="Sistema de Gestión de Clases", version="1.0.0")

# Permitir solicitudes desde cualquier origen (o específica si prefieres)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes poner ["http://127.0.0.1:5500"] si prefieres restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Archivo JSON para persistencia
DATA_FILE = "data.json"

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"

class ClassStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class InscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

# Modelos Pydantic
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ClassBase(BaseModel):
    name: str
    description: str
    max_capacity: int
    schedule_date: date
    schedule_time: str
    duration_minutes: int

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    id: str
    status: ClassStatus = ClassStatus.ACTIVE
    enrolled_count: int = 0
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

class InscriptionBase(BaseModel):
    user_id: str
    class_id: str

class InscriptionCreate(InscriptionBase):
    pass

class Inscription(InscriptionBase):
    id: str
    status: InscriptionStatus = InscriptionStatus.ACTIVE
    enrolled_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Servicio de datos
class DataService:
    def __init__(self):
        self.data = self._load_data()
    
    def _load_data(self) -> Dict[str, Any]:
        """Carga los datos desde el archivo JSON"""
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as file:
                data = json.load(file)
                # Convertir strings de fecha de vuelta a objetos datetime
                for user in data.get('users', []):
                    user['created_at'] = datetime.fromisoformat(user['created_at'])
                for cls in data.get('classes', []):
                    cls['created_at'] = datetime.fromisoformat(cls['created_at'])
                    cls['schedule_date'] = datetime.fromisoformat(cls['schedule_date']).date()
                for inscription in data.get('inscriptions', []):
                    inscription['enrolled_at'] = datetime.fromisoformat(inscription['enrolled_at'])
                return data
        return {"users": [], "classes": [], "inscriptions": []}
    
    def _save_data(self):
        """Guarda los datos en el archivo JSON"""
        # Crear una copia para serializar
        data_copy = {
            "users": [],
            "classes": [],
            "inscriptions": []
        }
        
        # Convertir datetime a string para JSON
        for user in self.data['users']:
            user_copy = user.copy()
            user_copy['created_at'] = user['created_at'].isoformat()
            data_copy['users'].append(user_copy)
        
        for cls in self.data['classes']:
            cls_copy = cls.copy()
            cls_copy['created_at'] = cls['created_at'].isoformat()
            cls_copy['schedule_date'] = cls['schedule_date'].isoformat()
            data_copy['classes'].append(cls_copy)
        
        for inscription in self.data['inscriptions']:
            inscription_copy = inscription.copy()
            inscription_copy['enrolled_at'] = inscription['enrolled_at'].isoformat()
            data_copy['inscriptions'].append(inscription_copy)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as file:
            json.dump(data_copy, file, indent=2, ensure_ascii=False)
    
    # Métodos para usuarios
    def create_user(self, user_data: UserCreate) -> User:
        user_dict = {
            "id": str(uuid.uuid4()),
            "name": user_data.name,
            "email": user_data.email,
            "role": user_data.role,
            "password": user_data.password,  # En producción, hash esto
            "created_at": datetime.now()
        }
        
        # Verificar email único
        if any(u['email'] == user_data.email for u in self.data['users']):
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        self.data['users'].append(user_dict)
        self._save_data()
        
        # Retornar sin password
        user_dict_safe = user_dict.copy()
        del user_dict_safe['password']
        return User(**user_dict_safe)
    
    def get_users(self) -> List[User]:
        users_safe = []
        for user in self.data['users']:
            user_safe = user.copy()
            del user_safe['password']
            users_safe.append(User(**user_safe))
        return users_safe
    
    def get_user(self, user_id: str) -> Optional[User]:
        user = next((u for u in self.data['users'] if u['id'] == user_id), None)
        if user:
            user_safe = user.copy()
            del user_safe['password']
            return User(**user_safe)
        return None
    
    def update_user(self, user_id: str, user_data: UserBase) -> Optional[User]:
        for i, user in enumerate(self.data['users']):
            if user['id'] == user_id:
                # Verificar email único (excluyendo el usuario actual)
                if any(u['email'] == user_data.email and u['id'] != user_id for u in self.data['users']):
                    raise HTTPException(status_code=400, detail="El email ya está registrado")
                
                self.data['users'][i].update({
                    "name": user_data.name,
                    "email": user_data.email,
                    "role": user_data.role
                })
                self._save_data()
                
                user_safe = self.data['users'][i].copy()
                del user_safe['password']
                return User(**user_safe)
        return None
    
    def delete_user(self, user_id: str) -> bool:
        initial_length = len(self.data['users'])
        self.data['users'] = [u for u in self.data['users'] if u['id'] != user_id]
        
        if len(self.data['users']) < initial_length:
            # También eliminar inscripciones del usuario
            self.data['inscriptions'] = [i for i in self.data['inscriptions'] if i['user_id'] != user_id]
            self._save_data()
            return True
        return False
    
    # Métodos para clases
    def create_class(self, class_data: ClassCreate) -> Class:
        
        class_dict = {
            "id": str(uuid.uuid4()),
            "name": class_data.name,
            "description": class_data.description,
            "max_capacity": class_data.max_capacity,
            "schedule_date": class_data.schedule_date,
            "schedule_time": class_data.schedule_time,
            "duration_minutes": class_data.duration_minutes,
            "status": ClassStatus.ACTIVE,
            "enrolled_count": 0,
            "created_at": datetime.now()
        }
        
        self.data['classes'].append(class_dict)
        self._save_data()
        return Class(**class_dict)
    
    def get_classes(self) -> List[Class]:
        return [Class(**cls) for cls in self.data['classes']]
    
    def get_class(self, class_id: str) -> Optional[Class]:
        cls = next((c for c in self.data['classes'] if c['id'] == class_id), None)
        return Class(**cls) if cls else None
    
    def update_class(self, class_id: str, class_data: ClassCreate) -> Optional[Class]:
        
        for i, cls in enumerate(self.data['classes']):
            if cls['id'] == class_id:
                self.data['classes'][i].update({
                    "name": class_data.name,
                    "description": class_data.description,
                    "max_capacity": class_data.max_capacity,
                    "schedule_date": class_data.schedule_date,
                    "schedule_time": class_data.schedule_time,
                    "duration_minutes": class_data.duration_minutes
                })
                self._save_data()
                return Class(**self.data['classes'][i])
        return None
    
    def delete_class(self, class_id: str) -> bool:
        initial_length = len(self.data['classes'])
        self.data['classes'] = [c for c in self.data['classes'] if c['id'] != class_id]
        
        if len(self.data['classes']) < initial_length:
            # También eliminar inscripciones de la clase
            self.data['inscriptions'] = [i for i in self.data['inscriptions'] if i['class_id'] != class_id]
            self._save_data()
            return True
        return False
    
    # Métodos para inscripciones
    def create_inscription(self, inscription_data: InscriptionCreate) -> Inscription:
        # Verificar que el usuario existe
        user = self.get_user(inscription_data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que la clase existe
        cls = self.get_class(inscription_data.class_id)
        if not cls:
            raise HTTPException(status_code=404, detail="Clase no encontrada")
        
        # Verificar que la clase está activa
        if cls.status != ClassStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="La clase no está disponible")
        
        # Verificar que no esté ya inscrito
        existing = next((i for i in self.data['inscriptions'] 
                        if i['user_id'] == inscription_data.user_id 
                        and i['class_id'] == inscription_data.class_id
                        and i['status'] == InscriptionStatus.ACTIVE), None)
        if existing:
            raise HTTPException(status_code=400, detail="El usuario ya está inscrito en esta clase")
        
        # Verificar capacidad
        active_inscriptions = len([i for i in self.data['inscriptions'] 
                                 if i['class_id'] == inscription_data.class_id 
                                 and i['status'] == InscriptionStatus.ACTIVE])
        if active_inscriptions >= cls.max_capacity:
            raise HTTPException(status_code=400, detail="La clase ha alcanzado su capacidad máxima")
        
        inscription_dict = {
            "id": str(uuid.uuid4()),
            "user_id": inscription_data.user_id,
            "class_id": inscription_data.class_id,
            "status": InscriptionStatus.ACTIVE,
            "enrolled_at": datetime.now()
        }
        
        self.data['inscriptions'].append(inscription_dict)
        
        # Actualizar contador de la clase
        for cls_data in self.data['classes']:
            if cls_data['id'] == inscription_data.class_id:
                cls_data['enrolled_count'] = active_inscriptions + 1
                break
        
        self._save_data()
        return Inscription(**inscription_dict)
    
    def get_inscriptions(self) -> List[Inscription]:
        return [Inscription(**ins) for ins in self.data['inscriptions']]
    
    def get_user_inscriptions(self, user_id: str) -> List[Inscription]:
        user_inscriptions = [ins for ins in self.data['inscriptions'] if ins['user_id'] == user_id]
        return [Inscription(**ins) for ins in user_inscriptions]
    
    def get_class_inscriptions(self, class_id: str) -> List[Inscription]:
        class_inscriptions = [ins for ins in self.data['inscriptions'] if ins['class_id'] == class_id]
        return [Inscription(**ins) for ins in class_inscriptions]
    
    def cancel_inscription(self, inscription_id: str) -> Optional[Inscription]:
        for i, inscription in enumerate(self.data['inscriptions']):
            if inscription['id'] == inscription_id:
                self.data['inscriptions'][i]['status'] = InscriptionStatus.CANCELLED
                
                # Actualizar contador de la clase
                class_id = inscription['class_id']
                active_count = len([ins for ins in self.data['inscriptions'] 
                                  if ins['class_id'] == class_id 
                                  and ins['status'] == InscriptionStatus.ACTIVE])
                
                for cls_data in self.data['classes']:
                    if cls_data['id'] == class_id:
                        cls_data['enrolled_count'] = active_count
                        break
                
                self._save_data()
                return Inscription(**self.data['inscriptions'][i])
        return None

# Instancia global del servicio
data_service = DataService()

# Endpoints para usuarios
@app.post("/users/", response_model=User)
async def create_user(user: UserCreate):
    """Crear un nuevo usuario"""
    return data_service.create_user(user)

@app.get("/users/", response_model=List[User])
async def get_users():
    """Obtener todos los usuarios"""
    return data_service.get_users()

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Obtener un usuario por ID"""
    user = data_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@app.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user: UserBase):
    """Actualizar un usuario"""
    updated_user = data_service.update_user(user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return updated_user

@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Eliminar un usuario"""
    if not data_service.delete_user(user_id):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado exitosamente"}

# Endpoints para clases
@app.post("/classes/", response_model=Class)
async def create_class(class_data: ClassCreate):
    """Crear una nueva clase"""
    return data_service.create_class(class_data)

@app.get("/classes/", response_model=List[Class])
async def get_classes():
    """Obtener todas las clases"""
    return data_service.get_classes()

@app.get("/classes/{class_id}", response_model=Class)
async def get_class(class_id: str):
    """Obtener una clase por ID"""
    cls = data_service.get_class(class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return cls

@app.put("/classes/{class_id}", response_model=Class)
async def update_class(class_id: str, class_data: ClassCreate):
    """Actualizar una clase"""
    updated_class = data_service.update_class(class_id, class_data)
    if not updated_class:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return updated_class

@app.delete("/classes/{class_id}")
async def delete_class(class_id: str):
    """Eliminar una clase"""
    if not data_service.delete_class(class_id):
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    return {"message": "Clase eliminada exitosamente"}

# Endpoints para inscripciones
@app.post("/inscriptions/", response_model=Inscription)
async def create_inscription(inscription: InscriptionCreate):
    """Inscribir un usuario a una clase"""
    return data_service.create_inscription(inscription)

@app.get("/inscriptions/", response_model=List[Inscription])
async def get_inscriptions():
    """Obtener todas las inscripciones"""
    return data_service.get_inscriptions()

@app.get("/inscriptions/user/{user_id}", response_model=List[Inscription])
async def get_user_inscriptions(user_id: str):
    """Obtener inscripciones de un usuario"""
    return data_service.get_user_inscriptions(user_id)

@app.get("/inscriptions/class/{class_id}", response_model=List[Inscription])
async def get_class_inscriptions(class_id: str):
    """Obtener inscripciones de una clase"""
    return data_service.get_class_inscriptions(class_id)

@app.put("/inscriptions/{inscription_id}/cancel", response_model=Inscription)
async def cancel_inscription(inscription_id: str):
    """Cancelar una inscripción"""
    cancelled = data_service.cancel_inscription(inscription_id)
    if not cancelled:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    return cancelled

# Endpoint de información
@app.get("/")
async def root():
    return {
        "message": "Sistema de Gestión de Clases API",
        "version": "1.0.0",
        "endpoints": {
            "users": "/users/",
            "classes": "/classes/",
            "inscriptions": "/inscriptions/",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)