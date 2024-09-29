export default class JumbleCards 
{
    static #num = 0;

    static update(val = 0)
    {   
        if (JumbleCards.#num === val)
            return;

        JumbleCards.#num = val;
        JumbleCards.#updateCompanies(val);
        JumbleCards.#updateStages(val);
    }

    static #updateStages(val:number)
    {
        if (val === -1)
            val = JumbleCards.#num;

        const list = document.getElementsByClassName("staging-area-area");
        for (let elem of list as any)
            JumbleCards.#updateStageAraCards(elem, val);
    }

    static #updateCompanies(val:number)
    {
        const list = document.getElementsByClassName("company");
        for (let elem of list as any)
            JumbleCards.updateCompany(elem, val);
    }

    static updateCompany(company:any, val:number)
    {
        if (val === -1)
            val = JumbleCards.#num;

        JumbleCards.#updateCompanySites(company, val);
        JumbleCards.#updateCompanyChars(company, val);
    }

    static #updateCompanySites(company:any, val:number)
    {
        const list = company.querySelectorAll(".company-site-list div.card");
        for (let elem of list)
            JumbleCards.updateCompanyCard(elem, val, true);
    }

    static #updateStageAraCards(company:any, val:number)
    {
        const list = company.querySelectorAll("div.card");
        for (let elem of list)
            JumbleCards.#updateStageAraCard(elem, val);
    }
    static #updateCompanyChars(company:any, val:number)
    {
        const cards = company.querySelectorAll(".company-characters div.card");
        for (let card of cards)
            JumbleCards.updateCompanyCard(card, val, false);
    }

    static #calcRandom(max:number)
    {
        if (max < 1)
            return 0;

        return JumbleCards.#calcVal(max * 2) - max;
    }

    static #calcVal(roof:number)
    {
        return Math.floor(Math.random() * (roof+1))
    }

    static #calcRotation(conservative = true, isSites = false)
    {
        const max = JumbleCards.#getMaxRoration(conservative, isSites);
        return JumbleCards.#calcRandom(max);
    }

    static #calcTranslate(conservative = true, isSites = false)
    {
        const max = JumbleCards.#getMaxTranslate(conservative, isSites);
        return JumbleCards.#calcRandom(max);
    }

    static #getMaxRoration(conservative:boolean, isSites:boolean)
    {
        if (isSites)
            return conservative ? 1 : 3;
        else
            return conservative ? 1 : 4;
    }

    static #getMaxTranslate(conservative:boolean, isSites:boolean)
    {
        if (isSites)
            return conservative ? 5 : 10;
        else
            return conservative ? 5 : 15;
    }

    static #updateStageAraCard(card:any, val = -1)
    {
        if (val === -1)
            val = JumbleCards.#num;

        if (val < 1)
        {
            JumbleCards.#removeOptions(card);
            return;
        }
        
        const conservative = val === 1;
        
        if (JumbleCards.#updatePropertyX(conservative))
            card.style.setProperty("--jumble-translate-x", JumbleCards.#calcTranslate(conservative) + "px");
        else
            card.style.setProperty("--jumble-translate-x", "0px");

        if (JumbleCards.#updateProperty(conservative))
            card.style.setProperty("--jumble-translate-y", JumbleCards.#calcTranslate(conservative) + "px");
        else
            card.style.setProperty("--jumble-translate-y", "0px");

        card.classList.add("card-jumbled");
    }

    static updateCompanyCard(card:any, val = -1, isSites = false)
    {
        if (val === -1)
            val = JumbleCards.#num;

        if (val < 1)
        {
            JumbleCards.#removeOptions(card);
            return;
        }
        
        const conservative = val === 1;
        
        if (JumbleCards.#updatePropertyX(conservative))
            card.style.setProperty("--jumble-translate-x", JumbleCards.#calcTranslate(conservative, isSites) + "px");
        else
            card.style.setProperty("--jumble-translate-x", "0px");

        if (JumbleCards.#updateProperty(conservative))
            card.style.setProperty("--jumble-translate-y", JumbleCards.#calcTranslate(conservative, isSites) + "px");
        else
            card.style.setProperty("--jumble-translate-y", "0px");

        if (JumbleCards.#updateRotation(conservative))
            card.style.setProperty("--jumble-rotate", JumbleCards.#calcRotation(conservative, isSites) + "deg");
        else
            card.style.setProperty("--jumble-rotate", "0deg");
        
        card.classList.add("card-jumbled");
    }

    static #updatePropertyX(conservative:boolean)
    {
        const val = JumbleCards.#calcVal(10);
        return conservative ? val >= 4 : val > 3;
    }
    static #updateProperty(conservative:boolean)
    {
        const val = JumbleCards.#calcVal(10);
        return conservative ? val >= 5 : val > 3;
    }


    static #updateRotation(conservative:boolean)
    {
        const val = JumbleCards.#calcVal(20);
        return conservative ? false : val > 10;
    }

    static #removeOptions(card:any)
    {
        if (card && card.classList.contains("card-jumbled"))
            card.classList.remove("card-jumbled");
    }

    static init()
    {
        const val = sessionStorage.getItem("cards_jumble");
        if (typeof val !== "string" || val === "")
            return;

        const num = parseInt(val);
        if (!isNaN(num))
            JumbleCards.#num = num;
    }
}

JumbleCards.init()