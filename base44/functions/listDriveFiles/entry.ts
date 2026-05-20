import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Browse and search the connected Google Drive (shared connector).
// Payload: { q?: string, parentId?: string, pageToken?: string, pageSize?: number }
// Returns: { files: [{id, name, mimeType, iconLink, webViewLink, isFolder, modifiedTime}], nextPageToken }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { q = '', parentId = '', pageToken = '', pageSize = 50 } = body || {};

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Build the Drive query string.
    const clauses = ['trashed = false'];
    if (q && q.trim()) {
      // Escape single quotes
      const safe = q.trim().replace(/'/g, "\\'");
      clauses.push(`name contains '${safe}'`);
    } else if (parentId) {
      clauses.push(`'${parentId}' in parents`);
    } else {
      // Default: root level
      clauses.push(`'root' in parents`);
    }

    const params = new URLSearchParams({
      q: clauses.join(' and '),
      fields: 'nextPageToken, files(id,name,mimeType,iconLink,webViewLink,modifiedTime,size)',
      orderBy: 'folder,name',
      pageSize: String(Math.min(Number(pageSize) || 50, 100)),
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: 'Drive API error', detail: text }, { status: 502 });
    }
    const data = await res.json();
    const files = (data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      iconLink: f.iconLink,
      webViewLink: f.webViewLink,
      modifiedTime: f.modifiedTime,
      size: f.size,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
    }));

    return Response.json({ files, nextPageToken: data.nextPageToken || null });
  } catch (error) {
    console.error('listDriveFiles error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});