// // src/components/scanner/BottomTabNavigator.tsx
// import { Home, ScanIcon, ClipboardList, User, BarcodeIcon } from 'lucide-react';

// interface BottomTabNavigatorProps {
//   activeTab: 'home' | 'scan' | 'barcode' | 'history' | 'profile';
//   setActiveTab: (tab: 'home' | 'scan' | 'barcode' | 'history' | 'profile') => void;
// }

// export default function BottomTabNavigator({ activeTab, setActiveTab }: BottomTabNavigatorProps) {
//   const tabs = [
//     { id: 'home', label: 'Home', Icon: Home },
//     { id: 'scan', label: 'Scan', Icon: ScanIcon },
//     { id: 'history', label: 'Riwayat', Icon: ClipboardList },
//     { id: 'profile', label: 'Profile', Icon: User },
//     { id: 'barcode', label: 'Barcode', Icon: BarcodeIcon },
//   ];

//   return (
//     <div className="fixed bottom-0 w-full left-0 h-[8vh] mx-auto md:w-[32.3vw] right-0 flex justify-center z-20">
//       <div className="w-full md:w-max grid grid-cols-5 bg-slate-900 shadow-2xl border-t border-white/10 overflow-hidden">
//         {tabs.map(({ id, label, Icon }) => (
//           <button
//             key={id}
//             onClick={() => setActiveTab(id as any)}
//             className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
//               activeTab === id ? 'text-blue-500' : 'text-slate-500'
//             }`}
//           >
//             <Icon size={18.5} />
//             <p>{label}</p>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }



// src/components/scanner/BottomTabNavigator.tsx
import { Home, ScanIcon, ClipboardList, User, BarcodeIcon } from 'lucide-react';

interface BottomTabNavigatorProps {
  activeTab: 'home' | 'scan' | 'barcode' | 'history' | 'profile';
  setActiveTab: (tab: 'home' | 'scan' | 'barcode' | 'history' | 'profile') => void;
  role?: string; // Tambahkan prop role
}

export default function BottomTabNavigator({ activeTab, setActiveTab, role }: BottomTabNavigatorProps) {
  const allTabs = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'scan', label: 'Scan', Icon: ScanIcon },
    { id: 'history', label: 'Riwayat', Icon: ClipboardList },
    { id: 'profile', label: 'Profile', Icon: User },
    { id: 'barcode', label: 'Barcode', Icon: BarcodeIcon },
  ];

  // Filter tab: Jika bukan siswa, buang 'scan' dan 'history'
  const filteredTabs = allTabs.filter((tab) => {
    if (role !== 'siswa') {
      return tab.id !== 'scan' && tab.id !== 'history';
    }
    return true;
  });

  return (
    <div className="fixed bottom-0 w-full left-0 h-[8vh] mx-auto md:w-[32.3vw] right-0 flex justify-center z-20">
      <div 
        className={`w-full md:w-max grid bg-slate-900 shadow-2xl border-t border-white/10 overflow-hidden`}
        style={{ gridTemplateColumns: `repeat(${filteredTabs.length}, minmax(0, 1fr))` }}
      >
        {filteredTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
              activeTab === id ? 'text-blue-500' : 'text-slate-500'
            }`}
          >
            <Icon size={18.5} />
            <p>{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}