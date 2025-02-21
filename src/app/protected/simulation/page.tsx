'use client';

import { getScenarioList } from '@/api/simulations';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ContentsHeader from '@/components/ContentsHeader';
import Input from '@/components/Input';
import Paging from '@/components/Paging';
import Search from '@/components/Search';
import RootLayoutDefault from '@/components/layoutDefault';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';

const SimulationPage: React.FC = () => {
  const initialVisibleDiv: 'tag' | 'full' = 'tag';
  const [visibleDiv] = useState<'tag' | 'full'>(initialVisibleDiv);
  const [selectAll, setSelectAll] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getScenarioList().then(({ data }) => {
      console.log(data);
    });
  }, []);
  const data = [
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects',
      imagePath: '/image/ico-link.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-link.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-folder-open.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-folder-open.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-link.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-link.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-folder-open.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-folder-open.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-link.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-link.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-folder-open.svg',
    },
    {
      name: 'ICN_T1_Scenario_Rev2',
      size: '200 KB',
      terminal: 'T1',
      editor: 'Danny Park',
      targetDate: 'Oct 31 2024',
      editDate: 'Oct 31 2024',
      editTime: '16:22',
      memo: 'This is a simulation that reflects the Check-In island renewal.',
      imagePath: '/image/ico-folder-open.svg',
    },
  ];

  const [anchorEls, setAnchorEls] = useState<(HTMLElement | null)[]>(Array(data.length).fill(null));
  const [selected, setSelected] = useState<boolean[]>(Array(data.length).fill(false));
  const [memos, setMemos] = useState(data.map((item) => item.memo));

  const handleCheckboxChange = (index: number) => {
    setSelected((prev) => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };
  const handleMemoChange = (index: number, newMemo: string) => {
    setMemos((prevMemos) => {
      const updatedMemos = [...prevMemos];
      updatedMemos[index] = newMemo;
      return updatedMemos;
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

  return (
    <RootLayoutDefault>
      <ContentsHeader text="Simulation" />
      <div className="mt-[30px] flex justify-between">
        <h2 className="title-sm">Scenario List</h2>
        <div className="flex items-center gap-[10px]">
          <Button
            className="btn-md btn-default"
            icon={<img src="/image/ico-filter.svg" alt="" />}
            text="More Fliters"
            onClick={() => {}}
          />
          <Button
            className="btn-md btn-primary"
            icon={<img src="/image/ico-plus.svg" alt="" />}
            text="New Scenario"
            onClick={() => {}}
          />
        </div>
      </div>
      <div className="mt-[20px] flex items-center justify-between gap-[10px]">
        <div className="tag-block flex flex-grow">
          {/* {visibleDiv === 'tag' && (
            <div className="pb-[7px] pt-[7px] flex flex-grow items-center gap-[10px] p-[10px]">
              <button className="tag-sm">
                ICN <img src="/image/ico-delect.svg" alt="" />
              </button>
              <button className="tag-sm">
                Terminal 1 <img src="/image/ico-delect.svg" alt="" />
              </button>
            </div>
          )} */}
          {visibleDiv === 'full' && (
            <div className="tag-full">
              <p className="text-sm text-deepRed">8 row(s) selected</p>
              <Button
                className="btn-delete"
                icon={<img src="/image/ico-delect-red.svg" alt="" />}
                text="Delete Selected"
                onClick={() => {}}
              />
            </div>
          )}
        </div>
        <Search />
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
                    setSelected(Array(data.length).fill(checked)); // 전체 선택/해제
                  }}
                  className="checkbox text-sm"
                />
              </th>
              <th className="w-[220px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Name
                  <img src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-center">
                <button className="ml-auto mr-auto inline-flex items-center gap-[2px]">
                  Terminal
                  <img src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Editor
                  <img src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[120px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Target Date
                  <img src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="w-[130px] text-left">
                <button className="inline-flex items-center gap-[2px]">
                  Edit Date
                  <img src="/image/ico-sort.svg" alt="" />
                </button>
              </th>
              <th className="!pl-[20px] text-left">Memo</th>
              <th className="w-[90px]"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className={`border-b text-sm ${selected[index] ? 'active' : ''}`} onClick={() => {
                router.push(`${pathname}/test`);
              }}>
                <td className="text-center">
                  <Checkbox
                    label=""
                    id={`check-${index}`}
                    checked={selected[index]}
                    onChange={() => handleCheckboxChange(index)}
                    className="checkbox text-sm"
                  />
                </td>
                <td className="">
                  <div className="flex items-center gap-[10px]">
                    <span>
                      <img src={item.imagePath} alt="" />
                    </span>
                    <span>
                      {item.name}
                      <br />
                      <span className="text-sm text-gray-500">{item.size}</span>
                    </span>
                  </div>
                </td>
                <td className="text-center">{item.terminal}</td>
                <td className="">{item.editor}</td>
                <td className="">{item.targetDate}</td>
                <td className="">
                  {item.editDate} <br /> <span className="font-normal text-default-500">{item.editTime}</span>
                </td>
                <td className="">
                  <Input
                    type="text"
                    placeholder=""
                    value={memos[index]}
                    className="!border-none bg-transparent !text-default-700"
                    onChange={(e) => handleMemoChange(index, e.target.value)}
                    // disabled={true}
                  />
                  {/* <input
                    type="text"
                    value={memos[index]}
                    onChange={(e) => handleMemoChange(index, e.target.value)}
                    className="mr-[30px] w-full rounded-md border-none bg-transparent px-[15px] py-[10px]"
                  /> */}
                </td>
                <td className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="btn-more mt-[5px]">
                        <img src="/image/ico-dot-menu.svg" alt="more" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="pr-[20px]">
                      <DropdownMenuItem>
                        <img src="/image/ico-run.svg" alt="" />
                        Run
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <img src="/image/ico-duplicate.svg" alt="" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <img src="/image/ico-rename.svg" alt="" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <img src="/image/ico-share.svg" alt="" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red">
                        <img src="/image/ico-trash-r.svg" alt="" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paging currentPage={1} totalPage={10} />
    </RootLayoutDefault>
  );
};

export default SimulationPage;
