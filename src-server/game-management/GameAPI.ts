import { Server } from "socket.io";
import Logger from "../Logger";

interface CallbackMap {
    [path:string]: Function[]
}

/**
 * Handle basic Socket.IO data message handling.
 */
export default class GameAPI 
{
    #io:Server;
    #room:string;
    #funcs:CallbackMap = {};
    #vsPaths:string[] = [];

    constructor(io:Server, room:string)
    {
        this.#room = room;
        this.#io = io;
    }

    /**
     * Set a callback function to handle given path data
     * @param {String} sPath 
     * @param {Array of Function} func_callbacks 
     */
    addListener(sPath:string, ...func_callbacks:Function[])
    {
        if (func_callbacks === undefined || !Array.isArray(func_callbacks) || func_callbacks.length === 0)
            return;

        if (!this.#vsPaths.includes(sPath))
            this.#vsPaths.push(sPath);

        if (typeof this.#funcs[sPath] === "undefined")
            this.#funcs[sPath] = [];

        for (let func_callback of func_callbacks)
        {
            if (typeof func_callback === "function")
                this.#funcs[sPath].push(func_callback);
        }
    }
    
    /**
     * Execute callback function to handle received path data
     * @param {Object} socket 
     * @param {String} path 
     * @param {JSON} data 
     * @returns 
     */
    #onPath(socket:any, path:string, data:any)
    {
        if (path === "" || typeof this.#funcs[path] === "undefined")
        {
            Logger.info("no endpint available at requested path (not printed for security reasons).");
            return;
        }

        for (let fnCallbacl of this.#funcs[path])
        {
            try
            {
                fnCallbacl(socket.userid, socket, data);
            } 
            catch (e)
            {
                Logger.warn("An unexpected exception occurred...");
                console.error(e);
                Logger.error(e);
            }
        }
    }

    /**
     * Init socket game endpoint for given socket
     * 
     * @param {Object} socket 
     */
    initGameEndpoint(socket:any)
    {
        const THIS = this;
        for (const path of this.#vsPaths)
            socket.on(path, (data:any) => THIS.#onPath(socket, path, data));

        socket.isingame = true;
    }

    /**
     * Publish an object to the given path 
     * 
     * @param {Object} socket 
     * @param {String} path 
     * @param {JSON} data 
     */
    send(socket:any, path:string, data:any)
    {
        if (typeof data === "undefined")
            data = {};

        this.#io.to(socket.room).emit(path, data);
    }

    /**
     * Send a reply trough the given socket
     * @param {String} sPath Path
     * @param {Object} socket Socket
     * @param {JSON} data Data to be sent
     */
    reply(sPath:string, socket:any, data:any)
    {
        if (socket === undefined || socket === null)
            return;

        if (typeof data === "undefined")
            data = {};

        socket.emit(sPath, {target: socket.userid, payload: data});
    }

    /**
     * Publish an object to the given path 
     * @param {String} sPath 
     * @param {String} player 
     * @param {JSON} data Data to be sent (optional)
     */
    publish(sPath:string, player:string, data:any)
    {
        if (typeof data === "undefined")
            data = {};
        
        this.#io.to(this.#room).emit(sPath, {target: player, payload: data});
    }
}
