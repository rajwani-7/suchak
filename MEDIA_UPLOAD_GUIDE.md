# Media Upload Implementation Guide

## 1. Media Upload Component

### Install Dependencies
```bash
npm install axios react-dropzone sharp-image-processor heic2any
```

### Media Upload Hook
```tsx
// src/hooks/useMediaUpload.ts
import { useState, useCallback } from 'react';
import axios, { AxiosProgressEvent } from 'axios';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  duration?: number;
  compressed?: boolean;
}

interface UploadProgress {
  [key: string]: number;
}

export const useMediaUpload = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZES = {
    image: 25 * 1024 * 1024, // 25MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 50 * 1024 * 1024 // 50MB
  };

  const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    video: ['video/mp4', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/wav'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const detectMediaType = (mimeType: string): MediaFile['type'] | null => {
    for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
      if (mimes.includes(mimeType)) {
        return type as MediaFile['type'];
      }
    }
    return null;
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if too large
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
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
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              }
            },
            'image/webp',
            0.8 // 80% quality
          );
        };
      };
      reader.onerror = reject;
    });
  };

  const addFiles = useCallback(async (newFiles: File[]) => {
    setError(null);
    const mediaFiles: MediaFile[] = [];

    for (const file of newFiles) {
      try {
        const mediaType = detectMediaType(file.type);

        if (!mediaType) {
          setError(`Unsupported file type: ${file.type}`);
          continue;
        }

        if (file.size > MAX_FILE_SIZES[mediaType]) {
          setError(`File too large. Max ${MAX_FILE_SIZES[mediaType] / 1024 / 1024}MB for ${mediaType}`);
          continue;
        }

        let fileToAdd = file;

        // Compress images
        if (mediaType === 'image') {
          fileToAdd = await compressImage(file);
        }

        const preview = URL.createObjectURL(fileToAdd);
        mediaFiles.push({
          file: fileToAdd,
          preview,
          type: mediaType,
          size: fileToAdd.size,
          compressed: mediaType === 'image'
        });
      } catch (err) {
        setError(`Error processing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setFiles((prev) => [...prev, ...mediaFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const uploadFiles = useCallback(async (chatId: string) => {
    if (files.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const mediaFile of files) {
        const formData = new FormData();
        formData.append('file', mediaFile.file);
        formData.append('type', mediaFile.type);
        formData.append('chatId', chatId);

        const response = await axios.post('/api/upload/media', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress((prev) => ({
              ...prev,
              [mediaFile.file.name]: percentCompleted
            }));
          }
        });

        uploadedUrls.push(response.data.url);
      }

      setFiles([]);
      setProgress({});
      return uploadedUrls;
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return [];
    } finally {
      setUploading(false);
    }
  }, [files]);

  return {
    files,
    uploading,
    progress,
    error,
    addFiles,
    removeFile,
    uploadFiles
  };
};
```

## 2. Media Upload UI Component

```tsx
// src/components/app/MediaUploadButton.tsx
import { useRef } from 'react';
import { Paperclip, Image, Music, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MediaUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
}

export const MediaUploadButton = ({ onFilesSelected }: MediaUploadButtonProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/mp4,video/quicktime"
        onChange={handleVideoSelect}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        multiple
        accept="audio/mpeg,audio/ogg,audio/m4a,audio/wav"
        onChange={handleAudioSelect}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        onChange={handleDocumentSelect}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Paperclip className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
            <Image className="w-4 h-4 mr-2" />
            Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
            <span className="w-4 h-4 mr-2">🎬</span>
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => audioInputRef.current?.click()}>
            <Music className="w-4 h-4 mr-2" />
            Audio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => documentInputRef.current?.click()}>
            <FileText className="w-4 h-4 mr-2" />
            Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
```

## 3. Media Preview Component

```tsx
// src/components/app/MediaPreview.tsx
import { X, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MediaPreviewProps {
  files: Array<{
    file: File;
    preview: string;
    type: 'image' | 'video' | 'audio' | 'document';
    size: number;
  }>;
  progress: Record<string, number>;
  uploading: boolean;
  onRemove: (index: number) => void;
  onSend: () => void;
}

export const MediaPreview = ({
  files,
  progress,
  uploading,
  onRemove,
  onSend
}: MediaPreviewProps) => {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="border-t border-border p-4 space-y-3 bg-muted/30">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((media, index) => (
          <div key={index} className="relative group">
            {media.type === 'image' ? (
              <img
                src={media.preview}
                alt={`Preview ${index}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : media.type === 'video' ? (
              <video
                src={media.preview}
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-32 bg-card rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            )}

            {/* Progress overlay */}
            {progress[media.file.name] !== undefined && progress[media.file.name] < 100 && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Progress
                  value={progress[media.file.name]}
                  className="w-20"
                />
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => onRemove(index)}
              disabled={uploading}
              className={cn(
                'absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity',
                uploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <X className="w-4 h-4" />
            </button>

            {/* File info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
              {formatFileSize(media.size)}
            </div>
          </div>
        ))}
      </div>

      {/* Send button */}
      <Button
        onClick={onSend}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? 'Uploading...' : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send {files.length} {files.length === 1 ? 'file' : 'files'}
          </>
        )}
      </Button>
    </div>
  );
};
```

## 4. Backend Media Upload API

```javascript
// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const path = require('path');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Multer configuration (temporary storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime',
      'audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/wav',
      'application/pdf', 'application/msword'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload single media file
router.post('/media', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { type, chatId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let fileBuffer = file.buffer;
    let fileName = `${Date.now()}-${file.originalname}`;
    let mimeType = file.mimetype;

    // Process image: compress and convert to WebP
    if (type === 'image' && ['image/jpeg', 'image/png', 'image/heic'].includes(mimeType)) {
      fileBuffer = await sharp(fileBuffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

      fileName = fileName.replace(path.extname(fileName), '.webp');
      mimeType = 'image/webp';
    }

    // Upload to S3
    const s3Key = `media/${chatId}/${type}/${fileName}`;
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
      ACL: 'private'
    };

    const uploadResult = await s3.upload(s3Params).promise();

    // Save metadata to database
    const mediaRecord = await db.query(
      `INSERT INTO media (user_id, chat_id, file_key, file_name, file_type, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, file_key`,
      [req.user.id, chatId, s3Key, fileName, type, fileBuffer.length, mimeType]
    );

    res.json({
      id: mediaRecord.rows[0].id,
      url: uploadResult.Location,
      fileKey: s3Key,
      size: fileBuffer.length,
      mimeType
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Batch upload multiple files
router.post('/media/batch', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { chatId } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      let fileBuffer = file.buffer;
      let fileName = `${Date.now()}-${file.originalname}`;

      // Process image
      if (file.mimetype.startsWith('image/')) {
        fileBuffer = await sharp(fileBuffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        fileName = fileName.replace(path.extname(fileName), '.webp');
      }

      const s3Key = `media/${chatId}/mixed/${fileName}`;
      const uploadResult = await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
        ACL: 'private'
      }).promise();

      uploadedFiles.push({
        url: uploadResult.Location,
        fileKey: s3Key,
        size: fileBuffer.length
      });
    }

    res.json({ files: uploadedFiles });
  } catch (err) {
    res.status(500).json({ error: 'Batch upload failed' });
  }
});

// Generate presigned download URL
router.get('/media/:fileId/download', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    const media = await db.query(
      'SELECT file_key FROM media WHERE id = $1',
      [fileId]
    );

    if (media.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileKey = media.rows[0].file_key;
    const presignedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Expires: 3600 // 1 hour
    });

    res.json({ url: presignedUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Delete media file
router.delete('/media/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;

    const media = await db.query(
      'SELECT file_key, user_id FROM media WHERE id = $1',
      [fileId]
    );

    if (media.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (media.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const fileKey = media.rows[0].file_key;

    // Delete from S3
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    }).promise();

    // Delete from database
    await db.query('DELETE FROM media WHERE id = $1', [fileId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});

module.exports = router;
```

## 5. Integration in Chat Input

```tsx
// Updated ChatInput Component
import { useState } from 'react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { MediaUploadButton } from './MediaUploadButton';
import { MediaPreview } from './MediaPreview';
import { useChat } from '@/context/ChatContext';

interface ChatInputProps {
  chatId: string;
  onMessageSent: () => void;
}

export const ChatInput = ({ chatId, onMessageSent }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const { files, uploading, progress, error, addFiles, removeFile, uploadFiles } = useMediaUpload();
  const { sendMessage } = useChat();

  const handleSendWithMedia = async () => {
    try {
      if (files.length > 0) {
        const uploadedUrls = await uploadFiles(chatId);
        
        for (const url of uploadedUrls) {
          await sendMessage(chatId, url, 'me');
        }
      }

      if (message.trim()) {
        await sendMessage(chatId, message, 'me');
        setMessage('');
      }

      onMessageSent();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="bg-card border-t border-border">
      <MediaPreview
        files={files}
        progress={progress}
        uploading={uploading}
        onRemove={removeFile}
        onSend={handleSendWithMedia}
      />

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="p-4 flex items-center gap-2">
        <MediaUploadButton onFilesSelected={addFiles} />

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-lg bg-muted border-none outline-none"
        />

        <button
          onClick={handleSendWithMedia}
          disabled={uploading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};
```

This provides complete media upload functionality with compression, preview, and batch support!

