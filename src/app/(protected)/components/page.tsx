'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import type { Config, Data, Layout } from 'plotly.js';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Save } from 'lucide-react';
import dynamic from 'next/dynamic';
import TheHistogramChart from '@/components/charts/TheHistogramChart';
import { formatUnit } from '@/app/(protected)/home/_components/HomeFormat';
import TheContentHeader from '@/components/TheContentHeader';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Checkbox } from '@/components/ui/Checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';

const breadcrumb = [{ text: 'Components', number: 1 }];

const chartTimeLabels = ['06:00', '09:00', '12:00', '15:00', '18:00'];

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const SankeyChart = dynamic(() => import('@/components/charts/SankeyChart'), { ssr: false });

const barChartShowcaseData = [
  {
    x: chartTimeLabels,
    y: [140, 210, 180, 240, 310],
    type: 'bar',
    marker: { color: '#7c3aed' },
    name: 'Queue Pax',
  },
] satisfies Data[];

const barChartShowcaseLayout: Partial<Layout> = {
  height: 320,
  margin: { t: 40, l: 50, r: 20, b: 50 },
  title: { text: 'Hourly Queue Pax' },
  xaxis: { title: { text: 'Time' }, type: 'category' },
  yaxis: { title: { text: 'Passengers' } },
};

const lineChartShowcaseData = [
  {
    x: chartTimeLabels,
    y: [4.2, 6.1, 5.3, 3.7, 3.0],
    type: 'scatter',
    mode: 'lines+markers',
    marker: { size: 8, color: '#6b46c1' },
    line: { color: '#6b46c1', width: 3 },
    name: 'Wait Time (min)',
  },
] satisfies Data[];

const lineChartShowcaseLayout: Partial<Layout> = {
  height: 320,
  margin: { t: 40, l: 50, r: 20, b: 50 },
  title: { text: 'Average Wait Time' },
  xaxis: { title: { text: 'Time' }, type: 'category' },
  yaxis: { title: { text: 'Minutes' } },
};

const sankeyChartShowcaseData = [
  {
    type: 'sankey',
    orientation: 'h',
    node: {
      pad: 16,
      thickness: 20,
      label: ['Arrival', 'Check-in', 'Security', 'Immigration', 'Gate'],
      color: ['#ede9fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed'],
    },
    link: {
      source: [0, 1, 1, 2, 3],
      target: [1, 2, 3, 3, 4],
      value: [600, 520, 80, 500, 480],
      color: [
        'rgba(124,58,237,0.35)',
        'rgba(139,92,246,0.35)',
        'rgba(139,92,246,0.2)',
        'rgba(167,139,250,0.35)',
        'rgba(167,139,250,0.3)',
      ],
    },
  },
] satisfies Data[];

const sankeyChartShowcaseLayout: Partial<Layout> = {
  height: 360,
  margin: { t: 40, l: 30, r: 30, b: 40 },
  title: { text: 'Passenger Flow Journey' },
};

const buildHistogramDatum = (title: string, percent: number) => ({
  title,
  value: (
    <>
      {percent}
      {formatUnit('%', 'histogram')}
    </>
  ),
  width: percent,
});

const histogramShowcaseData = [
  buildHistogramDatum('0~5 min', 35),
  buildHistogramDatum('5~10 min', 28),
  buildHistogramDatum('10~15 min', 18),
  buildHistogramDatum('15~20 min', 12),
  buildHistogramDatum('20 min~', 7),
];

const baseChartConfig: Partial<Config> = { displayModeBar: false, responsive: true };

export default function ComponentsPage() {
  // DatePicker for showcase
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Combobox for showcase - each instance has its own state
  const [selectedFramework, setSelectedFramework] = useState('');
  const [openFramework, setOpenFramework] = useState(false);

  const [selectedLanguageMain, setSelectedLanguageMain] = useState('');
  const [openLanguageMain, setOpenLanguageMain] = useState(false);

  const [selectedCountryBrand, setSelectedCountryBrand] = useState('');
  const [openCountryBrand, setOpenCountryBrand] = useState(false);

  const [selectedCitySize, setSelectedCitySize] = useState('');
  const [openCitySize, setOpenCitySize] = useState(false);

  // Checkbox states for showcase
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedDisabled, setIsCheckedDisabled] = useState(true);

  const frameworks = [
    { value: 'next.js', label: 'Next.js' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'ko', label: '한국어' },
    { value: 'ja', label: '日本語' },
  ];

  const countries = [
    { value: 'kr', label: '🇰🇷 South Korea' },
    { value: 'us', label: '🇺🇸 United States' },
    { value: 'jp', label: '🇯🇵 Japan' },
  ];

  const cities = [
    { value: 'seoul', label: 'Seoul' },
    { value: 'tokyo', label: 'Tokyo' },
    { value: 'newyork', label: 'New York' },
  ];

  // DatePicker component for showcase
  const DatePicker = () => (
    <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? dayjs(selectedDate).format('MMM DD, YYYY') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              setSelectedDate(date);
              setOpenDatePicker(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  // Combobox components for showcase
  const FrameworkCombobox = () => (
    <Popover open={openFramework} onOpenChange={setOpenFramework}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openFramework}
          className="w-full justify-between font-normal"
        >
          {selectedFramework
            ? frameworks.find((framework) => framework.value === selectedFramework)?.label
            : 'Select framework...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setSelectedFramework(currentValue === selectedFramework ? '' : currentValue);
                    setOpenFramework(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selectedFramework === framework.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const LanguageCombobox = () => (
    <Popover open={openLanguageMain} onOpenChange={setOpenLanguageMain}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openLanguageMain}
          className="w-full justify-between font-normal"
        >
          {selectedLanguageMain
            ? languages.find((lang) => lang.value === selectedLanguageMain)?.label
            : 'Select language...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((lang) => (
                <CommandItem
                  key={lang.value}
                  value={lang.value}
                  onSelect={(currentValue) => {
                    setSelectedLanguageMain(currentValue === selectedLanguageMain ? '' : currentValue);
                    setOpenLanguageMain(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selectedLanguageMain === lang.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {lang.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const BrandCombobox = () => (
    <Popover open={openCountryBrand} onOpenChange={setOpenCountryBrand}>
      <PopoverTrigger asChild>
        <Button
          variant="brand"
          role="combobox"
          aria-expanded={openCountryBrand}
          className="w-full justify-between font-normal"
        >
          {selectedCountryBrand
            ? countries.find((country) => country.value === selectedCountryBrand)?.label
            : 'Select country...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={(currentValue) => {
                    setSelectedCountryBrand(currentValue === selectedCountryBrand ? '' : currentValue);
                    setOpenCountryBrand(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selectedCountryBrand === country.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const SmallCombobox = () => (
    <Popover open={openCitySize} onOpenChange={setOpenCitySize}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={openCitySize}
          className="max-w-xs justify-between font-normal"
        >
          {selectedCitySize ? cities.find((city) => city.value === selectedCitySize)?.label : 'Select city...'}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search city..." />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.value}
                  onSelect={(currentValue) => {
                    setSelectedCitySize(currentValue === selectedCitySize ? '' : currentValue);
                    setOpenCitySize(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selectedCitySize === city.value ? 'opacity-100' : 'opacity-0')}
                  />
                  {city.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <TheContentHeader text={breadcrumb[0]?.text || 'Components'} />

      <div className="mx-auto max-w-page px-page-x pb-page-b">
        <div className="mt-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-lg font-semibold">UI Components Library</h1>
          <p className="text-muted-foreground">개발할 때 참고할 수 있는 모든 UI 컴포넌트들을 한 곳에서 확인하세요</p>
        </div>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="checkboxes">Checkbox</TabsTrigger>
            <TabsTrigger value="selectors">Selectors</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          {/* Button Components Tab */}
          <TabsContent value="buttons" className="mt-8 space-y-12">
            <div>
              <h2 className="mb-8 text-lg font-semibold">Button Components</h2>

              {/* Button Variants */}
              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium">Button Variants</h3>
                <div className="space-y-6">
                  {/* Normal State */}
                  <div>
                    <h4 className="mb-3 text-xs font-normal text-default-500">Normal State</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="brand">Brand</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>

                  {/* Disabled State */}
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-default-500">Disabled State</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary" disabled>
                        Primary
                      </Button>
                      <Button variant="secondary" disabled>
                        Secondary
                      </Button>
                      <Button variant="destructive" disabled>
                        Destructive
                      </Button>
                      <Button variant="brand" disabled>
                        Brand
                      </Button>
                      <Button variant="outline" disabled>
                        Outline
                      </Button>
                      <Button variant="ghost" disabled>
                        Ghost
                      </Button>
                      <Button variant="link" disabled>
                        Link
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="mb-4 text-lg font-medium">Button Sizes</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-xs font-normal text-default-500">sm:</span>
                    <Button variant="primary" size="sm">
                      Small Button
                    </Button>
                    <Button variant="primary" size="sm" disabled>
                      Disabled
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-xs font-normal text-default-500">default:</span>
                    <Button variant="primary" size="default">
                      Default Button
                    </Button>
                    <Button variant="primary" size="default" disabled>
                      Disabled
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-xs font-normal text-default-500">icon:</span>
                    <Button variant="primary" size="icon">
                      <Save size={16} />
                    </Button>
                    <Button variant="primary" size="icon" disabled>
                      <Save size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Input Components Tab */}
          <TabsContent value="inputs" className="mt-8 space-y-12">
            <div>
              <h2 className="mb-8 text-lg font-semibold">Input Components</h2>

              {/* Input States */}
              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium">Input States</h3>
                <div>
                  <h4 className="mb-3 text-xs font-normal text-default-500">Normal State</h4>
                  <div className="flex flex-wrap gap-3">
                    <Input placeholder="Normal" className="max-w-xs" />
                    <Input placeholder="Disabled" disabled className="max-w-xs" />
                    <Input value="Read-only" readOnly className="max-w-xs" />
                  </div>
                </div>
              </div>

              {/* Input Sizes */}
              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium">Input Sizes</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs font-normal text-default-500">sm:</span>
                    <Input placeholder="Small" className="h-8 max-w-xs px-2 text-xs" />
                    <Input placeholder="Disabled" disabled className="h-8 max-w-xs px-2 text-xs" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs font-normal text-default-500">default:</span>
                    <Input placeholder="Default" className="h-9 max-w-xs px-3 text-sm" />
                    <Input placeholder="Disabled" disabled className="h-9 max-w-xs px-3 text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs font-normal text-default-500">lg:</span>
                    <Input placeholder="Large" className="h-10 max-w-xs px-4 text-lg" />
                    <Input placeholder="Disabled" disabled className="h-10 max-w-xs px-4 text-lg" />
                  </div>
                </div>
              </div>

              {/* Input Types */}
              <div>
                <h3 className="mb-4 text-lg font-medium">Input Types</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <Input type="text" placeholder="Enter text..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" placeholder="Enter password..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="Enter email..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Number</Label>
                    <Input type="number" placeholder="Enter number..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Date (Calendar)</Label>
                    <DatePicker />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Form Components Tab */}
          <TabsContent value="forms" className="mt-8 space-y-12">
            <div>
              <h2 className="mb-8 text-lg font-semibold">Form Components</h2>

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h3 className="text-base font-medium">Basic Form Layout</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Compose inputs, helper text, and actions for use in settings panels or modal flows.
                  </p>
                  <form className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="form-full-name">Full name</Label>
                      <Input id="form-full-name" placeholder="홍길동" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="form-email">Email</Label>
                      <Input id="form-email" type="email" placeholder="user@flexa.ai" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="form-date">Simulation date</Label>
                      <Input id="form-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="form-notes">Memo</Label>
                      <Input id="form-notes" placeholder="e.g. VIP passenger handling" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Button type="button" variant="outline" size="sm">
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Save changes
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h3 className="text-base font-medium">Field States</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Apply consistent styling for helper copy, validation, and disabled states.
                  </p>
                  <div className="mt-6 space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="form-helper">With helper</Label>
                      <Input id="form-helper" placeholder="ex. MNL · T3" />
                      <p className="text-xs text-muted-foreground">Explain expected formatting or constraints.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="form-error" className="text-destructive">
                        Validation error
                      </Label>
                      <Input
                        id="form-error"
                        placeholder="Required value"
                        className="border-destructive focus-visible:!border-destructive"
                      />
                      <p className="text-xs text-destructive">Please fill out this field.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="form-disabled" className="text-muted-foreground">
                        Disabled
                      </Label>
                      <Input id="form-disabled" placeholder="Read only" disabled />
                      <p className="text-xs text-muted-foreground">Use for values fixed by simulation rules.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Checkbox Components Tab */}
          <TabsContent value="checkboxes" className="mt-8 space-y-12">
            <div>
              <h2 className="mb-2 text-lg font-semibold">Checkbox Components</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                토글 가능한 옵션을 정의할 때 사용하는 기본 체크박스로, 선택 완료 시 브랜드 기본색과 체크 아이콘으로 상태를 표현합니다.
              </p>

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h3 className="text-base font-medium">State Showcase</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Common states with their visual cues. Hover state uses the same border token as default.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox id="checkbox-state-default" />
                        <Label htmlFor="checkbox-state-default">Default</Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Border: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">border-primary</code>
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox id="checkbox-state-checked" defaultChecked />
                        <Label htmlFor="checkbox-state-checked">Checked</Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Fill: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">bg-primary</code>
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Checkbox id="checkbox-state-disabled" disabled />
                        <Label htmlFor="checkbox-state-disabled" className="text-muted-foreground">
                          Disabled
                        </Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Colors: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">disabled:* tokens</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h3 className="text-base font-medium">Design Tokens</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    핵심 색상과 상호작용 토큰을 정리해 두어 컴포넌트 구현 시 참고할 수 있습니다.
                  </p>
                  <div className="mt-6 space-y-4 text-sm">
                    <div className="rounded-md border border-muted-foreground/30 p-4">
                      <p className="font-medium">Color System</p>
                      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <li>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">bg-primary</code> — checked background
                        </li>
                        <li>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">text-primary-foreground</code> — check icon color
                        </li>
                        <li>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">border-primary</code> — default & hover outline
                        </li>
                        <li>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">focus-visible:ring-ring</code> — focus halo
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-md border border-muted-foreground/30 p-4">
                      <p className="font-medium">Sizing & Icon</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        기본 크기는 <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">h-4 w-4</code>, 아이콘은 lucide-react의
                        <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[11px]">Check</code>를 사용합니다.
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        크기 변경 시 <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">className</code>으로 높이·너비를 재정의하세요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="text-base font-medium">Usage Example</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  그룹 옵션을 배열할 때 라벨과 함께 배치하고, 선택 여부는 브랜드 색상으로 강조합니다.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-md border border-muted-foreground/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="checkbox-usage-remember"
                        checked={isChecked}
                        onCheckedChange={(checked) => setIsChecked(checked === true)}
                      />
                      <Label htmlFor="checkbox-usage-remember">시뮬레이션 설정 기억하기</Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Checked: {isChecked ? 'true' : 'false'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-muted-foreground/30 bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Checkbox
                        id="checkbox-usage-disabled"
                        checked={isCheckedDisabled}
                        onCheckedChange={(checked) => setIsCheckedDisabled(checked === true)}
                        disabled
                      />
                      <Label htmlFor="checkbox-usage-disabled" className="text-muted-foreground">
                        운영 정책으로 고정
                      </Label>
                    </div>
                    <span className="text-xs text-muted-foreground">Disabled checked state</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Selector Components Tab */}
          <TabsContent value="selectors" className="mt-8 space-y-12">
            <div>
              <h2 className="mb-8 text-lg font-semibold">Selector Components</h2>

              {/* Combobox States */}
              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium">Combobox States</h3>
                <div>
                  <h4 className="mb-3 text-xs font-normal text-default-500">Normal State</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Framework</Label>
                      <FrameworkCombobox />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <LanguageCombobox />
                    </div>
                    <div className="space-y-2">
                      <Label>Disabled</Label>
                      <Button variant="outline" disabled>
                        Select option...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combobox Variant */}
              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium">Combobox Variant</h3>
                <div className="max-w-xs">
                  <div className="space-y-2">
                    <Label>Brand Style</Label>
                    <BrandCombobox />
                  </div>
                </div>
              </div>

              {/* Combobox Size */}
              <div>
                <h3 className="mb-4 text-lg font-medium">Combobox Size</h3>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs font-normal text-default-500">sm:</span>
                  <SmallCombobox />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Chart Components Tab */}
          <TabsContent value="charts" className="mt-8 space-y-12">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Chart Components</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                `src/components/charts` 폴더에서 사용하는 시각화 컴포넌트들을 샘플 데이터와 함께 확인할 수 있습니다.
              </p>

              <div className="space-y-12">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">TheHistogramChart</h3>
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <TheHistogramChart chartData={histogramShowcaseData} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">BarChart</h3>
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                      <div className="h-[320px] w-full">
                        <BarChart
                          chartData={barChartShowcaseData}
                          chartLayout={barChartShowcaseLayout}
                          config={baseChartConfig}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base font-medium">LineChart</h3>
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                      <div className="h-[320px] w-full">
                        <LineChart
                          chartData={lineChartShowcaseData}
                          chartLayout={lineChartShowcaseLayout}
                          config={baseChartConfig}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-medium">SankeyChart</h3>
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="h-[360px] w-full">
                      <SankeyChart
                        chartData={sankeyChartShowcaseData}
                        chartLayout={sankeyChartShowcaseLayout}
                        config={baseChartConfig}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </>
  );
}
