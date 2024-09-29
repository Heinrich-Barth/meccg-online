import { HandCardsDraggable } from "../handcards-draggable";
import DomUtils from "../utils/libraries";
import MeccgApi from "../meccg-api";
import CreateHandCardsDraggableUtils from "../utils/CreateHandCardsDraggableUtils";

export const DropFunctions = {

    /**
     * Check if the given character is the companies host. If so, it will not have a next sibling 
     * (last one in the element container)
     * 
     * @param {jQuery} ui 
     * @returns boolean
     */
    characterIsHost : function(ui:any)
    {
        const divCharacter = ui.draggable.get(0);
        return divCharacter.nextElementSibling === null || divCharacter.nextElementSibling === undefined;
    },

    removeDraggable(ui:any)
    {
        if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
        else if (!DropFunctions.characterIsHost(ui)) /** a character can be added as a ressource as well. In that case, it has to be handled as one */
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable); 
        else
            CreateHandCardsDraggableUtils.removeDraggableInContainer(ui.draggable.closest(".company-character"));
    },

    /**
     * @deprecated
     */
    setApi:function()
    {
        // deprecated
    },

    getApi : function()
    {
        return MeccgApi;
    },

    /**
     * Drop card on discard pile
     */
    dropOnDiscard : function( _event:any, ui:any ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");
        
        DropFunctions.sliceResourceCharacter(ui);
        DropFunctions.removeDraggable(ui);
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "discardpile", source: src, drawTop : false});
        return false;
    },
    
    dropOnVicotry : function( _event:any, ui:any ) 
    {
        /** it is OK to use jQuery object ui->raggable here */
        const elem = ui.draggable;
        const uuid = elem.attr("data-uuid");
        const code = elem.attr("data-card-code");
        
        /** remove from screen*/
        DropFunctions.sliceResourceCharacter(ui);
        CreateHandCardsDraggableUtils.removeDraggable(elem);
        
        DropFunctions.getApi().send("/game/card/store", { uuid: uuid });

        if (typeof code === "string" && code !== "")
            document.body.dispatchEvent(new CustomEvent("meccg-score-card", { "detail": code }));
            
        return false;
    },

    dropOnSideboard : function( _event:any, ui:any ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");

        DropFunctions.sliceResourceCharacter(ui);
        DropFunctions.removeDraggable(ui);
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "sideboard", source: src, drawTop : false});
        return false;
    },
    
    dropOnPlaydeck : function( _event:any, ui:any ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");
        
        DropFunctions.sliceResourceCharacter(ui);

        if (ui.draggable.attr("data-location") === "hand" || ui.draggable.attr("data-card-type") !== "character")
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
        else
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable.closest(".company-character"));
        
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "playdeck", source: src, drawTop : false});
        return false;
    },
    
    dropOnHand : function( _event:any, ui:any ) 
    {
        if (ui.draggable.attr("data-location") === "hand")
            return false;

        DropFunctions.sliceResourceCharacter(ui);

        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");

        if (ui.draggable.attr("data-card-type") !== "character")
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
        else
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable.closest(".company-character"));
        
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "hand", source: src, drawTop : true});       
        return false;
    },

    sliceHostingCard: function(elem:any)
    {
        const type = elem.getAttribute("data-card-type");
        const location = elem.getAttribute("data-location");
        if (location !== "inplay" || typeof type !== "string" || type !== "character" || elem.getAttribute("data-allow-follower") === "true")
            return false;

        const uuid = elem.getAttribute("data-uuid");
        if (uuid)
        {
            DropFunctions.getApi().send("/game/character/slice-hosting-card", {uuid: uuid });
            return true;
        }

        return false;
    },

    sliceResourceCharacter: function(ui:any)
    {
        return DropFunctions.sliceHostingCard(ui.draggable);
    },
    
    dropOnOutOfPlay : function( _event:any, ui:any ) 
    {
        const uuid = ui.draggable.attr("data-uuid");
        const src = ui.draggable.attr("data-location");

        DropFunctions.sliceResourceCharacter(ui);
        DropFunctions.removeDraggable(ui);
        DropFunctions.getApi().send("/game/card/move", {uuid: uuid, target: "outofplay", source: src, drawTop : false});
        return false;
    },

    dropOnMobileActionAreaLeftClick : function( _event:any, ui:any ) 
    {
        const elem = ui.draggable.get();
        const img = elem?.length === 0 ? null : elem[0].querySelector("img");
        if (img !== null)
            img.dispatchEvent(new Event("click"));

        return false;
    },

    dropOnMobileActionAreaLeftClickRight : function( _event:any, ui:any ) 
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
    
    dropOnAddNew : function( _event:any, ui:any ) 
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
            DropFunctions.sliceResourceCharacter(ui);
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            DropFunctions.onDropSiteOnNewCompany(code);
        }

        return false;
    },

    isPrioElement: function(ui:any)
    {
        return ui?.helper?.attr("data-prio") === "true";
    },
    
    dropOnAddCompanyCharacter :  function( _event:any, ui:any, companyUuid:string ) 
    {
        if (DropFunctions.isPrioElement(ui))
            return false;

        DropFunctions.sliceResourceCharacter(ui);

        const pCard = ui.draggable[0];
        const type = pCard.getAttribute("data-card-type");
        if (type === "character" || type === "resource")
        {
            const source = pCard.getAttribute("data-location");
            const uuid = pCard.getAttribute("data-uuid");
            if (source === "hand")
                DomUtils.removeNode(pCard);
    
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);

            DropFunctions.onJoinCompany(uuid, source, companyUuid);

            DropFunctions.getApi().send("/game/draw/company", companyUuid);
        }
        else if (type === "site")
        {
            CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
            DropFunctions.onDropSiteOnCharacter(pCard.getAttribute("data-code"), "", "");
        }

        return false;
    },


    /**
     * Join a company from hand
     * @param {String} _joiningCharacterUuid
     * @param {String} source
     * @param {String} targetCompanyId
     * @returns {Boolean}
     */
    onJoinCompany: function (_joiningCharacterUuid:string, source:string, targetCompanyId:string)
    {
        if (_joiningCharacterUuid === "")
            console.warn("no uuid");
        else if (targetCompanyId === "" || typeof targetCompanyId === "undefined")
            console.warn("no target company found ");
        else
            MeccgApi.send("/game/character/join/company", {source: source, uuid: _joiningCharacterUuid, companyId: targetCompanyId});
    },

    onDropSiteOnNewCompany(code:string)
    {
        DropFunctions.onDropSiteOnCharacter(code, "", "");
    },

    onDropSiteOnCharacter(code:string, targetCharacter_uuid:string, targetCompany_uuid:string)
    {
        MeccgApi.send("/game/card/import", {code : code, type: "site", location: "company", targetCompany: targetCompany_uuid, targetCharacter: targetCharacter_uuid  });
    }
};