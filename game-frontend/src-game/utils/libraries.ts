

const ArrayList = function(elem:any)
{
    let _elem = elem;

    return {

        find : function(sSelector:string)
        {
            if (_elem === null || sSelector === undefined || sSelector === "")
                return ArrayList(null);
            else
                return ArrayList(_elem.querySelectorAll(sSelector));
        },

        findByClassName : function(sClass:string)
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

        each : function(fnCallback:Function)
        {
            try
            {
                if (_elem === null || _elem.length === undefined)
                    return;

                const len = _elem.length;
                for (let i = 0; i < len; i++)
                    fnCallback(_elem[i]);
            }
            catch(err:any)
            {
                console.error(err.message);
            }
        }
    }

};

export class MeccgUtils {

    static logError(err:any)
    {
        console.error(err);
    }

    static logWarning(e:any)
    {
        console.warn(e);
    }
    
    static logInfo(e:any)
    {
        console.info(e);
    }
}

class DomUtils extends MeccgUtils {

    static unbindAndRemove(jElement:any)
    {
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
        }
    }

    static closestByClass(node:any, sClass:string)
    {
        return DomUtils.findParentByClass(node, sClass);
    }
    
    static closestByType(node:any, type:string):any
    {
        if (node === null || node === undefined || type === undefined || type === "")
            return null;

        if (node.nodeName?.toLowerCase() === type)
            return node;
        else
            return DomUtils.closestByType(node.parentNode, type);
    }

    static findParentByClass(node:any, sClass:string):any
    {
        if (node === null || node === undefined || sClass === undefined || sClass === "")
            return null;

        if (node.classList !== undefined && node.classList.contains(sClass))
            return node;
        else
            return DomUtils.findParentByClass(node.parentNode, sClass);
    }

    static empty(node:any)
    {
        DomUtils.removeAllChildNodes(node);
    }

    /**
     * Remove all child nodes from DOM element
     * @param {Object} parent 
     */
     static removeAllChildNodes(parent:any) 
     {
         if (parent !== null)
         {
             while (parent.firstChild) 
                 parent.removeChild(parent.firstChild);
         }
     }
     
    static removeNode(node:any)
    {
        if (node)
        {
            DomUtils.removeAllChildNodes(node);
            if (node !== undefined && node.parentNode !== undefined && node.parentNode !== null)
                node.parentNode.removeChild(node);
        }
    }

    static remove(node:any)
    {
        DomUtils.removeNode(node);
    }

    static hide(node:any)
    {
        if (node)
            node.style.display = "none";
    }

    static show(node:any)
    {
        if (node)
            node.style.display = "block";
    }
}

export { ArrayList }
export default DomUtils
