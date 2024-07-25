import * as fs from "fs";
import Logger from "./Logger";
import ConfigurationInstance, { getRootFolder } from "./Configuration"
import express, { Request, Response, NextFunction } from "express";
import { Server } from 'socket.io';
import { createServer } from "http";
const cookieParser = require('cookie-parser');
import AuthenticationManagement from "./game-management/authentication";
import RoomManager from "./game-management/RoomManager";
import readAndCreateUniqueVersion from "./server/ReadFileUniqueVersion";

const cspAllowRemoteImages = function (sPath: string = ""): boolean {
    return sPath.startsWith("/play") ||
        sPath.startsWith("/arda") ||
        sPath.startsWith("/singleplayer") ||
        sPath.startsWith("/deckbuilder") ||
        sPath.startsWith("/cards") ||
        sPath.startsWith("/pwa") ||
        sPath.startsWith("/map/");
}

const Caching = {

    headerData: {

        generic: {
            etag: true,
            maxage: 8640000 * 1000,
            "Cache-Control": "public, max-age=21600"
        },

        jpeg: {
            etag: true,
            maxage: 8640000 * 1000,
            "Content-Type": "image/jpeg"
        }
    },

    cache: {

        jsonCallback: function (_req: Request, res: Response, next: NextFunction) {
            res.header("Cache-Control", "public, max-age=21600");
            res.header('Content-Type', "application/json");
            next();
        },

        jsonCallback6hrs: function (_req: Request, res: Response, next: NextFunction) {
            res.header("Cache-Control", "public, max-age=21600");
            res.header('Content-Type', "application/json");
            next();
        },

        cache6hrsOnly: function (_req: Request, res: Response, next: NextFunction) {
            res.header("Cache-Control", "public, max-age=21600");
            next();
        },

        htmlCallback: function (_req: Request, res: Response, next: NextFunction) {
            res.header("Cache-Control", "public, max-age=0");
            res.header('Content-Type', "text/html");
            next();
        },
    },

    expires: {

        jsonCallback: function (_req: Request, res: Response, next: NextFunction) {
            Caching.expires.withResultType(res, "application/json");
            next();
        },

        generic: function (_req: Request, res: Response, next: NextFunction) {
            res.header("Cache-Control", "no-store");
            next();
        },

        withResultType(res: Response, sType: string) {
            res.header("Cache-Control", "no-store");
            if (typeof sType === "string" && sType !== "")
                res.header('Content-Type', sType);
        }
    }
};

const ROOT_DIRECTORY = ConfigurationInstance.getRootFolder();

const RoomNames = {

    extractRoomName : function(uri:string):string
    {
        const pos = uri.lastIndexOf("/");
        const dot = uri.lastIndexOf(".");
    
        if (pos === -1 || dot < pos)
            return "";
        else
            return uri.substring(pos+1, dot);
    },

    readJsonArray : function(file:string):string[]
    {
        try
        {
            return JSON.parse(fs.readFileSync(file, "utf8"));
        }
        catch (err)
        {
            Logger.warn("Could not read json " + file);
        }

        return [];
    },

    createRoomImageEntry : function(input:string)
    {
        return {
            name: RoomNames.extractRoomName(input),
            image: input
        }
    },

    createImages : function()
    {
        const targetList:any[] = [];
        this.readJsonArray(getRootFolder() + '/data-local/roomlist.json').forEach(_e => targetList.push(this.createRoomImageEntry(_e)));
        return targetList;
    }
}


export class ServerInstance {

    static readonly #instance = express();
    static #io: any = null;
    static #http:any = null;
    static #roomManager:RoomManager|null = null;
    static readonly #sampleRooms:string[] = RoomNames.createImages();
    static readonly #sampleNames:string[] = RoomNames.readJsonArray(getRootFolder() + '/data-local/namelist.json');
    static #instanceListener:any = null;
    static #page404 = "";
    static #page500 = "";

    static getServerInstance()
    {
        return ServerInstance.#instance;
    }


    static getSampleRooms()
    {
        return ServerInstance.#sampleRooms;
    }

    static getSampleNames()
    {
        return ServerInstance.#sampleNames;
    }

    static getSocketIo() 
    {
        return ServerInstance.#io;
    }

    static getRoomManager()
    {
        return ServerInstance.#roomManager!;
    }

    static setup()
    {
        ServerInstance.#initServer();
    }

    static startup() {

        Init400And500();

        ServerInstance.#instanceListener = ServerInstance.#http.listen(ConfigurationInstance.port(), ServerInstance.onListenSetupSocketIo);
        ServerInstance.#instanceListener.setTimeout(1000 * ConfigurationInstance.getRequestTimeout());
        ServerInstance.#instanceListener.on('clientError', (err: any, socket: any) => {
            Logger.error(err);
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
    
        Logger.info("Server started at port " + ConfigurationInstance.port());
    }

    static #initServer() 
    {
        ServerInstance.#instance.disable('x-powered-by');
        ServerInstance.#instance.use(cookieParser());
        ServerInstance.#instance.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
        ServerInstance.#instance.use(express.json()); // for parsing application/json
        ServerInstance.#instance.use(function (req: Request, res: Response, next: NextFunction) {
            res.header('X-Robots-Tag', 'noindex, nofollow');
            res.header("X-Frame-Options", 'sameorigin');

            if (cspAllowRemoteImages(req.path)) {
                res.header('Content-Security-Policy', ConfigurationInstance.createContentSecurityPolicyMegaAdditionals());
                res.header('X-Content-Security-Policy', ConfigurationInstance.createContentSecurityPolicyMegaAdditionals());
            }
            else {
                res.header('Content-Security-Policy', ConfigurationInstance.createContentSecurityPolicySelfOnly());
                res.header('X-Content-Security-Policy', ConfigurationInstance.createContentSecurityPolicySelfOnly());
            }

            if (process.env.MODE !== "production")
            {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
            }

            next();
        });

        ServerInstance.#http = createServer(ServerInstance.#instance);
        ServerInstance.#roomManager = new RoomManager(ServerInstance.getSocketIo, readAndCreateUniqueVersion(ROOT_DIRECTORY + "/pages/game.html"));
        AuthenticationManagement.setUserManager(ServerInstance.#roomManager);
    }

    static onListenSetupSocketIo()
    {
        ServerInstance.#io = new Server(ServerInstance.#http);
        ServerInstance.#io.on('connection', ServerInstance.onIoConnection);
        ServerInstance.#io.engine.on("connection_error", (err: any) => Logger.error("There is a connection error (" + err.code + "): " + err.message));
        ServerInstance.#io.use(ServerInstance.onIoHandshake);
    }

    static doShutdown()
    {
        try {
            try {
                Logger.info("- shutdown IO http ServerInstance.");
                ServerInstance.#io.httpServerInstance.close();
            }
            catch (e) {
                Logger.error(e);
            }
    
            try {
                Logger.info("- shutdown IO.");
                ServerInstance.#io.close();
            }
            catch (e) {
                Logger.error(e);
            }
    
            try {
                Logger.info("- shutdown ServerInstance.");
                ServerInstance.#instanceListener.close();
            }
            catch (e) {
                Logger.error(e);
            }
        }
        finally {
            ServerInstance.#io = null;
            ServerInstance.#instanceListener = null;
    
            Logger.info("- stop application.");
            process.exit(0);
        }
    }

    static onSocketDisconnect(socket: any) 
    {
        if (!socket.auth) {
            Logger.info("Disconnected unauthenticated session " + socket.id);
        }
        else {
            ServerInstance.getRoomManager().onDisconnected(socket.userid, socket.room);
            ServerInstance.getRoomManager().checkGameContinuence(socket.room);
        }
    }

    static onIoHandshake(socket: any, next: NextFunction) 
    {
        const data = socket.handshake.auth;
    
        const token = data.authorization;
        const room = data.room;
    
        try {
            if (ServerInstance.getRoomManager().allowJoin(room, token, data.userId, data.joined, data.player_access_token_once)) {
                socket.auth = true;
                socket.room = room;
                socket.userid = data.userId;
                socket.username = data.dispayName;
                socket.joined = data.joined;
                next();
                return;
            }
            else
                socket.disconnect("invalid authentication");
        }
        catch (err) {
            Logger.error(err);
            next(err);
        }
    }

    static onIoConnection(socket: any) 
    {
        socket.username = "";
    
        AuthenticationManagement.triggerAuthenticationProcess(socket);
    
        /**
         * The disconnect event may have 2 consequnces
         * 1. interrupted and connection will be reestablished after some time
         * 2. user has left entirely
         */
        socket.on("disconnect", (_reason: any) => ServerInstance.onSocketDisconnect(socket));
    
        /** Player has reconnected. Send an update all */
        socket.on('reconnect', () => ServerInstance.getRoomManager().onReconnected(socket.userid, socket.room));
    }


    static getPage500()
    {
        return ServerInstance.#page500;
    }

    static getPage404() {
        return ServerInstance.#page404;
    }

    static setErrorPage(s400:string|null, s500:string|null)
    {
        if (s400 !== null)
            ServerInstance.#page404 = s400;
        if (s500 !== null)
            ServerInstance.#page500 = s500;
    }
}


fs.readFile(getRootFolder() + "/pages/error-404.html", 'utf-8', (err, data) => {
    if (err)
        Logger.warn(err);
    else
        ServerInstance.setErrorPage(data, null);
});

fs.readFile(getRootFolder() + "/pages/error-500.html", 'utf-8', (err, data) => {
    if (err)
        Logger.warn(err);
    else
        ServerInstance.setErrorPage(null, data);
});


export function shutdown(): void {
    Logger.info("Shutting down game ServerInstance.");

    /** send save game instruction to running games */
    if (ServerInstance.getRoomManager().sendShutdownSaving()) 
    {
        function sleep(time: number) {
            return new Promise((resolve) => setTimeout(resolve, time));
        }

        sleep(2000).then(ServerInstance.doShutdown).catch((err) => Logger.error(err));
    }
    else
        ServerInstance.doShutdown();
}

const EndpointVisitsData = {
    deckbuilder: 0,
    cards: 0,
    converter: 0
}

export { Caching };

export function endpointVisitsResult() 
{
    return EndpointVisitsData;
}

export function endpointVisitsCount(req: Request, _res: Response, next: NextFunction) 
{
    switch (decodeURIComponent(req.baseUrl)) {
        case "/deckbuilder":
            EndpointVisitsData.deckbuilder++;
            break;
        case "/cards":
            EndpointVisitsData.cards++;
            break;
        case "/converter":
            EndpointVisitsData.converter++;
            break;
        default:
            break;
    }

    next();
}

function Init400And500()
{

    /** Map tiles not found - send black tile */
    ServerInstance.getServerInstance().use(function(req: Request, res: Response, next:NextFunction) 
    {
        if (req.path.startsWith("/media/maps/"))
            res.redirect("/media/map-black-tile");
        else
            next();
    });

    /** 404 - not found */
    ServerInstance.getServerInstance().use(function(req: Request, res: Response, _next:NextFunction) 
    {
        if (!ConfigurationInstance.isProduction())
            console.info("404 ", req.originalUrl);

        res.status(404).send(ServerInstance.getPage404());
    });
    
    /* 500 - Any server error */
    ServerInstance.getServerInstance().use(function(err:any, req: Request, res: Response, _next:NextFunction) 
    {
        if (err)
        {
            Logger.error(err);
            if (!ConfigurationInstance.isProduction())
                console.info("500 " + decodeURIComponent(req.baseUrl))

            console.error(err);
        }

        res.status(500).send(ServerInstance.getPage500());
    });

}

export default function getServerInstance()
{
    return ServerInstance.getServerInstance();
}