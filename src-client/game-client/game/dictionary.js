class Dictionary {

    static #instance = new Dictionary();

    // this dictionary data will be "replaced" with the correct content during startup
    #data = /*DO NOT CHANGE*/ {} 
    // this dictionary data will be "replaced" with the correct content during startup

    static get(key, defValue = "")
    {
        const val = Dictionary.#instance.#getValue(key);
        if (val !== "")
            return val;
            
        console.warn("Cannot find translation for key #", key);
        return defValue;
    }

    #getValue(key)
    {
        const val = key ? this.#data[key] : "";
        return typeof val === "string" ? val : "";
    }

    #setLanguage(lang)
    {
        if (!this.#isValidLang(lang))
            lang = "en";

        document.body.classList.add("language-"+ lang);
    }

    #isValidLang(lang)
    {
        return lang === "es" || lang === "en" || lang === "fr";
    }

    static create()
    {
        Dictionary.#instance.#setLanguage("{LANG}");
    }

    #replaceInner(list)
    {
        for (let elem of list)
        {
            const val = elem.getAttribute("data-translation");
            const text = val ? this.#getValue(val) : "";
            if (text !== "")
                elem.innerText = text;
        }
    }

    #replacePlaceholder(list)
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