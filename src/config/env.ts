import dotenv from "dotenv";

// override: true hace que el .env mande sobre variables del sistema con el mismo nombre.
dotenv.config({ override: true });

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Falta la variable de entorno '${name}' en el archivo .env`);
    }
    return value;
}

export const env = {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    mongoUri: required("MONGO_URI"),
    mongoDbName: required("MONGO_DB_NAME"),
};