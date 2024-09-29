import Dictionary from "./dictionary";

declare const GamePreferences:any;

type CardMap = {
    [key:string]:string
}

interface CardImage {
    image:string;
    ImageNameErrataDC?:string;
    errata_dc?:string;
    errata_ic?:string;
}
interface CardImageMap {
    [key:string]:CardImage
}


/**
 * Card Image Files
 * 
 * @param {json} jsonCardList 
 */
export class CardListImpl {

    #imageBacksideDefault = "/data/backside";
    #imageNotFound = "/data/card-not-found-generic";
    #imageNotFoundRegion = "/data/card-not-found-region";
    #imageNotFoundSite = "/data/card-not-found-site";
    #isReady = false;

    #list:CardImageMap;
    #fliped:CardMap;
    #useImagesDC;
    #useImagesIC;

    static INSTANCE = new CardListImpl();

    constructor(images:CardImageMap = {}, quests:CardMap = {}, useImagesDC = true, useImagesIC = true) {
        this.#list = images === undefined ? {} : images;
        this.#fliped = quests === undefined ? {} : quests;
        this.#useImagesDC = useImagesDC === undefined ? true : useImagesDC;
        this.#useImagesIC = useImagesIC === undefined ? false : useImagesIC;

        if (document.body.hasAttribute("data-use-dce") && document.body.getAttribute("data-use-dce") === "false")
            this.#useImagesDC = false;        
    }

    static #createFromLocalstorage(images = {}, quests = {}, useImagesDC = true, useImagesIC = true)
    {
        if (localStorage.getItem("game_data") === null)
            return null;

        try {
            const cards = JSON.parse(localStorage.getItem("game_data")!).images;
            images = cards.images;
            if (cards.fliped !== undefined)
                quests = cards.fliped;

            const instance = new CardListImpl(images, quests, useImagesDC, useImagesIC);
            instance.#onUpdateImagesLoaded();

            return instance;
        }
        catch (err) {
            console.error(err);
        }
    
        return null;
    }

    static createInstance(images = {}, quests = {}, useImagesDC = true, useImagesIC = true)
    {
        const val = CardListImpl.#createFromLocalstorage(images, quests, useImagesDC, useImagesIC);
        if (val !== null)
        {
            CardListImpl.INSTANCE = val;
            return;
        }

        CardListImpl.INSTANCE = new CardListImpl(images, quests, useImagesDC, useImagesIC);
        fetch("/data/list/images")
            .then((response) => response.json())
            .then(CardListImpl.INSTANCE.#onCardsReceived.bind(CardListImpl.INSTANCE))
            .catch(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("warn_fetchimage", "Could not fetch image list.") })))
            .finally(CardListImpl.INSTANCE.#onUpdateImagesLoaded.bind(CardListImpl.INSTANCE));
    }

    #onCardsReceived(cards:{images:any, fliped:any})
    {
        this.#list = cards.images;
        if (cards.fliped !== undefined)
            this.#fliped = cards.fliped;
    }

    #onUpdateImagesLoaded()
    {
        this.#isReady = true;

        let div:any, code:string, src:string;
        const list:any = document.body.querySelectorAll("img");
        if (list === null)
            return;
        
        for (let img of list)
        {
            if (!img.hasAttribute("data-uuid") && !img.hasAttribute("data-id"))
                continue;

            div = img.hasAttribute("data-uuid") ? img.parentElement : img;
            code = div.hasAttribute("data-card-code") ? div.getAttribute("data-card-code") : "";

            if (code === "" && div.hasAttribute("data-id"))
                code = div.getAttribute("data-id");

            if (!code)
                continue;

            src = this.getImageByCode(code, "");
            if (src)
                img.setAttribute("src", src);
        }
    }

    isReady() {
        return this.#isReady;
    }

    getImage(code:string) {
        return this.getImageByCode(code, this.#imageNotFound);
    }

    getImageSite(code:string) {
        return this.getImageByCode(code, this.#imageNotFoundSite);
    }

    getImageRegion(code:string) {
        return this.getImageByCode(code, this.#imageNotFoundRegion);
    }

    getBackside() {
        return this.#imageBacksideDefault;
    }

    getFlipSide(code:string) {
        code = this.removeQuotes(code);
        const sBacksideCode = this.#fliped[code];
        if (sBacksideCode === undefined)
            return this.#imageBacksideDefault;
        else
            return this.getImage(sBacksideCode);
    }

    setUseImagesDC(bUse:boolean) {
        this.#useImagesDC = bUse !== false;
    }

    useImagesDC() {
        return typeof GamePreferences === "undefined" ? this.#useImagesDC : GamePreferences.useImagesDC();
    }
    useImagesIC() {
        return typeof GamePreferences === "undefined" ? this.#useImagesIC : GamePreferences.useImagesIC();
    }

    getImageByCode(code:string, sDefault:string) {
        code = this.removeQuotes(code);

        if (code === "" || typeof this.#list[code] === "undefined" || typeof this.#list[code].image === "undefined")
            return sDefault;

        const image:CardImage = this.#list[code];
        if (this.useImagesDC()) {
            let _url = this.#getImageErratumDc(image);
            if (_url !== undefined && _url !== "")
                return _url;
        }
        else if (this.useImagesIC() && image.errata_ic !== undefined && image.errata_ic !== "")
            return image.errata_ic;

        return this.getLocalisedImage(image.image);
    }

    getLocalisedImage(image:string) {
        if (typeof image !== "string" || image === "" || sessionStorage.getItem("cards_es") !== "yes")
            return image;

        if (image.indexOf("/en-remaster/") === -1)
            return image;
        else
            return image.replace("/en-remaster/", "/es-remaster/");
    }


    #getImageErratumDc(image:CardImage) {
        if (image.ImageNameErrataDC !== undefined && image.ImageNameErrataDC !== "")
            return image.ImageNameErrataDC;
        else if (image.errata_dc !== undefined && image.errata_dc !== "")
            return image.errata_dc;
        else
            return "";

    }

    #removeSetInformation(_code:string) {
        let nPos = _code.lastIndexOf("(");
        if (nPos === -1)
            return _code;
        else
            return _code.substring(0, nPos + 1);
    }

    getMostRecentCardCode(_code:string) {
        _code = this.#removeSetInformation(_code);
        for (let key in this.#list) {
            if (key.startsWith(_code))
                return key;
        }

        return "";
    }

    getSafeCode(code:string) {
        return this.removeQuotes(code);
    }

    removeQuotes(sCode:string) {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, "");
    }

}

export default function CardList() {
    return CardListImpl.INSTANCE;
}