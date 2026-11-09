export function normalizeHuggingFaceRepo(input) {
  if (typeof input !== 'string') throw new Error('Hugging Face repository required');
  let repo = input.trim();
  if (repo.startsWith('https://')) {
    const url = new URL(repo);
    if (url.hostname !== 'huggingface.co' || url.port || url.username || url.password || url.search || url.hash) throw new Error('Expected an official Hugging Face repository URL');
    repo = url.pathname.replace(/^\/|\/$/g, '');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}\/[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(repo)) throw new Error('Expected owner/repository');
  return repo;
}

export async function retrieveGgufCatalog(input) {
  const repo = normalizeHuggingFaceRepo(input);
  const metadataUrl = `https://huggingface.co/api/models/${repo}?blobs=true`;
  const response = await fetch(metadataUrl, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Hugging Face metadata HTTP ${response.status}`);
  const chunks = []; let bytes = 0;
  for await (const chunk of response.body) { bytes += chunk.length; if (bytes > 8 * 1024 * 1024) throw new Error('Hugging Face metadata exceeds 8 MiB'); chunks.push(chunk); }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!/^[a-f0-9]{40}$/.test(body.sha) || !Array.isArray(body.siblings)) throw new Error('Invalid Hugging Face revision/file metadata');
  return body.siblings.filter(file => typeof file.rfilename === 'string' && file.rfilename.toLowerCase().endsWith('.gguf')).map(file => {
    const remotePath = file.rfilename;
    if (remotePath.includes('\\') || remotePath.includes('\0') || remotePath.startsWith('/') || remotePath.split('/').some(segment => !segment || segment === '..' || segment === '.')) throw new Error('Invalid Hugging Face file path');
    const sizeBytes = file.size ?? file.lfs?.size;
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) throw new Error('Missing GGUF file size');
    const sha256 = file.lfs?.sha256;
    if (sha256 !== undefined && !/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Invalid GGUF file hash');
    return { filename: remotePath, sizeBytes, repo, revision: body.sha, sha256: sha256 || null,
      downloadUrl: `https://huggingface.co/${repo}/resolve/${body.sha}/${remotePath.split('/').map(encodeURIComponent).join('/')}`,
      retrieved: true, verified: false, metadataUrl };
  });
}
