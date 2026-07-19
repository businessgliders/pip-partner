// Shared Google Drive folder helpers used by manageLeadDriveFolder and contractsDrive.

export async function findOrCreateFolder(folderName, parentId, headers) {
  const safeName = String(folderName).replace(/"/g, "'");
  let searchQuery = `name="${safeName}" and mimeType="application/vnd.google-apps.folder" and trashed=false`;
  if (parentId && parentId !== 'root') {
    searchQuery += ` and parents="${parentId}"`;
  }
  const searchParams = new URLSearchParams({
    q: searchQuery,
    spaces: 'drive',
    fields: 'files(id,name)',
    pageSize: '1',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams}`,
    { headers }
  );
  if (searchRes.ok) {
    const { files } = await searchRes.json();
    if (files && files.length > 0) return files[0];
  }

  const createBody = {
    name: safeName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : ['root'],
  };
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true',
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody),
    }
  );
  if (!createRes.ok) {
    throw new Error(`Failed to create folder: ${createRes.statusText}`);
  }
  return await createRes.json();
}

// Walks/creates a nested folder path (e.g. ["Contracts", "Franchise", "Jane Doe"])
// under rootId and returns the deepest folder.
export async function ensureFolderPath(segments, rootId, headers) {
  let parent = { id: rootId };
  for (const segment of segments) {
    parent = await findOrCreateFolder(segment, parent.id, headers);
  }
  return parent;
}