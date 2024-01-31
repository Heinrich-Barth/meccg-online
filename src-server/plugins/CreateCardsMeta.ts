import { ICard } from "./Types";

/**
 * Manage Card Metadata
 */
const unifySecondaries = function(sSecondary:string) 
{
    if (typeof sSecondary === "undefined" || sSecondary === "")
        return "Not specified";
    else
        return sSecondary.substring(0, 1).toUpperCase() + sSecondary.substring(1).toLowerCase().replace(/-/g, " ");
};

export interface ICardMetadata {
    secondaries:string[],
    alignment:string[],
    type:string[],
    hazards:string[],
    resources:string[],
}


export default class CreateCardsMeta 
{
    #updateSecondaries(cards:ICard[]) :string[]
    {
        let result:string[] = [];
        for (let card of cards) 
        {
            card.Secondary = unifySecondaries(card.Secondary);
            if (card.Secondary !== "" && !result.includes(card.Secondary))
                result.push(card.Secondary);
        }

        result.sort();
        return result;
    }

    #updateAlign(cards:ICard[]) 
    {
        let result:string[] = [];
        for (let card of cards) 
        {
            if (card.alignment !== "" && !result.includes(card.alignment))
                result.push(card.alignment);
        }

        result.sort();
        return result;
    }

    #updateTypes(cards:ICard[]) 
    {
        let result:string[] = [];
        for (let card of cards) 
        {
            if (card.type !== "" && !result.includes(card.type))
                result.push(card.type);
        }

        result.sort();
        return result;
    }

    #updateHazards(cards:ICard[]) 
    {
        let result : string[] = [];
        for (let card of cards) 
        {
            let _category = card.type;

            if (_category === "Hazard" && !result.includes(card.Secondary))
                result.push(card.Secondary);
        }

        result.sort();
        return result;
    }

    #updateResources(cards:ICard[]) 
    {
        const result:string[] = [];
        for (let card of cards) 
        {
            let _category = card.type;

            if (_category !== "" && _category !== "Region" && _category !== "Site" && _category !== "Hazard" && !result.includes(card.Secondary))
                result.push(card.Secondary);
        }

        result.sort();
        return result;
    }

    #init(cards:ICard[]) : ICardMetadata
    {
        const secs = this.#updateSecondaries(cards);
        const aligns = this.#updateAlign(cards);
        const types = this.#updateTypes(cards);
        const hazards = this.#updateHazards(cards);
        const resources = this.#updateResources(cards);

        return { 
            secondaries: secs,
            alignment:  aligns,
            type: types,
            hazards: hazards,
            resources: resources,
        };
    }
        
    static get(cards:ICard[]) : ICardMetadata
    {
        return new CreateCardsMeta().#init(cards);
    };
}
