const express = require('express');
const exphbs = require('express-handlebars');
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
const datosRecibidos = [];

mongoose.connect("mongodb+srv://taru:taru@cluster0.rdmwzvj.mongodb.net/?retryWrites=true&w=majority", {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

// Iniciar el servidor
app.listen(port, () => {
  console.log('Servidor escuchando en el puerto 3000');
});
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

