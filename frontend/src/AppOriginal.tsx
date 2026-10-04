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
  return (
    <>
      <nav>
        <Header />

          <arcgis-map item-id={WEB_MAP_ITEM_ID} style={appStyles}>
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
