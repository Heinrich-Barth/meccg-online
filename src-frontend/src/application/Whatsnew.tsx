import * as React from "react";
import Dictionary from "../components/Dictionary";
import { useParams } from "react-router-dom";
import FetchBlog, { StoryData } from "../operations/FetchBlog";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Grid } from "@mui/material";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';                    

let isLoading = false;

function NothingThere() {
    return <>
        <h1>{Dictionary("frontend.menu.whatsnew", "What's new")}</h1>
        <p>Nothing there.</p>;
    </>
}

const getStoryById = function (stories: StoryData[], id: string) {
    if (id === "")
        return null;

    for (let story of stories) {
        if (story.id === id)
            return story;
    }

    return null;
}

export default function Whatsnew() {

    const { id } = useParams();

    const [stories, setStories] = React.useState<StoryData[]>([]);
    const [viewDetails, setViewDetails] = React.useState(typeof id === "string" ? id : "");

    const sortAndUpdateStories = function(list:StoryData[])
    {
        setStories(list.sort((a,b) => b.date - a.date));
    }

    React.useEffect(() => {
        if (isLoading)
            return;

        isLoading = true;
        FetchBlog().then((res) => sortAndUpdateStories(res)).catch(console.error).finally(() => isLoading = false);

    }, [sortAndUpdateStories]);

    const RenderAll = function () {
        return <>
            <h1>{Dictionary("frontend.menu.whatsnew", "What's new")}</h1>
            <Grid container columnSpacing={1} rowSpacing={1}>
                {stories.map((story) => <Grid key={story.id} item xs={12} lg={6}>
                    <Card className="application-news-card">
                        <CardContent>
                            <Typography gutterBottom>
                                {new Date(story.date).toLocaleDateString()} - {story.releasenote ? "Release Note" : "News"}
                            </Typography>
                            <h2>{story.title}</h2>
                            {story.summary.split("\n").map((line, idx) => <Typography variant="body1" key={story.id + "-1-" + idx}>{line}</Typography>)}
                        </CardContent>
                        {story.description !== "" && (
                            <CardActions>
                                <Button size="small" variant="contained" onClick={() => setViewDetails(story.id)} startIcon={<VisibilityIcon />}>Details</Button>
                            </CardActions>
                        )}
                    </Card>
                </Grid>)}
            </Grid>
        </>
    }

    const RenderDetail = function ({ id, isOpen, onClose }: { id: string, isOpen: boolean, onClose: Function }) {
        const story = getStoryById(stories, id);
        if (story === null)
            return <></>;

        return <Dialog
            open={isOpen}
            onClose={() => onClose()}
            scroll="paper"
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
        >
            <DialogTitle id="scroll-dialog-title">{story.title}</DialogTitle>
            <DialogContent dividers={true}>
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                >
                    {story.summary.split("\n").map((line, idx) => <Typography variant="body1" key={story.id + "-1-" + idx}>{line}</Typography>)}
                    {story.description.split("\n").map((line, idx) => <Typography variant="body1" key={story.id + "-1-" + idx}>{line}</Typography>)}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button  variant="contained" startIcon={<CloseIcon />} onClick={() => onClose()}>OK</Button>
            </DialogActions>
        </Dialog>
    }

    return <>
        <div className={"application-home application-news"}>
            {stories.length === 0 ? <NothingThere /> : <RenderAll />}
            {stories.length > 0 && viewDetails !== "" && (<RenderDetail id={viewDetails} isOpen={viewDetails !== ""} onClose={() => setViewDetails("")} />)}
        </div>
    </>;
}