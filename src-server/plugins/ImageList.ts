import { CardImages, ICard, KeyValuesString } from "./Types";
import ValidateImages from "./VerifyImages";
import Logger from "../Logger";

export interface CardImagesMap {
    [key:string]:CardImages
}

export default class ImageList {

    #g_ImageList:CardImagesMap= {};
    #g_ImageListMap:CardImagesMap  = {};
    #g_QuestList:KeyValuesString = {};
    #g_nCountErrataDC = 0;
    #g_nCountErrataIC = 0;

    static removeEndingSlash(imageUrl:string) : string
    {
        return imageUrl.endsWith("/") ? imageUrl.substring(0, imageUrl.length - 1) : imageUrl;
    }

    static createImageUrl(imageName:string) : string
    {
        return imageName;
    }

    newImage(card:ICard) : CardImages
    {
        const isDCErratum = typeof card.ImageNameErrataDC === "string" && card.ImageNameErrataDC !== "";
        
        const data:CardImages = {
            image: card.ImageName
        };

        if (typeof card["ImageNameES"] === "string")
            data.imageES = card.ImageNameES;

        if (isDCErratum)
        {
            data.ImageNameErrataDC = card.ImageNameErrataDC ?? "";
            this.#g_nCountErrataDC++;
        }
            

        return data;
    }

    createImageList(jsonCards:ICard[]) : CardImagesMap
    {
        const list:any = { };

        for (let card of jsonCards) 
            list[card.code] = this.newImage(card);

        Logger.info("\t- IC errata images available: " + this.#g_nCountErrataIC);
        Logger.info("\t- DC errata images available: " + this.#g_nCountErrataDC);

        ValidateImages(list);
        return list;
    }

    createImageListMap(jsonCards:ICard[]) : CardImagesMap
    {
        let list:any = {};

        for (let card of jsonCards) 
        {
            if (card.type === "Site" || card.type === "Region")
                list[card.code] = this.newImage(card);
        }
        return list;
    }

    #findFlippCards(cards:ICard[]) : ICard[]
    {
        const quests:ICard[] = [];
        const flips:any = { };
        for (let card of cards)
        {
            if (card["flip-title"] === undefined || card["flip-title"] === "")
                continue;

            const flipTitle = this.#removeTitleIndex(card["flip-title"]).toLowerCase();
            if (flipTitle === card.normalizedtitle)
            {
                card["flip-title"] = "";
                continue;
            }

            card["flip-title"] = flipTitle.toLowerCase();
            flips[card["flip-title"]] = card.normalizedtitle;
            flips[card.normalizedtitle] = card["flip-title"];

            quests.push(card);
        }
    
        for (let card of cards)
        {
            if (card["flip-title"])
                continue;

            if (flips[card.normalizedtitle])
                quests.push(card);
        }

        return quests;
    }

    #removeTitleIndex(title:string)
    {
        if (title.endsWith(" A") || title.endsWith(" B") || title.endsWith(" 1") || title.endsWith(" 2"))
            return title.substring(0, title.length - 2).trim();

        return title;
    }

    identifyQuestImages(cards:ICard[]) : KeyValuesString
    {
        const questlist = this.#findFlippCards(cards);
        const mapByTitle:any = { };
        const quests:any = { };
        const questByCodes:any = { }

        for (let card of questlist)
        {
            mapByTitle[card.normalizedtitle] = card.code;
            questByCodes[card.code.toLowerCase()] = true;
        }

        for (let card of questlist)
        {
            if (quests[card.code])
                continue;

            const flipTitle = card["flip-title"];
            const targetCode = mapByTitle[flipTitle]
            
            if (targetCode)
            {
                quests[card.code] = targetCode;
                quests[targetCode] = card.code;
            }
            else if (questByCodes[flipTitle])
            {
                quests[card.code] = flipTitle;
                quests[flipTitle] = card.code;
            }
            else
                Logger.warn("\t- Cannot find flip side for " + card.code + " with flip title " + flipTitle);
        }

        Logger.info("\t- Flipped cards available: " + Object.keys(quests).length);
        return quests;
    }

    create(jsonCards:ICard[])
    {
        this.#g_ImageList = this.createImageList(jsonCards);
        this.#g_ImageListMap = this.createImageListMap(jsonCards);
        this.#g_QuestList = this.identifyQuestImages(jsonCards);
    }

    getImageListMap()
    {
        return this.#g_ImageListMap;
    }

    getImageList()
    {
        return this.#g_ImageList;
    }

    getImageByCode(code:string) : string
    {
        if (code !== "" && this.#g_ImageList[code])
            return this.#g_ImageList[code].image
        else
            return "";
    }

    getQuestList()
    {
        return this.#g_QuestList;
    }

    getLists()
    {
        return {
            images: this.#g_ImageList,
            fliped : this.#g_QuestList
        };
    }

}
