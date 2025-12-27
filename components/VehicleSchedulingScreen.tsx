
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle, Person, VehicleSchedule, ScheduleStatus, Sector } from '../types';
import { 
  ArrowLeft, Plus, Search, Calendar, Clock, MapPin, 
  User as UserIcon, Car, Info, Trash2, Edit3, CheckCircle2, 
  X, ChevronDown, Check, LayoutGrid, List, Filter, History,
  AlertCircle, Navigation, ClipboardList, Timer, Loader2, Save,
  ChevronLeft, ChevronRight, Gift, Flag, AlertTriangle, ArrowRight,
  ArrowDown, TrendingUp, CalendarDays, Lock, Eye, FileText, Network,
  UserCheck
} from 'lucide-react';

interface VehicleSchedulingScreenProps {
  schedules: VehicleSchedule[];
  vehicles: Vehicle[];
  persons: Person[];
  sectors: Sector[];
  onAddSchedule: (s: VehicleSchedule) => void;
  onUpdateSchedule: (s: VehicleSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onBack: () => void;
  currentUserId: string;
}

interface IBGECity {
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla?: string;
      }
    }
  }
}

const STATUS_MAP: Record<ScheduleStatus, { label: string, color: string, icon: any }> = {
  pendente: { label: 'Aguardando', color: 'amber', icon: Timer },
  confirmado: { label: 'Confirmado', color: 'indigo', icon: CheckCircle2 },
  em_curso: { label: 'Em Curso', color: 'emerald', icon: Navigation },
  concluido: { label: 'Concluído', color: 'slate', icon: ClipboardList },
  cancelado: { label: 'Cancelado', color: 'rose', icon: X },
};

const HOLIDAYS: Record<string, string> = {
  '01-01': 'Confraternização Universal',
  '21-04': 'Tiradentes',
  '01-05': 'Dia do Trabalho',
  '07-09': 'Independência do Brasil',
  '12-10': 'Nossa Sra. Aparecida',
  '02-11': 'Finados',
  '15-11': 'Proclamação da República',
  '20-11': 'Dia da Consciência Negra',
  '25-12': 'Natal',
};

// Cidades regionais de fallback caso o IBGE falhe
const FALLBACK_CITIES = [
  'SÃO JOSÉ DO GOIABAL - MG',
  'JOÃO MONLEVADE - MG',
  'ALVINÓPOLIS - MG',
  'RIO PIRACICABA - MG',
  'IPATINGA - MG',
  'BELO HORIZONTE - MG',
  'ITABIRA - MG',
  'PONTE NOVA - MG',
  'DOM SILVÉRIO - MG',
  'DIONÍSIO - MG',
  'SÃO DOMINGOS DO PRATA - MG'
];

export const VehicleSchedulingScreen: React.FC<VehicleSchedulingScreenProps> = ({
  schedules = [], 
  vehicles = [], 
  persons = [], 
  sectors = [], 
  onAddSchedule, 
  onUpdateSchedule, 
  onDeleteSchedule, 
  onBack, 
  currentUserId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<VehicleSchedule | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<VehicleSchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [isRequesterDropdownOpen, setIsRequesterDropdownOpen] = useState(false);
  
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [requesterSearch, setRequesterSearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<VehicleSchedule>>({
    vehicleId: '',
    driverId: '',
    serviceSectorId: '',
    requesterPersonId: '',
    departureDateTime: '',
    returnDateTime: '',
    destination: '',
    purpose: '',
    status: 'pendente'
  });

  const vehicleRef = useRef<HTMLDivElement>(null);
  const driverRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const requesterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCities = async () => {
      setIsCityLoading(true);
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome', {
          signal: controller.signal
        });
        if (!response.ok) throw new Error("Erro na resposta da API");
        const data: IBGECity[] = await response.json();
        const formattedCities = data
          .map(city => {
            const uf = city.microrregiao?.mesorregiao?.UF?.sigla;
            return city.nome && uf ? `${city.nome.toUpperCase()} - ${uf}` : null;
          })
          .filter((city): city is string => city !== null);
        setCities(formattedCities);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.warn("Usando lista de cidades regional de fallback devido a falha na API IBGE.");
          setCities(FALLBACK_CITIES);
        }
      } finally {
        setIsCityLoading(false);
      }
    };
    fetchCities();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (vehicleRef.current && !vehicleRef.current.contains(target)) setIsVehicleDropdownOpen(false);
      if (driverRef.current && !driverRef.current.contains(target)) setIsDriverDropdownOpen(false);
      if (statusRef.current && !statusRef.current.contains(target)) setIsStatusDropdownOpen(false);
      if (cityRef.current && !cityRef.current.contains(target)) setIsCityDropdownOpen(false);
      if (sectorRef.current && !sectorRef.current.contains(target)) setIsSectorDropdownOpen(false);
      if (requesterRef.current && !requesterRef.current.contains(target)) setIsRequesterDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, month: month - 1, year, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleOpenModal = (s?: VehicleSchedule, initialDate?: Date, initialVehicleId?: string) => {
    if (s) {
      setEditingSchedule(s);
      setFormData({ ...s });
    } else {
      setEditingSchedule(null);
      const departure = initialDate ? new Date(initialDate) : new Date();
      if (!initialDate) departure.setMinutes(0, 0, 0);
      
      const returnDate = new Date(departure.getTime() + (4 * 60 * 60 * 1000));
      
      setFormData({
        vehicleId: initialVehicleId || '',
        driverId: '',
        serviceSectorId: '',
        requesterPersonId: '',
        departureDateTime: departure.toISOString().slice(0, 16),
        returnDateTime: returnDate.toISOString().slice(0, 16),
        destination: '',
        purpose: '',
        status: 'pendente'
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (s: VehicleSchedule) => {
    setViewingSchedule(s);
    setIsViewModalOpen(true);
  };

  const handleDepartureChange = (val: string) => {
    const departure = new Date(val);
    const returnDate = new Date(departure.getTime() + (4 * 60 * 60 * 1000));
    setFormData({
      ...formData,
      departureDateTime: val,
      returnDateTime: returnDate.toISOString().slice(0, 16)
    });
  };

  const checkTimeConflict = (vehicleId: string, start: string, end: string, excludeId?: string) => {
    const requestedStart = new Date(start).getTime();
    const requestedEnd = new Date(end).getTime();

    if (requestedEnd <= requestedStart) return { conflict: true, message: "A data de retorno deve ser posterior à data de saída." };

    const conflict = (schedules || []).find(s => {
      if (s.id === excludeId || s.vehicleId !== vehicleId || s.status === 'cancelado') return false;
      const existingStart = new Date(s.departureDateTime).getTime();
      const existingEnd = new Date(s.returnDateTime).getTime();
      return (requestedStart < existingEnd) && (requestedEnd > existingStart);
    });

    if (conflict) {
      const v = (vehicles || []).find(v => v.id === conflict.vehicleId);
      return { 
        conflict: true, 
        message: `Conflito de horário! O veículo ${v?.model} já está ocupado de ${new Date(conflict.departureDateTime).toLocaleString('pt-BR')} até ${new Date(conflict.returnDateTime).toLocaleString('pt-BR')}.` 
      };
    }

    return { conflict: false };
  };

  const handleSave = () => {
    if (!formData.vehicleId || !formData.driverId || !formData.departureDateTime || !formData.returnDateTime || !formData.destination || !formData.serviceSectorId || !formData.requesterPersonId) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const conflictCheck = checkTimeConflict(
      formData.vehicleId, 
      formData.departureDateTime, 
      formData.returnDateTime, 
      editingSchedule?.id
    );

    if (conflictCheck.conflict) {
      alert(conflictCheck.message);
      return;
    }

    const data = {
      ...formData,
      id: editingSchedule ? editingSchedule.id : Date.now().toString(),
      requesterId: currentUserId,
      createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString()
    } as VehicleSchedule;

    editingSchedule ? onUpdateSchedule(data) : onAddSchedule(data);
    setIsModalOpen(false);
  };

  const filteredVehicles = useMemo(() => {
    return (vehicles || [])
      .filter(v => v.status === 'operacional' && (v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.plate.toLowerCase().includes(vehicleSearch.toLowerCase())))
      .sort((a, b) => a.model.localeCompare(b.model));
  }, [vehicles, vehicleSearch]);

  const filteredDrivers = useMemo(() => {
    return (persons || [])
      .filter(p => p.name.toLowerCase().includes(driverSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [persons, driverSearch]);

  const filteredSectors = useMemo(() => {
    return (sectors || [])
      .filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sectors, sectorSearch]);

  const filteredRequesters = useMemo(() => {
    return (persons || [])
      .filter(p => p.name.toLowerCase().includes(requesterSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [persons, requesterSearch]);

  const filteredCities = useMemo(() => {
    const term = citySearch.toUpperCase();
    return (cities || []).filter(c => c.toUpperCase().includes(term)).slice(0, 50);
  }, [cities, citySearch]);

  const selectedVehicle = (vehicles || []).find(v => v.id === formData.vehicleId);
  const selectedDriver = (persons || []).find(p => p.id === formData.driverId);
  const selectedSector = (sectors || []).find(s => s.id === formData.serviceSectorId);
  const selectedRequester = (persons || []).find(p => p.id === formData.requesterPersonId);
  const currentStatusConfig = STATUS_MAP[formData.status as ScheduleStatus] || STATUS_MAP.pendente;

  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1";

  const getSchedulesForDay = (day: number, month: number, year: number) => {
    const startOfDay = new Date(year, month, day, 0, 0, 0).getTime();
    const endOfDay = new Date(year, month, day, 23, 59, 59).getTime();

    return (schedules || []).filter(s => {
      if (s.status === 'cancelado') return false;
      const departure = new Date(s.departureDateTime).getTime();
      const returnTime = new Date(s.returnDateTime).getTime();
      return (departure <= endOfDay) && (returnTime >= startOfDay);
    });
  };

  const getHolidayForDay = (day: number, month: number) => {
    const key = `${day.toString().padStart(2, '0')}-${(month + 1).toString().padStart(2, '0')}`;
    return HOLIDAYS[key];
  };

  const vehiclesGroupedByAvailability = useMemo(() => {
    if (!selectedDay) return { available: [], busy: [], isPastDate: false };
    
    const now = new Date();
    const isPastDate = new Date(selectedDay.getTime()).setHours(23,59,59,999) < now.getTime();

    const startOfDay = new Date(selectedDay).setHours(0,0,0,0);
    const endOfDay = new Date(selectedDay).setHours(23,59,59,999);

    const list = (vehicles || []).filter(v => v.type === 'leve' && v.status === 'operacional').map(v => {
      const daySchedules = (schedules || []).filter(s => {
        const departure = new Date(s.departureDateTime).getTime();
        const returnTime = new Date(s.returnDateTime).getTime();
        return s.vehicleId === v.id && s.status !== 'cancelado' &&
               (departure <= endOfDay) && (returnTime >= startOfDay);
      }).sort((a, b) => a.departureDateTime.localeCompare(b.departureDateTime));

      return {
        ...v,
        daySchedules,
        isBusy: daySchedules.length > 0
      };
    }).sort((a, b) => a.model.localeCompare(b.model));

    return {
      available: isPastDate ? [] : list.filter(v => !v.isBusy),
      busy: list.filter(v => v.isBusy),
      isPastDate
    };
  }, [selectedDay, vehicles, schedules]);

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-fade-in overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all active:scale-90"><ArrowLeft className="w-5 h-5" /></button>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <div><h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2"><Calendar className="w-6 h-6 text-indigo-600" />Agendamentos</h2></div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all"><ChevronLeft className="w-5 h-5" /></button>
           <div className="px-6 text-sm font-black text-slate-900 uppercase tracking-widest min-w-[220px] text-center">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
           <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToday} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">Hoje</button>
          <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]"><Plus className="w-4 h-4" />Novo Agendamento</button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 shrink-0">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-r border-slate-100 last:border-0">{d}</div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-7 h-full w-full bg-slate-200 gap-px">
          {calendarData.map((cell, idx) => {
            const daySchedules = getSchedulesForDay(cell.day, cell.month, cell.year);
            const holiday = getHolidayForDay(cell.day, cell.month);
            const dateObj = new Date(cell.year, cell.month, cell.day);
            const dayOfWeek = dateObj.getDay(); 
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = new Date().getDate() === cell.day && new Date().getMonth() === cell.month && new Date().getFullYear() === cell.year;
            
            return (
              <div 
                key={idx} 
                className={`group relative min-h-0 flex flex-col p-3 transition-colors cursor-pointer 
                  ${!cell.isCurrentMonth ? 'bg-slate-50/30 opacity-60' : isWeekend ? 'bg-slate-50/80 hover:bg-indigo-50/40' : 'bg-white hover:bg-indigo-50/30'}
                `} 
                onClick={() => setSelectedDay(new Date(cell.year, cell.month, cell.day))}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : cell.isCurrentMonth ? 'text-slate-900 group-hover:bg-white' : 'text-slate-300'}`}>{cell.day}</span>
                    {holiday && <div className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50"><Flag className="w-2 h-2" /><span className="truncate max-w-[80px]">{holiday}</span></div>}
                  </div>
                  {daySchedules.length > 0 && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">{daySchedules.length}</span>}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1 pb-2">
                  {daySchedules.slice(0, 3).map(s => {
                    const v = (vehicles || []).find(v => v.id === s.vehicleId);
                    const cfg = STATUS_MAP[s.status];
                    const cellDate = new Date(cell.year, cell.month, cell.day).setHours(0,0,0,0);
                    const depDate = new Date(s.departureDateTime).setHours(0,0,0,0);
                    const retDate = new Date(s.returnDateTime).setHours(0,0,0,0);
                    const isStart = cellDate === depDate;
                    const isEnd = cellDate === retDate;
                    const isPassing = cellDate > depDate && cellDate < retDate;
                    return (
                      <div key={s.id} className={`w-full text-left p-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-all bg-${cfg.color}-50 border-${cfg.color}-200 text-${cfg.color}-900 ${isPassing ? 'opacity-70 border-dashed' : ''}`}>
                         <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-black uppercase truncate leading-none">
                              {isStart && <TrendingUp className="w-2 h-2 inline mr-1 text-emerald-500" />}
                              {isEnd && <ArrowDown className="w-2 h-2 inline mr-1 text-indigo-500" />}
                              {v?.model || 'Veículo'}
                            </span>
                            <span className="text-[7px] font-mono font-bold opacity-60 leading-none shrink-0">
                               {isStart ? new Date(s.departureDateTime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : isEnd ? 'RETORNO' : 'EM CURSO'}
                            </span>
                         </div>
                      </div>
                    );
                  })}
                  {daySchedules.length > 3 && <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest">+ {daySchedules.length - 3} itens</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col animate-slide-up h-[90vh] border border-white/20">
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex flex-col items-center justify-center shadow-2xl">
                        <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">{selectedDay.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                        <span className="text-2xl font-black leading-none">{selectedDay.getDate()}</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedDay.toLocaleDateString('pt-BR', { weekday: 'long' })}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">Monitoramento de Frota <ChevronRight className="w-3 h-3" /> {selectedDay.toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                   {!vehiclesGroupedByAvailability.isPastDate && (
                      <button onClick={() => handleOpenModal(undefined, new Date(new Date(selectedDay).setHours(8,0,0,0)))} className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-3 uppercase text-[10px] tracking-[0.2em] hover:bg-indigo-700 transition-all active:scale-95"><Plus className="w-4 h-4" /> Novo Agendamento</button>
                   )}
                   <button onClick={() => setSelectedDay(null)} className="p-4 bg-slate-50 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-600 transition-all active:scale-90 border border-slate-100"><X className="w-8 h-8" /></button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {getHolidayForDay(selectedDay.getDate(), selectedDay.getMonth()) && (
                            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-center gap-6 animate-fade-in">
                                <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl rotate-[-3deg]"><Flag className="w-8 h-8" /></div>
                                <div><h4 className="text-rose-900 font-black uppercase tracking-tight text-lg">Feriado Nacional</h4><p className="text-rose-600 font-bold uppercase tracking-widest text-xs mt-1">{getHolidayForDay(selectedDay.getDate(), selectedDay.getMonth())}</p></div>
                            </div>
                        )}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3"><CalendarDays className="w-5 h-5 text-indigo-600" />Atividade no Período</h4>
                                <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">{getSchedulesForDay(selectedDay.getDate(), selectedDay.getMonth(), selectedDay.getFullYear()).length} veículos ativos</span>
                            </div>
                            <div className="space-y-4">
                                {getSchedulesForDay(selectedDay.getDate(), selectedDay.getMonth(), selectedDay.getFullYear()).length > 0 ? (
                                    getSchedulesForDay(selectedDay.getDate(), selectedDay.getMonth(), selectedDay.getFullYear())
                                    .sort((a,b) => a.departureDateTime.localeCompare(b.departureDateTime))
                                    .map(s => {
                                        const v = (vehicles || []).find(v => v.id === s.vehicleId);
                                        const d = (persons || []).find(p => p.id === s.driverId);
                                        const sec = (sectors || []).find(sec => sec.id === s.serviceSectorId);
                                        const cfg = STATUS_MAP[s.status];
                                        return (
                                            <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-xl transition-all group border-l-[12px] overflow-hidden" style={{ borderLeftColor: `var(--tw-border-opacity, 1) ${cfg.color === 'amber' ? '#f59e0b' : cfg.color === 'indigo' ? '#4f46e5' : cfg.color === 'emerald' ? '#10b981' : cfg.color === 'rose' ? '#f43f5e' : '#64748b'}` }}>
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0"><Car className="w-7 h-7" /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <h5 className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate max-w-[180px]">{v?.model || 'Desconhecido'}</h5>
                                                            <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">{v?.plate || '---'}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[9px] font-black text-slate-500 uppercase tracking-widest overflow-hidden">
                                                            <span className="flex items-center gap-1.5 truncate max-w-[120px]"><UserIcon className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{d?.name.split(' ')[0] || '---'}</span></span>
                                                            <span className="flex items-center gap-1.5 truncate max-w-[180px] font-bold text-indigo-600"><Network className="w-3 h-3 shrink-0" /> <span className="truncate">{sec?.name || '---'}</span></span>
                                                            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-indigo-500 shrink-0" /> <span className="whitespace-normal break-words">{s.destination}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                                                        <div className="text-right">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Saída</p>
                                                            <p className="text-xs font-black text-slate-900 leading-none mb-1">
                                                              {new Date(s.departureDateTime).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                                                            </p>
                                                            <p className="text-sm font-black text-slate-900 leading-none">{new Date(s.departureDateTime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                                                        </div>
                                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                                        <div className="text-left">
                                                            <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Retorno</p>
                                                            <p className="text-xs font-black text-indigo-600 leading-none mb-1">
                                                              {new Date(s.returnDateTime).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                                                            </p>
                                                            <p className="text-sm font-black text-indigo-600 leading-none">{new Date(s.returnDateTime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                      <button onClick={() => handleOpenViewModal(s)} className="p-3.5 bg-indigo-50 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-indigo-100" title="Visualizar Detalhes"><Eye className="w-5 h-5" /></button>
                                                      <button onClick={() => handleOpenModal(s)} className="p-3.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-slate-100" title="Editar Registro"><Edit3 className="w-5 h-5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-[3rem] border border-dashed border-slate-200"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Calendar className="w-10 h-10" /></div><div><p className="text-xl font-black text-slate-700 uppercase tracking-tight">Nenhuma saída planejada</p><p className="text-sm text-slate-400 font-medium">Os agendamentos deste dia aparecerão listados aqui.</p></div></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-[420px] border-l border-slate-100 flex flex-col bg-white">
                    <div className="p-8 border-b border-slate-50 shrink-0">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3"><Car className="w-5 h-5 text-indigo-600" />Disponibilidade Leve</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Apenas veículos sem conflito integral no dia</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <div className="space-y-4">
                          <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                             {vehiclesGroupedByAvailability.isPastDate ? <Lock className="w-3 h-3 text-rose-500" /> : <Check className="w-3 h-3" />}
                             {vehiclesGroupedByAvailability.isPastDate ? 'Datas Retroativas' : 'Disponíveis Agora'}
                          </h5>
                          
                          {vehiclesGroupedByAvailability.isPastDate ? (
                            <div className="p-8 text-center bg-rose-50 rounded-[2rem] border border-rose-100 space-y-3">
                               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-500 mx-auto shadow-sm"><Lock className="w-6 h-6" /></div>
                               <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest leading-relaxed">Agendamentos não permitidos para datas retroativas.</p>
                            </div>
                          ) : (
                            <>
                              {vehiclesGroupedByAvailability.available.map(v => (
                                  <button 
                                      key={v.id}
                                      onClick={() => handleOpenModal(undefined, new Date(new Date(selectedDay).setHours(8,0,0,0)), v.id)}
                                      className="w-full text-left p-6 rounded-[2.5rem] border transition-all group flex flex-col gap-4 active:scale-[0.98] shadow-sm bg-slate-50 border-slate-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xl"
                                  >
                                      <div className="flex items-center justify-between">
                                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-white text-indigo-600">
                                              <Car className="w-6 h-6" />
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm group-hover:bg-white group-hover:text-emerald-600">
                                              <Check className="w-2.5 h-2.5" /> Disponível
                                          </div>
                                      </div>
                                      <div>
                                          <h6 className="text-base font-black uppercase leading-tight">{v.model}</h6>
                                          <div className="flex items-center gap-2 mt-1">
                                              <span className="font-mono text-[9px] font-bold text-slate-400 group-hover:text-indigo-200">{v.plate}</span>
                                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-200">{v.brand}</span>
                                          </div>
                                      </div>
                                  </button>
                              ))}
                              {vehiclesGroupedByAvailability.available.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-2xl border border-dashed">Nenhum veículo livre.</p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                          <h5 className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] ml-2 flex items-center gap-2"><Clock className="w-3 h-3" /> Ocupados no Período</h5>
                          {vehiclesGroupedByAvailability.busy.map(v => {
                            const currentDest = v.daySchedules[0]?.destination || '---';
                            return (
                              <div 
                                  key={v.id}
                                  className="w-full text-left p-4 rounded-[1.5rem] border border-amber-100 bg-amber-50/20 transition-all group flex items-center gap-4 opacity-75 grayscale-[0.5]"
                              >
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600 shrink-0">
                                      <Car className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h6 className="text-[11px] font-black uppercase leading-none truncate">{v.model} <span className="font-bold text-slate-400 text-[9px]">({v.brand})</span></h6>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="font-mono text-[8px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-100 leading-none">{v.plate}</span>
                                          <span className="w-1 h-1 bg-amber-200 rounded-full"></span>
                                          <div className="flex items-center gap-1 min-w-0">
                                            <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                            <span className="text-[8px] font-bold uppercase tracking-tight text-slate-500 truncate">{currentDest}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-[8px] font-black uppercase text-amber-500 whitespace-nowrap bg-white px-2 py-1 rounded-full border border-amber-100">Ocupado</div>
                              </div>
                            );
                          })}
                        </div>
                    </div>
                    
                    {!vehiclesGroupedByAvailability.isPastDate && (
                      <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                          <button onClick={() => handleOpenModal(undefined, new Date(new Date(selectedDay).setHours(8,0,0,0)))} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-700 transition-all active:scale-95"><Plus className="w-5 h-5" /> Novo Agendamento</button>
                      </div>
                    )}
                </div>
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* MODAL DE VISUALIZAÇÃO DE DETALHES (READ-ONLY) */}
      {isViewModalOpen && viewingSchedule && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-slide-up border border-white/20">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Detalhes da Viagem</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Informações completas do agendamento</p>
                    </div>
                 </div>
                 <button onClick={() => setIsViewModalOpen(false)} className="p-3 hover:bg-white rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-8 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículo</p>
                       <p className="text-base font-bold text-slate-900 uppercase">
                          {(vehicles || []).find(v => v.id === viewingSchedule.vehicleId)?.model} ({(vehicles || []).find(v => v.id === viewingSchedule.vehicleId)?.plate})
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista</p>
                       <p className="text-base font-bold text-slate-900">{(persons || []).find(p => p.id === viewingSchedule.driverId)?.name}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor de Atendimento</p>
                       <p className="text-base font-bold text-slate-900 uppercase">{(sectors || []).find(s => s.id === viewingSchedule.serviceSectorId)?.name || '---'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</p>
                       <p className="text-base font-bold text-slate-900">{(persons || []).find(p => p.id === viewingSchedule.requesterPersonId)?.name || '---'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itinerário / Destino</p>
                       <p className="text-base font-bold text-indigo-600 uppercase">{viewingSchedule.destination}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saída Prevista</p>
                       <p className="text-sm font-bold text-slate-700">{new Date(viewingSchedule.departureDateTime).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retorno Previsto</p>
                       <p className="text-sm font-bold text-slate-700">{new Date(viewingSchedule.returnDateTime).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo da Viagem</p>
                       <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                          "{viewingSchedule.purpose || 'Nenhuma descrição detalhada informada.'}"
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</p>
                       <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mt-1 font-black text-[10px] uppercase tracking-widest bg-${STATUS_MAP[viewingSchedule.status].color}-50 text-${STATUS_MAP[viewingSchedule.status].color}-700 border-${STATUS_MAP[viewingSchedule.status].color}-200`}>
                          {React.createElement(STATUS_MAP[viewingSchedule.status].icon, { className: "w-3 h-3" })}
                          {STATUS_MAP[viewingSchedule.status].label}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                 <button onClick={() => setIsViewModalOpen(false)} className="px-12 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-indigo-600 transition-all">Fechar Detalhes</button>
              </div>
           </div>
        </div>,
        document.body
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-5xl overflow-hidden flex flex-col animate-slide-up border border-white/20 max-h-[90vh]">
            <div className="px-8 md:px-10 py-6 md:py-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-[-4deg] shrink-0"><Calendar className="w-7 h-7 md:w-8 md:h-8" /></div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">{editingSchedule ? 'Editar Agendamento' : 'Agendar Saída'}</h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">O veículo ficará indisponível durante o intervalo</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-600 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 md:p-10 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="relative" ref={vehicleRef}>
                     <label className={labelClass}><Car className="w-3 h-3 inline mr-2" /> Veículo Operacional</label>
                     <div onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isVehicleDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.vehicleId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.plate})` : 'Selecione o veículo...'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isVehicleDropdownOpen ? 'rotate-180' : ''}`} /></div>
                     {isVehicleDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                           <div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Filtrar veículo..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div>
                           <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                              {filteredVehicles.map(v => (
                                 <button key={v.id} onClick={() => { setFormData({...formData, vehicleId: v.id}); setIsVehicleDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group">
                                    <div className="flex flex-col"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{v.model}</span><span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{v.plate} • {v.brand}</span></div>
                                    {formData.vehicleId === v.id && <Check className="w-4 h-4 text-indigo-600" />}
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="relative" ref={driverRef}>
                     <label className={labelClass}><UserIcon className="w-3 h-3 inline mr-2" /> Motorista Responsável</label>
                     <div onClick={() => setIsDriverDropdownOpen(!isDriverDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isDriverDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.driverId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{selectedDriver ? selectedDriver.name : 'Selecione o motorista...'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDriverDropdownOpen ? 'rotate-180' : ''}`} /></div>
                     {isDriverDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                           <div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Filtrar motorista..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={driverSearch} onChange={e => setDriverSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div>
                           <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                              {filteredDrivers.map(d => (
                                 <button key={d.id} onClick={() => { setFormData({...formData, driverId: d.id}); setIsDriverDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{d.name}</span>{formData.driverId === d.id && <Check className="w-4 h-4 text-indigo-600" />}</button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* SETOR DE ATENDIMENTO - DINÂMICO MODERNO */}
                  <div className="relative" ref={sectorRef}>
                     <label className={labelClass}><Network className="w-3 h-3 inline mr-2" /> Setor de Atendimento</label>
                     <div onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isSectorDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.serviceSectorId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{selectedSector ? selectedSector.name : 'Selecione o Setor...'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSectorDropdownOpen ? 'rotate-180' : ''}`} /></div>
                     {isSectorDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                           <div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Filtrar setor..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={sectorSearch} onChange={e => setSectorSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div>
                           <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                              {filteredSectors.map(s => (
                                 <button key={s.id} onClick={() => { setFormData({...formData, serviceSectorId: s.id}); setIsSectorDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{s.name}</span>{formData.serviceSectorId === s.id && <Check className="w-4 h-4 text-indigo-600" />}</button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* SOLICITANTE - DINÂMICO MODERNO */}
                  <div className="relative" ref={requesterRef}>
                     <label className={labelClass}><UserCheck className="w-3 h-3 inline mr-2" /> Solicitante (Pessoa)</label>
                     <div onClick={() => setIsRequesterDropdownOpen(!isRequesterDropdownOpen)} className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isRequesterDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}><span className={formData.requesterPersonId ? 'text-slate-900 font-bold' : 'text-slate-400'}>{selectedRequester ? selectedRequester.name : 'Selecione o Solicitante...'}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isRequesterDropdownOpen ? 'rotate-180' : ''}`} /></div>
                     {isRequesterDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                           <div className="p-3 bg-slate-50 border-b border-slate-100"><input type="text" placeholder="Filtrar pessoa..." autoFocus className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" value={requesterSearch} onChange={e => setRequesterSearch(e.target.value)} onClick={e => e.stopPropagation()} /></div>
                           <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                              {filteredRequesters.map(p => (
                                 <button key={p.id} onClick={() => { setFormData({...formData, requesterPersonId: p.id}); setIsRequesterDropdownOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group"><span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{p.name}</span>{formData.requesterPersonId === p.id && <Check className="w-4 h-4 text-indigo-600" />}</button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* ITINERÁRIO / DESTINO - SELECT MODERNO DINÂMICO COM SUPORTE MANUAL */}
                  <div className="md:col-span-2 relative" ref={cityRef}>
                    <label className={labelClass}><MapPin className="w-3 h-3 inline mr-2" /> Itinerário / Destino</label>
                    <div 
                      onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                      className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isCityDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}
                    >
                      <span className={formData.destination ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                        {formData.destination || 'Selecione a cidade de destino...'}
                      </span>
                      {isCityLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />}
                    </div>
                    {isCityDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[350px]">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-col gap-2 shrink-0">
                           <div className="flex items-center gap-2">
                             <Search className="w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                placeholder="Filtrar cidade ou digitar manual..." 
                                autoFocus 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-indigo-500" 
                                value={citySearch} 
                                onChange={e => setCitySearch(e.target.value)} 
                                onClick={e => e.stopPropagation()} 
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && citySearch.trim()) {
                                    setFormData({...formData, destination: citySearch.toUpperCase()});
                                    setIsCityDropdownOpen(false);
                                    setCitySearch('');
                                  }
                                }}
                             />
                           </div>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">Pressione ENTER para aceitar texto digitado manualmente</p>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-1">
                          {filteredCities.map((city, idx) => (
                            <button key={idx} onClick={() => { setFormData({...formData, destination: city}); setIsCityDropdownOpen(false); setCitySearch(''); }} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-indigo-50 rounded-xl transition-colors text-left group">
                               <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{city}</span>
                               {formData.destination === city && <Check className="w-4 h-4 text-indigo-600" />}
                            </button>
                          ))}
                          {filteredCities.length === 0 && citySearch && (
                            <button onClick={() => { setFormData({...formData, destination: citySearch.toUpperCase()}); setIsCityDropdownOpen(false); setCitySearch(''); }} className="w-full px-4 py-4 flex flex-col items-center justify-center gap-1 bg-indigo-50 rounded-xl transition-colors text-center group">
                               <Plus className="w-4 h-4 text-indigo-600" />
                               <span className="text-xs font-bold text-indigo-700">Usar "{citySearch.toUpperCase()}"</span>
                               <span className="text-[9px] text-indigo-400 font-medium">Cidade não listada / Offline</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                     <div>
                        <label className={labelClass}><Clock className="w-3 h-3 inline mr-2" /> Saída (Início)</label>
                        <input 
                          type="datetime-local" 
                          value={formData.departureDateTime} 
                          onChange={e => handleDepartureChange(e.target.value)} 
                          className={`${inputClass} h-[52px] cursor-pointer`} 
                        />
                     </div>
                     <div>
                        <label className={labelClass}><Clock className="w-3 h-3 inline mr-2" /> Retorno (Fim)</label>
                        <input 
                          type="datetime-local" 
                          value={formData.returnDateTime} 
                          onChange={e => setFormData({...formData, returnDateTime: e.target.value})} 
                          className={`${inputClass} h-[52px] cursor-pointer`} 
                        />
                     </div>
                  </div>

                  <div className="md:col-span-2"><label className={labelClass}><Info className="w-3 h-3 inline mr-2" /> Objetivo da Viagem</label><textarea value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className={`${inputClass} min-h-[80px] md:min-h-[100px] resize-none pt-4`} placeholder="Descreva brevemente o objetivo da saída..." /></div>

                  {/* SITUAÇÃO - SELECT MODERNO */}
                  <div className="flex flex-col gap-4 md:col-span-2">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                       <div className="flex-1 relative" ref={statusRef}>
                          <label className={labelClass}>Situação do Agendamento</label>
                          <div 
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className={`${inputClass} flex items-center justify-between cursor-pointer py-3.5 ${isStatusDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                               <div className={`p-1.5 rounded-lg bg-${currentStatusConfig.color}-100 text-${currentStatusConfig.color}-600`}>
                                  <currentStatusConfig.icon className="w-4 h-4" />
                               </div>
                               <span className="text-slate-900 font-bold">{currentStatusConfig.label}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {isStatusDropdownOpen && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-up py-1.5 z-[110]">
                               {Object.entries(STATUS_MAP).map(([key, cfg]) => (
                                 <button key={key} onClick={() => { setFormData({...formData, status: key as ScheduleStatus}); setIsStatusDropdownOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-indigo-50 transition-colors text-left group">
                                    <div className="flex items-center gap-3">
                                       <div className={`p-1.5 rounded-lg bg-${cfg.color}-50 text-${cfg.color}-600 group-hover:bg-${cfg.color}-600 group-hover:text-white transition-all`}>
                                          <cfg.icon className="w-4 h-4" />
                                       </div>
                                       <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{cfg.label}</span>
                                    </div>
                                    {formData.status === key && <Check className="w-4 h-4 text-indigo-600" />}
                                 </button>
                               ))}
                            </div>
                          )}
                       </div>
                       {editingSchedule && (
                         <button onClick={() => { if(confirm("Remover agendamento?")) { onDeleteSchedule(editingSchedule.id); setIsModalOpen(false); } }} className="py-3.5 px-6 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all active:scale-95 border border-rose-100 h-[52px] shrink-0">
                           <Trash2 className="w-4 h-4" /> Excluir Registro
                         </button>
                       )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-4 font-black text-slate-400 hover:text-rose-600 transition-all uppercase text-[11px] tracking-[0.3em]">Descartar</button>
               <button onClick={handleSave} className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-indigo-600 shadow-2xl flex items-center justify-center gap-4 transition-all uppercase text-[11px] tracking-[0.3em] active:scale-95"><Save className="w-5 h-5" /> {editingSchedule ? 'Atualizar Dados' : 'Confirmar Agendamento'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
