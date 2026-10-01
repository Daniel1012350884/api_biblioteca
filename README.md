# api_biblioteca

API REST para gestionar una biblioteca: **autores**, **libros** y **préstamos**.
Construida con Node.js, Express, TypeScript y MongoDB, con arquitectura por capas
(rutas → controlador → servicio → repositorio).

## Tecnologías

- Node.js + Express 5
- TypeScript
- MongoDB (driver oficial `mongodb`)
- Middlewares: `cors`, `helmet`, `compression`, `morgan`
- `dotenv` para variables de entorno

## Estructura del proyecto

```
src/
├── api/v1/index.ts            # Registra las rutas bajo /api/v1
├── config/
│   ├── database.ts            # Conexión a MongoDB e índice único de ISBN
│   └── env.ts                 # Lectura y validación del .env
├── modules/
│   ├── authors/               # Autores (routes, controller, service, repository, model)
│   ├── books/                 # Libros
│   └── loans/                 # Préstamos
├── shared/
│   ├── errors/AppError.ts     # BadRequestError (400), NotFoundError (404)
│   ├── middlewares/           # asyncHandler y errorHandler (404 + errores)
│   └── utils/validation.ts    # Validación de campos obligatorios e IDs
├── app.ts                     # Configuración de Express
└── server.ts                  # Arranque del servidor
tests/
└── validaciones.test.js       # Pruebas de validación (sin MongoDB real)
```

## Instalación

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
```

Edita el archivo `.env` con tus datos:

| Variable        | Descripción                                          | Ejemplo                                   |
| --------------- | ---------------------------------------------------- | ----------------------------------------- |
| `PORT`          | Puerto del servidor                                  | `3000`                                    |
| `NODE_ENV`      | `development`, `production` o `test`                 | `development`                             |
| `MONGO_URI`     | Cadena de conexión de MongoDB                        | `mongodb+srv://usuario:clave@cluster/...` |
| `MONGO_DB_NAME` | Nombre de la base de datos (**distingue mayúsculas**) | `library`                                 |

> `MONGO_DB_NAME` debe escribirse igual que en MongoDB: `Library` y `library` son bases distintas.
> Nunca subas el archivo `.env` al repositorio (ya está en `.gitignore`).

## Ejecución

| Comando          | Descripción                                                |
| ---------------- | ---------------------------------------------------------- |
| `npm run dev`    | Desarrollo con recarga automática (nodemon + ts-node)      |
| `npm run build`  | Compila TypeScript a la carpeta `build/`                   |
| `npm start`      | Ejecuta la versión compilada (`build/server.js`)           |
| `npm test`       | Compila y ejecuta las pruebas de validación                |

Al iniciar correctamente verás en consola:

```
Conectado a MongoDB (base de datos: ...)
Servidor corriendo en el puerto 3000 [development]
```

> Si cambias el código y usas `npm start`, recuerda correr `npm run build` antes.
> Si el puerto 3000 está ocupado por un proceso viejo, ciérralo con
> `netstat -ano | findstr :3000` y `taskkill /PID <pid> /F`.

Health check: `GET /health`

## URL base

```
http://localhost:3000/api/v1
```

Las rutas disponibles son `/authors`, `/books` y `/loans`.
Cualquier otra ruta responde `404`.

---

## Autores — `/api/v1/authors`

| Método | Ruta           | Descripción                          |
| ------ | -------------- | ------------------------------------ |
| POST   | `/`            | Crea un autor                        |
| GET    | `/`            | Lista todos los autores              |
| GET    | `/:id`         | Obtiene un autor por id              |
| GET    | `/:id/books`   | Lista los libros de un autor         |
| PUT    | `/:id`         | Actualiza un autor                   |
| DELETE | `/:id`         | Elimina un autor                     |

**Campos**

| Campo         | Tipo    | Obligatorio | Notas                                  |
| ------------- | ------- | ----------- | -------------------------------------- |
| `name`        | texto   | Sí          |                                        |
| `nationality` | texto   | Sí          |                                        |
| `birthYear`   | entero  | No          | Positivo y no mayor al año actual      |
| `biography`   | texto   | No          |                                        |
| `active`      | booleano| No          | Por defecto `true`                     |

**Ejemplo**

```json
{
    "name": "Gabriel García Márquez",
    "nationality": "Colombiana",
    "birthYear": 1927
}
```

**Regla de negocio:** no se puede eliminar un autor que tiene libros asociados.

---

## Libros — `/api/v1/books`

| Método | Ruta      | Descripción                                          |
| ------ | --------- | ---------------------------------------------------- |
| POST   | `/`       | Crea un libro                                        |
| GET    | `/`       | Lista libros (filtro opcional `?available=true\|false`) |
| GET    | `/:id`    | Obtiene un libro por id                              |
| PUT    | `/:id`    | Actualiza un libro                                   |
| DELETE | `/:id`    | Elimina un libro                                     |

**Campos**

| Campo      | Tipo    | Obligatorio | Notas                                                         |
| ---------- | ------- | ----------- | ------------------------------------------------------------- |
| `title`    | texto   | Sí          |                                                               |
| `isbn`     | texto   | Sí          | Único: no puede repetirse                                     |
| `authorId` | texto   | Sí          | `_id` de un autor existente (24 caracteres hexadecimales)     |
| `year`     | entero  | No          |                                                               |
| `available`| booleano| —           | No se envía: lo controla el módulo de préstamos (inicia en `true`) |

**Ejemplo**

```json
{
    "title": "Cien años de soledad",
    "isbn": "978-0307474728",
    "authorId": "6abd9783a231f966a5c65792",
    "year": 1967
}
```

**Reglas de negocio:** el autor debe existir y el ISBN no puede repetirse.

---

## Préstamos — `/api/v1/loans`

| Método | Ruta        | Descripción                                    |
| ------ | ----------- | ---------------------------------------------- |
| POST   | `/`         | Crea un préstamo                               |
| GET    | `/`         | Lista todos los préstamos                      |
| GET    | `/active`   | Lista los préstamos activos (no devueltos)     |
| GET    | `/:id`      | Obtiene un préstamo por id                     |
| PUT    | `/:id`      | Actualiza un préstamo (por ejemplo, devolverlo)|
| DELETE | `/:id`      | Elimina un préstamo                            |

**Campos**

| Campo        | Tipo     | Obligatorio | Notas                                                    |
| ------------ | -------- | ----------- | -------------------------------------------------------- |
| `bookId`     | texto    | Sí          | `_id` de un libro existente                              |
| `userName`   | texto    | Sí          | Nombre de quien toma el libro                            |
| `loanDate`   | texto    | Sí          | Fecha ISO, por ejemplo `2026-10-01`                      |
| `returned`   | booleano | No          | Solo en `PUT`. Por defecto el préstamo nace en `false`   |
| `returnDate` | fecha    | —           | No se envía: se asigna automáticamente al devolver       |

**Ejemplo: crear un préstamo**

```json
{
    "bookId": "ID_DE_UN_LIBRO_DISPONIBLE",
    "userName": "Ana Pérez",
    "loanDate": "2026-10-01"
}
```

**Ejemplo: devolver el libro** (`PUT /api/v1/loans/:id`)

```json
{
    "returned": true
}
```

**Reglas de negocio**

- Solo se presta un libro con `available: true`; al prestarlo pasa a `false`.
- Al devolver (`returned: true`) se asigna `returnDate` y el libro vuelve a estar disponible.
- Un préstamo ya devuelto no puede reabrirse.
- No se puede cambiar el libro (`bookId`) de un préstamo existente.
- Si se elimina un préstamo activo, el libro queda disponible otra vez.

---

## Respuestas y errores

Códigos de estado usados:

| Código | Cuándo                                                   |
| ------ | -------------------------------------------------------- |
| `200`  | Consulta o actualización correcta                        |
| `201`  | Recurso creado                                           |
| `204`  | Eliminado correctamente (sin contenido)                  |
| `400`  | Datos faltantes o inválidos, o regla de negocio incumplida |
| `404`  | Recurso o ruta no encontrada                             |
| `500`  | Error interno del servidor                               |

Todos los errores tienen el mismo formato, y el `message` indica qué falta o qué está mal:

```json
{
    "status": "error",
    "message": "Falta el campo obligatorio: 'authorId'"
}
```

**Ejemplos de mensajes**

| Situación                                  | Mensaje                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| Faltan varios campos                       | `Faltan campos obligatorios: 'title', 'isbn', 'authorId'`                |
| Falta un campo (o viene vacío `""`)        | `Falta el campo obligatorio: 'authorId'`                                 |
| ID con formato incorrecto                  | `El campo 'authorId' no es un ID válido (debe tener 24 caracteres hexadecimales)...` |
| `PUT` sin campos                           | `No se enviaron campos para actualizar. Envía al menos uno de: ...`      |
| JSON mal escrito                           | `El cuerpo de la petición no es un JSON válido ...`                      |
| Autor inexistente al crear un libro        | `El autor indicado no existe`                                            |
| ISBN repetido                              | `Ya existe un libro con el ISBN '...'`                                   |
| Libro ya prestado                          | `El libro no está disponible para préstamo`                              |
| Ruta inexistente                           | `Ruta no encontrada: ... Rutas disponibles: /api/v1/authors, /api/v1/books, /api/v1/loans` |

## Cómo probar con Postman

1. Verifica que el servidor esté corriendo (`npm run dev`).
2. Para `POST` y `PUT`, ve a **Body → raw → JSON** y escribe el cuerpo.
3. Orden recomendado: crear un **autor** → crear un **libro** con el `_id` del autor →
   crear un **préstamo** con el `_id` del libro → devolverlo con `PUT`.
4. Los `GET` y `DELETE` no llevan body.

> Para crear usa siempre `POST` sobre la colección (`/books`, no `/`).
> Un `GET` con body solo lista; no crea nada.

## Pruebas automáticas

```bash
npm test
```

Ejecuta 51 casos de validación sobre autores, libros y préstamos usando una base de
datos simulada en memoria, por lo que no necesita conexión a MongoDB.
