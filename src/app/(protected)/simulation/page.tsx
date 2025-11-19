'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { deleteScenario } from '@/services/simulationService';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import TheContentHeader from '@/components/TheContentHeader';
import { useToast } from '@/hooks/useToast';
import CreateScenario from './_components/CreateScenario';
import ScenarioList from './_components/ScenarioList';

const SimulationPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { scenarios, isLoading: isScenariosLoading } = useScenarios();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Check session and role
  React.useEffect(() => {
    const checkSession = async () => {
      const { createClient } = await import('@/lib/auth/client');
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
      }

      if (!session) {
        router.push('/auth/login');
        return;
      }
    };

    checkSession();
  }, [router]);

  // 🎯 Role 기반 접근 제어: viewer는 Simulation 페이지 접근 불가
  React.useEffect(() => {
    if (!isUserLoading && user) {
      if (user.role === 'viewer') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push('/home');
      }
    }
  }, [user, isUserLoading, router, toast]);

  const handleDeleteScenario = async (selectedIds: string[]) => {
    try {
      await deleteScenario(selectedIds);
      toast({
        title: `Scenario${selectedIds.length > 1 ? 's' : ''} Deleted`,
        description: `${selectedIds.length} scenario${selectedIds.length > 1 ? 's' : ''} ${selectedIds.length > 1 ? 'have' : 'has'} been successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: 'An error occurred while deleting the scenario(s).',
        variant: 'destructive',
      });
    }
  };

  const handleCreateScenario = () => {
    setShowCreateDialog(true);
  };

  const handleScenarioCreated = (simulationId: string) => {
    queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    setShowCreateDialog(false);
  };

  // viewer인 경우 페이지 렌더링 방지
  if (!isUserLoading && user?.role === 'viewer') {
    return null;
  }

  return (
    <>
      <TheContentHeader text="Simulation" />
      <div className="mx-auto max-w-page px-page-x pb-page-b">
        <div className="mt-8">
        <ScenarioList
          scenarios={scenarios || []}
          isLoading={isScenariosLoading}
          onCreateScenario={handleCreateScenario}
          onDeleteScenario={handleDeleteScenario}
        />
        </div>

        <CreateScenario
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleScenarioCreated}
        />
      </div>
    </>
  );
};

export default SimulationPage;
