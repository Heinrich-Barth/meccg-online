
let Arda = {

    _ready : false,
    _hasReceivedMinor : false,
    _hasReceivedMps : false,
    _hasReceivedCharacters : false,
    _idCount : 1,
    _exchangeBox : new ArdaExchangeBox(),

    createHtmlElement: function(_code, _img, _uuid, type)
    {
        const div = document.createElement("div");
        div.setAttribute("class", "card-hand transition-grow-shrink");
        div.setAttribute("draggable", "true");
        div.setAttribute("id", "arda-hand-card-" + _uuid);
        div.setAttribute("data-location", "hand");
        div.setAttribute("data-uuid", _uuid);
        div.setAttribute("data-card-code", GameCompanies.CardList.getSafeCode(_code));

        if (type === "charackters")
        {
            div.setAttribute("title", Dictionary.get("arda_drag_char", "Drag card to play it or \nDOUBLECLICK to create new company without dragging it."));
            div.setAttribute("data-card-type", "character");
            div.setAttribute("data-translate-title", "arda_drag_char");
        }
        else 
        {
            div.setAttribute("title", Dictionary.get("arda_drag_res", "Drag card to play it or \nDOUBLECLICK to play card without dragging it."));
            div.setAttribute("data-card-type", "resource");
            div.setAttribute("data-translate-title", "arda_drag_res");
        }

        const cardImage = document.createElement("img");
        if (g_bSetImgAnonymous)
            cardImage.setAttribute("crossorigin", "anonymous");
        cardImage.setAttribute("data-id", _code);
        cardImage.setAttribute("class", "card-icon");
        cardImage.setAttribute("src", _img);
        cardImage.ondblclick = Arda.onDoubleClickCard;
        div.append(cardImage);

        const divHover = document.createElement("div");
        divHover.setAttribute("class", "arda-actions");

        let aHand;
        
        aHand = document.createElement("img");
        aHand.setAttribute("src", "/media/assets/images/icons/icon-discardpile.png");
        aHand.setAttribute("data-to", "discardpile");
        aHand.setAttribute("data-from", type);
        aHand.setAttribute("data-uuid", _uuid);
        aHand.setAttribute("data-code", _code);
        aHand.setAttribute("data-translate-title", "arda_discard")
        aHand.setAttribute("title", Dictionary.get("arda_discard", "Discard this card"));
        aHand.onclick = Arda.onCardAction; 
        divHover.appendChild(aHand);

        aHand = document.createElement("img");
        aHand.setAttribute("src", "/media/assets/images/icons/icon-hand.png");
        aHand.setAttribute("data-to", "hand");
        aHand.setAttribute("data-from", type);
        aHand.setAttribute("data-uuid", _uuid);
        aHand.setAttribute("data-code", _code);
        aHand.setAttribute("data-translate-title", "arda_tohand")
        aHand.setAttribute("title", Dictionary.get("arda_tohand", "Move to your hand"));
        aHand.onclick = Arda.onCardAction; 
        divHover.appendChild(aHand);
        
        div.appendChild(divHover);

        HandCardsDraggable.initDraggableCard(div);
        return div;
    },

    onDoubleClickCard: function(e)
    {
        const elem = e.target.parentElement;
        const uuid = elem.hasAttribute("data-uuid") ? elem.getAttribute("data-uuid") : "";

        if (uuid === "")
            return false;

        const isChar = elem.getAttribute("data-card-type") === "character";
        CreateHandCardsDraggableUtils.removeDraggableDomElement(elem);

        if (isChar)
            HandCardsDraggable.onCreateNewCompany(uuid, "hand");
        else
            HandCardsDraggable.onAddGenericCardToStagingArea(uuid, true);

        return false;
    },

    /**
     * Take a card to hand or discard it
     * @param {Event} e 
     */
    onCardAction : function(e)
    {
        const elem = e.target;
        const data = {
            code : elem.getAttribute("data-code"),
            uuid : elem.getAttribute("data-uuid"),
            type : elem.getAttribute("data-from"),
            to : elem.getAttribute("data-to"),
        };

        MeccgApi.send("/game/arda/from-hand", data);
    },

    addCss : function()
    {
        /** add CSS  */
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href","/dist-client/css/game-arda.css?version=" + Date.now());
        document.head.appendChild(link);
        document.body.classList.add("game-arda");
    },

    updateSinglePlayer : function()
    {
        if (this.isSinglePlayer())
        {
            DomUtils.remove(document.getElementById("arda-action-container-randomchars"));
            DomUtils.remove(document.getElementById("arda-action-container-minor"));
            DomUtils.remove(document.getElementById("arda-action-container-charackters"));

            DomUtils.remove(document.getElementById("arda_minors_hand"));
            DomUtils.remove(document.getElementById("arda_characters_hand"));
        }
    },

    init : function()
    {
        if (this._ready)
            return;
    
        const bAllowRecyling = this.isAdraAdmin();

        this.addCss();

        if (!this.isSinglePlayer() && bAllowRecyling)
            this.insertArdaSetupContainer();

        const idMps = this.createContainer("arda_mps", "mps", "Marshalling Points", 5, false)
        document.getElementById(idMps).classList.remove("hidden");

        this.createContainer("arda_stage", "stage", "Common Stage Cards", 5, false, "");

        this.createContainer("arda_minors", "minor", "Minor Item Offerings", 4, bAllowRecyling);
        this.createContainer("arda_characters", "charackters", "Roving Characters", 4, bAllowRecyling);

        this.insertArdaContainer();
        this.getOpeningHands();
        this.updateSinglePlayer();

        if (!this.isSinglePlayer())
        {
            this._exchangeBox = new ArdaExchangeBox();
            this._exchangeBox.create("arda_mps_hand");
        }
        
        this._ready = true;
        MeccgApi.send("/game/arda/checkdraft", {});
        MeccgApi.send("/game/arda/sites", {});
    },

    isSinglePlayer()
    {
        return document.body.getAttribute("data-is-singleplayer") === "true";
    },

    getOpeningHands()
    {
        MeccgApi.send("/game/arda/hands", { });
    },

    getRegularHand()
    {
        MeccgApi.send("/game/card/hand", { });
    },

    insertArdaSetupContainer : function()
    {
        if (document.getElementById("arda-setup-container") !== null)
            return;

        const container = document.createElement("div");
        container.setAttribute("id", "arda-setup-container");
        container.setAttribute("class", "blue-box arda-setup-container hidden");

        const title = document.createElement("h2");
        title.innerText = "Arda Setup Guide";
        container.appendChild(title);

        const divWrapp = document.createElement("div");
        divWrapp.setAttribute("id", "arda-setup-container-content");
        container.append(divWrapp);

        document.body.appendChild(container);
    },

    insertArdaContainer : function()
    {
        const divChars = document.createElement("div");
        divChars.setAttribute("class", "arda-hand-wrapper arda-hand-wrapper-characters");
        this.insertMp(divChars, "fa-users", "Roving Characters", "charackters", "arda_characters", "");

        const divMinors = document.createElement("div");
        divMinors.setAttribute("class", "arda-hand-wrapper arda-hand-wrapper-minor");
        this.insertMp(divMinors, "fa-shield", "Minor Item Offerings", "minor", "arda_minors", "");

        const divStage = document.createElement("div");
        divStage.setAttribute("class", "arda-hand-wrapper arda-hand-wrapper-stage");
        this.insertMp(divStage, "fa-adjust", "Stage Cards", "stage", "arda_stage", "");

        document.body.append(divChars, divMinors, divStage);
    },

    isAdraAdmin : function()
    {
        return g_sLobbyToken !== "";
    },

    insertPlayerSelectIndicator : function()
    {
        /** not needed here */
    },
    
    insertOnceAction : function(parent, html, title, dataType, playerId, label, count)
    {
        const div = this.insertMp(parent, html, title, dataType, playerId, label);
        div.querySelector("i").onclick = () =>
        { 
            DomUtils.empty(div);
            div.classList.add("hidden");

            const elem = document.getElementById("arda_characters_hand");
            if (elem !== null)
                elem.classList.remove("hidden");

            MeccgApi.send("/game/arda/assign-characters", { count: count });
        };
    },

    insertMp : function(parent, html, title, dataType, playerId, label)
    {
        const a = document.createElement("i");

        a.setAttribute("data-type", dataType);
        a.setAttribute("data-player", playerId);
        a.setAttribute("id", "arda-action-container-" + dataType);
        a.setAttribute("title", title + ".\n" + Dictionary.get("arda_tooglevis", "Left click to toggle visibility.\nRight click to refresh."));
        a.setAttribute("class", "blue-box fa act " + html);
        a.setAttribute("aria-hidden", "true");
        a.onclick = Arda.toogleView;
        
        if (label !== "")
            a.innerText = label;

        const div = document.createElement("div");
        div.setAttribute("class", "arda-hand-container");
        div.oncontextmenu = Arda.onRefreshHands;
        div.appendChild(a);

        parent.appendChild(div);
        return div;
    },

    onRefreshHands : function(e)
    {
        Arda.getOpeningHands();

        e.preventDefault();
        e.stopPropagation();
    },

    onShowHands : function()
    {
        ArrayList(document).findByClassName("arda-card-hands").each((elem) => {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
        });
    },

    toggleViewOnElement : function(id)
    {
        const elem = Arda.getContainer(id);
        if (elem !== null)
        {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
            else
                elem.classList.add("hidden");
        }
    },
    
    toogleView : function(e)
    {
        Arda.toggleViewOnElement(e.target.getAttribute("data-player"));

        if (e.target.classList.contains("act"))
            e.target.classList.remove("act");
        else
            e.target.classList.add("act");

        e.preventDefault();
        return false;
    },

    getContainer : function(id)
    {
        return document.getElementById(id + "_hand");
    },

    createContainer : function(playerid, dataType, title, nHandSize, bRecycleOnce)
    {
        const id = playerid + "_hand";
        const idCardList = "arda_hand_container_" + dataType;
        let elem = document.getElementById(id);
        if (elem !== null)
            return id;

        const divHandTop = document.createElement("div");
        divHandTop.setAttribute("class", "arda-handbar-top");

        const div = document.createElement("div");
        div.setAttribute("class", "arda-card-hands hidden arda-card-hand-" + dataType);
        div.setAttribute("id", id);
        div.append(divHandTop);

        let _sizerId = "";
        
        if (!this.isSinglePlayer())
        {
            _sizerId = ResolveHandSizeContainer.create(divHandTop, Dictionary.get("handsizeis", "Hand size is"), nHandSize, "");
            divHandTop.getElementsByClassName("card-hands-sizer")[0].classList.add("arda-card-hands-sizer");
        }
        else 
            nHandSize = -1;

        let _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline");
        _div.setAttribute("id", idCardList);
        div.appendChild(_div);

        _div = document.createElement("div");
        _div.setAttribute("class", "arda-inline arda-hand-card-actions");

        {
            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-pile-action" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-view-discard-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-view", "discard");
            _a.setAttribute("title", Dictionary.get("arda_viewdiscard", "View discard pile"));
            _a.innerHTML = `<img src="/media/assets/images/icons/icon-discardpile.png" data-view="discard" data-type="${dataType}">`;
            _a.onclick = Arda.onViewPile;
            divHandTop.prepend(_a);

            _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-pile-action context-cursor" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-view-playdeck-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("title", Dictionary.get("arda_viewplaydeck", "View playdeck. Right click to shuffle"));
            _a.setAttribute("data-view", "playdeck");
            _a.innerHTML = `<img src="/media/assets/images/icons/icon-playdeck.png" data-view="playdeck" data-type="${dataType}">`;
            _a.onclick = Arda.onViewPile;
            _a.oncontextmenu = Arda.onShufflePlaydeck;
            divHandTop.prepend(_a);

            _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-draw" + (bRecycleOnce ? " hidden":""));
            _a.setAttribute("id", "arda-card-draw-" + dataType);
            _a.setAttribute("data-type", dataType);
            _a.setAttribute("data-handsize", nHandSize)
            _a.setAttribute("title", Dictionary.get("arda_drawnew", "Draw a new card"));
            _a.setAttribute("data-container-id", id);
            _a.onclick = Arda.onDrawNewCard;
            divHandTop.prepend(_a);
        }
        div.appendChild(_div);

        document.body.appendChild(div);

        if (_sizerId !== "")
            ResolveHandSizeFirst.create(idCardList, _sizerId,  title + " cards", ["organisation", "eotdiscard"]);

        return id;
    },

    onShufflePlaydeck : function(e)
    {
        const type = e.target.getAttribute("data-type");
        if (type === "mps" || type === "minor" || type === "stage")
        {
            MeccgApi.send("/game/arda/shuffle", { target: type });
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("arda_shuffled", "Playdeck shuffled") + " (" + type + ")" }));
        }

        e.preventDefault();
    },

    showIfExitent : function(id)
    {
        const elem = id === "" ? null : document.getElementById(id);
        if (elem !== null)
            elem.classList.remove("hidden");

        return elem;
    },

    showStageCardHand : function()
    {
        const elem = document.getElementById("arda_stage_hand");
        const cards = document.getElementById("arda_hand_container_stage");
        if (elem === null || cards === null)
            return;

        if (cards.getElementsByClassName("card-hand").length > 0)
        {
            if (elem.classList.contains("hidden"))
                elem.classList.remove("hidden");
        }
        else if (!elem.classList.contains("hidden"))
            elem.classList.add("hidden");
    },

    addDraftClass:function(bAdd)
    {
        if (bAdd)
            document.body.classList.add("arda-draft");
        else
            document.body.classList.remove("arda-draft");
    },

    updateArdaSetupContainer : function(bIsReady, bHideDraftCharacters, bHideDraftMinors)
    {
        if (bHideDraftCharacters && bHideDraftMinors)
        {
            DomUtils.remove(document.getElementById("arda-setup-container"));
            Arda.addDraftClass(false);
            Arda.showStageCardHand();
            return;
        }

        if (bHideDraftCharacters)
            Arda.addDraftClass(true);

        const containerWrapper = document.getElementById("arda-setup-container");
        const container = document.getElementById("arda-setup-container-content");
        if (container === null || containerWrapper === null)
            return;

        DomUtils.empty(container);

        containerWrapper.classList.remove("hidden");
        if (!bIsReady)
        {
            const elem1 = document.createElement("p");
            elem1.innerText = Dictionary.get("arda_setup_1a", " Once everybody is at the table, each player chooses their wizard. Once that is done, you assign random characters to each player's hand.");

            const elem2 = document.createElement("p");
            elem2.innerText = Dictionary.get("arda_setup_1b", "This will clear your hand and add random characters to your hand.");

            container.appendChild(elem1);
            
            this.insertOnceAction(container, "fa-users", Dictionary.get("arda_setup_1c", "Assign random characters to every player."), "randomchars", "arda_ranom", Dictionary.get("arda_setup_1d", "Assign random characters"), 8);
            this.insertOnceAction(container, "fa-users", Dictionary.get("arda_setup_1e", "Assign more random characters to every player."), "randomchars", "arda_ranom", Dictionary.get("arda_setup_1d", "Assign random characters") + " (12)", 12);

            container.appendChild(elem2);
        }
        else if (!bHideDraftCharacters && !bHideDraftMinors)
        {
            let elem = document.createElement("p");
            elem.innerText = Dictionary.get("arda_setup_2a", "Everybody may draft characters with a total of 25 GI. Yet, only 20 GI may be used.");
            container.appendChild(elem);

            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", "charackters");
            _a.setAttribute("id", "arda-card-recycle-charackters");
            _a.setAttribute("title", Dictionary.get("arda_setup_2b", "Complete character draft and choose minor items."));
            _a.innerText = " " + Dictionary.get("arda_setup_2b", "Complete character draft and choose minor items.");
            _a.onclick = Arda.onRecycleDeck;
            container.appendChild(_a);

            elem = document.createElement("p");
            elem.innerText = Dictionary.get("arda_setup_2c", "Recycling will automatically discard your current hand and reshuffle everything into the playdeck.");
            container.appendChild(elem);

        }
        else 
        {
            const elem = document.createElement("p");
            elem.innerText = Dictionary.get("arda_setup_3a", "Everybody may choose up to 3 minor items. Once that is done, the game can start.");
            container.appendChild(elem);

            let _a = document.createElement("a");
            _a.setAttribute("src", "#");
            _a.setAttribute("class", "arda-card-recycle fa fa-recycle");
            _a.setAttribute("data-type", "minor");
            _a.setAttribute("id", "arda-card-recycle-minor");
            _a.setAttribute("title", Dictionary.get("arda_setup_3b", "Complete minor item draft and start the game."));
            _a.innerText = " " + Dictionary.get("arda_setup_3b", "Complete minor item draft and start the game.");
            _a.onclick = Arda.onRecycleDeck;
            container.appendChild(_a);
        }
    },

    onCheckDraft : function(bIsReady, bHideDraftCharacters, bHideDraftMinors)
    {
        let elem;
        
        elem = document.getElementById("arda-card-recycle-charackters");
        if (bHideDraftCharacters)
        {
            DomUtils.remove(elem);
            Arda.showIfExitent("arda-card-draw-charackters");

            Arda.showIfExitent("arda_characters_hand");

            Arda.showIfExitent("arda-view-playdeck-charackters");
            Arda.showIfExitent("arda-view-discard-charackters");
        }

        elem = document.getElementById("arda-card-recycle-minor");
        if (bHideDraftMinors)
        {
            DomUtils.remove(elem);
            Arda.showIfExitent("arda-card-draw-minor");
            Arda.showIfExitent("arda_minors_hand");

            Arda.showIfExitent("arda-view-playdeck-minor");
            Arda.showIfExitent("arda-view-discard-minor");
        }

        Arda.updateArdaSetupContainer(bIsReady, bHideDraftCharacters, bHideDraftMinors);
    },

    onViewPile : function(e)
    {
        const type = e.target.getAttribute("data-type");
        const pile = e.target.getAttribute("data-view");
        
        MeccgApi.send("/game/arda/view", { type: type, pile: pile });
    },

    onRecycleDeck : function(e)
    {
        new Question().onOk(function()
        {
            const target = e.target.getAttribute("data-type");
            const next = e.target.getAttribute("data-next");

            DomUtils.remove(e.target);

            if (typeof target === "string" && target !== "")
            {
                Arda.showIfExitent("arda-card-draw-" + target);
                Arda.showIfExitent("arda-view-playdeck-" + target);
                Arda.showIfExitent("arda-view-discard-" + target);
            }

            if (typeof next === "string" && next !== "")
                Arda.showIfExitent(next);

            MeccgApi.send("/game/arda/recycle", { type: target });
        }).show(
            Dictionary.get("arda_setup_4a", "Do you want to reshuffle all cards into the playdeck?, "), 
            Dictionary.get("arda_setup_4b", "All cards will be reshuffled into the playdeck and a new hand will be drawn., "), 
            Dictionary.get("arda_setup_4c", "Reshuffle everything")
        );
    },
    
    getAllowedHandSize : function(elem)
    {
        const id = elem === null ? null : elem.getAttribute("data-container-id");
        const container = id === null || id === "" ? null : document.getElementById(id);

        let nDefault = -1;
        try
        {
            nDefault = parseInt(elem.getAttribute("data-handsize"));
                        
            const list = container === null ? null : container.getElementsByClassName("card-hands-sizer-size");
            if(list !== null && list.length === 1)
                return parseInt(list[0].innerText);
        }
        catch (err)
        {
            console.error(err);
        }

        return nDefault;
    },
    
    onDrawNewCard : function(e)
    {
        const elem = e.target;

        const nLen = Arda.getAllowedHandSize(elem);
        const type = elem.getAttribute("data-type");
        
        const list = document.getElementById("arda_hand_container_" + type);
        if (list === null)
            return;

        const nCount = list.getElementsByClassName("card-hand").length;
        if (nCount < nLen || nLen === -1)
            MeccgApi.send("/game/arda/draw", { type : type });
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("arda_handlimit", "Hand already holds enough cards.") }));
    },

    onDrawSingleCard : function(container, cardCode, uuid, type)
    {
        if (container === null || uuid === "")
            return;
    
        const _code = g_Game.CardList.getSafeCode(cardCode);
        const _img = g_Game.CardList.getImage(cardCode);

        if (container.querySelector("#arda-hand-card-" + uuid) !== null)
            return;

        container.appendChild(Arda.createHtmlElement(_code, _img, uuid, type));
        g_Game.CardPreview.addHover("arda-hand-card-" + uuid, false, true);   
    },

    onReceiveOpeningHandGeneric : function(containerId, type, jData)
    {
        const container = document.getElementById(containerId);
        if (container === null)
            return false;

        DomUtils.removeAllChildNodes(container);

        for (let elem of jData)
            Arda.onDrawSingleCard(container, elem.code, elem.uuid, type);

        return jData.length > 0;
    },

    onReceiveOpeningHandCharacters : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (!Arda._hasReceivedCharacters)
        {
            Arda._hasReceivedCharacters = Arda.onReceiveOpeningHandGeneric("arda_hand_container_charackters", "charackters", jData);
            if (Arda._hasReceivedCharacters)
            {
                let div = document.getElementById("arda-action-container-randomchars");
                if (div !== null)
                {
                    DomUtils.empty(div);
                    div.classList.add("hidden");
                }

                div = document.getElementById("arda_characters_hand");
                if (div !== null)
                    div.classList.remove("hidden");
            }
        }
        else
            Arda.onReceiveOpeningHandGeneric("arda_hand_container_charackters", "charackters", jData);
    },

    onReceiveOpeningHandStage : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        Arda.onReceiveOpeningHandGeneric("arda_hand_container_stage", "stage", jData);
    },

    onReceiveOpeningHandMinor : function(jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        Arda.onReceiveOpeningHandGeneric("arda_hand_container_minor", "minor", jData);
    },

    onReceiveOpeningHandMarshalingPoints : function(bIsMe, jData)
    {
        /* you can only receive your opening hand once, but it will be triggered for every player at the table */
        if (bIsMe)
            Arda.onReceiveOpeningHandGeneric("arda_hand_container_mps", "mps", jData);
    },

    onDrawCard : function(bIsMe, jData)
    {
        let containerId = "";
        if (jData.hand === "minor")
            containerId = "arda_hand_container_minor";
        else if (bIsMe && jData.hand === "mps")
            containerId = "arda_hand_container_mps";
        else if (jData.hand === "charackters")
            containerId = "arda_hand_container_charackters";
        else if (jData.hand === "stage")
            containerId = "arda_hand_container_stage";

        const container = containerId === "" ? null : document.getElementById(containerId);
        if (container !== null)
        {
            if (jData.clear !== undefined && jData.clear === true)
                DomUtils.removeAllChildNodes(container);

            Arda.onDrawSingleCard(container, jData.code, jData.uuid, jData.hand);
        }
    },

    onRemoveHandCard : function(uuid)
    {
        const elem = document.getElementById("arda-hand-card-" + uuid);
        if (elem !== null)
            DomUtils.remove(elem);
        else
            DomUtils.remove(document.getElementById("card_icon_nr_" + uuid));
    }
};

if ("true" === document.body.getAttribute("data-game-arda"))
{
    document.body.addEventListener("meccg-api-connected", () => Arda.init(), false);
    MeccgApi.addListener("/game/arda/hand/show", () => Arda.onShowHands());
    MeccgApi.addListener("/game/arda/hand/minor", (_bIsMe, jData) => Arda.onReceiveOpeningHandMinor(jData.list));
    MeccgApi.addListener("/game/arda/hand/stage", (_bIsMe, jData) => Arda.onReceiveOpeningHandStage(jData.list));
    MeccgApi.addListener("/game/arda/hand/characters", (_bIsMe, jData) => Arda.onReceiveOpeningHandCharacters(jData.list));
    MeccgApi.addListener("/game/arda/hand/marshallingpoints", (bIsMe, jData) => Arda.onReceiveOpeningHandMarshalingPoints(bIsMe, jData.list));
    MeccgApi.addListener("/game/arda/hand/card/remove", (_bIsMe, jData) => Arda.onRemoveHandCard(jData.uuid));  
    MeccgApi.addListener("/game/arda/draw", (bIsMe, jData) => Arda.onDrawCard(bIsMe, jData));
    MeccgApi.addListener("/game/arda/checkdraft", (_bIsMe, jData) => Arda.onCheckDraft(jData.ready, jData.characters, jData.minoritems));
    MeccgApi.addListener("/game/arda/view", (bIsMe, jData) => g_Game.TaskBarCards.onShow(bIsMe, jData));

    Arda._exchangeBox.addRoutes();
}
else
    Arda = null;
    
