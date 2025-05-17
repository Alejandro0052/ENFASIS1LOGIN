// server.js
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    //TRATA DE USAR UN PATRON, PARA COSAS SENCILLAS ARQUITECTURA POR CAPAS Y COSAS ASI  (TE OBLIGAN QUE CADA RESPONSABILIDAD VAYA SEPARADA)
    // HAY UN PATRON  QUE SEPARA TODOS LOS ACCESOS DE LA BD  (REPOSITORY), PUEDES INTENTAR IMPLEMENTARLO PAR QUE EN ESTE ARCHIVO PRINCIPAL SOLO LLAMES MODULOS
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
