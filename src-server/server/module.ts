
import InitRoutingGelerals from "./RoutingGenerals";
import InitRoutingHealth from "./RoutingHealth";
import InitRoutingMap from "./RoutingMap";
import InitRoutingPlay from "./RoutingPlay";

export default function InitRouting()
{
    InitRoutingPlay();
    InitRoutingMap();
    InitRoutingGelerals();
    InitRoutingHealth();
}