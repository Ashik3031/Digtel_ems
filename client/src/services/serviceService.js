import axios from 'axios';

const API_URL = '/api/services';

// Get all services
export const getServices = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Create new service
export const createService = async (serviceData) => {
    const response = await axios.post(API_URL, serviceData);
    return response.data;
};

// Update service
export const updateService = async (id, serviceData) => {
    const response = await axios.put(`${API_URL}/${id}`, serviceData);
    return response.data;
};

// Delete service
export const deleteService = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
