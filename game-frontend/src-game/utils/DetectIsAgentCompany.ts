import { ArrayList } from "./libraries";

export default function detectIsAgentCompany(companyContainer:any)
{
    if (companyContainer == null)
        return false;
    
    let bHasRevealed = false;
    let nCharacters = 0;
    
    ArrayList(companyContainer.querySelectorAll(".company-character-host")).each(function(elem:any)
    {
        ArrayList(elem.querySelectorAll("img.card-icon")).each(function (img:any)
        {
            if (img.parentElement.getAttribute("data-card-type") === "character")
            {
                nCharacters++;
                if (img.getAttribute("src") !== "/data/backside")
                    bHasRevealed = true;
            }
        });
    });

    return nCharacters === 1 && !bHasRevealed;
}