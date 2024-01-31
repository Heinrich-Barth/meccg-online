import Logger from "../Logger";
import { CardImagesMap } from "./ImageList";
import { ICard, KeyValuesString, ISiteTitleCards } from "./Types";

export interface IMapDataUnderdeeps {

    sites: KeyValuesString,
    alignments: KeyValuesString,
    images: CardImagesMap
}

export default class MapDataUnderdeeps {

    #adjacents;
    #alignments;

    constructor(cards:ICard[])
    {
        if (cards === undefined || cards === null)
            cards = [];      

        const res = this.createAdjacentSiteList(cards);
        this.#adjacents = res.adjacents;
        this.#alignments = res.alignments;
        Logger.info("\t- " + Object.keys(this.#adjacents).length + " sites avialable for underdeeps map in total");
    }

    get(imageList:CardImagesMap) : IMapDataUnderdeeps
    {
        return {
            sites: this.#adjacents,
            alignments: this.#alignments,
            images: this.createImageList(Object.keys(this.#adjacents), imageList),
        };
    }

    static getEmptyResult()
    {
        return {
            sites: { },
            images: { }
        }
    }

    createImageList(codes:string[], images:CardImagesMap) : CardImagesMap
    {
        let res:CardImagesMap = {};

        for (let code of codes)
        {
            if (images[code] !== undefined)
                res[code] = images[code];
        }

        return res;
    }


    createUnifiedList(list1:any[])
    {
        let result = [];
        
        if (list1 !== undefined)
        {
            for (let elem of list1)
                result.push(elem);
        }
        
        return result;
    }

    /**
     * Create a map of Cards (by code) and their adjacent sites
     * @param cards Card array
     * @returns Map of arrays
     */
    createAdjacentSiteList(cards:ICard[])
    {
        let alignments:KeyValuesString = {};
        let targetMap:any = {};

        for (let card of cards)
        {
            if (card.type !== "Site")
                continue;

            const res = this.createUnifiedList(card.underdeepSites);
            if (res.length > 0)
            {
                targetMap[card.code] = res;
                alignments[card.code] = card.alignment;
            }
        }

        return {
            adjacents: this.sortMapByKey(targetMap),
            alignments: alignments
        }
    }

    sortMapByKey(map:KeyValuesString):KeyValuesString
    {
        const res:KeyValuesString = {};

        for (let key of Object.keys(map).sort())
            res[key] = map[key];

        return res;
    }

    addCodesByTitle(title:string, sitesByTitle:ISiteTitleCards, targetList:string[]):boolean
    {
        if (sitesByTitle[title] === undefined)
            return false;

        for (let site of sitesByTitle[title])
        {
            if (!targetList.includes(site.code))
                targetList.push(site.code);
        }

        return true;
    }

    addSurfaceSitesNormalised(code:string, title:string, sitesByTitle:ISiteTitleCards, targetList:{[key:string]:string[]}):boolean
    {
        if (sitesByTitle[title] === undefined)
            return false;
        
        for (let site of sitesByTitle[title])
        {
            if (targetList[site.code] === undefined)
                targetList[site.code] = [code];
            else if (!targetList[site.code].includes(code))
                targetList[site.code].push(code);
        }
        
        return true;
    }

    static #normalizeString(text:string)
    {
        return text.replace(/\s{2,}/g, " ").replace(/-/g, "").toLowerCase().replace("í", "i").replace("Û", "u").replace("û", "u");
    }

    addSurfaceSites(code:string, surfaces:ICard[], sitesByTitle:ISiteTitleCards, targetList:{[key:string]:string[]})
    {
        for (let surfaceSiteTitle of surfaces)
        {
            const added1 = this.addSurfaceSitesNormalised(code, surfaceSiteTitle.title, sitesByTitle, targetList);
            const added2 = this.addSurfaceSitesNormalised(code, MapDataUnderdeeps.#normalizeString(surfaceSiteTitle.title), sitesByTitle, targetList);
            
            if (!added1 && !added2)
                Logger.warn("Cannot find surface site by title " + surfaceSiteTitle.title);
        }
    }
}


