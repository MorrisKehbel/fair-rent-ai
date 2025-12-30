"use client";

interface InfoPopupProps {
  setInfoWindowOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export const InfoPopup = ({ setInfoWindowOpen }: InfoPopupProps) => {
  return (
    <>
      <div className="absolute left-full top-1/2 z-10 ml-3 -translate-y-1/2 w-64">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 relative">
          {/* arrow */}
          <div className="absolute left-0 top-1/2 -ml-2 -mt-2 w-4 h-4 bg-white border-b border-l border-gray-200 transform rotate-45"></div>

          {/* content */}
          <h3 className="text-lg font-bold text-gray-800 mb-1">Information</h3>
          <p className="text-sm text-gray-600">Placeholder</p>

          {/* close */}
          <button
            onClick={() => setInfoWindowOpen((prev) => !prev)}
            className="mt-2 py-1 pr-1 text-xs text-blue-500 hover:text-blue-600 cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </>
  );
};
