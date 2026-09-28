import { postMultipart } from './client';

export interface UploadResponse {
  url: string;
  filename: string;
}

export const uploadsApi = {
  uploadImage: (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return postMultipart<UploadResponse>('/uploads/image', formData);
  },
};
