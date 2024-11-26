
class GamePreferences extends Preferences {

    getGameCss()
    {
        return "config-wrapper-game";
    }

    setBackgroundImage(sNew)
    {
        if (sNew === undefined || sNew === "" || document.body.classList.contains(sNew))
            return false;

        document.body.classList.add(sNew)

        let list = document.body.classList;
        for (let _name of list)
        {
            if (_name !== sNew && _name.indexOf("bg-") === 0)
                document.body.classList.remove(_name);
        }

        return true;
    }

    isAdmin()
    {
        return g_sLobbyToken !== "";
    }

    #togglePhases(isActive)
    {
        const elem = document.getElementById("progression-phase-box");
        if (elem === null)
            return;

        if (isActive)
            elem.classList.add("taskbar-icons-reduced");
        else if (elem.classList.contains("taskbar-icons-reduced"))
            elem.classList.remove("taskbar-icons-reduced");
    }

    #dices()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-dice-chooser"));
    }
    
    #useSmallCardPreview()
    {
        return sessionStorage.getItem("cards_smallprev");
    }

    #toggleSmallPreview(isActive)
    {
        if (isActive)
            sessionStorage.setItem("cards_smallprev", "1");
        else if (this.#useSmallCardPreview())
            sessionStorage.removeItem("cards_smallprev");
        
        this.#toggleCardPreview(!isActive);
    }


    #getJumbleCardsVal()
    {
        const candidate = sessionStorage.getItem("cards_jumble");
        const val = candidate ?? "";
        if (val !== "")
            return parseInt(val);
        else
            return 0;
    }

    #jumbleCards(val)
    {
        const num = val ? parseInt(val) : 0;
        if (num >= 0)
        {
            sessionStorage.setItem("cards_jumble", num);
            JumbleCards.update(num);
        }
    }

    #zoomChange(val)
    {
        const rem = [];
        let add = "";

        const num = parseInt(val);
        if (num === 2)
        {
            rem.push("zoom-1");
            add = "zoom-2";
        }
        else if (num === 1)
        {
            rem.push("zoom-2");
            add = "zoom-1";
        }
        else 
        {
            rem.push("zoom-1");
            rem.push("zoom-2");
        }

        if (add !== "")
            document.body.classList.add(add);

        for (let elem of rem)
        {
            if (document.body.classList.contains(elem))
                document.body.classList.remove(elem)
        }
    }

    #toggleStackStage(isActive)
    {
        this.#toggleClass(document.querySelector(".table"), isActive, "table-stage-stacking");
    }

    #toggleClass(elem, isActive, className)
    {
        if (elem === null || className === "")
            return;

        if (isActive && !elem.classList.contains(className))
            elem.classList.add(className);
        else if (!isActive && elem.classList.contains(className))
            elem.classList.remove(className);
    }

    #toggleAlignCompaniesLeft(isActive)
    {
        this.#toggleClass(document.querySelector(".table"), isActive, "table-companies-left");
    }

    #toggleTouchHelper(isActive)
    {
        this.#toggleClass(document.body, isActive, "force-mobile-helper");
    }

    #toogleDrawDeckClick(isActive)
    {
        const key = "draw_onclick_deck";
        if (isActive)
            localStorage.setItem(key, "1");
        else if (localStorage.getItem(key))
            localStorage.removeItem(key);
        
        this.#toggleCardPreview(!isActive);
    }

    #doToggleDrawDeckClick()
    {
        return localStorage.getItem("draw_onclick_deck") === "1";
    }

    #onSwitchBrowser()
    {
        MeccgApi.send("/game/changebrowser");
    }

    #togglePaddingBottom(isActive)
    {
        const table = document.querySelector(".area-player");
        if (table === null)
            return;

        if (isActive && !table.classList.contains("table-padding-bottom"))
            table.classList.add("table-padding-bottom");
        else if (!isActive && table.classList.contains("table-padding-bottom"))
            table.classList.remove("table-padding-bottom");
    }

    #changeSeating()
    {
        if (typeof ChangeSeating !== "undefined")
            ChangeSeating.change();
    }

    #autosave(isActive)
    {
        if (isActive)
            document.body.setAttribute("data-autosave", "true");
        else if (document.body.hasAttribute("data-autosave"))
            document.body.removeAttribute("data-autosave");
    }

    #doubleMiscPoints(isActive)
    {
        MeccgApi.send("/game/score/doublemisc", { misc: isActive === true });
    }

    #toggleCompanyHoverBackground(isActive)
    {
        if (isActive)
            sessionStorage.getItem("toggle_white", "yes");
        else if (sessionStorage.getItem("toggle_white", "yes"))
            sessionStorage.removeItem("toggle_white");

        if (isActive && !document.body.classList.contains("company-accessibility"))
            document.body.classList.add("company-accessibility");
        else if (!isActive && document.body.classList.contains("company-accessibility"))
            document.body.classList.remove("company-accessibility");
    }

    #toggleSpanishCards()
    {
        localStorage.setItem("meccg_cards", "cards-es");
        location.reload();
    }

    #toggleFrenchCards()
    {
        localStorage.setItem("meccg_cards", "cards-fr");
        location.reload();
    }

    #toggleEnglishCards()
    {
        if (localStorage.getItem("meccg_cards"))
        {
            localStorage.removeItem("meccg_cards");
            location.reload();
        }
    }

    #toogleCompanyLineBreak(isActive)
    {
        if (isActive && !document.body.classList.contains("table-companies-breakline"))
            document.body.classList.add("table-companies-breakline");
        else if (!isActive && document.body.classList.contains("table-companies-breakline"))
            document.body.classList.remove("table-companies-breakline");
    }

    #toggleFullscreen(isActive)
    {
        const elem = document.documentElement;
        if (elem === undefined)
            return;

        if (isActive)
        {
            if (elem.requestFullscreen) 
                elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) /* Safari */
                elem.webkitRequestFullscreen();
        }
        else if (document.exitFullscreen) 
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)  /* Safari */
            document.webkitExitFullscreen();
    }

    #backgroundDarkness(isActive)
    {
        const elem = document.getElementById("table-dark");
        if (isActive)
        {
            if (elem !== null)
                return;

            const obj = document.createElement("div");
            obj.setAttribute("class", "table-dark");
            obj.setAttribute("id", "table-dark");
            document.body.prepend(obj);
        }
        else if (elem !== null)
        {
            elem.parentElement.removeChild(elem);
        }
    }

    #volumeChange(val)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-sfx-test", { "detail": parseInt(val) }));

        document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
            name : "System",
            message : "Set volume to " + val,
        }}));
    }

    #getRoomUrl()
    {
        const url = document.location.href;
        if (url.length < 12)
            return "";

        const pos = url.indexOf("/", 10);
        if (pos === -1)
            return "";
        else
            return url.substring(0, pos);       
    }

    #copySharePlay()
    {
        const url = this.#getRoomUrl() + "/join/" + g_sRoom;
        this.#copyToClipboard(url);
    }

    #copyShareWatch()
    {
        const url = this.#getRoomUrl() + "/watch/" + g_sRoom;
        this.#copyToClipboard(url);
    }

    #copyToClipboard(text)
    {
        if (navigator === undefined || navigator.clipboard === undefined || typeof text !== "string" || text === "")
            return;

        navigator.clipboard.writeText(text)
        .then(() => document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("conf_share_copied_ok", "Link copied to clipboard.")})))
        .catch((err) => 
        {
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("conf_share_copied_err", "Could not copy link to clipboard.")}));
            console.error(err);
        });
    }

    #changeAvatar()
    {
        MeccgApi.send("/game/character/list");
    }

    #endGame()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-query-end-game", { }));
    }

    #addCardsToDeck()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-cards-add-ingame", { "detail": "" }));
    }

    static drawToHandsize()
    {
        return Preferences._getConfigValue("draw_to_handsize");        
    }
    
    static useImagesDC()
    {
        return Preferences._getConfigValue("images_errata_dc"); 
    }

    static useImagesIC()
    {
        return true;
    }

    static offerBlindly()
    {
        return !Preferences._getConfigValue("viewpile_open");
    }

    getEntries()
    {
        const bWatcher = GamePreferences.isWatching();
        this.createSection(Dictionary.get("conf_h_bgcustomise", "Backgrounds / Customise"));

        if (!bWatcher)
        {
            this.createEntry0("change_avatar");
            this.createEntry0("game_dices");
        }

        this.createEntry0("bg_default");
        this.createEntry0("bg_shawod");
        this.createEntry0("game_sfx");

        if (!bWatcher)
            this.createEntry0("toggle_phasese");

        this.createEntry0("toggle_zoom_preview");

        if (!bWatcher)
            this.createEntry0("toggle_drawondeckclick");
            
        this.createSection(Dictionary.get("conf_h_lookfeel", "Look & Feel"));
        this.createEntry0("toggle_zoom");
        if (!bWatcher)
        {
            this.createEntry0("slider_scramble");
            this.createEntry0("toggle_company_break");

            this.#toggleAlignCompaniesLeft(true);
            this.createEntry0("toggle_align_companies_left");
        }

        this.#toggleStackStage(true);
        
        this.createEntry0("toggle_company_help");
        this.createEntry0("toggle_fullscreen");

        this.createSection(Dictionary.get("conf_h_access", "Accessibility / Language"));

        const lang = localStorage.getItem("meccg_cards");
        if (lang)
            this.createEntry0("toggle_englishcards");

        if (lang !== "cards-es")
            this.createEntry0("toggle_spanishcards");

        if (lang !== "cards-fr")
            this.createEntry0("toggle_frenchcards");
        
        if (!bWatcher)
        {
            this.createEntry0("use_padding_bottom");
            this.createEntry0("toggle_touch_help");
            this.createEntry0("draw_to_handsize");
            this.createEntry0("switch_browser");

            this.createSection(Dictionary.get("conf_h_save", "Save/Load"));
            this.createEntry0("game_save");
            this.createEntry0("game_load");
            
            if (this.isAdmin())
                this.createEntry0("game_autosave");

            this.createSection("Game & DC Settings");
            if (this.isAdmin())
                this.createEntry0("change_seats");

            this.createEntry0("game_addcards");   
            
            if (this.isAdmin())
                this.createEntry0("score_double_misc");
                
            this.createEntry0("images_errata_dc");
    
            this.createSection("Social Media");
            this.createEntry0("share_play");
            this.createEntry0("share_watch");                    
        }

        if (!bWatcher)
        {
            this.createSection(Dictionary.get("conf_h_general", "General"));
            this.createEntry0("viewpile_open");
        }

        this.createSection(Dictionary.get("conf_h_language", "Language"));
        this.createEntry0("lang_en");
        this.createEntry0("lang_fr");
        this.createEntry0("lang_es");
    }

    static isWatching()
    {
        return document.body.getAttribute("data-is-watcher") === "true";
    }

    getUseDCByDefault()
    {
        return !document.body.hasAttribute("data-use-dce") || document.body.getAttribute("data-use-dce") !== "false";
    }

    addConfiguration()
    {        
        this.addConfigToggle("viewpile_open", "I can see my own card piles (reavling to opponent...)", true);
        this.addConfigToggle("images_errata_dc", "Use DC Errata", this.getUseDCByDefault());
        this.addConfigToggle("draw_to_handsize", "Draw to hand size if hand is empty", true);
        
        this.addConfigAction("bg_default", "Change background", false, "fa-picture-o", () => document.body.dispatchEvent(new CustomEvent("meccg-background-chooser")));
        this.addConfigAction("game_dices", "Change dices", false, "fa-cube", this.#dices.bind(this));        
        this.addConfigSlider("game_sfx", "Sound volume", 100, 20, "fa-volume-up", this.#volumeChange.bind(this));
        
        this.addConfigToggle("toggle_phasese", "Reduce phase bar to checkered flag only", false, this.#togglePhases.bind(this));
        this.addConfigSlider("toggle_zoom", "Zoom Level", 2, 1, "fa-search-plus slider-short", this.#zoomChange.bind(this));
        this.addConfigToggle("bg_shawod", "Reduce background brightness", true, this.#backgroundDarkness);
        this.addConfigToggle("score_double_misc", "Double MISC points (DC rules)", false, this.#doubleMiscPoints);
        this.addConfigToggle("toggle_fullscreen", "Toggle Fullscreen", false, this.#toggleFullscreen.bind(this), "fa-compress", "fa-expand");
        this.addConfigToggle("toggle_company_help", "Add white background to companies when hovering", sessionStorage.getItem("toggle_white") === "yes", this.#toggleCompanyHoverBackground.bind(this));
        this.addConfigToggle("toggle_company_break", "Expand companies over multiple lines", false, this.#toogleCompanyLineBreak.bind(this));

        this.addConfigAction("toggle_spanishcards", "Use Spanish cards (if available).", false, "fa-globe", this.#toggleSpanishCards.bind(this));
        this.addConfigAction("toggle_frenchcards", "Use French cards (if available).", false, "fa-globe", this.#toggleFrenchCards.bind(this));
        this.addConfigAction("toggle_englishcards", "Use English cards", false, "fa-globe", this.#toggleEnglishCards.bind(this));

        this.addConfigAction("game_addcards", "Add new cards to sideboard", false, "fa-plus-square", this.#addCardsToDeck);

        if(this.isAdmin())
        {
            this.addConfigToggle("game_autosave", "Save game at the beginning of a player's turn", true, this.#autosave.bind(this));
            this.addConfigAction("change_seats", "Change player order", false, "fa-circle-o-notch", this.#changeSeating.bind(this));
        }

        this.addConfigAction("game_save", "Save current game", false, "fa-floppy-o", () => document.body.dispatchEvent(new CustomEvent("meccg-game-save-request", { "detail": ""})));
        this.addConfigAction("game_load", "Restore a saved game", false, "fa-folder-open", () => document.body.dispatchEvent(new CustomEvent("meccg-game-restore-request", { "detail": ""})));

        this.addConfigToggle("toggle_align_companies_left", "Align companies to the left", true, this.#toggleAlignCompaniesLeft.bind(this), "fa-align-left", "fa-align-justify");
        this.addConfigToggle("toggle_zoom_preview", "Use smaller card preview", this.#useSmallCardPreview(), this.#toggleSmallPreview.bind(this));

        this.addConfigAction("leave_game", "End game now (after confirmation)", false, "fa-power-off", this.#endGame);
        this.addConfigToggle("use_padding_bottom", "Add additional space at the bottom for your hand", true, this.#togglePaddingBottom)

        this.addConfigAction("share_play", "Copy link to join this game to clipboard", false, "fa-share-alt", this.#copySharePlay.bind(this));
        this.addConfigAction("share_watch", "Copy link to watch this game to clipboard", false, "fa-share-alt", this.#copyShareWatch.bind(this));
        this.addConfigToggle("toggle_touch_help", "Use mobile touch support", false, this.#toggleTouchHelper.bind(this));
        this.addConfigAction("change_avatar", "Change your avatar icon", false, "fa-magic", this.#changeAvatar.bind(this));

        this.addConfigSlider("slider_scramble", "Jumble company cards", 2, this.#getJumbleCardsVal(), "fa-search-plus slider-short", this.#jumbleCards.bind(this));

        this.#toggleCardPreview(!this.#useSmallCardPreview());
        this.#backgroundDarkness(true);
        this.#toggleCompanyHoverBackground(sessionStorage.getItem("toggle_white") === "yes");

        this.addConfigAction("lang_en", "Switch to English", false, "fa-globe", this.#langEN.bind(this));
        this.addConfigAction("lang_es", "Switch to Spanish", false, "fa-globe", this.#langES.bind(this));
        this.addConfigAction("lang_fr", "Switch to French", false, "fa-globe", this.#langFR.bind(this));

        this.addConfigToggle("toggle_drawondeckclick", "Draw cards when clicking on deck", this.#doToggleDrawDeckClick(), this.#toogleDrawDeckClick.bind(this));
        this.addConfigAction("switch_browser", "Switch Browser", false, "fa-exchange", this.#onSwitchBrowser.bind(this));
        
        this.#insertHelp();
    }

    #refreshLanguage(lang)
    {
        let url = location.href;
        let pos = url.indexOf("?");
        if (pos > 0)
            url = url.substring(0, pos);

        pos = url.indexOf("#");
        if (pos > 0)
            url = url.substring(0, pos);

        location.href = url + "?language=" + lang;
    }

    #langEN()
    {
        this.#refreshLanguage("en")
    }

    #langES()
    {
        this.#refreshLanguage("es")
    }

    #langFR()
    {
        this.#refreshLanguage("fr")
    }

    #insertHelp()
    {
        const elem = document.body.querySelector(".help-icon");
        if (elem !== null)
        {
            elem.setAttribute("title", Dictionary.get("conf_help", "Open help tips"));
            elem.onclick = this.#showHelp.bind(this);
        }
    }

    #showHelp()
    {
        const content = document.createElement("div");
        content.setAttribute("class", "text-left");
        content.append(
            this.#createShortcut("d", Dictionary.get("conf_cut_d", "draw card to hand")),
            this.#createShortcut("r", Dictionary.get("conf_cut_r", "roll dice")),
            this.#createShortcut("q", Dictionary.get("conf_cut_q", "end your turn")),
            this.#createShortcut("f", Dictionary.get("conf_cut_f", "flips card currently hovering over")),
            this.#createShortcut("x", Dictionary.get("conf_cut_x", "discards card currently hovering over")),
            this.#createParagaph(Dictionary.get("conf_cut_p1", "You can right click on cards and deck icons to open a context menu.")),
            this.#createParagaph(Dictionary.get("conf_cut_p2", "You can double click on a hand card to play it (without dragging).")),
            this.#createParagaph(Dictionary.get("conf_cut_p3", "If you organize your movement, you can always add region cards by clicking on the card in the site card list of a region.")),
            this.#createParagaph(Dictionary.get("conf_cut_p4", "Discarding your opponent's card will sort it into their discard pile.")),
        );
        new Question("", false).show(Dictionary.get("conf_cut_title", "Tips & Shortcuts"), content, Dictionary.get("close", "Close"));
    }


    #createParagaph(text = "")
    {
        const span = document.createElement("p");
        span.innerText = text;
        return span;
    }

    #createShortcut(key = "", text = "")
    {
        const span = document.createElement("span");
        span.setAttribute("class", "code");
        span.innerText = key;
        
        const p = document.createDocumentFragment();
        p.append(span, document.createTextNode(text), document.createElement("br"));
        return p;
    }

    #toggleCardPreview(bAdd = true)
    {
        if (bAdd && !document.body.classList.contains("large-preview"))
            document.body.classList.add("large-preview");
        else if (!bAdd && document.body.classList.contains("large-preview"))
            document.body.classList.remove("large-preview");
    }

    allowSfx()
    {
        return Preferences._getConfigValue("game_sfx") > 5;
    }

    appendContainer(div)
    {
        document.body.querySelector(".player-selector-box").prepend(div);
    }
    
    init()
    {
        super.init();

        const div = document.createElement("div");
        div.setAttribute("class", "config-zoom " + this.getGameCss());

        const icons = document.createElement("div");
        icons.setAttribute("class", "icons cursor-pointer");
        icons.setAttribute("data-level", "0");
        icons.setAttribute("id", "zoom-level");
        icons.setAttribute("title", Dictionary.get("conf_toggle_zoom_level", "Toggle zoom level"))
        icons.innerHTML = '<i class="fa fa-search-plus" aria-hidden="true" title="'+Dictionary.get("conf_l_toggle_zoom", "Zoom Level") + '"></i>';

        icons.onclick = this.toggleZoom.bind(this);
        div.appendChild(icons);

        this.appendContainer(div);

        if (this.data.background !== undefined)
            this.setBackgroundImage(this.data.background);

        this.#autosave(true);
        this.#addFullscreentoTaskbar();
    }

    #addFullscreentoTaskbar()
    {
        const fulls = document.getElementById("taskbar-fullscreen");
        if (fulls !== null)
            fulls.onclick = () => this.#toggleFullscreen(true);
    }

    initDices()
    {
        if (typeof this.data.dices === "string")
            MeccgApi.send("/game/dices/set", { type: this.data.dices });
    }

    toggleZoom()
    {
        const elem = document.getElementById("zoom-level");
        if (elem === null)
            return;

        const level = parseInt(elem.getAttribute("data-level"));
        let cssOld = level < 1 ? "" : "zoom-" + level;
        let cssNew = level === 2 ? "" : "zoom-" + (level+1);

        if (cssNew !== "")
            document.body.classList.add(cssNew);

        if (cssOld !== "")
            document.body.classList.remove(cssOld);

        const newZoom = level < 2 ? level + 1 : 0;
        elem.setAttribute("data-level", newZoom);
    }
}

const g_pGamesPreferences = new GamePreferences();
g_pGamesPreferences.init();

document.body.addEventListener("meccg-api-ready", g_pGamesPreferences.initDices.bind(g_pGamesPreferences), false);
