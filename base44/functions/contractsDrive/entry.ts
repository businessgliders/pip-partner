import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { ensureFolderPath } from '../../shared/driveFolders.ts';

// Contracts hub Drive bridge.
// Folder structure: <DRIVE_LEADS_SHARED_FOLDER_ID>/Contracts/<group_label>/<lead_name>
// Payload:
//   { action: "list",   group_label, lead_name }
//   { action: "upload", group_label, lead_name, file_url, file_name, mime_type }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const rootId = Deno.env.get('DRIVE_LEADS_SHARED_FOLDER_ID') || '';
    if (!rootId) {
      return Response.json({ error: 'DRIVE_LEADS_SHARED_FOLDER_ID not configured' }, { status: 500 });
    }

    const { action = 'list', group_label, lead_name, file_url, file_name, mime_type } = await req.json();
    if (!group_label || !lead_name) {
      return Response.json({ error: 'Missing group_label or lead_name' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };

    const folder = await ensureFolderPath(['Contracts', group_label, lead_name], rootId, headers);
    const folderInfo = { id: folder.id, url: `https://drive.google.com/drive/folders/${folder.id}` };

    if (action === 'upload') {
      if (!file_url || !file_name) {
        return Response.json({ error: 'Missing file_url or file_name' }, { status: 400 });
      }
      const fileRes = await fetch(file_url);
      if (!fileRes.ok) {
        return Response.json({ error: 'Failed to fetch uploaded file' }, { status: 502 });
      }
      const bytes = new Uint8Array(await fileRes.arrayBuffer());

      const boundary = 'pipcontract' + Date.now();
      const metadata = { name: file_name, parents: [folder.id] };
      const body = new Blob([
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime_type || 'application/octet-stream'}\r\n\r\n`,
        bytes,
        `\r\n--${boundary}--`,
      ]);

      const upRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,webViewLink,modifiedTime',
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': `multipart/related; boundary=${boundary}` },
          body,
        }
      );
      if (!upRes.ok) {
        const detail = await upRes.text();
        return Response.json({ error: 'Drive upload failed', detail }, { status: 502 });
      }
      const file = await upRes.json();
      return Response.json({ folder: folderInfo, file });
    }

    // Default: list files inside the lead's contract folder.
    const params = new URLSearchParams({
      q: `'${folder.id}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'files(id,name,mimeType,webViewLink,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
      pageSize: '100',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers });
    if (!listRes.ok) {
      const detail = await listRes.text();
      return Response.json({ error: 'Drive list failed', detail }, { status: 502 });
    }
    const data = await listRes.json();
    return Response.json({ folder: folderInfo, files: data.files || [] });
  } catch (error) {
    console.error('contractsDrive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});