import { app } from "./app";
import { connectDB } from "./config/database";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
    await connectDB();

    app.listen(env.port, () => {
        console.log(`Servidor corriendo en el puerto ${env.port} [${env.nodeEnv}]`);
    });
}

bootstrap().catch((error) => {
    console.error("Error al iniciar la aplicación:", error);
    process.exit(1);
});