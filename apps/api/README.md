<p align="center"> <a href="http://nestjs.com/" target="_blank"> <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" /> </a> <a href="https://dtime.com.co/" target="_blank"> <img src="" width="120" alt="videlca logo" /> </a> </p> <h1 align="center">Proyecto Backend VIDELCA v1.0.0</h1> <p align="center"> Backend para manejar los endpoints que sirven al aplicativo administrador de Videlca. </p>

# 🚀 Requisitos previos
Este proyecto está basado en NestJS, así que se recomienda tener el CLI de NestJS instalado. Puedes instalarlo ejecutando el siguiente comando como administrador en tu terminal:

```
npm i -g @nestjs/cli
```

### ⭐ TENER EN CUENTA:
Se esta utilizando una BD MySql que se esta ejecutando en un server, asi que se debe asegurar que esta se este ejecutando para poder realizar la correcta conexion.

### OPCIONAL
SI SE NECESITAN HACER PRUEBAS Y NO AFECTAR A LA BD DEL SERVER PUEDES USAR DOCKER
Instalar __DOCKER DESKTOP__ para utilizar la imagen de __MySql__ para la base de datos, esto creando un archivo _DOCKER-COMPOSE.YAML_


# 🛠️ Instalación y configuración

### 1. Clonar el proyecto

```
git clone 
```

### 2. Instalar dependencias

```
yarn install
```

### 3. Configurar variables de entorno

⭐ Clona el archivo __.env.template__ y renómbralo a __.env__

⭐ Asegúrate de establecer la variable de entorno __ENV__ en __dev__ (para modo desarrollo).

⭐ Asegúrate que todas las variables de entorno tengan un valor. si vas a utilizar __Docker Compose__ para levantar la base de datos en desarrollo, te recomiendo no tocar las variables de entorno que comienzan por __DB__, si vas a usar una __BD Mysql__ ya existente ya sea localmente o en un server entonces puedes modificar estas variables y colocarle los valores requeridos para realizar la conexion.

⭐ La variable de entorno __PORT__ establece el puerto donde se ejucutara el server, asegurate de no estarlo usando, o puede dar error. (si cambiaste el puerto, no se te olvide tambien cambiarlo en las variables __HOST_API__ y __HOST_PUBLIC__)

⭐ La variable de entorno __HOST_API__ hace referencia al path completo de este server, es decir la __URL__ del server + __/videlca/api/v1__

⭐ La variable de entorno __HOST_PUBLIC__ hace referencia solo a la __URL__ del server

⭐ La variable de entorno __HOST_FRONTEND__ hace referencia a la url del frontend, si tienes el frontend corriendo, puedes cambiar esta variable por el host del frontend.

⭐Las variables de entorno para servicio de Emails: 
 1. __MAILER_EMAIL__: hace referencia al correo desde donde se van a mandar los correos, por ejemplo el de "confirmar cuenta".
 2. __MAILER_SECRET_KEY__: hace referencia a la contraseña de aplicacion que genera google para poder utilizar nuestro correo en apps de terceros para el envio de mensajes.
 3. __CONTACT_MAILER_TO__: hace referencia al correo donde van a caer las solicitudes de contacto de los usuarios.
 
⭐ La variable de entorno __JWT_SECRET__ puede ser cualquier palabra al azar (que sea segura), esto es para firmar y validar los tokens del server, ej: ```ViDeLcAsEcReTWoRd```

### 4. Levantar la base de datos (OPCIONAL)
Si estas usando docker para utilizar la imagen de Mysql, entonces debes levnatar la BD
Ejecuta el siguiente comando para iniciar la base de datos utilizando Docker:

```
docker-compose up -d
```

### 5. Modo desarrollo
Inicia el servidor en modo desarrollo:

```
yarn start:dev
```

## 6. Ejecutar Seed
### ⚠️ ¡Atención! Este endpoint LIMPIA la base de datos y solo inserta datos de prueba en las tablas menores.

⚠️ Solo disponible en modo DEV.

⚠️ Recomendado ejecutarlo si es la primera vez que inicias la aplicación, ya que cargará datos para pruebas.

Endpoint para ejecutar el Seed:

```
http://localhost:{PORT}/videlca/api/v1/seed
```
Asegúrate de usar el puerto correspondiente en la URL.

## 7. Acceso a la documentación del proyecto.

Se debe ejecutar la ruta:
```
http://localhost:{PORT}/docs
```


# 🧑‍💻 Tecnologías utilizadas

NestJS

MySQL

Docker