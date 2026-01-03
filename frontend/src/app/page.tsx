import { FormWindow } from "@/components/index";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fairrentpredictor_data_status")
    .select("*");

  return (
    <main className="flex flex-col min-h-dvh text-white w-full justify-center p-2">
      <h1 className="mt-6 font-bold text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow">
        Faire Miete oder Abzocke?
      </h1>
      <h2 className="mt-4 text-center text-sm md:text-base lg:text-xl drop-shadow">
        Nutze modernstes Machine Learning, um den wahren Wert einer Wohnung zu
        ermitteln.
      </h2>
      <div className="mt-8 md:mt-12">
        <FormWindow data={data} />
      </div>
    </main>
  );
}
