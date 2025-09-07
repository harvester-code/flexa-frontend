'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Save } from 'lucide-react';
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
    <div>
      <TheContentHeader text={breadcrumb[0]?.text || 'Components'} />

      <div className="container mx-auto max-w-page px-page-x pb-page-b pt-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-lg font-semibold">UI Components Library</h1>
          <p className="text-muted-foreground">개발할 때 참고할 수 있는 모든 UI 컴포넌트들을 한 곳에서 확인하세요</p>
        </div>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="selectors">Selectors</TabsTrigger>
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

              {/* Checkbox */}
              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium">Checkbox</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-xs font-normal text-default-500">Normal State</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="checkbox1"
                          checked={isChecked}
                          onCheckedChange={(checked) => setIsChecked(checked === true)}
                        />
                        <Label htmlFor="checkbox1">Accept terms and conditions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="checkbox2" />
                        <Label htmlFor="checkbox2">Subscribe to newsletter</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="checkbox3" defaultChecked />
                        <Label htmlFor="checkbox3">Remember my preferences</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-normal text-default-500">Disabled State</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="checkbox4" disabled />
                        <Label htmlFor="checkbox4" className="text-muted-foreground">
                          Disabled unchecked
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="checkbox5"
                          checked={isCheckedDisabled}
                          onCheckedChange={(checked) => setIsCheckedDisabled(checked === true)}
                          disabled
                        />
                        <Label htmlFor="checkbox5" className="text-muted-foreground">
                          Disabled checked
                        </Label>
                      </div>
                    </div>
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
        </Tabs>
      </div>
    </div>
  );
}
