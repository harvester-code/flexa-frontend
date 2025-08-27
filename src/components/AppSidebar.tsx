'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Home,
  Layers,
  LogOut,
  Settings,
  User,
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
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';

// 📋 메뉴 데이터 구조화 - 섹션별 그룹화
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

function AppSidebar() {
  const pathname = usePathname();
  const { data: userInfo } = useUser();

  // 🎯 shadcn 기반 상태 관리
  const [isCollapsed, setIsCollapsed] = useState(false);

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

      <Separator />

      {/* 🎯 Navigation Menu - 섹션별 그룹화 */}
      <nav className="flex-1 space-y-6 p-4">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-2">
            {/* 섹션 제목 */}
            {!isCollapsed && (
              <h3 className="mb-3 px-2 text-xs font-normal uppercase tracking-wide text-default-500">
                {section.title}
              </h3>
            )}

            {/* 섹션 메뉴 아이템들 */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    asChild
                    className={cn(
                      'h-10 w-full justify-start text-sm font-normal text-default-900 hover:bg-primary-50 hover:text-primary-900',
                      isActive && 'bg-primary-50 text-primary-900',
                      isCollapsed && 'px-2'
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span className="ml-3 font-normal">{item.label}</span>}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      {/* 🎯 Profile Dropdown with shadcn DropdownMenu */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'h-12 w-full justify-start text-sm font-normal text-default-900 hover:bg-primary-50 hover:text-primary-900',
                isCollapsed && 'px-2'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-normal text-default-900">
                {userInfo?.firstName?.[0]?.toUpperCase() || 'U'}
                {userInfo?.lastName?.[0]?.toUpperCase() || ''}
              </div>
              {!isCollapsed && (
                <div className="ml-3 text-left">
                  <div className="text-sm font-medium text-default-900">{userInfo?.fullName || 'User'}</div>
                  <div className="text-xs font-normal text-default-500">{userInfo?.email || 'user@example.com'}</div>
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
              onClick={signOutAction}
              className="text-sm font-normal text-default-900 hover:text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* 🎯 Sidebar Toggle Button */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-10 w-full text-sm font-normal text-default-900 hover:bg-primary-50 hover:text-primary-900"
        >
          {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </Button>
      </div>
    </aside>
  );
}

export default AppSidebar;
