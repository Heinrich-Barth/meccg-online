
class UnknownCardsUpdate {

    #queriesImages = { }
    #refreshTimer = null;
    #counter = 0;

    static #instance = new UnknownCardsUpdate();

    static get()
    {
        return UnknownCardsUpdate.#instance;
    }

    async register(code)
    {
        try
        {
            if (typeof g_sApiKey !== "string" || typeof g_sRoom !== "string")
                throw new Error("Invalid quirements");

            const res = await fetch("/data/list/image", {
                headers: {
                    "X-api-key": g_sApiKey,
                    "X-api-room": g_sRoom,
                    "X-api-code": code
                }
            });

            if (!res.ok)
                throw new Error("Could not fetch image");

            const json = await res.json();
            if (!json.image)
                throw new Error("Could not get image by code");
            
            this.#queriesImages[code] = json.image;
            
            this.#counter = 0;
            if (!this.#refreshTimer)
                this.#refreshTimer = setInterval(this.#onRefreshImages.bind(this), 1000);

            return {
                code: code,
                image: json.image
            }
        }
        catch (err)
        {
            console.warn(err);
        }

        return {
            code: code,
            image: ""
        }
    }

    #onRefreshImages()
    {
        const images = document.body.getElementsByTagName("img");
        if (images === null || images.length === 0)
        {
            this.#clearTimeout(true);
            return;
        }

        const found = [];
        for (let image of images)
            this.#updateImageSrc(image, found);

        for (let key of found)
        {
            if (this.#queriesImages[key])
                delete this.#queriesImages[key];
        }

        this.#clearTimeout(Object.keys(this.#queriesImages).length === 0);
    }

    #getCodeFromImage(image)
    {
        const code = image.parentElement?.getAttribute("data-card-code");
        if (code)
            return code;

        return image.getAttribute("data-id") ?? "";
    }

    #updateImageSrc(image, found)
    {
        const code = this.#getCodeFromImage(image);
        if (!code)
            return;

        const val = this.#queriesImages[code];
        if (!val)
            return;

        let remove = false;
        const src = image.getAttribute("src");
        if (src && (src === "/data/backside" || src.startsWith("/data/card-")))
        {
            remove = true;
            image.setAttribute("src", val);
        }
        
        const backside = image.getAttribute("data-image-backside");
        if (backside && (backside === "/data/backside" || backside.startsWith("/data/card-")))
        {
            remove = true;
            image.setAttribute("data-image-backside", val);
        }

        if (remove)
            found.push(code);
    }

    #clearTimeout(force = true)
    {
        if (force)
            this.#counter = 10;
        else
            this.#counter++;

        if (this.#counter >= 10)
        {
            clearInterval(this.#refreshTimer);
            this.#refreshTimer = null;
            this.#counter = 0;
        }
    }

}

/**
 * Card Image Files
 * 
 * @param {json} jsonCardList 
 */
class CardList {

    static #imageBacksideDefault = "/data/backside";
    static #imageNotFound = "/data/card-not-found-generic";
    static #imageNotFoundRegion = "/data/card-not-found-region";
    static #imageNotFoundSite = "/data/card-not-found-site";
    static #frUrl = "";

    #isReady = false;
    #list;
    #fliped;
    #useImagesDC;
    #useImagesIC;
    #keys = null;
    
    constructor(images = {}, quests = [], useImagesDC = true, useImagesIC = true) {
        this.#list = images === undefined ? {} : images;
        this.#fliped = quests === undefined ? [] : quests;
        this.#useImagesDC = useImagesDC === undefined ? true : useImagesDC;
        this.#useImagesIC = useImagesIC === undefined ? false : useImagesIC;

        if (document.body.hasAttribute("data-use-dce") && document.body.getAttribute("data-use-dce") === "false")
            this.#useImagesDC = false;        
    }

    static #createFromLocalstorage(images = {}, quests = [], useImagesDC = true, useImagesIC = true)
    {
        if (localStorage.getItem("game_data") === null)
            return null;

        try {
            const cards = JSON.parse(localStorage.getItem("game_data")).images;
            images = cards.images;
            if (cards.fliped !== undefined)
                quests = cards.fliped;

            const instance = new CardList(images, quests, useImagesDC, useImagesIC);
            instance.#onUpdateImagesLoaded();

            return instance;
        }
        catch (err) {
            console.warn(err);
        }
    
        return null;
    }

    static createInstance(images = {}, quests = [], useImagesDC = true, useImagesIC = true)
    {
        const val = CardList.#createFromLocalstorage(images, quests, useImagesDC, useImagesIC);
        if (val !== null)
            return val;

        const instance = new CardList(images, quests, useImagesDC, useImagesIC);
        const sVal = "m" + new Date().getMonth();
        fetch("/data/fr")
            .then((response) => {
                if (response.ok)
                    return response.json();

                return { value: "" };
            })
            .then((json) => {
                if (json.value)
                    CardList.#frUrl = json.value;
            })
            .catch(console.warn)
            .finally(() => {
                fetch("/data/list/images?t=" + sVal)
                .then((response) => response.json())
                .then(instance.#onCardsReceived.bind(instance))
                .catch(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("warn_fetchimage", "Could not fetch image list.") })))
                .finally(instance.#onUpdateImagesLoaded.bind(instance));
            });

        return instance;
    }

    #onCardsReceived(cards)
    {
        this.#list = cards.images;
        if (cards.fliped !== undefined)
            this.#fliped = cards.fliped;
    }

    #onUpdateImagesLoaded()
    {
        this.#isReady = true;

        let div, code, src;
        const list = document.body.querySelectorAll("img");
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

    getImage(code) {
        return this.getImageByCode(code, CardList.#imageNotFound);
    }

    getImageSite(code) {
        return this.getImageByCode(code, CardList.#imageNotFoundSite);
    }

    getImageRegion(code) {
        return this.getImageByCode(code, CardList.#imageNotFoundRegion);
    }

    #prepareSearchCodes()
    {
        if (this.#keys !== null)
            return;

        const res = { };
        for (let code of Object.keys(this.#list))
        {
            let name = code;
            let pos = name.lastIndexOf(" [");
            let posEnd = pos === -1 ? -1 : name.lastIndexOf("]")
            if (posEnd > 0)
            {
                const left = name.substring(0, pos);
                const right = name.substring(posEnd+1);
                name = left + right;
            }

            res[name] = true;
        }
        
        this.#keys = Object.keys(res);
    }

    searchByName(name)
    {
        if (name === "")
            return [];

        this.#prepareSearchCodes();

        const listStart = [];
        const listMid = []

        for (let code of this.#keys)
        {
            if (code.startsWith(name))
                listStart.push({ code: code, image: this.#list[code].image })
            else if (code.includes(name))
                listMid.push({ code: code, image: this.#list[code].image })
        }

        return listStart.concat(listMid);
    }

    getBackside() {
        return CardList.#imageBacksideDefault;
    }

    getFlipSide(code) {
        code = this.removeQuotes(code);
        let sBacksideCode = this.#fliped[code];
        if (sBacksideCode === undefined)
            return CardList.#imageBacksideDefault;
        else
            return this.getImage(sBacksideCode);
    }

    setUseImagesDC(bUse) {
        this.#useImagesDC = bUse !== false;
    }

    useImagesDC() {
        return typeof GamePreferences === "undefined" ? this.#useImagesDC : GamePreferences.useImagesDC();
    }
    useImagesIC() {
        return typeof GamePreferences === "undefined" ? this.#useImagesIC : GamePreferences.useImagesIC();
    }

    #registerUnknownCode(code)
    {
        UnknownCardsUpdate.get().register(code).then(data => 
        {
            if (data?.code && data?.image && !this.#list[data.code])
            {
                this.#list[data.code] = {
                    image: data.image
                }
            }
        });
    }

    getImageByCode(code, sDefault) {
        code = this.removeQuotes(code);

        if (code === "" || typeof this.#list[code] === "undefined" || typeof this.#list[code].image === "undefined")
        {
            this.#registerUnknownCode(code);
            return sDefault;
        }

        const image = this.#list[code];
        if (this.useImagesDC()) {
            let _url = this.#getImageErratumDc(image);
            if (_url !== undefined && _url !== "")
                return _url;
        }
        else if (this.useImagesIC() && image.errata_ic !== undefined && image.errata_ic !== "")
            return image.errata_ic;

        return this.getLocalisedImage(image.image);
    }

    getLocalisedImage(image) {
        
        if (typeof image !== "string" || image === "" || image.indexOf("/en-remaster/") === -1)
            return image;

        const lang = localStorage.getItem("meccg_cards") ?? "";
        if (lang === "")
            return image;

        if (lang === "cards-es")
            return image.replace("/en-remaster/", "/es-remaster/");
        
        if (lang === "cards-fr" && CardList.#frUrl)
        {
            const parts = image.split("/en-remaster/");
            if (parts.length === 2)
                return CardList.#frUrl + "/" + parts[1];
        }
        
        return image;
    }


    #getImageErratumDc(image) {
        if (image.ImageNameErrataDC !== undefined && image.ImageNameErrataDC !== "")
            return image.ImageNameErrataDC;
        else if (image.errata_dc !== undefined && image.errata_dc !== "")
            return image.errata_dc;
        else
            return "";

    }

    #removeSetInformation(_code) {
        let nPos = _code.lastIndexOf("(");
        if (nPos === -1)
            return _code;
        else
            return _code.substring(0, nPos + 1);
    }

    getMostRecentCardCode(_code) {
        _code = this.#removeSetInformation(_code);
        for (let key in this.#list) {
            if (key.startsWith(_code))
                return key;
        }

        return "";
    }

    getSafeCode(code) {
        return this.removeQuotes(code);
    }

    removeQuotes(sCode) {
        if (sCode.indexOf('"') === -1)
            return sCode;
        else
            return sCode.replace(/"/g, "");
    }

}