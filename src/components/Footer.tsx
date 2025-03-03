import Link from 'next/link';
import React from 'react';

const FooterComponent: React.FC = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-left">
        <span className="logo">
          <Link href="/">
            <img src="/image/img-logo-nav.svg" alt="Flexa" width={60} height={60} />
          </Link>
        </span>
        <nav>
          <Link href="#" className="text-md">
            Contact
          </Link>
          <Link href="#" className="text-md">
            Support
          </Link>
        </nav>
      </div>
      <div className="footer-right">
        <nav>
          <Link href="#" className="text-md">
            Terms
          </Link>
          <Link href="#" className="text-md">
            Privacy
          </Link>
          <Link href="#" className="text-md">
            Cookies
          </Link>
        </nav>
      </div>
    </div>
    <div className="footer-bottom text-sm">
      <p>© 2024 Flexa. All rights reserved.</p>
    </div>
  </footer>
);

export default FooterComponent;
