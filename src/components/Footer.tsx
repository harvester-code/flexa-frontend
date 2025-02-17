import Link from 'next/link';
import React from 'react';

const FooterComponent: React.FC = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-left">
        <span className="logo">
          <Link href="/">
            <img src="/image/img-logo-nav.svg" alt="Flexa" width={50} height={50} />
          </Link>
        </span>
        <nav>
          <Link href="#">Contact</Link>
          <Link href="#">Support</Link>
        </nav>
      </div>
      <div className="footer-right">
        <nav>
          <Link href="#">Terms</Link>
          <Link href="#">Privacy</Link>
          <Link href="#">Cookies</Link>
        </nav>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2024 Flexa. All rights reserved.</p>
    </div>
  </footer>
);

export default FooterComponent;
