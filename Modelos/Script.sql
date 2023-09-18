
-- tabla temporal ciudadano
CREATE TABLE ##temp_ciudadano (
dpi VARCHAR(13),
nombre VARCHAR(50),
apellido VARCHAR(50),
edad INT,
direccion VARCHAR(100),
telefono VARCHAR(10),
genero VARCHAR(1)
);


-- tabla temporal voto
CREATE TABLE ##temp_voto (
id_voto INT,
id_mesa INT,
dpi VARCHAR(13),
fecha_hora DATETIME
);


-- tabla temporal detalle voto
CREATE TABLE ##temp_detalle_voto (
id_detalle INT IDENTITY(1,1) PRIMARY KEY,
id_voto INT,
id_candidato INT
);


-- tabla temporal mesa
CREATE TABLE ##temp_mesa (
id_mesa INT,
id_departamento INT
);


-- tabla temporal departamento
CREATE TABLE ##temp_departamento (
id_departamento INT,
nombre VARCHAR(50)
);


-- tabla temporal candidato
CREATE TABLE ##temp_candidato (
id_candidato INT,
nombre VARCHAR(50),
fecha_nacimiento DATE,
id_cargo INT,
id_partido INT
);


-- tabla temporal cargo
CREATE TABLE ##temp_cargo (
id_cargo INT,
cargo VARCHAR(80)
);


-- tabla temporal partido
CREATE TABLE ##temp_partido (
id_partido INT,
nombre VARCHAR(200),
siglas VARCHAR(10),
fundacion DATE
);

/*Para cada una de las tablas anteirores se hicieron inserts como el que esta 
a continuacion y en este se fueron concatenando cada una de las lineas del archivo csv*/
INSERT INTO ##temp_voto (id_voto, id_mesa, dpi, fecha_hora)
    VALUES (1,1,3214713690504, 23/01/2023 4:52)


--Crear la tabla departamento con clave primaria
CREATE TABLE departamento (
id_departamento INT PRIMARY KEY,
nombre VARCHAR(50)
);

--Crear la tabla cargo con clave primaria
CREATE TABLE cargo (
id_cargo INT PRIMARY KEY,
cargo VARCHAR(80)
);

--Crear la tabla partido con clave primaria
CREATE TABLE partido (
id_partido INT PRIMARY KEY,
nombre VARCHAR(200),
siglas VARCHAR(10),
fundacion DATE
);

--Crear la tabla ciudadano con clave primaria
CREATE TABLE ciudadano (
dpi VARCHAR(13) PRIMARY KEY,
nombre VARCHAR(50),
apellido VARCHAR(50),
edad INT,
direccion VARCHAR(100),
telefono VARCHAR(10),
genero VARCHAR(1)
);

--Crear la tabla mesa con clave primaria y clave foránea
CREATE TABLE mesa (
id_mesa INT PRIMARY KEY,
id_departamento INT,
FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);

--Crear la tabla candidato con clave primaria y claves foráneas
CREATE TABLE candidato (
id_candidato INT PRIMARY KEY,
nombre VARCHAR(50),
fecha_nacimiento DATE,
id_cargo INT,
id_partido INT,
FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo),
FOREIGN KEY (id_partido) REFERENCES partido(id_partido)
);

-- Crear la tabla voto con clave primaria y claves foráneas
CREATE TABLE voto (
id_voto INT PRIMARY KEY,
id_mesa INT,
dpi VARCHAR(13),
fecha_hora DATETIME,
FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa),
FOREIGN KEY (dpi) REFERENCES ciudadano(dpi)
);

-- Crear la tabla detalle_voto con clave primaria y claves foráneas
CREATE TABLE detalle_voto (
id_detalle INT PRIMARY KEY,
id_voto INT,
id_candidato INT,
FOREIGN KEY (id_voto) REFERENCES voto(id_voto),
FOREIGN KEY (id_candidato) REFERENCES candidato(id_candidato)
);



-- Eliminar la tabla detalle_voto
DROP TABLE IF EXISTS detalle_voto;

-- Eliminar la tabla voto
DROP TABLE IF EXISTS voto;

-- Eliminar la tabla candidato
DROP TABLE IF EXISTS candidato;

-- Eliminar la tabla mesa
DROP TABLE IF EXISTS mesa;

--Eliminar la tabla ciudadano
DROP TABLE IF EXISTS ciudadano;

-- Eliminar la tabla partido
DROP TABLE IF EXISTS partido;

-- Eliminar la tabla cargo
DROP TABLE IF EXISTS cargo;

--Eliminar la tabla departamento
DROP TABLE IF EXISTS departamento;

--Trasladar los datos de la tabla departamento
INSERT INTO departamento
SELECT * FROM ##temp_departamento;

-- Trasladar los datos de la tabla cargo
INSERT INTO cargo
SELECT * FROM ##temp_cargo;

--Trasladar los datos de la tabla partido
INSERT INTO partido
SELECT * FROM ##temp_partido;

--Trasladar los datos de la tabla ciudadano
INSERT INTO ciudadano
SELECT * FROM ##temp_ciudadano;

--Trasladar los datos de la tabla mesa
INSERT INTO mesa
SELECT * FROM ##temp_mesa;

--Trasladar los datos de la tabla candidato
INSERT INTO candidato
SELECT * FROM ##temp_candidato;

--Trasladar los datos de la tabla voto
INSERT INTO voto
SELECT * FROM ##temp_voto;

--Trasladar los datos de la tabla detalle_voto
INSERT INTO detalle_voto(id_detalle, id_voto, id_candidato)
SELECT id_detalle, id_voto, id_candidato FROM ##temp_detalle_voto;

-- para consulta 1
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


-- para consulta 2
SELECT partido.nombre AS nombre_partido, COUNT(candidato.id_candidato) AS num_candidatos_diputados
FROM partido
LEFT JOIN candidato ON partido.id_partido = candidato.id_partido
WHERE candidato.id_cargo IN (
SELECT id_cargo
FROM cargo
WHERE TRIM(cargo) IN ('diputado congreso lista nacional\r', 'diputado congreso distrito electoral\r', 'diputado parlamento centroamericano\r'))
GROUP BY partido.id_partido, partido.nombre;

-- para consulta 3
SELECT partido.nombre AS nombre_partido, candidato.nombre AS nombre_candidato_alcalde
FROM partido
INNER JOIN candidato ON partido.id_partido = candidato.id_partido
WHERE candidato.id_cargo = (
SELECT id_cargo
FROM cargo
WHERE cargo = 'alcalde\r'
);


-- para consulta 4
SELECT partido.nombre AS nombre_partido, COUNT(candidato.id_candidato) AS num_candidatos
FROM partido
LEFT JOIN candidato ON partido.id_partido = candidato.id_partido
WHERE candidato.id_cargo IN (
SELECT id_cargo
FROM cargo
WHERE TRIM(cargo) IN ('diputado congreso lista nacional\r', 'diputado congreso distrito electoral\r', 'diputado parlamento centroamericano\r', 'presidente\r', 'vicepresidente\r', 'alcalde\r'))
GROUP BY partido.id_partido, partido.nombre;

-- para consulta 5
SELECT TRIM(BOTH '\r' FROM departamento.nombre) AS nombre_departamento, COUNT(voto.id_voto) AS cantidad_votaciones
FROM departamento
LEFT JOIN mesa ON departamento.id_departamento = mesa.id_departamento
LEFT JOIN voto ON mesa.id_mesa = voto.id_mesa
GROUP BY departamento.nombre
ORDER BY departamento.nombre;


-- para consulta 6
SELECT COUNT(DISTINCT id_voto) AS cantidad_votos_nulos
FROM detalle_voto
WHERE id_candidato = -1;

-- para consulta 7
SELECT TOP 10 edad, COUNT(voto.id_voto) AS cantidad_votos
FROM ciudadano
INNER JOIN voto ON ciudadano.dpi = voto.dpi
GROUP BY edad
ORDER BY COUNT(voto.id_voto) DESC, edad DESC;

-- para consulta 8
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


-- para consulta 9
SELECT TOP 5
m.id_mesa AS No_Mesa,
TRIM(BOTH '\r' FROM d.nombre) AS Departamento,
COUNT(v.id_voto) AS Cantidad_Votos
FROM mesa AS m
INNER JOIN departamento AS d ON m.id_departamento = d.id_departamento
LEFT JOIN voto AS v ON m.id_mesa = v.id_mesa
GROUP BY m.id_mesa, d.nombre
ORDER BY Cantidad_Votos DESC;

-- para consulta 10
SELECT TOP 5
CONVERT(VARCHAR(5), v.fecha_hora, 108) AS Hora_Minutos,
COUNT(*) AS Cantidad_Votos
FROM voto AS v
GROUP BY CONVERT(VARCHAR(5), v.fecha_hora, 108)
ORDER BY Cantidad_Votos DESC, Hora_Minutos;


-- para consulta 11
SELECT genero, COUNT(voto.id_voto) AS cantidad_votos
FROM ciudadano
INNER JOIN voto ON ciudadano.dpi = voto.dpi
GROUP BY genero;