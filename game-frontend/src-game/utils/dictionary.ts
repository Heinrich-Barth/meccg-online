class Dictionary {

    static #instance = new Dictionary();
    
    #language = "en";

    // this dictionary data will be "replaced" with the correct content during startup
    #data:any = /*DO NOT CHANGE*/ {} 
    // this dictionary data will be "replaced" with the correct content during startup

    static get(key:string, defValue = "")
    {
        const val = Dictionary.#instance.#getValue(key);
        if (val !== "")
            return val;
        else
            return defValue;
    }

    #getValue(key:string)
    {
        const val = key ? this.#data[key] : "";
        return typeof val === "string" ? val : "";
    }

    #setLanguage(lang:string)
    {
        if (!this.#isValidLang(lang))
            lang = "en";

        document.body.classList.add("language-"+ lang);
        this.#language = lang;
    }

    #isValidLang(lang:string)
    {
        return lang === "es" || lang === "en" || lang === "fr";
    }

    static currentLangauge()
    {
        return Dictionary.#instance.#language;
    }

    static create()
    {
        Dictionary.#instance.#setLanguage("{LANG}");
    }

    #replaceInner(list:any)
    {
        for (let elem of list)
        {
            const val = elem.getAttribute("data-translation");
            const text = val ? this.#getValue(val) : "";
            if (text !== "")
                elem.innerText = text;
        }
    }

    #replacePlaceholder(list:any)
    {
        for (let elem of list)
        {
            const val = elem.getAttribute("data-translation-placeholder");
            const text = val ? this.#getValue(val) : "";
            if (text !== "")
                elem.setAttribute("placeholder", text);
        }
    }

    static replacePageData()
    {
        let matches = document.querySelectorAll("[data-translation]");
        if (matches)
            Dictionary.#instance.#replaceInner(matches);

        matches = document.querySelectorAll("[data-translation-placeholder]");
        if (matches)
            Dictionary.#instance.#replacePlaceholder(matches);
    }
}

Dictionary.create();
setTimeout(() => Dictionary.replacePageData(), 10);

export default Dictionary;