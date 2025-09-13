# Jetstream Tracker

A sophisticated real-time wind forecast validation tool that compares observed balloon movement with weather forecast data to assess the accuracy of wind predictions. This interactive web application visualizes balloon trajectories over time and provides detailed wind comparison analysis.

## 🎯 Project Purpose

This application serves as a **wind forecast validation system** that:

- **Validates Weather Forecasts**: Compares actual balloon movement (derived from GPS tracking) with predicted wind data from weather services
- **Assesses Forecast Accuracy**: Provides statistical analysis of wind speed and direction differences between observed and forecast data
- **Enables Research**: Supports meteorological research by providing tools to analyze wind prediction accuracy across different altitudes and time periods
- **Real-time Monitoring**: Offers live visualization of balloon positions and wind patterns over 24-hour periods

## 📊 Data Sources

### Primary Data Source: Windborne Systems Balloon Tracking
- **API Endpoint**: `https://a.windbornesystems.com/treasure`
- **Data Type**: Real-time balloon GPS tracking data
- **Format**: JSON arrays of [latitude, longitude, altitude] triplets
- **Frequency**: Hourly updates for the last 24 hours
- **Coverage**: Global balloon network
- **Why This Source**: Windborne Systems operates a network of high-altitude balloons that provide accurate GPS positioning data, making them ideal for wind analysis and forecast validation

### Secondary Data Source: Open-Meteo Weather Forecast API
- **API Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Data Type**: Weather forecast wind data
- **Parameters**: `wind_speed_10m`, `wind_direction_10m`
- **Resolution**: Hourly forecasts
- **Why This Source**: Open-Meteo provides free, reliable weather forecast data that's perfect for comparison with observed balloon movement

## 🚀 Key Features

### 1. Real-Time Balloon Tracking
- **24-Hour Coverage**: Displays balloon positions for the last 24 hours
- **Live Updates**: Automatically refreshes data every 2 minutes
- **Global Coverage**: Shows balloons worldwide with real-time positioning

### 2. Altitude-Based Color Coding
- **Green (0-5km)**: Low altitude balloons
- **Blue (5-10km)**: Mid-low altitude balloons  
- **Orange (10-20km)**: High altitude balloons
- **Red (>20km)**: Very high altitude balloons
- **Interactive Legend**: Toggle visibility of altitude ranges

### 3. Time-Based Animation System
- **Playback Controls**: Play, pause, restart, and speed control
- **Multiple Speeds**: 0.5x, 1x, and 2x playback speeds
- **Looping**: Optional continuous loop through 24-hour period
- **Keyboard Shortcuts**: Space (play/pause), N (now), Esc (clear selection)

### 4. Balloon Selection & Tracking
- **Individual Selection**: Click balloons to select and track them
- **Trajectory Visualization**: Shows selected balloon paths over time
- **Multi-Selection**: Track multiple balloons simultaneously
- **View Modes**: Switch between "All Points" and "Selected Only" views

### 5. Wind Comparison Analysis
- **Observed vs Forecast**: Compares actual balloon movement with predicted wind
- **Visual Arrows**: Blue arrows show observed wind, red arrows show forecast

### 6. Interactive Map Interface
- **MapLibre GL**: High-performance WebGL-based mapping
- **Smooth Navigation**: Pan, zoom, and rotate with hardware acceleration
- **Custom Styling**: Clean, professional map appearance

### 7. Advanced Performance Features
- **Web Workers**: Background processing for forecast calculations
- **Spatial Indexing**: RBush-based spatial indexing for efficient rendering
- **Lazy Loading**: On-demand data loading and processing
- **Caching**: Intelligent caching of forecast data and API responses

## 🛠️ Technical Architecture

### Frontend Stack
- **React 19.1.1**: Modern React with latest features
- **TypeScript 5.8.3**: Type-safe development
- **Vite 7.1.5**: Fast build tool and development server
- **MapLibre GL 5.7.1**: High-performance mapping library

### State Management
- **Zustand 5.0.8**: Lightweight state management
- **TanStack Query 5.87.4**: Server state management and caching
- **Multiple Stores**: Separate stores for UI, selection, and trails data

### Data Processing
- **Web Workers**: Background processing for forecast calculations
- **RBush 4.0.1**: Spatial indexing for efficient rendering
- **Zod 4.1.8**: Runtime type validation
- **Geolib 3.3.4**: Geographic calculations

### Development Tools
- **ESLint**: Code linting and formatting
- **TypeScript ESLint**: Type-aware linting rules
- **Prettier**: Code formatting
- **Netlify CLI**: Deployment tools

## 🎮 User Interface Components

### Control Panel
- **Time Controls**: Now, Play/Pause, Restart buttons
- **Speed Control**: Adjustable playback speed (0.5x, 1x, 2x)
- **Loop Toggle**: Continuous playback option
- **View Mode**: Switch between all points and selected only
- **Reset Function**: Clear all selections and restore defaults

### Information Display
- **Status Badge**: Current time, visible points count, last refresh time
- **Altitude Legend**: Interactive color-coded altitude ranges
- **Wind Comparison Legend**: Shows observed vs forecast indicators
- **Keyboard Shortcuts**: Displayed help for quick actions

### Interactive Features
- **Tooltips**: Hover over balloons for detailed information
- **Click Selection**: Click balloons to select and track them
- **Drag Navigation**: Pan around the map
- **Zoom Controls**: Zoom in/out with mouse wheel or controls

## 🔬 Scientific Applications

### Wind Forecast Validation
This tool enables researchers to:
- **Assess Forecast Accuracy**: Compare predicted wind patterns with actual balloon movement
- **Identify Systematic Errors**: Detect consistent biases in wind predictions
- **Altitude Analysis**: Analyze forecast accuracy at different atmospheric levels
- **Temporal Analysis**: Study how forecast accuracy changes over time

### Meteorological Research
- **Wind Pattern Analysis**: Study global wind patterns and their variability
- **Atmospheric Dynamics**: Understand how wind patterns change with altitude
- **Forecast Improvement**: Identify areas where weather models need improvement
- **Data Quality Assessment**: Evaluate the reliability of different data sources

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Modern web browser with WebGL support

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd balloon-wind-check

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Development Commands
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linting
pnpm lint
```

## 🌐 Deployment

The application is configured for deployment on Netlify with:
- **Automatic Builds**: Triggers on git push
- **Preview Deployments**: For pull requests
- **Redirects**: Configured for SPA routing
- **Proxy Configuration**: Handles CORS for API calls

## 📈 Performance Optimizations

### Rendering Optimizations
- **Spatial Indexing**: RBush-based spatial indexing for efficient rendering
- **Viewport Culling**: Only render visible elements
- **Level-of-Detail**: Adjust detail based on zoom level
- **Batch Processing**: Group similar operations together

### Data Optimizations
- **Lazy Loading**: Load data on demand
- **Caching**: Intelligent caching of API responses
- **Web Workers**: Background processing to avoid UI blocking
- **Debouncing**: Prevent excessive API calls

### Memory Management
- **Garbage Collection**: Proper cleanup of map layers and sources
- **Memory Monitoring**: Track memory usage and optimize accordingly
- **Resource Pooling**: Reuse objects where possible

## 🔧 Configuration

### Environment Variables
- **API Endpoints**: Configurable through constants
- **Proxy Settings**: Development and production proxy configuration
- **Performance Settings**: Adjustable limits and thresholds

### Customization Options
- **Color Schemes**: Modify altitude color coding
- **Animation Speeds**: Adjustable playback rates
- **Display Limits**: Configurable maximum selections and points
- **API Limits**: Rate limiting and request batching

## 🐛 Troubleshooting

### Common Issues
- **WebGL Not Available**: Ensure browser supports WebGL
- **CORS Errors**: Check proxy configuration
- **Performance Issues**: Reduce number of selected points
- **Data Loading**: Check network connectivity and API status

### Debug Tools
- **Error Handling**: Graceful error handling and recovery

## 🤝 Contributing

### Development Guidelines
- **TypeScript**: Use strict typing
- **ESLint**: Follow configured linting rules
- **Testing**: Add tests for new features
- **Documentation**: Update documentation for changes

### Code Structure
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for logic
- **State**: Zustand stores for state management
- **Workers**: Web workers for background processing
- **Types**: TypeScript type definitions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Windborne Systems**: For providing real-time balloon tracking data
- **Open-Meteo**: For free weather forecast API access
- **MapLibre**: For the excellent mapping library
- **React Team**: For the powerful frontend framework
- **Vite Team**: For the fast build tool

## 📞 Support

For questions, issues, or contributions:
- **Issues**: Use GitHub issues for bug reports
- **Discussions**: Use GitHub discussions for questions
- **Pull Requests**: Welcome for feature additions and improvements

---

*This application represents a significant advancement in wind forecast validation technology, providing researchers and meteorologists with powerful tools to assess and improve weather prediction accuracy.*