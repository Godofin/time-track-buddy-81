import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Filter, User, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface TimeEntry {
  id?: string;
  project_name: string;
  project_type: string;
  other_project_name?: string;
  user: string;
  hourly_rate: number;
  total_hours: number;
  total_value: number;
  timestamp: string;
  start_time: string;
  end_time: string;
  user_id: string;
}

const PROJECT_TYPES = [
  'BI',
  'Engenharia de Dados',
  'Data Science',
  'Outros'
];

const EntriesPage = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [filterProjectType, setFilterProjectType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('timesheets')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
        setFilteredEntries(data || []);
      } catch (error) {
        console.error('Erro ao carregar apontamentos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar todos os apontamentos.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [toast]);

  useEffect(() => {
    let tempEntries = [...entries];

    if (filterProjectType && filterProjectType !== 'all') {
      tempEntries = tempEntries.filter(entry => entry.project_type === filterProjectType);
    }

    if (filterUser && filterUser !== 'all') {
      tempEntries = tempEntries.filter(entry => entry.user === filterUser);
    }

    if (filterDateFrom) {
      tempEntries = tempEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
        return entryDate >= filterDateFrom;
      });
    }

    if (filterDateTo) {
      tempEntries = tempEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
        return entryDate <= filterDateTo;
      });
    }

    setFilteredEntries(tempEntries);
  }, [entries, filterProjectType, filterUser, filterDateFrom, filterDateTo]);

  const formatEntryHours = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Todos os Apontamentos
          </h1>
          <p className="text-muted-foreground">
            Visualize e filtre todos os apontamentos de horas.
          </p>
        </div>
        
        {/* Link back to TimeTracker */}
        <div className="text-center">
            <Link to="/" className="text-primary hover:underline">
                Voltar para o Apontamento de Horas
            </Link>
        </div>

        {/* Filter Card */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filterProjectType">Tipo de Projeto</Label>
                <Select value={filterProjectType} onValueChange={setFilterProjectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {PROJECT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterUser">Usuário</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="Lavezzo">Lavezzo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterDateFrom">Data Inicial</Label>
                <Input
                  id="filterDateFrom"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="Data inicial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterDateTo">Data Final</Label>
                <Input
                  id="filterDateTo"
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="Data final"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterProjectType('all');
                  setFilterUser('all');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Apontamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : filteredEntries.length > 0 ? (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="bg-gradient-card border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{entry.project_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {entry.project_type === 'Outros' ? `${entry.project_type} - ${entry.other_project_name}` : entry.project_type}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.user} - R$ {entry.hourly_rate.toFixed(2).replace('.', ',')}/h
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {formatEntryHours(entry.total_hours)}
                          </p>
                          <p className="text-lg font-bold text-primary flex items-center justify-end gap-1">
                            <DollarSign className="h-4 w-4" />
                            R$ {entry.total_value.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Nenhum apontamento encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EntriesPage;