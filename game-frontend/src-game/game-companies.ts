import { CheckForCardsPlayedCompany } from "./utils/added-cards-monitor";
import CardPreview from "./card-preview";
import ContextMenu from "./contextmenu/contextmenu";
import Dictionary from "./utils/dictionary";
import initSingleCardEvent from "./draggableevents/InitSingleCardEvent";
import { TaskBarCards } from "./game-taskbarcards";
import GameCompanyLocation from "./GameCompanyLocation";
import DomUtils, { ArrayList } from "./utils/libraries";
import MeccgApi, { MeccgPlayers } from "./meccg-api";
import PlayerSelector from "./playerselector/playerselector";
import JumbleCards from "./utils/JumbleCards";
import { HandCardsDraggable } from "./handcards-draggable";
import CreateNewCard from "./utils/CreateNewCard";

declare const jQuery:any;

const createCompanyHtml = function(companyId:string, id:string)
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

const createOpponentContainer = function(sHexPlayerCode:string, playerId:string)
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

    createOpponentContainerVisitorHand(pContainer, playerId);
    return div;
};

const createOpponentContainerVisitorHand = function(pContainer:any, playerId:string)
{
    if (document.body.getAttribute("data-is-watcher") !== "true" || document.getElementById("playercard_hand_container_" + playerId) !== null)
        return;

    const div = document.createElement("div");
    div.setAttribute("id", "playercard_hand_container_" + playerId);
    div.setAttribute("class", "visitor-hand-view");
    pContainer.appendChild(div);

    const eHand = document.getElementById("watch_togglehand");
    if (eHand !== null)
        eHand.click();
}


/**
 * creat cCharacter div
 * @param {JSON} jsonCard 
 * @param {String} id 
 * @returns DOM element or empty fragment
 */
const createCharacterHtml = function(jsonCard:any, id:any)
{
    const uuid = jsonCard.uuid;
    if (uuid === "" || id === "")
        return document.createDocumentFragment();

    const div = document.createElement("div");
    div.setAttribute("class", "company-character pos-rel fl character-is-company-host");
    div.setAttribute("id", id);
    div.setAttribute("data-character-uuid", uuid);

    let pCharacterContainer = document.createElement("div");
    pCharacterContainer.setAttribute("class", "company-character-container pos-rel");
    
    const pCharDiv = document.createElement("div");
    pCharDiv.setAttribute("class", "company-character-host company-character-reosurces");

    const characterDiv = CreateNewCard(jsonCard);
    characterDiv.setAttribute("data-card-type", "character");
    characterDiv.setAttribute("data-allow-follower", jsonCard.type === "character" ? "true":"false");

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

function rollCharacterDice(e:any)
{
    const code = e.target.getAttribute("data-code");
    const uuid = e.target.getAttribute("data-uuid");
    TaskBarCards.rollDiceCharacter(uuid, code);
}

function markCharacter(e:any)
{
    const code = e.target.getAttribute("data-code");
    const uuid = e.target.getAttribute("data-uuid");

    const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
    if (pElem === null)
        return;

    const isMarked = pElem.classList.contains("card-highlight-mark");
    MeccgApi.send("/game/card/state/mark", {uuid : uuid, code: code, mark: !isMarked });  
}

function insertNewcontainer(bIsPlayer:boolean, sHexPlayerCode:string, companyId:string, playerId:string)
{
    const id = "company_" + companyId;
    const pDiv = createCompanyHtml(companyId, id);
    if (pDiv === null)
        return null;

    if (typeof ContextMenu?.contextActions?.onContextCompany !== "undefined")
        pDiv.oncontextmenu = ContextMenu.contextActions.onContextCompany.bind(ContextMenu.contextActions);

    const targetContainer = bIsPlayer ? document.getElementById("player_companies") : createOpponentContainer(sHexPlayerCode, playerId);
    if (targetContainer)
        targetContainer.prepend(pDiv);

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
 function insertNewCharacter(jsonCard:any, pContainer:any, bInsertBefore:boolean, bIsHosting:boolean)
 {
     const id = "character_" + jsonCard.uuid;
     const pHtml:any = createCharacterHtml(jsonCard, id);
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

class CompaniesCharacter  {

    /**
     * Remove a character container from table
     * 
     * @param {string} uuid
     * @returns {void}
     */
    removeExistingCharacter(uuid:string)
    {
        DomUtils.removeNode(document.getElementById("character_" + uuid));
    }


    addResources(vsList:any, pContainer:any)
    {
        if (vsList.length === 0 || pContainer === null)
            return 0;

        for (let elem of vsList)
            pContainer.prepend(CreateNewCard(elem));

        return vsList.length;
    }


    addInfluenced(vsList:any, pContainer:any)
    {
        if (vsList.length === 0)
            return 0;
        else if (pContainer === null)
        {
            console.warn("Cannot find influenced character container");
            return 0;
        }

        for (let elem of vsList)
            this.add(elem, pContainer, false, false);

        return vsList.length;
    }


    /**
     * add a character to a given company if not already existent
     * @param {json} jsonCharacter
     * @param {Object} pContainer
     * @param {boolean} bInsertBeforeTarget insert before given element (of append otherwise)
     * @param {boolean} bIsHosting is hosting character
     * @returns {Object} Container DOM element
     */
    add(jsonCharacter:any, pContainer:any, bInsertBeforeTarget:boolean, bIsHosting:boolean)
    {
        /* remove, if the character is in the company. It is easier to redraw than to match which items are new etc. */
        this.removeExistingCharacter(jsonCharacter.character.uuid);

        const pCharacter = insertNewCharacter(jsonCharacter.character, pContainer, bInsertBeforeTarget, bIsHosting);
        if (pCharacter === null)
            return;

        const pContainerResources = pCharacter.querySelector(".company-character-reosurces");
        if (pContainerResources)
        {
            const nAdded = this.addResources(jsonCharacter.attached, pContainerResources);
            pContainerResources.setAttribute("data-stack-size", nAdded);
        }

        this.addInfluenced(jsonCharacter.influenced, pCharacter.querySelector(".company-character-influenced"));
        
        ArrayList(pCharacter).find("img.card-icon").each(function (img:any)
        {
            if (img.getAttribute("data-revealed") === "true")
                img.setAttribute("src", img.getAttribute("data-img-image"));
        });

        return pCharacter;
    }
}

class GameCompaniesImpl {

    static CARDID_PREFIX = "ingamecard_";

    #PlayerSelector = new PlayerSelector();
    #pGameCompanyLocation:GameCompanyLocation = new GameCompanyLocation(GameCompaniesImpl.CARDID_PREFIX);
    character = new CompaniesCharacter()

    updateLastSeen(username:string, isOnline:boolean)
    {
        this.#PlayerSelector.updateLastSeen(username, isOnline)
    }


    removePlayerIndicator(username:string)
    {
        this.#PlayerSelector.removePlayerIndicator(username)
    }

    
    updateHandSize(username:string, nCount:number, nCountPlaydeck:number)
    {
        this.#PlayerSelector.updateHandSize(username, "" + nCount, "" + nCountPlaydeck);
    }

    
    clearLastSeen()
    {
        this.#PlayerSelector.clearLastSeen();
    }



    removeCompany(sId:string)
    {
        DomUtils.removeNode(document.getElementById("company_" + sId));
    }


    removeAllEmptyCompanies()
    {
        ArrayList(document).find(".company").each((company:any) => 
        {
            if (ArrayList(company).find(".company-character-host").size() === 0)
                DomUtils.removeNode(company);
        });
    }


    removeEmptyCompanies(vsIds:string[])
    {
        for (let id of vsIds)
            this.removeCompany(id);

        this.removeAllEmptyCompanies();      
    }


    player2Hex(sInput:string)
    {
        return this.#PlayerSelector.player2Hex(sInput);
    }

    
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
    onAttachCardToCompanySites(companyId:string, cardList:any, bAllowContextMenu:boolean)
    {
        this.#pGameCompanyLocation.onAttachCardToCompanySites(companyId, cardList, bAllowContextMenu)
    }

        
    tapSite(playerId:string, code:string, bIsTapped:boolean)
    {
        function getTargetContainer(isMe:boolean, playerCode:string)
        {
            if (playerCode !== "")
            {
                if (isMe)
                    return document.getElementById("player_companies");
                
                const e =  document.getElementById("opponent_table");
                if (e)
                    return e.querySelector(".companies[data-player='" + playerCode + "']");
            }

            return null;
        }

        const container = getTargetContainer(MeccgPlayers.isChallenger(playerId), this.player2Hex(playerId));
        ArrayList(container).findByClassName("company").each(function (company:any)
        {
            ArrayList(company).findByClassName("site-container").each(function (sitecontainer:any)
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
    }


    requireCompanyContainer(bIsMe:boolean, compnanyId:string, playerId:string, pCheckForCardsPlayed:any)
    {
        const pElemContainer = document.getElementById("company_" + compnanyId);
        if (pElemContainer !== null)
        {
            pCheckForCardsPlayed.loadBefore(pElemContainer);
            ArrayList(pElemContainer).find(".company-characters").each(DomUtils.removeAllChildNodes);
            return pElemContainer;
        }

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


    /**
     * draw a company on screen
     * 
     * @param {json} jsonCompany The Company JSON object
     * @returns {Boolean} success state
     */
    drawCompany(bIsMe:boolean, jsonCompany:any)
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
        if (elemContainer === null)
            return false;

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

        ArrayList(elemList).find(".card").each((div:any) => this.drawCompanyInitCardPreview(div, bIsMe));

        if (pPlayerCompany !== null && bIsMe)
            HandCardsDraggable.initOnCompany(elemContainer);

        ArrayList(elemList).find("div.card").each((_e:any) => document.body.dispatchEvent(new CustomEvent('meccg-context-generic', { detail: { id: _e.getAttribute("id"), type: "generic" }} )));
        elemContainer.classList.remove("hiddenVisibility");

        this.highlightNewCardsAtTable(elemContainer, pCheckForCardsPlayed);

        JumbleCards.updateCompany(elemContainer, -1)
        return true;
    }


    drawCompanyRemoveDraggableHazardParams(jThis:any)
    {
        const sType = jThis.getAttribute("data-card-type");
        if (sType !== null && sType !== "hazard")
            jThis.setAttribute("draggable", "false");
    }


    drawCompanyInitCardPreview(div:any, bIsMe:boolean)
    {
        if (bIsMe)
            CardPreview.initOnGuard(div);
        else
            CardPreview.init(div);

        initSingleCardEvent(div);
    }


    highlightNewCardsAtTable(elemContainer:any, pCheckForCardsPlayed:any)
    {
        if (elemContainer !== null)
        {
            pCheckForCardsPlayed.loadAfter(elemContainer);
            pCheckForCardsPlayed.mark();
        }
    }


    revealCard(pImage:any)
    {
        pImage.setAttribute("src", pImage.getAttribute("data-img-image"));
    }


    revealLocations(company:any)
    {
        this.#pGameCompanyLocation.revealMovement(company);
    }


    removeMapInteraction(company:any)
    {
        this.#pGameCompanyLocation.removeMapInteraction(company);
    }

        
    showMapInteraction(company:any)
    {
        this.#pGameCompanyLocation.showMapInteraction(company)
    }


    onCompanyMarkCurrently(company:any)
    {
        this.removeCompanyMarking();

        const currentCompany = document.getElementById("company_" + company);
        if (currentCompany !== null)
        {
            currentCompany.classList.add("company-mark-current");
            ArrayList(currentCompany).find(".location-reveal").each((e:any) => e.classList.add("hide"));
        }
    }


    removeCompanyMarking()
    {
        const list:any = document.getElementsByClassName("company");
        for (let elem of list)
                elem.classList.remove("company-mark-current");
    }


    isPlayersCompany(pCompany:any)
    {
        const parent = DomUtils.findParentByClass(pCompany, "companies");
        return parent !== null && parent.getAttribute("id") === "player_companies";
    }


    drawLocations(company:string, start:string, regions:string[], target:string, isRevealed:boolean, attached:any[], current_tapped:boolean, target_tapped:boolean, revealStartSite = true)
    {
        this.#pGameCompanyLocation.drawLocations(company, start, regions, target, isRevealed, attached, current_tapped, target_tapped, revealStartSite);
    }

    onEnterStartPhase()
    {
        document.querySelector(".taskbar .startphase")?.classList.add("act");
    }

    
    readyCardsInContainer(pContainer:any)
    {
        ArrayList(pContainer).find(".company-character div.card").each((e:any) =>
        {
            if (e.classList.contains("state_tapped"))
                e.classList.remove("state_tapped");
        });
    }


    onEnterOrganisationPhase(sCurrent:string, bIsMe:boolean)
    {
        if (!bIsMe)
        {
            this.readyCardsInContainer(document.getElementById("opponent_table")!.querySelector(".companies[data-player='" + this.player2Hex(sCurrent) + "']"));
            return;
        }
        {
            const container = document.getElementById("player_companies");
            if (container)
            {
                this.readyCardsInContainer(container);
                this.prefillEmptyMovementToCurrentSite()
            }
        }
    }


    prefillEmptyMovementToCurrentSite()
    {
        /** todo */
    }


    onEnterMovementHazardPhase()
    {
        /** not needed here */
    }


    onRemoveAllMarkings()
    {
        const list:any = document.getElementsByClassName("company-character");
        for (let elem of list)
        {
            ArrayList(elem).find("div.card").each((e:any) =>
            {
                if (e.classList.contains("card-highlight-mark"))
                    e.classList.remove("card-highlight-mark");
            });
        }
    }


    onEnterSitePhase(sCurrent:string, bIsMe:boolean)
    {
        if (bIsMe)
            ArrayList(document.getElementById("player_companies")).find(".company-site-list .sites").each(this.#pGameCompanyLocation.onArriveAtTarget);
        else
        {
            const sHex = this.player2Hex(sCurrent);
            const pOpponent = document.getElementById("companies_opponent_" + sHex);
            if (pOpponent !== null)
                this.#pGameCompanyLocation.onArriveAtTarget(pOpponent.querySelector(".sites"));
        }
    }

    
    onCompanyArrivesAtDestination(sCompanyId:string, bReduceSites:boolean)
    {
        this.#pGameCompanyLocation.onCompanyArrivesAtDestination(sCompanyId, bReduceSites);
    }


    onCompanyReturnsToOrigin (sCompanyId:string, bReduceSites:boolean)
    {
        this.#pGameCompanyLocation.onCompanyReturnsToOrigin(sCompanyId, bReduceSites);
    }


    onMenuActionClear(elem:any)
    {
        if (elem === null)
            return elem;

        elem.classList.remove("state_ready");
        elem.classList.remove("state_tapped");
        elem.classList.remove("state_tapped_fixed");
        elem.classList.remove("state_rot270");
        elem.classList.remove("state_wounded");
        return elem;
    }

    onMenuActionReadySite(ownerId:string, code:string)
    {
        this.tapSite(ownerId, code, false);
    }

    onMenuActionTapSite(ownerId:string, code:string)
    {
        this.tapSite(ownerId, code, true);
    }

    
    onMenuActionReady(uuid:string)
    {
        const elem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
        if (elem === null)
            return;

        this.onMenuActionClear(elem);
        if (!elem.classList.contains("state_ready"))
            elem.classList.add("state_ready");
    }


    onMenuActionTap(uuid:string, _code:string, bForced:boolean)
    {
        const elem = this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
        if (elem !== null)
            elem.classList.add(bForced ? "state_tapped_fixed" : "state_tapped");
    }


    onMenuActionWound(uuid:string)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]')).classList.add("state_wounded");
    }


    onMenuActionRot270(uuid:string)
    {
        this.onMenuActionClear(document.querySelector('div.card[data-uuid="' + uuid + '"]')).classList.add("state_rot270");
    }

    
    /**
     * Set the current player (player turn!)
     * @param {String} sPlayerId
     * @param {boolean} bIsMe
     * @return {void}
     */
    setCurrentPlayer(sPlayerId:string, bIsMe:boolean)
    {
        this.#PlayerSelector.setCurrentPlayer(sPlayerId, bIsMe);
    }


    onMenuActionGlow(uuid:string)
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
    }


    onMenuActionHighlight(uuid:string)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (pElem && !pElem.classList.contains("card-highlight"))
            pElem.classList.add("card-highlight");
    }


    onMenuActionMark(uuid:string, bMark:boolean)
    {
        const pElem = document.querySelector('div.card[data-uuid="' + uuid + '"]');
        if (pElem === null)
            return;

        if (bMark && !pElem.classList.contains("card-highlight-mark"))
            pElem.classList.add("card-highlight-mark");
        else if (!bMark && pElem.classList.contains("card-highlight-mark"))
            pElem.classList.remove("card-highlight-mark");
    }


    onMenuActionRevealCard(uuid = "", reveal = true)
    {
        const pImage = uuid === "" ? null : document.querySelector('div.card[data-uuid="' + uuid + '"] img.card-icon');
        if (pImage === null)
            return;

        const src = reveal ? pImage.getAttribute("data-img-image") : pImage.getAttribute("data-image-backside");
        if (src)
            pImage.setAttribute("src", src);
    }


    onRemoveCardsFromGame(listUuid:string[])
    {
        for (let uuid of listUuid)
            DomUtils.removeNode(document.querySelector('div.card[data-uuid="' + uuid + '"]'));
    }


    onRemoveEmptyCompanies()
    {
        const pthis = this;
        ArrayList(document).find(".company").each((e:any) => pthis.onRemoveEmptyCompaniesCheckChars(e.querySelector(".company-characters")));
        this.removeAllEmptyCompanies();
    }


    onRemoveEmptyCompaniesCheckChars(elem:any)
    {
        if (ArrayList(elem).find(".card").size() === 0)
            DomUtils.unbindAndRemove(jQuery(elem).closest(".company"));
    }
}

const GameCompanies = new GameCompaniesImpl();
export default GameCompanies;
