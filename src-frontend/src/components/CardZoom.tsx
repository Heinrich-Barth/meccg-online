
export type ImagePreviewInfo = {
    image: string;
    left: boolean;
}

export function GetImagePreviewDataByImageUri(uri:string, x: number):ImagePreviewInfo|null
{
    if (!uri)
        return null;

    const half = window.innerWidth / 2;
    const left = x < half;
    return {
        image: uri,
        left: !left
    }
}

export function GetImagePreviewData(id:string, x: number):ImagePreviewInfo|null
{
    const img = document.getElementById(id);
    if (img === null)
        return null;

    const src = img.getAttribute("src");
    if (!src)
        return null;

    const half = window.innerWidth / 2;
    const left = x < half;
    return {
        image: src,
        left: !left
    }
}

export default function RenderCardPreview( { image, left = true }: {image:string, left:boolean})
{
    return <div className={"card-zoom " + (left ? "card-zoom-left" : "card-zoom-right")}>
        {image !== "" && (<img src={image} alt="" />)}
    </div>
}