const database = require("../config/database");
const oracledb = require("oracledb");

// Location coordinates mapping for major cities in Indonesia
const CITY_COORDINATES = {
  'Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Surabaya': { lat: -7.2575, lng: 112.7521 },
  'Lamongan': { lat: -7.1026897, lng: 112.4172225 },
  'Bandung': { lat: -6.9175, lng: 107.6191 },
  'Semarang': { lat: -6.9932, lng: 110.4203 },
  'Yogyakarta': { lat: -7.7956, lng: 110.3695 },
  'Medan': { lat: 3.5952, lng: 98.6722 },
  'Makassar': { lat: -5.1477, lng: 119.4327 },
  'Palembang': { lat: -2.9761, lng: 104.7754 },
  'Tangerang': { lat: -6.1783, lng: 106.6319 },
  'Bekasi': { lat: -6.2383, lng: 106.9756 }
};

// Get coordinates for a city (fallback to Jakarta if not found)
const getCoordinates = (cityName) => {
  return CITY_COORDINATES[cityName] || CITY_COORDINATES['Jakarta'];
};

// Interpolate position between two points based on progress
const interpolatePosition = (origin, destination, progress) => {
  const lat = origin.lat + (destination.lat - origin.lat) * progress;
  const lng = origin.lng + (destination.lng - origin.lng) * progress;
  return { lat, lng };
};

exports.getShipmentTracking = async (trackingNumber) => {
  const pool = database.getPool();
  const connection = await pool.getConnection();

  try {
    // Get shipment details
    const shipmentQuery = `
      SELECT 
        s.TRACKING_NUMBER,
        s.ORIGIN,
        s.DESTINATION,
        s.DELIVERY_STATUS,
        s.SHIPPING_DATE,
        s.DELIVERY_ESTIMATE,
        s.DISTANCE_KM,
        s.SERVICE_TYPE,
        c.NAME AS COURIER_NAME,
          cust.NAME AS CUSTOMER_NAME,
          cust.LAT AS CUSTOMER_LAT,
          cust.LNG AS CUSTOMER_LNG
      FROM SHIPMENTS s
      LEFT JOIN COURIERS c ON s.COURIER_ID = c.COURIER_ID
      LEFT JOIN CUSTOMERS cust ON s.CUSTOMER_ID = cust.CUSTOMER_ID
      WHERE s.TRACKING_NUMBER = :1
    `;

    const shipmentResult = await connection.execute(shipmentQuery, [trackingNumber]);

    if (!shipmentResult.rows || shipmentResult.rows.length === 0) {
      return null;
    }

    const shipment = shipmentResult.rows[0]; // object-style row (OUT_FORMAT_OBJECT)

    // Get status history from STATUS_LOG (the table stores shipment_id)
    // Join with SHIPMENTS to filter by tracking number
    const historyQuery = `
      SELECT
        sl.NEW_STATUS AS STATUS,
        sl.UPDATED_AT AS LOG_TIME,
        sl.NOTES AS LOCATION
      FROM STATUS_LOG sl
      JOIN SHIPMENTS s ON sl.SHIPMENT_ID = s.SHIPMENT_ID
      WHERE s.TRACKING_NUMBER = :1
      ORDER BY sl.UPDATED_AT ASC
    `;

    const historyResult = await connection.execute(historyQuery, [trackingNumber]);

    // Build origin and destination with coordinates
    const origin = {
      name: shipment.ORIGIN,
      ...getCoordinates(shipment.ORIGIN)
    };

    // If customer has explicit lat/lng, prefer that for destination coordinates
    const destination = {
      name: shipment.DESTINATION,
      lat: shipment.CUSTOMER_LAT || getCoordinates(shipment.DESTINATION).lat,
      lng: shipment.CUSTOMER_LNG || getCoordinates(shipment.DESTINATION).lng
    };

    // Build route from status log
    const route = (historyResult.rows || []).map(row => {
      const location = row.LOCATION || shipment.ORIGIN;
      // If the location refers to the customer's name, and customer coords exist, use them
      if (location && (location === shipment.CUSTOMER_NAME) && shipment.CUSTOMER_LAT && shipment.CUSTOMER_LNG) {
        return {
          lat: shipment.CUSTOMER_LAT,
          lng: shipment.CUSTOMER_LNG,
          timestamp: row.LOG_TIME,
          status: row.STATUS,
          location: location
        };
      }
      return {
        ...getCoordinates(location),
        timestamp: row.LOG_TIME,
        status: row.STATUS,
        location: location
      };
    });

    // Calculate current position based on status
    let current;
    const status = shipment.DELIVERY_STATUS;

    if (route.length > 0) {
      const lastRoute = route[route.length - 1];
      current = {
        lat: lastRoute.lat,
        lng: lastRoute.lng,
        timestamp: lastRoute.timestamp,
        status: status
      };
    } else {
      let progress = 0;
      switch (status) {
        case 'Diproses':
          progress = 0;
          break;
        // Removed statuses 'Dikirim' and 'Transit' — treat intermediate progress as 'Dalam Pengiriman'
        case 'Dalam Pengiriman':
          progress = 0.5;
          break;
        case 'Terkirim':
          progress = 1;
          break;
        default:
          progress = 0.3;
      }

      const position = interpolatePosition(origin, destination, progress);
      current = {
        lat: position.lat,
        lng: position.lng,
        timestamp: new Date().toISOString(),
        status: status
      };
    }

    if (route.length === 0 || (route[route.length - 1].lat !== current.lat || route[route.length - 1].lng !== current.lng)) {
      route.push(current);
    }

    return {
      tracking_number: shipment.TRACKING_NUMBER,
      customer_name: shipment.CUSTOMER_NAME,
      courier_name: shipment.COURIER_NAME,
      shipping_date: shipment.SHIPPING_DATE,
      delivery_estimate: shipment.DELIVERY_ESTIMATE,
      distance_km: shipment.DISTANCE_KM,
      service_type: shipment.SERVICE_TYPE,
      origin,
      destination,
      current,
      route
    };
  } catch (error) {
    console.error("Error in getShipmentTracking:", error);
    throw error;
  } finally {
    try { await connection.close(); } catch (e) { /* ignore */ }
  }
};