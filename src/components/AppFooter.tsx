import React from 'react';
import Link from 'next/link';

const AppFooter: React.FC = () => (
  <footer className="border-t bg-background px-12">
    <div className="mx-auto max-w-[1340px]">
      <div className="flex items-center justify-between py-4">
        <nav className="flex gap-6 text-sm font-medium">
          <Link className="text-xs font-medium text-default-500 transition-colors hover:text-primary-900" href="#">
            Contact
          </Link>
          <Link className="text-xs font-medium text-default-500 transition-colors hover:text-primary-900" href="#">
            Support
          </Link>
          <Link className="text-xs font-medium text-default-500 transition-colors hover:text-primary-900" href="#">
            Terms
          </Link>
          <Link className="text-xs font-medium text-default-500 transition-colors hover:text-primary-900" href="#">
            Privacy
          </Link>
          <Link className="text-xs font-medium text-default-500 transition-colors hover:text-primary-900" href="#">
            Cookies
          </Link>
        </nav>

        <div className="text-xs text-default-500">© 2024 Flexa. All rights reserved.</div>
      </div>
    </div>
  </footer>
);

export default AppFooter;
