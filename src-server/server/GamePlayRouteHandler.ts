import Logger from "../Logger";
import * as UTILS from "../meccg-utils";
import * as EventManager from "../EventManager";
import * as Authentication from "../authentication";
import { CardDataProvider } from "../plugins/CardDataProvider";
import GamePlayRouteHandlerUtil from "./GamePlayRouteHandlerUtil";
import { NextFunction, Request, Response } from "express";
import { join } from "path";
import { DeckValidate } from "../plugins/Types";
import { getRootFolder } from "../Configuration";

export default class GamePlayRouteHandler extends GamePlayRouteHandlerUtil
{
    #pAuthentication = Authentication;

    #contextRoot:string;
    #contextPlay:string;

    #pageHome:string;
    #pageLogin:string;
    #pageLobby:string;
    #pageWatch:string;

    constructor(sContext:string, sPageLogin:string, sLobbyPage:string)
    {
        super();

        this.#contextPlay = sContext + "/";
        this.#contextRoot = sContext;

        this.#pageHome = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/home.html"));
        this.#pageLogin = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/" + sPageLogin));
        this.#pageLobby = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/" + sLobbyPage));
        this.#pageWatch = GamePlayRouteHandlerUtil.readFile(join(getRootFolder(), "/pages/login-watch.html"));
    }

    isArda()
    {
        return false;
    }

    isSinglePlayer()
    {
        return false;
    }

    onHome(_req:Request, res:Response)
    {
        this.createExpireResponse(res, "text/html").status(200).send(this.#pageHome);
    }

    setupRoutes()
    {
        Logger.info("Setting up routes for " + this.#contextRoot + " and " + this.#contextPlay);

        this.getServerRouteInstance().use(this.#contextRoot, this.#pAuthentication.signInFromPWA);

        /**
         * Home
         */
        this.getServerRouteInstance().get(this.#contextRoot, this.onHome.bind(this));

        /**
         * Verify game room and add to request object
         */
        this.getServerRouteInstance().use(this.#contextPlay + ":room", this.onVerifyGameRoomParam.bind(this));
        
        /**
         * The LOGIN page.
         * 
         * Here, the user will provide a display name used in the game and
         * also upload their deck.
         * 
         * The page forwards to a login page which will create all cookies.
         */
        this.getServerRouteInstance().get(this.#contextPlay + ":room/login",
            this.redirectToGameIfMember.bind(this),
            this.gameJoinSupported.bind(this), 
            this.onLogin.bind(this)
        );
        
        /**
         * Perform the login and set all necessary cookies.
         * 
         * The room will only allow ALPHANUMERIC characters and the display name will also be
         * checked to be alphanumeric only to avoid any HTML injection possibilities.
         * 
         */
         this.getServerRouteInstance().post(this.#contextPlay + ":room/login/check", 
            this.gameJoinSupported.bind(this), 
            this.onRoomIsTooCrowded.bind(this),
            this.onLoginCheck.bind(this),
            this.redirectToRoom.bind(this)
        );

        /**
         * Player enters the lobby to wait until addmitted to the table.
         * 
         * If the player entering this lobby is the first player (or allowed to access the table),
         * the player will be redirected to the game.
         * 
         * If the player does not yet have logged in, redirect to login.
         * Otherwise, simply show the waiting screen
         */
         this.getServerRouteInstance().get(this.#contextPlay + ":room/lobby", this.onValidateGameCookies.bind(this), this.onLobby.bind(this));

        /**
         * Get a list of players who are waiting to join this game
         
         this.getServerRouteInstance().get(this.#contextPlay + ":room/waiting/:token", this.onWaiting.bind(this));
        */
        this.getServerRouteInstance().post(this.#contextPlay + ":room/invite/:token/:type/:allow", this.onJoinTable.bind(this));

        this.getServerRouteInstance().get(this.#contextPlay + ":room/accessibility", this.onSendAccessibility.bind(this));

        /**
         * Allow player to access the table
         *
         this.getServerRouteInstance().post(this.#contextPlay + ":room/invite/:id/:token", this.onJoinTable.bind(this));

        /**
         * Reject player access to table
         this.getServerRouteInstance().post(this.#contextPlay + ":room/reject/:id/:token", this.onReqjectEntry.bind(this));
         */

        /**
         * Reject player access to table
         */
         this.getServerRouteInstance().post(this.#contextPlay + ":room/remove/:id/:token", this.onRemovePlayer.bind(this));

        /**
         * Get the status of a given player (access denied, waiting, addmitted)
         */
        this.getServerRouteInstance().get(this.#contextPlay + ":room/status/:id", this.onPlayerStatus.bind(this));

        /**
         * Setup spectator
         */
        this.getServerRouteInstance().get(this.#contextPlay + ":room/watch", this.onWatchSupported.bind(this), this.onWatch.bind(this));

        /**
         * Perform the login and set all necessary cookies.
         * 
         * The room will only allow ALPHANUMERIC characters and the display name will also be
         * checked to be alphanumeric only to avoid any HTML injection possibilities.
         * 
         */
         this.getServerRouteInstance().post(this.#contextPlay + ":room/watch/check", 
            this.onWatchSupported.bind(this), 
            this.onWatchCheck.bind(this),
            this.redirectToLobby.bind(this)
        );

        /**
         * Player joins a table.
         * 
         * The room name has to be ALPHANUMERIC. Otherwise, the requets will fail.
         */
         this.getServerRouteInstance().get(this.#contextPlay + ":room", 
            this.onValidateGameCookies.bind(this), 
            this.onPlayAtTable.bind(this), 
            this.onAfterPlayAtTableSuccessSocial.bind(this),
            this.onAfterPlayAtTableSuccessCreate.bind(this),
            this.onAfterPlayAtTableSuccessJoin.bind(this)
        );
    }

    onValidateGameCookies(req:any, res:Response, next:NextFunction)
    {
        /** 
         * Check if player has never been in this room before.
         * Forward to login page for deck selection and display name
         */
        if (!this.validateCookies(req)) 
        {
            /** avoid redirect. We know the user cannot join this room. Hence, remove any room-related cookie */
            this.clearRoomCookies(req, res);
            res.redirect(this.#contextPlay + req.room + "/login");
        }
        else
            super.onValidateGameCookies(req, res, next);
    }

    onLogin(req:Request, res:Response)
    {
        /** no cookies available */
        if (req.cookies.userId !== undefined && req.cookies.userId !== null && req.cookies.userId.length === UTILS.uuidLength())
        {
            /* already in the game. redirect to game room */
            const status = this.getRoomManager().isAccepted(req.params.room, req.cookies.userId)
            if (status !== null && status)
            {
                res.redirect(this.#contextPlay + req.params.room);
                return;
            }
        }

        const sUser = req.cookies.username === undefined ? "" : this.sanatiseCookieValue(req.cookies.username);

        this.clearCookies(req, res);
        this.createExpireResponse(res, "text/html").status(200).send(
            this.#pageLogin
                .replace("{DISPLAYNAME}", sUser)
                .replace("/media/assets/favicon.png", "/data/favicon/" + req.params.room)
                .replace("/pwa/icon-512.png", "/data/favicon/" + req.params.room)
        );
    }

    validateDeck(jDeck:DeckValidate, randomHazards:boolean = false)
    {
        /**
         * Validate Deck first
         */
        return CardDataProvider.validateDeck(jDeck);
    }

    getAvatar(jDeck:DeckValidate)
    {
        if (this.isArda() || this.isSinglePlayer())
            return  "";
        else
            return CardDataProvider.getAvatar(jDeck);
    }

    redirectToGameIfMember(req:any, res:Response, next:NextFunction)
    {
        if (this.userIsAlreadyInGame(req))
            this.createExpireResponse(res, 'text/plain').redirect(this.#contextPlay + req.room);
        else
            next();
    }

    onWatchSupported(req:any, res:Response, next:NextFunction)
    {
        if (this.getRoomManager().grantAccess(req.room, false))
            next();
        else
            this.createExpireResponse(res).redirect("/error/denied");
    }

    onWatchCheck(req:any, res:Response, next:NextFunction)
    {
        try 
        {
            const room = req.room;

            const jData = JSON.parse(req.body.data);
            const displayname = jData.name;
            const shareMessage = typeof jData.share === "string" ? jData.share : "";

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname))
                throw new Error("Invalid data");

            if (!this.getRoomManager().roomExists(room))
                throw new Error("Room does not exist");

            const userId = this.requireUserId(req);

            /** add player to lobby */
            const lNow = this.getRoomManager().addSpectator(room, userId, displayname);

            /** proceed to lobby */
            this.updateCookieUser(res, userId, displayname);

            const jSecure = { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('joined', lNow, jSecure);
            res.cookie('socialMedia', shareMessage, jSecure);

            next();
        }
        catch (e) 
        {
            Logger.error(e);
            this.createExpireResponse(res).redirect("/error/login");
        }
    }

    redirectToLobby(req:any, res:Response)
    {
        this.createExpireResponse(res, 'text/plain').redirect("/play/" + req.room + "/lobby");
    }

    gameJoinSupported(req:any, res:Response, next:NextFunction)
    {
        const nPlayers = this.getRoomManager().countPlayersInRoom(req.room);
        if (nPlayers < 1)
            next();
        else if (!this.isSinglePlayer() && this.getRoomManager().grantAccess(req.room, true))
            next();
        else
            this.createExpireResponse(res).redirect("/error/denied");
    }

    onRoomIsTooCrowded(req:any, res:Response, next:NextFunction)
    {
        const room = req.room;
        if (this.getRoomManager().tooManyRooms() || this.getRoomManager().tooManyPlayers(room))
        {
            Logger.info("Too many rooms or too many players in room " + room);
            this.createExpireResponse(res).redirect("/error/login");
        }
        else
            next();
    }

    onLoginCheck(req:any, res:Response, next:NextFunction)
    {
        try 
        {
            const room = req.room;
            const jData = JSON.parse(req.body.data);
            const displayname = jData.name;
            const useDCE = jData.dce === true;
            const useJitsi = jData.jitsi === true;
            const shareMessage = typeof jData.share === "string" ? jData.share : "";
            const randomHazardDeck = this.isSinglePlayer() && jData.randomHazards === true;

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname) || jData.deck === undefined)
                throw new Error("Invalid data");

            /**
             * Validate Deck first
             */
            const jDeck = this.validateDeck(jData.deck, randomHazardDeck);
            if (jDeck === null)
                throw new Error("Invalid Deck");

            const avatar = this.getAvatar(jData.deck);

            /** Now, check if there already is a game for this Room */
            const userId = this.requireUserId(req);

            const roomOptions = {
                arda: this.isArda(),
                singleplayer: this.isSinglePlayer(),
                dce: useDCE,
                jitsi:  useJitsi,
                avatar: avatar
            };

            /** add player to lobby */
            const lNow = this.getRoomManager().addToLobby(room, userId, displayname, jDeck, roomOptions);
            if (lNow === -1)
            {
                /** ghost game */
                this.createExpireResponse(res).redirect("/");
                return;
            }

            /** proceed to lobby */
            this.updateCookieUser(res, userId, displayname);

            const jSecure = { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('joined', lNow, jSecure);
            res.cookie('socialMedia', shareMessage, jSecure);

            next();
        }
        catch (e) 
        {
            Logger.error(e);
            console.error(e);
            this.createExpireResponse(res).redirect("/error/login");
        }
    }

    redirectToRoom(req:any, res:Response)
    {
        this.createExpireResponse(res, 'text/plain').redirect(this.#contextPlay + req.room);
    }

    hasValidUserId(req:Request)
    {
        if (req.cookies.userId === undefined || req.cookies.userId === null)
            return false;
        else
            return req.cookies.userId.trim().length === UTILS.uuidLength()
    }

    requireUserId(req:Request)
    {
        if (this.hasValidUserId(req))
            return req.cookies.userId;

        const id = UTILS.generateUuid();
        Logger.info("No userid set yet. Creating new one; " + id);
        return id;
    }

    updateCookieUser(res:Response, userId:string, displayName:string)
    {
        const jSecure = { maxAge: 365 * 60 * 60 * 1000, httpOnly: true, secure: true };
        res.cookie('userId', userId, jSecure);
    
        if (displayName !== undefined && displayName !== "")
            res.cookie('username', displayName.trim(), jSecure);
    }

    onWatch(req:any, res:Response)
    {
        this.clearCookies(req, res);
        
        if (!this.getRoomManager().roomExists(req.room))
            res.redirect("/error/nosuchroom");
        else
            this.createExpireResponse(res, 'text/html').send(
                this.#pageWatch
                    .replace("/media/assets/favicon.png", "/data/favicon/" + req.room)
                    .replace("/pwa/icon-512.png", "/data/favicon/" + req.room)
            ).status(200);
    }

    onLobby(req:any, res:Response)
    {
        if (this.getRoomManager().isAccepted(req.room, req.cookies.userId))  /* if player is admin or accepted, simply redirect to game room */
        {
            res.redirect(this.#contextPlay + req.room);
        }
        else 
        {
            this.getRoomManager().sendJoinNotification(req.room);
            this.createExpireResponse(res, "text/html").send(this.#pageLobby.replace("{room}", this.sanatiseCookieValue(req.room)).replace("{id}", this.sanatiseCookieValue(req.cookies.userId))).status(200);
        }
    }

    onWaiting(req:Request, res:Response)
    {
        if (this.getRoomManager().isGameHost(req.params.room, req.params.token))
        {
            let data = {
                waiting: this.getRoomManager().getWaitingList(req.params.room),
                players : this.getRoomManager().getPlayerList(req.params.room)
            }

            this.createExpireResponse(res, "application/json").send(data).status(200);
        }
        else
            res.sendStatus(401);
    }

    onSendAccessibility(req:any, res:Response)
    {
        const data = {
            player: this.getRoomManager().grantAccess(req.room, true),
            visitor: this.getRoomManager().grantAccess(req.room, false)
        } 

        this.createExpireResponse(res, "application/json").send(data).status(200);
    }

    onJoinTable(req:Request, res:Response)
    {
        if (!this.getRoomManager().isGameHost(req.params.room, req.params.token))
        {
            res.sendStatus(401);
            return;
        }

        const type = req.params.type;
        if (type === "visitor" || type === "player")
            this.getRoomManager().updateAccess(req.params.room, type, req.params.allow === "true");

        this.createExpireResponse(res).sendStatus(204);
    }

    onReqjectEntry(req:Request, res:Response)
    {
        if (this.getRoomManager().isGameHost(req.params.room, req.params.token))
        {
            this.getRoomManager().rejectEntry(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    onRemovePlayer(req:Request, res:Response)
    {
        if (this.getRoomManager().isGameHost(req.params.room, req.params.token))
        {
            this.getRoomManager().removePlayerFromGame(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    onPlayerStatus(req:Request, res:Response)
    {
        let _obj = {
            status: "denied",
            room: req.params.room
        };

        let status = this.getRoomManager().isAccepted(req.params.room, req.params.id);
        if (status !== null)
            _obj.status = status ? "ok" : "wait";

        this.createExpireResponse(res, 'application/json').send(_obj).status(200);
    }

    onPlayAtTable(req:any, res:Response, next:NextFunction)
    {
        const room = req.room;

        /**
         * Assert that the user really accepted
         */
        const bForwardToGame = this.getRoomManager().isAccepted(room, req.cookies.userId);
        if (bForwardToGame === null) 
        {   
            res.redirect(this.#contextPlay + room + "/login");
            return;
        }
        else if (!bForwardToGame) 
        {
            res.redirect(this.#contextPlay + room + "/lobby");
            return;
        }

        const dice = req.cookies.dice ?? "";
        
        /**
         * At this point, the user is allowed to enter the room.
         * 
         * The user may have joined with a second window. In that case, they would have 2 active sessions open.
         */
        const lTimeJoined = this.getRoomManager().updateEntryTime(room, req.cookies.userId);
        if (lTimeJoined === 0) 
        {
            res.redirect(this.#contextPlay + room + "/login");
        }
        else
        {
            /* Force close all existing other sessions of this player */
            res.cookie('joined', lTimeJoined, { httpOnly: true, secure: true });

            req._doShare = typeof req.cookies.socialMedia === "string" ? req.cookies.socialMedia : "";

            this.clearSocialMediaCookies(res);
    
            this.getRoomManager().updateDice(room, req.cookies.userId, dice);
            this.createExpireResponse(res, "text/html").send(this.getRoomManager().loadGamePage(room, this.sanatiseCookieValue(req.cookies.userId), this.sanatiseCookieValue(req.cookies.username), lTimeJoined, dice)).status(200);

            next();
        }
    }

    onAfterPlayAtTableSuccessJoin(req:any, res:Response)
    {
        EventManager.trigger("game-joined", req._roomName, this.isArda(), req._socialName);
    }

    onAfterPlayAtTableSuccessSocial(req:any, _res:Response, next:NextFunction)
    {
        if (this.isSinglePlayer() || !req._doShare)
            return;
        
        /* enforece lowercase room, is always alphanumeric */
        const room = req.params.room.toLocaleLowerCase();
        if (!this.getRoomManager().roomExists(room))
            return;

        const roomCount = this.getRoomManager().countPlayersInRoom(room); 
        const noSharing = req._doShare !== "openchallenge" && req._doShare !== "visitor";

        let proceedNext = !noSharing;
        if (roomCount === 1)
            this.getRoomManager().setAllowSocialMediaShare(room, !noSharing);
        else 
            proceedNext = this.getRoomManager().getAllowSocialMediaShare(room) && !noSharing;

        if (proceedNext)
        {
            req._roomCount = roomCount;
            req._roomName = room;
            req._socialName = this.sanatiseCookieValue(req.cookies.username);
            next();    
        }
    }
    
    onAfterPlayAtTableSuccessCreate(req:any, _res:Response, next:NextFunction)
    {
        if (req._roomCount !== 1)
            next();
        else if (req._doShare === "openchallenge")
            EventManager.trigger("game-created-openchallenge", req._roomName, this.isArda(), req._socialName);
        else
            EventManager.trigger("game-created", req._roomName, this.isArda(), req._socialName);
    }

}
