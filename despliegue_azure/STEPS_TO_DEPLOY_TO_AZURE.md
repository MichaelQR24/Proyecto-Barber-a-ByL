# Pasos para Desplegar Barbería ByL en Azure

## Prerrequisitos
- Cuenta de Microsoft Azure
- CLI de Azure instalado (`az`)
- Git instalado
- Cuenta de GitHub (opcional, para CI/CD)

## Paso 1: Preparar el entorno

1. Asegúrate de tener el CLI de Azure instalado
```bash
az --version
```

2. Inicia sesión en Azure
```bash
az login
```

## Paso 2: Crear recursos en Azure

1. Crear un grupo de recursos
```bash
az group create --name BarberiaByL-RG --location "East US"
```

2. Crear un App Service Plan (Linux)
```bash
az appservice plan create --name BarberiaByL-Plan --resource-group BarberiaByL-RG --sku B1 --is-linux
```

3. Crear una base de datos MySQL en Azure
```bash
# Crear el servidor MySQL (esto tomará varios minutos)
az mysql server create --resource-group BarberiaByL-RG --name barberia-byldatabase --location "East US" --admin-user adminuser --admin-password StrongPassword123! --sku-name B_Gen5_1 --version 8.0

# Configurar firewall para permitir conexiones desde Azure
az mysql server firewall-rule create --resource-group BarberiaByL-RG --server-name barberia-byldatabase --name AllowAzureAccess --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

# Configurar firewall para permitir conexiones desde tu IP local (opcional)
az mysql server firewall-rule create --resource-group BarberiaByL-RG --server-name barberia-byldatabase --name AllowMyIP --start-ip-address YOUR_IP_ADDRESS --end-ip-address YOUR_IP_ADDRESS
```

## Paso 3: Configurar la aplicación web

1. Crear la aplicación web
```bash
az webapp create --resource-group BarberiaByL-RG --plan BarberiaByL-Plan --name barberia-byl-app --runtime "NODE|16-lts" --deployment-local-git
```

2. Configurar las variables de entorno
```bash
az webapp config appsettings set --resource-group BarberiaByL-RG --name barberia-byl-app --settings \
"DB_HOST=barberia-byldatabase.mysql.database.azure.com" \
"DB_USER=adminuser@barberia-byldatabase" \
"DB_PASSWORD=StrongPassword123!" \
"DB_NAME=barberia_byl" \
"JWT_SECRET=your-super-secret-jwt-key-change-this" \
"NODE_ENV=production" \
"PORT=8080"
```

## Paso 4: Preparar el código para despliegue

1. Copiar la carpeta `despliegue_azure/backend` al directorio raíz (en caso de que no esté ya configurado)
2. Asegurarte de que el código está en un repositorio Git

## Paso 5: Desplegar la aplicación

### Opción A: Usando Git (más directo)
1. Obtener las credenciales de Git para tu App Service
```bash
az webapp deployment user show
```

2. Configurar las credenciales de Git
```bash
az webapp deployment user set --user-name <username> --password <password>
```

3. Obtener la URL de Git para tu App Service
```bash
az webapp deployment source config-local-git --name barberia-byl-app --resource-group BarberiaByL-RG
```

4. En tu directorio local, agregar el remoto de Azure y hacer push
```bash
git remote add azure https://<username>@barberia-byl-app.scm.azurewebsites.net/barberia-byl-app.git
git add .
git commit -m "Preparar para despliegue en Azure"
git push azure main
```

### Opción B: Usando ZIP deployment
1. Empaquetar el código del backend en un archivo ZIP
2. Desplegar usando el archivo ZIP
```bash
az webapp deployment source config-zip --resource-group BarberiaByL-RG --name barberia-byl-app --src app.zip
```

### Opción C: Usando GitHub Actions (recomendado para CI/CD)
1. Subir tu código a un repositorio de GitHub
2. Configurar GitHub Actions con el archivo `azure-pipelines.yml`
3. El despliegue ocurrirá automáticamente con cada commit en la rama main

## Paso 6: Configurar el frontend (si se hospeda por separado)

Para el frontend, puedes usar Azure Static Web Apps o Azure Storage como sitio estático:

1. Crear una cuenta de almacenamiento para hospedaje estático
```bash
az storage account create --name barberiabylstorage --resource-group BarberiaByL-RG --location "East US" --sku Standard_LRS --kind StorageV2 --access-tier Hot --https-only true
```

2. Habilitar el sitio web estático
```bash
az storage blob service-properties update --account-name barberiabylstorage --static-website --404-document index.html --index-document index.html
```

3. Subir los archivos del frontend
```bash
az storage blob upload-batch --account-name barberiabylstorage --destination '$web' --source ./despliegue_azure/frontend
```

## Paso 7: Verificar el despliegue

1. Acceder a tu aplicación en: `https://barberia-byl-app.azurewebsites.net`
2. Probar la API con: `https://barberia-byl-app.azurewebsites.net/api/test`
3. Verificar el estado con: `https://barberia-byl-app.azurewebsites.net/health`

## Paso 8: Configuración adicional (opcional)

1. Añadir dominio personalizado
```bash
az webapp config hostname add --resource-group BarberiaByL-RG --name barberia-byl-app --hostname yourdomain.com
```

2. Configurar SSL gratuito con Let's Encrypt (si usas dominio personalizado)
3. Habilitar Application Insights para monitoreo
4. Configurar escalado automático según la demanda

## Solución de problemas comunes

1. **Error de conexión a la base de datos**: Verificar firewall de MySQL y cadenas de conexión
2. **Error de CORS**: Asegurar que las políticas CORS permitan el dominio de frontend
3. **Aplicación no responde**: Verificar logs con `az webapp log tail --name barberia-byl-app --resource-group BarberiaByL-RG`
4. **Errores de despliegue**: Verificar que todas las dependencias están en package.json

## Costos estimados

- App Service B1: Aproximadamente $15-20/mes
- MySQL Básico: Aproximadamente $10-15/mes
- Tráfico de datos: Costo adicional según uso

Costo total estimado: $25-35/mes para un uso moderado.