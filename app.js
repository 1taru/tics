const express = require('express');
const exphbs = require('express-handlebars');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;
var cors = require('cors')
app.use(cors())
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.listen(port, () => {
    console.log(port);
  });

mongoose.connect('mongodb+srv://nicolasfernandez3:sDIgB1T8esNDwMAm@dweb.gp4z7sq.mongodb.net/tarea3', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
console.log('Conexión exitosa a la base de datos');
})
.catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
});


app.get('/', (req, res) => {

    res.render('/views/inicio.html');
    
    });