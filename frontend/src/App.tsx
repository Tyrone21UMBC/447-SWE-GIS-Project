// 1. Modified this import to include useRef and useEffect
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
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
const reportButton: CSSProperties = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  zIndex: 10000,
  padding: "12px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#000",
  color: "#f7cc0d",
  cursor: "pointer",
}

function App() {
  // 2. Added ref to grab the arcgis-map DOM node safely
  const mapRef = useRef<any>(null);
  const [selectedBMP, setSelectedBMP] = useState<any>(null);
  const navigate = useNavigate();
  // 3. Added useEffect hook to manage layer visibility configurations on map load
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleViewReady = () => {
      const view = mapElement.view;

      if (view && view.map) {
        view.map.layers.forEach((layer: any) => {
          if (layer.title === "Layers - BMP Database") {
            layer.visible = true;
          } else {
            layer.visible = false;
          }
        });

        // Detect clicks/touches on the map
        const clickHandle = view.on("click", async (event: any) => {
          const response = await view.hitTest(event);

          if (response.results.length > 0) {
            const graphic = response.results[0].graphic;

            console.log("Feature:", graphic);
            console.log("Attributes:", graphic.attributes);

            const layer = graphic.layer;

            if (layer && layer.queryFeatures) {
              const query = layer.createQuery();
              query.objectIds = [graphic.attributes.OBJECTID];
              query.outFields = ["*"];
              query.returnGeometry = false;

              const result = await layer.queryFeatures(query);

              if (result.features.length > 0) {
                const attributes = result.features[0].attributes;
                console.log("Selected BMP:", attributes);
                setSelectedBMP(attributes);
              }
            }
          }
        });

        // Store the handle so it can be removed later
        mapElement._clickHandle = clickHandle;
      }
    };

    mapElement.addEventListener(
      "arcgisViewReadyChange",
      handleViewReady
    );

    return () => {
      mapElement.removeEventListener(
        "arcgisViewReadyChange",
        handleViewReady
      );

      if (mapElement._clickHandle) {
        mapElement._clickHandle.remove();
      }
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
      
          {selectedBMP && (
          <button 
            style={reportButton}
            onClick={() => {
              navigate("/reports", {
                state: {
                  bmp: selectedBMP
                }
              });
            }}
                 
          >
            Report an issue
          </button>
          )}
        </nav>
    </>
  )
}

export default App
