const GameBuilder = {
        
    _minuteInMillis : 60 * 1000,
    _gameStarted : 0,
    _timeStarted : 0,
    _hiddenStartPhase : false,
    _saved : { },
    _isVisitor : false,
    _lockRoom : false,

    CardList : null,
    CardPreview : null,
    HandCardsDraggable : null,
    CompanyManager : null,
    Stagingarea : null,
    Scoring : null,

    getSiteOfOrigin : function(company)
    {
        if (company === "")
            return null;

        const container = document.getElementById("company_" + company);
        if (container === null)
            return null;

        const targetSite = container.querySelector(".site-target");
        if (targetSite === null)
            return null;

        const div = targetSite.querySelector(".card");
        const code = div === null || !div.hasAttribute("data-card-code") ? "" : div.getAttribute("data-card-code");
        return code && code !== "" ? code : null;
    },

    showDropEventBox : function(code, company)
    {
        if (company && company !== "")
            code = GameBuilder.getSiteOfOrigin(company);

        if (InfoBoxCard !== undefined) /** backward compatibility */
            InfoBoxCard.showImage(code);
    },

    createGameBuilder : function(_CardList_, _CardPreview_, _HandCardsDraggable_, _CompanyManager_, _Stagingarea_, _Scoring_)
    {
        GameBuilder.CardList = _CardList_;
        GameBuilder.CardPreview = _CardPreview_;
        GameBuilder.HandCardsDraggable = _HandCardsDraggable_;
        GameBuilder.CompanyManager = _CompanyManager_;
        GameBuilder.Stagingarea = _Stagingarea_;
        GameBuilder.Scoring = _Scoring_;
        GameBuilder._isVisitor = document.body.getAttribute("data-is-watcher") === "true";

        document.body.addEventListener("meccg-connected", GameBuilder.onConnected.bind(GameBuilder));
        document.body.addEventListener("meccg-disconnected", GameBuilder.onDisconnected.bind(GameBuilder));
        
        GameBuilder.initRestEndpoints();
        GameBuilder.initAdditionals();

        if (!GameBuilder._isVisitor && g_sLobbyToken !== "")
            GameBuilder._lockRoom = GameBuilder.isFirstConnection();
    },

    triggerLockRoom : function()
    {
        if (!GameBuilder._lockRoom)
            return;

        GameBuilder._lockRoom = false;
        if (typeof Lobby !== "undefined" && typeof Lobby.triggerLockRoom === "function")
            Lobby.triggerLockRoom();
    },

    isFirstConnection : function()
    {
        try
        {
            const val = document.body.hasAttribute("data-connected-count") ? document.body.getAttribute("data-connected-count") : "";
            return val !== "" && parseInt(val) === 0;
        }
        catch (err)
        {
            console.error(err);            
        }

        return false;
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

    setSpectatorCount:function(num)
    {
        const elem = document.getElementById("game_spectators");
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
        document.getElementById("draw_card").append(div_card_count);
        
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

    addToHandContainer : function(pElement)
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
        const elem = container.querySelector(".card-hands-sizer-size");
        if (elem === null)
            return -1;

        const val = elem.innerText;
        try
        {
            return parseInt(val);
        }
        catch (errIgnore)
        {

        }

        return -1;
    },

    _onClickDiscardHandCard : function(e)
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
    createHtmlElement: function(_code, _img, _uuid, _type)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand pos-rel");
        div.setAttribute("id", "card_icon_nr_" + _uuid);
        div.setAttribute("data-uuid", _uuid);
        div.setAttribute("data-card-type", _type);
        div.setAttribute("draggable", "true");

        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        if (g_bSetImgAnonymous)
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
    
    onGameTime : function(jData)
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
        /* total milliseconds since the game has started */
        let lDiff = (new Date().getTime() - GameBuilder._timeStarted) + GameBuilder._gameStarted;
        let pDate = new Date(lDiff);
        
        const lMins = pDate.getHours() * 60 + pDate.getMinutes();
        if (lMins === 1)
            document.getElementById("game_time").innerText = "1min";
        else
            document.getElementById("game_time").innerText = lMins + "mins";
    },

    alreadyInHand: function(uuid)
    {
        return document.getElementById("card_icon_nr_" + uuid) !== null;
    },

    onClearHandVisitor : function()
    {
        const list = document.getElementsByClassName("visitor-hand-view");
        if (list === null || list.length === 0)
            return;

        for (let elem of list)
            DomUtils.removeAllChildNodes(elem);
    },

    onDrawCardVisitor : function(playerid, cardCode, uuid, type)
    {
        if (uuid === "" || type === "" || GameBuilder.alreadyInHand(uuid))
            return;
        
        const _code = GameBuilder.CardList.getSafeCode(cardCode);
        const _img = GameBuilder.CardList.getImage(cardCode);

        const container = document.getElementById("playercard_hand_container_" + playerid);
        if (container !== null)
        {
            container.appendChild(GameBuilder.createHtmlElement(_code, _img, uuid, type));
            GameBuilder.CardPreview.addHover("card_icon_nr_" + uuid, false, true);
        }
    },

    onDrawCard : function(cardCode, uuid, type)
    {
        if (uuid === "" || type === "" || GameBuilder.alreadyInHand(uuid))
            return;
        
        const _code = GameBuilder.CardList.getSafeCode(cardCode);
        const _img = GameBuilder.CardList.getImage(cardCode);

        const elem = GameBuilder.addToHandContainer(GameBuilder.createHtmlElement(_code, _img, uuid, type));

        GameBuilder.CardPreview.addHover("card_icon_nr_" + uuid, false, true);
        GameBuilder.HandCardsDraggable.initDragEventsForHandCard("card_icon_nr_", uuid, type);

        const elemImage = elem?.querySelector("img");
        if (elemImage)
        {
            elem.setAttribute("title", Dictionary.get("builder_handcard_tip", "Drag card to play it or \nRIGHT CLICK to toggle playing it face down\nDOUBLECLICK to play card without dragging it."));
            elemImage.ondblclick = this.onHandCardDoubleClick.bind(this);

            if (ContextMenu)
                ContextMenu.initHandCard(elem);
            else
                elemImage.oncontextmenu = this.onHandCardContextClick.bind(this);           
        }
    },

    onHandCardDoubleClick : function(e)
    {
        const div = e.target.parentElement;
        const uuid = div.hasAttribute("data-uuid") ? div.getAttribute("data-uuid") : "";
        if (uuid === "")
            return;

        const isChar = div.getAttribute("data-card-type") === "character";

        CreateHandCardsDraggableUtils.removeDraggableDomElement(div);
        if (isChar)
            HandCardsDraggable.onCreateNewCompany(uuid, "hand");
        else
            HandCardsDraggable.onAddGenericCardToStagingArea(uuid, true);
    },

    onHandCardContextClick : function(e)
    {
        const div = e.target.parentElement;
        const uuid = div && div.hasAttribute("data-uuid") ? div.getAttribute("data-uuid") : "";
        if (uuid !== "")
            MeccgApi.send("/game/card/state/hand", { uuid: uuid });

        return false;
    },

    onRestoreHand: function(cards)
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
    
    onAttachCardToCompanySite : function(companyId, code, cardUuid, _state, reveal, owner)
    {                   
        const card = [{
            code : code,
            type: "hazard",
            state: 0,
            revealed : reveal,
            uuid : cardUuid,
            owner: owner
        }];
        GameBuilder.CompanyManager.onAttachCardToCompanySites(companyId, card, true);
    },

    restoreBoard : function(jData)
    {
        if (jData.player)
        {
            for (let company of jData.player.companies)
                GameBuilder.CompanyManager.drawCompany(true, company);

            for (let _data of jData.player.stage_hazards)
                GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary, _data.stage);
            
            for (let _data of jData.player.stage_resources)
                GameBuilder.onAddCardToStagingArea(true, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary, _data.stage);
        }

        GameBuilder.CompanyManager.onRemoveEmptyCompanies();

        if (jData.opponent)
        {
            for (let _data of jData.opponent.companies)
                GameBuilder.CompanyManager.drawCompany(false, _data);
            
            for (let _data of jData.opponent.stage_hazards)
                GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary, _data.stage);
            
            for (let _data of jData.opponent.stage_resources)
                GameBuilder.onAddCardToStagingArea(false, _data.code, _data.uuid, _data.type, _data.state, _data.revealed, _data.turn, _data.token, _data.secondary, _data.stage);
        }
        
        const scores = [];
        for (let id in jData.scores)
        {
            scores.push({
                id: id, 
                scores: jData.scores[id]
            });
        }
        setTimeout(() => {

            document.getElementById("lidles-eye").setAttribute("class", "fade-out")
            document.body.dispatchEvent(new CustomEvent("meccg-api-connected", { "detail": true }));
            document.body.dispatchEvent(new CustomEvent("meccg-sfx-ready", { "detail": true }));
            
            GameBuilder.Scoring.updateInGameScores(scores);
            MeccgApi.send("/game/card/sites", { });

        }, 100);

        setTimeout(() => DomUtils.removeNode(document.getElementById("lidles-eye")), 1000);
    },
    
    onAddCardToStagingArea : function(bIsMe, cardCode, uuid, type = "", state = "", revealed = true, turn = 0, token = 0, secondary = "", stage = false)
    {
        const cardId = GameBuilder.Stagingarea.onAddCardToStagingArea(bIsMe, uuid, cardCode, type, state, revealed, turn, token, secondary, stage);
        if (cardId === "")
            return false;
        else 
            GameBuilder.HandCardsDraggable.initCardInStagingArea(cardId, "", type);
        
        return true;
    },

    onResolveHandNotification : function(sPhase)
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

    resolveHandNotification : function(sPhase)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-check-handsize", { "detail": sPhase }));
    },

    countCardsToDraw : function()
    {
        const elem = document.getElementById("playercard_hand_container");
        if (elem?.childElementCount !== 0 || GamePreferences?.drawToHandsize() !== true)
            return 1;
        
        const sizer = document.getElementById("playercard-hand-content")?.querySelector(".card-hands-sizer-size");
        if (sizer === null || sizer === undefined)
            return 1;

        const val =  parseInt(sizer.innerText);
        return !isNaN(val) && val > 0 ? val : 1;
    },

    onDrawNewCardToHand : function(e)
    {
        const count = GameBuilder.countCardsToDraw();
        for (let i = 0; i < count; i++)
            MeccgApi.send("/game/card/draw/single");
        
        e.stopPropagation();
        return false;
    },

    initRestEndpoints : function()
    {            
        document.getElementById("draw_card").onclick = GameBuilder.onDrawNewCardToHand;

        MeccgApi.addListener("/game/card/draw", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.onDrawCard(jData.code, jData.uuid, jData.type);
            else if (GameBuilder.isVisitor())
                GameBuilder.onDrawCardVisitor(jData.playerid, jData.code, jData.uuid, jData.type);

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "drawcard" }));
        });

        MeccgApi.addListener("/game/watch/draw", function(_bIsMe, jData)
        {
            if (GameBuilder.isVisitor())
                GameBuilder.onDrawCardVisitor(jData.playerid, jData.code, jData.uuid, jData.type);
        });

        MeccgApi.addListener("/game/watch/hand", function(_bIsMe, jData)
        {
            if (!GameBuilder.isVisitor())
                return;

            GameBuilder.onClearHandVisitor();
            for (let card of jData.cards)
                GameBuilder.onDrawCardVisitor(card.owner, card.code, card.uuid, card.type);
        });

        MeccgApi.addListener("/game/card/hand", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.onRestoreHand(jData.cards);
        });

        
        MeccgApi.addListener("/game/sfx", (_bIsMe, jData) => document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": jData.type })));

        MeccgApi.addListener("/game/discardopenly", () => { /** fallback */ });

        MeccgApi.addListener("/game/add-onguard", function(bIsMe, jData)
        {
            GameBuilder.onAttachCardToCompanySite(jData.company, jData.code, jData.uuid, jData.state, jData.revealed, jData.owner);
            if (jData.revealed && !bIsMe)
                GameBuilder.showDropEventBox(jData.code, "");
        });


        MeccgApi.addListener("/game/view-cards/list", function(bIsMe, jData)
        {
            if (bIsMe)
                g_Game.TaskBarCards.onShow(bIsMe, jData);
        });
        
        MeccgApi.addListener("/game/view-cards/reveal/list", (bIsMe, jData) => g_Game.TaskBarCards.onShowOnOffer(bIsMe, jData));
        MeccgApi.addListener("/game/view-cards/list/close", () => g_Game.TaskBarCards.hideOffer());
        
        MeccgApi.addListener("/game/view-cards/reveal/reveal", function(bIsMe, jData)
        {
            if (!bIsMe)
                g_Game.TaskBarCards.onShowOnOfferReveal(jData.uuid);
        });
        MeccgApi.addListener("/game/view-cards/reveal/remove", function(bIsMe, jData)
        {
            if (!bIsMe)
                g_Game.TaskBarCards.onShowOnOfferRemove(jData.uuid);
        });
                   
        MeccgApi.addListener("/game/state/save/receive", () => { /** fallback */});
        MeccgApi.addListener("/game/state/save/current", () => { /** fallback */});

        MeccgApi.addListener("/game/card/sites", function(bIsMe, jData) {

            if (bIsMe && typeof SiteList !== "undefined")
                SiteList.register(jData.cards);            
        });
        
        MeccgApi.addListener("/game/player/set-current", function(bIsMe, jData)
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

        MeccgApi.addListener("/game/dices/roll", function(bIsMe, jData)
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
        
        MeccgApi.addListener("/game/card/state/set-site", function(_bIsMe, jData)
        {
            const ownerId = jData.ownerId;
            const code = jData.code;
           
            if (!jData.tapped)
                GameBuilder.CompanyManager.onMenuActionReadySite(ownerId, code);
            else
                GameBuilder.CompanyManager.onMenuActionTapSite(ownerId, code);
        });
        
        
        MeccgApi.addListener("/game/card/token", function(_bIsMe, jData)
        {
            const uuid = jData.uuid === undefined ? "" : jData.uuid;
            const count = jData.count === undefined ? 0 : jData.count;
            const elem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
            const type = jData.type === "token-mp" ? "data-token-mp" : "data-token";
            if (elem !== null)
            {
                if (count > 0)
                    elem.setAttribute(type, count);
                else if (elem.hasAttribute(type))
                    elem.removeAttribute(type);
            }
        });
        
        MeccgApi.addListener("/game/card/state/set", function(_bIsMe, jData)
        {
            const uuid = jData.uuid;
            const code = jData.code;
            const nState = jData.state;
            
            if (nState === 0)
                GameBuilder.CompanyManager.onMenuActionReady(uuid, code);
            else if (nState === 90)
                GameBuilder.CompanyManager.onMenuActionTap(uuid, code, false);
            else if (nState === 91)
                GameBuilder.CompanyManager.onMenuActionTap(uuid, code, true);
            else if (nState === 180)
                GameBuilder.CompanyManager.onMenuActionWound(uuid, code);
            else if (nState === 270)
                GameBuilder.CompanyManager.onMenuActionRot270(uuid, code);
        });
        

        /* Remove cards from board */
        MeccgApi.addListener("/game/card/remove", function(bIsMe, list)
        {
            if (!bIsMe)
                GameBuilder.CompanyManager.onRemoveCardsFromGame(list);
            
            GameBuilder.CompanyManager.onRemoveEmptyCompanies();
        });

        MeccgApi.addListener("/game/card/reveal", (_bIsMe, jData) => GameBuilder.CompanyManager.onMenuActionRevealCard(jData.uuid, jData.reveal));          
        MeccgApi.addListener("/game/card/state/glow", (_bIsMe, jData) =>GameBuilder.CompanyManager.onMenuActionGlow(jData.uuid));
        MeccgApi.addListener("/game/card/state/highlight", (_bIsMe, jData) => GameBuilder.CompanyManager.onMenuActionHighlight(jData.uuid));
        MeccgApi.addListener("/game/card/state/mark", (_bIsMe, jData) => GameBuilder.CompanyManager.onMenuActionMark(jData.uuid, jData.mark));

        MeccgApi.addListener("/game/add-to-staging-area", (bIsMe, jData) => {
            GameBuilder.onAddCardToStagingArea(bIsMe, jData.code, jData.uuid, jData.type, jData.state, jData.revealed, jData.turn, jData.token, jData.secondary, jData.stage);
            if (jData.revealed && !bIsMe)
                GameBuilder.showDropEventBox(jData.code, "");
        });

        MeccgApi.addListener("/game/update-deck-counter/player/generics", function(bIsMe, playload)
        {
            if (bIsMe)
            {
                const div = document.getElementById("card_counter");
                TaskBarCards.SetPileSize(div.querySelector("a.discardpile span"), playload.discard);
                TaskBarCards.SetPileSize(div.querySelector("a.sideboard span"), playload.sideboard);
                TaskBarCards.SetPileSize(div.querySelector("a.playdeck span"), playload.playdeck);
                TaskBarCards.SetPileSize(div.querySelector("a.victory span"), playload.victory);
                TaskBarCards.SetPileSize(div.querySelector("a.hand span"), playload.hand);
                document.getElementById("draw_card_count").innerText = playload.hand;
            }
            
            GameBuilder.CompanyManager.updateHandSize(playload.player, playload.hand, playload.playdeck);
        });
        
        MeccgApi.addListener("/game/update-deck-counter/player/hand", function(bIsMe, jData)
        { 
            if (bIsMe)
            {
                const elem = document.getElementById("icon_hand");
                const span = elem === null ? null : elem.querySelector("span");
                if (span !== null)
                    span.innerText = jData.hand;
                
                GameBuilder.HandCardsDraggable.checkReDeckNoteForPlayer(jData.playdeck);
            }
            
            GameBuilder.CompanyManager.updateHandSize(jData.player, jData.hand, jData.playdeck);
        });
        
        MeccgApi.addListener("/game/remove-card-from-hand", function(bIsMe, jData)
        {
            const _uuid = jData;
            if (_uuid !== "" && (bIsMe || GameBuilder.isVisitor()))
                DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
         
            if (document.body.getAttribute("data-game-arda") === "true")
                DomUtils.removeNode(document.getElementById("arda-hand-card-" + _uuid));
        });

        MeccgApi.addListener("/game/time", (_bIsMe, jData) => GameBuilder.onGameTime(jData));

        MeccgApi.addListener("/game/remove-card-from-board", function(_bIsMe, jData)
        {
            const _uuid = jData;
            if (_uuid === "")
                return;
            
            DomUtils.removeAllChildNodes(document.getElementById("stagecard_" + _uuid));
            DomUtils.removeAllChildNodes(document.getElementById("ingamecard_" + _uuid));
            DomUtils.removeAllChildNodes(document.getElementById("card_icon_nr_" + _uuid));
        });

        MeccgApi.addListener("/game/player/draw/company", (bIsMe, jData) => GameBuilder.CompanyManager.drawCompany(bIsMe, jData));
        MeccgApi.addListener("/game/player/indicator", (_bIsMe, jData) => GameBuilder.CompanyManager.updateLastSeen(jData.userid, jData.connected));
        MeccgApi.addListener("/game/player/remove", (_bIsMe, jData) => GameBuilder.CompanyManager.removePlayerIndicator(jData.userid));
        
        MeccgApi.addListener("/game/remove-empty-companies", (_bIsMe, jData) => GameBuilder.CompanyManager.removeEmptyCompanies(jData));
        
        MeccgApi.addListener("/game/player/draw/locations", function(_bIsMe, jData)
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
                
            GameBuilder.CompanyManager.drawLocations(company, start, regions, target, jData.revealed, jData.attached, jData.current_tapped, jData.target_tapped, jData.revealStart);
        });

        
        MeccgApi.addListener("/game/card/updatetype", (_bIsMe, data) => {

            const id = "card_icon_nr_" + data.uuid;
            const div = document.getElementById(id);
            const img = div ? div.querySelector("img") : null;
            
            if (div && img && data.type)
            {
                div.setAttribute("data-card-type", data.type);
                img.dispatchEvent(new MouseEvent('dblclick'));
            }
        });

        MeccgApi.addListener("/game/card/state/hand", (_bIsMe, data) => {

            const div = document.getElementById("card_icon_nr_" + data.uuid);
            const img = div ? div.querySelector("img") : null;
            if (img !== null)
                img.dispatchEvent(new MouseEvent('dblclick'));
        });

        
        MeccgApi.addListener("/game/set-turn", (_bIsMe, jData) => document.getElementById("game_turns").innerHTML = jData.turn);

        MeccgApi.addListener("/game/set-phase", GameBuilder.onSetPhase.doSet);
        MeccgApi.addListener("/game/start", GameBuilder.onSetPhase.doSetGameStart);        

        MeccgApi.addListener("/game/company/arrive", function(_bIsMe, jData)
        {
            GameBuilder.CompanyManager.onCompanyArrivesAtDestination(jData.company, true);
            GameBuilder.resolveHandNotification();
        });
        MeccgApi.addListener("/game/company/markcurrently", (_bIsMe, jData) => GameBuilder.CompanyManager.onCompanyMarkCurrently(jData.uuid));

        MeccgApi.addListener("/game/company/returntoorigin", function(_bIsMe, jData)
        {
            GameBuilder.CompanyManager.onCompanyReturnsToOrigin(jData.company, true);
            GameBuilder.resolveHandNotification();
        });

        MeccgApi.addListener("/game/company/highlight", (_bIsMe, jData) => GameBuilder.CompanyManager.onCompanyArrivesAtDestination(jData.company, false));
        MeccgApi.addListener("/game/company/location/reveal", (bIsMe, jData) => 
        { 
            GameBuilder.CompanyManager.revealLocations(jData.company);
            if (!bIsMe)
                GameBuilder.showDropEventBox("", jData.company);
            else
            {
                const phase = document.querySelector(".taskbar .taskbar-turn.move");
                if (phase !== null && typeof phase.click === "function")
                    phase.click();
            }
        });

        MeccgApi.addListener("/game/company/location/choose", (bIsMe, jData) => 
        {
            if (!bIsMe)
            {
                if (jData.hide)
                    GameBuilder.CompanyManager.removeMapInteraction(jData.company);
                else
                    GameBuilder.CompanyManager.showMapInteraction(jData.company);
            }
        });

        

        MeccgApi.addListener("/game/infobox/card", function(bIsMe, code)
        {
            if (!bIsMe)
                GameBuilder.showDropEventBox(code, "");
        });
        
        MeccgApi.addListener("/game/score/show", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.Scoring.showScoreSheet(jData);
        });

        MeccgApi.addListener("/game/score/doublemisc", (bIsMe, jData) => GameBuilder.Scoring.setDoubleMisc(jData.misc === true));

        MeccgApi.addListener("/game/score/show/current", (_bIsMe, data) => GameBuilder.Scoring.updateInGameScores(data));

        MeccgApi.addListener("/game/score/watch", (_bIsMe, jData) => GameBuilder.Scoring.showScoreSheetWatch(jData));

        MeccgApi.addListener("/game/score/show-pile", function(bIsMe, jData)
        {
            if (bIsMe)
                GameBuilder.Scoring.showScoreSheetCards(jData);
        });

        MeccgApi.addListener("/game/score/final", function(_bIsMe, jData)
        {
            MeccgApi.disconnect();                    
            GameBuilder.Scoring.showFinalScore(jData.stats, false);
            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "endgame" }));
            
            MeccgApi.clearLocalStorage();
            JumbleCards.update(2);
        });

        MeccgApi.addListener("/game/score/onering", (_bIsMe, jData) => GameBuilder.Scoring.setOneRingWinnder(jData.userid));

        MeccgApi.addListener("/game/score/final-only", function(_bIsMe, jData)
        {
            GameBuilder.Scoring.showFinalScore(jData.stats, true);
            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "endgame" }));
            JumbleCards.update(2);
        });
        
        MeccgApi.addListener("/game/rejoin/immediately", (_bIsMe, jData) => GameBuilder.restoreBoard(jData));

        MeccgApi.addListener("/game/notification", (_bIsMe, jData) => 
        {
            if (jData.type === "warning")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": jData.message }));
            else if (jData.type === "error")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": jData.message }));
            else if (jData.type === "success")
                document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": jData.message }));
        });

        MeccgApi.addListener("/game/hand/clear", () => DomUtils.removeAllChildNodes(document.getElementById("playercard_hand_container")));

        MeccgApi.addListener("/game/character/list", (_isMe, data) => 
        {
            if (Array.isArray(data.codes))
                GameBuilder.onChangeAvatarApp(data.codes);
            else
                GameBuilder.onChangeAvatarApp([]);
        });

        MeccgApi.addListener("/game/avatar/set", (isMe, data) => 
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

        MeccgApi.addListener("/game/deck/discard/playdeck", (isMe, data) => 
        {
            if (isMe && data?.success)
                document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "shuffle" }));
        });
        
        MeccgApi.addListener("/game/changebrowser", (isMe, data) => {
            const url = location.origin + "/transfer/" + data.room + "/" + data.token;
    
            const p1 = document.createElement("p");
            p1.innerText = Dictionary.get("conf_share_copied_ok", "Link copied to clipboard.")

            const p2 = document.createElement("p");
            p2.innerText = Dictionary.get("conf_switch_1", "Open this link in the other browser.");
    
            const content = document.createElement("div");
            content.setAttribute("class", "text-left");
            content.append(
                p1,
                p2,
            );

            if (navigator === undefined || navigator.clipboard === undefined)
            {
                console.warn("Cannot acccess clipboard");
                return;
            }

            navigator.clipboard.writeText(url)
            .then(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("conf_share_copied_ok", "Link copied to clipboard.")})))
            .catch((err) => 
            {
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("conf_share_copied_err", "Could not copy link to clipboard.")}));
                console.error(err);
            });
        
            new Question("fa-sign-out", false).show(Dictionary.get("conf_switch_t", "Switch Browser"), content, Dictionary.get("close", "Close"));
        });
    },


    onSetPhase : {

        unsetCurrentPlayer : function(bIsMe)
        {
            const jTaskbar = document.querySelector(".taskbar");
            if (bIsMe)
                jTaskbar.classList.remove("turn-opponent");
            else if (!jTaskbar.classList.contains("turn-opponent"))
                jTaskbar.classList.add("turn-opponent");
            
            const list = jTaskbar.querySelectorAll("a");
            for (let elem of list)
                elem.classList.remove("act");
        },

        processPhaseSpecific : function(bIsMe, sPhase, sCurrent)
        {
            switch(sPhase)
            {
                case "start":
                    if (bIsMe)
                        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("builder_yourturn", "It is your turn now.") }));
                        
                    GameBuilder.CompanyManager.onEnterStartPhase(bIsMe);
                    break;
                case "organisation":
                    GameBuilder.CompanyManager.onEnterOrganisationPhase(sCurrent, bIsMe);
                    GameBuilder.CompanyManager.onRemoveAllMarkings();
                    
                    if (g_sLobbyToken !== "" && document.body.hasAttribute("data-autosave"))
                        MeccgApi.send("/game/save/auto", {});

                    break;
                case "movement":
                    GameBuilder.CompanyManager.onEnterMovementHazardPhase(bIsMe);
                    GameBuilder.CompanyManager.onRemoveAllMarkings();
                    break;
                case "site":
                    GameBuilder.CompanyManager.onEnterSitePhase(sCurrent, bIsMe);
                    GameBuilder.CompanyManager.onRemoveAllMarkings();
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

        doSet : function(bIsMe, jData)
        {
            const sPhase = jData.phase;
            const sCurrent = jData.currentplayer;
            
            GameBuilder.onSetPhase.unsetCurrentPlayer(bIsMe);

            /** maybe notify on hand size */
            GameBuilder.onResolveHandNotification(sPhase);

            MeccgPlayers.setMyTurn(bIsMe);

            GameBuilder.onSetPhase.processPhaseSpecific(bIsMe, sPhase, sCurrent);

            GameBuilder.CompanyManager.removeCompanyMarking();
            GameBuilder.CompanyManager.setCurrentPlayer(sCurrent, bIsMe);

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

        updateTaskbarTurn : function(sPhase)
        {
            const list = document.querySelectorAll(".taskbar .taskbar-turn");
            for (let jThis of list)
            {
                if (jThis.getAttribute("data-phase") === sPhase)
                {
                    jThis.classList.add("act");
                    document.querySelector(".area.area-player").setAttribute("data-turn-phase", sPhase);
                    break;
                }
            }
        }
    },
                            
    queryConnectionStatus : function()
    {
        GameBuilder.CompanyManager.clearLastSeen();
        MeccgApi.send("/game/player/time", {});
    },
    
    onDisconnected : () => GameBuilder.CompanyManager.updateLastSeen(MeccgPlayers.getChallengerId(), false),
    onConnected : () => GameBuilder.CompanyManager.updateLastSeen(MeccgPlayers.getChallengerId(), true),
    onError : (error) => console.error('There has been a problem with your fetch operation:', error),

    onChangeAvatarApp : function(codes)
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

    clearChildren : function(parent)
    {
        while (parent.firstChild) 
            parent.removeChild(parent.firstChild);
    },

    close : function()
    {
        const dialogElem = document.getElementById("chanage-avatar-app");
        if (dialogElem === null)
            return;

        dialogElem.close();
        dialogElem.parentElement.removeChild(dialogElem);
    },

    createImageElement : function(code)
    {
        const src = GameBuilder.CardList.getImageByCode(code);
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

    onselectavatar:function(e)
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

    populateCards : function(codes)
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

    init: function(codes)
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

    onAvatarsAvailable : function(codes)
    {
        const dialogElem = this.requireDialogElement();
        this.clearChildren(dialogElem);

        dialogElem.append(
            this.createTitle(),
            this.populateCards(this.filterCharacters(codes, true)),
            this.populateCards(this.filterCharacters(codes, false))
        );

        document.body.append(dialogElem);
        dialogElem.showModal();   
    },

    isAvatar : function(code)
    {
        return this.avatarCodes?.includes(code) === true;
    },

    filterCharacters:function(codes, bAvatarsOnly)
    {
        const list = [];
        for (let code of codes)
        {
            if (this.isAvatar(code) === bAvatarsOnly)
                list.push(code);
        }

        return list;
    },

    avatarCodes : null
};