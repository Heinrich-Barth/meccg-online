
/**
 * Show Underdeeps Map
 */
class MapViewUnderdeeps extends MapView {

    constructor(data)
    {
        super("underdeeps");

        this.sites = data.sites;
        this.images = data.images;
        this.alignments = data.alignments;
        this.codeStart = "";
        this.pCurrentObserver = null;
        this.targetSite = "";
    }

    getStartupLat()
    {
        return 66;
    }

    getStartLon()
    {
        return -90.800;
    }

    getZoomStart()
    {
        return 4;
    }

    getAdjacentSites(code)
    {
        return code === "" || code === undefined || this.sites[code] === undefined ? [] : this.sites[code];
    }

    getImage(code)
    {
        return code === "" || code === undefined || this.images[code] === undefined ? "" : this.images[code].image;
    }

    onClickAccept()
    {
        if (this.targetSite === null || this.targetSite === "")
        {
            this.onCancel();
            return;
        }

        let sStart, sTarget;
        if (this.codeStart === "")
        {
            sStart = this.targetSite;
            sTarget = "";
        }
        else
        {
            sStart = this.codeStart;
            sTarget = this.targetSite;
        }
        
        const data = {
            start : sStart,
            regions: ["dummyRegion"],
            target: sTarget
        }

        document.body.dispatchEvent(new CustomEvent("meccg-map-selected-movement", { "detail":  data }));
    }

    createImage(code, isTapped, isHidden)
    {
        let sUrl = this.getImage(code);
        if (sUrl === "")
            sUrl = "/data/backside";

        const sCss = isHidden === true ? "hidden" : "";
        
        const img = document.createElement("img");
        if (g_bSetImgAnonymous)
            img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("decoding", "async");
        if (isTapped !== true)
            img.setAttribute("class", "site-image " + sCss);
        else
            img.setAttribute("class", "site-image site-is-tapped " + sCss);

        if (isHidden === true)
        {
            img.setAttribute("src", "/data/backside");
            img.setAttribute("data-src", sUrl);
        }
        else
        {
            img.setAttribute("src", sUrl);
            img.setAttribute("data-src", sUrl);
        }

        img.setAttribute("data-code", code);
        img.setAttribute("title", code);
        img.onclick = this.insertTargetSite.bind(this);
        return img;
    }

    insertIntersector(pElement)
    {
        if (document.getElementById("help_observer") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "help_observer");
        div.innerHTML = "<p>&nbsp;</p>";
        pElement.appendChild(div);

        return div;
    }

    removeObserver()
    {
        if (this.pCurrentObserver !== null)
        {
            this.pCurrentObserver.disconnect();
            this.pCurrentObserver = null;
        }

        this.pCurrentObserverElement = null;
        DomUtils.remove(document.getElementById("help_observer"));
    }

    createObserver(pElement)
    {
        let elem = this.insertIntersector(pElement);
        this.pCurrentObserverElement = pElement;

        this.pCurrentObserver = new IntersectionObserver(this.onObserving.bind(this));

        this.pCurrentObserver.observe(elem);
    }

    insertTargetSite(e)
    {
        const code = e.target.getAttribute("data-code");
        const elem = document.getElementById("site_movement_target_site");
        if (elem !== null && code !== null)
        {
            DomUtils.removeAllChildNodes(elem);
            elem.appendChild(this.createImage(code, false, false));
            this.targetSite = code;
        }
    }

    onObserving(entries)
    {
        if (entries[0].intersectionRatio <= 0 || this.pCurrentObserverElement === null) 
            return;

        const list = this.pCurrentObserverElement.querySelectorAll(".hidden");
        if (list === null || list.length === 0)
        {
            this.removeObserver();
            return;
        }

        let len = list.length;
        if (len > 20)
            len = 20;

        for (let i = 0; i < len; i++)
        {
            let _img = list[i];
            _img.setAttribute("src", _img.getAttribute("data-src"));
            _img.classList.remove("hidden");
        }
    }

    appendCaption(elem, text)
    {
        const h2 = document.createElement("h2");
        h2.setAttribute("class", "colorOrange");
        h2.innerText = text;
        elem.appendChild(h2);
    }

    showStartSite(code)
    {
        const cont = document.getElementById("site_movement");
        const elem = document.getElementById("site_movement_start_site");

        if (cont === null || elem === null)
            return;

        if (code !== "")
            elem.appendChild(this.createImage(code, false, false));
        else
            cont.classList.add("movement-site-container-hide");

        cont.classList.remove("hide");
    }

    onCancel()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-cancel", { "detail":  "" }));
    }

    addCancelClick()
    {
        let elem = document.getElementById("movement_cancel");
        if (elem !== null)
            elem.onclick = this.onCancel;

        
        elem = document.getElementById("movement_accept");
        if (elem !== null)
            elem.onclick = this.onClickAccept.bind(this);
    }

    createResultListAlignments(list, limits)
    {
        let result = [];
        for (let elem of list)
        {
            if (this.alignmentMatch(elem, limits))
                result.push(elem);
        }

        result.sort();
        return result;
    }


    getAdditionalAlignKeys()
    { 
        return ["fallenwizard", "fallenlord", "lord", "grey", "dragonlord", "warlord", "elflord", "atanilord", "dwarflord"]; 
    }

    createSearchLimitations()
    {
        const keys = this.getAdditionalAlignKeys();
        const showAlignment = 
        {
            "hero": g_pRegionMapPreferences.showSite("hero"),
            "minion": g_pRegionMapPreferences.showSite("minion"),
            "balrog":  g_pRegionMapPreferences.showSite("balrog")
        }

        for(let key of keys)
            showAlignment[key] = g_pRegionMapPreferences.showSite(key);

        return showAlignment;
    }

    alignmentMatch(code, limits)
    {
        const align = this.alignments[code];
        return align === undefined || this.#alignmentMatches(align.toLowerCase(), limits);
    }

    #isAlignmentTrue(val, limits)
    {
        return limits[val] === true;
    }

    #alignmentMatches(align, limits)
    {
        switch(align)
        {
            case "dual":
                return this.#isAlignmentTrue("hero", limits) || this.#isAlignmentTrue("minion", limits);

            case "hero":
            case "minion":
            case "fallenwizard":
            case "balrog":
            case "elf":
            case "dwarf":
            case "lord":
            case "fallenlord":
            case "dragon":
                return this.#isAlignmentTrue(align, limits);

            case "dwarflord":
                return this.#isAlignmentTrue("dwarf", limits);

            case "elflord":
                return this.#isAlignmentTrue("elf", limits);

            case "atanilord":
            case "grey":
            case "warlord":
                return this.#isAlignmentTrue("lord", limits);

            case "dragonlord":
                return this.#isAlignmentTrue("dragon", limits);

            default:
                break;
        }

        return true;
    }    

    populateSites(startingCode)
    {
        this.codeStart = startingCode;
        const elem = document.getElementById("found_sites");
        if (elem === null)
            return;

        this.showStartSite(startingCode);
        this.addCancelClick();

        const limits = this.createSearchLimitations();
        const list = this.createResultListAlignments(this.getAdjacentSites(startingCode), limits);
        if (list.length === 0)
        {
            this.appendCaption(elem, "No adjacent sites available.");
        }
        else
        {
            if (startingCode !== "")
                this.appendCaption(elem, list.length + " adjacent site(s) from " + startingCode);
            else
                this.appendCaption(elem, list.length + " adjacent site(s)");

            for (let code of list)
                elem.appendChild(this.createImage(code));
        }

        const helpCont = document.createElement("div");
        helpCont.setAttribute("id", "allsites");

        let imageKeys = Object.keys(this.images);
        this.appendCaption(helpCont, "All other sites");

        let added = false;
        for (let code of imageKeys)
        {
            if (this.alignmentMatch(code, limits) && !list.includes(code))
            {
                added = true;
                helpCont.appendChild(this.createImage(code, false, true));
            }
        }

        if (added)
        {
            elem.appendChild(helpCont);
            this.createObserver(helpCont);
        }
            
        ArrayList(elem).find("img").each((_e) => CardPreview.initMapViewCard(_e));
    }

    onSearch(e)
    {
        const container = document.getElementById("allsites");
        if (container === null)
            return;

        const list = container.querySelectorAll("img");
        if (list === null || list.length === 0)
            return;

        const text = e.detail.text.toLowerCase();

        for (let image of list)
        {
            const show = text === "" || image.getAttribute("title").includes(text);
            if (show && image.classList.contains("hide"))
                image.classList.remove("hide");
            else if (!show && !image.classList.contains("hide"))
                image.classList.add("hide");
        }
    }
}