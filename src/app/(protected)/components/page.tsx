'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Save } from 'lucide-react';
import TheContentHeader from '@/components/TheContentHeader';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';

const breadcrumb = [{ text: 'Components', number: 1 }];

export default function ComponentsPage() {
  // DatePicker for showcase
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Combobox for showcase
  const [selectedFramework, setSelectedFramework] = useState('');
  const [openCombobox, setOpenCombobox] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [openLanguageBox, setOpenLanguageBox] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [openCountryBox, setOpenCountryBox] = useState(false);

  const [selectedCity, setSelectedCity] = useState('');
  const [openCityBox, setOpenCityBox] = useState(false);

  const frameworks = [
    { value: 'next.js', label: 'Next.js' },
    { value: 'sveltekit', label: 'SvelteKit' },
    { value: 'nuxt.js', label: 'Nuxt.js' },
    { value: 'remix', label: 'Remix' },
    { value: 'astro', label: 'Astro' },
    { value: 'gatsby', label: 'Gatsby' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'ko', label: '한국어' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
    { value: 'es', label: 'Español' },
  ];

  const countries = [
    { value: 'kr', label: '🇰🇷 South Korea' },
    { value: 'us', label: '🇺🇸 United States' },
    { value: 'jp', label: '🇯🇵 Japan' },
    { value: 'cn', label: '🇨🇳 China' },
    { value: 'gb', label: '🇬🇧 United Kingdom' },
  ];

  const cities = [
    { value: 'seoul', label: 'Seoul' },
    { value: 'tokyo', label: 'Tokyo' },
    { value: 'newyork', label: 'New York' },
    { value: 'london', label: 'London' },
    { value: 'shanghai', label: 'Shanghai' },
  ];

  // DatePicker component for showcase
  const DatePicker = () => (
    <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? dayjs(selectedDate).format('MMM DD, YYYY') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openCombobox}
          className="w-full justify-between font-normal"
        >
          {selectedFramework
            ? frameworks.find((framework) => framework.value === selectedFramework)?.label
            : 'Select framework...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
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
                    setOpenCombobox(false);
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

  const LanguageCombobox = ({
    variant = 'outline',
    size = 'default',
  }: {
    variant?: 'outline' | 'brand' | 'ghost';
    size?: 'sm' | 'default';
  }) => (
    <Popover open={openLanguageBox} onOpenChange={setOpenLanguageBox}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          role="combobox"
          aria-expanded={openLanguageBox}
          className="w-full justify-between font-normal"
        >
          {selectedLanguage ? languages.find((lang) => lang.value === selectedLanguage)?.label : 'Select language...'}
          <ChevronsUpDown className={cn('ml-2 shrink-0 opacity-50', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
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
                    setSelectedLanguage(currentValue === selectedLanguage ? '' : currentValue);
                    setOpenLanguageBox(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selectedLanguage === lang.value ? 'opacity-100' : 'opacity-0')}
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

  const CountryCombobox = ({
    variant = 'outline',
    size = 'default',
  }: {
    variant?: 'outline' | 'brand' | 'ghost';
    size?: 'sm' | 'default';
  }) => (
    <Popover open={openCountryBox} onOpenChange={setOpenCountryBox}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          role="combobox"
          aria-expanded={openCountryBox}
          className="w-full justify-between font-normal"
        >
          {selectedCountry
            ? countries.find((country) => country.value === selectedCountry)?.label
            : 'Select country...'}
          <ChevronsUpDown className={cn('ml-2 shrink-0 opacity-50', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
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
                    setSelectedCountry(currentValue === selectedCountry ? '' : currentValue);
                    setOpenCountryBox(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', selectedCountry === country.value ? 'opacity-100' : 'opacity-0')}
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

  const CityCombobox = ({ size = 'default' }: { size?: 'sm' | 'default' }) => (
    <Popover open={openCityBox} onOpenChange={setOpenCityBox}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          role="combobox"
          aria-expanded={openCityBox}
          className="max-w-xs justify-between font-normal"
        >
          {selectedCity
            ? cities.find((city) => city.value === selectedCity)?.label
            : size === 'sm'
              ? 'Small'
              : 'Default'}
          <ChevronsUpDown className={cn('ml-2 shrink-0 opacity-50', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
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
                    setSelectedCity(currentValue === selectedCity ? '' : currentValue);
                    setOpenCityBox(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedCity === city.value ? 'opacity-100' : 'opacity-0')} />
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
      <TheContentHeader breadcrumb={breadcrumb} />

      <div className="max-w-page px-page-x pb-page-b container mx-auto space-y-20 pt-12">
        <div className="text-center">
          <h1 className="mb-4 text-lg font-semibold">UI Components Library</h1>
          <p className="text-muted-foreground">개발할 때 참고할 수 있는 모든 UI 컴포넌트들을 한 곳에서 확인하세요</p>
        </div>

        {/* Button Components Showcase */}
        <div>
          <h2 className="mb-8 text-lg font-semibold">Button Components Showcase</h2>

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
          <div className="mb-12">
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

        {/* Input Components Showcase */}
        <div className="border-t pt-10">
          <h2 className="mb-8 text-lg font-semibold">Input Components Showcase</h2>

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
                <Input size="sm" placeholder="Small" className="max-w-xs" />
                <Input size="sm" placeholder="Disabled" disabled className="max-w-xs" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs font-normal text-default-500">default:</span>
                <Input size="default" placeholder="Default" className="max-w-xs" />
                <Input size="default" placeholder="Disabled" disabled className="max-w-xs" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs font-normal text-default-500">lg:</span>
                <Input size="lg" placeholder="Large" className="max-w-xs" />
                <Input size="lg" placeholder="Disabled" disabled className="max-w-xs" />
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

        {/* Combobox Showcase Section */}
        <div className="border-t pt-10">
          <h2 className="mb-8 text-lg font-semibold">Combobox Components Showcase</h2>

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
                  <Button variant="outline" disabled className="w-full justify-between font-normal">
                    Select option...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Combobox Variants */}
          <div className="mb-12">
            <h3 className="mb-4 text-lg font-medium">Combobox Variants</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Outline (Default)</Label>
                <LanguageCombobox variant="outline" />
              </div>
              <div className="space-y-2">
                <Label>Brand Style</Label>
                <CountryCombobox variant="brand" />
              </div>
              <div className="space-y-2">
                <Label>Ghost Style</Label>
                <CountryCombobox variant="ghost" />
              </div>
            </div>
          </div>

          {/* Combobox Sizes */}
          <div>
            <h3 className="mb-4 text-lg font-medium">Combobox Sizes</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs font-normal text-default-500">sm:</span>
                <CityCombobox size="sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs font-normal text-default-500">default:</span>
                <CityCombobox size="default" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
