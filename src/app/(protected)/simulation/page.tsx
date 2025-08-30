'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteScenario } from '@/services/simulationService';
import { useScenarios } from '@/queries/simulationQueries';
import TheContentHeader from '@/components/TheContentHeader';
import CreateScenario from './_components/CreateScenario';
import ScenarioList from './_components/ScenarioList';
import { useToast } from '@/hooks/useToast';

const SimulationPage = () => {
  const queryClient = useQueryClient();
  const { scenarios, isLoading: isScenariosLoading } = useScenarios();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleDeleteScenario = async (selectedIds: string[]) => {
    try {
      await deleteScenario(selectedIds);
      toast({
        title: `Scenario${selectedIds.length > 1 ? 's' : ''} Deleted`,
        description: `${selectedIds.length} scenario${selectedIds.length > 1 ? 's' : ''} ${selectedIds.length > 1 ? 'have' : 'has'} been successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    } catch (error: any) {
      console.error('Failed to delete scenarios:', error);
      console.error('Error details:', error.response?.data);
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

  return (
    <div className="max-w-page px-page-x pb-page-b mx-auto">
      <TheContentHeader text="Simulation" />

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
  );
};

export default SimulationPage;
