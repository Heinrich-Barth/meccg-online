/**
 * insert help icon. This will make use of the map window IFrame.
 * Since this is not essential, it will be added after a short timeout.
 */
setTimeout(() => { 
    if (typeof MapWindow === "undefined")
        return;

    const elem = document.createElement("i");
    elem.setAttribute("class", "fa fa-power-off");
    elem.setAttribute("aria-hidden", "true");

    const div = document.createElement("div");
    div.setAttribute("class", "icons");
    div.appendChild(elem);

    const divParent = document.createElement("div");
    divParent.setAttribute("class", "wrapper-topleft help-wrapper cursor-pointer");
    divParent.setAttribute("title", Dictionary.get("into_end", "End this game and show final scores (after final confirmation)"));
    divParent.onclick = () => document.body.dispatchEvent(new CustomEvent("meccg-query-end-game", { }));;
    divParent.appendChild(div);
    
    document.body.querySelector(".player-selector-box").prepend(divParent);
}, 200);

/**
 * Show the intro overlay
 */
(function()
{
    function getConnectionCount()
    {
        try
        {
            const val = document.body.getAttribute("data-connected-count");
            if (val !== null && val !== "")
                return parseInt(val);
        }
        catch (err)
        {
            console.error(err);            
        }

        return 0;
    }
    
    function addContent()
    {
        const _room = typeof g_sRoom === "undefined" ? "" : g_sRoom;
        const div = document.createElement("div");
        div.setAttribute("class", "intro-tooltip");
        div.setAttribute("id", "intro-tooltip");

        const divOverlay = document.createElement("div");
        divOverlay.setAttribute("id", "tip-opverlay");
        divOverlay.setAttribute("class", "tip-opverlay");
        divOverlay.setAttribute("title", "Click here to close");
        
        const divContent = document.createElement("div");
        divContent.setAttribute("class", "blue-box tip-content");
        
        divContent.innerHTML = `<h2><i class="fa fa-info-circle" aria-hidden="true"></i>&nbsp;How to play</h2>
                            <p>Simply <span class="text-white">drag &amp; drop</span> cards as you would intuitively do. Depending on your card, different targets/options will be made available visually.</p>

                            <h2><i class="fa fa-info-circle" aria-hidden="true"></i>&nbsp;Tips &amp; Shortcuts</h2>
                            <p>Click on the <span class="text-white"><i class="fa fa-question-circle"></i> help icon</span> at the top bar to access shortcuts and tips.</p>

                            <h2><i class="fa fa-info-circle" aria-hidden="true"></i>&nbsp;Resume a saved game</h2>
                            <p>Once all players are at the table, access the <span class="text-white cursor-pointer" data-event="settings"><i class="fa fa-sliders"></i> <b>game settings</b></span> (upper left corner) and 
                            click on <span class="text-white cursor-pointer" data-event="settings"><i class="fa fa-folder-open"></i> <b>Restore a saved game</b></span>. he players at the table need to match the number of players of your saved game.</p>
                            
                            <p class="text-center"><br><button id="close_tip" type="button">Close tip</button></p>
                        </div>
                    </div>`;

        divContent.querySelectorAll("span").forEach(span => {
            if (span.hasAttribute("data-event"))
            {
                span.onclick = () => {
                    document.getElementById("preferences-wrapper")?.classList.remove("hide");
                    document.getElementById("close_tip").click();
                }
            }
        });
        
        div.appendChild(divOverlay);
        div.appendChild(divContent);
        document.body.appendChild(div);
        document.getElementById("close_tip").onclick = () => DomUtils.remove(document.getElementById("intro-tooltip"));
        document.getElementById("tip-opverlay").onclick = () => document.getElementById("close_tip").click();
    }

    if (getConnectionCount() === 0 && document.body.getAttribute("data-is-watcher") !== "true")
        addContent();
})();