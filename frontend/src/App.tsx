// 1. Modified this import to include useRef and useEffect
import React, { useRef, useEffect } from 'react';

// Register only the ArcGIS web components this view uses. Each import
// self-registers its custom element (e.g. <arcgis-map>).
import '@arcgis/map-components/dist/components/arcgis-map'
import '@arcgis/map-components/dist/components/arcgis-zoom'
import '@arcgis/map-components/dist/components/arcgis-home'
import '@arcgis/map-components/dist/components/arcgis-search'
import '@arcgis/map-components/dist/components/arcgis-expand'
import '@arcgis/map-components/dist/components/arcgis-legend'
import '@arcgis/map-components/dist/components/arcgis-layer-list'

// added later
import '@arcgis/map-components/dist/components/arcgis-basemap-gallery';
import '@arcgis/map-components/dist/components/arcgis-basemap-toggle';

import Header from './components/Header'
import './App.css'

// import for the CSS styling format
import type { CSSProperties } from "react";

// UMBC Stormwater Design & Construction Base Map (public web map, ArcGIS Online).
const WEB_MAP_ITEM_ID = '697b78c682614eee9fc1e94c1c5a9af5'

// Stylesheets format for styles
// Styling objects as opposed to styling files 
const appStyles: CSSProperties = {
  display: "block",
  width: "100%",
  height: "calc(100vh - 10vh)",
  marginTop: "10vh",
};

function App() {
  // 2. Added ref to grab the arcgis-map DOM node safely
  const mapRef = useRef<any>(null);
  
  // 3. Added useEffect hook to manage layer visibility configurations on map load
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleViewReady = () => {
      const view = mapElement.view;
      if (view && view.map) {
        // view.map.basemap = "arcgis-navigation-dark";

        view.map.layers.forEach((layer: any) => {
          // Explicitly isolate the exact layer name requested from your layer layout list
          if(layer.title === "Layers - BMP Database"){
            layer.visible = true;
          }
        //   else if(layer.title === "Layers - SWM Outfall Points"){
        //     layer.visible = true;
        //   }
          else{
            layer.visible = false;
          }
        });
      }
    };

    mapElement.addEventListener('arcgisViewReadyChange', handleViewReady);

    return () => {
      mapElement.removeEventListener('arcgisViewReadyChange', handleViewReady);
    };
  }, []);

  return (
    <>
      <nav>
        <Header />

          {/* 4. Added ref={mapRef} right here into your arcgis-map tag */}
          {/* <arcgis-map ref={mapRef} item-id={WEB_MAP_ITEM_ID} style={appStyles} basemap="arcgis/navigation-night"> */}
          <arcgis-map ref={mapRef} item-id={WEB_MAP_ITEM_ID} style={appStyles} basemap="streets-night-vector">
            <arcgis-zoom slot="top-left"></arcgis-zoom>
            <arcgis-home slot="top-left"></arcgis-home>
            <arcgis-search slot="top-right"></arcgis-search>
            
            {/* The Basemap Gallery filter hidden inside an expand button */}
            <arcgis-expand slot="top-right">
              <arcgis-basemap-gallery></arcgis-basemap-gallery>
            </arcgis-expand>

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
