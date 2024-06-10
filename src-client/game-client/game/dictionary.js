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
importtosb_message_add_list="Please add cards to the list."
importtosb_message_add_list_ok="Cards were added to your sideboard."
importtosb_title=Add cards to your Sideboard
importtosb_p=Please open the deckbuilder and copy the cards to add here.
importtosb_tip=copy card codes here, e.g. 1 Gandalf [H] (TW)
importtosb_button_add=Add to sideboard
arda_trade_toofew="Another player is needed to trade cards"
arda_trade_choose=Choose player to trade with
arda_trade_choose_trading="Please choose one player to trade cards with"
arda_trade_link=Click to exchange cards with another player
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