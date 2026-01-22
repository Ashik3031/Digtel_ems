import axios from 'axios';

const API_URL = '/api/ad-campaigns';

// Get all ad campaigns
export const getAdCampaigns = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Create new ad campaign
export const createAdCampaign = async (campaignData) => {
    const response = await axios.post(API_URL, campaignData);
    return response.data;
};

// Update ad campaign
export const updateAdCampaign = async (id, campaignData) => {
    const response = await axios.put(`${API_URL}/${id}`, campaignData);
    return response.data;
};

// Update campaign metrics
export const updateCampaignMetrics = async (id, metrics) => {
    const response = await axios.put(`${API_URL}/${id}/metrics`, metrics);
    return response.data;
};

// Delete ad campaign
export const deleteAdCampaign = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
