import DomUtils from "../utils/libraries";
import MeccgApi from "../meccg-api";
import CreateHandCardsDraggableUtils from "../utils/CreateHandCardsDraggableUtils";
import { DropFunctions } from "./DropFunctions";

interface Position {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

class DraggableEventEvaluatePosition {

    static get(elem:any):Position 
    {
        const p = DraggableEventEvaluatePosition.#getAbsoluteXYRec(elem);
        const rect = elem.getBoundingClientRect();

        return {
            left: p.x,
            top: p.y,
            right: p.x + rect.width,
            bottom: p.y + rect.height
        }
    }
    
    static #getAbsoluteXYRec(obj:any) 
    {
        const p = {
            x: obj.offsetLeft,
            y: obj.offsetTop
        };

        while (obj.offsetParent) 
        {
            p.x = p.x + obj.offsetParent.offsetLeft;
            p.y = p.y + obj.offsetParent.offsetTop;

            if (obj.nodeName.toUpperCase() == "BODY")
                break;
            
            obj = obj.offsetParent;
        }

        return p;
    }

    static isHit(elem:any, draggedPos:Position)
    {
        if (elem === null)
            return false;

        const pos = DraggableEventEvaluatePosition.get(elem);
        if (pos.right < draggedPos.left)
            return false;

        if (pos.left > draggedPos.right)
            return false;

        if (pos.top > draggedPos.bottom)
            return false;

        if (pos.bottom < draggedPos.top)
            return false;

        return true;
    }
}

class DropEvent {
    
    processEvent(elem:any, ui:any)
    {
        /** do something */
    }
}

class DropEventFixedContainer extends DropEvent {
    
    #target:string;

    constructor(target:string)
    {
        super();

        this.#target = target;
    }
    
    processEvent(elem:any, ui:any)
    {
        const uuid = elem.getAttribute("data-uuid");
        const src = elem.getAttribute("data-location");
        
        CreateHandCardsDraggableUtils.removeDraggable(ui.draggable);
        DropFunctions.sliceHostingCard(elem);
        MeccgApi.send("/game/card/move", { 
            uuid: uuid, 
            target: this.#target, 
            source: src, 
            drawTop : false
        });
    }
}

class DropEventCreateNewCompany extends DropEvent {
    
    /** used for instanceof */
    processEvent(elem:any, ui:any)
    {
        const uuid = elem.getAttribute("data-uuid");
        const source = elem.getAttribute("data-location");

        if (uuid && source)
        {
            if (source === "hand")
            {
                CreateHandCardsDraggableUtils.removeDraggable(ui.draggable)
                DomUtils.removeNode(elem);
            }

            MeccgApi.send("/game/company/create", {source: source, uuid: uuid});
        }
    }

}


class DraggableEventEvaluateBase {
    
    #result:any = null;

    reset()
    {
        this.#result = null;
    }

    getResult()
    {
       return this.#result; 
    }


    static TYPE_FIXED_DECK_PILE = "fixed_pile";

    setResult(res:any)
    {
        this.#result = res;
    }

}

class DraggableEventRegisteredContainer {

    #id;
    #name;

    constructor(id:string, name:string)
    {
        this.#id = id;
        this.#name = name;
    }

    getName()
    {
        return this.#name;
    }
    
    hit(draggedPos:Position)
    {
        const elem = document.getElementById(this.#id);
        return DraggableEventEvaluatePosition.isHit(elem, draggedPos);
    }
}

class DraggableEventEvaluateCompanies  {

    #id;

    constructor(id:string)
    {
        this.#id = id;
    }

    /**
     * Dropped on the area - create a new company
     */
    #dropOnArea()
    {
        return new DropEventCreateNewCompany();
    }

    evaluate(pos:Position)
    {
        const area = document.getElementById(this.#id);
        if (area === null)
            return null;

        const company = this.#getMatchingCompany(area, pos);
        if (company === null)
            return this.#dropOnArea();

        /**
         * wenn eine karte gehitted wird, dann
         * wird diese hier gehosted.
         * 
         * ansonsten wird 
         */
        return null;
    }

    #getMatchingCompany(area:any, pos:Position)
    {
        const list = area.getElementsByClassName("company");
        if (list === null || list.length === 0)
            return null;

        for (let company of list)
        {
            if (DraggableEventEvaluatePosition.isHit(company, pos))
                return company;
        }

        return null;
    }
}

export class DraggableEventEvaluate extends DraggableEventEvaluateBase {

    static #instance = new DraggableEventEvaluate();
    
    #containers = [
        new DraggableEventRegisteredContainer("icon_bar_discardpile", "discardpile"),
        new DraggableEventRegisteredContainer("icon_bar_sideboard", "sideboard"),
        new DraggableEventRegisteredContainer("icon_bar_playdeck", "playdeck"),
        new DraggableEventRegisteredContainer("playercard_hand", "hand"),
        new DraggableEventRegisteredContainer("shared_victories", "victory"),
        new DraggableEventRegisteredContainer("shared_outofplay", "outofplay")
    ];

    #companyOpponent = new DraggableEventEvaluateCompanies("opponent-companies");
    #companyPlayer = new DraggableEventEvaluateCompanies("player_companies");

    static onStart(draggedElement:any)
    {
        DraggableEventEvaluate.#instance.reset();
    }

    static getEvent()
    {
        return DraggableEventEvaluate.#instance.getResult(); 
    }

    static evaluate(draggedElement:any)
    {
        if (draggedElement)
            DraggableEventEvaluate.#instance.onEvaluate(draggedElement);
        
        return DraggableEventEvaluate.getEvent() !== null;
    }

    #evaluateContainers(pos:Position)
    {
        for (let container of this.#containers)
        {
            if (container.hit(pos))
            {
                const ev = new DropEventFixedContainer(container.getName());
                this.setResult(ev);
                return true;
            }
        }

        return false;
    }

    #evaluateAreaOpponent(pos:Position)
    {
        const res = this.#companyOpponent.evaluate(pos);
        return res !== null;
    }

    #evaluateAreaPlayer(pos:Position)
    {
        const res = this.#companyPlayer.evaluate(pos);
        if (res === null)
            return false;

        this.setResult(res);
        return true;
    }

    onEvaluate(draggedElement:any)
    {
        const pos = DraggableEventEvaluatePosition.get(draggedElement);
        if (this.#evaluateContainers(pos))
            return;

        if (this.#evaluateAreaPlayer(pos))
            return;

        this.#evaluateAreaOpponent(pos);
    }

}
