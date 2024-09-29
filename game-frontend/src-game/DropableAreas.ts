export default class DropableAreas {

    static getCompanyAreaPlayerAddNew()
    {
        return DropableAreas.get("create_new_company");
    }
    
    static get(sId:string)
    {
        return document.getElementById(sId); 
    }

    static discardpile() 
    { 
        return DropableAreas.get("icon_bar_discardpile"); 
    }
    
    static sideboard() 
    { 
        return DropableAreas.get("icon_bar_sideboard"); 
    }
    
    static playdeck() 
    { 
        return DropableAreas.get("icon_bar_playdeck"); 
    }
    
    static hand() 
    { 
        return DropableAreas.get("playercard_hand_droppable"); 
    }

    static handContent()
    {
        return DropableAreas.get("playercard-hand-content");
    }
   
    static victory() 
    { 
        return DropableAreas.get("shared_victories"); 
    }

    static stagagingArea() 
    { 
        return DropableAreas.get("staging_area_drop"); 
    }

    static outOfPlay()
    {
        return DropableAreas.get("shared_outofplay");
    }
}
