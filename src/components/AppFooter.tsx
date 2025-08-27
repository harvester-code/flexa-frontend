import React from 'react';
import Link from 'next/link';

const AppFooter: React.FC = () => (
  <footer className="bg-muted px-12 text-center">
    <div className="mx-auto max-w-[1340px]">
      <div className="flex items-center justify-center py-2">
        <nav className="flex gap-6 text-sm font-medium">
          <Link className="text-xs font-normal text-default-500 transition-colors hover:text-default-900" href="#">
            Contact
          </Link>
          <Link className="text-xs font-normal text-default-500 transition-colors hover:text-default-900" href="#">
            Support
          </Link>
          <Link className="text-xs font-normal text-default-500 transition-colors hover:text-default-900" href="#">
            Terms
          </Link>
          <Link className="text-xs font-normal text-default-500 transition-colors hover:text-default-900" href="#">
            Privacy
          </Link>
          <Link className="text-xs font-normal text-default-500 transition-colors hover:text-default-900" href="#">
            Cookies
          </Link>
        </nav>
      </div>
    </div>
  </footer>
);

export default AppFooter;
