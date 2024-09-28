import PlayboardManagerStagingArea from "./PlayboardManagerStagingArea";
import Logger from "../Logger";
import { TCharacterInGame } from "./PlayboardManagerCharacters";
import { TDeckCard } from "./DeckCommons";

type TCompanyLocationCard = {
    
    current: string,
    current_tapped : boolean,
    regions: string[],
    target: string,
    target_tapped : boolean,
    attached : TDeckCard[],
    revealed : boolean

}
type TCompany = {
    id: string,
    playerId: string,
    characters: TCharacterInGame[],
    sites: { 
        current: string,
        regions: string[],
        target: string,
        attached: string[],
        revealed: boolean
    }
}

type TCompanyCharacter = {
    character : TDeckCard,
    attached : TDeckCard[]
    influenced : TCompanyCharacter[] // in itself a list of characters (i.e. this elem field)
}

interface ICompanies {
    [companyid:string]:TCompany
}

export default class PlayboardManagerCompanies extends PlayboardManagerStagingArea
{
    #companies:ICompanies = { };

    reset()
    {
        super.reset();
        
        this.#companies = { };
    }

    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        let data = super.Save();

        data.companies = this.#companies;

        return data;
    }

    Restore(playboard:any)
    {
        super.Restore(playboard);

        this.#companies = {};

        for (let companyid in playboard.companies)
        {
            const _company = playboard.companies[companyid];
            const newCompany:TCompany = {
                id: companyid,
                playerId: this.AssertString(_company.playerId),
                characters: [],
                sites: { 
                    current: "",
                    regions: [],
                    target: "",
                    attached: [],
                    revealed: false
                }
            };

            for (let char of _company.characters)
            {
                const _character:TCharacterInGame = {
                    uuid: this.AssertString(char.uuid),
                    influenced: this.ArrayUUIDClone(char.influenced),
                    sourceCompany: ""
                };

                newCompany.characters.push(_character);
            }

            if (_company.sites !== undefined)
            {
                newCompany.sites.current = this.AssertString(_company.sites.current);
                newCompany.sites.target = this.AssertString(_company.sites.target);
                newCompany.sites.regions = this.ArrayUUIDClone(_company.sites.regions);
                newCompany.sites.attached = this.ArrayUUIDClone(_company.sites.attached);
                newCompany.sites.revealed = _company.sites.revealed === true;
            }

            this.#companies[companyid] = newCompany;
        }
    }


    /**
      * Remove empty companies 
      * @returns {Array|String} List of company ids removed 
      */
    removeEmptyCompanies()
    {
        let keys = [];
        for (let key in this.#companies)
        {
            if (this.#companies[key].characters.length === 0)
            {
                this.discardCompanyOnGuardCards(key);
                keys.push(key);
            }
        }

        for (let _key of keys)
            delete this.#companies[_key];

        return keys;
    }

    /**
     * Remove all onguard cards for a given company
     * @param {String} companyUuid
     * @return {void}
     */
    discardCompanyOnGuardCards(companyUuid:string)
    {
        if (!this.#companyExists(companyUuid))
            return;

        let jCard, pDeck;
        for (let _uuid of this.#companies[companyUuid].sites.attached)
        {
            jCard = this.GetCardByUuid(_uuid);
            pDeck = jCard === null ? null : super.getPlayerDeck(jCard.owner);
            if (pDeck !== null)
                pDeck.push().toDiscardpile(_uuid);
        }

        this.#companies[companyUuid].sites.attached = [];
    }
 
    /**
      * Remove a single card from site onguard list
      * @param {String} uuid
      * @param {String} companyUuid
      * @return {Boolean} success
      */
    discardCompanyOnGuardCard(uuid:string, companyUuid:string)
    {
        if (!this.#companyExists(companyUuid))
            return false;

        let _uuid, jCard, pDeck;
        let vsSites = this.#companies[companyUuid].sites.attached;
        for (let i = vsSites.length - 1; i >= 0; i--)
        {
            _uuid = vsSites[i];
            if (_uuid !== uuid)
                continue;

            jCard = this.GetCardByUuid(_uuid);
            pDeck = jCard === null ? null : super.getPlayerDeck(jCard.owner);
            if (pDeck !== null)
            {
                pDeck.push().toDiscardpile(_uuid);
                vsSites.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    /**
     * Process the influenced characters after the host has been 
     * popped (i.e. because it is being discarded or similar).
     * 
     * Simply join the characters to this company under direct influence instead
     * 
     * @param {String} companyUuid 
     * @param {Array} listCharacters List of character uuid
     * @returns 
     */
     onPopInfluencedCharacters(companyUuid:string, listCharacters:string[]):string[]
     {
        if (companyUuid === undefined || listCharacters === undefined)
             return [];

        for (let uuid of listCharacters)
            this.#joinCompanyFromBoard(uuid, companyUuid);

        return [];
    }

    PopOnGuardCard(cardUuid:string)
    {
        let _list, count, _uuid;
        for (let key in this.#companies) 
        {
            _list = this.#companies[key].sites.attached;
            count = _list.length;
            for (let i = count - 1; i >= 0; i--)
            {
                _uuid = _list[i];
                if (_uuid === cardUuid)
                {
                    _list.splice(i, 1);
                    return true;
                }
            }
        }

        return false;
    }

    linearizeCompanyCharacter(companyCharacter:TCharacterInGame)
    {
        if (companyCharacter.influenced === undefined || companyCharacter.uuid === undefined)
            return [];
    
        let list = [];
    
        for (let _uuid of companyCharacter.influenced)
            list.push(_uuid);
    
        list.push(companyCharacter.uuid);
        return list;
    }
    /**
     * Add a company character to a given target company. It does not check if the company character is already in this company!
     * 
     * @param {String} targetCompanyId
     * @param {String} hostingCharacterUuid ID or empty (=general influence)
     * @param {JSON} companyCharacter
     * @returns {Boolean}
     */
    addCompanyCharacterToCompany(targetCompanyId:string, hostingCharacterUuid:string, companyCharacter:TCharacterInGame):boolean
    {
        const targetCompany = this.#companies[targetCompanyId];
        if (typeof targetCompany === "undefined")
        {
            Logger.warn("Target company does not exist: " + targetCompanyId);
            return false;
        }

        let listAdded = [];

        if (hostingCharacterUuid === "") /* add to target company list */
        {
            targetCompany.characters.push(companyCharacter);
            listAdded.push(companyCharacter.uuid);
        }
        else
        {
            listAdded = this.linearizeCompanyCharacter(companyCharacter);
            for (let _host of targetCompany.characters)
            {
                if (_host.uuid === hostingCharacterUuid)
                {
                for (let _add of listAdded)
                    _host.influenced.push(_add);

                break;
                }
            }
        }

        return this.doAddCompanyCharacterToCompany(targetCompanyId, hostingCharacterUuid, listAdded);
    }

     /**
      * Let's character join company from hand
      * 
      * @param {String} uuid Character UUID
      * @param {String} companyId Target company uuid
      * @param {String} playerId Player id
      * @returns success state
      */
    joinCompanyFromHand(uuid:string, companyId:string, playerId:string)
    {
        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
        {
            Logger.warn("Cannot find player deck");
            return false;
        }

        pDeck.pop().fromAnywhere(uuid);

        this.#companies[companyId].characters.push({
            uuid: uuid, 
            influenced: [],
            sourceCompany: ""
        });
        this.addNewCharacter(uuid, companyId);
        return true;
    }

    /**
     * Character joins company 
     * @param {String} uuid Character UUID
     * @param {String} companyId Company Id to join
     * @returns success state
     */
    #joinCompanyFromBoard(uuid:string, companyId:string)
    {
        const card = this.popCompanyCharacter(uuid);
        if (!this.addCompanyCharacterToCompany(companyId, "", card))
        {
            Logger.warn("Character " + uuid + " cannot join company " + companyId);
            return false;
        }
        else
            return true;
    }

     /**
      * Join a company
      * 
      * @param {String} uuid Character to join
      * @param {String} source 
      * @param {String} companyId target company
      * @param {String} playerId player id
      * @param {boolean} isResourceAsCharacter Is a resouce based company
      * @returns {Boolean} Success state
      */
    JoinCompany(uuid:string, source:string, companyId:string, playerId:string, isResourceAsCharacter:boolean)
    {
        if (source === "hand" || isResourceAsCharacter)
            return this.joinCompanyFromHand(uuid, companyId, playerId);
        else          
            return this.#joinCompanyFromBoard(uuid, companyId);
    }
  
      /**
       * Join another character -- only possible if character does not theirself has
       * other characters under direct influence
       * 
       * @param {String} uuid Character to join
       * @param {String} targetcharacter target host character
       * @param {String} targetCompany target company
       * @returns {String} Company Id
       */
    JoinCharacter(uuid:string, targetcharacter:string, targetCompany:string)
    {
        this.getOrCreateCharacter(uuid, targetCompany);

        const card = this.popCompanyCharacter(uuid);
        if (!this.addCompanyCharacterToCompany(targetCompany, targetcharacter, card))
        {
            const sNew = this.getCardCode(uuid, "Unknown character");
            Logger.warn("Character " + sNew + " cannot join company " + targetCompany);
            return false;
        }
        else
            return true;
    }
  

    ReadyCompanyCards(companyUuid:string)
    {
        if (!this.#companyExists(companyUuid))
            return;

        for (let _companyCharacter of this.#companies[companyUuid].characters)
        {
            super.readyCard(_companyCharacter.uuid);
            super.readyResources(_companyCharacter.uuid);

            for (let _characterInfuenced of _companyCharacter.influenced)
            {
                super.readyCard(_characterInfuenced);
                super.readyResources(_characterInfuenced);
            }
        }
    }
    /**
     * Get a characters current location
     * @param {String} uuid
     * @return {String} Location Code
     */
     #getCharactersCurrentLocation(uuid:string)
     {
         let _list, _companyCharacter;
         for (let key in this.#companies)
         {
             _list = this.#companies[key].characters;
             for (let i = 0; i < _list.length; i++)
             {
                _companyCharacter = this.#companies[key].characters[i];
                const _found = _companyCharacter.uuid === uuid;
                if (_found || this.#getCharactersCurrentLocationFromCompaniesCharacter(uuid, _companyCharacter.influenced))
                     return this.#companies[key].sites.current;
             }
         }
 
         return "";
     }

    #getCharactersCurrentLocationFromCompaniesCharacter(uuid:string, influenced:string[])
    {
        for (let _infUuid of influenced)
        {
            if (_infUuid === uuid)
                return true;
        }

        return false;
     }
 
     /**
      * Set the companies current location
      * @param {String} companyUuid
      * @param {String} sLocationCode
      * @returns {void} 
      */
      SetCompanyStartSite(companyUuid:string, sStart:string, vsRegions:string[], sTarget:string)
      {
          if (this.#companies[companyUuid] !== undefined)
          {
              const jCompanySites = this.#companies[companyUuid].sites;
              jCompanySites.current = sStart;
              jCompanySites.regions = vsRegions;
              jCompanySites.target = sTarget;
              jCompanySites.revealed = false;
          }
      }
   
     /**
      * Reveal company sites
      * @param {String} companyUuid
      * @returns {void} 
      */
      RevealCompanyDestinationSite(companyUuid:string)
      {
          if (this.#companyExists(companyUuid))
              this.#companies[companyUuid].sites.revealed = true;
      }
  
      CompanyArrivedAtDestination(companyUuid:string)
      {
          if (!this.#companyExists(companyUuid))
              return;
          
          const jCompanySites = this.#companies[companyUuid].sites;
          if (jCompanySites.target !== "")
          {
              jCompanySites.current = jCompanySites.target;
              jCompanySites.target = "";
          }
  
          jCompanySites.regions = [];
          jCompanySites.revealed = false;
      }

      CompanyReturnsToOrigin(companyUuid:string)
      {
          if (!this.#companyExists(companyUuid))
              return;
          
          let jCompanySites = this.#companies[companyUuid].sites;
          if (jCompanySites.target !== "")
              jCompanySites.target = "";
  
          jCompanySites.regions = [];
          jCompanySites.revealed = false;
      }
  
     /**
      * Add a hazard to a company location
      * @param {String} cardUuid
      * @param {String} companyUuid
      * @returns {success state} 
      */
    AddHazardToCompanySite(cardUuid:string, companyUuid:string)
    {
        if (!this.#companyExists(companyUuid))
        {
            Logger.warn("Cannot find company " + companyUuid);
            return false;
        }

        const vsSites = this.#companies[companyUuid].sites.attached;
        for (let _uuid of vsSites)
        {
            if (cardUuid === _uuid)
                return false;
        }

        vsSites.push(cardUuid);
        return true;
    }

    #popCompanyCharacter0(uuid:string)
    {
        const card = this.#popCompanyCharacterFromList(uuid);
        return card !== null ? card :  this.#popCompanyCharacterAny("", uuid, []);
    }

    #popCompanyCharacterFromList(uuid:string)
    {
        for (let companyId in this.#companies)
        {
            const _list = this.#companies[companyId].characters;
            for (let i = 0; i < _list.length; i++)
            {
                const _companyCharacter = this.#companies[companyId].characters[i];
                if (_companyCharacter.uuid === uuid) /** target character to is host, so only add its influenced characters */
                {
                    const card = this.#popCompanyCharacterAny(companyId, _companyCharacter.uuid, _companyCharacter.influenced);
                    _list.splice(i, 1);
                    return card;
                }
                else if (this.#popCompanyInfluencedCharacterAny(_companyCharacter.influenced, uuid)) /* check influenced characters and remove the target character from the list */
                    return this.#popCompanyCharacterAny(companyId, uuid, []);
            }
        }

        return null;
    }

    #popCompanyInfluencedCharacterAny(characterList:string[], uuid:string)
    {
        const len = characterList.length;
        for (let y = 0; y < len; y++)
        {
            if (characterList[y] === uuid)
            {
                characterList.splice(y, 1);
                return true;
            }
        }

        return false;
    }

    #popCompanyCharacterAny(sourceCompanyId:string, uuid:string, influenced:string[])
    {
        return {
            uuid: uuid,
            sourceCompany : sourceCompanyId,
            influenced : ([] as string[]).concat(influenced)
        };
    }

    /**
     * Remove a character from a company
     * 
     * @param {String} uuid Character UUID
     * @returns {json} { uuid: uuid, sourceCompany : "", influenced : [] }
     */
    popCompanyCharacter(uuid:string)
    {
        /**
         * Remove a character (and its influenced characters) form its company
         * @param {String} uuid
         * @returns {json} { uuid: uuid, sourceCompany : "", influenced : [] }
         */
        return this.#popCompanyCharacter0(uuid);
    }
    
    /**
      * Create a new company
      * 
      * @param {type} uuid Character UUID
      * @param {type} source 
      * @param {type} playerId
      * @returns {String} Company Id
      */
    CreateNewCompany(uuid:string, source:string, playerId:string)
    {
        if (uuid === "" || source === "" || playerId === "")
            return "";

        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
            return "";

        let vsInfluenced:string[] = [];
        let currentLocation = "";

        const companyId = this.obtainUniqueCompanyId();
        if (source === "hand")
        {
            pDeck.pop().fromAnywhere(uuid);
        }
        else
        {
            currentLocation = this.#getCharactersCurrentLocation(uuid);
            vsInfluenced = this.popCompanyCharacter(uuid).influenced;
        }

        this.#createNewCompanyWithCharacter(companyId, playerId, uuid, vsInfluenced, currentLocation);
       
        const pChar = this.getOrCreateCharacter(uuid, companyId);
        pChar.parentUuid = "";
        pChar.companyId = companyId;

        return companyId;
    }

  
    #createNewCompany(companyId:string, playerId:string, pCharacter:TCharacterInGame, startingLocation:string):TCompany
    {
        return {
            id : companyId,
            playerId : playerId,
            characters : [ pCharacter ],
            sites: {
                current: startingLocation,
                regions: [],
                target: "",
                attached: [],
                revealed: false
            }
        };
    }
  
    #createNewCompanyWithCharacter(companyId:string, playerId:string, hostUuid:string, listInfluencedUUids:string[], startingLocation:string)
    {
        this.#companies[companyId] = this.#createNewCompany(
            companyId, 
            playerId, 
            this.createCompanyCharacter(hostUuid, listInfluencedUUids), 
            startingLocation
        );

        return this.#companies[companyId];
    }
   
    /**
     * Get the company ids belonging to a given player id
     * 
     * @param {String} playerId
     * @returns {Array}
     */
    GetCompanyIds(playerId:string)
    {
        if (playerId === "") 
            return [];

        let list = [];
 
        for (let key in this.#companies) 
        {
            if (this.#companies[key].playerId === playerId)
                list.push(key);
        }
 
        return list;
    }
  
 
    #companyExists(uuid:string)
    {
        return typeof this.#companies[uuid] !== "undefined";
    }

    getCompanyById(companyId:string):TCompany|null
    {
        if(companyId === "" || this.#companies[companyId] === undefined)
            return null;
        else
            return this.#companies[companyId];
    }

    SliceResourceCharacterCompany(playerid:string, uuid:string)
    {
        const res = this.sliceResourceCharacterCompany(playerid, uuid);
        if (res === null)
            return "";

        const company = this.getCompanyById(res.companyid);
        if (company === null)
            return res.companyid;

        /** followers needing to join the company under direct influence (because host is being) */
        for (let cuid of res.followers)
            this.#joinCompanyFromBoard(cuid, res.companyid);

        /** remove given character */
        if (res.newcharacteruuid === "")
        {
            for (let i = 0; i < company.characters.length; i++)
            {
                if (company.characters[i].uuid === uuid) /** target character to is host, so only add its influenced characters */
                {
                    company.characters.splice(i, 1);
                    break;
                }
            }

            if (company.characters.length === 0)
                this.removeEmptyCompanies();
        }
        else /** update new host character */
        {
            for (let character of company.characters)
            {
                if (character.uuid === uuid)
                {
                    character.uuid = res.newcharacteruuid;
                    break;
                }
            }
        }

        return res.companyid;
    }
 
    GetCompanyAttachedLocationCards(companyId:string) : TCompanyLocationCard
    {
        const res:TCompanyLocationCard = {
            current: "",
            current_tapped : false,
            regions: [],
            target: "",
            target_tapped : false,
            attached : [],
            revealed : false
        };

        const pCompany = this.getCompanyById(companyId);
        if (pCompany === null)
            return res;

        let sOwnerId = pCompany.playerId;
        let jSites = pCompany.sites;
        let _list = [];
        
        for (let siteUuid of jSites.attached)
        {
            const _card = this.GetCardByUuid(siteUuid);
            if (_card !== null)
                _list.push(_card);
        }

        res.current = jSites.current;
        res.regions = jSites.regions;
        res.target = jSites.target;
        res.revealed = jSites.revealed;
        res.attached = _list;
        res.current_tapped = this.IsSiteTapped(sOwnerId, jSites.current);
        res.target_tapped = this.IsSiteTapped(sOwnerId, jSites.target);
                
        return res;
    }
     
    /**
     * Get the first company character card by company id
     * @param {String} companyId
     * @return json or null
     */
    GetFirstCompanyCharacterCardByCompanyId(companyId:string):TDeckCard | null
    {
        const pCompany = this.getCompanyById(companyId);
        if (pCompany === null)
        {
            Logger.warn("Cannot find company by its id " + companyId + " (GetFirstCompanyCharacterCardByCompanyId)");
            return null;
        }

        const vsChars = pCompany.characters;
        if (vsChars.length === 0)
            return null;
        else
            return this.GetCardByUuid(vsChars[0].uuid);
    }

    #addCharacter(jsonChar:TCharacterInGame, targetList:TCompanyCharacter[])
    {
        if (typeof jsonChar === "undefined" || typeof jsonChar.uuid === "undefined")
            return;

        const _card = this.GetCardByUuid(jsonChar.uuid);
        if (_card === null)
        {
            Logger.warn("Cannot get card from " + jsonChar.uuid);
            return;
        }

        const pChar = this.getCharacterByUuid(jsonChar.uuid);
        if (pChar === null)
        {
            Logger.warn("Cannot find character by id " + jsonChar.uuid);
            return;
        }

        const elem:TCompanyCharacter = {
            character : _card,
            attached : [],
            influenced : [] // in itself a list of characters (i.e. this elem field)
        };

        if (typeof pChar.attached !== "undefined" && pChar.attached.length > 0)
            elem.attached = this.toCardList(pChar.attached);

        if (typeof jsonChar.influenced !== "undefined")
        {
            for (let _uuid of jsonChar.influenced)
                this.#addCharacter({
                    uuid: _uuid, 
                    influenced: [],
                    sourceCompany: ""
                }, elem.influenced);
        }

        targetList.push(elem);
    }

    CompanyExists(id:string)
    {
        const pCompany = this.getCompanyById(id);
        return pCompany !== null;
    }

    /**
     * Obtain the company object by its company id. Returns
     * @param {String} companyId target id
     * @returns JSON 
     */
    GetFullCompanyByCompanyId(companyId:string)
    {
        const pCompany = this.getCompanyById(companyId);
        if (pCompany === null)
            return null;

        const company = {
            id : companyId,
            characters : [],
            sites : this.GetCompanyAttachedLocationCards(companyId),
            playerId : pCompany.playerId
        };

        for (let _char of pCompany.characters)
            this.#addCharacter(_char, company.characters);

        return company;
    }


    /**
     * Find the company of a given character under direct influence.
     * 
     * @param {String} characterUuid Character id to search amonst direct influence
     * @returns UUID String of empty string
     */
    findHostsCompany(characterUuid:string)
    {
        if (characterUuid === undefined || characterUuid === "")
            return "";

        for (let companyUuid in this.#companies)
        {
            for (let character of this.#companies[companyUuid].characters)
            {
                if (character.uuid === characterUuid)
                    return companyUuid;
            }
        }

        return "";
    }
}

