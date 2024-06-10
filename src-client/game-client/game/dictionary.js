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
handsizeis="Hand size is"
arda_drag_char="Drag card to play it or \nDOUBLECLICK to create new company without dragging it."
arda_drag_res="Drag card to play it or \nDOUBLECLICK to play card without dragging it."
arda_discard="Discard this card"
arda_tohand="Move to your hand"
arda_tooglevis=Left click to toggle visibility.\nRight click to refresh.
arda_viewdiscard=View discard pile
arda_viewplaydeck="View playdeck. Right click to shuffle"
arda_drawnew="Draw a new card"
arda_shuffled="Playdeck shuffled
arda_setup_1a= "Once everybody is at the table, each player chooses their wizard. Once that is done, you assign random characters to each player's hand."
arda_setup_1b="This will clear your hand and add random characters to your hand."
arda_setup_1c="Assign random characters to every player."
arda_setup_1d="Assign random characters"
arda_setup_1e="Assign more random characters to every player."
arda_setup_2a="Everybody may draft characters with a total of 25 GI. Yet, only 20 GI may be used."
arda_setup_2b="Complete character draft and choose minor items."
arda_setup_2c="Recycling will automatically disacrd your current hand and reshuffle everything into the playdeck."
arda_setup_3a="Everybody may choose up to 3 minor items. Once that is done, the game can start."
arda_setup_3b="Complete minor item draft and start the game."
arda_setup_4a="Do you want to reshuffle all cards into the playdeck?", 
arda_setup_4b="All cards will be reshuffled into the playdeck and a new hand will be drawn.", 
arda_setup_4c="Reshuffle everything"
arda_handlimit="Hand already holds enough cards."
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