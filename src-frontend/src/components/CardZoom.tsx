

const addImage = function(image:string, left:boolean)
{
    if (image === "")
        return <></>
    else
        return <img src={image} alt="" />
}

export default function RenderCardPreview( { image, left = true }: {image:string, left:boolean})
{
    return <div className={"card-zoom " + (left ? "card-zoom-left" : "card-zoom-right")}>
        {addImage(image, left)}
    </div>
}