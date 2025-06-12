'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { faAngleLeft, faAngleRight, faCheck, faEquals } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { OrbitProgress } from 'react-loading-indicators';
import { useShallow } from 'zustand/react/shallow';
import { Procedure } from '@/types/scenarios';
import { getProcessingProcedures } from '@/services/simulations';
import { useScenarioStore } from '@/stores/useScenarioStore';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import Tooltip from '@/components/Tooltip';

// 동적으로 변경하기
const DATA_CONNECTION_CRITERIAS = ['I/D', 'Airline', 'Country', 'Region'];

interface TabProcessingProceduresProps {
  visible: boolean;
}

export default function TabProcessingProcedures({ visible }: TabProcessingProceduresProps) {
  const {
    currentScenarioTab,
    setCurrentScenarioTab,
    setAvailableScenarioTab,
    procedures_,
    dataConnectionCriteria,
    setProcedures,
    setDataConnectionCriteria,
  } = useScenarioStore(
    useShallow((s) => ({
      currentScenarioTab: s.scenarioProfile.currentScenarioTab,
      dataConnectionCriteria: s.airportProcessing.dataConnectionCriteria,
      procedures_: s.airportProcessing.procedures,
      // ---
      setAvailableScenarioTab: s.scenarioProfile.actions.setAvailableScenarioTab,
      setCurrentScenarioTab: s.scenarioProfile.actions.setCurrentScenarioTab,
      setDataConnectionCriteria: s.airportProcessing.actions.setDataConnectionCriteria,
      setProcedures: s.airportProcessing.actions.setProcedures,
    }))
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadError, setIsLoadError] = useState(false);

  const onClickAdd = () => {
    setProcedures([
      ...procedures_,
      {
        name: '',
        nodes: [],
        id: String(procedures_.length),
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
    setProcedures(procedures_.filter((item, idx) => index != idx));
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;

    const procedures = Array.from(procedures_);

    // 동일 위치 드래그 방지 (불필요한 상태 업데이트 방지)
    if (source.index === destination.index) return;

    const [movedItem] = procedures.splice(source.index, 1);
    procedures.splice(destination.index, 0, movedItem);

    // setProcedures({ ...procedures_, procedures });
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

        const processedProcedures: Procedure[] = calcProcedures(data.process);

        setProcedures(processedProcedures);
        setDataConnectionCriteria(DATA_CONNECTION_CRITERIAS[0]);

        setIsLoadError(false);
      } catch (error) {
        setIsLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProcessingProcedures();
  }, []);

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
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
        </div>
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
                  {procedures_?.map((proc, index) => {
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

                              <p className="item-name">
                                <Input
                                  id={`${proc.id}_${index}_input_name`}
                                  className={`${proc.editable ? '' : 'hidden'} text-2xl`}
                                  type="text"
                                  value={proc.nameText || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const newText = e.target.value.replace(/[^A-Za-z0-9-_ ]/g, '');
                                    // HACK: 더 좋은 코드가 있을 것 같은데...
                                    setProcedures(
                                      procedures_.map((item, i) =>
                                        i === index ? { ...item, nameText: newText, name: newText } : item
                                      )
                                    );
                                  }}
                                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                      // HACK: 더 좋은 코드가 있을 것 같은데...
                                      setProcedures(
                                        procedures_.map((item, i) =>
                                          i === index ? { ...item, editable: false } : item
                                        )
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
                                      procedures_.map((item, i) =>
                                        i === index ? { ...item, editable: !item.editable } : item
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

                              <dl className="ml-[40px] mr-[300px] flex-grow">
                                <dt className="tooltip-line">
                                  Enter the {proc.name} desks <span className="text-accent-600">*</span>
                                  <button>
                                    <Tooltip text={'test'} />
                                  </button>
                                </dt>

                                <dd>
                                  <Input
                                    type="text"
                                    value={proc.nodesText || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const newText = e.target.value.replace(/[^A-Za-z0-9,]/g, '');
                                      // HACK: 더 좋은 코드가 있을 것 같은데...
                                      setProcedures(
                                        procedures_.map((item, i) =>
                                          i === index
                                            ? { ...item, nodesText: newText, nodes: newText.split(',') }
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

          <p className={`add-item`}>
            <button onClick={onClickAdd}>
              <Image width={48} height={48} src="/image/ico-add-item.svg" alt="add item" />
            </button>
          </p>

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
              // disabled={!applied}
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
