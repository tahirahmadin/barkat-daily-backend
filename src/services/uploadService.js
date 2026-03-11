/**
 * Profile picture upload to Supabase Storage with server-side compression.
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (and optional SUPABASE_STORAGE_BUCKET).
 */
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceKey, supabaseStorageBucket } = require('../config');

const MAX_WIDTH = 500;
const QUALITY = 85;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Compress and resize image buffer. Returns JPEG buffer.
 * @param {Buffer} buffer - Raw image buffer (JPEG, PNG, WebP, etc.)
 * @returns {Promise<Buffer>}
 */
async function compressImage(buffer) {
  return sharp(buffer)
    .resize(MAX_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: QUALITY })
    .toBuffer();
}

/**
 * Upload profile image to Supabase Storage: compress then upload to bucket.
 * Path: {userId}/avatar.jpg
 * @param {Buffer} buffer - Raw image buffer
 * @param {string} userId - User ID (used as folder and in filename)
 * @returns {Promise<{ url: string }>} Public URL of uploaded file
 */
async function uploadProfileImage(buffer, userId) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const compressed = await compressImage(buffer);
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(path);
  return { url: urlData.publicUrl };
}

function isUploadConfigured() {
  return !!(supabaseUrl && supabaseServiceKey);
}

module.exports = {
  getSupabase,
  compressImage,
  uploadProfileImage,
  isUploadConfigured,
};
