import CardPreview from "../card-preview";
import DomUtils from "./libraries";

declare const jQuery:any;

export default class CreateHandCardsDraggableUtils {

    static #locationMessageId = 0

    /**
     * @deprecated
     */
    static setCardPreview()
    {
    }

    static clearTargets(sDraggableCardType:string)
    {
        document.body.classList.remove("on-drag-event-generic");
        
        if (sDraggableCardType !== null)
            document.body.classList.remove("on-drag-event-" + sDraggableCardType);

        CardPreview.hideAll();
    }

    static initTargets(sDraggableCardType:string)
    {
        if (sDraggableCardType !== null)
            document.body.classList.add("on-drag-event-" + sDraggableCardType);

        document.body.classList.add("on-drag-event-generic");
        CardPreview.hideAll();
    }
    
    static removeDraggableInContainer(jElem:any)
    {
        /*
        jElem.find(".ui-draggable").each(function()
        {
            // tslint:disable-next-line
            const elem:any = this;
            CreateHandCardsDraggableUtils.removeElementDraggable(jQuery(this));
        });
        */
        
        DomUtils.removeNode(jElem.get(0));
    }
    
    /**
     * @deprecated
     */
    static #removeElementDroppable(jElem:any)
    {
        // deprecated
    }

    static removeElementDraggable(jElem:any)
    {
        CreateHandCardsDraggableUtils.#removeElementDroppable(jElem);
    }

    /**
     * 
     * @param {jQuery} jElem
     * @return {undefined}
     */
    static removeDraggable(jElem:any)
    {   
        if (jElem !== null && jElem !== undefined)
        {
            CreateHandCardsDraggableUtils.removeElementDraggable(jElem);
            DomUtils.removeNode(jElem.get(0));
        }
    }

    static removeDraggableDomElement(elem:any)
    {
        if (elem !== null)
            CreateHandCardsDraggableUtils.removeDraggable(jQuery(elem));       
    }

    static requireMessageId()
    {
        return (++CreateHandCardsDraggableUtils.#locationMessageId);
    }
}
