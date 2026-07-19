import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { findOrCreateFolder } from '../../shared/driveFolders.ts';

const SHARED_DRIVE_ID = Deno.env.get('DRIVE_LEADS_SHARED_FOLDER_ID') || '';
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
    if (!SHARED_DRIVE_ID) {
      return Response.json({ error: 'DRIVE_LEADS_SHARED_FOLDER_ID not configured' }, { status: 500 });
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