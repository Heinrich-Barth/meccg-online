import * as crypto from 'crypto';
import { DeckValidate, DeckValidateArda, DeckValidateSection } from '../plugins/Types';

const CHECKSUM_SECRET = typeof process.env.SECRET_DECKCHECKSUM !== "undefined" ? process.env.SECRET_DECKCHECKSUM : "" + Date.now();

const createDecklist = function(jDeck:DeckValidate|DeckValidateArda) : string
{
    const targetList:string[] = [];

    for (let key in jDeck)
        createSectionList(jDeck[key], key, targetList);

    targetList.sort();
    return targetList.join("");
};

const createSectionList = function(jDeck:DeckValidateSection, prefix:string, targetList:string[])
{
    for (let key in jDeck)
        targetList.push(prefix + jDeck[key] + key);
};

const createChecksum = function(input:string):string
{
    return crypto
        .createHmac('sha256', CHECKSUM_SECRET)
        .update(input, 'utf8')
        .digest('hex');
}

export default function CalculateChecksum(jDeck:DeckValidate|DeckValidateArda)
{
    const val = createDecklist(jDeck);
    return createChecksum(val);
}