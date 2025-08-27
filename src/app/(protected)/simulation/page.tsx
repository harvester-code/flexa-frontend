'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteScenario } from '@/services/simulationService';
import { useScenarios } from '@/queries/simulationQueries';
import TheContentHeader from '@/components/TheContentHeader';
import { PushCreateScenarioPopup } from './_components/CreateScenario';
import ScenarioList from './_components/ScenarioList';
import { PushSuccessPopup } from './_components/Success';

const SimulationPage = () => {
  const queryClient = useQueryClient();
  const { scenarios, isLoading: isScenariosLoading } = useScenarios();

  const handleDeleteScenario = async (selectedIds: string[]) => {
    try {
      await deleteScenario(selectedIds);
      PushSuccessPopup({
        title: 'Deletion Complete',
        message: 'Successfully Deleted.',
        onConfirm: () => {
          queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        },
      });
    } catch (error: any) {
      console.error('Failed to delete scenarios:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleCreateScenario = () => {
    PushCreateScenarioPopup({
      onCreate: () => {
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      },
    });
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
    </div>
  );
};

export default SimulationPage;
