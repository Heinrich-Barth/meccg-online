import * as React from "react";
import { BACKSIDE_IMAGE } from "../application/Types";
import PROXY_URL from "../operations/Proxy";
import TextField from "@mui/material/TextField";

export function GetCurrentAvatar()
{
    const code = localStorage.getItem("meccg_avatar") ?? "";
    if (code)
        return code;

    return "";
}
export function GetCurrentAvatarImage()
{
    const img = localStorage.getItem("meccg_avatari") ?? "";
    if (img)
        return img;

    return "";
}
export function SetCurrentAvatar(code:string, img:string)
{
    if (code)
        localStorage.setItem("meccg_avatar", code);
    else if (localStorage.getItem("meccg_avatar"))
        localStorage.removeItem("meccg_avatar");

    if (img)
        localStorage.setItem("meccg_avatari", img);
    else if (localStorage.getItem("meccg_avatari"))
        localStorage.removeItem("meccg_avatari");
}

function requireCssByCode(code:string)
{
    return code === "" ? "avatar-backside" : "";
}

export default function LoadAvatar({onValidAvatar}:{onValidAvatar:Function})
{
    const [currentCode, setCurrentCode] = React.useState("");
    const [imageList, setImageList] = React.useState<any>({});

    function requireImageByCode(code:string, imageList:any)
    {
        if (imageList[code]?.image)
        {
            onValidAvatar(code, imageList[code].image);
            return imageList[code].image;
        }

        return BACKSIDE_IMAGE;
    }
    
    React.useEffect(() => {
        fetch(PROXY_URL + "/data/list/images")
        .then(res => res.json())
        .then((json) => {
            if (json.images)
            {
                setImageList(json.images);
                onValidAvatar(GetCurrentAvatar());
            }
        })
        .catch(console.error)
        .finally(() => setCurrentCode(GetCurrentAvatar()));
    }, [setImageList, setCurrentCode])

    return <>
        <div className="room-image room-image-game">
            <img src={requireImageByCode(currentCode, imageList)} alt={"avatar"} className={requireCssByCode(currentCode)} decoding="async" />
        </div>
        <br/>
        <TextField id="enter_room" value={currentCode} variant="standard" margin="dense" autoFocus onChange={(e) => setCurrentCode(e.target.value.toLowerCase())} fullWidth label="Avatar code" placeholder="Card code    " />
    </>
}