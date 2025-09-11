import Fastify from "fastify";
import formsRoutes from "./handlers/forms";

const server = Fastify({ logger: true });

async function start() {
  try {
    await server.register(formsRoutes);

    await server.listen({ port: 3000 });
    console.log("Server running at http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
