import api from '../utils/api';

export const getMyFacilities = async () => {
  const response = await api.get('/facilities/my');
  return response.data.data;
};

export const createFacility = async (data) => {
  const response = await api.post('/facilities', data);
  return response.data.data;
};

export const getFacilityDetails = async (facilityId) => {
  const response = await api.get(`/facilities/${facilityId}`);
  return response.data.data;
};

export const getFacilitySlots = async (facilityId) => {
  const response = await api.get(`/facilities/${facilityId}/slots`);
  return response.data.data;
};

export const updateSlotStatus = async (slotId, data) => {
  const response = await api.patch(`/slots/${slotId}`, data);
  return response.data.data;
};

export const addExtraSlot = async (facilityId, type = 'car') => {
  const response = await api.post(`/facilities/${facilityId}/slots`, { type });
  return response.data.data;
};
