import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const AppFooter: React.FC = () => (
  <footer className="bg-default-100 px-12 text-center">
    <div className="mx-auto max-w-[1340px] px-[30px]">
      <div className="flex items-center justify-between py-[70px]">
        <div className="flex items-center gap-20">
          <Image priority src="/image/img-logo-nav.svg" alt="Flexa" width={110} height={32} />
          <nav className="flex gap-[30px] text-xl font-semibold">
            <Link className="text-default-600" href="#">
              Contact
            </Link>
            <Link className="text-default-600" href="#">
              Support
            </Link>
          </nav>
        </div>

        <div className="flex items-center">
          <nav className="flex gap-5 font-medium">
            <Link className="text-default-400 hover:text-default-800" href="#">
              Terms
            </Link>
            <Link className="text-default-400 hover:text-default-800" href="#">
              Privacy
            </Link>
            <Link className="text-default-400 hover:text-default-800" href="#">
              Cookies
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-default-200 pb-10 pt-6 font-medium text-default-400">
        <p>© 2024 Flexa. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default AppFooter;
