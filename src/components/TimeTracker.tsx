import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, DollarSign, User, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TimeEntry {
  id?: string;
  project_name: string;
  project_type: string;
  other_project_name?: string;
  user: string;
  hourly_rate: number;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_value: number;
  timestamp: string;
  user_id: string;
}

const PROJECT_TYPES = [
  'BI',
  'Engenharia de Dados',
  'Data Science',
  'Outros'
];

const PROJECT_RATES = {
  'BI': 35.00,
  'Engenharia de Dados': 42.00,
  'Data Science': 45.00,
  'Outros': 40.00
};

export const TimeTracker = () => {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [otherProjectName, setOtherProjectName] = useState('');
  const [user, setUser] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    // Gerar ou recuperar um ID de usuário único
    let storedUserId = localStorage.getItem('timeTrackerUserId');
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem('timeTrackerUserId', storedUserId);
    }
    setUserId(storedUserId);
    loadEntries(storedUserId);
  }, []);

  const loadEntries = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Erro ao carregar apontamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar apontamentos anteriores.",
        variant: "destructive"
      });
    }
  };

  const calculateHoursAndValue = () => {
    if (!startTime || !endTime) return { hours: '00:00', value: 'R$ 0,00' };

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let startTotalMinutes = startHour * 60 + startMinute;
    let endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60;
    }

    const totalMinutes = endTotalMinutes - startTotalMinutes;
    const totalHours = totalMinutes / 60;

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    let hourlyRate = 0;
    if (user === 'lavezzo') {
      hourlyRate = PROJECT_RATES[projectType as keyof typeof PROJECT_RATES] || 0;
    } else if (user === 'other' && customRate) {
      hourlyRate = parseFloat(customRate);
    }

    const totalValue = totalHours * hourlyRate;

    return {
      hours: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      value: `R$ ${totalValue.toFixed(2).replace('.', ',')}`
    };
  };

  const { hours, value } = calculateHoursAndValue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName || !projectType || !user || !startTime || !endTime) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (projectType === 'Outros' && !otherProjectName) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o projeto para a opção 'Outros'.",
        variant: "destructive"
      });
      return;
    }

    if (user === 'other' && (!customRate || parseFloat(customRate) <= 0)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor por hora válido.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      let startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;

      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60;
      }

      const totalMinutes = endTotalMinutes - startTotalMinutes;
      const totalHours = totalMinutes / 60;

      let hourlyRate = 0;
      if (user === 'lavezzo') {
        hourlyRate = PROJECT_RATES[projectType as keyof typeof PROJECT_RATES] || 0;
      } else if (user === 'other') {
        hourlyRate = parseFloat(customRate);
      }

      const totalValue = totalHours * hourlyRate;

      const newEntry = {
        project_name: projectName,
        project_type: projectType,
        other_project_name: projectType === 'Outros' ? otherProjectName : '',
        user: user === 'lavezzo' ? 'Lavezzo' : 'Outro',
        hourly_rate: hourlyRate,
        start_time: startTime,
        end_time: endTime,
        total_hours: totalHours,
        total_value: totalValue,
        timestamp: new Date().toISOString(),
        user_id: userId
      };

      const { error } = await supabase
        .from('timesheets')
        .insert([newEntry]);

      if (error) throw error;

      // Recarregar entradas
      await loadEntries(userId);
      
      // Reset form
      setProjectName('');
      setProjectType('');
      setOtherProjectName('');
      setUser('');
      setCustomRate('');
      setStartTime('');
      setEndTime('');
      
      toast({
        title: "Sucesso!",
        description: "Apontamento de horas salvo com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar apontamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o apontamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            Apontamento de Horas
          </h1>
          <p className="text-muted-foreground">
            Registre suas horas de trabalho em projetos
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-medium bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Novo Apontamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Nome do Projeto</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Digite o nome do projeto"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectType">Tipo de Projeto</Label>
                  <Select value={projectType} onValueChange={setProjectType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Other Project Name */}
              {projectType === 'Outros' && (
                <div className="space-y-2">
                  <Label htmlFor="otherProjectName">Descrição do Projeto</Label>
                  <Input
                    id="otherProjectName"
                    value={otherProjectName}
                    onChange={(e) => setOtherProjectName(e.target.value)}
                    placeholder="Descreva o tipo de projeto"
                    required
                  />
                </div>
              )}

              {/* User Selection */}
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Select value={user} onValueChange={setUser} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lavezzo">Lavezzo</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Rate */}
              {user === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="customRate">Valor por Hora (R$)</Label>
                  <Input
                    id="customRate"
                    type="number"
                    step="0.01"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {/* Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de Entrada</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de Saída</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Summary */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Horas Trabalhadas</p>
                      <p className="text-2xl font-bold text-foreground">{hours}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold text-primary">{value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {isLoading ? 'Salvando...' : 'Salvar Apontamento'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Entries List */}
        {entries.length > 0 && (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Apontamentos Anteriores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <Card key={entry.id || index} className="bg-gradient-card border-l-4 border-l-primary">
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
