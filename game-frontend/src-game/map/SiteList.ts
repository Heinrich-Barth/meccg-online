const SiteList = {

    register : function(list:any)
    {
        const result = [];

        if (list === undefined || !Array.isArray(list) || list.length === 0)
            return;

        for (let elem of list)
            result.push(elem);

        result.sort();
        localStorage.setItem("sitelist", JSON.stringify(result));
    }

}

if (localStorage.getItem("sitelist"))
    localStorage.removeItem("sitelist");

export default SiteList;