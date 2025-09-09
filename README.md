Project Summary
The project is a web-based property management system designed for real estate professionals and buyers. It features an interactive mapping interface that visualizes properties, integrates real-time data from the Reelly API, and enhances user experience with advanced filtering options and detailed property information. Recent updates include comprehensive Google Maps integration with property clustering, color coding for property types, and enhanced GIS capabilities, significantly improving data analysis and property management functionalities.

Project Module Description
FilterPanel: Provides options for filtering property listings.
PropertyMap: Displays property locations on an interactive map with real-time data and GIS capabilities.
PropertyCard: Offers a quick summary of each property in the listing.
PropertyDetail: Displays detailed information about selected properties.
SearchManager: Manages search functionalities across listings.
FilterManager: Updates filter options and manages the filter data structure.
PropertyMapContext: Manages application state across components, including property markers and loading functions, with added functionality for updating property locations.
ApiSettingsPanel: Allows users to toggle between real and mock data for testing.
PropertyFilter: Component for filtering properties based on various criteria.
GISSettingsPanel: Manages GIS API settings and visibility options for emirates and areas, including toggling boundaries and GIS layers.
MapController: Handles map view updates and interactions.
MapEditorComponent: Provides functionality for adding, editing, and deleting property markers on the map, including drag-and-drop capabilities.
MapLegend: Displays a legend for color coding on the map, helping users interpret property types and GIS layer markers.
PropertyGoogleMap: Integrates Google Maps with features like property clustering and GIS data layers.
DataFormatter: Utility for safely accessing nested properties in objects.
Directory Tree
react_template/
│
├── README.md               # Project overview and setup instructions
├── eslint.config.js        # ESLint configuration for code quality
├── index.html              # Main HTML file for the application
├── package.json            # Project dependencies and scripts
├── postcss.config.js       # PostCSS configuration for CSS processing
├── public/data/            # Directory for mock data and GIS data
│   ├── gis/
│   │   ├── dubai_areas.json # GeoJSON data for Dubai areas
│   │   └── emirates.json     # GeoJSON data for emirates
│   ├── example.json
│   ├── mockProperties.json    # Mock property data for testing
│   └── propertyDetails.json    # Mock property details for testing
├── public/images/          # Contains Leaflet marker images
├── src/                    # Source code for the application
│   ├── App.jsx             # Main application component
│   ├── components/         # Reusable components
│   │   ├── filters/        # Filter-related components
│   │   │   ├── FilterPanel.jsx
│   │   │   └── PropertyFilter.jsx
│   │   ├── layout/         # Layout components
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── map/            # Map-related components
│   │   │   ├── PropertyMap.jsx
│   │   │   ├── GISSettingsPanel.jsx
│   │   │   ├── MapController.jsx
│   │   │   ├── MapEditorComponent.jsx
│   │   │   ├── MapLegend.jsx
│   │   │   └── PropertyGoogleMap.jsx
│   │   └── property/       # Property-related components
│   │       ├── PropertyCard.jsx
│   │       └── PropertyDetail.jsx
│   ├── contexts/           # Context API for state management
│   │   └── PropertyMapContext.jsx
│   ├── index.css           # Global CSS styles
│   ├── main.jsx            # Entry point for the application
│   ├── services/           # Service modules for managing data
│   │   ├── ApiTest.js
│   │   ├── CorsProxy.js
│   │   ├── FilterManager.js
│   │   ├── GISApiService.js # GIS API service
│   │   ├── GoogleMapsApiService.js # Google Maps API service
│   │   ├── MapService.js
│   │   ├── MarkerManager.js
│   │   ├── RealtyApiService.js
│   │   └── DataFormatter.js  # Utility for accessing nested properties
├── styles/                 # CSS styles for components
│   ├── mapMarkers.css
│   └── leaflet.css
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.js          # Vite configuration for development
File Description Inventory
README.md: Overview of the project and setup instructions.
eslint.config.js: Configuration for ESLint to enforce coding standards.
index.html: The main HTML structure of the application.
package.json: Lists dependencies and scripts for building and running the project.
postcss.config.js: Configuration for PostCSS processing.
public/data/: Contains mock data files and GIS data files for testing and development.
public/images/: Contains Leaflet marker images.
src/: Contains all the source code for the application, including components, contexts, and services.
styles/: Contains CSS files for styling components.
tailwind.config.js: Configuration file for Tailwind CSS.
vite.config.js: Configuration for Vite, the build tool used in the project.
DataFormatter.js: Utility for safely accessing nested properties in objects.
Technology Stack
React: Frontend library for building user interfaces.
Vite: Build tool for fast development.
Tailwind CSS: Utility-first CSS framework for styling.
ESLint: Tool for identifying and fixing problems in JavaScript code.
PostCSS: Tool for transforming CSS with JavaScript plugins.
Leaflet: JavaScript library for interactive maps.
Reelly API: API for fetching real estate property data.
GIS API: API for enhanced mapping capabilities.
Google Maps API: API for integrating Google Maps features.
CORS Proxy: Service to handle CORS issues when making API requests.
Axios: Promise-based HTTP client for the browser and Node.js.
Usage
Install dependencies:
cd react_template
pnpm install
Run linter to check for issues:
pnpm run lint
Build the project:
pnpm run build
Start the development server:
npx vite
