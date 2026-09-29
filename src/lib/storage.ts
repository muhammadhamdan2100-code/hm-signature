import { supabase, isSupabaseConfigured } from "./supabase";

export const uploadMediaAsset = async (
  file: File,
  bucket: "product-images" | "banners" = "product-images"
): Promise<string> => {
  if (!isSupabaseConfigured()) {
    // If Supabase storage is not configured, generate a temporary data URL or object URL for preview
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Supabase Storage Upload Error:", error.message);
    return URL.createObjectURL(file);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
};
