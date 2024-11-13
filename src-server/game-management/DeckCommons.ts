import Logger from "../Logger";
import { CardDataProvider } from "../plugins/CardDataProvider";
import { DeckValidateSection } from "../plugins/Types";

export interface TDeckCardMap {
    [uuid:string] : TDeckCard
}

export interface TSaveGameComons {
    id : string
    ishost : boolean,
    [key:string]:any
}

export type TDeckCard = {
    code:string
    type:string,
    uuid:string,
    state:number,
    owner:string,
    revealed:boolean,
    agent:boolean,
    turn: number,
    stage: boolean,
    secondary: string,
    hoard: boolean,
    unique: boolean,
    token?:number,
    tokenMP?:number,
    target?:string,
    status: number
    tmpType?: string;
    tmpSecondary?: string;
}

/**
 * Commpn playdeck 
 */
export default class DeckCommons {
    
    #id:string;
    #deck_uuid_count = 0;

    /**
     * Create instance
     * @param {String} playerId 
     */
    constructor(playerId:string)
    {      
        this.#id = playerId;
    }

    /**
     * Number of allowed cards per deck
     * @returns Number
     */
    getMaxDeckSize()
    {
        return 300;
    }

    /**
     * Get the deck owner
     * @returns Id
     */
    getPlayerId()
    {
        return this.#id;
    }

    /**
     * Save this deck
     * @param {Boolean} isAdmin 
     * @returns JSON
     */
    save(isAdmin:boolean) : TSaveGameComons
    {
        return {
            id : this.#id,
            ishost : isAdmin
        };
    }

    /**
     * Check if given code represents an agent
     * @param {String} code 
     * @returns 
     */
    isAgent(code:string)
    {
        return code !== "" && CardDataProvider.getAgents().includes(code);
    }

    shufflePlaydeckTop(count:number)
    {
        /** allow overwrite */
    }
    

    /**
     * Add a card list to the deck
     * 
     * @param {JSON} cards 
     * @param {Array} _targetList 
     * @param {Object} _cardMap 
     * @returns 
     */
    add(cards:DeckValidateSection, _targetList:string[], _cardMap:TDeckCardMap)
    {
        if (cards === undefined)
            return 0;
            
        let nSize = 0;
        let _entry;
        let count;
        const MAX_CARDS_PER_DECK = this.getMaxDeckSize();
        for (let _key in cards)
        {
            count = cards[_key];
            const key = this.removeQuotes(_key);
            for (let i = 0; i < count && nSize < MAX_CARDS_PER_DECK; i++)
            {
                _entry = this.createCardEntry(key, this.isAgent(key));
                if (_entry === null)
                {
                    Logger.warn("Cannot add card " + key + " to deck.");
                    break;
                }
                else
                {
                    _targetList.push(_entry.uuid);
                    _cardMap[_entry.uuid] = _entry;
                    nSize++
                }
            }
        }
    
        if (nSize === MAX_CARDS_PER_DECK)
            Logger.info("Will not add more than " + MAX_CARDS_PER_DECK + " cards for safety reasons.");
            
        return nSize;
    }

    /**
     * Remove quotation marks from code
     * @param {String} sCode 
     * @returns sanatized string
     */
    removeQuotes(sCode:string)
    {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, "");
    }

    #randomNumber(max:number)
    {
        if (max <= 1)
            return 0;
        else
            return Math.floor((Math.random() * max));
    }

    /**
     * Shuffle list
     * @param {Array} inputList 
     */
    shuffleAny(inputList:any[])
    {
        let _newList = [ ];
        let _index;

        while (inputList.length > 0)
        {
            _index = this.#randomNumber(inputList.length);
            _newList.push(inputList[_index]);
            inputList.splice(_index, 1);
        }

        const len = _newList.length; 
        for (let i = 0; i < len; i++)
            inputList.push(_newList[i]);
    }

    


    /**
     * Move a card form source to target array
     * @param {Array} listPlaydeck 
     * @param {Array} listTarget 
     * @returns card id
     */
    transferCard(listPlaydeck:string[], listTarget:string[])
    {
        if (listPlaydeck.length === 0)
            return "";

        const _id = listPlaydeck[0];

        listTarget.push(_id);
        listPlaydeck.splice(0,1);

        return _id;
    }

    /**
     * Transfer the top card from playdeck to target array
     * @param {Array} listPlaydeck 
     * @param {Array} listTarget 
     * @returns 
     */
    transferCardToTop(listPlaydeck:string[], listTarget:string[])
    {
        if (listPlaydeck.length === 0)
            return "";

        const _id = listPlaydeck[0];

        listTarget.unshift(_id);
        listPlaydeck.splice(0,1);

        return _id;
    }
    
    /**
     * Get the first card from a given list
     * 
     * @param {Array} listPlaydeck 
     * @returns value or emtpy string
     */
    popTopCardFrom(listPlaydeck:string[])
    {
        if (listPlaydeck.length === 0)
            return "";

        const _id = listPlaydeck[0];
        listPlaydeck.splice(0,1);
        return _id;
    }

    /**
     * Check if a uuid is contained in a given array of objects
     * @param {String} uuid 
     * @param {Array} list 
     * @returns boolean
     */
    listContains(uuid:string, list:string[])
    {
        return uuid !== "" && list.includes(uuid);
    }

    /**
     * Create a new unique counter value
     * @returns String
     */
    createNewCardUuid():any
    {
        return ++this.#deck_uuid_count;
    }

    /**
     * Create unique id
     * @returns ID
     */
    #requestNewCardUuid()
    {
        return this.getPlayerId() + "_" + this.createNewCardUuid();
    }

    /**
     * Create empty card entry
     * @returns Object
     */
    static #createEmptyCardEntry() : TDeckCard
    {
        return {
            code : "",
            type : "",
            uuid : "",
            state : 0,
            owner : "",
            revealed: false,
            agent : false,
            turn: 0,
            stage: false,
            secondary: "",
            status: 0,
            unique: false,
            hoard: false
        };
    }

    /**
     * Clone a given input object
     * @param {JSON} input 
     * @returns cloned instance of null
     */
    static cloneCardEntry(input:TDeckCard) : TDeckCard|null
    {
        const data = DeckCommons.#createEmptyCardEntry();

        data.code = DeckCommons.assertString(input.code);
        data.type = DeckCommons.assertString(input.type);
        data.uuid = DeckCommons.assertString(input.uuid);
        data.state = DeckCommons.#toInt(input.state);
        data.owner = DeckCommons.assertString(input.owner);
        data.revealed = input.revealed === true;
        data.agent = input.agent === true;
        data.turn = DeckCommons.#toInt(input.turn);
        data.stage = input.stage === true;
        
        if (DeckCommons.#hasEmptyString(data.code, data.type, data.uuid, data.owner))
            return null;

        return data;
    }

    static #hasEmptyString(...arr:string[])
    {
        for (let i of arr)
        {
            if (i === "")
                return true;
        }

        return false;
    }

    static #toInt(input:any)
    {
        if (input === undefined)
            input = 0;

        if (typeof input === "number")
            return input;

        try
        {
            const val = parseInt(input);
            if (!isNaN(val))
                return val;
        }
        catch (errIgnore)
        {
            /** ignore */
        }

        return 0;
    }

    /**
     * Return string value of given input object to
     * assert it really is a string
     * @param {Object} input 
     * @returns String value or empty string
     */
    static assertString(input:any)
    {
        return typeof input === "string" ? input : "";
    }

    /**
     * Create a new card entry
     * 
     * @param {String} code 
     * @param {Boolean} isAgent 
     * @returns 
     */
    createCardEntry(code:string, isAgent:boolean): TDeckCard|null
    {
        if (typeof code === "undefined")
        {
            Logger.info("Invalid code");
            return null;
        }

        const sType = CardDataProvider.getCardType(code);
        if (sType === "")
        {
            Logger.info("Invalid card type");
            return null;
        }

        const data = DeckCommons.#createEmptyCardEntry();
        data.code = code;
        data.type = sType.toLowerCase();
        data.uuid = this.#requestNewCardUuid();
        data.state = 0;
        data.owner = this.getPlayerId();
        data.revealed = isAgent !== true
        data.agent = isAgent === true;
        data.turn = 0;
        data.secondary = CardDataProvider.getCardTypeSpecific(code);
        data.stage = isAgent !== true && CardDataProvider.isStageCard(code);
        data.hoard = CardDataProvider.isHoardItem(code);
        data.unique = CardDataProvider.isUnique(code);
        return data;
    }
}

