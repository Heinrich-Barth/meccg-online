/**
 * Adds game card image functionality to the map. If shows card images and lists of site cards
 */
 class MapViewSiteImages  {

    constructor(jMap, tapped, listPreferredCodes)
    {
        this.CardPreview = CardPreview;
        this.CardList = CardList.createInstance(jMap.images, []);

        this._temp = null;
        this._preferredSites = MapViewSiteImages.verifySiteList(listPreferredCodes);
        this.tapped = tapped === undefined ? {} : tapped;
        this.jMap = jMap.map === undefined ? {} : jMap.map;
    }

    static verifySiteList(list)
    {
        if (!Array.isArray(list) || list.length === 0)
            return null;

        const result = { };
        for (let elem of list)
        {
            if (elem === "")
                continue;

            if (result[MapViewSiteImages.removeSetAlignment(elem)] === undefined)
                result[MapViewSiteImages.removeSetAlignment(elem)] = [elem];
            else
                result[MapViewSiteImages.removeSetAlignment(elem)].push(elem);
        }

        return result;
    }

    static removeSetAlignment(elem)
    {
        let pos = elem.indexOf(" [");
        if (pos !== -1)
            elem = elem.substring(0, pos).trim();

        pos = elem.indexOf(" (");
        if (pos !== -1)
            elem = elem.substring(0, pos).trim();

        return elem.toLowerCase();
    }

    isSiteTapped(code)
    {
        return code !== undefined && code !== "" && this.tapped[code] !== undefined;
    }

    createEntry(jEntry, isSite, region, siteSitle = "", alignment = "")
    {
        this._temp.push({ 
            code: jEntry["code"], 
            site: isSite === true, 
            isHero: alignment !== "minion",
            region: region,
            set_code: jEntry.set_code === undefined ? "" : jEntry.set_code,
            siteSitle : siteSitle === undefined ? "" : siteSitle,
            tapped : this.isSiteTapped(jEntry["code"])
        });
    }

    static getAdditionalAlignKeys()
    { 
        return ["fallenwizard", "fallenlord", "lord", "grey", "dragonlord", "warlord", "elflord", "atanilord", "dwarflord"]; 
    }

    static removeQuotes(sImage)
    {
        if (sImage.indexOf('"') === -1)
            return sImage;
        
        const len = sImage.length;
        for (let i = 0; i < len; i++)
        {
            if (sImage[i] === '"')
                sImage[i] = "_";
        }
        
        return sImage;
    }

    static getCardBacksideImageUrl()
    {
        return "/data/backside-region";
    }

    createInstance(showPreferredSites = true)
    {
        document.body.addEventListener("meccg-map-show-images", this.#onShowImages.bind(this), false);
        document.body.addEventListener("meccg-map-regioncontextclick", this.#onRegioncontextClick.bind(this), false);
        document.body.addEventListener("meccg-map-hide-images", this.#clearImageContainer.bind(this), false);
        document.body.addEventListener("meccg-map-search", this.onSearch.bind(this), false);

        document.body.classList.add("mapwindow");

        if (showPreferredSites && this._preferredSites !== null)
            setTimeout(this.injectPreferredSites.bind(this), 500);
    }

    #clearImageContainer()
    {
        const cont = document.getElementById("found_sites");
        if (cont === null)
            return;

        while (cont.firstChild) 
            cont.removeChild(cont.firstChild);
    }

    onSearch(e)
    {
        const region = e.detail.region === undefined ? "" : e.detail.region.trim();
        const text = e.detail.text === undefined ? "" : e.detail.text.trim();

        if (region !== "")
            this.showImages(region, text);
        else if (text !== "")
            this.showImagesSearchAll(text.toLowerCase());
    }

    showImages(region, site)
    {
        if (region === "" && site === "")
            return;
        
        const jRegion = this.jMap[region];
        if (jRegion === undefined)
            return;
            
        const showAlignment = this.createSearchLimitations();
        if (showAlignment.dreamcards || !region.dreamcard)
        {
            this.pushRegion(jRegion, region);
            for (let key in jRegion.sites)
            {
                if (site === "" || site === key)
                    this.getSiteImages(jRegion.sites[key], showAlignment, region, key);
            }
        }
       
        this.fillSiteList();
        this.lazyloadImages();

        document.body.dispatchEvent(new CustomEvent("meccg-map-show-images-done", { "detail":  "found_sites" }));
    }

    #toTogglePreferredSitesContainer(shallOpen)
    {
        const elem = document.getElementById("preferred-sites-toggle-toggle");
        const div = document.getElementById("sites_preferred");
        if (div === null || elem === null)
            return;

        if (!shallOpen)
        {
            elem.classList.remove("fa-compress");
            elem.classList.add("fa-expand");
            div.classList.add("preferred-sites-container-close")
            localStorage.setItem("map_pref_open", "false");
        }
        else 
        {   
            elem.classList.remove("fa-expand");
            elem.classList.add("fa-compress");
            div.classList.remove("preferred-sites-container-close")
            localStorage.setItem("map_pref_open", "true");
        }
    }

    #togglePreferredSitesContainer()
    {
        const elem = document.getElementById("preferred-sites-toggle-toggle");
        if (elem === null)
            return;

        const shallOpen = !elem.classList.contains("fa-compress");
        this.#toTogglePreferredSitesContainer(shallOpen);
    }

    #isVisible()
    {
        return "false" !== localStorage.getItem("map_pref_open");
    }

    createPreferredSitesContainer()
    {
        const isVisible = this.#isVisible();

        const elem = document.createElement("div");
        elem.setAttribute("class", "preferred-sites-container blue-box " + (isVisible ? "" : "preferred-sites-container-close"));
        elem.setAttribute("id", "sites_preferred");

        const h2 = document.createElement("h2");
        h2.innerText = "Choose from your preferred sites";

        const p = document.createElement("p");
        p.innerText = "You can also close this overlay by clicking in the background of this box.";

        const toggleLink = document.createElement("div");
        toggleLink.setAttribute("id", "preferred-sites-toggle-toggle");
        toggleLink.setAttribute("class","preferred-sites-toggle-toggle fa " + (isVisible ? "fa-compress" : "fa-expand"));
        toggleLink.setAttribute("title", "Toggle visibility");
        toggleLink.onclick = this.#togglePreferredSitesContainer.bind(this);

        const toggle = document.createElement("div")
        toggle.setAttribute("class", "preferred-sites-toggle");
        toggle.append(toggleLink);

        elem.append(toggle, h2, p);
        return elem;
    }

    insertPreferredSites(container, mapSites)
    {
        const elemList = document.createElement("div");
        elemList.setAttribute("class", "preferred-image-list");

        const candidates = Object.keys(mapSites);
        const list = [];

        for (let region in this.jMap)
        {
            const jRegion = this.jMap[region];
            for (let key in jRegion.sites)
            {
                const title = key.toLowerCase();
                if (!candidates.includes(title))
                    continue;

                list.push({
                    title: title,
                    codes: mapSites[title],
                    region: region,
                    key: key
                });
            }
        }

        list.sort((a, b) => a.title.localeCompare(b.title));

        for (let elem of list)
        {
            for (let code of elem.codes)
            {
                const img = this.createImage(code, true, elem.region, elem.key, this.isSiteTapped(code));
                img.setAttribute("src", img.getAttribute("data-src"));
                img.classList.add("card-icon");
                img.setAttribute("title", "Click to choose this card " + code);
                elemList.appendChild(img);   
            }
        }

        container.appendChild(elemList);
    }

    injectPreferredSites()
    {
        const container = this.createPreferredSitesContainer();
        this.insertPreferredSites(container, this._preferredSites);
        this.CardPreview.initGeneric(container);
        document.body.appendChild(container);
    }

    showImagesSearchAll(text)
    {
        const showAlignment = this.createSearchLimitations();

        for (let region in this.jMap)
        {
            const jRegion = this.jMap[region];
            for (let key in jRegion.sites)
            {
                if (key.toLowerCase().indexOf(text) !== -1)
                    this.getSiteImages(jRegion.sites[key], showAlignment, region, key);
            }
        }

        this.fillSiteList();
        this.lazyloadImages();

        document.body.dispatchEvent(new CustomEvent("meccg-map-show-images-done", { "detail":  "found_sites" }));
    }

    #onShowImages(e)
    {
        const region = e.detail.region === undefined ? "" : e.detail.region;
        const site = e.detail.site === undefined ? "" : e.detail.site;

        this.showImages(region, site);
    }

    #onRegioncontextClick(e)
    {
        if (!e.detail.region)
            return;

        const region = e.detail.region;
        const jRegion = this.jMap[region];
        if (!jRegion?.code)
            return;

        const image = this.CardList.getImageRegion(jRegion.code);;
        document.body.dispatchEvent(new CustomEvent("meccg-map-siteclick", { "detail":  {
            region: region,
            code: jRegion.code,
            imgage: image,
            isSite : false,
            title : region
        } }));
    }

    createImage(code, isSite, region, siteTitle, isTapped)
    {
        const sType = isSite ? "site" : "location";
        const sTitle = siteTitle === "" ? region : siteTitle;
        const sUrl = isSite ? this.CardList.getImageSite(code) : this.CardList.getImageRegion(code);
        
        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        if (g_bSetImgAnonymous)
            img.setAttribute("crossorigin", "anonymous");

        if (isTapped !== true)
            img.setAttribute("class", "site-image");
        else
            img.setAttribute("class", "site-image site-is-tapped");

        img.setAttribute("data-src", sUrl);
        img.setAttribute("src", MapViewSiteImages.getCardBacksideImageUrl());
        img.setAttribute("data-code", code);
        img.setAttribute("data-location-type", sType);
        img.setAttribute("title", sTitle);
        img.setAttribute("data-site", sTitle)
        img.setAttribute("data-region", region)
        img.onclick = this.onClickCard.bind(this);
        return img;
    }

    onClickCard(e)
    {
        const elem = e.target;
        const image = elem.getAttribute("src");
        const code = elem.getAttribute("data-code");
        const isSite = "site" === elem.getAttribute("data-location-type");
        const regionName = elem.getAttribute("data-region");
        const title = elem.getAttribute("data-site");
        document.body.dispatchEvent(new CustomEvent("meccg-map-siteclick", { "detail":  {
            region: regionName,
            code: code,
            imgage: image,
            isSite : isSite,
            title : title
        } }));
    }

    createSearchLimitations()
    {
        const keys = MapViewSiteImages.getAdditionalAlignKeys();
        const showAlignment = 
        {
            "hero": g_pRegionMapPreferences.showSite("hero"),
            "minion": g_pRegionMapPreferences.showSite("minion"),
            "balrog":  g_pRegionMapPreferences.showSite("balrog"),
            "dreamcards": g_pRegionMapPreferences.showDreamcards()
        }

        for(let key of keys)
            showAlignment[key] = g_pRegionMapPreferences.showSite(key);

        return showAlignment;
    }

    verifyTempArray()
    {
        if (this._temp === null)
            this._temp = [];
    }

    pollCardResultList()
    {
        if (this._temp === null || this._temp.length === 0)
            return [];
    
        /** first element is always the region */
        const _region = this._temp[0].site === false ? this._temp.shift() : null;
        const _res = this.#sortSiteResult(this._temp);
        this._temp = null;

        /** add region if available */
        if (_region !== null)
            _res.unshift(_region);

        return _res;
    }

    #sortSiteResult(list)
    {
        list.sort((a, b) => a.code < b.code ? -1 : 1);

        const type = sessionStorage.getItem("site_order");
        if (type !== "hero" && type !== "minion")
            return list;

        const listHero = [];
        const listMinion = [];

        const prefHero = type === "hero";
        for (let card of list)
        {
            if (card.isHero)
                listHero.push(card);
            else
                listMinion.push(card);
        }

        if (prefHero)
            return [...listHero, ...listMinion]
        else
            return [...listMinion, ...listHero]
    }

    pushRegion(j, region)
    {
        this.verifyTempArray();
        if (j !== undefined)
            this.createEntry(j, false, region);
    }

    /**
     * Add a site image
     * @param {JSON} j Site entry
     * @param {JSON} showAlignment Show alignments
     * @param {String} region Region
     * @param {String} site Site
     */
    getSiteImages(j, showAlignment, region, site)
    {
        this.verifyTempArray();
        const showDC = showAlignment.dreamcards === true;

        if (typeof j.hero !== "undefined" && showAlignment.hero && (showDC || !j.hero.dreamcard))
            this.createEntry(j.hero, true, region, site);

        if (typeof j.minion !== "undefined" && showAlignment.minion && (showDC || !j.minion.dreamcard))
            this.createEntry(j.minion, true, region, site, "minion");

        if (typeof j.balrog !== "undefined" && showAlignment.balrog && (showDC || !j.balrog.dreamcard))
            this.createEntry(j.balrog, true, region, site);

        const keys = MapViewSiteImages.getAdditionalAlignKeys();
        for(let key of keys)
        {
            if (typeof j[key] !== "undefined" && showAlignment[key] && (showDC || j[key].dreamcard === showDC))
                this.createEntry(j[key], true, region, site);
        }
    }

    lazyloadImageClasses(sSelector)
    {
        const list = document.querySelectorAll(sSelector);
        if (list === null || list.length === 0)
            return;

        const len = list.length;
        for (let i = 0; i < len; i++)
        {
            const _src = list[i].getAttribute("data-src");
            if (_src !== undefined && _src !== null && _src !== "")
            {
                list[i].setAttribute("src", list[i].getAttribute("data-src"));
                list[i].setAttribute("data-src", "");

                this.CardPreview.initMapViewCard(list[i]);
            }
        }
    }
    
    lazyloadImages()
    {
        setTimeout(() => this.lazyloadImageClasses("img.site-image"), 50);
        setTimeout(() => this.lazyloadImageClasses("img.site-is-tapped"), 50);
    }

    destroy()
    {
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
    }

    fillSiteList()
    {
        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));

        const res = this.pollCardResultList();
        if (res.length === 0)
            return;
        
        const codes = [];
        const jTarget = document.getElementById("found_sites");
        for (let _card of res)
        {
            if (g_pRegionMapPreferences.showSiteSet(_card.set_code) && !codes.includes(_card.code))
            {
                jTarget.appendChild(this.createImage(_card.code, _card.site, _card.region, _card.siteSitle, _card.tapped));
                codes.push(_card.code);
            }
        }

        if (jTarget.classList.contains("hidden"))
            jTarget.classList.remove("hidden")
    }
}