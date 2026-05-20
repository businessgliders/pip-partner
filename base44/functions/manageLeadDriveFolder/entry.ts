import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHARED_DRIVE_ID = '0AAZGMpSg7QNfUk9PVA';
const LEADS_FOLDER_NAME = 'Leads';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { ticket_id, ticket_type, client_name } = await req.json();
    if (!ticket_id || !ticket_type || !client_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 1. Get or create the "Leads" folder in the shared Drive
    let leadsFolder = await findOrCreateFolder(
      LEADS_FOLDER_NAME,
      SHARED_DRIVE_ID,
      headers
    );

    // 2. Get or create the client-specific folder under Leads
    const clientFolder = await findOrCreateFolder(
      client_name,
      leadsFolder.id,
      headers
    );

    // 3. Return folder metadata
    return Response.json({
      folder_id: clientFolder.id,
      folder_name: clientFolder.name,
      folder_url: `https://drive.google.com/drive/folders/${clientFolder.id}`,
    });
  } catch (error) {
    console.error('manageLeadDriveFolder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findOrCreateFolder(folderName, parentId, headers) {
  // Search for existing folder
  const searchQuery = `name="${folderName}" and mimeType="application/vnd.google-apps.folder" and trashed=false`;
  const searchParams = new URLSearchParams({
    q: searchQuery,
    spaces: 'drive',
    fields: 'files(id,name)',
    pageSize: '1',
  });

  if (parentId && parentId !== 'root') {
    searchParams.set('q', `${searchQuery} and parents="${parentId}"`);
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams}`,
    { headers }
  );

  if (searchRes.ok) {
    const { files } = await searchRes.json();
    if (files && files.length > 0) {
      return files[0]; // Return existing folder
    }
  }

  // Create new folder
  const createBody = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : ['root'],
  };

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create folder: ${createRes.statusText}`);
  }

  return await createRes.json();
}