import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
    return (
        <nav className="bg-blue-950 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-300" />
            <span className="text-xl font-bold tracking-tight">Programas de mano históricos <span className="font-light text-blue-200">| Arte y Cultura</span></span>
          </div>
          <div>
            <button className="text-sm px-4 py-1.5 rounded-lg hover:bg-white/20" onClick={() => navigate("/")}>Proyectos</button>
            <button className="text-sm px-4 py-1.5 rounded-lg hover:bg-white/20" onClick={() => navigate("/companias")}>Compañías</button>
            <button className="text-sm px-4 py-1.5 rounded-lg hover:bg-white/20" onClick={() => navigate("/artistas")}>Artistas</button>
          </div>
          
        </div>
      </nav>
    );
};

export default Header;