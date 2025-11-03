import axios from 'axios';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
// import { faro } from '../utils/faroConfig';

const useAxios = () => {
  const { getToken } = useAuth();
  
  // Create axios instance inside the hook
  const axiosInstance = useMemo(() => {
    const baseURL = import.meta.env.VITE_APP_API_URI || 'http://localhost:3000';
    return axios.create({
      baseURL,
      timeout: 180000,
    });
  }, []);

  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      async (config) => {
        const directJWT = await getToken({ template: 'inviplate' });
        if (directJWT) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${directJWT}`;
        }
        
        // Add Faro trace ID to headers
        // const otel = faro.api.getOTEL();
        // if (otel) {
        //   const span = otel.trace.getTracer('http-request').startSpan('http-request');
        //   if (span) {
        //     config.headers = config.headers || {};
        //     config.headers['X-Trace-Id'] = span.spanContext().traceId;
        //     span.end();
        //   }
        // }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('Received 401 error, attempting to refresh JWT');
          
          try {
            const newJwt = await getToken({ template: 'inviplate' });
            if (newJwt) {
              console.log('JWT refreshed successfully, retrying request');
              // Update the Authorization header with the new token
              originalRequest.headers.Authorization = `Bearer ${newJwt}`;
              // Retry the original request
              return axiosInstance(originalRequest);
            } else {
              console.log('Failed to refresh JWT, redirecting to sign in');
              window.location.href = '/sign-in';
            }
          } catch (refreshError) {
            console.error('Error during JWT refresh:', refreshError);
            window.location.href = '/sign-in';
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [axiosInstance, getToken]);

  return axiosInstance;
}

export default useAxios;