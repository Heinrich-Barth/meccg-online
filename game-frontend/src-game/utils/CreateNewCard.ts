import { MeccgPlayers } from "../meccg-api";
import CardList from "./cardlist";

const getCardStateCss = function(nState:number)
{
    if (nState === 0)
        return "state_ready";
    else if (nState === 90)
        return "state_tapped";
    else if (nState === 91)
        return "state_tapped_fixed";
    else if (nState === 180)
        return "state_wounded";
    else if (nState === 270)
        return "state_rot270";
    else
        return "";
};

export default function CreateNewCard(card:any, idprefix:string = "ingamecard_")
{
   const _backside = CardList().getFlipSide(card.code);
   const pImage = document.createElement("img");
   pImage.setAttribute("class", "card-icon");
   pImage.setAttribute("src", _backside);
   pImage.setAttribute("data-image-backside", _backside);
   pImage.setAttribute("decoding", "async");
   pImage.setAttribute("crossorigin", "anonymous");
   pImage.setAttribute("data-uuid", card.uuid);
   pImage.setAttribute("data-img-image", CardList().getImage(card.code));
   pImage.setAttribute("data-revealed", card.revealed !== false ? "true" : "false");

   const isMine = typeof card.owner === "undefined" || card.owner === "" || MeccgPlayers.isChallenger(card.owner);
   if (isMine)
   {
       pImage.setAttribute("data-owner", "");
       pImage.setAttribute("data-is-mine", "true");
   }
   else
   {
       pImage.setAttribute("data-owner", card.owner);
       pImage.setAttribute("data-is-mine", "false");
   }
                
   const pDiv = document.createElement("div");
   pDiv.setAttribute("class", "card " + getCardStateCss(card.state));
   pDiv.setAttribute("id", idprefix + card.uuid);
   pDiv.setAttribute("data-uuid", card.uuid);
   pDiv.setAttribute("data-card-code", CardList().getSafeCode(card.code));
   pDiv.setAttribute("data-card-type", card.type);
   pDiv.setAttribute("draggable", "true");
   pDiv.setAttribute("data-revealed", card.revealed !== false ? "true" : "false");

   if (MeccgPlayers.isMyCard(card.owner))
       pDiv.classList.add("card-is-mine");

   if (card.token !== undefined && card.token > 0)
   {
       pDiv.setAttribute("data-token", card.token);
       pDiv.setAttribute("title", "Tokens: " + card.token);
   }       

   pDiv.appendChild(pImage);
   return pDiv;
}
