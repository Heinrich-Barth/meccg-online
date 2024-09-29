import { HandCardsDraggable } from "../handcards-draggable";

export default function initSingleCardEvent(pCardDiv:any, slocation="inplay")
{
    if (pCardDiv === null)
        return;

    pCardDiv.setAttribute("data-location", slocation);

    HandCardsDraggable.initDraggableCard(pCardDiv);
}