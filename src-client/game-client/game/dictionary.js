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
        console.log(key)
        const val = Dictionary.#instance.#getValue(key, Dictionary.#instance.#currentLang);
        if (val !== "")
            return val;
            
        console.warn("Cannot find translation for key #", key);
        return Dictionary.#instance.#currentLang === "en" ? "" : Dictionary.#instance.#getValue(key)
    }

    #getValue(key, lang = "en")
    {
        const map = this.#data[lang];
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

    #prepareData(txt)
    {
        const data = {};
        for (let line of txt.split("\n"))
        {
            const pos = line.indexOf("=");
            if (pos === -1)
                continue;
            const left = line.substring(0, pos).trim();
            const right = line.substring(pos+1).trim();
            if (left !== "" && right !== "")
                data[left] = right;
        }
        return data;
    }

    #init()
    {
        this.#setLanguage();
        this.#data.en = this.#prepareData(this.#getEN());
        this.#data.es = this.#prepareData(this.#getES());
        this.#data.fs = this.#prepareData(this.#getFR());
    }

    #getES()
    {
        return "";
    }

    #getFR()
    {
        return "";
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
importtosb_message_add_list=Please add cards to the list.
importtosb_message_add_list_ok=Cards were added to your sideboard.
importtosb_title=Add cards to your Sideboard
importtosb_p=Please open the deckbuilder and copy the cards to add here.
importtosb_tip=copy card codes here, e.g. 1 Gandalf [H] (TW)
importtosb_button_add=Add to sideboard
arda_trade_toofew=Another player is needed to trade cards
arda_trade_choose=Choose player to trade with
arda_trade_choose_trading=Please choose one player to trade cards with
arda_trade_link=Click to exchange cards with another player
handsizeis=Hand size is
arda_drag_char=Drag card to play it or \nDOUBLECLICK to create new company without dragging it.
arda_drag_res=Drag card to play it or \nDOUBLECLICK to play card without dragging it.
arda_discard=Discard this card
arda_tohand=Move to your hand
arda_tooglevis=Left click to toggle visibility.\nRight click to refresh.
arda_viewdiscard=View discard pile
arda_viewplaydeck=View playdeck. Right click to shuffle
arda_drawnew=Draw a new card
arda_shuffled=Playdeck shuffled
arda_setup_1a= Once everybody is at the table, each player chooses their wizard. Once that is done, you assign random characters to each player's hand.
arda_setup_1b=This will clear your hand and add random characters to your hand.
arda_setup_1c=Assign random characters to every player.
arda_setup_1d=Assign random characters
arda_setup_1e=Assign more random characters to every player.
arda_setup_2a=Everybody may draft characters with a total of 25 GI. Yet, only 20 GI may be used.
arda_setup_2b=Complete character draft and choose minor items.
arda_setup_2c=Recycling will automatically disacrd your current hand and reshuffle everything into the playdeck.
arda_setup_3a=Everybody may choose up to 3 minor items. Once that is done, the game can start.
arda_setup_3b=Complete minor item draft and start the game.
arda_setup_4a=Do you want to reshuffle all cards into the playdeck?, 
arda_setup_4b=All cards will be reshuffled into the playdeck and a new hand will be drawn., 
arda_setup_4c=Reshuffle everything
arda_handlimit=Hand already holds enough cards.
context_nonotes=Deck notes are not available for your deck.
context_yournotes=Your Deck Notes
context_anywhere_esc=Click anywhere or press ESC to close the window
context_anywhere=Click to close
context_canotshowtapped=Cannot show tapped sites.
context_reveal=Reveal cards to opponent
context_reveal_text=Please specifiy the number of cards your opponent will look at (if available in your deck)
context_lookdeck=Look at your playdeck
context_lookdeck_text=Please specifiy the number of cards to look at. The cards will be shuffled again automatically.
context_shuffle=Shuffle Top Playdeck
context_shuffle_text=Please specifiy the number of cards to shuffle.
context_shuffled=Playdeck shuffled.
context_shuffleinto=Do you want to reshuffle pile into the playdeck?
context_shuffleinto_text=All discarded cards will be reshuffled into the playdeck.
context_shuffleinto_do=Reshuffle
context_numberofcards=Number of cards: 
context_clicktoclose=Click to close
context_notappedsites=No tapped sites so far.
context_yourtappedsites=Your Tapped Sites
context_continue=Continue
context_e_ready=Ready card
context_e_tap=Tap card (90°)
context_e_tap_91=Tap and lock tapped (90°)
context_e_wound=Wound card (180°)
context_e_rot270=Rotate 270°
context_e_glow_action=Highlight card (5s)
context_e_flipcard=Flip Card
context_e_token_add=Add token
context_e_token_remove=Remove token
context_e_arrive=Company arrives at destination
context_e_add_ressource=Add this site as a ressource
context_e_add_character=Add this site as a character
context_e_movement_return=Return to site of origin
context_e_view_deck_cards=Look at my playdeck as it is
context_e_view_deck_cards_ordered=Look at my playdeck and group cards
context_e_view_deck_cards_reveal=Reveal playdeck to opponent
context_e_view_discardpile_cards=Look at my discard pile as it is
context_e_view_discardpile_sites=Show my tapped sites
context_e_view_discardpile_ordered=Look at my discard pile and group cards
context_e_view_discardpile_cards_reveal=Reveal discard pile to opponent
context_e_move_company_left=Move company one position to the left
context_e_move_company_right=Move company one position to the right
context_e_move_company_end=Move company to the end
context_e_view_deck_notes=View deck notes
context_e_reval_cards_number=Reveal X cards to your opponent (I will not see them)
context_e_reval_cards_number_self=Look at your top X cards
context_e_playdeck_shuffle=Shuffle deck
context_e_playdeck_shuffle_x_cards=Shuffle top X cards of your playdeck
context_e_discardpile_shuffle_into_playdeck=Shuffle discard pile into your playdeck
context_e_discardpile_shuffle=Shuffle Discard Pile
context_e_playdeck_choose_site=Add a site as a character
context_e_victory_me=Show my stored cards
context_e_victory_shared=Show opponent's stored cards
dice_opponent=Opponent
dice_you=You
dice_clickclose=Click to close dice result
into_end=End this game and show final scores (after final confirmation)
playerselector_rearranged=Player seating rearranged.
playerselector_hazardplayer=You are the hazard player.
playerselector_activeplayer=Active Player
playerselector_currenthazard=Current hazard player
playerselector_cardsinhand=cards in hand
playerselector_cardsindeck=cards in playdeck
score_point=Point
score_points=Points
score_card=Score Card
score_update=Update score
score_yours=Your Victory Pile
score_avg_turntime_total=Total Turn Time
score_avg_turntime=Avg. Turn Time
score_tournament=Tournament
score_click_changeavatar=Click to change your avatar
score_autodisconnect=Automatic disconnect
score_reboot=The server rebooted automatically (scheduled).
score_leavetolobby=Leave game and return to lobby
score_returntolobbdy=Return to lobby.
score_autosave=Save last autosave to disk
score_couldnotfetch=Could not fetch scores.
        `;
    }

    #isValidLang(input)
    {
        return input === "en" || input === "es" || input === "fr";
    }

    static create()
    {
        Dictionary.#instance.#init();
    }
}

Dictionary.create();