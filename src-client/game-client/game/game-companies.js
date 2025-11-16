
const createCompanyHtml = function(companyId, id)
{
    const div = document.createElement("div");
    div.setAttribute("class", "company tableCell hiddenVisibility nonEmptyContainer context-cursor");
    div.setAttribute("id", id);
    div.setAttribute("data-company-id", companyId);
    div.innerHTML = `
        <div class="company-site-list pos-rel">
            <div class="location-icon-image location-underdeep location-select-ud hiddenToOpponent" title="${Dictionary.get("company_orga_deeps", "Organise underdeep movement")}"><i class="fa fa-code-fork "></i>${Dictionary.get("company_orga_deeps_inner", "Deeps")}</div>
            <div class="location-icon-image location-icon location-select hiddenToOpponent" title="${Dictionary.get("company_orga_sites", "Organise region movement")}"><i class="fa fa-map-signs"></i>${Dictionary.get("company_orga_sites_inner", "Sites")}</div>
            <div class="location-icon-image location-reveal hide hiddenToOpponent" title="${Dictionary.get("company_orga_reveal", "Reveal movement / mark as current company in movement hazard phase")}"><i class="fa fa-eye"></i>${Dictionary.get("company_orga_reveal_inner", "Reveal")}</div>
            <div class="sites">
                <div class="site-container site-current"></div>
                <div class="site-container site-regions"></div>
                <div class="site-container site-target"></div>
                <div class="site-container site-onguard"></div>
            </div>
            <div class="company-site-list-border"></div>
        </div>
        <div class="company-characters-add"></div>
        <div class="company-characters"></div>`.trim();
    return div;
}

const countOpponentContainers = function()
{
    const pContainer = document.getElementById("opponent-companies");
    if (pContainer === null)
        return 0;

    const list = pContainer.getElementsByClassName("companies");
    return list === null ? 0 : list.length;
}

const createOpponentContainer = function(sHexPlayerCode, playerId)
{
    const pContainer = document.getElementById("opponent-companies");
    if (pContainer === null)
        return null;

    /* check if the container already exists  */
    const jTarget = pContainer.querySelector("[data-player='" + sHexPlayerCode + "']");
    if (jTarget !== null)
        return jTarget;

    /* create new container for opponent */
    const div = document.createElement("div");
    div.setAttribute("class", "col90 companies");
    div.setAttribute("id", "companies_opponent_" + sHexPlayerCode);
    div.setAttribute("data-player", sHexPlayerCode);

    pContainer.appendChild(div);

    const hand = createOpponentContainerVisitorHand(pContainer, playerId);

    const size = countOpponentContainers();
    if (size === 1 && GameBuilder.isVisitor())
    {
        div.classList.add("rot180");
        if (hand !== null)
        {
            hand.classList.add("rot180");
            hand.parentElement.prepend(hand)
        }
    }

    return div;
};

const createOpponentContainerVisitorHand = function(pContainer, playerId)
{
    if (document.body.getAttribute("data-is-watcher") !== "true" || document.getElementById("playercard_hand_container_" + playerId) !== null)
        return null;

    const div = document.createElement("div");
    div.setAttribute("id", "playercard_hand_container_" + playerId);
    div.setAttribute("class", "visitor-hand-view");
    pContainer.appendChild(div);

    const eHand = document.getElementById("watch_togglehand");
    if (eHand !== null)
        eHand.click();

    return div;
}

const getCardStateCss = function(nState)
{
    if (nState === 0)
        return "state_ready";
    else if (nState === 90)
        return "state_tapped";
    else if (nState === 91)
        return "state_tapped_fixed";
    else if (nState === 180)
        return "state_wounded";
    else if (nState === 270)
        return "state_rot270";
    else
        return "";
};

/**
 * creat cCharacter div
 * @param {JSON} jsonCard 
 * @param {String} id 
 * @returns DOM element or empty fragment
 */
const createCharacterHtml = function(jsonCard, id)
{
    const uuid = jsonCard.uuid;
    if (uuid === "" || id === "")
        return document.createDocumentFragment();

    const div = document.createElement("div");
    div.setAttribute("class", "company-character pos-rel fl character-is-company-host");
    div.setAttribute("id", id);
    div.setAttribute("data-character-uuid", uuid);

    const pCharacterContainer = document.createElement("div");
    pCharacterContainer.setAttribute("class", "company-character-container pos-rel");
    
    const pCharDiv = document.createElement("div");
    pCharDiv.setAttribute("class", "company-character-host company-character-reosurces");

    const characterDiv = createNewCard(jsonCard);
    
    const iDice = document.createElement("i");
    iDice.setAttribute("class", "character-card-dice card-dice");
    iDice.setAttribute("data-code", jsonCard.code);
    iDice.setAttribute("data-uuid", jsonCard.uuid);
    
    if (jsonCard.revealed === true)
        iDice.setAttribute("title", Dictionary.get("company_roll_for_c", "Click to roll dice for") + " " + jsonCard.code);
    else
        iDice.setAttribute("title", Dictionary.get("company_roll_for", "Click to roll dice"));

    iDice.onclick = rollCharacterDice;
    characterDiv.appendChild(iDice);

    const iMarker = document.createElement("i");
    iMarker.setAttribute("class", "character-mark-toggle fa fa-thumb-tack ");
    iMarker.setAttribute("data-code", jsonCard.code);
    iMarker.setAttribute("data-uuid", jsonCard.uuid);
    
    if (jsonCard.revealed === true)
        iMarker.setAttribute("title", Dictionary.get("company_roll_markunmark_c", "Mark/Unmark") + " " + jsonCard.code);
    else
        iMarker.setAttribute("title", Dictionary.get("company_roll_markunmark", "Mark/Unmark this card"));

    iMarker.onclick = markCharacter;
    characterDiv.appendChild(iMarker);

    pCharDiv.appendChild(characterDiv);
    pCharacterContainer.appendChild(pCharDiv);

    const pTemp = document.createElement("div");
    pTemp.setAttribute("class", "company-character-influenced");

    div.appendChild(pCharacterContainer);
    div.appendChild(pTemp);      
    return div;
};

function rollCharacterDice(e)
{
    const code = e.target.getAttribute("data-code");
    const uuid = e.target.getAttribute("data-uuid");
    TaskBarCards.rollDiceCharacter(uuid, code);
}

function markCharacter(e)
{
    const code = e.target.getAttribute("data-code");
    const uuid = e.target.getAttribute("data-uuid");

    const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
    if (pElem === null)
        return;

    const isMarked = pElem.classList.contains("card-highlight-mark");
    MeccgApi.send("/game/card/state/mark", {uuid : uuid, code: code, mark: !isMarked });  
}

function insertNewcontainer(bIsPlayer, sHexPlayerCode, companyId, playerId)
{
    const id = "company_" + companyId;
    const pDiv = createCompanyHtml(companyId, id);
    if (pDiv === null)
        return null;

    if (bIsPlayer)
    {
        document.getElementById("player_companies").prepend(pDiv);
    }
    else
    {
        const container = createOpponentContainer(sHexPlayerCode, playerId);
        if (container !== null)
            container.prepend(pDiv);
    }

    if (typeof ContextMenu.contextActions.onContextCompany !== "undefined")
        pDiv.oncontextmenu = ContextMenu.contextActions.onContextCompany.bind(ContextMenu.contextActions);

    return document.getElementById(id);
}


/**
 * Insert a new character container
 * @param {json} jsonCard character card
 * @param {Object} pTargetContainer DOM container
 * @param {boolean} bInsertBefore insert before given element (of append otherwise)
 * @param {boolean} bIsHosting Is hosting character
 * @returns {Object} DOM Container
 */
 function insertNewCharacter(jsonCard, pContainer, bInsertBefore, bIsHosting)
 {
     const id = "character_" + jsonCard.uuid;
     const pHtml = createCharacterHtml(jsonCard, id);
     if (pHtml == null)
         return document.getElementById("test");

     if (!bIsHosting)
     {
         pHtml.classList.remove("character-is-company-host");
         pHtml.classList.add("character-is-company-follower");
     }

     if (bInsertBefore)
         pContainer.parentElement(pHtml, pContainer);
     else
         pContainer.appendChild(pHtml);

     return document.getElementById(id);
 }

 function createNewCard(card)
 {
     if (card.uuid === "")
         return document.createDocumentFragment();

    const _backside = GameCompanies.CardList.getFlipSide(card.code);
    const pImage = document.createElement("img");
    pImage.setAttribute("class", "card-icon");
    pImage.setAttribute("src", _backside);
    pImage.setAttribute("data-image-backside", _backside);
    pImage.setAttribute("decoding", "async");
    if (g_bSetImgAnonymous)
        pImage.setAttribute("crossorigin", "anonymous");
    pImage.setAttribute("data-uuid", card.uuid);
    pImage.setAttribute("data-img-image", GameCompanies.CardList.getImage(card.code));
    pImage.setAttribute("data-revealed", card.revealed !== false ? "true" : "false");

    const isMine = typeof card.owner === "undefined" || card.owner === "" || MeccgPlayers.isChallenger(card.owner);
    if (isMine)
    {
        pImage.setAttribute("data-owner", "");
        pImage.setAttribute("data-is-mine", "true");
    }
    else
    {
        pImage.setAttribute("data-owner", card.owner);
        pImage.setAttribute("data-is-mine", "false");
    }
                 
    const pDiv = document.createElement("div");
    pDiv.setAttribute("class", "card " + getCardStateCss(card.state));
    pDiv.setAttribute("id", GameCompanies.CARDID_PREFIX + card.uuid);
    pDiv.setAttribute("data-uuid", card.uuid);
    pDiv.setAttribute("data-card-code", GameCompanies.CardList.getSafeCode(card.code));
    pDiv.setAttribute("data-card-type", card.type);
    pDiv.setAttribute("draggable", "true");
    pDiv.setAttribute("data-revealed", card.revealed !== false ? "true" : "false");

    if (MeccgPlayers.isMyCard(card.owner))
    pDiv.classList.add("card-is-mine");

    if (card.token && card.token > 0)
    {
        pDiv.setAttribute("data-token", card.token);
        pDiv.setAttribute("title", "Tokens: " + card.token);
    }       
    
    if (card.tokenMP && card.tokenMP > 0)
        pDiv.setAttribute("data-token-mp", card.tokenMP);

    pDiv.appendChild(pImage);
    return pDiv;
}

class JumbleCards 
{
    static #num = 0;

    static update(val = 0)
    {   
        if (JumbleCards.#num === val)
            return;

        JumbleCards.#num = val;
        JumbleCards.#updateCompanies(val);
        JumbleCards.#updateStages(val);
    }

    static #updateStages(val)
    {
        if (val === -1)
            val = JumbleCards.#num;

        const list = document.getElementsByClassName("staging-area-area");
        for (let elem of list)
            JumbleCards.#updateStageAraCards(elem, val);
    }

    static #updateCompanies(val)
    {
        const list = document.getElementsByClassName("company");
        for (let elem of list)
            JumbleCards.updateCompany(elem, val);
    }

    static updateCompany(company, val)
    {
        if (val === -1)
            val = JumbleCards.#num;

        JumbleCards.#updateCompanySites(company, val);
        JumbleCards.#updateCompanyChars(company, val);
    }

    static #updateCompanySites(company, val)
    {
        const list = company.querySelectorAll(".company-site-list div.card");
        for (let elem of list)
            JumbleCards.updateCompanyCard(elem, val, true);
    }

    static #updateStageAraCards(company, val)
    {
        const list = company.querySelectorAll("div.card");
        for (let elem of list)
            JumbleCards.#updateStageAraCard(elem, val);
    }
    static #updateCompanyChars(company, val)
    {
        const cards = company.querySelectorAll(".company-characters div.card");
        for (let card of cards)
            JumbleCards.updateCompanyCard(card, val, false);
    }

    static #calcRandom(max)
    {
        if (max < 1)
            return 0;

        return JumbleCards.#calcVal(max * 2) - max;
    }

    static #calcVal(roof)
    {
        return Math.floor(Math.random() * (roof+1))
    }

    static #calcRotation(conservative = true, isSites = false)
    {
        const max = JumbleCards.#getMaxRoration(conservative, isSites);
        return JumbleCards.#calcRandom(max);
    }

    static #calcTranslate(conservative = true, isSites = false)
    {
        const max = JumbleCards.#getMaxTranslate(conservative, isSites);
        return JumbleCards.#calcRandom(max);
    }

    static #getMaxRoration(conservative, isSites)
    {
        if (isSites)
            return conservative ? 1 : 3;
        else
            return conservative ? 1 : 4;
    }

    static #getMaxTranslate(conservative, isSites)
    {
        if (isSites)
            return conservative ? 5 : 10;
        else
            return conservative ? 5 : 15;
    }

    static #updateStageAraCard(card, val = -1)
    {
        if (val === -1)
            val = JumbleCards.#num;

        if (val < 1)
        {
            JumbleCards.#removeOptions(card);
            return;
        }
        
        const conservative = val === 1;
        
        if (JumbleCards.#updatePropertyX(conservative))
            card.style.setProperty("--jumble-translate-x", JumbleCards.#calcTranslate(conservative) + "px");
        else
            card.style.setProperty("--jumble-translate-x", "0px");

        if (JumbleCards.#updateProperty(conservative))
            card.style.setProperty("--jumble-translate-y", JumbleCards.#calcTranslate(conservative) + "px");
        else
            card.style.setProperty("--jumble-translate-y", "0px");

        card.classList.add("card-jumbled");
    }

    static updateCompanyCard(card, val = -1, isSites = false)
    {
        if (val === -1)
            val = JumbleCards.#num;

        if (val < 1)
        {
            JumbleCards.#removeOptions(card);
            return;
        }
        
        const conservative = val === 1;
        
        if (JumbleCards.#updatePropertyX(conservative))
            card.style.setProperty("--jumble-translate-x", JumbleCards.#calcTranslate(conservative, isSites) + "px");
        else
            card.style.setProperty("--jumble-translate-x", "0px");

        if (JumbleCards.#updateProperty(conservative))
            card.style.setProperty("--jumble-translate-y", JumbleCards.#calcTranslate(conservative, isSites) + "px");
        else
            card.style.setProperty("--jumble-translate-y", "0px");

        if (JumbleCards.#updateRotation(conservative))
            card.style.setProperty("--jumble-rotate", JumbleCards.#calcRotation(conservative, isSites) + "deg");
        else
            card.style.setProperty("--jumble-rotate", "0deg");
        
        card.classList.add("card-jumbled");
    }

    static #updatePropertyX(conservative)
    {
        const val = JumbleCards.#calcVal(10);
        return conservative ? val >= 4 : val > 3;
    }
    static #updateProperty(conservative)
    {
        const val = JumbleCards.#calcVal(10);
        return conservative ? val >= 5 : val > 3;
    }


    static #updateRotation(conservative)
    {
        const val = JumbleCards.#calcVal(20);
        return conservative ? false : val > 10;
    }

    static #removeOptions(card)
    {
        if (card.classList.contains("card-jumbled"))
            card.classList.remove("card-jumbled");
    }

    static init()
    {
        const val = sessionStorage.getItem("cards_jumble");
        if (typeof val !== "string" || val === "")
            return;

        const num = parseInt(val);
        if (!isNaN(num))
            JumbleCards.#num = num;
    }
}

JumbleCards.init()

const GameCompanies = {

    CardList : null,
    CardPreview : null,
    HandCardsDraggable : null,
    PlayerSelector : new PlayerSelector(),
    pGameCompanyLocation : null,

    CARDID_PREFIX : "ingamecard_",
    
    initCompanyManager : function(_CardList, _CardPreview, _HandCardsDraggable)
    {
        GameCompanies.CardList = _CardList;
        GameCompanies.CardPreview = _CardPreview;
        GameCompanies.HandCardsDraggable = _HandCardsDraggable;
        GameCompanies.pGameCompanyLocation = new GameCompanyLocation(GameCompanies, _CardList, _CardPreview, GameCompanies.CARDID_PREFIX);
        return GameCompanies;
    },

    updateLastSeen : function(username, isOnline)
    {
        GameCompanies.PlayerSelector.updateLastSeen(username, isOnline)
    },

    removePlayerIndicator : function(username)
    {
        GameCompanies.PlayerSelector.removePlayerIndicator(username)
    },
    
    updateHandSize : function(username, nCount, nCountPlaydeck)
    {
        GameCompanies.PlayerSelector.updateHandSize(username, nCount, nCountPlaydeck);
    },
    
    clearLastSeen : function()
    {
        GameCompanies.PlayerSelector.clearLastSeen();
    },

    character: {

        /**
         * Remove a character container from table
         * 
         * @param {string} uuid
         * @returns {void}
         */
        removeExistingCharacter: function (uuid)
        {
            DomUtils.removeNode(document.getElementById("character_" + uuid));
        },

        addResources: function (vsList, pContainer)
        {
            if (vsList.length === 0 || pContainer === null)
                return 0;

            for (let elem of vsList)
                pContainer.prepend(createNewCard(elem));

            return vsList.length;
        },

        addInfluenced: function (vsList, pContainer)
        {
            if (vsList.length === 0)
                return 0;
            else if (pContainer === null)
            {
                console.warn("Cannot find influenced character container");
                return 0;
            }

            for (let elem of vsList)
                GameCompanies.character.add(elem, pContainer, false, false);

            return vsList.length;
        },

        /**
         * add a character to a given company if not already existent
         * @param {json} jsonCharacter
         * @param {Object} pContainer
         * @param {boolean} bInsertBeforeTarget insert before given element (of append otherwise)
         * @param {boolean} bIsHosting is hosting character
         * @returns {Object} Container DOM element
         */
        add(jsonCharacter, pContainer, bInsertBeforeTarget, bIsHosting)
        {
            /* remove, if the character is in the company. It is easier to redraw than to match which items are new etc. */
            GameCompanies.character.removeExistingCharacter(jsonCharacter.character.uuid);

            const pCharacter = insertNewCharacter(jsonCharacter.character, pContainer, bInsertBeforeTarget, bIsHosting);

            const pContainerResources = pCharacter.querySelector(".company-character-reosurces");
            
            let nAdded = 0;
            nAdded += this.addResources(jsonCharacter.resources, pContainerResources);
            nAdded += this.addResources(jsonCharacter.hazards, pContainerResources);

            pContainerResources.setAttribute("data-stack-size", nAdded);

            this.addInfluenced(jsonCharacter.influenced, pCharacter.querySelector(".company-character-influenced"));
            
            ArrayList(pCharacter).find("img.card-icon").each(function (img)
            {
                if (img.getAttribute("data-revealed") === "true")
                    img.setAttribute("src", img.getAttribute("data-img-image"));
            });

            return pCharacter;
        }
    },

    removeCompany: function (sId)
    {
        DomUtils.removeNode(document.getElementById("company_" + sId));
    },

    removeAllEmptyCompanies : function()
    {
        ArrayList(document).find(".company").each((company) => 
        {
            if (ArrayList(company).find(".company-character-host").size() === 0)
                DomUtils.removeNode(company);
        });
    },

    removeEmptyCompanies: function (vsIds)
    {
        for (let id of vsIds)
            this.removeCompany(id);

        this.removeAllEmptyCompanies();      
    },

    player2Hex: function (sInput)
    {
        return GameCompanies.PlayerSelector.player2Hex(sInput);
    },
    
    /**
     * Attach a hazard to companies site
     * 
     * @param {String} companyId
     * @param {String} code
     * @param {String} cardUuid
     * @param {String} state
     * @param {String} reveal
     * @return {void}
     */
    onAttachCardToCompanySites : function(companyId, cardList, bAllowContextMenu)
    {
        this.pGameCompanyLocation.onAttachCardToCompanySites(companyId, cardList, bAllowContextMenu)
    },
        
    tapSite : function(playerId, code, bIsTapped)
    {
        function getTargetContainer(isMe, playerCode)
        {
            if (playerCode !== "")
            {
                if (isMe)
                    return document.getElementById("player_companies");
                else
                    return document.getElementById("opponent_table").querySelector(".companies[data-player='" + playerCode + "']");
            }
            else
                return null;
        }

        const container = getTargetContainer(MeccgPlayers.isChallenger(playerId), this.player2Hex(playerId));
        ArrayList(container).findByClassName("company").each(function (company)
        {
            ArrayList(company).findByClassName("site-container").each(function (sitecontainer)
            {
                const pThis = sitecontainer.querySelector('div[data-card-code="' + code + '"]');
                if (pThis !== null)
                {
                    if (bIsTapped)
                    {
                        pThis.classList.remove("state_ready");
                        pThis.classList.add("state_tapped");
                    }
                    else
                    {
                        pThis.classList.remove("state_tapped");
                        pThis.classList.add("state_ready");
                    }
                }
            });
        });
    },

    requireCompanyContainer : function(bIsMe, compnanyId, playerId, pCheckForCardsPlayed)
    {
        const pElemContainer = document.getElementById("company_" + compnanyId);
        if (pElemContainer !== null)
        {
            pCheckForCardsPlayed.loadBefore(pElemContainer);
            ArrayList(pElemContainer).find(".company-characters").each(DomUtils.removeAllChildNodes);

            return pElemContainer;
        }
        else
        {

            const sHexPlayerCode = this.player2Hex(playerId);
            if (sHexPlayerCode === "")
                return null;

            const elemContainer = insertNewcontainer(bIsMe, sHexPlayerCode, compnanyId, playerId);
            if (document.body.getAttribute("data-is-watcher") === "true")
            {
                document.body.dispatchEvent(new CustomEvent("meccg-visitor-addname", { "detail": {
                    id: "companies_opponent_" + sHexPlayerCode,
                    player: playerId
                }}));
            }

            return elemContainer;
        }   
    },

    locationHousekeeping: function(map)
    {
        if (map)
            HouseKeepingLocations.get().onUpdate(map)
    },

    /**
     * draw a company on screen
     * 
     * @param {json} jsonCompany The Company JSON object
     * @returns {Boolean} success state
     */
    drawCompany: function (bIsMe, jsonCompany)
    {
        if (typeof jsonCompany !== "object" ||
            typeof jsonCompany.id === "undefined" || 
            !Array.isArray(jsonCompany.characters) ||
            jsonCompany.characters.length === 0)
        {
            return false;
        }
        const pCheckForCardsPlayed = new CheckForCardsPlayedCompany("ingamecard_");

        const elemContainer = this.requireCompanyContainer(bIsMe, jsonCompany.id, jsonCompany.playerId, pCheckForCardsPlayed);
        const pPlayerCompany = document.getElementById("company_" + jsonCompany.id);
        const elemList = elemContainer === null ? null : elemContainer.querySelector(".company-characters");
        if (elemList === null)
            return false;
            
        for (let _char of jsonCompany.characters)
            this.character.add(_char, elemList, false, true);

        this.drawLocations(jsonCompany.id, jsonCompany.sites.current, jsonCompany.sites.regions, jsonCompany.sites.target, jsonCompany.sites.revealed, jsonCompany.sites.attached, jsonCompany.sites.current_tapped, jsonCompany.sites.target_tapped);

        /* important: cards not my own must to be dragged around, unless they are in my company. */
        if (!bIsMe && !this.isPlayersCompany(pPlayerCompany))
            ArrayList(elemContainer).find(".card").each(this.drawCompanyRemoveDraggableHazardParams.bind(this));

        ArrayList(elemList).find(".card").each((div) => this.drawCompanyInitCardPreview(div, bIsMe));

        if (pPlayerCompany !== null && bIsMe)
            GameCompanies.HandCardsDraggable.initOnCompany(elemContainer);

        ArrayList(elemList).find("div.card").each((_e) => document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: _e.getAttribute("id"), type: "generic" }} )));
        elemContainer.classList.remove("hiddenVisibility");

        this.highlightNewCardsAtTable(elemContainer, pCheckForCardsPlayed);

        JumbleCards.updateCompany(elemContainer)
        return true;
    },

    drawCompanyRemoveDraggableHazardParams : function(jThis)
    {
        const sType = jThis.getAttribute("data-card-type");
        if (sType !== null && sType !== "hazard")
            jThis.setAttribute("draggable", "false");
    },

    drawCompanyInitCardPreview : function(div, bIsMe)
    {
        if (bIsMe)
            GameCompanies.CardPreview.initOnGuard(div);
        else
            GameCompanies.CardPreview.init(div);

        GameCompanies.initSingleCardEvent(div, false);
    },

    highlightNewCardsAtTable(elemContainer, pCheckForCardsPlayed)
    {
        if (elemContainer !== null)
        {
            pCheckForCardsPlayed.loadAfter(elemContainer);
            pCheckForCardsPlayed.mark();
        }
    },

    initSingleCardEvent : function(pCardDiv, isOnGuardCard)
    {
        if (pCardDiv === null)
            return;

        pCardDiv.setAttribute("data-location", "inplay");

        if (isOnGuardCard || pCardDiv.getAttribute("data-card-type") !== "character")
            GameCompanies.HandCardsDraggable.initOnCardResource(pCardDiv);
        else
            GameCompanies.HandCardsDraggable.initOnCardCharacter(pCardDiv);
    },

    revealCard : function(pImage)
    {
        if (pImage !== null)
            pImage.setAttribute("src", pImage.getAttribute("data-img-image"));
    },

    revealLocations: function (company)
    {
        this.pGameCompanyLocation.revealMovement(company);
    },

    removeMapInteraction:function(company)
    {
        this.pGameCompanyLocation.removeMapInteraction(company);
    },
        
    showMapInteraction:function(company)
    {
        this.pGameCompanyLocation.showMapInteraction(company)
    },

    onCompanyMarkCurrently : function(company)
    {
        this.removeCompanyMarking();

        const currentCompany = document.getElementById("company_" + company);
        if (currentCompany !== null)
        {
            currentCompany.classList.add("company-mark-current");
            ArrayList(currentCompany).find(".location-reveal").each((e) => e.classList.add("hide"));
        }
    },

    removeCompanyMarking : function()
    {
        const list = document.getElementsByClassName("company");
        for (let elem of list)
                elem.classList.remove("company-mark-current");
    },

    isPlayersCompany : function(pCompany)
    {
        const parent = DomUtils.findParentByClass(pCompany, "companies");
        return parent !== null && parent.getAttribute("id") === "player_companies";
    },

    detectIsAgentCompany : function(companyContainer)
    {
        if (companyContainer == null)
            return false;
        
        let bHasRevealed = false;
        let nCharacters = 0;
        
        ArrayList(companyContainer.querySelectorAll(".company-character-host")).each(function(elem)
        {
            ArrayList(elem.querySelectorAll("img.card-icon")).each(function (img)
            {
                if (img.parentElement.getAttribute("data-card-type") === "character")
                {
                    nCharacters++;
                    if (img.getAttribute("src") !== "/data/backside")
                        bHasRevealed = true;
                }
            });
        });

        return nCharacters === 1 && !bHasRevealed;
    },

    drawLocations: function (company, start, regions, target, isRevealed, attached, current_tapped, target_tapped, revealStartSite)
    {
        this.pGameCompanyLocation.drawLocations(company, start, regions, target, isRevealed, attached, current_tapped, target_tapped, revealStartSite);
    },

    
    onEnterStartPhase: function ()
    {
        document.querySelector(".taskbar .startphase").classList.add("act");
    },
    
    readyCardsInContainer : function(pContainer)
    {
        ArrayList(pContainer).find(".company-character div.card").each((e) =>
        {
            if (e.classList.contains("state_tapped"))
                e.classList.remove("state_tapped");
        });
    },

    onEnterOrganisationPhase: function (sCurrent, bIsMe)
    {
        if (bIsMe)
        {
            const container = document.getElementById("player_companies");
            GameCompanies.readyCardsInContainer(container);
            GameCompanies.prefillEmptyMovementToCurrentSite(container)
        }
        else
            GameCompanies.readyCardsInContainer(document.getElementById("opponent_table").querySelector(".companies[data-player='" + this.player2Hex(sCurrent) + "']"));
    },

    prefillEmptyMovementToCurrentSite : function()
    {
        /** todo */
    },

    onEnterMovementHazardPhase: function ()
    {
        /** not needed here */
    },

    onRemoveAllMarkings: function ()
    {
        const list = document.getElementsByClassName("company-character");
        for (let elem of list)
        {
            ArrayList(elem).find("div.card").each((e) =>
            {
                if (e.classList.contains("card-highlight-mark"))
                    e.classList.remove("card-highlight-mark");
            });
        }
    },

    onEnterSitePhase: function (sCurrent, bIsMe)
    {
        if (bIsMe)
            ArrayList(document.getElementById("player_companies")).find(".company-site-list .sites").each(this.pGameCompanyLocation.onArriveAtTarget);
        else
        {
            const sHex = this.player2Hex(sCurrent);
            const pOpponent = document.getElementById("companies_opponent_" + sHex);
            if (pOpponent !== null)
                this.pGameCompanyLocation.onArriveAtTarget(pOpponent.querySelector(".sites"));
        }
    },
    
    onCompanyArrivesAtDestination: function (sCompanyId, bReduceSites)
    {
        this.pGameCompanyLocation.onCompanyArrivesAtDestination(sCompanyId, bReduceSites);
    },

    onCompanyReturnsToOrigin : function (sCompanyId, bReduceSites)
    {
        this.pGameCompanyLocation.onCompanyReturnsToOrigin(sCompanyId, bReduceSites);
    },

    onMenuActionClear: function (elem)
    {
        if (elem === null)
            return elem;

        elem.classList.remove("state_ready");
        elem.classList.remove("state_tapped");
        elem.classList.remove("state_tapped_fixed");
        elem.classList.remove("state_rot270");
        elem.classList.remove("state_wounded");
        return elem;
    },
    onMenuActionReadySite: function (ownerId, code)
    {
        GameCompanies.tapSite(ownerId, code, false);
    },
    onMenuActionTapSite: function (ownerId, code)
    {
        GameCompanies.tapSite(ownerId, code, true);
    },
    
    onMenuActionReady: function (uuid)
    {
        const elem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
        if (elem === null)
            return;

        this.onMenuActionClear(elem);
        if (!elem.classList.contains("state_ready"))
            elem.classList.add("state_ready");
    },

    onMenuActionTap: function (uuid, _code, bForced)
    {
        const elem = this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
        if (elem !== null)
            elem.classList.add(bForced ? "state_tapped_fixed" : "state_tapped");
    },

    onMenuActionWound: function (uuid)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]')).classList.add("state_wounded");
    },

    onMenuActionRot270: function (uuid)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]')).classList.add("state_rot270");
    },
    
    /**
     * Set the current player (player turn!)
     * @param {String} sPlayerId
     * @param {boolean} bIsMe
     * @return {void}
     */
    setCurrentPlayer : function(sPlayerId, bIsMe)
    {
        GameCompanies.PlayerSelector.setCurrentPlayer(sPlayerId, bIsMe);
    },

    onMenuActionGlow: function (uuid)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (pElem === null)
            return;

        if (pElem.classList.contains("glowing"))
        {
            pElem.classList.remove("glowing");
            return;
        }

        pElem.classList.add("glowing");
        setTimeout(() => pElem.classList.remove("glowing"), 6000);
    },

    onMenuActionHighlight:  function (uuid)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (!pElem.classList.contains("card-highlight"))
            plem.classList.add("card-highlight");
    },

    onMenuActionMark : function(uuid, bMark)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
        if (pElem === null)
            return;

        if (bMark && !pElem.classList.contains("card-highlight-mark"))
            pElem.classList.add("card-highlight-mark");
        else if (!bMark && pElem.classList.contains("card-highlight-mark"))
            pElem.classList.remove("card-highlight-mark");
    },

    onMenuActionRevealCard: function (uuid = "", reveal = true)
    {
        const pImage = uuid === "" ? null : document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (pImage === null)
            return;

        const src = reveal ? pImage.getAttribute("data-img-image") : pImage.getAttribute("data-image-backside");
        if (src === "")
            return;

        pImage.setAttribute("src", src);

        if (pImage.parentElement?.hasAttribute("data-revealed"))
            pImage.parentElement.setAttribute("data-revealed", src.indexOf("/backside") === -1 ? "true" : "false");
    },

    onRemoveCardsFromGame: function (listUuid)
    {
        for (let uuid of listUuid)
            DomUtils.removeNode(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
    },

    onRemoveEmptyCompanies: function ()
    {
        ArrayList(document).find(".company").each((e) => GameCompanies.onRemoveEmptyCompaniesCheckChars(e.querySelector(".company-characters")));
        GameCompanies.removeAllEmptyCompanies();
    },

    onRemoveEmptyCompaniesCheckChars: function (elem)
    {
        if (ArrayList(elem).find(".card").size() === 0)
            DomUtils.unbindAndRemove(jQuery(elem).closest(".company"));
    }
};


class HouseKeepingLocations 
{
    #lastUpdated = 0;

    static #instance = new HouseKeepingLocations();

    static get()
    {
        return HouseKeepingLocations.#instance;
    }

    #hasAttachedCards()
    {
        const list = document.getElementsByClassName("site-onguard");
        if (list === null || list.length === 0)
            return false;

        for (const elem of list)
        {
            if (elem.querySelector("img") !== null)
                return true;
        }

        return false;
    }

    #getSiteContianer(id)
    {
        const company = document.getElementById(id);
        if (company === null)
        {
            console.warn("Company does not exist anymore:", id);
            return null;
        }

        const container = company.querySelector(".site-onguard");
        if (container === null)
        {
            console.warn("Company does not have onguard container:", id);
            return null;
        }

        return container;
    }

    #onUpdateCompanyById(id, uids)
    {
        const container = this.#getSiteContianer(id);
        if (container === null)
            return;

        const list = this.#getRemovables(container, uids);
        this.#remove(list);
    }

    #remove(list)
    {
        for (const elem of list)
            elem.parentElement.removeChild(elem);
    }

    #getRemovables(container, uids)
    {
        const divs = container.querySelectorAll("div");
        if (divs === null || divs.length === 0)
            return [];

        const removable = [];
        for (const div of divs)
        {
            const uid = div.getAttribute("data-uuid");
            if (uid !== null && uid !== "" && !uids.includes(uid))
                removable.push(div);
        }

        return removable;
    }

    onUpdate(map)
    {
        for (const companyid in map)
            this.#onUpdateCompanyById("company_" + companyid, map[companyid]);
    }

    onEvent()
    {
        if (this.#hasAttachedCards())
            MeccgApi.send("/game/company/location/housekeeping", {});
    }
}

document.body.addEventListener("meccg-housekeeping", () => HouseKeepingLocations.get().onEvent());
