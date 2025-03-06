'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { faArrowRight, faL } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { queryClient } from '@/api/query-client';
import { useScenarioList } from '@/api/simulations';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import Input from '@/components/Input';
import RootLayoutDefault from '@/components/LayoutDefault';
import Paging from '@/components/Paging';
import CreateScenario from '@/components/Popups/CreateScenario';
import Search from '@/components/Search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UIs/DropdownMenu';

interface IScenarioStates {
  name: string;
  note: string;
  selected: boolean;
  editMode: boolean;
}

const SimulationPage: React.FC = () => {
  const initialVisibleDiv: 'tag' | 'full' = 'tag';
  const [visibleDiv] = useState<'tag' | 'full'>(initialVisibleDiv);
  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [createPopupVisible, setCreatePopupVisible] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { scenarioList } = useScenarioList();

  useEffect(() => {
    if (scenarioList?.length > 0) {
      setSelected(Array(scenarioList.length).fill(false));
      setScenarioStates(
        scenarioList.map((item) => {
          return {
            name: item.simulation_name,
            note: item.note,
            selected: false,
            editMode: false,
          };
        })
      );
    }
  }, [scenarioList]);

  const [anchorEls, setAnchorEls] = useState<(HTMLElement | null)[]>(Array(10).fill(null));
  const [scenarioStates, setScenarioStates] = useState<IScenarioStates[]>([]);
  const [page, setPage] = useState(1);

  const handleRowChange = (index: number, newState: Partial<IScenarioStates>) => {
    setScenarioStates((prev) => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], ...newState };
      return newStates;
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const newAnchorEls = [...anchorEls];
    newAnchorEls[index] = event.currentTarget;
    setAnchorEls(newAnchorEls);
  };

  const handleClose = (index: number) => {
    const newAnchorEls = [...anchorEls];
    newAnchorEls[index] = null;
    setAnchorEls(newAnchorEls);
  };

  return scenarioList?.length > 0 && scenarioList?.length == scenarioStates?.length ? (
    <div>
      <ContentsHeader text="Simulation" />
      <div className="mt-[30px] flex justify-between">
        <h2 className="title-sm">Scenario List</h2>
        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<Image src="/image/ico-filter.svg" alt="" />}
            text="More Fliters"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            icon={<Image src="/image/ico-plus.svg" alt="" />}
            text="New Scenario"
            onClick={() => setCreatePopupVisible(true)}
          />
        </div>
      </div>
      <div className="mt-[20px] flex items-center justify-between gap-[10px]">
        <div className="tag-block flex flex-grow">
          {/* {visibleDiv === 'tag' && (
            <div className="pb-[7px] pt-[7px] flex flex-grow items-center gap-[10px] p-[10px]">
              <button className="tag-sm">
                ICN <Image src="/image/ico-delect.svg" alt="" />
              </button>
              <button className="tag-sm">
                Terminal 1 <Image src="/image/ico-delect.svg" alt="" />
              </button>
            </div>
          )} */}
          {visibleDiv === 'full' && (
            <div className="tag-full">
              <p className="text-sm text-deepRed">8 row(s) selected</p>
              <Button
                className="btn-delete"
                icon={<Image src="/image/ico-delect-red.svg" alt="" />}
                text="Delete Selected"
                onClick={() => {}}
              />
            </div>
          )}
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
                  <Image src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-center">
                <button className="ml-auto mr-auto inline-flex items-center gap-[2px]">
                  Terminal
                  <Image src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Editor
                  <Image src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Target Date
                  <Image src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[130px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Edit Date
                  <Image src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="!pl-[20px] text-left">Note</th>
              <th className="w-[90px]"></th>
            </tr>
          </thead>
          <tbody>
            {scenarioList?.map((item, index) =>
              searchKeyword?.length > 0 && item.simulation_name.indexOf(searchKeyword) < 0 ? null : (
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
                  <td className="">
                    <div className="flex items-center gap-[10px]">
                      {/* <span>
                      <Image src={item.imagePath} alt="" />
                    </span> */}
                      {scenarioStates[index].editMode ? (
                        <Input
                          type="text"
                          placeholder=""
                          value={scenarioStates[index]?.name}
                          className="!border-none bg-transparent !text-default-700"
                          onChange={(e) => handleRowChange(index, { name: e.target.value })}
                          // disabled={true}
                        />
                      ) : (
                        <span
                          onClick={() => {
                            router.push(`${pathname}/${item.id}`);
                          }}
                        >
                          {item.simulation_name}
                          <br />
                          <span className="text-sm text-gray-500">{item.size}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">{item.terminal}</td>
                  <td className="">{item.editor}</td>
                  <td className="">
                    {item?.simulation_date ? moment(item?.simulation_date).format('MM DD YYYY') : null}
                  </td>
                  <td className="">
                    {moment(item?.updated_at).format('MM DD YYYY')} <br />{' '}
                    <span className="font-normal text-default-500">
                      {moment(item?.updated_at).format('hh:mm')}
                    </span>
                  </td>
                  <td className="">
                    {scenarioStates[index].editMode ? (
                      <Input
                        type="text"
                        placeholder=""
                        value={scenarioStates[index]?.note}
                        className="!border-none bg-transparent !text-default-700"
                        onChange={(e) => handleRowChange(index, { note: e.target.value })}
                        // disabled={true}
                      />
                    ) : (
                      <span>{item.note}</span>
                    )}
                  </td>
                  <td className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="btn-more mt-[5px]">
                          <Image src="/image/ico-dot-menu.svg" alt="more" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="pr-[20px]">
                        <DropdownMenuItem>
                          <Image src="/image/ico-run.svg" alt="" />
                          Run
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Image src="/image/ico-duplicate.svg" alt="" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRowChange(index, { editMode: true })}>
                          <Image src="/image/ico-rename.svg" alt="" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Image src="/image/ico-share.svg" alt="" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red">
                          <Image src="/image/ico-trash-r.svg" alt="" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <Paging currentPage={page} totalPage={30} onChangePage={(page) => setPage(page)} />
      <CreateScenario
        open={createPopupVisible}
        onClose={() => setCreatePopupVisible(false)}
        onCreate={(simulationId: string) => {
          queryClient.invalidateQueries(['ScenarioList']);
        }}
      />
    </div>
  ) : null;
};

export default SimulationPage;
