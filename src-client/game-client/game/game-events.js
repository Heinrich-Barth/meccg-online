
class GameEvents
{
    static INSTANCE = new GameEvents();

    static Type_Enter = 1;
    static Type_Leave = 2;

    constructor()
    {
        this.pallandoInPlay = false;
        this.pallandoIsMine = false;
        this.pallandoOwner = "";
        this.eventCodes = { };
        this.genericEvents = { };
        this.myId = g_sUserId;
        this.isWatcher = document.body.getAttribute("data-is-watcher") === "true";
    }

    registerGenericEvent(eventId, fnCallback)
    {
        this.genericEvents[eventId] = fnCallback;
    }

    /**
     * Add card code to game
     * @param {Boolean} bIsMe 
     * @param {JSON} data  {code: _code, user: userid}
     */
    onPlayFromHand(bIsMe, data)
    {
        this.triggerEvent(data.code, bIsMe, GameEvents.Type_Enter, data);
    }

    onProgressToPhase(e)
    {
        /** 
         * it might happen that there is a div.card element without an img inside. 
         * this distorts the UI and is an artefact. Therefore, remove it.
         */
        this.removeEmptyCardDivs();

        /**
         * Following are organisation phase specific events
         */
        if (e.detail.phase !== "organisation")
            return;
            
        if (!e.detail.visitor)
            this.autoFlip();

        this.markNonPermanentEvents();
    }

    removeEmptyCardDivs()
    {
        const table = document.body.querySelector(".table")
        if (table === undefined || table === null)
            return;

        const list = table.querySelectorAll("div.card");
        if (list.length === 0)
            return;

        const remove = [];
        for (let div of list)
        {
            if (div.hasAttribute("data-card-code") && div.querySelector("img") === null)
                remove.push(div);
        }

        for (let elem of remove)
            DomUtils.removeNode(elem);
    }

    markNonPermanentEvents()
    {
        const currentTurn = this.getCurrentTurn();
        if (currentTurn === -1)
            return;

        this.forEachCardIn(this.#getCardsInStagingAreaLongShort(), function(card) 
        {
            const sec = card.getAttribute("data-secondary");
            if (sec !== null && sec !== "" && sec.indexOf("permanent event") === -1)
            {
                const turn = GameEvents.getAttributeInteger(card.getAttribute("data-turn"));
                if (turn !== -1 && turn < currentTurn)
                    card.classList.add("mark-red");
            }
        });
    }

    static getAttributeInteger(val)
    {
        try
        {
            if (val !== null && val !== undefined && val !== "")
                return parseInt(val);
        }
        catch (err)
        {
            /** ignore */
        }

        return -1;
    }

    autoFlip()
    {
        const pArea = document.getElementById("staging_area_resources_player");
        if (pArea === null || !pArea.childNodes || pArea.childNodes.length === 0)
            return;

        const uids = [];
        const codes = ["kesä (nw)", "talvi (nw)"];
        pArea.childNodes.forEach((card) => {
            
            if ("DIV" !== card.nodeName?.toUpperCase())
                return;

            for (let code of codes)
            {
                const uuid = card.getAttribute("data-uuid");
                if (uuid && code === card.getAttribute("data-card-code"))
                    uids.push({ code: code, uuid: uuid });
            }
        });

        for (let elem of uids)
            MeccgApi.send("/game/card/state/reveal", elem);
    }

    #getCardsInStagingArea(isResource = true)
    {
        const id = isResource ? "staging_area_resources_longshort_player" : "staging_area_hazards_longshort_player";
        const pArea = document.getElementById(id);
        const list = pArea === null ? null : pArea.getElementsByClassName("card");
        return list === null || list.length === 0 ? [] : list;
    }

    #getCardsInStagingAreaLongShort()
    {
        const list = [];

        for (let elem of this.#getCardsInStagingArea(true))
            list.push(elem);

        for (let elem of this.#getCardsInStagingArea(false))
            list.push(elem);

        return list;
    }

    forEachCardIn(list, fnCall)
    {
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            try
            {
               fnCall(list[i]);
            }
            catch(err)
            {
                console.error(err);
            }
        }
    }

    getCurrentTurn()
    {
        try
        {
            const turn = document.getElementById("game_turns");
            const val = turn === null ? "" : turn.innerText;
            if (val !== "")
                return parseInt(val);
        }
        catch(err)
        {

        }

        return -1;
    }

    /**
     * Check for things if the board has been restored
     */
    onBoardRestored()
    {
        if (document.getElementById("player_companies").querySelectorAll('div[data-card-code="pallando [h] (tw)"]').length > 0)
        {
            this.pallandoInPlay = true;
            this.pallandoIsMine = true;
            this.pallandoOwner = this.myId;
        }
        else 
        {
            const list = document.getElementById("opponent_table").querySelectorAll('div[data-card-code="pallando [h] (tw)"]');
            if (list.length > 0)
            {
                this.pallandoInPlay = true;
                this.pallandoIsMine = false;
                const img = list[0].querySelector("img");
                this.pallandoOwner = img.getAttribute("data-owner");
            }
        }

        this.markNonPermanentEvents();
    }

    onScoreCard(e)
    {
        if (e.detail && e.detail !== "")
            this.updateCardPreview("icon-preview-scored", e.detail);
    }

    onScoredShared(_bIsMe, data)
    {
        this.updateCardPreview("icon-preview-shared-scored", data.code);
        if (MeccgPlayers.isMyCard(data.owner))
            this.updateCardPreview("icon-preview-scored", data.code);
    }

    onDiscard(_bIsMe, data)
    {
        if (MeccgPlayers.isMyCard(data.owner))
            this.updateCardPreview("icon-preview-discard", data.code);
    }

    onOutOfPlay(_bIsMe, data)
    {
        this.updateCardPreview("icon-preview-shared-outofplay", data.code);
    }

    updateCardPreview(imageId, code)
    {
        const img = document.getElementById(imageId);
        if (img !== null)
            img.setAttribute("src", g_Game.CardList.getImage(code));
    }

    /**
     * 
     * @param {Boolean} bIsMe 
     * @param {JSON} data {list: [{code: 'Pipe (DF)', owner: 'db13dcdb-50f2-44c5-a431-}], target: obj.target, source: obj.source} 
     */
    onMoveToPile(bIsMe, data)
    {
        if (data.list === undefined || data.list.length === 0)
            return;

        for (let _data of data.list)
        {
            const _d = {
                code : _data.code,
                user : _data.owner,
                uuid : _data.uuid,
                target: data.target, 
                source: data.source
            };
            this.triggerEvent(_data.code, bIsMe, GameEvents.Type_Leave, _d);

            if (this.isWatcher)
                this.triggerGenericEvent("discard", _d);
        }

        if (data.target === "discard" || data.target === "discardpile")
        {
            if (this.pallandoInPlay || this.isWatcher)
            {
                const card = data.list[data.list.length-1];
                if (card.owner !== this.pallandoOwner || this.isWatcher)
                {
                    document.body.dispatchEvent(new CustomEvent("meccg-discardpile-add", { "detail": {
                        code: card.code,
                        owner: card.owner
                    }}));
                }
            }
        }
     }

    registerEventCode(code, ...callbacks)
    {
        this.eventCodes[code] = callbacks;
    }

    triggerEvent(code, isMe, type, data)
    {
        try
        {
            if (code !== undefined && code !== "" && this.eventCodes[code] !== undefined)
            {
                const list = this.eventCodes[code];
                for (let callback of list)
                    callback(isMe, type, data);
            }
        }
        catch (err)
        {
            console.error(err);
        }
    }
    triggerGenericEvent(eventId, data)
    {
        try
        {
            if (eventId !== undefined && eventId !== "" && this.genericEvents[eventId] !== undefined)
                this.genericEvents[eventId](data);
        }
        catch (err)
        {
            console.error(err);
        }
    }

    onArdaEventWizardPlayed(isMe, type, data)
    {
        if (GameEvents.Type_Enter !== type)
            return;

        document.body.dispatchEvent(new CustomEvent("meccg-register-avatar", { "detail": {
            userid : data.user,
            code: data.code
        } }));

        if (isMe)
            MeccgApi.send("/game/avatar/set", { code: data.code }); 
    }

    setupEvents()
    {
        if ("true" === document.body.getAttribute("data-game-arda"))
        {
            this.registerEventCode("pallando [h] (tw)", this.onEventPallando.bind(this), this.onArdaEventWizardPlayed.bind(this));
            this.registerEventCode("alatar [h] (tw)", this.onArdaEventWizardPlayed.bind(this));
            this.registerEventCode("gandalf [h] (tw)", this.onArdaEventWizardPlayed.bind(this));
            this.registerEventCode("radagast [h] (tw)", this.onArdaEventWizardPlayed.bind(this));
            this.registerEventCode("saruman [h] (tw)", this.onArdaEventWizardPlayed.bind(this));
        }
        else
            this.registerEventCode("pallando [h] (tw)", this.onEventPallando.bind(this));
    }

    onEventPallando(isMe, type, data)
    {
        if (GameEvents.Type_Leave === type)
        {
            const list = document.querySelectorAll('div[data-card-code="pallando [h] (tw)"]');
            this.pallandoInPlay = list !== null && list.length > 0;
            if (!this.pallandoInPlay)
            {
                document.body.dispatchEvent(new CustomEvent("meccg-discardpile-hide", { "detail": {} }));
                this.pallandoIsMine = false;
                this.pallandoOwner = "";
            }
        }
        else
        {
            this.pallandoIsMine = isMe;
            this.pallandoOwner = data.user;
            this.pallandoInPlay = true;
        }
    }
}

GameEvents.INSTANCE.setupEvents();

MeccgApi.addListener("/game/event/fromHand", GameEvents.INSTANCE.onPlayFromHand.bind(GameEvents.INSTANCE));
MeccgApi.addListener("/game/event/cardmoved", GameEvents.INSTANCE.onMoveToPile.bind(GameEvents.INSTANCE));
MeccgApi.addListener("/game/event/score", GameEvents.INSTANCE.onScoredShared.bind(GameEvents.INSTANCE));
MeccgApi.addListener("/game/event/outofplay", GameEvents.INSTANCE.onOutOfPlay.bind(GameEvents.INSTANCE));
MeccgApi.addListener("/game/event/discard", GameEvents.INSTANCE.onDiscard.bind(GameEvents.INSTANCE));


document.body.addEventListener("meccg-api-connected", GameEvents.INSTANCE.onBoardRestored.bind(GameEvents.INSTANCE), false);
document.body.addEventListener("meccg-event-phase", GameEvents.INSTANCE.onProgressToPhase.bind(GameEvents.INSTANCE), false);
document.body.addEventListener("meccg-score-card", GameEvents.INSTANCE.onScoreCard.bind(GameEvents.INSTANCE), false);
document.body.addEventListener("meccg-event-outofplay", GameEvents.INSTANCE.onOutOfPlay.bind(GameEvents.INSTANCE), false);
