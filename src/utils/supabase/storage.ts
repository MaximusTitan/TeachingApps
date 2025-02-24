import { createClient } from '@/utils/supabase/server';

export async function uploadImageToStorage(imageUrl: string, storyId: number) {
  const supabase = await createClient();
  
  // Fetch the image
  const response = await fetch(imageUrl);
  const imageBuffer = await response.arrayBuffer();

  // Generate a unique filename
  const timestamp = Date.now();
  const filename = `story-${storyId}-${timestamp}.jpg`;

  // Upload to Supabase storage
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('story-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('story-images')
    .getPublicUrl(filename);

  return publicUrl;
}
