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

    identifyQuestImages(cards:ICard[]) : KeyValuesString
    {
        const questsB:any = { };
        const quests:any = { };

        for (let card of cards)
        {
            if (card["flip-title"] === undefined)
                continue;
                
            const flipTitle = card["flip-title"].replace(" 2", "").replace(" A", "").replace(" 1", "").replace(" B", "");
            if (flipTitle!== card.normalizedtitle)
            {
                questsB[flipTitle] = card.code;
                questsB[flipTitle + card.alignment] = card.code;
            }
        }

        for (let card of cards)
        {
            const alignTitle = card.normalizedtitle + card.alignment;
            if (questsB[alignTitle] !== undefined)
            {
                const cardCodeA = card.code;
                const cardCodeB = questsB[alignTitle];
                quests[cardCodeA] = cardCodeB;
                quests[cardCodeB] = cardCodeA;
            }
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
