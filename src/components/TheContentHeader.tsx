import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import NotificationBell from '@/components/NotificationBell';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContentsHeaderProps {
  text: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function ContentsHeader({ text, breadcrumbs }: ContentsHeaderProps) {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Flexa', href: '/' },
    { label: text },
  ];

  const items = breadcrumbs || defaultBreadcrumbs;

  return (
    <div className="border-b border-input">
      <div className="mx-auto flex max-w-page items-center justify-between px-page-x py-6">
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < items.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <NotificationBell />
      </div>
    </div>
  );
}
