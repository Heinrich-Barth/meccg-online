import CardPreview from "./card-preview";
import CardList from "./utils/cardlist";
import ContextMenu from "./contextmenu/contextmenu";
import Dictionary from "./utils/dictionary";
import GameCompanies from "./game-companies";
import { TaskBarCardsInterface } from "./game-taskbarcards";
import { HandCardsDraggable } from "./handcards-draggable";
import InfoBoxCard from "./InfoBoxCard";
import DomUtils from "./utils/libraries";
import Lobby from "./lobby/lobby";
import SiteList from "./map/SiteList";
import MeccgApi, { MeccgPlayers } from "./meccg-api";
import { GamePreferences } from "./preferences/preferences-game";
import SCORE_API from "./score/score";
import TurnStats from "./dice/TurnStats";
import CreateHandCardsDraggableUtils from "./utils/CreateHandCardsDraggableUtils";
import JumbleCards from "./utils/JumbleCards";

declare const g_sRoom:string;
declare const g_sLobbyToken:string;

export function IsVisitor()
{
    return document.body.getAttribute("data-is-watcher") === "true";
}

function isFirstConnection()
{
    try
    {
        const val = document.body.hasAttribute("data-connected-count") ? document.body.getAttribute("data-connected-count") : "";
        return val && parseInt(val) === 0;
    }
    catch (err)
    {
        console.error(err);            
    }

    return false;
}

const LockRoom = function()
{
    if (!IsVisitor() && g_sLobbyToken !== "")
        return isFirstConnection();
    else
        return false;
}


const GameBuilder = {
        
    _minuteInMillis : 60 * 1000,
    _gameStarted : 0,
    _timeStarted : 0,
    _hiddenStartPhase : false,
    _saved : { },
    _isVisitor : IsVisitor(),
    _lockRoom : LockRoom(),

    CardList : null,
    CardPreview : null,
    HandCardsDraggable : null,
    CompanyManager : null,
    Stagingarea : null,
    Scoring : null,

    getSiteOfOrigin : function(company:string)
    {
        if (company === "")
            return "";

        const container = document.getElementById("company_" + company);
        if (container === null)
            return "";

        const targetSite = container.querySelector(".site-target");
        if (targetSite === null)
            return "";

        const div = targetSite.querySelector(".card");
        const code = div === null || !div.hasAttribute("data-card-code") ? "" : div.getAttribute("data-card-code");
        return code ?? "";
    },

    showDropEventBox : function(code:string, company:string)
    {
        if (company && company !== "")
            code = GameBuilder.getSiteOfOrigin(company);

        if (InfoBoxCard !== undefined) /** backward compatibility */
            InfoBoxCard.showImage(code);
    },

    triggerLockRoom : function()
    {
        if (!GameBuilder._lockRoom)
            return;

        GameBuilder._lockRoom = false;
        if (Lobby?.triggerLockRoom)
            Lobby.triggerLockRoom();
    },

    

    updateSpecatorCounter: function()
    {
        fetch("/data/spectators/" + g_sRoom)
        .then((response) =>
        {
            if (response.status === 200)
                return response.json();
            else
                return { count: 0 };
        })
        .then((data) => GameBuilder.setSpectatorCount(data.count))
        .catch(console.error);  
    },

    setSpectatorCount:function(num:any)
    {
        const elem = document.getElementById("game_spectators");
        if (elem === null)
            return;

        elem.innerText = num;
        if (parseInt(num) < 1)
        {
            if (!elem.classList.contains("hidden"))
                elem.classList.add("hidden");
        }
        else if (elem.classList.contains("hidden"))
            elem.classList.remove("hidden");
    },

    initAdditionals : function()
    {
        const div_card_count = document.createElement("span");
        div_card_count.setAttribute("id", "draw_card_count");
        div_card_count.setAttribute("class", "card-hand-count")
        document.getElementById("draw_card")?.append(div_card_count);
        
        if (GameBuilder._isVisitor === true || g_sRoom === undefined || g_sRoom === "")
            return;

        if (document.getElementById("game_spectators") !== null)
        {
            this.updateSpecatorCounter();
            setInterval(GameBuilder.updateSpecatorCounter, GameBuilder._minuteInMillis); /* every minute */
        }
    },

    isVisitor : function()
    {
        return GameBuilder._isVisitor;
    },

    addToHandContainer : function(pElement:any)
    {
        const container = document.getElementById("playercard_hand_container");
        if (container === null)
            return pElement;

        container.prepend(pElement);    
        const currentHandSize = container.getElementsByClassName("card-hand").length;
        const allowed = this.getCurrentHandSizeCount();

        if (currentHandSize === allowed)
            pElement.classList.add("glowing");

        return pElement;
    },

    getCurrentHandSizeCount : function()
    {
        const container = document.getElementById("playercard-hand-content");
        if (container === null)
            return -1;

        try
        {
            const elem:any = container.querySelector(".card-hands-sizer-size");
            if (elem)
                return parseInt(elem.innerText);
        }
        catch (errIgnore)
        {

        }

        return -1;
    },

    _onClickDiscardHandCard : function(e:any)
    {
        const sUuid = e.target.getAttribute("data-card-uuid");

        if (sUuid !== null && sUuid !== undefined && sUuid !== "")
        {
            MeccgApi.send("/game/card/move", { uuid: sUuid, target: "discardpile", drawTop: false });
            DomUtils.removeNode(document.getElementById("card_icon_nr_" + sUuid));
        }

        return false;
    },

    /**
     * Creates a Card DIV when drawn
     * @param {String} _code
     * @param {String} _img
     * @param {String} _uuid
     * @param {String} _type
     * @return {Object} DOM Element
     */
    createHtmlElement: function(_code:string, _img:string, _uuid:string, _type:string)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand pos-rel");
        div.setAttribute("id", "card_icon_nr_" + _uuid);
        div.setAttribute("data-uuid", _uuid);
        div.setAttribute("data-card-type", _type);
        div.setAttribute("draggable", "true");

        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("src", _img);
        img.setAttribute("data-id", _code);
        img.setAttribute("class", "card-icon");

        const linkA = document.createElement("a");
        linkA.setAttribute("href", "#");
        linkA.setAttribute("class", "discardpile");
        linkA.setAttribute("data-card-uuid", _uuid);
        linkA.setAttribute("title", Dictionary.get("builder_move_topdiscard", "Move to top of discard pile"));
        linkA.onclick = GameBuilder._onClickDiscardHandCard;

        div.appendChild(img);
        div.appendChild(linkA);
        
        return div;
    },

    getSavedGame : function()
    {
        return this._saved;
    },
    
    onGameTime : function(jData:any)
    {
        let _online = typeof jData === "undefined" || jData.time < 0 ? 0 : jData.time;
        let nOffset = new Date(_online).getTimezoneOffset() * GameBuilder._minuteInMillis;

        GameBuilder._gameStarted = new Date(_online + nOffset).getTime();
        GameBuilder._timeStarted = new Date().getTime();
        GameBuilder.onCalcTime();
        setInterval(GameBuilder.onCalcTime, GameBuilder._minuteInMillis); /* every minute */
    },
    
    onCalcTime : function()
    {
        const elem = document.getElementById("game_time");
        if (elem === null)
            return;

        /* total milliseconds since the game has started */
        const lDiff = (new Date().getTime() - GameBuilder._timeStarted) + GameBuilder._gameStarted;
        const pDate = new Date(lDiff);
        
        const lMins = pDate.getHours() * 60 + pDate.getMinutes();
        if (lMins === 1)
            elem.innerText = "1min";
        else
            elem.innerText = lMins + "mins";
    },

    alreadyInHand: function(uuid:string)
    {
        return document.getElementById("card_icon_nr_" + uuid) !== null;
    },

    onClearHandVisitor : function()
    {
        const list:any = document.getElementsByClassName("visitor-hand-view");
        if (list === null || list.length === 0)
            return;

        for (let elem of list)
            DomUtils.removeAllChildNodes(elem);
    },

    onDrawCardVisitor : function(playerid:string, cardCode:string, uuid:string, type:string)
    {
        if (uuid === "" || type === "" || GameBuilder.alreadyInHand(uuid))
            return;
        
        const _code = CardList().getSafeCode(cardCode);
        const _img = CardList().getImage(cardCode);

        const container = document.getElementById("playercard_hand_container_" + playerid);
        if (container !== null)
        {
            container.appendChild(GameBuilder.createHtmlElement(_code, _img, uuid, type));
            CardPreview.addHover("card_icon_nr_" + uuid, false, true);
        }
    },

    onDrawCard : function(cardCode:string, uuid:string, type:string)
    {
        if (uuid === "" || type === "" || GameBuilder.alreadyInHand(uuid))
            return;
        
        const _code = CardList().getSafeCode(cardCode);
        const _img = CardList().getImage(cardCode);

        const elem = GameBuilder.addToHandContainer(GameBuilder.createHtmlElement(_code, _img, uuid, type));

        CardPreview.addHover("card_icon_nr_" + uuid, false, true);
        HandCardsDraggable.initDragEventsForHandCard("card_icon_nr_", uuid);

        const elemImage = elem?.querySelector("img");
        if (elemImage)
        {
            elem.setAttribute("title", Dictionary.get("builder_handcard_tip", "Drag card to play it or \nRIGHT CLICK to toggle playing it face down\nDOUBLECLICK to play card without dragging it."));
            elemImage.oncontextmenu = this.onHandCardContextClick.bind(this);           
            elemImage.ondblclick = this.onHandCardDoubleClick.bind(this);
        }
    },

    onHandCardDoubleClick : function(e:any)
    {
        const div = e.target.parentElement;
        const uuid = div.hasAttribute("data-uuid") ? div.getAttribute("data-uuid") : "";
        if (uuid === "")
            return;

        CreateHandCardsDraggableUtils.removeDraggableDomElement(div);
        HandCardsDraggable.onCreateNewCompany(uuid, "hand");
    },

    onHandCardContextClick : function(e:any)
    {
        const div = e.target.parentElement;
        const uuid = div.hasAttribute("data-uuid") ? div.getAttribute("data-uuid") : "";
        if (uuid === "")
            return;

        if (div.classList.contains("card-facedown"))
            div.classList.remove("card-facedown");
        else
            div.classList.add("card-facedown");

        MeccgApi.send("/game/card/state/hand", { uuid: uuid });
        return false;
    },

    onRestoreHand: function(cards:any[])
    {
        const container = document.getElementById("playercard_hand");
        if (container === null)
            return;

        const hand = document.getElementById("playercard_hand_container");
        if (hand !== null)
        {
            DomUtils.removeAllChildNodes(hand);
            for (let card of cards)
                this.onDrawCard(card.code, card.uuid, card.type);    
        }
    },
    
    onAttachCardToCompanySite : function(companyId:string, code:string, cardUuid:string, _state:any, reveal:boolean, owner:string)
    {                   
        const card = [{
            code : code,
            type: "hazard",
            state: 0,
            revealed : reveal,
            uuid : cardUuid,
            owner: owner
        }];
        GameCompanies.onAttachCardToCompanySites(companyId, card, true);
    },

    restoreBoard : function(jData:any)
    {
        if (jData.player)
        {
            for (let company of jData.player.companies)
                GameCompanies.drawCompany(true, company);
        }

        GameCompanies.onRemoveEmptyCompanies();

        if (jData.opponent)
        {
            for (let _data of jData.opponent.companies)
                GameCompanies.drawCompany(false, _data);
        }
        
        const scores:any = [];
        for (let id in jData.scores)
        {
            scores.push({
                id: id, 
                scores: jData.scores[id]
            });
        }
        setTimeout(() => {

            document.getElementById("lidles-eye")?.setAttribute("class", "fade-out")
            document.body.dispatchEvent(new CustomEvent("meccg-api-connected", { "detail": true }));
            document.body.dispatchEvent(new CustomEvent("meccg-sfx-ready", { "detail": true }));
            
            SCORE_API.updateInGameScores(scores);
            MeccgApi.send("/game/card/sites", { });

        }, 100);

        setTimeout(() => DomUtils.removeNode(document.getElementById("lidles-eye")), 1000);
    },
    
    /**
     * @deprecated
     */
    onAddCardToStagingArea : function()
    {
        return false;
    },

    onResolveHandNotification : function(sPhase:string)
    {
        switch(sPhase)
        {
            case "organisation":
            case "site":
            case "eotdiscard":
                GameBuilder.resolveHandNotification(sPhase);
                break;

            default:
                break;
        }
    },

    resolveHandNotification : function(sPhase:string)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-check-handsize", { "detail": sPhase }));
    },

    countCardsToDraw : function()
    {
        const elem = document.getElementById("playercard_hand_container");
        if (elem?.childElementCount !== 0 || GamePreferences?.drawToHandsize() !== true)
            return 1;
        
        const sizer:any = document.getElementById("playercard-hand-content")?.querySelector(".card-hands-sizer-size");
        if (sizer === null || sizer === undefined)
            return 1;

        const val =  parseInt(sizer.innerText);
        return !isNaN(val) && val > 0 ? val : 1;
    },

    onDrawNewCardToHand : function(e:any)
    {
        const count = GameBuilder.countCardsToDraw();
        for (let i = 0; i < count; i++)
            MeccgApi.send("/game/card/draw/single");
        
        e.stopPropagation();
        return false;
    },

    initRestEndpoints : function()
    {   
        const drawCard = document.getElementById("draw_card");
        if (drawCard)         
            drawCard.onclick = GameBuilder.onDrawNewCardToHand.bind(GameBuilder);

        MeccgApi.addListener("/game/card/draw", function(bIsMe:boolean, jData:any)
        {
            if (bIsMe)
                GameBuilder.onDrawCard(jData.code, jData.uuid, jData.type);
            else if (GameBuilder.isVisitor())
                GameBuilder.onDrawCardVisitor(jData.playerid, jData.code, jData.uuid, jData.type);

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "drawcard" }));
        });

        MeccgApi.addListener("/game/watch/draw", function(_bIsMe:boolean, jData:any)
        {
            if (GameBuilder.isVisitor())
                GameBuilder.onDrawCardVisitor(jData.playerid, jData.code, jData.uuid, jData.type);
        });

        MeccgApi.addListener("/game/watch/hand", function(_bIsMe:boolean, jData:any)
        {
            if (!GameBuilder.isVisitor())
                return;

            GameBuilder.onClearHandVisitor();
            for (let card of jData.cards)
                GameBuilder.onDrawCardVisitor(card.owner, card.code, card.uuid, card.type);
        });

        MeccgApi.addListener("/game/card/hand", function(bIsMe:boolean, jData:any)
        {
            if (bIsMe)
                GameBuilder.onRestoreHand(jData.cards);
        });

        
        MeccgApi.addListener("/game/sfx", (_bIsMe:boolean, jData:any) => document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": jData.type })));

        MeccgApi.addListener("/game/discardopenly", () => { /** fallback */ });

        MeccgApi.addListener("/game/add-onguard", function(bIsMe:boolean, jData:any)
        {
            GameBuilder.onAttachCardToCompanySite(jData.company, jData.code, jData.uuid, jData.state, jData.revealed, jData.owner);
            if (jData.revealed && !bIsMe)
                GameBuilder.showDropEventBox(jData.code, "");
        });


        MeccgApi.addListener("/game/view-cards/list", function(bIsMe:boolean, jData:any)
        {
            if (bIsMe)
                TaskBarCardsInterface.onShow(bIsMe, jData);
        });
        
        MeccgApi.addListener("/game/view-cards/reveal/list", (bIsMe:boolean, jData:any) => TaskBarCardsInterface.onShowOnOffer(bIsMe, jData));
        MeccgApi.addListener("/game/view-cards/list/close", () => TaskBarCardsInterface.hideOffer());
        
        MeccgApi.addListener("/game/view-cards/reveal/reveal", function(bIsMe:boolean, jData:any)
        {
            if (!bIsMe)
                TaskBarCardsInterface.onShowOnOfferReveal(jData.uuid);
        });
        MeccgApi.addListener("/game/view-cards/reveal/remove", function(bIsMe:boolean, jData:any)
        {
            if (!bIsMe)
                TaskBarCardsInterface.onShowOnOfferRemove(jData.uuid);
        });
                   
        MeccgApi.addListener("/game/state/save/receive", () => { /** fallback */});
        MeccgApi.addListener("/game/state/save/current", () => { /** fallback */});

        MeccgApi.addListener("/game/card/sites", function(bIsMe:boolean, jData:any) {

            if (bIsMe && typeof SiteList !== "undefined")
                SiteList.register(jData.cards);            
        });
        
        MeccgApi.addListener("/game/player/set-current", function(bIsMe:boolean, jData:any)
        {
            if (bIsMe)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "yourturn" }));
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("builder_yourturn", "It is your turn now.") }));
                return;
            }
            
            let sName = jData.displayname;
            if (typeof sName === "undefined" || sName.indexOf(">") !== -1 || sName.indexOf("<") !== -1)
                return;
            else if (sName.length > 40)
                sName = sName.substring(0, 39);
            
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": sName + " " + Dictionary.get("builder_whosactive", "is the active player.") }));

        });
        
        MeccgApi.addListener("/game/lobby/request", function() { /** deprecated */});

        MeccgApi.addListener("/game/dices/roll", function(bIsMe:boolean, jData:any)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-dice-rolled", { "detail": {
                isme : bIsMe,
                user : jData.user,
                first : jData.first,
                second : jData.second,
                total : jData.total,
                dice : jData.dice,
                uuid: jData.uuid,
                code: jData.code
            } }));

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "dice" }));
        });
        
        MeccgApi.addListener("/game/card/state/set-site", function(_bIsMe:boolean, jData:any)
        {
            const ownerId = jData.ownerId;
            const code = jData.code;
           
            if (!jData.tapped)
                GameCompanies.onMenuActionReadySite(ownerId, code);
            else
                GameCompanies.onMenuActionTapSite(ownerId, code);
        });
        
        
        MeccgApi.addListener("/game/card/token", function(_bIsMe:boolean, jData:any)
        {
            const uuid = jData.uuid === undefined ? "" : jData.uuid;
            const count = jData.count === undefined ? 0 : jData.count;
            const elem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
            if (elem !== null)
            {
                if (count > 0)
                    elem.setAttribute("data-token", count);
                else if (elem.hasAttribute("data-token"))
                    elem.removeAttribute("data-token");
            }
        });
        
        MeccgApi.addListener("/game/card/state/set", function(_bIsMe:boolean, jData:any)
        {
            const uuid = jData.uuid;
            const code = jData.code;
            const nState = jData.state;
            
            if (nState === 0)
                GameCompanies.onMenuActionReady(uuid);
            else if (nState === 90)
                GameCompanies.onMenuActionTap(uuid, code, false);
            else if (nState === 91)
                GameCompanies.onMenuActionTap(uuid, code, true);
            else if (nState === 180)
                GameCompanies.onMenuActionWound(uuid);
            else if (nState === 270)
                GameCompanies.onMenuActionRot270(uuid);
        });
        

        /* Remove cards from board */
        MeccgApi.addListener("/game/card/remove", function(bIsMe:boolean, list:any)
        {
            if (!bIsMe)
                GameCompanies.onRemoveCardsFromGame(list);
            
            GameCompanies.onRemoveEmptyCompanies();
        });

        MeccgApi.addListener("/game/card/reveal", (_bIsMe:boolean, jData:any) => GameCompanies.onMenuActionRevealCard(jData.uuid, jData.reveal));          
        MeccgApi.addListener("/game/card/state/glow", (_bIsMe:boolean, jData:any) =>GameCompanies.onMenuActionGlow(jData.uuid));
        MeccgApi.addListener("/game/card/state/highlight", (_bIsMe:boolean, jData:any) => GameCompanies.onMenuActionHighlight(jData.uuid));
        MeccgApi.addListener("/game/card/state/mark", (_bIsMe:boolean, jData:any) => GameCompanies.onMenuActionMark(jData.uuid, jData.mark));

        MeccgApi.addListener("/game/add-to-staging-area", () => console.warn("/game/add-to-staging-area is deprecated"));
        

        MeccgApi.addListener("/game/update-deck-counter/player/generics", function(bIsMe:boolean, playload:any)
        {
            if (bIsMe)
            {
                const div = document.getElementById("card_counter");
                if (div)
                {
                    TaskBarCardsInterface.SetPileSize(div.querySelector("a.discardpile span"), playload.discard);
                    TaskBarCardsInterface.SetPileSize(div.querySelector("a.sideboard span"), playload.sideboard);
                    TaskBarCardsInterface.SetPileSize(div.querySelector("a.playdeck span"), playload.playdeck);
                    TaskBarCardsInterface.SetPileSize(div.querySelector("a.victory span"), playload.victory);
                    TaskBarCardsInterface.SetPileSize(div.querySelector("a.hand span"), playload.hand);
                }

                const c = document.getElementById("draw_card_count");
                if (c)
                    c.innerText = playload.hand;
            }
            
            GameCompanies.updateHandSize(playload.player, playload.hand, playload.playdeck);
        });
        
        MeccgApi.addListener("/game/update-deck-counter/player/hand", function(bIsMe:boolean, jData:any)
        { 
            if (bIsMe)
            {
                const elem = document.getElementById("icon_hand");
                const span = elem === null ? null : elem.querySelector("span");
                if (span !== null)
                    span.innerText = jData.hand;
                
                HandCardsDraggable.checkReDeckNoteForPlayer(jData.playdeck);
            }
            
            GameCompanies.updateHandSize(jData.player, jData.hand, jData.playdeck);
        });
        
        MeccgApi.addListener("/game/remove-card-from-hand", function(bIsMe:boolean, jData:any)
        {
            const _uuid = jData;
            if (_uuid !== "" && (bIsMe || GameBuilder.isVisitor()))
                DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
         
            if (document.body.getAttribute("data-game-arda") === "true")
                DomUtils.removeNode(document.getElementById("arda-hand-card-" + _uuid));
        });

        MeccgApi.addListener("/game/time", (_bIsMe:boolean, jData:any) => GameBuilder.onGameTime(jData));

        MeccgApi.addListener("/game/remove-card-from-board", function(_bIsMe:boolean, jData:any)
        {
            const _uuid = jData;
            if (_uuid === "")
                return;
            
            DomUtils.removeAllChildNodes(document.getElementById("stagecard_" + _uuid));
            DomUtils.removeAllChildNodes(document.getElementById("ingamecard_" + _uuid));
            DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
        });

        MeccgApi.addListener("/game/player/draw/company", (bIsMe:boolean, jData:any) => GameCompanies.drawCompany(bIsMe, jData));
        MeccgApi.addListener("/game/player/indicator", (_bIsMe:boolean, jData:any) => GameCompanies.updateLastSeen(jData.userid, jData.connected));
        MeccgApi.addListener("/game/player/remove", (_bIsMe:boolean, jData:any) => GameCompanies.removePlayerIndicator(jData.userid));
        
        MeccgApi.addListener("/game/remove-empty-companies", (_bIsMe:boolean, jData:any) => GameCompanies.removeEmptyCompanies(jData));
        
        MeccgApi.addListener("/game/player/draw/locations", function(_bIsMe:boolean, jData:any)
        {
            let company = jData.company;
            let start = jData.start;
            let target = jData.target;
            let regions = jData.regions;
            
            if (start === undefined)
                start = "";

            if (target === undefined)
                target = "";

            if (regions === undefined)
                regions = [];

            if (company === undefined)
                company = "";
                
            GameCompanies.drawLocations(company, start, regions, target, jData.revealed, jData.attached, jData.current_tapped, jData.target_tapped, jData.revealStart);
        });

        
        MeccgApi.addListener("/game/set-turn", (_bIsMe:boolean, jData:any) => document.getElementById("game_turns")!.innerText = jData.turn);

        MeccgApi.addListener("/game/set-phase", GameBuilder.onSetPhase.doSet);
        MeccgApi.addListener("/game/start", GameBuilder.onSetPhase.doSetGameStart);        

        MeccgApi.addListener("/game/company/arrive", function(_bIsMe:boolean, jData:any)
        {
            GameCompanies.onCompanyArrivesAtDestination(jData.company, true);
            GameBuilder.resolveHandNotification("");
        });
        MeccgApi.addListener("/game/company/markcurrently", (_bIsMe:boolean, jData:any) => GameCompanies.onCompanyMarkCurrently(jData.uuid));

        MeccgApi.addListener("/game/company/returntoorigin", function(_bIsMe:boolean, jData:any)
        {
            GameCompanies.onCompanyReturnsToOrigin(jData.company, true);
            GameBuilder.resolveHandNotification("");
        });

        MeccgApi.addListener("/game/company/highlight", (_bIsMe:boolean, jData:any) => GameCompanies.onCompanyArrivesAtDestination(jData.company, false));
        MeccgApi.addListener("/game/company/location/reveal", (bIsMe:boolean, jData:any) => 
        { 
            GameCompanies.revealLocations(jData.company);
            if (!bIsMe)
                GameBuilder.showDropEventBox("", jData.company);
            else
            {
                const phase:any = document.querySelector(".taskbar .taskbar-turn.move");
                if (phase && typeof phase.click === "function")
                    phase.click();
            }
        });

        MeccgApi.addListener("/game/company/location/choose", (bIsMe:boolean, jData:any) => 
        {
            if (!bIsMe)
            {
                if (jData.hide)
                    GameCompanies.removeMapInteraction(jData.company);
                else
                    GameCompanies.showMapInteraction(jData.company);
            }
        });

        MeccgApi.addListener("/game/company/move", (bIsMe:boolean, jData:any) => {
            if (!bIsMe)
                ContextMenu.onMoveCompanyEvent(jData.companyid, jData.direction);
        });
        

        MeccgApi.addListener("/game/infobox/card", function(bIsMe:boolean, code:string)
        {
            if (!bIsMe)
                GameBuilder.showDropEventBox(code, "");
        });
        
        MeccgApi.addListener("/game/score/show", function(bIsMe:boolean, jData:any)
        {
            if (bIsMe)
                SCORE_API.showScoreSheet(jData);
        });

        MeccgApi.addListener("/game/score/doublemisc", (bIsMe:boolean, jData:any) => SCORE_API.setDoubleMisc(jData.misc === true));

        MeccgApi.addListener("/game/score/show/current", (_bIsMe:boolean, data:any) => SCORE_API.updateInGameScores(data));

        MeccgApi.addListener("/game/score/watch", (_bIsMe:boolean, jData:any) => SCORE_API.showScoreSheetWatch(jData));

        MeccgApi.addListener("/game/score/show-pile", function(bIsMe:boolean, jData:any)
        {
            if (bIsMe)
                SCORE_API.showScoreSheetCards(jData);
        });

        MeccgApi.addListener("/game/score/final", function(_bIsMe:boolean, jData:any)
        {
            MeccgApi.disconnect();                    
            SCORE_API.showFinalScore(jData.stats, false);
            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "endgame" }));
            
            MeccgApi.clearLocalStorage();
            JumbleCards.update(2);
        });

        MeccgApi.addListener("/game/score/final-only", function(_bIsMe:boolean, jData:any)
        {
            SCORE_API.showFinalScore(jData.stats, true);
            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "endgame" }));
            JumbleCards.update(2);
        });
        
        MeccgApi.addListener("/game/rejoin/immediately", (_bIsMe:boolean, jData:any) => GameBuilder.restoreBoard(jData));

        MeccgApi.addListener("/game/notification", (_bIsMe:boolean, jData:any) => 
        {
            if (jData.type === "warning")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": jData.message }));
            else if (jData.type === "error")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": jData.message }));
            else if (jData.type === "success")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": jData.message }));
        });

        MeccgApi.addListener("/game/hand/clear", () => DomUtils.removeAllChildNodes(document.getElementById("playercard_hand_container")));

        MeccgApi.addListener("/game/character/list", (_isMe:boolean, data:any) => 
        {
            if (Array.isArray(data.codes))
                GameBuilder.onChangeAvatarApp(data.codes);
            else
                GameBuilder.onChangeAvatarApp([]);
        });

        MeccgApi.addListener("/game/avatar/set", (isMe:boolean, data:any) => 
        {
            if (!isMe && data.code && data.userid)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-register-avatar", { "detail": {
                    userid : data.userid,
                    code: data.code,
                    force: true
                } }));
            }
        });

        MeccgApi.addListener("/game/deck/discard/playdeck", (isMe:boolean, data:any) => 
        {
            if (isMe && data?.success)
                document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "shuffle" }));
        });
        
    },


    onSetPhase : {

        unsetCurrentPlayer : function(bIsMe:boolean)
        {
            const jTaskbar = document.querySelector(".taskbar");
            if (jTaskbar === null)
                return;

            if (bIsMe)
                jTaskbar.classList.remove("turn-opponent");
            else if (!jTaskbar.classList.contains("turn-opponent"))
                jTaskbar.classList.add("turn-opponent");
            
            const list:any = jTaskbar.querySelectorAll("a");
            for (let elem of list)
                elem.classList.remove("act");
        },

        processPhaseSpecific : function(bIsMe:boolean, sPhase:string, sCurrent:string)
        {
            switch(sPhase)
            {
                case "start":
                    if (bIsMe)
                        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("builder_yourturn", "It is your turn now.") }));
                        
                    GameCompanies.onEnterStartPhase();
                    break;
                case "organisation":
                    GameCompanies.onEnterOrganisationPhase(sCurrent, bIsMe);
                    GameCompanies.onRemoveAllMarkings();
                    
                    if (g_sLobbyToken !== "" && document.body.hasAttribute("data-autosave"))
                        MeccgApi.send("/game/save/auto", {});

                    break;
                case "movement":
                    GameCompanies.onEnterMovementHazardPhase();
                    GameCompanies.onRemoveAllMarkings();
                    break;
                case "site":
                    GameCompanies.onEnterSitePhase(sCurrent, bIsMe);
                    GameCompanies.onRemoveAllMarkings();
                    break;

                case "longevent":
                case "eotdiscard":
                case "eot":
                    break;

                default:
                    return false;
            }
        },

        doSetGameStart : function()
        {
            TurnStats.ResetStat();
        },

        doSet : function(bIsMe:boolean, jData:any)
        {
            const sPhase = jData.phase;
            const sCurrent = jData.currentplayer;
            
            GameBuilder.onSetPhase.unsetCurrentPlayer(bIsMe);

            /** maybe notify on hand size */
            GameBuilder.onResolveHandNotification(sPhase);

            MeccgPlayers.setMyTurn(bIsMe);

            GameBuilder.onSetPhase.processPhaseSpecific(bIsMe, sPhase, sCurrent);

            GameCompanies.removeCompanyMarking();
            GameCompanies.setCurrentPlayer(sCurrent, bIsMe);

            if (sPhase !== "start" && !GameBuilder._hiddenStartPhase)
            {
                GameBuilder._hiddenStartPhase = true;
                DomUtils.removeNode(document.getElementById("startphase_turn"));
            }
            
            /** update links in taskbar */
            GameBuilder.onSetPhase.updateTaskbarTurn(sPhase);

            if (bIsMe || GameBuilder.isVisitor())
                document.body.dispatchEvent(new CustomEvent("meccg-event-phase", { "detail": { phase: sPhase, visitor: GameBuilder.isVisitor() } }));

            if (sPhase === "start" || "organisation" === sPhase)
                document.body.dispatchEvent(new CustomEvent("meccg-event-turn", { "detail": sCurrent }));

            if (sPhase !== "start")
                GameBuilder.triggerLockRoom();
        },

        updateTaskbarTurn : function(sPhase:string)
        {
            const list:any = document.querySelectorAll(".taskbar .taskbar-turn");
            for (let jThis of list)
            {
                if (jThis.getAttribute("data-phase") === sPhase)
                {
                    jThis.classList.add("act");
                    document.querySelector(".area.area-player")?.setAttribute("data-turn-phase", sPhase);
                    break;
                }
            }
        }
    },
                            
    queryConnectionStatus : function()
    {
        GameCompanies.clearLastSeen();
        MeccgApi.send("/game/player/time", {});
    },
    
    onDisconnected : () => GameCompanies.updateLastSeen(MeccgPlayers.getChallengerId(), false),
    onConnected : () => GameCompanies.updateLastSeen(MeccgPlayers.getChallengerId(), true),
    onError : (error:any) => console.error('There has been a problem with your fetch operation:', error),

    onChangeAvatarApp : function(codes:string[])
    {
        ChangeAvatarApp.init(codes);
    }
};

const ChangeAvatarApp = {

    requireDialogElement : function()
    {
        const elem = document.getElementById("chanage-avatar-app");
        if (elem !== null)
            return elem;

        const dialogElem = document.createElement("dialog");
        dialogElem.setAttribute("id", "chanage-avatar-app");
        dialogElem.setAttribute("class", "chanage-avatar-app");

        return dialogElem;
    },

    clearChildren : function(parent:any)
    {
        while (parent.firstChild) 
            parent.removeChild(parent.firstChild);
    },

    close : function()
    {
        const dialogElem:any = document.getElementById("chanage-avatar-app");
        if (dialogElem === null)
            return;

        dialogElem.close();
        
        if (dialogElem.parentElement)
            dialogElem.parentElement.removeChild(dialogElem);
    },

    createImageElement : function(code:string)
    {
        const src = CardList().getImageByCode(code, "");
        if (src === "")
            return null;

        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("title", Dictionary.get("builder_chooseavatar", "Click to choose this avatar"));
        img.setAttribute("data-code", code);
        img.setAttribute("decoding", "async");
        img.onclick = this.onselectavatar.bind(this);
        return img;
    },

    onselectavatar:function(e:any)
    {
        const code = e.target.getAttribute("data-code");
        ChangeAvatarApp.close();

        MeccgApi.send("/game/avatar/set", { code: code }); 
        document.body.dispatchEvent(new CustomEvent("meccg-register-avatar", { "detail": {
            userid : MeccgPlayers.getChallengerId(),
            code: code,
            force: true
        } }));
    },

    createTitle : function()
    {
        const div = document.createDocumentFragment();

        const h2 = document.createElement("h2");
        h2.innerText = Dictionary.get("builder_chooseavatar_title", "Choose your Avatar");

        const p = document.createElement("p");
        p.innerText = Dictionary.get("builder_chooseavatar_text", "Click on your avatar/character or press ESC to close");

        div.append(h2, p);
        return div;
    },

    populateCards : function(codes:string[])
    {
        const div = document.createDocumentFragment();
        if (codes.length === 0)
            return div;

        codes.sort((a,b) => a.localeCompare(b));

        for (let code of codes)
        {
            const elem = this.createImageElement(code);
            if (elem !== null)
                div.append(elem);            
        }
        
        return div;
    },

    init: function(codes:string[])
    {
        if (MeccgPlayers === undefined)
            return;

        if (codes.length === 0)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("builder_nocharsavail", "No characters available.") }));
            return;
        }
        
        if (this.avatarCodes !== null)
        {
            this.onAvatarsAvailable(codes);
            return;
        }
        
        fetch("/data/list/avatars")
        .then(result => result.json())
        .then(json => ChangeAvatarApp.avatarCodes = json)
        .catch(console.error)
        .finally(() => this.onAvatarsAvailable(codes));
    },

    onAvatarsAvailable : function(codes:string[])
    {
        const dialogElem:any = this.requireDialogElement();
        this.clearChildren(dialogElem);

        dialogElem.append(
            this.createTitle(),
            this.populateCards(this.filterCharacters(codes, true)),
            this.populateCards(this.filterCharacters(codes, false))
        );

        document.body.append(dialogElem);
        dialogElem.showModal();   
    },

    isAvatar : function(code:string)
    {
        return (this.avatarCodes as string[]).includes(code) === true;
    },

    filterCharacters:function(codes:string[], bAvatarsOnly:boolean)
    {
        const list = [];
        for (let code of codes)
        {
            if (this.isAvatar(code) === bAvatarsOnly)
                list.push(code);
        }

        return list;
    },

    avatarCodes : []
};

export default function createGameBuilder()
{
    document.body.addEventListener("meccg-connected", GameBuilder.onConnected.bind(GameBuilder));
    document.body.addEventListener("meccg-disconnected", GameBuilder.onDisconnected.bind(GameBuilder));

    GameBuilder.initRestEndpoints();
    GameBuilder.initAdditionals();
}
