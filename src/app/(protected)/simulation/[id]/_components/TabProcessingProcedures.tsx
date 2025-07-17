'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { faAngleLeft, faAngleRight, faCheck, faEquals } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useShallow } from 'zustand/react/shallow';
import { Procedure } from '@/types/scenarios';
import { getProcessingProcedures } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import Tooltip from '@/components/Tooltip';
import SimulationLoading from '../../_components/SimulationLoading';

const DATA_CONNECTION_CRITERIAS = ['I/D', 'Airline', 'Country', 'Region'];

interface TabProcessingProceduresProps {
  visible: boolean;
}

export default function TabProcessingProcedures({ visible }: TabProcessingProceduresProps) {
  const {
    currentScenarioTab,
    setCurrentScenarioTab,
    availableScenarioTab,
    setAvailableScenarioTab,
    procedures,
    dataConnectionCriteria,
    setProcedures,
    setDataConnectionCriteria,
    resetFacilityConnection,
    resetFacilityCapacity,
  } = useScenarioStore(
    useShallow((s) => ({
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      availableScenarioTab: s.scenarioProfile.availableScenarioTab,
      setAvailableScenarioTab: s.scenarioProfile.actions.setAvailableScenarioTab,
      dataConnectionCriteria: s.airportProcessing.dataConnectionCriteria,
      procedures: s.airportProcessing.procedures,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      setDataConnectionCriteria: s.airportProcessing.actions.setDataConnectionCriteria,
      setProcedures: s.airportProcessing.actions.setProcedures,
      resetFacilityConnection: s.facilityConnection.actions.resetState,
      resetFacilityCapacity: s.facilityCapacity.actions.resetState,
    }))
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadError, setIsLoadError] = useState(false);

  const [tempPrevProcedures, setTempPrevProcedures] = useState<Procedure[]>([]);

  const onClickAdd = () => {
    setProcedures([
      ...procedures,
      {
        name: '',
        nameText: '',
        nodes: [],
        nodesText: '',
        id: String(procedures.length),
        editable: true,
      },
    ]);
  };

  const calcProcedures = (procedures: Procedure[]): Procedure[] => {
    return procedures.map((proc, i) => ({
      ...proc,
      id: String(i),
      nameText: proc.name,
      nodesText: proc.nodes.join(','),
      editable: false,
    }));
  };

  const onClickDelete = (index: number) => {
    setProcedures(procedures.filter((item, idx) => index != idx));
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;

    const steps = Array.from(procedures);

    // 동일 위치 드래그 방지 (불필요한 상태 업데이트 방지)
    if (source.index === destination.index) return;

    const [movedItem] = steps.splice(source.index, 1);
    steps.splice(destination.index, 0, movedItem);

    // setProcedures({ ...procedures, procedures });
  };

  useEffect(() => {
    const loadProcessingProcedures = async () => {
      try {
        setIsLoading(true);

        const { data } = await getProcessingProcedures();

        if (!data.process) {
          setIsLoadError(true);
          return;
        }

        const processedProcedures: Procedure[] = data.process.map((proc, i) => ({
          ...proc,
          id: String(i),
          name: proc.name.toLowerCase().replace(/[\s-]+/g, '_'),
          nameText: proc.name,
          nodesText: proc.nodes.join(','),
          editable: false,
        }));

        setDataConnectionCriteria(DATA_CONNECTION_CRITERIAS[0]);
        setProcedures(processedProcedures);
        // +++

        setIsLoadError(false);
      } catch (error) {
        setIsLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (procedures.length === 0) {
      loadProcessingProcedures();
    } else {
      setTempPrevProcedures(procedures);
    }
  }, []);

  // ================================================================

  const isProceduresChanged = (oldVal: Procedure[], newVal: Procedure[]) => {
    const oldValWithoutEditable = oldVal.map((proc) => ({ ...proc, editable: false }));
    const newValWithoutEditable = newVal.map((proc) => ({ ...proc, editable: false }));
    return !_.isEqual(oldValWithoutEditable, newValWithoutEditable);
  };

  useEffect(() => {
    if (!visible) return;

    if (currentScenarioTab >= availableScenarioTab) return;

    if (isProceduresChanged(tempPrevProcedures, procedures)) {
      setAvailableScenarioTab(availableScenarioTab - 1);
    }
  }, [currentScenarioTab, availableScenarioTab, procedures, tempPrevProcedures, setAvailableScenarioTab, visible]);

  return !visible ? null : (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="mt-[25px] flex justify-between">
        <div>
          <h2 className="title-sm">Processing Procedures</h2>
          <p className="text-sm text-default-500">
            You can check and modify the current airport procedures. <br />
            Match processing procedures according to airport operations and needs using this input.
          </p>
        </div>

        {/* <p className="flex gap-[10px]">
            <Button
              className="btn-md btn-default"
              icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faEquals} />}
              text="Edit Procedures"
              onClick={() => {}}
            />
            <Button
              className="btn-md btn-primary"
              icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faEquals} />}
              text="Confirm"
              onClick={() => {}}
            />
          </p> */}
      </div>

      {isLoading ? (
        <SimulationLoading minHeight="min-h-[200px]" />
      ) : isLoadError ? (
        <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
          <Image width={16} height={16} src="/image/ico-error.svg" alt="" />

          <p className="title-sm" style={{ color: '#30374F' }}>
            Unable to load data
          </p>
        </div>
      ) : dataConnectionCriteria ? (
        <>
          <dl className="mt-[40px]">
            <dt className="tooltip-line">
              Data connection criteria <span className="text-accent-600">*</span>
              <button>
                <Tooltip text={'test'} />
              </button>
            </dt>

            <dd>
              <SelectBox
                className="select-default"
                options={DATA_CONNECTION_CRITERIAS}
                selectedOption={dataConnectionCriteria}
                onSelectedOption={setDataConnectionCriteria}
              />
            </dd>
          </dl>

          <div className="processing-wrap mt-[10px]">
            <Droppable
              droppableId="droppable"
              isDropDisabled={false}
              isCombineEnabled={true}
              ignoreContainerClipping={true}
              direction={'vertical'}
            >
              {(provided) => (
                <ul ref={provided.innerRef} {...provided.droppableProps}>
                  {procedures?.map((proc, index) => {
                    return (
                      <Draggable key={`${proc.id}_${index}`} index={index} draggableId={proc.id}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{ ...provided.draggableProps.style, marginTop: index > 0 ? 10 : 0 }}
                          >
                            <div key={proc.id} className="processing-item bg-red-500 overflow-hidden">
                              <button className="item-move">
                                <FontAwesomeIcon size="sm" icon={faEquals} />
                              </button>

                              {/* ========== 컴포넌트 입력 ========== */}
                              <p className="item-name">
                                <Input
                                  id={`${proc.id}_${index}_input_name`}
                                  className={`${proc.editable ? '' : 'hidden'} text-2xl`}
                                  type="text"
                                  value={proc.nameText}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const newText = e.target.value.replace(/[^A-Za-z0-9-_ ]/g, '');

                                    // HACK: 더 좋은 코드가 있을 것 같은데...
                                    setProcedures(
                                      procedures.map((item, i) =>
                                        i === index
                                          ? {
                                              ...item,
                                              name: newText.toLowerCase().replace(/[\s-]+/g, '_'),
                                              nameText: newText,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                      // HACK: 더 좋은 코드가 있을 것 같은데...
                                      setProcedures(
                                        procedures.map((item, i) => (i === index ? { ...item, editable: false } : item))
                                      );

                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                />

                                {!proc.editable ? (
                                  <span className="break-all leading-[1.1]">{proc.nameText}</span>
                                ) : null}

                                <button
                                  onClick={() => {
                                    // HACK: 더 좋은 코드가 있을 것 같은데...
                                    setProcedures(
                                      procedures.map((proc, i) =>
                                        i === index ? { ...proc, editable: !proc.editable } : proc
                                      )
                                    );
                                    if (!proc.editable) {
                                      setTimeout(
                                        () => document.getElementById(`${proc.id}_${index}_input_name`)?.focus(),
                                        50
                                      );
                                    }
                                  }}
                                >
                                  {proc.editable ? (
                                    <FontAwesomeIcon className="nav-icon ml-[8px]" size="sm" icon={faCheck} />
                                  ) : (
                                    <Image width={30} height={30} src="/image/ico-write.svg" alt="modify" />
                                  )}
                                </button>
                              </p>

                              {/* ========== 시설 리스트 입력 ========== */}
                              <dl className="ml-[40px] mr-[300px] flex-grow">
                                <dt className="tooltip-line">
                                  Enter the {proc.nameText} desks <span className="text-accent-600">*</span>
                                  {/* <button><Tooltip text={'test'} /></button> */}
                                </dt>

                                <dd>
                                  <Input
                                    type="text"
                                    value={proc.nodesText}
                                    onBlur={(e) => {
                                      const newNodes = e.target.value.trim();
                                      const trimmedNodes = newNodes
                                        .split(',')
                                        .map((n) => n.trim())
                                        .filter((n) => n !== '');

                                      setProcedures(
                                        procedures.map((proc, prodIndex) =>
                                          prodIndex === index
                                            ? {
                                                ...proc,
                                                nodes: trimmedNodes,
                                                nodesText: trimmedNodes.join(','),
                                              }
                                            : proc
                                        )
                                      );
                                    }}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const newText = e.target.value.replace(/[^A-Za-z0-9-_,() ]/g, '');

                                      setProcedures(
                                        procedures.map((item, i) =>
                                          i === index
                                            ? {
                                                ...item,
                                                nodesText: newText,
                                              }
                                            : item
                                        )
                                      );
                                    }}
                                  />
                                </dd>
                              </dl>

                              <button onClick={() => onClickDelete(index)}>
                                <Image width={30} height={30} src="/image/ico-delete-line.svg" alt="" />
                              </button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>

          <p className="add-item">
            <button onClick={onClickAdd}>
              <Image width={48} height={48} src="/image/ico-add-item.svg" alt="add item" />
            </button>
          </p>

          <div className="mt-5 flex justify-end">
            <Button
              className="btn-md btn-tertiary"
              text="Apply"
              onClick={() => {
                setProcedures(procedures.map((proc) => ({ ...proc, editable: false })));

                // NOTE: 이전 절차와 현재 절차가 동일
                if (!isProceduresChanged(tempPrevProcedures, procedures)) {
                  setAvailableScenarioTab(Math.min(availableScenarioTab + 1, 4));
                  return;
                }

                const isGranted = confirm(
                  'If you change the desk, previous connection setting will be deleted.Do you want to continue?'
                );

                // NOTE: 이전 절차와 현재 절차가 동일하지 않지만, 사용자가 변경을 승인한 경우
                if (isGranted) {
                  setAvailableScenarioTab(Math.min(availableScenarioTab + 1, 4));
                  setTempPrevProcedures(procedures);
                  resetFacilityConnection();
                  resetFacilityCapacity();
                  return;
                }

                // NOTE: 이전 절차와 현재 절차가 동일하지 않지만, 사용자가 변경을 승인하지 않은 경우
                setProcedures(tempPrevProcedures);
              }}
            />
          </div>

          <div className="mt-[30px] flex justify-between">
            <button
              className="btn-md btn-default btn-rounded w-[210px] justify-between"
              onClick={() => setCurrentScenarioTab(currentScenarioTab - 1)}
            >
              <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleLeft} />
              <span className="flex flex-grow items-center justify-center">Filght Schedule</span>
            </button>

            <button
              className="btn-md btn-default btn-rounded w-[210px] justify-between"
              // HACK: 추후 탭 인덱스 값을 Props로 받아서 처리하도록 개선 (하드코딩 제거)
              disabled={isProceduresChanged(tempPrevProcedures, procedures) || availableScenarioTab < 4}
              onClick={() => setCurrentScenarioTab(currentScenarioTab + 1)}
            >
              <span className="flex flex-grow items-center justify-center">Facility Connection</span>
              <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
            </button>
          </div>
        </>
      ) : null}
    </DragDropContext>
  );
}
