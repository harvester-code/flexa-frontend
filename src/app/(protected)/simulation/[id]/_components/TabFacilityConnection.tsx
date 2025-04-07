'use client';

import React, { useEffect, useRef, useState } from 'react';
import { sources } from 'next/dist/compiled/webpack/webpack';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faArrowRight,
  faCheck,
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OrbitProgress } from 'react-loading-indicators';
import { ConditionData, OperatorItem } from '@/types/conditions';
import { FacilitiesConnectionState, FacilityConnection, FacilityConnectionResponse, ProcedureInfo } from '@/types/simulations';
import { getFacilityConns } from '@/services/simulations';
import { SankeyColors, useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ConditionsBase, { Dropdown } from '@/components/Conditions';
import CustomSelectBox from '@/components/CustomSelectBox';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import TabDefault from '@/components/TabDefault';
import TheContentHeader from '@/components/TheContentHeader';
import Tooltip from '@/components/Tooltip';
import { useResize } from '@/hooks/useResize';
import GridTable, { GridTableHeader, GridTableRow, checkNotEmptyRows } from './GridTable';

const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

const TableTypes = ['Check-box', 'Probability (%)']; // ['Check-box', 'Distance (m)', 'Ratio (n:n)', 'Probability (%)', 'File Upload'];

interface FacilityConnectionProps {
  visible: boolean;
}

export interface TableData {
  title?: string;
  header: GridTableHeader[];
  data: GridTableRow[];
  waitTime: string;
  hidden: boolean;
  sourceCondition: ConditionData;
  destCondition: ConditionData;
}

interface ConditionTableData {
  title?: string;
  header: GridTableHeader[];
  data: GridTableRow[];
  hidden?: boolean;
}

interface ConditionsProps {
  className?: string;
  sourceConditions: ConditionData;
  ifConditions: ConditionData;
  destConditions: ConditionData;
  defaultValues?: FacilitiesConnectionState;
  deletable?: boolean;
  onChange?: (state: FacilitiesConnectionState) => void;
  onDelete?: () => void;
}

function Conditions({
  className,
  ifConditions,
  sourceConditions,
  destConditions,
  defaultValues,
  deletable = false,
  onChange,
  onDelete,
}: ConditionsProps) {
  const [states, _setStates] = useState<FacilitiesConnectionState | undefined>(defaultValues);
  const [tableType, setTableType] = useState(TableTypes[0]);
  const sourceName = sourceConditions?.criteriaItems?.[0]?.id;
  const lastStates = useRef(Array(1).fill(defaultValues)).current;
  const setStates = (states: FacilitiesConnectionState) => {
    const valueLength = states.destConditions?.[0]?.value.length;
    const tableData = states?.tableData?.header && states?.tableData?.header?.length > 0 && states?.tableData?.data?.length > 0 ? states?.tableData : {
      title: sourceName,
      header:
        states.destConditions?.[0]?.value.map((val, index) => {
          return {
            name: val,
          };
        }) || [],
      data:
        states.sourceConditions?.[0]?.value.map((val, index) => {
          return {
            name: val,
            values: Array(valueLength).fill(0),
          };
        }) || [],
      hidden: false,
    };
    const newStates = { ...states, tableData };
    _setStates(newStates);
    lastStates[0] = { ...newStates };
    if (onChange) onChange(newStates);
  };
  const setTableData = (tableData: ConditionTableData) => {
    const newStates = { ...lastStates[0], tableData };
    lastStates[0] = { ...newStates };
    _setStates(newStates);
    if (onChange) onChange(newStates);
  };
  const tableData = states?.tableData;
  console.log(tableData)
  return (
    <div className={`mt-[20px] flex flex-col rounded-lg border border-gray-300 ${className}`}>
      <ConditionsBase
        className="gap-y-[0px] border-b-0 pb-[10px]"
        addCondition={false}
        labels={['Source']}
        logicItems={sourceConditions.logicItems}
        criteriaItems={sourceConditions.criteriaItems}
        operatorItems={sourceConditions.operatorItems}
        valueItems={sourceConditions.valueItems}
        initialValue={states?.sourceConditions}
        onChange={(sourceConditions) => setStates({ ...lastStates[0], sourceConditions })}
      />
      <ConditionsBase
        className="border-b-0 pt-[0px]"
        logicVisible={false}
        labels={[
          'IF',
          'AND',
          ...(states?.ifConditions && states?.ifConditions?.length > 2
            ? Array(states?.ifConditions?.length - 2).fill('AND')
            : []),
        ]}
        logicItems={ifConditions.logicItems}
        criteriaItems={ifConditions.criteriaItems.filter((val) => val.id != sourceName)}
        operatorItems={ifConditions.operatorItems}
        valueItems={ifConditions.valueItems}
        initialValue={states?.ifConditions}
        onChange={(ifConditions) => setStates({ ...lastStates[0], ifConditions })}
      />
      <ConditionsBase
        className="bg-white"
        addCondition={false}
        labels={['Destination']}
        logicItems={destConditions.logicItems}
        criteriaItems={destConditions.criteriaItems}
        operatorItems={destConditions.operatorItems}
        valueItems={destConditions.valueItems}
        initialValue={states?.destConditions}
        onChange={(destConditions) => setStates({ ...lastStates[0], destConditions })}
      />
      {tableData ? (
        <div className="table-import">
          <div className="flex items-center justify-center">
            <button
              className="flex h-[50px] w-full items-center justify-center gap-[10px] text-base font-normal text-default-300 hover:text-default-700"
              onClick={() => {
                setTableData({ ...lastStates[0].tableData!, hidden: !states.tableData!.hidden });
              }}
            >
              <FontAwesomeIcon
                className="nav-icon"
                size="sm"
                icon={tableData.hidden ? faAngleDown : faAngleUp}
              />
              {tableData.hidden ? 'Show' : 'Hide'} Table
            </button>
          </div>
          {tableData.hidden || tableData.header.length < 1 || tableData.data.length < 1 ? null : (
            <div className="table-wrap mt-[10px] overflow-hidden rounded-md px-[20px]">
              <div className="mt-[20px] flex items-center justify-end">
                <div className="w-[340px]">
                  <SelectBox
                    options={TableTypes}
                    selectedOption={tableType}
                    onSelectedOption={(val) => setTableType(val)}
                  />
                </div>
              </div>
              <div className="table-wrap mt-[10px] overflow-hidden rounded-md pb-[10px]">
                {!tableData ? null : (
                  <GridTable
                    className="border-none"
                    type={
                      tableType == TableTypes[0] ? 'checkbox' : tableType == TableTypes[1] ? 'number' : 'text'
                    }
                    title={tableData.title}
                    header={tableData.header}
                    data={tableData.data}
                    errorMessage={
                      checkNotEmptyRows(tableData?.data)
                        ? ''
                        : '● Please make sure to fill in all fields without leaving any blank rows!'
                    }
                    onDataChange={(data) => {
                      setTableData({ ...tableData, data });
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
      {deletable ? (
        <div className="flex items-center justify-center rounded-md border border-default-200 bg-rose-100">
          <button
            className="h-[60px] w-full text-lg font-medium text-rose-900 hover:text-rose-700"
            onClick={() => {
              if (onDelete) onDelete();
            }}
          >
            Delete Logic
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function TabFacilityConnection({ visible }: FacilityConnectionProps) {
  const refWidth = useRef(null);
  const { setFacilityConnection, passenger_attr, passenger_sch, facility_conn } = useSimulationMetadata();
  const { tabIndex, setTabIndex, priorities, scenarioInfo, facilityConnCapacities, setFacilityConnCapacities } =
    useSimulationStore();

  const [procedureIndex, setProcedureIndex] = useState(0);
  const [availableProcedureIndex, setAvailableProcedureIndex] = useState(0);
  const [addConditionsVisible, setAddConditionsVisible] = useState<Array<boolean>>();

  const [tableType, setTableType] = useState(TableTypes[0]);
  const [tableData, setTableData] = useState<Array<TableData>>();
  const [selConditions, setSelConditions] = useState<FacilitiesConnectionState[][]>();
  const [ifConditions, setIfConfitions] = useState<ConditionData>();
  const [conditionsTime, setConditionsTime] = useState(Date.now());

  const [loaded, setLoaded] = useState(false);

  const saveSnapshot = (params?: Partial<FacilityConnection>, snapshot: any = {}) => {
    const newSnapshot: any = {
      facilityConnCapacities,
      procedureIndex,
      availableProcedureIndex,
      addConditionsVisible,
      tableType,
      tableData,
      selConditions,
      ifConditions,
      ...snapshot,
    };
    setFacilityConnection({ ...facility_conn, ...(params || {}), snapshot: newSnapshot });
  };

  const restoreSnapshot = () => {
    if (facility_conn?.snapshot) {
      const snapshot = facility_conn?.snapshot;
      if(snapshot.procedureIndex) setProcedureIndex(snapshot.procedureIndex);
      if(snapshot.availableProcedureIndex) setAvailableProcedureIndex(snapshot.availableProcedureIndex);
      if(snapshot.addConditionsVisible) setAddConditionsVisible(snapshot.addConditionsVisible);
      if(snapshot.tableType) setTableType(snapshot.tableType);
      if(snapshot.tableData) setTableData(snapshot.tableData);
      if(snapshot.selConditions) setSelConditions(snapshot.selConditions);
      if(snapshot.ifConditions) setIfConfitions(snapshot.ifConditions);
      if(snapshot.facilityConnCapacities) setFacilityConnCapacities(snapshot.facilityConnCapacities);
      setConditionsTime(Date.now());
    }
  };

  useEffect(() => {
    if (visible && !loaded && facility_conn?.snapshot) {
      restoreSnapshot();
      setLoaded(true);
    }
  }, [visible, facility_conn?.snapshot]);

  const conditionsItems =
    selConditions && selConditions?.length > 0 ? selConditions[procedureIndex] : [undefined];

  useEffect(() => {
    if (passenger_attr?.procedures && passenger_attr?.data_connection_criteria && priorities) {
      const ifConditions = { ...priorities };
      ifConditions.criteriaItems.push({ id: 'Time', text: 'Time' });
      ifConditions.operatorItems['Time'] = [
        { id: 'start', text: 'start', multiSelect: true },
        { id: 'end', text: 'end', multiSelect: true },
      ];
      ifConditions.valueItems['Time'] = Array(24)
        .fill(0)
        .map((_, index) => {
          const id = `${String(index).padStart(2, '0')}:00`;
          return { id, text: id };
        }) as OperatorItem[];
      setIfConfitions(ifConditions);
      setTableData(
        passenger_attr?.procedures?.map((procedure, index) => {
          const sourceName =
            index > 0
              ? passenger_attr?.procedures?.[index - 1]?.name
              : passenger_attr?.data_connection_criteria;
          const destName = procedure.name;
          return {
            title: procedure.name,
            header: procedure.nodes.map((val, index) => {
              return {
                name: val,
              };
            }),
            data:
              index > 0
                ? (passenger_attr?.procedures?.[index - 1].nodes.map((name) => {
                    return { name, values: Array(procedure.nodes.length).fill(0) };
                  }) as GridTableRow[])
                : passenger_attr?.data_connection_criteria
                  ? (ifConditions?.valueItems?.[passenger_attr?.data_connection_criteria].map((item) => {
                      return { name: item.id, values: Array(procedure.nodes.length).fill(0) };
                    }) as GridTableRow[])
                  : [],
            waitTime: '0',
            hidden: false,
            sourceCondition: {
              logicItems: [{ id: 'AND', text: 'AND' }],
              criteriaItems: [{ id: sourceName, text: sourceName }],
              operatorItems: { [sourceName!]: [{ id: '01', text: 'is in', multiSelect: true }] },
              valueItems: {
                [sourceName!]:
                  index > 0
                    ? passenger_attr?.procedures?.[index - 1].nodes.map((id) => {
                        return { id, text: id };
                      })
                    : ifConditions?.valueItems?.[passenger_attr.data_connection_criteria!],
              },
            } as ConditionData,
            destCondition: {
              logicItems: [{ id: 'AND', text: 'AND' }],
              criteriaItems: [{ id: destName, text: destName }],
              operatorItems: { [destName!]: [{ id: '01', text: 'is in', multiSelect: true }] },
              valueItems: {
                [destName!]: passenger_attr?.procedures?.[index].nodes.map((id) => {
                  return { id, text: id };
                }),
              },
            } as ConditionData,
          };
        })
      );
      setSelConditions(Array(passenger_attr?.procedures!.length).fill([undefined]));
      setAddConditionsVisible(Array(passenger_attr?.procedures!.length).fill(false));
      setProcedureIndex(0);
    }
  }, [passenger_attr]);

  const [loadingFacilityConnection, setLoadingFacilityConnection] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const procedures = [
    ...(passenger_attr?.procedures?.map((item, index) => {
      return {
        text: item.name,
      };
    }) || []),
  ] as ProcedureInfo[];

  const checkTablesValid = (pIndex: number) => {
    if (!checkNotEmptyRows(tableData?.[pIndex]?.data)) return false;
    if (addConditionsVisible?.[pIndex]) {
      if (!selConditions?.[pIndex]) return false;
      for (const conditionCur of selConditions?.[pIndex]) {
        if (!checkNotEmptyRows(conditionCur?.tableData?.data)) return false;
      }
    }
    return true;
  };

  const checkTablesValidAll = () => {
    for (let i = 0; i < procedures.length; i++) {
      if (!checkTablesValid(i)) return false;
    }
    return true;
  };

  const applyButtonEnable = checkTablesValid(procedureIndex);

  const onBtnApply = () => {
    if (procedureIndex < procedures.length - 1) {
      setAvailableProcedureIndex(availableProcedureIndex + 1);
      setProcedureIndex(procedureIndex + 1);
      saveSnapshot({}, { availableProcedureIndex: availableProcedureIndex + 1, procedureIndex: procedureIndex + 1 });
    }
  };

  const onBtnPassengerFlowCheck = () => {
    if(!checkTablesValidAll()) return;
    const params = { ...passenger_sch?.params };
    const processes = {
      '0': {
        name: passenger_attr?.data_connection_criteria,
        nodes: [],
        source: null,
        destination: '1',
        wait_time: null,
        default_matrix: null,
        priority_matrix: null,
      },
    };

    for (let i = 0; i < procedures.length; i++) {
      const proceduresCur = passenger_attr?.procedures?.[i];
      const conditionsCur = selConditions?.[i];
      const tableDataCur = tableData?.[i];

      const defaultMatrix = {};
      const priorityMatrix: {
        condition: Array<{
          criteria: string;
          operator: string;
          value: string[];
        }>;
        matrix: {
          [row: string]: {
            [col: string]: number;
          };
        };
      }[] = [];

      const paramCur = {
        name: proceduresCur?.id,
        nodes: proceduresCur?.nodes,
        source: String(i),
        destination: i < procedures.length - 1 ? String(i + 2) : null,
        wait_time: Number(tableDataCur?.waitTime),
        default_matrix: defaultMatrix,
        priority_matrix: priorityMatrix,
      };

      for (const rowCur of tableDataCur!.data) {
        const name = rowCur.name;
        defaultMatrix[name] = {};
        for (let j = 0; j < rowCur.values.length; j++) {
          defaultMatrix[name][tableDataCur?.header[j].name] = Number(rowCur.values[j]) / 100;
        }
      }

      if (addConditionsVisible?.[i]) {
        for (const conditionStates of conditionsCur!) {
          const paramsCur: {
            condition: Array<{
              criteria: string;
              operator: string;
              value: string[];
            }>;
            matrix: {
              [row: string]: {
                [col: string]: number;
              };
            };
          } = { condition: [], matrix: {} };
          const mergedConditions = [
            ...conditionStates.sourceConditions!,
            ...conditionStates.ifConditions!,
            ...conditionStates.destConditions!,
          ];
          for (const conditionCur of mergedConditions) {
            paramsCur.condition.push({
              criteria: conditionCur.criteria.toLowerCase().replace(/[\s-]+/g, '_'),
              operator: conditionCur.operator,
              value: conditionCur.value,
            });
          }

          for (const rowCur of conditionStates.tableData!.data) {
            const name = rowCur.name;
            paramsCur.matrix[name] = {};
            for (let j = 0; j < rowCur.values.length; j++) {
              paramsCur.matrix[name][conditionStates.tableData!.header[j].name] =
                Number(rowCur.values[j]) / 100;
            }
          }

          priorityMatrix.push(paramsCur);
        }
      }

      processes[String(i + 1)] = paramCur;
    }

    params.processes = processes;

    setLoadingFacilityConnection(true);
    setFacilityConnection({ params: undefined });
    getFacilityConns(params)
      .then(({ data }) => {
        setFacilityConnCapacities({ ...data });
        const facilityConnection: Partial<FacilityConnection> = { ...facility_conn, params };
        const snapshotData: any = { facilityConnCapacities: { ...data } };
        setFacilityConnection(facilityConnection);
        setLoadingFacilityConnection(false);
        saveSnapshot(facilityConnection, snapshotData);
      })
      .catch(() => {
        setLoadError(true);
        setLoadingFacilityConnection(false);
      });
  };

  return !visible ? null : (
    <div ref={refWidth}>
      <h2 className="title-sm mt-[25px]">Allocate Passenger Attributes to Processing Facilities</h2>
      <TabDefault
        tabCount={procedures.length}
        currentTab={procedureIndex}
        availableTabs={availableProcedureIndex}
        tabs={procedures.map((tab) => ({ text: tab.text, number: tab.number || 0 }))}
        onTabChange={(index) => {
          if (index > availableProcedureIndex) return;
          setProcedureIndex(index);
        }}
        className={`tab-secondary mt-[25px]`}
      />
      {loadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />
          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>
        </div>
      ) : (
        <div>
          <div className="mt-[30px] flex items-center justify-center gap-[100px]">
            <p className="text-[40px] text-xl font-semibold text-default-800">
              {procedureIndex == 0
                ? passenger_attr?.data_connection_criteria
                : procedures[procedureIndex - 1].text}
            </p>
            <p className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-default-100">
              <FontAwesomeIcon className="nav-icon" size="sm" icon={faArrowRight} />
            </p>
            <p className="text-[40px] text-xl font-semibold text-default-800">
              {procedures[procedureIndex].text}
            </p>
          </div>
          {!tableData?.[procedureIndex] || procedureIndex < 1 ? null : (
            <div className="add-time mt-[30px]">
              <p className="flex items-center gap-[10px]">
                <span>Add a wait time after completing the previous step *</span>
                <button>
                  <Tooltip text={'test'} />
                </button>
              </p>
              <div className="relative mt-[10px]">
                <Input
                  type="number"
                  placeholder=""
                  value={tableData[procedureIndex].waitTime || '0'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTableData(
                      tableData.map((val, idx) =>
                        idx == procedureIndex
                          ? { ...val, waitTime: Math.max(Number(e.target.value), 0).toString() }
                          : val
                      )
                    )
                  }
                  className="input-rounded"
                />
              </div>
            </div>
          )}
          {addConditionsVisible ? (
            <div className="mt-[30px] flex items-center gap-[10px] rounded-md border border-gray-200 bg-gray-50 p-[15px]">
              <Checkbox
                id="add-conditions"
                label=""
                checked={addConditionsVisible?.[procedureIndex] || false}
                onChange={() =>
                  setAddConditionsVisible(
                    addConditionsVisible?.map((val, index) => (index == procedureIndex ? !val : val))
                  )
                }
                className="checkbox-toggle"
              />
              <dl>
                <dt className="font-semibold">Add Conditions</dt>
                <dd className="text-sm font-medium text-default-400">
                  Enable the option to set conditions for filtering passenger data.{' '}
                </dd>
              </dl>
            </div>
          ) : null}
          {ifConditions &&
          addConditionsVisible?.[procedureIndex] &&
          tableData?.[procedureIndex] &&
          selConditions ? (
            <div>
              {conditionsItems.map((item, index) => (
                <Conditions
                  key={`${procedureIndex}_${index}_${conditionsTime}`}
                  ifConditions={ifConditions}
                  sourceConditions={tableData?.[procedureIndex].sourceCondition}
                  destConditions={tableData?.[procedureIndex].destCondition}
                  defaultValues={item}
                  deletable={index > 0}
                  onChange={(states) => {
                    setSelConditions(
                      selConditions?.map((con, cidx) =>
                        procedureIndex == cidx
                          ? conditionsItems.map((rowCur, idx) => (index == idx ? states : rowCur))
                          : con
                      )
                    );
                  }}
                  onDelete={() => {
                    setSelConditions(
                      selConditions?.map((con, cidx) =>
                        procedureIndex == cidx
                          ? (conditionsItems.filter(
                              (rowCur, idx) => index != idx
                            ) as FacilitiesConnectionState[])
                          : con
                      )
                    );
                    setConditionsTime(Date.now());
                  }}
                />
              ))}
              <div className="mt-[20px] flex items-center justify-center rounded-md border border-default-200 bg-default-100">
                <button
                  className="h-[60px] w-full text-lg font-medium text-accent-600 hover:text-accent-700"
                  onClick={() => {
                    setSelConditions(
                      selConditions?.map((con, cidx) =>
                        procedureIndex == cidx ? ([...con, undefined] as FacilitiesConnectionState[]) : con
                      )
                    );
                  }}
                >
                  + Add Logic
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-[50px] flex items-center justify-between">
            <p className="tex-[40px] pl-[30px] text-xl font-medium text-default-800">
              {addConditionsVisible?.[procedureIndex] || false ? 'ELSE' : ''}
            </p>
            <div className="w-[340px]">
              <SelectBox
                options={TableTypes}
                selectedOption={tableType}
                onSelectedOption={(val) => setTableType(val)}
              />
            </div>
          </div>
          {!tableData?.[procedureIndex] ? null : (
            <div className="mt-[10px] flex items-center justify-center">
              <button
                className="flex h-[50px] w-full items-center justify-center gap-[10px] text-lg font-medium text-default-300 hover:text-default-700"
                onClick={() => {
                  setTableData(
                    tableData.map((val, idx) => (idx == procedureIndex ? { ...val, hidden: !val.hidden } : val))
                  );
                }}
              >
                <FontAwesomeIcon
                  className="nav-icon"
                  size="sm"
                  icon={tableData[procedureIndex].hidden ? faAngleDown : faAngleUp}
                />
                {tableData[procedureIndex].hidden ? 'Show' : 'Hide'} Table
              </button>
            </div>
          )}

          {!tableData?.[procedureIndex] || tableData[procedureIndex].hidden ? null : (
            <div>
              <GridTable
                type={tableType == TableTypes[0] ? 'checkbox' : tableType == TableTypes[1] ? 'number' : 'text'}
                title={tableData[procedureIndex].title}
                header={tableData[procedureIndex].header}
                data={tableData[procedureIndex].data}
                errorMessage={
                  applyButtonEnable
                    ? ''
                    : '● Please make sure to fill in all fields without leaving any blank rows!'
                }
                onDataChange={(data) => {
                  setTableData(tableData.map((val, idx) => (idx == procedureIndex ? { ...val, data } : val)));
                }}
              />
            </div>
          )}

          <div className="mt-[20px] flex items-center justify-between">
            <p className="font-medium text-warning">
              {/* ● Please make sure to fill in all fields without leaving any blank rows! */}
            </p>
            <Button
              className="btn-md btn-tertiary"
              text="Apply"
              disabled={loadingFacilityConnection || !applyButtonEnable}
              onClick={() =>
                procedureIndex == procedures.length - 1 ? onBtnPassengerFlowCheck() : onBtnApply()
              }
            />
          </div>
          <div>
            {loadingFacilityConnection ? (
              <div className="flex min-h-[200px] flex-1 items-center justify-center">
                <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="mt-[40px] flex justify-between">
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setTabIndex(tabIndex - 1)}
        >
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
          <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
        </button>
        <button
          className="btn-md btn-default btn-rounded w-[210px] justify-between"
          onClick={() => setTabIndex(tabIndex + 1)}
          disabled={
            facilityConnCapacities
              ? false
              : procedureIndex < procedures.length || loadingFacilityConnection || loadError
          }
        >
          <span className="flex flex-grow items-center justify-center">Facility Information</span>
          <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
        </button>
      </div>
    </div>
  );
}
