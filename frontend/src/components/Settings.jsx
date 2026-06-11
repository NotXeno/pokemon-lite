export default function Settings({ bgmVolume, setBgmVolume, sfxVolume, setSfxVolume, onClose }) {
  return (
    <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-8 border-gray-900 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-[bounce_0.5s_ease-out] relative text-center">
        <h2 className="text-3xl font-black mb-6 text-gray-800 uppercase">Settings</h2>
        
        <div className="flex flex-col gap-6 mb-8 text-left">
          <div>
            <label className="font-black text-gray-700 block mb-2 text-xs uppercase">Music Volume: {Math.round(bgmVolume * 100)}%</label>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={bgmVolume} 
              onChange={(e) => setBgmVolume(parseFloat(e.target.value))} 
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>
          <div>
            <label className="font-black text-gray-700 block mb-2 text-xs uppercase">SFX Volume: {Math.round(sfxVolume * 100)}%</label>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={sfxVolume} 
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))} 
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-green-500 hover:bg-green-400 border-4 border-gray-900 text-white font-black text-xl py-3 px-4 rounded-xl transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 uppercase">
          CLOSE
        </button>
      </div>
    </div>
  );
}
