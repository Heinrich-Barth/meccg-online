import { Button, Grid } from "@mui/material";
import React from "react";
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Dictionary from "../components/Dictionary";
import MeccgLogo from "../components/MeccgLogo";
import ViewCardBrowser, { SeachResultEntry, copyCode } from "../components/ViewCards";
import RenderCardPreview, { GetImagePreviewData, ImagePreviewInfo } from "../components/CardZoom";
import GetImageUri, { FetchFrenchImageUrl } from "../operations/GetImageUrlByLanguage";

const swapImage = function (id: string) {
    const elem = document.getElementById(id);
    if (elem === null)
        return;

    const src = elem.getAttribute("src");
    const flip = elem.getAttribute("data-flip");

    if (flip !== null && src !== null && flip !== "" && src !== "") {
        elem.setAttribute("src", flip);
        elem.setAttribute("data-flip", src);
    }
}

export default function ViewCards() {
    const [previewImage, setPreviewImage] = React.useState<ImagePreviewInfo|null>(null);

    React.useEffect(() => { FetchFrenchImageUrl() }, []);

    const renderSearchResult = function (img: SeachResultEntry, preferErrata:boolean, key: any) {
        const image = preferErrata && img.imageErrata ? img.imageErrata : img.image;
        const imgSrc = GetImageUri(image); 
        const isDCErrata = preferErrata && img.imageErrata;

        return <Grid item xs={12} sm={6} md={4} lg={3} xl={2} textAlign={"center"} key={img.code} className="cardbrowser-result">
                <img src={imgSrc} 
                    data-flip={GetImageUri(img.flip)} 
                    alt={img.code} 
                    title={img.code} 
                    loading="lazy" decoding="async" id={"image-" + key}
                    onMouseEnter={(e) => setPreviewImage(GetImagePreviewData("image-" + key, e.pageX))}
                    onMouseLeave={() => setPreviewImage(null)}
                />
                {isDCErrata && (<div className="view-card-errata">DC Errata</div>)}
                <Button variant="contained" className="button-copy" onClick={() => copyCode(img.code)} startIcon={<ContentCopyIcon />}>Copy Code</Button>
                {img.flip !== "" && (
                    <Button variant="contained" className="button-flip" onClick={() => swapImage("image-" + key)} startIcon={<CachedIcon />}>Flip</Button>
                )}
            </Grid>
    }

    return <React.Fragment>
        
        <RenderCardPreview image={previewImage?.image??""} left={previewImage?.left??true} />
        <div className={"application-home "}>
            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={10} md={8} textAlign={"center"} className="paddingBottom3em">
                    {MeccgLogo()}
                </Grid>
                <Grid item xs={12} textAlign={"center"}>
                    <h1 data-translation="home.startgame">{Dictionary("frontend.menu.cardbrowser", "View Cards")}</h1>
                </Grid>
                <ViewCardBrowser renderCardEntry={renderSearchResult} subline="" />
            </Grid>
        </div>
    </React.Fragment>
}
