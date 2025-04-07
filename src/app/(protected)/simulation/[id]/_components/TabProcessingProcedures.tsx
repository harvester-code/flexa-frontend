'use client';

// import Tooltip from '@mui/material/Tooltip';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { faAngleLeft, faAngleRight, faCheck, faEquals } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { OrbitProgress } from 'react-loading-indicators';
import { ProcessingProcedureState } from '@/types/simulations';
import { getProcessingProcedures } from '@/services/simulations';
import { useSimulationMetadata, useSimulationStore } from '@/stores/simulation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SelectBox from '@/components/SelectBox';
import Tooltip from '@/components/Tooltip';
import { replaceAll } from '@/lib/utils';

interface TabProcessingProceduresProps {
  visible: boolean;
}

const DataConnectionCriterias = ['I/D', 'Airline', 'Country', 'Region'];

export default function TabProcessingProcedures({ visible }: TabProcessingProceduresProps) {
  const { setPassengerAttr, passenger_attr } = useSimulationMetadata();
  const { tabIndex, setTabIndex, setAvailableTabIndex } = useSimulationStore();

  const [loaded, setLoaded] = useState(false);
  const [dataConnectionCriteria, setDataConnectionCriteria] = useState('');
  const [procedures, setProcedures] = useState<ProcessingProcedureState[]>([]);

  const [loadingProcessingProcedures, setLoadingProcessingProcedures] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastProcedures, setLastProcedures] = useState<ProcessingProcedureState[]>();

  const applied = lastProcedures == procedures;

  const loadData = () => {
    setLoadingProcessingProcedures(true);
    getProcessingProcedures()
      .then(({ data }) => {
        if (data?.process) {
          setProcedures(
            data?.process.map((item, index) => {
              return {
                ...item,
                id: String(index),
                nameText: item.name,
                nodesText: item.nodes.join(','),
                editable: false,
              };
            })
          );
        } else {
          setLoadError(true);
        }
        if (!dataConnectionCriteria) setDataConnectionCriteria(DataConnectionCriterias.find((val) => val == 'Airline') ? 'Airline' : DataConnectionCriterias[0]);
        setLoadingProcessingProcedures(false);
      })
      .catch((e) => {
        if (!dataConnectionCriteria) setDataConnectionCriteria(DataConnectionCriterias.find((val) => val == 'Airline') ? 'Airline' : DataConnectionCriterias[0]);
        setLoadError(true);
        setLoadingProcessingProcedures(false);
      });
  };

  useEffect(() => {
    if (visible && !loaded) {
      if (passenger_attr?.data_connection_criteria && passenger_attr?.procedures) {
        setDataConnectionCriteria(passenger_attr?.data_connection_criteria);
        if (passenger_attr?.procedures && passenger_attr?.procedures?.length > 0) {
          const newProcedures = passenger_attr?.procedures?.map((item, index) => {
            return {
              ...item,
              id: item.id,
              nameText: item.name,
              nodesText: item.nodes.join(','),
              editable: false,
            };
          });
          setProcedures(newProcedures);
          setLastProcedures(newProcedures);
        }
      } else {
        loadData();
      }
      setLoaded(true);
    }
  }, [visible]);

  const onBtnAdd = () => {
    setProcedures([...procedures, { id: String(procedures.length), name: '', nodes: [], editable: true }]);
  };
  const onBtnDelete = (index: number) => {
    setProcedures([...procedures.filter((item, idx) => index != idx)]);
  };
  const onBtnApply = () => {
    const newMetadata = {
      data_connection_criteria: dataConnectionCriteria,
      procedures: procedures.map((val) => {
        const nodes =
          val.nodesText
            ?.split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0) || [];
        const name = val.nameText || val.name;
        const id = val.name.toLowerCase().replace(/[\s-]+/g, '_');
        return { id, name, nodes };
      }),
    };
    setPassengerAttr(newMetadata);
    const newProcedures = newMetadata?.procedures.map((item, index) => {
      return {
        ...item,
        id: item.id,
        nameText: item.name,
        nodesText: item.nodes.join(','),
        editable: false,
      };
    });
    setProcedures(newProcedures);
    setLastProcedures(newProcedures);
    setAvailableTabIndex(tabIndex + 1);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const reorderedItems = Array.from(procedures);
    const [removed] = reorderedItems.splice(source.index, 1);
    reorderedItems.splice(destination.index, 0, removed);

    setProcedures(reorderedItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={`${visible ? '' : 'hidden'}`}>
        <div className="mt-[25px] flex justify-between">
          <div>
            <h2 className="title-sm">Processing Procedures</h2>
            <p className="text-sm text-default-500">
              You can check and modify the current airport procedures. <br />
              Match processing procedures according to airport operations and needs using this input.
            </p>
          </div>
          <p className="flex gap-[10px]">
            {/* <Button
            className="btn-md btn-default"
            icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faEquals} />}
            text="Edit Procedures"
            onClick={() => {}}
          /> */}
            {/* <Button
            className="btn-md btn-primary"
            icon={<FontAwesomeIcon className="nav-icon" size="sm" icon={faEquals} />}
            text="Confirm"
            onClick={() => {}}
          /> */}
          </p>
        </div>
        {loadingProcessingProcedures ? (
          <div className="flex min-h-[200px] flex-1 items-center justify-center">
            <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
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
                  options={DataConnectionCriterias}
                  selectedOption={dataConnectionCriteria}
                  onSelectedOption={(val) => setDataConnectionCriteria(val)}
                  className="select-default"
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
                    {procedures.map((item, index) => (
                      <Draggable key={`${item.id}_${index}`} draggableId={item.id} index={index}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{ ...provided.draggableProps.style, marginTop: index > 0 ? 10 : 0 }}
                          >
                            <div key={item.id} className="processing-item bg-red-500 overflow-hidden">
                              <button className="item-move">
                                <FontAwesomeIcon size="sm" icon={faEquals} />
                              </button>
                              <p className="item-name">
                                <Input
                                  className={`${item.editable ? '' : 'hidden'} text-2xl`}
                                  type="text"
                                  value={item.nameText || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setProcedures(
                                      procedures.map((item, idx) =>
                                        index == idx ? { ...item, nameText: e.target.value } : item
                                      )
                                    )
                                  }
                                />
                                {item.editable ? null : (
                                  <span className="break-all leading-[1.1]">{item.nameText}</span>
                                )}
                                <button
                                  onClick={() => {
                                    setProcedures(
                                      procedures.map((item, idx) =>
                                        index == idx ? { ...item, editable: !item.editable } : item
                                      )
                                    );
                                  }}
                                >
                                  {item.editable ? (
                                    <FontAwesomeIcon className="nav-icon ml-[8px]" size="sm" icon={faCheck} />
                                  ) : (
                                    <Image width={30} height={30} src="/image/ico-write.svg" alt="modify" />
                                  )}
                                </button>
                              </p>
                              <dl className="ml-[40px] mr-[300px] flex-grow">
                                <dt className="tooltip-line">
                                  Enter the {item.name} desks <span className="text-accent-600">*</span>
                                  <button>
                                    <Tooltip text={'test'} />
                                  </button>
                                </dt>
                                <dd>
                                  <Input
                                    type="text"
                                    value={item.nodesText || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setProcedures(
                                        procedures.map((item, idx) =>
                                          index == idx ? { ...item, nodesText: e.target.value } : item
                                        )
                                      )
                                    }
                                  />
                                </dd>
                              </dl>
                              <button onClick={() => onBtnDelete(index)}>
                                <Image width={30} height={30} src="/image/ico-delete-line.svg" alt="" />
                              </button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </div>
            {procedures.length < 1 ? <div className="h-[30px]" /> : null}
            <p className={`add-item`}>
              <button onClick={() => onBtnAdd()}>
                <Image width={48} height={48} src="/image/ico-add-item.svg" alt="add item" />
              </button>
            </p>
            <p className="flex justify-end gap-[10px]">
              <Button className="btn-md btn-tertiary" text="Apply" onClick={() => onBtnApply()} />
            </p>
            <div className="mt-[30px] flex justify-between">
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
                disabled={!applied}
              >
                <span className="flex flex-grow items-center justify-center">Facility Connection</span>
                <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
              </button>
            </div>
          </>
        ) : loadError ? (
          <div className="mt-[25px] flex flex-col items-center justify-center rounded-md border border-default-200 bg-default-50 py-[75px] text-center">
            <Image width={16} height={16} src="/image/ico-error.svg" alt="" />
            <p className="title-sm" style={{ color: '#30374F' }}>
              Unable to load data
            </p>
          </div>
        ) : (
          <div className="h-[100px]" />
        )}
      </div>
    </DragDropContext>
  );
}
