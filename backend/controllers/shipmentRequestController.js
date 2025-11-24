const shipmentRequestService = require('../services/shipmentRequestService');

exports.createRequest = async (req, res) => {
  try {
    const user = req.user || {};
    // user.user_id is customer_id (token set that way in auth)
    const customerId = user.user_id;
    if (!customerId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const payload = req.body || {};
    const created = await shipmentRequestService.createRequest({
      customer_id: customerId,
      pickup_address: payload.pickup_address,
      pickup_lat: payload.pickup_lat,
      pickup_lng: payload.pickup_lng,
      dropoff_address: payload.dropoff_address,
      dropoff_lat: payload.dropoff_lat,
      dropoff_lng: payload.dropoff_lng,
      service_type: payload.service_type || 'Reguler',
      notes: payload.notes || null
    });

    return res.json({ success: true, data: created });
  } catch (err) {
    console.error('createRequest error', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.listRequests = async (req, res) => {
  try {
    const user = req.user || {};
    const role = (user.role || 'customer').toString();
    const rows = await shipmentRequestService.getRequestsForUser(user.user_id, role);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('listRequests error', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await shipmentRequestService.getRequestById(id);
    if (!r) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: r });
  } catch (err) {
    console.error('getRequest error', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = req.user || {};
    // admin id expected to be in req.user.admin_id or req.user.user_id
    const adminId = user.admin_id || user.user_id || user.id;
    if (!adminId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const result = await shipmentRequestService.acceptRequest(id, adminId);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('acceptRequest error', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = req.user || {};
    const reason = req.body?.reason || null;
    const adminId = user.admin_id || user.user_id || user.id;
    if (!adminId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const result = await shipmentRequestService.rejectRequest(id, adminId, reason);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('rejectRequest error', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};
