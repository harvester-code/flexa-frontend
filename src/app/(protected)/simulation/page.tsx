'use client';

import React, { RefObject, createRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { EllipsisVertical, ListFilterIcon, Trash2 } from 'lucide-react';
import { OrbitProgress } from 'react-loading-indicators';
import { deleteScenario, duplicateScenario, modifyScenario, setMasterScenario } from '@/services/simulations';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Paging from '@/components/Paging';
import Search from '@/components/Search';
import TheContentHeader from '@/components/TheContentHeader';
import { PushCreateScenarioPopup } from '@/components/popups/CreateScenario';
import { PopupAlert } from '@/components/popups/PopupAlert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface IScenarioStates {
  name: string;
  memo: string;
  editName: boolean;
  editMemo: boolean;
  refName: React.Ref<HTMLInputElement>;
  refMemo: React.Ref<HTMLInputElement>;
}

const PAGE_ROW_COUNT = 11;

const SimulationPage: React.FC = () => {
  const queryClient = useQueryClient();

  const pathname = usePathname();
  const router = useRouter();

  const initialVisibleDiv: 'tag' | 'full' = 'tag';
  const [visibleDiv] = useState<'tag' | 'full'>(initialVisibleDiv);

  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [anchorEls, setAnchorEls] = useState<(HTMLElement | null)[]>(Array(10).fill(null));
  const [scenarioStates, setScenarioStates] = useState<IScenarioStates[]>([]);
  const [page, setPage] = useState(1);

  const { data: userInfo } = useUser();
  const { scenarios, totalCount } = useScenarios(userInfo?.groupId, page);

  useEffect(() => {
    if (scenarios?.length > 0) {
      setSelected(Array(scenarios?.length).fill(false));
      setScenarioStates(
        scenarios.map((item) => {
          return {
            name: item.name,
            // name: item.simulation_name,
            memo: item.memo,
            editName: false,
            editMemo: false,
            refName: createRef(),
            refMemo: createRef(),
          };
        })
      );
    }
  }, [scenarios]);

  let selRowCount = 0;

  for (const rowCur of selected) if (rowCur) selRowCount++;

  const handleRowChange = (index: number, newState: Partial<IScenarioStates>) => {
    setScenarioStates((prev) => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], ...newState };
      return newStates;
    });
  };

  const onRename = (index: number) => {
    const item = scenarioStates[index];
    handleRowChange(index, { editName: true });
    // TODO : 드롭다운이 닫힐때 포커스가 DropdownMenuTrigger 으로 이동하는 증상 때문에 바로 input 에 포커스 주기 불가능. 딜레이 적용.
    setTimeout(() => {
      (item.refName as RefObject<HTMLInputElement>)?.current?.focus();
    }, 400);
  };

  const onRenameEnd = (index: number) => {
    const item = scenarios[index];
    handleRowChange(index, { editName: false });
    modifyScenario(
      {
        simulation_name: scenarioStates[index]?.name,
        memo: scenarioStates[index]?.memo,
      },
      item.id
    ).catch(() => {
      handleRowChange(index, { name: scenarios[index].name });
      PopupAlert.confirm('Failed to change the name');
    });
  };

  const onEditMemo = (index: number) => {
    const item = scenarioStates[index];
    handleRowChange(index, { editMemo: true });
    setTimeout(() => {
      (item.refMemo as RefObject<HTMLInputElement>)?.current.focus();
    }, 400);
  };

  const onEditMemoEnd = (index: number) => {
    const item = scenarios[index];
    handleRowChange(index, { editMemo: false });
    modifyScenario(
      {
        simulation_name: scenarioStates[index]?.name,
        memo: scenarioStates[index]?.memo,
      },
      item.id
    ).catch(() => {
      handleRowChange(index, { memo: scenarios[index].memo });
      PopupAlert.confirm('Failed to change the memo');
    });
  };

  const onSetMaster = (index: number) => {
    const item = scenarios[index];
    setMasterScenario(String(userInfo?.groupId), item.id).then((response) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    });
  };

  const onDuplicate = (index: number) => {
    const item = scenarios[index];
    duplicateScenario(
      {
        editor: userInfo?.fullName || '',
      },
      item.id
    ).then((response) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    });
  };

  const onDelete = (index: number) => {
    const item = scenarios[index];
    PopupAlert.delete(
      'Are you sure you want to delete that list?\nThe deleted list can be checked in Trash Bin.',
      'Delete',
      () => {
        deleteScenario([item.id]).then(() => {
          PopupAlert.confirm('Successfully Deleted.', 'Confirm', undefined, 'Deletion Complete');
          queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        });
      },
      `Are you sure you want to delete ${item.name}?`
    );
  };

  const onDeleteMulti = () => {
    const selIds: string[] = [];
    for (let i = 0; i < selected.length; i++) if (selected[i]) selIds.push(scenarios[i].id);
    PopupAlert.delete(
      'Are you sure you want to delete that list?\nThe deleted list can be checked in Trash Bin.',
      'Delete',
      () => {
        deleteScenario(selIds).then(() => {
          PopupAlert.confirm('Successfully Deleted.', 'Confirm', undefined, 'Deletion Complete');
          queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        });
      },
      `Are you sure you want to delete ${selIds.length} rows?`
    );
  };

  return (
    <div className="mx-auto max-w-[1340px] px-[30px] pb-24">
      <TheContentHeader text="Simulation" />
      <div className="mt-[30px] flex justify-between">
        <h2 className="title-sm">Scenario List</h2>
        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<ListFilterIcon className="size-5" />}
            text="More Fliters"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            icon={<Image width={20} height={20} src="/image/ico-plus.svg" alt="" />}
            text="New Scenario"
            onClick={() => {
              PushCreateScenarioPopup({
                onCreate: (scenarioId: string) => {
                  queryClient.invalidateQueries({ queryKey: ['scenarios'] });
                },
              });
            }}
          />
        </div>
      </div>
      <div className="mt-[20px] flex items-center justify-between gap-[10px]">
        <div className="tag-block flex flex-grow">
          {/* {visibleDiv === 'tag' && (
            <div className="pb-[7px] pt-[7px] flex flex-grow items-center gap-[10px] p-[10px]">
              <button className="tag-sm">
                ICN <Image width={16} height={16} src="/image/ico-delect.svg" alt="" />
              </button>
              <button className="tag-sm">
                Terminal 1 <Image width={16} height={16} src="/image/ico-delect.svg" alt="" />
              </button>
            </div>
          )} */}

          {selRowCount > 0 ? (
            <div className="tag-full">
              <p className="text-sm text-deepRed">{selRowCount} row(s) selected</p>
              <Button
                className="btn-delete"
                icon={<Image width={20} height={20} src="/image/ico-delect-red.svg" alt="" />}
                text="Delete Selected"
                onClick={() => onDeleteMulti()}
              />
            </div>
          ) : null}
        </div>
        <Search value={searchKeyword} onChangeText={(text) => setSearchKeyword(text)} />
      </div>
      <div className="table-container mt-[20px]">
        <table className="table-default">
          <thead>
            <tr className="border-b">
              <th className="w-[40px] text-center">
                <Checkbox
                  id="selectAll"
                  label=""
                  checked={selectAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectAll(checked);
                    setSelected(Array(scenarios.length).fill(checked)); // 전체 선택/해제
                  }}
                  className="checkbox text-sm"
                />
              </th>
              <th className="w-[220px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Name
                  <Image width={16} height={16} src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-center">
                <button className="ml-auto mr-auto inline-flex items-center gap-[2px]">
                  Terminal
                  <Image width={16} height={16} src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Editor
                  <Image width={16} height={16} src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Target Date
                  <Image width={16} height={16} src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[150px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Edit Date
                  <Image width={16} height={16} src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="!pl-[20px] text-left">Memo</th>
              <th className="w-[90px]"></th>
            </tr>
          </thead>
          <tbody>
            {scenarios?.length > 0 && scenarios?.length == scenarioStates?.length ? (
              scenarios?.map((item, index) =>
                searchKeyword?.length > 0 && item.name.indexOf(searchKeyword) < 0 ? null : (
                  <tr key={index} className={`border-b text-sm ${selected[index] ? 'active' : ''}`}>
                    <td className="text-center">
                      <Checkbox
                        label=""
                        id={`check-${index}`}
                        checked={selected[index]}
                        onChange={() =>
                          setSelected([...selected.map((_, i) => (i == index ? !selected[index] : selected[i]))])
                        }
                        className="checkbox text-sm"
                      />
                    </td>

                    <td>
                      <div className="flex items-center gap-[10px]">
                        <div
                          className={`cursor-pointer`}
                          onClick={() => {
                            if (!scenarioStates[index].editName) {
                              router.push(`${pathname}/${item.id}`);
                            }
                          }}
                        >
                          <input
                            ref={scenarioStates[index].refName}
                            type="text"
                            placeholder=""
                            value={scenarioStates[index]?.name}
                            className="!border-none bg-transparent py-[8px] !text-default-700"
                            onChange={(e) => handleRowChange(index, { name: e.target.value })}
                            disabled={scenarioStates[index].editName ? false : true}
                            style={{ pointerEvents: scenarioStates[index].editName ? 'auto' : 'none' }}
                            onBlur={() => onRenameEnd(index)}
                            onKeyDown={(e) => {
                              if (e.key == 'Enter') onRenameEnd(index);
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-center">{item.terminal}</td>
                    <td>{item.editor}</td>
                    <td>
                      {item?.target_flight_schedule_date
                        ? dayjs(item?.target_flight_schedule_date).format('MMM-DD-YYYY')
                        : null}
                    </td>
                    <td>{dayjs(item?.updated_at).format('MMM-DD-YYYY hh:mm')}</td>
                    <td>
                      <input
                        ref={scenarioStates[index].refMemo}
                        type="text"
                        placeholder=""
                        value={scenarioStates[index]?.memo}
                        className="!border-none bg-transparent py-[8px] !text-default-700"
                        onChange={(e) => handleRowChange(index, { memo: e.target.value })}
                        disabled={scenarioStates[index].editMemo ? false : true}
                        onBlur={() => onEditMemoEnd(index)}
                        onKeyDown={(e) => {
                          if (e.key == 'Enter') onEditMemoEnd(index);
                        }}
                      />
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="btn-more mt-[5px]">
                            <EllipsisVertical className="!size-4" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="pr-[20px]">
                          <DropdownMenuItem>
                            <Image width={16} height={16} src="/image/ico-run.svg" alt="" />
                            Run
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDuplicate(index)}>
                            <Image width={16} height={16} src="/image/ico-duplicate.svg" alt="" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRename(index)}>
                            <Image width={16} height={16} src="/image/ico-rename.svg" alt="" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditMemo(index)}>
                            <Image width={16} height={16} src="/image/ico-rename.svg" alt="" />
                            Edit Memo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSetMaster(index)}>
                            <Image width={16} height={16} src="/image/ico-rename.svg" alt="" />
                            Set Master
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Image width={16} height={16} src="/image/ico-share.svg" alt="" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red" onClick={() => onDelete(index)}>
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-1 flex-col items-center justify-center">
                    <OrbitProgress color="#32cd32" size="medium" text="" textColor="" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Paging
        currentPage={page}
        totalPage={Math.ceil(totalCount / PAGE_ROW_COUNT)}
        onChangePage={(page) => setPage(page)}
      />
    </div>
  );
};

export default SimulationPage;
