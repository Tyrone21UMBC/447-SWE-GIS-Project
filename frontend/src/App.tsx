// 1. Modified this import to include useRef and useEffect
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useSession } from './auth.ts';
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
import Basemap from '@arcgis/core/Basemap.js'
import LocalBasemapsSource from '@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource.js'
import { getBmp, useBmps, type BmpRecord } from './data/bmps.ts'
import { BMP_LAYER_ID, createBmpLayer, extentAround } from './map/bmpLayer.ts'

// import for the CSS styling format
import type { CSSProperties } from "react";

// No web map: its layers were all hidden anyway, and loading it cost ~20 extra requests.
// (UMBC Stormwater Design & Construction Base Map, item 697b78c682614eee9fc1e94c1c5a9af5)
const UMBC_CENTER = '-76.7115,39.2555';
const UMBC_SCALE = 9000;
// A short basemap list: the default gallery downloads all ~35 Esri basemaps (~1.5 MB) on load
const BASEMAPS = new LocalBasemapsSource({
  basemaps: ['streets-night-vector', 'satellite', 'hybrid', 'topo-vector', 'gray-vector'].map(id => Basemap.fromId(id)!),
});
// Stylesheets format for styles
// Styling objects as opposed to styling files 
const appStyles: CSSProperties = {
  display: "block",
  width: "100%",
  height: "calc(100vh - var(--header-height))",
  marginTop: "var(--header-height)",
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
  // SWM Tracking Number of the clicked BMP
  const [selectedBMP, setSelectedBMP] = useState<string | null>(null);
  const navigate = useNavigate();
  const isLoggedIn = useSession() !== null;
  // GIS BMPs right away; ones added in the app when they arrive from the backend
  const { records } = useBmps();
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const layerRecords = useRef<BmpRecord[] | null>(null);   // what the map layer was built from
  const [viewReady, setViewReady] = useState(false);
  // /?bmp=<SWM Tracking Number> opens the map on that BMP (the Admin page links here)
  const focus = useSearchParams()[0].get('bmp');
  const focused = useRef<string | null>(null);
  // 3. Added useEffect hook to manage layer visibility configurations on map load
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleViewReady = () => {
      const view = mapElement.view;

      if (view && view.map) {
        // Keep the view on campus: panning stops at the edge of our BMPs plus a margin,
        // and zooming out stops at about the whole campus
        view.constraints = { geometry: extentAround(recordsRef.current), minScale: 20000, maxScale: 500, rotationEnabled: false };

        if (!view.map.findLayerById(BMP_LAYER_ID)) {
          view.map.add(createBmpLayer(recordsRef.current));
          layerRecords.current = recordsRef.current;
        }

        // Detect clicks/touches on our BMPs
        mapElement._clickHandle?.remove();
        const clickHandle = view.on("click", async (event: any) => {
          // Looked up per click: the layer is rebuilt when BMPs are added
          const response = await view.hitTest(event, { include: [view.map.findLayerById(BMP_LAYER_ID)] });
          const hit = response.results.find((r: any) => r.type === "graphic");
          setSelectedBMP(hit ? hit.graphic.attributes.trackingNumber : null);
        });

        // Store the handle so it can be removed later
        mapElement._clickHandle = clickHandle;
        setViewReady(true);
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

  // Rebuild the layer when the list changes (app-added BMPs arrived, or one was added)
  useEffect(() => {
    const view = mapRef.current?.view;
    if (!viewReady || !view || layerRecords.current === records) return;
    const old = view.map.findLayerById(BMP_LAYER_ID);
    if (old) view.map.remove(old);
    view.map.add(createBmpLayer(records));
    layerRecords.current = records;
    view.constraints = { ...view.constraints, geometry: extentAround(records) };
  }, [records, viewReady]);

  // Zoom to and select the BMP in the URL, once it's in the list
  useEffect(() => {
    const record = getBmp(focus ?? undefined, records);
    const view = mapRef.current?.view;
    if (!viewReady || !view || !record || focused.current === record.trackingNumber) return;
    focused.current = record.trackingNumber;
    view.goTo({ center: [record.lon, record.lat], scale: 1500 }).catch(() => {});
    setSelectedBMP(record.trackingNumber);
  }, [focus, records, viewReady]);

  return (
    <>
      <nav>
        <Header />

          {/* 4. Added ref={mapRef} right here into your arcgis-map tag */}
          {/* <arcgis-map ref={mapRef} item-id={WEB_MAP_ITEM_ID} style={appStyles} basemap="arcgis/navigation-night"> */}
          <arcgis-map ref={mapRef} style={appStyles} basemap="streets-night-vector" center={UMBC_CENTER} scale={UMBC_SCALE}>
            <arcgis-zoom slot="top-left"></arcgis-zoom>
            {/*<arcgis-home slot="top-left"></arcgis-home>}
            <arcgis-search slot="top-right"></arcgis-search>
            
            {/* The Basemap Gallery filter hidden inside an expand button */}
            <arcgis-expand slot="top-right">
              <arcgis-basemap-gallery source={BASEMAPS}></arcgis-basemap-gallery>
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
              // Logged out, the report page sends you to log in and then back to this BMP
              navigate(`/reports/${encodeURIComponent(selectedBMP)}`);
            }}
                 
          >
            {isLoggedIn ? "Report an issue" : "Log in to report an issue"}
          </button>
          )}
        </nav>
    </>
  )
}

export default App
