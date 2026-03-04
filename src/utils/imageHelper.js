import { BASE_URL } from '../api/client';

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's a local file (from image picker)
    if (imagePath.startsWith('file://')) {
        return imagePath;
    }

    // If it's already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // If it's a relative path from the backend
    // Remove '/api' from BASE_URL to get the root URL if images are served from root
    // Assuming backend serves images under /uploads or similar which might be at the root
    const rootUrl = BASE_URL.replace('/api', '');

    // Ensure path doesn't start with / if we are appending
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `${rootUrl}/${cleanPath}`;
};
