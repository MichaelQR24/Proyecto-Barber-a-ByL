# Despliegue de Barbería ByL en Azure Portal (Web)

Esta guía te mostrará cómo desplegar tu aplicación directamente desde el portal web de Azure sin usar la CLI.

## Requisitos previos

- Cuenta de Microsoft Azure
- Navegador web actualizado (Chrome, Firefox, Edge, Safari)
- Archivo ZIP con tu aplicación (ya preparado)
- Credenciales de Azure Database for MySQL

## Preparación del Archivo ZIP

Tu archivo ZIP debe contener solamente el backend de la aplicación (no el frontend estático si se alojará por separado):

1. El archivo ZIP debe contener todos los archivos de la carpeta: `despliegue_azure/backend/`
2. La estructura dentro del ZIP debe ser:
```
backend-azure-ready.zip
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── .env (solo como referencia, NO incluir credenciales reales)
├── app.js (archivo principal optimizado)
├── package.json
├── package-lock.json
├── server.js
├── .deployment
└── (otros archivos)
```

## Paso a Paso para Despliegue desde Azure Portal

### Paso 1: Acceder a Azure Portal
1. Navega a https://portal.azure.com
2. Inicia sesión con tus credenciales de Azure

### Paso 2: Crear un nuevo App Service
1. Haz clic en "Crear un recurso" (+) en el panel izquierdo
2. Busca "Web App" y selecciona "Web App"
3. Haz clic en "Crear"
4. Completa los campos:
   - **Suscripción**: Tu suscripción de Azure
   - **Grupo de recursos**: Crea uno nuevo o selecciona uno existente (ej: "BarberiaByL-RG")
   - **Nombre de la aplicación**: Elige un nombre único (ej: "barberia-byl-app")
   - **Publicar**: Código
   - **Pila en tiempo de ejecución**: Node.js 16 LTS o superior
   - **Sistema operativo**: Linux (recomendado) o Windows
   - **Región**: Selecciona una cerca de tu audiencia (ej: East US)
5. Haz clic en "Siguiente: Plan de hospedaje" y configura:
   - **Plan de App Service**: Crea uno nuevo o usa uno existente
   - **SKU y tamaño**: B1 (Básico) es suficiente para pruebas (gratuito en algunos casos)
6. Haz clic en "Revisar y crear", luego en "Crear"

### Paso 3: Configurar Variables de Entorno
1. Una vez creada la aplicación, ve a ella desde "Grupos de recursos" o "Todos los recursos"
2. En el panel izquierdo, ve a "Configuración" → "Configuración de la aplicación"
3. En la pestaña "Application Settings", agrega los siguientes pares clave-valor:
   - `DB_HOST`: `tu-nombre-mysql.mysql.database.azure.com`
   - `DB_USER`: `adminuser@tu-nombre-mysql` (sustituir con tu nombre real)
   - `DB_PASSWORD`: `tu-contraseña-de-mysql` (sustituir con tu contraseña real)
   - `DB_NAME`: `barberia_byl`
   - `JWT_SECRET`: `clave-super-segura-para-jwt`
   - `NODE_ENV`: `production`
   - `PORT`: `8080`
4. Haz clic en "Guardar" (puede pedir confirmación)

### Paso 4: Habilitar CORS (si es necesario)
1. En el panel izquierdo, ve a "CORS"
2. Agrega los dominios permitidos:
   - `https://barberia-byl-app.azurewebsites.net` (tu dominio de app)
   - `https://*.azurewebsites.net` (para permitir todos los dominios de Azure)
   - Tu dominio personalizado si lo tienes

### Paso 5: Desplegar desde un archivo ZIP
1. En el panel izquierdo, ve a "Centro de implementación"
2. Haz clic en "Desplegar con ZIP" (o "Deploy with ZIP file")
3. Haz clic en "Subir e implementar"
4. Selecciona tu archivo ZIP que contiene el backend de tu aplicación
5. Espera a que se complete la implementación (puedes ver el progreso en la consola)

### Opción alternativa: Despliegue con Kudu (avanzado)
1. Accede a `https://TU_APP.scm.azurewebsites.net`
2. Ve a "Tools" → "Zip Push Deploy"
3. Sube tu archivo ZIP

### Paso 6: Verificar la Aplicación
1. Ve a la página principal de tu App Service
2. Haz clic en la URL de la aplicación (ej: `https://barberia-byl-app.azurewebsites.net`)
3. Prueba la API con `/api/test`
4. Verifica el estado con `/health`

## Configuración Adicional Recomendada

### 1. Configuración de Diagnóstico
- En "Monitoreo" → "Configuración de diagnóstico"
- Habilita la recopilación de logs para troubleshooting

### 2. Configuración de Escalado (si es necesario)
- En "Configuración" → "Escala hacia arriba"
- Puedes cambiar el plan de hospedaje según necesidad

### 3. Configuración de SSL (opcional)
- Si tienes dominio personalizado, puedes solicitar certificado SSL gratuito

## Solución de Problemas Comunes

### 1. Error al subir ZIP
- Asegúrate que el archivo ZIP no es mayor a 200MB
- Verifica que solo contenga los archivos necesarios

### 2. Error de conexión a la base de datos
- Verifica que las variables de entorno están correctamente configuradas
- Asegúrate que el firewall de MySQL permite conexiones desde Azure

### 3. La aplicación no arranca
- Revisa los logs de diagnóstico en "Monitoreo" → "Registros de diagnóstico"
- Verifica que package.json tiene el script de inicio correcto

### 4. Error 500 o 503
- Verifica que las dependencias están correctamente listadas en package.json
- Revisa que el puerto sea el correcto (8080 o process.env.PORT)

## Configuración de la Base de Datos MySQL

Si aún no tienes la base de datos configurada:

1. En Azure Portal, busca "Azure Database for MySQL"
2. Crea una instancia con los siguientes parámetros:
   - Versión: 5.7 o 8.0
   - Nombre de servidor: único globalmente
   - Nombre de usuario: adminuser@tu-servidor (reemplaza con tu nombre)
   - Contraseña: contraseña segura
   - Ubicación: la misma que tu App Service
3. Una vez creada, ve a "Seguridad" → "Reglas de firewall"
4. Crea una regla para permitir acceso desde Azure Services
5. Crea una regla para tu IP local si necesitas conectarte directamente

## Verificación Final

Después del despliegue:

1. Accede a: `https://TU_APP.azurewebsites.net/api/test`
2. Deberías ver: `{"message": "Backend de Barbería ByL funcionando correctamente en Azure"}`
3. Accede a: `https://TU_APP.azurewebsites.net/health`
4. Deberías ver el estado de salud de la aplicación

## Recomendaciones

- Guarda tus credenciales de manera segura
- Considera usar Azure Key Vault para guardar secrets más sensibles
- Configura alertas de monitoreo para tu aplicación
- Realiza copias de seguridad regulares de tu base de datos