'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  CreditCard,
  Home,
  Layers,
  LogOut,
  PanelLeftDashed,
  Settings,
  User,
  UserPen,
  LayoutDashboard,
} from 'lucide-react';
import { signOutAction } from '@/actions/auth';
import { useUser } from '@/queries/userQueries';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
      {
        href: '/new-home',
        icon: LayoutDashboard,
        label: 'New Home',
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
    startTransition(() => {
      signOutAction();
    });
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* 🎯 Header with Logo */}
      <div className="flex h-16 items-center px-4">
        <Link href="/home" className="flex items-center gap-3">
          {/* Flexa 원형 로고 */}
          <div className="relative h-9 w-9">
            <svg viewBox="0 0 40 40" className="h-full w-full">
              <defs>
                <linearGradient id="flexa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="20" fill="url(#flexa-gradient)" />
              <text x="20" y="28" textAnchor="middle" fontSize="20" fontWeight="bold" fill="white">
                F
              </text>
            </svg>
          </div>
          {/* Flexa 텍스트 - 축소시 숨김 */}
          {!isCollapsed && (
            <span className="bg-gradient-to-r from-primary-500 to-primary-900 bg-clip-text text-lg font-semibold text-transparent">
              Flexa
            </span>
          )}
        </Link>
      </div>

      {/* 🎯 Navigation Menu - Section-based grouping */}
      <nav className="flex-1 space-y-6 p-4">
        {menuSections.map((section, index) => (
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
        ))}
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
                <div className="ml-3 text-left">
                  <div className="text-sm font-semibold text-default-900">{userInfo?.fullName || 'User'}</div>
                  <div className="text-xs font-medium text-default-500">{userInfo?.email || 'user@example.com'}</div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" side="right" className="w-52">
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="flex items-center text-sm font-normal text-default-900 hover:text-primary-900"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="text-sm font-normal text-default-900 hover:text-primary-900">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>

            <DropdownMenuItem className="text-sm font-normal text-default-900 hover:text-primary-900">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>

            <DropdownMenuSeparator />

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
