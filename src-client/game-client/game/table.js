(function() 
{
    function createTable__row_oppopnent()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "area area-opponent");
        div.setAttribute("data-opponent-id", "opp1");
        div.innerHTML = `
            <div class="row" id="opponent_table">
                <!-- SHARED -->
                <div class="card-bar card-bar-shared">
                    <div class="icons">
                        <a id="shared_victories" class="icon icon-shared icon-shared-victory context-cursor" title="${Dictionary.get("look_shared_stored")}">
                            <img src="/data/backside" alt="stored cards" id="icon-preview-shared-scored">
                            <i class="fa fa-star-o"></i>
                        </a>
                        <a id="shared_outofplay" class="icon icon-shared icon-shared-out" title="${Dictionary.get("look_shared_oop")}">
                            <img src="/data/backside" alt="out-of-play cards" id="icon-preview-shared-outofplay">
                            <i class="fa fa-ban"></i>
                        </a>
                    </div>
                </div>
    
                <!-- STAGING AREA -->
                <div class="staging-area staging-area-opponent rot180">
                    <div class="staging-area-resources staging-area-area" id="staging_area_resources_opponent"></div>
                    <div class="staging-area-resources-longshort staging-area-area" id="staging_area_resources_longshort_opponent"></div>
                    <div class="staging-area-factions staging-area-area" id="staging_area_factions_opponent"></div>
                    <div class="staging-area-hazard staging-area-area" id="staging_area_hazards_opponent"></div>
                    <div class="staging-area-hazard-longshort staging-area-area" id="staging_area_hazards_longshort_opponent"></div>
                    <div class="staging-area-stage staging-area-area" id="staging_area_stage_opponent"></div>                        
                </div>

                <div class="opponent-companies" id="opponent-companies"></div>
            </div>
        `;

        return div;
    }

    function createTable__row_player()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "area area-player table-padding-bottom");
        div.setAttribute("data-turn-phase", "");
        div.innerHTML = `
            <div class="area area-player table-padding-bottom" data-turn-phase="">
                <div class="row">
                    <!-- card piles -->
                    <div class="card-bar card-bar-play">
                        <div class="icons" id="card_counter">
                            <a id="icon_bar_victory" class="icon victory icon-tooltip icon-tooltip-mps" title="${Dictionary.get("look_icon_scored")}">
                                <img src="/data/backside" alt="out-of-play cards" id="icon-preview-scored">
                                <i class="fa fa-star-half-o"></i>
                                <span class="size">0</span>
                            </a>
                            <a id="icon_bar_playdeck" class="icon playdeck icon-tooltip icon-tooltip-playdeck context-cursor" title="${Dictionary.get("look_icon_playdeck")}">
                                <img src="/data/backside" alt="out-of-play cards">
                                <span class="size">0</span>
                            </a>
                            <a id="icon_bar_discardpile" class="icon icon-tooltip discardpile icon-tooltip-discard context-cursor" title="${Dictionary.get("look_icon_discard")}">
                                <img src="/data/backside" alt="out-of-play cards" id="icon-preview-discard">
                                <i class="fa fa-inbox"></i>
                                <span class="size">0</span>
                            </a>
                            <a id="icon_bar_sideboard" class="icon icon-tooltip sideboard icon-tooltip-sideboard" title="${Dictionary.get("look_icon_sideboard")}">
                                <img src="/data/backside" alt="out-of-play cards">
                                <i class="fa fa-th"></i>
                                <span class="size">0</span>
                            </a>
                            <a id="icon_hand" class="icon act context-cursor icon-tooltip icon-tooltip-hand hand"  title="${Dictionary.get("look_icon_hand")}">
                                <img src="/data/backside" alt="out-of-play cards">
                                <i class="hand"></i>
                                <span class="size">0</span>
                            </a>
                        </div>
                    </div>
        
                    <!-- STAGING AREA -->
                    <div class="staging-area staging-area-player" id="staging-area-player">
                        <div class="create-new-company" id="create_new_company"></div>
                        <div class="staging-area-drop" id="staging_area_drop"></div>
                        <div class="staging-area-resources staging-area-area" id="staging_area_resources_player"></div>
                        <div class="staging-area-resources-longshort staging-area-area" id="staging_area_resources_longshort_player"></div>
                        <div class="staging-area-factions staging-area-area" id="staging_area_factions_player"></div>
                        <div class="staging-area-hazard staging-area-area" id="staging_area_hazards_player"></div>
                        <div class="staging-area-hazard-longshort staging-area-area" id="staging_area_hazards_longshort_player"></div>
                        <div class="staging-area-stage staging-area-area" id="staging_area_stage_player"></div>                        
                    </div>

                    <!-- main table area for playing -->
                    <div class="companies" id="player_companies"></div>
                </div>
            </div>
        `;

        return div;
    }

    function createTable()
    {
        const div = document.createElement("div");
        div.setAttribute("class", "table table-dark");
        div.append(
            createTable__row_oppopnent(),
            createTable__row_player()
        );
        return div;
    }

    function createInterface()
    {
        const div = document.createElement("div")
        div.setAttribute("id","interface");
        div.setAttribute("data-time", document.body.getAttribute("data-time"));
        div.innerHTML = `
            <div class="player-selector-box blue-box">
                <div class="player_selector smallCaps">
                    <div class="player_group" id="player_selector"></div> 
                    <div class="player_group player_group_additionals">
                        <span class="fa fa-eye hidden" aria-hidden="true" title="${Dictionary.get("title_sectators")}" id="game_spectators">0</span>
                        <span class="fa fa-play" aria-hidden="true" title="Turns" id="game_turns">1</span>
                        <span class="fa fa-clock-o" title="${Dictionary.get("title_duration")}" id="game_time">00:00</span> 
                    </div>
                    <div class="help-icon fa fa-question-circle"></div>
                </div>
                <div class="cursor-pointer fa fa-commenting" id="chat_icon" title="${Dictionary.get("chat.icon.title")}"></div>
            </div>

            <div class="card-hands" id="playercard_hand">
                <div id="playercard_hand_droppable" class="playercard_hand_droppable"></div>
                <div class="blue-box-light playercard-hand-content" id="playercard-hand-content">
                    <div class="card-hand card-draw">
                        <div class="card-hand-eye" id="icon_hand_eye" title="${Dictionary.get("title_icon_hand_eye")}"><i class="fa fa-eye"></i></div>
                        <a href="#" class="card-icon smallCaps" id="draw_card" title="${Dictionary.get("title_draw")}">draw</a><div class="cursor-pointer card-dice-hand" title="${Dictionary.get("title_dice")}" id="roll_dice_icon_hand"><img src="/dist-client/js/game/dice/dice-1.png"><img src="/dist-client/js/game/dice/dice-1.png"></div><div class="hand-card-sizer"></div>
                    </div>
                    <div id="playercard_hand_container" class="playercard-hand-container"></div>
                </div>
            </div>
            <div class="taskbar pos-rel">
                <div class="icons blue-box-light taskbar-icons" id="progression-phase-box">
                    <div class="card-generic pointer-cursor card-dice" title="${Dictionary.get("title_draw")}" id="roll_dice_icons"><img src="/dist-client/js/game/dice/dice-1.png"><img src="/dist-client/js/game/dice/dice-1.png"></div>
                    <div class="taskbar-setting fa fa-picture-o" id="taskbar-background" title="${Dictionary.get("title_change_bg")}"></div>
                    <div class="taskbar-setting fa fa-expand" id="taskbar-fullscreen" title="${Dictionary.get("title_fullscreen")}"></div>
                    <a class="icon taskbar-score" title="Open score sheet">&nbsp;</a>
                    <a class="icon taskbar-turn orga" data-phase="organisation" title="${Dictionary.get("title_orga")}">&nbsp;</a>
                    <a class="icon taskbar-turn longevent" data-phase="longevent" title="${Dictionary.get("title_longevent")}">&nbsp;</a>
                    <a class="icon taskbar-turn move" data-phase="movement" title="${Dictionary.get("title_mh")}">&nbsp;</a>
                    <a class="icon taskbar-turn site" data-phase="site" title="${Dictionary.get("title_sitephase")}">&nbsp;</a>
                    <a class="icon taskbar-turn eotdiscard" data-phase="eotdiscard" title="${Dictionary.get("title_eotdiscard")}">&nbsp;</a>
                    <a class="icon taskbar-turn eot" data-phase="eot" title="${Dictionary.get("title_eot")}">&nbsp;</a>
                    <a class="icon startphase act cursor-default hidden" id="startphase_turn" data-phase="start" title="${Dictionary.get("title_draft")}">&nbsp;</a>
                </div>
            </div>
        `;
        return div;
    }

    function createCardListContainer()
    {
        const div = document.createElement("div");
        div.setAttribute("id", "view_card_list_container");
        div.setAttribute("class", "hidden");
        div.innerHTML = `
            <div class="view-card-list-container blue-box" data-class="view-card-list-container blue-box" >
                <div class="container-title-bar smallCaps">
                    <div class="container-title-bar-title fl"></div>
                    <div class="container-title-bar-divider hideOnOffer fl">&nbsp;&dash;&nbsp;</div>
                    <div class="container-title-bar-reveal hideOnOffer fl"><a href="#" title="${Dictionary.get("title_showtoopp")}" data-type="">${Dictionary.get("reval_opp")}</a></div>
                    <div class="container-title-bar-shuffle hideOnOffer fr">${Dictionary.get("close_and_shuffle")}</div>
                    <div class="clear"></div>
                </div>
                <div class="container-data"></div>
            </div>
        `;
        return div;
    }

    document.body.prepend(
        createTable(),
        createInterface(),
        createCardListContainer()
    );

})();