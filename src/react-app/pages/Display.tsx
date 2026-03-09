import { useEffect } from 'react';
import { useQueueDisplay } from '@/react-app/hooks/useQueueDisplay';
import { Users, Clock, Baby, Heart, ArrowRight } from 'lucide-react';

const LOGO_URL = 'https://019cbac0-d37d-7fe6-9252-d88c892cf697.mochausercontent.com/image.png_5543.png';

export default function DisplayPage() {
  const { receptionQueue, baiaQueue, dpQueue, lastCalled, stats, loading } = useQueueDisplay();

  // Load Google Font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  const latestReception = lastCalled.reception[0];
  const latestDP = lastCalled.dp[0];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="IdealQueue" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">IdealQueue</h1>
              <p className="text-blue-200 text-sm">Sistema de Gestão de Filas</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Users className="w-5 h-5 text-blue-300" />
              <span className="text-blue-100">{stats.total_waiting_reception} aguardando</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Clock className="w-5 h-5 text-blue-300" />
              <span className="text-blue-100">~{stats.average_wait_minutes} min</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-[1920px] mx-auto">
        {/* Current Calls - Featured Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Reception Call */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-2xl shadow-emerald-900/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold">Chamando para Recepção</h2>
            </div>
            {latestReception ? (
              <div className="space-y-2">
                <div className="text-6xl font-extrabold tracking-wider">
                  {latestReception.ticket_reception}
                </div>
                <div className="text-emerald-100 text-lg font-medium">
                  {latestReception.name}
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 text-lg font-bold">
                  Baia {latestReception.assigned_baia}
                </div>
                {(latestReception.is_pregnant || latestReception.has_infant) && (
                  <div className="flex items-center gap-2 text-emerald-100 mt-2">
                    {latestReception.is_pregnant ? <Heart className="w-5 h-5" /> : <Baby className="w-5 h-5" />}
                    <span>{latestReception.is_pregnant ? 'Gestante' : 'Criança de colo'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-emerald-200 text-xl">Aguardando...</div>
            )}
          </div>

          {/* DP Call */}
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-6 shadow-2xl shadow-violet-900/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold">Chamando para Dept. Pessoal</h2>
            </div>
            {latestDP ? (
              <div className="space-y-2">
                <div className="text-6xl font-extrabold tracking-wider">
                  {latestDP.ticket_dp}
                </div>
                <div className="text-violet-100 text-lg font-medium">
                  {latestDP.name}
                </div>
                {(latestDP.is_pregnant || latestDP.has_infant) && (
                  <div className="flex items-center gap-2 text-violet-100 mt-2">
                    {latestDP.is_pregnant ? <Heart className="w-5 h-5" /> : <Baby className="w-5 h-5" />}
                    <span>{latestDP.is_pregnant ? 'Gestante' : 'Criança de colo'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-violet-200 text-xl">Aguardando...</div>
            )}
          </div>
        </div>

        {/* Queue Lists */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Reception Queue */}
          <QueueColumn
            title="Fila da Recepção"
            subtitle="Aguardando chamada"
            color="blue"
            items={receptionQueue.slice(0, 10).map(p => ({
              ticket: p.ticket_reception,
              name: p.name,
              isPriority: p.priority === 'priority',
              isPregnant: p.is_pregnant === 1,
              hasInfant: p.has_infant === 1
            }))}
            total={receptionQueue.length}
          />

          {/* Baias */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Em Atendimento</h3>
                <p className="text-blue-200 text-sm">Baias ocupadas</p>
              </div>
              <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-sm font-medium">
                {baiaQueue.length}/5
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(baiaNum => {
                const person = baiaQueue.find(p => p.assigned_baia === baiaNum);
                return (
                  <div
                    key={baiaNum}
                    className={`rounded-xl p-3 text-center transition-all ${
                      person 
                        ? 'bg-amber-500/30 border-2 border-amber-400' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="text-xs text-blue-200 mb-1">Baia</div>
                    <div className="text-2xl font-bold">{baiaNum}</div>
                    {person && (
                      <>
                        <div className="text-xs font-medium mt-2 text-amber-200 truncate">
                          {person.ticket_reception}
                        </div>
                        <div className="text-xs text-blue-200 truncate">
                          {person.name.split(' ')[0]}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DP Queue */}
          <QueueColumn
            title="Fila do DP"
            subtitle="Aguardando Dept. Pessoal"
            color="violet"
            items={dpQueue.slice(0, 10).map(p => ({
              ticket: p.ticket_dp || '',
              name: p.name,
              isPriority: p.priority === 'priority',
              isPregnant: p.is_pregnant === 1,
              hasInfant: p.has_infant === 1
            }))}
            total={dpQueue.length}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-sm text-blue-200">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              Gestante / Criança de colo = Prioridade
            </span>
          </div>
          <div>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </footer>
    </div>
  );
}

function QueueColumn({ 
  title, 
  subtitle, 
  color, 
  items, 
  total 
}: { 
  title: string; 
  subtitle: string; 
  color: 'blue' | 'violet';
  items: { ticket: string; name: string; isPriority: boolean; isPregnant: boolean; hasInfant: boolean }[];
  total: number;
}) {
  const colorClasses = {
    blue: {
      badge: 'bg-blue-500/20 text-blue-300',
      priority: 'bg-amber-500/20 border-amber-400/50'
    },
    violet: {
      badge: 'bg-violet-500/20 text-violet-300',
      priority: 'bg-amber-500/20 border-amber-400/50'
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-blue-200 text-sm">{subtitle}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses[color].badge}`}>
          {total}
        </span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-blue-300/60 text-center py-8">Fila vazia</div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.isPriority 
                  ? colorClasses[color].priority + ' border' 
                  : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-lg">{item.ticket}</span>
                <span className="text-blue-100 text-sm truncate max-w-[120px]">{item.name}</span>
              </div>
              {item.isPriority && (
                <div className="text-amber-400">
                  {item.isPregnant ? <Heart className="w-4 h-4" /> : <Baby className="w-4 h-4" />}
                </div>
              )}
            </div>
          ))
        )}
        {total > 10 && (
          <div className="text-center text-blue-300 text-sm pt-2">
            +{total - 10} na fila
          </div>
        )}
      </div>
    </div>
  );
}
