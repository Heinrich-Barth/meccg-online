import * as fs from "fs";
import CardsMeta from "./CreateCardsMeta";
import CardRepository from "./CardRepository";
import { validate as ValidateDeck, validateArda as ValidateDeckArda, validateSingleplayer as ValidateDeckSingleplayer } from "./DeckValidator";
import  CreateCardsMap, { IMapData }  from "./CardsMap";
import { DeckValidate, DeckValidateArda, DeckValidateSection } from "./Types";
import ImageList, { CardImagesMap } from "./ImageList";
import Logger from "../Logger";
import ConfigurationInstance from "../Configuration";
import { IMap } from "./MapData";
import CardBuilder from "./CardBuilder";

export interface MapData extends IMap {
    images: CardImagesMap
}

class CardDataProvider extends CardRepository {
   
    #imageList = new ImageList();

    #cardsFile:string;
    #mapPos:string;

    #filters = { };
    #cardsMap:IMapData|null = null;

    constructor(mapPos:string, cardsUrl:string, imageUrl:string)
    {
        super();

        this.#cardsFile = cardsUrl;
        this.#mapPos = mapPos;
    }

    onProcessCardData()
    {
        this.#imageList.create(this.getCards());
        this.#cardsMap = CreateCardsMap(this.getCards(), this.#mapPos, this.#imageList.getImageList());
        this.#filters = CardsMeta.get(this.getCards());
        this.postProcessCardList();
    }

    getFlippedCode(code:string)
    {
        const map = this.#imageList.getQuestList();
        const other = map[code.toLocaleLowerCase()];
        if (typeof other === "string")
            return other;
        else
            return "";
    }

    getFilters()
    {
        return this.#filters;    
    }

    #buildCardsData(dir:string)
    {
        const builder = new CardBuilder();
        return builder.fromDirectory(dir);
    }

    load()
    {
        try 
        {
            Logger.info("Loading local card data from directory " + this.#cardsFile);
            this.onCardsReceived(this.#buildCardsData(this.#cardsFile));
            Logger.info("\t-- successfully loaded card data from local file");
        } 
        catch (error:any) 
        {
            Logger.warn("Could not load locally");
            Logger.warn(error.message);
        }
    }

    #getAvatarInDPile(jDeck:DeckValidateSection)
    {
        for(let k in jDeck)
        {
            if (jDeck[k] === 0)
                continue;
    
            const _code = this.getVerifiedCardCode(k.replace(/"/g, '').toLowerCase());
            if (this.isAvatar(_code))
                return _code;
        }

        return "";
    }

    getAvatar<T extends DeckValidate>(jDeck:T) : string
    {
        if (jDeck.pool === undefined || jDeck.playdeck === undefined)
            return "";

        const val = this.#getAvatarInDPile(jDeck.playdeck);
        if (val !== "")
            return val;

        return this.#getAvatarInDPile(jDeck.pool)
    }

    validateDeck<T extends DeckValidate>(jDeck:T)
    {
        return ValidateDeck(jDeck, this);
    }

    validateDeckArda(jDeck:DeckValidateArda|null)
    {
        return ValidateDeckArda(jDeck, this);
    }

    validateDeckSingleplayer(jDeck:DeckValidateArda|null, randomHazards:boolean = false)
    {
        return ValidateDeckSingleplayer(jDeck, randomHazards, this);
    }

    getImageList()
    {
        return {
            images: this.#imageList.getImageList(),
            fliped : this.#imageList.getQuestList()
        };
    }


    getMapdata():MapData
    {
        const data:any = this.#cardsMap!.mapdata;
        data.images = this.#imageList.getImageListMap();
        return data;
    }
    
    getSiteList()
    {
        return this.#cardsMap!.siteList;
    }

    getImageByCode(code:string)
    {
        return this.#imageList.getImageByCode(code.toLowerCase());
    }

    getUnderdeepMapdata()
    {
        return this.#cardsMap!.underdeeps;
    }

    getAgents()
    {
        return super.getAgents();
    }
}

const Instance = new CardDataProvider(ConfigurationInstance.mapPositionsFile(), ConfigurationInstance.cardUrl(), ConfigurationInstance.imageUrl());
Instance.load();

export { Instance as CardDataProvider };