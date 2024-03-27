import { BasicConfig } from "./interfaces";

export const basicConfig: BasicConfig = {
        port: process.env.PORT || 8000,
        shutdownTimeout: 10000,
    }
 
