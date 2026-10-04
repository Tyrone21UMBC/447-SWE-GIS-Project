// Register only the ArcGIS web components this view uses. Each import
// self-registers its custom element (e.g. <arcgis-map>).
import '@arcgis/map-components/dist/components/arcgis-map'
import '@arcgis/map-components/dist/components/arcgis-zoom'
import '@arcgis/map-components/dist/components/arcgis-home'
import '@arcgis/map-components/dist/components/arcgis-search'
import '@arcgis/map-components/dist/components/arcgis-expand'
import '@arcgis/map-components/dist/components/arcgis-legend'
import '@arcgis/map-components/dist/components/arcgis-layer-list'
import Header from './components/Header';
import './App.css';
import { useRef, useEffect } from "react";
// import for the CSS styling format
import type { CSSProperties } from "react";

// UMBC Stormwater Design & Construction Base Map (public web map, ArcGIS Online).
const WEB_MAP_ITEM_ID = '697b78c682614eee9fc1e94c1c5a9af5';

// Stylesheets format for styles
// Styling objects as opposed to styling files 
const appStyles: CSSProperties = {
  display: "block",
  width: "100%",
  height: "calc(100vh - 10vh)",
  marginTop: "10vh",
};



function App() {
  const mapRef = useRef<HTMLArcgisMapElement>(null);
  
  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const handleReady = (event: Event) => {
      const map = (event.target as HTMLArcgisMapElement).map;
      if (!map) return;
      const keep = ["Layers - BMP Database", "Layers - BMP Drainage Areas"];
      map.layers.forEach((layer) => {
        layer.visible = keep.includes(layer.title ?? "");
      });
    };
    element.addEventListener("arcgisViewReadyChange", handleReady);
    return () => element.removeEventListener("arcgisViewReadyChange", handleReady);
  }, []);

  return (
    <>
      <nav>
        <Header />

        <arcgis-map ref={mapRef} item-id={WEB_MAP_ITEM_ID} style={appStyles}>
          <arcgis-zoom slot="top-left"></arcgis-zoom>
          <arcgis-home slot="top-left"></arcgis-home>
          <arcgis-search slot="top-right"></arcgis-search>
          <arcgis-expand slot="top-right">
          <arcgis-legend></arcgis-legend>
          </arcgis-expand>
          <arcgis-expand slot="top-right">
            <arcgis-layer-list></arcgis-layer-list>
          </arcgis-expand>
        </arcgis-map>
      </nav>
    </>
  )
}

export default App
