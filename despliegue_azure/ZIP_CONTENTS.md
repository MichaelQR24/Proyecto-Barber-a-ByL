# Contenido del Archivo ZIP para Despliegue en Azure Portal

Este archivo detalla exactamente qué debe contener tu archivo ZIP para subirlo al portal de Azure.

## Estructura del Archivo ZIP

Tu archivo ZIP debe llamarse `barberia_byl_backend.zip` y contener los siguientes archivos y carpetas directamente en la raíz del ZIP:

```
barberia_byl_backend.zip
├── app.js                    # Punto de entrada optimizado para Azure
├── server.js                 # Archivo del servidor principal
├── package.json             # Dependencias y scripts de la aplicación
├── package-lock.json        # Versiones exactas de dependencias
├── .deployment              # Configuración de despliegue
├── config/                  # Configuración de la aplicación
│   └── db.js               # Configuración de conexión a la base de datos
├── controllers/            # Lógica de negocio
│   ├── authController.js
│   ├── boletaController.js
│   ├── productoController.js
│   ├── reservaController.js
│   └── servicioController.js
├── middleware/             # Middleware de autenticación y autorización
│   ├── adminAuth.js
│   └── auth.js
├── models/                 # Modelos de base de datos
│   ├── Boleta.js
│   ├── Producto.js
│   ├── Reserva.js
│   ├── Servicio.js
│   └── Usuario.js
├── routes/                 # Definición de rutas API
│   ├── auth.js
│   ├── boleta.js
│   ├── producto.js
│   ├── reserva.js
│   └── servicio.js
└── utils/                  # Archivos de utilidad (si existen)
```

## Archivos Principales a Incluir

### 1. app.js
- Punto de entrada principal optimizado para Azure
- Maneja variables de entorno, logging, y health checks
- Escucha en todas las interfaces con el puerto de Azure

### 2. server.js
- Archivo de servidor alternativo (como respaldo)
- Configurado para usar el puerto proporcionado por Azure
- Incluye manejo de errores y logging

### 3. package.json
IMPORTANTE: Asegúrate que contiene:
```json
{
  "name": "barberia-byl-backend",
  "version": "1.0.0",
  "description": "Backend para el proyecto Barbería ByL",
  "main": "app.js",  // <-- ESTO ES MUY IMPORTANTE
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1"
  }
}
```

### 4. .deployment
Contiene:
```
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = false
```

## Pasos para Crear el Archivo ZIP

### Opción 1: Usando Windows Explorer
1. Navega a `C:\Users\Micha\Desktop\Barberia ByL\despliegue_azure\backend`
2. Selecciona todos los archivos y carpetas
3. Haz clic derecho → "Enviar a" → "Carpeta comprimida"
4. Renombra a `barberia_byl_backend.zip`

### Opción 2: Usando PowerShell
```powershell
Compress-Archive -Path "C:\Users\Micha\Desktop\Barberia ByL\despliegue_azure\backend\*" -DestinationPath "C:\Users\Micha\Desktop\barberia_byl_backend.zip"
```

### Opción 3: Usando 7-Zip (si está instalado)
1. Haz clic derecho en la carpeta `backend`
2. Selecciona "7-Zip" → "Agregar a archivo..."
3. Elige formato ZIP y nombre `barberia_byl_backend.zip`

## Verificación del Contenido del ZIP

Antes de subir, asegúrate que:

- El archivo ZIP no excede los 200 MB
- Todos los archivos necesarios están incluidos
- No se incluyen archivos innecesarios (.git, node_modules, .env con credenciales reales)
- El archivo `app.js` está en la raíz del ZIP
- El archivo `package.json` está en la raíz del ZIP

## Notas Importantes

- NO incluyas la carpeta `node_modules` en el ZIP (Azure la instalará automáticamente)
- NO incluyas archivos `.env` con credenciales reales (configura como Application Settings en Azure)
- Asegúrate que `main` en `package.json` apunte al archivo correcto (`app.js`)
- El archivo ZIP debe contener directamente los archivos, NO una carpeta que los contenga

## Prueba Local Antes de Subir

Antes de subir a Azure, puedes probar localmente:

1. Asegúrate de tener Node.js instalado
2. Abre una terminal en la carpeta `backend`
3. Ejecuta `npm install` para instalar dependencias
4. Ejecuta `npm start` o `node app.js`
5. Visita `http://localhost:8080/api/test` para verificar que funcione

Si funciona localmente, probablemente funcionará en Azure.