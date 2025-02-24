import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const readSiteById = async (id: number): Promise<{ id: number; site_id: string } | null> => {
  const { data, error } = await supabase
    .from('schools')
    .select('id, site_id')
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle to handle zero or one result

  if (error) {
    console.error("Error fetching site data:", error);
    return null;
  }

  return data;
};