import * as fs from "fs";
import CardNameCodeSuggestions from "./CardNameCodeSuggestions";
import CardRepositoryUnderdeeps from "./CardRepositoryUnderdeeps"
import addStageCodes from "./CardStageCodes";
import Logger from "../Logger";
import { replaceImages } from "./LocalImageMerger";
import { ICard, ICardMapCard, KeyValuesString } from "./Types";
import { getRootFolder } from "../Configuration";

const getRemovableKeysArray = function():string[]
{
    try
    {
        const data = fs.readFileSync(getRootFolder() + "/data-local/obsoleteCardKeys.json", 'utf8');
        if (typeof data === "string" && data !== "")
            return JSON.parse(data);
    }
    catch (err)
    {
        Logger.warn("Could not read obsolete card keys json");
        Logger.error(err);
    }

    return [];
};

const getStageCodes = function():string[]
{
    try
    {
        const data = fs.readFileSync(getRootFolder() + "/data-local/stage-codes.json", 'utf8');
        if (data !== "")
            return JSON.parse(data.toLowerCase());
    }
    catch (errIgnore)
    {
        /** ignore */
    }

    return [];
};

interface TCardDeckbuilder {
    title: string,
    text: string
    set_code?:string,
    full_set?:string, 
    Secondary?:string, 
    alignment?:string, 
    type?:string,  
    code?:string, 
    uniqueness?:boolean,
    skills?:string[],
    keyword?:string[],
    [key:string]:any
}



export default class CardRepository {

    #raw:ICard[] = [];
    #agentList:string[] = [];
    #nameCodeAlternatives = {};
    #cardsDeckbuilder:TCardDeckbuilder[] = [];
    #listAvatars:string[] = [];
    #types:KeyValuesString = {};
    #stageList:string[] = [];
    #cardRepository:ICardMapCard = {};

    getCards()
    {
        return this.#raw;
    }

    getCardsDeckbuilder() 
    {
        return this.#cardsDeckbuilder;
    }

    getStageCards()
    {
        return this.#stageList;
    }

    getAvatarCodes()
    {
        return this.#listAvatars;
    }

    createCardsDeckbuilder()
    {
        const assertString = function(val:string)
        {
            if (typeof val !== "string")
                return "";
            else
                return val.trim();
        }

        this.#cardsDeckbuilder = [];

        let listStrings = ["set_code", "full_set", "Secondary", "alignment", "type",  "code", "uniqueness"]
        let listOther = ["uniqueness", "skills", "keywords"];
        let listStringsOptional = ["Site", "Region"]

        for (let card of this.#raw) 
        {
            const title = card.normalizedtitle + (card.title !== card.normalizedtitle ? " " + card.title : "");
            const text = assertString(card.text);

            const candidate:TCardDeckbuilder = { 
                title: title.toLowerCase(),
                text: text.toLowerCase()
            };

            for (let key of listStrings)
                candidate[key] = assertString(card[key]);
            for (let key of listOther)
                candidate[key] = card[key];
            for (let key of listStringsOptional)
            {
                if (typeof card[key] === "string")
                    candidate[key] = card[key].toLowerCase();
            }

            this.#cardsDeckbuilder.push(candidate);
        }

    }
    
    sort() 
    {
        this.#raw.sort( (card1, card2) => card1.title.replace(/"/g, '').localeCompare(card2.title.replace(/"/g, ''), "de-DE"));
    }

    stripQuotes()
    {
        for (let card of this.#raw) 
        {
            card.code = this.removeQuotes(card.code);
            card.title = this.removeQuotes(card.title);
        }
    }

    codesLowercase()
    {
        for (let card of this.#raw) 
        {
            card.code = card.code.toLowerCase();
            card.title = card.title.toLowerCase();

            if (card.Region !== undefined)
                card.Region = card.Region.toLowerCase();
        }
    }

    removeQuotes(sCode:string) 
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, '');
    }

    addIndices() 
    {
        let index = 0;
        for (let card of this.#raw) 
            card.index = ++index;
    }
    
    prepareArda()
    {
        this.#cardRepository = {};
        for (let card of this.#raw)
            this.#cardRepository[card.code] = card;
    }

    #identifyAvatars()
    {
        let nCount = 0;
        for (let card of this.#raw)
        {
            if (card["Secondary"] === "Avatar")
            {
                this.#listAvatars.push(card.code.toLowerCase());
                nCount++;
            }
        }
        
        Logger.info("\t- Avatars: " + nCount);
    }

    identifyQuests()
    {
        let nCount = 0;
        for (let card of this.#raw)
        {
            if (card.Race?.toLowerCase().startsWith("quest"))
            {
                card.isQuest = true;
                nCount++;

                if (card.keywords === null || !Array.isArray(card.keywords))
                    card.keywords = [];

                if (!card.keywords.includes("quest"))
                    card.keywords.push("quest");
            }
            else
                card.isQuest = false;
        }
        
        Logger.info("\t- Quests: " + nCount);
    }

    identifyInLieuItems()
    {
        let text = "";
        for (let card of this.#raw) 
        {
            if (card.code === "Towers Destroyed (FB)")
                card.isStartable = false;
            else if (card.code === "Heirlooms of Eärendil (ML)")
                card.isStartable = true;
            else
            {
                text = card.text.toLowerCase();
                card.isStartable = text.indexOf("in lieu of") !== -1 && text.indexOf(" minor ") !== -1 ;
            }
        }            
    }

    removeUnusedFields()
    {
        const vsUnused = getRemovableKeysArray();

        let rem = 0;
        for (let card of this.#raw) 
        {
            vsUnused.forEach(key => 
            {
                if (key !== "" && card[key] !== undefined)
                {
                    delete card[key];
                    rem++;
                }
            });
        }

        if (rem > 0)
            Logger.info("\t- properties removed from cards: " + rem);
    }

    removeFlavourText()
    {
        let rem = 0;

        for (let card of this.#raw) 
        {
            if (card.text === undefined || card.text === "" || card.text === null)
                continue;

            let sText = card.text.trim();
            const nLast = sText.lastIndexOf("\"-");
            if (nLast  === -1)
                continue;

            let _can = sText.substring(nLast+2).trim();
            if (!_can.startsWith("Hob") && !_can.startsWith("LotR") && !_can.startsWith("Eliz") && !_can.startsWith("Kuduk Lore"))
                continue;

            let nStart = sText.lastIndexOf("\"", nLast-1);
            if (nStart !== -1)
            {             
                rem++;
                sText = sText.substring(0, nStart).trim();
            }

            card.text = sText;
        }

        if (rem > 0)
            Logger.info("\t- flavour texts removed from cards: " + rem);
    }

    removeUnwantedCardRepository(_raw:ICard[])
    {
        let countUl = 0;
        let countAL = 0;
        let _arr = [];
        for (let elem of _raw)
        {
            if (elem.set_code === "MEUL") 
                countUl++;
            else if (elem.code.indexOf(" AL (") !== -1)
                countAL++;
            else 
                _arr.push(elem);
        }

        if (countUl > 0)
            Logger.info("\t- cards removed (unlimited): " + countUl);
        if (countAL > 0)
            Logger.info("\t- cards removed (AL): " + countAL);

        return _arr;
    }

    integrityCheck()
    {
        let invalids:any = { };

        const addInvalid = function(card:ICard, field:string)
        {
            if (card[field] !== "" || card[field] === undefined)
                return;

            if (invalids[card.code] === undefined)
                invalids[card.code] = [field];
            else
                invalids[card.code].push(field);
        }

        for (let card of this.#raw) 
        {
            if (card.code === "")
                continue;

            addInvalid(card, "ImageName");
            addInvalid(card, "title");
            addInvalid(card, "normalizedtitle");
        }

        Logger.info("\t- invalid card(s) found: " + Object.keys(invalids).length);
    }

    updateMps()
    {
        for (let card of this.#raw) 
        {
            if (card.MPs === undefined && card.mp !== undefined)
            {
                card.MPs = card.mp;
                delete card.mp;
            }

            if (card.MPs === undefined || typeof card.MPs === "number")
                continue;
            else if (card.MPs === "" || card.normalizedtitle === "grim voiced and grim faced")
                delete card.MPs;
            else
            {
                if (card.MPs.indexOf("(") >= 0)
                    card.MPs = card.MPs.replace("(", "").replace(")", "");
            
                card.MPs = this.toInt(card.MPs);
            }
        }
    }

    updateMind()
    {
        for (let card of this.#raw) 
        {
            if (card.Mind === undefined && card.mind !== undefined)
            {
                card.Mind = card.mind;
                delete card.mind;
            }

            if (card.Mind === undefined || typeof card.Mind === "number")
                continue;
            else if (card.Mind === "")
                delete card.Mind;
            else
            {
                if (card.Mind.indexOf("(") >= 0)
                    card.Mind = card.Mind.replace("(", "").replace(")", "");
            
                card.Mind = this.toInt(card.Mind);
            }
        }
    }    

    toInt(sVal:any)
    {
        try
        {
            if (typeof sVal === "string" && sVal !== "")
                return parseInt(sVal);
        }
        catch (errIgnore)
        {

        }

        return 0;
    }

    createCardNameCodeSuggestionsList()
    {
        this.#nameCodeAlternatives = CardNameCodeSuggestions.create(this.#raw);
        return Object.keys(this.#nameCodeAlternatives).length;
    }

    identifyUnderdeeps()
    {
        CardRepositoryUnderdeeps.create(this.#raw);
    }

    #mergeLocalImages(list:ICard[])
    {
        replaceImages(list);
    }

    #identifyStageCards()
    {
        const count = addStageCodes(this.#raw);
        Logger.info("\t- Stage card(s) itendified: " + count);
    }

    setup(_raw:ICard[])
    {
        Logger.info("Setting up card data.");
        this.#addLocalCardsDev(_raw);
        this.#mergeLocalImages(_raw);
        this.#raw = this.removeUnwantedCardRepository(_raw);
        this.stripQuotes();
        this.codesLowercase();
        this.identifyQuests();
        this.#identifyAvatars();
        this.#identifyStageCards();
        this.identifyUnderdeeps();
        this.integrityCheck();
        this.sort();
        this.addIndices();
        this.updateMps();
        this.updateMind();

        this.createTypes();
        this.createCardsDeckbuilder();
        this.prepareArda();
        this.createAgentList();
        this.createCardNameCodeSuggestionsList();

        this.#loadStageCodes();

        Logger.info("\t- " + this.#raw.length + " cards available in total.");
        return this.#raw;
    }    

    #loadStageCodes()
    {
        this.#stageList = getStageCodes();
    }

    createTypes()
    {
        for (let card of this.#raw) 
            this.#types[card.code] = card["type"];
    }
    
    getCardType(code:string)
    {
        if (code === undefined || code === "")
            return "";
        
        code = code.toLowerCase();
        return this.#types[code] ?? "";
    }

    getCardByCode(code:string) : ICard|null
    {
        if (code === undefined || code === "")
            return null;
        
        code = code.toLowerCase();
        return this.#cardRepository[code] ?? null;
    }

    getCardMind(code:string)
    {
        const card = this.getCardByCode(code);
        return card?.Mind !== undefined ? card.Mind : -1;
    }

    getCardTypeSpecific(code:string)
    {
        const card = this.getCardByCode(code);
        return card?.Secondary !== undefined ? card.Secondary : "";
    }
    isHoardItem(code:string)
    {
        const card = this.getCardByCode(code);
        if (card === null)
            return false;

        const sRace = card.Race;
        if (typeof sRace === "string" && sRace.toLowerCase().indexOf("hoard") !== -1)
            return true;
        
        if (card.keywords && Array.isArray(card.keywords) && card.keywords.includes("hoard"))
            return true;            

        return false;
    }
    
    isUnique(code:string)
    {
        const card = this.getCardByCode(code);
        return card?.uniqueness === true;
    }

    isStageCard(code:string)
    {
        const card = this.getCardByCode(code);
        if (card === null || card.keywords === undefined || card.keywords === null)
            return false;
        else
            return Array.isArray(card.keywords) && card.keywords.includes("stage resource");
    }

    getMarshallingPoints(code:string)
    {
        let data = {
            type: "",
            points: 0
        }

        const card = this.getCardByCode(code);
        if (card === null || card.Secondary === undefined || card.Secondary === "")
            return data;

        const secondary = card.Secondary.toLowerCase();
        const cardTyoe = card.type.toLowerCase();

        data.points = card.MPs === undefined ? 0 : card.MPs;

        if (cardTyoe === "hazard")
            data.type = "kill";
        else if (secondary === "character")
        {
            data.type = "character";
            data.points = 0;
        }
        else if (secondary === "ally")
            data.type = "ally";
        else if (secondary === "faction")
            data.type = "faction";
        else if (cardTyoe === "resource")
        {
            if (secondary.endsWith("item"))
                data.type = "item";
            else 
                data.type = "misc";
        }

        return data;
    }

    isCardAvailable(code:string)
    {
        return code !== undefined && code !== "" && this.#types[code.toLowerCase()] !== undefined;
    }

    isCardAvailableGuessed(code:string)
    {
        return this.getVerifiedCardCode(code) !== "";
    }

    getVerifiedCardCode(code:string)
    {
        if (code === undefined || code === "" || code === null)
            return "";

        let sCode = code.toLowerCase();
        if (this.#types[sCode] !== undefined)
            return sCode;
        else if (this.#types[sCode.replace(" (", " [h] (")] !== undefined)
            return sCode.replace(" (", " [h] (");
        else if (this.#types[sCode.replace(" (", " [m] (")] !== undefined)
            return sCode.replace(" (", " [m] (");
        else if (this.#types[sCode.replace(" [h] (", " (")] !== undefined)
            return sCode.replace(" [h] (", " (");
        else if (this.#types[sCode.replace(" [m] (", " (")] !== undefined)
            return sCode.replace(" [m] (", " (");
        else
            return "";
    }

    postProcessCardList()
    {
        this.identifyInLieuItems();
        this.removeUnusedFields();
        this.removeFlavourText();
        Logger.info("\t-- all data card loaded --");
    }

    isAgent(card:ICard)
    {
        if (card["type"] !== "Character")
            return false;  
        else
            return card["Secondary"] === "Agent" || card["agent"] === "yes";
    }

    isAvatar(code:string)
    {
        return code !== "" && this.#listAvatars.includes(code.toLowerCase());
    }

    createAgentList()
    {
        for (let card of this.#raw) 
        {
            if (this.isAgent(card))
                this.#agentList.push(card.code);
        }

        Logger.info("\t- " + this.#agentList.length + " agents identified.");
    }

    getAgents()
    {
        return this.#agentList;
    }

    onProcessCardData()
    {
        /** overwrite */
    }

    #appendLocalCards(cards:ICard[], localList:ICard[])
    {
        let count = 0;

        for (let card of localList)
        {
            cards.push(card);
            count++;
        }

        if (count > 0)
            Logger.info(count + " local cards added.");
    }

    #addLocalCardsDev(cards:ICard[])
    {
        try
        {
            const data = fs.readFileSync("./data-local/cards-full.json", 'utf8');
            const list = data === undefined || data === null ? [] : JSON.parse(data);
            if (Array.isArray(list) && list.length > 0)
                this.#appendLocalCards(cards, list);
        }
        catch(err)
        {
            /** ignore any error */
        }

        return cards;
    }

    onCardsReceived(list:ICard[])
    {
        
        try 
        {
            this.setup(list);
            this.onProcessCardData();
        } 
        catch (error) 
        {
            Logger.error(error);
        }
    }

    getNameCodeSuggestionMap()
    {
        return this.#nameCodeAlternatives;
    }
}
