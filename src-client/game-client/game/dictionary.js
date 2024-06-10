class Dictionary {

    static #instance = new Dictionary();

    #currentLang = "en";

    #data = {
        en: { },
        es: { },
        fr: { }
    }
    
    static get(key)
    {
        return Dictionary.#instance.#getValue(key);
    }

    #getValue(key)
    {
        const map = this.#data[this.#currentLang];
        const val = map ? map[key] : "";
        return typeof val === "string" ? val : "";
    }

    #setLanguage()
    {
        const broserLang = navigator.language;
        const sessLang = sessionStorage.getItem("lang");
        
        if (this.#isValidLang(sessLang))
            this.#currentLang = sessLang;
        else if (this.#isValidLang(broserLang))
            this.#currentLang = broserLang;
    }

    static register(key, textEN, textES, textFR)
    {
        
    }

    #getEN() 
    {
        return `
look_shared_stored=Look at opponent's stored cards.
look_shared_oop=View cards which are out of play
look_icon_scored=Look at your stored cards. Right click to edit score sheet
look_icon_playdeck=Look at remaining playdeck. Right click to shuffle
look_icon_discard=Look at discard pile
look_icon_sideboard=Look at sideboard
look_icon_hand=Look at hand cards. Right click to reveal cards to opponent
title_sectators=Spectators
title_duration=Duration of this game
title_icon_hand_eye=Toggle hand card visibility. RIGHT CLICK to reveal hand cards to opponent
title_draw=Draw a new card (press d)
title_dice=Click to roll the dice (press r or w)
title_change_bg=Change Background
title_fullscreen=Enter fullscreen
title_orga=Organisation Phase
title_longevent=Long Event Phase
title_mh=Movement/Hazard Phase
title_sitephase=Site Phase (press 's')
title_eotdiscard=End-of-Turn Discard Phase (press 'e')
title_eot=End your turn and start next player's turn (press 'q').
title_draft=Draft Phase
title_showtoopp=Show to your Opponent
reval_opp=reveal to opp.
close_and_shuffle=Clsoe & Shuffle
cancel=Cancel
        `;
    }

    #isValidLang(input)
    {
        return input === "en" || input === "es" || input === "fr";
    }

    static create()
    {
        Dictionary.#instance.#setLanguage();
    }
}

Dictionary.create();