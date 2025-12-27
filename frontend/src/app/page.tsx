import { FormWindow } from "@/components/index";

export default function Home() {
  return (
    <main className="flex flex-col min-h-dvh bg-blue-400 text-white w-full justify-center p-2">
      <h1 className="mt-6 font-bold text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
        Faire Miete oder Abzocke?
      </h1>
      <h2 className="mt-4 text-center text-sm md:text-base lg:text-xl">
        Nutze modernstes Machine Learning, um den wahren Wert einer Wohnung zu
        ermitteln.
      </h2>
      <div className="mt-8 md:mt-12">
        <FormWindow />
      </div>
    </main>
  );
}
