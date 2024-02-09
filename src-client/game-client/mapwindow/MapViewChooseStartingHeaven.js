/**
 * Show map and only allow to choose a starting site. Once a site has been clicked,
 * the map will be closed again.
 */
class MapViewChooseStartingHeaven extends MapViewMovementSelection
{
    
    createInstance()
    {
        super.createInstance();

        DomUtils.removeAllChildNodes(document.getElementById("found_sites"));
        this.addInfoTip();
    }

    addInfoTip()
    {
        document.getElementById("found_sites").innerHTML = '<span class="caption">Click on any region marker and<br>choose a starting site</span>';    
    }

    onProcessEvent(_region, _image, isSite, code)
    {
        if (isSite)
            super.sendMovement(code);
    }

}

class MapViewChooseStartingHeavenIgnoreSelection extends MapViewChooseStartingHeaven
{
    sendMovement()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-cancel", { "detail": "" }));
    }

    addInfoTip()
    {
        /* do not show info tip */
    }

    createInstance()
    {
        super.createInstance();

        this.#insertCloseLink();
    }
    #removeAllChildNodes(parent)
    {
        if (parent !== null)
        {
            while (parent.firstChild) 
                parent.removeChild(parent.firstChild);
        }
    }

    #insertCloseLink()
    {
        const prefs = document.getElementById("prefs");
        if (prefs === null)
            return;

        const parent = prefs.parentElement;

        this.#removeAllChildNodes(parent);

        const div = document.createElement("div");
        div.setAttribute("class", "icons cursor-pointer");
        div.innerHTML = `<i class="fa fa-times-circle" aria-hidden="true" title="Close"> Close map window (or press ESC)</i>`
        div.onclick = () => MapInstanceRenderer.cancel();

        parent.appendChild(div);
    }
}