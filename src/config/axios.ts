import axios from 'axios';

const rawBaseUrl = process.env.API_BASE_URL;

if (!rawBaseUrl) {
  throw new Error('API_BASE_URL is not set');
}

const normalizedBaseUrl = /^https?:\/\//i.test(rawBaseUrl)
  ? rawBaseUrl
  : `http://${rawBaseUrl}`;

let baseURL: string;

try {
  baseURL = new URL(normalizedBaseUrl).toString();
} catch {
  throw new Error(`Invalid API_BASE_URL: "${rawBaseUrl}"`);
}

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  // attach token if needed
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    // normalize errors if needed
    return Promise.reject(err);
  }
);



// import Axios from "axios";

// const axios = Axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   withCredentials: true,
//   headers: {
//     Accept: "application/json",
//     "X-Requested-With": "XMLHttpRequest",
//   },
// });

// export const setAuthToken = (token: any) => {
//   if (token) {
//     axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//   } else {
//     delete axios.defaults.headers.common["Authorization"];
//   }
// };


// export default axios;
