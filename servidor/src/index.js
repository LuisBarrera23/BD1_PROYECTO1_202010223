const express = require("express");
const { connectToDB, executeQuery, closeDBConnection } = require("./db.js");
const cors = require("cors");
const fs = require("fs");
const path = require('path');
const filePath1 = path.join(__dirname, '../csv/ciudadanos.csv');
const filePath2 = path.join(__dirname, '../csv/votaciones.csv');
const filePath3 = path.join(__dirname, '../csv/mesas.csv');
const filePath4 = path.join(__dirname, '../csv/departamentos.csv');
const filePath5 = path.join(__dirname, '../csv/candidatos.csv');
const filePath6 = path.join(__dirname, '../csv/cargos.csv');
const filePath7 = path.join(__dirname, '../csv/partidos.csv');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("Laboratorio Sistemas de Bases de datos 1");
});

app.get("/cargartabtemp", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
      CREATE TABLE ##temp_ciudadano (
        dpi VARCHAR(13),
        nombre VARCHAR(50),
        apellido VARCHAR(50),
        edad INT,
        direccion VARCHAR(100),
        telefono VARCHAR(10),
        genero VARCHAR(1)
      );

      CREATE TABLE ##temp_voto (
        id_voto INT,
        id_mesa INT,
        dpi VARCHAR(13),
        fecha_hora DATETIME
      );

      CREATE TABLE ##temp_detalle_voto (
        id_detalle INT IDENTITY(1,1) PRIMARY KEY,
        id_voto INT,
        id_candidato INT
      );

      CREATE TABLE ##temp_mesa (
        id_mesa INT,
        id_departamento INT
      );

      CREATE TABLE ##temp_departamento (
        id_departamento INT,
        nombre VARCHAR(50)
      );

      CREATE TABLE ##temp_candidato (
        id_candidato INT,
        nombre VARCHAR(50),
        fecha_nacimiento DATE,
        id_cargo INT,
        id_partido INT
      );

      CREATE TABLE ##temp_cargo (
        id_cargo INT,
        cargo VARCHAR(80)
      );

      CREATE TABLE ##temp_partido (
        id_partido INT,
        nombre VARCHAR(200),
        siglas VARCHAR(10),
        fundacion DATE
      );
    `;
    await executeQuery(createTableQuery);

    const datosCiudadanos = fs.readFileSync(filePath1, 'utf-8');
    let lines = datosCiudadanos.split('\n');
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
          INSERT INTO ##temp_ciudadano (dpi, nombre, apellido, edad, direccion, telefono, genero)
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
          INSERT INTO ##temp_ciudadano (dpi, nombre, apellido, edad, direccion, telefono, genero)
          VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }



    const datosVotos = fs.readFileSync(filePath2, 'utf-8');
    lines = datosVotos.split('\n');
    insertValues = [];
    insertValues2 = [];
    let anterior = 0;
    iterador = 1;
    for (let i = 1; i < lines.length - 1; i++) {
      const fields = lines[i].split(',');
      if (fields.length > 0) {
        const id_voto = fields[0];
        const id_candidato = fields[1];
        const dpi = fields[2];
        const id_mesa = fields[3];
        const fecha_hora = fields[4];
        const parts = fecha_hora.split(' ');
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:00`;

        if (i === 1 || anterior != id_voto) {
          insertValues.push(`('${id_voto}', '${id_mesa}', '${dpi}', '${formattedDateTime}')`);
        }
        insertValues2.push(`('${id_voto}', '${id_candidato}')`);
        if (iterador > 990) {
          let insertQuery = `
        INSERT INTO ##temp_voto (id_voto, id_mesa, dpi, fecha_hora)
        VALUES ${insertValues.join(', ')};`;
          await executeQuery(insertQuery);
          insertQuery = `
        INSERT INTO ##temp_detalle_voto (id_voto, id_candidato)
        VALUES ${insertValues2.join(', ')};`;
          await executeQuery(insertQuery);
          iterador = 1;
          insertValues = [];
          insertValues2 = [];
        }

        anterior = id_voto;
        iterador++;
      }
    }
    if (insertValues.length > 0) {
      let insertQuery = `
    INSERT INTO ##temp_voto (id_voto, id_mesa, dpi, fecha_hora)
    VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }
    if (insertValues2.length > 0) {
      let insertQuery = `
    INSERT INTO ##temp_detalle_voto (id_voto, id_candidato)
    VALUES ${insertValues2.join(', ')};`;
      await executeQuery(insertQuery);
    }



    const datosMesas = fs.readFileSync(filePath3, 'utf-8');
    lines = datosMesas.split('\n');
    insertValues = [];
    iterador = 1;
    for (let i = 1; i < lines.length - 1; i++) {
      const fields = lines[i].split(',');
      if (fields.length > 0) {
        const id_mesa = parseInt(fields[0]);
        const id_departamento = parseInt(fields[1]);

        // Agregar los valores a insertValues
        insertValues.push(`('${id_mesa}', '${id_departamento}')`);
        if (iterador > 990) {
          const insertQuery = `
          INSERT INTO ##temp_mesa (id_mesa, id_departamento)
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
          INSERT INTO ##temp_mesa (id_mesa, id_departamento)
          VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }


    const datosDepartamento = fs.readFileSync(filePath4, 'utf-8');
    lines = datosDepartamento.split('\n');
    insertValues = [];
    iterador = 1;
    for (let i = 1; i < lines.length - 1; i++) {
      const fields = lines[i].split(',');
      if (fields.length > 0) {
        const id_departamento = parseInt(fields[0]);
        const nombre = fields[1];

        // Agregar los valores a insertValues
        insertValues.push(`('${id_departamento}', '${nombre}')`);
        if (iterador > 990) {
          const insertQuery = `
          INSERT INTO ##temp_departamento (id_departamento, nombre)
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
          INSERT INTO ##temp_departamento (id_departamento, nombre)
          VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }



    const datosCandidato = fs.readFileSync(filePath5, 'utf-8');
    lines = datosCandidato.split('\n');
    insertValues = [];
    iterador = 1;
    for (let i = 1; i < lines.length - 1; i++) {
      const fields = lines[i].split(',');
      if (fields.length > 0) {
        const id_candidato = parseInt(fields[0]);
        const nombre = fields[1].replace("'", "");;
        const fecha = fields[2];
        const [day, month, year] = fecha.split('/');
        const formattedDateTime = `${year}-${month}-${day}`;
        const id_cargo = parseInt(fields[4]);
        const id_partido = parseInt(fields[3]);

        // Agregar los valores a insertValues
        insertValues.push(`('${id_candidato}', '${nombre}', '${formattedDateTime}', '${id_cargo}', '${id_partido}')`);
        if (iterador > 990) {
          const insertQuery = `
          INSERT INTO ##temp_candidato (id_candidato, nombre, fecha_nacimiento, id_cargo, id_partido)
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
          INSERT INTO ##temp_candidato (id_candidato, nombre, fecha_nacimiento, id_cargo, id_partido)
          VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }


    const datosCargo = fs.readFileSync(filePath6, 'utf-8');
    lines = datosCargo.split('\n');
    insertValues = [];
    iterador = 1;
    for (let i = 1; i < lines.length - 1; i++) {
      const fields = lines[i].split(',');
      if (fields.length > 0) {
        const id_cargo = parseInt(fields[0]);
        const cargo = fields[1];

        // Agregar los valores a insertValues
        insertValues.push(`('${id_cargo}', '${cargo}')`);
        if (iterador > 990) {
          const insertQuery = `
          INSERT INTO ##temp_cargo (id_cargo, cargo)
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
          INSERT INTO ##temp_cargo (id_cargo, cargo)
          VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }


    const datosPartido = fs.readFileSync(filePath7, 'utf-8');
    lines = datosPartido.split('\n');
    insertValues = [];
    iterador = 1;
    const regex = /("[^"]*"|[^,]+)(,|$)/g;

    for (let i = 1; i < lines.length - 1; i++) {
      const fields = [];
      let match;
      while ((match = regex.exec(lines[i]))) {
        fields.push(match[1].replace(/"/g, '').trim());
      }

      if (fields.length > 0) {
        const id_partido = parseInt(fields[0]);
        const nombre = fields[1].replace("'", "");
        const siglas = fields[2].replace("'", "");
        const fundacion = fields[3].replace("\r", "");
        const [day, month, year] = fundacion.split('/');
        const formattedDateTime = `${year}-${month}-${day}`;

        // Agregar los valores a insertValues
        insertValues.push(`('${id_partido}', '${nombre}', '${siglas}', '${formattedDateTime}')`);
        if (iterador > 990) {
          const insertQuery = `
      INSERT INTO ##temp_partido (id_partido, nombre, siglas, fundacion)
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
      INSERT INTO ##temp_partido (id_partido, nombre, siglas, fundacion)
      VALUES ${insertValues.join(', ')};`;
      await executeQuery(insertQuery);
    }



    const transferQueries = [
      // Trasladar los datos de la tabla departamento
      `INSERT INTO departamento
      SELECT * FROM ##temp_departamento;`,

      // Trasladar los datos de la tabla cargo
      `INSERT INTO cargo
      SELECT * FROM ##temp_cargo;`,

      // Trasladar los datos de la tabla partido
      `INSERT INTO partido
      SELECT * FROM ##temp_partido;`,

      // Trasladar los datos de la tabla ciudadano
      `INSERT INTO ciudadano
      SELECT * FROM ##temp_ciudadano;`,

      // Trasladar los datos de la tabla mesa
      `INSERT INTO mesa
      SELECT * FROM ##temp_mesa;`,

      // Trasladar los datos de la tabla candidato
      `INSERT INTO candidato
      SELECT * FROM ##temp_candidato;`,

      // Trasladar los datos de la tabla voto
      `INSERT INTO voto
      SELECT * FROM ##temp_voto;`,

      // Trasladar los datos de la tabla detalle_voto
      `INSERT INTO detalle_voto(id_detalle, id_voto, id_candidato)
      SELECT id_detalle, id_voto, id_candidato FROM ##temp_detalle_voto;`
    ];

    for (const query of transferQueries) {
      await executeQuery(query);
    }


    await closeDBConnection()
    res.status(200).json({ message: "Todo bien" });
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection()
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});


app.get("/crearmodelo", async function (req, res) {
  await connectToDB();
  try {
    const createTableQueries = [
      // Crear la tabla departamento con clave primaria
      `CREATE TABLE departamento (
        id_departamento INT PRIMARY KEY,
        nombre VARCHAR(50)
      );`,

      // Crear la tabla cargo con clave primaria
      `CREATE TABLE cargo (
        id_cargo INT PRIMARY KEY,
        cargo VARCHAR(80)
      );`,

      // Crear la tabla partido con clave primaria
      `CREATE TABLE partido (
        id_partido INT PRIMARY KEY,
        nombre VARCHAR(200),
        siglas VARCHAR(10),
        fundacion DATE
      );`,

      // Crear la tabla ciudadano con clave primaria
      `CREATE TABLE ciudadano (
        dpi VARCHAR(13) PRIMARY KEY,
        nombre VARCHAR(50),
        apellido VARCHAR(50),
        edad INT,
        direccion VARCHAR(100),
        telefono VARCHAR(10),
        genero VARCHAR(1)
      );`,

      // Crear la tabla mesa con clave primaria y clave foránea
      `CREATE TABLE mesa (
        id_mesa INT PRIMARY KEY,
        id_departamento INT,
        FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
      );`,

      // Crear la tabla candidato con clave primaria y claves foráneas
      `CREATE TABLE candidato (
        id_candidato INT PRIMARY KEY,
        nombre VARCHAR(50),
        fecha_nacimiento DATE,
        id_cargo INT,
        id_partido INT,
        FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo),
        FOREIGN KEY (id_partido) REFERENCES partido(id_partido)
      );`,

      // Crear la tabla voto con clave primaria y claves foráneas
      `CREATE TABLE voto (
        id_voto INT PRIMARY KEY,
        id_mesa INT,
        dpi VARCHAR(13),
        fecha_hora DATETIME,
        FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa),
        FOREIGN KEY (dpi) REFERENCES ciudadano(dpi)
      );`,

      // Crear la tabla detalle_voto con clave primaria y claves foráneas
      `CREATE TABLE detalle_voto (
        id_detalle INT PRIMARY KEY,
        id_voto INT,
        id_candidato INT,
        FOREIGN KEY (id_voto) REFERENCES voto(id_voto),
        FOREIGN KEY (id_candidato) REFERENCES candidato(id_candidato)
      );`
    ];


    for (const query of createTableQueries) {
      await executeQuery(query);
    }

    await closeDBConnection();
    res.status(200).json({ message: "Modelo de base de datos creado con éxito." });
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error al crear el modelo de base de datos." });
  }
});

app.get("/eliminarmodelo", async function (req, res) {
  await connectToDB();
  try {
    const dropTableQueries = [
      // Eliminar la tabla detalle_voto
      `DROP TABLE IF EXISTS detalle_voto;`,

      // Eliminar la tabla voto
      `DROP TABLE IF EXISTS voto;`,

      // Eliminar la tabla candidato
      `DROP TABLE IF EXISTS candidato;`,

      // Eliminar la tabla mesa
      `DROP TABLE IF EXISTS mesa;`,

      // Eliminar la tabla ciudadano
      `DROP TABLE IF EXISTS ciudadano;`,

      // Eliminar la tabla partido
      `DROP TABLE IF EXISTS partido;`,

      // Eliminar la tabla cargo
      `DROP TABLE IF EXISTS cargo;`,

      // Eliminar la tabla departamento
      `DROP TABLE IF EXISTS departamento;`
    ];

    for (const query of dropTableQueries) {
      await executeQuery(query);
    }

    await closeDBConnection();
    res.status(200).json({ message: "Modelo de base de datos eliminado con éxito." });
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error al eliminar el modelo de base de datos." });
  }
});

app.get("/consulta1", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT
    presidente.nombre AS 'nombre presidente',
    vicepresidente.nombre AS 'nombre vicepresidente',
    partido.nombre AS partido
    FROM
        candidato AS presidente
    INNER JOIN
        candidato AS vicepresidente
    ON
        presidente.id_partido = vicepresidente.id_partido
        AND presidente.id_cargo = (
            SELECT id_cargo
            FROM cargo
            WHERE cargo = 'presidente\r'
        )
        AND vicepresidente.id_cargo = (
            SELECT id_cargo
            FROM cargo
            WHERE cargo = 'vicepresidente\r'
        )
    INNER JOIN
        partido
    ON
        presidente.id_partido = partido.id_partido;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 1." });
  }
});

app.get("/consulta2", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT partido.nombre AS nombre_partido, COUNT(candidato.id_candidato) AS num_candidatos_diputados
    FROM partido
    LEFT JOIN candidato ON partido.id_partido = candidato.id_partido
    WHERE candidato.id_cargo IN (
      SELECT id_cargo
      FROM cargo
      WHERE TRIM(cargo) IN ('diputado congreso lista nacional\r', 'diputado congreso distrito electoral\r', 'diputado parlamento centroamericano\r'))
    GROUP BY partido.id_partido, partido.nombre;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 2." });
  }
});

app.get("/consulta3", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT partido.nombre AS nombre_partido, candidato.nombre AS nombre_candidato_alcalde
    FROM partido
    INNER JOIN candidato ON partido.id_partido = candidato.id_partido
    WHERE candidato.id_cargo = (
      SELECT id_cargo
      FROM cargo
      WHERE cargo = 'alcalde\r'
    );

    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 3." });
  }
});


app.get("/consulta4", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT partido.nombre AS nombre_partido, COUNT(candidato.id_candidato) AS num_candidatos
    FROM partido
    LEFT JOIN candidato ON partido.id_partido = candidato.id_partido
    WHERE candidato.id_cargo IN (
      SELECT id_cargo
      FROM cargo
      WHERE TRIM(cargo) IN ('diputado congreso lista nacional\r', 'diputado congreso distrito electoral\r', 'diputado parlamento centroamericano\r', 'presidente\r', 'vicepresidente\r', 'alcalde\r'))
    GROUP BY partido.id_partido, partido.nombre;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 4." });
  }
});


app.get("/consulta5", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT TRIM(BOTH '\r' FROM departamento.nombre) AS nombre_departamento, COUNT(voto.id_voto) AS cantidad_votaciones
    FROM departamento
    LEFT JOIN mesa ON departamento.id_departamento = mesa.id_departamento
    LEFT JOIN voto ON mesa.id_mesa = voto.id_mesa
    GROUP BY departamento.nombre
    ORDER BY departamento.nombre;

    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 5." });
  }
});

app.get("/consulta6", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT COUNT(DISTINCT id_voto) AS cantidad_votos_nulos
    FROM detalle_voto
    WHERE id_candidato = -1;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 6." });
  }
});


app.get("/consulta7", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT TOP 10 edad, COUNT(voto.id_voto) AS cantidad_votos
    FROM ciudadano
    INNER JOIN voto ON ciudadano.dpi = voto.dpi
    GROUP BY edad
    ORDER BY COUNT(voto.id_voto) DESC, edad DESC;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 7." });
  }
});

app.get("/consulta8", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT TOP 10 p.nombre AS nombre_presidente, v.nombre AS nombre_vicepresidente, COUNT(*) as votos
    FROM candidato p
    JOIN candidato v ON p.id_partido = v.id_partido AND v.id_cargo = (
      SELECT id_cargo
      FROM cargo
      WHERE cargo = 'vicepresidente\r'
    )
    JOIN detalle_voto dv ON p.id_candidato = dv.id_candidato
    WHERE p.id_cargo = (
      SELECT id_cargo
      FROM cargo
      WHERE cargo = 'presidente\r'
    )
    GROUP BY p.nombre, v.nombre
    ORDER BY votos DESC;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 8." });
  }
});

app.get("/consulta9", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT TOP 5
    m.id_mesa AS No_Mesa,
    TRIM(BOTH '\r' FROM d.nombre) AS Departamento,
    COUNT(v.id_voto) AS Cantidad_Votos
    FROM mesa AS m
    INNER JOIN departamento AS d ON m.id_departamento = d.id_departamento
    LEFT JOIN voto AS v ON m.id_mesa = v.id_mesa
    GROUP BY m.id_mesa, d.nombre
    ORDER BY Cantidad_Votos DESC;


    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 9." });
  }
});


app.get("/consulta10", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT TOP 5
    CONVERT(VARCHAR(5), v.fecha_hora, 108) AS Hora_Minutos,
    COUNT(*) AS Cantidad_Votos
    FROM voto AS v
    GROUP BY CONVERT(VARCHAR(5), v.fecha_hora, 108)
    ORDER BY Cantidad_Votos DESC, Hora_Minutos;

    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 10." });
  }
});


app.get("/consulta11", async function (req, res) {
  await connectToDB();
  try {
    const createTableQuery = `
    SELECT genero, COUNT(voto.id_voto) AS cantidad_votos
    FROM ciudadano
    INNER JOIN voto ON ciudadano.dpi = voto.dpi
    GROUP BY genero;
    `;
    const result = await executeQuery(createTableQuery);

    await closeDBConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    await closeDBConnection();
    res.status(500).json({ message: "Error en consulta 11." });
  }
});

app.listen(5000, () => console.log("Server on port 5000"));
