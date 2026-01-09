import axios from 'axios';

const API_URL = '/api/sales';

// Create Prospect
export const createProspect = async (prospectData) => {
    const response = await axios.post(API_URL, prospectData);
    return response.data;
};

// Get All Sales
export const getSales = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Convert to Sale
export const convertToSale = async (id, paymentData) => {
    const response = await axios.put(`${API_URL}/${id}/convert`, { payment: paymentData });
    return response.data;
};

// Push to Backend
export const pushToBackend = async (id, checklistData) => {
    const response = await axios.put(`${API_URL}/${id}/push`, { checklist: checklistData });
    return response.data;
};

// Revert to Prospect
export const revertToProspect = async (id) => {
    const response = await axios.put(`${API_URL}/${id}/revert`);
    return response.data;
};

// Update Checklist Progress
export const updateChecklist = async (id, checklistData) => {
    const response = await axios.put(`${API_URL}/${id}/checklist`, { checklist: checklistData });
    return response.data;
};
