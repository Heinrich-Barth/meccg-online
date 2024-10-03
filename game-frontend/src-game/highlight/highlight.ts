
/**
 * Handles highlighting of a company
 * 
 * It adds the css class
 * and also removes it after some time 
 * 
 */
class HighlightElement {

    /**
     * Check if the element may have the event
     * 
     * @param {String} sCompanyId 
     * @returns {Boolean} Success
     */
    addCss(sCompanyId:string)
    {
        if (sCompanyId === "")
            return false;

        const jCompany = document.getElementById("company_" + sCompanyId);

        /** avoid duplicate events */
        if (jCompany === null || jCompany.classList.contains("glowing-green"))
            return false;
        else
        {
            jCompany.classList.add("glowing-green");
            return true;
        }
    }

    /**
     * Start the timeout event to remove the class later
     * @param {String} sCompanyId 
     */
    startEvent(sCompanyId:string, nMillis:number)
    {
        if (nMillis < 1000)
            return;

        setTimeout(function()
        {
            let _id = sCompanyId;
            const elem = document.getElementById("company_" + _id);
            if (elem !== null)
                elem.classList.remove("glowing-green");

        }, nMillis)
    }

    /**
     * Create the event if possible 
     * 
     * @param {String} sCompanyId 
     */
    init(sCompanyId:string)
    {
        if (this.addCss(sCompanyId))
            this.startEvent(sCompanyId, 4100);
    }
}

export default function HighlightElementById(sCompanyId:string)
{
    if (sCompanyId)
        new HighlightElement().init(sCompanyId)
}
