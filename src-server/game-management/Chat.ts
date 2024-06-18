import * as path from "path";
import * as fs from "fs";
import Logger from "../Logger";
import { KeyValuesString } from "../plugins/Types";
import GameAPI from "./GameAPI";
import { getRootFolder } from "../Configuration";

/**
 * This is a simple wrapper to send a chat message
 */
export default class Chat {

    #api:GameAPI;
    #endpoint = "/game/chat/message";
    #saveLogsAfter:number
    #gameLogFileUri:string;
    #gameLogfileName:string;

    #players:KeyValuesString = {};
    #vsLogs:string[] = [];
    #hasLogData = false;

    /**
     * Create instance
     * @param {Object} pApi Game API Reference
     * @param {*} sEndpoint Target endpoint
     */
    constructor(pApi:GameAPI, room:string, saveLogsAfter:number)
    {
        this.#api = pApi;
        const gameLogfileName = Chat.#requireGameLogFile(room) 
        this.#gameLogFileUri = path.join(getRootFolder() + "/logs/" + gameLogfileName);
        this.#gameLogfileName = gameLogfileName;
        this.#saveLogsAfter = saveLogsAfter;
    }

    hasLogData()
    {
        return this.#hasLogData;
    }

    getLogSize()
    {
        return this.#vsLogs.length;
    }

    getGameLogFile()
    {
        return this.#gameLogfileName;
    }

    static #requireGameLogFile(room:string)
    {
        return Date.now() + (room === undefined || room === "" ? "" : "-" + room) + ".txt";
    }

    addPlayer(userid:string, displayname:string, deckChecksum:string = "")
    {
        this.#players[userid] = displayname;
        this.#appendLog(displayname + " joins the game (deck #" + deckChecksum + ")", "");
    }

    #appendLog(message:string, userid = "")
    {
        if (message === "" || this.#saveLogsAfter < 10)
            return;

        if (userid === "")
            this.#vsLogs.push(message);
        else
            this.#vsLogs.push(this.#getUserName(userid) + " " + message);

        if (this.#vsLogs.length > this.#saveLogsAfter)
        {
            this.#hasLogData = true;
            this.saveGameLog();
        }
    }

    #getUserName(userid:string)
    {
        const val = this.#players[userid];
        return val ?? "A player";
    }

    /**
     * Send a message
     * @param {String} userid Userid
     * @param {String} text Text message
     */
    send(userid:string, text:string, saveGameLog = false)
    {
        Logger.warn("deprecated chat.send");
        this.sendMessage(userid, text, saveGameLog);
    }

    gameLogNextPlayer(message:string)
    {
        this.#appendLog("\n", "");
        this.#appendLog(message, "");
        this.#appendLog("==================", "");
    }

    #getFinalScoreHeader(score:any)
    {
        const keys = Object.keys(score.score);
        if (keys.length < 1)
            return "";

        const first = score.score[keys[0]];
        const list = ["Name", "Total"];
        for (let key in first)
        {
            if (key.length > 7)
                list.push(key.substring(0,7));
            else
                list.push(key);
        }

        return list.join("\t");
    }

    createLogFinalScore(finalScores:any)
    {
        if (finalScores === undefined || finalScores === null)
            return null;


        const sHeader = this.#getFinalScoreHeader(finalScores);
        if (sHeader === "")
            return null;

        const list = ["\nFinal Scores\n==================", sHeader];

        let line;
        for (let id of Object.keys(finalScores.score))
        {
            const name = finalScores.players[id];
            if (name === undefined)
                continue;

            const row = finalScores.score[id];
            line = [name, this.#countScoreTotal(row)];
            for (let key in row)
                line.push(row[key]);

            list.push(line.join("\t"));
        }

        return list.length === 0 ? null : list;
    }

    appendLogFinalScore(finalScores:any)
    {
        const res = this.createLogFinalScore(finalScores);
        if (res === null)
            this.#appendLog("Could not calculate final scores.", "");   
        else
            this.#appendLog(res.join("\n"), "");   
    }

    #countScoreTotal(score:any)
    {
        let total = 0;

        for (let key in score)
            total += score[key];

        return total;
    }

    saveGameLog()
    {
        if (!this.#hasLogData)
            return;
        
        fs.appendFile(this.#gameLogFileUri, this.#vsLogs.join("\n"), function (err) 
        {
            if (err)
                Logger.error(err);
        });

        this.#vsLogs = [""];
    }

    /**
     * Send a message
     * @param {String} userid Userid
     * @param {String} text Text message
     * @param {Boolean} saveGameLog Save message to game log
     */
    sendMessage(userid:string, text:string, saveGameLog = false)
    {
        if (this.#api === null || text.indexOf(">") !== -1 || text.indexOf("<") !== -1)
            return;

        this.#api.publish(this.#endpoint, userid, {
            userid: userid,
            message: text,
            id: ""
        });

        if (saveGameLog)
            this.#appendLog(text, userid);
    }

    sendMessagePrefeined(userid:string, id:string)
    {
        if (this.#api)
        {
            this.#api.publish(this.#endpoint, userid, {
                userid: userid,
                message: "",
                id: id
            });
        }
    }
}
