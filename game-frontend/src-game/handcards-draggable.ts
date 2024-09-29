import CardPreview from "./card-preview";
import Dictionary from "./utils/dictionary";
import { DraggableEventEvaluate } from "./draggableevents/DraggableEventEvaluate";
import { DropFunctions } from "./draggableevents/DropFunctions";
import DomUtils, { ArrayList } from "./utils/libraries";
import MeccgApi from "./meccg-api";
import { ReDeckInfoNotification } from "./question/PageRefreshInfo";
import { ResolveHandSizeContainer } from "./arda/resolvehandsize";
import CreateHandCardsDraggableUtils from "./utils/CreateHandCardsDraggableUtils";

declare const jQuery:any;

const HandCardsDraggable = {

    _locationMessageId : 0,

    MeccgApi : null,

    _warnReDeckAt : 5,
    _warnHasShown : false,

    /**
     * @deprecated
     */
    setApi : function()
    {
    },

    getApi : function()
    {
        return MeccgApi;
    },

    /**
     * Get the company path. This will fail for onguard cards, but it is ok, because it will simply return an empty data
     * object
     * 
     * @param {JQuery} jCardContainer
     * @returns {createHandCardsDraggable.HandCardsDraggable.getCompanyPath.handcards-draggableAnonym$0}
     */
    getCompanyPath : function(pCardContainer:any)
    {
        const pCompanyCharacter = DomUtils.closestByClass(pCardContainer, "company-character");

        const character_uuid = pCompanyCharacter === null ? "" : pCompanyCharacter.getAttribute("data-character-uuid")

        /**
         * this character is either host or influenced
         */
        const isHostCharacter = pCompanyCharacter === null ? false : pCompanyCharacter.classList.contains("character-is-company-host");

        /**
         * This characters company ID
         * @type String
         */
        const pClosestCompany = DomUtils.closestByClass(pCardContainer, "company");
        const companySourceId = pClosestCompany === null ? "" : pClosestCompany.getAttribute("data-company-id");
        
        let parentCharacterUuid = "";
        if (!isHostCharacter && pCompanyCharacter !== null)
        {
            const _companyCharacter = DomUtils.closestByClass(pCompanyCharacter.parentNode, "company-character");
            if (_companyCharacter !== null)
                parentCharacterUuid = _companyCharacter.getAttribute("data-character-uuid");
        }

        return {
            character_uuid : character_uuid,
            company_uuid : companySourceId === null ? "" : companySourceId,
            is_host : isHostCharacter,
            parent_character_uuid : parentCharacterUuid
        };
    },

    onLocationSelectClick : function(sCode:string, isSiteRevealed:boolean, companyUuid:string, regionMap:ConstrainBoolean)
    {
        const data = {
            company : companyUuid,
            code : sCode,
            revealed : isSiteRevealed,
            id : CreateHandCardsDraggableUtils.requireMessageId(),
            regionmap : regionMap
        };

        document.body.dispatchEvent(new CustomEvent("meccg-map-show", { "detail":  data }));
    },
    
    onLocationRevealClick : function(elem:any, companyUuid:string)
    {
        const sites = DomUtils.findParentByClass(elem, "company-site-list");
        if (sites === null)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("handcards_404sites", "Cannot find companies' sites.") }));
        }
        else if (sites.querySelector(".site-target img") !== null)
        {
            MeccgApi.send("/game/company/location/reveal", {companyUuid: companyUuid});
            MeccgApi.send("/game/company/markcurrently", {uuid: companyUuid});
        }
        else if (sites.querySelector(".site-current img") !== null)
        {
            MeccgApi.send("/game/company/markcurrently", {uuid: companyUuid});
        }
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("handcards_movementfirst", "Please organize movement first.") }));
    },

    onCompanyMovementSelectClick: function(e:any)
    {
        e.stopPropagation();
        e.preventDefault();

        let me = e.target;
        if (!me.hasAttribute("data-company-uuid"))
            me = me.parentElement;

        const _companyUuid = me.getAttribute("data-company-uuid");
        const siteData = HandCardsDraggable.getStartingLocation(DomUtils.closestByClass(me, "company-site-list"));
        
        let sCode = "";
        let isSiteRevealed = true;

        if (siteData !== null)
        {
            isSiteRevealed = siteData.revealed;
            sCode = siteData.code;
        }

        HandCardsDraggable.onLocationSelectClick(sCode, isSiteRevealed, _companyUuid, true);
        return false;
    },

    onCompanySelectMoveementUDClick:function(e:any)
    {
        e.stopPropagation();
        e.preventDefault();

        let me = e.target;
        if (!me.hasAttribute("data-company-uuid"))
            me = me.parentElement;

        const _companyUuid = me.getAttribute("data-company-uuid");
        const siteData = HandCardsDraggable.getStartingLocation(DomUtils.closestByClass(me, "company-site-list"))
        let sCode = "";
        let isSiteRevealed = true;

        if (siteData !== null)
        {
            isSiteRevealed = siteData.revealed;
            sCode = siteData.code;
        }

        HandCardsDraggable.onLocationSelectClick(sCode, isSiteRevealed, _companyUuid, false);
        return false;
    },

    onCompanySelectMovementRelvealClick:function(e:any)
    {
        let me = e.target;
        if (!me.hasAttribute("data-company-uuid"))
            me = me.parentElement;

        const _companyUuid = me.getAttribute("data-company-uuid");
        HandCardsDraggable.onLocationRevealClick(me, _companyUuid);
        HandCardsDraggable.triggerMovementHazardClick();

        e.stopPropagation();
        return false;
    },
    
    /**
     * Init Company events (add host character)
     * 
     * @param {Object} jCompany
     * @returns {void}
     */
    initOnCompany : function(jCompany:any)
    {
        if (jCompany === null)
            return;

        const companyUuid = jCompany.getAttribute("data-company-id");
        
        ArrayList(jCompany).find(".location-select").each(function (_elem:any) 
        {
            _elem.setAttribute("data-company-uuid", companyUuid);
            _elem.onclick = HandCardsDraggable.onCompanyMovementSelectClick;
        });
        
        ArrayList(jCompany).find(".location-select-ud").each(function (_elem:any) 
        {
            _elem.setAttribute("data-company-uuid", companyUuid);
            _elem.onclick = HandCardsDraggable.onCompanySelectMoveementUDClick;
        });

        ArrayList(jCompany).find(".location-reveal").each(function(_elem:any) 
        {
            _elem.setAttribute("data-company-uuid", companyUuid);
            _elem.onclick = HandCardsDraggable.onCompanySelectMovementRelvealClick;
        });
    },

    triggerMovementHazardClick : function()
    {
        const pContainer = document.getElementById("playercard_hand");
        const pLink:any = pContainer === null ? null : pContainer.querySelector('a[data-phase="movement"]');
        if (pLink !== null && !pLink.classList.contains("act"))
            pLink.click();
    },
    
    getStartingLocation : function(pCompany:any)
    {
        if (pCompany === null)
            return null;

        const pSite = pCompany.querySelector(".site-current .card");
        if (pSite === null)
            return null;

        const val = pSite.getAttribute("data-card-code");
        if (val === null)
            return null;
            
        return {
            code : val,
            revealed : HandCardsDraggable.isSiteRevealed(pSite)
        }
    },

    isSiteRevealed : function(pDiv:any)
    {
        if (pDiv === null)
            return false;

        const img = pDiv.querySelector("img");
        return img !== null && "/data/backside-region" !== img.getAttribute("src");
    },

    getDonatingCharacter : function(source:string, elemDraggable:any)
    {
        if (source === "hand")
            return { character_uuid : elemDraggable.getAttribute("data-uuid"), company_uuid : "" };
        else
            return HandCardsDraggable.getCompanyPath(elemDraggable);
    },

    getDonatingCompanyUuid : function(donatingCharacter:any, receivingCharacter:any)
    {
        if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
            return donatingCharacter.company_uuid;
        else
            return "";
    },

    findFirstCharacterDiv:function(elem:any)
    {
        return elem === null ? null : elem.querySelector('div[data-card-type="character"]');
    },

    onCardCharacterHostOnDrop : function(_event:any, ui:any)
    {
        if (DropFunctions.isPrioElement(ui))
            return false;

        DropFunctions.sliceResourceCharacter(ui);

        const elemDraggable = ui.draggable[0];
        const droppableArea = HandCardsDraggable.findFirstCharacterDiv(this);
        const source = elemDraggable.getAttribute("data-location");
        const receivingCharacter = HandCardsDraggable.getCompanyPath(droppableArea);
        receivingCharacter.character_uuid = droppableArea.getAttribute("data-uuid");
        const redrawReceivingCompanyId = receivingCharacter.company_uuid;
        let redrawDonatingCompanyId = "";
        
        if (elemDraggable.getAttribute("data-card-type") === "site")
        {
            const code = elemDraggable.getAttribute("data-card-code");
            DropFunctions.onDropSiteOnCharacter(code, receivingCharacter.character_uuid, receivingCharacter.company_uuid);
            return;
        }
        else if (elemDraggable.getAttribute("data-card-type") === "character")
        {
            const donatingCharacter = HandCardsDraggable.getDonatingCharacter(source, elemDraggable);
            redrawDonatingCompanyId = HandCardsDraggable.getDonatingCompanyUuid(donatingCharacter, receivingCharacter);
            
            const params = {
                    uuid : elemDraggable.getAttribute("data-uuid"),
                    targetcharacter: receivingCharacter.character_uuid,
                    companyId : receivingCharacter.company_uuid,
                    fromHand : source === "hand"
            };
                
            if (params.targetcharacter === params.uuid)
                return;

            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            MeccgApi.send("/game/character/join/character", params);
        }
        else if (source === "hand" || source === "stagingarea")
        {
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            HandCardsDraggable.onAddResourcesToCharacter(elemDraggable.getAttribute("data-uuid"), droppableArea, true);
        }
        else 
        {
            const donatingCharacter = HandCardsDraggable.getCompanyPath(elemDraggable);
            if (donatingCharacter.character_uuid === receivingCharacter.character_uuid) /* oneself cannot be the target */
                return;

            donatingCharacter.character_uuid = elemDraggable.getAttribute("data-uuid");
            if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
                redrawDonatingCompanyId = donatingCharacter.company_uuid;
            
            if (elemDraggable.getAttribute("data-card-type") === "resource")
            {
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                HandCardsDraggable.onAddResourceToCharacter(elemDraggable.getAttribute("data-uuid"), droppableArea, false);
            }
            else if (elemDraggable.getAttribute("data-card-type") === "hazard")
            {   
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), droppableArea, source === "hand");
            }
        }

        if (redrawReceivingCompanyId !== "")
            MeccgApi.send("/game/draw/company", redrawReceivingCompanyId);
        
        if (redrawDonatingCompanyId !== "")
            MeccgApi.send("/game/draw/company", redrawDonatingCompanyId);
    },

    characterIsHostingCharacter : function(cardDiv:any)
    {
        return this.getCompanyPath(cardDiv).is_host;
    },

    onCardCharacterFollowerOnDrop : function(_event:any, ui:any ) 
    {
        if (DropFunctions.isPrioElement(ui))
            return false;

        DropFunctions.sliceResourceCharacter(ui);
        const elemDraggable = ui.draggable[0];
        const source = elemDraggable.getAttribute("data-location");
        const receivingCharacter = HandCardsDraggable.getCompanyPath(this);
        receivingCharacter.character_uuid = (this as any).getAttribute("data-uuid");
        
        let drawReceivingCompanyId = receivingCharacter.company_uuid;
        let drawDonatingCompanyId = "";
        
        if (elemDraggable.getAttribute("data-card-type") === "character" && elemDraggable.getAttribute("data-allow-follower") === "true")
            return;

        if (source === "hand" || source === "stagingarea")
        {
            const pThis = this;
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, true);
        }
        else
        {
            const donatingCharacter = HandCardsDraggable.getCompanyPath(elemDraggable);
            if (receivingCharacter.character_uuid === donatingCharacter.character_uuid) /*oneself cannot be the target*/
                return;
            else if (receivingCharacter.company_uuid !== donatingCharacter.character_uuid)
                drawDonatingCompanyId = donatingCharacter.character_uuid;

            const draggableType = elemDraggable.getAttribute("data-card-type");
            if (draggableType === "resource" || draggableType === "hazard" || (elemDraggable.getAttribute("data-card-type") === "character" && elemDraggable.getAttribute("data-allow-follower") === "true"))
            {
                const pThis = this;
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, true);
            }
            else
                return;
        }

        if (drawReceivingCompanyId !== "")
            MeccgApi.send("/game/draw/company", drawReceivingCompanyId);
        
        if (drawDonatingCompanyId !== "")
            MeccgApi.send("/game/draw/company", drawDonatingCompanyId);
    },
    
    initOnCardCharacter : function(cardDiv:any)
    {
        HandCardsDraggable.initDraggableCard(cardDiv);
    },

    /**
     * Init a jquery draggable event
     * @param {jQuery} jCardContainer
     * @return {void}
     */
    initDraggableCard : function(pCardContainer:any)
    {
        const sAllow = pCardContainer === null || !pCardContainer.hasAttribute("draggable") ? "false" : pCardContainer.getAttribute("draggable");
        if (sAllow !== "true")
            return;

        const config:any = {
            cursor: 'move',
            opacity: 1,
            revertDuration : 50,
            
            start: function() 
            {
                CreateHandCardsDraggableUtils.initTargets((this as any).getAttribute("data-card-type"));
                DraggableEventEvaluate.onStart(this as any);
            },
            
            stop: function(event:any, ui:any) 
            {
                CreateHandCardsDraggableUtils.clearTargets((this as any).getAttribute("data-card-type"));

                const elem = ui.helper.length > 0 ? ui.helper[0] : null;
                if (elem !== null && elem.classList.contains("ui-draggable-on-droppable"))
                    elem.classList.remove("ui-draggable-on-droppable");

                if ((this as any).hasAttribute("style"))
                    (this as any).removeAttribute("style");

                const ev = DraggableEventEvaluate.getEvent();
                if (ev && elem)
                    ev.processEvent(elem, ui);
            },

            revert: function()
            {
                const hasEvent = DraggableEventEvaluate.evaluate((this as any).get(0));
                return !hasEvent;
            }
        }

        if (pCardContainer.getAttribute("data-card-type") === "character" && pCardContainer.getAttribute("data-location") !== "hand" && pCardContainer.getAttribute("data-allow-follower") !== "false")
        {
            const thisid = pCardContainer.getAttribute("id");
            const uuid = pCardContainer.getAttribute("data-uuid");
            
            pCardContainer = pCardContainer.parentElement;
            pCardContainer.setAttribute("data-location", "inplay");
            pCardContainer.setAttribute("data-card-type", "character");
            pCardContainer.setAttribute("data-uuid", uuid);
            
            config.handle = "#" + thisid;
        }
        
        jQuery(pCardContainer).draggable(config);
    },
    
    /**
     * Setup drag event for resource card in play
     * @param {Object} jCardContainer Card Container of card in play
     * @returns {void}
     */
    initOnCardResource: function (pCardContainer:any)
    {
        HandCardsDraggable.initDraggableCard(pCardContainer);
    },

    /**
     * Add a card to the staging area
     * 
     * @param {String} cardId Card Container Id
     * @param {String} target
     * @param {String} type
     * @returns {void}
     */
    initCardInStagingArea: function (cardId:string, _target:string, type:string)
    {
        if (cardId === "" || (type !== "resource" && type !== "hazard"))
            return;

        const elemDiv = document.getElementById(cardId);
        if (elemDiv === null)
        {
            console.warn("Cannot find card container " + cardId);
            return;
        }
        
        elemDiv.setAttribute("data-location", "stagingarea");
        HandCardsDraggable.initDraggableCard(elemDiv);
    },

    /**
     * visualize drag area for a new company
     * @param {String} idPrefix
     * @param {String} uuid
     * @returns {void}
     */
    initDragEventsForHandCard: function (idPrefix:string, uuid:string)
    {
        const pCardContainer = document.getElementById(idPrefix + uuid);
        if (pCardContainer === null)
            return;

        pCardContainer.setAttribute("data-location", "hand");
        HandCardsDraggable.initDraggableCard(pCardContainer);
    },     
    
    /**
     * Add a resource to a given character
     * 
     * @param {String} uuid Card UUID
     * @param {Object} elementCharacterCard
     * @param {Boolean} bFromHand From hand (true) or staging area (false)
     * @returns {undefined|Boolean}
     */
    onAddResourceToCharacter : function (uuid:string, elementCharacterCard:any, bFromHand:boolean)
    {
        this.onAddHazardsToCharacter(uuid, elementCharacterCard, bFromHand);
    },

    /**
     * Add a hazard to a given character
     * 
     * @param {String} uuid Card UUID
     * @param {Object} elem
     * @param {Boolean} bFromHand From hand (true) or staging area (false)
     * @returns {undefined|Boolean}
     */
    onAddHazardsToCharacter: function (uuid:string, elem:any, bFromHand:boolean)
    {
        if (uuid === "")
            return false;

        const pHost = DomUtils.findParentByClass(elem, "company-character");
        const company = DomUtils.findParentByClass(pHost, "company");
        const characterUuid = pHost === null ? null : pHost.getAttribute("data-character-uuid");
        const companyId = company === null ? null : company.getAttribute("data-company-id");

        if (characterUuid !== null && companyId !== null)
            MeccgApi.send("/game/character/host-card", {uuid: uuid, companyId: companyId, characterUuid: characterUuid, fromHand: bFromHand });
    },

    /**
     * Add a resource to a given character
     * 
     * @param {String} uuid Card UUID
     * @param {Object} elem
     * @param {Boolean} bFromHand From hand (true) or staging area (false)
     * @returns {undefined|Boolean}
     */
    onAddResourcesToCharacter: function (uuid:string, elem:any, bFromHand:boolean)
    {
        HandCardsDraggable.onAddHazardsToCharacter(uuid, elem, bFromHand);
    },

    /**
     * Create a new company 
     * @param {String} _uuid Character card uuid
     * @param {String} source "hand" or "inplay"
     * @returns {void}
     */
    onCreateNewCompany: function (_uuid:string, source:string)
    {
        if (_uuid !== "" && source !== "")
            MeccgApi.send("/game/company/create", {source: source, uuid: _uuid});
    },
    
    /**
     * Show a notice once if the deck close to exhaust
     * 
     * @param {Number} countPlaydeck 
     * @returns void
     */
    checkReDeckNoteForPlayer: function(countPlaydeck:any)
    {

        if (HandCardsDraggable._warnHasShown || countPlaydeck === undefined || countPlaydeck === null)
            return;

        try
        {
            const val = parseInt(countPlaydeck);
            if (val > 0 && val <= HandCardsDraggable._warnReDeckAt)
            {
                HandCardsDraggable._warnHasShown = true;
                new ReDeckInfoNotification().show();
            }
        }
        catch (err)
        {
            console.warn(err);
        }
    },


    onPlayOnCompany: function(uuid:string, source:string, companyUuid:string)
    {
        MeccgApi.send("/game/character/join/company", { uuid:uuid, source: source, companyId: companyUuid });
    },
    
    droppableAccept : function()
    {
        return true;
    },
    
    droppableAcceptResrouceAndHazards : function(elem:any)
    {
        const sType = elem.attr("data-card-type");
        if (sType === "resource" || sType === "hazard" || sType === "site")
            return true;
        else
            return sType === "character" && elem.attr("data-allow-follower") === "false"
    },
    
    setupCardPreviewElement : function(id:string)
    {
        const elem = document.getElementById(id);
        if (elem !== null)
        {
            elem.onmouseover = CardPreview._doHoverOnGuard;        
            elem.onmouseout = CardPreview.hideAll;
        }
    },

    setupCardPreviewElements : function()
    {
        let list = ["icon-preview-shared-scored",
                    "icon-preview-shared-outofplay",
                    "icon-preview-scored",
                    "icon-preview-discard"];

        for (let id of list)
            this.setupCardPreviewElement(id);
    },

    insertToogleHandCards: function()
    {
        const elem = document.getElementById("playercard-hand-content");
        if (elem === null)
            return;

        const div = document.createElement("div");
        div.setAttribute("class", "ingame-icon-openclose ingame-icon-openclose-hand");
        div.onclick = this.onToogleHandCards;
        elem.append(div);

        // toggle by default
        this.onToogleHandCards();
    },

    onToogleHandCards: function()
    {
        const elem = document.getElementById("playercard-hand-content");
        if (elem === null)
            return;

        if (elem.classList.contains("playercard-hand-content-small"))
            elem.classList.remove("playercard-hand-content-small");
        else
            elem.classList.add("playercard-hand-content-small");
    },

    /**
     * @deprecated
     */
    onDroppableHighPrioOver : function(  ) 
    {
    },

    /**
     * @deprecated
     */
    onDroppableHighPrioOut : function(  ) 
    {
    }
};

export function createHandCardsDraggable()
{
    ResolveHandSizeContainer.createHandContainer();

    document.body.setAttribute("data-class", document.body.getAttribute("class") ?? "");


    if (document.body.getAttribute("data-is-watcher") !== "true")
    {
        const bar = document.getElementById("progression-phase-box");
        if (bar !== null)
        {
            const a = document.createElement("a");
            a.setAttribute("class", "icon taskbar-pin fa fa-thumb-tack");
            a.onclick = () => {
                if (document.body.classList.contains("taskbar-pin-pin"))
                    document.body.classList.remove("taskbar-pin-pin");
                else
                    document.body.classList.add("taskbar-pin-pin");

                return false;
            }

            bar.prepend(a);

            const pScore = document.querySelector(".taskbar-score")
            if (pScore)
                pScore.classList.add("hidden");
            
            const pHandDiv = document.getElementById("playercard_hand");
            if (pHandDiv !== null)
            {
                const pMove = document.createElement("div");
                pMove.setAttribute("class", "move-hand-icon");
                pMove.innerHTML = `<i class="fa fa-arrows "></i>`
                pMove.setAttribute("id", "move-hand-icon");
                pMove.setAttribute("title", Dictionary.get("handcards_movecontainer", "Click to drag anywhere.\nRIGHT click to restore to original position"));
                pMove.oncontextmenu = () => {
                    const elem = document.getElementById("playercard_hand");
                    if (elem && elem.hasAttribute("style"))
                        elem.removeAttribute("style");
                    return false;
                }
                
                document.querySelector(".card-draw")!.prepend(pMove);

                jQuery(pHandDiv).draggable(
                { 
                    start: function () { 
                        jQuery(this).css("bottom", "auto"); 
                    },
                    snap: true, 
                    snapMode: "outer", 
                    handle: "#move-hand-icon", 
                    cursor: "move" 
                });
            }
        }
    }

    HandCardsDraggable.insertToogleHandCards();

    HandCardsDraggable.setupCardPreviewElements();
    return HandCardsDraggable;
}

export { HandCardsDraggable };