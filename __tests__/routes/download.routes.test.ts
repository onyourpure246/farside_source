import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import downloadRouter from '../../src/routes/download.routes';

const { mockGetAllFiles, mockUploadFile, mockDeleteFile } = vi.hoisted(() => ({
  mockGetAllFiles: vi.fn(),
  mockUploadFile: vi.fn(),
  mockDeleteFile: vi.fn(),
}));

vi.mock('../../src/services/download.service', () => ({
  DownloadService: class {
    getFolderContents = mockGetAllFiles;
    uploadFile = mockUploadFile;
    deleteFile = mockDeleteFile;
  }
}));

vi.mock('../../src/services/file-storage.service', () => ({
  FileStorageService: class {
    saveFile = vi.fn();
    deleteFile = vi.fn();
  }
}));

vi.mock('../../src/services/log.service', () => ({
  LogService: class {
    logActivity = vi.fn();
    logWarning = vi.fn();
  }
}));

// Mock the middleware to bypass auth
vi.mock('../../src/middleware/dual-auth.middleware', () => {
  return {
    dualAuthMiddleware: async (c: any, next: any) => {
      c.set('user', { id: 1, isadmin: 1 });
      await next();
    }
  };
});

const app = new Hono();
app.route('/download', downloadRouter);

describe('Download Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /download/folder', () => {
    it('should return 200 and list of files', async () => {
      mockGetAllFiles.mockResolvedValueOnce([]);
      const res = await app.request('/download/folder');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /download/file', () => {
    it('should return 400 if no file', async () => {
      const res = await app.request('/download/file', {
        method: 'POST',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /download/file/:id', () => {
    it('should return 200 on successful deletion', async () => {
      mockDeleteFile.mockResolvedValueOnce(true);
      const res = await app.request('/download/file/1', { method: 'DELETE' });
      expect(res.status).toBe(200);
    });
  });
});
