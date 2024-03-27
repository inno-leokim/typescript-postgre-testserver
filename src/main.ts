import { basicConfig } from "./config/serverConfig";
import { ApiServer, init } from "./server";

const main = async () => {
    const server:ApiServer = await init(basicConfig);

    server.listen(basicConfig.port, () => {
        console.log(`running server at ${basicConfig.port}`);
    });

    process.on('SIGTERM', () => server.shutdown());
    process.on('SIGINT', () => server.shutdown());
}

main()