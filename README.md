Seocraft Network HTTP API GammaBackend
===================

Este repositorio contiene el código esencial para que todos los servicios que están involucrados en Seocraft Network funcionen, como el [PluginsReactor](https://gitlab.com/SeocraftNetwork/PluginsReactor) o el [SeocraftWebsite](https://gitlab.com/SeocraftNetwork/SeocraftWebsite).

# Licencia

Cabe destacarse que al ingresar a la división de desarrollo se ha firmado obligatoriamente un contrato de confidencialidad, por lo que cualquier información contenida en este repositorio, no podrá ser divulgada a terceros. Sientente totalmente libre de bifurcar este repositorio, y crear snippets privadamente, o en este grupo. Cualquier intento de divulgación a personas externas a SEOCRAFT NETWORK S.A.S, será penalizada legalmente de acuerdo a la [Decisión 486 del año 2000 - Artículo 257](http://www.wipo.int/edocs/lexdocs/laws/es/can/can012es.pdf).

# Arquitectura

Este repositorio contiene los siguientes elementos:

* Los modelos de la base de datos utilizados en todas las partes de la network. (Modelo, vista, controlador)
* Una API HTTP interna basada en JavaScript (Node.js), utilizada para relizar tareas esenciales de fondo del servidor.
* Diferentes servicios utilizados como extensiones de aplicaciones externas para ser sincronizados con la base de datos.

## Instalar la app del backend

Instala los siguientes siguientes servicios y ajustalos en los puertos indicados en la configuración:
* [Node.js 8.11.3](https://nodejs.org/es/)
* [MongoDB](http://www.mongodb.org/)
* [Redis](http://redis_service.io/)

Asegurate de que todos los paquetes estén instalados correctamente: `npm install`

(O también utiliza el container Docker que lo hará automáticamente por tí, usando `docker-compose up --build`)

## Instala la base de datos

Inicia MongoDB y Redis con sus ajustes por defecto. Luego, ejecuta los siguientes comandos shell en la carpeta del repositorio:

    node db:setup
    node db:create_indexes
    
Esto deberá crear una base de datos llamada `seocraft_network` con varias colecciones, generalmente una para cada modelo.

El repositorio [Seocraft-Data](https://gitlab.com/SeocraftNetwork/Seocraft-Data) contiene configuración estática para la base de datos.
Esto incluye objetos como grupos de permisos, clusters, modos de juego y demás.
Clonalo en algún lado, y utiliza el comando `node db:load_models` para importar toda la configuración de los archivos JSON a MongoDB. *Para uso fuera de Docker, se deben insertar los datos manualmente.*

## Ajusta la configuración del backend

La configuración del backend es bastante básica, solo debes especificar lo siguiente en el archivo `config.js`:

    config.base.url = "0.0.0.0"  # URL en la que el backend recibirá las requests y alojará las bases de datos
    config.base.port = "3800" # Puerto de la URL
    config.base.mongo_uri = "mongodb://mongo:27017/seocraft_network" # URI de MongoDB integrado en Docker

## Inicia la app del backend

Ejecuta el comando `npm start`, luego de esto podrás acceder normalmente a la HTTP API con la IP y el puerto que indicaste en `config.js`. Por defecto sería `http://localhost:3800`, aunque aquí no hay mucho que ver, a menos de que empieces a usar algun repositorio que dependa de esta.

## Configurando el cluster

El acceso a la API está dividido en [JSON Web Tokens](https://gitlab.com/SeocraftNetwork/Seocraft-API/blob/master/middlewares/authentication.js) para autenticación de usuarios en el sitio web y con [Cluster Keys](https://gitlab.com/SeocraftNetwork/Seocraft-API/blob/master/middlewares/cluster.js) para la autenticación de servidores en de [PluginsReactor](https://gitlab.com/SeocraftNetwork/PluginsReactor). Al generar la configuración estática, también se generó un [Cluster](https://gitlab.com/SeocraftNetwork/Seocraft-API/blob/master/models/minecraft/cluster.js) de prueba. Puedes acceder con la URL y el puerto configurados para MongoDB en tu imágen Docker, usando SSH, o un programa externo como [RoboMongo](https://robomongo.org/) a la colección `Cluster` de la base de datos `seocraft_network`, y copiar el campo `_id` del documento generado, y realizar la siguiente configuración en los plugins de `API Bukkit` y `API Bungee`.

Asumiendo que ya has seguido todos los pasos para configurar correctamente un servidor de BungeeCord con los plugins dentro del repositorio de [PluginsReactor](https://gitlab.com/SeocraftNetwork/PluginsReactor) y creadas las plantillas correspondientes para el [Sistema Cloud](https://github.com/Dytanic/CloudNet), deberás realizar la siguiente configuración:

    api:
      cluster: 0123456789 # Cluster Id
      type: BUNGEE
    redis_service:
      ip: 127.0.0.1 # Localhost IP
      port: 6379


*También debes cambiar la propiedad `plugin.http` del archivo `pom.xml` de [Commons core](https://gitlab.com/SeocraftNetwork/PluginsReactor/tree/master/Commons/core).*

## Creando los servidores de autenticación

Ya que Seocraft Network es un servidor que presta sus servicios para usuarios no premium, deberá tener un grupo llamado authentication (Puedes cambiar el nombre editando el código de [Commoms](https://gitlab.com/SeocraftNetwork/PluginsReactor/tree/master/Commons)). Deberás instalar los [plugins](https://gitlab.com/SeocraftNetwork/PluginsReactor/) correspondientes en la template que crees, y conectarlos con la misma configuración en la `API`.

**Los servidores de LOBBY se crearán de la misma manera, siguiendo la configuración correspondiente para cada plugin.**

## Obteniendo el usuario administrador

Al importar los datos estáticos a la base de datos, podrás iniciar sesión con el usuario `administrator`y la contraseña `administrator` usando un programa como [Postman](https://www.getpostman.com/) para enviar peticiones HTTP al servidor usando la ruta `/user/login-website`, ingresando el siguiente JSON:

    {
        "user": "administrator",
        "password": "administrator",
        "gettoken": true
    }

Esto te dará una token, la cual podrás usar como una cabecera de `Authentication`, en la cual podrás tener acceso al resto de las rutas HTTP para usuario, desde aquí podrás asignarte el rango `CEO` o modificarlo a tu gusto, en su defecto puedes configurar el [SeocraftWebsite](https://gitlab.com/SeocraftNetwork/SeocraftWebsite) para poder facilitar las cosas.

*(Recuerda que algunas funciones solo están disponibles para uso de los Clusters, y deberás usar en la cabecera `Authentication` una ID de Cluster en vez de la `Token` del usuario).*

## Funciones incluidas en la API

* `package.json` - Base del proyecto, indica las dependencias usadas y los symlinks usados para reducir el código.
* `index.js` - Punto de entrada de la API, esta inicia la base de datos y redirecciona a `app.js`.
* `config.js` - Configuración base para la base de datos, puertos y cliente discord.
* `Dockerfile`y `docker-compose.yml` - Imagenes docker para facilitar el transporte de app por medio de containers.
* `/services` - Carpeta con todos los servicios que no tienen una organización MVC exacta, o que son usados como utilidades muy puntuales.
* `/models` - Todos los modelos de clase utilizados para el servidor, basados en [Mongoose](https://mongoosejs.com/).
* `/controllers` - Todos los controladores de cada uno de los modelos, en cada controlador hay una función especifica para los diferentes modelos. *Funciones de otros controladores pueden ser utilizadas para optimizar el código.*
* `/middlewares` - Los middlewares son utilizados para autenticaciones, clusters, permissions, y cualquier proceso que deba ejecutar una ruta antes de dar paso a una función del controlador.
* `/routes` - Cada modelo tiene su ruta, con distintas funciones que se utilizan en todos los servicios.


## Convenciones de programación

✔ = Cosas que tenemos en cuenta a la hora de programar.

✘ = Cosas en las que posiblemente nos equivocamos.

# Estilo

* ✔ Generalmente seguimos los estándares de programación de ECMAScript 6.
* ✔ No tabs; Usamos solo 2 espacios.
* ✔ No tenemos espacios en blanco al final.
* ✔ No hay límite de 80 columnas o líneas oblicuas 'extrañas'.
* ✘ Manejo complicado de los async/await.

# Modelos

* ✔ Los modelos son el esquema canónico de la base de datos. Cualquier aplicación, herramienta o addon que se quiera comunicar con la base de datos lo debe hacer a través de ellos.
* ✔ Los modelos pueden ser usados a conveniencia, no limitandose a un solo controlador.
* ✔ Hay un buen manejo de enums en los modelos, para prevenir datos incorrectos.
* ✘ Algunos modelos están manejados con promesas automáticamente.

# Controladores / Rutas

* ✔ El nivel de abstracción de una función es buena, por lo que el usuario final solo debe ejecutar una acción para obtener un resultado.
* ✔ Los controladores dependen entre si, por lo que no se necesitará escribir el mismo código en otro controlador.
* ✔ Las acciones que se ejecutarán por parte de servidor/usuario, están protegidas por tokens, que previenen el uso indebido de estas.
* ✘ Las funciones que manejan promesas no tienen un buen manejo del catch.
* ✘ Hay algunas dependencias internas que aún no se han agregado al índice del package.json



