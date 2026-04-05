import { CirclePlus, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

const PageTitle: React.FC<{ title: string; description?: string; search: (term: string) => void; searchPlaceholder?: string }> = ({ title, description, search, searchPlaceholder }) => {

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      search(searchTerm);
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className='flex justify-between'>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {description && (
              <p className="text-gray-500">{description}</p>
            )}
          </div>
          <div className="flex">
            <div className="relative mb-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={searchPlaceholder || "Buscar por título o compañía..."}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CirclePlus onClick={() => window.location.href = window.location + '/nuevo'} className="text-gray-400 w-5 h-5" />
          </div>
        </div>
  );
}

export default PageTitle