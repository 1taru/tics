const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt'); // Importa bcrypt
const app = express();
const mongoose = require('mongoose');

// const socket = new WebSocket('ws://tu-esp32-ip:81');
const port = 3000;
var cors = require('cors');
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
const solicitudesArray = [];
const historialArray = [];
const personasArray = [];
mongoose.connect("mongodb+srv://taru:taru@cluster0.rdmwzvj.mongodb.net/?retryWrites=true&w=majority", {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

// Iniciar el servidor
app.listen(port, () => {
  console.log('Servidor escuchando en el puerto ' + port);
});
//personas
const personaSchema = new mongoose.Schema({
  rfid: String,
  nombre: String,
  Id_vivienda: String,
});
const Persona = mongoose.model('Persona', personaSchema);
// Definir el esquema de la colección
const solicitudSchema = new mongoose.Schema({
  rfid: String,
  nombre: String,
  sensor1: Number,
  sensor2: Number,
  status: Boolean,
});

// Crear el modelo
const Solicitud = mongoose.model('Solicitud', solicitudSchema);

const historialSchema = new mongoose.Schema({
  rfid: String,
  hora: { type: Date, default: Date.now },
  exito: Boolean,
});

historialSchema.pre('save', function (next) {
  // Obtener la fecha y hora actual en GMT-3
  this.hora = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD HH:mm:ss');
  next();
});
// Crear el modelo de historial
const Historial = mongoose.model('Historial', historialSchema);

function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return '';
}

/*  conexion esp32 --------------------
socket.onopen = function(event) {
  console.log('Conexión abierta:', event);
};

socket.onmessage = function(event) {
  console.log('Mensaje recibido:', event.data);

  // Almacena los datos en el array
  datosRecibidos.push(event.data);

  // Dispara un evento personalizado para notificar la actualización de datos
  const eventoActualizacion = new CustomEvent('actualizacionDatos', { detail: datosRecibidos });
  document.dispatchEvent(eventoActualizacion);
};
// Para enviar datos al ESP32 desde la página web
const data = 'Hola desde la página web';
socket.send(data);
*/ //  fin conedxion --------------------

function verificarToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    console.log('No posee cookie de autenticación');
    res.redirect('p1_v2');
    return;
  }

  jwt.verify(token, 'secreto', (err, decoded) => {
    if (err) {
      console.log('Cookie de autenticación inválida');
      res.redirect('p1_v2');
      return
    }

    req.user = decoded;
    req.session.emailSesion = req.user.email;
    next();
  });
}
app.use(express.static(path.join(__dirname, 'views')));

function jwt_decode(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
  return JSON.parse(jsonPayload);
}
app.use(session({
  secret: 'mi_secreto', // Cambia esto por una cadena secreta única para tu aplicación
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  // Renderiza la página de inicio (debe estar en la carpeta 'views')
  res.render('inicio');
});
app.get('/inicio', (req, res) => {
  // Renderiza la página de inicio (debe estar en la carpeta 'views')
  res.render('inicio');
});

app.get('/login', (req, res) => {
  res.clearCookie('token');
  res.render('login.html');
});
app.get('/detalles', (req, res) => {
  res.clearCookie('token');
  res.render('detalles.html');
});
app.get('/index', (req, res) => {
  
  res.clearCookie('token');
  res.render('index.html');
});
app.get('/lol', (req, res) => {
  
  // Obtén el elemento en el que deseas mostrar los resultados
  
  // Recorre el objeto contador y crea elementos para mostrar el conteo
  
  const tableRows = historialArray.map((entrada, index) => {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${entrada.rfid}</td>
        <td>${entrada.hora}</td>
        <td>${entrada.exito}</td>
      </tr>
    `;
  }).join('');
  const tableRows1 = personasArray.map((entrada, index) => {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${entrada.nombre}</td>
        <td>${entrada.rfid}</td>
        <td>${entrada.Id_vivienda}</td>
      </tr>
    `;
}).join('');
const alertasScript = solicitudesArray.map((solicitud, index) => {
  return `alert('Solicitud #${index + 1} - RFID: ${solicitud.rfid}, Hora: ${solicitud.hora}, Éxito RFID: ${solicitud.exito}')`;
}).join(';');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Sharp" rel="stylesheet">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="style.css">
    <title>Detalles</title>
    <script>
        // Ejecuta las alertas al cargar la página
        window.onload = function() {
          ${alertasScript};
        }

        // Función para agregar una nueva alerta
        function nuevaAlerta() {
          alert('¡Nueva alerta!');
        }
      </script>
    </head>
    <body>
      
      <div class="container">
      <aside>
      <div class="toggle">
          <div class="logo">
              
              <h2>Tilin<span class="danger">Safe</span></h2>
          </div>
          <div class="close" id="close-btn">
              <span class="material-icons-sharp">
                  close
              </span>
          </div>
      </div>

      <div class="sidebar">
          <a href="#">
              <span class="material-icons-sharp">
                  dashboard
              </span>
              <h3>Dashboard</h3>
          </a>
          <a href="#">
              <span class="material-icons-sharp">
                  person_outline
              </span>
              <h3>Users</h3>
          </a>
          <a href="#" class="active">
              <span class="material-icons-sharp">
                  insights
              </span>
              <h3>Analytics</h3>
          </a>
          <a href="#">
              <span class="material-icons-sharp">
                  report_gmailerrorred
              </span>
              <h3>Reports</h3>
          </a>
          <a href="#">
              <span class="material-icons-sharp">
                  settings
              </span>
              <h3>Settings</h3>
          </a>
          <a href="#">
              <span class="material-icons-sharp">
                  logout
              </span>
              <h3>Logout</h3>
          </a>
      </div>
      </aside>
      <main>
            <!-- New Users Section -->
            <style>
            .user-list table {
            border-spacing: 10px; /* Puedes ajustar este valor según tus necesidades */
            width: 100%; /* O ajusta el ancho de la tabla según tus necesidades */
            }

            .user-list table th, .user-list table td {
            padding: 8px; /* Puedes ajustar este valor según tus necesidades */
            border: 1px solid #ddd; /* Añade bordes para mayor claridad */
            text-align: left; /* Ajusta la alineación del texto según tus necesidades */
            }
            </style>
            <div class="new-users">
              <h2>Usuarios</h2>
              <div class="user-list">
              ${tableRows1}
  </div>
</div>

            <!-- End of New Users Section -->

            <!-- Recent Orders Table -->
            <div class="recent-orders">
                <h2>Historial De Solicitudes</h2>
                <table class="table-container">
                <thead>
                <tr>
                  <th>#</th>
                  <th>rfid</th>
                  <th>Hora Solicitud</th>
                  <th>Exito RFID</th>
                </tr>
                </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <button type="button" onclick="borrarSolicitudes()">Borrar Solicitudes</button>

            </div>
            <script>
        function borrarSolicitudes() {
          fetch('/borrar-solicitudes', { method: 'POST' })
            .then(() => window.location.reload());
        }
        function solicitud() {
          fetch('/solicitud', { method: 'POST' })
            .then(() => window.location.reload());
        }
      </script>
            <!-- End of Recent Orders -->

      </main>
        
      <!-- Right Section -->
      <div class="right-section">
          <div class="nav">
              <button id="menu-btn">
                  <span class="material-icons-sharp">
                      menu
                  </span>
              </button>
              <div class="dark-mode">
                  <span class="material-icons-sharp active">
                      light_mode
                  </span>
                  <span class="material-icons-sharp">
                      dark_mode
                  </span>
              </div>

              <div class="profile">
                  <div class="info">
                      <p>Bienvenida, <b>NombreU</b></p>
                      <small class="text-muted">Rango</small>
                  </div>
                  <div class="profile-photo">
                      <img src="images/profile-1.jpg">
                  </div>
              </div>

          </div>
        
          <div class="user-profile">
          <div class="logo">
              <img src="images/logo.png">
              <h2>Nombre-Vivienda</h2>
              <p>Direccion</p>  <!--Titular servicio o usuario-->
          </div>
      </div>
      
      
      <div class="container mt-5">
          <!-- Alerta de Inicio Exitoso -->
          <div id="alerta-exito" class="alert alert-success" style="display: none;">
            <strong>Éxito:</strong> Solicitud registrada con éxito.
          </div>
      
          <!-- Alerta de Acceso Denegado -->
          <div id="alerta-error" class="alert alert-danger" style="display: none;">
            <strong>Error:</strong> Acceso denegado. Por favor, inténtalo nuevamente.
          </div>
      
          <!-- Tu contenido HTML existente -->
      
          <!-- Incluir los scripts de Bootstrap y tu lógica adicional -->
          <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
          <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
      
          <script>
            // Agrega este script para mostrar las alertas según la respuesta del servidor
            function mostrarAlertaExito() {
              $('#alerta-exito').fadeIn().delay(3000).fadeOut();
            }
      
            function mostrarAlertaError() {
              $('#alerta-error').fadeIn().delay(3000).fadeOut();
            }
      
            // Ejemplo de cómo usar las funciones después de realizar la solicitud
            // Supongamos que recibes la respuesta del servidor en la variable 'respuesta'
            const respuesta = /* La respuesta del servidor */;
            
            if (respuesta.status === 'Éxito') {
              mostrarAlertaExito();
            } else {
              mostrarAlertaError();
            }
          </script>
        </div>
      

      

      

  </div>

</div>


</div>

<script src="orders.js"></script>
<script src="index.js"></script>
    </body>
    </html>
  `;

  res.send(html);
});

app.post('/crear-usuario', (req, res) => {
  try {
    const { nombre, rfid, Id_vivienda } = req.body;

    // Crear un nuevo usuario
    const nuevoUsuario = {
      nombre,
      rfid,
      Id_vivienda,
    };

    // Agregar el nuevo usuario al array
    personasArray.push(nuevoUsuario);
    console.log('Usuario creado:', nuevoUsuario);
    // Enviar una respuesta con el usuario creado
    res.status(201).json({ mensaje: 'Usuario creado con éxito', usuario: nuevoUsuario });
  } catch (error) {
    // Manejar errores
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/borrar-solicitudes', (req, res) => {
  solicitudesArray.length = 0;

  res.redirect('/');
});
app.get('/alertas', (req, res) => {
  const alertasScript = solicitudesArray.map((solicitud, index) => {
    return `alert('Solicitud #${index + 1} - RFID: ${solicitud.rfid}, Hora: ${solicitud.hora}, Éxito RFID: ${solicitud.exito}')`;
  }).join(';');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Alertas de Solicitudes</title>
    </head>
    <body>
      <h1>Alertas de Solicitudes</h1>
      <script>
        // Ejecuta las alertas al cargar la página
        window.onload = function() {
          ${alertasScript};
        }

        // Función para agregar una nueva alerta
        function nuevaAlerta() {
          alert('¡Nueva alerta!');
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});
// Ruta POST para el inicio de sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.render('login', { error: 'Faltan datos' });
    return;
  }

  const query = { email: email, password: password };

  User.findOne(query)
    .then((user) => {
      if (!user) {
        res.render('inicio', { error: 'Credenciales inválidas' });
        return;
      }

      const token = generarToken(user);

      // Establecer la cookie con el token
      res.cookie('token', token, { maxAge: 3600000 }); // 1 hora de duración

      // Almacenar el email de la sesión iniciada en la variable global
      req.session.emailSesion = email;
      console.log('Inicio de sesion exitoso');
      res.redirect(`logueado?token=${token}`); // Redirigir a la ruta de '/logueado'
    })
    .catch((error) => {
      console.error('Error al buscar usuario:', error);
      res.render('inicio', { error: 'Error interno del servidor' });
    });
});
//-- CON ESTO SE AGREGA UN RFID A LA BASE DE DATOS
      // Si no existe, registrar una nueva solicitud
      //const nuevaSolicitud = new Solicitud({ rfid, nombre, sensor1, sensor2,status: 'false'});
      app.post('/solicitud', async (req, res) => {
        try {
          const { rfid, nombre, sensor1, sensor2 } = req.body;
      
          // Verificar si los datos entrantes cumplen con el esquema de Solicitud
          const solicitudValidation = new Solicitud({ rfid, nombre, sensor1, sensor2 });
          const solicitudValidationErrors = solicitudValidation.validateSync();
      
          if (solicitudValidationErrors) {
            // Si hay errores en la validación, responder con un mensaje de error
            res.status(400).json({ error: 'Datos de solicitud inválidos' });
            return;
          }
      
          // Verificar si el RFID ya existe en la base de datos
          const solicitudExistente = await Persona.findOne({ rfid });
          console.log('Solicitud existente:', solicitudExistente);
      
          // Crear un objeto para la nueva solicitud
          const nuevaSolicitud = new Solicitud({ rfid, nombre, sensor1, sensor2 });
      
          // Agregar una entrada en el historial
          const nuevaEntradaHistorial = new Historial({ rfid, exito: false });
      
          if (solicitudExistente) {
            nuevaEntradaHistorial.exito = true;
            // Si existe, responder con un mensaje de éxito y los detalles de la solicitud existente
            res.json({
              status: 'Éxito',
              mensaje: 'Solicitud existente',
              solicitud: solicitudExistente,
            });
          } else {
            // Marcar la entrada del historial como fallida
            nuevaEntradaHistorial.exito = false;
      
            // Responder con un mensaje de éxito y los detalles de la solicitud registrada
            res.json({
              status: 'fallo',
              mensaje: 'Solicitud registrada con éxito',
              solicitud: nuevaSolicitud,
            });
          }
      
          // Guardar la entrada en el historial
          await nuevaEntradaHistorial.save();
          // Actualizar el array de historial
          historialArray.push(nuevaEntradaHistorial);
      
        } catch (error) {
          // Manejar errores
          console.error('Error al procesar la solicitud:', error);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
      });
      
      

// Ruta para registrar un nuevo usuario
app.post('/registrar', async (req, res) => {
  const { nombre_usuario, contrasena } = req.body;

  try {
    // Hashear la contraseña antes de almacenarla
    const hashedContrasena = await bcrypt.hash(contrasena, 10); // 10 es el costo de hashing

    // Consulta SQL para insertar el usuario
    const query = `
      INSERT INTO usuarios (nombre_usuario, contrasena)
      VALUES ($1, $2)
      RETURNING id;
    `;

    // Ejecutar la consulta
    const result = await client.query(query, [nombre_usuario, hashedContrasena]);

    // Obtener el ID del usuario insertado
    const userId = result.rows[0].id;

    console.log(`Usuario insertado con ID: ${userId}`);

    // Puedes redirigir o enviar una respuesta JSON de éxito aquí
    res.status(200).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error('Error al insertar el usuario:', error);

    // Maneja el error y envía una respuesta de error
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});
app.get('/Dviviendas', (req, res) => {
  // Renderiza la página de inicio (debe estar en la carpeta 'views')
  res.render('Dviviendas');
});
