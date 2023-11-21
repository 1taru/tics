const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
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
const vivienda= 123;
mongoose.connect("mongodb+srv://taru:taru@cluster0.rdmwzvj.mongodb.net/?retryWrites=true&w=majority", {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

// Iniciar el servidor
app.listen(port, () => {
  console.log('Servidor escuchando en el puerto 3000');
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
  console.log('Solicitudes Array:', solicitudesArray);
  const tableRows = solicitudesArray.map((solicitud, index) => {
    return `
      <tr>
      <p> HOLA </p>
        <td>${index + 1}</td>
        <td>${solicitud.rfid}</td>
        <td>${solicitud.hora}</td>
        <td>${solicitud.exito}</td>
        <td>${solicitud.status}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Página de Solicitudes</title>
      <link rel="stylesheet" type="text/css" href="/static/styles.css">
    </head>
    <body>
      <h1>Solicitudes</h1>
      <div class="flex-container">
        <table class="table-container">
          <thead>
            <tr>
              <th>#</th>
              <th>ID sensor</th>
              <th>Hora Solicitud</th>
              <th>Exito RFID/th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <button type="button" onclick="borrarSolicitudes()">Borrar Solicitudes</button>
      </div>
      <script>
        function borrarSolicitudes() {
          fetch('/borrar-solicitudes', { method: 'POST' })
            .then(() => window.location.reload());
        }
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

app.post('/borrar-solicitudes', (req, res) => {
  solicitudesArray.length = 0;

  res.redirect('/');
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
          const solicitudExistente = await Solicitud.findOne({ rfid });
      
          // Crear un objeto para la nueva solicitud
          const nuevaSolicitud = new Solicitud({ rfid, nombre, sensor1, sensor2 });
      
          // Agregar una entrada en el historial
          const nuevaEntradaHistorial = new Historial({ rfid, exito: false });
      
          if (solicitudExistente) {
            // Si existe, responder con un mensaje de éxito y los detalles de la solicitud existente
            res.json({
              status: 'Éxito',
              mensaje: 'Solicitud existente',
              solicitud: solicitudExistente,
            });
          } else {
            // Si no existe, registrar la nueva solicitud
            await nuevaSolicitud.save();
      
            // Actualizar solicitudesArray con la nueva solicitud
            solicitudesArray.push(nuevaSolicitud);
      
            // Marcar la entrada del historial como exitosa
            nuevaEntradaHistorial.exito = true;
      
            // Responder con un mensaje de éxito y los detalles de la solicitud registrada
            res.json({
              status: 'Éxito',
              mensaje: 'Solicitud registrada con éxito',
              solicitud: nuevaSolicitud,
            });
          }
      
          // Guardar la entrada en el historial
          await nuevaEntradaHistorial.save();
          // Actualizar el array de historial
          solicitudesArray.push(nuevaEntradaHistorial);
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
