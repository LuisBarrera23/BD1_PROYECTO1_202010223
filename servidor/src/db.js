const sql = require('mssql');

// Configuración de la conexión a la base de datos
const config = {
  server: 'ANGELBARRERA', // Cambia a la dirección de tu servidor SQL Server
  database: 'proyecto1', // Cambia al nombre de tu base de datos
  user: 'sa', // Cambia a tu nombre de usuario
  password: '47450380', // Cambia a tu contraseña
  options: {
    encrypt: true, // Establece a true si estás usando una conexión segura (por ejemplo, en Azure)
    trustServerCertificate: true,
  },
};

// Crear un objeto de pool de conexiones
const pool = new sql.ConnectionPool(config);

// Función para conectar a la base de datos
async function connectToDB() {
  try {
    await pool.connect();
    console.log('Conexión a la base de datos MS SQL Server abierta');
  } catch (error) {
    console.error('Error al conectar a la base de datos:  ' + error.message);
  }
}

// Función para ejecutar consultas SQL
async function executeQuery(sqlQuery) {
  try {
    const result = await pool.request().query(sqlQuery);
    return result.recordset;
  } catch (error) {
    throw error;
  }
}

async function closeDBConnection() {
  try {
    await pool.close();
    console.log('Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('Error al cerrar la conexión a la base de datos: ' + error.message);
  }
}

module.exports = {
  connectToDB,
  executeQuery,
  closeDBConnection,
};