const axios = require("axios");


const TMDB_BASE = "https://api.themoviedb.org/3";


const tmdbRequest = async (endpoint, apiKey, params = {}) => {
return axios.get(`${TMDB_BASE}${endpoint}`, {
params: {
api_key: apiKey,
...params
}
});
};


module.exports = { tmdbRequest };