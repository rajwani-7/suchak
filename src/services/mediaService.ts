/**
 * Media Service
 * Handles file uploads, compression, and media operations
 * Ready for backend API integration
 */

export interface UploadResult {
  url: string;
  fileKey: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

class MediaService {
  private apiUrl = import.meta.env.VITE_API_URL || '/api';
  private maxFileSizes = {
    image: 25 * 1024 * 1024, // 25MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 16 * 1024 * 1024, // 16MB
    document: 50 * 1024 * 1024, // 50MB
  };

  /**
   * Upload image with client-side compression
   * TODO: Replace with actual API call
   */
  async uploadImage(file: File, options?: CompressionOptions): Promise<UploadResult> {
    // Validate file size
    if (file.size > this.maxFileSizes.image) {
      throw new Error(`Image size exceeds ${this.maxFileSizes.image / (1024 * 1024)}MB limit`);
    }

    // Compress image on client side
    const compressedFile = await this.compressImage(file, options);

    // Create object URL for local preview (replace with actual upload in production)
    const url = URL.createObjectURL(compressedFile);

    // TODO: Uncomment when backend is ready
    // const formData = new FormData();
    // formData.append('file', compressedFile);
    // formData.append('type', 'image');
    // 
    // const response = await fetch(`${this.apiUrl}/upload/image`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.getAuthToken()}`
    //   },
    //   body: formData
    // });
    // 
    // return await response.json();

    return {
      url,
      fileKey: `${Date.now()}-${file.name}`,
      size: compressedFile.size,
      mimeType: compressedFile.type,
    };
  }

  /**
   * Upload video
   * TODO: Replace with actual API call
   */
  async uploadVideo(file: File): Promise<UploadResult> {
    if (file.size > this.maxFileSizes.video) {
      throw new Error(`Video size exceeds ${this.maxFileSizes.video / (1024 * 1024)}MB limit`);
    }

    const url = URL.createObjectURL(file);

    // TODO: Uncomment when backend is ready
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('type', 'video');
    // 
    // const response = await fetch(`${this.apiUrl}/upload/video`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.getAuthToken()}`
    //   },
    //   body: formData
    // });
    // 
    // return await response.json();

    return {
      url,
      fileKey: `${Date.now()}-${file.name}`,
      size: file.size,
      mimeType: file.type,
    };
  }

  /**
   * Upload audio (voice note)
   * TODO: Replace with actual API call
   */
  async uploadAudio(blob: Blob, fileName: string = 'voice-note.ogg'): Promise<UploadResult> {
    if (blob.size > this.maxFileSizes.audio) {
      throw new Error(`Audio size exceeds ${this.maxFileSizes.audio / (1024 * 1024)}MB limit`);
    }

    const url = URL.createObjectURL(blob);

    // TODO: Uncomment when backend is ready
    // const formData = new FormData();
    // formData.append('file', blob, fileName);
    // formData.append('type', 'audio');
    // 
    // const response = await fetch(`${this.apiUrl}/upload/audio`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.getAuthToken()}`
    //   },
    //   body: formData
    // });
    // 
    // return await response.json();

    return {
      url,
      fileKey: `${Date.now()}-${fileName}`,
      size: blob.size,
      mimeType: blob.type || 'audio/ogg',
    };
  }

  /**
   * Upload document
   * TODO: Replace with actual API call
   */
  async uploadDocument(file: File): Promise<UploadResult> {
    if (file.size > this.maxFileSizes.document) {
      throw new Error(`Document size exceeds ${this.maxFileSizes.document / (1024 * 1024)}MB limit`);
    }

    const url = URL.createObjectURL(file);

    // TODO: Uncomment when backend is ready
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('type', 'document');
    // 
    // const response = await fetch(`${this.apiUrl}/upload/document`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.getAuthToken()}`
    //   },
    //   body: formData
    // });
    // 
    // return await response.json();

    return {
      url,
      fileKey: `${Date.now()}-${file.name}`,
      size: file.size,
      mimeType: file.type,
    };
  }

  /**
   * Compress image on client side
   */
  private async compressImage(file: File, options?: CompressionOptions): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
    } = options || {};

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => reject(new Error('Image load failed'));
      };

      reader.onerror = () => reject(new Error('File read failed'));
    });
  }

  /**
   * Delete media file
   * TODO: Replace with actual API call
   */
  async deleteMedia(fileKey: string): Promise<boolean> {
    console.log('Deleting media:', fileKey);

    // TODO: Uncomment when backend is ready
    // const response = await fetch(`${this.apiUrl}/media/${fileKey}`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Authorization': `Bearer ${this.getAuthToken()}`
    //   }
    // });
    // 
    // return response.ok;

    return true;
  }

  /**
   * Get file size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate file type
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -2);
        return file.type.startsWith(prefix);
      }
      return file.type === type;
    });
  }

  /**
   * Get auth token from localStorage
   * TODO: Integrate with your auth system
   */
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
}

export const mediaService = new MediaService();
