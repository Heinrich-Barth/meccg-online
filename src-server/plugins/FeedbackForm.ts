import getServerInstance from "../Server";
import { Request, Response } from "express";

const feedbackFormUrl = typeof process.env.FEEDBACK_FORM_URL === "string" ? process.env.FEEDBACK_FORM_URL : "";


export default function InitFeedbackEndpoint() {

    getServerInstance().get("/data/feedbackform", (_req:Request, res:Response) => {
        res.status(200).json({
            url: feedbackFormUrl
        });
    });

}