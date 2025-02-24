import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const readDomainId = async (domain?: string): Promise<{ id: number; site_id: string } | null> => {
  if (!domain) {
    console.error("Domain is undefined or empty");
    return null;
  }
  const { data, error } = await supabase
    .from('schools')
    .select('id, site_id')
    .eq('site_id', domain.toLowerCase())
    .maybeSingle(); // Changed from .single() to .maybeSingle()

  if (error) {
    console.error("Error fetching domain data:", error);
    return null;
  }

  return data;
};