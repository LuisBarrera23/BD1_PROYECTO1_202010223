const express = require("express");
const { connectToDB, executeQuery, closeDBConnection } = require("./db.js");
const cors = require("cors");
const fs = require("fs");
const path = require('path');
const filePath = path.join(__dirname, '../csv/ciudadanos.csv');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("Laboratorio Sistemas de Bases de datos 1");
});

app.get("/all", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
      CREATE TABLE ##temp_csv_data (
        dpi VARCHAR(13),
        nombre VARCHAR(50),
        apellido VARCHAR(50),
        edad INT,
        direccion VARCHAR(100),
        telefono VARCHAR(10),
        genero VARCHAR(1)
      );
    `;
    await executeQuery(createTableQuery);

    const datosCiudadanos = fs.readFileSync(filePath, 'utf-8');
    const lines = datosCiudadanos.split('\n');

    let insertValues = [];
    let iterador = 1;
    for (let i = 1; i < lines.length - 1; i++) {
      const fields = lines[i].split(',');
      if (fields.length > 0) {
        const dpi = fields[0];
        const nombre = fields[1].replace("'", "");
        const apellido = fields[2].replace("'", "");
        const direccion = fields[3];
        const telefono = fields[4];
        const edad = fields[5];
        const genero = fields[6];

        // Agregar los valores a insertValues
        insertValues.push(`('${dpi}', '${nombre}', '${apellido}', ${edad}, '${direccion}', '${telefono}', '${genero}')`);
        if (iterador > 990) {
          const insertQuery = `
          INSERT INTO ##temp_csv_data (dpi, nombre, apellido, edad, direccion, telefono, genero)
          VALUES ${insertValues.join(', ')};`;

          await executeQuery(insertQuery);
          iterador = 1;
          insertValues = [];
        }


        iterador++;
      }
    }
    if (insertValues.length > 0) {
      const insertQuery = `
          INSERT INTO ##temp_csv_data (dpi, nombre, apellido, edad, direccion, telefono, genero)
          VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }

    await closeDBConnection()
    res.status(200).json({ message: "Todo bien" });
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection()
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});


app.listen(5000, () => console.log("Server on port 5000"));
