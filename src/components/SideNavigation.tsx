'use client';

import { signOutAction } from '@/api/auth';
import { faAngleDown, faAngleRight, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useContext } from 'react';
import NavIcon01 from '@/components/icons/NavIcon01';
import NavIcon02 from '@/components/icons/NavIcon02';
import NavIcon03 from '@/components/icons/NavIcon03';
import NavIcon04 from '@/components/icons/NavIcon04';
import NavIcon05 from '@/components/icons/NavIcon05';
import NavIcon06 from '@/components/icons/NavIcon06';
import SearchIcon from '@/components/icons/search';
import { UserContext } from '@/components/providers/UserProvider';
import { Button } from '@/components/ui/button';

export default function SideNavigation() {
  const userInfo = useContext(UserContext);
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);

  return (
    <div
      id="navigation"
      className={isHovered ? '' : 'default'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsInputFocused(false);
        setIsOpen(false);
        setIsMyMenuOpen(false);
      }}
    >
      <h1>
        <Link href="/">
          <Image src="/image/img-logo-nav.svg" alt="flexa" width={100} height={100} />
        </Link>
      </h1>
      <div className={`search-box ${isInputFocused ? 'active' : ''}`}>
        <input
          type="text"
          placeholder="Search"
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        <button className="text-secondary">
          <div className="search-icon">
            <SearchIcon />
          </div>
        </button>
      </div>
      <ul className="gnb-list mt-20">
        <li className="active">
          <Link href="/">
            <NavIcon01 />
            <span className="text">Home</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
        <li>
          <Link href="/protected/facility">
            <NavIcon02 />
            <span className="text">Detailed Facilities</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
        <li>
          <Link href="/protected/passenger-flow">
            <NavIcon03 />
            <span className="text">Passenger Flow</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
        <li>
          <Link href="/protected/simulation">
            <NavIcon04 />
            <span className="text">Simulation</span>
            <FontAwesomeIcon className="nav-icon" size="sm" icon={faAngleRight} />
          </Link>
        </li>
      </ul>
      <hr />
      <ul className="gnb-list">
        <li>
          <Link href="/protected/messenger">
            <NavIcon05 />
            <span className="text">Messenger</span>
            <span className="number">959+</span>
          </Link>
        </li>
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
              <a href="#">Operation Settings</a>
            </li>
          </ul>
        </li>
      </ul>
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
            <Link href="/protected/profile">
              <img src="/image/ico-profile-01.svg" alt="profile" />
              Profile
            </Link>
            <hr />
            <a href="#">
              <img src="/image/ico-profile-02.svg" alt="simulation" />
              Simulation Mangement
            </a>
            <a href="#">
              <img src="/image/ico-profile-03.svg" alt="filter" />
              Fliter Management
            </a>
            <a href="#">
              <img src="/image/ico-profile-04.svg" alt="trash" />
              Trash Bin
            </a>
            <hr />
            <a href="#">
              <img src="/image/ico-profile-05.svg" alt="support" />
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
