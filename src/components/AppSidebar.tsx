'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Home,
  Layers,
  LogOut,
  PanelLeftDashed,
  Settings,
  UserPen,
} from 'lucide-react';
import { signOutAction } from '@/actions/auth';
import { useUser } from '@/queries/userQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

// 📋 Menu data structure - Section-based grouping
const menuSections = [
  {
    title: 'Main',
    items: [
      {
        href: '/home',
        icon: Home,
        label: 'Home',
      },
      {
        href: '/simulation',
        icon: BarChart3,
        label: 'Simulation',
      },
    ],
  },
  {
    title: 'Development',
    items: [
      {
        href: '/components',
        icon: Layers,
        label: 'Components',
      },
    ],
  },
];

// Component for menu items that uses usePathname
function MenuItems({ section, isCollapsed }: { section: (typeof menuSections)[0]; isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {section.items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Button
            key={item.href}
            variant="ghost"
            asChild
            className={cn(
              'h-10 w-full justify-start text-sm font-medium text-default-900 hover:bg-primary-50 hover:text-primary-900',
              isActive && 'bg-primary-50 text-primary-900',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Link href={item.href}>
              <Icon className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          </Button>
        );
      })}
    </>
  );
}

function AppSidebar() {
  const { data: userInfo } = useUser();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // 🎯 shadcn 기반 상태 관리 - 초기값은 false로 설정 (hydration 문제 방지)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 클라이언트 사이드에서만 localStorage 읽기
  useEffect(() => {
    if (!isInitialized) {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // localStorage에 상태 저장 (초기 로드 이후에만)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
    }
  }, [isCollapsed, isInitialized]);

  const handleSignOut = () => {
    // 로그아웃 시 모든 쿼리 캐시 제거 (다음 로그인 시 깨끗한 상태)
    queryClient.clear();
    
    startTransition(() => {
      signOutAction();
    });
  };

  // 🎯 Role 기반 메뉴 필터링 및 환경별 메뉴 필터링
  const filteredMenuSections = menuSections.map((section) => {
    if (section.title === 'Main') {
      // viewer role인 경우 Simulation 메뉴 아이템 제거
      const filteredItems = section.items.filter((item) => {
        if (item.href === '/simulation') {
          // operator 또는 admin만 Simulation 메뉴 표시
          return userInfo?.role === 'operator' || userInfo?.role === 'admin';
        }
        return true;
      });
      return { ...section, items: filteredItems };
    }
    
    if (section.title === 'Development') {
      // 🎯 Development 섹션은 개발 환경에서만 표시
      const filteredItems = section.items.filter((item) => {
        if (item.href === '/components') {
          // 개발 환경에서만 Components 메뉴 표시
          return process.env.NODE_ENV === 'development';
        }
        return true;
      });
      return { ...section, items: filteredItems };
    }
    
    return section;
  });

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* 🎯 Header with Logo */}
      <div className="flex h-16 items-center px-4">
        <Link
          href="/home"
          className="flex w-full items-center justify-center transition-all"
        >
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/BI_symbol.svg"
              alt="Flexa"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div
              className={cn(
                'transition-all duration-300 overflow-hidden',
                isCollapsed ? 'w-0 opacity-0' : 'w-[96px] opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/BI_lettering.svg"
                alt="Flexa lettering"
                width={96}
                height={24}
              />
            </div>
          </div>
        </Link>
      </div>

      {/* 🎯 Navigation Menu - Section-based grouping */}
      <nav className="flex-1 space-y-6 p-4">
        {filteredMenuSections.map((section, index) => {
          // 빈 섹션은 렌더링하지 않음
          if (section.items.length === 0) {
            return null;
          }

          return (
            <div key={section.title} className={cn('space-y-2', index > 0 && 'pt-12')}>
              {/* Section title */}
              {!isCollapsed && (
                <div className="mb-3">
                  <h3 className="px-2 text-xs font-normal uppercase tracking-wide text-default-500">{section.title}</h3>
                  <div className="mt-2 h-px bg-border opacity-50" />
                </div>
              )}

              {/* Section divider for collapsed state */}
              {isCollapsed && <div className="mb-3 h-px bg-border opacity-30" />}

              {/* Section menu items */}
              <div className="space-y-1">
                <Suspense
                  fallback={section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        asChild
                        className={cn(
                          'h-10 w-full justify-start text-sm font-medium text-default-900 hover:bg-primary-50 hover:text-primary-900',
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className="h-5 w-5" />
                          {!isCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
                        </Link>
                      </Button>
                    );
                  })}
                >
                  <MenuItems section={section} isCollapsed={isCollapsed} />
                </Suspense>
              </div>
            </div>
          );
        })}
      </nav>

      {/* 🎯 Profile Dropdown with shadcn DropdownMenu */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'h-10 w-full justify-start text-sm font-medium text-default-900 transition-all duration-200 hover:bg-primary-50 hover:text-primary-900',
                isCollapsed ? 'justify-center px-1' : 'px-3'
              )}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-900 text-white shadow-sm transition-all duration-200">
                <UserPen className="h-3 w-3" />
              </div>
              {!isCollapsed && (
                <div className="ml-3 min-w-0 text-left">
                  <div className="truncate text-sm font-semibold text-default-900">
                    {userInfo?.email || 'user@example.com'}
                  </div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" side="right" className="w-52">
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isPending}
              className="text-sm font-normal text-default-900 hover:text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? 'Signing out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 🎯 Sidebar Toggle Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'h-10 w-full justify-start text-sm font-medium text-default-900 hover:bg-primary-50 hover:text-primary-900',
            isCollapsed && 'justify-center'
          )}
        >
          <PanelLeftDashed className={cn('h-5 w-5 transition-transform duration-200', isCollapsed && 'rotate-180')} />
          {!isCollapsed && <span className="ml-3 font-medium">{isCollapsed ? 'Expand' : 'Collapse'}</span>}
        </Button>
      </div>
    </aside>
  );
}

export default AppSidebar;
