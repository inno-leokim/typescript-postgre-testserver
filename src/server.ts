import http from 'http';
import path from 'path';
import createHttpError, { CreateHttpError } from 'http-errors';
import express, { Errback, Express, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { Socket } from 'dgram';
import { BasicConfig } from './config/interfaces';
import { search_customer } from './service/searchCustomer';

dotenv.config({path: path.join(__dirname, '/.env')});

class ApiServer extends http.Server {
    
    private static isntance: ApiServer;

    private app:express.Application;
    private config:BasicConfig;
    private currentConns:Set<any>;
    private busy:WeakSet<any>;
    private stopping:boolean;
    
    constructor(config: BasicConfig){
        const app = express();
        super(app);

        this.app = app;
        this.config = config;
        this.currentConns = new Set(); //중복제거 없앰
        this.busy = new WeakSet();
        this.stopping = false;

        if(!ApiServer.isntance){
            ApiServer.isntance = this;
        }

        return ApiServer.isntance;
    }

    async start():Promise<ApiServer>{
        this.app.use(morgan('combined'));

        this.app.use((req:Request, res:Response, next:NextFunction) => {
            this.busy.add(req.socket);
            console.log('클라이언트 요청 들어옴!');

            res.on('finish', () => {
                if(this.stopping) req.socket.end();

                this.busy.delete(req.socket);
                console.log('클라이언트 요청처리 완료');
            });

            next();
        });

        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.raw());
        this.app.use(express.text());

        this.app.get('/health', (req: Request, res: Response) => {
            if(this.listening) res.send('<h1>서버 정상 작동 중</h1>');
        });

        this.app.get('/customer', async (req: Request, res: Response) => {
            
            try {
                const result:any = await search_customer("test@etechsystem.co.kr");

                if(result.rowCount > 0){
                    res.status(200).send({
                        success: true,
                        result: result.rows
                    });
                } else {
                    res.status(400).send({
                        success: false,
                        message: "Resource Null"
                    });
                }
            } catch (err) {
                console.error("get /customer", err);
                res.status(500).send({
                    success: false,
                    message: "Server Error"
                })
            }
        })

        // this.app.get('/*', (req:Request, res:Response, next:NextFunction) => {
        //     next(createHttpError(404));
        // });

        this.app.use((req:Request, res:Response, next:NextFunction) => {
            next(createHttpError(404));
        });

        this.on('connection', (socket:Socket) => {
            this.currentConns.add(socket);
            console.log('클라이언트 접속!');

            socket.on('close', () => {
                this.currentConns.delete(socket);
                console.log('클라이언트 연결 해제!!')
            });
        });

        return this;
    }

    shutdown(): void{
        if(this.stopping) {
            console.log('이미 서버 종료 중입니다...');
            return;
        }

        this.stopping = true;

        this.close((err: Error | undefined) => {
            if(err){
                console.log('서버 종료 중 에러 발생');
            }else{
                console.log('서버 종료 - 정상 종료');
                process.exit(0);
            }
        });

        setTimeout(() => {
            console.log('서버 종료 - 강제 종료');
            process.exit(1);
        },this.config.shutdownTimeout).unref();

        if(this.currentConns.size > 0){
            console.log(`현재 접속 중인 연결 ${this.currentConns.size}개 종료 중입니다.`);

            for(const con of this.currentConns){
                if(!this.busy.has(con)){ // 처리중인 요청이 없음
                    console.log('순차적 종료!');
                    con.end();
                }else{
                    console.log('아직 요청 처리 중입니다!');
                }
            }
        }
    }

    errorHandler(err:any, req:Request, res:Response, next:Errback){
        res.locals.message = err.message;
        res.locals.error = err;
        res.status(err.status || 500);
        res.send('<h1>에러발생</h1>');
    }
}

const init = async (config:BasicConfig):Promise<ApiServer> => {
    
    const server = new ApiServer(config);
    return await server.start();

}

export {
    ApiServer, init
}