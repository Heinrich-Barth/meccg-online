import { CardImagesMap } from "./ImageList";
import MapData, { IMap, MapDataImages } from "./MapData";
import MapDataUnderdeeps, { IMapDataUnderdeeps } from "./MapDataUnderdeeps";
import { ICard } from "./Types";

const pMapData = new MapData();
let pDataUnderdeeps:IMapDataUnderdeeps|null = null;

export interface IMapData {
    mapdata: IMap,
    siteList: MapDataImages,
    underdeeps: IMapDataUnderdeeps
}

export default function CreateCardsMap(jsonCards:ICard[], mapPositionsFile:string, _imageList:CardImagesMap) : IMapData
{
    pMapData.init(jsonCards, mapPositionsFile);

    if (pDataUnderdeeps === null)
        pDataUnderdeeps = new MapDataUnderdeeps(jsonCards).get(_imageList);

    return {

        mapdata:  pMapData.getMapdata(),
        siteList: pMapData.getSiteList(),
        underdeeps : pDataUnderdeeps
        
    }
};