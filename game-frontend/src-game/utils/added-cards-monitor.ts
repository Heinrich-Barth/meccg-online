import { ArrayList } from "./libraries";

/**
 * Check for newly added cards to mark them
 * via CSS animation
 */
class CheckForCardsPlayed {

    vsBefore:any = [];
    vsAfter:any = [];
    cardIdPrefix:string;

    constructor(sCardIdPrefix:string) 
    { 
        this.cardIdPrefix = sCardIdPrefix;
    }

    /**
     * Get all image ids inside a given container
     * 
     * @param {Object} pContainer DOM 
     */
    getCards(pContainer:any)
    {
        return pContainer === null ? [] : this.getCardsFromList(pContainer.querySelectorAll("img"));
    }

    getCardsFromList(list:any)
    {
        const jList = [];

        for (let elem of list)
        {
            const sId = elem.getAttribute("data-uuid");
            if (sId !== null && sId !== "")
                jList.push(sId);
        }

        return jList;
    }

    /**
     * Check for all cards
     * @param {DOM} pContainer 
     */
    loadBefore(pContainer:any)
    {
        this.vsBefore = this.getCards(pContainer);
    }

    /**
     * Check for all cards
     * @param {DOM} pContainer 
     */
    loadAfter(pContainer:any)
    {
        this.vsAfter = this.getCards(pContainer);
    }

    /**
     * Mark the newly added cards
     */
    mark()
    {
        this.markCards(this.identifyNewCards())
    }

    /**
     * Get all those cards that are available only in the "after" array
     * 
     * @returns {array} id list
     */
    identifyNewCards()
    {
        if (this.vsAfter.length === 0)
            return [];

        const vsNew = [];
        const nSize = this.vsAfter.length;
        for (let i = 0; i < nSize; i++)
        {
            if (!this.vsBefore.includes(this.vsAfter[i]))
                vsNew.push(this.vsAfter[i]);
        }

        return vsNew;
    }
    
    /**
     * Mark a list of cards by their IDs
     * 
     * @param {array} vsIds 
     */
    markCards(vsIds:any)
    {
        const _prefix = this.cardIdPrefix;
        const nSize = vsIds.length;
        if (nSize === 0)
            return;

        for (let i = 0; i < nSize; i++)
            CheckForCardsPlayed.markCard(_prefix + vsIds[i]);

        
        setTimeout(function()
        {
            const _ids = vsIds;
            for (let _id of _ids)
                CheckForCardsPlayed.unmarkCard(_prefix + _id);

        }, 2500);
    }

    static unmarkCard(sId:string)
    {
        let elem = document.getElementById(sId);
        if (elem !== null && elem.nodeName !== undefined)
        {
            if ("DIV" === elem.nodeName || "DIV" === elem.nodeName.toUpperCase())
                elem = elem.querySelector("img");

            if (elem !== null)
                elem.classList.remove("card-highlight");
        }
    }

    /**
     * Mark a specific card by its id
     * @param {String} sId 
     */
    static markCard(sId:string)
    {
        let elem = document.getElementById(sId);
        if (elem !== null && elem.nodeName !== undefined)
        {
            
            if ("DIV" === elem.nodeName || "DIV" === elem.nodeName.toUpperCase())
                elem = elem.querySelector("img");

            if (elem !== null)
                elem.classList.add("card-highlight");
        }
    }
}

/**
 * Check for company cards
 */
class CheckForCardsPlayedCompany extends CheckForCardsPlayed
{
    /**
     * Get all cards of a given company 
     * 
     * @param {Object} pContainer DOM Element 
     */
    getCards(pContainer:any)
    {
        const list:any = [];

        ArrayList(pContainer).find(".company-characters").each((_char:any) =>
        {
            ArrayList(_char).find("img").each((_img:any) => list.push(_img));
        });
        
        return this.getCardsFromList(list);
    }

}

export { CheckForCardsPlayed, CheckForCardsPlayedCompany }