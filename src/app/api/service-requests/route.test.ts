import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import {
  createServiceRequestHandler,
  maxRequestSizeBytes,
} from '@/app/api/service-requests/route';
import type { StoredFileRecord } from '@/lib/security/storage';

function validFormData() {
  const formData = new FormData();
  formData.set('fullName', 'Test User');
  formData.set('company', 'Test Hospital');
  formData.set('phone', '0553 606 57 03');
  formData.set('email', 'test@example.com');
  formData.set('deviceBrand', 'Mindray');
  formData.set('deviceModel', 'BeneView T5');
  formData.set('deviceSerialNumber', 'SN-12345');
  formData.set(
    'message',
    'Cihaz arızası hakkında servis talebi oluşturmak istiyorum.',
  );
  formData.set('formStartedAt', String(Date.now() - 3000));
  return formData;
}

async function pngFile() {
  const buffer = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: '#ffffff',
    },
  })
    .png()
    .toBuffer();

  return new File([buffer], 'photo.png', { type: 'image/png' });
}

function pdfFile() {
  return new File(
    [Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF')],
    'report.pdf',
    { type: 'application/pdf' },
  );
}

describe('service request route', () => {
  it('returns 413 for oversized Content-Length before parsing form data', async () => {
    const handler = createServiceRequestHandler({
      storage: {
        save: async () => {
          throw new Error('should not save');
        },
        remove: async () => undefined,
      },
      repository: {
        save: async () => {
          throw new Error('should not persist');
        },
      },
    });
    const request = new Request('https://example.com/api/service-requests', {
      method: 'POST',
      headers: {
        'content-length': String(maxRequestSizeBytes + 1),
        'content-type': 'multipart/form-data; boundary=test',
        origin: 'https://example.com',
      },
      body: '',
    });

    const response = await handler(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.success).toBe(false);
  });

  it('removes a stored file when repository persistence fails', async () => {
    let removedStorageKey = '';
    const storedFile: StoredFileRecord = {
      storageKey: 'stored.png',
      mimeType: 'image/png',
      size: 10,
    };
    const handler = createServiceRequestHandler({
      storage: {
        save: async () => storedFile,
        remove: async (storageKey: string) => {
          removedStorageKey = storageKey;
        },
      },
      repository: {
        save: async () => {
          throw new Error('database unavailable');
        },
      },
    });
    const formData = validFormData();
    formData.set('attachment', await pngFile());
    const response = await handler(
      new Request('https://example.com/api/service-requests', {
        method: 'POST',
        headers: { origin: 'https://example.com' },
        body: formData,
      }),
    );

    expect(response.status).toBe(500);
    expect(removedStorageKey).toBe(storedFile.storageKey);
  });

  it('rejects PDF attachments', async () => {
    let persisted = false;
    const handler = createServiceRequestHandler({
      storage: {
        save: async () => {
          throw new Error('should not save');
        },
        remove: async () => undefined,
      },
      repository: {
        save: async () => {
          persisted = true;
          return { id: 'request-1' };
        },
      },
    });
    const formData = validFormData();
    formData.set('attachment', pdfFile());

    const response = await handler(
      new Request('https://example.com/api/service-requests', {
        method: 'POST',
        headers: { origin: 'https://example.com' },
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(persisted).toBe(false);
    expect(body.fieldErrors.attachment).toBeTruthy();
  });

  it('rejects malformed phone numbers before persistence', async () => {
    let persisted = false;
    const handler = createServiceRequestHandler({
      storage: {
        save: async () => {
          throw new Error('should not save');
        },
        remove: async () => undefined,
      },
      repository: {
        save: async () => {
          persisted = true;
          return { id: 'request-1' };
        },
      },
    });
    const formData = validFormData();
    formData.set('phone', '0535+564');

    const response = await handler(
      new Request('https://example.com/api/service-requests', {
        method: 'POST',
        headers: { origin: 'https://example.com' },
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(persisted).toBe(false);
    expect(body.fieldErrors.phone).toBeTruthy();
  });
});
