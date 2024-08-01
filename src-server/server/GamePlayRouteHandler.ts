import Logger from "../Logger";
import * as UTILS from "../meccg-utils";
import * as EventManager from "../EventManager";
import * as Authentication from "../Authentication";
import { CardDataProvider } from "../plugins/CardDataProvider";
import GamePlayRouteHandlerUtil from "./GamePlayRouteHandlerUtil";
import { NextFunction, Request, Response } from "express";
import { join } from "path";
import { DeckValidate } from "../plugins/Types";
import { getRootFolder } from "../Configuration";

export default class GamePlayRouteHandler extends GamePlayRouteHandlerUtil {
    #pAuthentication = Authentication;

    #contextRoot: string;
    #contextPlay: string;

    #pageHome: string;
    #addwatch: boolean;
    #pageWatch: string;
    #pageJoin: string

    constructor(sContext: string, addwatch: boolean = false) {
        super();

        this.#contextPlay = sContext + "/";
        this.#contextRoot = sContext;
        this.#addwatch = addwatch;

        this.#pageHome = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/home.html"));

        if (addwatch) {
            this.#pageWatch = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/watch.html"));;
            this.#pageJoin = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/join.html"));;
        }
        else {
            this.#pageWatch = "";
            this.#pageJoin = "";
        }
    }

    isArda() {
        return false;
    }

    isSinglePlayer() {
        return false;
    }

    #onHome(_req: Request, res: Response) {
        this.createExpireResponse(res, "text/html").status(200).send(this.#pageHome);
    }

    setupRoutes() {
        Logger.info("Setting up routes for " + this.#contextRoot + " and " + this.#contextPlay);

        this.getServerRouteInstance().use(this.#contextRoot, this.#pAuthentication.signInFromPWA);

        /**
         * Home
         */
        this.getServerRouteInstance().get(this.#contextRoot, this.#onHome.bind(this));

        /**
         * Verify game room and add to request object
         */
        this.getServerRouteInstance().use(this.#contextPlay + ":room", this.onVerifyGameRoomParam.bind(this));

        this.getServerRouteInstance().post(this.#contextPlay + ":room/login",
            this.#onLoginAlready.bind(this),
            this.#gameJoinSupported.bind(this),
            this.#onRoomIsTooCrowded.bind(this),
            this.#onLoginCheck.bind(this)
        );

        if (this.#addwatch) {
            this.getServerRouteInstance().post("/watch/:room",
                this.onVerifyGameRoomParam.bind(this),
                this.#onWatchRegister.bind(this)
            );
            this.getServerRouteInstance().get("/watch/:room",
                this.#pAuthentication.signInFromPWA,
                this.onVerifyGameRoomParam.bind(this),
                this.#onRedirectWatch.bind(this)
            );
            this.getServerRouteInstance().get("/join/:room",
                this.#pAuthentication.signInFromPWA,
                this.onVerifyGameRoomParam.bind(this),
                this.#onRedirectJoin.bind(this)
            );
        }

        this.getServerRouteInstance().post(this.#contextPlay + ":room/invite/:token/:type/:allow", this.#onJoinTable.bind(this));

        this.getServerRouteInstance().get(this.#contextPlay + ":room/accessibility", this.#onSendAccessibility.bind(this));

        /**
         * Reject player access to table
         */
        this.getServerRouteInstance().post(this.#contextPlay + ":room/remove/:id/:token", this.#onRemovePlayer.bind(this));

        this.getServerRouteInstance().get(this.#contextPlay + ":room/player",
            this.#onLoginAlready.bind(this),
            this.#sendIsNotPresent.bind(this)
        );

        this.getServerRouteInstance().get(this.#contextPlay + ":room/watcher",
            this.#onIsWatching.bind(this),
            this.#sendIsNotPresent.bind(this)
        );

        /**
         * Player joins a table.
         * 
         * The room name has to be ALPHANUMERIC. Otherwise, the requets will fail.
         */
        this.getServerRouteInstance().get(this.#contextPlay + ":room",
            this.#onValidateGameCookies.bind(this),
            this.#onPlayAtTable.bind(this),
            this.#onAfterPlayAtTableSuccessCreate.bind(this),
            this.#onAfterPlayAtTableSuccessJoin.bind(this)
        );
    }

    #allowDeckSelection(res: Response, room: string) {
        res.redirect("/#/play/" + room);
    }

    #onValidateGameCookies(req: any, res: Response, next: NextFunction) {
        /** 
         * Check if player has never been in this room before.
         * Forward to login page for deck selection and display name
         */
        if (!this.validateCookies(req)) {
            /** avoid redirect. We know the user cannot join this room. Hence, remove any room-related cookie */
            this.clearRoomCookies(req, res);
            this.#allowDeckSelection(res, req.room);
        }
        else
            next();
    }

    validateDeck(jDeck: DeckValidate, roomSize: number, randomHazards: boolean = false) {
        /**
         * Validate Deck first
         */
        return CardDataProvider.validateDeck(jDeck);
    }

    getAvatar(jDeck: DeckValidate) {
        if (this.isArda() || this.isSinglePlayer())
            return "";
        else
            return CardDataProvider.getAvatar(jDeck);
    }

    #onIsWatching(req: any, res: Response, next: NextFunction) {
        const room = req.room;
        const userid = this.#requireUserId(req);
        if (this.getRoomManager().isActiveWatcher(room, userid))
            res.status(204).send("");
        else
            next();
    }

    #playerIsAlreadyWatching(req: Request, room: string) {
        const userid = this.#requireUserId(req);
        return this.getRoomManager().isActiveWatcher(room, userid);
    }

    #playerIsAlreadyPlaying(req: Request, room: string) {
        const userid = this.#requireUserId(req);
        return this.getRoomManager().isActivePlayer(room, userid);
    }

    #onRedirectWatch(req: any, res: Response) {
        res.header("Cache-Control", "no-store");
        res.status(200).send(this.#pageWatch
            .replace("{room}", req.room)
            .replace("{room}", req.room)
            .replace("{room}", req.room));
    }

    #onRedirectJoin(req: any, res: Response) {
        res.header("Cache-Control", "no-store");
        res.status(200).send(this.#pageJoin
            .replace("{room}", req.room)
            .replace("{room}", req.room)
            .replace("{room}", req.room));
    }

    #onWatchRegister(req: any, res: Response) {
        try {
            const room = req.room;
            if (!this.getRoomManager().roomExists(room))
                throw new Error("Room does not exist");

            if (this.#playerIsAlreadyPlaying(req, room))
                throw new Error("You cannot watch a game you are playing");

            if (!this.#playerIsAlreadyWatching(req, room) && !this.getRoomManager().grantAccess(room, false)) {
                this.#createErrorJsonResponse(403, "Game is locked by host", res);
                return;
            }

            /**
             * assert the username is alphanumeric only
             */
            const userId = this.#requireUserId(req);
            const displayname = "v" + userId;

            /** add player to lobby */
            const lNow = this.getRoomManager().addSpectator(room, userId, displayname);

            /** proceed to lobby */
            this.#updateCookieUser(res, userId, displayname);

            const jSecure = { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('joined', lNow, jSecure);
            res.status(204).send("");
        }
        catch (e: any) {
            Logger.warn(e);
            console.warn(e);
            this.#createErrorJsonResponse(500, e.message ?? "Could not watch", res);
        }
    }

    #gameJoinSupported(req: any, res: Response, next: NextFunction) {
        const nPlayers = this.getRoomManager().countPlayersInRoom(req.room);
        if (nPlayers < 1)
            next();
        else if (!this.isSinglePlayer() && this.getRoomManager().grantAccess(req.room, true))
            next();
        else
            this.#createErrorJsonResponse(400, "Game is locked by host.", res);
    }

    #createErrorJsonResponse(code: number, message: string, res: Response) {
        this.createExpireResponse(res).status(code).json({
            message: message
        });
    }

    #onRoomIsTooCrowded(req: any, res: Response, next: NextFunction) {
        const room = req.room;
        if (this.getRoomManager().tooManyRooms() || this.getRoomManager().tooManyPlayers(room))
            this.#createErrorJsonResponse(400, "Too many rooms or too many players in room " + room, res);
        else
            next();
    }

    #onLoginAlready(req: any, res: Response, next: NextFunction) {
        const userid = this.#requireUserId(req);
        const room = req.room ?? "";
        if (this.getRoomManager().isActivePlayer(room, userid))
            res.status(204).send("");
        else
            next();
    }

    #sendIsNotPresent(_req: Request, res: Response) {
        this.#createErrorJsonResponse(404, "Player is not pesent.", res);
    }

    #onLoginCheck(req: any, res: Response) {
        try {
            const room = req.room;
            const jData = req.body;
            const displayname = jData.name;
            const useDCE = jData.dce === true;
            const randomHazardDeck = this.isSinglePlayer() && jData.randomHazards === true;

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname))
                throw new Error("Your display name is invalid.");

            /**
             * Validate Deck first
             */
            const roomSize = this.getRoomManager().countPlayersInRoom(room);
            const jDeck = jData.deck === undefined ? null : this.validateDeck(jData.deck, roomSize, randomHazardDeck);
            if (jDeck === null)
                throw new Error("Your deck is empty and cannot be used");

            const avatar = this.getAvatar(jDeck);

            /** Now, check if there already is a game for this Room */
            const userId = this.#requireUserId(req);

            const roomOptions = {
                arda: this.isArda(),
                singleplayer: this.isSinglePlayer(),
                dce: useDCE,
                jitsi: false,
                avatar: avatar
            };

            /** add player to lobby */
            const lNow = this.getRoomManager().addToLobby(room, userId, displayname, jDeck, roomOptions);
            if (lNow === -1)
                throw new Error("Empty game");

            /** proceed to lobby */
            this.#updateCookieUser(res, userId, displayname);

            const jSecure = {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
            };

            res.cookie('room', room, jSecure);
            res.cookie('joined', lNow, jSecure);
            res.status(204).send("");
        }
        catch (e: any) {
            Logger.error(e.message);
            console.error(e.message);

            this.#createErrorJsonResponse(500, e.message, res);
        }
    }

    #hasValidUserId(req: Request) {
        if (req.cookies.userId === undefined || req.cookies.userId === null)
            return false;
        else
            return req.cookies.userId.trim().length === UTILS.uuidLength()
    }

    #requireUserId(req: Request) {
        if (this.#hasValidUserId(req))
            return req.cookies.userId;
        else
            return UTILS.generateUuid();
    }

    #updateCookieUser(res: Response, userId: string, displayName: string) {
        const jSecure = { maxAge: 365 * 60 * 60 * 1000, httpOnly: true, secure: true };
        res.cookie('userId', userId, jSecure);

        if (displayName !== undefined && displayName !== "")
            res.cookie('username', displayName.trim(), jSecure);
    }

    #onSendAccessibility(req: any, res: Response) {
        const data = {
            player: this.getRoomManager().grantAccess(req.room, true),
            visitor: this.getRoomManager().grantAccess(req.room, false)
        }

        this.createExpireResponse(res, "application/json").send(data).status(200);
    }

    #onJoinTable(req: Request, res: Response) {
        if (!this.getRoomManager().isGameHost(req.params.room, req.params.token)) {
            res.sendStatus(401);
            return;
        }

        const type = req.params.type;
        if (type === "visitor" || type === "player")
            this.getRoomManager().updateAccess(req.params.room, type, req.params.allow === "true");

        this.createExpireResponse(res).sendStatus(204);
    }

    #onRemovePlayer(req: Request, res: Response) {
        if (this.getRoomManager().isGameHost(req.params.room, req.params.token)) {
            this.getRoomManager().removePlayerFromGame(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    #onPlayAtTable(req: any, res: Response, next: NextFunction) {
        const room = req.room;

        /**
         * Assert that the user really accepted
         */
        const bForwardToGame = this.getRoomManager().isAccepted(room, req.cookies.userId);
        if (bForwardToGame !== true) {
            this.#allowDeckSelection(res, room);
            return;
        }

        const dice = req.cookies.dice ?? "";

        /**
         * At this point, the user is allowed to enter the room.
         * 
         * The user may have joined with a second window. In that case, they would have 2 active sessions open.
         */
        const lTimeJoined = this.getRoomManager().updateEntryTime(room, req.cookies.userId);
        if (lTimeJoined === 0) // game does not exist
        {
            this.#allowDeckSelection(res, room);
            return;
        }

        /* Force close all existing other sessions of this player */
        res.cookie('joined', lTimeJoined, { httpOnly: true, secure: true });

        this.clearSocialMediaCookies(res);

        this.getRoomManager().updateDice(room, req.cookies.userId, dice);
        this.createExpireResponse(res, "text/html").status(200);
        const list = this.getRoomManager().loadGamePage(
            room, this.sanatiseCookieValue(req.cookies.userId),
            this.sanatiseCookieValue(req.cookies.username),
            lTimeJoined,
            dice,
            this.#getLanguageParam(req)
        );

        for (let part of list)
            res.write(part);

        res.end();
        next();
    }

    #getLanguageParam(req: any) {
        const lang = typeof req._langauge === "string" ? req._langauge : "";
        switch (lang) {
            case "es":
            case "fr":
            case "en":
                return lang;
            default:
                return "en";
        }
    }

    #onAfterPlayAtTableSuccessJoin(req: any, res: Response) {
        EventManager.trigger("game-joined", req._roomName, this.isArda(), req._socialName);
    }

    #onAfterPlayAtTableSuccessCreate(req: any, _res: Response, next: NextFunction) {
        if (req._roomCount !== 1)
            next();
        else
            EventManager.trigger("game-created", req._roomName, this.isArda(), req._socialName);
    }

}
