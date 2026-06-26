import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SizeGuideModal = ({ isOpen, onClose, defaultCategory }) => {
  // Determine initial active category (default to Men if not matching Men/Women)
  const initialCategory = 
    defaultCategory && (defaultCategory.toLowerCase() === 'women' || defaultCategory.toLowerCase() === 'women\'s') 
      ? 'Women' 
      : 'Men';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'

  if (!isOpen) return null;

  // Measurement Sizing Charts Data
  const chartsData = {
    Men: [
      { size: 'S', chest: { in: '34 - 36', cm: '86 - 91' }, waist: { in: '28 - 30', cm: '71 - 76' }, shoulder: { in: '17.5', cm: '44.5' }, length: { in: '27.5', cm: '70' } },
      { size: 'M', chest: { in: '38 - 40', cm: '97 - 102' }, waist: { in: '32 - 34', cm: '81 - 86' }, shoulder: { in: '18.2', cm: '46.2' }, length: { in: '28.5', cm: '72' } },
      { size: 'L', chest: { in: '42 - 44', cm: '107 - 112' }, waist: { in: '36 - 38', cm: '91 - 97' }, shoulder: { in: '19.0', cm: '48.3' }, length: { in: '29.5', cm: '75' } },
      { size: 'XL', chest: { in: '46 - 48', cm: '117 - 122' }, waist: { in: '40 - 42', cm: '102 - 107' }, shoulder: { in: '19.7', cm: '50.0' }, length: { in: '30.5', cm: '77' } },
      { size: 'XXL', chest: { in: '50 - 52', cm: '127 - 132' }, waist: { in: '44 - 46', cm: '112 - 117' }, shoulder: { in: '20.5', cm: '52.1' }, length: { in: '31.5', cm: '80' } }
    ],
    Women: [
      { size: 'XS', chest: { in: '31 - 32', cm: '79 - 81' }, waist: { in: '23 - 24', cm: '58 - 61' }, shoulder: { in: '14.5', cm: '36.8' }, length: { in: '24.5', cm: '62' } },
      { size: 'S', chest: { in: '33 - 35', cm: '84 - 89' }, waist: { in: '25 - 27', cm: '64 - 69' }, shoulder: { in: '15.0', cm: '38.1' }, length: { in: '25.0', cm: '64' } },
      { size: 'M', chest: { in: '36 - 38', cm: '91 - 97' }, waist: { in: '28 - 30', cm: '71 - 76' }, shoulder: { in: '15.7', cm: '39.9' }, length: { in: '25.5', cm: '65' } },
      { size: 'L', chest: { in: '39 - 41', cm: '99 - 104' }, waist: { in: '31 - 33', cm: '79 - 84' }, shoulder: { in: '16.5', cm: '41.9' }, length: { in: '26.5', cm: '67' } },
      { size: 'XL', chest: { in: '42 - 44', cm: '107 - 112' }, waist: { in: '34 - 36', cm: '86 - 91' }, shoulder: { in: '17.2', cm: '43.7' }, length: { in: '27.5', cm: '70' } }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer Content Card */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="relative bg-white text-black w-full max-w-md p-6 sm:p-8 shadow-2xl z-10 h-full overflow-y-auto font-roboto rounded-none flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center rounded-none hover:bg-gray-100 transition text-gray-500 hover:text-black cursor-pointer text-lg font-bold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Size Guide</h3>

        {/* Controls Panel (Category Tabs & Unit Toggle) */}
        <div className="flex justify-between items-end border-b pb-2 mb-6">
          {/* Category Tabs */}
          <div className="flex gap-6 text-sm font-bold">
            {['Men', 'Women'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-2 border-b-2 transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-black'
                }`}
              >
                {cat}'s Sizing
              </button>
            ))}
          </div>

          {/* Unit Toggle Switcher */}
          <div className="flex gap-3 text-xs font-bold text-gray-400 pb-2.5 select-none">
            <button
              onClick={() => setUnit('in')}
              className={`transition cursor-pointer ${
                unit === 'in' ? 'text-black underline underline-offset-4 decoration-2' : 'hover:text-black'
              }`}
            >
              IN
            </button>
            <span>|</span>
            <button
              onClick={() => setUnit('cm')}
              className={`transition cursor-pointer ${
                unit === 'cm' ? 'text-black underline underline-offset-4 decoration-2' : 'hover:text-black'
              }`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Sizing Measurement Table */}
        <div className="overflow-x-auto border border-gray-150 rounded-none mb-6 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="px-3 py-3 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Size</th>
                <th className="px-3 py-3 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Chest</th>
                <th className="px-3 py-3 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Waist</th>
                <th className="px-3 py-3 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Shldr</th>
                <th className="px-3 py-3 font-bold text-[10px] text-gray-400 uppercase tracking-wider">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {chartsData[activeCategory].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="px-3 py-3 text-black font-extrabold">{row.size}</td>
                  <td className="px-3 py-3">{row.chest[unit]}</td>
                  <td className="px-3 py-3">{row.waist[unit]}</td>
                  <td className="px-3 py-3">{row.shoulder[unit]}</td>
                  <td className="px-3 py-3">{row.length[unit]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Instructions Panel */}
        <div className="bg-gray-50 p-5 border border-gray-100 rounded-none">
          <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wide mb-3">How to Measure</h4>
          <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed list-disc pl-4">
            <li>
              <strong className="text-gray-900">Chest:</strong> Measure around the fullest part of your chest.
            </li>
            <li>
              <strong className="text-gray-900">Waist:</strong> Measure around your natural waistline.
            </li>
            <li>
              <strong className="text-gray-900">Shoulder:</strong> Measure across your shoulders.
            </li>
            <li>
              <strong className="text-gray-900">Body Length:</strong> Measure from high point of shoulder to hem.
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default SizeGuideModal;
