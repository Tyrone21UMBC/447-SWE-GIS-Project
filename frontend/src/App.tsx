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
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js'
import Graphic from '@arcgis/core/Graphic.js'
import { BMP_RECORDS, type BmpRecord } from './data/bmpMaster.ts'
import './App.css'

// import for the CSS styling format
import type { CSSProperties } from "react";

// UMBC Stormwater Design & Construction Base Map (public web map, ArcGIS Online).
const WEB_MAP_ITEM_ID = '697b78c682614eee9fc1e94c1c5a9af5'
const UMBC_VIEW = { center: [-76.7115, 39.2555], scale: 9000 };
const BMP_OUTLINE_LAYER_ID = 'umbc-bmp-outlines';
const BMP_POINT_LAYER_ID = 'umbc-bmp-points';

const BMP_FIELDS = [
  { name: 'OBJECTID', type: 'oid' as const },
  { name: 'id', type: 'string' as const },
  { name: 'name', type: 'string' as const },
  { name: 'trackingNumber', type: 'string' as const },
];

function bmpAttributes(r: BmpRecord, i: number) {
  return { OBJECTID: i + 1, id: r.id, name: r.name ?? r.trackingNumber, trackingNumber: r.trackingNumber };
}

// Our own BMP layers, built from the master list. Outlines come from UMBC's
// SWM Tracking geodatabase; BMPs it has no outline for are drawn as points.
// The web map's "BMP Database" layer is an older, partial copy.
function createBmpLayers() {
  const common = {
    objectIdField: 'OBJECTID',
    fields: BMP_FIELDS,
    spatialReference: { wkid: 4326 },
    outFields: ['*'],
    popupTemplate: { title: '{name}', content: 'BMP ID: {trackingNumber}' },
  };
  const outlines = new FeatureLayer({
    ...common,
    id: BMP_OUTLINE_LAYER_ID,
    title: 'BMPs (outlines)',
    geometryType: 'polygon',
    source: BMP_RECORDS.filter(r => r.shape).map((r, i) => new Graphic({
      geometry: { type: 'polygon', rings: r.shape!, spatialReference: { wkid: 4326 } },
      attributes: bmpAttributes(r, i),
    })),
    renderer: {
      type: 'simple',
      symbol: { type: 'simple-fill', color: [247, 204, 13, 0.35], outline: { color: '#f7cc0d', width: 1.5 } },
    },
  });
  const points = new FeatureLayer({
    ...common,
    id: BMP_POINT_LAYER_ID,
    title: 'BMPs (no outline)',
    geometryType: 'point',
    source: BMP_RECORDS.filter(r => !r.shape && r.lat !== null && r.lon !== null).map((r, i) => new Graphic({
      geometry: { type: 'point', latitude: r.lat!, longitude: r.lon! },
      attributes: bmpAttributes(r, i),
    })),
    renderer: {
      type: 'simple',
      symbol: { type: 'simple-marker', size: 9, color: '#f7cc0d', outline: { color: '#000', width: 1 } },
    },
  });
  return [outlines, points];
}

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
  // UMBC BMP Sequence Number of the clicked marker
  const [selectedBMP, setSelectedBMP] = useState<string | null>(null);
  const navigate = useNavigate();
  // 3. Added useEffect hook to manage layer visibility configurations on map load
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleViewReady = () => {
      const view = mapElement.view;

      if (view && view.map) {
        // Web map's saved extent is too wide; start centered on campus
        view.goTo(UMBC_VIEW, { animate: false });

        // Hide every web map layer, including its BMP Database
        const ourLayers = [BMP_OUTLINE_LAYER_ID, BMP_POINT_LAYER_ID];
        view.map.layers.forEach((layer: any) => {
          if (!ourLayers.includes(layer.id)) layer.visible = false;
        });

        if (!view.map.findLayerById(BMP_OUTLINE_LAYER_ID)) {
          view.map.addMany(createBmpLayers());
        }
        const bmpLayers = ourLayers.map(id => view.map.findLayerById(id));

        // Detect clicks/touches on our BMPs
        mapElement._clickHandle?.remove();
        const clickHandle = view.on("click", async (event: any) => {
          const response = await view.hitTest(event, { include: bmpLayers });
          const hit = response.results.find((r: any) => r.type === "graphic");
          setSelectedBMP(hit ? hit.graphic.attributes.id : null);
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
            {/*<arcgis-home slot="top-left"></arcgis-home>}
            <arcgis-search slot="top-right"></arcgis-search>
            
            {/* The Basemap Gallery filter hidden inside an expand button */}
            <arcgis-expand slot="top-right">
              <arcgis-basemap-gallery></arcgis-basemap-gallery>
            </arcgis-expand>

            <arcgis-expand slot="top-right">
              <arcgis-legend></arcgis-legend>
            </arcgis-expand>
            {/* 
            <arcgis-expand slot="top-right">
              <arcgis-layer-list></arcgis-layer-list>
            </arcgis-expand> */}

          </arcgis-map>
      
          {selectedBMP && (
          <button 
            style={reportButton}
            onClick={() => {
              navigate(`/reports/${encodeURIComponent(selectedBMP)}`);
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
