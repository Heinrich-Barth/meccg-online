
class CreateHandCardsDraggableUtils {

    static #CardPreview = null;
    static #locationMessageId = 0

    static setCardPreview(pCardPreview)
    {
        CreateHandCardsDraggableUtils.#CardPreview = pCardPreview;
    }

    static clearTargets(sDraggableCardType)
    {
        document.body.classList.remove("on-drag-event-generic");
        
        if (sDraggableCardType !== null)
            document.body.classList.remove("on-drag-event-" + sDraggableCardType);

        CreateHandCardsDraggableUtils.#CardPreview.hideAll();
    }

    static initTargets(sDraggableCardType)
    {
        if (sDraggableCardType !== null)
            document.body.classList.add("on-drag-event-" + sDraggableCardType);

        document.body.classList.add("on-drag-event-generic");
        CreateHandCardsDraggableUtils.#CardPreview.hideAll();
    }
    
    static removeDraggableInContainer(jElem)
    {
        jElem.find(".ui-draggable").each(function()
        {
            CreateHandCardsDraggableUtils.removeElementDraggable(jQuery(this));
        });
        
        jElem.find(".ui-droppable").each(function()
        {
            CreateHandCardsDraggableUtils.#removeElementDroppable(jQuery(this));
        });
        
        DomUtils.removeNode(jElem.get(0));
    }
    
    static #removeElementDroppable(jElem)
    {
        try
        {
            if (jElem !== null && jElem.hasClass("ui-droppable"))
            {
                jElem.removeClass('ui-droppable');
                jElem.droppable('destroy');
            }
        }
        catch(e)
        {
            MeccgUtils.logError(e);
        }
    }

    static removeElementDraggable(jElem)
    {
        CreateHandCardsDraggableUtils.#removeElementDroppable(jElem);
    }

    /**
     * 
     * @param {jQuery} jElem
     * @return {undefined}
     */
    static removeDraggable(jElem)
    {   
        if (jElem !== null && jElem !== undefined)
        {
            CreateHandCardsDraggableUtils.removeElementDraggable(jElem);
            CreateHandCardsDraggableUtils.#removeElementDroppable(jElem);
            DomUtils.removeNode(jElem.get(0));
        }
    }

    static removeDraggableDomElement(elem)
    {
        if (elem !== null)
            CreateHandCardsDraggableUtils.removeDraggable(jQuery(elem));       
    }

    static requireMessageId()
    {
        return (++CreateHandCardsDraggableUtils.#locationMessageId);
    }
}

class DropableAreas {

    static getCompanyAreaPlayerAddNew()
    {
        return DropableAreas.get("create_new_company");
    }
    
    static get(sId)
    {
        return document.getElementById(sId); 
    }

    static discardpile() 
    { 
        return DropableAreas.get("icon_bar_discardpile"); 
    }
    
    static sideboard() 
    { 
        return DropableAreas.get("icon_bar_sideboard"); 
    }
    
    static playdeck() 
    { 
        return DropableAreas.get("icon_bar_playdeck"); 
    }
    
    static hand() 
    { 
        return DropableAreas.get("playercard_hand_droppable"); 
    }

    static handContent()
    {
        return DropableAreas.get("playercard-hand-content");
    }
   
    static victory() 
    { 
        return DropableAreas.get("shared_victories"); 
    }

    static stagagingArea() 
    { 
        return DropableAreas.get("staging_area_drop"); 
    }

    static outOfPlay()
    {
        return DropableAreas.get("shared_outofplay");
    }

}


const DropFunctions = {

    MeccgApi : null,

    /**
     * Check if the given character is the companies host. If so, it will not have a next sibling 
     * (last one in the element container)
     * 
     * @param {jQuery} ui 
     * @returns boolean
     */
    characterIsHost : function(ui)
    {
        const divCharacter = ui.draggable.get(0);
        return divCharacter.nextElementSibling === null || divCharacter.nextElementSibling === undefined;
    },

    removeDraggable(ui)
    {
        if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
        else if (!DropFunctions.characterIsHost(ui)) /** a character can be added as a ressource as well. In that case, it has to be handled as one */
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable); 
        else
            CreateHandCardsDraggableUtils.removeDraggableInContainer(ui.draggable.closest(".company-character"));
    },

    setApi:function(pMeccgApi)
    {
        this.MeccgApi = pMeccgApi;
    },

    getApi : function()
    {
        return DropFunctions.MeccgApi;
    },

    /**
     * Drop card on discard pile
     */
    dropOnDiscard : function( _event, ui ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");
        
        DropFunctions.removeDraggable(ui);
        
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "discardpile", source: src, drawTop : false});

        return false;
    },
    
    dropOnVicotry : function( _event, ui ) 
    {
        /** it is OK to use jQuery object ui->raggable here */
        const elem = ui.draggable;
        const uuid = elem.attr("data-uuid");
        const code = elem.attr("data-card-code");
        
        /** remove from screen*/
        CreateHandCardsDraggableUtils.removeDraggable(elem);
        
        DropFunctions.getApi().send("/game/card/store", { uuid: uuid });

        if (typeof code === "string" && code !== "")
            document.body.dispatchEvent(new CustomEvent("meccg-score-card", { "detail": code }));
            
        return false;
    },

    dropOnSideboard : function( _event, ui ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");

        DropFunctions.removeDraggable(ui);
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "sideboard", source: src, drawTop : false});
        return false;
    },
    
    dropOnPlaydeck : function( _event, ui ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");
        
        if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
        else
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable.closest(".company-character"));
        
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "playdeck", source: src, drawTop : false});
        return false;
    },
    
    dropOnHand : function( _event, ui ) 
    {
        if (ui.draggable.attr("data-location") !== "hand")
        {
            const uuid = ui.draggable.attr("data-uuid");
            const src = ui.draggable.attr("data-location");

            if (ui.draggable.attr("data-card-type") !== "character")
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            else
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable.closest(".company-character"));
            
            DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "hand", source: src, drawTop : true});
        }
        
        return false;
    },
    
    dropOnOutOfPlay : function( _event, ui ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");

        DropFunctions.removeDraggable(ui);
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "outofplay", source: src, drawTop : false});
        return false;
    },

    dropOnMobileActionAreaLeftClick : function( _event, ui ) 
    {
        const elem = ui.draggable.get();
        const img = elem?.length === 0 ? null : elem[0].querySelector("img");
        if (img !== null)
            img.dispatchEvent(new Event("click"));

        return false;
    },

    dropOnMobileActionAreaLeftClickRight : function( _event, ui ) 
    {
        const elem = ui.draggable.get();
        const img = elem?.length === 0 ? null : elem[0].querySelector("img");
        if (img === null)
            return false;

        const ev3 = new MouseEvent("contextmenu", {
            bubbles: false,
            cancelable: true,
            view: window,
            button: 2,
            buttons: 0,
            clientX: 0,
            clientY: 0
        });

        img.dispatchEvent(ev3);

        return false;
    },
    
    dropOnAddNew : function( _event, ui ) 
    {
        if (ui.draggable.attr("data-card-type") !== "site")
        {
            const uuid = ui.draggable.attr("data-uuid");
            const source = ui.draggable.attr("data-location");
            
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            HandCardsDraggable.onCreateNewCompany(uuid, source);
        }
        else 
        {
            const code = ui.draggable.attr("data-card-code");
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            DropFunctions.onDropSiteOnNewCompany(code);
        }

        return false;
    },

    isPrioElement: function(ui)
    {
        return ui?.helper?.attr("data-prio") === "true";
    },
    
    dropOnAddCompanyCharacter :  function( _event, ui, companyUuid ) 
    {
        if (DropFunctions.isPrioElement(ui))
            return false;

        const pCard = ui.draggable[0];
        const type = pCard.getAttribute("data-card-type");
        if (type === "character" || type === "resource")
        {
            const source = pCard.getAttribute("data-location");
            const uuid = pCard.getAttribute("data-uuid");
            if (source === "hand")
                DomUtils.removeNode(pCard);
    
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);

            if (type === "character")
                HandCardsDraggable.onJoinCompany(uuid, source, companyUuid);
            else
                HandCardsDraggable.onPlayOnCompany(uuid, companyUuid);

            DropFunctions.getApi().send("/game/draw/company", companyUuid);
        }
        else if (type === "site")
        {
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            DropFunctions.onDropSiteOnCharacter(pCard.getAttribute("data-code"));
        }

        return false;
    },

    onDropSiteOnNewCompany(code)
    {
        DropFunctions.onDropSiteOnCharacter(code, "", "");
    },

    onDropSiteOnCharacter(code, targetCharacter_uuid, targetCompany_uuid)
    {
        HandCardsDraggable.getApi().send("/game/card/import", {code : code, type: "site", location: "company", targetCompany: targetCompany_uuid, targetCharacter: targetCharacter_uuid  });
    }
};


const HandCardsDraggable = {

    _locationMessageId : 0,

    MeccgApi : null,

    _warnReDeckAt : 5,
    _warnHasShown : false,

    setApi : function(pApi)
    {
        this.MeccgApi = pApi;
    },

    getApi : function()
    {
        return HandCardsDraggable.MeccgApi;
    },

    /**
     * Get the company path. This will fail for onguard cards, but it is ok, because it will simply return an empty data
     * object
     * 
     * @param {JQuery} jCardContainer
     * @returns {createHandCardsDraggable.HandCardsDraggable.getCompanyPath.handcards-draggableAnonym$0}
     */
    getCompanyPath : function(pCardContainer)
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

    onLocationSelectClick : function(sCode, isSiteRevealed, companyUuid, regionMap)
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
    
    onLocationRevealClick : function(elem, companyUuid)
    {
        const sites = DomUtils.findParentByClass(elem, "company-site-list");
        if (sites === null)
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("handcards_404sites", "Cannot find companies' sites.") }));
        }
        else if (sites.querySelector(".site-target img") !== null)
        {
            HandCardsDraggable.getApi().send("/game/company/location/reveal", {companyUuid: companyUuid});
            HandCardsDraggable.getApi().send("/game/company/markcurrently", {uuid: companyUuid});
        }
        else if (sites.querySelector(".site-current img") !== null)
        {
            HandCardsDraggable.getApi().send("/game/company/markcurrently", {uuid: companyUuid});
        }
        else
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("handcards_movementfirst", "Please organize movement first.") }));
    },

    onCompanyMovementSelectClick: function(e)
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

    onCompanySelectMoveementUDClick:function(e)
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

    onCompanySelectMovementRelvealClick:function(e)
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
    initOnCompany : function(jCompany)
    {
        if (jCompany === null)
            return;

        const companyUuid = jCompany.getAttribute("data-company-id");
        
        ArrayList(jCompany).find(".company-characters-add").each(function(e)
        {
            jQuery(e).droppable(
            {
                classes: HandCardsDraggable.droppableParams,
                accept: () => true,
                drop: (event, ui) => DropFunctions.dropOnAddCompanyCharacter(event, ui, companyUuid),
                over: ( event, ui ) => ui.draggable[0].classList.add("ui-draggable-on-droppable"),
                out: ( event, ui ) => ui.draggable[0].classList.remove("ui-draggable-on-droppable")
            });
        });
        
        ArrayList(jCompany).find(".location-select").each(function (_elem) 
        {
            _elem.setAttribute("data-company-uuid", companyUuid);
            _elem.onclick = HandCardsDraggable.onCompanyMovementSelectClick;
        });
        
        ArrayList(jCompany).find(".location-select-ud").each(function (_elem) 
        {
            _elem.setAttribute("data-company-uuid", companyUuid);
            _elem.onclick = HandCardsDraggable.onCompanySelectMoveementUDClick;
        });

        ArrayList(jCompany).find(".location-reveal").each(function(_elem) 
        {
            _elem.setAttribute("data-company-uuid", companyUuid);
            _elem.onclick = HandCardsDraggable.onCompanySelectMovementRelvealClick;
        });
    },

    triggerMovementHazardClick : function()
    {
        const pContainer = document.getElementById("playercard_hand");
        const pLink = pContainer === null ? null : pContainer.querySelector('a[data-phase="movement"]');
        if (pLink !== null && !pLink.classList.contains("act"))
            pLink.click();
    },
    
    getStartingLocation : function(pCompany)
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

    isSiteRevealed : function(pDiv)
    {
        if (pDiv === null)
            return false;

        const img = pDiv.querySelector("img");
        return img !== null && "/data/backside-region" !== img.getAttribute("src");
    },

    getDonatingCharacter : function(source, elemDraggable)
    {
        if (source === "hand")
            return { character_uuid : elemDraggable.getAttribute("data-uuid"), company_uuid : "" };
        else
            return HandCardsDraggable.getCompanyPath(elemDraggable);
    },

    getDonatingCompanyUuid : function(donatingCharacter, receivingCharacter)
    {
        if (donatingCharacter.company_uuid !== receivingCharacter.company_uuid)
            return donatingCharacter.company_uuid;
        else
            return "";
    },

    findFirstCharacterDiv:function(elem)
    {
        return elem === null ? null : elem.querySelector('div[data-card-type="character"]');
    },

    onCardCharacterHostOnDrop : function(_event, ui)
    {
        if (DropFunctions.isPrioElement(ui))
            return false;

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
            HandCardsDraggable.getApi().send("/game/character/join/character", params, true);
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
            HandCardsDraggable.getApi().send("/game/draw/company", redrawReceivingCompanyId);
        
        if (redrawDonatingCompanyId !== "")
            HandCardsDraggable.getApi().send("/game/draw/company", redrawDonatingCompanyId);
    },

    characterIsHostingCharacter : function(cardDiv)
    {
        return this.getCompanyPath(cardDiv).is_host;
    },

    onCardCharacterFollowerOnDrop : function(_event, ui ) 
    {
        if (DropFunctions.isPrioElement(ui))
            return false;

        const elemDraggable = ui.draggable[0];
        const source = elemDraggable.getAttribute("data-location");
        const receivingCharacter = HandCardsDraggable.getCompanyPath(this);
        receivingCharacter.character_uuid = this.getAttribute("data-uuid");
        
        let drawReceivingCompanyId = receivingCharacter.company_uuid;
        let drawDonatingCompanyId = "";
        
        if (elemDraggable.getAttribute("data-card-type") === "character")
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
            if (draggableType === "resource")
            {
                const pThis = this;
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                HandCardsDraggable.onAddResourceToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, false);
            }
            else if (draggableType === "hazard")
            {
                const pThis = this;
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
                HandCardsDraggable.onAddHazardsToCharacter(elemDraggable.getAttribute("data-uuid"), pThis, true);
            }
            else
                return;
        }

        if (drawReceivingCompanyId !== "")
            HandCardsDraggable.getApi().send("/game/draw/company", drawReceivingCompanyId);
        
        if (drawDonatingCompanyId !== "")
            HandCardsDraggable.getApi().send("/game/draw/company", drawDonatingCompanyId);
    },
    
    initOnCardCharacter : function(cardDiv)
    {
        const isHost = this.characterIsHostingCharacter(cardDiv);
        if (isHost) /* if this character is a host, he/she may accept characters under direct influence */
        {
            jQuery(cardDiv.parentNode).droppable(
            {
                tolerance: "pointer",
                classes: HandCardsDraggable.droppableParams,
                accept: () => true,
                drop: HandCardsDraggable.onCardCharacterHostOnDrop,
                over: ( event, ui ) => ui.draggable[0].classList.add("ui-draggable-on-droppable"),
                out: ( event, ui ) => ui.draggable[0].classList.remove("ui-draggable-on-droppable")
            });
        }
        else /* influenced character */
        {
            jQuery(cardDiv.parentNode).droppable(
            {
                tolerance: "pointer",
                classes: HandCardsDraggable.droppableParams,
                accept: HandCardsDraggable.droppableAcceptResrouceAndHazards,
                drop: HandCardsDraggable.onCardCharacterFollowerOnDrop,
                over: ( event, ui ) => ui.draggable[0].classList.add("ui-draggable-on-droppable"),
                out: ( event, ui ) => ui.draggable[0].classList.remove("ui-draggable-on-droppable")
            });
        }

        HandCardsDraggable.initDraggableCard(cardDiv);
    },
    
    /**
     * Init a jquery draggable event
     * @param {jQuery} jCardContainer
     * @return {void}
     */
    initDraggableCard : function(pCardContainer)
    {
        const sAllow = pCardContainer === null || !pCardContainer.hasAttribute("draggable") ? "false" : pCardContainer.getAttribute("draggable");
        if (sAllow !== "true")
            return;

        const config = {
            cursor: 'move',
            revert: true,
            opacity: 1,
            revertDuration : 50,
            
            start: function() 
            {
                CreateHandCardsDraggableUtils.initTargets(this.getAttribute("data-card-type"));
            },
            
            stop: function(event, ui) 
            {
                CreateHandCardsDraggableUtils.clearTargets(this.getAttribute("data-card-type"));

                if (this.hasAttribute("style"))
                    this.removeAttribute("style");

                const elem = ui.helper.length > 0 ? ui.helper[0] : null;
                if (elem !== null && elem.classList.contains("ui-draggable-on-droppable"))
                    elem.classList.remove("ui-draggable-on-droppable");
            }
        }

        if (pCardContainer.getAttribute("data-card-type") === "character" && pCardContainer.getAttribute("data-location") !== "hand")
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
    initOnCardResource: function (pCardContainer)
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
    initCardInStagingArea: function (cardId, _target, type)
    {
        if (cardId === "" || (type !== "resource" && type !== "hazard"))
            return;

        const elemDiv = document.getElementById(cardId);
        if (elemDiv === null)
        {
            MeccgUtils.logWarning("Cannot find card container " + cardId);
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
    initDragEventsForHandCard: function (idPrefix, uuid)
    {
        const pCardContainer = document.getElementById(idPrefix + uuid);
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
    onAddResourceToCharacter : function (uuid, elementCharacterCard, bFromHand)
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
    onAddHazardsToCharacter: function (uuid, elem, bFromHand)
    {
        if (uuid === "")
            return false;

        const pHost = DomUtils.findParentByClass(elem, "company-character");
        const company = DomUtils.findParentByClass(pHost, "company");
        const characterUuid = pHost === null ? null : pHost.getAttribute("data-character-uuid");
        const companyId = company === null ? null : company.getAttribute("data-company-id");

        if (characterUuid !== null && companyId !== null)
            HandCardsDraggable.getApi().send("/game/character/host-card", {uuid: uuid, companyId: companyId, characterUuid: characterUuid, fromHand: bFromHand }, true);
    },

    /**
     * Add a resource to a given character
     * 
     * @param {String} uuid Card UUID
     * @param {Object} elem
     * @param {Boolean} bFromHand From hand (true) or staging area (false)
     * @returns {undefined|Boolean}
     */
    onAddResourcesToCharacter: function (uuid, elem, bFromHand)
    {
        HandCardsDraggable.onAddHazardsToCharacter(uuid, elem, bFromHand);
    },

    /**
     * Create a new company 
     * @param {String} _uuid Character card uuid
     * @param {String} source "hand" or "inplay"
     * @returns {void}
     */
    onCreateNewCompany: function (_uuid, source)
    {
        if (_uuid !== "" && source !== "")
            HandCardsDraggable.getApi().send("/game/company/create", {source: source, uuid: _uuid});
    },
    
    /**
     * Show a notice once if the deck close to exhaust
     * 
     * @param {Number} countPlaydeck 
     * @returns void
     */
    checkReDeckNoteForPlayer: function(countPlaydeck)
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

    /**
     * Join a company from hand
     * @param {String} _joiningCharacterUuid
     * @param {String} source
     * @param {String} targetCompanyId
     * @returns {Boolean}
     */
    onJoinCompany: function (_joiningCharacterUuid, source, targetCompanyId)
    {
        if (_joiningCharacterUuid === "")
            MeccgUtils.logWarning("no uuid");
        else if (targetCompanyId === "" || typeof targetCompanyId === "undefined")
            MeccgUtils.logWarning("no target company found ");
        else
            HandCardsDraggable.getApi().send("/game/character/join/company", {source: source, uuid: _joiningCharacterUuid, companyId: targetCompanyId});
    },

    onPlayOnCompany: function(uuid, companyUuid)
    {
        MeccgApi.send("/game/company/location/attach", {uuid: uuid, companyUuid: companyUuid, reveal: true});
    },
    
    droppableParams : {
        "ui-droppable-hover": "on-drag-over",
        addClasses: false
    },
    
    droppableAccept : function()
    {
        return true;
    },
    
    droppableAcceptResrouceAndHazards : function(elem)
    {
        const sType = elem.attr("data-card-type");
        return sType === "resource" || sType === "hazard" || sType === "site";
    },
    
    setupCardPreviewElement : function(id)
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
        if (elem.classList.contains("playercard-hand-content-small"))
            elem.classList.remove("playercard-hand-content-small");
        else
            elem.classList.add("playercard-hand-content-small");
    },

    onDroppableHighPrioOver : function( _drop_event, drop_ui ) 
    {
        drop_ui.helper.attr("data-prio", 'true');
        if (drop_ui.draggable?.length > 0)
            drop_ui.draggable[0].classList.add("ui-draggable-on-droppable");
    },

    onDroppableHighPrioOut : function( _drop_event, drop_ui ) 
    {
        drop_ui.helper.attr("data-prio", 'false');
        if (drop_ui.draggable?.length > 0)
            drop_ui.draggable[0].classList.remove("ui-draggable-on-droppable");
    }
};

function createHandCardsDraggable(pCardPreview, pMeccgApi)
{
    CreateHandCardsDraggableUtils.setCardPreview(pCardPreview);
    DropFunctions.setApi(pMeccgApi);
    HandCardsDraggable.setApi(pMeccgApi);
    ResolveHandSizeContainer.createHandContainer();

    document.body.setAttribute("data-class", document.body.getAttribute("class"));

    jQuery(DropableAreas.discardpile()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        drop: DropFunctions.dropOnDiscard.bind(DropFunctions)
    });
    
    jQuery(DropableAreas.victory()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        drop: DropFunctions.dropOnVicotry
    });

    jQuery(DropableAreas.sideboard()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        drop: DropFunctions.dropOnSideboard
    });

    jQuery(DropableAreas.playdeck()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        drop: DropFunctions.dropOnPlaydeck
    });
    
    jQuery(DropableAreas.hand()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        drop: DropFunctions.dropOnHand
    });

    jQuery(DropableAreas.handContent()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        accept: HandCardsDraggable.droppableAccept,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        drop: DropFunctions.dropOnHand
    });
    
    jQuery(DropableAreas.getCompanyAreaPlayerAddNew()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        drop: DropFunctions.dropOnAddNew,
        accept: () => true,
        over: ( event, ui ) => ui.draggable[0].classList.add("ui-draggable-on-droppable"),
        out: ( event, ui ) => ui.draggable[0].classList.remove("ui-draggable-on-droppable")
    });

    jQuery(DropableAreas.outOfPlay()).droppable(
    {
        tolerance: "pointer",
        classes: HandCardsDraggable.droppableParams,
        drop: DropFunctions.dropOnOutOfPlay,
        over: HandCardsDraggable.onDroppableHighPrioOver,
        out: HandCardsDraggable.onDroppableHighPrioOut,  
        accept: function() {
            return true;
        }
    });

    if (document.body.getAttribute("data-is-watcher") !== "true")
    {
        let elem = document.createElement("div");
        elem.setAttribute("id", "mobile-action-area-left");
        elem.setAttribute("class", "mobile-action-area mobile-action-area-leftclick");
        document.body.appendChild(elem);

        let icon = document.createElement("i");
        icon.setAttribute("class", "fa fa-repeat");
        elem.appendChild(icon);

        jQuery(document.getElementById("mobile-action-area-left")).droppable({
            tolerance: "pointer",
            classes: HandCardsDraggable.droppableParams,
            drop: DropFunctions.dropOnMobileActionAreaLeftClick,
            accept: () => true,
            over: ( event, ui ) => ui.draggable[0].classList.add("ui-draggable-on-droppable"),
            out: ( event, ui ) => ui.draggable[0].classList.remove("ui-draggable-on-droppable")
        });

        elem = document.createElement("div");
        elem.setAttribute("id", "mobile-action-area-right");
        elem.setAttribute("class", "mobile-action-area mobile-action-area-rightclick");
        document.body.appendChild(elem);

        icon = document.createElement("i");
        icon.setAttribute("class", "fa fa-bars");
        elem.appendChild(icon);

        jQuery(document.getElementById("mobile-action-area-right")).droppable({
            tolerance: "pointer",
            classes: HandCardsDraggable.droppableParams,
            drop: DropFunctions.dropOnMobileActionAreaLeftClickRight,
            accept: () => true,
            over: ( event, ui ) => ui.draggable[0].classList.add("ui-draggable-on-droppable"),
            out: ( event, ui ) => ui.draggable[0].classList.remove("ui-draggable-on-droppable")
        });

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
                    if (elem.hasAttribute("style"))
                        elem.removeAttribute("style");
                    return false;
                }
                
                document.querySelector(".card-draw").prepend(pMove);

                jQuery(pHandDiv).draggable(
                { 
                    start: function (event, ui) { 
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
