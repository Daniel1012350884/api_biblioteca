import { MongoClient, Db } from "mongodb";
import { env } from "./env";

let client: MongoClient;
let db: Db;

export const connectDB = async (): Promise<void> => {
    client = new MongoClient(env.mongoUri);
    await client.connect();

    // El nombre de la base se toma siempre del .env (respeta mayúsculas: Library).
    db = client.db(env.mongoDbName);

    // Índice único: MongoDB también garantiza que no haya ISBN repetidos.
    await db.collection("books").createIndex({ isbn: 1 }, { unique: true });

    console.log(`Conectado a MongoDB (base de datos: ${env.mongoDbName})`);
};

export const getDb = (): Db => {
    if (!db) {
        throw new Error("La base de datos no ha sido inicializada");
    }
    return db;
};

export const closeDB = async (): Promise<void> => {
    await client?.close();
};