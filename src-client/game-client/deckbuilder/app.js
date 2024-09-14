
const g_pCardList = CardList.createInstance({}, [], true, true);

const getImageUrlByCode = function(code)
{
    return g_pCardList.getImage(code);        
};