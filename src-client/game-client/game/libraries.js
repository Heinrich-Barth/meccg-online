

const ArrayList = function(elem)
{
    let _elem = elem;

    return {

        find : function(sSelector)
        {
            if (_elem === null || sSelector === undefined || sSelector === "")
                return ArrayList(null);
            else
                return ArrayList(_elem.querySelectorAll(sSelector));
        },

        findByClassName : function(sClass)
        {
            return ArrayList(_elem === null ? null : _elem.getElementsByClassName(sClass));
        },

        size : function()
        {
            if (_elem === null)
                return 0;
            else
                return _elem.length === undefined ? 1 : _elem.length;
        },

        each : function(fnCallback)
        {
            try
            {
                if (_elem === null || _elem.length === undefined)
                    return;

                const len = _elem.length;
                for (let i = 0; i < len; i++)
                    fnCallback(_elem[i]);
            }
            catch(err)
            {
                MeccgUtils.logError(err);
            }
        }
    }

};

class MeccgUtils {

    static logError(err)
    {
        MeccgUtils.logInfo(err);
    }

    static logWarning(e)
    {
        MeccgUtils.logInfo(e);
    }
    
    static logInfo(e)
    {
        console.info(e);
    }
}

class DomUtils extends MeccgUtils {

    static unbindAndRemove(jElement)
    {
        if (!jElement)
            return;

        /* threadding may cause problems. so just have try-catch block here */
        try
        {
            jElement.find("div").unbind();
            jElement.find("img").unbind();
            jElement.unbind();
            jElement.remove();
        }
        catch(e)
        {
            console.warn(e);
        }
    }

    static closestByClass(node, sClass)
    {
        return DomUtils.findParentByClass(node, sClass);
    }
    
    static closestByType(node, type)
    {
        if (!node || !type)
            return null;
        else if (node.nodeName !== undefined && node.nodeName.toLowerCase() === type)
            return node;
        else
            return DomUtils.closestByType(node.parentNode, type);
    }

    static findParentByClass(node, sClass)
    {
        if (!node || !sClass)
            return null;
        else if (node.classList !== undefined && node.classList.contains(sClass))
            return node;
        else
            return DomUtils.findParentByClass(node.parentNode, sClass);
    }

    static empty(node)
    {
        DomUtils.removeAllChildNodes(node);
    }

    /**
     * Remove all child nodes from DOM element
     * @param {Object} parent 
     */
     static removeAllChildNodes(parent, removeChildDragDrop = true) 
     {
        if (!parent)
            return;

        if (typeof jQuery === "undefined")
            removeChildDragDrop = false;

        while (parent.firstChild) 
        {
            const e = parent.removeChild(parent.firstChild);
    
            if (removeChildDragDrop)
                DomUtils.#recursiveRemoval(e);
        }
    }

    static #recursiveRemoval(e)
    {
        if (!e || e.nodeType === 3)
            return;

        const elem = e instanceof jQuery ? e : jQuery(e);
        if (elem.length === 0)
            return;

        DomUtils.#destroyWidgets(elem);
        elem.find("*").off();
        elem.off().remove();
    }

    static #WIDGET_CLASSES = ["draggable", "droppable"];

    static #destroyWidgets(jEl)
    {
        /** verify it is a jquery element */
        if (!jEl || jEl.length === 0 || !jQuery.ui)
            return;

        for (const widget of DomUtils.#WIDGET_CLASSES)
        {
            const selector = `:data(ui-${widget})`;
            const matches = jEl.find(selector).addBack(selector)

            for (let i = matches.length - 1; i >= 0; i--)
                DomUtils.#destroySingleWidget(matches[i], widget);
        }
    }

    static #destroySingleWidget(node, widget)
    {
        if (!node || !widget)
            return;

        try
        {
            jQuery(node)[widget]("destroy");
        }
        catch (e)
        {
            console.warn(e);
        }
    }
     
    static removeNode(node)
    {
        DomUtils.removeAllChildNodes(node);
        if (node?.parentNode)
            node.parentNode.removeChild(node);
    }

    static remove(node)
    {
        DomUtils.removeNode(node);
    }

    static hide(node)
    {
        if (node)
            node.style.display = "none";
    }

    static show(node)
    {
        if (node)
            node.style.display = "block";
    }
}
