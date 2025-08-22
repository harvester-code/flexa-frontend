'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { faAngleDown, faAngleRight, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signOutAction } from '@/actions/auth';
import { useUser } from '@/queries/userQueries';
import { NavIcon01, NavIcon02, NavIcon04, NavIcon06 } from '@/components/icons';
import { Button } from '@/components/ui/Button';

function AppSidebar() {
  const pathname = usePathname();

  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);

  const { data: userInfo } = useUser();

  // TODO: 네비게이션 메뉴 map으로 만들기
  return (
    <div
      id="navigation"
      className={isHovered ? '' : 'default'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsOpen(false);
        setIsMyMenuOpen(false);
      }}
    >
      <h1>
        <Link href="/home">
          <Image priority src="/image/img-logo-nav.svg" alt="flexa" width={100} height={100} />
        </Link>
      </h1>

      <ul className="gnb-list mt-12">
        <li className={pathname === '/home' ? 'active' : ''}>
          <Link href="/home">
            <NavIcon01 />
            <span className="text">Home</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>

        {/* <li className={pathname === '/facility' ? 'active' : ''}>
          <Link href="/facility">
            <NavIcon02 />
            <span className="text">Detailed Facilities</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li> */}

        <li className={pathname === '/simulation' ? 'active' : ''}>
          <Link href="/simulation">
            <NavIcon04 />
            <span className="text">Simulation</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
      </ul>

      <hr />

      {/* <ul className="gnb-list">
        <li className={`settings ${isOpen ? 'active' : ''}`}>
          <a onClick={() => setIsOpen((prev) => !prev)}>
            <NavIcon06 />
            <span className="text">Settings</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleDown} />
          </a>

          <ul className="sub-menu">
            <li>
              <a href="#">User Management</a>
            </li>
            <li>
              <a href="#">Request Management</a>
            </li>
            <li>
              <Link href="/setting/operation">Operation Settings</Link>
            </li>
          </ul>
        </li>
      </ul> */}

      <div className={`my-menu ${isMyMenuOpen ? 'active' : ''}`}>
        <button
          onClick={() => {
            setIsMyMenuOpen((prev) => !prev);
            setIsOpen(false);
          }}
        >
          <span className="profile-icon">{userInfo?.initials}</span>
          <span className="text-sm font-semibold text-tertiary">{userInfo?.fullName}</span>
          <div className="up-down-icon ml-auto">
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleUp} />
          </div>
        </button>

        <div className="my-menu-list">
          <div className="my-name">
            <div className="profile-photo">
              <span className="photo">{userInfo?.initials}</span>
              <span className="online"></span>
            </div>
            <dl>
              <dt>{userInfo?.fullName}</dt>
              <dd>{userInfo?.email}</dd>
            </dl>
          </div>

          <div className="my-menu-nav">
            <Link href="/profile">
              <Image src="/image/ico-profile-01.svg" alt="profile" width={16} height={16} />
              Profile
            </Link>
            <hr />
            <a href="#">
              <Image src="/image/ico-profile-02.svg" alt="simulation" width={16} height={16} />
              Simulation Mangement
            </a>
            <a href="#">
              <Image src="/image/ico-profile-03.svg" alt="filter" width={16} height={16} />
              Fliter Management
            </a>
            <a href="#">
              <Image src="/image/ico-profile-04.svg" alt="trash" width={16} height={16} />
              Trash Bin
            </a>
            <hr />
            <a href="#">
              <Image src="/image/ico-profile-05.svg" alt="support" width={16} height={16} />
              Support
            </a>
          </div>

          <form action={signOutAction}>
            <Button className="logout" type="submit" variant={'outline'}>
              <Image src="/image/ico-profile-06.svg" alt="logout" width={16} height={16} />
              Log out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AppSidebar;
