import TurnTimer from "./TurnTimer";

import GamePlayers from "./GamePlayers";
import SaveGameEvaluation from "./SaveGameEvaluation";

import Logger from "../Logger";
import { TDeckCard } from "./DeckCommons";
import { CardDataProvider } from "../plugins/CardDataProvider";

export default class GameStandard extends GamePlayers
{
    #fnEndGame:Function|null = null;
    #timeTimer = new TurnTimer();

    setCallbackOnRestoreError(fn:Function)
    {
        if (fn !== undefined && typeof fn === "function")
            this.#fnEndGame = fn;
    }
    
    init()
    {
        super.init();

        this.getMeccgApi().addListener("/game/card/state/set", this.onGameCardStateSet.bind(this)); 
        this.getMeccgApi().addListener("/game/card/state/glow", this.onGameStateGlow.bind(this));
        this.getMeccgApi().addListener("/game/card/state/mark", this.onGameStateMark.bind(this));
        this.getMeccgApi().addListener("/game/card/state/reveal", this.onGameCardStateReveal.bind(this));
        this.getMeccgApi().addListener("/game/card/state/hand", this.onGameCardStateInHand.bind(this));
        this.getMeccgApi().addListener("/game/card/draw", this.onCardDraw.bind(this));
        this.getMeccgApi().addListener("/game/card/draw/single", this.onCardDrawSingle.bind(this));

        this.getMeccgApi().addListener("/game/card/store", this.onCardStore.bind(this));
        this.getMeccgApi().addListener("/game/card/move", this.onCardMove.bind(this));
        this.getMeccgApi().addListener("/game/card/discard", this.onCardDiscard.bind(this));
        this.getMeccgApi().addListener("/game/card/hand", this.onCardInHand.bind(this));
        this.getMeccgApi().addListener("/game/card/sites", this.onCardSites.bind(this));
        this.getMeccgApi().addListener("/game/card/token", this.onCardToken.bind(this));
        this.getMeccgApi().addListener("/game/card/add", this.onGameAddCardsToGame.bind(this)); /* add a list of cards to the sideboard */
        this.getMeccgApi().addListener("/game/card/import", this.onCardImport.bind(this));
        this.getMeccgApi().addListener("/game/card/updatetype", this.onCardTypeUpdate.bind(this));
        
        this.getMeccgApi().addListener("/game/stagingarea/add/card", this.onStagingAreaAddCard.bind(this));

        this.getMeccgApi().addListener("/game/save", this.globalSaveGame.bind(this));
        this.getMeccgApi().addListener("/game/save/auto", this.globalSaveGameAuto.bind(this));
        this.getMeccgApi().addListener("/game/restore", this.globalRestoreGame.bind(this));
        
        this.getMeccgApi().addListener("/game/dices/roll", this.rollDices.bind(this));
        this.getMeccgApi().addListener("/game/dices/set", this.setDices.bind(this));

        this.getMeccgApi().addListener("/game/phase/set", this.phase.bind(this)); /* Set the current phase of the game turn */
        
        this.getMeccgApi().addListener("/game/view-cards/reveal-pile", this.viewReveal.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/list", this.viewList.bind(this));
        
        this.getMeccgApi().addListener("/game/view-cards/list/close", this.viewCloseList.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/shuffle", this.viewShuffle.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/offer-reveal", this.viewOfferReveal.bind(this));
        this.getMeccgApi().addListener("/game/view-cards/offer-remove", this.viewOfferRemove.bind(this));
        
        this.getMeccgApi().addListener("/game/deck/reveal/start", this.onDeckRevealStart.bind(this));
        this.getMeccgApi().addListener("/game/deck/reveal/cancel", this.onDeckRevealCancel.bind(this));
        this.getMeccgApi().addListener("/game/deck/reveal/remove", this.onDeckRevealRemove.bind(this));
        this.getMeccgApi().addListener("/game/deck/reveal/offer", this.onDeckRevealOffer.bind(this));
        this.getMeccgApi().addListener("/game/deck/reveal/accept", this.onDeckRevealAccept.bind(this));
        this.getMeccgApi().addListener("/game/deck/reveal/perform", this.onDeckRevealPerform.bind(this));
        this.getMeccgApi().addListener("/game/deck/reveal/self", this.onDeckRevealSelfPerform.bind(this));
        this.getMeccgApi().addListener("/game/deck/discard/playdeck", this.onReshuffleDiscardIntoPlaydeck.bind(this));
        this.getMeccgApi().addListener("/game/deck/shuffle/handintoplaydeck", this.#onReshuffleHandIntoPlaydeck.bind(this));

        this.getMeccgApi().addListener("/game/company/create", this.onGameCompanyCreate.bind(this));
        this.getMeccgApi().addListener("/game/company/arrive", this.onGameCompanyArrives.bind(this));
        this.getMeccgApi().addListener("/game/company/returntoorigin", this.onGameCompanyReturnsToOrigin.bind(this));
        this.getMeccgApi().addListener("/game/company/highlight", this.onGameCompanyHighlight.bind(this));
        this.getMeccgApi().addListener("/game/company/markcurrently", this.onGameCompanyMarkAsCurrent.bind(this));
        this.getMeccgApi().addListener("/game/company/location/set-location", this.onGameCompanyLocationSetLocation.bind(this));
        this.getMeccgApi().addListener("/game/company/location/reveal", this.onGameCompanyLocationReveal.bind(this));
        this.getMeccgApi().addListener("/game/company/location/attach", this.onGameCompanyLocationAttach.bind(this));
        this.getMeccgApi().addListener("/game/company/location/choose", this.onGameCompanyLocationChoose.bind(this));
        this.getMeccgApi().addListener("/game/company/location/housekeeping", this.#onGameCompanyLocationHousekeeping.bind(this));

        this.getMeccgApi().addListener("/game/score/show", this.scoreShow.bind(this));
        this.getMeccgApi().addListener("/game/score/update", this.scoreUpdate.bind(this));
        this.getMeccgApi().addListener("/game/score/add", this.scoreAdd.bind(this));
        this.getMeccgApi().addListener("/game/score/set", this.scoreSet.bind(this));
        this.getMeccgApi().addListener("/game/score/doublemisc", this.scoreDoubleMisc.bind(this));
        this.getMeccgApi().addListener("/game/score/onering", this.scoreDecisiveVictory.bind(this));
        

        this.getMeccgApi().addListener("/game/draw/company", this.onGameDrawCompany.bind(this)); /* draw a single company by its id */
        this.getMeccgApi().addListener("/game/draw/companies", this.onGameDrawCompanies.bind(this));

        this.getMeccgApi().addListener("/game/character/host-card", this.onCharacterHostCard.bind(this));
        this.getMeccgApi().addListener("/game/character/receive-card", this.onCharacterReceiveCard.bind(this));
        this.getMeccgApi().addListener("/game/character/join/character", this.onCharacterJoinCharacter.bind(this));
        this.getMeccgApi().addListener("/game/character/join/company", this.onCharacterJoinCompany.bind(this));
        this.getMeccgApi().addListener("/game/character/list", this.onGetCharacters.bind(this));
        
        this.getMeccgApi().addListener("/game/discardopenly", this.onDiscardOpenly.bind(this));

        this.getMeccgApi().addListener("/game/watch/hand", this.onWatchUpdateHand.bind(this));
        this.getMeccgApi().addListener("/game/watch/victory", this.onWatchUpdateVictory.bind(this));

        this.getMeccgApi().addListener("/game/avatar/set", this.onAvatarSet.bind(this));
        this.getMeccgApi().addListener("/game/players/reorder", this.onChangePlayerOrder.bind(this));
        this.getMeccgApi().addListener("/game/changebrowser", this.onChangePlayerBrowser.bind(this));
        this.getMeccgApi().addListener("/game/company/position-board", this.#onCompanyPositionBoard.bind(this))
        this.getMeccgApi().addListener("/game/spectatos", this.#onSendSpectators.bind(this));
    }

    #onSendSpectators(userid: string, _socket:any, obj:any)
    {
        this.getMeccgApi().publish("/game/spectatos", userid, obj);
    }

    onChangePlayerBrowser(userid: string, socket:any, _obj:any)
    {
        const room = this.getMeccgApi().getRoom();
        const token = this.allowTransferBrowser(userid);

        this.replyToPlayer("/game/changebrowser", socket, {
            room: room,
            token: token
        });        
    }

    /**
     * Send a new card to the FRONTEND GUI hand list
     * @param {String} player
     * @param {String} uuid
     * @param {String} code
     * @param {String} type
     * @param {Integer} count
     */
    drawCard(playerid:string, uuid:string, code:string, type:string, count:number)
    {
        this.getMeccgApi().publish("/game/card/draw", playerid, {
            code: code, 
            uuid: uuid, 
            count: count, 
            type: type, 
            owner: "", 
            playerid: playerid
        });
    }

    updateHandCountersPlayerAll()
    {
        for (let id of this.getPlayerIds())
            this.updateHandCounterPlayerOnly(id);
    }

    updateHandCounterPlayerOnly(player:string)
    {
        const size = this.getPlayboardManager().Size(player);
        if (size === null)
            return;
            
        const nScore = this.getPlayerScore(player);
        this.publishToPlayers("/game/update-deck-counter/player/generics", player, {
            playdeck: size.playdeck,
            sideboard: size.sideboard,
            discard: size.discard,
            hand: size.hand,
            victory: nScore,
            player: player
        });
    }

    updateHandCountersPlayer(player:string)
    {
        if (typeof player === "undefined")
            player = this.getCurrentPlayerId();

        this.updateHandCounterPlayerOnly(player);
        this.updateHandCounterOnlyPlayer(player);
    }

    updateHandCounterOnlyPlayer(player:string)
    {
        let size = this.getPlayboardManager().Size(player);
        if (size === null)
            return;

        const nScore = this.getPlayerScore(player);
        this.publishToPlayers("/game/update-deck-counter/player/hand", player, {
            hand: size.hand, 
            playdeck: size.playdeck,
            score : nScore,
            player: player
        });
    }

    removeEmptyCompanies()
    {
        const keys = this.getPlayboardManager().removeEmptyCompanies();
        if (keys.length === 0)
            return false;

        this.publishToPlayers("/game/remove-empty-companies", "", keys);
        this.updateHandCountersPlayerAll();
        return true;
    }

    createEmptyBoardData()
    {
        const _data = this.getPlayboardManager().GetData();
        return {
            player: {
                companies: [],
                stage_hazards: [],
                stage_resources: []
            },
            opponent: {
                companies: [],
                stage_hazards: [],
                stage_resources: []
            },

            scores: [],
            data : _data
        };
    }

    getCurrentBoardCompanies(_dataTarget:any, _playerId:string)
    {
        for (let _elem of this.getPlayboardManager().GetCompanyIds(_playerId))
        {
            const _temp = this.getPlayboardManager().GetFullCompanyByCompanyId(_elem);
            if (_temp !== null)
                _dataTarget.companies.push(_temp);
        }
    }

    getCurrentBoardStaging(_dataTarget:TDeckCard[], _playerId:string, bResources:boolean)
    {
        for (let _elem of this.getPlayboardManager().GetStagingCards(_playerId, bResources))
        {
            const card = this.getPlayboardManager().GetCardByUuid(_elem);
            if (card !== null)
            {
                _dataTarget.push({
                    uuid: card.uuid,
                    code: card.code,
                    type: card.type.toLowerCase(),
                    state: card.state,
                    revealed: card.revealed,
                    owner: card.owner,
                    token: card.token ?? 0,
                    tokenMP: card.tokenMP ?? 0,
                    secondary: card.secondary,
                    stage: card.stage === true,
                    agent: false,
                    turn: 0,
                    target: "",
                    status: 0,
                    unique: card.unique,
                    hoard: card.hoard
                });
            }
        }
    }

    getCurrentBoard(id:string)
    {
        const data:any = this.createEmptyBoardData();

        let _dataTarget;
        for (let _playerId of this.getPlayerIds())
        {
            _dataTarget = _playerId === id ? data.player : data.opponent;
            this.getCurrentBoardCompanies(_dataTarget, _playerId);
            this.getCurrentBoardStaging(_dataTarget.stage_resources, _playerId, true);
            this.getCurrentBoardStaging(_dataTarget.stage_hazards, _playerId, false);
            this.updateHandCountersPlayer(_playerId);
        }

        data.scores = this.getScoring().getScoreSheets();
        
        this.sendCurrentPhase();
        return data;
    }


    sendCurrentPhase()
    {
        super.sendPlayerList();

        const userid = this.getCurrentPlayerId();
        const data = {
            phase: this.getPhase(),
            currentplayer: userid,
            players: this.getPlayerIds()
        };

        this.publishToPlayers("/game/set-phase", userid, data);
    }

    startPoolPhaseByPlayer(id:string)
    {
        const _list = this.getPlayboardManager().GetCardsInHand(id);
        for (let card of _list)
            this.drawCard(id, card.uuid, card.code, card.type, 1);

        this.updateHandCountersPlayer(id);
    }

    sendCurrentHandSize()
    {
        const userid = this.getCurrentPlayerId();
        const size = this.getPlayboardManager().Size(userid);
        if (size !== null)
            this.publishChat(userid, " holds " + size.hand + " card(s)", false);
    }

    startPoolPhase()
    {
        for (let id of this.getPlayerIds())
            this.startPoolPhaseByPlayer(id);

        this.sendCurrentPhase();
    }

    onStagingAreaAddCard(userid:string, _socket:any, data:any)
    {
        const _uuid = data.uuid;
        if (!this.getPlayboardManager().MoveCardToStagingArea(_uuid, userid, userid))
        {
            this.publishChat(userid, "Cannot move card to staging area", false);
            return false;
        }

        const card:TDeckCard|null = this.getPlayboardManager().GetCardByUuid(_uuid);
        if (card === null)
            return false;
        card.turn = this.getCurrentTurn();

        this.publishToPlayers("/game/remove-card-from-hand", "", _uuid);
        this.publishToPlayers("/game/add-to-staging-area", userid, {
            uuid: _uuid, 
            target: "", 
            code: card.code, 
            type: card.type, 
            state: card.state, 
            revealed: card.revealed !== false, 
            owner: card.owner, 
            turn: card.turn,
            secondary : card.secondary,
            stage: card.stage === true
        });
        this.updateHandCountersPlayer(userid);
        this.publishChat(userid, "added " + card.code + " to staging area", true);
    }

    onGameCardStateReveal(userid:string, _socket:any, data:any)
    {
        const uuid = data.uuid;
        const rev = this.getPlayboardManager().FlipCard(uuid);

        this.publishToPlayers("/game/card/reveal", userid, {uuid: uuid, reveal: rev === true });

        if (!rev)
            this.publishChat(userid, " hides a card", true);
        else if (data.code && data.code !== "")
            this.publishChat(userid, " reveals " + data.code, true);
        else
            this.publishChat(userid, " reveals a card", true);
    }

    onGameCardStateInHand(userid:string, socket:any, data:any)
    {
        const uuid = data.uuid;
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card == null)
            return;

        if (card.revealed === true)
            card.revealed = false;

        this.replyToPlayer("/game/card/state/hand", socket, { uuid: uuid });
    }

    onGetCharacters(userid:string, socket:any)
    {
        const list = this.getPlayboardManager().GetCharacterCodes(userid);
        this.replyToPlayer("/game/character/list", socket, { codes: list });
    }

    onGameCardStateSet(userid:string, _socket:any, data:any)
    {
        if (data.uuid === "_site")
        {
            data.tapped = data.state === 90;
            data.ownerId = userid;

            this.getPlayboardManager().SetSiteState(userid, data.code, data.state);
            this.publishToPlayers("/game/card/state/set-site", userid, data);
        }
        else
        {
            this.getPlayboardManager().SetCardState(data.uuid, data.state);
            this.publishToPlayers("/game/card/state/set", userid, data);
        }

        const nState = data.state;
        let message = "turns ";
        if (nState === 0)
            message = "untaps ";
        else if (nState === 90)
            message = "taps ";
        else if (nState === 91)
            message = "fixed ";
        else if (nState === 180)
            message = "wounds ";

        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card !== null && card.revealed === true)
            this.publishChat(userid, message + data.code, true);
        else 
            this.publishChat(userid, message + "a card", true);
    }

    onGameStateGlow(userid:string, _socket:any, data:any)
    {
        this.publishToPlayers("/game/card/state/glow", userid, data);
        this.publishChat(userid, "marks/unmarks " + data.code, false);
    }

    onGameStateMark(userid:string, _socket:any, data:any)
    {
        this.publishToPlayers("/game/card/state/mark", userid, data);
        if (data.mark)
            this.publishChat(userid, "marks " + data.code, false);
        else
            this.publishChat(userid, "unmarks " + data.code, false);
    }

    onReshuffleDiscardIntoPlaydeck(userid:string, socket:any = null, _obj:any = null)
    {
        const res = this.getPlayboardManager().ShuffleDiscardpileIntoPlaydeck(userid);
        if (res)
            this.publishChat(userid, "reshuffled their discard pile into their playdeck");

        this.replyToPlayer("/game/deck/discard/playdeck", socket, { success: res });
    }

    #onReshuffleHandIntoPlaydeck(userid:string, socket:any = null, _obj:any = null)
    {
        const res = this.getPlayboardManager().ShuffleHandIntoPlaydeck(userid);
        if (res)
        {
            this.publishChat(userid, "reshuffled their hand into their playdeck");
            this.updateHandCountersPlayer(userid);
            this.replyToPlayer("/game/card/hand", socket, { cards: [] });
        }
    }

    onCardDraw(userid:string, _socket:any = null, _obj:any = null)
    {
        let _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            this.drawCard(userid, card.uuid, card.code, card.type, 1);

        this.updateHandCountersPlayer(userid);

        if (_list.length === 1)
            this.publishChat(userid, "drew 1 card", false);
        else if (_list.length > 1)
            this.publishChat(userid, "drew " + _list.length + " cards", false);
    }

    drawCardsFromPlaydeck(userid:string, nCards:number = 1)
    {
        if (userid === "" || userid === undefined || nCards === undefined || nCards < 1)
            return;
            
        for (let i = 0; i < nCards; i++)
        {
            const _card = this.getPlayboardManager().DrawCard(userid, false);
            if (_card !== null)
                this.drawCard(userid, _card.uuid, _card.code, _card.type, 1);
        }

        this.updateHandCountersPlayer(userid);
        this.publishChat(userid, "drew " + nCards + " card(s)", false);
    }

    onCardDrawSingle(userid:string, _socket:any = null, _obj:any = null)
    {
        let _card = this.getPlayboardManager().DrawCard(userid, false);
        if (_card === null)
            return;

        this.updateHandCountersPlayer(userid);
        this.drawCard(userid, _card.uuid, _card.code, _card.type, 1);
        this.publishChat(userid, "drew 1 card", false);
    }

    onGetTopCardFromHand(userid:string, _socket:any, nCount:number)
    {
        if (nCount < 1)
            return;

        const _cards = this.getPlayboardManager().GetTopCards(userid, nCount);
        for (let _card of _cards)
        {
            this.drawCard(userid, _card.uuid, _card.code, _card.type, nCount);
            this.publishChat(userid, "drew 1 card", false);
        }

        this.updateHandCountersPlayer(userid);
    }

    doStorCard(characterUuid:string, card:TDeckCard)
    {
        let bStored = false;
        let nDiscarded = 0;
        let list = [];
        let affectedCompanyUuid = "";
        const isCharacter = card.type === "character";
        if (isCharacter)
        {
            affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(characterUuid);

            for (let _uuid of this.getPlayboardManager().PopCharacterAndItsCards(characterUuid))
            {
                if (_uuid === characterUuid)
                {
                    if (this.getPlayboardManager().AddToPile(_uuid, card.owner, "victory"))
                    {
                        bStored = true;
                        list.push(_uuid);
                    }
                } 
                else if (this.getPlayboardManager().AddToPile(_uuid, card.owner, "discard"))
                {
                    nDiscarded++;
                    list.push(_uuid);
                }
            }
        }

        if (!isCharacter || list.length === 0)
        {
            if (this.getPlayboardManager().MoveCardTo(characterUuid, card.owner, "victory"))
            {
                bStored = true;
                list = [characterUuid];
            }
        } 

        return {
            list: list,
            stored: bStored,
            discarded: nDiscarded,
            affectedCompanyUuid : affectedCompanyUuid
        }
    }

    #storeQuestCard(userid:string, card:TDeckCard)
    {
        const code = CardDataProvider.getFlippedCode(card.code);
        if (code !== "")
            this.getPlayboardManager().ImportCardToStored(userid, code)
    }

    onCardStore(userid:string, _socket:any, obj:any)
    {
        const card:TDeckCard|null = this.getPlayboardManager().GetCardByUuid(obj.uuid);
        if (card === null)
            return;

        this.getPlayboardManager().UpdateOwnership(userid, card);

        const result = this.doStorCard(obj.uuid, card)
        if (result.stored)
        {
            this.#storeQuestCard(userid, card);

            this.publishToPlayers("/game/card/remove", userid, result.list);
            this.updateHandCountersPlayerAll();

            this.publishChat(userid, "Stores " + card.code, true);
            if (result.discarded > 0)
                this.publishChat(userid, "... and discarded " + result.discarded + " card(s)", true);

            this.publishToPlayers("/game/event/score", userid, {owner: card.owner, code: card.code });
        } 
        else
            this.publishChat(userid, "Could not store " + card.code, false);

        /** update the company */
        this.onRedrawCompany(userid, result.affectedCompanyUuid);
    }

    identifyCardOwnerWhenMoving(userid:string, cardOwner:string, target:string)
    {
        if (target === "victory" || target === "hand")
            return userid;
        else
            return cardOwner;
    }

    #onCardMoveDoMoveResourceType(userid:string, obj:any, card:TDeckCard)
    {
        const result = [];

        /**
         * the victory pile is different: usually, the target of your deck pils is always the card owner,
         * yet the victory condition allows to take ownership of cards
         */
        const _targetPlayer = this.identifyCardOwnerWhenMoving(userid, card.owner, obj.target);
        if (this.getPlayboardManager().MoveCardTo(obj.uuid, _targetPlayer, obj.target))
            result.push(obj.uuid);

        return result;
    }

    #onCardMoveDoMove(userid:string, obj:any, card:TDeckCard)
    {
        const result:any = {
            codes: [],
            uuids : [],
            countMoved : 0,
            affectedCompanyUuid : "",
            isEmpty : true
        };

        if (card.type !== "character" || obj.source !== "inplay")
        {
            result.uuids = this.#onCardMoveDoMoveResourceType(userid, obj, card);
        } 
        else
        {
            result.affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(obj.uuid);
            result.uuids = this.getPlayboardManager().MoveCardCharacterTo(obj.uuid, card.owner, obj.target);

            /** 
             * A character might be played onguard and dropped as ressource on another character. 
             * That way, the engine will consider them a character but they will not meet the requirements (no company!)
             * So, if a character has been in play, try removing it nonetheless
             */
            if (result.affectedCompanyUuid === "" && result.uuids.length === 0 && obj.source === "inplay")
                result.uuids = this.#onCardMoveDoMoveResourceType(userid, obj, card);
        }

        for (let _uid of result.uuids)
        {
            const _card = this.getPlayboardManager().GetCardByUuid(_uid);
            if (_card !== null)
                result.codes.push({code: _card.code, owner: _card.owner, uuid: _uid});
        }

        result.countMoved = result.uuids.length;
        result.isEmpty = result.countMoved === 0;

        return result;
    }


    refreshAllHandsOfAllPlayers(userid:string, socket:any)
    {
        const res:any = [];
        const _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: ""} );

        if (res.length > 0)
            this.replyToPlayer("/game/card/hand", socket, { cards: res });
    }

    onAvatarSet(userid:string, _socket:any, obj:any)
    {
        const avatar = obj.code;
        if (avatar && this.setAvatar(userid, avatar))
        {
            this.publishToPlayers("/game/avatar/set", userid, {code: avatar, userid: userid});
            this.publishChat(userid, "Updated their avatar to " + avatar, false);
        }
    }

    onCardMove(userid:string, socket:any, obj:any)
    {
        const bShufflePlaydeck = obj.shuffle !== undefined && obj.shuffle === true && "playdeck" === obj.target;
        
        const card = this.getPlayboardManager().GetCardByUuid(obj.uuid);
        if (card === null)
            return;

        const result = this.#onCardMoveDoMove(userid, obj, card);
        if (!result.isEmpty)
        {
            this.updateHandCountersPlayer(userid);
            this.publishToPlayers("/game/event/cardmoved", userid, {list: result.codes, target: obj.target, source: obj.source});
        }

        if (bShufflePlaydeck)
        {
            this.getPlayboardManager().ShufflePlaydeck(userid);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }

        /* now we have to remove the cards from the board */
        this.publishToPlayers("/game/card/remove", userid, result.uuids);

        this.onRedrawCompany(userid, result.affectedCompanyUuid);

        if (obj.target === "outofplay")
            this.publishToPlayers("/game/event/outofplay", userid, {code: card.code });
        else if (obj.target  === "discardpile")
            this.replyToPlayer("/game/event/discard", socket, {code: card.code, owner: card.owner});
        else if (obj.target === "hand" || obj.drawTop === true)
            this.refreshAllHandsOfAllPlayers(userid, socket);

        if (bShufflePlaydeck)
            this.publishChat(userid, "Shuffled " + result.countMoved + " card(s) into playdeck", true);
        else
            this.publishChat(userid, "Moved " + result.countMoved + " card(s) to top of " + obj.target, true);
    }

    onCardToken(userid:string, _socket:any, data:any)
    {
        let nCount = -1

        if (data.uuid)
        {
            if (data.type === "token-mp")
                nCount = this.getPlayboardManager().getDecks().updateTokenMP(data.uuid, data.add !== false);
            else 
                nCount = this.getPlayboardManager().getDecks().updateToken(data.uuid, data.add !== false);
        }

        if (nCount != -1)
        {
            this.publishToPlayers("/game/card/token", userid, {uuid: data.uuid, count: nCount, type: data.type });
            this.publishChat(userid, "updates token of " + data.code + " to " + nCount, true);
        }
    }

    onWatchUpdateHand(_userid:string, socket:any)
    {
        let res = [];
        for (let id of this.getPlayerIds())
        {
            for (let card of this.getPlayboardManager().GetCardsInHand(id))
                res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: id} );
                
            for (let card of this.getPlayboardManager().GetCardsInHandMarshallingPoints(id))
                res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: id} );
        }

        this.replyToPlayer("/game/watch/hand", socket, { cards: res });
    }

    onWatchUpdateVictory(_userid:string, socket:any)
    {
        this.replyToPlayer("/game/score/watch", socket, this.getScoring().getScoreSheets());
    }

    onCardInHand(userid:string, socket:any)
    {
        let res = [];
        const _list = this.getPlayboardManager().GetCardsInHand(userid);
        for (let card of _list)
            res.push({ code: card.code, uuid: card.uuid, count: 1, type: card.type, owner: ""} );

        this.replyToPlayer("/game/card/hand", socket, { cards: res });
    }

    onCardSites(userid:string, socket:any)
    {
        const res = [];
        for (let card of this.getPlayboardManager().GetCardsSites(userid))
            res.push(card.code);

        this.replyToPlayer("/game/card/sites", socket, { cards: res });
    }

    onCardDiscard(userid:string, _socket:any, data:any)
    {
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card === null)
            return false;

        const affectedCompanyUuid = this.getPlayboardManager().findHostsCompany(data.uuid);
        if (!this.getPlayboardManager().MoveCardTo(data.uuid, card.owner, "discardpile"))
            return false;

        this.updateHandCountersPlayer(card.owner);
        this.publishChat(userid, "Discarded 1 card.", true);
        this.onRedrawCompany(userid, affectedCompanyUuid);
        return true;
    }

    scoreShow(userid:string, socket:any, _data:any)
    {
        this.replyToPlayer("/game/score/show", socket, this.getScoring().getScoreSheets());
        this.replyToPlayer("/game/score/show-pile", socket, this.#getList(userid, "victory"));
        this.publishChat(userid, " looks at score sheet", false);
    }

    #getList(userid:string, obj:string):TDeckCard[]
    {
        if (obj === "sideboard")
            return this.getPlayboardManager().GetCardsInSideboard(userid);
        else if (obj === "discardpile" || obj === "discard")
            return this.getPlayboardManager().GetCardsInDiscardpile(userid);
        else if (obj === "playdeck")
            return this.getPlayboardManager().GetCardsInPlaydeck(userid);
        else if (obj === "victory")
            return this.getPlayboardManager().GetCardsInVictory(userid);
        else if (obj === "hand")
            return this.getPlayboardManager().GetCardsInHand(userid);
        else if (obj === "sharedvicotory")
            return this.getPlayboardManager().GetCardsInVictoryShared(userid);
        else if (obj === "outofplay")
            return this.getPlayboardManager().GetCardsInOutOfPlay();
        else
            Logger.warn("unknown target card list " + obj);
        
        return [];
    }

    sendCurrentScores(...userids:string[])
    {
        let firstId = "";
        const res = [];
        for (let userid of userids)
        {
            if (userid === "")
                continue;

            if (firstId === "")
                firstId = userid;

            const sheet = this.getScoring().getScoreSheet(userid);
            if (sheet !== null)
            {
                res.push({
                    id: userid,
                    scores: this.getScoring().getScoreSheet(userid)
                });
            }
        }

        if (firstId !== "")
            this.publishToPlayers("/game/score/show/current", firstId, res);
    }

    scoreUpdate(userid:any, _socket:any, data:any)
    {
        const total = this.getScoring().updateScore(userid, data);
        if (total !== -1)
        {
            this.publishChat(userid, " updates score to a total of " + total + " point(s)", true);
            this.sendCurrentScores(userid);
        }
    }

    scoreSet(userid:any, _socket:any, data:any)
    {
        const total = this.getScoring().setCategory(userid, data.type, data.points);
        if (total !== -1)
        {
            this.publishChat(userid, " sets " + data.type + " score to " + data.points + " point(s)", true);
            this.sendCurrentScores(userid);
        }
    }

    scoreDecisiveVictory(userid:any, _socket:any, data:any)
    {
        this.publishToPlayers("/game/score/onering", userid, { "userid": userid });
    }

    scoreDoubleMisc(userid:any, _socket:any, data:any)
    {
        const bYes = data.misc === true;
        this.publishToPlayers("/game/score/doublemisc", userid, { "misc": bYes });

        if (bYes)
            this.publishChat(userid, " allows misc points to be doubled", true);
        else
            this.publishChat(userid, " defines that misc points will not be doubled", false);
    }

    scoreAdd(userid:any, _socket:any, data:any)
    {
        const total = this.getScoring().update(userid, data.type, data.points);
        if (total !== -1)
        {
            this.publishChat(userid, " updated " + data.type + " score by " + data.points + " point(s) to a total of " + total + " MPs.", true);
            this.publishToPlayers("/game/sfx", userid, { "type": "score" });

            this.sendCurrentScores(userid);
        }
    }

    onGameDrawCompany(userid:any, _socket:any, data:any)
    {
        const pCompany = this.getPlayboardManager().GetFullCompanyByCompanyId(data);
        if (pCompany !== null)
        {
            this.publishToPlayers("/game/player/draw/company", userid, pCompany);
            this.removeEmptyCompanies();
        }
    }

    onGameDrawCompanies(userid:string, _socket:any, _data:any)
    {
        for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
        {
            const _temp = this.getPlayboardManager().GetFullCompanyByCompanyId(_company);
            if (_temp !== null)
                this.publishToPlayers("/game/player/draw/company", userid, _temp);
        }
    }

    onCharacterHostCard(userid:string, _socket:any, obj:any)
    {
        const uuid = obj.uuid;
        const company = obj.companyId;
        const character = obj.characterUuid;

        if (!this.getPlayboardManager().CharacterHostCard(company, character, uuid))
        {
            Logger.info("character cannot host card.");
            return false;
        }

        const card:TDeckCard|null = this.getPlayboardManager().GetCardByUuid(uuid);
        if (card === null)
            return false;

        this.publishToPlayers("/game/remove-card-from-hand", "", uuid);
        this.publishToPlayers("/game/remove-card-from-board", "", uuid);
        this.updateHandCountersPlayer(userid);

        {
            const cardChar = this.getPlayboardManager().GetCardByUuid(character);
            if (cardChar === null || cardChar.revealed === false || card.revealed === false)
                this.publishChat(userid, " character hosts a card", true);
            else
            {
                this.publishToPlayers("/game/infobox/card", "", card.code);
                this.publishChat(userid, cardChar.code + " hosts " + card.code, true);
            }
        }

        return true;
    }

    onCharacterReceiveCard(_userid:string, _socket:any = null, _obj:any = null)
    {
        return false;
    }

    onCharacterJoinCharacter(userid:string, _socket:any, data:any)
    {
        const cardUuid = data.uuid;
        const targetcharacter = data.targetcharacter;
        const targetCompany = data.companyId;
        const isFromHand = data.fromHand;

        if (isFromHand)
        {
            if (this.getPlayboardManager().removeCardFromDeckOrCompany(userid, cardUuid))
                this.updateHandCounterOnlyPlayer(userid);
        }

        const sWho = this.getCardCode(cardUuid, "Character") + " ";
        if (!this.getPlayboardManager().JoinCharacter(cardUuid, targetcharacter, targetCompany))
        {
            this.publishChat(userid, sWho + "cannot join under direct influence", false)
        }
        else
        {
            this.removeEmptyCompanies();
            if (isFromHand)
            {
                const _code = this.getCharacterCode(targetcharacter, "");
                if (_code !== "")
                    this.publishToPlayers("/game/event/fromHand", userid, {code: _code, user: userid});
            }

            let sChar = this.getCharacterCode(targetcharacter, "a character");
            this.publishChat(userid, sWho + "joined " + sChar + " under direct influence", true);
        }
    }

    onCharacterJoinCompany(userid:string, _socket:any, data:any)
    {
        const _uuid = data.uuid;
        const _source = data.source;
        const _companyId = data.companyId;

        if (_uuid === "" || _source === "" || _companyId === "")
            return;

        if (!this.getPlayboardManager().JoinCompany(_uuid, _source, _companyId, userid))
        {
            Logger.info("Character " + _uuid + " cannot join the company " + _companyId);
            return;
        }

        if (_source === "hand")
        {
            this.updateHandCounterOnlyPlayer(userid);
            this.publishToPlayers("/game/remove-card-from-hand", userid, _uuid);
            const _code = this.getCardCode(_uuid, "");
            if (_code !== "")
                this.publishToPlayers("/game/event/fromHand", userid, {code: _code, user: userid});
        }

        this.removeEmptyCompanies();

        {
            let sWho = this.getCardCode(_uuid, "Character") + " joined";
            const sCompanyCharacter = this.getFirstCompanyCharacterCode(_companyId, "");
            if (sCompanyCharacter === "")
                sWho += " a company";
            else
                sWho += " the company of " + sCompanyCharacter;

            this.publishChat(userid, sWho, true);
        }
    }

    onGameCompanyCreate(userid:string, _socket:any, data:any)
    {
        const _uuid = data.uuid;
        const _source = data.source;

        if (_uuid === "" || _source === "")
            return false;

        const _id = this.getPlayboardManager().CreateNewCompany(_uuid, _source, userid);
        if (_id === "")
            return false;

        if (_source === "hand")
        {
            this.updateHandCounterOnlyPlayer(userid);
            this.publishToPlayers("/game/remove-card-from-hand", userid, _uuid);

            const _code = this.getCardCode(_uuid, "");
            if (_code !== "")
                this.publishToPlayers("/game/event/fromHand", userid, {code: _code, user: userid});
        }

        // draw the company
        this.onRedrawCompany(userid, _id);
        this.removeEmptyCompanies();

        const card = this.getPlayboardManager().GetCardByUuid(_uuid);
        if (card !== null && card.revealed !== false)
        {
            let sCode = this.getCardCode(_uuid, "");
            if (sCode !== "")
                this.publishChat(userid, sCode + " created a new company", true);
            else
                this.publishChat(userid, "New company created", true);
        }
        else
            this.publishChat(userid, "A character created a new company", true);

        return true;
    }

    onRedrawCompany(userid:string, companyId:string)
    {
        if (userid !== undefined && userid !== "" && companyId !== undefined && companyId !== "")
        {
            const _temp = this.getPlayboardManager().GetFullCompanyByCompanyId(companyId);
            if (_temp !== null)
                this.publishToPlayers("/game/player/draw/company", userid, _temp);
        }
    }

    onGameCompanyMarkAsCurrent(userid:string, _socket:any, jData:any)
    {
        if (typeof jData.uuid === "string")
            this.publishToPlayers("/game/company/markcurrently", userid, {uuid: jData.uuid});
    }

    onGameCompanyHighlight(userid:string, _socket:any, jData:any)
    {
        if (typeof jData.company === "undefined")
            return;

        let company = jData.company;
        if (company !== "")
        {
            this.publishToPlayers("/game/company/highlight", userid, {company: company});

            let sCompanyCharacter = this.getFirstCompanyCharacterCode(company, "");
            if (sCompanyCharacter !== "")
                this.publishChat(userid, "marks company of " + sCompanyCharacter, false);
        }
    }

    onGameCompanyArrives(userid:string, _socket:any, jData:any)
    {
        if (typeof jData.company === "undefined" || jData.company === "")
            return;

        this.getPlayboardManager().CompanyArrivedAtDestination(jData.company);
        this.publishToPlayers("/game/company/arrive", userid, {company: jData.company});

        let sCompanyCharacter = this.getFirstCompanyCharacterCode(jData.company, "");
        if (sCompanyCharacter !== "")
            this.publishChat(userid, "The company of " + sCompanyCharacter + " arrives", true);
        else
            this.publishChat(userid, "The company arrives", true);
    }

    onGameCompanyReturnsToOrigin(userid:string, _socket:any, jData:any)
    {
        if (typeof jData.company === "undefined" || jData.company === "")
            return;

        this.getPlayboardManager().CompanyReturnsToOrigin(jData.company);
        this.publishToPlayers("/game/company/returntoorigin", userid, {company: jData.company});

        let sCompanyCharacter = this.getFirstCompanyCharacterCode(jData.company, "");
        if (sCompanyCharacter !== "")
            this.publishChat(userid, "The company of " + sCompanyCharacter + " returns to site of origin", true);
        else
            this.publishChat(userid, "The company returns to site of origin", true);
    }

    onGameCompanyLocationSetLocation(userid:string, _socket:any, obj:any)
    {
        this.getPlayboardManager().SetCompanyStartSite(obj.companyUuid, obj.start, obj.regions, obj.destination);
        const res = this.getPlayboardManager().GetCompanyAttachedLocationCards(obj.companyUuid);
        const result = {
            company: obj.companyUuid, 
            start: res.current, 
            regions: res.regions, 
            target: res.target, 
            revealStart : obj.revealStart,
            revealed: false, 
            attached: res.attached,
            current_tapped : res.current_tapped,
            target_tapped : res.target_tapped
        };
        
        this.publishToPlayers("/game/player/draw/locations", userid, result);
        this.publishChat(userid, " organises locations.", false);
    }

    #onGameCompanyLocationHousekeeping(userid:string, _socket:any, data:any)
    {
        const map = this.getPlayboardManager().GetAttaachedLocationCardsAll();
        this.publishToPlayers("/game/company/location/housekeeping", userid, map);
    }

    onGameCompanyLocationChoose(userid:string, _socket:any, data:any)
    {
        this.publishToPlayers("/game/company/location/choose", userid, 
        {
            company: data.company,
            homesite: data.homesite === true,
            hide: data.hide,
            userid: userid
        });
    }

    onGameCompanyLocationAttach(userid:string, _socket:any, data:any)
    {
        const _uuid = data.uuid;
        const targetCompanyUuid = data.companyUuid;
        const revealOnDrop = data.reveal;

        const card = this.getPlayboardManager().PopCardFromHand(_uuid);
        if (card === null)
        {
            this.publishChat(userid, "Cannot add foreign card to location threats", false);
            return;
        }

        if (!this.getPlayboardManager().AddHazardToCompanySite(_uuid, targetCompanyUuid))
        {
            this.publishChat(userid, "cannot add hazard to company.", false);
            return;
        }

        card.revealed = revealOnDrop;

        this.publishToPlayers("/game/remove-card-from-hand", "", _uuid);
        this.publishToPlayers("/game/remove-card-from-board", "", _uuid);
        this.publishToPlayers("/game/add-onguard", userid, {
            uuid: _uuid,
            company: targetCompanyUuid,
            code: card.code,
            type: card.type,
            state: card.state,
            revealed: revealOnDrop,
            owner: card.owner
        });
        
        this.updateHandCountersPlayer(userid);

        if (revealOnDrop)
            this.publishChat(userid, " attached " + card.code + " to site/region", true);
        else
            this.publishChat(userid, " played an on guard card", true);
    }

    onGameCompanyLocationReveal(userid:string, _socket:any, data:any)
    {
        this.getPlayboardManager().RevealCompanyDestinationSite(data.companyUuid);
        this.publishToPlayers("/game/company/location/reveal", userid, {company: data.companyUuid});
        this.publishChat(userid, " revealed locations.", true);
    }

    globalSaveGameAuto(_userid:string, socket:any)
    {
        /** allow autosave in 2 player game */
        const data = this.getCount() !== 2 ? null : this.save();
        if (data !== null)
            this.replyToPlayer("/game/save/auto", socket, data);
    }

    globalSaveGame(_userid:string, socket:any)
    {
        const data = this.save();
        if (data !== null)
            this.replyToPlayer("/game/save", socket, data);
    }

    save()
    {
        try
        {
            const data = super.save();
            data.playboard.decks.cardMap = this.base64Encode(data.playboard.decks.cardMap)
            return data;
        }
        catch(err)
        {
            Logger.error(err);
        }

        return null;
    }


    onDiscardOpenly(userid:string, _socket:any, data:any)
    {
        const card = this.getPlayboardManager().GetCardByUuid(data.uuid);
        if (card !== null)
        {
            this.publishChat(userid, " discards " + card.code, true);
            this.publishToPlayers("/game/discardopenly", userid, {
                code: card.code,
                owner : card.owner,
                uuid : data.uuid
            });
        }
    }
    
    rollDices(userid:string, _socket:any, obj:any)
    {
        const n1 = obj.r1;
        const n2 = obj.r2;
        const nRes = n1 + n2;
        const pDices = this.getPlayerDices();
        const dice = pDices.getDice(userid);
        pDices.saveRoll(userid, nRes);

        const uuid = obj.uuid === undefined ? "" : obj.uuid;
        const code = obj.code === undefined ? "" : obj.code;

        this.publishToPlayers("/game/dices/roll", userid, {first: n1, second: n2, total: nRes, user: userid, dice: dice, uuid: uuid, code: code });
        if (code === "")
            this.publishChat(userid, ` rolls ${nRes} (${n1}, ${n2})`, true);
        else
            this.publishChat(userid, ` ${code} rolls ${nRes} (${n1}, ${n2})`, true);
    }

    setDices(userid:string, _socket:any, obj:any)
    {
        this.updateDices(userid, obj.type);
    }

    onChangePlayerOrder(userid:string, _socket:any, obj:any)
    {
        if (!Array.isArray(obj.list) || obj.list.length === 0)
            return;

        if (this.changePlayerOrder(obj.list))
        {
            this.publishToPlayers("/game/players/reorder", userid, {
                list: obj.list
            });
        }
    }
    
    phase(userid:string, _socket:any, sPhase:string) 
    {
        switch (sPhase)
        {
            case "organisation":
            case "movement":
            case "site":
            case "eotdiscard":
            case "longevent":
            case "eot":
                break;

            default:
                return;
        }

        let nCurrentTurn = this.getCurrentTurn();
        let nNewTurn = nCurrentTurn;

        if (sPhase === "site")
        {
            for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
                this.getPlayboardManager().CompanyArrivedAtDestination(_company);
        } 
        else if (sPhase === "eot")
        {
            sPhase = "organisation";
            userid = this.nextPlayersTurn();
            nNewTurn = this.getCurrentTurn();

            const lTime = this.#timeTimer.pollElapsedMins();

            this.publishChat(userid, " ends turn after " + lTime + "mins. Active player is " + this.getCurrentPlayerName(), true);
            this.publishGameLogNextPlayer(this.getCurrentPlayerName() + " starts their turn.");

            this.sendCurrentHandSize();
            this.publishToPlayers("/game/set-turn", userid, { turn : nNewTurn })
        }

        if (sPhase === "organisation")
        {
            for (let _company of this.getPlayboardManager().GetCompanyIds(userid))
                this.getPlayboardManager().ReadyCompanyCards(_company);

            this.publishToPlayers("/game/player/set-current", this.getCurrentPlayerId(), {id: this.getCurrentPlayerId(), displayname: this.getCurrentPlayerName()});
        }

        this.setPhase(sPhase);
        this.sendCurrentPhase();

        if (nNewTurn !== nCurrentTurn)
            this.publishChat(this.getCurrentPlayerId(), " starts turn no. " + nNewTurn, true);
        else
            this.publishChat(this.getCurrentPlayerId(), " is now in " + sPhase + " phase", true);
    }

    onCardImportSite(userid:string, data:any)
    {
        const asCharacter = data.targetCompany === "" || data.targetCharacter === "";
        const uuid = this.importCardsToGame(userid, data.code, asCharacter)
        if (uuid === "")
            return;

        if (asCharacter)
        {
            const json = {
                uuid: uuid,
                source: "hand"
            };
            this.onGameCompanyCreate(userid, null, json);
        }
        else
        {
            const json = {
                uuid : uuid,
                companyId : data.targetCompany,
                characterUuid : data.targetCharacter,
                fromHand: true
            };
            this.onCharacterHostCard(userid, null, json);
            this.onGameDrawCompany(userid, null, data.targetCompany);
        }        
    }

    onCardImport(userid:string, _socket:any, data:any)
    {
        if (data.type === "site")
            this.onCardImportSite(userid, data);
        else if (this.importCardDuringGame(userid, data.code, data.type === "character"))
            this.onGetTopCardFromHand(userid, null, 1);
    }

    onCardTypeUpdate(userid:string, socket:any, data:any)
    {
        const res = this.updateCardType(data.uuid);
        if (res !== null)
            this.replyToPlayer("/game/card/updatetype", socket, res);
    }

    onGameAddCardsToGame(userid:string, _socket:any, data:any)
    {
        let count = this.addCardsToGameDuringGame(userid, data.cards);
        if (count < 1)
        {
            this.publishChat(userid, "could not add new cards to sideboard", false);
            return;
        }

        if (count === 1)
            this.publishChat(userid, "just added 1 card to their sideboard", true);
        else
            this.publishChat(userid, "just added " + count + " cards to their sideboard", true);

        this.updateHandCountersPlayer(userid);

    }

    viewReveal(userid:string, _socket:any, obj:any)
    {
        let type = "";
        let opponentid = "";

        if (typeof obj === "string")
        {
            type = obj;
        }
        else
        {
            type = obj.type;
            opponentid = obj.opponentid;
        }

        let showAll = false;
        if (type === "handall")
        {
            showAll = true;
            type = "hand";
        }

        this.publishToPlayers("/game/view-cards/reveal/list", userid, {type: type, playerid: opponentid, showall: showAll, list: this.#getList(userid, type) });
        this.publishChat(userid, " offers to show cards in " + obj, false);
    }

    onDeckRevealStart(userid:string, _socket:any, obj:any)
    {
        const player = obj.first;
        const list = this.getPlayboardManager().GetTopCardsInPile(player, obj.deck, obj.count);
        if (list.length === 0)
            return;

        this.publishToPlayers("/game/deck/reveal/start", userid, {
            first: obj.first,
            second: obj.second,
            deck: obj.deck,
            cards: {
                first: [],
                second: list
            }
        });
    }

    onDeckRevealCancel(userid:string, _socket:any, obj:any)
    {
        this.publishToPlayers("/game/deck/reveal/cancel", userid, {
            first: obj.first,
            second: obj.second
        });
    }

    
    onDeckRevealRemove(userid:string, _socket:any, obj:any)
    {
        this.publishToPlayers("/game/deck/reveal/remove", userid, {
            first: obj.first,
            second: obj.second,
            code: obj.code,
            uuid: obj.uuid
        });
    }

    onDeckRevealOffer(userid:string, _socket:any, obj:any)
    {
        this.publishToPlayers("/game/deck/reveal/offer", userid, {
            first: obj.first,
            second: obj.second,
            code: obj.code,
            uuid: obj.uuid
        });
    }
    
    onDeckRevealAccept(userid:string, _socket:any, obj:any)
    {
        this.publishToPlayers("/game/deck/reveal/accept", userid, {
            first: obj.first,
            second: obj.second
        });
    }

    onDeckRevealSuccess(userid:string, obj:any)
    {
        this.publishToPlayers("/game/deck/reveal/success", userid, {
            first: obj.first,
            second: obj.second
        });
    }

    onDeckRevealPerform(userid:string, _socket:any, obj:any)
    {
        if (this.onDeckRevealMoveToDeck(userid, obj.deck, obj.cards, obj.cardsBottom))
            this.onDeckRevealSuccess(userid, obj);
        else
            this.onDeckRevealCancel(userid, null, obj);
    }

    #onDeckRevealSelfPerformView(userid:string, socket:any, obj:any)
    {
        const list = this.getPlayboardManager().GetTopCardsInPile(userid, obj.deck, obj.count);
        if (list.length === 0)
            return;

        this.replyToPlayer("/game/deck/reveal/self", socket, {
            deck: obj.deck,
            cards: list
        });

        this.publishChat(userid, " looks at top " + obj.count + " cards in " + obj.deck, false);
    }

    #onDeckRevealSelfPerformShuffle(userid:string, obj:any)
    {
        const count = obj.count;
        if (count < 2)
            return;

        this.getPlayboardManager().ShufflePlaydeckCount(userid, count);
        this.publishChat(userid, " shuffled top " + obj.count + " cards in " + obj.deck, false);
    }

    onDeckRevealSelfPerform(userid:string, socket:any, obj:any)
    {
        if (obj.type === "show")
            this.#onDeckRevealSelfPerformView(userid, socket, obj);
        else if (obj.type === "shuffle")
            this.#onDeckRevealSelfPerformShuffle(userid, obj);
    }

    onDeckRevealMoveToDeck(userid:string, deck:string, cards:string[], cardsBottom:string[])
    {
        let moved = false;

        if (this.getPlayboardManager().ReorderCardsInDeck(userid, deck, cards))
            moved = true;

        if (this.getPlayboardManager().SendToBottomOfDeck(userid, deck, cardsBottom))
            moved = true;

        return moved;
    }

    viewList(userid:string, _socket:any, obj:any)
    {
        const type = typeof obj === "string" ? obj : obj.type;
        const sorted = typeof obj !== "string" && obj.sorted === true;
        const list = this.#getList(userid, type);
        
        this.publishToPlayers("/game/view-cards/list", userid, {type: type, list: list, sorted: sorted });
        this.publishChat(userid, " views cards in " + type, false);
    }

    #onCompanyPositionBoard(userid:string, _socket:any, data:any)
    {
        this.publishToPlayers("/game/view-cards/list/close", userid, {
            company: data.company, 
            type: data.type
        });
    }

    viewCloseList(userid:string, _socket:any, obj:any)
    {
        if (typeof obj.offered === "undefined")
            return;

        if (!obj.offered)
        {
            this.publishChat(userid, " closes card offering", false);
            this.publishToPlayers("/game/view-cards/list/close", userid, { });
        }
        else
            this.publishChat(userid, " closes card offer", false);
    }

    viewShuffle(userid:string, _socket:any, obj:any)
    {
        if (obj.target === "playdeck")
        {
            this.getPlayboardManager().ShufflePlaydeck(userid);
            this.publishChat(userid, " shuffles playdeck", false);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }
        else if (obj.target === "discardpile")
        {
            this.getPlayboardManager().ShuffleDiscardpile(userid);
            this.publishChat(userid, " shuffles discardpile", false);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }
        else if (obj.target === "playdeck_top")
        {
            this.getPlayboardManager().ShufflePlaydeckCount(userid, obj.count);
            this.publishChat(userid, " shuffles top " + obj.count + " cards of their playdeck", false);
            this.publishToPlayers("/game/sfx", userid, { "type": "shuffle" });
        }
    }
    
    viewOfferReveal(userid:string, _socket:any, obj:any)
    {
        let sUuid = obj.uuid;
        if (sUuid !== "")
        {
            this.publishChat(userid, " shows a card", false);
            this.publishToPlayers("/game/view-cards/reveal/reveal", userid, {uuid: sUuid});
        }
    }
    
    drawSingleCard(userid:string)
    {
        /** this is the callback, so we better wrap this method call to stay independent */
        this.onCardDrawSingle(userid);
    }

    viewOfferRemove(userid:string, _socket:any, obj:any)
    {
        let sUuid = obj.uuid;
        if (sUuid !== "")
            this.publishToPlayers("/game/view-cards/reveal/remove", userid, {uuid: sUuid});
    }

    saveGameCheckPlayers(assignments:any)
    {
        if (this.getPlayers().ids.length !== Object.keys(assignments).length)
        {
            Logger.warn("Player count missmatch");
            return false;
        }
        
        let success = true;

        /** check that the player ids to be used are really in this game */
        for (let id of Object.keys(assignments))
        {
            if (!this.getPlayers().ids.includes(assignments[id]) || assignments[id] === "")
            {
                Logger.warn("Expected player id is not part of this room: " + assignments[id]);
                success = false;
            }
        }

        return success;
    }

    base64Encode(data:any)
    {
        const bufferObj = Buffer.from(JSON.stringify(data), "utf8");
        return bufferObj.toString("base64");
    }

    base64Decode(base64string:string)
    {
        try
        {
            let bufferObj = Buffer.from(base64string, "base64");
            return JSON.parse(bufferObj.toString("utf8"));
        }
        catch(err)
        {
            Logger.error(err);
        }
        
        return { };
    }

    restoreEncodedSavegame(data:any, userid:string)
    {
        try
        {
            if (typeof data.game.playboard.decks.cardMap === "string")
                data.game.playboard.decks.cardMap = this.base64Decode(data.game.playboard.decks.cardMap);
                
            return true;
        }
        catch(err)
        {
            Logger.error(err);
        }

        this.publishChat(userid, " savegame is invalid. Could not decode saved game.", false);
        return false;
    }

    evaluateSavedGame(data:any, userid:string)
    {
        const pEval = new SaveGameEvaluation(data.assignments);
        data.game = pEval.evaluate(data.game, this.isArda());
        if (data.game !== null)
            return true;

        this.publishChat(userid, " savegame is invalid. " + pEval.getMessageString(), false);
        return false;
    }

    #globalRestoreGameOwnerShips(playboard:any, assignments:any)
    {
        const _map = playboard.decks.cardMap;
        for (let _cardId in _map)
        {
            const _formerOwner = _map[_cardId].owner;
            if (_formerOwner !== undefined && assignments[_formerOwner] !== undefined)
                _map[_cardId].owner = assignments[_formerOwner];
            else if (_formerOwner)
                throw new Error("Cannot find former owner " + _formerOwner + " of card " + _cardId + ". Cannot restore game.");
        }
    }

    #globalRestoreGameSitemap(siteMap:any, assignments:any)
    {
        for (let key in siteMap) 
        {
            const newkey = assignments[key];
            if (newkey === undefined)
                throw new Error("Cannot find owner " + key + " in siteMap");
            
            siteMap[newkey] = siteMap[key];

            /** 
             * It might be, that the OLD and NEW ids are identical (immediate restoring)
             * This would cause the player to be removed from the game; therefore
             * make sure we do not remove a valid sitemap.
             */
            if (newkey !== key)
                delete siteMap[key];
        }
    }

    #globalRestoreGameDecks(playboard:any, assignments:any)
    {
        for (let key in playboard.decks.deck) 
        {
            const newkey = assignments[key];
            if (newkey === undefined)
                throw new Error("Cannot find owner " + key + " in deck");

            playboard.decks.deck[newkey] = playboard.decks.deck[key];
            if (newkey !== key)
                delete playboard.decks.deck[key];
        }

        if (playboard.decks.siteMap)
            this.#globalRestoreGameSitemap(playboard.decks.siteMap, assignments);
    }

    #globalRestoreGameStagingArea(playboard:any, assignments:any)
    {
        for (let key in playboard.stagingarea) 
        {
            const newkey = assignments[key];
            if (newkey === undefined)
                throw new Error("Cannot find owner " + key + " in stagingarea");

            playboard.stagingarea[newkey] = playboard.stagingarea[key];
            if (newkey !== key)
                delete playboard.stagingarea[key];    
        }
    }

    #globalRestoreGameScoring(scoring:any, assignments:any)
    {
        for (let key in scoring) 
        {
            const newkey = assignments[key];
            if (newkey === undefined)
                throw new Error("Cannot find owner " + key + " in scoring");

            scoring[newkey] = scoring[key];
            if (newkey !== key)
                delete scoring[key];
        }
    }

    #globalRestoreGameCompanies(playboard:any, assignments:any)
    {
        for (let key in playboard.companies) 
        {
            const newkey = assignments[playboard.companies[key].playerId];
            if (newkey !== undefined)
                playboard.companies[key].playerId = newkey;
            else
                throw new Error("Cannot find owner " + key + " in companies");
        }
    }

    globalRestoreGame(userid:string, _socket:any, data:any)
    {
        if (!this.restoreEncodedSavegame(data, userid) || !this.evaluateSavedGame(data, userid))
            return;

        let assignments = data.assignments; 
        if (!this.saveGameCheckPlayers(assignments))
            return;

        try
        {
            const playboard = data.game.playboard;
            this.#globalRestoreGameOwnerShips(playboard, assignments);
            this.#globalRestoreGameDecks(playboard, assignments)
            this.#globalRestoreGameStagingArea(playboard, assignments);            
            this.#globalRestoreGameCompanies(playboard, assignments);
            this.#globalRestoreGameScoring(data.game.scoring, assignments);

            if (!this.restore(playboard, data.game.scoring, data.game.meta))
                throw new Error("Cannot restore game playboard");
            
            super.globalRestoreGame(userid, _socket, data);
            
            this.restorePlayerPhase(data.game.meta.phase, 
                                    data.game.meta.players.turn, 
                                    data.game.meta.players.current);
            this.publishToPlayers("/game/restore", userid, { success : true });
        }
        catch (err)
        {
            console.warn(err);
            Logger.error(err);

            if (this.#fnEndGame !== null)
                this.#fnEndGame();
        }
    }

}
