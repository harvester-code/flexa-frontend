'use client';

import React, { RefObject, createRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { OrbitProgress } from 'react-loading-indicators';
import {
  deleteScenario,
  deleteScenarioMulti,
  duplicateScenario,
  modifyScenario,
  setMasterScenario,
} from '@/services/simulations';
import { useScenarios } from '@/queries/simulationQueries';
import { useUser } from '@/queries/userQueries';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import Paging from '@/components/Paging';
import Search from '@/components/Search';
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

const SimulationPage: React.FC = () => {
  const queryClient = useQueryClient();

  const pathname = usePathname();
  const router = useRouter();

  const initialVisibleDiv: 'tag' | 'full' = 'tag';
  const [visibleDiv] = useState<'tag' | 'full'>(initialVisibleDiv);

  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const { data: userInfo } = useUser();
  const { data: scenarioList } = useScenarios(userInfo?.groupId);

  useEffect(() => {
    if (scenarioList?.length > 0) {
      setSelected(Array(scenarioList?.length).fill(false));
      setScenarioStates(
        scenarioList.map((item) => {
          return {
            name: item.simulation_name,
            memo: item.memo,
            editName: false,
            editMemo: false,
            refName: createRef(),
            refMemo: createRef(),
          };
        })
      );
    }
  }, [scenarioList]);

  const [anchorEls, setAnchorEls] = useState<(HTMLElement | null)[]>(Array(10).fill(null));
  const [scenarioStates, setScenarioStates] = useState<IScenarioStates[]>([]);
  const [page, setPage] = useState(1);

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
    const item = scenarioList[index];
    handleRowChange(index, { editName: false });
    modifyScenario({
      id: item.id,
      simulation_name: scenarioStates[index]?.name,
      memo: scenarioStates[index]?.memo,
    }).catch(() => {
      handleRowChange(index, { name: scenarioList[index].simulation_name });
      PopupAlert.confirm('Failed to change the name');
    });
  };

  const oneditMemo = (index: number) => {
    const item = scenarioStates[index];
    handleRowChange(index, { editMemo: true });
    setTimeout(() => {
      (item.refMemo as RefObject<HTMLInputElement>)?.current.focus();
    }, 400);
  };

  const oneditMemoEnd = (index: number) => {
    const item = scenarioList[index];
    handleRowChange(index, { editMemo: false });
    modifyScenario({
      id: item.id,
      simulation_name: scenarioStates[index]?.name,
      memo: scenarioStates[index]?.memo,
    }).catch(() => {
      handleRowChange(index, { memo: scenarioList[index].memo });
      PopupAlert.confirm('Failed to change the memo');
    });
  };

  const onSetMaster = (index: number) => {
    const item = scenarioList[index];
    setMasterScenario({
      group_id: String(userInfo?.groupId),
      scenario_id: item.id,
    }).then((response) => {
      queryClient.invalidateQueries({ queryKey: ['ScenarioList'] });
    });
  };

  const onDuplicate = (index: number) => {
    const item = scenarioList[index];
    duplicateScenario({
      scenario_id: item.id,
      editor: userInfo?.fullName || '',
    }).then((response) => {
      queryClient.invalidateQueries({ queryKey: ['ScenarioList'] });
    });
  };

  const onDelete = (index: number) => {
    const item = scenarioList[index];
    PopupAlert.delete(
      'Are you sure you want to delete that list?\nThe deleted list can be checked in Trash Bin.',
      'Delete',
      () => {
        deleteScenario({ scenario_id: item.id }).then(() => {
          PopupAlert.confirm('Successfully Deleted.', 'Confirm', undefined, 'Deletion Complete');
          queryClient.invalidateQueries({ queryKey: ['ScenarioList'] });
        });
      },
      `Are you sure you want to delete ${item.simulation_name}?`
    );
  };

  const onDeleteMulti = () => {
    const selIds: string[] = [];
    for (let i = 0; i < selected.length; i++) if (selected[i]) selIds.push(scenarioList[i].id);
    PopupAlert.delete(
      'Are you sure you want to delete that list?\nThe deleted list can be checked in Trash Bin.',
      'Delete',
      () => {
        deleteScenarioMulti({ scenario_ids: selIds }).then(() => {
          PopupAlert.confirm('Successfully Deleted.', 'Confirm', undefined, 'Deletion Complete');
          queryClient.invalidateQueries({ queryKey: ['ScenarioList'] });
        });
      },
      `Are you sure you want to delete ${selIds.length} rows?`
    );
  };

  return (
    <div className="mx-auto max-w-[1340px] px-[30px] pb-24">
      <ContentsHeader text="Simulation" />
      <div className="mt-[30px] flex justify-between">
        <h2 className="title-sm">Scenario List</h2>
        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<Image width={20} height={20} src="/image/ico-filter.svg" alt="" />}
            text="More Fliters"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            icon={<Image width={20} height={20} src="/image/ico-plus.svg" alt="" />}
            text="New Scenario"
            onClick={() => {
              PushCreateScenarioPopup({
                onCreate: (simulationId: string) => {
                  queryClient.invalidateQueries({ queryKey: ['ScenarioList'] });
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
                    setSelected(Array(scenarioList.length).fill(checked)); // 전체 선택/해제
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
              <th className="w-[130px] text-left">
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
            {scenarioList?.length > 0 && scenarioList?.length == scenarioStates?.length ? (
              scenarioList?.map((item, index) =>
                searchKeyword?.length > 0 && item.simulation_name.indexOf(searchKeyword) < 0 ? null : (
                  <tr key={index} className={`border-b text-sm ${selected[index] ? 'active' : ''}`}>
                    <td className="text-center">
                      <Checkbox
                        label=""
                        id={`check-${index}`}
                        checked={selected[index]}
                        onChange={() =>
                          setSelected([
                            ...selected.map((_, i) => (i == index ? !selected[index] : selected[i])),
                          ])
                        }
                        className="checkbox text-sm"
                      />
                    </td>
                    <td className="">
                      <div className="flex items-center gap-[10px]">
                        {/* <span>
                      <Image width={16} height={16} src={item.imagePath} alt="" />
                    </span> */}
                        <div
                          onClick={() => {
                            if (!scenarioStates[index].editName) router.push(`${pathname}/${item.id}`);
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
                    <td className="">{item.editor}</td>
                    <td className="">
                      {item?.simulation_date ? dayjs(item?.simulation_date).format('MM DD YYYY') : null}
                    </td>
                    <td className="">
                      {dayjs(item?.updated_at).format('MM DD YYYY')} <br />{' '}
                      <span className="font-normal text-default-500">
                        {dayjs(item?.updated_at).format('hh:mm')}
                      </span>
                    </td>
                    <td className="">
                      <input
                        ref={scenarioStates[index].refMemo}
                        type="text"
                        placeholder=""
                        value={scenarioStates[index]?.memo}
                        className="!border-none bg-transparent py-[8px] !text-default-700"
                        onChange={(e) => handleRowChange(index, { memo: e.target.value })}
                        disabled={scenarioStates[index].editMemo ? false : true}
                        onBlur={() => oneditMemoEnd(index)}
                        onKeyDown={(e) => {
                          if (e.key == 'Enter') oneditMemoEnd(index);
                        }}
                      />
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="btn-more mt-[5px]">
                            <Image width={16} height={16} src="/image/ico-dot-menu.svg" alt="more" />
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
                          <DropdownMenuItem onClick={() => oneditMemo(index)}>
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
                            <Image width={16} height={16} src="/image/ico-trash-r.svg" alt="" />
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
      <Paging currentPage={page} totalPage={30} onChangePage={(page) => setPage(page)} />
    </div>
  );
};

export default SimulationPage;
