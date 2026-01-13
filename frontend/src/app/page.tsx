import { FormWindow } from "@/components/index";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("rent_features_agg").select("*");

  return (
    <div className="flex flex-col min-h-dvh text-white w-full justify-center p-2">
      <header className="space-y-4 mt-6">
        <h1 className="font-bold text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow">
          Faire Miete oder Abzocke?
        </h1>
        <h2 className="text-center text-sm md:text-base lg:text-xl drop-shadow">
          Nutze modernstes Machine Learning, um den wahren Wert einer Wohnung zu
          ermitteln.
        </h2>
      </header>

      <FormWindow data={data} />
    </div>
  );
}
