import { createClient } from "@/utils/supabase/server";

export async function uploadImageToSupabase(imageUrl: string, userId: string) {
  try {
    const supabase = await createClient();
    
    // Download image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create file path with user ID in folder structure
    const fileName = `${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`; // Changed to include userId as folder
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('lesson_images')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('lesson_images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error; // Propagate error for better handling
  }
}
