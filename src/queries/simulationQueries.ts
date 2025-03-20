import { useQuery } from '@tanstack/react-query';
import { fetchScenarios } from '@/services/simulations';

const useScenarios = (groupId?: number) => {
  return useQuery({
    queryKey: ['scenarios', groupId],
    queryFn: async () => {
      const { data } = await fetchScenarios(groupId);
      return data;
    },
    enabled: !!groupId,
  });
};

// export const useScenarioList = (group_id?: number) => {
//   const response = useQuery({
//     queryKey: ['ScenarioList'],
//     queryFn: () =>
//       getScenarioList(group_id).then<IScenarioData[]>((response) => {
//         const masterScenarios = {};
//         for (const rowCur of response?.data?.master_scenario || [])
//           if (rowCur?.id) masterScenarios[rowCur.id] = rowCur;
//         return [
//           ...(response?.data?.master_scenario.filter((val) => val != null) || []),
//           ...(response?.data?.user_scenario?.filter((val) => val.id in masterScenarios == false) || []),
//         ];
//       }),
//     enabled: group_id ? true : false,
//   });

//   return {
//     ...response,
//     scenarioList: response?.data || [],
//   };
// };

export { useScenarios };
