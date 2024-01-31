import { ICard } from "./Types";

export default class CardNameCodeSuggestions
{
    #stripQuote(input:string) 
    {
        return input.replace(/"/g, '');
    }

    #createCardMap(cards:ICard[])
    {
        let result:any = { };

        for (let card of cards)
        {
            const normalizedtitle = this.#stripQuote(card.normalizedtitle.toLowerCase());
            const code = this.#stripQuote(card.code.toLowerCase());

            if (typeof result[normalizedtitle] === "undefined")
                result[normalizedtitle] = [code];
            else if (!result[normalizedtitle].includes(code))
                result[normalizedtitle].push(code);
        }

        return result;
    }

    #sortMap(resultMap:any)
    {
        for (let key of Object.keys(resultMap))
            resultMap[key].sort();
    }

    static create(cards:ICard[])
    {
        const instance = new CardNameCodeSuggestions();
        const result = instance.#createCardMap(cards);
        instance.#sortMap(result);
        return result;
    }

}
