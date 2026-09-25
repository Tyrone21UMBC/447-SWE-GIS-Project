// Register only the ArcGIS web components this view uses. Each import
// self-registers its custom element (e.g. <arcgis-map>).
import '@arcgis/map-components/dist/components/arcgis-map'
import '@arcgis/map-components/dist/components/arcgis-zoom'
import '@arcgis/map-components/dist/components/arcgis-home'
import '@arcgis/map-components/dist/components/arcgis-search'
import '@arcgis/map-components/dist/components/arcgis-expand'
import '@arcgis/map-components/dist/components/arcgis-legend'
import '@arcgis/map-components/dist/components/arcgis-layer-list'
import './App.css'

// UMBC Stormwater Design & Construction Base Map (public web map, ArcGIS Online).
const WEB_MAP_ITEM_ID = '697b78c682614eee9fc1e94c1c5a9af5'

function App() {
  return (
    <>
    <div className='header'>
      <img src='umbc-logo.png' alt="UMBC Logo" className='header-logo' />
       <h1 className='header-title'>
        Facilities Management
      </h1>
    </div>
    <arcgis-map item-id={WEB_MAP_ITEM_ID} className="map">
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
  </>
  )
}

export default App
