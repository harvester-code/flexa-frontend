import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContentsHeaderProps {
  text: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function ContentsHeader({ text, breadcrumbs }: ContentsHeaderProps) {
  // If breadcrumbs are not provided, create a default one with Home and current page
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/home' },
    { label: text },
  ];

  const items = breadcrumbs || defaultBreadcrumbs;

  return (
    <div className="border-b border-input">
      <div className="mx-auto max-w-page px-page-x py-6">
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
      </div>
    </div>
  );
}
